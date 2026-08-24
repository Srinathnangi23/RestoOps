const pool = require('../config/db');

// ---- Categories ----
async function getCategories(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });
    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query('UPDATE categories SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

async function deleteCategory(req, res, next) {
  try {
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
}

// ---- Menu items ----
// A menu item is available only if marked available AND every recipe ingredient is in stock.
async function getMenuItems(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT m.*, c.name AS category_name,
        CASE WHEN m.is_available = FALSE THEN FALSE
             WHEN r.id IS NULL THEN TRUE
             ELSE COALESCE(bool_and(i.current_quantity >= ri.quantity_required), TRUE)
        END AS in_stock
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN recipes r ON r.menu_item_id = m.id
      LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      LEFT JOIN ingredients i ON i.id = ri.ingredient_id
      GROUP BY m.id, c.name, r.id
      ORDER BY m.name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function createMenuItem(req, res, next) {
  try {
    const { name, category_id, price, image_url, description, is_available } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required' });
    const result = await pool.query(
      `INSERT INTO menu_items (name, category_id, price, image_url, description, is_available)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6, TRUE)) RETURNING *`,
      [name, category_id || null, price, image_url || null, description || null, is_available]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

async function updateMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category_id, price, image_url, description, is_available } = req.body;
    const result = await pool.query(
      `UPDATE menu_items SET name=$1, category_id=$2, price=$3, image_url=$4, description=$5, is_available=$6
       WHERE id=$7 RETURNING *`,
      [name, category_id || null, price, image_url || null, description || null, is_available, id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Menu item not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

async function deleteMenuItem(req, res, next) {
  try {
    await pool.query('DELETE FROM menu_items WHERE id=$1', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (err) { next(err); }
}

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
};
