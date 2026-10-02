// Settings Page
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RotateCcw, Bell, Store, User, Shield } from 'lucide-react';
import { STORE_INFO } from '../data/inventory';

export function SettingsPage() {
  const { resetDemo, showToast } = useApp();
  const [resetDialog, setResetDialog] = useState(false);
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    highRisk: true,
    dailySummary: false,
    stockUpdates: true,
  });
  const [updateFreq, setUpdateFreq] = useState('manual');

  const handleReset = () => {
    setResetDialog(false);
    resetDemo();
    showToast('success', 'Demo Reset Complete', 'All inventory data has been restored to the original demo dataset.');
  };

  return (
    <Layout title="Settings" subtitle="Store configuration and preferences">
      <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Store Information */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Store size={17} color="#1e40af" />
            <span className="section-title">Store Information</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Store Name', value: STORE_INFO.name },
              { label: 'Store ID', value: STORE_INFO.id },
              { label: 'City', value: STORE_INFO.city },
              { label: 'Category', value: STORE_INFO.category },
              { label: 'Manager', value: STORE_INFO.managerName },
              { label: 'Role', value: STORE_INFO.managerRole },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
            <strong>Address:</strong> {STORE_INFO.address}
          </div>
          <div className="sim-banner" style={{ marginTop: '12px' }}>
            <Shield size={12} />
            <span>Demo prototype — store information is fictional sample data</span>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Bell size={17} color="#1e40af" />
            <span className="section-title">Notification Preferences</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'criticalAlerts', label: 'Critical Alerts', desc: 'Notify when products reach Critical risk level' },
              { key: 'highRisk', label: 'High Risk Alerts', desc: 'Notify when products reach High risk level' },
              { key: 'stockUpdates', label: 'Stock Update Confirmations', desc: 'Notify after each inventory update' },
              { key: 'dailySummary', label: 'Daily Inventory Summary', desc: 'Receive a daily digest of inventory health' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{desc}</div>
                </div>
                <button
                  onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: notifications[key as keyof typeof notifications] ? '#1e40af' : '#e2e8f0',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px',
                    left: notifications[key as keyof typeof notifications] ? '21px' : '3px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Update Frequency */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={17} color="#1e40af" />
            <span className="section-title">Inventory Update Frequency</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { value: 'manual', label: 'Manual', desc: 'Update inventory when needed' },
              { value: '2x_daily', label: 'Twice Daily', desc: 'Morning and evening updates' },
              { value: 'daily', label: 'Once Daily', desc: 'End of day inventory update' },
              { value: 'weekly', label: 'Weekly', desc: 'Weekly inventory reconciliation' },
            ].map(({ value, label, desc }) => (
              <label key={value} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', background: updateFreq === value ? '#eff6ff' : 'transparent', border: `1px solid ${updateFreq === value ? '#bfdbfe' : 'transparent'}` }}>
                <input
                  type="radio"
                  name="updateFreq"
                  value={value}
                  checked={updateFreq === value}
                  onChange={() => setUpdateFreq(value)}
                  style={{ marginTop: '2px', accentColor: '#1e40af' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="sim-banner" style={{ marginTop: '12px' }}>
            <Bell size={12} />
            <span>This is a prototype setting — it does not connect to actual inventory systems</span>
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="card" style={{ border: '1px solid #fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <RotateCcw size={17} color="#dc2626" />
            <span className="section-title" style={{ color: '#dc2626' }}>Reset Demo Data</span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
            Reset all inventory data, risk scores, and business impact metrics to the original demo dataset.
            Your login session will be preserved. This cannot be undone.
          </p>
          <button
            className="btn btn-danger"
            onClick={() => setResetDialog(true)}
          >
            <RotateCcw size={14} /> Reset Demo Data
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={resetDialog}
        title="Reset Demo Data"
        message="This will restore the original 20-product inventory dataset and reset all business impact metrics. Your session and login will be preserved. Are you sure?"
        confirmLabel="Yes, Reset Everything"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setResetDialog(false)}
      />
    </Layout>
  );
}
