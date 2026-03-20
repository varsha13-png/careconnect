import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, loginDonor } from '../services/api';
import { Button, Input } from '../components/UI';
import toast from 'react-hot-toast';

const Logo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#D4537E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M12 21C12 21 4 14 4 9a8 8 0 0116 0c0 5-8 12-8 12z"/>
        <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/>
      </svg>
    </div>
    <div style={{ fontSize: '22px', fontWeight: '700', color: '#212121' }}>Care Connect</div>
    <div style={{ fontSize: '13px', color: '#9e9e9e', marginTop: '4px' }}>Dignity. Care. Community.</div>
  </div>
);

const ROLES = [
  { val: 'authority', icon: '🏠', label: 'Authority', sub: 'Home administrator', color: '#FBEAF0', border: '#ED93B1', textColor: '#72243E' },
  { val: 'care_worker', icon: '👩‍⚕️', label: 'Care worker', sub: 'Home staff member', color: '#E6F1FB', border: '#85B7EB', textColor: '#0C447C' },
  { val: 'donor', icon: '💝', label: 'Donor', sub: 'Supporter / Volunteer', color: '#E1F5EE', border: '#5DCAA5', textColor: '#085041' },
  { val: 'govt_official', icon: '🏛️', label: 'Govt / NGO', sub: 'Official representative', color: '#f8f8f8', border: '#e0e0e0', textColor: '#616161' }
];

export default function LoginPage() {
  const [screen, setScreen] = useState('select'); // select | login
  const [selectedRole, setSelectedRole] = useState(null);
  const [method, setMethod] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setScreen('login');
  };

  const handleLogin = async () => {
    if (!password) return toast.error('Enter your password');
    setLoading(true);
    try {
      const data = method === 'email' ? { email, password } : { phone, password };
      const res = selectedRole === 'donor' ? await loginDonor(data) : await loginUser(data);
      const backendRole = res.data.data.role;
      const userData = { ...res.data.data, role: backendRole };
      login(res.data.token, userData);
      toast.success(`Welcome back, ${userData.name}!`);
      if (backendRole === 'authority') navigate('/dashboard');
      else if (backendRole === 'care_worker') navigate('/alerts');
      else if (backendRole === 'donor') navigate('/browse');
      else if (backendRole === 'govt_official') navigate('/govt');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const roleInfo = ROLES.find(r => r.val === selectedRole);

  // ── Role selection screen ──────────────────────────────
  if (screen === 'select') return (
    <div style={{ minHeight: '100vh', background: '#f9f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(212,83,126,0.08)' }}>
        <Logo />

        <div style={{ fontSize: '16px', fontWeight: '600', color: '#212121', marginBottom: '6px', textAlign: 'center' }}>Who are you?</div>
        <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '24px', textAlign: 'center' }}>Select your role to continue</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {ROLES.map(role => (
            <div key={role.val} onClick={() => handleSelectRole(role.val)}
              style={{ background: role.color, border: `1.5px solid ${role.border}`, borderRadius: '14px', padding: '16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{role.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: role.textColor, marginBottom: '3px' }}>{role.label}</div>
              <div style={{ fontSize: '10px', color: role.textColor, opacity: 0.75 }}>{role.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9e9e9e' }}>New here? </span>
          <span onClick={() => navigate('/register')} style={{ fontSize: '13px', color: '#D4537E', cursor: 'pointer', fontWeight: '600' }}>Create account</span>
        </div>
      </div>
    </div>
  );

  // ── Login form screen ──────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f9f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(212,83,126,0.08)' }}>
        <Logo />

        {/* Selected role card */}
        <div onClick={() => setScreen('select')}
          style={{ background: roleInfo?.color, border: `1.5px solid ${roleInfo?.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <span style={{ fontSize: '24px' }}>{roleInfo?.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: roleInfo?.textColor }}>{roleInfo?.label}</div>
            <div style={{ fontSize: '11px', color: roleInfo?.textColor, opacity: 0.75 }}>{roleInfo?.sub}</div>
          </div>
          <span style={{ fontSize: '11px', color: roleInfo?.textColor, opacity: 0.6 }}>Change ›</span>
        </div>

        {/* Method toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[{ val: 'phone', label: 'Phone' }, { val: 'email', label: 'Email' }].map(m => (
            <button key={m.val} onClick={() => setMethod(m.val)}
              style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', border: `1.5px solid ${method === m.val ? '#D4537E' : '#e0e0e0'}`, background: method === m.val ? '#FBEAF0' : 'transparent', color: method === m.val ? '#72243E' : '#9e9e9e', fontWeight: method === m.val ? '500' : '400' }}>
              {m.label}
            </button>
          ))}
        </div>

        {method === 'phone'
          ? <Input label="Phone number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" prefix="+91" />
          : <Input label="Email address" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
        }
        <Input label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" type="password" />

        <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: '#D4537E', cursor: 'pointer' }}>Forgot password?</span>
        </div>

        <Button fullWidth loading={loading} onClick={handleLogin}>Login as {roleInfo?.label}</Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#f0f0f0' }} />
          <span style={{ fontSize: '12px', color: '#9e9e9e' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#f0f0f0' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: '#9e9e9e' }}>New here? </span>
          <span onClick={() => navigate('/register')} style={{ fontSize: '13px', color: '#D4537E', cursor: 'pointer', fontWeight: '600' }}>Create account</span>
        </div>
      </div>
    </div>
  );
}