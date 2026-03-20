import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlerts, markAlertDone, snoozeAlert, createAlert, getMembers } from '../services/api';
import { Card, Badge, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const timeAgo = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const QUICK_TIMES = ['6:00 AM', '8:00 AM', '12:00 PM', '2:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'];

export default function CareWorkerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [selectedType, setSelectedType] = useState('medicine');
  const [form, setForm] = useState({
    title: '',
    member_id: '',
    medicine_name: '',
    dosage: '',
    frequency: 'daily',
    time_slots: [],
    scheduled_at: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const homeId = user?.home_id;
    if (!homeId) return;
    Promise.all([
      getAlerts(homeId, { date: new Date().toISOString().split('T')[0] }),
      getMembers(homeId)
    ]).then(([aRes, mRes]) => {
      setAlerts(aRes.data.data);
      setMembers(mRes.data.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDone = async (alertId) => {
    try {
      await markAlertDone(user.home_id, alertId);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'done' } : a));
      toast.success('Marked as done!');
    } catch { toast.error('Failed'); }
  };

  const handleSnooze = async (alertId) => {
    try {
      await snoozeAlert(user.home_id, alertId);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'snoozed' } : a));
      toast.success('Snoozed for 30 minutes');
    } catch { toast.error('Failed'); }
  };

  const handleAddAlert = async () => {
    if (!form.title || !form.member_id) return toast.error('Please fill in all required fields');
    setSaving(true);
    try {
      const payload = {
        type: selectedType,
        title: form.title,
        member_id: form.member_id,
        scheduled_at: form.scheduled_at || new Date().toISOString(),
        recurrence: form.frequency,
        medicine_details: selectedType === 'medicine' ? {
          name: form.medicine_name,
          dosage: form.dosage,
          time_slot: form.time_slots[0] || ''
        } : undefined
      };
      const res = await createAlert(user.home_id, payload);
      setAlerts(prev => [res.data.data, ...prev]);
      setShowAddAlert(false);
      setForm({ title: '', member_id: '', medicine_name: '', dosage: '', frequency: 'daily', time_slots: [], scheduled_at: '' });
      toast.success('Alert added! Admin has been notified.');
    } catch { toast.error('Failed to add alert'); }
    setSaving(false);
  };

  const toggleTimeSlot = (time) => {
    setForm(prev => ({
      ...prev,
      time_slots: prev.time_slots.includes(time)
        ? prev.time_slots.filter(t => t !== time)
        : [...prev.time_slots, time]
    }));
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const overdueAlerts = alerts.filter(a => a.status === 'pending' && new Date(a.scheduled_at) < new Date());
  const doneAlerts = alerts.filter(a => a.status === 'done');
  const getAlertColor = (alert) => {
    if (alert.status === 'done') return '#1D9E75';
    if (new Date(alert.scheduled_at) < new Date()) return '#E24B4A';
    return '#BA7517';
  };

  const shiftGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const ALERT_TYPES = [
    { value: 'medicine', label: '💊 Medicine' },
    { value: 'checkup', label: '🩺 Checkup' },
    { value: 'vaccination', label: '💉 Vaccination' }
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#D4537E', padding: '20px 24px 28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Care worker</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>{shiftGreeting()}, {user?.name?.split(' ')[0]} 👋</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
              {user?.shift === 'morning' ? 'Morning shift · 6AM–2PM' : user?.shift === 'night' ? 'Night shift · 10PM–6AM' : 'Full time · 9AM–6PM'}
            </div>
          </div>
          <button onClick={logout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { num: overdueAlerts.length, label: 'Overdue', color: overdueAlerts.length > 0 ? '#FCEBEB' : 'rgba(255,255,255,0.18)' },
            { num: pendingAlerts.length, label: 'Pending', color: 'rgba(255,255,255,0.18)' },
            { num: doneAlerts.length, label: 'Done today', color: 'rgba(255,255,255,0.18)' }
          ].map((s, i) => (
            <div key={i} style={{ background: s.color, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: i === 0 && overdueAlerts.length > 0 ? '#A32D2D' : '#fff', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '10px', color: i === 0 && overdueAlerts.length > 0 ? '#E24B4A' : 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Add medicine alert */}
        {user?.permissions?.mark_alerts_done !== false && (
          <button onClick={() => setShowAddAlert(!showAddAlert)}
            style={{ width: '100%', height: '48px', borderRadius: '12px', border: `1.5px dashed ${showAddAlert ? '#e0e0e0' : '#D4537E'}`, background: showAddAlert ? '#f8f8f8' : '#FBEAF0', color: showAddAlert ? '#9e9e9e' : '#D4537E', fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {showAddAlert ? '✕ Cancel' : '+ Add medicine alert'}
          </button>
        )}

        {/* Add alert form */}
        {showAddAlert && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '20px', border: '1px solid #ED93B1' }}>
            <div style={{ background: '#E6F1FB', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#0C447C', lineHeight: 1.6 }}>
              ℹ️ Alerts you add go live immediately. The administrator will be notified to review.
            </div>

            {/* Alert type */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {ALERT_TYPES.map(t => (
                <button key={t.value} onClick={() => setSelectedType(t.value)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', border: `1.5px solid ${selectedType === t.value ? '#D4537E' : '#e0e0e0'}`, background: selectedType === t.value ? '#FBEAF0' : 'transparent', color: selectedType === t.value ? '#72243E' : '#9e9e9e', fontWeight: selectedType === t.value ? '600' : '400' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Member */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Select member</div>
              <select value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                style={{ width: '100%', height: '42px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                <option value="">Select a member</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.name}, {m.age} · {m.room_number || 'No room'}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Alert title</div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={selectedType === 'medicine' ? 'e.g. Paracetamol 500mg' : selectedType === 'checkup' ? 'e.g. Dr. Prasad visit' : 'e.g. Flu vaccine'}
                style={{ width: '100%', height: '42px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            </div>

            {/* Medicine specific fields */}
            {selectedType === 'medicine' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Dosage</div>
                    <input value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))}
                      placeholder="e.g. 2 tablets"
                      style={{ width: '100%', height: '42px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Frequency</div>
                    <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                      style={{ width: '100%', height: '42px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="once">Once</option>
                    </select>
                  </div>
                </div>

                {/* Time slots */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>Time slots</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {QUICK_TIMES.map(t => (
                      <button key={t} onClick={() => toggleTimeSlot(t)}
                        style={{ padding: '5px 10px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${form.time_slots.includes(t) ? '#D4537E' : '#e0e0e0'}`, background: form.time_slots.includes(t) ? '#FBEAF0' : 'transparent', color: form.time_slots.includes(t) ? '#72243E' : '#9e9e9e' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Schedule time for non-medicine */}
            {selectedType !== 'medicine' && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Schedule date & time</div>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            )}

            <button onClick={handleAddAlert} disabled={saving}
              style={{ width: '100%', height: '44px', borderRadius: '10px', background: saving ? '#e0e0e0' : '#D4537E', border: 'none', color: saving ? '#9e9e9e' : '#fff', fontSize: '13px', fontWeight: '500', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save & go live ✓'}
            </button>
          </div>
        )}

        {/* Today's tasks */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Today's tasks</div>
          <span style={{ fontSize: '12px', color: '#9e9e9e' }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Overdue section */}
        {overdueAlerts.length > 0 && (
          <>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#E24B4A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A' }} />
              Overdue — needs attention
            </div>
            {overdueAlerts.map(alert => (
              <AlertCard key={alert._id} alert={alert} onDone={handleDone} onSnooze={handleSnooze} color="#E24B4A" />
            ))}
          </>
        )}

        {/* Pending section */}
        {pendingAlerts.filter(a => new Date(a.scheduled_at) >= new Date()).length > 0 && (
          <>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: overdueAlerts.length > 0 ? '16px' : '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#BA7517' }} />
              Upcoming
            </div>
            {pendingAlerts.filter(a => new Date(a.scheduled_at) >= new Date()).map(alert => (
              <AlertCard key={alert._id} alert={alert} onDone={handleDone} onSnooze={handleSnooze} color="#BA7517" />
            ))}
          </>
        )}

        {/* Done section */}
        {doneAlerts.length > 0 && (
          <>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75' }} />
              Completed
            </div>
            {doneAlerts.map(alert => (
              <AlertCard key={alert._id} alert={alert} onDone={handleDone} onSnooze={handleSnooze} color="#1D9E75" done />
            ))}
          </>
        )}

        {alerts.length === 0 && (
          <EmptyState icon="✅" title="No tasks for today" subtitle="You're all caught up!" />
        )}

        {/* Members section */}
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', marginTop: '24px' }}>Members in your care</div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
          {members.slice(0, 8).map(m => (
            <div key={m._id} style={{ background: '#fff', borderRadius: '12px', padding: '12px', minWidth: '90px', textAlign: 'center', border: '0.5px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#D4537E', margin: '0 auto 8px' }}>
                {m.name[0]}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#212121' }}>{m.name.split(' ')[0]}</div>
              <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>Room {m.room_number || '—'}</div>
              {m.medicines?.length > 0 && (
                <div style={{ fontSize: '10px', color: '#D4537E', marginTop: '4px' }}>💊 {m.medicines.length}</div>
              )}
            </div>
          ))}
          {members.length === 0 && <div style={{ fontSize: '13px', color: '#9e9e9e' }}>No members added yet</div>}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'alerts', label: 'Alerts', icon: '🔔' },
          { id: 'profile', label: 'Profile', icon: '👤' }
        ].map(item => (
          <div key={item.id} onClick={() => {
            setActiveNav(item.id);
            if (item.id === 'alerts') navigate('/alerts');
            if (item.id === 'profile') navigate('/care-worker-profile');
          }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: activeNav === item.id ? '#D4537E' : '#9e9e9e', fontWeight: activeNav === item.id ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Alert card component
const AlertCard = ({ alert, onDone, onSnooze, color, done }) => {
  const typeEmoji = { medicine: '💊', checkup: '🩺', vaccination: '💉', birthday: '🎂', stock_refill: '📦' };
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', marginBottom: '10px', border: '0.5px solid #f0f0f0', borderLeft: `3px solid ${color}`, borderRadius: '0 14px 14px 0', opacity: done ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
          <span style={{ fontSize: '16px' }}>{typeEmoji[alert.type] || '🔔'}</span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#212121' }}>{alert.title}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#9e9e9e', flexShrink: 0 }}>
          {new Date(alert.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {alert.member_id?.name && (
        <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '8px', marginLeft: '23px' }}>
          {alert.member_id.name}, {alert.member_id.age} · Room {alert.member_id.room_number || '—'}
        </div>
      )}
      {alert.medicine_details?.dosage && (
        <div style={{ fontSize: '11px', color: '#D4537E', marginBottom: '8px', marginLeft: '23px', background: '#FBEAF0', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
          {alert.medicine_details.dosage}
        </div>
      )}
      {!done && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button onClick={() => onSnooze(alert._id)}
            style={{ flex: 1, height: '34px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '12px', color: '#757575', cursor: 'pointer' }}>
            Snooze 30m
          </button>
          <button onClick={() => onDone(alert._id)}
            style={{ flex: 2, height: '34px', borderRadius: '8px', border: 'none', background: '#D4537E', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
            Mark done
          </button>
        </div>
      )}
      {done && (
        <div style={{ fontSize: '11px', color: '#1D9E75', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
          Completed
        </div>
      )}
    </div>
  );
};