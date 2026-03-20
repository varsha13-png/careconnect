import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const getPublicNeeds = () => API.get('/needs/public');

export default function NeedsFeedPage() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getPublicNeeds()
      .then(res => setNeeds(res.data.data))
      .catch(() => toast.error('Failed to load needs'))
      .finally(() => setLoading(false));
  }, []);

  const urgencyColor = (u) => u === 'critical' ? '#E24B4A' : u === 'medium' ? '#BA7517' : '#1D9E75';
  const urgencyBg = (u) => u === 'critical' ? '#FCEBEB' : u === 'medium' ? '#FAEEDA' : '#E1F5EE';
  const urgencyText = (u) => u === 'critical' ? '#A32D2D' : u === 'medium' ? '#633806' : '#085041';

  const filtered = needs.filter(n => filter === 'all' || n.urgency === filter);
  const criticalCount = needs.filter(n => n.urgency === 'critical').length;

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 20px 0', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#212121' }}>Needs</div>
          {criticalCount > 0 && (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: '#FCEBEB', color: '#A32D2D', fontWeight: '600' }}>
              {criticalCount} urgent
            </span>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '6px', paddingBottom: '14px', overflowX: 'auto' }}>
          {[
            { val: 'all', label: 'All needs' },
            { val: 'critical', label: '🔴 Urgent' },
            { val: 'medium', label: '🟡 Medium' },
            { val: 'low', label: '🟢 Low' }
          ].map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)}
              style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer', border: `0.5px solid ${filter === f.val ? '#D4537E' : '#e0e0e0'}`, background: filter === f.val ? '#FBEAF0' : 'transparent', color: filter === f.val ? '#72243E' : '#9e9e9e', fontWeight: filter === f.val ? '600' : '400' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Needs list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="✅" title="No needs right now" subtitle="Check back later for new needs from homes" />
        ) : filtered.map(need => (
          <div key={need._id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '0.5px solid #f0f0f0', borderLeft: `3px solid ${urgencyColor(need.urgency)}`, borderRadius: '0 16px 16px 0' }}>

            {/* Home info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#212121' }}>{need.home_id?.name}</div>
                <div style={{ fontSize: '10px', color: '#9e9e9e' }}>{need.home_id?.city}</div>
              </div>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: urgencyBg(need.urgency), color: urgencyText(need.urgency), fontWeight: '600' }}>
                {need.urgency === 'critical' ? '🔴 Urgent' : need.urgency === 'medium' ? '🟡 Medium' : '🟢 Low'}
              </span>
            </div>

            {/* Need details */}
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#212121', marginBottom: '4px' }}>{need.item_name}</div>
            <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '10px', textTransform: 'capitalize' }}>{need.category}</div>

            {/* Progress */}
            <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '5px' }}>
              <div style={{ height: '100%', width: `${Math.min((need.quantity_fulfilled / need.quantity_required) * 100, 100)}%`, background: urgencyColor(need.urgency), borderRadius: '999px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{need.quantity_fulfilled} of {need.quantity_required} {need.unit} fulfilled</span>
              <span style={{ fontSize: '11px', color: urgencyColor(need.urgency), fontWeight: '500' }}>{need.quantity_required - need.quantity_fulfilled} remaining</span>
            </div>

            <button onClick={() => navigate('/donate', { state: { need, home: need.home_id } })}
              style={{ width: '100%', height: '42px', borderRadius: '10px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              💝 Donate for this need
            </button>
          </div>
        ))}
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
            <span style={{ fontSize: '9px', color: item.id === 'notifications' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'notifications' ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
