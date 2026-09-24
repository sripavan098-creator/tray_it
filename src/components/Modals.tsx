import React, { useState } from 'react';
import { useApp } from '../store';
import { OrderItem } from '../types';

/* ─────────────── AUTH MODAL ─────────────── */
export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { requestOtp, verifyOtp, addToast } = useApp();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const code = await requestOtp(phone);
      setDevCode(code);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, otp, name);
      addToast('✅ Signed in', `Welcome${name ? ', ' + name : ''}!`, 'ok');
      onClose();
      reset();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const reset = () => {
    setStep('phone');
    setPhone('');
    setName('');
    setOtp('');
    setDevCode('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={() => { onClose(); reset(); }}>✕</button>
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold mb-2">🔐 Secure sign-in</div>
        <h3 className="text-2xl mb-1">Sign in to tray-it</h3>
        <p className="text-sm text-[var(--ink-soft)] mb-5 leading-relaxed">Ordering, payments and WhatsApp/SMS alerts need a verified account.</p>

        {step === 'phone' && (
          <div>
            <label className="block font-semibold text-sm mt-3">Mobile number</label>
            <div className="flex gap-2 items-start">
              <span className="px-3 py-2.5 bg-white border border-[#c9c2b3] rounded-lg font-mono text-sm mt-2">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                maxLength={10}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2.5 rounded-lg border border-[#c9c2b3] font-sans text-sm bg-white mt-2 focus:border-[var(--chili)] focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <label className="block font-semibold text-sm mt-4">Your name <span className="font-normal text-[#8a8072]">(first time only)</span></label>
            <input
              type="text"
              placeholder="e.g. Ananya"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#c9c2b3] font-sans text-sm bg-white mt-2 focus:border-[var(--chili)] focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <button className="btn btn-primary w-full mt-5" onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            {error && <div className="mt-2 text-[var(--chili)] text-xs font-bold">{error}</div>}
            <p className="text-xs text-[#8a8072] mt-4 leading-relaxed">
              By continuing you agree to receive order updates on WhatsApp and SMS. You can turn either channel off later in <strong>Account & consent</strong>.
            </p>
          </div>
        )}

        {step === 'otp' && (
          <div>
            <label className="block font-semibold text-sm mt-3">Enter the 6-digit code</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-lg border border-[#c9c2b3] font-mono text-lg font-bold tracking-widest bg-white mt-2 focus:border-[var(--chili)] focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="dev-otp">
              Demo mode — your code is <strong className="text-lg tracking-wider text-[var(--chili)]">{devCode}</strong>
            </div>
            <button className="btn btn-primary w-full mt-4" onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & continue'}
            </button>
            <button className="w-full mt-2 py-2.5 rounded-lg border border-[#c9c2b3] bg-transparent text-[var(--ink)] font-semibold cursor-pointer hover:bg-[#f0e9d9] text-sm" onClick={() => setStep('phone')}>
              ← Use a different number
            </button>
            {error && <div className="mt-2 text-[var(--chili)] text-xs font-bold">{error}</div>}
            <p className="text-xs text-[#8a8072] mt-4 leading-relaxed">
              Production note: this OTP is sent by your backend through MSG91 / Twilio Verify and is <strong>never</strong> returned to the browser. The demo code above exists only so this file runs offline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── CHECKOUT MODAL ─────────────── */
export function CheckoutModal({ isOpen, onClose, items, total, counter }: {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  total: number;
  counter: string;
}) {
  const { state, placeOrder, addToast } = useApp();
  const [slot, setSlot] = useState('ASAP');
  const [method, setMethod] = useState('wallet');
  const [progress, setProgress] = useState<{ tool: string; detail: string; state: string; ms?: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const slots = ['ASAP', '15 min', '30 min'];
  const methods = [
    { key: 'wallet', title: '💰 tray-it credits', sub: `Balance: ₹${state.wallet}` },
    { key: 'upi', title: '📱 UPI', sub: 'GPay, PhonePe, Paytm' },
    { key: 'card', title: '💳 Card', sub: 'Visa, Mastercard' },
    { key: 'counter', title: '🏪 Pay at counter', sub: 'Cash on pickup' },
  ];

  const handlePlaceOrder = async () => {
    if (!state.user) {
      addToast('🔐 Sign in required', 'Please sign in to place an order.', 'err');
      return;
    }
    setIsProcessing(true);
    setProgress([]);
    setResult(null);

    try {
      const res = await placeOrder(items, total, counter, slot, method, (step) => {
        setProgress(prev => {
          const existing = prev.findIndex(p => p.tool === step.tool);
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = step;
            return next;
          }
          return [...prev, step];
        });
      });

      if (res.ok) {
        setResult({ ok: true, message: `Order #${res.order?.id} placed successfully! 🎉` });
        addToast('✅ Order placed!', `Order #${res.order?.id} confirmed.`, 'ok');
      } else {
        setResult({ ok: false, message: res.error || 'Payment failed. Please try again.' });
        addToast('❌ Order failed', res.error || 'Something went wrong.', 'err');
      }
    } catch (err: any) {
      setResult({ ok: false, message: err.message || 'Something went wrong.' });
      addToast('❌ Error', err.message, 'err');
    }

    setIsProcessing(false);
  };

  const handleClose = () => {
    onClose();
    setProgress([]);
    setResult(null);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        <button className="modal-close" onClick={handleClose}>✕</button>
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold mb-2">🧾 Checkout</div>
        <h3 className="text-2xl mb-1">Confirm your order</h3>
        <p className="text-sm text-[var(--ink-soft)] mb-4 leading-relaxed">The agent will place the order, charge your chosen method, and message you on WhatsApp and SMS.</p>

        {/* Items */}
        <div className="border border-[#ded6c2] rounded-xl overflow-hidden mb-4 bg-white">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between gap-3 p-2.5 px-3 text-sm border-b border-[#f0e9d9]">
              <span>{item.name}</span>
              <span className="font-mono">₹{item.price}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3 p-2.5 px-3 text-sm bg-[#f7f3e8] font-bold font-mono">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Pickup slot */}
        <label className="block font-semibold text-sm mt-3">Pickup time</label>
        <div className="flex gap-2 flex-wrap mt-2">
          {slots.map(s => (
            <button
              key={s}
              className={`text-sm font-semibold px-3 py-2 rounded-full border ${slot === s ? 'bg-[var(--board)] text-[var(--chalk)] border-[var(--board)]' : 'bg-white text-[var(--ink-soft)] border-[#c9c2b3]'}`}
              onClick={() => setSlot(s)}
            >{s}</button>
          ))}
        </div>

        {/* Payment method */}
        <label className="block font-semibold text-sm mt-4">Payment method</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {methods.map(m => (
            <button
              key={m.key}
              className={`text-left border rounded-xl p-3 cursor-pointer transition-all ${method === m.key ? 'border-[var(--board)] bg-green-50 shadow-[0_0_0_2px_rgba(31,61,43,.12)]' : 'border-[#c9c2b3] bg-white hover:border-[var(--turmeric)]'}`}
              onClick={() => setMethod(m.key)}
            >
              <div className="font-bold text-sm flex items-center gap-1.5">{m.title}</div>
              <div className="text-xs text-[var(--ink-soft)] mt-1">{m.sub}</div>
            </button>
          ))}
        </div>

        {/* Agent progress */}
        {progress.length > 0 && (
          <div className="mt-4 border-t border-dashed border-[#c8bfa8] pt-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-2">Agent working…</h4>
            {progress.map((p, i) => (
              <div key={i} className={`ap-step ${p.state}`}>
                <span className="ap-dot"></span>
                <span className="flex-1 text-xs">{p.tool}</span>
                {p.ms !== undefined && <span className="text-xs text-[#a89e8d]">{p.ms}ms</span>}
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-semibold ${result.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result.message}
          </div>
        )}

        <button
          className="btn btn-primary w-full mt-5"
          onClick={handlePlaceOrder}
          disabled={isProcessing || !!result?.ok}
        >
          {isProcessing ? 'Processing...' : result?.ok ? '✓ Order placed' : 'Place order & pay'}
        </button>
        <p className="text-xs text-[#8a8072] mt-3 leading-relaxed">
          Payments are simulated in this demo. A production build calls a PCI-compliant provider (Razorpay / Stripe) server-side — card numbers never touch this page.
        </p>
      </div>
    </div>
  );
}
