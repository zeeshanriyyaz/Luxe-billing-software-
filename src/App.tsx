import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate,
  useNavigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './types';

// Components
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import POS from './components/POS';
import SalesHistory from './components/SalesHistory';
import Reports from './components/Reports';
import Login from './components/Login';

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link to={to}>
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active ? "bg-gold text-navy shadow-lg shadow-gold/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
    )}>
      <Icon size={20} className={cn(active ? "text-navy" : "group-hover:text-gold")} />
      <span className="font-medium">{label}</span>
    </div>
  </Link>
);

const Layout = ({ children, user, onLogout }: { children: React.ReactNode, user: any, onLogout: () => void }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const lowStock = data.filter((p: any) => p.stock <= p.min_stock).length;
        setLowStockCount(lowStock);
      });
  }, [location]);

  return (
    <div className="flex min-h-screen bg-navy">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
            <ShoppingCart className="text-navy" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">Luxe<span className="text-gold">POS</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
          <SidebarItem icon={ShoppingCart} label="Point of Sale" to="/pos" active={location.pathname === '/pos'} />
          <SidebarItem icon={Package} label="Inventory" to="/products" active={location.pathname === '/products'} />
          <SidebarItem icon={History} label="Sales History" to="/history" active={location.pathname === '/history'} />
          <SidebarItem icon={BarChart3} label="Reports" to="/reports" active={location.pathname === '/reports'} />
        </nav>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-navy-light/80 backdrop-blur-lg border-bottom border-white/5 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-gold" size={24} />
          <span className="text-xl font-bold text-white">Luxe<span className="text-gold">POS</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 bg-navy z-[60] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-bold text-white">Luxe<span className="text-gold">POS</span></span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-4" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
              <SidebarItem icon={ShoppingCart} label="Point of Sale" to="/pos" active={location.pathname === '/pos'} />
              <SidebarItem icon={Package} label="Inventory" to="/products" active={location.pathname === '/products'} />
              <SidebarItem icon={History} label="Sales History" to="/history" active={location.pathname === '/history'} />
              <SidebarItem icon={BarChart3} label="Reports" to="/reports" active={location.pathname === '/reports'} />
            </nav>
            <button 
              onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-500 bg-red-500/10 mt-auto"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 mt-16 md:mt-0 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {location.pathname === '/' && 'Dashboard Overview'}
              {location.pathname === '/pos' && 'Point of Sale'}
              {location.pathname === '/products' && 'Inventory Management'}
              {location.pathname === '/history' && 'Sales History'}
              {location.pathname === '/reports' && 'Business Reports'}
            </h1>
            <p className="text-slate-400 mt-1">Welcome back, {user?.username}.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-lg bg-navy-light border border-white/5 text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
              </button>
              {lowStockCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-navy">
                  {lowStockCount}
                </span>
              )}
            </div>
          </div>
        </header>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

/**
 * Main Application Component
 * Handles routing, authentication state, and global layout.
 */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Handle user login
  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('pos_user', JSON.stringify(userData));
  };

  // Handle user logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
  };

  if (loading) return <div className="min-h-screen bg-navy flex items-center justify-center text-gold">Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Public Route: Login */}
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        
        {/* Protected Routes: Require Authentication */}
        <Route 
          path="/*" 
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<ProductManager />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/history" element={<SalesHistory />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  );
}
