/* GLITCH//LS — app logic
   Data flow: data.js (curated baseline) + data/live.js (auto-updater output) -> DB -> render*().
   Applying a live update just rebuilds DB and re-renders. */
(() => {
  "use strict";

  /* =========================================================== utilities */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : null);
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const isActive = (until) => !until || Date.now() < Date.parse(until);

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
  };

  const trimNum = (x, d) => (+x.toFixed(d)).toString();
  function money(n, exact = false) {
    n = Math.round(n);
    if (exact) return "$" + n.toLocaleString("en-US");
    const a = Math.abs(n);
    if (a >= 1e9) return "$" + trimNum(n / 1e9, 2) + "B";
    if (a >= 1e6) return "$" + trimNum(n / 1e6, 2) + "M";
    if (a >= 1e3) return "$" + trimNum(n / 1e3, a >= 1e5 ? 0 : 1) + "K";
    return "$" + n;
  }
  function duration(min) {
    min = Math.max(0, Math.round(min));
    if (min < 60) return min + "m";
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  function ago(iso) {
    const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
    if (s < 90) return "just now";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    return Math.round(s / 86400) + "d ago";
  }
  const monthYear = () => new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const ytLink = (name) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${name} GTA Online ${monthYear()}`);
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  let toastTimer;
  function toast(msg, ms = 5000) {
    const el = $("#toast");
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), ms);
  }

  /* =============================================================== data */
  const DB = { live: null, reg: new Map() };

  const PLAT = (v) => {
    const s = Array.isArray(v) ? v.join(" ") : String(v || "");
    const out = [];
    if (/\bPC\b/.test(s)) out.push("PC");
    if (/\bPS\d?\b|play ?station/i.test(s)) out.push("PS");
    if (/xbox/i.test(s)) out.push("Xbox");
    return out;
  };

  function relabel(m) {
    if (/[–-]/.test(m.payoutLabel)) return m.payoutLabel; // ranges keep their wording
    return money(m.payout) + (m.firstWeekly ? ` (${money(m.firstWeekly)} first of the week)` : "");
  }

  function buildDB(live) {
    const L = live && live.schema === 1 ? live : null;
    DB.live = L;
    DB.reg = new Map();

    DB.properties = structuredClone(PROPERTIES);
    if (L?.propertyCosts) DB.properties.forEach((p) => { if (L.propertyCosts[p.id]) p.cost = L.propertyCosts[p.id]; });

    const wk = L?.weekly && L.weekly.title && L.weekly.ends ? L.weekly : WEEKLY;
    DB.weekly = wk;
    DB.weeklyIsLive = wk !== WEEKLY;

    DB.methods = structuredClone(METHODS).map((m) => {
      const ov = L?.methodOverrides?.[m.id];
      if (ov) { Object.assign(m, ov); m.updated = true; m.payoutLabel = relabel(m); }
      delete m.event; delete m.bonus;
      if (wk.methodEvents?.[m.id]) m.event = { ...wk.methodEvents[m.id], until: wk.ends };
      if (wk.methodBonuses?.[m.id]) m.bonus = { ...wk.methodBonuses[m.id], until: wk.ends };
      return m;
    });
    DB.passive = structuredClone(PASSIVE).map((p) => {
      if (L?.passiveOverrides?.[p.id]) { p.perHour = L.passiveOverrides[p.id]; p.updated = true; }
      return p;
    });
    DB.methods.forEach((m) => DB.reg.set("method:" + m.id, { ...m, kind: "method", key: "method:" + m.id }));
    DB.passive.forEach((p) => DB.reg.set("passive:" + p.id, { ...p, kind: "passive", key: "passive:" + p.id }));

    // Businesses hub: rates come from the live method/passive figures so they stay in sync with the updater.
    const rateOf = (keys) => {
      let rate = 0, disputed = false;
      for (const key of keys || []) {
        const [type, id] = key.split(":");
        const src = type === "method" ? DB.methods.find((x) => x.id === id) : DB.passive.find((x) => x.id === id);
        if (!src) continue;
        if (src.contested) disputed = true;
        rate += type === "method" ? (src.weeklyLimit ? 0 : loopRate(src)) : src.perHour;
      }
      return { rate, disputed };
    };
    DB.businesses = BUSINESSES.map((b) => {
      const prop = DB.properties.find((p) => p.id === (b.id === "mansion" ? "studio" : b.id));
      const cost = prop ? prop.cost : b.cost;
      const bz = { ...b, group: b.kind, kind: "business", key: "business:" + b.id, cost, ...rateOf(b.rateFrom) };
      bz.hay = norm([b.name, b.why, b.income, b.verdict, b.pairs].join(" "));
      return bz;
    });
    DB.activities = FUN_ACTIVITIES.map((a) => {
      const az = { ...a, kind: "activity", key: "activity:" + a.id, re: a.match ? new RegExp(a.match, "i") : null };
      az.hay = norm([a.name, a.why, a.money, a.rp, a.players, (a.tags || []).join(" ")].join(" "));
      return az;
    });
    DB.businesses.forEach((b) => DB.reg.set(b.key, b));
    DB.activities.forEach((a) => DB.reg.set(a.key, a));

    buildGlitches(L);
  }

  const COMMUNITY_CAT = { vehicle: "vehicle", player: "player", clothing: "outfit", misc: "world" };
  const RP_NAME = /\brp\b|\bafk\b|\bxp\b/i;

  function buildGlitches(L) {
    const community = (L?.community || []).map((c) => {
      const rp = RP_NAME.test(c.name) && (c.cat === "money" || c.cat === "misc");
      const kind = c.cat === "money" ? (rp ? "rp" : "money") : rp ? "rp" : "fun";
      return { ...c, kind, funCat: COMMUNITY_CAT[c.cat] || "world", re: null };
    });
    const haveList = community.length >= 50;
    const merged = new Set();

    const make = (kind, g, extra = {}) => {
      const it = {
        kind, key: `${kind}:${slug(g.name)}`, name: g.name, cat: g.cat || null,
        platforms: PLAT(g.platforms), players: g.players || "Unlisted",
        status: g.status || null, risk: g.risk || null,
        summary: g.how || g.does || "", line: g.payout || g.gain || "",
        tutorial: g.tutorial || null, curated: true, ...extra,
      };
      const re = g.match ? new RegExp(g.match, "i") : null;
      it.matches = re ? community.filter((c) => re.test(c.name)) : [];
      it.matches.forEach((c) => merged.add(c.id));
      it.guide = it.matches.find((c) => c.guide)?.guide || null;
      it.hub = it.matches[0]?.hub || null;
      it.isNew = it.matches.some((c) => c.isNew);
      it.listed = it.matches.length > 0;
      if (haveList && kind !== "fun" && !it.listed) it.status = "unlisted";
      return it;
    };

    const money = MONEY_GLITCHES.map((g) => make("money", g));
    const rp = RP_GLITCHES.map((g) => make("rp", g));
    const fun = FUN_GLITCHES.map((g) => make("fun", g));

    const fromCommunity = community.filter((c) => !merged.has(c.id)).map((c) => ({
      kind: c.kind, key: `${c.kind}:c-${c.id}`, name: c.name, cat: c.kind === "fun" ? c.funCat : null,
      platforms: c.platforms || [], players: c.players || "Unlisted", status: "community", risk: null,
      summary: "Listed on the community working list. Open the guide for the link to the current steps.",
      line: "", tutorial: null, curated: false, community: true, guide: c.guide, hub: c.hub,
      isNew: !!c.isNew, listed: true, matches: [c],
    })).sort((a, b) => (b.isNew - a.isNew) || a.name.localeCompare(b.name));

    // newly listed glitches float to the top (stable sort keeps curated-first order otherwise)
    const newFirst = (list) => list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    DB.money = newFirst([...money, ...fromCommunity.filter((i) => i.kind === "money")]);
    DB.rp = newFirst([...rp, ...fromCommunity.filter((i) => i.kind === "rp")]);
    DB.fun = newFirst([...fun, ...fromCommunity.filter((i) => i.kind === "fun")]);
    for (const it of [...DB.money, ...DB.rp, ...DB.fun]) {
      it.hay = norm([it.name, it.summary, it.line, it.platforms.join(" "), it.players, it.cat || ""].join(" "));
      DB.reg.set(it.key, it);
    }
    DB.patched = (L?.patched || []).filter((p) => Date.now() - Date.parse(p.date) < 45 * 864e5);
  }

  const propCost = (id) => (DB.properties.find((p) => p.id === id) || {}).cost || 0;
  const propName = (id) => (DB.properties.find((p) => p.id === id) || {}).name || id;

  /* ============================================================ planner */
  const MIN = 50000, MAX = 50000000, STEPS = 1000;
  const toAmount = (v) => {
    const raw = MIN * Math.pow(MAX / MIN, v / STEPS);
    const step = raw < 1e6 ? 10000 : raw < 1e7 ? 50000 : 100000;
    return Math.round(raw / step) * step;
  };
  const toSlider = (amt) => Math.round((STEPS * Math.log(Math.min(MAX, Math.max(MIN, amt)) / MIN)) / Math.log(MAX / MIN));

  const PLAN_DEFAULTS = {
    target: 2200000, cash: 0, owned: [], skip: [], passive: true, bonus: true, uncertain: false,
    players: 1, maxJob: 0, mode: "goal", hours: 4, perDay: 2,
  };
  const clampNum = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };

  /** Turn untrusted input (localStorage, shared link) into a valid plan. */
  function sanitizePlan(raw) {
    const clean = Object.fromEntries(Object.entries(raw || {}).filter(([, v]) => v !== undefined));
    const p = { ...PLAN_DEFAULTS, ...clean };
    return {
      target: clampNum(p.target, MIN, MAX * 20, PLAN_DEFAULTS.target),
      cash: clampNum(p.cash, 0, MAX * 20, 0),
      owned: new Set((Array.isArray(p.owned) ? p.owned : []).filter((id) => PROPERTIES.some((x) => x.id === id))),
      skip: new Set((Array.isArray(p.skip) ? p.skip : []).filter((id) => METHODS.some((x) => x.id === id))),
      passive: !!p.passive, bonus: !!p.bonus, uncertain: !!p.uncertain,
      players: [1, 2, 4].includes(+p.players) ? +p.players : 1,
      maxJob: [0, 60, 30, 15].includes(+p.maxJob) ? +p.maxJob : 0,
      mode: p.mode === "time" ? "time" : "goal",
      hours: clampNum(p.hours, 1, 24, 4),
      perDay: clampNum(p.perDay, 0.5, 12, 2),
    };
  }
  function loadPlan() {
    let raw = store.get("gls.plan.v2", null);
    if (!raw) raw = { target: store.get("gls.target", undefined), owned: store.get("gls.owned", []), passive: store.get("gls.passive", true), bonus: store.get("gls.bonus", true) };
    let shared = false;
    try {
      const q = new URLSearchParams(location.search).get("plan");
      if (q) { raw = { ...raw, ...JSON.parse(atob(q)) }; shared = true; }
    } catch { /* ignore a malformed link */ }
    return { plan: sanitizePlan(raw), shared };
  }
  const loadedPlan = loadPlan();
  const plan = loadedPlan.plan;
  const planPayload = () => ({ ...plan, owned: [...plan.owned], skip: [...plan.skip] });
  const savePlan = () => store.set("gls.plan.v2", planPayload());

  /** Does this method pass the player-count, skip, uncertainty and job-length filters? (Ownership is checked separately.) */
  const eligible = (m) =>
    !plan.skip.has(m.id) && (m.crew || 1) <= plan.players && (!m.contested || plan.uncertain) && (!plan.maxJob || m.minutes <= plan.maxJob);
  const passiveOk = (p) => !p.contested || plan.uncertain;

  /** Payout for the k-th run (0-based) of a method. */
  function runPay(m, k, useBonus) {
    const first = k === 0 && useBonus;
    let pay = first && m.firstWeekly ? m.firstWeekly : m.payout;
    if (!first && m.replayFee) pay -= m.replayFee;
    if (m.event && isActive(m.event.until)) pay *= m.event.x;
    if (useBonus && m.bonus && isActive(m.bonus.until) && k + 1 === m.bonus.runs) pay += m.bonus.amount;
    return pay;
  }

  /** Time to reach `goal` using only one method. */
  function soloPlan(m, goal, useBonus) {
    let total = 0, minutes = 0, runs = 0;
    const cap = m.weeklyLimit || 6000;
    while (total < goal && runs < cap) {
      if (runs > 0) minutes += m.cooldown || 0;
      total += runPay(m, runs, useBonus);
      minutes += m.minutes;
      runs++;
    }
    return { runs, minutes, total, reached: total >= goal };
  }
  /** Money one method alone earns in `cap` minutes. */
  function soloTime(m, cap, useBonus) {
    let total = 0, t = 0, runs = 0;
    while (t + m.minutes <= cap && (!m.weeklyLimit || runs < m.weeklyLimit) && runs < 3000) {
      total += runPay(m, runs, useBonus);
      t += m.minutes + (m.cooldown || 0);
      runs++;
    }
    return { runs, total };
  }

  /** Greedy route over all eligible methods, filling cooldowns. Stops at `goal` dollars or `cap` minutes. */
  function bestRoute({ goal = Infinity, cap = Infinity, owned = plan.owned, bonus = plan.bonus } = {}) {
    const avail = DB.methods.filter((m) => eligible(m) && (!m.requires || owned.has(m.requires)));
    const passiveRate = plan.passive
      ? DB.passive.filter((p) => owned.has(p.requires) && passiveOk(p)).reduce((s, p) => s + p.perHour, 0) : 0;
    const st = new Map(avail.map((m) => [m.id, { runs: 0, next: 0 }]));
    const capped = (m) => m.weeklyLimit && st.get(m.id).runs >= m.weeklyLimit;
    let t = 0, total = 0, waited = 0, passiveEarned = 0, guard = 0;
    const log = [];
    const accrue = (dt) => { const p = (passiveRate * dt) / 60; passiveEarned += p; total += p; };

    while (total < goal && t < cap && guard++ < 8000) {
      const remaining = goal - total;
      let best = null, bestScore = -1;
      for (const m of avail) {
        const s = st.get(m.id);
        if (capped(m) || t < s.next || t + m.minutes > cap) continue;
        const pay = runPay(m, s.runs, bonus);
        let score = Math.min(pay, remaining) / m.minutes;
        if (bonus && m.bonus && isActive(m.bonus.until) && s.runs < m.bonus.runs) {
          const left = m.bonus.runs - s.runs;
          let bundle = 0;
          for (let i = 0; i < left; i++) bundle += runPay(m, s.runs + i, true);
          score = Math.max(score, Math.min(bundle, remaining) / (left * m.minutes));
        }
        if (score > bestScore) { bestScore = score; best = m; }
      }
      if (!best) {
        const later = avail.filter((m) => !capped(m) && st.get(m.id).next > t && st.get(m.id).next + m.minutes <= cap);
        if (!later.length) break;
        const jump = Math.max(Math.min(...later.map((m) => st.get(m.id).next)) - t, 1);
        accrue(jump); t += jump; waited += jump;
        continue;
      }
      const s = st.get(best.id);
      const pay = runPay(best, s.runs, bonus);
      total += pay; accrue(best.minutes);
      t += best.minutes;
      s.runs++; s.next = t + (best.cooldown || 0);
      log.push({ m: best, pay });
    }
    // Out of jobs: remaining time (or the rest of the goal) can still be earned passively.
    if (cap !== Infinity && t < cap) { accrue(cap - t); waited += cap - t; t = cap; }
    else if (goal !== Infinity && total < goal && passiveRate > 0) {
      const mins = ((goal - total) / passiveRate) * 60;
      passiveEarned += goal - total; total = goal; t += mins; waited += mins;
    }

    const agg = [];
    for (const { m, pay } of log) {
      let row = agg.find((r) => r.m.id === m.id);
      if (!row) agg.push((row = { m, runs: 0, amount: 0 }));
      row.runs++; row.amount += pay;
    }
    return { minutes: t, waited, total, agg, passiveEarned, passiveRate, reached: total >= goal, jobs: log.length };
  }

  /** Which unowned property adds the most sustained income? (20-hour horizon, repeat payouts only.) */
  function purchaseAdvice() {
    const hours = 20;
    const base = bestRoute({ cap: hours * 60, bonus: false }).total;
    const helps = (p) => DB.methods.some((m) => m.requires === p.id && eligible(m)) || DB.passive.some((x) => x.requires === p.id && passiveOk(x));
    return DB.properties.filter((p) => !plan.owned.has(p.id) && helps(p)).map((p) => {
      const gain = bestRoute({ cap: hours * 60, bonus: false, owned: new Set([...plan.owned, p.id]) }).total - base;
      const perHour = gain / hours;
      return { p, perHour, payback: perHour > 0 ? p.cost / perHour : Infinity };
    }).filter((x) => x.perHour > 0).sort((a, b) => a.payback - b.payback).slice(0, 5);
  }

  function initPlanner() {
    const slider = $("#money-slider"), input = $("#money-input"), cash = $("#cash-input"), hours = $("#hours-slider");
    $(".slider-scale").innerHTML = [[50000, "$50K"], [1e6, "$1M"], [1e7, "$10M"], [5e7, "$50M"]]
      .map(([v, l]) => `<span style="left:${(toSlider(v) / STEPS) * 100}%">${l}</span>`).join("");
    $("#presets").innerHTML = PRESETS.map((p) => `<button class="chip" data-amt="${p.amount}">${esc(p.label)} <small>${money(p.amount)}</small></button>`).join("");
    $("#owned").innerHTML = PROPERTIES.map((p) => `<button class="chip" data-id="${p.id}" aria-pressed="false">${esc(p.name)}</button>`).join("");
    $("#skip-chips").innerHTML = METHODS.map((m) => `<button class="chip" data-id="${m.id}" aria-pressed="false">${esc(m.name.replace(/ \(.+\)$/, ""))}</button>`).join("");

    const commit = () => { savePlan(); renderPlanner(); };
    const parseMoney = (s) => parseFloat(String(s).replace(/[^0-9.]/g, ""));

    slider.addEventListener("input", () => { plan.target = toAmount(+slider.value); commit(); });
    input.addEventListener("input", () => { const n = parseMoney(input.value); if (n > 0) { plan.target = clampNum(n, MIN, MAX * 20, plan.target); commit(); } });
    input.addEventListener("blur", () => (input.value = plan.target.toLocaleString("en-US")));
    input.addEventListener("keydown", (e) => e.key === "Enter" && input.blur());
    cash.addEventListener("input", () => { const n = parseMoney(cash.value); plan.cash = Number.isFinite(n) ? clampNum(n, 0, MAX * 20, 0) : 0; commit(); });
    cash.addEventListener("blur", () => (cash.value = plan.cash ? plan.cash.toLocaleString("en-US") : ""));
    cash.addEventListener("keydown", (e) => e.key === "Enter" && cash.blur());
    hours.addEventListener("input", () => { plan.hours = +hours.value; commit(); });
    $("#perday").addEventListener("change", (e) => { plan.perDay = +e.target.value; commit(); });

    $("#presets").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { plan.target = +b.dataset.amt; commit(); } });
    // look the Set up at click time: Reset replaces plan.owned / plan.skip with fresh Sets
    const toggleSet = (key) => (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      const set = plan[key];
      set.has(b.dataset.id) ? set.delete(b.dataset.id) : set.add(b.dataset.id);
      commit();
    };
    $("#owned").addEventListener("click", toggleSet("owned"));
    $("#skip-chips").addEventListener("click", toggleSet("skip"));
    $("#own-all").addEventListener("click", () => { PROPERTIES.forEach((p) => plan.owned.add(p.id)); commit(); });
    $("#own-none").addEventListener("click", () => { plan.owned.clear(); commit(); });

    bindTabs("#plan-mode", (f) => { plan.mode = f; commit(); });
    bindTabs("#plan-players", (f) => { plan.players = +f; commit(); });
    bindTabs("#plan-maxjob", (f) => { plan.maxJob = +f; commit(); });
    const toggles = { "#passive-toggle": "passive", "#bonus-toggle": "bonus", "#uncertain-toggle": "uncertain" };
    for (const [sel, key] of Object.entries(toggles)) $(sel).addEventListener("change", (e) => { plan[key] = e.target.checked; commit(); });

    $("#plan-share").addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}?plan=${encodeURIComponent(btoa(JSON.stringify(planPayload())))}`;
      try { await navigator.clipboard.writeText(url); toast("Plan link copied. Anyone who opens it gets this exact plan."); }
      catch { toast("Couldn't copy automatically. Your plan link: " + url, 12000); }
    });
    $("#plan-reset").addEventListener("click", () => {
      const fresh = sanitizePlan({});
      for (const k of Object.keys(fresh)) plan[k] = fresh[k];
      commit(); toast("Planner reset.");
    });
    renderPlanner();
  }

  function renderPlanner() {
    const goalMode = plan.mode === "goal";
    const $on = (el, on) => { el.classList.toggle("on", on); el.setAttribute("aria-pressed", on); };

    // ---- sync the controls with the plan
    $("#goal-controls").hidden = !goalMode;
    $("#time-controls").hidden = goalMode;
    setTab("#plan-mode", plan.mode); setTab("#plan-players", String(plan.players)); setTab("#plan-maxjob", String(plan.maxJob));
    const slider = $("#money-slider"), input = $("#money-input"), cash = $("#cash-input");
    slider.value = toSlider(plan.target);
    slider.style.setProperty("--fill", (slider.value / STEPS) * 100 + "%");
    if (document.activeElement !== input) input.value = plan.target.toLocaleString("en-US");
    if (document.activeElement !== cash) cash.value = plan.cash ? plan.cash.toLocaleString("en-US") : "";
    $("#hours-slider").value = plan.hours;
    $("#hours-display").textContent = `${plan.hours} hour${plan.hours === 1 ? "" : "s"}`;
    $("#perday").value = String(plan.perDay);
    $("#passive-toggle").checked = plan.passive; $("#bonus-toggle").checked = plan.bonus; $("#uncertain-toggle").checked = plan.uncertain;
    $$("#owned .chip").forEach((c) => $on(c, plan.owned.has(c.dataset.id)));
    $$("#skip-chips .chip").forEach((c) => $on(c, plan.skip.has(c.dataset.id)));
    $$("#presets .chip").forEach((c) => $on(c, +c.dataset.amt === plan.target));
    $("#skip-count").textContent = plan.skip.size ? ` (${plan.skip.size} skipped)` : "";

    // ---- results
    const need = Math.max(0, plan.target - plan.cash);
    const cap = plan.hours * 60;
    const r = goalMode ? (need > 0 ? bestRoute({ goal: need }) : null) : bestRoute({ cap });
    $("#route-label").textContent = goalMode ? "Fastest route" : `Best use of ${plan.hours} hour${plan.hours === 1 ? "" : "s"}`;
    $("#rank-label").textContent = goalMode ? "Single method only: time to reach your goal" : `Single method only: money earned in ${plan.hours} hour${plan.hours === 1 ? "" : "s"}`;

    if (!r) {
      $("#route-time").textContent = "You're there";
      $("#route-sub").textContent = `You already have ${money(plan.cash)}, which covers your ${money(plan.target)} goal.`;
    } else if (goalMode) {
      $("#route-time").textContent = r.reached ? "≈ " + duration(r.minutes) : "Not reachable";
      const days = Math.ceil(r.minutes / (plan.perDay * 60));
      const parts = [`${money(r.total)} from ${r.jobs} job${r.jobs === 1 ? "" : "s"}`];
      if (r.waited > 5) parts.push(`${duration(r.waited)} spent waiting on cooldowns`);
      if (r.reached && r.minutes > plan.perDay * 60) parts.push(`about ${days} day${days === 1 ? "" : "s"} at ${plan.perDay}h a day`);
      $("#route-sub").textContent = r.reached ? parts.join(" · ") : "Unlock more properties, add players or relax your filters to get there.";
    } else {
      $("#route-time").textContent = "≈ " + money(r.total);
      $("#route-sub").textContent = `${r.jobs} job${r.jobs === 1 ? "" : "s"} in ${plan.hours} hour${plan.hours === 1 ? "" : "s"}` +
        (plan.cash ? ` · ${money(plan.cash + r.total)} with the cash you already have` : "") + (r.total ? "" : ". Own a property or add players to unlock jobs.");
    }

    const eventLive = DB.methods.some((m) => (m.event && isActive(m.event.until)) || (m.bonus && isActive(m.bonus.until)));
    const usesWeekly = plan.bonus && r && r.agg.some((a) => a.m.firstWeekly);
    $("#route-badge").textContent = eventLive ? `★ ${DB.weekly.title}` : usesWeekly ? "★ Weekly bonuses" : "";

    const rows = r ? r.agg.map((a) => {
      const meta = [`${a.runs} run${a.runs > 1 ? "s" : ""}`, `~${duration(a.runs * a.m.minutes)} play`];
      if (a.m.firstWeekly && plan.bonus) meta.push("includes weekly bonus");
      if (a.m.crew > 1) meta.push(`needs ${a.m.crew}+ players`);
      return `<li><div><div class="r-name">${esc(a.m.name)}</div><div class="r-meta">${meta.join(" · ")}</div></div><span class="r-amt">+${money(a.amount)}</span></li>`;
    }) : [];
    if (r && r.passiveEarned > 500) {
      rows.push(`<li class="passive"><div><div class="r-name">Passive businesses</div><div class="r-meta">${money(r.passiveRate)}/hr ticking in the background · sell when full</div></div><span class="r-amt">+${money(r.passiveEarned)}</span></li>`);
    }
    $("#route").innerHTML = rows.join("") || `<li><span class="empty">${r ? "No jobs available with these settings." : "Nothing to do. Raise your target."}</span></li>`;

    // ---- every eligible method on its own
    const goal = Math.max(need, 1);
    const list = DB.methods.filter(eligible).map((m) => {
      const owned = !m.requires || plan.owned.has(m.requires);
      const setup = owned ? 0 : propCost(m.requires);
      return { m, owned, setup, p: soloPlan(m, goal + setup, plan.bonus), t: soloTime(m, cap, plan.bonus) };
    });
    if (goalMode) list.sort((a, b) => (b.p.reached - a.p.reached) || (a.p.minutes - b.p.minutes));
    else list.sort((a, b) => (b.owned - a.owned) || (b.t.total - a.t.total));
    const fastest = Math.min(...list.filter((x) => x.p.reached).map((x) => x.p.minutes), Infinity);
    const best = Math.max(...list.map((x) => x.t.total), 1);
    $("#ranking").innerHTML = list.map(({ m, owned, setup, p, t }) => {
      const tags = [];
      if (!m.requires) tags.push(`<span class="tag free">Free</span>`);
      else if (!owned) tags.push(`<span class="tag lock">Needs ${esc(propName(m.requires))} +${money(setup)}</span>`);
      if (m.crew > 1) tags.push(`<span class="tag">${m.crew}+ players</span>`);
      if (m.contested) tags.push(`<span class="tag est">Uncertain</span>`);
      if (m.event && isActive(m.event.until)) tags.push(`<span class="tag event">${m.event.x}× now</span>`);
      if (m.bonus && isActive(m.bonus.until)) tags.push(`<span class="tag event">+${money(m.bonus.amount)} bonus</span>`);
      if (m.weeklyLimit) tags.push(`<span class="tag">${m.weeklyLimit}/week</span>`);
      let width, time;
      if (goalMode) {
        width = p.reached ? Math.max(4, (fastest / p.minutes) * 100) : 2;
        time = p.reached ? `${duration(p.minutes)}<small>${p.runs} run${p.runs > 1 ? "s" : ""}</small>` : `—<small>max ${money(p.total)}/wk</small>`;
      } else {
        width = Math.max(2, (t.total / best) * 100);
        time = `${money(t.total)}<small>${t.runs} run${t.runs === 1 ? "" : "s"}</small>`;
      }
      return `<div class="rank-row ${owned ? "" : "locked"}"><div><div class="rank-name">${esc(m.name.replace(/ \(.+\)$/, ""))} ${tags.join("")}</div>
        <div class="rank-bar"><i style="width:${width}%"></i></div></div><div class="rank-time">${time}</div></div>`;
    }).join("") || `<p class="fine">No methods match your filters.</p>`;

    // ---- what to buy next
    const advice = purchaseAdvice();
    $("#advice").innerHTML = advice.map((a, i) => `<li><span class="adv-n">${i + 1}</span><div><div class="r-name">${esc(a.p.name)} <span class="tag">${money(a.p.cost)}</span></div>
      <div class="r-meta">adds about ${money(a.perHour)}/hr · pays back in about ${a.payback < 1 ? "under an hour" : duration(a.payback * 60)} of play</div></div></li>`).join("")
      || `<li><span class="empty">Nothing left that adds income with these settings.</span></li>`;
  }

  /* ======================================================= filter helpers */
  /** Wire a button group; `fn(value)` runs on click. */
  function bindTabs(sel, fn) {
    const root = $(sel);
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".tab"); if (!b) return;
      setTab(sel, b.dataset.filter);
      fn(b.dataset.filter);
    });
  }
  function setTab(sel, value) {
    $$(".tab", $(sel)).forEach((t) => { const on = t.dataset.filter === value; t.classList.toggle("active", on); t.setAttribute("aria-pressed", on); });
  }
  const matchQuery = (hay, q) => !q || norm(q).split(" ").every((tok) => hay.includes(tok));
  const matchPlatform = (it, plat) => plat === "all" || it.platforms.includes(plat);

  const view = {
    biz: { group: "all", sort: "default", q: "" },
    fz: { tab: "all", q: "" },
    methods: { type: "all", sort: "default", q: "" },
    money: { plat: "all", players: "all", q: "" },
    rp: { plat: "all", players: "all", q: "" },
    fun: { cat: "all", plat: "all", q: "", limit: 24 },
    cheats: { plat: "ps", group: "all", q: "" },
  };
  const emptyState = (name, msg) =>
    `<div class="empty-state"><p>${esc(msg)}</p><button class="btn btn-ghost" type="button" data-reset="${name}">Clear filters</button></div>`;
  const countText = (shown, total, noun) => `Showing ${shown} of ${total} ${noun}`;

  /* ============================================================== cards */
  const openAttrs = (key) => `data-open="${esc(key)}" tabindex="0" role="button" aria-haspopup="dialog"`;

  /** $/hr if you only ever ran this one method back to back (cooldown included). Comparable to GTA Boss's own rates. */
  const loopRate = (m) => ((m.payout - (m.replayFee || 0)) / (m.minutes + (m.cooldown || 0))) * 60;
  const rateText = (m) => (m.weeklyLimit ? `Limited to ${m.weeklyLimit} per week` : `≈ ${money(loopRate(m))}/hr back to back`);

  function methodCard(m) {
    const badges = [];
    badges.push(m.crew > 1 ? `<span class="tag">${m.crew}+ players</span>` : m.solo ? `<span class="tag">Solo</span>` : "");
    badges.push(m.requires ? `<span class="tag">${esc(propName(m.requires))}</span>` : `<span class="tag free">No property</span>`);
    if (m.contested) badges.push(`<span class="tag est">Sources disagree</span>`);
    if (m.event && isActive(m.event.until)) badges.push(`<span class="tag event">${esc(m.event.label)}</span>`);
    if (m.bonus && isActive(m.bonus.until)) badges.push(`<span class="tag event">${esc(m.bonus.label)}</span>`);
    if (m.weeklyLimit) badges.push(`<span class="tag">${m.weeklyLimit} per week</span>`);
    if (m.estimate) badges.push(`<span class="tag est">Estimate</span>`);
    if (m.updated) badges.push(`<span class="tag live">Live figures</span>`);
    return `<article class="card" ${openAttrs("method:" + m.id)}>
      <div class="card-top"><h3>${esc(m.name)}</h3></div>
      <div class="payout">${esc(m.payoutLabel)}</div>
      <div class="badges">${badges.join("")}</div>
      <div class="kv">
        <div><span>Run time</span><b>~${duration(m.minutes)}</b></div>
        <div><span>Cooldown</span><b>${m.cooldown ? duration(m.cooldown) : "None"}</b></div>
        <div><span>Setup</span><b>${m.requires ? money(propCost(m.requires)) : "$0"}</b></div>
      </div>
      <p>${esc(m.blurb)}</p>
      <div class="risk">${esc(rateText(m))}</div>
      <span class="open-hint">Step-by-step guide →</span>
    </article>`;
  }
  function passiveCard(p) {
    return `<article class="card" ${openAttrs("passive:" + p.id)}>
      <div class="card-top"><h3>${esc(p.name)}</h3><span class="status working">Passive</span></div>
      <div class="payout">≈ ${money(p.perHour)}/hr</div>
      <div class="badges"><span class="tag">${money(propCost(p.requires))} setup</span><span class="tag">AFK-friendly</span>${p.contested ? `<span class="tag est">Sources disagree</span>` : ""}${p.estimate ? `<span class="tag est">Estimate</span>` : ""}${p.updated ? `<span class="tag live">Live figures</span>` : ""}</div>
      <p>${esc(p.note)}</p>
      <span class="open-hint">How it works →</span>
    </article>`;
  }

  function renderMethods() {
    const v = view.methods;
    const need = (m) => (m.requires ? propCost(m.requires) : 0);
    let active = DB.methods.filter((m) => {
      if (v.type === "heist" || v.type === "contract") return m.type === v.type;
      if (v.type === "crew") return m.crew > 1;
      if (v.type === "free") return !m.requires;
      return v.type !== "passive";
    }).filter((m) => matchQuery(norm(m.name + " " + m.blurb + " " + m.type), v.q));
    if (v.sort === "payout") active = [...active].sort((a, b) => b.payout - a.payout);
    if (v.sort === "hourly") active = [...active].sort((a, b) => (b.weeklyLimit ? 0 : loopRate(b)) - (a.weeklyLimit ? 0 : loopRate(a)));
    if (v.sort === "setup") active = [...active].sort((a, b) => need(a) - need(b));
    const passive = (v.type === "all" || v.type === "passive")
      ? DB.passive.filter((p) => matchQuery(norm(p.name + " " + p.note + " passive afk"), v.q)) : [];
    const total = DB.methods.length + DB.passive.length;
    $("#method-count").textContent = countText(active.length + passive.length, total, "methods");
    $("#method-grid").innerHTML = active.map(methodCard).join("") + passive.map(passiveCard).join("")
      || emptyState("methods", "No methods match those filters.");
  }

  const STATUS_LABEL = { working: "● Working", workaround: "◐ Workaround", unlisted: "? Not on list", community: "● On working list" };
  const CAT_ICON = { vehicle: "🚗", player: "🕴", outfit: "🧥", world: "🌆" };

  function glitchBadges(it) {
    const b = it.platforms.map((p) => `<span class="tag">${esc(p)}</span>`);
    b.push(`<span class="tag">${esc(it.players)}</span>`);
    if (it.isNew) b.push(`<span class="tag new">NEW</span>`);
    return b.join("");
  }
  function riskBlock(it) {
    if (!it.risk) return "";
    const col = ["", "#3ef08a", "#3ef08a", "#ffc93c", "#ff8a3d", "#ff4d5e"][it.risk];
    const lbl = ["", "Low", "Low", "Medium", "High", "Very high"][it.risk];
    return `<div class="risk" style="--c:${col}">Risk (our estimate) <span class="risk-bars">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= it.risk ? "on" : ""}"></i>`).join("")}</span> ${lbl}</div>`;
  }
  function glitchCard(it) {
    return `<article class="card" ${openAttrs(it.key)}>
      <div class="card-top"><h3>${esc(it.name)}</h3>${it.status ? `<span class="status ${it.status}">${STATUS_LABEL[it.status]}</span>` : ""}</div>
      <div class="badges">${glitchBadges(it)}</div>
      ${it.line ? `<div class="payout">${esc(it.line)}</div>` : ""}
      <p>${esc(it.summary)}</p>
      ${riskBlock(it)}
      <span class="open-hint">Open guide →</span>
    </article>`;
  }
  function funCard(it) {
    return `<article class="card mini-card" ${openAttrs(it.key)}>
      <h3>${CAT_ICON[it.cat] || "🌆"} ${esc(it.name)}</h3>
      <div class="badges">${glitchBadges(it)}</div>
      <p class="does">${esc(it.summary)}</p>
      <span class="open-hint">Open guide →</span>
    </article>`;
  }

  function filterGlitches(list, v) {
    return list.filter((it) =>
      matchPlatform(it, v.plat) &&
      (v.players === "all" || (v.players === "new" ? it.isNew : it.players === v.players)) &&
      matchQuery(it.hay, v.q));
  }
  function renderMoney() {
    const list = filterGlitches(DB.money, view.money);
    $("#mg-count").textContent = countText(list.length, DB.money.length, "money glitches");
    $("#money-glitch-grid").innerHTML = list.map(glitchCard).join("") || emptyState("money", "No money glitches match those filters.");
    const note = $("#patched-note");
    note.hidden = !DB.patched.length;
    if (DB.patched.length) {
      note.textContent = "Recently removed from the community working list (likely patched): " +
        DB.patched.slice(0, 8).map((p) => p.name).join(", ") + (DB.patched.length > 8 ? ` and ${DB.patched.length - 8} more` : "") + ".";
    }
  }
  function renderRP() {
    const list = filterGlitches(DB.rp, view.rp);
    $("#rp-count").textContent = countText(list.length, DB.rp.length, "RP glitches");
    $("#rp-grid").innerHTML = list.map(glitchCard).join("") || emptyState("rp", "No RP glitches match those filters.");
  }
  function renderFun() {
    const v = view.fun;
    const list = DB.fun.filter((it) => (v.cat === "all" || it.cat === v.cat) && matchPlatform(it, v.plat) && matchQuery(it.hay, v.q));
    const shown = list.slice(0, v.limit);
    $("#fun-count").textContent = countText(shown.length, DB.fun.length, "fun glitches") + (list.length !== DB.fun.length ? ` (${list.length} match)` : "");
    $("#fun-grid").innerHTML = shown.map(funCard).join("") || emptyState("fun", "No fun glitches match those filters.");
    const more = $("#fun-more");
    more.hidden = list.length <= v.limit;
    if (!more.hidden) more.textContent = `Show ${Math.min(48, list.length - v.limit)} more (${list.length - v.limit} left)`;
  }

  function initFilters() {
    bindTabs("#biz-tabs", (f) => { view.biz.group = f; renderBiz(); });
    $("#biz-sort").addEventListener("change", (e) => { view.biz.sort = e.target.value; renderBiz(); });
    $("#biz-search").addEventListener("input", (e) => { view.biz.q = e.target.value; renderBiz(); });
    bindTabs("#fz-tabs", (f) => { view.fz.tab = f; renderFunZone(); });
    $("#fz-search").addEventListener("input", (e) => { view.fz.q = e.target.value; renderFunZone(); });
    for (const sel of ["#rk-from", "#rk-to", "#rk-rate", "#rk-custom"]) $(sel).addEventListener("input", renderRank);
    $("#rk-rate").addEventListener("change", renderRank);

    bindTabs("#method-tabs", (f) => { view.methods.type = f; renderMethods(); });
    $("#method-sort").addEventListener("change", (e) => { view.methods.sort = e.target.value; renderMethods(); });
    $("#method-search").addEventListener("input", (e) => { view.methods.q = e.target.value; renderMethods(); });

    bindTabs("#mg-platform", (f) => { view.money.plat = f; renderMoney(); });
    bindTabs("#mg-players", (f) => { view.money.players = f; renderMoney(); });
    $("#mg-search").addEventListener("input", (e) => { view.money.q = e.target.value; renderMoney(); });

    bindTabs("#rp-platform", (f) => { view.rp.plat = f; renderRP(); });
    bindTabs("#rp-players", (f) => { view.rp.players = f; renderRP(); });
    $("#rp-search").addEventListener("input", (e) => { view.rp.q = e.target.value; renderRP(); });

    bindTabs("#fun-tabs", (f) => { Object.assign(view.fun, { cat: f, limit: 24 }); renderFun(); });
    bindTabs("#fun-platform", (f) => { Object.assign(view.fun, { plat: f, limit: 24 }); renderFun(); });
    $("#fun-search").addEventListener("input", (e) => { Object.assign(view.fun, { q: e.target.value, limit: 24 }); renderFun(); });
    $("#fun-more").addEventListener("click", () => { view.fun.limit += 48; renderFun(); });

    // "Clear filters" buttons inside empty states
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-reset]"); if (!b) return;
      const name = b.dataset.reset;
      if (name === "methods") { Object.assign(view.methods, { type: "all", sort: "default", q: "" }); setTab("#method-tabs", "all"); $("#method-sort").value = "default"; $("#method-search").value = ""; renderMethods(); }
      if (name === "biz") { Object.assign(view.biz, { group: "all", sort: "default", q: "" }); setTab("#biz-tabs", "all"); $("#biz-sort").value = "default"; $("#biz-search").value = ""; renderBiz(); }
      if (name === "fz") { Object.assign(view.fz, { tab: "all", q: "" }); setTab("#fz-tabs", "all"); $("#fz-search").value = ""; renderFunZone(); }
      if (name === "money") { Object.assign(view.money, { plat: "all", players: "all", q: "" }); setTab("#mg-platform", "all"); setTab("#mg-players", "all"); $("#mg-search").value = ""; renderMoney(); }
      if (name === "rp") { Object.assign(view.rp, { plat: "all", players: "all", q: "" }); setTab("#rp-platform", "all"); setTab("#rp-players", "all"); $("#rp-search").value = ""; renderRP(); }
      if (name === "fun") { Object.assign(view.fun, { cat: "all", plat: "all", q: "", limit: 24 }); setTab("#fun-tabs", "all"); setTab("#fun-platform", "all"); $("#fun-search").value = ""; renderFun(); }
      if (name === "cheats") { Object.assign(view.cheats, { group: "all", q: "" }); setTab("#cheat-group", "all"); $("#cheat-search").value = ""; renderCheats(); }
    });
  }

  /* ===================================================== businesses, rank, fun zone */
  const GROUP_LABEL = { passive: "Passive", semi: "Semi-passive", active: "Hands-on", utility: "Utility & fun" };
  const WORTH = new Set(["Buy first", "Great value", "Good"]);
  const verdictClass = (v) => (/^(Buy first|Great value)$/.test(v) ? "free" : v === "Good" ? "live" : /^Skip/.test(v) ? "lock" : "est");

  function businessCard(b) {
    return `<article class="card" ${openAttrs(b.key)}>
      <div class="card-top"><h3>${esc(b.name)}</h3><span class="tag ${verdictClass(b.verdict)}">${esc(b.verdict)}</span></div>
      <div class="badges"><span class="tag">${esc(GROUP_LABEL[b.group])}</span></div>
      <div class="kv">
        <div><span>Buy-in</span><b>${b.cost ? money(b.cost) : "Varies"}</b></div>
        <div><span>Income</span><b>${b.rate ? "≈ " + money(b.rate) + "/hr" + (b.disputed ? " ⚠" : "") : "Varies"}</b></div>
        <div><span>Type</span><b>${esc(GROUP_LABEL[b.group].split(" ")[0])}</b></div>
      </div>
      ${b.disputed ? `<div class="badges"><span class="tag est">Income is disputed</span></div>` : ""}
      <p>${esc(b.why)}</p>
      <span class="open-hint">Details →</span>
    </article>`;
  }
  function renderBiz() {
    const v = view.biz;
    let list = DB.businesses.filter((b) =>
      (v.group === "all" || (v.group === "worth" ? WORTH.has(b.verdict) : b.group === v.group)) && matchQuery(b.hay, v.q));
    const last = Number.MAX_SAFE_INTEGER;
    if (v.sort === "cost") list = [...list].sort((a, b) => (a.cost ?? last) - (b.cost ?? last));
    // disputed figures sort last so an optimistic single-source claim can't outrank solid ones
    const solid = (b) => (b.disputed ? -1 : b.rate);
    if (v.sort === "rate") list = [...list].sort((a, b) => solid(b) - solid(a));
    if (v.sort === "value") {
      const val = (b) => (b.cost && b.rate && !b.disputed ? b.rate / (b.cost / 1e6) : -1);
      list = [...list].sort((a, b) => val(b) - val(a));
    }
    $("#biz-count").textContent = countText(list.length, DB.businesses.length, "businesses");
    $("#biz-grid").innerHTML = list.map(businessCard).join("") || emptyState("biz", "No businesses match those filters.");
  }

  /** The weekly bonus (if any) that applies to a fun activity. */
  function boostFor(a) {
    if (!a.re || !isActive(DB.weekly.ends)) return null;
    return (DB.weekly.bonuses || []).find((b) => a.re.test(b.text)) || null;
  }
  function activityCard(a) {
    const boost = boostFor(a);
    const badges = [`<span class="tag">${esc(a.players)}</span>`, a.free ? `<span class="tag free">Free to start</span>` : `<span class="tag lock">${esc(a.cost)}</span>`];
    return `<article class="card" ${openAttrs(a.key)}>
      <div class="card-top"><h3>${a.emoji} ${esc(a.name)}</h3>${boost ? `<span class="status working">🔥 ${esc(boost.mult)} this week</span>` : ""}</div>
      <div class="badges">${badges.join("")}</div>
      <div class="kv two"><div><span>Money</span><b>${esc(a.money)}</b></div><div><span>RP</span><b>${esc(a.rp)}</b></div></div>
      <p>${esc(a.why)}</p>
      <span class="open-hint">Tips →</span>
    </article>`;
  }
  function renderFunZone() {
    const v = view.fz;
    const list = DB.activities.filter((a) => {
      const ok = v.tab === "all" ? true
        : v.tab === "boosted" ? !!boostFor(a)
        : v.tab === "solo" ? (a.tags || []).includes("solo")
        : v.tab === "friends" ? !/^Solo$/.test(a.players)
        : v.tab === "free" ? a.free
        : (a.tags || []).includes("rp");
      return ok && matchQuery(a.hay, v.q);
    });
    $("#fz-count").textContent = countText(list.length, DB.activities.length, "activities");
    $("#fz-grid").innerHTML = list.map(activityCard).join("") ||
      emptyState("fz", v.tab === "boosted" ? "Nothing here is boosted this week." : "No activities match those filters.");
  }

  /* Cumulative RP to reach a rank (community formula, valid from rank 100: rank 100 = 1,584,350, rank 200 = 4,691,850). */
  const rpTotal = (r) => 25 * r * r + 23575 * r - 1023150;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  function readRank(sel, fallback) {
    const n = Math.round(Number($(sel).value));
    return Number.isFinite(n) ? Math.min(8000, Math.max(100, n)) : fallback;
  }
  function renderRank() {
    const from = readRank("#rk-from", 100), to = readRank("#rk-to", 200);
    const custom = $("#rk-rate").value === "custom";
    $("#rk-custom-wrap").hidden = !custom;
    const rate = custom ? Math.max(1, Number($("#rk-custom").value) || 1) : Number($("#rk-rate").value);
    const need = to > from ? rpTotal(to) - rpTotal(from) : 0;
    if (!need) {
      $("#rk-out").innerHTML = `<p class="rk-big">Pick a higher target</p><p class="rk-sub">Your target rank must be above your current rank (both 100 or higher).</p>`;
    } else {
      const days = Math.ceil(need / rate);
      const span = days >= 730 ? `${trimNum(days / 365, 1)} years` : days >= 60 ? `${trimNum(days / 30.4, 1)} months` : `${days} day${days === 1 ? "" : "s"}`;
      $("#rk-out").innerHTML = `<p class="rk-big">${fmt(need)} RP</p>
        <p class="rk-sub">Rank ${fmt(from)} to ${fmt(to)} · about <b>${span}</b> (${fmt(days)} days) at ${fmt(rate)} RP a day.</p>`;
    }
  }
  function renderRankStatic() {
    const base = rpTotal(100);
    $("#rk-milestones").innerHTML = [120, 200, 300, 500, 1000, 2000, 5000, 8000].map((r) =>
      `<tr><td>${fmt(r)}</td><td>${fmt(rpTotal(r))}</td><td>${fmt(rpTotal(r) - base)}</td></tr>`).join("");
    $("#rp-methods").innerHTML = RP_METHODS.map((m) =>
      `<article class="card mini-card"><h3>⭐ ${esc(m.name)}</h3><div class="badges"><span class="tag live">${esc(m.rp)}</span></div><p class="does">${esc(m.note)}</p></article>`).join("");
  }

  /* ===================================================== guide (tutorial) */
  const PLAYERS_HINT = {
    "Solo": "Can be done alone.",
    "Semi-Solo": "Mostly doable alone, but usually needs a second player or account for one step.",
    "Non-Solo": "Needs at least one other player.",
    "Unlisted": "The community list doesn't say how many players it needs.",
  };
  const KIND_LABEL = { method: "Money method", passive: "Passive income", money: "Money glitch", rp: "RP glitch", fun: "Fun glitch" };
  const list = (items, cls = "") => (items && items.length ? `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
  const sec = (title, inner) => (inner ? `<div class="g-sec"><h4>${esc(title)}</h4>${inner}</div>` : "");
  const linkBtn = (href, label, primary = false) => {
    const u = safeUrl(href);
    return u ? `<a class="btn ${primary ? "btn-primary" : "btn-ghost"}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : "";
  };

  function weekNotes(m) {
    const out = [];
    const wk = DB.weekly;
    if (m.event && isActive(m.event.until)) out.push(`Event bonus: ${m.event.label}`);
    if (m.bonus && isActive(m.bonus.until)) out.push(`Reward: ${m.bonus.label}`);
    const re = { kortz: /kortz/i, salvage: /salvage/i }[m.id];
    const ex = re && (wk.extras || []).find((e) => re.test(e.title));
    if (ex) out.push(`${ex.title}: ${ex.items.join("; ")}`);
    return out.length ? `<div class="g-live">${list(out)}</div>` : "";
  }

  function methodGuide(m) {
    const t = m.tutorial || {};
    const isPassive = m.kind === "passive";
    const badges = [];
    if (m.requires) badges.push(`<span class="tag">${esc(propName(m.requires))} · ${money(propCost(m.requires))}</span>`);
    else if (!isPassive) badges.push(`<span class="tag free">No property needed</span>`);
    if (m.crew > 1) badges.push(`<span class="tag">${m.crew}+ players</span>`);
    else if (m.solo) badges.push(`<span class="tag">Solo</span>`);
    if (m.estimate) badges.push(`<span class="tag est">${isPassive ? "Estimate" : "Run time is an estimate"}</span>`);
    if (m.contested) badges.push(`<span class="tag est">Sources disagree</span>`);
    if (m.updated) badges.push(`<span class="tag live">Live figures</span>`);
    const kv = isPassive ? "" : `<div class="g-kv">
      <div><span>Run time</span><b>~${duration(m.minutes)}</b></div>
      <div><span>Cooldown</span><b>${m.cooldown ? duration(m.cooldown) : "None"}</b></div>
      <div><span>Setup</span><b>${m.requires ? money(propCost(m.requires)) : "$0"}</b></div>
      <div><span>Rate</span><b>${m.weeklyLimit ? `${m.weeklyLimit}/week max` : `≈ ${money(loopRate(m))}/hr`}</b></div></div>`;
    const week = isPassive ? "" : weekNotes(m);
    return `<span class="g-kind">${KIND_LABEL[m.kind]}</span>
      <h3 class="g-title" id="guide-title">${esc(m.name)}</h3>
      <p class="g-line">${esc(isPassive ? `≈ ${money(m.perHour)} per hour` : m.payoutLabel)}</p>
      <div class="g-badges">${badges.join("")}</div>${kv}
      ${sec("Overview", `<p>${esc(isPassive ? m.note : m.blurb)}</p>`)}
      ${sec("This week", week)}
      ${m.contestedNote ? sec("Sources disagree", `<div class="g-warn"><ul><li>${esc(m.contestedNote)}</li></ul></div>`) : ""}
      ${sec("What you need", list(t.needs))}
      ${sec("Step by step", list(t.steps, "g-steps"))}
      ${sec("Tips", list([...(isPassive ? [] : m.tips || []), ...(t.tips || [])]))}
      ${sec("Watch out", t.watch?.length ? `<div class="g-warn">${list(t.watch)}</div>` : "")}
      <div class="g-links">${linkBtn(ytLink(m.name), "Find a recent video", true)}${linkBtn("https://www.gtaboss.gg/gta-5-online/guides/solo-money-making-guide-gta-online", "Source: GTA Boss guide")}</div>
      <p class="g-foot">Figures are community estimates (reviewed ${esc(SITE.reviewedLabel)}${m.updated ? ", payouts refreshed by the auto-updater" : ""}). Check the game for your own numbers.</p>`;
  }

  function glitchGuide(it) {
    const t = it.tutorial || {};
    const badges = [];
    if (it.status) badges.push(`<span class="status ${it.status}">${STATUS_LABEL[it.status]}</span>`);
    badges.push(glitchBadges(it));
    const hasLive = !!DB.live;
    let statusBlock = "";
    if (!hasLive) statusBlock = `<div class="g-notice">Offline copy: this entry's status couldn't be checked against the community list. Open the page through the local server or run the updater.</div>`;
    else if (it.status === "unlisted") statusBlock = `<div class="g-warn"><ul><li>Not on the community working list right now. It may have been patched, so check recent comments on the guide before trying it.</li></ul></div>`;
    else if (it.listed) statusBlock = `<div class="g-live"><ul><li>${it.curated ? "Confirmed on" : "Listed on"} the community working list (checked ${esc(ago(DB.live.generatedAt))}).${it.isNew ? " It was added recently." : ""}</li></ul></div>`;

    const needs = [...(t.needs || []), ...(!(t.needs || []).length ? [
      `Platform: ${it.platforms.length ? it.platforms.join(", ") : "not listed"}`, `${it.players}: ${PLAYERS_HINT[it.players] || ""}`] : [])];
    if ((t.needs || []).length) needs.push(`${it.players}: ${PLAYERS_HINT[it.players] || ""}`);

    let how;
    if (t.stages?.length) {
      how = `<p style="margin-bottom:12px">Overview of the stages. Exact timing and inputs change with every patch, so follow the live guide for the real steps.</p>${list(t.stages, "g-steps")}`;
    } else {
      how = `<div class="g-notice">The exact steps for this glitch depend on timing and menus that change with each patch, so they aren't printed here (they'd be wrong within weeks). Use the live community guide below. It's the maintained source.</div>`;
    }
    const caution = it.kind === "fun"
      ? ["Fun glitches don't add money, but some can freeze or crash your session. Try them in an invite-only session."]
      : ["Use a second account first and play in an invite-only session.", "Never use paid 'money drops', mod menus or recovery services.", "Don't spend or sell everything at once."];
    const warn = [...(t.watch || []), ...caution];

    return `<span class="g-kind">${KIND_LABEL[it.kind]}</span>
      <h3 class="g-title" id="guide-title">${esc(it.name)}</h3>
      ${it.line ? `<p class="g-line">${esc(it.line)}</p>` : ""}
      <div class="g-badges">${badges.join("")}</div>
      ${it.risk ? `<div style="margin-top:12px">${riskBlock(it)}</div>` : ""}
      ${sec("Overview", `<p>${esc(it.summary)}</p>`)}
      ${sec("Status", statusBlock)}
      ${sec("What you need", list(needs))}
      ${sec("How it works", how)}
      ${sec("Tips", list(t.tips))}
      ${sec("Watch out", `<div class="g-warn">${list(warn)}</div>`)}
      <div class="g-links">${linkBtn(it.guide, "Open the live guide (Reddit)", true)}${linkBtn(it.hub, "GTAGlitches page")}${linkBtn(ytLink(it.name), "Find a recent video", !it.guide)}${it.guide || it.hub ? "" : linkBtn(SITE.hubUrl, "Browse the working list")}</div>
      <p class="g-foot">${it.curated ? `Overview reviewed ${esc(SITE.reviewedLabel)}.` : "Auto-listed from the community working list."} Steps and status change with Rockstar's patches.</p>`;
  }

  function businessGuide(b) {
    const stepBtn = b.guide ? `<button class="btn btn-primary" type="button" data-open="${esc(b.guide)}">Step-by-step guide →</button>` : "";
    return `<span class="g-kind">Business</span>
      <h3 class="g-title" id="guide-title">${esc(b.name)}</h3>
      <p class="g-line">${esc(b.income)}</p>
      <div class="g-badges"><span class="tag ${verdictClass(b.verdict)}">${esc(b.verdict)}</span><span class="tag">${esc(GROUP_LABEL[b.group])}</span><span class="tag">${b.cost ? money(b.cost) + " buy-in" : "Price varies"}</span></div>
      <div class="g-kv">
        <div><span>Buy-in</span><b>${b.cost ? money(b.cost) : "Varies"}</b></div>
        <div><span>Rate</span><b>${b.rate ? "≈ " + money(b.rate) + "/hr" + (b.disputed ? " ⚠" : "") : "Varies"}</b></div>
        <div><span>Payback</span><b>${b.cost && b.rate ? duration((b.cost / b.rate) * 60) : "—"}</b></div>
        <div><span>Type</span><b>${esc(GROUP_LABEL[b.group].split(" ")[0])}</b></div>
      </div>
      ${sec("Why it matters", `<p>${esc(b.why)}</p>`)}
      ${sec("Pairs well with", `<p>${esc(b.pairs)}</p>`)}
      ${sec("Watch out", b.watch || b.disputed ? `<div class="g-warn"><ul>${b.watch ? `<li>${esc(b.watch)}</li>` : ""}${b.disputed ? `<li>⚠ The income figure for this one is disputed between sources, so don't rely on the hourly rate.</li>` : ""}</ul></div>` : "")}
      <div class="g-links">${stepBtn}${linkBtn(ytLink(b.name), "Find a recent video", !b.guide)}</div>
      <p class="g-foot">Payback is buy-in divided by the hourly rate, so it's a rough guide. Rates are community estimates (reviewed ${esc(SITE.reviewedLabel)}).</p>`;
  }
  function activityGuide(a) {
    const boost = boostFor(a);
    return `<span class="g-kind">Fun activity</span>
      <h3 class="g-title" id="guide-title">${a.emoji} ${esc(a.name)}</h3>
      <p class="g-line">${esc(a.money)}</p>
      <div class="g-badges"><span class="tag">${esc(a.players)}</span>${a.free ? `<span class="tag free">Free to start</span>` : `<span class="tag lock">${esc(a.cost)}</span>`}${boost ? `<span class="status working">🔥 ${esc(boost.mult)} this week</span>` : ""}</div>
      ${sec("Why it's fun", `<p>${esc(a.why)}</p>`)}
      ${sec("This week", boost ? `<div class="g-live"><ul><li>${esc(boost.mult)} ${esc(boost.text)}</li></ul></div>` : "")}
      ${sec("What you get", list([`Money: ${a.money}`, `RP: ${a.rp}`]))}
      ${sec("Tips", list(a.tips))}
      <div class="g-links">${linkBtn(ytLink(a.name), "Find a recent video", true)}</div>
      <p class="g-foot">Event bonuses change every Thursday. Payouts come from community guides (reviewed ${esc(SITE.reviewedLabel)}).</p>`;
  }

  function guideHTML(it) {
    if (it.kind === "method" || it.kind === "passive") return methodGuide(it);
    if (it.kind === "business") return businessGuide(it);
    if (it.kind === "activity") return activityGuide(it);
    return glitchGuide(it);
  }

  const guideDlg = () => $("#guide");
  function openGuide(key, { push = true } = {}) {
    const it = DB.reg.get(key);
    if (!it) return false;
    $("#guide-body").innerHTML = guideHTML(it);
    $("#guide-body").scrollTop = 0;
    const dlg = guideDlg();
    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add("modal-open");
    if (push) history.replaceState(null, "", "#guide=" + encodeURIComponent(key));
    return true;
  }
  function initGuide() {
    const dlg = guideDlg();
    $("#guide-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", () => {
      document.documentElement.classList.remove("modal-open");
      if (location.hash.startsWith("#guide=")) history.replaceState(null, "", location.pathname + location.search);
    });
    const open = (e) => {
      const card = e.target.closest("[data-open]"); if (!card) return;
      openGuide(card.dataset.open);
    };
    document.addEventListener("click", open);
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-open]")) { e.preventDefault(); openGuide(e.target.dataset.open); }
    });
    const fromHash = () => {
      if (location.hash.startsWith("#guide=")) openGuide(decodeURIComponent(location.hash.slice(7)), { push: false });
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  /* ============================================================== weekly */
  let weeklyTimer;
  function renderWeekly() {
    const w = DB.weekly;
    $("#weekly-title").textContent = w.title;
    $("#weekly-range").textContent = w.range;
    $("#weekly-bonuses").innerHTML = (w.bonuses || []).map((b) =>
      `<li><span class="mult ${b.mult === "2×" ? "x2" : ""}">${esc(b.mult)}</span><span>${esc(b.text)}</span></li>`).join("") || "<li>No bonuses listed.</li>";
    $("#weekly-rewards").innerHTML = (w.rewards || []).map((r) => `<li>${esc(r)}</li>`).join("") || "<li>No free rewards listed.</li>";
    $("#weekly-sales").innerHTML = (w.sales || []).map((r) => `<li>${esc(r)}</li>`).join("") || "<li>No sales listed.</li>";
    $("#podium").textContent = w.podium || "—";
    $("#prize").textContent = w.prizeRide || "—";
    $("#weekly-extras").innerHTML = (w.extras || []).map((e) =>
      `<div class="panel"><h3>${esc(e.title)}</h3><ul>${e.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("");
    $("#ticker").innerHTML = (() => {
      const items = (w.bonuses || []).slice(0, 5).map((b) => `<span>${esc(b.mult)} ${esc(b.text)}</span>`)
        .concat((w.rewards || []).slice(0, 3).map((r) => `<span>${esc(r)}</span>`)).join("");
      return items + items;
    })();
    clearInterval(weeklyTimer);
    const tick = () => {
      const ms = Date.parse(w.ends) - Date.now();
      const wrap = $("#weekly-countdown-wrap");
      if (ms <= 0) {
        wrap.innerHTML = `<span class="stale-note">This event has ended. Use the live-data button at the top to pull the new week.</span>`;
        return;
      }
      const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
      wrap.innerHTML = `Resets in <b>${d}d ${h}h ${m}m</b>`;
    };
    tick(); weeklyTimer = setInterval(tick, 30000);
  }

  /* ============================================================ checklist */
  const DAILY = [
    { id: "objectives", text: "Complete 3 Daily Objectives", amt: "$30K" },
    { id: "shipwreck", text: "Find the daily Shipwreck", amt: "$25K" },
    { id: "stashes", text: "Dig up both Buried Stashes", amt: "$50K" },
    { id: "chests", text: "Open the Cayo Perico Treasure Chests", amt: "$25K each" },
    { id: "skydives", text: "Junk Energy skydives", amt: "≤$50K" },
    { id: "wheel", text: "Spin the Lucky Wheel (free daily spin)", amt: "Prize" },
    { id: "carmeet", text: "LS Car Meet: the 14 daily activities", amt: "700 Rep" },
    { id: "safes", text: "Empty your Nightclub, Agency and Car Wash safes", amt: "Varies" },
    { id: "acid", text: "Resupply Acid Lab and Bunker", amt: "Passive" },
  ];
  const WEEKLY_TODO = [
    { id: "kortz", text: "Kortz Center Heist: first run of the week", amt: "~$2.2M" },
    { id: "dre", text: "Dr. Dre finale: first run of the week", amt: "$1.1M" },
    { id: "titan", text: "Titan Job on Hard: first clear", amt: "$1.125M" },
    { id: "salvage", text: "All 3 Salvage Yard robberies", amt: "~$975K" },
    { id: "knoway", text: "KnoWay Out on Hard: first clear", amt: "$683K" },
    { id: "cluckin", text: "Cluckin' Bell Farm Raid: first run", amt: "$600K" },
    { id: "challenge", text: "Weekly Challenge", amt: "$100K" },
    { id: "casino", text: "Diamond Casino Heist finale with a partner (2+ players)", amt: "~$1.4M each" },
    { id: "doomsday", text: "A Doomsday Heist act with a partner (2+ players)", amt: "Boosted" },
  ];
  function weekId() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9));
    while (d.getUTCDay() !== 4 || d > now) d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  function eventTodos() {
    if (!isActive(DB.weekly.ends)) return [];
    return (DB.weekly.rewards || []).filter((r) => /\$\d/.test(r)).map((r) => ({
      id: "ev-" + hash(r),
      // "Complete five X to receive $500,000" -> "Complete five X" (the amount is shown as the badge)
      text: r.replace(/\s*within 72 hours of completion/i, "").replace(/\s*\(must be claimed.*\)/i, "")
        .replace(/\s+to\s+(?:receive|get)\s+(?:the\s+)?(.*?)\$[\d,]+.*$/i, (_, item) => { item = item.replace(/\s+and\s*$/i, "").trim(); return item ? ` for the ${item}` : ""; })
        .slice(0, 110),
      amt: (r.match(/\$[\d,]+/) || ["Reward"])[0],
    }));
  }
  function buildChecklist() {
    const dayKey = "gls.daily." + new Date().toISOString().slice(0, 10);
    const wkKey = "gls.weekly." + weekId();
    const build = (listEl, items, key, progEl) => {
      const done = new Set(store.get(key, []));
      listEl.innerHTML = items.map((i) => `<li><label><input type="checkbox" data-id="${esc(i.id)}" ${done.has(i.id) ? "checked" : ""}>
        <span class="t-text">${esc(i.text)}</span><span class="t-amt">${esc(i.amt)}</span></label></li>`).join("");
      const prog = () => (progEl.textContent = `${items.filter((i) => done.has(i.id)).length}/${items.length} done`);
      listEl.onchange = (e) => {
        const id = e.target.dataset.id; if (!id) return;
        e.target.checked ? done.add(id) : done.delete(id);
        store.set(key, [...done]); prog();
      };
      prog();
    };
    build($("#daily-list"), DAILY, dayKey, $("#daily-progress"));
    build($("#weekly-list"), [...eventTodos(), ...WEEKLY_TODO], wkKey, $("#weekly-progress"));
  }

  /* ========================================================= story, cheats */
  function renderStory() {
    $("#stock-rows").innerHTML = STOCKS.map((s) =>
      `<tr><td>${esc(s.mission)}</td><td>${esc(s.before)}</td><td>${esc(s.after)}</td><td>${esc(s.gain)}</td></tr>`).join("");
    $("#egg-grid").innerHTML = EASTER_EGGS.map((e) =>
      `<article class="card mini-card"><h3>👁 ${esc(e.name)}</h3><div class="badges"><span class="tag">${esc(e.where)}</span></div><p class="does">${esc(e.how)}</p></article>`).join("");
  }

  const PS_KEY = { X: ["✕", "k-x"], Circle: ["○", "k-circle"], Square: ["□", "k-square"], Triangle: ["△", "k-triangle"] };
  const XB_MAP = { X: ["A", "k-a"], Circle: ["B", "k-b"], Square: ["X", "k-xx"], Triangle: ["Y", "k-y"], L1: ["LB"], R1: ["RB"], L2: ["LT"], R2: ["RT"] };
  const ARROWS = { Left: "←", Right: "→", Up: "↑", Down: "↓" };
  function keysFor(seq, plat) {
    return seq.split(",").map((k) => k.trim()).map((k) => {
      if (ARROWS[k]) return { label: ARROWS[k], cls: "", text: k };
      if (plat === "xbox") { const x = XB_MAP[k] || [k]; return { label: x[0], cls: x[1] || "", text: x[0] }; }
      const p = PS_KEY[k] || [k]; return { label: p[0], cls: p[1] || "", text: k };
    });
  }
  function renderCheats() {
    const v = view.cheats;
    const rows = CHEATS.filter((c) => (v.group === "all" || c.group === v.group) && (!v.q || c.name.toLowerCase().includes(v.q.toLowerCase().trim()) || c.pc.toLowerCase().includes(v.q.toLowerCase().trim())));
    $("#cheat-grid").innerHTML = rows.map((c) => {
      let body, copyText;
      if (v.plat === "pc") { body = `<div class="pc-code">${esc(c.pc)}</div>`; copyText = c.pc; }
      else if (v.plat === "phone") { body = `<div class="pc-code">${esc(c.phone)}</div>`; copyText = c.phone; }
      else {
        const keys = keysFor(c.ps, v.plat);
        body = `<div class="code">${keys.map((k) => `<span class="btn-key ${k.cls}">${esc(k.label)}</span>`).join("")}</div>`;
        copyText = keys.map((k) => k.text).join(", ");
      }
      return `<article class="card cheat"><div class="cheat-head"><h3>${esc(c.name)}</h3><button class="copy" type="button" data-copy="${esc(copyText)}">Copy</button></div>${body}</article>`;
    }).join("") || emptyState("cheats", "No cheats match those filters.");
  }
  function initCheats() {
    $("#cheat-note").textContent = `${CHEATS.length} codes, copied from GTABase's cheat list on Oct 5, 2026.`;
    bindTabs("#cheat-platform", (f) => { view.cheats.plat = f; renderCheats(); });
    bindTabs("#cheat-group", (f) => { view.cheats.group = f; renderCheats(); });
    $("#cheat-search").addEventListener("input", (e) => { view.cheats.q = e.target.value; renderCheats(); });
    $("#cheat-grid").addEventListener("click", async (e) => {
      const b = e.target.closest(".copy"); if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copied!"; } catch { b.textContent = "Copy failed"; }
      b.classList.add("done");
      setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1400);
    });
    renderCheats();
  }

  /* ========================================================= live updater */
  const live = { mode: "static", busy: false, info: null, lastChecked: null, error: null };
  const POLL_MS = 10 * 60 * 1000;

  function pillState() {
    const pill = $("#live-pill"), txt = $("#live-pill-text");
    let cls = "stale", label;
    if (live.busy) { cls = "busy"; label = "Checking…"; }
    else if (DB.live) {
      const age = Date.now() - Date.parse(DB.live.generatedAt);
      const partial = (DB.live.warnings || []).length > 0;
      cls = age > 48 * 36e5 ? "stale" : partial ? "partial" : "ok";
      label = age > 48 * 36e5 ? `Data ${ago(DB.live.generatedAt).replace(" ago", "")} old` : `Live · ${ago(DB.live.generatedAt)}`;
    } else if (live.error) { cls = "err"; label = "Updater offline"; }
    else { label = "Offline copy"; }
    pill.className = "live-pill " + cls;
    txt.textContent = label;

    const reviewed = SITE.reviewedLabel;
    $("#hero-status").textContent = DB.live
      ? `Live data · checked ${ago(DB.live.generatedAt)} · ${DB.weekly.title}`
      : `Curated data · reviewed ${reviewed} · ${DB.weekly.title}`;
    $("#footer-status").textContent = DB.live
      ? `Auto-updated from the sources below. Last check: ${new Date(DB.live.generatedAt).toLocaleString()}.`
      : `Showing the curated copy reviewed ${reviewed}. The auto-updater hasn't produced data yet.`;
  }

  async function loadLiveJson() {
    const r = await fetch("data/live.json?ts=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  async function detectServer() {
    if (location.protocol === "file:") { live.mode = "file"; return; }
    // The update server only exists locally (npm start). On GitHub Pages or any other host, skip the probe.
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    try {
      const r = await fetch("api/status", { cache: "no-store" });
      if (r.ok) { const j = await r.json(); if (j && j.server) { live.mode = "server"; live.info = j; } }
    } catch { /* static hosting */ }
  }

  /** If the server is mid-update (e.g. it just started after a weekly reset), wait for it so we show fresh data. */
  async function waitForServerRun() {
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch("api/status", { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        if (j) live.info = j;
        if (!j || !j.running) return;
      } catch { return; }
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  /** Swap in new data. Returns true if the content actually changed. */
  function applyLive(data) {
    if (!data || data.schema !== 1) throw new Error("unexpected data format");
    const changed = !DB.live || data.contentHash !== DB.live.contentHash;
    DB.live = data;
    if (changed) { buildDB(data); renderAll(); }
    return changed;
  }

  async function checkNow(manual) {
    if (live.busy) return;
    live.busy = true; pillState(); refreshUpdateDialog();
    try {
      let data;
      if (live.mode === "file") throw new Error("open the site through the local server (npm start) to enable updates");
      if (live.mode === "server" && manual) {
        // only a manual click forces the server to re-scrape the sources
        const r = await fetch("api/update", { method: "POST" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.live) throw new Error(j.error || "HTTP " + r.status);
        data = j.live; live.info = j.status || live.info;
      } else {
        // automatic checks just read what the server's own schedule last wrote
        if (live.mode === "server") await waitForServerRun();
        data = await loadLiveJson();
      }
      const changed = applyLive(data);
      live.lastChecked = Date.now(); live.error = null;
      if (changed) toast("Updated: " + ((data.changes || []).slice(0, 2).join(" · ") || "content refreshed from the sources") + ".");
      else if (manual) toast("Already up to date. Everything matches the sources.");
    } catch (e) {
      live.error = e.message;
      if (manual) toast("Update check failed: " + e.message);
    } finally {
      live.busy = false; pillState(); refreshUpdateDialog();
    }
  }

  function updateBody() {
    const d = DB.live;
    const modeText = {
      server: `Connected to the local update server. It re-checks every source automatically${live.info?.nextRunAt ? ` (next check ${new Date(live.info.nextRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""} and this page picks up the result.`,
      static: "The data is refreshed automatically by a scheduled job (every few hours and after each weekly reset), then published. This button reloads the latest published data.",
      file: "Opened as a plain file, so live data can't load. Open the published site, or run npm start and visit http://localhost:5173.",
    }[live.mode];
    const srcs = (d?.sources || []).map((s) => `<div class="u-row"><span class="u-dot ${s.ok ? "" : "bad"}"></span><div><b>${esc(s.name)}</b>
      <small>${s.ok ? "OK" : "Failed: " + esc(s.error)} · ${esc(new Date(s.checkedAt).toLocaleString())}</small></div></div>`).join("");
    const chg = (d?.changes || []).map((c) => `<li>${esc(c)}</li>`).join("");
    const hist = (d?.history || []).slice(0, 5).map((h) => `<div class="u-row"><div><small>${esc(new Date(h.at).toLocaleString())}</small>${h.changes.map((c) => esc(c)).join("<br>")}</div></div>`).join("");
    return `<span class="g-kind">Auto-updater</span>
      <h3 class="g-title" id="update-title">Live data</h3>
      <p class="g-line">${d ? `Last check ${esc(ago(d.generatedAt))}` : "No live data yet"}</p>
      ${sec("How it works", `<p>${esc(modeText)}</p>`)}
      ${d ? sec("Sources", srcs) : ""}
      ${(d?.warnings || []).length ? sec("Warnings", `<div class="g-warn">${list(d.warnings)}</div>`) : ""}
      ${chg ? sec("Changed in the last check", `<div class="g-live"><ul>${chg}</ul></div>`) : ""}
      ${hist ? sec("Recent history", hist) : ""}
      ${live.error ? sec("Last error", `<div class="g-warn">${list([live.error])}</div>`) : ""}
      <div class="u-actions"><button class="btn btn-primary" id="update-check" type="button" ${live.busy ? "disabled" : ""}>${live.busy ? "Checking…" : "Check for updates now"}</button></div>
      <p class="g-foot">Payouts, prices, this week's event and the community glitch list refresh automatically. The written tutorials are reviewed by hand (${esc(SITE.reviewedLabel)}).</p>`;
  }
  function refreshUpdateDialog() { if ($("#update-dialog").open) $("#update-body").innerHTML = updateBody(); }
  function initLive() {
    const dlg = $("#update-dialog");
    $("#live-pill").addEventListener("click", () => {
      $("#update-body").innerHTML = updateBody();
      dlg.showModal(); document.documentElement.classList.add("modal-open");
    });
    $("#update-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); if (e.target.id === "update-check") checkNow(true); });
    dlg.addEventListener("close", () => { if (!guideDlg().open) document.documentElement.classList.remove("modal-open"); });

    pillState();
    setInterval(pillState, 60000);
    detectServer().then(() => setTimeout(() => checkNow(false), 800));
    setInterval(() => checkNow(false), POLL_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && (!live.lastChecked || Date.now() - live.lastChecked > 5 * 60 * 1000)) checkNow(false);
    });
  }

  /* ============================================================== hero/nav */
  function renderHero() {
    $("#stat-methods").textContent = DB.methods.length + DB.passive.length;
    $("#stat-glitches").textContent = DB.money.length + DB.rp.length + DB.fun.length;
    $("#stat-cheats").textContent = CHEATS.length;
    const days = Math.ceil((Date.parse(SITE.gta6Release) - Date.now()) / 864e5);
    $("#gta6-count").textContent = days > 0 ? days : "OUT";
    $("#gta6-label").textContent = days > 0 ? "days until GTA VI" : "GTA VI is out!";
  }

  function initNav() {
    const links = new Map($$(".nav a").map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        const a = links.get(en.target.id);
        if (!a) return;
        a.classList.add("active");
        const nav = a.parentElement;
        if (a.offsetLeft < nav.scrollLeft || a.offsetLeft + a.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ================================================================ boot */
  function renderAll() {
    renderHero(); renderPlanner(); renderMethods(); renderBiz(); renderMoney(); renderRP(); renderFun(); renderFunZone(); renderRank();
    renderWeekly(); buildChecklist(); pillState();
    $("#tricks").innerHTML = MONEY_TRICKS.map((t) => `<article class="card mini-card trick"><h3>${esc(t.name)}</h3><p class="does">${esc(t.how)}</p></article>`).join("");
    $("#skiplist").innerHTML = SKIP.map((s) => `<article class="card mini-card skip"><h3>✕ ${esc(s.name)}</h3><p class="does">${esc(s.why)}</p></article>`).join("");
    // keep an open guide in sync with fresh data
    const dlg = guideDlg();
    if (dlg.open && location.hash.startsWith("#guide=")) openGuide(decodeURIComponent(location.hash.slice(7)), { push: false });
  }

  buildDB(window.GLITCH_LIVE || null);
  initPlanner();
  if (loadedPlan.shared) {
    toast("Loaded a shared plan. Tweak it and share your own.", 6000);
    setTimeout(() => $("#planner").scrollIntoView(), 400);
  }
  initFilters();
  initCheats();
  renderStory();
  renderRankStatic();
  renderAll();
  initGuide();
  initLive();
  initNav();
})();
