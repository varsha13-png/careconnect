import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlerts, createAlert, markAlertDone, snoozeAlert, rejectAlert } from '../services/api';
import { Card, Badge, Button, Input, Select, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const ALERT_TYPES = [
  { value: 'medicine', label: '💊 Medicine', color: '#FBEAF0' },
  { value: 'checkup', label: '🩺 Checkup', color: '#E6F1FB' },
  { value: 'vaccination', label: '💉 Vaccination', color: '#E1F5EE' },
  { value: 'birthday', label: '🎂 Birthday', color: '#FAEEDA' },
  { value: 'stock_refill', label: '📦 Stock refill', color: '#EEEDFE' }
];

export default function AlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('today');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({ title: '', scheduled_at: '', recurrence: 'daily', medicine_details: { name: '', dosage: '', time_slot: '' } });

  useEffect(() => {
    fetchAlerts();
  }, [tab]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab === 'today') params.date = new Date().toISOString().split('T')[0];
      if (tab === 'history') params.status = 'done';
      const res = await getAlerts(user.home_id, params);
      setAlerts(res.data.data);
    } catch { toast.error('Failed to load alerts'); }
    setLoading(false);
  };

  const handleDone = async (alertId) => {
    try {
      await markAlertDone(user.home_id, alertId);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'done' } : a));
      toast.success('Done!');
    } catch { toast.error('Failed'); }
  };

  const handleSnooze = async (alertId) => {
    try {
      await snoozeAlert(user.home_id, alertId);
      toast.success('Snoozed for 30 minutes');
    } catch { toast.error('Failed'); }
  };

  const handleCreate = async () => {
    try {
      await createAlert(user.home_id, { ...form, type: selectedType });
      toast.success('Alert created!');
      setShowAddForm(false);
      setSelectedType(null);
      fetchAlerts();
    } catch { toast.error('Failed to create alert'); }
  };

  const overdueAlerts = alerts.filter(a => a.status === 'pending' && new Date(a.scheduled_at) < new Date());
  const pendingAlerts = alerts.filter(a => a.status === 'pending' && new Date(a.scheduled_at) >= new Date());
  const doneAlerts = alerts.filter(a => a.status === 'done');

  const getColor = (alert) => {
    if (alert.status === 'done') return '#1D9E75';
    if (new Date(alert.scheduled_at) < new Date()) return '#E24B4A';
    return '#BA7517';
  };

  const renderAlert = (alert) => (
    <Card key={alert._id} style={{ borderLeft: `3px solid ${getColor(alert)}`, borderRadius: '0 14px 14px 0', opacity: alert.status === 'done' ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#FBEAF0', color: '#72243E', fontWeight: '500', marginRight: '6px' }}>
            {ALERT_TYPES.find(t => t.value === alert.type)?.label || alert.type}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#9e9e9e' }}>
          {new Date(alert.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{alert.title}</div>
      <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '8px' }}>
        {alert.member_id?.name ? `${alert.member_id.name}, ${alert.member_id.age} · Member` : 'Stock alert'}
      </div>
      {alert.status === 'done' ? (
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#E1F5EE', color: '#085041' }}>✓ Completed</span>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleSnooze(alert._id)}
            style={{ flex: 1, height: '32px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '11px', color: '#757575', cursor: 'pointer' }}>
            Snooze 30m
          </button>
          <button onClick={() => handleDone(alert._id)}
            style={{ flex: 2, height: '32px', borderRadius: '8px', border: 'none', background: '#D4537E', color: '#fff', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}>
            Mark done
          </button>
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', background: '#fff', borderBottom: '0.5px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Alerts</span>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FBEAF0', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#D4537E' }}>+</button>
        </div>

        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: 'Overdue', count: overdueAlerts.length, bg: '#FCEBEB', color: '#A32D2D' },
            { label: 'Pending', count: pendingAlerts.length, bg: '#FAEEDA', color: '#633806' },
            { label: 'Done', count: doneAlerts.length, bg: '#E1F5EE', color: '#085041' }
          ].map(p => (
            <div key={p.label} style={{ flex: 1, background: p.bg, borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: p.color }}>{p.count}</div>
              <div style={{ fontSize: '10px', color: p.color }}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0' }}>
          {['today', 'upcoming', 'history'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', fontSize: '13px', border: 'none', background: 'transparent',
                borderBottom: tab === t ? '2px solid #D4537E' : '2px solid transparent',
                color: tab === t ? '#D4537E' : '#9e9e9e', fontWeight: tab === t ? '600' : '400',
                cursor: 'pointer', textTransform: 'capitalize'
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Add form */}
        {showAddForm && (
          <div style={{ background: '#FBEAF0', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid #ED93B1' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#72243E', marginBottom: '12px' }}>Add alert</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {ALERT_TYPES.map(t => (
                <button key={t.value} onClick={() => setSelectedType(t.value)}
                  style={{
                    padding: '10px', borderRadius: '10px', border: `1.5px solid ${selectedType === t.value ? '#D4537E' : '#e0e0e0'}`,
                    background: selectedType === t.value ? '#fff' : 'transparent',
                    fontSize: '12px', cursor: 'pointer', textAlign: 'center', fontWeight: selectedType === t.value ? '500' : '400'
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            {selectedType && (
              <>
                <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
                <Input label="Schedule" type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
                <Select label="Frequency" value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}
                  options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'once', label: 'Once' }]} />
                <button onClick={handleCreate}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  Save alert ✓
                </button>
              </>
            )}
          </div>
        )}

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div> : (
          <>
            {overdueAlerts.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: '8px' }}>Overdue</div>
                {overdueAlerts.map(renderAlert)}
              </>
            )}
            {pendingAlerts.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: '16px' }}>Pending</div>
                {pendingAlerts.map(renderAlert)}
              </>
            )}
            {doneAlerts.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: '16px' }}>Completed</div>
                {doneAlerts.map(renderAlert)}
              </>
            )}
            {alerts.length === 0 && <EmptyState icon="✅" title="No alerts" subtitle="All clear for this period" />}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {(user?.role === 'care_worker' ? [
          { id: 'alerts', label: 'Alerts', icon: '🔔', path: '/alerts' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/care-worker-profile' }
        ] : [
          { id: 'home', label: 'Home', icon: '🏠', path: '/dashboard' },
          { id: 'members', label: 'Members', icon: '👥', path: '/members' },
          { id: 'alerts', label: 'Alerts', icon: '🔔', path: '/alerts' },
          { id: 'needs', label: 'Needs & Donations', icon: '📋', path: '/needs' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
        ]).map(item => (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: item.id === 'alerts' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'alerts' ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}