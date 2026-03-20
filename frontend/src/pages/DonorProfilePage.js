import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDonations } from '../services/api';
import { Card, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const PrefToggle = ({ label, sub, defaultOn }) => {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid #f0f0f0' }}>
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

export default function DonorProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('donations');

  useEffect(() => {
    getMyDonations()
      .then(res => setDonations(res.data.data))
      .catch(() => toast.error('Failed to load donations'))
      .finally(() => setLoading(false));
  }, []);

  const totalMoney = donations.filter(d => d.type === 'money' && (d.status === 'confirmed' || d.status === 'delivered')).reduce((s, d) => s + (d.amount || 0), 0);
  const totalItems = donations.filter(d => d.type === 'items').length;
  const homesHelped = new Set(donations.map(d => d.home_id?._id || d.home_id)).size;

  const statusColor = (s) => s === 'confirmed' || s === 'delivered' ? '#1D9E75' : '#BA7517';
  const statusBg = (s) => s === 'confirmed' || s === 'delivered' ? '#E1F5EE' : '#FAEEDA';

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#D4537E', padding: '24px 24px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={logout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {user?.name?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
              {user?.city ? `${user.city}${user.state ? ', ' + user.state : ''}` : 'Donor'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>+91 {user?.phone}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { num: `₹${totalMoney >= 1000 ? (totalMoney / 1000).toFixed(1) + 'k' : totalMoney}`, label: 'Donated' },
            { num: homesHelped, label: 'Homes helped' },
            { num: totalItems, label: 'Items given' }
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
        {['donations', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '13px 4px', fontSize: '13px', border: 'none', background: 'transparent', borderBottom: tab === t ? '2px solid #D4537E' : '2px solid transparent', color: tab === t ? '#D4537E' : '#9e9e9e', fontWeight: tab === t ? '600' : '400', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>
        ) : (
          <>
            {/* ── Donations tab ── */}
            {tab === 'donations' && (
              <>
                {donations.length === 0 ? (
                  <>
                    <EmptyState icon="💝" title="No donations yet" subtitle="Browse homes and make your first donation!" />
                    <button onClick={() => navigate('/browse')}
                      style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '16px' }}>
                      Browse homes →
                    </button>
                  </>
                ) : donations.map(d => (
                  <Card key={d._id}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏠</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{d.home_id?.name || 'Unknown home'}</div>
                        <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{d.home_id?.city}</div>
                      </div>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '999px', background: statusBg(d.status), color: statusColor(d.status), fontWeight: '600', flexShrink: 0 }}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                    </div>
                    <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '10px 12px', marginBottom: d.impact_update ? '8px' : '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>For need</span>
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>{d.need_id?.item_name || 'General'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Amount</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#D4537E' }}>
                          {d.type === 'money' ? `₹${d.amount?.toLocaleString()}` : `Items · ${d.item_name || ''}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Date</span>
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>{new Date(d.donated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {d.impact_update && (
                      <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '10px 12px', marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#085041', marginBottom: '4px' }}>💌 Message from the home</div>
                        <div style={{ fontSize: '12px', color: '#0F6E56', lineHeight: 1.6 }}>{d.impact_update}</div>
                      </div>
                    )}
                  </Card>
                ))}
              </>
            )}

            {/* ── Settings tab ── */}
            {tab === 'settings' && (
              <>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#212121', marginBottom: '12px' }}>Personal info</div>
                <Card>
                  {[
                    { label: 'Full name', value: user?.name },
                    { label: 'Phone', value: `+91 ${user?.phone}` },
                    { label: 'Email', value: user?.email || 'Not added' },
                    { label: 'City', value: user?.city || 'Not added' },
                    { label: 'State', value: user?.state || 'Not added' }
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                      <span style={{ fontSize: '13px', color: '#9e9e9e' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: row.value === 'Not added' ? '#9e9e9e' : '#212121' }}>{row.value}</span>
                    </div>
                  ))}
                </Card>

                <div style={{ fontSize: '13px', fontWeight: '600', color: '#212121', marginBottom: '12px', marginTop: '20px' }}>Preferences</div>
                <Card>
                <PrefToggle label="Donate anonymously by default" sub="Your name won't be shown to homes" defaultOn={false} />
                <PrefToggle label="Impact messages" sub="Receive thank you messages from homes" defaultOn={true} />
                </Card>

                <button onClick={logout}
                  style={{ width: '100%', height: '48px', borderRadius: '12px', border: '0.5px solid #E24B4A', background: '#FCEBEB', color: '#A32D2D', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '24px' }}>
                  Logout
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {[
          { id: 'home', label: 'Home', icon: '🏠', path: '/browse' },
          { id: 'notifications', label: 'Needs', icon: '🔔', path: '/needs-feed' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/donor-profile' }
        ].map(item => (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: item.id === 'profile' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'profile' ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}