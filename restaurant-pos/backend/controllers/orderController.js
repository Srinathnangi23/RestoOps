const pool = require('../config/db');

const TAX_RATE = 0.05; // 5% - adjust as needed

function computeTotals(items, discount = 0) {
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal - discount + tax).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), tax, total };
}

async function generateBillNo(client) {
  const result = await client.query("SELECT nextval(pg_get_serial_sequence('orders','id')) AS n");
  const n = result.rows[0].n;
  return `INV-${String(n).padStart(5, '0')}`;
}

// Create a PENDING/HOLD order (cart -> saved order, no inventory impact yet)
async function createOrder(req, res, next) {
  const client = await pool.connect();
  try {
    const { items, order_type, table_number, discount, status } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    await client.query('BEGIN');

    const menuIds = items.map((i) => i.menu_item_id);
    const menuResult = await client.query('SELECT * FROM menu_items WHERE id = ANY($1)', [menuIds]);
    const menuMap = Object.fromEntries(menuResult.rows.map((m) => [m.id, m]));

    const orderItems = items.map((it) => {
      const menuItem = menuMap[it.menu_item_id];
      if (!menuItem) throw Object.assign(new Error(`Menu item ${it.menu_item_id} not found`), { status: 404 });
      return {
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: it.quantity,
        unit_price: Number(menuItem.price),
      };
    });

    const { subtotal, tax, total } = computeTotals(orderItems, discount || 0);
    const billNo = await generateBillNo(client);

    const orderResult = await client.query(
      `INSERT INTO orders (bill_no, cashier_id, order_type, status, subtotal, discount, tax, total, table_number, special_instruction)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [billNo, req.user.id, order_type || 'TAKEAWAY', status || 'PENDING', subtotal, discount || 0, tax, total, table_number || null, req.body.special_instruction || null]
    );
    const order = orderResult.rows[0];

    for (const it of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, it.menu_item_id, it.item_name, it.quantity, it.unit_price, it.quantity * it.unit_price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...order, items: orderItems });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// The critical flow: validate stock -> deduct inventory -> record payment -> mark COMPLETED
// All inside a single DB transaction. Any failure rolls everything back.
async function checkoutOrder(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { payment_method, amount_received } = req.body;
    if (!['CASH', 'UPI', 'CARD'].includes(payment_method)) {
      return res.status(400).json({ message: 'Valid payment_method is required' });
    }

    await client.query('BEGIN');

    const orderResult = await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [id]);
    const order = orderResult.rows[0];
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.status === 'COMPLETED') throw Object.assign(new Error('Order already completed'), { status: 400 });

    const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id=$1', [id]);
    const orderItems = itemsResult.rows;

    // 1. Compute required ingredient totals across the whole order
    const requiredMap = new Map(); // ingredient_id -> total qty required
    const recipeCache = new Map(); // menu_item_id -> [{ingredient_id, quantity_required, cost_per_unit, unit}]

    for (const item of orderItems) {
      if (!recipeCache.has(item.menu_item_id)) {
        const riResult = await client.query(
          `SELECT ri.ingredient_id, ri.quantity_required, i.cost_per_unit, i.unit, i.name, i.current_quantity
           FROM recipes r
           JOIN recipe_ingredients ri ON ri.recipe_id = r.id
           JOIN ingredients i ON i.id = ri.ingredient_id
           WHERE r.menu_item_id = $1
           FOR UPDATE OF i`,
          [item.menu_item_id]
        );
        recipeCache.set(item.menu_item_id, riResult.rows);
      }
      const recipeRows = recipeCache.get(item.menu_item_id);
      for (const ri of recipeRows) {
        const need = Number(ri.quantity_required) * item.quantity;
        requiredMap.set(ri.ingredient_id, (requiredMap.get(ri.ingredient_id) || 0) + need);
      }
    }

    // 2. Validate stock — never allow negative inventory
    const ingredientInfo = new Map();
    for (const rows of recipeCache.values()) {
      for (const ri of rows) ingredientInfo.set(ri.ingredient_id, ri);
    }
    for (const [ingredientId, needed] of requiredMap.entries()) {
      const info = ingredientInfo.get(ingredientId);
      if (Number(info.current_quantity) < needed) {
        throw Object.assign(
          new Error(`Insufficient stock: ${info.name} (need ${needed}${info.unit}, have ${info.current_quantity}${info.unit})`),
          { status: 400 }
        );
      }
    }

    // 3. Deduct inventory + record transactions + compute ingredient cost per order item
    let totalCogs = 0;
    for (const item of orderItems) {
      const recipeRows = recipeCache.get(item.menu_item_id) || [];
      let itemIngredientCost = 0;
      for (const ri of recipeRows) {
        const qtyUsed = Number(ri.quantity_required) * item.quantity;
        const lineCost = qtyUsed * Number(ri.cost_per_unit);
        itemIngredientCost += lineCost;

        await client.query(
          'UPDATE ingredients SET current_quantity = current_quantity - $1 WHERE id = $2',
          [qtyUsed, ri.ingredient_id]
        );
        await client.query(
          `INSERT INTO inventory_transactions (ingredient_id, quantity_change, type, reason, reference_order_id, user_id)
           VALUES ($1,$2,'SALE','Order checkout',$3,$4)`,
          [ri.ingredient_id, -qtyUsed, order.id, req.user.id]
        );
      }
      totalCogs += itemIngredientCost;
      await client.query('UPDATE order_items SET ingredient_cost=$1 WHERE id=$2', [itemIngredientCost.toFixed(2), item.id]);
    }

    // 4. Record payment
    let changeReturned = null;
    if (payment_method === 'CASH') {
      if (amount_received === undefined || Number(amount_received) < Number(order.total)) {
        throw Object.assign(new Error('Cash received is less than total due'), { status: 400 });
      }
      changeReturned = Number((Number(amount_received) - Number(order.total)).toFixed(2));
    }
    await client.query(
      `INSERT INTO payments (order_id, method, amount_received, change_returned, paid_amount)
       VALUES ($1,$2,$3,$4,$5)`,
      [order.id, payment_method, amount_received || order.total, changeReturned, order.total]
    );

    // 5. Mark order completed with COGS
    const updatedOrder = await client.query(
      `UPDATE orders SET status='COMPLETED', cogs=$1, completed_at=NOW() WHERE id=$2 RETURNING *`,
      [totalCogs.toFixed(2), order.id]
    );

    await client.query('COMMIT');
    res.json({
      order: updatedOrder.rows[0],
      change_returned: changeReturned,
      message: 'Order completed successfully',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getOrders(req, res, next) {
  try {
    const { status, from, to } = req.query;
    const clauses = [];
    const params = [];
    if (status) { params.push(status); clauses.push(`o.status = $${params.length}`); }
    if (from) { params.push(from); clauses.push(`o.created_at >= $${params.length}`); }
    if (to) { params.push(to); clauses.push(`o.created_at <= $${params.length}`); }
    // Cashiers only see their own recent orders per spec ("limited order history")
    if (req.user.role === 'CASHIER') {
      params.push(req.user.id);
      clauses.push(`o.cashier_id = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT o.*, u.name AS cashier_name FROM orders o
       LEFT JOIN users u ON u.id = o.cashier_id
       ${where} ORDER BY o.created_at DESC LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!orderResult.rows[0]) return res.status(404).json({ message: 'Order not found' });
    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]);
    const paymentResult = await pool.query('SELECT * FROM payments WHERE order_id=$1', [req.params.id]);
    res.json({ ...orderResult.rows[0], items: itemsResult.rows, payment: paymentResult.rows[0] || null });
  } catch (err) { next(err); }
}

module.exports = { createOrder, checkoutOrder, getOrders, getOrderById };
