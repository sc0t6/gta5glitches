/* GLITCH//LS local server: serves the site and keeps it up to date.
 *
 *   node server.mjs            (or: npm start)
 *
 * - Serves the static files in this folder.
 * - Runs updater/update.mjs on a schedule: whenever the data is older than UPDATE_EVERY_HOURS
 *   (default 3), and shortly after the weekly event ends (Thursday reset), so the new week appears by itself.
 * - POST /api/update  runs the updater now (rate-limited), GET /api/status reports the schedule.
 *
 * Env: PORT (5173), HOST (127.0.0.1), UPDATE_EVERY_HOURS (3)
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runUpdate } from './updater/update.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LIVE_JSON = path.join(ROOT, 'data', 'live.json');
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '127.0.0.1';
const EVERY_H = Number(process.env.UPDATE_EVERY_HOURS) || 3;
const MIN_GAP_MS = 60_000; // minimum time between manual refreshes

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
};

const stamp = () => new Date().toLocaleTimeString();
const log = (m) => console.log(`[${stamp()}] ${m}`);

let running = null;
let lastRunAt = 0;

async function readLive() {
  try { return JSON.parse(await fs.readFile(LIVE_JSON, 'utf8')); } catch { return null; }
}

function doUpdate(reason) {
  if (running) return running;
  log(`update started (${reason})`);
  running = runUpdate({ log })
    .then((r) => { lastRunAt = Date.now(); log(`update finished: ${r.changes.length} change(s), ${r.warnings.length} warning(s)`); return r; })
    .catch((e) => { log(`update failed: ${e.message}`); throw e; })
    .finally(() => { running = null; });
  return running;
}

async function status() {
  const live = await readLive();
  const generated = live ? Date.parse(live.generatedAt) : 0;
  return {
    server: true,
    running: !!running,
    intervalHours: EVERY_H,
    lastRunAt: generated ? new Date(generated).toISOString() : null,
    nextRunAt: generated ? new Date(generated + EVERY_H * 3600_000).toISOString() : null,
  };
}

/** Refresh when data is stale, or soon after the weekly event has ended. */
async function tick() {
  const live = await readLive();
  const age = live ? Date.now() - Date.parse(live.generatedAt) : Infinity;
  const eventEnded = live?.weekly?.ends && Date.parse(live.weekly.ends) < Date.now();
  if (age > EVERY_H * 3600_000 || (eventEnded && age > 15 * 60_000)) doUpdate(eventEnded && age <= EVERY_H * 3600_000 ? 'new week' : 'scheduled').catch(() => {});
}

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'x-content-type-options': 'nosniff', ...headers });
  res.end(body);
}
const sendJson = (res, code, obj) => send(res, code, JSON.stringify(obj), { 'content-type': MIME['.json'], 'cache-control': 'no-store' });

async function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return send(res, 400, 'Bad request'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const within = file === ROOT || file.startsWith(ROOT + path.sep);
  const parts = path.relative(ROOT, file).split(path.sep);
  const ext = path.extname(file).toLowerCase();
  if (!within || parts.some((p) => p.startsWith('.')) || !MIME[ext]) return send(res, 404, 'Not found');
  try {
    const data = await fs.readFile(file);
    const cache = parts[0] === 'data' ? 'no-store' : 'no-cache';
    send(res, 200, req.method === 'HEAD' ? '' : data, { 'content-type': MIME[ext], 'cache-control': cache });
  } catch {
    send(res, 404, 'Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname === '/api/status' && req.method === 'GET') return sendJson(res, 200, await status());

    if (pathname === '/api/update') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'use POST' });
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) return sendJson(res, 403, { error: 'cross-origin request refused' });
      try {
        if (!running && Date.now() - lastRunAt >= MIN_GAP_MS) await doUpdate('requested');
        else if (running) await running;
        const live = await readLive();
        if (!live) return sendJson(res, 502, { error: 'no data available yet' });
        return sendJson(res, 200, { ok: true, live, status: await status() });
      } catch (e) {
        return sendJson(res, 502, { error: e.message });
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return serveStatic(req, res, pathname);
  } catch (e) {
    log(`request error: ${e.message}`);
    return send(res, 500, 'Server error');
  }
});

server.listen(PORT, HOST, () => {
  log(`GLITCH//LS running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (auto-update every ${EVERY_H}h and after each weekly reset)`);
  tick();
  setInterval(tick, 5 * 60_000);
});
