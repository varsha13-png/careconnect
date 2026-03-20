import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createDonation } from '../services/api';
import API from '../services/api';
import { Toggle, Spinner } from '../components/UI';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = ['100', '250', '500', '1000', '2000'];
const createOrder = (data) => API.post('/payments/create-order', data);
const verifyPayment = (data) => API.post('/payments/verify', data);

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function DonatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { need, home } = location.state || {};

  const [donationType, setDonationType] = useState('money');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [amount, setAmount] = useState('500');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [itemName, setItemName] = useState(need?.item_name || '');
  const [itemQty, setItemQty] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('drop_off');
  const [step, setStep] = useState('form'); // form | success
  const [submitting, setSubmitting] = useState(false);

  if (!need || !home) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>😕</div>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No need selected</div>
        <div style={{ fontSize: '13px', color: '#9e9e9e', marginBottom: '24px' }}>Please go back and select a need to donate for</div>
        <button onClick={() => navigate('/browse')}
          style={{ height: '44px', padding: '0 24px', borderRadius: '10px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          Browse homes
        </button>
      </div>
    );
  }

  const handleDonate = async () => {
    if (donationType === 'money') {
      if (!amount || Number(amount) < 1) return toast.error('Enter a valid amount');

      // Use Razorpay for money payments
      setSubmitting(true);
      try {
        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error('Payment service unavailable. Please try again.');
          setSubmitting(false);
          return;
        }

        // Create order on backend
        const orderRes = await createOrder({ amount: Number(amount), need_id: need._id, home_id: home._id || home });
        const { order_id, key } = orderRes.data.data;

        // Open Razorpay checkout
        const options = {
          key,
          amount: Number(amount) * 100,
          currency: 'INR',
          name: 'Care Connect',
          description: `Donation for ${need.item_name}`,
          order_id,
          handler: async (response) => {
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                need_id: need._id,
                home_id: home._id || home,
                amount: Number(amount),
                is_anonymous: isAnonymous
              });
              setStep('success');
            } catch { toast.error('Payment verification failed'); }
          },
          prefill: { name: user?.name, contact: user?.phone },
          theme: { color: '#D4537E' },
          modal: { ondismiss: () => setSubmitting(false) }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setSubmitting(false);
        return;
      } catch (err) {
        // If Razorpay keys not set, fall back to manual flow
        console.log('Razorpay not configured, using manual flow');
      }
      setSubmitting(false);
    }

    // Items donation or manual fallback
    if (donationType === 'items') {
      if (!itemName.trim()) return toast.error('Enter item name');
      if (!itemQty.trim()) return toast.error('Enter quantity');
    }

    setSubmitting(true);
    try {
      const data = donationType === 'money'
        ? { type: 'money', amount: Number(amount), payment_method: paymentMethod, is_anonymous: isAnonymous }
        : { type: 'items', item_name: itemName, quantity: itemQty, item_brand: itemBrand, delivery_method: deliveryMethod, is_anonymous: isAnonymous };
      await createDonation(need._id, data);
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Donation failed. Please try again.');
    }
    setSubmitting(false);
  };

  // ── Success screen ──
  if (step === 'success') return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>Thank you, {user?.name?.split(' ')[0]}! 💝</div>
      <div style={{ fontSize: '14px', color: '#9e9e9e', textAlign: 'center', marginBottom: '28px', lineHeight: 1.7 }}>
        Your donation has been received. {home?.name} will confirm once it reaches them.
      </div>

      <div style={{ background: '#f8f8f8', borderRadius: '16px', padding: '18px', width: '100%', marginBottom: '28px' }}>
        {[
          { label: 'Donated to', value: home?.name },
          { label: 'For need', value: need?.item_name },
          { label: donationType === 'money' ? 'Amount' : 'Items', value: donationType === 'money' ? `₹${Number(amount).toLocaleString()}` : `${itemQty} × ${itemName}`, color: '#D4537E' },
          { label: 'Anonymous', value: isAnonymous ? 'Yes' : 'No' },
          { label: 'Date', value: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #f0f0f0' }}>
            <span style={{ fontSize: '13px', color: '#9e9e9e' }}>{row.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: row.color || '#212121' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/browse')}
        style={{ width: '100%', height: '50px', borderRadius: '12px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>
        Browse more homes
      </button>
      <button onClick={() => navigate('/donor-profile')}
        style={{ width: '100%', height: '50px', borderRadius: '12px', background: 'transparent', border: '0.5px solid #e0e0e0', color: '#757575', fontSize: '14px', cursor: 'pointer' }}>
        View my donations
      </button>
    </div>
  );

  // ── Donate form ──
  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#D4537E', padding: '18px 24px 22px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button onClick={() => navigate(-1)}
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{home?.name}</span>
        </div>
        <div style={{ fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>Donate for {need?.item_name}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          {need?.urgency === 'critical' ? '🔴 Urgent need' : need?.urgency === 'medium' ? '🟡 Medium priority' : '🟢 Low priority'} · {need?.quantity_required - need?.quantity_fulfilled} {need?.unit} remaining
        </div>
        {donationType === 'money' && (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>Donation amount</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>₹{amount || '0'}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Donation type toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {[{ val: 'money', label: '💰 Donate money' }, { val: 'items', label: '📦 Donate items' }].map(t => (
            <button key={t.val} onClick={() => setDonationType(t.val)}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer', border: `1.5px solid ${donationType === t.val ? '#D4537E' : '#e0e0e0'}`, background: donationType === t.val ? '#FBEAF0' : '#f8f8f8', color: donationType === t.val ? '#72243E' : '#9e9e9e', fontWeight: donationType === t.val ? '600' : '400' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Money form ── */}
        {donationType === 'money' && (
          <>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#212121', marginBottom: '10px' }}>Quick amount</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a)}
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: `1.5px solid ${amount === a ? '#D4537E' : '#e0e0e0'}`, background: amount === a ? '#FBEAF0' : 'transparent', color: amount === a ? '#72243E' : '#9e9e9e' }}>
                  ₹{a}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Or enter custom amount</div>
            <div style={{ display: 'flex', alignItems: 'center', height: '48px', borderRadius: '12px', border: `1.5px solid ${amount && !QUICK_AMOUNTS.includes(amount) ? '#D4537E' : '#e0e0e0'}`, padding: '0 14px', marginBottom: '20px', background: '#fff' }}>
              <span style={{ fontSize: '16px', color: '#9e9e9e', marginRight: '8px' }}>₹</span>
              <input value={QUICK_AMOUNTS.includes(amount) ? '' : amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
                style={{ flex: 1, border: 'none', fontSize: '15px', outline: 'none', fontFamily: 'inherit', color: '#212121' }} type="number" />
            </div>

            {/* Payment method */}
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#212121', marginBottom: '10px' }}>Payment method</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[{ val: 'upi', label: 'UPI' }, { val: 'card', label: 'Card' }, { val: 'net_banking', label: 'Net banking' }].map(m => (
                <button key={m.val} onClick={() => setPaymentMethod(m.val)}
                  style={{ flex: 1, height: '44px', borderRadius: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: `1.5px solid ${paymentMethod === m.val ? '#D4537E' : '#e0e0e0'}`, background: paymentMethod === m.val ? '#FBEAF0' : 'transparent', color: paymentMethod === m.val ? '#72243E' : '#9e9e9e' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* UPI form */}
            {paymentMethod === 'upi' && (
              <>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Your UPI ID</div>
                <div style={{ display: 'flex', alignItems: 'center', height: '48px', borderRadius: '12px', border: `1.5px solid ${upiId ? '#D4537E' : '#e0e0e0'}`, padding: '0 14px', marginBottom: '12px', background: '#fff', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi or 9876543210@paytm"
                    style={{ flex: 1, border: 'none', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#212121' }} />
                </div>
                {home?.payment_settings?.qr_code_url && (
                  <div style={{ border: '0.5px solid #e0e0e0', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '12px', background: '#f8f8f8' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Or scan QR to pay ₹{amount}</div>
                    <img src={home.payment_settings.qr_code_url} alt="QR Code" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
                    <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '6px' }}>{home.payment_settings.upi_id}</div>
                  </div>
                )}
              </>
            )}

            {/* Card form */}
            {paymentMethod === 'card' && (
              <>
                {/* Card preview */}
                <div style={{ background: 'linear-gradient(135deg, #D4537E 0%, #72243E 100%)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '24px', borderRadius: '4px', background: '#FAC775', marginBottom: '18px' }} />
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#fff', letterSpacing: '3px', marginBottom: '14px', fontFamily: 'monospace' }}>
                    {cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '2px' }}>Card holder</div>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>{cardName || 'Your name'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '2px' }}>Expires</div>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {[
                  { label: 'Card number', value: cardNumber, setter: setCardNumber, placeholder: '1234 5678 9012 3456', maxLen: 19 },
                  { label: 'Card holder name', value: cardName, setter: setCardName, placeholder: 'As on card' }
                ].map(field => (
                  <div key={field.label} style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>{field.label}</div>
                    <input value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} maxLength={field.maxLen}
                      style={{ width: '100%', height: '46px', borderRadius: '10px', border: `0.5px solid ${field.value ? '#D4537E' : '#e0e0e0'}`, padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Expiry date</div>
                    <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5}
                      style={{ width: '100%', height: '46px', borderRadius: '10px', border: `0.5px solid ${cardExpiry ? '#D4537E' : '#e0e0e0'}`, padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>CVV</div>
                    <input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="•••" maxLength={4} type="password"
                      style={{ width: '100%', height: '46px', borderRadius: '10px', border: `0.5px solid ${cardCvv ? '#D4537E' : '#e0e0e0'}`, padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                </div>
              </>
            )}

            {/* Net banking */}
            {paymentMethod === 'net_banking' && (
              <>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '10px' }}>Select your bank</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { id: 'sbi', label: 'State Bank', color: '#1D4ED8' },
                    { id: 'hdfc', label: 'HDFC Bank', color: '#DC2626' },
                    { id: 'icici', label: 'ICICI Bank', color: '#D97706' },
                    { id: 'axis', label: 'Axis Bank', color: '#059669' },
                    { id: 'kotak', label: 'Kotak Bank', color: '#7C3AED' },
                    { id: 'other', label: 'Other bank', color: '#6B7280' }
                  ].map(bank => (
                    <button key={bank.id} onClick={() => setSelectedBank(bank.id)}
                      style={{ height: '52px', borderRadius: '10px', border: `1.5px solid ${selectedBank === bank.id ? '#D4537E' : '#e0e0e0'}`, background: selectedBank === bank.id ? '#FBEAF0' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: '500', color: selectedBank === bank.id ? '#72243E' : '#212121' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                        {bank.id.toUpperCase().slice(0, 3)}
                      </div>
                      {bank.label}
                    </button>
                  ))}
                </div>
                {selectedBank && (
                  <>
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Net banking username</div>
                    <input placeholder="Customer ID / Username"
                      style={{ width: '100%', height: '46px', borderRadius: '10px', border: '0.5px solid #e0e0e0', padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '12px' }} />
                    <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Password</div>
                    <input placeholder="••••••••" type="password"
                      style={{ width: '100%', height: '46px', borderRadius: '10px', border: '0.5px solid #e0e0e0', padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '12px' }} />
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── Items form ── */}
        {donationType === 'items' && (
          <>
            <div style={{ background: '#E6F1FB', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#0C447C', lineHeight: 1.6 }}>
              ℹ️ You are donating items directly. The home will confirm once received.
            </div>

            <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Item name</div>
            <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Paracetamol 500mg"
              style={{ width: '100%', height: '46px', borderRadius: '10px', border: `0.5px solid ${itemName ? '#D4537E' : '#e0e0e0'}`, padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '12px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Quantity</div>
                <input value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="e.g. 20 strips"
                  style={{ width: '100%', height: '46px', borderRadius: '10px', border: `0.5px solid ${itemQty ? '#D4537E' : '#e0e0e0'}`, padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#757575', marginBottom: '5px' }}>Brand (optional)</div>
                <input value={itemBrand} onChange={e => setItemBrand(e.target.value)} placeholder="e.g. Crocin"
                  style={{ width: '100%', height: '46px', borderRadius: '10px', border: '0.5px solid #e0e0e0', padding: '0 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#757575', marginBottom: '10px' }}>How will you deliver?</div>
            {[
              { val: 'drop_off', title: 'Drop it off', sub: 'Visit the home and hand over directly' },
              { val: 'courier', title: 'Courier it', sub: "Ship to the home's address — shared after confirmation" },
              { val: 'pickup', title: 'Request pickup', sub: 'A volunteer will collect from you' }
            ].map(d => (
              <div key={d.val} onClick={() => setDeliveryMethod(d.val)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${deliveryMethod === d.val ? '#D4537E' : '#e0e0e0'}`, background: deliveryMethod === d.val ? '#FBEAF0' : '#fff', cursor: 'pointer', marginBottom: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${deliveryMethod === d.val ? '#D4537E' : '#e0e0e0'}`, background: deliveryMethod === d.val ? '#D4537E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {deliveryMethod === d.val && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: deliveryMethod === d.val ? '#72243E' : '#212121' }}>{d.title}</div>
                  <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '2px', lineHeight: 1.5 }}>{d.sub}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Anonymous toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f8f8', borderRadius: '12px', padding: '14px', margin: '16px 0' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>Donate anonymously</div>
            <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Your name won't be shown to the home</div>
          </div>
          <Toggle value={isAnonymous} onChange={setIsAnonymous} />
        </div>

        {/* Submit button */}
        <button onClick={handleDonate} disabled={submitting}
          style={{ width: '100%', height: '52px', borderRadius: '12px', background: submitting ? '#e0e0e0' : '#D4537E', border: 'none', color: submitting ? '#9e9e9e' : '#fff', fontSize: '15px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          {submitting ? <Spinner size={20} color="#fff" /> : donationType === 'money' ? `💝 Donate ₹${amount || '0'}` : '📦 Confirm item donation'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#9e9e9e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          256-bit encrypted · Powered by Razorpay
        </div>
      </div>
    </div>
  );
}