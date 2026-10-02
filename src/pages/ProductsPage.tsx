// Products List Page
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { Search, Filter } from 'lucide-react';
import { getRiskBadgeClass, getRiskLevelLabel, getAvailabilityBadgeClass, getAvailabilityLabel, formatHoursAgo, formatCoverage } from '../utils/helpers';
import { stockCoverageDays } from '../utils/riskEngine';

export function ProductsPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(state.products.map((p) => p.category)));
    return ['all', ...cats.sort()];
  }, [state.products]);

  const filtered = useMemo(() => {
    let list = [...state.products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') list = list.filter((p) => p.category === categoryFilter);
    return list.sort((a, b) => b.riskScore - a.riskScore);
  }, [state.products, search, categoryFilter]);

  return (
    <Layout title="Products" subtitle={`All ${state.products.length} products in FreshMart – Hyderabad`}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
          <Filter size={13} />
          {filtered.length} products
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {filtered.map((product) => {
          const coverage = stockCoverageDays(product.currentStock, product.avgDailyDemand);
          return (
            <div
              key={product.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'box-shadow 0.15s', borderTop: `3px solid ${product.riskLevel === 'critical' ? '#dc2626' : product.riskLevel === 'high' ? '#ea580c' : product.riskLevel === 'medium' ? '#ca8a04' : '#16a34a'}` }}
              onClick={() => navigate(`/products/${product.id}`)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{product.brand} · {product.category}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={getRiskBadgeClass(product.riskLevel)}>
                    {getRiskLevelLabel(product.riskLevel)}
                  </span>
                  <span className={getAvailabilityBadgeClass(product.availabilityStatus)}>
                    {getAvailabilityLabel(product.availabilityStatus)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Stock', value: `${product.currentStock} units` },
                  { label: 'Demand', value: `${product.avgDailyDemand}/day` },
                  { label: 'Coverage', value: formatCoverage(coverage) },
                  { label: 'Price', value: `₹${product.price}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px 10px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Risk Score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontWeight: 800, color: product.riskScore >= 75 ? '#dc2626' : product.riskScore >= 50 ? '#ea580c' : product.riskScore >= 25 ? '#ca8a04' : '#16a34a' }}>
                      {product.riskScore}
                    </span>
                    <div className="risk-bar" style={{ width: '60px' }}>
                      <div className={`risk-bar-fill ${product.riskLevel}`} style={{ width: `${product.riskScore}%` }} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatHoursAgo(product.lastUpdated)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
