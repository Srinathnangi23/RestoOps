import { useEffect, useState } from 'react';
import api from '../services/api';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysAgoStr(n) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }

export default function ProfitLoss() {
  const [from, setFrom] = useState(daysAgoStr(30));
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState(null);

  useEffect(() => { load(); }, []);
  function load() {
    api.get('/reports/profit-loss', { params: { from, to } }).then((r) => setData(r.data));
  }

  return (
    <div>
      <div className="toolbar"><h2>Profit & Loss</h2></div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={load}>Apply</button>
      </div>

      {data && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <Line label="Revenue" value={data.revenue} />
            <Line label="Cost of Goods Sold (COGS)" value={-data.cogs} sub />
            <Line label="Gross Profit" value={data.gross_profit} bold />
            <Line label="Operating Expenses" value={-data.total_expenses} sub />
            <Line label={data.is_loss ? 'Net Loss' : 'Net Profit'} value={data.net_profit} bold negative={data.is_loss} large />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Expenses by Category</h3>
            {data.expenses_by_category.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No expenses in this period.</p>}
            {data.expenses_by_category.map((c) => (
              <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{c.category}</span>
                <span>₹{Number(c.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Line({ label, value, sub, bold, large, negative }) {
  const isNeg = Number(value) < 0;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      fontWeight: bold ? 700 : 400, fontSize: large ? 18 : sub ? 13 : 14,
      color: negative ? 'var(--danger)' : sub ? 'var(--text-muted)' : 'inherit',
      borderTop: bold ? '1px solid var(--border)' : 'none',
    }}>
      <span>{label}</span>
      <span>{isNeg ? '-' : ''}₹{Math.abs(Number(value)).toFixed(2)}</span>
    </div>
  );
}
