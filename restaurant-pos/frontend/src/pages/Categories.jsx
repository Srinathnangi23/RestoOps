import { useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { api.get('/categories').then((r) => setCategories(r.data)); }

  async function save() {
    if (!name.trim()) return;
    try {
      if (editingId) await api.put(`/categories/${editingId}`, { name });
      else await api.post('/categories', { name });
      setName(''); setEditingId(null);
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Save failed' });
    }
  }

  async function remove(id) {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar"><h2>Categories</h2></div>
      <div className="card" style={{ maxWidth: 500, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary" onClick={save}>{editingId ? 'Update' : 'Add'}</button>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" onClick={() => { setEditingId(c.id); setName(c.name); }}>Edit</button>
                  <button className="btn btn-danger" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
