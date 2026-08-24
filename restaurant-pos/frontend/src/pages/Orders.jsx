import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data));
  }, []);

  return (
    <div>
      <div className="toolbar"><h2>Order History</h2></div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Bill No</th><th>Date</th><th>Type</th><th>Total</th><th>Cashier</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.bill_no}</td>
                <td>{new Date(o.created_at).toLocaleString('en-GB')}</td>
                <td>{o.order_type.replace('_', '-')}</td>
                <td>₹{Number(o.total).toFixed(2)}</td>
                <td>{o.cashier_name}</td>
                <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>}
      </div>
    </div>
  );
}
