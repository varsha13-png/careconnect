import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerDonor, registerHome, acceptInvite } from '../services/api';
import { Button, Input, Select } from '../components/UI';
import toast from 'react-hot-toast';

const STATES = ['Andhra Pradesh','Delhi','Gujarat','Karnataka','Kerala','Maharashtra','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal','Other'].map(s => ({ value: s, label: s }));

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#D4537E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M12 21C12 21 4 14 4 9a8 8 0 0116 0c0 5-8 12-8 12z"/>
        <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/>
      </svg>
    </div>
    <div style={{ fontSize: '16px', fontWeight: '700', color: '#212121' }}>Care Connect</div>
  </div>
);

// ─── Category selection screen ─────────────────────────────
const CategorySelect = ({ onSelect, onBack }) => (
  <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(212,83,126,0.08)' }}>
    <Logo />
    <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back to login</button>
    <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>Join Care Connect</div>
    <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '28px', lineHeight: 1.6 }}>Who are you? Choose how you'd like to be part of this platform.</div>

    {[
      { val: 'home', icon: '🏠', title: 'Register a home', sub: 'I run an old age home or orphanage and want to manage it on this platform', color: '#FBEAF0', border: '#ED93B1' },
      { val: 'donor', icon: '💝', title: 'Join as a donor', sub: 'I want to support homes by donating money, items or my time', color: '#E1F5EE', border: '#5DCAA5' },
      { val: 'careworker', icon: '👩‍⚕️', title: 'Join as care worker', sub: 'I received an invite code from a home to join as a care worker', color: '#E6F1FB', border: '#85B7EB' },
      { val: 'govt', icon: '🏛️', title: 'Govt / NGO official', sub: 'I represent a government body or NGO — contact our team for access', color: '#f8f8f8', border: '#e0e0e0' }
    ].map(opt => (
      <div key={opt.val} onClick={() => opt.val === 'govt' ? toast('Please email us at hello@careconnect.in for govt/NGO access') : onSelect(opt.val)}
        style={{ border: `1.5px solid ${opt.border}`, borderRadius: '14px', padding: '16px', cursor: 'pointer', marginBottom: '12px', background: opt.color, transition: 'all 0.15s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{opt.icon}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#212121', marginBottom: '3px' }}>{opt.title}</div>
            <div style={{ fontSize: '12px', color: '#757575', lineHeight: 1.5 }}>{opt.sub}</div>
          </div>
          <span style={{ fontSize: '18px', color: '#e0e0e0', marginLeft: 'auto' }}>›</span>
        </div>
      </div>
    ))}
  </div>
);

// ─── Care worker invite flow ──────────────────────────────
const CareWorkerFlow = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!password || password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await acceptInvite({ invite_code: inviteCode.toUpperCase(), phone, password });
      toast.success(`Welcome, ${res.data.data.name}!`);
      onSuccess(res.data.token, { ...res.data.data, role: 'care_worker' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code or phone number');
      setStep(1);
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(212,83,126,0.08)' }}>
      <Logo />
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back</button>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {['Enter code', 'Set password'].map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: '4px', borderRadius: '999px', background: i + 1 <= step ? '#D4537E' : '#f0f0f0', marginBottom: '5px', transition: 'background 0.3s' }} />
            <div style={{ fontSize: '10px', color: i + 1 === step ? '#D4537E' : '#9e9e9e', textAlign: 'center', fontWeight: i + 1 === step ? '600' : '400' }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Enter invite code</div>
          <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '24px', lineHeight: 1.6 }}>Your administrator sent you an invite code via SMS. Enter it below.</div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#757575', marginBottom: '6px' }}>Invite code</div>
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="CC-XXXX" maxLength={7}
              style={{ width: '100%', height: '56px', borderRadius: '12px', border: `1.5px solid ${inviteCode.length >= 4 ? '#D4537E' : '#e0e0e0'}`, background: inviteCode.length >= 4 ? '#FBEAF0' : '#fff', padding: '0 16px', fontSize: '22px', fontWeight: '700', letterSpacing: '4px', textAlign: 'center', outline: 'none', color: '#D4537E', fontFamily: 'inherit' }} />
            <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '6px', textAlign: 'center' }}>Format: CC-1234 · Check your SMS</div>
          </div>

          <Input label="Your phone number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" prefix="+91" />
          <Button fullWidth onClick={() => { if (!inviteCode || !phone) return toast.error('Enter both invite code and phone'); setStep(2); }}>Verify code →</Button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Create your password</div>
          <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '20px', lineHeight: 1.6 }}>Set a password you'll use to login going forward.</div>

          <div style={{ background: '#E6F1FB', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0C447C', marginBottom: '8px' }}>Your access level</div>
            <div style={{ fontSize: '12px', color: '#378ADD', lineHeight: 1.8 }}>
              ✓ View and complete alerts<br/>
              ✓ View member diet & needs<br/>
              ✓ Add medicine alerts<br/>
              ✗ View medical history<br/>
              ✗ Manage donations
            </div>
          </div>

          <Input label="Create password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" type="password" />
          <Input label="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" type="password" />
          <Button fullWidth loading={loading} onClick={handleJoin}>Join Care Connect ✓</Button>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <span onClick={() => setStep(1)} style={{ fontSize: '13px', color: '#9e9e9e', cursor: 'pointer' }}>← Back</span>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Donor registration ───────────────────────────────────
const DonorFlow = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', city: '', state: '', thoughts: '' });
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password) return toast.error('Name, phone and password are required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await registerDonor(form);
      toast.success('Welcome to Care Connect!');
      onSuccess(res.data.token, { ...res.data.data, role: 'donor' });
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(212,83,126,0.08)' }}>
      <Logo />
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back</button>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', borderRadius: '999px', background: s <= step ? '#D4537E' : '#f0f0f0', transition: 'background 0.3s' }} />
        ))}
      </div>

      {step === 1 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Your details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="First name" value={form.name.split(' ')[0]} onChange={e => u('name', `${e.target.value} ${form.name.split(' ').slice(1).join(' ')}`.trim())} placeholder="Meera" />
            <Input label="Last name" value={form.name.split(' ').slice(1).join(' ')} onChange={e => u('name', `${form.name.split(' ')[0]} ${e.target.value}`.trim())} placeholder="Nair" />
          </div>
          <Input label="Phone number" value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="98765 43210" prefix="+91" />
          <Input label="Email (optional)" value={form.email} onChange={e => u('email', e.target.value)} placeholder="you@example.com" type="email" />
          <Input label="Create password" value={form.password} onChange={e => u('password', e.target.value)} placeholder="Minimum 6 characters" type="password" />
          <Button fullWidth onClick={() => { if (!form.name || !form.phone || !form.password) return toast.error('Fill in required fields'); setStep(2); }}>Next →</Button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Your location</div>
          <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '20px' }}>We'll show you homes nearby that need support</div>
          <Select label="State" value={form.state} onChange={e => u('state', e.target.value)} options={[{ value: '', label: 'Select state' }, ...STATES]} />
          <Input label="City" value={form.city} onChange={e => u('city', e.target.value)} placeholder="Hyderabad" />
          <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', fontSize: '11px', color: '#9e9e9e', lineHeight: 1.6 }}>
            Your location is only used to show nearby homes. Never shared publicly.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</Button>
            <Button onClick={() => setStep(3)} style={{ flex: 2 }}>Next →</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>How do you want to help?</div>
          <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '16px' }}>Optional — helps us personalise your experience</div>
          <textarea value={form.thoughts} onChange={e => u('thoughts', e.target.value)} placeholder="e.g. I want to donate medicines and groceries on weekends..."
            maxLength={300}
            style={{ width: '100%', minHeight: '100px', border: '1.5px solid #D4537E', borderRadius: '12px', padding: '12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7, color: '#212121', marginBottom: '8px' }} />
          <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '16px', textAlign: 'right' }}>{form.thoughts.length}/300</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</Button>
            <Button fullWidth loading={loading} onClick={handleRegister} style={{ flex: 2 }}>Create account ✓</Button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span onClick={handleRegister} style={{ fontSize: '12px', color: '#9e9e9e', cursor: 'pointer' }}>Skip and create account</span>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Home registration ────────────────────────────────────
const HomeFlow = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [home, setHome] = useState({
    home_name: '', home_type: 'old_age_home', address: '', city: '', state: '', locality_zone: '', capacity: '',
    admin_name: '', admin_phone: '', admin_email: '', admin_designation: '', aadhaar_last4: '',
    admin_password: '', admin_password_confirm: '', verification_level: 'level1'
  });
  const u = (f, v) => setHome(p => ({ ...p, [f]: v }));

  const handleSubmit = async () => {
    if (!home.admin_password || home.admin_password.length < 6) return toast.error('Password must be at least 6 characters');
    if (home.admin_password !== home.admin_password_confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await registerHome(home);
      toast.success('Application submitted! We will review within 2-3 days.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    setLoading(false);
  };

  const steps = ['Home', 'Admin', 'Verify'];

  return (
    <div style={{ width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(212,83,126,0.08)' }}>
      <Logo />
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back</button>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: '4px', borderRadius: '999px', background: i + 1 <= step ? '#D4537E' : '#f0f0f0', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: i + 1 === step ? '#D4537E' : '#9e9e9e', fontWeight: i + 1 === step ? '600' : '400' }}>{s}</div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Home details</div>
          <Input label="Facility name" value={home.home_name} onChange={e => u('home_name', e.target.value)} placeholder="e.g. Shanti Seva Home" />
          <Select label="Type" value={home.home_type} onChange={e => u('home_type', e.target.value)} options={[{ value: 'old_age_home', label: 'Old age home' }, { value: 'orphanage', label: 'Orphanage' }]} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Select label="State" value={home.state} onChange={e => u('state', e.target.value)} options={[{ value: '', label: 'Select state' }, ...STATES]} />
            <Input label="City" value={home.city} onChange={e => u('city', e.target.value)} placeholder="Hyderabad" />
          </div>
          <Input label="Address" value={home.address} onChange={e => u('address', e.target.value)} placeholder="Street, area, pincode" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Locality / zone" value={home.locality_zone} onChange={e => u('locality_zone', e.target.value)} placeholder="e.g. Kukatpally" />
            <Input label="Capacity" value={home.capacity} onChange={e => u('capacity', e.target.value)} placeholder="e.g. 40" />
          </div>
          <Button fullWidth onClick={() => setStep(2)}>Next →</Button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Administrator details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="First name" value={home.admin_name.split(' ')[0]} onChange={e => u('admin_name', `${e.target.value} ${home.admin_name.split(' ').slice(1).join(' ')}`.trim())} placeholder="Ravi" />
            <Input label="Last name" value={home.admin_name.split(' ').slice(1).join(' ')} onChange={e => u('admin_name', `${home.admin_name.split(' ')[0]} ${e.target.value}`.trim())} placeholder="Kumar" />
          </div>
          <Input label="Designation" value={home.admin_designation} onChange={e => u('admin_designation', e.target.value)} placeholder="Director / Owner" />
          <Input label="Phone" value={home.admin_phone} onChange={e => u('admin_phone', e.target.value)} placeholder="98765 43210" prefix="+91" />
          <Input label="Email" value={home.admin_email} onChange={e => u('admin_email', e.target.value)} placeholder="you@home.org" type="email" />
          <Input label="Aadhaar (last 4 digits)" value={home.aadhaar_last4} onChange={e => u('aadhaar_last4', e.target.value)} placeholder="_ _ _ _" />
          <Input label="Create password" value={home.admin_password} onChange={e => u('admin_password', e.target.value)} placeholder="Minimum 6 characters" type="password" />
          <Input label="Confirm password" value={home.admin_password_confirm} onChange={e => u('admin_password_confirm', e.target.value)} placeholder="Re-enter password" type="password" />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</Button>
            <Button onClick={() => setStep(3)} style={{ flex: 2 }}>Next →</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Verification level</div>
          {[
            { val: 'level1', badge: 'Level 1', title: '1 informal document', desc: 'Electricity bill, ration card or panchayat letter', access: 'Standard access', accessColor: '#0C447C', accessBg: '#E6F1FB' },
            { val: 'level2', badge: 'Level 2', title: '2+ official documents', desc: 'Govt registration, NGO endorsement or trust deed', access: 'Full access + PPP model', accessColor: '#085041', accessBg: '#E1F5EE' }
          ].map(opt => (
            <div key={opt.val} onClick={() => u('verification_level', opt.val)}
              style={{ border: `1.5px solid ${home.verification_level === opt.val ? '#D4537E' : '#e0e0e0'}`, background: home.verification_level === opt.val ? '#FBEAF0' : '#fff', borderRadius: '12px', padding: '16px', cursor: 'pointer', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: opt.accessBg, color: opt.accessColor, fontWeight: '600' }}>{opt.badge}</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{opt.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '6px' }}>{opt.desc}</div>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: opt.accessBg, color: opt.accessColor }}>{opt.access}</span>
            </div>
          ))}
          <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', fontSize: '11px', color: '#9e9e9e', lineHeight: 1.6 }}>
            💡 You can upgrade your verification later from Profile → Settings
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</Button>
            <Button fullWidth loading={loading} onClick={handleSubmit} style={{ flex: 2 }}>Submit for review →</Button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Register Page ───────────────────────────────────
export default function RegisterPage() {
  const [category, setCategory] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = (token, userData) => {
    login(token, userData);
    if (userData.role === 'donor') navigate('/browse');
    else if (userData.role === 'care_worker') navigate('/alerts');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {!category && <CategorySelect onSelect={setCategory} onBack={() => navigate('/login')} />}
      {category === 'home' && <HomeFlow onBack={() => setCategory(null)} />}
      {category === 'donor' && <DonorFlow onBack={() => setCategory(null)} onSuccess={handleSuccess} />}
      {category === 'careworker' && <CareWorkerFlow onBack={() => setCategory(null)} onSuccess={handleSuccess} />}
    </div>
  );
}