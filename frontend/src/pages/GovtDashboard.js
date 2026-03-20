import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Card, Spinner, EmptyState, Input, Select, Badge } from '../components/UI';
import toast from 'react-hot-toast';

const getOverview = () => API.get('/govt/overview');
const getHomes = (params) => API.get('/govt/homes', { params });
const verifyHome = (homeId, data) => API.put(`/govt/homes/${homeId}/verify`, data);
const getReferrals = () => API.get('/govt/referrals');
const createReferral = (data) => API.post('/govt/referrals', data);
const updateReferral = (id, data) => API.put(`/govt/referrals/${id}`, data);

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const STATUS_COLORS = {
  pending: { bg: '#FAEEDA', color: '#633806' },
  contacted: { bg: '#E6F1FB', color: '#0C447C' },
  admitted: { bg: '#E1F5EE', color: '#085041' },
  declined: { bg: '#FCEBEB', color: '#A32D2D' }
};

export default function GovtDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [homes, setHomes] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeFilter, setHomeFilter] = useState('all');
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [selectedHome, setSelectedHome] = useState(null);
  const [referralForm, setReferralForm] = useState({
    name: '', age: '', gender: '', phone: '', address: '', condition: '', notes: '', home_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, hRes, rRes] = await Promise.all([getOverview(), getHomes(), getReferrals()]);
      setOverview(ovRes.data.data);
      setHomes(hRes.data.data);
      setReferrals(rRes.data.data);
    } catch { toast.error('Failed to load dashboard'); }
    setLoading(false);
  };

  const handleVerify = async (homeId, status) => {
    try {
      await verifyHome(homeId, { status });
      setHomes(prev => prev.map(h => h._id === homeId ? { ...h, verification_status: status } : h));
      toast.success(status === 'level1' ? 'Home approved!' : status === 'rejected' ? 'Home rejected' : 'Updated!');
    } catch { toast.error('Failed to update'); }
  };

  const handleReferral = async () => {
    if (!referralForm.name || !referralForm.age || !referralForm.home_id) return toast.error('Name, age and home are required');
    setSubmitting(true);
    try {
      const res = await createReferral({ ...referralForm, person: { name: referralForm.name, age: Number(referralForm.age), gender: referralForm.gender, phone: referralForm.phone, address: referralForm.address, condition: referralForm.condition, notes: referralForm.notes } });
      setReferrals(prev => [res.data.data, ...prev]);
      setShowReferralForm(false);
      setReferralForm({ name: '', age: '', gender: '', phone: '', address: '', condition: '', notes: '', home_id: '' });
      toast.success('Referral sent to home!');
    } catch { toast.error('Failed to send referral'); }
    setSubmitting(false);
  };

  const filteredHomes = homes.filter(h => homeFilter === 'all' || h.verification_status === homeFilter);
  const pendingHomes = homes.filter(h => h.verification_status === 'pending');
  const verifiedHomes = homes.filter(h => h.verification_status === 'level1' || h.verification_status === 'level2');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#D4537E', padding: '20px 24px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Govt / NGO Official</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Welcome, {user?.name?.split(' ')[0]} 👋</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{user?.designation || 'Official'}</div>
          </div>
          <button onClick={logout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { num: overview?.totalHomes || 0, label: 'Verified homes' },
            { num: overview?.totalMembers || 0, label: 'Total members' },
            { num: overview?.pendingHomes || 0, label: 'Pending review', highlight: overview?.pendingHomes > 0 }
          ].map((s, i) => (
            <div key={i} style={{ background: s.highlight ? 'rgba(250,238,218,0.9)' : 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: s.highlight ? '#633806' : '#fff', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '10px', color: s.highlight ? '#854F0B' : 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0, overflowX: 'auto' }}>
        {[
          { val: 'overview', label: 'Overview' },
          { val: 'homes', label: 'Homes' },
          { val: 'verify', label: `Verify${pendingHomes.length > 0 ? ` (${pendingHomes.length})` : ''}` },
          { val: 'referrals', label: 'Referrals' }
        ].map(t => (
          <button key={t.val} onClick={() => setTab(t.val)}
            style={{ flex: 1, padding: '12px 8px', fontSize: '12px', border: 'none', background: 'transparent', borderBottom: tab === t.val ? '2px solid #D4537E' : '2px solid transparent', color: tab === t.val ? '#D4537E' : '#9e9e9e', fontWeight: tab === t.val ? '600' : '400', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Platform overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Verified homes', value: overview?.totalHomes || 0, bg: '#FBEAF0', color: '#72243E' },
                { label: 'Active members', value: overview?.totalMembers || 0, bg: '#E1F5EE', color: '#085041' },
                { label: 'Open needs', value: overview?.openNeeds || 0, bg: '#FAEEDA', color: '#633806' },
                { label: 'Total donations', value: `₹${((overview?.totalDonations || 0) / 1000).toFixed(1)}k`, bg: '#E6F1FB', color: '#0C447C' }
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: s.color, marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: s.color, opacity: 0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {pendingHomes.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>Pending verification</div>
                  <span onClick={() => setTab('verify')} style={{ fontSize: '12px', color: '#D4537E', cursor: 'pointer' }}>See all</span>
                </div>
                {pendingHomes.slice(0, 2).map(home => (
                  <Card key={home._id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏠</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{home.name}</div>
                        <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{home.city} · {home.type === 'old_age_home' ? 'Old age home' : 'Orphanage'}</div>
                      </div>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: '#FAEEDA', color: '#633806', fontWeight: '500' }}>Pending</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleVerify(home._id, 'rejected')}
                        style={{ flex: 1, height: '32px', borderRadius: '8px', border: '0.5px solid #E24B4A', background: '#FCEBEB', color: '#A32D2D', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
                        Reject
                      </button>
                      <button onClick={() => handleVerify(home._id, 'level1')}
                        style={{ flex: 2, height: '32px', borderRadius: '8px', border: 'none', background: '#D4537E', color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
                        Approve Level 1
                      </button>
                    </div>
                  </Card>
                ))}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', marginTop: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>Recent referrals</div>
              <span onClick={() => setTab('referrals')} style={{ fontSize: '12px', color: '#D4537E', cursor: 'pointer' }}>See all</span>
            </div>
            {referrals.slice(0, 2).map(r => (
              <Card key={r._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#0C447C', flexShrink: 0 }}>
                    {r.person?.name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{r.person?.name}, {r.person?.age}</div>
                    <div style={{ fontSize: '11px', color: '#9e9e9e' }}>→ {r.home_id?.name}</div>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.color, fontWeight: '500' }}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              </Card>
            ))}
            {referrals.length === 0 && <EmptyState icon="📋" title="No referrals yet" subtitle="Refer someone in need to a nearby home" />}
          </>
        )}

        {/* ── Homes ── */}
        {tab === 'homes' && (
          <>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto' }}>
              {[
                { val: 'all', label: 'All' },
                { val: 'level1', label: 'Level 1' },
                { val: 'level2', label: 'Level 2' },
                { val: 'pending', label: 'Pending' },
                { val: 'rejected', label: 'Rejected' }
              ].map(f => (
                <button key={f.val} onClick={() => setHomeFilter(f.val)}
                  style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer', border: `0.5px solid ${homeFilter === f.val ? '#D4537E' : '#e0e0e0'}`, background: homeFilter === f.val ? '#FBEAF0' : 'transparent', color: homeFilter === f.val ? '#72243E' : '#9e9e9e', fontWeight: homeFilter === f.val ? '600' : '400' }}>
                  {f.label}
                </button>
              ))}
            </div>
            {filteredHomes.length === 0
              ? <EmptyState icon="🏠" title="No homes found" subtitle="Try a different filter" />
              : filteredHomes.map(home => (
                <Card key={home._id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{home.name}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{home.city}, {home.state} · {home.type === 'old_age_home' ? 'Old age' : 'Orphanage'}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '2px' }}>Capacity: {home.capacity} · Members: {home.current_occupancy || 0}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', fontWeight: '500', flexShrink: 0,
                      background: home.verification_status === 'level2' ? '#E1F5EE' : home.verification_status === 'level1' ? '#E6F1FB' : home.verification_status === 'pending' ? '#FAEEDA' : '#FCEBEB',
                      color: home.verification_status === 'level2' ? '#085041' : home.verification_status === 'level1' ? '#0C447C' : home.verification_status === 'pending' ? '#633806' : '#A32D2D' }}>
                      {home.verification_status}
                    </span>
                  </div>
                  <button onClick={() => { setReferralForm(p => ({ ...p, home_id: home._id })); setSelectedHome(home); setShowReferralForm(true); setTab('referrals'); }}
                    style={{ width: '100%', height: '34px', borderRadius: '8px', border: '0.5px solid #D4537E', background: '#FBEAF0', color: '#D4537E', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    📋 Refer a person to this home
                  </button>
                </Card>
              ))
            }
          </>
        )}

        {/* ── Verify ── */}
        {tab === 'verify' && (
          <>
            <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '14px', lineHeight: 1.6 }}>
              Review and approve homes that have applied to join Care Connect.
            </div>
            {pendingHomes.length === 0
              ? <EmptyState icon="✅" title="All caught up!" subtitle="No pending verification requests" />
              : pendingHomes.map(home => (
                <Card key={home._id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{home.name}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{home.city}, {home.state}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{home.type === 'old_age_home' ? 'Old age home' : 'Orphanage'} · Capacity {home.capacity}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Applied: {new Date(home.registered_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                  {home.contact_info?.phone && (
                    <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px' }}>
                      <span style={{ color: '#9e9e9e' }}>Contact: </span>
                      <span style={{ fontWeight: '500' }}>{home.contact_info.phone}</span>
                      {home.contact_info.email && <><span style={{ color: '#9e9e9e' }}> · </span><span style={{ fontWeight: '500' }}>{home.contact_info.email}</span></>}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleVerify(home._id, 'rejected')}
                      style={{ flex: 1, height: '36px', borderRadius: '8px', border: '0.5px solid #E24B4A', background: '#FCEBEB', color: '#A32D2D', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                      ✗ Reject
                    </button>
                    <button onClick={() => handleVerify(home._id, 'level1')}
                      style={{ flex: 1, height: '36px', borderRadius: '8px', border: 'none', background: '#378ADD', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                      ✓ Level 1
                    </button>
                    <button onClick={() => handleVerify(home._id, 'level2')}
                      style={{ flex: 1, height: '36px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                      ✓✓ Level 2
                    </button>
                  </div>
                </Card>
              ))
            }
          </>
        )}

        {/* ── Referrals ── */}
        {tab === 'referrals' && (
          <>
            <button onClick={() => setShowReferralForm(!showReferralForm)}
              style={{ width: '100%', height: '46px', borderRadius: '12px', border: `1.5px dashed ${showReferralForm ? '#e0e0e0' : '#D4537E'}`, background: showReferralForm ? '#f8f8f8' : '#FBEAF0', color: showReferralForm ? '#9e9e9e' : '#D4537E', fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {showReferralForm ? '✕ Cancel' : '+ Refer a person to a home'}
            </button>

            {/* Referral form */}
            {showReferralForm && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', marginBottom: '16px', border: '1px solid #ED93B1' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>Person details</div>

                <Select label="Select home" value={referralForm.home_id} onChange={e => setReferralForm(p => ({ ...p, home_id: e.target.value }))}
                  options={[{ value: '', label: 'Choose a home' }, ...verifiedHomes.map(h => ({ value: h._id, label: `${h.name} · ${h.city}` }))]} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input label="Full name" value={referralForm.name} onChange={e => setReferralForm(p => ({ ...p, name: e.target.value }))} placeholder="Person's name" />
                  <Input label="Age" value={referralForm.age} onChange={e => setReferralForm(p => ({ ...p, age: e.target.value }))} placeholder="e.g. 75" />
                </div>
                <Select label="Gender" value={referralForm.gender} onChange={e => setReferralForm(p => ({ ...p, gender: e.target.value }))} options={GENDER_OPTIONS} />
                <Input label="Phone (optional)" value={referralForm.phone} onChange={e => setReferralForm(p => ({ ...p, phone: e.target.value }))} placeholder="Contact number" prefix="+91" />
                <Input label="Current address" value={referralForm.address} onChange={e => setReferralForm(p => ({ ...p, address: e.target.value }))} placeholder="Where they currently live" />
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Medical condition / reason for referral</div>
                  <textarea value={referralForm.condition} onChange={e => setReferralForm(p => ({ ...p, condition: e.target.value }))}
                    placeholder="e.g. Elderly with no family support, needs daily care and medicine management"
                    style={{ width: '100%', minHeight: '80px', borderRadius: '10px', border: '0.5px solid #e0e0e0', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6 }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Additional notes (optional)</div>
                  <textarea value={referralForm.notes} onChange={e => setReferralForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any other relevant information for the home..."
                    style={{ width: '100%', minHeight: '60px', borderRadius: '10px', border: '0.5px solid #e0e0e0', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6 }} />
                </div>
                <button onClick={handleReferral} disabled={submitting}
                  style={{ width: '100%', height: '46px', borderRadius: '10px', background: submitting ? '#e0e0e0' : '#D4537E', border: 'none', color: submitting ? '#9e9e9e' : '#fff', fontSize: '13px', fontWeight: '500', cursor: submitting ? 'default' : 'pointer' }}>
                  {submitting ? 'Sending...' : '📋 Send referral to home →'}
                </button>
              </div>
            )}

            {/* Referrals list */}
            {referrals.length === 0
              ? <EmptyState icon="📋" title="No referrals yet" subtitle="Tap above to refer someone in need to a home" />
              : referrals.map(r => (
                <Card key={r._id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#0C447C', flexShrink: 0 }}>
                      {r.person?.name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{r.person?.name}, {r.person?.age} yrs</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '2px' }}>Referred to: {r.home_id?.name}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: '500', flexShrink: 0, background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.color }}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                  {r.person?.condition && (
                    <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', fontSize: '12px', color: '#616161', lineHeight: 1.5 }}>
                      {r.person.condition}
                    </div>
                  )}
                  {r.person?.phone && (
                    <div style={{ fontSize: '12px', color: '#D4537E', marginBottom: '8px' }}>📞 +91 {r.person.phone}</div>
                  )}
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => updateReferral(r._id, { status: 'contacted' }).then(res => setReferrals(prev => prev.map(ref => ref._id === r._id ? res.data.data : ref)))}
                        style={{ flex: 1, height: '32px', borderRadius: '8px', border: '0.5px solid #378ADD', background: '#E6F1FB', color: '#0C447C', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
                        Mark contacted
                      </button>
                    </div>
                  )}
                </Card>
              ))
            }
          </>
        )}
      </div>
    </div>
  );
}
