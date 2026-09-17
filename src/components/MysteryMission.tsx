import React, { useState } from 'react';
import { useApp, getRecommendations } from '../store';
import { MENU, MENU_ICONS, CANTEEN_WALK_MINUTES } from '../data';
import { MenuItem } from '../types';

export function MysteryMission() {
  const { filters, mission, setMission, resetMission, addToTray } = useApp();
  const [timeline, setTimeline] = useState<{ id: string; type: string; content: React.ReactNode }[]>([]);
  const [output, setOutput] = useState<React.ReactNode>(null);
  const [showReset, setShowReset] = useState(false);

  const handleSoldOut = () => {
    if (!mission.active || mission.step !== 1) return;
    const orig = mission.originalItem;
    if (!orig) return;

    // Mark item as sold out
    const menuItem = MENU.find(m => m.id === orig.id);
    if (menuItem) menuItem.available = false;

    // Add apology to timeline
    setTimeline(prev => [...prev, {
      id: 'apology',
      type: 'apology',
      content: (
        <div className="soldout-apology">
          <div className="apology-mark">!</div>
          <div>
            <div className="font-bold text-[var(--chili)]">We're sorry — this item just sold out.</div>
            <div className="text-sm text-[var(--ink-soft)] mt-0.5">{MENU_ICONS[orig.name]} {orig.name} at {orig.loc} is no longer available.</div>
          </div>
        </div>
      )
    }]);

    // Find replacement
    const alternatives = MENU.filter(m => m.category === 'food' && m.available && m.price <= mission.originalBudget &&
      (!filters.pref || m.pref === filters.pref) && (!filters.type || m.type !== filters.type || m.type === filters.type));
    const replacement = alternatives.sort((a, b) => b.price - a.price)[0];

    setTimeline(prev => [...prev, {
      id: 'change1',
      type: 'tl-card err',
      content: (
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--chili)] font-bold mb-1">Change 01 · Item sold out</div>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
            <strong>{MENU_ICONS[orig.name]} {orig.name}</strong> at {orig.loc} has been marked as unavailable.
            {replacement ? (
              <> The agent has identified a replacement: <strong>{MENU_ICONS[replacement.name]} {replacement.name}</strong> at ₹{replacement.price} ({replacement.loc}).</>
            ) : (
              <> No suitable replacement found within the ₹{mission.originalBudget} budget.</>
            )}
          </p>
        </div>
      )
    }]);

    setMission({ step: 2, currentBudget: mission.originalBudget });
  };

  const handleBudgetCut = () => {
    if (mission.step !== 2) return;
    setTimeline(prev => [...prev, {
      id: 'change2',
      type: 'tl-card',
      content: (
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--turmeric)] font-bold mb-1">Change 02 · Budget cut</div>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-3">
            You originally said ₹{mission.originalBudget}. Enter the amount you can actually spend.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-semibold">New budget:</label>
            <span className="font-mono font-bold text-lg">₹</span>
            <input
              type="number"
              id="newBudgetInput"
              min={1}
              max={mission.originalBudget}
              defaultValue={80}
              step={5}
              className="w-20 px-2 py-1.5 rounded-lg border border-[#c9c2b3] font-mono text-sm bg-white focus:border-[var(--chili)] focus:outline-none"
            />
            <button
              className="btn btn-primary text-sm py-2 px-4"
              onClick={() => {
                const input = document.getElementById('newBudgetInput') as HTMLInputElement;
                const val = Number(input.value);
                if (!val || val <= 0 || val > mission.originalBudget) {
                  alert(`Please enter a budget between ₹1 and ₹${mission.originalBudget}.`);
                  return;
                }
                setMission({ step: 3, currentBudget: val });
                setTimeline(prev => [...prev, {
                  id: 'budgetConfirmed',
                  type: 'tl-card ok',
                  content: (
                    <div>
                      <p className="text-sm text-[var(--ink-soft)]">
                        Budget revised to <strong className="text-[var(--chili)]">₹{val}</strong>. The agent is reassessing available options…
                      </p>
                    </div>
                  )
                }]);
              }}
            >Recalculate</button>
          </div>
        </div>
      )
    }]);
    setMission({ step: 3 });
  };

  const handleNewRequirement = () => {
    if (mission.step !== 3) return;

    // Find best option at new budget
    const foods = MENU.filter(m => m.category === 'food' && m.available && m.price <= mission.currentBudget &&
      (!filters.pref || m.pref === filters.pref) && (!filters.type || m.type === filters.type));
    const beverages = MENU.filter(m => m.category === 'beverage' && m.available && m.price <= mission.currentBudget);
    const pairs: { food: MenuItem; bev: MenuItem; total: number }[] = [];
    for (const f of foods) {
      for (const b of beverages) {
        if (f.price + b.price <= mission.currentBudget) {
          pairs.push({ food: f, bev: b, total: f.price + b.price });
        }
      }
    }
    pairs.sort((a, b) => b.total - a.total);

    const bestCombo = pairs[0] || null;
    const fallbackFood = foods.sort((a, b) => b.price - a.price)[0] || null;

    let finalFood: MenuItem | null = null;
    let finalBev: MenuItem | null = null;
    let status = 'none';

    if (bestCombo) {
      finalFood = bestCombo.food;
      finalBev = bestCombo.bev;
      status = 'combo';
    } else if (fallbackFood) {
      finalFood = fallbackFood;
      status = 'single';
    }

    setMission({ step: 4, finalFood, finalBeverage: finalBev, finalStatus: status });

    setTimeline(prev => [...prev, {
      id: 'change3',
      type: 'tl-card ok',
      content: (
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--veg)] font-bold mb-1">Change 03 · New requirement resolved</div>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
            {status === 'combo' && (
              <>The agent found a valid pairing: <strong>{MENU_ICONS[finalFood!.name]} {finalFood!.name}</strong> + <strong>{MENU_ICONS[finalBev!.name]} {finalBev!.name}</strong> = <strong className="text-[var(--chili)]">₹{bestCombo!.total}</strong> (₹{mission.currentBudget - bestCombo!.total} remaining from ₹{mission.currentBudget}).</>
            )}
            {status === 'single' && (
              <>No valid pairing fits ₹{mission.currentBudget}. Fallback: <strong>{MENU_ICONS[finalFood!.name]} {finalFood!.name}</strong> at <strong className="text-[var(--chili)]">₹{finalFood!.price}</strong> (₹{mission.currentBudget - finalFood!.price} remaining).</>
            )}
            {status === 'none' && <>No available item fits within ₹{mission.currentBudget}.</>}
          </p>
          {/* Analysis grid */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="bg-[#f7f3e8] rounded-lg p-2 text-center">
              <div className="font-mono text-lg font-bold text-[var(--chili)]">₹{mission.currentBudget}</div>
              <div className="text-xs text-[var(--ink-soft)]">Budget</div>
            </div>
            <div className="bg-[#f7f3e8] rounded-lg p-2 text-center">
              <div className="font-mono text-lg font-bold text-[var(--chili)]">{foods.length}</div>
              <div className="text-xs text-[var(--ink-soft)]">Food</div>
            </div>
            <div className="bg-[#f7f3e8] rounded-lg p-2 text-center">
              <div className="font-mono text-lg font-bold text-[var(--chili)]">{beverages.length}</div>
              <div className="text-xs text-[var(--ink-soft)]">Drinks</div>
            </div>
            <div className="bg-[#f7f3e8] rounded-lg p-2 text-center">
              <div className="font-mono text-lg font-bold text-[var(--chili)]">{pairs.length}</div>
              <div className="text-xs text-[var(--ink-soft)]">Pairings</div>
            </div>
          </div>
        </div>
      )
    }]);

    // Render output
    setOutput(
      <div className="mt-6">
        <h4 className="font-bold text-lg mb-3">📋 Final Deliverable</h4>
        {/* Output table */}
        <div className="overflow-x-auto">
          <table className="output-table">
            <thead>
              <tr><th>Field</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr><td>Menu Source</td><td>Live canteen menu ({MENU.length} items)</td></tr>
              <tr><td>Original Recommendation</td><td>{mission.originalItem ? `${MENU_ICONS[mission.originalItem.name]} ${mission.originalItem.name} at ${mission.originalItem.loc}` : '—'}</td></tr>
              <tr><td>Original Status</td><td><span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700">SOLD OUT</span></td></tr>
              <tr><td>Revised Budget</td><td className="font-mono font-bold">₹{mission.currentBudget}</td></tr>
              <tr><td>Selected Food</td><td>{finalFood ? `${MENU_ICONS[finalFood.name]} ${finalFood.name} (₹${finalFood.price})` : '—'}</td></tr>
              <tr><td>Selected Beverage</td><td>{finalBev ? `${MENU_ICONS[finalBev.name]} ${finalBev.name} (₹${finalBev.price})` : '—'}</td></tr>
              <tr><td>Total Cost</td><td className="font-mono font-bold">{finalFood && finalBev ? `₹${finalFood.price + finalBev.price}` : finalFood ? `₹${finalFood.price}` : '—'}</td></tr>
              <tr><td>Remaining Budget</td><td className="font-mono">{finalFood && finalBev ? `₹${mission.currentBudget - finalFood.price - finalBev.price}` : finalFood ? `₹${mission.currentBudget - finalFood.price}` : '—'}</td></tr>
              <tr><td>Final Status</td><td><span className={`text-xs font-mono px-2 py-0.5 rounded-full ${status === 'combo' ? 'bg-green-100 text-green-700' : status === 'single' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{status.toUpperCase()}</span></td></tr>
            </tbody>
          </table>
        </div>

        {/* Alternatives */}
        {(status === 'combo' || status === 'single') && (
          <div className="mt-5">
            <h5 className="font-bold text-sm mb-2">{status === 'combo' ? 'All valid pairings' : 'All eligible food items'}</h5>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
              {status === 'combo' ? pairs.slice(0, 6).map((p, i) => (
                <div key={i} className="bg-white border border-[#ded6c2] rounded-lg p-2.5 text-sm">
                  <div className="font-semibold">{MENU_ICONS[p.food.name]} + {MENU_ICONS[p.bev.name]}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{p.food.name} + {p.bev.name}</div>
                  <div className="font-mono font-bold text-[var(--chili)] mt-1">₹{p.total}</div>
                </div>
              )) : foods.slice(0, 6).map(f => (
                <div key={f.id} className="bg-white border border-[#ded6c2] rounded-lg p-2.5 text-sm">
                  <div className="font-semibold">{MENU_ICONS[f.name]} {f.name}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{f.loc} · {f.type}</div>
                  <div className="font-mono font-bold text-[var(--chili)] mt-1">₹{f.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="mt-5 bg-[#f7f3e8] rounded-xl p-4">
          <h5 className="font-bold text-sm mb-2">✅ Deliverable Checklist</h5>
          <dl className="text-sm space-y-1.5">
            <div className="flex gap-2"><dt className="font-semibold text-[var(--ink-soft)] min-w-[140px]">Availability Check:</dt><dd>✓ Verified against live menu</dd></div>
            <div className="flex gap-2"><dt className="font-semibold text-[var(--ink-soft)] min-w-[140px]">Budget Analysis:</dt><dd>✓ Reassessed at ₹{mission.currentBudget}</dd></div>
            <div className="flex gap-2"><dt className="font-semibold text-[var(--ink-soft)] min-w-[140px]">Fallback Plan:</dt><dd>✓ {status === 'combo' ? 'Pairing found' : status === 'single' ? 'Single item fallback' : 'No option available'}</dd></div>
            <div className="flex gap-2"><dt className="font-semibold text-[var(--ink-soft)] min-w-[140px]">Menu-Only Evidence:</dt><dd>✓ All items from MENU array</dd></div>
          </dl>
        </div>
      </div>
    );

    setShowReset(true);
  };

  const handleReset = () => {
    resetMission();
    setTimeline([]);
    setOutput(null);
    setShowReset(false);
  };

  // Initialize mission when recommendations are shown
  React.useEffect(() => {
    if (mission.active && mission.step === 0) {
      const recs = getRecommendations(filters);
      if (recs.length > 0) {
        setMission({ active: true, step: 1, originalItem: recs[0].item, originalBudget: filters.budget, currentBudget: filters.budget });
      }
    }
  }, []);

  if (!mission.active) return null;

  return (
    <section className="py-[5vw] px-[6vw] bg-gradient-to-b from-[#fff8e9] to-[var(--paper)]" id="mission">
      <div className="mb-8">
        <div className="font-mono text-xs tracking-widest uppercase text-[var(--chili)] font-bold">Step 03 · Mystery mission</div>
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] mt-1.5">The agent under pressure</h2>
        <p className="text-[var(--ink-soft)] max-w-[60ch] mt-2">Watch the agent handle real-world changes: an item selling out, a budget cut, and a new requirement — all while using only valid menu data.</p>
      </div>

      {/* Intro */}
      <div className="mission-intro mb-6">
        <h3 className="text-lg font-bold mb-2">🎭 The Scenario</h3>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-4">
          Your original recommendation was <strong>{mission.originalItem ? `${MENU_ICONS[mission.originalItem.name]} ${mission.originalItem.name}` : '—'}</strong> at <strong>{mission.originalItem?.loc}</strong> with a <strong>₹{mission.originalBudget}</strong> budget.
          Over the next three changes, the agent must adapt.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="evidence-pill">✓ Menu-only evidence</span>
          <span className="evidence-pill">✓ Auto-refund on sell-out</span>
          <span className="evidence-pill">✓ Budget re-optimization</span>
          <span className="evidence-pill">✓ Fallback planning</span>
          <span className="evidence-pill">✓ Explainable decisions</span>
        </div>
      </div>

      {/* Step buttons */}
      <div className="flex gap-4 flex-wrap mb-6">
        <button
          className={`mm-btn ${mission.step === 1 ? 'ready' : ''} ${mission.step > 1 ? 'done' : ''}`}
          disabled={mission.step !== 1}
          onClick={handleSoldOut}
        >
          <div className="mm-num">Change 01</div>
          <div className="font-bold text-base mt-1">😱 Item sold out</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">The recommended item becomes unavailable</div>
          {mission.step > 1 && <span className="mm-check">✓ done</span>}
        </button>
        <button
          className={`mm-btn ${mission.step === 2 ? 'ready' : ''} ${mission.step > 2 ? 'done' : ''}`}
          disabled={mission.step !== 2}
          onClick={handleBudgetCut}
        >
          <div className="mm-num">Change 02</div>
          <div className="font-bold text-base mt-1">💸 Budget cut</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">You can spend less than originally planned</div>
          {mission.step > 2 && <span className="mm-check">✓ done</span>}
        </button>
        <button
          className={`mm-btn ${mission.step === 3 ? 'ready' : ''} ${mission.step > 3 ? 'done' : ''}`}
          disabled={mission.step !== 3}
          onClick={handleNewRequirement}
        >
          <div className="mm-num">Change 03</div>
          <div className="font-bold text-base mt-1">🔄 New requirement</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">Resolve with updated constraints</div>
          {mission.step > 3 && <span className="mm-check">✓ done</span>}
        </button>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-[var(--ink-soft)]">Mission Timeline</h4>
          {timeline.map(entry => (
            <div key={entry.id}>{entry.content}</div>
          ))}
        </div>
      )}

      {/* Output */}
      {output}

      {/* Reset */}
      {showReset && (
        <div className="mt-6 text-center">
          <button className="btn btn-ghost border-[var(--board)] text-[var(--board)]" onClick={handleReset}>↺ Run the mission again</button>
        </div>
      )}
    </section>
  );
}
