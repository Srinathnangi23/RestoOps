export default function Receipt({ data }) {
  const { bill_no, items, subtotal, tax, discount, total, payment_method, change, date } = data;
  const d = new Date(date);

  return (
    <div className="receipt">
      <div className="center"><strong>ABC RESTAURANT</strong></div>
      <div className="center" style={{ fontSize: 11 }}>123 Main Street, Hyderabad</div>
      <hr />
      <div className="row"><span>Bill No:</span><span>{bill_no}</span></div>
      <div className="row"><span>Date:</span><span>{d.toLocaleDateString('en-GB')}</span></div>
      <div className="row"><span>Time:</span><span>{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
      <hr />
      <div className="row"><span>Item</span><span>Qty&nbsp;&nbsp;Price</span></div>
      <hr />
      {items.map((it) => (
        <div className="row" key={it.menu_item_id}>
          <span>{it.name}</span>
          <span>{it.quantity} &nbsp; ₹{(it.price * it.quantity).toFixed(0)}</span>
        </div>
      ))}
      <hr />
      <div className="row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
      <div className="row"><span>Tax</span><span>₹{tax.toFixed(2)}</span></div>
      <div className="row"><span>Discount</span><span>₹{discount.toFixed(2)}</span></div>
      <hr />
      <div className="row"><strong>TOTAL</strong><strong>₹{total.toFixed(2)}</strong></div>
      <div className="row"><span>Payment</span><span>{payment_method}</span></div>
      {change !== null && change !== undefined && (
        <div className="row"><span>Change</span><span>₹{Number(change).toFixed(2)}</span></div>
      )}
      <hr />
      <div className="center">Thank You! Visit Again</div>
    </div>
  );
}
