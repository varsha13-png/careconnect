import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeNeeds, createNeed, getHomeDonations, confirmDonation, sendThanks } from '../services/api';
import { Card, Badge, ProgressBar, Button, Input, Select, Spinner, EmptyState, Avatar } from '../components/UI';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'education', label: 'Education' },
  { value: 'financial', label: 'Financial' },
  { value: 'volunteer', label: 'Volunteer' }
];

export default function NeedsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('needs');
  const [needs, setNeeds] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_name: '', quantity_required: '', unit: 'units', category: 'medicine', urgency: 'medium', is_public: true });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'needs') {
        const res = await getHomeNeeds(user.home_id);
        setNeeds(res.data.data);
      } else {
        const res = await getHomeDonations(user.home_id);
        setDonations(res.data.data);
      }
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const handleCreateNeed = async () => {
    try {
      await createNeed(user.home_id, form);
      toast.success('Need posted!');
      setShowForm(false);
      setForm({ item_name: '', quantity_required: '', unit: 'units', category: 'medicine', urgency: 'medium', is_public: true });
      fetchData();
    } catch { toast.error('Failed to post need'); }
  };

  const handleConfirm = async (donationId) => {
    try {
      await confirmDonation(donationId);
      toast.success('Donation confirmed!');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleThanks = async (donationId) => {
    const msg = prompt('Send a thank you message:');
    if (!msg) return;
    try {
      await sendThanks(donationId, { message: msg });
      toast.success('Thanks sent!');
    } catch { toast.error('Failed'); }
  };

  const urgencyColor = (u) => u === 'critical' ? '#E24B4A' : u === 'medium' ? '#BA7517' : '#1D9E75';

  const filteredNeeds = needs.filter(n => filter === 'all' || n.category === filter);

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', background: '#fff', borderBottom: '0.5px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Needs & Donations</span>
          </div>
          {view === 'needs' && (
            <button onClick={() => setShowForm(!showForm)}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FBEAF0', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#D4537E' }}>+</button>
          )}
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {['needs', 'donations'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                flex: 1, padding: '12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                border: `1.5px solid ${view === v ? '#D4537E' : '#e0e0e0'}`,
                background: view === v ? '#D4537E' : '#f8f8f8',
                color: view === v ? '#fff' : '#9e9e9e', fontWeight: view === v ? '600' : '400'
              }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary */}
        {view === 'needs' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'Critical', count: needs.filter(n => n.urgency === 'critical').length, bg: '#FCEBEB', color: '#A32D2D' },
              { label: 'Medium', count: needs.filter(n => n.urgency === 'medium').length, bg: '#FAEEDA', color: '#633806' },
              { label: 'Fulfilled', count: needs.filter(n => n.status === 'fulfilled').length, bg: '#E1F5EE', color: '#085041' }
            ].map(p => (
              <div key={p.label} style={{ flex: 1, background: p.bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: p.color }}>{p.count}</div>
                <div style={{ fontSize: '10px', color: p.color }}>{p.label}</div>
              </div>
            ))}
          </div>
        )}

        {view === 'donations' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'This month', count: `₹${donations.filter(d => d.type === 'money').reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}`, bg: '#FBEAF0', color: '#72243E' },
              { label: 'Donors', count: new Set(donations.map(d => d.donor_id?._id)).size, bg: '#E1F5EE', color: '#085041' },
              { label: 'Pending', count: donations.filter(d => d.status === 'pledged').length, bg: '#FAEEDA', color: '#633806' }
            ].map(p => (
              <div key={p.label} style={{ flex: 1, background: p.bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: p.color }}>{p.count}</div>
                <div style={{ fontSize: '10px', color: p.color }}>{p.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px' }}>
          {['all', ...CATEGORIES.map(c => c.value)].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: '999px', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer',
                border: `0.5px solid ${filter === f ? '#D4537E' : '#e0e0e0'}`,
                background: filter === f ? '#FBEAF0' : 'transparent',
                color: filter === f ? '#72243E' : '#9e9e9e', fontWeight: filter === f ? '600' : '400'
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Add need form */}
        {showForm && (
          <div style={{ background: '#FBEAF0', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid #ED93B1' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#72243E', marginBottom: '14px' }}>Post a new need</div>
            <Input label="Item / need name" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Quantity needed" value={form.quantity_required} onChange={e => setForm({ ...form, quantity_required: e.target.value })} placeholder="e.g. 50" />
              <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Urgency</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['critical', 'medium', 'low'].map(u => (
                  <button key={u} onClick={() => setForm({ ...form, urgency: u })}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                      border: `0.5px solid ${form.urgency === u ? urgencyColor(u) : '#e0e0e0'}`,
                      background: form.urgency === u ? (u === 'critical' ? '#FCEBEB' : u === 'medium' ? '#FAEEDA' : '#E1F5EE') : 'transparent',
                      color: form.urgency === u ? urgencyColor(u) : '#9e9e9e', fontWeight: form.urgency === u ? '600' : '400'
                    }}>
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateNeed}
              style={{ width: '100%', height: '40px', borderRadius: '8px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Post need →
            </button>
          </div>
        )}

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div> : (
          <>
            {view === 'needs' && (
              filteredNeeds.length === 0
                ? <EmptyState icon="📋" title="No needs posted" subtitle="Tap + to post what your home needs" />
                : filteredNeeds.map(need => (
                  <Card key={need._id} style={{ borderLeft: `3px solid ${urgencyColor(need.urgency)}`, borderRadius: '0 14px 14px 0', opacity: need.status === 'fulfilled' ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{need.item_name}</span>
                      <Badge variant={need.urgency}>{need.urgency.charAt(0).toUpperCase() + need.urgency.slice(1)}</Badge>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '10px' }}>{need.category} · Posted {new Date(need.created_at).toLocaleDateString('en-IN')}</div>
                    <ProgressBar value={need.quantity_fulfilled} max={need.quantity_required} color={urgencyColor(need.urgency)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 12px' }}>
                      <span style={{ fontSize: '10px', color: '#9e9e9e' }}>{need.quantity_fulfilled} of {need.quantity_required} {need.unit}</span>
                      <span style={{ fontSize: '10px', color: '#9e9e9e' }}>{need.quantity_required - need.quantity_fulfilled} remaining</span>
                    </div>
                    {need.status !== 'fulfilled' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button style={{ flex: 1, height: '34px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '11px', color: '#757575', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
                        <button style={{ flex: 1, height: '34px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '11px', color: '#757575', cursor: 'pointer', fontWeight: '500' }}>Share</button>
                        <button style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', background: '#D4537E', fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Mark fulfilled</button>
                      </div>
                    )}
                  </Card>
                ))
            )}

            {view === 'donations' && (
              donations.length === 0
                ? <EmptyState icon="💝" title="No donations yet" subtitle="Share your needs to attract donors" />
                : donations.map(d => (
                  <Card key={d._id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Avatar name={d.is_anonymous ? 'AN' : d.donor_id?.name || '?'} size={38} color={d.is_anonymous ? '#E6F1FB' : '#FBEAF0'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{d.is_anonymous ? 'Anonymous' : d.donor_id?.name}</div>
                        <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{new Date(d.donated_at).toLocaleDateString('en-IN')} · {new Date(d.donated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {d.type === 'money' && <span style={{ fontSize: '16px', fontWeight: '600', color: '#D4537E' }}>₹{d.amount?.toLocaleString()}</span>}
                      {d.type === 'items' && <span style={{ fontSize: '12px', color: '#9e9e9e' }}>Items</span>}
                    </div>
                    <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>For need</span>
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>{d.need_id?.item_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Type</span>
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>{d.type === 'money' ? `Money · ${d.payment_method?.toUpperCase()}` : `Items · ${d.item_name}`}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Status</span>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: d.status === 'confirmed' ? '#1D9E75' : d.status === 'pledged' ? '#BA7517' : '#212121' }}>{d.status.charAt(0).toUpperCase() + d.status.slice(1)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {d.status === 'pledged' ? (
                        <button onClick={() => handleConfirm(d._id)}
                          style={{ flex: 2, height: '34px', borderRadius: '8px', border: 'none', background: '#D4537E', fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>
                          Confirm received
                        </button>
                      ) : (
                        <button style={{ flex: 1, height: '34px', borderRadius: '8px', border: '0.5px solid #5DCAA5', background: '#E1F5EE', fontSize: '11px', color: '#085041', cursor: 'pointer', fontWeight: '500' }}>
                          ✓ {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </button>
                      )}
                      <button onClick={() => handleThanks(d._id)}
                        style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', background: '#D4537E', fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>
                        Send thanks
                      </button>
                    </div>
                  </Card>
                ))
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {[
          { id: 'home', label: 'Home', icon: '🏠', path: '/dashboard' },
          { id: 'members', label: 'Members', icon: '👥', path: '/members' },
          { id: 'alerts', label: 'Alerts', icon: '🔔', path: '/alerts' },
          { id: 'needs', label: 'Needs & Donations', icon: '📋', path: '/needs' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
        ].map(item => (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: item.id === 'needs' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'needs' ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}