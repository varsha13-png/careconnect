import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { browseHomes, getPublicNeeds, createDonation } from '../services/api';
import { Card, Badge, ProgressBar, Button, Input, Spinner, EmptyState, Toggle } from '../components/UI';
import toast from 'react-hot-toast';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [homes, setHomes] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHome, setSelectedHome] = useState(null);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [step, setStep] = useState('browse'); // browse | detail | donate | success
  const [donationType, setDonationType] = useState('money');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [amount, setAmount] = useState('500');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [itemDetails, setItemDetails] = useState({ item_name: '', quantity: '', brand: '', delivery_method: 'drop_off' });
  const [donating, setDonating] = useState(false);
  const [lastDonation, setLastDonation] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    Promise.all([browseHomes(), getPublicNeeds()])
      .then(([hRes, nRes]) => {
        setHomes(hRes.data.data);
        setNeeds(nRes.data.data);
      })
      .catch(() => toast.error('Failed to load homes'))
      .finally(() => setLoading(false));
  }, []);

  const getHomeNeeds = (homeId) => needs.filter(n => n.home_id?._id === homeId || n.home_id === homeId);

  const handleDonate = async () => {
    if (!selectedNeed) return toast.error('Please select a need');
    setDonating(true);
    try {
      const data = donationType === 'money'
        ? { type: 'money', amount: Number(amount), payment_method: paymentMethod, is_anonymous: isAnonymous }
        : { type: 'items', ...itemDetails, is_anonymous: isAnonymous };
      const res = await createDonation(selectedNeed._id, data);
      setLastDonation(res.data.data);
      setStep('success');
      toast.success('Thank you for your donation!');
    } catch { toast.error('Donation failed. Please try again.'); }
    setDonating(false);
  };

  const urgencyColor = (u) => u === 'critical' ? '#E24B4A' : u === 'medium' ? '#BA7517' : '#1D9E75';
  const QUICK_AMOUNTS = ['100', '500', '1000', '2000'];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  // ── Browse ──────────────────────────────────────────
  if (step === 'browse') return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px 16px', background: '#fff', borderBottom: '0.5px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '14px' }}>Homes near you</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '0 12px', background: '#f8f8f8', marginBottom: '12px' }}>
          <span>🔍</span>
          <span style={{ fontSize: '13px', color: '#9e9e9e' }}>Search homes or localities...</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {['all', 'old_age_home', 'orphanage', 'urgent'].map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              style={{
                padding: '5px 12px', borderRadius: '999px', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer',
                border: `0.5px solid ${filterType === f ? '#D4537E' : '#e0e0e0'}`,
                background: filterType === f ? '#FBEAF0' : 'transparent',
                color: filterType === f ? '#72243E' : '#9e9e9e', fontWeight: filterType === f ? '600' : '400'
              }}>
              {f === 'all' ? 'All' : f === 'old_age_home' ? 'Old age' : f === 'orphanage' ? 'Orphanage' : 'Urgent'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {homes.length === 0
          ? <EmptyState icon="🏠" title="No homes found" subtitle="Try a different search" />
          : homes.map(home => {
            const homeNeeds = getHomeNeeds(home._id);
            return (
              <Card key={home._id} onClick={() => { setSelectedHome(home); setStep('detail'); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏠</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>{home.name}</div>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '6px' }}>{home.locality_zone}, {home.city}</div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <Badge variant="verified">✓ Verified</Badge>
                      {homeNeeds.some(n => n.urgency === 'critical') && <Badge variant="critical">Urgent</Badge>}
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#E6F1FB', color: '#0C447C', fontWeight: '500' }}>{home.type === 'old_age_home' ? 'Old age' : 'Orphanage'}</span>
                    </div>
                  </div>
                </div>
                {homeNeeds.slice(0, 2).map(n => (
                  <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: urgencyColor(n.urgency), flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', flex: 1 }}>{n.item_name}</span>
                    <div style={{ width: '80px', height: '5px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ height: '100%', width: `${Math.min((n.quantity_fulfilled / n.quantity_required) * 100, 100)}%`, background: urgencyColor(n.urgency), borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{home.current_occupancy || '?'} members</span>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedHome(home); setStep('donate'); }}
                    style={{ height: '32px', padding: '0 16px', borderRadius: '8px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    Donate
                  </button>
                </div>
              </Card>
            );
          })
        }
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px' }}>
        {[{ id: 'browse', label: 'Browse', icon: '🏠' }, { id: 'donations', label: 'My donations', icon: '🛡️' }, { id: 'profile', label: 'Profile', icon: '👤' }].map(item => (
          <div key={item.id} onClick={() => { if (item.id === 'profile') navigate('/donor-profile'); if (item.id === 'donations') navigate('/donor-profile'); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: item.id === 'browse' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'browse' ? '600' : '400' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Home Detail ──────────────────────────────────────
  if (step === 'detail') return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#D4537E', padding: '20px 24px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <button onClick={() => setStep('browse')}
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>←</button>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{selectedHome?.city}, {selectedHome?.state}</span>
          <Badge variant="verified" style={{ marginLeft: 'auto' }}>✓ Verified</Badge>
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{selectedHome?.name}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '14px' }}>{selectedHome?.type === 'old_age_home' ? 'Old age home' : 'Orphanage'}</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { num: selectedHome?.current_occupancy || '—', label: 'Members' },
            { num: getHomeNeeds(selectedHome?._id).length, label: 'Open needs' }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{s.num}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f5f7' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Open needs</div>
        {getHomeNeeds(selectedHome?._id).map(need => (
          <Card key={need._id} style={{ borderLeft: `3px solid ${urgencyColor(need.urgency)}`, borderRadius: '0 14px 14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{need.item_name}</span>
              <Badge variant={need.urgency}>{need.urgency.charAt(0).toUpperCase() + need.urgency.slice(1)}</Badge>
            </div>
            <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '8px' }}>{need.category} · {need.quantity_required - need.quantity_fulfilled} {need.unit} remaining</div>
            <ProgressBar value={need.quantity_fulfilled} max={need.quantity_required} color={urgencyColor(need.urgency)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 12px' }}>
              <span style={{ fontSize: '10px', color: '#9e9e9e' }}>{need.quantity_fulfilled} of {need.quantity_required} fulfilled</span>
              <span style={{ fontSize: '10px', color: '#9e9e9e' }}>{Math.round((need.quantity_fulfilled / need.quantity_required) * 100)}% done</span>
            </div>
            <button onClick={() => { setSelectedNeed(need); setStep('donate'); }}
              style={{ width: '100%', height: '36px', borderRadius: '8px', border: 'none', background: '#D4537E', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              Donate for this need
            </button>
          </Card>
        ))}
      </div>
    </div>
  );

  // ── Donate ───────────────────────────────────────────
  if (step === 'donate') return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#D4537E', padding: '16px 24px 20px', flexShrink: 0 }}>
        <button onClick={() => setStep(selectedNeed ? 'detail' : 'browse')}
          style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', marginBottom: '10px' }}>←</button>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>Donate to {selectedHome?.name}</div>
        {selectedNeed && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>{selectedNeed.item_name} · {selectedNeed.urgency} need</div>}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Donation amount</span>
          <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>₹{donationType === 'money' ? amount : '—'}</span>
        </div>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 0' }}>
        {[{ val: 'money', label: '💰 Donate money' }, { val: 'items', label: '📦 Donate items' }].map(t => (
          <button key={t.val} onClick={() => setDonationType(t.val)}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
              border: `1.5px solid ${donationType === t.val ? '#D4537E' : '#e0e0e0'}`,
              background: donationType === t.val ? '#FBEAF0' : '#f8f8f8',
              color: donationType === t.val ? '#72243E' : '#9e9e9e', fontWeight: donationType === t.val ? '600' : '400'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {donationType === 'money' && (
          <>
            <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '8px' }}>Quick amount</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                    border: `0.5px solid ${amount === a ? '#D4537E' : '#e0e0e0'}`,
                    background: amount === a ? '#FBEAF0' : 'transparent',
                    color: amount === a ? '#72243E' : '#9e9e9e'
                  }}>₹{a}</button>
              ))}
            </div>
            <Input label="Or enter custom amount" value={amount} onChange={e => setAmount(e.target.value)} prefix="₹" />

            <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '8px' }}>Payment method</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['upi', 'card', 'net_banking'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  style={{
                    flex: 1, height: '42px', borderRadius: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                    border: `1.5px solid ${paymentMethod === m ? '#D4537E' : '#e0e0e0'}`,
                    background: paymentMethod === m ? '#FBEAF0' : 'transparent',
                    color: paymentMethod === m ? '#72243E' : '#9e9e9e'
                  }}>
                  {m === 'upi' ? 'UPI' : m === 'card' ? 'Card' : 'Net banking'}
                </button>
              ))}
            </div>

            {paymentMethod === 'upi' && (
              <>
                <Input label="Your UPI ID" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi" />
                {selectedHome?.payment_settings?.qr_code_url && (
                  <div style={{ textAlign: 'center', border: '0.5px solid #e0e0e0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Scan to pay ₹{amount}</div>
                    <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{selectedHome.payment_settings.upi_id}</div>
                  </div>
                )}
              </>
            )}
            {paymentMethod === 'card' && (
              <>
                <Input label="Card number" value="" onChange={() => {}} placeholder="1234 5678 9012 3456" />
                <Input label="Card holder name" value="" onChange={() => {}} placeholder="Your name" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input label="Expiry" value="" onChange={() => {}} placeholder="MM / YY" />
                  <Input label="CVV" value="" onChange={() => {}} placeholder="•••" type="password" />
                </div>
              </>
            )}
          </>
        )}

        {donationType === 'items' && (
          <>
            <div style={{ background: '#E6F1FB', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#0C447C', lineHeight: 1.6 }}>
              You are donating items. The home will confirm once they receive them.
            </div>
            <Input label="Item name" value={itemDetails.item_name} onChange={e => setItemDetails({ ...itemDetails, item_name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input label="Quantity" value={itemDetails.quantity} onChange={e => setItemDetails({ ...itemDetails, quantity: e.target.value })} placeholder="e.g. 20 strips" />
              <Input label="Brand (optional)" value={itemDetails.brand} onChange={e => setItemDetails({ ...itemDetails, brand: e.target.value })} placeholder="e.g. Crocin" />
            </div>
            <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '8px' }}>How will you deliver?</div>
            {[
              { val: 'drop_off', title: 'I will drop it off', sub: 'Visit the home and hand it over directly' },
              { val: 'courier', title: 'I will courier it', sub: "Ship to the home's address — shared after confirmation" },
              { val: 'pickup', title: 'Arrange a pickup', sub: 'A volunteer will collect from you' }
            ].map(d => (
              <div key={d.val} onClick={() => setItemDetails({ ...itemDetails, delivery_method: d.val })}
                style={{
                  border: `1.5px solid ${itemDetails.delivery_method === d.val ? '#D4537E' : '#e0e0e0'}`,
                  background: itemDetails.delivery_method === d.val ? '#FBEAF0' : 'transparent',
                  borderRadius: '10px', padding: '12px', cursor: 'pointer', marginBottom: '8px',
                  display: 'flex', gap: '10px', alignItems: 'flex-start'
                }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', border: `1.5px solid ${itemDetails.delivery_method === d.val ? '#D4537E' : '#e0e0e0'}`,
                  background: itemDetails.delivery_method === d.val ? '#D4537E' : 'transparent',
                  flexShrink: 0, marginTop: '2px'
                }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: itemDetails.delivery_method === d.val ? '#72243E' : '#212121' }}>{d.title}</div>
                  <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '2px', lineHeight: 1.5 }}>{d.sub}</div>
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f8f8', borderRadius: '10px', padding: '12px 14px', margin: '16px 0' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>Donate anonymously</div>
            <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Your name won't be shown to the home</div>
          </div>
          <Toggle value={isAnonymous} onChange={setIsAnonymous} />
        </div>

        <button onClick={handleDonate} disabled={donating}
          style={{ width: '100%', height: '48px', borderRadius: '10px', background: donating ? '#e0e0e0' : '#D4537E', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: donating ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {donating ? '⏳ Processing...' : donationType === 'money' ? `✓ Donate ₹${amount}` : '✓ Confirm item donation'}
        </button>
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#9e9e9e' }}>
          🔒 256-bit encrypted · Powered by Razorpay
        </div>
      </div>
    </div>
  );

  // ── Success ──────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Thank you! 💝</div>
      <div style={{ fontSize: '14px', color: '#9e9e9e', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
        Your donation has been received. {selectedHome?.name} will confirm once it reaches them.
      </div>
      <div style={{ background: '#f8f8f8', borderRadius: '14px', padding: '16px', width: '100%', marginBottom: '24px' }}>
        {[
          { label: 'Donated to', value: selectedHome?.name },
          { label: 'For need', value: selectedNeed?.item_name || '—' },
          { label: 'Amount', value: donationType === 'money' ? `₹${amount}` : 'Items', color: '#D4537E' },
          { label: 'Anonymous', value: isAnonymous ? 'Yes' : 'No' },
          { label: 'Date', value: new Date().toLocaleDateString('en-IN') }
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #f0f0f0' }}>
            <span style={{ fontSize: '12px', color: '#9e9e9e' }}>{row.label}</span>
            <span style={{ fontSize: '12px', fontWeight: '500', color: row.color || '#212121' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setStep('browse'); setSelectedNeed(null); }}
        style={{ width: '100%', height: '48px', borderRadius: '10px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>
        Browse more homes
      </button>
      <button onClick={() => navigate('/my-donations')}
        style={{ width: '100%', height: '48px', borderRadius: '10px', background: 'transparent', border: '0.5px solid #e0e0e0', color: '#757575', fontSize: '14px', cursor: 'pointer' }}>
        View my donations
      </button>
    </div>
  );
}