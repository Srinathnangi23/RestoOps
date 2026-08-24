import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import Receipt from '../components/Receipt';

export default function POS() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]); // {menu_item_id, name, price, quantity}
  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [toast, setToast] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadMenu(); loadCategories(); }, []);

  function loadMenu() {
    api.get('/menu').then((res) => setMenuItems(res.data)).catch(() => setToast({ type: 'error', message: 'Failed to load menu' }));
  }
  function loadCategories() {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return menuItems;
    return menuItems.filter((m) => String(m.category_id) === String(activeCategory));
  }, [menuItems, activeCategory]);

  function addToCart(item) {
    if (!item.is_available || !item.in_stock) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) => (c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((c) => (c.menu_item_id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const change = paymentMethod === 'CASH' && cashReceived ? Number((Number(cashReceived) - total).toFixed(2)) : null;

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderRes = await api.post('/orders', {
        items: cart.map((c) => ({ menu_item_id: c.menu_item_id, quantity: c.quantity })),
        order_type: orderType,
        table_number: tableNumber || null,
        status: 'PENDING',
      });
      const order = orderRes.data;

      const checkoutRes = await api.post(`/orders/${order.id}/checkout`, {
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'CASH' ? Number(cashReceived) : total,
      });

      setReceiptData({
        bill_no: order.bill_no,
        items: cart,
        subtotal, tax, discount: 0, total,
        payment_method: paymentMethod,
        change: checkoutRes.data.change_returned,
        date: new Date(),
      });
      setCart([]);
      setCheckoutOpen(false);
      setCashReceived('');
      loadMenu(); // refresh stock/availability
      setToast({ type: 'success', message: 'Order completed successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Checkout failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="toolbar"><h2>Point of Sale</h2></div>

      <div className="category-tabs">
        <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={String(activeCategory) === String(c.id) ? 'active' : ''} onClick={() => setActiveCategory(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="pos-layout">
        <div className="menu-grid">
          {filteredItems.map((item) => {
            const unavailable = !item.is_available || !item.in_stock;
            return (
              <button key={item.id} className="menu-card" disabled={unavailable} onClick={() => addToCart(item)}>
                <div className="name">{item.name}</div>
                <div className="price">₹{Number(item.price).toFixed(0)}</div>
                <div className="status">{unavailable ? 'Out of Stock' : 'Available'}</div>
              </button>
            );
          })}
          {filteredItems.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No items in this category.</p>}
        </div>

        <div className="cart-panel">
          <h3 style={{ marginTop: 0 }}>Order Cart</h3>

          <div className="form-group">
            <label>Order Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="DINE_IN">Dine-in</option>
              <option value="TAKEAWAY">Takeaway</option>
            </select>
          </div>
          {orderType === 'DINE_IN' && (
            <div className="form-group">
              <label>Table Number</label>
              <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="e.g. 4" />
            </div>
          )}

          <div className="cart-items">
            {cart.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Cart is empty</p>}
            {cart.map((c) => (
              <div className="cart-row" key={c.menu_item_id}>
                <div>
                  <div>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{c.price} × {c.quantity} = ₹{(c.price * c.quantity).toFixed(0)}</div>
                </div>
                <div className="qty-controls">
                  <button onClick={() => changeQty(c.menu_item_id, -1)}>-</button>
                  <span>{c.quantity}</span>
                  <button onClick={() => changeQty(c.menu_item_id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-totals">
            <div className="row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="row"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="row total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={clearCart} disabled={cart.length === 0}>Clear Cart</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>Checkout</button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>Checkout</h3>
            <div className="cart-totals" style={{ marginBottom: 16 }}>
              <div className="row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="row"><span>Tax</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="row total"><span>Total Due</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
            {paymentMethod === 'CASH' && (
              <div className="form-group">
                <label>Cash Received</label>
                <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="e.g. 200" />
                {change !== null && !Number.isNaN(change) && (
                  <div style={{ marginTop: 6, fontSize: 13, color: change < 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {change < 0 ? 'Insufficient amount' : `Change to return: ₹${change.toFixed(2)}`}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCheckoutOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting || (paymentMethod === 'CASH' && (!cashReceived || Number(cashReceived) < total))}
                onClick={handleCheckout}
              >
                {submitting ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptData && (
        <div className="modal-overlay">
          <div className="modal">
            <Receipt data={receiptData} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setReceiptData(null)}>Close</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
