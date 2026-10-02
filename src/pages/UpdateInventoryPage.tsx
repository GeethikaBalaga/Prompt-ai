// Update Inventory Page — bulk and per-product stock updates
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { CheckCircle, Edit3, Save, X, AlertTriangle } from 'lucide-react';
import { getRiskBadgeClass, getRiskLevelLabel, formatHoursAgo } from '../utils/helpers';
import { buildRiskDetail } from '../utils/riskEngine';

export function UpdateInventoryPage() {
  const { state, updateStock, confirmStock, showToast } = useApp();
  const navigate = useNavigate();

  // Editable state: productId -> new quantity string
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Focus only on products that need attention
  const atRiskProducts = state.products
    .filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical' || p.riskLevel === 'medium')
    .sort((a, b) => b.riskScore - a.riskScore);

  const handleEdit = (productId: string, value: string) => {
    setEdits((prev) => ({ ...prev, [productId]: value }));
    setEditErrors((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleSave = async (productId: string) => {
    const val = parseInt(edits[productId] ?? '', 10);
    if (isNaN(val) || val < 0) {
      setEditErrors((prev) => ({ ...prev, [productId]: 'Enter a valid quantity (0 or more)' }));
      return;
    }
    setSaving(productId);
    await new Promise((r) => setTimeout(r, 500));
    updateStock(productId, val);
    const product = state.products.find((p) => p.id === productId);
    showToast('success', 'Inventory Updated', `${product?.name} stock set to ${val} units.`);
    setEdits((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    setSaving(null);
  };

  const handleConfirm = (productId: string) => {
    confirmStock(productId);
    const product = state.products.find((p) => p.id === productId);
    showToast('success', 'Stock Confirmed', `${product?.name} inventory confirmed as accurate.`);
  };

  const handleCancel = (productId: string) => {
    setEdits((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    setEditErrors((prev) => { const next = { ...prev }; delete next[productId]; return next; });
  };

  return (
    <Layout
      title="Update Inventory"
      subtitle={`Update stock quantities and confirm inventory accuracy · ${atRiskProducts.length} products need attention`}
    >
      <div className="sim-banner" style={{ marginBottom: '16px' }}>
        <AlertTriangle size={13} />
        <span>
          Showing <strong>{atRiskProducts.length} products</strong> with medium, high, or critical risk. Updating stock recalculates the risk score in real time.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {atRiskProducts.map((product) => {
          const detail = buildRiskDetail(product);
          const isEditing = edits[product.id] !== undefined;
          const isSaving = saving === product.id;

          return (
            <div
              key={product.id}
              className="card"
              style={{
                borderLeft: `4px solid ${product.riskLevel === 'critical' ? '#dc2626' : product.riskLevel === 'high' ? '#ea580c' : '#ca8a04'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* Product Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{ fontWeight: 700, fontSize: '14px', cursor: 'pointer', color: '#0f172a' }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {product.name}
                    </span>
                    <span className={getRiskBadgeClass(product.riskLevel)}>
                      {getRiskLevelLabel(product.riskLevel)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {product.brand} · {product.category} · Last updated {formatHoursAgo(product.lastUpdated)}
                  </div>
                </div>

                {/* Stock Info */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Current Stock', value: `${product.currentStock} units`, alert: product.currentStock <= 3 },
                    { label: 'Avg Demand', value: `${product.avgDailyDemand}/day` },
                    { label: 'Risk Score', value: `${detail.riskScore}/100`, alert: detail.riskScore >= 50 },
                  ].map(({ label, value, alert }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: alert ? '#dc2626' : '#0f172a' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Edit / Actions */}
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div>
                      <input
                        type="number"
                        className={`form-input ${editErrors[product.id] ? 'error' : ''}`}
                        value={edits[product.id]}
                        onChange={(e) => handleEdit(product.id, e.target.value)}
                        min="0"
                        style={{ width: '100px' }}
                        placeholder="Qty"
                        autoFocus
                      />
                      {editErrors[product.id] && (
                        <div className="text-error text-sm" style={{ marginTop: '4px' }}>{editErrors[product.id]}</div>
                      )}
                    </div>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleSave(product.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : <Save size={13} />}
                      Save
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(product.id)}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleEdit(product.id, String(product.currentStock))}
                    >
                      <Edit3 size={13} /> Update Qty
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleConfirm(product.id)}
                    >
                      <CheckCircle size={13} /> Confirm Stock
                    </button>
                  </div>
                )}
              </div>

              {/* Risk description */}
              <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <strong>Why risky:</strong> {detail.factors[0].description}
                {detail.factors[1] && <span> · {detail.factors[1].description}</span>}
              </div>
            </div>
          );
        })}

        {atRiskProducts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">All products are low risk!</div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>No inventory updates needed right now.</p>
          </div>
        )}

        {/* Inventory Audit Trail / Session History */}
        <div className="card" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div className="section-title">Session Inventory Activity Log</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Recent stock updates and confirmations recorded during this store session
              </p>
            </div>
            <span className="badge badge-info">{state.updateHistory.length} Recorded</span>
          </div>

          {state.updateHistory.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>
              No inventory adjustments recorded in this session yet. Updates you make above will appear here with an audit timestamp.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.updateHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a', marginRight: '8px' }}>{item.productName}</span>
                    <span style={{ color: '#64748b' }}>by {item.updatedBy}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      <span style={{ color: '#dc2626' }}>{item.previousStock}</span>
                      <span style={{ color: '#94a3b8', margin: '0 4px' }}>→</span>
                      <span style={{ color: '#16a34a' }}>{item.newStock} units</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatHoursAgo(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
