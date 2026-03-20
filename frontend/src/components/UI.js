import React from 'react';

// ─── Button ─────────────────────────────────────────
export const Button = ({ children, variant = 'primary', fullWidth, loading, onClick, type = 'button', style }) => {
  const base = {
    height: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: '500',
    border: 'none', cursor: loading ? 'default' : 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: fullWidth ? '100%' : 'auto', padding: '0 24px',
    transition: 'all 0.15s', opacity: loading ? 0.7 : 1, ...style
  };
  const variants = {
    primary: { background: '#D4537E', color: '#fff' },
    secondary: { background: 'transparent', color: '#757575', border: '0.5px solid #e0e0e0' },
    danger: { background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #E24B4A' },
    ghost: { background: 'transparent', color: '#D4537E' }
  };
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{ ...base, ...variants[variant] }}>
      {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : children}
    </button>
  );
};

// ─── Input ──────────────────────────────────────────
export const Input = ({ label, value, onChange, placeholder, type = 'text', prefix, error, style }) => (
  <div style={{ marginBottom: '16px', ...style }}>
    {label && <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>{label}</div>}
    <div style={{
      height: '46px', borderRadius: '10px', border: `${error ? '1.5px solid #E24B4A' : '0.5px solid #e0e0e0'}`,
      background: error ? '#FCEBEB' : '#fff', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px'
    }}>
      {prefix && <span style={{ color: '#9e9e9e', borderRight: '0.5px solid #e0e0e0', paddingRight: '8px', fontSize: '13px' }}>{prefix}</span>}
      <input value={value} onChange={onChange} placeholder={placeholder} type={type}
        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', color: '#212121' }} />
    </div>
    {error && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>{error}</div>}
  </div>
);

// ─── Select ─────────────────────────────────────────
export const Select = ({ label, value, onChange, options = [], style }) => (
  <div style={{ marginBottom: '16px', ...style }}>
    {label && <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>{label}</div>}
    <select value={value} onChange={onChange}
      style={{
        width: '100%', height: '46px', borderRadius: '10px', border: '0.5px solid #e0e0e0',
        background: '#fff', padding: '0 12px', fontSize: '13px', color: '#212121', outline: 'none'
      }}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// ─── Toggle ─────────────────────────────────────────
export const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)}
    style={{
      width: '36px', height: '20px', borderRadius: '999px', cursor: 'pointer',
      background: value ? '#D4537E' : '#e0e0e0', position: 'relative', transition: 'background 0.2s'
    }}>
    <div style={{
      width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
      position: 'absolute', top: '2px', left: value ? '18px' : '2px', transition: 'left 0.2s'
    }} />
  </div>
);

// ─── Badge ──────────────────────────────────────────
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    critical: { background: '#FCEBEB', color: '#A32D2D' },
    medium: { background: '#FAEEDA', color: '#633806' },
    low: { background: '#E1F5EE', color: '#085041' },
    fulfilled: { background: '#E1F5EE', color: '#085041' },
    verified: { background: '#E1F5EE', color: '#085041' },
    pending: { background: '#FAEEDA', color: '#633806' },
    active: { background: '#FBEAF0', color: '#72243E' },
    default: { background: '#f0f0f0', color: '#616161' }
  };
  return (
    <span style={{
      display: 'inline-block', fontSize: '10px', padding: '2px 8px',
      borderRadius: '999px', fontWeight: '500', ...variants[variant]
    }}>
      {children}
    </span>
  );
};

// ─── Card ───────────────────────────────────────────
export const Card = ({ children, style, onClick }) => (
  <div onClick={onClick}
    style={{
      background: '#fff', borderRadius: '14px', padding: '16px',
      border: '0.5px solid #f0f0f0', marginBottom: '12px',
      cursor: onClick ? 'pointer' : 'default', ...style
    }}>
    {children}
  </div>
);

// ─── Progress Bar ────────────────────────────────────
export const ProgressBar = ({ value, max, color = '#D4537E' }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: '7px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.3s' }} />
    </div>
  );
};

// ─── Avatar ──────────────────────────────────────────
export const Avatar = ({ name = '', size = 40, color = '#D4537E' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: '600', color: '#fff', flexShrink: 0
    }}>
      {initials}
    </div>
  );
};

// ─── Section Header ──────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
    <div style={{ fontSize: '14px', fontWeight: '600', color: '#212121' }}>{title}</div>
    {action && <span onClick={onAction} style={{ fontSize: '12px', color: '#D4537E', cursor: 'pointer' }}>{action}</span>}
  </div>
);

// ─── Empty State ─────────────────────────────────────
export const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
    <div style={{ fontSize: '15px', fontWeight: '500', color: '#424242', marginBottom: '6px' }}>{title}</div>
    <div style={{ fontSize: '13px', color: '#9e9e9e' }}>{subtitle}</div>
  </div>
);

// ─── Spinner ─────────────────────────────────────────
export const Spinner = ({ size = 24, color = '#D4537E' }) => (
  <div style={{
    width: size, height: size, border: `2px solid #f0f0f0`,
    borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite'
  }} />
);

// CSS for animations
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
