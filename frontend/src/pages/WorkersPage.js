import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inviteWorker, getWorkers } from '../services/api';
import API from '../services/api';
import { Card, Input, Select, Spinner, EmptyState, Avatar } from '../components/UI';
import toast from 'react-hot-toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RESPONSIBILITIES = [
  { id: 'medicine', label: 'Medicine administration' },
  { id: 'meal', label: 'Meal assistance' },
  { id: 'hygiene', label: 'Hygiene & grooming' },
  { id: 'physiotherapy', label: 'Physiotherapy support' },
  { id: 'emotional', label: 'Emotional support' }
];

export default function WorkersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // list | add | success
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    designation: '',
    shift: 'morning',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    responsibilities: ['medicine', 'meal'],
    language_preference: 'english',
    emergency_contact: { name: '', relation: '', phone: '' },
    permissions: {
      view_alerts: true,
      mark_alerts_done: true,
      view_resident_diet: true,
      view_medical_history: false,
      manage_needs: false
    }
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await getWorkers(user.home_id);
      setWorkers(res.data.data);
    } catch { toast.error('Failed to load workers'); }
    setLoading(false);
  };

  const handleRemove = async (workerId) => {
    if (!window.confirm('Remove this care worker?')) return;
    try {
      await API.delete(`/homes/${user.home_id}/workers/${workerId}`);
      setWorkers(prev => prev.filter(w => w._id !== workerId));
      toast.success('Care worker removed');
    } catch { toast.error('Failed to remove worker'); }
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  const toggleResponsibility = (id) => {
    setForm(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.includes(id)
        ? prev.responsibilities.filter(r => r !== id)
        : [...prev.responsibilities, id]
    }));
  };

  const togglePermission = (key) => {
    setForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
    }));
  };

  const updateEmergency = (field, value) => {
    setForm(prev => ({ ...prev, emergency_contact: { ...prev.emergency_contact, [field]: value } }));
  };

  const handleInvite = async () => {
    if (!form.name || !form.phone) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      const res = await inviteWorker(user.home_id, form);
      setInviteCode(res.data.invite_code);
      setView('success');
      fetchWorkers();
      toast.success('Care worker invited!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite worker');
    }
    setSaving(false);
  };

  const shiftLabel = { morning: 'Morning (6AM–2PM)', night: 'Night (10PM–6AM)', fulltime: 'Full time (9AM–6PM)' };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 24px 0', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => view !== 'list' ? setView('list') : navigate('/profile')}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>
              {view === 'list' ? 'Care workers' : view === 'success' ? 'Invite sent!' : 'Add care worker'}
            </span>
          </div>
          {view === 'list' && (
            <button onClick={() => { setView('add'); setStep(1); }}
              style={{ height: '34px', padding: '0 14px', borderRadius: '8px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Invite worker
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* ── List view ── */}
        {view === 'list' && (
          <>
            {loading
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>
              : workers.length === 0
                ? <EmptyState icon="👥" title="No care workers yet" subtitle="Invite your first care worker to get started" />
                : workers.map(w => (
                  <Card key={w._id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar name={w.name} size={44} color={w.invite_status === 'accepted' ? '#D4537E' : '#9e9e9e'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{w.name}</span>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: w.invite_status === 'accepted' ? '#E1F5EE' : '#FAEEDA', color: w.invite_status === 'accepted' ? '#085041' : '#633806', fontWeight: '500' }}>
                            {w.invite_status === 'accepted' ? 'Active' : 'Pending invite'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9e9e9e' }}>{w.designation || 'Care worker'} · {shiftLabel[w.shift] || w.shift}</div>
                        <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '2px' }}>
                          {w.working_days?.join(', ')}
                        </div>
                      </div>
                      <button onClick={() => handleRemove(w._id)}
                        style={{ background: '#FCEBEB', border: '0.5px solid #E24B4A', borderRadius: '8px', color: '#A32D2D', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>
                        Remove
                      </button>
                    </div>
                    {w.responsibilities?.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {w.responsibilities.map(r => (
                          <span key={r} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#FBEAF0', color: '#72243E' }}>
                            {RESPONSIBILITIES.find(res => res.id === r)?.label || r}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
            }
          </>
        )}

        {/* ── Add worker form ── */}
        {view === 'add' && (
          <>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {['Basic info', 'Work details', 'Emergency', 'Permissions'].map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: '4px', borderRadius: '999px', background: i + 1 <= step ? '#D4537E' : '#f0f0f0', marginBottom: '4px', transition: 'background 0.3s' }} />
                  <div style={{ fontSize: '9px', color: i + 1 === step ? '#D4537E' : '#9e9e9e', fontWeight: i + 1 === step ? '600' : '400' }}>{s}</div>
                </div>
              ))}
            </div>

            {/* Step 1 — Basic info */}
            {step === 1 && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Basic information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input label="First name" value={form.name.split(' ')[0]} onChange={e => update('name', `${e.target.value} ${form.name.split(' ')[1] || ''}`.trim())} placeholder="Anita" />
                  <Input label="Last name" value={form.name.split(' ')[1] || ''} onChange={e => update('name', `${form.name.split(' ')[0]} ${e.target.value}`.trim())} placeholder="Devi" />
                </div>
                <Input label="Phone number" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="98765 43210" prefix="+91" />
                <Input label="Designation" value={form.designation} onChange={e => update('designation', e.target.value)} placeholder="e.g. Senior care worker" />
                <Select label="Language preference" value={form.language_preference} onChange={e => update('language_preference', e.target.value)}
                  options={[
                    { value: 'english', label: 'English' },
                    { value: 'hindi', label: 'Hindi' },
                    { value: 'telugu', label: 'Telugu' },
                    { value: 'tamil', label: 'Tamil' },
                    { value: 'kannada', label: 'Kannada' },
                    { value: 'marathi', label: 'Marathi' }
                  ]} />
              </div>
            )}

            {/* Step 2 — Work details */}
            {step === 2 && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Work details</div>

                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>Shift</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    { value: 'morning', label: 'Morning', time: '6:00 AM – 2:00 PM' },
                    { value: 'night', label: 'Night', time: '10:00 PM – 6:00 AM' },
                    { value: 'fulltime', label: 'Full time', time: '9:00 AM – 6:00 PM' }
                  ].map(s => (
                    <div key={s.value} onClick={() => update('shift', s.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${form.shift === s.value ? '#D4537E' : '#e0e0e0'}`, background: form.shift === s.value ? '#FBEAF0' : '#fff', cursor: 'pointer' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${form.shift === s.value ? '#D4537E' : '#e0e0e0'}`, background: form.shift === s.value ? '#D4537E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {form.shift === s.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: form.shift === s.value ? '#72243E' : '#212121' }}>{s.label}</div>
                        <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{s.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>Working days</div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(day)}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1.5px solid ${form.working_days.includes(day) ? '#D4537E' : '#e0e0e0'}`, background: form.working_days.includes(day) ? '#FBEAF0' : 'transparent', color: form.working_days.includes(day) ? '#72243E' : '#9e9e9e', fontSize: '11px', fontWeight: form.working_days.includes(day) ? '600' : '400', cursor: 'pointer' }}>
                      {day}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>Responsibilities</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {RESPONSIBILITIES.map(r => (
                    <div key={r.id} onClick={() => toggleResponsibility(r.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `0.5px solid ${form.responsibilities.includes(r.id) ? '#D4537E' : '#e0e0e0'}`, background: form.responsibilities.includes(r.id) ? '#FBEAF0' : '#fff', cursor: 'pointer' }}>
                      <span style={{ fontSize: '13px', color: form.responsibilities.includes(r.id) ? '#72243E' : '#212121' }}>{r.label}</span>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `1.5px solid ${form.responsibilities.includes(r.id) ? '#D4537E' : '#e0e0e0'}`, background: form.responsibilities.includes(r.id) ? '#D4537E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {form.responsibilities.includes(r.id) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Emergency contact */}
            {step === 3 && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Emergency contact</div>
                <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '20px' }}>In case something happens during shift</div>
                <Input label="Contact name" value={form.emergency_contact.name} onChange={e => updateEmergency('name', e.target.value)} placeholder="e.g. Suresh Kumar" />
                <Select label="Relation" value={form.emergency_contact.relation} onChange={e => updateEmergency('relation', e.target.value)}
                  options={[
                    { value: '', label: 'Select relation' },
                    { value: 'Spouse', label: 'Spouse' },
                    { value: 'Parent', label: 'Parent' },
                    { value: 'Sibling', label: 'Sibling' },
                    { value: 'Friend', label: 'Friend' },
                    { value: 'Other', label: 'Other' }
                  ]} />
                <Input label="Phone number" value={form.emergency_contact.phone} onChange={e => updateEmergency('phone', e.target.value)} placeholder="98765 43210" prefix="+91" />
              </div>
            )}

            {/* Step 4 — Permissions */}
            {step === 4 && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Permissions</div>
                <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '20px', lineHeight: 1.6 }}>
                  Control what this care worker can see and do in the app
                </div>
                {[
                  { key: 'view_alerts', label: 'View alerts', sub: 'See medicine and appointment reminders' },
                  { key: 'mark_alerts_done', label: 'Mark alerts done', sub: 'Complete tasks and reminders' },
                  { key: 'view_resident_diet', label: 'View diet & needs', sub: 'See member dietary requirements' },
                  { key: 'view_medical_history', label: 'View medical history', sub: 'See full medical records' },
                  { key: 'manage_needs', label: 'Manage needs list', sub: 'Add and edit home needs' }
                ].map(p => (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.label}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '2px' }}>{p.sub}</div>
                    </div>
                    <div onClick={() => togglePermission(p.key)}
                      style={{ width: '40px', height: '22px', borderRadius: '999px', background: form.permissions[p.key] ? '#D4537E' : '#e0e0e0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: form.permissions[p.key] ? '20px' : '2px', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  style={{ flex: 1, height: '48px', borderRadius: '10px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '14px', color: '#757575', cursor: 'pointer' }}>
                  ← Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)}
                  style={{ flex: 2, height: '48px', borderRadius: '10px', border: 'none', background: '#D4537E', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Next →
                </button>
              ) : (
                <button onClick={handleInvite} disabled={saving}
                  style={{ flex: 2, height: '48px', borderRadius: '10px', border: 'none', background: saving ? '#e0e0e0' : '#D4537E', color: saving ? '#9e9e9e' : '#fff', fontSize: '14px', fontWeight: '500', cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? 'Sending invite...' : 'Send invite ✓'}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Success view ── */}
        {view === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>Invite sent!</div>
            <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '28px', lineHeight: 1.6 }}>
              {form.name} will receive an SMS with the invite code to join Care Connect
            </div>

            <div style={{ background: '#FBEAF0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '8px' }}>Invite code</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#D4537E', letterSpacing: '6px', marginBottom: '8px' }}>{inviteCode}</div>
              <div style={{ fontSize: '12px', color: '#993556' }}>Share this code with {form.name.split(' ')[0]} if SMS doesn't reach them</div>
            </div>

            <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#9e9e9e', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Summary</div>
              {[
                { label: 'Name', value: form.name },
                { label: 'Phone', value: `+91 ${form.phone}` },
                { label: 'Shift', value: shiftLabel[form.shift] },
                { label: 'Working days', value: form.working_days.join(', ') }
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                  <span style={{ fontSize: '12px', color: '#9e9e9e' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => { setView('add'); setStep(1); setForm({ name: '', phone: '', designation: '', shift: 'morning', working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], responsibilities: ['medicine', 'meal'], language_preference: 'english', emergency_contact: { name: '', relation: '', phone: '' }, permissions: { view_alerts: true, mark_alerts_done: true, view_resident_diet: true, view_medical_history: false, manage_needs: false } }); }}
              style={{ width: '100%', height: '48px', borderRadius: '10px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '10px' }}>
              Invite another worker
            </button>
            <button onClick={() => setView('list')}
              style={{ width: '100%', height: '48px', borderRadius: '10px', background: 'transparent', border: '0.5px solid #e0e0e0', color: '#757575', fontSize: '14px', cursor: 'pointer' }}>
              Back to workers list
            </button>
          </div>
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