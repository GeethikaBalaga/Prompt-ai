// Dashboard / Overview Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Package, AlertTriangle, ShieldAlert, TrendingDown,
  CheckCircle, Clock, Target, ArrowRight, Info
} from 'lucide-react';
import { getRiskBadgeClass, getRiskLevelLabel, formatHoursAgo } from '../utils/helpers';
import { buildRiskDetail } from '../utils/riskEngine';

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
};

export function DashboardPage() {
  const { state, metrics, dispatch } = useApp();
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const visibleAlerts = state.alerts.filter((a) => !dismissedAlerts.includes(a.id));

  // Risk distribution for chart
  const riskDistribution = [
    { name: 'Critical Risk', value: state.products.filter((p) => p.riskLevel === 'critical').length, color: RISK_COLORS.critical },
    { name: 'High Risk', value: state.products.filter((p) => p.riskLevel === 'high').length, color: RISK_COLORS.high },
    { name: 'Medium Risk', value: state.products.filter((p) => p.riskLevel === 'medium').length, color: RISK_COLORS.medium },
    { name: 'Low Risk', value: state.products.filter((p) => p.riskLevel === 'low').length, color: RISK_COLORS.low },
  ].filter((d) => d.value > 0);

  const kpiCards = [
    { label: 'Total Products', value: metrics.totalProducts, icon: Package, variant: 'info', sub: 'In demo store' },
    { label: 'Available', value: metrics.availableProducts, icon: CheckCircle, variant: 'low', sub: 'Active products' },
    { label: 'Low Stock', value: metrics.lowStockProducts, icon: TrendingDown, variant: 'medium', sub: 'Need attention' },
    { label: 'High Risk', value: metrics.highRiskProducts, icon: AlertTriangle, variant: 'high', sub: 'Action recommended' },
    { label: 'Critical', value: metrics.criticalProducts, icon: ShieldAlert, variant: 'critical', sub: 'Immediate action' },
    { label: 'Unavailable', value: metrics.recentlyUnavailable, icon: Clock, variant: 'critical', sub: 'Hidden from customers' },
    { label: 'Accuracy Score', value: `${metrics.inventoryAccuracyScore}%`, icon: Target, variant: 'info', sub: 'Simulated estimate' },
    { label: 'Est. At-Risk Orders/day', value: metrics.estimatedAtRiskOrders, icon: AlertTriangle, variant: 'high', sub: 'Prototype estimate' },
  ];

  return (
    <Layout
      title="Store Overview"
      subtitle={`${state.user?.storeName} · Inventory Health Dashboard`}
    >
      {/* Why Smart Inventory Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
        borderRadius: '12px', padding: '20px 24px',
        marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldAlert size={18} color="#60a5fa" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Why Smart Inventory?
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#bfdbfe', lineHeight: '1.6' }}>
            Customers lose trust when products shown as available become unavailable after ordering.
            Smart Inventory helps store teams detect inventory risk <em>before</em> it becomes a failed order.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { stat: '29%', label: 'customers reported issues' },
            { stat: '35%', label: 'cancellations from unavailability' },
            { stat: '39%', label: 'stores find it too manual' },
          ].map(({ stat, label }) => (
            <div key={stat} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{stat}</div>
              <div style={{ fontSize: '11px', color: '#93c5fd' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ width: '100%', fontSize: '11px', color: '#60a5fa', opacity: 0.8, marginTop: '4px' }}>
          ⓘ NOVA CART Challenge Case Data — not invented statistics
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Inventory Health</h2>
        <span style={{ fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
          Demo / Simulated Data
        </span>
      </div>
      <div className="kpi-grid">
        {kpiCards.map(({ label, value, icon: Icon, variant, sub }) => (
          <div key={label} className={`kpi-card ${variant}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-sub">{sub}</div>
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: variant === 'critical' ? '#fef2f2' : variant === 'high' ? '#fff7ed' : variant === 'medium' ? '#fefce8' : variant === 'low' ? '#f0fdf4' : '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={18} color={variant === 'critical' ? '#dc2626' : variant === 'high' ? '#ea580c' : variant === 'medium' ? '#ca8a04' : variant === 'low' ? '#16a34a' : '#1e40af'} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', marginTop: '8px' }}>

        {/* Risk Distribution Chart */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <div className="section-title">Inventory Risk Distribution</div>
            <div className="section-subtitle">Products by risk level</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {riskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} products`, name]}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend
                formatter={(value) => <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div className="section-title">Recent Alerts</div>
              <div className="section-subtitle">High-priority inventory issues</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/risk-center')}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {visibleAlerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✓</div>
              <div className="empty-state-title">All alerts cleared</div>
              <p style={{ fontSize: '13px' }}>No pending inventory alerts</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleAlerts.slice(0, 5).map((alert) => {
                const product = state.products.find((p) => p.id === alert.productId);
                if (!product) return null;
                const detail = buildRiskDetail(product);
                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '12px 14px', borderRadius: '8px',
                      background: alert.type === 'critical' ? '#fef2f2' : alert.type === 'high' ? '#fff7ed' : '#fefce8',
                      border: `1px solid ${alert.type === 'critical' ? '#fca5a5' : alert.type === 'high' ? '#fdba74' : '#fde047'}`
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>{product.name}</span>
                        <span className={getRiskBadgeClass(product.riskLevel)}>
                          {getRiskLevelLabel(product.riskLevel)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                        Stock: {product.currentStock} · Avg demand: {product.avgDailyDemand}/day · Updated: {formatHoursAgo(product.lastUpdated)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Risk Score: {detail.riskScore}/100
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {alert.action}
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          setDismissedAlerts((prev) => [...prev, alert.id]);
                          dispatch({ type: 'DISMISS_ALERT', payload: alert.id });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div className="section-title">Quick Actions</div>
          <div className="section-subtitle">Common inventory management tasks</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'View Risk Center', path: '/risk-center', variant: 'btn-primary', icon: AlertTriangle },
            { label: 'Update Inventory', path: '/update-inventory', variant: 'btn-ghost', icon: Package },
            { label: 'Customer Availability', path: '/customer-availability', variant: 'btn-ghost', icon: Info },
            { label: 'Business Impact', path: '/business-impact', variant: 'btn-ghost', icon: TrendingDown },
          ].map(({ label, path, variant, icon: Icon }) => (
            <button
              key={path}
              className={`btn ${variant}`}
              onClick={() => navigate(path)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
