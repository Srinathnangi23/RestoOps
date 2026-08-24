const pool = require('../config/db');

// Returns each menu item's recipe with ingredients + a live-calculated cost/margin
async function getRecipes(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT m.id AS menu_item_id, m.name AS menu_item_name, m.price,
             r.id AS recipe_id,
             json_agg(
               json_build_object(
                 'ingredient_id', i.id,
                 'ingredient_name', i.name,
                 'unit', i.unit,
                 'quantity_required', ri.quantity_required,
                 'cost_per_unit', i.cost_per_unit,
                 'line_cost', ROUND((ri.quantity_required * i.cost_per_unit)::numeric, 2)
               ) ORDER BY i.name
             ) FILTER (WHERE i.id IS NOT NULL) AS ingredients
      FROM menu_items m
      JOIN recipes r ON r.menu_item_id = m.id
      LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      LEFT JOIN ingredients i ON i.id = ri.ingredient_id
      GROUP BY m.id, r.id
      ORDER BY m.name
    `);
    const rows = result.rows.map((row) => {
      const ingredientCost = (row.ingredients || []).reduce((sum, x) => sum + Number(x.line_cost), 0);
      const grossProfit = Number(row.price) - ingredientCost;
      const margin = Number(row.price) > 0 ? (grossProfit / Number(row.price)) * 100 : 0;
      return {
        ...row,
        ingredients: row.ingredients || [],
        ingredient_cost: Number(ingredientCost.toFixed(2)),
        gross_profit: Number(grossProfit.toFixed(2)),
        margin_percent: Number(margin.toFixed(2)),
      };
    });
    res.json(rows);
  } catch (err) { next(err); }
}

async function createOrUpdateRecipe(req, res, next) {
  const client = await pool.connect();
  try {
    const { menu_item_id, ingredients } = req.body; // ingredients: [{ingredient_id, quantity_required}]
    if (!menu_item_id || !Array.isArray(ingredients)) {
      return res.status(400).json({ message: 'menu_item_id and ingredients[] are required' });
    }
    await client.query('BEGIN');
    let recipeResult = await client.query('SELECT id FROM recipes WHERE menu_item_id=$1', [menu_item_id]);
    let recipeId;
    if (recipeResult.rows[0]) {
      recipeId = recipeResult.rows[0].id;
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id=$1', [recipeId]);
    } else {
      const created = await client.query('INSERT INTO recipes (menu_item_id) VALUES ($1) RETURNING id', [menu_item_id]);
      recipeId = created.rows[0].id;
    }
    for (const ing of ingredients) {
      if (!ing.ingredient_id || !ing.quantity_required || ing.quantity_required <= 0) continue;
      await client.query(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required) VALUES ($1,$2,$3)',
        [recipeId, ing.ingredient_id, ing.quantity_required]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ recipe_id: recipeId, menu_item_id, message: 'Recipe saved' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function deleteRecipe(req, res, next) {
  try {
    await pool.query('DELETE FROM recipes WHERE menu_item_id=$1', [req.params.menuItemId]);
    res.json({ message: 'Recipe deleted' });
  } catch (err) { next(err); }
}

module.exports = { getRecipes, createOrUpdateRecipe, deleteRecipe };
