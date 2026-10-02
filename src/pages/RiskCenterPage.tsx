// Inventory Risk Center Page
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { Search, SlidersHorizontal, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { getRiskBadgeClass, getRiskLevelLabel, getAvailabilityBadgeClass, getAvailabilityLabel, formatHoursAgo, formatCoverage, getTrendIcon } from '../utils/helpers';
import { buildRiskDetail, stockCoverageDays } from '../utils/riskEngine';
import type { RiskLevel, AvailabilityStatus } from '../types';

type SortKey = 'riskScore' | 'currentStock' | 'lastUpdated' | 'name' | 'stockCoverage';

export function RiskCenterPage() {
  const { state } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(state.products.map((p) => p.category)));
    return ['all', ...cats.sort()];
  }, [state.products]);

  const filtered = useMemo(() => {
    let list = [...state.products];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') list = list.filter((p) => p.category === categoryFilter);
    if (riskFilter !== 'all') list = list.filter((p) => p.riskLevel === riskFilter);
    if (availabilityFilter !== 'all') list = list.filter((p) => p.availabilityStatus === availabilityFilter);

    list.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case 'riskScore': va = a.riskScore; vb = b.riskScore; break;
        case 'currentStock': va = a.currentStock; vb = b.currentStock; break;
        case 'lastUpdated': va = new Date(a.lastUpdated).getTime(); vb = new Date(b.lastUpdated).getTime(); break;
        case 'name': va = a.name; vb = b.name; break;
        case 'stockCoverage':
          va = stockCoverageDays(a.currentStock, a.avgDailyDemand);
          vb = stockCoverageDays(b.currentStock, b.avgDailyDemand);
          break;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [state.products, search, categoryFilter, riskFilter, availabilityFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
    >
      {label}
      <ArrowUpDown size={11} style={{ opacity: sortKey === k ? 1 : 0.4 }} />
    </button>
  );

  const getRecommendedAction = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'Verify Stock Now';
      case 'high':     return 'Update Quantity';
      case 'medium':   return 'Monitor & Update';
      case 'low':      return 'No Action Needed';
    }
  };

  return (
    <Layout
      title="Inventory Risk Center"
      subtitle="Identify and act on high-risk products before they cause failed orders"
    >
      {/* Summary Banner */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { label: 'Critical', count: state.products.filter(p => p.riskLevel === 'critical').length, color: '#dc2626', bg: '#fef2f2' },
          { label: 'High Risk', count: state.products.filter(p => p.riskLevel === 'high').length, color: '#ea580c', bg: '#fff7ed' },
          { label: 'Medium Risk', count: state.products.filter(p => p.riskLevel === 'medium').length, color: '#ca8a04', bg: '#fefce8' },
          { label: 'Low Risk', count: state.products.filter(p => p.riskLevel === 'low').length, color: '#16a34a', bg: '#f0fdf4' },
        ].map(({ label, count, color, bg }) => (
          <div
            key={label}
            style={{
              background: bg, border: `1px solid ${color}30`, borderRadius: '8px',
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              flex: '1', minWidth: '100px'
            }}
            onClick={() => setRiskFilter(label.toLowerCase().split(' ')[0] as RiskLevel | 'all')}
          >
            <span style={{ fontSize: '24px', fontWeight: 800, color }}>{count}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <select className="form-select" style={{ width: 'auto' }} value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}>
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityStatus | 'all')}>
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="low_stock">Low Stock</option>
            <option value="unavailable">Unavailable</option>
            <option value="paused">Paused</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
            <SlidersHorizontal size={13} />
            {filtered.length} of {state.products.length} products
          </div>
        </div>
      </div>

      {/* Model Explanation */}
      <div className="sim-banner" style={{ marginBottom: '16px' }}>
        <AlertTriangle size={14} />
        <span>
          <strong>Prototype Rule-Based Risk Model</strong> — Scores calculated using inventory freshness, stock coverage, demand velocity and historical stock-out signals. Not a trained ML model.
        </span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th><SortBtn k="name" label="Product" /></th>
              <th>Category</th>
              <th><SortBtn k="currentStock" label="Current Stock" /></th>
              <th>Avg Daily Demand</th>
              <th><SortBtn k="stockCoverage" label="Stock Coverage" /></th>
              <th><SortBtn k="lastUpdated" label="Last Updated" /></th>
              <th><SortBtn k="riskScore" label="Risk Score" /></th>
              <th>Risk Level</th>
              <th>Availability</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No products match your filters</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const detail = buildRiskDetail(product);
                const coverage = stockCoverageDays(product.currentStock, product.avgDailyDemand);
                return (
                  <tr key={product.id} onClick={() => navigate(`/products/${product.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{product.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{product.brand}</div>
                    </td>
                    <td>
                      <span className="chip">{product.category}</span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: product.currentStock === 0 ? '#dc2626' : product.currentStock <= 3 ? '#ea580c' : '#0f172a'
                      }}>
                        {product.currentStock}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>units</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{product.avgDailyDemand}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>/day</span>
                      <span className={`trend-${product.demandTrend === 'increasing' ? 'up' : product.demandTrend === 'decreasing' ? 'down' : 'stable'}`} style={{ marginLeft: '4px', fontSize: '12px' }}>
                        {getTrendIcon(product.demandTrend)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: coverage < 1 ? '#dc2626' : coverage < 2 ? '#ea580c' : coverage < 3 ? '#ca8a04' : '#16a34a'
                      }}>
                        {formatCoverage(coverage)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatHoursAgo(product.lastUpdated)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 800, fontSize: '14px',
                          color: detail.riskScore >= 75 ? '#dc2626' : detail.riskScore >= 50 ? '#ea580c' : detail.riskScore >= 25 ? '#ca8a04' : '#16a34a'
                        }}>
                          {detail.riskScore}
                        </span>
                        <div style={{ width: '40px' }}>
                          <div className="risk-bar">
                            <div
                              className={`risk-bar-fill ${product.riskLevel}`}
                              style={{ width: `${detail.riskScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getRiskBadgeClass(product.riskLevel)}>
                        {getRiskLevelLabel(product.riskLevel)}
                      </span>
                    </td>
                    <td>
                      <span className={getAvailabilityBadgeClass(product.availabilityStatus)}>
                        {getAvailabilityLabel(product.availabilityStatus)}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${product.riskLevel === 'critical' || product.riskLevel === 'high' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                      >
                        {getRecommendedAction(product.riskLevel)}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
