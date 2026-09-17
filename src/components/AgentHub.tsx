import React, { useState } from 'react';
import { useApp } from '../store';
import { ORDER_FLOW, STATUS_LABELS, METHOD_LABELS } from '../data';

type Tab = 'orders' | 'messages' | 'payments' | 'activity' | 'account';

export function AgentHub() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const { state, cancelOrder, collectOrder, retryPayment, topUpWallet, setConsent, signOut } = useApp();

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: 'orders', label: 'Orders', icon: '🧾', count: state.orders.length },
    { key: 'messages', label: 'WhatsApp & SMS', icon: '💬', count: state.messages.length },
    { key: 'payments', label: 'Payments', icon: '💳', count: state.payments.length },
    { key: 'activity', label: 'Agent activity', icon: '🤖' },
    { key: 'account', label: 'Account & consent', icon: '👤' },
  ];

  return (
    <section className="bg-gradient-to-b from-[#EFE7D6] to-[#F3EAD8] py-[5vw] px-[6vw]" id="hub">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold">Step 04 · Agent operations</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5">Order, pay & get notified</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[236px_1fr] gap-5 items-start">
        {/* Tabs */}
        <div className="flex flex-col gap-1.5 lg:sticky lg:top-4 flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`hub-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
              {tab.count !== undefined && <span className="hub-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white border border-[#ded6c2] rounded-2xl p-5 min-h-[340px] shadow-lg">
          {activeTab === 'orders' && <OrdersPanel orders={state.orders} onCancel={cancelOrder} onCollect={collectOrder} onRetry={retryPayment} />}
          {activeTab === 'messages' && <MessagesPanel messages={state.messages} />}
          {activeTab === 'payments' && <PaymentsPanel payments={state.payments} />}
          {activeTab === 'activity' && <ActivityPanel log={state.log} />}
          {activeTab === 'account' && <AccountPanel state={state} onTopUp={topUpWallet} onConsent={setConsent} onSignOut={signOut} />}
        </div>
      </div>
    </section>
  );
}

/* ─── Orders Panel ─── */
function OrdersPanel({ orders, onCancel, onCollect, onRetry }: {
  orders: any[];
  onCancel: (id: string) => void;
  onCollect: (id: string) => void;
  onRetry: (id: string, method: string) => Promise<boolean>;
}) {
  if (orders.length === 0) {
    return (
      <div>
        <h3 className="text-xl mb-1">🧾 My Orders</h3>
        <p className="text-[var(--ink-soft)] text-sm mb-4">Orders you place will appear here with real-time status updates.</p>
        <div className="text-center text-[#8a8072] italic py-8 border-2 border-dashed border-[#ded6c2] rounded-xl">
          No orders yet. Use the recommendation to place your first order!
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl mb-1">🧾 My Orders</h3>
      <p className="text-[var(--ink-soft)] text-sm mb-4">{orders.length} order{orders.length > 1 ? 's' : ''} placed</p>
      {orders.map(order => {
        const isCancelled = ['CANCELLED', 'CANCELLED_OUT_OF_STOCK'].includes(order.status);
        const currentStepIdx = ORDER_FLOW.indexOf(order.status);
        return (
          <div key={order.id} className={`order-card ${isCancelled ? 'bg-red-50 border-red-200' : ''}`}>
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <div className="font-mono font-bold text-base">#{order.id}</div>
                <div className="text-xs text-[var(--ink-soft)] mt-1 leading-relaxed">
                  {order.items.map((i: any) => i.name).join(', ')}<br />
                  {order.counter} · Pickup: {order.slot}
                </div>
              </div>
              <div className="font-mono font-bold text-lg text-[var(--chili)]">₹{order.total}</div>
            </div>

            {/* Status timeline */}
            {!isCancelled && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {ORDER_FLOW.map((step, i) => {
                  const isDone = i < currentStepIdx;
                  const isNow = i === currentStepIdx;
                  return (
                    <span key={step} className={`order-step ${isDone ? 'done' : ''} ${isNow ? 'now' : ''}`}>
                      {STATUS_LABELS[step]}
                    </span>
                  );
                })}
              </div>
            )}
            {isCancelled && (
              <div className="flex gap-1.5 mt-3">
                <span className="order-step bad">{STATUS_LABELS[order.status]}</span>
              </div>
            )}

            {/* Pickup code */}
            {['CONFIRMED', 'PREPARING', 'READY'].includes(order.status) && (
              <div className="pickup-code">
                <span className="text-xs text-[var(--ink-soft)]">Code:</span>
                <span className="code font-mono font-bold text-lg tracking-widest text-[var(--board)]">{order.code}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {order.status === 'READY' && (
                <button className="text-sm font-semibold px-3 py-2 rounded-lg border border-[#c9c2b3] bg-white text-[var(--ink-soft)] cursor-pointer hover:border-[var(--ink)] hover:text-[var(--ink)]" onClick={() => onCollect(order.id)}>
                  ✓ Mark collected
                </button>
              )}
              {order.status === 'PAYMENT_PENDING' && (
                <button className="text-sm font-semibold px-3 py-2 rounded-lg bg-[var(--board)] text-[var(--chalk)] border border-[var(--board)] cursor-pointer hover:bg-[var(--board-dark)]" onClick={() => onRetry(order.id, 'wallet')}>
                  Retry payment (wallet)
                </button>
              )}
              {!['COLLECTED', 'CANCELLED', 'CANCELLED_OUT_OF_STOCK'].includes(order.status) && (
                <button className="text-sm font-semibold px-3 py-2 rounded-lg border border-red-200 text-[var(--chili)] bg-white cursor-pointer hover:bg-[var(--chili)] hover:text-white hover:border-[var(--chili)]" onClick={() => onCancel(order.id)}>
                  Cancel order
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Messages Panel ─── */
function MessagesPanel({ messages }: { messages: any[] }) {
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const filtered = messages.filter(m => m.channel === channel);

  return (
    <div>
      <h3 className="text-xl mb-1">💬 Notifications</h3>
      <p className="text-[var(--ink-soft)] text-sm mb-4">Messages sent by the tray-it agent</p>

      {/* Channel toggle */}
      <div className="flex gap-2 mb-4">
        <button className={`text-sm font-semibold px-4 py-2 rounded-full border ${channel === 'whatsapp' ? 'bg-[#25D366] text-white border-[#25D366]' : 'bg-white text-[var(--ink-soft)] border-[#c9c2b3]'}`} onClick={() => setChannel('whatsapp')}>
          WhatsApp
        </button>
        <button className={`text-sm font-semibold px-4 py-2 rounded-full border ${channel === 'sms' ? 'bg-[var(--board)] text-[var(--chalk)] border-[var(--board)]' : 'bg-white text-[var(--ink-soft)] border-[#c9c2b3]'}`} onClick={() => setChannel('sms')}>
          SMS
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-[#8a8072] italic py-8 border-2 border-dashed border-[#ded6c2] rounded-xl">
          No {channel} messages yet. Place an order to see notifications here.
        </div>
      ) : channel === 'whatsapp' ? (
        <div className="phone-shell">
          <div className="phone-screen">
            <div className="wa-header">
              <div className="w-8 h-8 rounded-full bg-[var(--turmeric)] text-[#241a06] grid place-items-center font-bold text-xs">T</div>
              <div>
                <div>tray-it</div>
                <span className="text-[.68rem] opacity-75 font-normal block">online</span>
              </div>
            </div>
            <div className="wa-thread">
              {filtered.map(msg => (
                <div key={msg.id} className="msg in">
                  {msg.body.replace(/\*/g, '').replace(/_/g, '')}
                  <div className="meta">
                    <span>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`ticks ${msg.status === 'read' ? 'read' : ''}`}>
                      {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : '○'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[470px] overflow-y-auto">
          {filtered.map(msg => (
            <div key={msg.id} className="border border-[#ded6c2] rounded-xl p-3.5 bg-white shadow-sm">
              <div className="flex justify-between items-center gap-2 mb-1.5">
                <span className="font-bold text-sm">tray-it</span>
                <span className={`delivery-pill ${msg.status}`}>{msg.status}</span>
              </div>
              <div className="text-sm text-[var(--ink-soft)] leading-relaxed whitespace-pre-wrap">{msg.body.replace(/\*/g, '').replace(/_/g, '')}</div>
              <div className="flex justify-between mt-2 text-xs font-mono text-[#9b9184]">
                <span>{msg.to}</span>
                <span>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Payments Panel ─── */
function PaymentsPanel({ payments }: { payments: any[] }) {
  if (payments.length === 0) {
    return (
      <div>
        <h3 className="text-xl mb-1">💳 Payments</h3>
        <p className="text-[var(--ink-soft)] text-sm mb-4">Payment history from your orders</p>
        <div className="text-center text-[#8a8072] italic py-8 border-2 border-dashed border-[#ded6c2] rounded-xl">
          No payments yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl mb-1">💳 Payments</h3>
      <p className="text-[var(--ink-soft)] text-sm mb-4">{payments.length} transaction{payments.length > 1 ? 's' : ''}</p>
      {payments.map(p => (
        <div key={p.id} className="border border-[#ded6c2] rounded-xl p-3.5 bg-white mb-3 flex justify-between items-center gap-3 flex-wrap shadow-sm">
          <div>
            <div className="font-mono text-xs text-[#9b9184]">{p.id}</div>
            <div className="font-bold text-sm mt-0.5">Order #{p.orderId}</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">{METHOD_LABELS[p.method] || p.method} · {new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            {p.reference && <div className="text-xs font-mono text-[#9b9184] mt-0.5">Ref: {p.reference}</div>}
            {p.failureReason && <div className="text-xs text-[var(--chili)] mt-0.5">{p.failureReason}</div>}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-base">₹{p.amount}</span>
            <span className={`pay-status ${p.status.toLowerCase()}`}>{p.status.replace('_', ' ')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Activity Panel ─── */
function ActivityPanel({ log }: { log: any[] }) {
  if (log.length === 0) {
    return (
      <div>
        <h3 className="text-xl mb-1">🤖 Agent Activity</h3>
        <p className="text-[var(--ink-soft)] text-sm mb-4">Real-time log of every tool call the agent makes</p>
        <div className="text-center text-[#8a8072] italic py-8 border-2 border-dashed border-[#ded6c2] rounded-xl">
          No activity yet. Place an order to see the agent in action.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl mb-1">🤖 Agent Activity</h3>
      <p className="text-[var(--ink-soft)] text-sm mb-4">{log.length} tool calls logged</p>
      <div className="agent-log">
        {log.map(entry => (
          <div key={entry.id} className={`row ${entry.kind === 'err' ? 'err' : ''}`}>
            <span className="tl">{new Date(entry.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="tool">{entry.tool}</span>
            <span className="detail">{entry.detail}</span>
            {entry.ms !== undefined && <span className="text-[#4f7a5d] flex-none">{entry.ms}ms</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Account Panel ─── */
function AccountPanel({ state, onTopUp, onConsent, onSignOut }: {
  state: any;
  onTopUp: (amount: number) => void;
  onConsent: (channel: 'whatsapp' | 'sms', value: boolean) => void;
  onSignOut: () => void;
}) {
  const user = state.user;

  if (!user) {
    return (
      <div>
        <h3 className="text-xl mb-1">👤 Account</h3>
        <p className="text-[var(--ink-soft)] text-sm mb-4">Sign in to manage your account, consents, and wallet.</p>
        <div className="text-center text-[#8a8072] italic py-8 border-2 border-dashed border-[#ded6c2] rounded-xl">
          Not signed in. Click "Sign in" in the header to get started.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl mb-1">👤 Account & Consent</h3>
      <p className="text-[var(--ink-soft)] text-sm mb-4">Manage your profile, notification preferences, and wallet</p>

      {/* Wallet */}
      <div className="wallet-strip">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#bfb7a4] font-mono">tray-it credits</div>
          <div className="font-mono text-3xl font-bold text-[#fff3d3]">₹{state.wallet}</div>
        </div>
        <div className="flex gap-2">
          <button className="bg-[var(--turmeric)] text-[#241a06] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:brightness-110" onClick={() => onTopUp(100)}>+ ₹100</button>
          <button className="bg-[var(--turmeric)] text-[#241a06] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:brightness-110" onClick={() => onTopUp(500)}>+ ₹500</button>
        </div>
      </div>

      {/* Profile */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-5">
        <div className="border border-[#ded6c2] rounded-xl p-4 bg-white">
          <div className="font-mono text-xs uppercase tracking-wider text-[#9b9184]">Name</div>
          <div className="font-bold mt-1">{user.name}</div>
        </div>
        <div className="border border-[#ded6c2] rounded-xl p-4 bg-white">
          <div className="font-mono text-xs uppercase tracking-wider text-[#9b9184]">Phone</div>
          <div className="font-bold mt-1">+91 {user.phone}</div>
        </div>
        <div className="border border-[#ded6c2] rounded-xl p-4 bg-white">
          <div className="font-mono text-xs uppercase tracking-wider text-[#9b9184]">Member since</div>
          <div className="font-bold mt-1">{new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
        </div>
      </div>

      {/* Consents */}
      <h4 className="font-bold text-sm mb-3">Notification preferences</h4>
      <div className="border border-[#ded6c2] rounded-xl p-4 bg-white mb-5">
        <div className="flex items-center justify-between gap-3 py-3 border-b border-[#f0e9d9]">
          <div>
            <div className="font-semibold text-sm">WhatsApp notifications</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">Order confirmations, status updates, receipts</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={state.consents.whatsapp} onChange={e => onConsent('whatsapp', e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <div className="font-semibold text-sm">SMS notifications</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">Payment receipts and ready-for-pickup alerts</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={state.consents.sms} onChange={e => onConsent('sms', e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <button className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#c9c2b3] bg-white text-[var(--ink-soft)] cursor-pointer hover:border-[var(--ink)] hover:text-[var(--ink)]" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
