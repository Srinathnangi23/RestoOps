import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import Categories from './pages/Categories';
import Ingredients from './pages/Ingredients';
import Recipes from './pages/Recipes';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import ProfitLoss from './pages/ProfitLoss';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/dashboard' : '/pos'} /> : <Login />} />

      <Route path="/dashboard" element={<ProtectedRoute roles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/menu" element={<ProtectedRoute roles={['ADMIN']}><MenuManagement /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute roles={['ADMIN']}><Categories /></ProtectedRoute>} />
      <Route path="/ingredients" element={<ProtectedRoute roles={['ADMIN']}><Ingredients /></ProtectedRoute>} />
      <Route path="/recipes" element={<ProtectedRoute roles={['ADMIN']}><Recipes /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute roles={['ADMIN']}><Inventory /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute roles={['ADMIN']}><Expenses /></ProtectedRoute>} />
      <Route path="/profit-loss" element={<ProtectedRoute roles={['ADMIN']}><ProfitLoss /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['ADMIN']}><Reports /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/dashboard' : '/pos') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
