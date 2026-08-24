import { useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

const emptyForm = { name: '', category: '', unit: 'kg', cost_per_unit: '', min_stock_level: '', current_quantity: '' };

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { api.get('/ingredients').then((r) => setIngredients(r.data)); }

  function openNew() { setForm(emptyForm); setEditingId(null); setModalOpen(true); }
  function openEdit(i) {
    setForm({ name: i.name, category: i.category || '', unit: i.unit, cost_per_unit: i.cost_per_unit, min_stock_level: i.min_stock_level, current_quantity: i.current_quantity });
    setEditingId(i.id);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name || !form.unit) return setToast({ type: 'error', message: 'Name and unit are required' });
    try {
      if (editingId) {
        await api.put(`/ingredients/${editingId}`, form);
      } else {
        await api.post('/ingredients', form);
      }
      setModalOpen(false);
      load();
      setToast({ type: 'success', message: 'Ingredient saved' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Save failed' });
    }
  }

  async function remove(id) {
    if (!confirm('Delete this ingredient?')) return;
    await api.delete(`/ingredients/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Ingredients</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Add Ingredient</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Unit</th><th>Cost/Unit</th><th>Min Stock</th><th>Current Qty</th><th>Actions</th></tr></thead>
          <tbody>
            {ingredients.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.category || '—'}</td>
                <td>{i.unit}</td>
                <td>₹{Number(i.cost_per_unit).toFixed(2)}</td>
                <td>{i.min_stock_level}</td>
                <td>{i.current_quantity}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" onClick={() => openEdit(i)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => remove(i.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
            <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">kg</option><option value="g">g</option>
                <option value="litre">litre</option><option value="ml">ml</option>
                <option value="piece">piece</option>
              </select>
            </div>
            <div className="form-group"><label>Cost per Unit (₹)</label><input type="number" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} /></div>
            <div className="form-group"><label>Minimum Stock Level</label><input type="number" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })} /></div>
            {!editingId && (
              <div className="form-group"><label>Starting Quantity</label><input type="number" value={form.current_quantity} onChange={(e) => setForm({ ...form, current_quantity: e.target.value })} /></div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
