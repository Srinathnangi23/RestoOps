const pool = require('../config/db');

function stockStatus(current, min) {
  if (Number(current) <= 0) return 'OUT_OF_STOCK';
  if (Number(current) <= Number(min)) return 'LOW_STOCK';
  return 'IN_STOCK';
}

// ---- Ingredients CRUD ----
async function getIngredients(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM ingredients ORDER BY name');
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function createIngredient(req, res, next) {
  try {
    const { name, category, unit, cost_per_unit, min_stock_level, current_quantity } = req.body;
    if (!name || !unit) return res.status(400).json({ message: 'Name and unit are required' });
    const result = await pool.query(
      `INSERT INTO ingredients (name, category, unit, cost_per_unit, min_stock_level, current_quantity)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, category || null, unit, cost_per_unit || 0, min_stock_level || 0, current_quantity || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

async function updateIngredient(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, unit, cost_per_unit, min_stock_level } = req.body;
    const result = await pool.query(
      `UPDATE ingredients SET name=$1, category=$2, unit=$3, cost_per_unit=$4, min_stock_level=$5
       WHERE id=$6 RETURNING *`,
      [name, category || null, unit, cost_per_unit, min_stock_level, id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Ingredient not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

async function deleteIngredient(req, res, next) {
  try {
    await pool.query('DELETE FROM ingredients WHERE id=$1', [req.params.id]);
    res.json({ message: 'Ingredient deleted' });
  } catch (err) { next(err); }
}

// ---- Inventory dashboard ----
async function getInventory(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM ingredients ORDER BY name');
    const rows = result.rows.map((i) => ({
      ...i,
      stock_value: Number(i.current_quantity) * Number(i.cost_per_unit),
      status: stockStatus(i.current_quantity, i.min_stock_level),
    }));
    res.json(rows);
  } catch (err) { next(err); }
}

// ---- Stock purchase (adds stock, records transaction) ----
async function purchaseStock(req, res, next) {
  const client = await pool.connect();
  try {
    const { ingredient_id, quantity, purchase_price, supplier, invoice_number } = req.body;
    if (!ingredient_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'ingredient_id and a positive quantity are required' });
    }
    await client.query('BEGIN');
    const updated = await client.query(
      'UPDATE ingredients SET current_quantity = current_quantity + $1 WHERE id = $2 RETURNING *',
      [quantity, ingredient_id]
    );
    if (!updated.rows[0]) throw Object.assign(new Error('Ingredient not found'), { status: 404 });

    await client.query(
      `INSERT INTO inventory_transactions
        (ingredient_id, quantity_change, type, reason, supplier, invoice_number, purchase_price, user_id)
       VALUES ($1,$2,'PURCHASE','Stock purchase',$3,$4,$5,$6)`,
      [ingredient_id, quantity, supplier || null, invoice_number || null, purchase_price || null, req.user.id]
    );
    await client.query('COMMIT');
    res.status(201).json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ---- Manual adjustment / wastage ----
async function adjustStock(req, res, next) {
  const client = await pool.connect();
  try {
    const { ingredient_id, quantity_change, type, reason } = req.body;
    if (!ingredient_id || !quantity_change || !['ADJUSTMENT', 'WASTAGE'].includes(type)) {
      return res.status(400).json({ message: 'ingredient_id, quantity_change and a valid type are required' });
    }
    await client.query('BEGIN');
    const delta = type === 'WASTAGE' ? -Math.abs(quantity_change) : quantity_change;

    const current = await client.query('SELECT current_quantity FROM ingredients WHERE id=$1 FOR UPDATE', [ingredient_id]);
    if (!current.rows[0]) throw Object.assign(new Error('Ingredient not found'), { status: 404 });
    const newQty = Number(current.rows[0].current_quantity) + Number(delta);
    if (newQty < 0) throw Object.assign(new Error('Adjustment would result in negative stock'), { status: 400 });

    const updated = await client.query(
      'UPDATE ingredients SET current_quantity = $1 WHERE id = $2 RETURNING *',
      [newQty, ingredient_id]
    );
    await client.query(
      `INSERT INTO inventory_transactions (ingredient_id, quantity_change, type, reason, user_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [ingredient_id, delta, type, reason || null, req.user.id]
    );
    await client.query('COMMIT');
    res.status(201).json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getTransactions(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT t.*, i.name AS ingredient_name, i.unit, u.name AS user_name
      FROM inventory_transactions t
      JOIN ingredients i ON i.id = t.ingredient_id
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC
      LIMIT 500
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
}

module.exports = {
  getIngredients, createIngredient, updateIngredient, deleteIngredient,
  getInventory, purchaseStock, adjustStock, getTransactions,
};
