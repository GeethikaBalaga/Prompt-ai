// Product Detail Page — shows full risk analysis and action buttons
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, CheckCircle, Edit3, XCircle, Pause, Play,
  RefreshCw, AlertTriangle, Info, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { buildRiskDetail, stockCoverageDays, getSubstitutes } from '../utils/riskEngine';
import { getRiskBadgeClass, getRiskLevelLabel, getAvailabilityBadgeClass, getAvailabilityLabel, formatHoursAgo, formatCoverage } from '../utils/helpers';

// Simulated demand trend data for chart
function generateTrendData(product: { avgDailyDemand: number; demandTrend: string }) {
  const base = product.avgDailyDemand;
  const trend = product.demandTrend;
  return Array.from({ length: 7 }, (_, i) => {
    const trendFactor = trend === 'increasing' ? 1 + (i * 0.08) : trend === 'decreasing' ? 1 - (i * 0.06) : 1;
    const noise = (Math.random() - 0.5) * 1.5;
    return {
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      demand: Math.max(0, Math.round(base * trendFactor + noise)),
    };
  });
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, updateStock, markUnavailable, markAvailable, pauseProduct, confirmStock, showToast } = useApp();
  const navigate = useNavigate();

  const [updateMode, setUpdateMode] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [newStockError, setNewStockError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; label: string }>({ open: false, action: '', label: '' });
  const [animating, setAnimating] = useState(false);

  const product = state.products.find((p) => p.id === id);

  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-title">Product not found</div>
          <button className="btn btn-primary" onClick={() => navigate('/risk-center')} style={{ marginTop: '16px' }}>
            Back to Risk Center
          </button>
        </div>
      </Layout>
    );
  }

  const detail = buildRiskDetail(product);
  const coverage = stockCoverageDays(product.currentStock, product.avgDailyDemand);
  const substitutes = getSubstitutes(product, state.products);
  const trendData = generateTrendData(product);

  const handleUpdateStock = () => {
    const val = parseInt(newStock, 10);
    if (isNaN(val) || val < 0) {
      setNewStockError('Please enter a valid quantity (0 or more).');
      return;
    }
    setAnimating(true);
    updateStock(product.id, val);
    showToast('success', 'Inventory Updated', `${product.name} stock updated to ${val} units. Risk score recalculated.`);
    setUpdateMode(false);
    setNewStock('');
    setNewStockError('');
    setTimeout(() => setAnimating(false), 800);
  };

  const handleConfirmStock = () => {
    setAnimating(true);
    confirmStock(product.id);
    showToast('success', 'Stock Confirmed', `Inventory freshness updated for ${product.name}. Risk score recalculated.`);
    setTimeout(() => setAnimating(false), 800);
  };

  const executeAction = () => {
    setConfirmDialog({ open: false, action: '', label: '' });
    if (confirmDialog.action === 'unavailable') {
      markUnavailable(product.id);
      showToast('info', 'Product Marked Unavailable', `${product.name} is now hidden from customer availability.`);
    } else if (confirmDialog.action === 'pause') {
      pauseProduct(product.id);
      showToast('info', 'Product Paused', `${product.name} has been paused.`);
    } else if (confirmDialog.action === 'available') {
      markAvailable(product.id);
      showToast('success', 'Product Available', `${product.name} is now shown as available.`);
    }
  };

  const factorSeverityColor = (severity: string) => {
    if (severity === 'critical') return '#dc2626';
    if (severity === 'high') return '#ea580c';
    if (severity === 'medium') return '#ca8a04';
    return '#16a34a';
  };

  const TrendIcon = product.demandTrend === 'increasing' ? TrendingUp : product.demandTrend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = product.demandTrend === 'increasing' ? '#dc2626' : product.demandTrend === 'decreasing' ? '#16a34a' : '#64748b';

  return (
    <Layout title={product.name} subtitle={`${product.category} · ${product.brand} · Risk Analysis`}>
      {/* Back */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Product Header */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{product.name}</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="chip">{product.category}</span>
                  <span className="chip">{product.brand}</span>
                  <span className="chip">₹{product.price} / {product.unit}</span>
                  <span className={getAvailabilityBadgeClass(product.availabilityStatus)}>
                    {getAvailabilityLabel(product.availabilityStatus)}
                  </span>
                </div>
              </div>
              {/* Risk Score Circle */}
              <div style={{ textAlign: 'center' }}>
                <div
                  className={`score-circle ${product.riskLevel}`}
                  style={{ transition: animating ? 'all 0.5s ease' : undefined }}
                >
                  <span className="score-circle-value">{detail.riskScore}</span>
                  <span className="score-circle-label">/ 100</span>
                </div>
                <span className={getRiskBadgeClass(product.riskLevel)} style={{ marginTop: '6px', display: 'inline-block' }}>
                  {getRiskLevelLabel(product.riskLevel)} Risk
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Current Stock', value: product.currentStock, unit: 'units', alert: product.currentStock <= 3 },
              { label: 'Avg Daily Demand', value: product.avgDailyDemand, unit: '/day' },
              { label: 'Stock Coverage', value: formatCoverage(coverage), unit: '', alert: coverage < 2 },
              { label: 'Historical Stock-Outs', value: product.historicalStockOuts, unit: 'times', alert: product.historicalStockOuts >= 3 },
            ].map(({ label, value, unit, alert }) => (
              <div key={label} className="card card-sm" style={{ borderTop: `3px solid ${alert ? '#dc2626' : '#e2e8f0'}` }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: alert ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
                  {value}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', marginLeft: '4px' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Factor Analysis */}
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <AlertTriangle size={16} color="#ea580c" />
                <span className="section-title">Risk Factor Analysis</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Prototype rule-based scoring — each factor contributes to the total risk score (0–100)
              </p>
            </div>
            {detail.factors.map((factor) => (
              <div key={factor.label} className="risk-factor-item">
                <div className="risk-factor-header">
                  <span style={{ fontWeight: 600, color: factorSeverityColor(factor.severity) }}>
                    {factor.label}
                  </span>
                  <span style={{ fontWeight: 700, color: factorSeverityColor(factor.severity) }}>
                    +{factor.contribution} pts
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '6px' }}>{factor.description}</div>
                <div className="risk-bar">
                  <div
                    className={`risk-bar-fill ${factor.severity}`}
                    style={{ width: `${(factor.contribution / 40) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {/* System Recommendation */}
            <div style={{
              marginTop: '16px', background: detail.riskLevel === 'critical' ? '#fef2f2' : detail.riskLevel === 'high' ? '#fff7ed' : '#eff6ff',
              borderRadius: '8px', padding: '14px 16px',
              border: `1px solid ${detail.riskLevel === 'critical' ? '#fca5a5' : detail.riskLevel === 'high' ? '#fdba74' : '#bfdbfe'}`
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} color={detail.riskLevel === 'critical' ? '#dc2626' : detail.riskLevel === 'high' ? '#ea580c' : '#1e40af'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#0f172a' }}>System Recommendation</div>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>{detail.recommendation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Demand Trend Chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div className="section-title">Demand Trend</div>
                <div className="section-subtitle">Last 7 days (simulated demo data)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendIcon size={16} color={trendColor} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: trendColor, textTransform: 'capitalize' }}>
                  {product.demandTrend}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  formatter={(v: number) => [`${v} units`, 'Demand']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="demand"
                  stroke={trendColor}
                  strokeWidth={2}
                  fill={`${trendColor}20`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column — Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Product Info */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '12px' }}>Product Info</div>
            {[
              { label: 'Last Updated', value: formatHoursAgo(product.lastUpdated) },
              { label: 'Demand Trend', value: product.demandTrend.charAt(0).toUpperCase() + product.demandTrend.slice(1) },
              { label: 'Store', value: product.storeId },
              { label: 'Unit', value: product.unit },
              { label: 'Price', value: `₹${product.price}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Actions Card */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '14px' }}>Smart Actions</div>

            {/* Update Stock */}
            {updateMode ? (
              <div style={{ marginBottom: '12px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
                  Update Stock Quantity
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  Current: {product.currentStock} units
                </div>
                <input
                  type="number"
                  className={`form-input ${newStockError ? 'error' : ''}`}
                  placeholder="New quantity"
                  value={newStock}
                  onChange={(e) => { setNewStock(e.target.value); setNewStockError(''); }}
                  min="0"
                  style={{ marginBottom: '6px' }}
                  autoFocus
                />
                {newStockError && <div className="text-error text-sm" style={{ marginBottom: '8px' }}>{newStockError}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={handleUpdateStock}>
                    <CheckCircle size={13} /> Update
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setUpdateMode(false); setNewStockError(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={handleConfirmStock}
              >
                <CheckCircle size={15} /> Confirm Stock
              </button>

              <button
                className="btn btn-ghost"
                style={{ justifyContent: 'center' }}
                onClick={() => { setUpdateMode(true); setNewStock(String(product.currentStock)); }}
              >
                <Edit3 size={15} /> Update Quantity
              </button>

              {product.availabilityStatus !== 'unavailable' ? (
                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: 'center', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => setConfirmDialog({ open: true, action: 'unavailable', label: 'Mark Unavailable' })}
                >
                  <XCircle size={15} /> Mark Unavailable
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setConfirmDialog({ open: true, action: 'available', label: 'Mark Available' })}
                >
                  <Play size={15} /> Mark Available
                </button>
              )}

              {product.availabilityStatus !== 'paused' ? (
                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setConfirmDialog({ open: true, action: 'pause', label: 'Pause Product' })}
                >
                  <Pause size={15} /> Pause Product
                </button>
              ) : (
                <button
                  className="btn btn-ghost"
                  style={{ justifyContent: 'center' }}
                  onClick={() => { markAvailable(product.id); showToast('success', 'Product Resumed', `${product.name} is now active.`); }}
                >
                  <Play size={15} /> Resume Product
                </button>
              )}
            </div>
          </div>

          {/* Substitutes */}
          {(product.availabilityStatus === 'unavailable' || substitutes.length > 0) && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: '12px' }}>
                {product.availabilityStatus === 'unavailable' ? 'Recommended Substitutes' : 'Available Substitutes'}
              </div>
              {substitutes.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>No substitutes configured for this product.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {substitutes.map(({ product: sub, matchScore, reason }) => (
                    <div
                      key={sub.id}
                      style={{
                        padding: '10px 12px', borderRadius: '8px',
                        background: '#f0fdf4', border: '1px solid #86efac',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/products/${sub.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{sub.name}</div>
                        <span style={{ fontSize: '10.5px', background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '2px 7px', borderRadius: '6px' }}>
                          {matchScore}% Match
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {sub.brand} · ₹{sub.price} · {sub.currentStock} units available
                      </div>
                      <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '3px' }}>
                        ✓ {reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Summary */}
          <div className="sim-banner">
            <RefreshCw size={13} />
            <span>
              Risk score auto-recalculates when you update stock, confirm, or change availability.
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.label}
        message={
          confirmDialog.action === 'unavailable'
            ? `Mark "${product.name}" as unavailable? This will hide it from customers until you reactivate it.`
            : confirmDialog.action === 'pause'
            ? `Pause "${product.name}"? It will not be visible to customers while paused.`
            : `Mark "${product.name}" as available? It will be visible to customers.`
        }
        confirmLabel={confirmDialog.label}
        variant={confirmDialog.action === 'unavailable' ? 'danger' : 'warning'}
        onConfirm={executeAction}
        onCancel={() => setConfirmDialog({ open: false, action: '', label: '' })}
      />
    </Layout>
  );
}
