// Sidebar Navigation Component
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, AlertTriangle, Package, RefreshCw,
  ShoppingCart, TrendingUp, Settings, User, ShieldAlert, X
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/risk-center', label: 'Inventory Risk Center', icon: AlertTriangle, badgeKey: 'critical' },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/update-inventory', label: 'Update Inventory', icon: RefreshCw },
  { path: '/customer-availability', label: 'Customer Availability', icon: ShoppingCart },
  { path: '/business-impact', label: 'Business Impact', icon: TrendingUp },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const { state, metrics, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const criticalCount = state.products.filter((p) => p.riskLevel === 'critical').length;

  const handleNav = (path: string) => {
    navigate(path);
    dispatch({ type: 'CLOSE_MOBILE_MENU' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {state.mobileMenuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39
          }}
          onClick={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        />
      )}

      <aside className={`sidebar ${state.mobileMenuOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-brand">
            <div className="sidebar-logo-icon">
              <ShieldAlert size={20} color="white" />
            </div>
            <div className="sidebar-logo-text">
              <div className="sidebar-logo-name">NOVA CART</div>
              <div className="sidebar-logo-sub">Smart Inventory</div>
            </div>
          </div>
        </div>

        {/* Store Info */}
        {state.user && (
          <div style={{ padding: '8px 12px' }}>
            <div className="sidebar-store-info">
              <div className="sidebar-store-name">{state.user.storeName}</div>
              <div className="sidebar-store-role">
                {state.user.role} · {state.user.storeId}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map(({ path, label, icon: Icon, badgeKey }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(path)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Icon size={16} />
                <span>{label}</span>
                {badgeKey === 'critical' && criticalCount > 0 && (
                  <span className="sidebar-nav-badge">{criticalCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Health Summary */}
        <div style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
          <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Inventory Health
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Accuracy Score</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: metrics.inventoryAccuracyScore >= 80 ? '#4ade80' : metrics.inventoryAccuracyScore >= 60 ? '#fbbf24' : '#f87171' }}>
                {metrics.inventoryAccuracyScore}%
              </span>
            </div>
            <div style={{ height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${metrics.inventoryAccuracyScore}%`,
                height: '100%',
                background: metrics.inventoryAccuracyScore >= 80 ? '#4ade80' : metrics.inventoryAccuracyScore >= 60 ? '#fbbf24' : '#f87171',
                borderRadius: '2px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Mobile Close */}
        <button
          onClick={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
          style={{
            display: 'none',
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
          }}
          className="mobile-close-btn"
        >
          <X size={20} />
        </button>
      </aside>
    </>
  );
}
