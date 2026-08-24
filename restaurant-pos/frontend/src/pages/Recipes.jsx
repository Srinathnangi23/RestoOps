import { useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [rows, setRows] = useState([{ ingredient_id: '', quantity_required: '' }]);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadAll(); }, []);

  function loadAll() {
    api.get('/recipes').then((r) => setRecipes(r.data));
    api.get('/menu').then((r) => setMenuItems(r.data));
    api.get('/ingredients').then((r) => setIngredients(r.data));
  }

  function openEditor(recipe) {
    if (recipe) {
      setSelectedMenuItem(recipe.menu_item_id);
      setRows(recipe.ingredients.length
        ? recipe.ingredients.map((i) => ({ ingredient_id: i.ingredient_id, quantity_required: i.quantity_required }))
        : [{ ingredient_id: '', quantity_required: '' }]);
    } else {
      setSelectedMenuItem('');
      setRows([{ ingredient_id: '', quantity_required: '' }]);
    }
    setModalOpen(true);
  }

  function addRow() { setRows([...rows, { ingredient_id: '', quantity_required: '' }]); }
  function updateRow(idx, field, value) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function removeRow(idx) { setRows(rows.filter((_, i) => i !== idx)); }

  async function save() {
    if (!selectedMenuItem) return setToast({ type: 'error', message: 'Select a menu item' });
    const validRows = rows.filter((r) => r.ingredient_id && r.quantity_required);
    if (validRows.length === 0) return setToast({ type: 'error', message: 'Add at least one ingredient' });
    try {
      await api.post('/recipes', {
        menu_item_id: Number(selectedMenuItem),
        ingredients: validRows.map((r) => ({ ingredient_id: Number(r.ingredient_id), quantity_required: Number(r.quantity_required) })),
      });
      setModalOpen(false);
      loadAll();
      setToast({ type: 'success', message: 'Recipe saved' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Save failed' });
    }
  }

  const menuItemsWithoutRecipe = menuItems.filter((m) => !recipes.some((r) => r.menu_item_id === m.id));

  return (
    <div>
      <div className="toolbar">
        <h2>Recipe Management</h2>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>+ New Recipe</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {recipes.map((r) => (
          <div className="card" key={r.menu_item_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{r.menu_item_name}</strong>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Selling Price: ₹{Number(r.price).toFixed(0)}</div>
              </div>
              <button className="btn btn-outline" onClick={() => openEditor(r)}>Edit</button>
            </div>
            <table style={{ marginTop: 10 }}>
              <thead><tr><th>Ingredient</th><th>Qty</th><th>Cost</th></tr></thead>
              <tbody>
                {r.ingredients.map((i) => (
                  <tr key={i.ingredient_id}>
                    <td>{i.ingredient_name}</td>
                    <td>{i.quantity_required} {i.unit}</td>
                    <td>₹{i.line_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <div>Ingredient Cost: ₹{r.ingredient_cost}</div>
              <div>Gross Profit: ₹{r.gross_profit}</div>
              <div>Margin: {r.margin_percent}%</div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 480 }}>
            <h3 style={{ marginTop: 0 }}>Recipe Editor</h3>
            <div className="form-group">
              <label>Menu Item</label>
              <select value={selectedMenuItem} onChange={(e) => setSelectedMenuItem(e.target.value)}>
                <option value="">Select item</option>
                {menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {rows.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select style={{ flex: 2 }} value={row.ingredient_id} onChange={(e) => updateRow(idx, 'ingredient_id', e.target.value)}>
                  <option value="">Ingredient</option>
                  {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
                <input style={{ flex: 1 }} type="number" placeholder="Qty" value={row.quantity_required} onChange={(e) => updateRow(idx, 'quantity_required', e.target.value)} />
                <button className="btn btn-outline" onClick={() => removeRow(idx)}>✕</button>
              </div>
            ))}
            <button className="btn btn-outline" onClick={addRow}>+ Add Ingredient</button>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Save Recipe</button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
