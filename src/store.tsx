import React, { createContext, useContext, useReducer, useCallback, ReactNode, useState, useEffect, useRef } from 'react';
import { AppState, User, Session, Order, Payment, Message, LogEntry, Filters, MenuItem, OrderItem, Watcher, ConfirmationRequest } from './types';
import { MENU, ORDER_FLOW, STATUS_LABELS, METHOD_LABELS, CANTEEN_WALK_MINUTES } from './data';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();

const initialState: AppState = {
  user: null,
  session: null,
  orders: [],
  payments: [],
  messages: [],
  wallet: 250,
  log: [],
  consents: { whatsapp: true, sms: true },
  watchers: [],
  confirmations: [],
};

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
  | { type: 'ADD_WATCHER'; watcher: Watcher }
  | { type: 'UPDATE_WATCHER'; watcher: Watcher }
  | { type: 'REMOVE_WATCHER'; id: string }
  | { type: 'ADD_CONFIRMATION'; confirmation: ConfirmationRequest }
  | { type: 'UPDATE_CONFIRMATION'; confirmation: ConfirmationRequest };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.user };
    case 'SET_SESSION': return { ...state, session: action.session };
    case 'ADD_ORDER': return { ...state, orders: [action.order, ...state.orders] };
    case 'UPDATE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.order.id ? action.order : o) };
    case 'ADD_PAYMENT': return { ...state, payments: [action.payment, ...state.payments] };
    case 'UPDATE_PAYMENT': return { ...state, payments: state.payments.map(p => p.id === action.payment.id ? action.payment : p) };
    case 'ADD_MESSAGE': return { ...state, messages: [action.message, ...state.messages] };
    case 'UPDATE_MESSAGE': return { ...state, messages: state.messages.map(m => m.id === action.message.id ? action.message : m) };
    case 'ADD_LOG': return { ...state, log: [action.entry, ...state.log].slice(0, 140) };
    case 'SET_WALLET': return { ...state, wallet: action.amount };
    case 'SET_CONSENT': return { ...state, consents: { ...state.consents, [action.channel]: action.value } };
    case 'ADD_WATCHER': return { ...state, watchers: [action.watcher, ...state.watchers] };
    case 'UPDATE_WATCHER': return { ...state, watchers: state.watchers.map(w => w.id === action.watcher.id ? action.watcher : w) };
    case 'REMOVE_WATCHER': return { ...state, watchers: state.watchers.filter(w => w.id !== action.id) };
    case 'ADD_CONFIRMATION': return { ...state, confirmations: [action.confirmation, ...state.confirmations] };
    case 'UPDATE_CONFIRMATION': return { ...state, confirmations: state.confirmations.map(c => c.id === action.confirmation.id ? action.confirmation : c) };
    default: return state;
  }
}

// Recommendation scoring
export function calculateScore(item: MenuItem, budget: number, filters: Filters): number {
  let score = 0;
  // Preference (40)
  if (!filters.pref) score += 25;
  else if (item.pref === filters.pref) score += 40;
  // Cuisine (20)
  if (!filters.type) score += 10;
  else if (item.type === filters.type) score += 20;
  // Budget fit (15)
  if (item.price <= budget) score += Math.min(15, Math.round((item.price / budget) * 15));
  // Availability (10)
  if (item.available) score += 10;
  // Proximity (5)
  const walk = CANTEEN_WALK_MINUTES[item.loc] || 5;
  score += Math.max(0, 5 - Math.max(0, walk - 2));
  // History bonus (10) - neutral
  score += 5;
  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Good Match';
  if (score >= 50) return 'Moderate Match';
  return 'Weak Match';
}

export function getRecommendationReason(item: MenuItem, budget: number, filters: Filters, score: number): string {
  const reasons: string[] = [];
  if (!filters.pref) reasons.push('food preference accepted');
  else if (item.pref === filters.pref) reasons.push(`${item.pref.toLowerCase()} preference matched`);
  if (!filters.type) reasons.push('cuisine flexible');
  else if (item.type === filters.type) reasons.push(`${item.type.toLowerCase()} cuisine matched`);
  if (item.price <= budget) reasons.push('within budget');
  if (item.available) reasons.push('currently available');
  const walk = CANTEEN_WALK_MINUTES[item.loc] || 5;
  reasons.push(`approximately ${walk} min walk`);
  return reasons.join(' · ') + `. Recommendation Score: ${score}/100 — ${scoreLabel(score)}.`;
}

export interface Recommendation {
  item: MenuItem;
  score: number;
  label: string;
  reason: string;
}

export function getRecommendations(filters: Filters): Recommendation[] {
  const foods = MENU.filter(m => m.category === 'food' && m.available);
  const filtered = foods.filter(item => {
    if (filters.pref && item.pref !== filters.pref) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.meal && !item.meals.includes(filters.meal)) return false;
    if (item.price > filters.budget) return false;
    return true;
  });
  const scored = filtered.map(item => {
    const score = calculateScore(item, filters.budget, filters);
    return { item, score, label: scoreLabel(score), reason: getRecommendationReason(item, filters.budget, filters, score) };
  });
  scored.sort((a, b) => b.score - a.score || b.item.price - a.item.price);
  return scored;
}

// Mission state
export interface MissionState {
  active: boolean;
  step: number;
  originalItem: MenuItem | null;
  originalBudget: number;
  currentBudget: number;
  requirement: string;
  finalFood: MenuItem | null;
  finalBeverage: MenuItem | null;
  finalStatus: string | null;
}

interface Toast {
  id: string;
  title: string;
  body: string;
  kind: string;
}

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
  // Mission
  mission: MissionState;
  setMission: (m: Partial<MissionState>) => void;
  resetMission: () => void;
  // Natural language
  applyNaturalRequest: (text: string) => void;
  // Watcher
  addWatcher: (menuId: string, maxPrice: number, notifyVia: 'email' | 'sms' | 'both', autoOrder: boolean) => void;
  removeWatcher: (id: string) => void;
  toggleWatcher: (id: string) => void;
  simulateWatcherTrigger: () => void;
  // Confirmation
  pendingConfirmation: ConfirmationRequest | null;
  confirmOrder: (confirmationId: string, otp: string) => Promise<boolean>;
  cancelConfirmation: (confirmationId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const defaultMission: MissionState = {
  active: false, step: 0, originalItem: null,
  originalBudget: 100, currentBudget: 100,
  requirement: 'single', finalFood: null, finalBeverage: null, finalStatus: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [filters, setFiltersState] = useState<Filters>({ pref: '', type: '', meal: '', beverage: '', budget: 100 });
  const [tray, setTray] = useState<OrderItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [otpData, setOtpData] = useState<{ phone: string; code: string } | null>(null);
  const [mission, setMissionState] = useState<MissionState>(defaultMission);

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const setMission = useCallback((m: Partial<MissionState>) => {
    setMissionState(prev => ({ ...prev, ...m }));
  }, []);

  const resetMission = useCallback(() => {
    // Restore availability
    MENU.forEach(item => { item.available = true; });
    // Reset default unavailable items
    MENU.find(m => m.name === 'Masala Chai')!.available = false;
    MENU.find(m => m.name === 'Fresh Lime Soda')!.available = false;
    setMissionState({ ...defaultMission, originalBudget: filters.budget, currentBudget: filters.budget });
  }, [filters.budget]);

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
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
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
    const user: User = { id: uid('usr'), phone, name: name.trim() || 'Student', createdAt: nowISO() };
    const session: Session = { userId: user.id, token: uid('tok'), expiresAt: Date.now() + 7 * 864e5 };
    dispatch({ type: 'SET_USER', user });
    dispatch({ type: 'SET_SESSION', session });
    setOtpData(null);
    return user;
  }, [otpData]);

  const signOut = useCallback(() => {
    dispatch({ type: 'SET_USER', user: null });
    dispatch({ type: 'SET_SESSION', session: null });
  }, []);

  // Send message
  const sendMessage = useCallback(async (channel: 'whatsapp' | 'sms', to: string, body: string, template: string, orderId: string | null) => {
    if (!state.consents[channel]) {
      addLog('notify.' + channel, 'skipped — user opted out', 'run');
      return;
    }
    const msg: Message = { id: uid('msg'), channel, to, body, template, orderId, status: 'queued', createdAt: nowISO() };
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

    await step('menu.validate', `checking ${items.length} item(s)`, async () => {
      const missing = items.filter(i => {
        const m = MENU.find(x => x.id === i.menuId);
        return !m || !m.available;
      });
      if (missing.length) throw new Error(`Unavailable: ${missing.map(m => m.name).join(', ')}`);
      return true;
    });

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

    await step('notify.whatsapp', 'sending order confirmation', async () => {
      const body = `🍽️ *tray-it order confirmed*\n\nOrder *#${order.id}* · ${counter}\n${items.map(i => `• ${i.name} — ₹${i.price}`).join('\n')}\nTotal *₹${total}*\nPickup: ${slot}\n\nShow code *${order.code}* at the counter.`;
      await sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '+91 ••••• •••••', body, 'order_placed', order.id);
      return true;
    });

    if (method === 'counter') {
      const updated = { ...order, status: 'CONFIRMED', history: [...order.history, { status: 'CONFIRMED', at: nowISO() }] };
      dispatch({ type: 'UPDATE_ORDER', order: updated });
      addLog('orders.confirm', 'confirmed — payment at counter', 'ok', 50);
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

    const payment: Payment = await step('payments.intent', `creating ${METHOD_LABELS[method]} intent for ₹${total}`, async () => {
      const p: Payment = {
        id: uid('pay'), orderId: order.id, amount: total, method,
        status: 'CREATED', idempotencyKey: uid('idem'),
        createdAt: nowISO(), attempts: 0, reference: null
      };
      dispatch({ type: 'ADD_PAYMENT', payment: p });
      return p;
    });

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
      p = { ...p, status: 'CAPTURED', capturedAt: nowISO(), reference: 'UTR' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0') };
      dispatch({ type: 'UPDATE_PAYMENT', payment: p });
      return p;
    });

    const confirmed = { ...order, status: 'CONFIRMED', paymentId: captured.id, history: [...order.history, { status: 'CONFIRMED', at: nowISO() }] };
    dispatch({ type: 'UPDATE_ORDER', order: confirmed });

    await step('notify.receipt', 'sending receipt on WhatsApp + SMS', async () => {
      const body = `✅ Payment received — ₹${total}\nOrder #${order.id}\nMethod: ${METHOD_LABELS[method]}\nRef: ${captured.reference}\n\nThanks for eating with tray-it! 🌿`;
      await sendMessage('whatsapp', state.user ? '+91 ' + state.user.phone : '', body, 'payment_receipt', order.id);
      await sendMessage('sms', state.user ? '+91 ' + state.user.phone : '', body, 'payment_receipt', order.id);
      return true;
    });

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

  // Natural language parser
  const applyNaturalRequest = useCallback((text: string) => {
    const t = text.toLowerCase();
    const newFilters: Partial<Filters> = {};
    // Preference
    if (/vegetarian|veg(?!etarian)/.test(t)) newFilters.pref = 'Vegetarian';
    else if (/non[- ]?vegetarian|chicken|egg/.test(t)) newFilters.pref = 'Non-Vegetarian';
    // Cuisine
    if (/south indian/.test(t)) newFilters.type = 'South Indian';
    else if (/chinese/.test(t)) newFilters.type = 'Chinese';
    else if (/indian/.test(t)) newFilters.type = 'Indian';
    // Meal
    if (/breakfast/.test(t)) newFilters.meal = 'Breakfast';
    else if (/lunch/.test(t)) newFilters.meal = 'Lunch';
    else if (/dinner/.test(t)) newFilters.meal = 'Dinner';
    // Beverage
    if (/only beverage|only drink|just a drink/.test(t)) newFilters.beverage = 'Only beverage';
    else if (/no beverage|without (a )?drink/.test(t)) newFilters.beverage = 'Not required';
    else if (/with (a )?(drink|beverage)|include (a )?(drink|beverage)/.test(t)) newFilters.beverage = 'Required';
    // Budget
    const budgetMatch = t.match(/(?:under|below|within|have|budget(?: of)?)\s*(?:₹|rs\.?|inr\s*)?(\d+)/);
    if (budgetMatch) {
      const n = Math.max(20, Math.min(200, Number(budgetMatch[1])));
      newFilters.budget = Math.round(n / 5) * 5;
    }
    setFilters(newFilters);
    addLog('nlu.parse', `parsed: "${text.slice(0, 70)}"`, 'ok', 120);
    addToast('✓ Request applied', 'Preferences updated from your description.', 'ok');
  }, [setFilters, addLog, addToast]);

  // ── Watcher logic ──
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const watcherIntervals = useRef<Record<string, number>>({});

  const addWatcher = useCallback((menuId: string, maxPrice: number, notifyVia: 'email' | 'sms' | 'both', autoOrder: boolean) => {
    const item = MENU.find(m => m.id === menuId);
    if (!item) return;
    const watcher: Watcher = {
      id: uid('watch'),
      menuId,
      itemName: item.name,
      maxPrice,
      notifyVia,
      autoOrder,
      active: true,
      createdAt: nowISO(),
      lastCheckedAt: null,
      triggeredAt: null,
    };
    dispatch({ type: 'ADD_WATCHER', watcher });
    addLog('watcher.create', `watching ${item.name} ≤ ₹${maxPrice}`, 'ok', 80);
    addToast('👁️ Watcher created', `Watching ${item.name} — you'll be notified when available.`, 'ok');
  }, [addLog, addToast]);

  const removeWatcher = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_WATCHER', id });
    if (watcherIntervals.current[id]) {
      clearInterval(watcherIntervals.current[id]);
      delete watcherIntervals.current[id];
    }
    addLog('watcher.remove', `stopped watching`, 'ok', 40);
  }, [addLog]);

  const toggleWatcher = useCallback((id: string) => {
    const w = state.watchers.find(w => w.id === id);
    if (!w) return;
    dispatch({ type: 'UPDATE_WATCHER', watcher: { ...w, active: !w.active } });
    addLog('watcher.toggle', `${w.itemName} ${!w.active ? 'resumed' : 'paused'}`, 'ok', 30);
  }, [state.watchers, addLog]);

  // Trigger a confirmation request (simulates backend dispatching email/SMS)
  const triggerConfirmation = useCallback(async (watcher: Watcher) => {
    const item = MENU.find(m => m.id === watcher.menuId);
    if (!item) return;

    const channel = watcher.notifyVia === 'email' ? 'email' : 'sms';
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const confirmation: ConfirmationRequest = {
      id: uid('conf'),
      watcherId: watcher.id,
      orderId: null,
      item: { menuId: item.id, name: item.name, price: item.price },
      total: item.price,
      counter: item.loc,
      method: 'wallet',
      otp,
      channel: channel as 'email' | 'sms',
      status: 'pending',
      createdAt: nowISO(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      confirmedAt: null,
    };

    dispatch({ type: 'ADD_CONFIRMATION', confirmation });
    setPendingConfirmation(confirmation);

    // Send simulated notification (email simulated via SMS channel for demo)
    const body = channel === 'email'
      ? `📧 [EMAIL] tray-it found your ${item.name}!\n\nPrice: ₹${item.price} at ${item.loc}\n\nYour confirmation code: ${otp}\n\n⏰ This expires in 5 minutes.\n\nClick the link below to confirm the deduction from your wallet:\n[Confirm Order](tray-it://confirm/${confirmation.id})`
      : `📱 tray-it: ${item.name} available for ₹${item.price} at ${item.loc}! Reply with code ${otp} within 5 min to confirm. Deduct from wallet?`;

    await sendMessage('sms', state.user ? (channel === 'email' ? state.user.phone + '@campus.edu' : '+91 ' + state.user.phone) : 'you', body, 'watcher_alert', null);
    addLog('notify.confirmation', `sent ${channel} with OTP ${otp}`, 'ok', 320);
    addToast(channel === 'email' ? '📧 Email sent' : '📱 SMS sent', `Confirmation code: ${otp} (expires in 5 min)`, 'ok');

    // Mark watcher as triggered
    const updatedWatcher = { ...watcher, triggeredAt: nowISO(), active: false };
    dispatch({ type: 'UPDATE_WATCHER', watcher: updatedWatcher });

    // Auto-expire after 5 minutes
    setTimeout(() => {
      setPendingConfirmation(prev => {
        if (prev && prev.id === confirmation.id && prev.status === 'pending') {
          const expired = { ...prev, status: 'expired' as const };
          dispatch({ type: 'UPDATE_CONFIRMATION', confirmation: expired });
          addLog('confirmation.expire', `#${confirmation.id} expired — no response`, 'err', 50);
          addToast('⏰ Confirmation expired', 'The order was not confirmed in time.', 'err');
          // Re-activate watcher
          dispatch({ type: 'UPDATE_WATCHER', watcher: { ...updatedWatcher, active: true, triggeredAt: null } });
          return null;
        }
        return prev;
      });
    }, 5 * 60 * 1000);
  }, [state.user, sendMessage, addLog, addToast]);

  const confirmOrder = useCallback(async (confirmationId: string, otp: string): Promise<boolean> => {
    const conf = state.confirmations.find(c => c.id === confirmationId);
    if (!conf) return false;
    if (conf.status !== 'pending') return false;
    if (Date.now() > conf.expiresAt) {
      dispatch({ type: 'UPDATE_CONFIRMATION', confirmation: { ...conf, status: 'expired' } });
      addToast('⏰ Expired', 'This confirmation has expired.', 'err');
      return false;
    }
    if (conf.otp !== otp.trim()) {
      addToast('❌ Wrong code', 'The confirmation code does not match.', 'err');
      return false;
    }

    // Confirmed! Place the order
    const confirmed = { ...conf, status: 'confirmed' as const, confirmedAt: nowISO() };
    dispatch({ type: 'UPDATE_CONFIRMATION', confirmation: confirmed });
    setPendingConfirmation(null);

    addLog('confirmation.verify', `OTP verified for ${conf.item.name}`, 'ok', 180);
    addToast('✅ Confirmed!', `Placing order for ${conf.item.name}…`, 'ok');

    // Actually place the order
    const result = await placeOrder(
      [conf.item],
      conf.total,
      conf.counter,
      'ASAP',
      conf.method,
    );

    if (result.ok && result.order) {
      const withOrderId = { ...confirmed, orderId: result.order.id };
      dispatch({ type: 'UPDATE_CONFIRMATION', confirmation: withOrderId });
      addLog('watcher.order', `#${result.order.id} placed via watcher`, 'ok', 200);
      addToast('🎉 Order placed!', `#${result.order.id} — ${conf.item.name} at ${conf.counter}`, 'ok');
    }

    return result.ok;
  }, [state.confirmations, placeOrder, addLog, addToast]);

  const cancelConfirmation = useCallback((confirmationId: string) => {
    const conf = state.confirmations.find(c => c.id === confirmationId);
    if (!conf || conf.status !== 'pending') return;
    dispatch({ type: 'UPDATE_CONFIRMATION', confirmation: { ...conf, status: 'cancelled' } });
    setPendingConfirmation(null);
    addLog('confirmation.cancel', `#${confirmationId} cancelled by user`, 'ok', 60);
    addToast('↩️ Cancelled', 'Confirmation dismissed. Watcher re-activated.', 'err');
    // Re-activate watcher
    const watcher = state.watchers.find(w => w.id === conf.watcherId);
    if (watcher) {
      dispatch({ type: 'UPDATE_WATCHER', watcher: { ...watcher, active: true, triggeredAt: null } });
    }
  }, [state.confirmations, state.watchers, addLog, addToast]);

  // Simulate a watcher trigger (for demo)
  const simulateWatcherTrigger = useCallback(() => {
    const activeWatcher = state.watchers.find(w => w.active);
    if (!activeWatcher) {
      addToast('⚠️ No active watchers', 'Create and activate a watcher first.', 'err');
      return;
    }
    addLog('watcher.demo', `simulating availability for ${activeWatcher.itemName}`, 'ok', 60);
    triggerConfirmation(activeWatcher);
  }, [state.watchers, triggerConfirmation, addLog, addToast]);

  // Background watcher polling simulation
  useEffect(() => {
    const interval = setInterval(() => {
      state.watchers.forEach(w => {
        if (!w.active) return;
        const item = MENU.find(m => m.id === w.menuId);
        if (!item) return;
        // Simulate checking
        const updated = { ...w, lastCheckedAt: nowISO() };
        dispatch({ type: 'UPDATE_WATCHER', watcher: updated });
        // Check if available and within budget
        if (item.available && item.price <= w.maxPrice) {
          addLog('watcher.trigger', `${item.name} now available at ₹${item.price}`, 'ok', 120);
          triggerConfirmation(w);
        }
      });
    }, 8000); // Check every 8 seconds
    return () => clearInterval(interval);
  }, [state.watchers, addLog, triggerConfirmation]);

  return (
    <AppContext.Provider value={{
      state, filters, setFilters, tray, addToTray, removeFromTray, clearTray,
      requestOtp, verifyOtp, signOut,
      placeOrder, cancelOrder, collectOrder, retryPayment,
      topUpWallet, setConsent,
      toasts, addToast, removeToast,
      mission, setMission, resetMission,
      applyNaturalRequest,
      addWatcher, removeWatcher, toggleWatcher, simulateWatcherTrigger,
      pendingConfirmation, confirmOrder, cancelConfirmation,
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
