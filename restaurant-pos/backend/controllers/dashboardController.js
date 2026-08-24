const pool = require('../config/db');

async function getDashboard(req, res, next) {
  try {
    // Today's completed-order aggregates
    const salesResult = await pool.query(`
      SELECT
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(SUM(cogs), 0) AS cogs,
        COUNT(*) AS order_count
      FROM orders
      WHERE status = 'COMPLETED' AND completed_at::date = CURRENT_DATE
    `);
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS expenses FROM expenses WHERE expense_date = CURRENT_DATE`
    );

    const revenue = Number(salesResult.rows[0].revenue);
    const cogs = Number(salesResult.rows[0].cogs);
    const orderCount = Number(salesResult.rows[0].order_count);
    const expenses = Number(expenseResult.rows[0].expenses);
    const grossProfit = Number((revenue - cogs).toFixed(2));
    const netProfit = Number((grossProfit - expenses).toFixed(2));

    // Low stock / out of stock
    const stockResult = await pool.query(`
      SELECT name, current_quantity, unit, min_stock_level
      FROM ingredients
      WHERE current_quantity <= min_stock_level
      ORDER BY current_quantity ASC
    `);
    const lowStock = stockResult.rows.filter((r) => Number(r.current_quantity) > 0);
    const outOfStock = stockResult.rows.filter((r) => Number(r.current_quantity) <= 0);

    // Top selling items (last 30 days)
    const topSelling = await pool.query(`
      SELECT oi.item_name, SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'COMPLETED' AND o.completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY oi.item_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // 7-day trend for charts
    const trend = await pool.query(`
      SELECT d::date AS date,
        COALESCE(o.revenue, 0) AS revenue,
        COALESCE(o.cogs, 0) AS cogs,
        COALESCE(e.expenses, 0) AS expenses,
        COALESCE(o.orders, 0) AS orders
      FROM generate_series(CURRENT_DATE - INTERVAL '6 day', CURRENT_DATE, INTERVAL '1 day') d
      LEFT JOIN (
        SELECT completed_at::date AS d, SUM(total) AS revenue, SUM(cogs) AS cogs, COUNT(*) AS orders
        FROM orders WHERE status='COMPLETED' GROUP BY completed_at::date
      ) o ON o.d = d::date
      LEFT JOIN (
        SELECT expense_date AS d, SUM(amount) AS expenses FROM expenses GROUP BY expense_date
      ) e ON e.d = d::date
      ORDER BY d
    `);

    res.json({
      today: {
        revenue, orders: orderCount, expenses, ingredient_cost: cogs,
        gross_profit: grossProfit, net_profit: netProfit,
      },
      low_stock: lowStock,
      out_of_stock: outOfStock,
      top_selling: topSelling.rows,
      trend: trend.rows,
    });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };
