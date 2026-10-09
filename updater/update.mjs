/* GLITCH//LS auto-updater
 *
 * Scrapes three public sources and writes data/live.json + data/live.js, which the site
 * merges over its curated content (data.js):
 *   1. GTABase weekly update  -> this week's event, bonuses, discounts, podium, rewards
 *   2. GTA Boss money guide   -> payouts, first-run-of-the-week values, buy-ins, passive rates
 *   3. r/GTAGlitches hub list -> the current community "working glitches" list (+ new / removed)
 *
 * Run it directly:   node updater/update.mjs
 * Or let server.mjs run it on a schedule.
 *
 * Every parser is defensive: if a source changes its layout or is down, that section keeps
 * its previous values and a warning is recorded instead of publishing bad data.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const LIVE_JSON = path.join(DATA_DIR, 'live.json');
const LIVE_JS = path.join(DATA_DIR, 'live.js');
const STATE_JSON = path.join(DATA_DIR, 'state.json');

const UA = 'Mozilla/5.0 (compatible; GlitchLS-Updater/1.0; personal fan site)';
const SOURCES = {
  weekly: { name: 'GTABase weekly update', url: 'https://www.gtabase.com/gta-online/weekly-update-bonuses-discounts' },
  guide: { name: 'GTA Boss solo money guide', url: 'https://www.gtaboss.gg/gta-5-online/guides/solo-money-making-guide-gta-online' },
  hub: { name: 'r/GTAGlitches working list', url: 'https://gtaglitches.com/working-glitches' },
};
const NEW_FOR_DAYS = 14;
const PATCHED_FOR_DAYS = 45;

/* ---------------------------------------------------------------- helpers */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}
const text = (html = '') => decode(
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '),
).replace(/\s+/g, ' ').replace(/\s+([,.:;!?])/g, '$1').trim();
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const cleanMoney = (s) => s.replace(/GTA\$\s?/g, '$');
const nums = (s) => [...s.matchAll(/\d{1,3}(?:,\d{3})+/g)].map((m) => parseInt(m[0].replace(/,/g, ''), 10));

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}
async function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, file);
}

async function fetchText(url, timeoutMs = 25000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: ctl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    // honour the declared charset (some sources are not UTF-8)
    let charset = /charset=([\w-]+)/i.exec(res.headers.get('content-type') || '')?.[1];
    if (!charset) charset = /<meta[^>]+charset=["']?([\w-]+)/i.exec(new TextDecoder('latin1').decode(buf.slice(0, 4096)))?.[1];
    try { return new TextDecoder(charset || 'utf-8').decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'timed out' : e.message);
  } finally {
    clearTimeout(timer);
  }
}

/** Load METHODS / PASSIVE / PROPERTIES from the site's own data.js so we diff against what it ships. */
async function loadBaseline() {
  const code = await fs.readFile(path.join(ROOT, 'data.js'), 'utf8');
  return vm.runInNewContext(`${code}\n;({ METHODS, PASSIVE, PROPERTIES })`, {}, { timeout: 2000 });
}

/* ------------------------------------------------- 1. weekly event (GTABase) */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

// which curated method does a piece of event text refer to?
const METHOD_KEYS = {
  security: /security contract/i,
  bail: /bail office/i,
  dispatch: /dispatch work/i,
  kortz: /kortz/i,
  salvage: /salvage yard/i,
  dre: /data leaks|dr\.? dre/i,
  cluckin: /cluckin/i,
  knoway: /knoway/i,
  titan: /titan job/i,
  cayo: /cayo perico heist/i,
  autoshop: /auto shop/i,
  carwash: /car wash|money laundering/i,
  payphone: /payphone hit/i,
  vipwork: /vip work|headhunter|sightseer/i,
  vehiclecargo: /vehicle cargo/i,
  casino: /casino heist|diamond casino/i,
  doomsday: /doomsday/i,
};
const methodFor = (s) => Object.keys(METHOD_KEYS).find((id) => METHOD_KEYS[id].test(s)) || null;

function parseGtaItems(html) {
  return html.split('<li class="gta-bonuses item-scale">').slice(1).map((chunk) => {
    const name = text((chunk.match(/<h3 class="contentheading noindex">([\s\S]*?)<\/h3>/) || [])[1] || '');
    const pct = (chunk.match(/badge new[^>]*>\s*-?(\d+)%/) || [])[1];
    return {
      name,
      rp: (chunk.match(/bonus-multiplier rp">\s*(\d+)x/i) || [])[1],
      cash: (chunk.match(/bonus-multiplier cash">\s*(\d+)x/i) || [])[1],
      pct: pct ? +pct : null,
      type: text((chunk.match(/<span class="(?:podium-vehicle|prize-ride)">([\s\S]*?)<\/span>/) || [])[1] || ''),
    };
  }).filter((i) => i.name);
}

export function parseWeekly(html) {
  const h1 = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '');
  const year = +(h1.match(/\b(20\d\d)\b/) || [])[1] || new Date().getUTCFullYear();
  const start = html.search(/<h2 class="section-title indexed">/);
  if (start < 0) throw new Error('weekly article not found (layout changed?)');
  const endMark = html.indexOf('You can visit our news section', start);
  const art = html.slice(start, endMark > start ? endMark : undefined);

  const h2 = text((art.match(/<h2[\s\S]*?<\/h2>/) || [])[0] || '');
  const head = h2.match(/\(([^)]+)\)\s*:?\s*(.*?)(?:,?\s*Bonuses.*)?$/i);
  if (!head) throw new Error(`could not read weekly title: "${h2}"`);
  const range = head[1].match(/([A-Za-z]+)\s+(\d{1,2})\s*[-–—]\s*(?:([A-Za-z]+)\s+)?(\d{1,2})/);
  if (!range) throw new Error(`could not read date range: "${head[1]}"`);
  const m1 = MONTHS.indexOf(range[1].toLowerCase());
  const m2 = MONTHS.indexOf((range[3] || range[1]).toLowerCase());
  if (m1 < 0 || m2 < 0) throw new Error(`unknown month in "${head[1]}"`);
  const d2 = +range[4];
  const endYear = m2 < m1 ? year + 1 : year;
  const ends = new Date(Date.UTC(endYear, m2, d2 + 1, 9)).toISOString(); // weekly reset: Thursday 09:00 UTC
  const endShort = `${cap(MONTHS[m2]).slice(0, 3)} ${d2}`;
  const rangeLabel = `${cap(MONTHS[m1])} ${range[2]} – ${m1 === m2 ? '' : cap(MONTHS[m2]) + ' '}${d2}, ${endYear}`;

  // split into sections by the h3/h4 "indexed" headings
  const headRe = /<h([34]) class="[^"]*indexed[^"]*">\s*<span id="([^"]+)" class="anchor"><\/span>\s*<span class="heading_text">([\s\S]*?)<\/span><\/h\1>/g;
  const marks = [...art.matchAll(headRe)];
  const sections = marks.map((m, i) => ({
    id: m[2], title: text(m[3]),
    html: art.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : undefined),
  }));
  const byId = (id) => sections.find((s) => s.id === id);

  const methodEvents = {};
  const bonuses = [];
  const addBonus = (n, kind, name) => {
    bonuses.push({ mult: `${n}×`, text: `${kind} on ${name}` });
    const id = methodFor(name);
    if (id && kind.includes('GTA$')) methodEvents[id] = { x: +n, label: `${n}× this week (ends ${endShort})` };
  };

  for (const it of parseGtaItems(byId('gta-rp-bonuses')?.html || '')) {
    const n = it.cash || it.rp;
    if (!n) continue;
    addBonus(n, it.cash && it.rp ? 'GTA$ & RP' : it.cash ? 'GTA$' : 'RP', it.name);
  }
  for (const m of (byId('also-bonuses-on')?.html || '').matchAll(/<p><strong>\s*(\d+)X\s*([^<]*)<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/gi)) {
    const kind = text(m[2]) || 'GTA$ & RP';
    for (const li of m[3].matchAll(/<li>([\s\S]*?)<\/li>/g)) addBonus(m[1], kind, text(li[1]));
  }
  bonuses.sort((a, b) => parseInt(b.mult) - parseInt(a.mult));

  // free items & cash rewards, wherever they appear in the article
  const rewards = [];
  const addReward = (t) => { t = cleanMoney(t); if (t && !rewards.includes(t)) rewards.push(t); };
  for (const s of sections) {
    if (['gta-rp-bonuses', 'in-game-discounts', 'showrooms-test-rides', 'also-bonuses-on'].includes(s.id)) continue;
    const gunVan = /gun van/i.test(s.title);
    for (const li of s.html.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const t = text(li[1]);
      if (gunVan) { const f = t.match(/^Free\s*:\s*(.+)$/i); if (f) addReward(`Gun Van: free ${f[1]}`); }
      else if (/GTA\$\s?\d{1,3}(?:,\d{3})+/.test(t) || /\bfor free\b/i.test(t)) addReward(t);
    }
    if (/weekly challenge/i.test(s.title)) {
      for (const p of s.html.matchAll(/<p>([\s\S]*?)<\/p>/g)) { const t = text(p[1]); if (/GTA\$/.test(t)) addReward(t); }
    }
  }

  // "complete N <thing> to receive GTA$X" -> a one-off bonus attached to a method
  const methodBonuses = {};
  for (const r of rewards) {
    const m = r.match(/(?:Complete|Secure|Finish|Win)\s+(\w+)\s+([^.,]*?)(?:\s+through\s+\w+\s+\d+)?\s+to\s+(?:receive|get|earn)\b.*?\$\s?([\d,]+)/i);
    if (!m) continue;
    const runs = WORD_NUM[m[1].toLowerCase()] || +m[1];
    const id = methodFor(m[2]);
    const amount = parseInt(m[3].replace(/,/g, ''), 10);
    if (runs && id && amount >= 10000) methodBonuses[id] = { runs, amount, label: `${money(amount)} bonus after ${runs} (ends ${endShort})` };
  }

  // discounts, podium, prize ride
  const discounts = parseGtaItems(byId('in-game-discounts')?.html || '').filter((d) => d.pct);
  const showroom = parseGtaItems(byId('showrooms-test-rides')?.html || '');
  const podium = showroom.find((i) => /podium/i.test(i.type))?.name || null;
  const prizeRide = showroom.find((i) => /prize ride/i.test(i.type))?.name || null;

  const sales = [];
  const byPct = new Map();
  for (const d of discounts) byPct.set(d.pct, [...(byPct.get(d.pct) || []), d.name]);
  for (const pct of [...byPct.keys()].sort((a, b) => b - a)) {
    let names = byPct.get(pct);
    const agencies = names.filter((n) => /agency$/i.test(n));
    if (agencies.length >= 3) names = [...names.filter((n) => !/agency$/i.test(n)), 'all Agency locations'];
    sales.push(`${pct}% off: ${names.slice(0, 12).join(', ')}${names.length > 12 ? ` + ${names.length - 12} more` : ''}`);
  }

  // anything else (Kortz targets, Salvage Yard robberies, race of the week...) becomes "extras"
  const skip = new Set(['gta-rp-bonuses', 'in-game-discounts', 'showrooms-test-rides', 'also-bonuses-on', 'weekly-challenge']);
  const extras = sections.filter((s) => !skip.has(s.id) && !/gun van/i.test(s.title)).map((s) => ({
    title: s.title,
    items: [...s.html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) => cleanMoney(text(li[1]))).filter((t) => t && !rewards.includes(t)).slice(0, 12),
  })).filter((e) => e.items.length).slice(0, 8);

  if (!bonuses.length && !discounts.length) throw new Error('weekly page had no bonuses or discounts');
  return {
    title: head[2] || 'Weekly update', range: rangeLabel, ends, bonuses, rewards, podium, prizeRide, sales, extras,
    methodEvents, methodBonuses, sourceUrl: SOURCES.weekly.url,
  };
}

/* ----------------------------------------------- 2. money methods (GTA Boss) */
const ROW_MAP = [
  { id: 'dre', re: /data leaks|\bdre\b/i, take: 'first', first: 'first', prop: 'agency' },
  { id: 'autoshop', re: /auto shop/i, take: 'mid', prop: 'autoshop' },
  { id: 'titan', re: /titan/i, take: 'last', first: 'last', prop: 'hangar' },
  { id: 'cayo', re: /cayo/i, take: 'mid', prop: 'kosatka' },
  { id: 'kortz', re: /kortz/i, take: 'mid', prop: 'studio' },
  { id: 'salvage', re: /salvage/i, take: 'mid', prop: 'salvage' },
  { id: 'cluckin', re: /cluckin/i, take: 'first', first: 'first' },
  { id: 'knoway', re: /knoway/i, take: 'high', first: 'high' },
];
const PASSIVE_MAP = [
  { id: 'bunker', re: /bunker/i }, { id: 'acid', re: /acid/i }, { id: 'nightclub', re: /nightclub/i },
  { id: 'cocaine', re: /cocaine/i }, { id: 'meth', re: /\bmeth\b/i }, { id: 'counterfeit', re: /counterfeit/i },
];
function pick(list, rule) {
  if (!list.length) return null;
  if (rule === 'first') return list[0];
  if (rule === 'last') return list[list.length - 1];
  if (rule === 'high') return Math.max(...list);
  return Math.round((list[0] + list[list.length - 1]) / 2); // 'mid'
}
const tableRows = (tbl) => [...tbl.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((tr) => [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1])));

export function parseGuide(html) {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => tableRows(m[0]));
  const methodsTbl = tables.find((t) => t[0]?.some((c) => /standard take/i.test(c)));
  const bizTbl = tables.find((t) => t[0]?.some((c) => /full batch/i.test(c)));
  if (!methodsTbl) throw new Error('methods table not found (layout changed?)');
  const col = (hdr, re) => hdr.findIndex((c) => re.test(c));
  const h = methodsTbl[0];
  const iTake = col(h, /standard take/i), iFirst = col(h, /first run/i), iBuy = col(h, /buy-in/i);
  const methods = {};
  for (const row of methodsTbl.slice(1)) {
    const cfg = ROW_MAP.find((c) => c.re.test(row[0] || ''));
    if (!cfg) continue;
    const entry = {};
    const take = pick(nums(row[iTake] || ''), cfg.take);
    if (take) entry.payout = take;
    if (cfg.first) { const f = pick(nums(row[iFirst] || ''), cfg.first); if (f) entry.firstWeekly = f; }
    const buy = nums(row[iBuy] || '')[0];
    if (buy && cfg.prop) entry.buyIn = { prop: cfg.prop, cost: buy };
    methods[cfg.id] = entry;
  }
  const passive = {};
  for (const row of (bizTbl || []).slice(1)) {
    const cfg = PASSIVE_MAP.find((c) => c.re.test(row[0] || ''));
    const n = cfg && nums(row[1] || '')[0];
    if (n) passive[cfg.id] = n;
  }
  if (!Object.keys(methods).length) throw new Error('no method rows recognised');
  return { methods, passive };
}

/* --------------------------------- 3. community working list (r/GTAGlitches) */
const HUB_CATS = { money: 'money', vehicle: 'vehicle', player: 'player', clothing: 'clothing', misc: 'misc' };
export function parseHub(html) {
  const out = [];
  for (const sec of html.matchAll(/<section class="category[^"]*" id="cat-(\w+)"[\s\S]*?<\/section>/g)) {
    const cat = HUB_CATS[sec[1]];
    if (!cat) continue;
    for (const a of sec[0].matchAll(/<article class="card hub-working-card">([\s\S]*?)<\/article>/g)) {
      const body = a[1];
      const title = body.match(/<div class="card-title"><a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
      const slug = (body.match(/href="\/glitches\/([^/"]+)\/"/) || [])[1];
      if (!title || !slug) continue;
      if (/mega ?thread/i.test(text(title[2]))) continue; // educational posts, not glitches
      const sub = text((body.match(/<div class="card-sub">([\s\S]*?)<\/div>/) || [])[1] || '');
      const platforms = [];
      if (/\bPC\b/i.test(sub)) platforms.push('PC');
      if (/play ?station|\bPS\d?\b/i.test(sub)) platforms.push('PS');
      if (/xbox/i.test(sub)) platforms.push('Xbox');
      const pl = sub.match(/-\s*(Semi-Solo|Non-Solo|Solo)\s*$/i);
      out.push({
        id: slug, name: text(title[2]), cat, platforms,
        players: pl ? pl[1].replace(/^(\w)/, (c) => c.toUpperCase()).replace(/-(\w)/, (_, c) => '-' + c.toUpperCase()) : 'Unlisted',
        guide: /^https?:/.test(title[1]) ? title[1] : null,
        hub: `https://gtaglitches.com/glitches/${slug}/`,
      });
    }
  }
  if (out.length < 50) throw new Error(`only ${out.length} glitches found (layout changed?)`);
  return out;
}

/* ------------------------------------------------------------------- main */
export async function runUpdate({ log = () => {} } = {}) {
  const prev = await readJson(LIVE_JSON, null);
  const state = (await readJson(STATE_JSON, null)) || { initializedAt: null, glitches: {}, patched: [], history: [] };
  const firstRun = !state.initializedAt;
  const base = await loadBaseline();
  const now = new Date();
  const nowIso = now.toISOString();
  const warnings = [];
  const sources = [];
  const changes = [];

  const out = {
    schema: 1,
    generatedAt: nowIso,
    weekly: prev?.weekly || null,
    methodOverrides: prev?.methodOverrides || {},
    passiveOverrides: prev?.passiveOverrides || {},
    propertyCosts: prev?.propertyCosts || {},
    community: prev?.community || [],
    patched: prev?.patched || [],
  };
  const track = async (key, fn) => {
    const src = SOURCES[key];
    try {
      log(`fetching ${src.name}…`);
      const html = await fetchText(src.url);
      const n = fn(html);
      sources.push({ id: key, name: src.name, url: src.url, ok: true, checkedAt: nowIso });
      return n;
    } catch (e) {
      sources.push({ id: key, name: src.name, url: src.url, ok: false, error: e.message, checkedAt: nowIso });
      warnings.push(`${src.name}: ${e.message} (kept previous data)`);
      log(`  ✗ ${src.name}: ${e.message}`);
      return null;
    }
  };

  // 1. weekly
  const weekly = await track('weekly', parseWeekly);
  if (weekly) {
    if (!prev?.weekly || prev.weekly.title !== weekly.title || prev.weekly.range !== weekly.range) {
      changes.push(`This week: ${weekly.title} (${weekly.range})`);
    }
    out.weekly = weekly;
  }

  // 2. payouts / buy-ins / passive rates (only recorded when they differ from data.js)
  const guide = await track('guide', parseGuide);
  if (guide) {
    const overrides = {}, passiveOverrides = {}, propertyCosts = {};
    const sane = (v, ref) => ref > 0 && v / ref >= 0.4 && v / ref <= 2.5;
    const differs = (v, ref) => Math.abs(v - ref) / ref > 0.03;
    for (const [id, g] of Object.entries(guide.methods)) {
      const m = base.METHODS.find((x) => x.id === id);
      if (!m) continue;
      for (const key of ['payout', 'firstWeekly']) {
        const v = g[key];
        if (!v || !m[key]) continue;
        if (!sane(v, m[key])) { warnings.push(`GTA Boss ${key} for ${m.name} (${money(v)}) looked wrong, ignored`); continue; }
        if (differs(v, m[key])) (overrides[id] ||= {})[key] = v;
      }
      if (g.buyIn) {
        const p = base.PROPERTIES.find((x) => x.id === g.buyIn.prop);
        if (p && sane(g.buyIn.cost, p.cost) && differs(g.buyIn.cost, p.cost)) propertyCosts[p.id] = g.buyIn.cost;
      }
    }
    for (const [id, v] of Object.entries(guide.passive)) {
      const p = base.PASSIVE.find((x) => x.id === id);
      if (p && sane(v, p.perHour) && differs(v, p.perHour)) passiveOverrides[id] = v;
    }
    const diffLines = (cur, old, label, ref) => {
      for (const [id, obj] of Object.entries(cur)) {
        for (const [k, v] of Object.entries(typeof obj === 'object' ? obj : { v: obj })) {
          const before = typeof obj === 'object' ? old?.[id]?.[k] : old?.[id];
          if (before !== v) changes.push(`${ref(id)} ${label(k)}: ${before ? money(before) : 'baseline'} → ${money(v)}`);
        }
      }
    };
    diffLines(overrides, prev?.methodOverrides, (k) => (k === 'firstWeekly' ? 'first-run payout' : 'payout'), (id) => base.METHODS.find((m) => m.id === id)?.name.replace(/ \(.+\)$/, '') || id);
    diffLines(passiveOverrides, prev?.passiveOverrides, () => 'income/hr', (id) => base.PASSIVE.find((m) => m.id === id)?.name || id);
    diffLines(propertyCosts, prev?.propertyCosts, () => 'price', (id) => base.PROPERTIES.find((m) => m.id === id)?.name || id);
    out.methodOverrides = overrides; out.passiveOverrides = passiveOverrides; out.propertyCosts = propertyCosts;
  }

  // 3. community glitch list, with new / removed tracking
  const hub = await track('hub', parseHub);
  if (hub) {
    const seen = new Set(hub.map((g) => g.id));
    const known = state.glitches;
    const newNames = [];
    for (const g of hub) {
      if (!known[g.id]) {
        known[g.id] = { name: g.name, first: firstRun ? null : nowIso };
        if (!firstRun) newNames.push(g.name);
      }
      const first = known[g.id].first;
      g.isNew = !!first && now - new Date(first) < NEW_FOR_DAYS * 864e5;
      if (g.isNew) g.firstSeen = first;
    }
    const gone = Object.keys(known).filter((id) => !seen.has(id));
    for (const id of gone) {
      if (!firstRun) state.patched.push({ id, name: known[id].name, date: nowIso });
      delete known[id];
    }
    // a glitch that came back is no longer "patched"
    state.patched = state.patched.filter((p) => !seen.has(p.id) && now - new Date(p.date) < PATCHED_FOR_DAYS * 864e5);
    if (newNames.length) changes.push(`${newNames.length} new on the working list: ${newNames.slice(0, 6).join(', ')}${newNames.length > 6 ? '…' : ''}`);
    const goneNames = state.patched.filter((p) => gone.includes(p.id)).map((p) => p.name);
    if (goneNames.length) changes.push(`${goneNames.length} removed (likely patched): ${goneNames.slice(0, 6).join(', ')}${goneNames.length > 6 ? '…' : ''}`);
    out.community = hub;
    out.patched = state.patched;
    state.initializedAt ||= nowIso;
  }

  state.history = [...(changes.length ? [{ at: nowIso, changes }] : []), ...(state.history || [])].slice(0, 20);
  out.history = state.history;
  out.changes = changes;
  out.warnings = warnings;
  out.sources = sources;
  out.ok = sources.some((s) => s.ok);
  out.contentHash = crypto.createHash('sha1').update(JSON.stringify([
    out.weekly, out.methodOverrides, out.passiveOverrides, out.propertyCosts,
    out.community.map((g) => [g.id, g.isNew]), out.patched.map((p) => p.id),
  ])).digest('hex').slice(0, 12);

  await fs.mkdir(DATA_DIR, { recursive: true });
  await writeAtomic(STATE_JSON, JSON.stringify(state, null, 1));
  const json = JSON.stringify(out, null, 1);
  await writeAtomic(LIVE_JSON, json);
  await writeAtomic(LIVE_JS, `/* generated by updater/update.mjs — do not edit */\nwindow.GLITCH_LIVE = ${json};\n`);
  log(`done: ${changes.length} change(s), ${warnings.length} warning(s)`);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runUpdate({ log: (m) => console.log(m) })
    .then((r) => {
      console.log(`weekly: ${r.weekly?.title} (${r.weekly?.range}), ends ${r.weekly?.ends}`);
      console.log(`community glitches: ${r.community.length}, patched: ${r.patched.length}`);
      for (const c of r.changes) console.log('  •', c);
      for (const w of r.warnings) console.log('  ! ', w);
      process.exit(r.ok ? 0 : 1);
    })
    .catch((e) => { console.error('update failed:', e); process.exit(1); });
}
