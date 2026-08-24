const pool = require('../config/db');

async function getExpenses(req, res, next) {
  try {
    const { from, to, category } = req.query;
    const clauses = [];
    const params = [];
    if (from) { params.push(from); clauses.push(`expense_date >= $${params.length}`); }
    if (to) { params.push(to); clauses.push(`expense_date <= $${params.length}`); }
    if (category) { params.push(category); clauses.push(`category = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await pool.query(`SELECT * FROM expenses ${where} ORDER BY expense_date DESC, id DESC`, params);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function createExpense(req, res, next) {
  try {
    const { name, category, amount, expense_date, description } = req.body;
    if (!name || !category || amount === undefined) {
      return res.status(400).json({ message: 'name, category and amount are required' });
    }
    const result = await pool.query(
      `INSERT INTO expenses (name, category, amount, expense_date, description, created_by)
       VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5,$6) RETURNING *`,
      [name, category, amount, expense_date || null, description || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, amount, expense_date, description } = req.body;
    const result = await pool.query(
      `UPDATE expenses SET name=$1, category=$2, amount=$3, expense_date=$4, description=$5 WHERE id=$6 RETURNING *`,
      [name, category, amount, expense_date, description || null, id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

async function deleteExpense(req, res, next) {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) { next(err); }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
