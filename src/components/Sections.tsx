import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { MENU, MENU_ICONS } from '../data';
import { MenuItem, Recommendation } from '../types';

/* ─────────────── HERO ─────────────── */
export function Hero() {
  return (
    <section className="chalkboard">
      <div className="px-[6vw] pt-16 pb-20 relative z-[2]">
        <div className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-[var(--turmeric)] border border-[rgba(232,163,61,0.5)] px-3 py-1.5 rounded-full mb-5">
          ● tray-it — Your intelligent campus dining agent
        </div>
        <h1 className="text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] font-bold mb-5 max-w-[16ch]">
          What's <span className="text-[var(--turmeric)]">actually</span><br />for lunch today?
        </h1>
        <svg className="w-[220px] h-[14px] -mt-2 mb-6" viewBox="0 0 220 14">
          <path d="M2 9 Q 60 2, 110 8 T 216 6" stroke="#E8A33D" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <p className="max-w-[52ch] text-lg leading-relaxed text-[#d8d3c4] mb-8">
          Tell it what you eat, what meal you need, and how much you've got to spend — it checks the real canteen menu, picks your meal, orders it, pays for it and messages you when it's ready.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button className="btn btn-primary" onClick={() => document.getElementById('filters')?.scrollIntoView()}>Find my meal ↓</button>
          <button className="btn btn-ghost" onClick={() => document.getElementById('menu')?.scrollIntoView()}>Browse full menu</button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FILTERS ─────────────── */
export function Filters() {
  const { filters, setFilters, tray, addToTray, removeFromTray, clearTray } = useApp();

  const chipGroups = [
    { key: 'pref', label: '🌱 Food preference', options: [
      { val: 'Vegetarian', label: 'Vegetarian', cls: 'veg' },
      { val: 'Non-Vegetarian', label: 'Non-Vegetarian', cls: 'nonveg' },
      { val: '', label: 'Either', cls: '' },
    ]},
    { key: 'beverage', label: '🥤 Beverage', options: [
      { val: 'Required', label: 'Yes, include a beverage', cls: '' },
      { val: 'Only beverage', label: 'Only beverage', cls: '' },
      { val: 'Not required', label: 'No beverage', cls: '' },
      { val: '', label: 'No preference', cls: '' },
    ]},
    { key: 'type', label: '🍽️ Cuisine type', options: [
      { val: '', label: 'Any', cls: '' },
      { val: 'South Indian', label: 'South Indian', cls: '' },
      { val: 'Chinese', label: 'Chinese', cls: '' },
      { val: 'Indian', label: 'Indian', cls: '' },
    ]},
    { key: 'meal', label: '⏰ Meal time', options: [
      { val: '', label: 'Any time', cls: '' },
      { val: 'Breakfast', label: 'Breakfast', cls: '' },
      { val: 'Lunch', label: 'Lunch', cls: '' },
      { val: 'Dinner', label: 'Dinner', cls: '' },
    ]},
  ];

  const trayTotal = tray.reduce((s, i) => s + i.price, 0);
  const withinBudget = trayTotal <= filters.budget;

  return (
    <section className="bg-gradient-to-b from-[#DDE1E5] via-[#AEB4BB] to-[#8B929B] py-[5vw] px-[6vw] relative" id="filters">
      <div className="mb-8 relative z-[2]">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold">Step 01 · Your preferences</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5 text-[var(--ink)]">Load the tray</h2>
      </div>

      <div className="relative z-[2] bg-gradient-to-b from-[#F6F3EE] to-[#E9E4DA] rounded-[22px] border border-black/10 shadow-xl p-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
        {chipGroups.map(group => (
          <div key={group.key} className="flex flex-col gap-3">
            <label className="font-bold text-[var(--ink)] flex items-center gap-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{group.label}</label>
            <div className="flex flex-wrap gap-2">
              {group.options.map(opt => (
                <button
                  key={opt.val + opt.label}
                  className={`chip ${opt.cls} ${filters[group.key as keyof typeof filters] === opt.val ? 'active' : ''}`}
                  onClick={() => setFilters({ [group.key]: opt.val })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-3">
          <label className="font-bold text-[var(--ink)] flex items-center gap-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>💰 Maximum budget</label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={20} max={200} step={5} value={filters.budget}
              onChange={e => setFilters({ budget: Number(e.target.value) })}
              className="flex-1 h-1.5 rounded-full appearance-none bg-[#d8d2c4] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--chili)] [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="font-mono font-bold text-lg bg-[var(--ink)] text-[var(--chalk)] px-3 py-1.5 rounded-lg min-w-[70px] text-center">
              ₹{filters.budget}
            </div>
          </div>
        </div>
      </div>

      {/* Tray cart */}
      {tray.length > 0 && (
        <div className="relative z-[2] mt-6 bg-[var(--board)] text-[var(--chalk)] rounded-2xl p-5">
          <h3 className="mb-1" style={{ fontFamily: "'Baloo 2', sans-serif" }}>🍽️ My tray ({tray.length} items)</h3>
          <p className="text-[#c9c2ac] text-sm mb-4">Items you've added for this meal</p>
          {tray.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
              <span>{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono">₹{item.price}</span>
                <button onClick={() => removeFromTray(item.menuId)} className="bg-transparent border-none text-[#e7a58f] cursor-pointer text-base">✕</button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-white/25 font-mono font-bold text-lg">
            <span>Total</span>
            <span>₹{trayTotal}</span>
          </div>
          <div className={`mt-2 text-sm px-3 py-2 rounded-lg font-semibold ${withinBudget ? 'bg-green-900/20 text-green-300' : 'bg-red-900/25 text-red-300'}`}>
            {withinBudget ? `✓ Within budget (₹${filters.budget - trayTotal} remaining)` : `✕ Over budget by ₹${trayTotal - filters.budget}`}
          </div>
          <button onClick={clearTray} className="mt-3 text-sm text-[#a9a291] bg-transparent border border-white/20 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white/10">Clear tray</button>
        </div>
      )}

      <div className="mt-8 text-center relative z-[2] flex gap-3 justify-center flex-wrap">
        <button className="btn btn-recommend" onClick={() => document.getElementById('result-wrap')?.scrollIntoView()}>Recommend my meal 🍛</button>
      </div>
    </section>
  );
}

/* ─────────────── RESULTS ─────────────── */
export function Results() {
  const { filters, addToTray, tray } = useApp();
  const [showResults, setShowResults] = useState(false);

  const recommendations = useMemo((): Recommendation[] => {
    const foods = MENU.filter(m => m.category === 'food' && m.available);
    const beverages = MENU.filter(m => m.category === 'beverage' && m.available);

    let filtered = foods.filter(m => {
      if (filters.pref && m.pref !== filters.pref) return false;
      if (filters.type && m.type !== filters.type) return false;
      if (filters.meal && !m.meals.includes(filters.meal)) return false;
      if (m.price > filters.budget) return false;
      return true;
    });

    // Score: prefer items closer to budget (better value)
    const scored = filtered.map(item => {
      let score = 100;
      // Value score: closer to budget = better
      score += (item.price / filters.budget) * 30;
      // Variety bonus
      if (item.type === 'South Indian') score += 5;
      if (item.meals.length > 1) score += 3;
      return { item, score, reason: getReason(item, filters) };
    }).sort((a, b) => b.score - a.score);

    return scored;
  }, [filters]);

  const getReason = (item: MenuItem, f: typeof filters): string => {
    const reasons = [];
    if (f.pref && item.pref === f.pref) reasons.push(`matches your ${f.pref.toLowerCase()} preference`);
    if (f.type && item.type === f.type) reasons.push(`${f.type} cuisine`);
    if (item.price <= f.budget * 0.7) reasons.push('great value for your budget');
    else reasons.push('within your budget');
    if (f.meal && item.meals.includes(f.meal)) reasons.push(`available for ${f.meal.toLowerCase()}`);
    return reasons.join(' · ');
  };

  const handleRecommend = () => {
    setShowResults(true);
    document.getElementById('result-wrap')?.scrollIntoView();
  };

  if (!showResults) {
    return (
      <section className="py-[5vw] px-[6vw] bg-[var(--paper)]" id="result-wrap">
        <div className="mb-8">
          <div className="font-mono text-xs tracking-widest uppercase text-[var(--veg)] font-bold">Step 02 · Your recommendation</div>
          <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5">Today's pick</h2>
        </div>
        <div className="text-center text-[#8a8072] italic py-10 px-5 border-2 border-dashed border-[#d6cdb8] rounded-2xl">
          Set your preferences above and hit <strong>Recommend my meal</strong> — your top pick and alternatives will show up here.
        </div>
        <div className="mt-6 text-center">
          <button className="btn btn-recommend" onClick={handleRecommend}>Recommend my meal 🍛</button>
        </div>
      </section>
    );
  }

  const top = recommendations[0];
  const alts = recommendations.slice(1, 4);

  return (
    <section className="py-[5vw] px-[6vw] bg-[var(--paper)]" id="result-wrap">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--veg)] font-bold">Step 02 · Your recommendation</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5">Today's pick</h2>
      </div>

      {!top ? (
        <div className="text-center text-[#8a8072] italic py-10 px-5 border-2 border-dashed border-[#d6cdb8] rounded-2xl">
          No items match your current filters. Try relaxing your budget or preferences.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-7 items-start">
          {/* Top pick */}
          <div className="token top">
            <div className="stamp">TOP PICK</div>
            <h3 className="text-2xl mb-1">{MENU_ICONS[top.item.name]} {top.item.name}</h3>
            <div className="flex flex-wrap gap-2 my-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${top.item.pref === 'Vegetarian' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {top.item.pref}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-[#eee7d6] text-[var(--ink-soft)]">{top.item.type}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-blue-100 text-blue-800">{top.item.loc}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-[#c8bfa8] pt-3 mt-1">
              <span className="font-mono font-bold text-2xl text-[var(--chili)]">₹{top.item.price}</span>
              <span className="text-sm text-[var(--ink-soft)]">{top.item.loc}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{top.reason}</p>
            <button
              className="mt-4 w-full py-2.5 rounded-lg border-2 border-[var(--ink)] bg-transparent font-semibold cursor-pointer hover:bg-[var(--ink)] hover:text-white transition-colors"
              onClick={() => addToTray(top.item)}
            >
              + Add to tray
            </button>
          </div>

          {/* Alternatives */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-[var(--ink-soft)] uppercase tracking-wide">Alternatives</h4>
            {alts.map(rec => (
              <div key={rec.item.id} className="bg-white border border-[#ded6c2] rounded-xl p-3.5 flex justify-between items-center gap-3 shadow-[3px_3px_0_rgba(36,31,26,0.08)]">
                <div>
                  <div className="font-semibold">{MENU_ICONS[rec.item.name]} {rec.item.name}</div>
                  <div className="text-xs text-[var(--ink-soft)] mt-0.5">{rec.item.loc} · {rec.item.type}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[var(--chili)]">₹{rec.item.price}</span>
                  <button
                    className="bg-transparent border border-[rgba(243,234,216,0.35)] text-[var(--chalk)] rounded-full w-6 h-6 cursor-pointer text-sm font-bold hover:bg-[var(--turmeric)] hover:text-[#241a06] hover:border-[var(--turmeric)] transition-colors bg-[var(--board)] border-[var(--board)]"
                    onClick={() => addToTray(rec.item)}
                    title="Add to tray"
                  >+</button>
                </div>
              </div>
            ))}
            <button className="mt-2 text-sm text-[var(--chili)] font-semibold bg-transparent border-none cursor-pointer hover:underline" onClick={() => setShowResults(false)}>
              ← Adjust filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────────── MENU BOARD ─────────────── */
export function MenuBoard() {
  const { filters, addToTray } = useApp();
  const grouped = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    MENU.forEach(item => {
      if (!groups[item.loc]) groups[item.loc] = [];
      groups[item.loc].push(item);
    });
    return groups;
  }, []);

  const matches = (item: MenuItem) => {
    if (filters.pref && item.pref !== filters.pref) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.meal && !item.meals.includes(filters.meal)) return false;
    if (item.price > filters.budget) return false;
    return true;
  };

  return (
    <section className="bg-[var(--board-dark)] py-[5vw] px-[6vw]" id="menu">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--turmeric)] font-bold">Reference</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5 text-[var(--chalk)]">The full canteen menu</h2>
        <p className="text-[#cdc6b4] max-w-[60ch] mt-2">Every item currently on offer, grouped by counter. Dimmed items don't match your filters above.</p>
      </div>

      {Object.entries(grouped).map(([loc, items]) => (
        <div key={loc} className="mb-9">
          <h4 className="text-[var(--turmeric)] font-mono uppercase tracking-wider text-sm mb-3 border-b border-[rgba(232,163,61,0.4)] pb-2">{loc}</h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
            {items.map(item => {
              const dim = !matches(item);
              return (
                <div key={item.id} className={`menu-card ${dim ? 'dim' : ''}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold">{MENU_ICONS[item.name] || '🍽️'} {item.name}</span>
                    <span className="font-mono text-[var(--turmeric)] font-bold">₹{item.price}</span>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap text-xs items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${item.pref === 'Vegetarian' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-[#cdc6b4]">{item.category === 'beverage' ? '🥤 Beverage' : item.type}</span>
                    {!item.available && <span className="bg-red-900/40 px-2 py-0.5 rounded-full text-red-300">Sold out</span>}
                  </div>
                  {!dim && !item.available === false && (
                    <button
                      className="mt-2 bg-transparent border border-[rgba(243,234,216,0.35)] text-[var(--chalk)] rounded-full w-6 h-6 cursor-pointer text-sm font-bold hover:bg-[var(--turmeric)] hover:text-[#241a06] hover:border-[var(--turmeric)] transition-colors"
                      onClick={() => addToTray(item)}
                    >+</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
