import { MenuItem } from './types';

export const MENU: MenuItem[] = [
  // FOOD
  { id: 'menu-0', category: 'food', name: 'Veg Meals', type: 'South Indian', pref: 'Vegetarian', price: 90, loc: 'Main Canteen', meals: ['Lunch'], available: true },
  { id: 'menu-1', category: 'food', name: 'Masala Dosa', type: 'South Indian', pref: 'Vegetarian', price: 60, loc: 'Food Court', meals: ['Breakfast', 'Lunch'], available: true },
  { id: 'menu-2', category: 'food', name: 'Veg Fried Rice', type: 'Chinese', pref: 'Vegetarian', price: 80, loc: 'Main Canteen', meals: ['Lunch', 'Dinner'], available: true },
  { id: 'menu-3', category: 'food', name: 'Chicken Biryani', type: 'Indian', pref: 'Non-Vegetarian', price: 120, loc: 'Food Court', meals: ['Lunch', 'Dinner'], available: true },
  { id: 'menu-4', category: 'food', name: 'Idli & Sambar', type: 'South Indian', pref: 'Vegetarian', price: 50, loc: 'Block-A Canteen', meals: ['Breakfast', 'Lunch'], available: true },
  { id: 'menu-5', category: 'food', name: 'Curd Rice', type: 'South Indian', pref: 'Vegetarian', price: 40, loc: 'Main Canteen', meals: ['Lunch', 'Dinner'], available: true },
  { id: 'menu-6', category: 'food', name: 'Chapati & Sabzi', type: 'Indian', pref: 'Vegetarian', price: 45, loc: 'Block-A Canteen', meals: ['Lunch', 'Dinner'], available: true },
  { id: 'menu-7', category: 'food', name: 'Egg Fried Rice', type: 'Chinese', pref: 'Non-Vegetarian', price: 70, loc: 'Main Canteen', meals: ['Lunch', 'Dinner'], available: true },
  { id: 'menu-8', category: 'food', name: 'Chicken Roll', type: 'Indian', pref: 'Non-Vegetarian', price: 55, loc: 'Food Court', meals: ['Breakfast', 'Lunch', 'Dinner'], available: true },
  // BEVERAGES
  { id: 'menu-9', category: 'beverage', name: 'Buttermilk', type: 'Beverage', pref: 'Vegetarian', price: 15, loc: 'Main Canteen', meals: ['Breakfast', 'Lunch', 'Dinner'], available: true },
  { id: 'menu-10', category: 'beverage', name: 'Masala Chai', type: 'Beverage', pref: 'Vegetarian', price: 15, loc: 'Block-A Canteen', meals: ['Breakfast', 'Lunch', 'Dinner'], available: true },
  { id: 'menu-11', category: 'beverage', name: 'Filter Coffee', type: 'Beverage', pref: 'Vegetarian', price: 20, loc: 'Food Court', meals: ['Breakfast', 'Lunch', 'Dinner'], available: true },
  { id: 'menu-12', category: 'beverage', name: 'Fresh Lime Soda', type: 'Beverage', pref: 'Vegetarian', price: 25, loc: 'Main Canteen', meals: ['Lunch', 'Dinner'], available: true },
  { id: 'menu-13', category: 'beverage', name: 'Cold Coffee', type: 'Beverage', pref: 'Vegetarian', price: 35, loc: 'Food Court', meals: ['Breakfast', 'Lunch', 'Dinner'], available: true },
  { id: 'menu-14', category: 'beverage', name: 'Water Bottle', type: 'Beverage', pref: 'Vegetarian', price: 10, loc: 'Main Canteen', meals: ['Breakfast', 'Lunch', 'Dinner'], available: true },
];

export const MENU_ICONS: Record<string, string> = {
  'Veg Meals': '🍛',
  'Masala Dosa': '🥞',
  'Veg Fried Rice': '🍚',
  'Chicken Biryani': '🍗',
  'Idli & Sambar': '🍥',
  'Curd Rice': '🍚',
  'Chapati & Sabzi': '🫓',
  'Egg Fried Rice': '🍳',
  'Chicken Roll': '🌯',
  'Buttermilk': '🥛',
  'Masala Chai': '🍵',
  'Filter Coffee': '☕',
  'Fresh Lime Soda': '🍋',
  'Cold Coffee': '🧋',
  'Water Bottle': '💧',
};

export const ORDER_FLOW = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COLLECTED'];

export const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Placed',
  PAYMENT_PENDING: 'Payment pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
  CANCELLED_OUT_OF_STOCK: 'Cancelled · sold out',
};

export const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  wallet: 'tray-it credits',
  counter: 'Pay at counter',
};

export const CANTEEN_WALK_MINUTES: Record<string, number> = {
  'Main Canteen': 2,
  'Food Court': 3,
  'Block-A Canteen': 5,
};
