import { useEffect, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [wastageOpen, setWastageOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ ingredient_id: '', quantity: '', purchase_price: '', supplier: '', invoice_number: '' });
  const [wastageForm, setWastageForm] = useState({ ingredient_id: '', quantity: '', reason: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { api.get('/inventory').then((r) => setInventory(r.data)); }

  const filtered = filter === 'ALL' ? inventory : inventory.filter((i) => i.status === filter);

  async function submitPurchase() {
    try {
      await api.post('/inventory/purchase', {
        ...purchaseForm,
        ingredient_id: Number(purchaseForm.ingredient_id),
        quantity: Number(purchaseForm.quantity),
        purchase_price: purchaseForm.purchase_price ? Number(purchaseForm.purchase_price) : null,
      });
      setPurchaseOpen(false);
      setPurchaseForm({ ingredient_id: '', quantity: '', purchase_price: '', supplier: '', invoice_number: '' });
      load();
      setToast({ type: 'success', message: 'Stock added' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Purchase failed' });
    }
  }

  async function submitWastage() {
    try {
      await api.post('/inventory/adjust', {
        ingredient_id: Number(wastageForm.ingredient_id),
        quantity_change: Number(wastageForm.quantity),
        type: 'WASTAGE',
        reason: wastageForm.reason,
      });
      setWastageOpen(false);
      setWastageForm({ ingredient_id: '', quantity: '', reason: '' });
      load();
      setToast({ type: 'success', message: 'Wastage recorded' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to record wastage' });
    }
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Inventory</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setWastageOpen(true)}>Record Wastage</button>
          <button className="btn btn-primary" onClick={() => setPurchaseOpen(true)}>+ Add Stock</button>
        </div>
      </div>

      <div className="category-tabs">
        {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Ingredient</th><th>Current Stock</th><th>Unit</th><th>Min Stock</th><th>Cost/Unit</th><th>Stock Value</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.current_quantity}</td>
                <td>{i.unit}</td>
                <td>{i.min_stock_level}</td>
                <td>₹{Number(i.cost_per_unit).toFixed(2)}</td>
                <td>₹{i.stock_value.toFixed(2)}</td>
                <td><span className={`badge ${i.status.toLowerCase().replace(/_/g, '-')}`}>{i.status.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {purchaseOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>Add Stock (Purchase)</h3>
            <div className="form-group">
              <label>Ingredient</label>
              <select value={purchaseForm.ingredient_id} onChange={(e) => setPurchaseForm({ ...purchaseForm, ingredient_id: e.target.value })}>
                <option value="">Select ingredient</option>
                {inventory.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Quantity Purchased</label><input type="number" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} /></div>
            <div className="form-group"><label>Purchase Price (₹, optional)</label><input type="number" value={purchaseForm.purchase_price} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_price: e.target.value })} /></div>
            <div className="form-group"><label>Supplier</label><input value={purchaseForm.supplier} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} /></div>
            <div className="form-group"><label>Invoice Number</label><input value={purchaseForm.invoice_number} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPurchaseOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitPurchase}>Add Stock</button>
            </div>
          </div>
        </div>
      )}

      {wastageOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>Record Wastage</h3>
            <div className="form-group">
              <label>Ingredient</label>
              <select value={wastageForm.ingredient_id} onChange={(e) => setWastageForm({ ...wastageForm, ingredient_id: e.target.value })}>
                <option value="">Select ingredient</option>
                {inventory.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Quantity Wasted</label><input type="number" value={wastageForm.quantity} onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })} /></div>
            <div className="form-group"><label>Reason</label><input value={wastageForm.reason} onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })} placeholder="e.g. Spoiled" /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setWastageOpen(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={submitWastage}>Record</button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
