// Customer Availability Simulator Page
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { ShoppingCart, CheckCircle, AlertCircle, Search, Zap } from 'lucide-react';
import { getAvailabilityLabel, getRiskLevelLabel } from '../utils/helpers';
import { buildRiskDetail, getSubstitutes } from '../utils/riskEngine';

function AvailabilityConfidenceBar({ score }: { score: number }) {
  const confidence = Math.max(0, 100 - score);
  const confLabel = confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : confidence >= 40 ? 'Low' : 'Very Low';
  const confColor = confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#ca8a04' : '#dc2626';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: '#64748b' }}>Availability Confidence</span>
        <span style={{ fontWeight: 700, color: confColor }}>{confLabel} ({confidence}%)</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${confidence}%`, background: confColor }}
        />
      </div>
    </div>
  );
}

function CustomerCard({ productId }: { productId: string }) {
  const { state, updateStock, markUnavailable, markAvailable, showToast } = useApp();
  const product = state.products.find((p) => p.id === productId);

  if (!product) return null;

  const detail = buildRiskDetail(product);
  const substitutes = getSubstitutes(product, state.products);
  const confidence = Math.max(0, 100 - detail.riskScore);
  const confLabel = confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : confidence >= 40 ? 'Low' : 'Very Low';

  const statusIcon = product.availabilityStatus === 'available' || product.availabilityStatus === 'low_stock'
    ? <CheckCircle size={18} color={product.availabilityStatus === 'available' ? '#16a34a' : '#ca8a04'} />
    : <AlertCircle size={18} color="#dc2626" />;

  const warningMsg = detail.riskScore >= 75
    ? 'Warning: Inventory may be inaccurate. Customer could face unavailability after ordering.'
    : detail.riskScore >= 50
    ? 'Caution: Some inventory uncertainty detected. Update stock to improve confidence.'
    : detail.riskScore >= 25
    ? 'Inventory data is moderately fresh. Consider updating for best accuracy.'
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Customer-Facing Preview */}
      <div style={{
        background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px',
        overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}>
        {/* App Header */}
        <div style={{ background: '#1e40af', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={16} color="white" />
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>NOVA CART</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#93c5fd' }}>Customer App Preview</span>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Product */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a', marginBottom: '4px' }}>{product.name}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{product.brand} · {product.category}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>₹{product.price}</div>
            </div>
            <div style={{
              width: '70px', height: '70px', background: '#f1f5f9', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px'
            }}>
              {product.category === 'Dairy' || product.category === 'Dairy & Eggs' ? '🥛' :
               product.category === 'Bakery' ? '🍞' :
               product.category === 'Fruits & Vegetables' ? '🛒' :
               product.category === 'Staples' ? '🌾' :
               product.category === 'Personal Care' ? '🧴' :
               product.category === 'Snacks' ? '🍪' : '📦'}
            </div>
          </div>

          {/* Availability Status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
            borderRadius: '10px', marginBottom: '12px',
            background: product.availabilityStatus === 'available' ? '#f0fdf4' :
                        product.availabilityStatus === 'low_stock' ? '#fff7ed' : '#fef2f2',
            border: `1px solid ${product.availabilityStatus === 'available' ? '#86efac' : product.availabilityStatus === 'low_stock' ? '#fdba74' : '#fca5a5'}`
          }}>
            {statusIcon}
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                {product.availabilityStatus === 'available' ? 'Available' :
                 product.availabilityStatus === 'low_stock' ? 'Low Stock' :
                 product.availabilityStatus === 'unavailable' ? 'Unavailable' : 'Temporarily Unavailable'}
              </div>
              {product.availabilityStatus === 'available' && product.currentStock > 0 && (
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '1px' }}>
                  {product.currentStock <= 5 ? `Only ${product.currentStock} left` : 'In stock'}
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Availability Confidence</div>
              <div style={{ fontWeight: 700, color: confLabel === 'High' ? '#16a34a' : confLabel === 'Medium' ? '#ca8a04' : '#dc2626', fontSize: '13px' }}>
                {confLabel}
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          <AvailabilityConfidenceBar score={detail.riskScore} />

          {/* Warning */}
          {warningMsg && (
            <div className="alert-message warning" style={{ marginTop: '12px', fontSize: '12px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Substitutes if unavailable */}
          {product.availabilityStatus === 'unavailable' && substitutes.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Available at Another Store or Alternatives:
              </div>
              {substitutes.map(({ product: sub, matchScore, reason }) => (
                <div key={sub.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: '8px',
                  background: '#f0fdf4', border: '1px solid #86efac', marginBottom: '6px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{sub.name}</span>
                      <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>
                        {matchScore}% Match
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sub.brand} · ₹{sub.price} · {reason}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>Available</div>
                </div>
              ))}

              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', marginBottom: '3px' }}>Available at Nearby Store</div>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>FreshMart – Hyderabad (0.8 km)</div>
                <div style={{ fontSize: '11px', color: '#60a5fa' }}>Est. delivery: 12–15 min</div>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          {product.availabilityStatus !== 'unavailable' && (
            <button style={{
              width: '100%', marginTop: '16px', padding: '12px', borderRadius: '10px',
              background: '#1e40af', color: 'white', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <ShoppingCart size={16} /> Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Store Manager Panel */}
      <div className="card" style={{ borderLeft: '4px solid #1e40af' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Store Manager Controls
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
          Actions taken here update the customer-facing availability above.
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {product.availabilityStatus !== 'unavailable' && (
            <button
              className="btn btn-sm"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
              onClick={() => { markUnavailable(product.id); showToast('info', 'Marked Unavailable', `${product.name} hidden from customers.`); }}
            >
              Mark Unavailable
            </button>
          )}
          {product.availabilityStatus === 'unavailable' && (
            <button
              className="btn btn-sm btn-success"
              onClick={() => { markAvailable(product.id); showToast('success', 'Back in Stock', `${product.name} is now visible to customers.`); }}
            >
              Mark Available
            </button>
          )}
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              const qty = product.currentStock + 10;
              updateStock(product.id, qty);
              showToast('success', 'Stock Updated', `${product.name} updated to ${qty} units. Confidence improved.`);
            }}
          >
            <Zap size={13} /> Quick Restock (+10)
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomerAvailabilityPage() {
  const { state } = useApp();
  const [selectedProductId, setSelectedProductId] = useState(
    state.products.find((p) => p.riskLevel === 'critical')?.id || state.products[0]?.id || ''
  );
  const [search, setSearch] = useState('');

  const filtered = state.products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout
      title="Customer Availability"
      subtitle="Preview how inventory changes affect what customers see on the NOVA CART app"
    >
      <div className="sim-banner" style={{ marginBottom: '20px' }}>
        <ShoppingCart size={13} />
        <span>
          <strong>Customer Availability Simulator</strong> — Changes you make to inventory, availability, or stock are instantly reflected in the customer preview panel.
          This is a prototype simulation, not a live customer-facing view.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Product Selector */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
            Select Product
          </div>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="form-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '13px', padding: '8px 8px 8px 32px' }}
            />
          </div>
          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '7px',
                  background: selectedProductId === p.id ? '#eff6ff' : 'none',
                  border: selectedProductId === p.id ? '1px solid #bfdbfe' : '1px solid transparent',
                  cursor: 'pointer', fontSize: '13px'
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '10px',
                    background: p.riskLevel === 'critical' ? '#fef2f2' : p.riskLevel === 'high' ? '#fff7ed' : p.riskLevel === 'medium' ? '#fefce8' : '#f0fdf4',
                    color: p.riskLevel === 'critical' ? '#dc2626' : p.riskLevel === 'high' ? '#ea580c' : p.riskLevel === 'medium' ? '#ca8a04' : '#16a34a'
                  }}>
                    {getRiskLevelLabel(p.riskLevel)}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '10px',
                    background: p.availabilityStatus === 'available' ? '#f0fdf4' : p.availabilityStatus === 'low_stock' ? '#fff7ed' : '#fef2f2',
                    color: p.availabilityStatus === 'available' ? '#16a34a' : p.availabilityStatus === 'low_stock' ? '#ea580c' : '#dc2626'
                  }}>
                    {getAvailabilityLabel(p.availabilityStatus)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        {selectedProductId && <CustomerCard productId={selectedProductId} />}
      </div>
    </Layout>
  );
}
