// Profile Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LogOut, User, Store, Shield, Activity } from 'lucide-react';
import { STORE_INFO } from '../data/inventory';

export function ProfilePage() {
  const { state, logout, showToast, metrics } = useApp();
  const navigate = useNavigate();
  const [logoutDialog, setLogoutDialog] = useState(false);

  const handleLogout = () => {
    setLogoutDialog(false);
    logout();
    showToast('info', 'Logged out', 'You have been logged out successfully.');
    navigate('/login', { replace: true });
  };

  const sessionStats = [
    { label: 'Inventory Updates', value: state.inventoryUpdates },
    { label: 'Products Corrected', value: state.productsCorrected },
    { label: 'Critical Alerts', value: metrics.criticalProducts },
    { label: 'Inventory Accuracy Score', value: `${metrics.inventoryAccuracyScore}%` },
  ];

  return (
    <Layout title="Profile" subtitle="Account information and session details">
      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Profile Card */}
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: '#1e40af',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '26px', fontWeight: 800, color: 'white'
          }}>
            {state.user?.managerName?.charAt(0) || 'R'}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            {state.user?.managerName}
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{state.user?.role}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>{state.user?.storeName}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <span className="badge badge-info">Store Manager</span>
            <span className="badge badge-available">Active Session</span>
          </div>
        </div>

        {/* Account Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={17} color="#1e40af" />
            <span className="section-title">Account Details</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Full Name', value: state.user?.managerName },
              { label: 'Role', value: state.user?.role },
              { label: 'Store ID', value: state.user?.storeId },
              { label: 'Store Name', value: state.user?.storeName },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Store Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Store size={17} color="#1e40af" />
            <span className="section-title">Store Details</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Store Name', value: STORE_INFO.name },
              { label: 'City', value: STORE_INFO.city },
              { label: 'Category', value: STORE_INFO.category },
              { label: 'Address', value: STORE_INFO.address },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b', flexShrink: 0, marginRight: '12px' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Stats */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={17} color="#1e40af" />
            <span className="section-title">This Session</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {sessionStats.map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Shield size={17} color="#1e40af" />
            <span className="section-title">Security</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
            You are currently logged in as <strong>{state.user?.managerName}</strong>.
            For security, always logout when you leave the device unattended.
          </p>
          <button
            className="btn btn-danger"
            onClick={() => setLogoutDialog(true)}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        <div className="sim-banner">
          <Shield size={12} />
          <span>Demo prototype — this is a fictional store account for the NOVA CART competition demo</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={logoutDialog}
        title="Logout"
        message="Are you sure you want to logout? Your inventory changes are saved and will be available when you log back in."
        confirmLabel="Yes, Logout"
        cancelLabel="Stay Logged In"
        variant="warning"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialog(false)}
      />
    </Layout>
  );
}
