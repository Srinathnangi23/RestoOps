import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <div className="topbar">
          <div className="user-badge">Signed in as <strong>{user?.name}</strong> ({user?.role})</div>
          <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
