import { useEffect, useState } from 'react';
import api from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  if (error) return <div className="card">{error}</div>;
  if (!data) return <div className="card">Loading dashboard...</div>;

  const { today, low_stock, out_of_stock, top_selling, trend } = data;
  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="toolbar"><h2>Owner Dashboard</h2></div>

      <div className="grid stat-grid">
        <Stat label="Today's Revenue" value={fmt(today.revenue)} />
        <Stat label="Today's Orders" value={today.orders} />
        <Stat label="Today's Ingredient Cost" value={fmt(today.ingredient_cost)} />
        <Stat label="Today's Expenses" value={fmt(today.expenses)} />
        <Stat label="Today's Gross Profit" value={fmt(today.gross_profit)} />
        <Stat label="Today's Net Profit" value={fmt(today.net_profit)} negative={today.net_profit < 0} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Revenue & Profit (7 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#1c6e5e" name="Revenue" />
              <Line type="monotone" dataKey="cogs" stroke="#d97b3f" name="Ingredient Cost" />
              <Line type="monotone" dataKey="expenses" stroke="#dc2626" name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Orders (7 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#1c6e5e" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Top Selling Items</h3>
          {top_selling.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No sales yet.</p>}
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {top_selling.map((t) => (
              <li key={t.item_name} style={{ marginBottom: 6 }}>{t.item_name} — {t.total_sold} sold</li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Low Stock Alerts</h3>
          {low_stock.length === 0 && <p style={{ color: 'var(--text-muted)' }}>All good.</p>}
          {low_stock.map((i) => (
            <div key={i.name} className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>{i.name}</span>
              <span style={{ color: 'var(--warning)' }}>{i.current_quantity} {i.unit} remaining</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Out of Stock</h3>
          {out_of_stock.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nothing out of stock.</p>}
          {out_of_stock.map((i) => (
            <div key={i.name} className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>{i.name}</span>
              <span style={{ color: 'var(--danger)' }}>0 {i.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, negative }) {
  return (
    <div className={`card stat-card ${negative ? 'neg' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
