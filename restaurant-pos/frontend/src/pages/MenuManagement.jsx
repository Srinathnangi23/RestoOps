import { useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

const emptyForm = { name: '', category_id: '', price: '', description: '', is_available: true };

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); loadCategories(); }, []);

  function load() { api.get('/menu').then((r) => setItems(r.data)); }
  function loadCategories() { api.get('/categories').then((r) => setCategories(r.data)); }

  function openNew() { setForm(emptyForm); setEditingId(null); setModalOpen(true); }
  function openEdit(item) {
    setForm({
      name: item.name, category_id: item.category_id || '', price: item.price,
      description: item.description || '', is_available: item.is_available,
    });
    setEditingId(item.id);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name || !form.price) return setToast({ type: 'error', message: 'Name and price are required' });
    try {
      const payload = { ...form, category_id: form.category_id || null, price: Number(form.price) };
      if (editingId) await api.put(`/menu/${editingId}`, payload);
      else await api.post('/menu', payload);
      setModalOpen(false);
      load();
      setToast({ type: 'success', message: 'Menu item saved' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Save failed' });
    }
  }

  async function toggleAvailable(item) {
    await api.put(`/menu/${item.id}`, { ...item, is_available: !item.is_available });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this menu item?')) return;
    await api.delete(`/menu/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Menu Management</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Add Item</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category_name || '—'}</td>
                <td>₹{Number(item.price).toFixed(0)}</td>
                <td>
                  <span className={`badge ${item.is_available ? 'in-stock' : 'out-of-stock'}`}>
                    {item.is_available ? 'Available' : 'Disabled'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-outline" onClick={() => toggleAvailable(item)}>
                    {item.is_available ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Item' : 'Add Item'}</h3>
            <div className="form-group">
              <label>Item Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Selling Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
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
