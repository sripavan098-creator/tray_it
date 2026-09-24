import React, { useState, useMemo } from 'react';
import { useApp, getRecommendations } from '../store';
import { MENU, MENU_ICONS, CANTEEN_WALK_MINUTES } from '../data';
import { MenuItem } from '../types';

/* ─────────────── HERO ─────────────── */
export function Hero() {
  return (
    <section className="chalkboard">
      <div className="px-[6vw] pt-16 pb-20 relative z-[2]">
        <div className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-[var(--turmeric)] border border-[rgba(232,163,61,0.5)] px-3 py-1.5 rounded-full mb-5">
          ● tray-it — Your intelligent campus dining agent
        </div>
        <h1 className="text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] font-bold mb-5 max-w-[16ch]">
          What's <span className="text-[var(--turmeric)] italic">actually</span><br />for lunch today?
        </h1>
        <svg className="w-[220px] h-[14px] -mt-2 mb-6" viewBox="0 0 220 14">
          <path d="M2 9 Q 60 2, 110 8 T 216 6" stroke="#E8A33D" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <p className="max-w-[52ch] text-lg leading-relaxed text-[#d8d3c4] mb-8">
          Tell it what you eat, what meal you need, and how much you've got to spend — it checks the real canteen menu across every counter on campus and hands you a pick, not a puzzle.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button className="btn btn-primary" onClick={() => document.getElementById('filters')?.scrollIntoView()}>Find my meal ↓</button>
          <button className="btn btn-ghost" onClick={() => document.getElementById('menu')?.scrollIntoView()}>Browse full menu</button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FILTERS + OPTIMIZER ─────────────── */
export function Filters() {
  const { filters, setFilters, tray, addToTray, removeFromTray, clearTray, applyNaturalRequest } = useApp();
  const [nlInput, setNlInput] = useState('');

  const chipGroups = [
    { key: 'pref', label: '🌱 Food preference', options: [
      { val: 'Vegetarian', label: 'Vegetarian', cls: 'veg' },
      { val: 'Non-Vegetarian', label: 'Non-Vegetarian', cls: 'nonveg' },
      { val: '', label: 'Either', cls: '' },
    ]},
    { key: 'beverage', label: '🥤 Beverage', options: [
      { val: 'Required', label: 'Include a beverage', cls: '' },
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

  // Optimizer calculations
  const optimizerData = useMemo(() => {
    const foods = MENU.filter(m => m.category === 'food' && m.available && m.price <= filters.budget &&
      (!filters.pref || m.pref === filters.pref) &&
      (!filters.type || m.type === filters.type) &&
      (!filters.meal || m.meals.includes(filters.meal)));
    const beverages = filters.beverage === 'Not required' ? [] :
      MENU.filter(m => m.category === 'beverage' && m.available && m.price <= filters.budget &&
        (!filters.meal || m.meals.includes(filters.meal)));
    const pairs: { food: MenuItem; bev: MenuItem; total: number; remaining: number }[] = [];
    for (const f of foods) {
      for (const b of beverages) {
        if (f.price + b.price <= filters.budget) {
          pairs.push({ food: f, bev: b, total: f.price + b.price, remaining: filters.budget - f.price - b.price });
        }
      }
    }
    pairs.sort((a, b) => b.total - a.total || a.food.price - b.food.price);
    const bestCombo = pairs[0] || null;
    const fallbackFood = foods.slice().sort((a, b) => b.price - a.price)[0] || null;
    return { foods, beverages, pairs, bestCombo, fallbackFood };
  }, [filters]);

  const trayTotal = tray.reduce((s, i) => s + i.price, 0);
  const withinBudget = trayTotal <= filters.budget;

  return (
    <section className="steel-section py-[5vw] px-[6vw] relative" id="filters">
      <div className="mb-8 relative z-[2]">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold">Step 01 · Your preferences</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5 text-[var(--ink)]">Load the tray</h2>
      </div>

      {/* Tiffin */}
      <div className="tiffin">
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

      {/* Optimizer card */}
      <div className="optimizer-card relative z-[2]">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#bfb7a4]">Agent Status: Monitoring menu</span>
          </div>
        </div>

        {/* Natural language input */}
        <div className="mb-4">
          <label className="block font-semibold text-sm mb-2">🗣️ Or describe it in plain English</label>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
              placeholder='e.g. "vegetarian South Indian lunch under ₹80 with a drink"'
              className="flex-1 min-w-[200px] px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-[var(--chalk)] placeholder-[#a9a291] font-sans text-sm focus:border-[var(--turmeric)] focus:outline-none"
            />
            <button className="btn btn-primary text-sm py-2 px-4" onClick={() => { applyNaturalRequest(nlInput); setNlInput(''); }}>Apply request</button>
          </div>
          <p className="text-xs text-[#a9a291] mt-1.5">Try: "only beverage" · "non veg dinner 150" · "vegetarian lunch under ₹80"</p>
        </div>

        {/* Live metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/8 rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[var(--turmeric)]">{optimizerData.foods.length}</div>
            <div className="text-xs text-[#bfb7a4] mt-0.5">Available food</div>
          </div>
          <div className="bg-white/8 rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[var(--turmeric)]">{optimizerData.beverages.length}</div>
            <div className="text-xs text-[#bfb7a4] mt-0.5">Available drinks</div>
          </div>
          <div className="bg-white/8 rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[var(--turmeric)]">{optimizerData.pairs.length}</div>
            <div className="text-xs text-[#bfb7a4] mt-0.5">Valid pairings</div>
          </div>
        </div>

        {/* Optimize result */}
        {optimizerData.bestCombo && (
          <div className="bg-white/5 border border-[rgba(232,163,61,.3)] rounded-lg p-3 text-sm">
            <span className="font-bold text-[var(--turmeric)]">Best use of ₹{filters.budget}:</span>{' '}
            <strong>{MENU_ICONS[optimizerData.bestCombo.food.name]} {optimizerData.bestCombo.food.name}</strong> +{' '}
            <strong>{MENU_ICONS[optimizerData.bestCombo.bev.name]} {optimizerData.bestCombo.bev.name}</strong> ={' '}
            <strong className="text-[var(--turmeric)]">₹{optimizerData.bestCombo.total}</strong>
            <span className="text-[#bfb7a4]"> (₹{optimizerData.bestCombo.remaining} remaining)</span>
          </div>
        )}
        {!optimizerData.bestCombo && optimizerData.fallbackFood && (
          <div className="bg-white/5 border border-[rgba(232,163,61,.3)] rounded-lg p-3 text-sm">
            <span className="font-bold text-[var(--turmeric)]">No valid pairing fits ₹{filters.budget}.</span>{' '}
            Safe fallback: <strong>{MENU_ICONS[optimizerData.fallbackFood.name]} {optimizerData.fallbackFood.name}</strong> at{' '}
            <strong className="text-[var(--turmeric)]">₹{optimizerData.fallbackFood.price}</strong>
            <span className="text-[#bfb7a4]"> (₹{filters.budget - optimizerData.fallbackFood.price} remaining)</span>
          </div>
        )}
        {!optimizerData.bestCombo && !optimizerData.fallbackFood && (
          <div className="bg-white/5 border border-[rgba(193,68,45,.4)] rounded-lg p-3 text-sm text-[#f0a396]">
            No available food item fits within ₹{filters.budget} using the selected preferences.
          </div>
        )}
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
export function Results({ onShow }: { onShow?: () => void }) {
  const { filters, addToTray, tray } = useApp();
  const [showResults, setShowResults] = useState(false);

  const recommendations = useMemo(() => getRecommendations(filters), [filters]);
  const top = recommendations[0];
  const alts = recommendations.slice(1, 4);

  const handleRecommend = () => {
    setShowResults(true);
    onShow?.();
    setTimeout(() => document.getElementById('result-wrap')?.scrollIntoView(), 100);
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

  return (
    <section className="py-[5vw] px-[6vw] bg-[var(--paper)]" id="result-wrap">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--veg)] font-bold">Step 02 · Your recommendation</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5">Today's pick</h2>
      </div>

      {!top ? (
        <div className="text-center text-[#8a8072] italic py-10 px-5 border-2 border-dashed border-[#d6cdb8] rounded-2xl">
          No items match your current filters. Try relaxing your budget or preferences.
          <div className="mt-3 text-sm not-italic">
            <button className="text-[var(--chili)] font-semibold bg-transparent border-none cursor-pointer hover:underline" onClick={() => setShowResults(false)}>← Adjust filters</button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-7 items-start">
            {/* Top pick token */}
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
                <span className="text-sm text-[var(--ink-soft)]">📍 {top.item.loc}</span>
              </div>
              {/* Score badges */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--board)] text-[var(--chalk)]">Score: {top.score}/100</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--turmeric)] text-[#241a06]">{top.label}</span>
              </div>
              {/* Why */}
              <div className="mt-3 p-3 bg-[#f7f3e8] rounded-lg border-l-4 border-[var(--chili)]">
                <div className="text-xs font-bold text-[var(--chili)] uppercase tracking-wider mb-1">Why this recommendation?</div>
                <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{top.reason}</p>
              </div>
              {/* Walk distance */}
              <div className="mt-2 text-sm text-[var(--ink-soft)]">
                📍 {top.item.loc} · 🚶 Approximately {CANTEEN_WALK_MINUTES[top.item.loc] || 5} min
              </div>
              <button
                className="mt-4 w-full py-2.5 rounded-lg border-2 border-[var(--ink)] bg-transparent font-semibold cursor-pointer hover:bg-[var(--ink)] hover:text-white transition-colors"
                onClick={() => addToTray(top.item)}
              >
                + Add to plate
              </button>
            </div>

            {/* Alternatives */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-[var(--ink-soft)] uppercase tracking-wide">Alternatives</h4>
              {alts.map(rec => (
                <div key={rec.item.id} className="bg-white border border-[#ded6c2] rounded-xl p-3.5 flex justify-between items-center gap-3 shadow-[3px_3px_0_rgba(36,31,26,0.08)]">
                  <div>
                    <div className="font-semibold">{MENU_ICONS[rec.item.name]} {rec.item.name}</div>
                    <div className="text-xs text-[var(--ink-soft)] mt-0.5">{rec.item.loc} · {rec.item.type} · Score: {rec.score}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[var(--chili)]">₹{rec.item.price}</span>
                    <button
                      className="bg-[var(--board)] border-[var(--board)] text-[var(--chalk)] rounded-full w-7 h-7 cursor-pointer text-sm font-bold hover:bg-[var(--turmeric)] hover:text-[#241a06] hover:border-[var(--turmeric)] transition-colors"
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

          {/* Receipt */}
          <div className="receipt mt-8">
            <div className="mb-2 font-bold text-[var(--ink)]">RECOMMENDATION RECEIPT</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-[var(--ink-soft)]">Selected:</div>
              <div className="font-bold">{MENU_ICONS[top.item.name]} {top.item.name}</div>
              <div className="text-[var(--ink-soft)]">Price:</div>
              <div className="font-mono">₹{top.item.price}</div>
              <div className="text-[var(--ink-soft)]">Location:</div>
              <div>{top.item.loc} ({CANTEEN_WALK_MINUTES[top.item.loc]} min walk)</div>
              <div className="text-[var(--ink-soft)]">Score:</div>
              <div className="font-mono">{top.score}/100 — {top.label}</div>
              <div className="text-[var(--ink-soft)]">Budget:</div>
              <div className="font-mono">₹{filters.budget}</div>
            </div>
            <div className="mt-3 pt-3 border-t border-dashed border-[#c8bfa8] text-xs text-[var(--ink-soft)]">
              All recommendations sourced exclusively from the live canteen menu. Nothing is invented.
            </div>
          </div>
        </>
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
        <p className="text-[#cdc6b4] max-w-[60ch] mt-2">Every item currently on offer, grouped by counter. Dimmed items don't match your filters above — everyone can still scan the whole board.</p>
      </div>

      {Object.entries(grouped).map(([loc, items]) => (
        <div key={loc} className="mb-9">
          <h4 className="text-[var(--turmeric)] font-mono uppercase tracking-wider text-sm mb-3 border-b border-[rgba(232,163,61,0.4)] pb-2">
            {loc} · 🚶 {CANTEEN_WALK_MINUTES[loc] || 5} min
          </h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
            {items.map(item => {
              const dim = !matches(item) || !item.available;
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
                  {!dim && item.available && (
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
