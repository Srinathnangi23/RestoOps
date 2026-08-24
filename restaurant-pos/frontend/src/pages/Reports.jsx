import { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysAgoStr(n) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }

const REPORT_TYPES = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'best-sellers', label: 'Best Selling Items' },
  { key: 'ingredient-usage', label: 'Ingredient Usage' },
  { key: 'wastage', label: 'Wastage Report' },
  { key: 'payment-methods', label: 'Payment Methods' },
];

export default function Reports() {
  const [type, setType] = useState('sales');
  const [from, setFrom] = useState(daysAgoStr(30));
  const [to, setTo] = useState(todayStr());
  const [rows, setRows] = useState([]);

  useEffect(() => { load(); }, [type]);
  function load() {
    api.get(`/reports/${type}`, { params: { from, to } }).then((r) => setRows(r.data));
  }

  function exportCSV() {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="toolbar"><h2>Reports</h2></div>

      <div className="category-tabs">
        {REPORT_TYPES.map((r) => (
          <button key={r.key} className={type === r.key ? 'active' : ''} onClick={() => setType(r.key)}>{r.label}</button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={load}>Apply</button>
        <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
      </div>

      {(type === 'sales' || type === 'best-sellers') && rows.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={type === 'sales' ? 'date' : 'item_name'} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey={type === 'sales' ? 'revenue' : 'total_sold'} fill="#1c6e5e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>{rows[0] && Object.keys(rows[0]).map((h) => <th key={h}>{h.replace(/_/g, ' ')}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>{Object.values(row).map((v, i) => <td key={i}>{String(v)}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No data for this period.</p>}
      </div>
    </div>
  );
}
