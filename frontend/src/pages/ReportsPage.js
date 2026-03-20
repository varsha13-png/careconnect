import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMembers, getHomeNeeds, getHomeDonations, getAlerts } from '../services/api';
import { Spinner, Card, SectionHeader } from '../components/UI';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ label, value, sub, color = '#D4537E', bg = '#FBEAF0' }) => (
  <div style={{ background: bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
    <div style={{ fontSize: '24px', fontWeight: '700', color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', fontWeight: '500', color, marginBottom: '2px' }}>{label}</div>
    {sub && <div style={{ fontSize: '10px', color, opacity: 0.7 }}>{sub}</div>}
  </div>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
    <div style={{ width: '100%', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '18px', borderRadius: '4px 4px 0 0', background: color, height: `${max > 0 ? (value / max) * 60 : 4}px`, minHeight: '4px', transition: 'height 0.5s' }} />
    </div>
  </div>
);

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [donations, setDonations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const homeId = user?.home_id;
    if (!homeId) return;
    Promise.all([
      getMembers(homeId),
      getHomeNeeds(homeId),
      getHomeDonations(homeId),
      getAlerts(homeId, {})
    ]).then(([mRes, nRes, dRes, aRes]) => {
      setMembers(mRes.data.data);
      setNeeds(nRes.data.data);
      setDonations(dRes.data.data);
      setAlerts(aRes.data.data);
    }).catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Computed stats ──
  const totalMembers = members.length;
  const onMedicine = members.filter(m => m.medicines?.length > 0).length;
  const specialNeeds = members.filter(m => Object.values(m.special_needs || {}).some(v => v)).length;
  const genderBreakdown = {
    male: members.filter(m => m.gender === 'male').length,
    female: members.filter(m => m.gender === 'female').length,
    other: members.filter(m => m.gender === 'other').length
  };

  const totalDonations = donations.reduce((s, d) => s + (d.type === 'money' ? d.amount || 0 : 0), 0);
  const confirmedDonations = donations.filter(d => d.status === 'confirmed' || d.status === 'delivered').length;
  const pendingDonations = donations.filter(d => d.status === 'pledged').length;
  const itemDonations = donations.filter(d => d.type === 'items').length;
  const uniqueDonors = new Set(donations.map(d => d.donor_id?._id || d.donor_id)).size;

  const openNeeds = needs.filter(n => n.status === 'open' || n.status === 'partially_fulfilled').length;
  const fulfilledNeeds = needs.filter(n => n.status === 'fulfilled').length;
  const criticalNeeds = needs.filter(n => n.urgency === 'critical' && n.status !== 'fulfilled').length;

  const doneAlerts = alerts.filter(a => a.status === 'done').length;
  const missedAlerts = alerts.filter(a => a.status === 'missed').length;
  const alertRate = alerts.length > 0 ? Math.round((doneAlerts / alerts.length) * 100) : 0;

  // Monthly donation bars (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: MONTHS[d.getMonth()], year: d.getFullYear(), total: 0 };
  });
  donations.forEach(d => {
    if (d.type !== 'money' || !d.amount) return;
    const date = new Date(d.donated_at);
    const idx = last6Months.findIndex(m => m.month === MONTHS[date.getMonth()] && m.year === date.getFullYear());
    if (idx !== -1) last6Months[idx].total += d.amount;
  });
  const maxDonation = Math.max(...last6Months.map(m => m.total), 1);

  // Needs by category
  const needsByCategory = needs.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {});

  const tabs = ['overview', 'members', 'donations', 'alerts'];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#D4537E', padding: '20px 24px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => navigate('/profile')}
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Reports</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{currentMonth} {currentYear} · {user?.home_id?.name}</div>
          </div>
        </div>
        {/* Top 3 stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { num: totalMembers, label: 'Members' },
            { num: `₹${totalDonations >= 1000 ? (totalDonations / 1000).toFixed(1) + 'k' : totalDonations}`, label: 'Donations' },
            { num: `${alertRate}%`, label: 'Alert rate' }
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{s.num}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px 4px', fontSize: '12px', border: 'none', background: 'transparent', borderBottom: tab === t ? '2px solid #D4537E' : '2px solid transparent', color: tab === t ? '#D4537E' : '#9e9e9e', fontWeight: tab === t ? '600' : '400', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <SectionHeader title="Home at a glance" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <StatCard label="Total members" value={totalMembers} sub="Currently active" />
              <StatCard label="On medication" value={onMedicine} sub={`${totalMembers > 0 ? Math.round((onMedicine / totalMembers) * 100) : 0}% of members`} />
              <StatCard label="Special needs" value={specialNeeds} bg="#E6F1FB" color="#0C447C" />
              <StatCard label="Open needs" value={openNeeds} sub={`${criticalNeeds} critical`} bg="#FCEBEB" color="#A32D2D" />
            </div>

            <SectionHeader title="Donations this year" />
            <Card>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', marginBottom: '8px' }}>
                {last6Months.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <MiniBar value={m.total} max={maxDonation} color="#D4537E" />
                    <div style={{ fontSize: '10px', color: '#9e9e9e' }}>{m.month}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '0.5px solid #f0f0f0' }}>
                <span style={{ fontSize: '12px', color: '#9e9e9e' }}>Total received</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#D4537E' }}>₹{totalDonations.toLocaleString()}</span>
              </div>
            </Card>

            <SectionHeader title="Needs by category" />
            <Card>
              {Object.entries(needsByCategory).length === 0
                ? <div style={{ fontSize: '13px', color: '#9e9e9e', textAlign: 'center', padding: '10px' }}>No needs posted yet</div>
                : Object.entries(needsByCategory).map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #f9f5f7' }}>
                    <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{cat}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '6px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / needs.length) * 100}%`, background: '#D4537E', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#D4537E', minWidth: '16px' }}>{count}</span>
                    </div>
                  </div>
                ))
              }
            </Card>
          </>
        )}

        {/* ── Members ── */}
        {tab === 'members' && (
          <>
            <SectionHeader title="Member breakdown" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <StatCard label="Total members" value={totalMembers} />
              <StatCard label="On medication" value={onMedicine} sub={`${totalMembers > 0 ? Math.round((onMedicine / totalMembers) * 100) : 0}%`} />
              <StatCard label="Special needs" value={specialNeeds} bg="#E6F1FB" color="#0C447C" />
              <StatCard label="Avg age" value={members.length > 0 ? Math.round(members.reduce((s, m) => s + m.age, 0) / members.length) : '—'} sub="years" bg="#E1F5EE" color="#085041" />
            </div>

            <SectionHeader title="Gender distribution" />
            <Card>
              {[
                { label: 'Male', count: genderBreakdown.male, color: '#378ADD' },
                { label: 'Female', count: genderBreakdown.female, color: '#D4537E' },
                { label: 'Other', count: genderBreakdown.other, color: '#9e9e9e' }
              ].map(g => (
                <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #f9f5f7' }}>
                  <span style={{ fontSize: '13px', width: '60px' }}>{g.label}</span>
                  <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${totalMembers > 0 ? (g.count / totalMembers) * 100 : 0}%`, background: g.color, borderRadius: '999px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: g.color, minWidth: '20px' }}>{g.count}</span>
                </div>
              ))}
            </Card>

            <SectionHeader title="All members" />
            {members.map(m => (
              <Card key={m._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#D4537E', flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{m.age} yrs · {m.gender} · {m.room_number || 'No room'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {m.medicines?.length > 0 && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: '#FBEAF0', color: '#72243E' }}>💊 {m.medicines.length}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {/* ── Donations ── */}
        {tab === 'donations' && (
          <>
            <SectionHeader title="Donation summary" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <StatCard label="Total money" value={`₹${totalDonations.toLocaleString()}`} />
              <StatCard label="Unique donors" value={uniqueDonors} bg="#E1F5EE" color="#085041" />
              <StatCard label="Confirmed" value={confirmedDonations} bg="#E1F5EE" color="#085041" />
              <StatCard label="Pending" value={pendingDonations} bg="#FAEEDA" color="#633806" />
            </div>

            <SectionHeader title="Monthly trend" />
            <Card>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', marginBottom: '8px' }}>
                {last6Months.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#9e9e9e', marginBottom: '2px' }}>
                      {m.total >= 1000 ? `₹${(m.total / 1000).toFixed(1)}k` : m.total > 0 ? `₹${m.total}` : ''}
                    </div>
                    <MiniBar value={m.total} max={maxDonation} color="#D4537E" />
                    <div style={{ fontSize: '10px', color: '#9e9e9e' }}>{m.month}</div>
                  </div>
                ))}
              </div>
            </Card>

            <SectionHeader title="Recent donations" />
            {donations.slice(0, 10).map(d => (
              <Card key={d._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#D4537E', flexShrink: 0 }}>
                    {d.is_anonymous ? 'A' : (d.donor_id?.name || '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{d.is_anonymous ? 'Anonymous' : d.donor_id?.name}</div>
                    <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{d.need_id?.item_name} · {new Date(d.donated_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {d.type === 'money'
                      ? <div style={{ fontSize: '13px', fontWeight: '600', color: '#D4537E' }}>₹{d.amount?.toLocaleString()}</div>
                      : <div style={{ fontSize: '12px', color: '#9e9e9e' }}>Items</div>
                    }
                    <div style={{ fontSize: '10px', color: d.status === 'confirmed' ? '#1D9E75' : '#BA7517', marginTop: '2px' }}>{d.status}</div>
                  </div>
                </div>
              </Card>
            ))}
            {donations.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#9e9e9e', fontSize: '13px' }}>No donations yet</div>}
          </>
        )}

        {/* ── Alerts ── */}
        {tab === 'alerts' && (
          <>
            <SectionHeader title="Alert performance" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <StatCard label="Total alerts" value={alerts.length} />
              <StatCard label="Completion rate" value={`${alertRate}%`} bg="#E1F5EE" color="#085041" />
              <StatCard label="Completed" value={doneAlerts} bg="#E1F5EE" color="#085041" />
              <StatCard label="Missed" value={missedAlerts} bg="#FCEBEB" color="#A32D2D" />
            </div>

            <SectionHeader title="By type" />
            <Card>
              {['medicine', 'checkup', 'vaccination', 'birthday', 'stock_refill'].map(type => {
                const count = alerts.filter(a => a.type === type).length;
                const done = alerts.filter(a => a.type === type && a.status === 'done').length;
                const emoji = { medicine: '💊', checkup: '🩺', vaccination: '💉', birthday: '🎂', stock_refill: '📦' };
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid #f9f5f7' }}>
                    <span style={{ fontSize: '16px' }}>{emoji[type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', textTransform: 'capitalize', marginBottom: '4px' }}>{type.replace('_', ' ')}</div>
                      <div style={{ height: '5px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${count > 0 ? (done / count) * 100 : 0}%`, background: '#D4537E', borderRadius: '999px' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '40px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#D4537E' }}>{done}/{count}</div>
                      <div style={{ fontSize: '10px', color: '#9e9e9e' }}>done</div>
                    </div>
                  </div>
                );
              })}
            </Card>
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
            <span style={{ fontSize: '9px', color: '#9e9e9e', textAlign: 'center', lineHeight: '1.2' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
