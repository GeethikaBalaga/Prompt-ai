// Top Navigation Bar Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ConfirmDialog } from './ConfirmDialog';
import { Bell, ChevronDown, LogOut, User, Settings, Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { state, logout, showToast, dispatch } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    showToast('info', 'Logged out', 'You have been logged out successfully.');
    navigate('/login');
  };

  const criticalCount = state.products.filter((p) => p.riskLevel === 'critical').length;

  return (
    <>
      <header className="topbar">
        {/* Mobile menu button */}
        <div className="flex items-center gap-3">
          <button
            className="btn-icon"
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alerts Bell */}
          <button
            className="btn-icon"
            style={{ position: 'relative' }}
            onClick={() => navigate('/risk-center')}
            title="View Alerts"
          >
            <Bell size={17} />
            {criticalCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: '#dc2626', color: 'white',
                fontSize: '9px', fontWeight: 700,
                width: '16px', height: '16px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {criticalCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="flex items-center gap-2"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '7px 12px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: '#0f172a'
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1e40af', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700
              }}>
                {state.user?.managerName?.charAt(0) || 'R'}
              </div>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.user?.managerName || 'Store Manager'}
              </span>
              <ChevronDown size={14} />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '220px', zIndex: 20,
                  overflow: 'hidden'
                }}>
                  {/* User Info */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      {state.user?.managerName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {state.user?.storeName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                      {state.user?.role} · {state.user?.storeId}
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    { label: 'Profile', icon: User, onClick: () => { setMenuOpen(false); navigate('/profile'); } },
                    { label: 'Settings', icon: Settings, onClick: () => { setMenuOpen(false); navigate('/settings'); } },
                  ].map(({ label, icon: Icon, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '13.5px', color: '#374151', display: 'flex', alignItems: 'center', gap: '10px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13.5px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '10px',
                      marginBottom: '4px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={logoutDialogOpen}
        title="Logout"
        message="Are you sure you want to logout? Any unsaved changes will be preserved in your session."
        confirmLabel="Yes, Logout"
        cancelLabel="Stay Logged In"
        variant="warning"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </>
  );
}
