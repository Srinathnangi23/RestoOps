import { useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

const CATEGORIES = ['Rent', 'Electricity', 'Water', 'Salary', 'Gas', 'Maintenance', 'Packaging', 'Transport', 'Other'];
const emptyForm = { name: '', category: 'Other', amount: '', expense_date: '', description: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { api.get('/expenses').then((r) => setExpenses(r.data)); }

  function sumSince(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return expenses
      .filter((e) => new Date(e.expense_date) >= cutoff)
      .reduce((s, e) => s + Number(e.amount), 0);
  }
  const today = expenses.filter((e) => e.expense_date === new Date().toISOString().slice(0, 10)).reduce((s, e) => s + Number(e.amount), 0);

  async function save() {
    if (!form.name || !form.amount) return setToast({ type: 'error', message: 'Name and amount are required' });
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setModalOpen(false);
      setForm(emptyForm);
      load();
      setToast({ type: 'success', message: 'Expense recorded' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Save failed' });
    }
  }

  async function remove(id) {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Expense Management</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Add Expense</button>
      </div>

      <div className="grid stat-grid">
        <div className="card stat-card"><div className="label">Today's Expenses</div><div className="value">₹{today.toFixed(2)}</div></div>
        <div className="card stat-card"><div className="label">This Week</div><div className="value">₹{sumSince(7).toFixed(2)}</div></div>
        <div className="card stat-card"><div className="label">This Month</div><div className="value">₹{sumSince(30).toFixed(2)}</div></div>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.category}</td>
                <td>₹{Number(e.amount).toFixed(2)}</td>
                <td>{new Date(e.expense_date).toLocaleDateString('en-GB')}</td>
                <td><button className="btn btn-danger" onClick={() => remove(e.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>Add Expense</h3>
            <div className="form-group"><label>Expense Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="form-group"><label>Date</label><input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
