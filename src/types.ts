export interface MenuItem {
  id: string;
  category: 'food' | 'beverage';
  name: string;
  type: string;
  pref: 'Vegetarian' | 'Non-Vegetarian';
  price: number;
  loc: string;
  meals: string[];
  available: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: number;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
}

export interface OrderHistory {
  status: string;
  at: string;
}

export interface Order {
  id: string;
  code: string;
  items: OrderItem[];
  total: number;
  counter: string;
  slot: string;
  budget: number;
  status: string;
  paymentId: string | null;
  userId: string | null;
  createdAt: string;
  history: OrderHistory[];
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  idempotencyKey: string;
  createdAt: string;
  attempts: number;
  reference: string | null;
  capturedAt?: string;
  failureReason?: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface Message {
  id: string;
  channel: 'whatsapp' | 'sms';
  to: string;
  body: string;
  template: string;
  orderId: string | null;
  status: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  tool: string;
  detail: string;
  kind: string;
  ms?: number;
  at: string;
}

export interface AppState {
  user: User | null;
  session: Session | null;
  orders: Order[];
  payments: Payment[];
  messages: Message[];
  wallet: number;
  log: LogEntry[];
  consents: { whatsapp: boolean; sms: boolean };
  watchers: Watcher[];
  confirmations: ConfirmationRequest[];
}

export interface Filters {
  pref: string;
  type: string;
  meal: string;
  beverage: string;
  budget: number;
}

export interface Recommendation {
  item: MenuItem;
  score: number;
  reason: string;
}

export interface Watcher {
  id: string;
  menuId: string;
  itemName: string;
  maxPrice: number;
  notifyVia: 'email' | 'sms' | 'both';
  autoOrder: boolean;
  active: boolean;
  createdAt: string;
  lastCheckedAt: string | null;
  triggeredAt: string | null;
}

export interface ConfirmationRequest {
  id: string;
  watcherId: string;
  orderId: string | null;
  item: OrderItem;
  total: number;
  counter: string;
  method: string;
  otp: string;
  channel: 'email' | 'sms';
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: number;
  confirmedAt: string | null;
}
