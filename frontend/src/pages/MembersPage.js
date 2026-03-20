import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMembers, createMember, updateMember, dischargeMember } from '../services/api';
import { Card, Badge, Button, Input, Select, Spinner, EmptyState, Avatar, Toggle } from '../components/UI';
import toast from 'react-hot-toast';

// ─── Add Member Form ──────────────────────────────────────
const AddMemberForm = ({ onClose, onSave, homeId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', gender: 'male', room_number: '',
    medical_history: '',
    medicines: [],
    emergency_contacts: [{ name: '', relation: '', phone: '' }],
    special_needs: { disability: '', mental_health: '', dietary: '', other: '' }
  });

  const [newMedicine, setNewMedicine] = useState({
    name: '', dosage: '', frequency: 'daily',
    time_slots: [{ time: '8:00 AM', dose: '' }]
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateSpecial = (field, value) => setForm(prev => ({ ...prev, special_needs: { ...prev.special_needs, [field]: value } }));

  const addMedicine = () => {
    if (!newMedicine.name) return toast.error('Enter medicine name');
    setForm(prev => ({ ...prev, medicines: [...prev.medicines, { ...newMedicine }] }));
    setNewMedicine({ name: '', dosage: '', frequency: 'daily', time_slots: [{ time: '8:00 AM', dose: '' }] });
    toast.success('Medicine added');
  };

  const removeMedicine = (index) => setForm(prev => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== index) }));

  const addTimeSlot = () => setNewMedicine(prev => ({ ...prev, time_slots: [...prev.time_slots, { time: '', dose: '' }] }));

  const handleSave = async () => {
    if (!form.name || !form.age) return toast.error('Name and age are required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        medical_history: form.medical_history.split('\n').filter(Boolean)
      };
      await createMember(homeId, payload);
      toast.success(`${form.name} admitted successfully!`);
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
    setLoading(false);
  };

  const QUICK_TIMES = ['6:00 AM', '8:00 AM', '12:00 PM', '2:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>Add new member</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', padding: '12px 24px', flexShrink: 0 }}>
          {['Basic', 'Medical', 'Medicines', 'Contacts'].map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: '4px', borderRadius: '999px', background: i + 1 <= step ? '#D4537E' : '#f0f0f0', marginBottom: '4px', transition: 'background 0.3s' }} />
              <div style={{ fontSize: '10px', color: i + 1 === step ? '#D4537E' : '#9e9e9e', fontWeight: i + 1 === step ? '600' : '400' }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <>
              <Input label="Full name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Ramaiah" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Input label="Age" value={form.age} onChange={e => update('age', e.target.value)} placeholder="78" />
                <Select label="Gender" value={form.gender} onChange={e => update('gender', e.target.value)}
                  options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
              </div>
              <Input label="Room number" value={form.room_number} onChange={e => update('room_number', e.target.value)} placeholder="e.g. Room 4" />
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Special needs</div>
                <Input label="Disability (if any)" value={form.special_needs.disability} onChange={e => updateSpecial('disability', e.target.value)} placeholder="e.g. Mobility impaired" />
                <Input label="Dietary requirements" value={form.special_needs.dietary} onChange={e => updateSpecial('dietary', e.target.value)} placeholder="e.g. Diabetic diet, no salt" />
                <Input label="Mental health notes" value={form.special_needs.mental_health} onChange={e => updateSpecial('mental_health', e.target.value)} placeholder="e.g. Mild dementia" />
              </div>
            </>
          )}

          {/* Step 2 — Medical history */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Medical history</div>
                <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '8px' }}>Enter each condition on a new line</div>
                <textarea value={form.medical_history} onChange={e => update('medical_history', e.target.value)}
                  placeholder="e.g. Type 2 Diabetes&#10;Hypertension&#10;Arthritis"
                  style={{ width: '100%', minHeight: '120px', borderRadius: '10px', border: '0.5px solid #e0e0e0', padding: '12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
              </div>
              {form.medical_history && (
                <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#9e9e9e', marginBottom: '8px', textTransform: 'uppercase' }}>Preview</div>
                  {form.medical_history.split('\n').filter(Boolean).map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4537E', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px' }}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 3 — Medicines */}
          {step === 3 && (
            <>
              {/* Existing medicines */}
              {form.medicines.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px', fontWeight: '500' }}>Added medicines ({form.medicines.length})</div>
                  {form.medicines.map((m, i) => (
                    <div key={i} style={{ background: '#FBEAF0', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#72243E' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: '#993556' }}>{m.dosage} · {m.frequency} · {m.time_slots.map(t => t.time).join(', ')}</div>
                      </div>
                      <button onClick={() => removeMedicine(i)} style={{ background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new medicine */}
              <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#212121' }}>Add medicine</div>
                <Input label="Medicine name" value={newMedicine.name} onChange={e => setNewMedicine(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input label="Dosage" value={newMedicine.dosage} onChange={e => setNewMedicine(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 2 tablets" />
                  <Select label="Frequency" value={newMedicine.frequency} onChange={e => setNewMedicine(p => ({ ...p, frequency: e.target.value }))}
                    options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'once', label: 'Once' }]} />
                </div>

                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '6px' }}>Time slots</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {QUICK_TIMES.map(t => (
                    <button key={t} onClick={() => {
                      const exists = newMedicine.time_slots.find(s => s.time === t);
                      if (!exists) setNewMedicine(p => ({ ...p, time_slots: [...p.time_slots, { time: t, dose: p.dosage }] }));
                    }}
                      style={{
                        padding: '4px 10px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer',
                        border: `0.5px solid ${newMedicine.time_slots.find(s => s.time === t) ? '#D4537E' : '#e0e0e0'}`,
                        background: newMedicine.time_slots.find(s => s.time === t) ? '#FBEAF0' : 'transparent',
                        color: newMedicine.time_slots.find(s => s.time === t) ? '#72243E' : '#9e9e9e'
                      }}>
                      {t}
                    </button>
                  ))}
                </div>

                {newMedicine.time_slots.map((slot, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#D4537E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                    <input value={slot.time} onChange={e => {
                      const slots = [...newMedicine.time_slots];
                      slots[i].time = e.target.value;
                      setNewMedicine(p => ({ ...p, time_slots: slots }));
                    }} placeholder="Time" style={{ flex: 1, height: '36px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                    <input value={slot.dose} onChange={e => {
                      const slots = [...newMedicine.time_slots];
                      slots[i].dose = e.target.value;
                      setNewMedicine(p => ({ ...p, time_slots: slots }));
                    }} placeholder="Dose" style={{ flex: 1, height: '36px', borderRadius: '8px', border: '0.5px solid #e0e0e0', padding: '0 10px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                    {i > 0 && <button onClick={() => setNewMedicine(p => ({ ...p, time_slots: p.time_slots.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer' }}>✕</button>}
                  </div>
                ))}

                <button onClick={addMedicine}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px dashed #D4537E', background: 'transparent', color: '#D4537E', fontSize: '12px', fontWeight: '500', cursor: 'pointer', marginTop: '8px' }}>
                  + Add this medicine
                </button>
              </div>
            </>
          )}

          {/* Step 4 — Emergency contacts */}
          {step === 4 && (
            <>
              <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '16px', lineHeight: 1.6 }}>
                Add emergency contacts for this member
              </div>
              {form.emergency_contacts.map((contact, i) => (
                <div key={i} style={{ background: '#f8f8f8', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#212121', marginBottom: '10px' }}>Contact {i + 1}</div>
                  <Input label="Full name" value={contact.name} onChange={e => {
                    const contacts = [...form.emergency_contacts];
                    contacts[i].name = e.target.value;
                    update('emergency_contacts', contacts);
                  }} placeholder="e.g. Suresh Kumar" />
                  <Select label="Relation" value={contact.relation} onChange={e => {
                    const contacts = [...form.emergency_contacts];
                    contacts[i].relation = e.target.value;
                    update('emergency_contacts', contacts);
                  }} options={[
                    { value: '', label: 'Select relation' },
                    { value: 'Son', label: 'Son' }, { value: 'Daughter', label: 'Daughter' },
                    { value: 'Spouse', label: 'Spouse' }, { value: 'Sibling', label: 'Sibling' },
                    { value: 'Friend', label: 'Friend' }, { value: 'Other', label: 'Other' }
                  ]} />
                  <Input label="Phone number" value={contact.phone} onChange={e => {
                    const contacts = [...form.emergency_contacts];
                    contacts[i].phone = e.target.value;
                    update('emergency_contacts', contacts);
                  }} placeholder="98765 43210" prefix="+91" />
                </div>
              ))}
              <button onClick={() => update('emergency_contacts', [...form.emergency_contacts, { name: '', relation: '', phone: '' }])}
                style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px dashed #e0e0e0', background: 'transparent', color: '#9e9e9e', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}>
                + Add another contact
              </button>
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid #f0f0f0', display: 'flex', gap: '10px', flexShrink: 0 }}>
          {step > 1 && <Button variant="secondary" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>← Back</Button>}
          {step < 4
            ? <Button fullWidth={step === 1} onClick={() => setStep(s => s + 1)} style={{ flex: step > 1 ? 2 : 1 }}>Next →</Button>
            : <Button fullWidth loading={loading} onClick={handleSave} style={{ flex: 2 }}>Admit member ✓</Button>
          }
        </div>
      </div>
    </div>
  );
};

// ─── Member Profile ───────────────────────────────────────
const MemberProfile = ({ member, onClose, onDischarge }) => {
  const [tab, setTab] = useState('overview');
  const { user } = useAuth();
  const isAuthority = user?.role === 'authority';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: '#D4537E', padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>←</button>
            {isAuthority && (
              <button onClick={() => onDischarge(member._id)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
                Discharge
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '600', color: '#fff' }}>
              {member.name[0]}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>{member.name}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{member.age} years · {member.gender} · {member.room_number || 'No room assigned'}</div>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.2)', color: '#fff', marginTop: '4px', display: 'inline-block' }}>
                {member.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
          {['overview', 'medicines', 'medical', 'contacts'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '12px 4px', fontSize: '12px', border: 'none', background: 'transparent',
                borderBottom: tab === t ? '2px solid #D4537E' : '2px solid transparent',
                color: tab === t ? '#D4537E' : '#9e9e9e', fontWeight: tab === t ? '600' : '400',
                cursor: 'pointer', textTransform: 'capitalize'
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Age', value: `${member.age} years` },
                  { label: 'Gender', value: member.gender },
                  { label: 'Room', value: member.room_number || '—' },
                  { label: 'Admitted', value: new Date(member.admission_date || member.created_at).toLocaleDateString('en-IN') }
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8f8f8', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {member.special_needs && Object.values(member.special_needs).some(v => v) && (
                <div style={{ background: '#FBEAF0', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#72243E', marginBottom: '10px' }}>Special needs</div>
                  {member.special_needs.disability && <div style={{ fontSize: '12px', marginBottom: '4px' }}><span style={{ color: '#9e9e9e' }}>Disability: </span>{member.special_needs.disability}</div>}
                  {member.special_needs.dietary && <div style={{ fontSize: '12px', marginBottom: '4px' }}><span style={{ color: '#9e9e9e' }}>Diet: </span>{member.special_needs.dietary}</div>}
                  {member.special_needs.mental_health && <div style={{ fontSize: '12px' }}><span style={{ color: '#9e9e9e' }}>Mental health: </span>{member.special_needs.mental_health}</div>}
                </div>
              )}
            </>
          )}

          {tab === 'medicines' && (
            member.medicines?.length === 0
              ? <EmptyState icon="💊" title="No medicines added" subtitle="Add medicines from the member profile" />
              : member.medicines?.map((med, i) => (
                <Card key={i} style={{ borderLeft: '3px solid #D4537E', borderRadius: '0 14px 14px 0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{med.name}</div>
                  <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '8px' }}>{med.dosage} · {med.frequency}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {med.time_slots?.map((slot, j) => (
                      <span key={j} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: '#FBEAF0', color: '#72243E' }}>
                        {slot.time} · {slot.dose || med.dosage}
                      </span>
                    ))}
                  </div>
                </Card>
              ))
          )}

          {tab === 'medical' && (
            isAuthority
              ? member.medical_history?.length === 0
                ? <EmptyState icon="🏥" title="No medical history" subtitle="Add medical history when editing this member" />
                : member.medical_history?.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8f8f8', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4537E', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px' }}>{h}</span>
                  </div>
                ))
              : <EmptyState icon="🔒" title="Restricted" subtitle="Only administrators can view full medical history" />
          )}

          {tab === 'contacts' && (
            isAuthority
              ? member.emergency_contacts?.length === 0
                ? <EmptyState icon="📞" title="No emergency contacts" subtitle="Add contacts from the member profile" />
                : member.emergency_contacts?.map((c, i) => (
                  <Card key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar name={c.name} size={40} color="#E6F1FB" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: '#9e9e9e' }}>{c.relation}</div>
                        <div style={{ fontSize: '12px', color: '#D4537E', marginTop: '2px' }}>+91 {c.phone}</div>
                      </div>
                      <a href={`tel:${c.phone}`}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                        📞
                      </a>
                    </div>
                  </Card>
                ))
              : <EmptyState icon="🔒" title="Restricted" subtitle="Only administrators can view emergency contacts" />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Members Page ────────────────────────────────────
export default function MembersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getMembers(user.home_id);
      setMembers(res.data.data);
    } catch { toast.error('Failed to load members'); }
    setLoading(false);
  };

  const handleDischarge = async (memberId) => {
    if (!window.confirm('Are you sure you want to discharge this member?')) return;
    try {
      await dischargeMember(user.home_id, memberId);
      toast.success('Member discharged');
      setSelectedMember(null);
      fetchMembers();
    } catch { toast.error('Failed to discharge'); }
  };

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.room_number?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'has_medicines' && m.medicines?.length > 0) ||
      (filter === 'special_needs' && Object.values(m.special_needs || {}).some(v => v));
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 24px 0', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Members</span>
            <span style={{ fontSize: '13px', color: '#9e9e9e', fontWeight: '400' }}>({members.length})</span>
          </div>
          {user?.role === 'authority' && (
            <button onClick={() => setShowAddForm(true)}
              style={{ height: '34px', padding: '0 14px', borderRadius: '8px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              + Add member
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '0 12px', background: '#f8f8f8', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or room..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', color: '#212121' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', paddingBottom: '14px', overflowX: 'auto' }}>
          {[
            { val: 'all', label: 'All' },
            { val: 'has_medicines', label: 'On medicine' },
            { val: 'special_needs', label: 'Special needs' }
          ].map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)}
              style={{
                padding: '5px 12px', borderRadius: '999px', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer',
                border: `0.5px solid ${filter === f.val ? '#D4537E' : '#e0e0e0'}`,
                background: filter === f.val ? '#FBEAF0' : 'transparent',
                color: filter === f.val ? '#72243E' : '#9e9e9e', fontWeight: filter === f.val ? '600' : '400'
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>
          : filtered.length === 0
            ? <EmptyState icon="👥" title={search ? 'No members found' : 'No members yet'} subtitle={search ? 'Try a different search' : 'Tap + Add member to admit the first member'} />
            : filtered.map(member => (
              <Card key={member._id} onClick={() => setSelectedMember(member)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', color: '#D4537E', flexShrink: 0 }}>
                    {member.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: '#9e9e9e' }}>{member.age} years · {member.gender} · {member.room_number || 'No room'}</div>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                      {member.medicines?.length > 0 && (
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#FBEAF0', color: '#72243E' }}>
                          💊 {member.medicines.length} medicine{member.medicines.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {Object.values(member.special_needs || {}).some(v => v) && (
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#E6F1FB', color: '#0C447C' }}>
                          Special needs
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', color: '#e0e0e0' }}>›</span>
                </div>
              </Card>
            ))
        }
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
            <span style={{ fontSize: '9px', color: item.id === 'members' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'members' ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddMemberForm
          homeId={user.home_id}
          onClose={() => setShowAddForm(false)}
          onSave={fetchMembers}
        />
      )}

      {selectedMember && (
        <MemberProfile
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onDischarge={handleDischarge}
        />
      )}
    </div>
  );
}