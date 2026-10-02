// Business Impact Dashboard Page
import { useApp } from '../context/AppContext';
import { Layout } from '../components/Layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';
import { Info, TrendingDown, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { computeBusinessImpact } from '../utils/riskEngine';

export function BusinessImpactPage() {
  const { state, setImpactParams } = useApp();
  const params = state.impactParams;

  const impact = computeBusinessImpact(params, {
    productsCorrected: state.productsCorrected,
    inventoryUpdates: state.inventoryUpdates,
  });

  const comparisonData = [
    {
      metric: 'Monthly Cancellations from Unavailability',
      before: impact.unavailabilityCancellations,
      after: impact.unavailabilityCancellations - impact.estimatedAvoidableCancellations,
    },
    {
      metric: 'Support Tickets (Unavailability)',
      before: impact.unavailabilityTickets,
      after: impact.unavailabilityTickets - impact.supportTicketsSaved,
    },
  ];

  const trendData = [
    { month: 'Apr', cancellations: 2310, tickets: 5900, accuracy: 71 },
    { month: 'May', cancellations: 2200, tickets: 5600, accuracy: 74 },
    { month: 'Jun', cancellations: 2000, tickets: 5200, accuracy: 77 },
    { month: 'Jul', cancellations: 1700, tickets: 4700, accuracy: 81 },
    { month: 'Aug', cancellations: 1300, tickets: 3900, accuracy: 86 },
    {
      month: 'Sep',
      cancellations: impact.unavailabilityCancellations - impact.estimatedAvoidableCancellations,
      tickets: impact.unavailabilityTickets - impact.supportTicketsSaved,
      accuracy: impact.inventoryAccuracyAfter,
    },
  ];

  const updateParam = (key: keyof typeof params, value: number) => {
    setImpactParams({ [key]: value });
  };

  return (
    <Layout title="Business Impact" subtitle="Transparent calculations — prototype simulation estimates">

      {/* Disclaimer Banner */}
      <div style={{
        background: '#fefce8', border: '1px solid #fde047', borderRadius: '10px',
        padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start'
      }}>
        <AlertTriangle size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#713f12', marginBottom: '4px' }}>
            Illustrative Prototype Simulation — Not Actual NOVA CART Results
          </div>
          <p style={{ fontSize: '12.5px', color: '#713f12', lineHeight: '1.6' }}>
            The "After" estimates below are prototype simulation values based on user-adjustable assumptions. They do not represent real measured business improvements.
            Base figures (monthly orders: 38,500, cancellation rate: 11%, unavailability contribution: 35%) are from the NOVA CART Challenge Case Data brief.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Case Data KPIs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                <span className="badge badge-info" style={{ marginRight: '8px' }}>Case Data</span>
                Current Baseline Metrics
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>NOVA CART Challenge Brief</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Monthly Orders', value: params.monthlyOrders.toLocaleString(), unit: '', color: '#1e40af' },
                { label: 'Cancellation Rate', value: `${params.cancellationRate}%`, unit: '(up from 6%)', color: '#ea580c' },
                { label: 'Total Cancellations/mo', value: impact.totalMonthlyCancellations.toLocaleString(), unit: '', color: '#dc2626' },
                { label: 'Unavailability Cancellations', value: impact.unavailabilityCancellations.toLocaleString(), unit: '/month', color: '#dc2626' },
                { label: 'Revenue at Risk', value: `₹${(impact.revenueAtRisk / 100000).toFixed(1)}L`, unit: '/month', color: '#ea580c' },
                { label: 'Support Tickets/mo', value: (5900).toLocaleString(), unit: '(up from 3,100)', color: '#ea580c' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  {unit && <div className="kpi-sub">{unit}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Impact KPIs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                <span className="badge badge-low" style={{ marginRight: '8px' }}>Prototype Estimate</span>
                Simulated Impact After Intervention
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Based on adjustable assumptions below</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Est. Cancellations Avoided', value: impact.estimatedAvoidableCancellations.toLocaleString(), color: '#16a34a', icon: CheckCircle },
                { label: 'Support Tickets Saved', value: impact.supportTicketsSaved.toLocaleString(), color: '#16a34a', icon: CheckCircle },
                { label: 'Potential Revenue Saved', value: `₹${(impact.potentialRecovery / 100000).toFixed(1)}L`, color: '#16a34a', icon: CheckCircle },
                { label: 'Promo Spend Protected', value: `₹${(impact.promoSpendProtected / 100000).toFixed(1)}L`, color: '#16a34a', icon: CheckCircle },
                { label: 'Inventory Accuracy (Estimated)', value: `${impact.inventoryAccuracyAfter}%`, color: '#1e40af', icon: TrendingDown },
                { label: 'Products Corrected (This Session)', value: state.productsCorrected.toLocaleString(), color: '#1e40af', icon: CheckCircle },
                { label: 'Inventory Updates (This Session)', value: state.inventoryUpdates.toLocaleString(), color: '#1e40af', icon: CheckCircle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="kpi-card low">
                  <div className="kpi-label">
                    <Icon size={13} color={color} style={{ marginRight: '6px', verticalAlign: '-1px', display: 'inline-block' }} />
                    {label}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Before vs After Chart */}
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <div className="section-title">Before vs After Simulation</div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Illustrative prototype estimates — not actual measured results
              </p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="metric" tick={{ fontSize: 10 }} width={220} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend formatter={(v) => <span style={{ fontSize: '12px' }}>{v}</span>} />
                <Bar dataKey="before" name="Current State" fill="#ea580c" radius={[0, 4, 4, 0]} />
                <Bar dataKey="after" name="After Simulation (Estimate)" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend Chart */}
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <div className="section-title">Projected Improvement Trend</div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Illustrative 6-month improvement projection — prototype simulation only
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend formatter={(v) => <span style={{ fontSize: '12px' }}>{v}</span>} />
                <Line type="monotone" dataKey="cancellations" name="Unavailability Cancellations" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="tickets" name="Support Tickets" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Calculation Transparency */}
          <div className="card">
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Info size={15} color="#1e40af" />
                <span className="section-title">How These Numbers Are Calculated</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Fully transparent — no hidden assumptions</p>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12.5px', lineHeight: '1.8', color: '#374151', background: '#f8fafc', borderRadius: '8px', padding: '16px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '8px' }}>// Case Data from NOVA CART Challenge Brief</div>
              <div>Monthly Orders = <strong>{params.monthlyOrders.toLocaleString()}</strong></div>
              <div>Cancellation Rate = <strong>{params.cancellationRate}%</strong></div>
              <div>Unavailability % of Cancellations = <strong>{params.unavailabilityContribution}%</strong></div>
              <div style={{ margin: '8px 0', color: '#94a3b8' }}>// Calculations</div>
              <div>Total Monthly Cancellations = {params.monthlyOrders.toLocaleString()} × {params.cancellationRate}% = <strong>{impact.totalMonthlyCancellations.toLocaleString()}</strong></div>
              <div>Unavailability Cancellations = {impact.totalMonthlyCancellations.toLocaleString()} × {params.unavailabilityContribution}% = <strong>{impact.unavailabilityCancellations.toLocaleString()}</strong></div>
              <div style={{ margin: '8px 0', color: '#94a3b8' }}>// Prototype Assumption</div>
              <div>Improvement Assumption = <strong>{params.accuracyImprovementAssumption}%</strong></div>
              <div>Estimated Avoidable Cancellations = {impact.unavailabilityCancellations.toLocaleString()} × {params.accuracyImprovementAssumption}% = <strong style={{ color: '#16a34a' }}>{impact.estimatedAvoidableCancellations.toLocaleString()}</strong></div>
              <div>Potential Revenue Recovery = {impact.estimatedAvoidableCancellations.toLocaleString()} × ₹486 = <strong style={{ color: '#16a34a' }}>₹{impact.potentialRecovery.toLocaleString()}</strong></div>
              <div>Customer Retention Promo Spend Protected = ₹7,50,000 × {params.accuracyImprovementAssumption}% = <strong style={{ color: '#16a34a' }}>₹{impact.promoSpendProtected.toLocaleString()}</strong></div>
            </div>
          </div>
        </div>

        {/* Right Column — Assumption Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div style={{ marginBottom: '14px' }}>
              <div className="section-title">Adjust Assumptions</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Change values to explore different scenarios
              </p>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '18px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Quick Scenario Presets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { label: '🎯 10% Cons.', pct: 10 },
                  { label: '🚀 20% Target', pct: 20 },
                  { label: '⭐ 35% Optim.', pct: 35 },
                ].map((s) => (
                  <button
                    key={s.pct}
                    className="btn btn-sm"
                    style={{
                      fontSize: '11px', padding: '6px 2px',
                      background: params.accuracyImprovementAssumption === s.pct ? '#eff6ff' : 'white',
                      borderColor: params.accuracyImprovementAssumption === s.pct ? '#3b82f6' : '#cbd5e1',
                      color: params.accuracyImprovementAssumption === s.pct ? '#1e40af' : '#475569',
                      fontWeight: params.accuracyImprovementAssumption === s.pct ? 700 : 500,
                    }}
                    onClick={() => updateParam('accuracyImprovementAssumption', s.pct)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {[
              { key: 'monthlyOrders', label: 'Monthly Orders', min: 10000, max: 100000, step: 500, suffix: '' },
              { key: 'cancellationRate', label: 'Cancellation Rate (%)', min: 1, max: 30, step: 1, suffix: '%' },
              { key: 'unavailabilityContribution', label: 'Unavailability % of Cancellations', min: 10, max: 60, step: 1, suffix: '%' },
              { key: 'accuracyImprovementAssumption', label: 'Assumed Improvement (%)', min: 5, max: 50, step: 5, suffix: '%' },
            ].map(({ key, label, min, max, step, suffix }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {key === 'monthlyOrders' ? params[key as keyof typeof params].toLocaleString() : params[key as keyof typeof params]}{suffix}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={params[key as keyof typeof params]}
                  onChange={(e) => updateParam(key as keyof typeof params, Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#1e40af' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                  <span>{min}{suffix}</span>
                  <span>{max}{suffix}</span>
                </div>
              </div>
            ))}

            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => {
                setImpactParams({
                  monthlyOrders: 38500,
                  cancellationRate: 11,
                  unavailabilityContribution: 35,
                  accuracyImprovementAssumption: 20,
                });
              }}
            >
              <RotateCcw size={12} /> Reset to Case Baseline
            </button>
          </div>

          {/* Context */}
          <div className="card">
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              Source Reference
            </div>
            {[
              { label: 'Registered Users', value: '1,20,000' },
              { label: 'Monthly Active Users', value: '46,000' },
              { label: 'Monthly Revenue', value: '₹26.1 Lakh' },
              { label: 'Avg Order Value', value: '₹486' },
              { label: 'Monthly Promo Spend', value: '₹17 Lakh' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 700 }}>{value}</span>
              </div>
            ))}
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px' }}>
              Source: NOVA CART Business Challenge Brief (case data)
            </div>
          </div>

          <div className="sim-banner">
            <AlertTriangle size={13} />
            <span>All "After" values are <strong>Prototype Estimates</strong> — not actual NOVA CART results.</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
