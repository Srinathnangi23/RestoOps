export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  setTimeout(() => onClose && onClose(), 3000);
  return <div className={`toast ${type}`}>{message}</div>;
}
