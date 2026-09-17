import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import { Hero, Filters, Results, MenuBoard } from './components/Sections';
import { AgentHub } from './components/AgentHub';
import { AuthModal, CheckoutModal } from './components/Modals';
import { MENU } from './data';

function AppContent() {
  const { state, tray, clearTray, signOut, toasts, removeToast } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const user = state.user;
  const initials = user ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

  const handleAuthPillClick = () => {
    if (user) {
      document.getElementById('hub')?.scrollIntoView();
    } else {
      setAuthOpen(true);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (tray.length === 0) return;
    setCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setCheckoutOpen(false);
    if (tray.length > 0) clearTray();
  };

  // Determine counter from tray items
  const getCounter = () => {
    if (tray.length === 0) return 'Main Canteen';
    const locations = tray.map(item => {
      const menu = MENU.find(m => m.id === item.menuId);
      return menu?.loc || 'Main Canteen';
    });
    // Most common
    const counts: Record<string, number> = {};
    locations.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const trayTotal = tray.reduce((s, i) => s + i.price, 0);

  return (
    <div className="min-h-screen">
      {/* Scroll progress */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}></div>

      {/* Toast stack */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`} onClick={() => removeToast(t.id)}>
            <div className="font-bold text-sm">{t.title}</div>
            <div className="text-xs mt-0.5 opacity-80">{t.body}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="chalkboard">
        <header className="flex items-center justify-between gap-3 px-[6vw] py-4 relative z-[5] flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="12" rx="14" ry="4" fill="#DDE1E5"/>
              <rect x="10" y="12" width="28" height="9" rx="2" fill="#C7CCD1"/>
              <ellipse cx="24" cy="21" rx="14" ry="4" fill="#DDE1E5"/>
              <rect x="10" y="21" width="28" height="9" rx="2" fill="#AEB4BB"/>
              <ellipse cx="24" cy="30" rx="14" ry="4" fill="#C7CCD1"/>
              <rect x="21" y="4" width="6" height="7" rx="2" fill="#8B929B"/>
            </svg>
            <div className="text-xl font-bold">tray<span className="text-[var(--turmeric)]">-it</span></div>
          </div>
          <nav className="flex items-center gap-1 flex-wrap">
            <a href="#filters" className="text-[var(--chalk)] opacity-85 no-underline text-sm ml-5 font-medium hover:opacity-100 hover:underline">Find a meal</a>
            <a href="#menu" className="text-[var(--chalk)] opacity-85 no-underline text-sm ml-5 font-medium hover:opacity-100 hover:underline">Full menu</a>
            <a href="#hub" className="text-[var(--chalk)] opacity-85 no-underline text-sm ml-5 font-medium hover:opacity-100 hover:underline">Agent hub</a>
            <button className="auth-pill ml-5" onClick={handleAuthPillClick}>
              <span className={`auth-avatar ${!user ? 'guest' : ''}`}>{initials}</span>
              <span>{user ? user.name : 'Sign in'}</span>
            </button>
          </nav>
        </header>

        <Hero />
      </div>

      <Filters />

      {/* Order button */}
      {tray.length > 0 && (
        <div className="bg-[var(--paper)] px-[6vw] py-4 flex justify-center">
          <button className="btn btn-order" onClick={handleCheckout}>
            Order my tray & pay → (₹{trayTotal})
          </button>
        </div>
      )}

      <Results />
      <AgentHub />
      <MenuBoard />

      {/* Footer */}
      <footer className="bg-[var(--board-dark)] text-[#a9a291] text-center py-7 px-[6vw] text-sm border-t border-white/10">
        Built as a demo of <strong>tray-it</strong>, your intelligent campus dining agent. Recommendations, orders, payments and notifications all come from the menu and rules in this app. · Edit the <code className="font-mono">MENU</code> array to plug in your own canteen's real data.
      </footer>

      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={handleCheckoutClose}
        items={tray}
        total={trayTotal}
        counter={getCounter()}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
