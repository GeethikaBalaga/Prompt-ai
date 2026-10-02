// Login Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, ShieldAlert, ArrowRight, AlertCircle, Zap } from 'lucide-react';

export function LoginPage() {
  const { login, state } = useApp();
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeId.trim()) {
      setError('Please enter your Store ID.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const success = await login(storeId.trim(), password);
    setLoading(false);

    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('Incorrect Store ID or password. Try the demo account below.');
    }
  };

  const handleDemoLogin = async () => {
    setStoreId('store_demo');
    setPassword('demo123');
    setError('');
    setLoading(true);
    const success = await login('store_demo', 'demo123');
    setLoading(false);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleForgotPassword = () => {
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '48px', height: '48px', background: '#3b82f6',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldAlert size={26} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                NOVA CART
              </div>
              <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Smart Inventory
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: 800, color: 'white', lineHeight: '1.15', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Prevent the failed order<br />
            <span style={{ color: '#60a5fa' }}>before it happens.</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '440px' }}>
            Turn inventory uncertainty into actionable store intelligence. Detect high-risk products before they become cancelled orders.
          </p>
        </div>

        {/* Case Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '48px' }}>
          {[
            { stat: '29%', desc: 'of customers reported availability issues after ordering' },
            { stat: '35%', desc: 'of cancellations caused by product unavailability' },
            { stat: '39%', desc: 'of partner stores find online inventory too effort-heavy' },
          ].map(({ stat, desc }) => (
            <div key={stat} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '6px', padding: '4px 10px', fontWeight: 800,
                fontSize: '15px', color: '#60a5fa', whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {stat}
              </div>
              <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5', marginTop: '3px' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: '#475569', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
          NOVA CART Challenge Case Data · Prototype Demo Only
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-right">
        <div className="login-card">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              Store Manager Login
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Sign in to your Smart Inventory dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Error */}
            {error && (
              <div className="alert-message critical" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot Password Success */}
            {forgotSent && (
              <div className="alert-message success" style={{ marginBottom: '16px' }}>
                <span>Demo mode: Password reset link would be sent in a live system.</span>
              </div>
            )}

            {/* Store ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="storeId">Store ID</label>
              <input
                id="storeId"
                type="text"
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="e.g. store_demo"
                value={storeId}
                onChange={(e) => { setStoreId(e.target.value); setError(''); }}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${error ? 'error' : ''}`}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#1e40af' }}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1e40af', fontWeight: 600 }}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ justifyContent: 'center', marginBottom: '12px' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="btn btn-ghost btn-lg w-full"
              style={{ justifyContent: 'center', borderStyle: 'dashed' }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-dark" style={{ width: '16px', height: '16px' }} />
                  Loading demo...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Use Demo Account
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div style={{
            marginTop: '20px', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '12px 14px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Demo Credentials
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              Store ID: <strong style={{ color: '#0f172a' }}>store_demo</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              Password: <strong style={{ color: '#0f172a' }}>demo123</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              Fictional demo credentials — not real NOVA CART access
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '11px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6' }}>
            NOVA CART Smart Inventory · Competition Prototype<br />
            Demo data only — not a live production system
          </div>
        </div>
      </div>
    </div>
  );
}
