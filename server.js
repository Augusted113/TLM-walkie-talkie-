const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Set your admin password via Render environment variable: ADMIN_PASSWORD
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@TLM2025';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory state ──────────────────────────────────────────────────────────
let units = {};
let logs  = [];

// ── Helpers ──────────────────────────────────────────────────────────────────
function addLog(action, unit, name, shift) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  logs = logs.filter(l => l.timestamp > cutoff);
  logs.unshift({ id: Date.now(), timestamp: Date.now(), action, unit, name: name || null, shift: shift || null });
}

function checkPassword(req, res) {
  if (req.body.password !== ADMIN_PASSWORD) {
    res.status(403).json({ error: 'Incorrect password.' });
    return false;
  }
  return true;
}

// ── API ──────────────────────────────────────────────────────────────────────

app.get('/api/state', (req, res) => res.json(units));

app.get('/api/logs', (req, res) => {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  res.json(logs.filter(l => l.timestamp > cutoff));
});

app.post('/api/verify-password', (req, res) => {
  req.body.password === ADMIN_PASSWORD
    ? res.json({ ok: true })
    : res.status(403).json({ error: 'Incorrect password.' });
});

// Add unit — password required
app.post('/api/units', (req, res) => {
  if (!checkPassword(req, res)) return;
  const key = String(req.body.number || '').trim();
  if (!key) return res.status(400).json({ error: 'Unit number is required.' });
  if (units[key]) return res.status(400).json({ error: `Unit #${key} already exists.` });
  units[key] = { status: 'available', name: null, shift: null, since: null };
  res.json({ ok: true });
});

// Remove unit — password required
app.delete('/api/units/:number', (req, res) => {
  if (!checkPassword(req, res)) return;
  const key = req.params.number;
  if (!units[key]) return res.status(404).json({ error: 'Unit not found.' });
  if (units[key].status === 'checked_out')
    return res.status(400).json({ error: `Cannot remove #${key} — it is currently checked out.` });
  delete units[key];
  res.json({ ok: true });
});

// Checkout
app.post('/api/checkout', (req, res) => {
  const { number, name, shift } = req.body;
  const key   = String(number || '').trim();
  const who   = String(name   || '').trim();
  const sh    = String(shift  || '').trim();
  if (!key || !who) return res.status(400).json({ error: 'Name and unit number are required.' });
  if (!sh)          return res.status(400).json({ error: 'Please select a shift.' });
  if (!units[key])  return res.status(404).json({ error: `Unit #${key} not found.` });
  if (units[key].status === 'checked_out')
    return res.status(400).json({ error: `Unit #${key} is already checked out by ${units[key].name}.` });
  units[key] = { status: 'checked_out', name: who, shift: sh, since: new Date().toISOString() };
  addLog('checkout', key, who, sh);
  res.json({ ok: true });
});

// Return
app.post('/api/return/:number', (req, res) => {
  const key = req.params.number;
  if (!units[key]) return res.status(404).json({ error: 'Unit not found.' });
  if (units[key].status === 'available')
    return res.status(400).json({ error: `Unit #${key} is already in stock.` });
  addLog('return', key, units[key].name, units[key].shift);
  units[key] = { status: 'available', name: null, shift: null, since: null };
  res.json({ ok: true });
});

// Clear logs — password required
app.delete('/api/logs', (req, res) => {
  if (!checkPassword(req, res)) return;
  logs = [];
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Walkie Tracker running on http://localhost:${PORT}`));
    
