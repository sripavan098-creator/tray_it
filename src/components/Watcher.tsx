import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { MENU, MENU_ICONS } from '../data';

/* ─────────────── WATCHER PANEL ─────────────── */
export function WatcherPanel() {
  const { state, addWatcher, removeWatcher, toggleWatcher, simulateWatcherTrigger } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [maxPrice, setMaxPrice] = useState(80);
  const [notifyVia, setNotifyVia] = useState<'email' | 'sms' | 'both'>('sms');
  const [autoOrder, setAutoOrder] = useState(false);

  const availableItems = MENU.filter(m => m.category === 'food');

  const handleAdd = () => {
    if (!selectedItem) return;
    addWatcher(selectedItem, maxPrice, notifyVia, autoOrder);
    setShowForm(false);
    setSelectedItem('');
    setMaxPrice(80);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl">👁️ Item Watchers</h3>
          <p className="text-sm text-[var(--ink-soft)] mt-0.5">Get notified when items become available or drop in price</p>
        </div>
        <button
          className="btn btn-primary text-sm py-2 px-4"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Close' : '+ New Watcher'}
        </button>
      </div>

      {/* Add watcher form */}
      {showForm && (
        <div className="border-2 border-[var(--turmeric)] rounded-xl p-4 mb-4 bg-[#fff8e9]">
          <h4 className="font-bold text-sm mb-3">Create a new watcher</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Item to watch</label>
              <select
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#c9c2b3] bg-white text-sm"
              >
                <option value="">Select an item…</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {MENU_ICONS[item.name]} {item.name} (₹{item.price})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Max price</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={20}
                  max={150}
                  step={5}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-mono font-bold text-sm min-w-[50px]">₹{maxPrice}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Notify via</label>
              <div className="flex gap-2">
                {(['email', 'sms', 'both'] as const).map(ch => (
                  <button
                    key={ch}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${notifyVia === ch ? 'bg-[var(--board)] text-[var(--chalk)] border-[var(--board)]' : 'bg-white text-[var(--ink-soft)] border-[#c9c2b3]'}`}
                    onClick={() => setNotifyVia(ch)}
                  >
                    {ch === 'email' ? '📧 Email' : ch === 'sms' ? '📱 SMS' : '📧📱 Both'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Auto-order</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <label className="switch">
                  <input type="checkbox" checked={autoOrder} onChange={e => setAutoOrder(e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <span className="text-xs text-[var(--ink-soft)]">
                  {autoOrder ? 'Auto-purchase when available' : 'Notify only — I\'ll confirm manually'}
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary text-sm py-2 px-4" onClick={handleAdd} disabled={!selectedItem}>
              Create Watcher
            </button>
            <button className="text-sm text-[var(--ink-soft)] bg-transparent border-none cursor-pointer hover:underline" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watcher list */}
      {state.watchers.length === 0 ? (
        <div className="text-center text-[#8a8072] italic py-8 border-2 border-dashed border-[#ded6c2] rounded-xl">
          No watchers yet. Create one to get notified when items become available.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {state.watchers.map(w => (
            <div key={w.id} className={`border rounded-xl p-4 ${w.active ? 'border-[#ded6c2] bg-white' : 'border-[#e8e0cc] bg-[#faf7f0] opacity-70'}`}>
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{MENU_ICONS[w.itemName]}</span>
                    <span className="font-bold">{w.itemName}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${w.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {w.active ? '● Active' : '○ Paused'}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--ink-soft)]">
                    Max price: <strong className="font-mono">₹{w.maxPrice}</strong> · Notify: {w.notifyVia === 'both' ? 'Email + SMS' : w.notifyVia === 'email' ? 'Email' : 'SMS'}
                  </div>
                  {w.lastCheckedAt && (
                    <div className="text-xs text-[#9b9184] mt-1 font-mono">
                      Last checked: {new Date(w.lastCheckedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                  {w.triggeredAt && (
                    <div className="text-xs text-[var(--chili)] mt-1 font-mono">
                      ⚡ Triggered at {new Date(w.triggeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#c9c2b3] bg-white text-[var(--ink-soft)] cursor-pointer hover:border-[var(--ink)]"
                    onClick={() => toggleWatcher(w.id)}
                  >
                    {w.active ? '⏸ Pause' : '▶ Resume'}
                  </button>
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-[var(--chili)] bg-white cursor-pointer hover:bg-[var(--chili)] hover:text-white"
                    onClick={() => removeWatcher(w.id)}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-order flow diagram */}
      <div className="mt-6 bg-gradient-to-br from-[var(--board)] to-[var(--board-dark)] rounded-xl p-5 text-[var(--chalk)]">
        <h4 className="font-bold text-sm mb-3 uppercase tracking-wider">🔄 Auto-Order Pipeline</h4>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg mb-0.5">👁️</div>
            <div className="font-semibold">Watcher</div>
            <div className="text-[#a9a291] text-[10px]">Monitors menu</div>
          </div>
          <div className="text-[var(--turmeric)]">→</div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg mb-0.5">⚡</div>
            <div className="font-semibold">Detect</div>
            <div className="text-[#a9a291] text-[10px]">Item available</div>
          </div>
          <div className="text-[var(--turmeric)]">→</div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg mb-0.5">📧</div>
            <div className="font-semibold">Dispatch</div>
            <div className="text-[#a9a291] text-[10px]">Email/SMS + OTP</div>
          </div>
          <div className="text-[var(--turmeric)]">→</div>
          <div className="bg-[var(--turmeric)] text-[#241a06] rounded-lg px-3 py-2 text-center">
            <div className="text-lg mb-0.5">🔐</div>
            <div className="font-bold">Safeguard</div>
            <div className="text-[#241a06]/70 text-[10px]">User confirms</div>
          </div>
          <div className="text-[var(--turmeric)]">→</div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg mb-0.5">🧾</div>
            <div className="font-semibold">Order</div>
            <div className="text-[#a9a291] text-[10px]">Placed + paid</div>
          </div>
          <div className="text-[var(--turmeric)]">→</div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg mb-0.5">📱</div>
            <div className="font-semibold">Receipt</div>
            <div className="text-[#a9a291] text-[10px]">QR + pickup</div>
          </div>
        </div>
      </div>

      {/* Demo trigger */}
      {state.watchers.length > 0 && (
        <div className="mt-4 p-3 bg-[#fff8e9] border border-[var(--turmeric)] rounded-xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              <strong>🧪 Demo:</strong> Background polling runs every 8s. Or trigger manually:
            </div>
            <button
              className="btn btn-primary text-sm py-2 px-4"
              onClick={simulateWatcherTrigger}
            >
              ⚡ Simulate item available
            </button>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-2">
            In production, this would be your Node.js server detecting availability via the canteen API and dispatching the confirmation.
          </p>
        </div>
      )}

      {/* Backend architecture note */}
      <div className="mt-6 bg-[#0f1a13] text-[#c8e6cf] rounded-xl p-4 font-mono text-xs leading-relaxed">
        <div className="text-[var(--turmeric)] font-bold mb-2">🏗️ Backend Architecture (Production)</div>
        <div className="text-[#a9c9b3]">
          In production, watchers run server-side (Node.js + cron/Polling). When an item becomes available:<br/>
          → Backend reserves the meal in the canteen DB<br/>
          → Sends email via <span className="text-[var(--turmeric)]">Nodemailer</span> / <span className="text-[var(--turmeric)]">SendGrid</span><br/>
          → Sends SMS via <span className="text-[var(--turmeric)]">Twilio</span> / <span className="text-[var(--turmeric)]">Fast2SMS</span><br/>
          → User confirms via actionable link or OTP within 5 min<br/>
          → Backend processes payment and generates Order ID<br/>
          → QR code sent to user for pickup
        </div>
      </div>
    </div>
  );
}

/* ─────────────── CONFIRMATION MODAL ─────────────── */
export function ConfirmationModal() {
  const { pendingConfirmation, confirmOrder, cancelConfirmation } = useApp();
  const [otpInput, setOtpInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (pendingConfirmation && pendingConfirmation.status === 'pending') {
      const update = () => {
        const remaining = Math.max(0, pendingConfirmation.expiresAt - Date.now());
        setTimeLeft(remaining);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [pendingConfirmation]);

  useEffect(() => {
    if (!pendingConfirmation) setOtpInput('');
  }, [pendingConfirmation]);

  if (!pendingConfirmation || pendingConfirmation.status !== 'pending') return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isExpired = timeLeft <= 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await confirmOrder(pendingConfirmation.id, otpInput);
    setIsProcessing(false);
  };

  return (
    <div className="modal-backdrop show">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold mb-2">🔐 Human Safeguard</div>
        <h3 className="text-2xl mb-1">Confirm your order</h3>
        <p className="text-sm text-[var(--ink-soft)] mb-4 leading-relaxed">
          Your watcher found <strong>{MENU_ICONS[pendingConfirmation.item.name]} {pendingConfirmation.item.name}</strong> at <strong>{pendingConfirmation.counter}</strong> for <strong className="font-mono">₹{pendingConfirmation.total}</strong>.
        </p>

        {/* Item details */}
        <div className="border border-[#ded6c2] rounded-xl overflow-hidden mb-4 bg-white">
          <div className="flex justify-between gap-3 p-3 bg-[#f7f3e8]">
            <span className="font-semibold">{MENU_ICONS[pendingConfirmation.item.name]} {pendingConfirmation.item.name}</span>
            <span className="font-mono font-bold">₹{pendingConfirmation.total}</span>
          </div>
          <div className="flex justify-between gap-3 p-3 text-sm">
            <span className="text-[var(--ink-soft)]">Counter: {pendingConfirmation.counter}</span>
            <span className="text-[var(--ink-soft)]">Payment: Wallet</span>
          </div>
        </div>

        {/* Timer */}
        <div className={`text-center py-3 rounded-xl mb-4 ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-[#fff8e9] border border-[var(--turmeric)]'}`}>
          <div className="text-xs uppercase tracking-wider text-[var(--ink-soft)] mb-1">
            {isExpired ? '⏰ Expired' : '⏱️ Time remaining'}
          </div>
          <div className={`font-mono text-2xl font-bold ${isExpired ? 'text-[var(--chili)]' : 'text-[var(--board)]'}`}>
            {isExpired ? 'EXPIRED' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
          </div>
        </div>

        {/* OTP input */}
        {!isExpired && (
          <>
            <label className="block font-semibold text-sm mb-2">
              Enter the confirmation code from your {pendingConfirmation.channel === 'email' ? 'email' : 'SMS'}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-3 rounded-lg border border-[#c9c2b3] font-mono text-lg font-bold tracking-widest bg-white text-center focus:border-[var(--chili)] focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="dev-otp mt-3">
              Demo mode — your code is <strong className="text-lg tracking-wider text-[var(--chili)]">{pendingConfirmation.otp}</strong>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          {!isExpired ? (
            <>
              <button
                className="btn btn-primary flex-1"
                onClick={handleConfirm}
                disabled={isProcessing || otpInput.length !== 6}
              >
                {isProcessing ? 'Processing...' : '✓ Confirm & Pay'}
              </button>
              <button
                className="btn btn-ghost border-[var(--ink)] text-[var(--ink)]"
                onClick={() => cancelConfirmation(pendingConfirmation.id)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="btn btn-ghost border-[var(--ink)] text-[var(--ink)] w-full"
              onClick={() => cancelConfirmation(pendingConfirmation.id)}
            >
              Dismiss
            </button>
          )}
        </div>

        <p className="text-xs text-[#8a8072] mt-4 leading-relaxed">
          This is the <strong>Human Safeguard</strong> — the agent does all the work of watching the menu, but you keep total control of your money. The order is only placed after you confirm with the OTP.
        </p>
      </div>
    </div>
  );
}
