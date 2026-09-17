import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AppState, User, Session, Order, Payment, Message, LogEntry, Filters, MenuItem, OrderItem } from './types';
import { MENU, ORDER_FLOW, STATUS_LABELS, METHOD_LABELS } from './data';

// Utility functions
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();

// Initial state
const initialState: AppState = {
  user: null,
  session: null,
  orders: [],
  payments: [],
  messages: [],
  wallet: 250,
  log: [],
  consents: { whatsapp: true, sms: true },
};

// Actions
type Action =
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_SESSION'; session: Session | null }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'ADD_PAYMENT'; payment: Payment }
  | { type: 'UPDATE_PAYMENT'; payment: Payment }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'UPDATE_MESSAGE'; message: Message }
  | { type: 'ADD_LOG'; entry: LogEntry }
  | { type: 'SET_WALLET'; amount: number }
  | { type: 'SET_CONSENT'; channel: 'whatsapp' | 'sms'; value: boolean }
  | { type: 'LOAD_STATE'; state: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_SESSION':
      return { ...state, session: action.session };
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };
    case 'UPDATE_ORDER':
      return { ...state, orders: state.orders.map(o => o.id === action.order.id ? action.order : o) };
    case 'ADD_PAYMENT':
      return { ...state, payments: [action.payment, ...state.payments] };
    case 'UPDATE_PAYMENT':
      return { ...state, payments: state.payments.map(p => p.id === action.payment.id ? action.payment : p) };
    case 'ADD_MESSAGE':
      return { ...state, messages: [action.message, ...state.messages] };
    case 'UPDATE_MESSAGE':
      return { ...state, messages: state.messages.map(m => m.id === action.message.id ? action.message : m) };
    case 'ADD_LOG':
      return { ...state, log: [action.entry, ...state.log].slice(0, 140) };
    case 'SET_WALLET':
      return { ...state, wallet: action.amount };
    case 'SET_CONSENT':
      return { ...state, consents: { ...state.consents, [action.channel]: action.value } };
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  tray: OrderItem[];
  addToTray: (item: MenuItem) => void;
  removeFromTray: (menuId: string) => void;
  clearTray: () => void;
  // Auth
  requestOtp: (phone: string) => Promise<string>;
  verifyOtp: (phone: string, code: string, name: string) => Promise<User>;
  signOut: () => void;
  // Orders
  placeOrder: (items: OrderItem[], total: number, counter: string, slot: string, method: string, onStep?: (step: any) => void) => Promise<{ ok: boolean; order?: Order; payment?: Payment; error?: string }>;
  cancelOrder: (orderId: string) => Promise<void>;
  collectOrder: (orderId: string) => void;
  retryPayment: (orderId: string, method: string) => Promise<boolean>;
  // Wallet
  topUpWallet: (amount: number) => void;
  // Consent
  setConsent: (channel: 'whatsapp' | 'sms', value: boolean) => void;
  // Toasts
  toasts: Toast[];
  addToast: (title: string, body: string, kind?: string) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  title: string;
  body: string;
  kind: string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [filters, setFiltersState] = React.useState<Filters>({ pref: '', type: '', meal: '', beverage: '', budget: 100 });
  const [tray, setTray] = React.useState<OrderItem[]>([]);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [otpData, setOtpData] = React.useState<{ phone: string; code: string } | null>(null);

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const addToTray = useCallback((item: MenuItem) => {
    setTray(prev => [...prev, { menuId: item.id, name: item.name, price: item.price }]);
  }, []);

  const removeFromTray = useCallback((menuId: string) => {
    setTray(prev => {
      const idx = prev.findIndex(i => i.menuId === menuId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const clearTray = useCallback(() => setTray([]), []);

  const addToast = useCallback((title: string, body: string, kind = '') => {
    const id = uid('toast');
    setToasts(prev => [...prev, { id, title, body, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addLog = useCallback((tool: string, detail: string, kind = 'ok', ms?: number) => {
    dispatch({ type: 'ADD_LOG', entry: { id: uid('log'), tool, detail, kind, ms, at: nowISO() } });
  }, []);

  // Auth
  const requestOtp = useCallback(async (phone: string): Promise<string> => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpData({ phone, code });
    await sleep(520);
    return code;
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name: string): Promise<User> => {
    if (!otpData || otpData.phone !== phone) throw new Error('No OTP was requested for this number.');
    if (otpData.code !== String(code).trim()) throw new Error("That code doesn't match.");
    
    const user: User = {
      id: uid('usr'),
      phone,
      name: name.trim() || 'Student',
      createdAt: nowISO(),
    };
    const session: Session = {
      userId: user.id,
      token: uid('tok'),
      expiresAt: Date.now() + 7 * 864e5,
    };
    dispatch({ type: 'SET_USER', user });
    dispatch({ type: 'SET_SESSION', session });
    setOtpData(null);
    return user;
  }, [otpData]);

  const signOut = useCallback(() => {
    dispatch({ type: 'SET_USER', user: null });
    dispatch({ type: 'SET_SESSION', session: null });
  }, []);

  // Send message simulation
  const sendMessage = useCallback(async (channel: 'whatsapp' | 'sms', to: string, body: string, template: string, orderId: string | null) => {
    if (!state.consents[channel]) {
      addLog('notify.' + channel, `skipped — user opted out`, 'run');
      return;
    }
    const msg: Message = {
      id: uid('msg'), channel, to, body, template, orderId, status: 'queued', createdAt: nowISO()
    };
    dispatch({ type: 'ADD_MESSAGE', message: msg });
    await sleep(420);
    dispatch({ type: 'UPDATE_MESSAGE', message: { ...msg, status: 'sent' } });
    await sleep(680);
    dispatch({ type: 'UPDATE_MESSAGE', message: { ...msg, status: 'delivered' } });
    if (channel === 'whatsapp') {
      await sleep(820);
      dispatch({ type: 'UPDATE_MESSAGE', message: { ...msg, status: 'read' } });
    }
    addToast(channel === 'whatsapp' ? '💬 WhatsApp sent' : '📱 SMS sent', body.split('\n')[0], channel === 'whatsapp' ? 'wa' : 'ok');
  }, [state.consents, addLog, addToast]);

  // Place order
  const placeOrder = useCallback(async (
    items: OrderItem[], total: number, counter: string, slot: string, method: string,
    onStep?: (step: { tool: string; detail: string; state: string; ms?: number }) => void
  ) => {
    const step = async (tool: string, detail: string, fn: () => Promise<any>) => {
      onStep?.({ tool, detail, state: 'running' });
      const t0 = performance.now();
      try {
        const result = await fn();
        const ms = Math.round(performance.now() - t0);
        addLog(tool, detail, 'ok', ms);
        onStep?.({ tool, detail, state: 'done', ms });
        return result;
      } catch (err: any) {
        const ms = Math.round(performance.now() - t0);
        addLog(tool, err.message || detail, 'err', ms);
        onStep?.({ tool, detail, state: 'error', ms });
        throw err;
      }
    };

    // 1. Validate
    await step('menu.validate', `checking ${items.length} item(s)`, async () => {
      const missing = items.filter(i => {
        const m = MENU.find(x => x.id === i.menuId);
        return !m || !m.available;
      });
      if (missing.length) throw new Error(`Unavailable: ${missing.map(m => m.name).join(', ')}`);
      return true;
    });

    // 2. Create order
    const order: Order = await step('orders.create', `creating order at ${counter}`, async () => {
      const o: Order = {
        id: 'TR' + Math.floor(1000 + Math.random() * 9000),
        code: Math.random().toString(36).slice(2, 6).toUpperCase(),
        items, total, counter, slot, budget: total,
        status: 'PLACED', paymentId: null,
        userId: state.user?.id || null,
        createdAt: nowISO(),
        history: [{ status: 'PLACED', at: nowISO() }]
      };
      dispatch({ type: 'ADD_ORDER', order: o });
      return o;
    });

    // 3. WhatsApp confirmation
    await step('notify.whatsapp', 'sending order confirmation', async () => {
      const body = `🍽️ *tray-it order confirmed*\n\nOrder *#${order.id}* · ${counter}\n${items.map(i => `• ${i.name} — ₹${i.price}`).join('\n')}\nTotal *₹${total}*\nPickup: ${slot}\n\nShow code *${order.code}* at the counter.`;
      await sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '+91 ••••• •••••', body, 'order_placed', order.id);
      return true;
    });

    // 4. Pay at counter
    if (method === 'counter') {
      const updated = { ...order, status: 'CONFIRMED', history: [...order.history, { status: 'CONFIRMED', at: nowISO() }] };
      dispatch({ type: 'UPDATE_ORDER', order: updated });
      addLog('orders.confirm', 'confirmed — payment at counter', 'ok', 50);
      // Schedule progression
      setTimeout(() => {
        const preparing = { ...updated, status: 'PREPARING', history: [...updated.history, { status: 'PREPARING', at: nowISO() }] };
        dispatch({ type: 'UPDATE_ORDER', order: preparing });
        sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '', `👨‍🍳 Your order #${order.id} is being prepared.`, 'order_preparing', order.id);
      }, 7000);
      setTimeout(() => {
        const ready = { ...order, status: 'READY', history: [...order.history, { status: 'PREPARING', at: nowISO() }, { status: 'READY', at: nowISO() }] };
        dispatch({ type: 'UPDATE_ORDER', order: ready });
        sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '', `🔔 Order #${order.id} is READY! Show code *${order.code}*.`, 'order_ready', order.id);
      }, 16000);
      return { ok: true, order: updated };
    }

    // 5. Payment
    const payment: Payment = await step('payments.intent', `creating ${METHOD_LABELS[method]} intent for ₹${total}`, async () => {
      const p: Payment = {
        id: uid('pay'), orderId: order.id, amount: total, method,
        status: 'CREATED', idempotencyKey: uid('idem'),
        createdAt: nowISO(), attempts: 0, reference: null
      };
      dispatch({ type: 'ADD_PAYMENT', payment: p });
      return p;
    });

    // 6. Capture
    const captured = await step('payments.capture', 'capturing payment', async () => {
      let p = { ...payment, attempts: payment.attempts + 1, status: 'PENDING' };
      dispatch({ type: 'UPDATE_PAYMENT', payment: p });
      await sleep(950);

      if (method === 'wallet') {
        if (state.wallet < total) {
          p = { ...p, status: 'FAILED', failureReason: 'Insufficient tray-it credits' };
          dispatch({ type: 'UPDATE_PAYMENT', payment: p });
          throw new Error('Insufficient tray-it credits');
        }
        dispatch({ type: 'SET_WALLET', amount: state.wallet - total });
      }

      p = {
        ...p, status: 'CAPTURED', capturedAt: nowISO(),
        reference: 'UTR' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0')
      };
      dispatch({ type: 'UPDATE_PAYMENT', payment: p });
      return p;
    });

    // 7. Success
    const confirmed = { ...order, status: 'CONFIRMED', paymentId: captured.id, history: [...order.history, { status: 'CONFIRMED', at: nowISO() }] };
    dispatch({ type: 'UPDATE_ORDER', order: confirmed });

    await step('notify.receipt', 'sending receipt on WhatsApp + SMS', async () => {
      const body = `✅ Payment received — ₹${total}\nOrder #${order.id}\nMethod: ${METHOD_LABELS[method]}\nRef: ${captured.reference}\n\nThanks for eating with tray-it! 🌿`;
      await sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '', body, 'payment_receipt', order.id);
      await sendMessage('sms', state.user ? '+91 ' + state.user.phone : '', body, 'payment_receipt', order.id);
      return true;
    });

    // Schedule progression
    setTimeout(() => {
      const preparing = { ...confirmed, status: 'PREPARING', history: [...confirmed.history, { status: 'PREPARING', at: nowISO() }] };
      dispatch({ type: 'UPDATE_ORDER', order: preparing });
      sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '', `👨‍🍳 Your order #${order.id} is being prepared.`, 'order_preparing', order.id);
    }, 7000);
    setTimeout(() => {
      const ready = { ...confirmed, status: 'READY', history: [...confirmed.history, { status: 'PREPARING', at: nowISO() }, { status: 'READY', at: nowISO() }] };
      dispatch({ type: 'UPDATE_ORDER', order: ready });
      sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '', `🔔 Order #${order.id} is READY! Show code *${ready.code}*.`, 'order_ready', order.id);
    }, 16000);

    return { ok: true, order: confirmed, payment: captured };
  }, [state.user, state.wallet, addLog, sendMessage]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    if (['COLLECTED', 'CANCELLED', 'CANCELLED_OUT_OF_STOCK'].includes(order.status)) return;

    const payment = state.payments.find(p => p.id === order.paymentId);
    let refunded = 0;
    if (payment && payment.status === 'CAPTURED') {
      const refundedPayment = { ...payment, status: 'REFUNDED', refundedAt: nowISO(), refundReason: 'Customer cancelled' };
      dispatch({ type: 'UPDATE_PAYMENT', payment: refundedPayment });
      if (payment.method === 'wallet') dispatch({ type: 'SET_WALLET', amount: state.wallet + payment.amount });
      refunded = payment.amount;
    }

    const cancelled = { ...order, status: 'CANCELLED', history: [...order.history, { status: 'CANCELLED', at: nowISO() }] };
    dispatch({ type: 'UPDATE_ORDER', order: cancelled });
    addLog('orders.cancel', `#${orderId} cancelled, ₹${refunded} refunded`, 'ok', 200);
    addToast('↩️ Order cancelled', refunded ? `₹${refunded} refunded.` : 'No payment to refund.', 'err');
  }, [state.orders, state.payments, state.wallet, addLog, addToast]);

  const collectOrder = useCallback((orderId: string) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'READY') return;
    const collected = { ...order, status: 'COLLECTED', history: [...order.history, { status: 'COLLECTED', at: nowISO() }] };
    dispatch({ type: 'UPDATE_ORDER', order: collected });
    addToast('✅ Order collected', `Order #${orderId} marked as collected.`, 'ok');
  }, [state.orders, addToast]);

  const retryPayment = useCallback(async (orderId: string, method: string): Promise<boolean> => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return false;
    const payment: Payment = {
      id: uid('pay'), orderId: order.id, amount: order.total, method,
      status: 'CREATED', idempotencyKey: uid('idem'),
      createdAt: nowISO(), attempts: 0, reference: null
    };
    dispatch({ type: 'ADD_PAYMENT', payment });
    await sleep(950);
    if (method === 'wallet' && state.wallet < order.total) {
      dispatch({ type: 'UPDATE_PAYMENT', payment: { ...payment, status: 'FAILED', failureReason: 'Insufficient credits' } });
      return false;
    }
    if (method === 'wallet') dispatch({ type: 'SET_WALLET', amount: state.wallet - order.total });
    const captured = { ...payment, status: 'CAPTURED', capturedAt: nowISO(), reference: 'UTR' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0') };
    dispatch({ type: 'UPDATE_PAYMENT', payment: captured });
    const confirmed = { ...order, status: 'CONFIRMED', paymentId: captured.id, history: [...order.history, { status: 'CONFIRMED', at: nowISO() }] };
    dispatch({ type: 'UPDATE_ORDER', order: confirmed });
    return true;
  }, [state.orders, state.wallet]);

  const topUpWallet = useCallback((amount: number) => {
    dispatch({ type: 'SET_WALLET', amount: state.wallet + amount });
    addToast('💰 Wallet topped up', `₹${amount} added. New balance ₹${state.wallet + amount}`, 'ok');
  }, [state.wallet, addToast]);

  const setConsent = useCallback((channel: 'whatsapp' | 'sms', value: boolean) => {
    dispatch({ type: 'SET_CONSENT', channel, value });
  }, []);

  return (
    <AppContext.Provider value={{
      state, filters, setFilters, tray, addToTray, removeFromTray, clearTray,
      requestOtp, verifyOtp, signOut,
      placeOrder, cancelOrder, collectOrder, retryPayment,
      topUpWallet, setConsent,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
