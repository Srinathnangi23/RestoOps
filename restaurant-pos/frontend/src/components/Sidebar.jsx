import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pos', label: 'POS' },
  { to: '/orders', label: 'Orders' },
  { to: '/menu', label: 'Menu' },
  { to: '/categories', label: 'Categories' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/ingredients', label: 'Ingredients' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/profit-loss', label: 'Profit & Loss' },
  { to: '/reports', label: 'Reports' },
];

const cashierLinks = [
  { to: '/pos', label: 'POS' },
  { to: '/orders', label: 'Order History' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const links = user?.role === 'ADMIN' ? adminLinks : cashierLinks;

  return (
    <aside className="sidebar">
      <div className="brand">🍽 Restaurant POS</div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
