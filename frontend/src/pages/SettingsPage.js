import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Input, Button, Spinner } from '../components/UI';
import toast from 'react-hot-toast';

const updateHome = (homeId, data) => API.put(`/homes/${homeId}/payment-settings`, data);
const uploadQR = (formData) => API.post('/upload/qr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

const NotificationToggle = ({ label, sub, defaultOn }) => {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
      <div style={{ flex: 1, paddingRight: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{sub}</div>
      </div>
      <div onClick={() => setOn(!on)}
        style={{ width: '40px', height: '22px', borderRadius: '999px', background: on ? '#D4537E' : '#e0e0e0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: on ? '20px' : '2px', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('home');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const qrRef = useRef();

  const [paymentForm, setPaymentForm] = useState({
    upi_id: user?.home_id?.payment_settings?.upi_id || '',
    upi_mobile: user?.home_id?.payment_settings?.upi_mobile || '',
    bank_account: user?.home_id?.payment_settings?.bank_account || '',
    qr_code_url: user?.home_id?.payment_settings?.qr_code_url || ''
  });

  const [qrPreview, setQrPreview] = useState(user?.home_id?.payment_settings?.qr_code_url || null);

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadQR(formData);
      const url = res.data.data.url;
      setQrPreview(`http://localhost:5000${url}`);
      setPaymentForm(prev => ({ ...prev, qr_code_url: url }));
      toast.success('QR code uploaded!');
    } catch { toast.error('Failed to upload QR code'); }
    setUploading(false);
  };

  const handleSavePayment = async () => {
    if (!paymentForm.upi_id) return toast.error('UPI ID is required');
    setSaving(true);
    try {
      await updateHome(user?.home_id?._id || user?.home_id, paymentForm);
      toast.success('Payment settings saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 24px 0', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => navigate('/profile')}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>←</button>
          <span style={{ fontSize: '18px', fontWeight: '600' }}>Settings</span>
        </div>
        <div style={{ display: 'flex', gap: '0' }}>
          {['home', 'payment', 'account'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '12px 4px', fontSize: '13px', border: 'none', background: 'transparent', borderBottom: tab === t ? '2px solid #D4537E' : '2px solid transparent', color: tab === t ? '#D4537E' : '#9e9e9e', fontWeight: tab === t ? '600' : '400', cursor: 'pointer', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* ── Home info tab ── */}
        {tab === 'home' && (
          <>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Home details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Home name', value: user?.home_id?.name || '—' },
                  { label: 'Type', value: user?.home_id?.type === 'old_age_home' ? 'Old age home' : 'Orphanage' },
                  { label: 'City', value: user?.home_id?.city || '—' },
                  { label: 'State', value: user?.home_id?.state || '—' },
                  { label: 'Capacity', value: user?.home_id?.capacity ? `${user.home_id.capacity} members` : '—' },
                  { label: 'Verification', value: user?.home_id?.verification_status || 'Pending' }
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                    <span style={{ fontSize: '13px', color: '#9e9e9e' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#212121', textTransform: 'capitalize' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification upgrade */}
            {user?.home_id?.verification_status === 'level1' && (
              <div style={{ background: '#FBEAF0', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#72243E', marginBottom: '6px' }}>Upgrade to Level 2</div>
                <div style={{ fontSize: '12px', color: '#993556', lineHeight: 1.6, marginBottom: '14px' }}>
                  Upload 2 official documents to unlock full access and the PPP model for government partnerships.
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {['Govt registration', 'NGO endorsement', 'Trust deed'].map(doc => (
                    <span key={doc} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.5)', color: '#72243E', border: '0.5px solid #ED93B1' }}>{doc}</span>
                  ))}
                </div>
                <button style={{ width: '100%', height: '40px', borderRadius: '10px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  Upload documents →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Payment tab ── */}
        {tab === 'payment' && (
          <>
            {/* Status card */}
            <div style={{ background: paymentForm.upi_id ? '#E1F5EE' : '#FAEEDA', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', border: `0.5px solid ${paymentForm.upi_id ? '#5DCAA5' : '#BA7517'}` }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: paymentForm.upi_id ? '#085041' : '#633806', marginBottom: '4px' }}>
                {paymentForm.upi_id ? '✓ Payment set up' : '⚠ Payment not set up'}
              </div>
              <div style={{ fontSize: '12px', color: paymentForm.upi_id ? '#0F6E56' : '#854F0B', lineHeight: 1.5 }}>
                {paymentForm.upi_id ? 'Donors can now pay you via UPI or scan your QR code.' : 'Add your UPI ID so donors can make payments directly to you.'}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>UPI details</div>
              <Input label="UPI ID" value={paymentForm.upi_id} onChange={e => setPaymentForm(p => ({ ...p, upi_id: e.target.value }))} placeholder="yourname@upi or yourname@okhdfc" />
              <Input label="Registered mobile (UPI)" value={paymentForm.upi_mobile} onChange={e => setPaymentForm(p => ({ ...p, upi_mobile: e.target.value }))} placeholder="98765 43210" prefix="+91" />
              <Input label="Bank account (optional)" value={paymentForm.bank_account} onChange={e => setPaymentForm(p => ({ ...p, bank_account: e.target.value }))} placeholder="For direct transfers" />
            </div>

            {/* QR Code upload */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>QR Code</div>
              <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '16px', lineHeight: 1.6 }}>
                Download your UPI QR code from PhonePe, GPay or Paytm and upload it here. Donors can scan it to pay instantly.
              </div>

              {qrPreview ? (
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={qrPreview} alt="QR Code" style={{ width: '140px', height: '140px', objectFit: 'contain', border: '0.5px solid #e0e0e0', borderRadius: '12px', padding: '8px' }} />
                    <div style={{ background: '#E1F5EE', borderRadius: '999px', padding: '4px 10px', display: 'inline-block', marginTop: '8px', fontSize: '11px', color: '#085041', fontWeight: '500' }}>
                      ✓ QR uploaded
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ border: '1.5px dashed #e0e0e0', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '14px', cursor: 'pointer', background: '#f8f8f8' }}
                  onClick={() => qrRef.current.click()}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#212121', marginBottom: '4px' }}>Upload QR code</div>
                  <div style={{ fontSize: '11px', color: '#9e9e9e' }}>PNG or JPG · Max 5MB</div>
                </div>
              )}

              <input ref={qrRef} type="file" accept="image/*" onChange={handleQRUpload} style={{ display: 'none' }} />

              <button onClick={() => qrRef.current.click()} disabled={uploading}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '0.5px solid #D4537E', background: 'transparent', color: '#D4537E', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {uploading ? <Spinner size={16} /> : qrPreview ? '📷 Change QR code' : '📷 Upload QR code'}
              </button>
            </div>

            <Button fullWidth loading={saving} onClick={handleSavePayment}>
              Save payment settings ✓
            </Button>
          </>
        )}

        {/* ── Account tab ── */}
        {tab === 'account' && (
          <>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Your account</div>
              {[
                { label: 'Name', value: user?.name },
                { label: 'Phone', value: `+91 ${user?.phone}` },
                { label: 'Email', value: user?.email || 'Not added' },
                { label: 'Designation', value: user?.designation || '—' },
                { label: 'Role', value: user?.role === 'authority' ? 'Administrator' : 'Care worker' }
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                  <span style={{ fontSize: '13px', color: '#9e9e9e' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#212121' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>Notifications</div>
              <NotificationToggle label="SMS alerts for medicines" sub="Get SMS when medicine reminders are due" defaultOn={true} />
              <NotificationToggle label="New donation alerts" sub="Get notified when someone donates" defaultOn={true} />
              <NotificationToggle label="Care worker activity" sub="Alerts added by care workers" defaultOn={true} />
            </div>

            <button onClick={logout}
              style={{ width: '100%', height: '48px', borderRadius: '12px', border: '0.5px solid #E24B4A', background: '#FCEBEB', color: '#A32D2D', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {[
          { id: 'home', label: 'Home', icon: '🏠', path: '/dashboard' },
          { id: 'members', label: 'Members', icon: '👥', path: '/members' },
          { id: 'alerts', label: 'Alerts', icon: '🔔', path: '/alerts' },
          { id: 'needs', label: 'Needs', icon: '📋', path: '/needs' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
        ].map(item => (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: '#9e9e9e', textAlign: 'center', lineHeight: '1.2' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}