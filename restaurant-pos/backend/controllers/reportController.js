const pool = require('../config/db');

function dateRange(req) {
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  const from = req.query.from || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

async function salesReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const result = await pool.query(`
      SELECT completed_at::date AS date, COUNT(*) AS orders, SUM(total) AS revenue, SUM(cogs) AS cogs
      FROM orders
      WHERE status='COMPLETED' AND completed_at::date BETWEEN $1 AND $2
      GROUP BY completed_at::date ORDER BY date
    `, [from, to]);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function profitLossReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const salesResult = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(cogs),0) AS cogs
      FROM orders WHERE status='COMPLETED' AND completed_at::date BETWEEN $1 AND $2
    `, [from, to]);
    const expenseResult = await pool.query(`
      SELECT category, COALESCE(SUM(amount),0) AS total FROM expenses
      WHERE expense_date BETWEEN $1 AND $2 GROUP BY category ORDER BY total DESC
    `, [from, to]);
    const totalExpenses = expenseResult.rows.reduce((s, r) => s + Number(r.total), 0);
    const revenue = Number(salesResult.rows[0].revenue);
    const cogs = Number(salesResult.rows[0].cogs);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    res.json({
      from, to, revenue, cogs, gross_profit: Number(grossProfit.toFixed(2)),
      expenses_by_category: expenseResult.rows,
      total_expenses: Number(totalExpenses.toFixed(2)),
      net_profit: Number(netProfit.toFixed(2)),
      is_loss: netProfit < 0,
    });
  } catch (err) { next(err); }
}

async function ingredientUsageReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const result = await pool.query(`
      SELECT i.name, i.unit, SUM(-t.quantity_change) AS quantity_used, SUM(-t.quantity_change * i.cost_per_unit) AS cost
      FROM inventory_transactions t
      JOIN ingredients i ON i.id = t.ingredient_id
      WHERE t.type='SALE' AND t.created_at::date BETWEEN $1 AND $2
      GROUP BY i.name, i.unit ORDER BY cost DESC
    `, [from, to]);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function wastageReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const result = await pool.query(`
      SELECT t.created_at, i.name, i.unit, -t.quantity_change AS quantity, t.reason
      FROM inventory_transactions t
      JOIN ingredients i ON i.id = t.ingredient_id
      WHERE t.type='WASTAGE' AND t.created_at::date BETWEEN $1 AND $2
      ORDER BY t.created_at DESC
    `, [from, to]);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function bestSellersReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const result = await pool.query(`
      SELECT oi.item_name, SUM(oi.quantity) AS total_sold, SUM(oi.line_total) AS revenue
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status='COMPLETED' AND o.completed_at::date BETWEEN $1 AND $2
      GROUP BY oi.item_name ORDER BY total_sold DESC
    `, [from, to]);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function paymentMethodsReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const result = await pool.query(`
      SELECT p.method, COUNT(*) AS count, SUM(p.paid_amount) AS total
      FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE o.status='COMPLETED' AND o.completed_at::date BETWEEN $1 AND $2
      GROUP BY p.method
    `, [from, to]);
    res.json(result.rows);
  } catch (err) { next(err); }
}

module.exports = {
  salesReport, profitLossReport, ingredientUsageReport,
  wastageReport, bestSellersReport, paymentMethodsReport,
};
