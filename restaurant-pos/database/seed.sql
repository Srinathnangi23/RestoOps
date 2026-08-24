-- =========================================================
-- Demo seed data
-- Default users (password for both: Password123)
-- =========================================================

INSERT INTO users (name, email, password_hash, role) VALUES
('Restaurant Owner', 'admin@restaurant.com', '$2b$10$3euP5m2v9m5m1c1kQeXeXOqk8T7d8mB6C0eJb1s5m2v9m5m1c1kQe', 'ADMIN'),
('Cashier One', 'cashier@restaurant.com', '$2b$10$3euP5m2v9m5m1c1kQeXeXOqk8T7d8mB6C0eJb1s5m2v9m5m1c1kQe', 'CASHIER')
ON CONFLICT (email) DO NOTHING;
-- NOTE: password hashes above are placeholders and will be regenerated correctly
-- by backend/utils/seedUsers.js at setup time (see README). Do not rely on them directly.

INSERT INTO categories (name) VALUES
('Beverages'), ('Breakfast'), ('Meals'), ('Biryani'), ('Snacks'), ('Desserts')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, unit, cost_per_unit, min_stock_level, current_quantity) VALUES
('Milk', 'Dairy', 'litre', 60, 5, 10),
('Coffee Powder', 'Beverage Base', 'kg', 400, 0.3, 1),
('Tea Powder', 'Beverage Base', 'kg', 350, 0.3, 1),
('Sugar', 'Pantry', 'kg', 50, 0.5, 5),
('Rice', 'Grain', 'kg', 70, 5, 20),
('Chicken', 'Meat', 'kg', 250, 2, 8),
('Paneer', 'Dairy', 'kg', 300, 2, 0),
('Oil', 'Pantry', 'litre', 150, 2, 5),
('Onion', 'Vegetable', 'kg', 30, 2, 6),
('Tomato', 'Vegetable', 'kg', 35, 2, 5),
('Spices', 'Pantry', 'kg', 500, 0.5, 2),
('Curd', 'Dairy', 'kg', 70, 1, 3),
('Flour', 'Grain', 'kg', 45, 2, 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO menu_items (name, category_id, price, description, is_available) VALUES
('Coffee', (SELECT id FROM categories WHERE name='Beverages'), 30, 'Hot filter coffee', true),
('Tea', (SELECT id FROM categories WHERE name='Beverages'), 20, 'Hot tea', true),
('Cold Coffee', (SELECT id FROM categories WHERE name='Beverages'), 70, 'Chilled cold coffee', true),
('Dosa', (SELECT id FROM categories WHERE name='Breakfast'), 60, 'Crispy plain dosa', true),
('Idly', (SELECT id FROM categories WHERE name='Breakfast'), 40, 'Steamed rice cakes (2 pcs)', true),
('Vada', (SELECT id FROM categories WHERE name='Breakfast'), 30, 'Fried lentil donut (2 pcs)', true),
('Veg Meals', (SELECT id FROM categories WHERE name='Meals'), 100, 'Full veg thali', true),
('Chicken Biryani', (SELECT id FROM categories WHERE name='Biryani'), 180, 'Spiced chicken biryani', true),
('Paneer Biryani', (SELECT id FROM categories WHERE name='Biryani'), 160, 'Spiced paneer biryani', true),
('Lassi', (SELECT id FROM categories WHERE name='Desserts'), 50, 'Sweet curd lassi', true)
ON CONFLICT DO NOTHING;

-- Recipes
INSERT INTO recipes (menu_item_id) SELECT id FROM menu_items WHERE name='Coffee' ON CONFLICT DO NOTHING;
INSERT INTO recipes (menu_item_id) SELECT id FROM menu_items WHERE name='Tea' ON CONFLICT DO NOTHING;
INSERT INTO recipes (menu_item_id) SELECT id FROM menu_items WHERE name='Cold Coffee' ON CONFLICT DO NOTHING;
INSERT INTO recipes (menu_item_id) SELECT id FROM menu_items WHERE name='Chicken Biryani' ON CONFLICT DO NOTHING;
INSERT INTO recipes (menu_item_id) SELECT id FROM menu_items WHERE name='Paneer Biryani' ON CONFLICT DO NOTHING;
INSERT INTO recipes (menu_item_id) SELECT id FROM menu_items WHERE name='Lassi' ON CONFLICT DO NOTHING;

-- Coffee: Milk 100ml, Coffee Powder 10g, Sugar 5g
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
SELECT r.id, i.id, v.qty FROM recipes r
JOIN menu_items m ON r.menu_item_id = m.id AND m.name='Coffee'
JOIN (VALUES ('Milk',0.1),('Coffee Powder',0.01),('Sugar',0.005)) AS v(iname, qty) ON true
JOIN ingredients i ON i.name = v.iname
ON CONFLICT DO NOTHING;

-- Tea: Milk 80ml, Tea Powder 8g, Sugar 5g
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
SELECT r.id, i.id, v.qty FROM recipes r
JOIN menu_items m ON r.menu_item_id = m.id AND m.name='Tea'
JOIN (VALUES ('Milk',0.08),('Tea Powder',0.008),('Sugar',0.005)) AS v(iname, qty) ON true
JOIN ingredients i ON i.name = v.iname
ON CONFLICT DO NOTHING;

-- Cold Coffee: Milk 150ml, Coffee Powder 15g, Sugar 10g
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
SELECT r.id, i.id, v.qty FROM recipes r
JOIN menu_items m ON r.menu_item_id = m.id AND m.name='Cold Coffee'
JOIN (VALUES ('Milk',0.15),('Coffee Powder',0.015),('Sugar',0.01)) AS v(iname, qty) ON true
JOIN ingredients i ON i.name = v.iname
ON CONFLICT DO NOTHING;

-- Chicken Biryani: Rice 250g, Chicken 150g, Oil 30ml, Onion 50g, Spices 10g
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
SELECT r.id, i.id, v.qty FROM recipes r
JOIN menu_items m ON r.menu_item_id = m.id AND m.name='Chicken Biryani'
JOIN (VALUES ('Rice',0.25),('Chicken',0.15),('Oil',0.03),('Onion',0.05),('Spices',0.01)) AS v(iname, qty) ON true
JOIN ingredients i ON i.name = v.iname
ON CONFLICT DO NOTHING;

-- Paneer Biryani: Rice 250g, Paneer 120g, Oil 30ml, Onion 50g, Spices 10g
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
SELECT r.id, i.id, v.qty FROM recipes r
JOIN menu_items m ON r.menu_item_id = m.id AND m.name='Paneer Biryani'
JOIN (VALUES ('Rice',0.25),('Paneer',0.12),('Oil',0.03),('Onion',0.05),('Spices',0.01)) AS v(iname, qty) ON true
JOIN ingredients i ON i.name = v.iname
ON CONFLICT DO NOTHING;

-- Lassi: Curd 150g, Sugar 20g
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required)
SELECT r.id, i.id, v.qty FROM recipes r
JOIN menu_items m ON r.menu_item_id = m.id AND m.name='Lassi'
JOIN (VALUES ('Curd',0.15),('Sugar',0.02)) AS v(iname, qty) ON true
JOIN ingredients i ON i.name = v.iname
ON CONFLICT DO NOTHING;

INSERT INTO expenses (name, category, amount, expense_date, description) VALUES
('Shop Rent', 'Rent', 15000, CURRENT_DATE - INTERVAL '2 day', 'Monthly rent'),
('Electricity Bill', 'Electricity', 3200, CURRENT_DATE - INTERVAL '1 day', 'August bill'),
('Staff Salary', 'Salary', 18000, CURRENT_DATE, 'Kitchen staff salary'),
('Gas Cylinder', 'Gas', 1100, CURRENT_DATE, 'Commercial gas refill');
