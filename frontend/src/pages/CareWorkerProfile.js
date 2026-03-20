import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RESPONSIBILITIES = {
  medicine: 'Medicine administration',
  meal: 'Meal assistance',
  hygiene: 'Hygiene & grooming',
  physiotherapy: 'Physiotherapy support',
  emotional: 'Emotional support'
};

export default function CareWorkerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const shiftLabel = {
    morning: 'Morning · 6:00 AM – 2:00 PM',
    night: 'Night · 10:00 PM – 6:00 AM',
    fulltime: 'Full time · 9:00 AM – 6:00 PM'
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {user?.name?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{user?.designation || 'Care worker'}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>+91 {user?.phone}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Work details */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>Work details</div>
          {[
            { label: 'Shift', value: shiftLabel[user?.shift] || user?.shift || '—' },
            { label: 'Working days', value: user?.working_days?.join(', ') || '—' },
            { label: 'Language', value: user?.language_preference || 'English' }
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ fontSize: '13px', color: '#9e9e9e' }}>{row.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#212121', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Responsibilities */}
        {user?.responsibilities?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Responsibilities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {user.responsibilities.map(r => (
                <span key={r} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '999px', background: '#FBEAF0', color: '#72243E', fontWeight: '500' }}>
                  {RESPONSIBILITIES[r] || r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Permissions */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>My permissions</div>
          {[
            { key: 'view_alerts', label: 'View alerts' },
            { key: 'mark_alerts_done', label: 'Mark alerts done' },
            { key: 'view_resident_diet', label: 'View diet & needs' },
            { key: 'view_medical_history', label: 'View medical history' },
            { key: 'manage_needs', label: 'Manage needs list' }
          ].map(p => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ fontSize: '13px', color: '#212121' }}>{p.label}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: user?.permissions?.[p.key] ? '#E1F5EE' : '#f0f0f0', color: user?.permissions?.[p.key] ? '#085041' : '#9e9e9e', fontWeight: '500' }}>
                {user?.permissions?.[p.key] ? '✓ Allowed' : '✗ Restricted'}
              </span>
            </div>
          ))}
        </div>

        {/* Emergency contact */}
        {user?.emergency_contact?.name && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Emergency contact</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#0C447C' }}>
                {user.emergency_contact.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{user.emergency_contact.name}</div>
                <div style={{ fontSize: '12px', color: '#9e9e9e' }}>{user.emergency_contact.relation}</div>
                <div style={{ fontSize: '12px', color: '#D4537E' }}>+91 {user.emergency_contact.phone}</div>
              </div>
            </div>
          </div>
        )}

        <button onClick={logout}
          style={{ width: '100%', height: '48px', borderRadius: '12px', border: '0.5px solid #E24B4A', background: '#FCEBEB', color: '#A32D2D', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {[
          { id: 'alerts', label: 'Alerts', icon: '🔔', path: '/alerts' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/care-worker-profile' }
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