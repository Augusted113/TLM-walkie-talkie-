const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@TLM2025';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Default units — always restored on startup ────────────────────────────────
const DEFAULT_UNITS = [
  'WT-01','WT-02','WT-03','WT-04','WT-05','WT-06','WT-07',
  'WT-08','WT-09','WT-10','WT-11','WT-12','WT-13','WT-14',
  'WT-15','WT-16','WT-17','WT-18','WT-19','WT-20','WT-21'
];

// ── In-memory state ───────────────────────────────────────────────────────────
let units = {};
let logs  = [];

function initUnits() {
  units = {};
  DEFAULT_UNITS.forEach(function(k) {
    units[k] = { status: 'available', name: null, shift: null, since: null };
  });
  console.log('Loaded ' + DEFAULT_UNITS.length + ' default units.');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function addLog(action, unit, name, shift) {
  const now    = Date.now();
  const cutoff = now - 48 * 60 * 60 * 1000;
  logs = logs.filter(l => l.timestamp > cutoff);
  logs.unshift({ id: now, timestamp: now, action, unit, name: name || null, shift: shift || null });
}

function checkPassword(req, res) {
  if (req.body.password !== ADMIN_PASSWORD) {
    res.status(403).json({ error: 'Incorrect password.' });
    return false;
  }
  return true;
}

// ── API ───────────────────────────────────────────────────────────────────────

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

// Add unit (still works if you ever need a temp extra unit)
app.post('/api/units', (req, res) => {
  if (!checkPassword(req, res)) return;
  const key = String(req.body.number || '').trim();
  if (!key)       return res.status(400).json({ error: 'Unit number is required.' });
  if (units[key]) return res.status(400).json({ error: 'Unit #' + key + ' already exists.' });
  units[key] = { status: 'available', name: null, shift: null, since: null };
  res.json({ ok: true });
});

// Remove unit
app.delete('/api/units/:number', (req, res) => {
  if (!checkPassword(req, res)) return;
  const key = req.params.number;
  if (!units[key]) return res.status(404).json({ error: 'Unit not found.' });
  if (units[key].status === 'checked_out')
    return res.status(400).json({ error: 'Cannot remove #' + key + ' — it is currently checked out.' });
  delete units[key];
  res.json({ ok: true });
});

// Checkout
app.post('/api/checkout', (req, res) => {
  const { number, name, shift } = req.body;
  const key = String(number || '').trim();
  const who = String(name   || '').trim();
  const sh  = String(shift  || '').trim();
  if (!key || !who) return res.status(400).json({ error: 'Name and unit number are required.' });
  if (!sh)          return res.status(400).json({ error: 'Please select a shift.' });
  if (!units[key])  return res.status(404).json({ error: 'Unit #' + key + ' not found.' });
  if (units[key].status === 'checked_out')
    return res.status(400).json({ error: 'Unit #' + key + ' is already checked out by ' + units[key].name + '.' });
  units[key] = { status: 'checked_out', name: who, shift: sh, since: new Date().toISOString() };
  addLog('checkout', key, who, sh);
  res.json({ ok: true });
});

// Return
app.post('/api/return/:number', (req, res) => {
  const key = req.params.number;
  if (!units[key]) return res.status(404).json({ error: 'Unit not found.' });
  if (units[key].status === 'available')
    return res.status(400).json({ error: 'Unit #' + key + ' is already in stock.' });
  addLog('return', key, units[key].name, units[key].shift);
  units[key] = { status: 'available', name: null, shift: null, since: null };
  res.json({ ok: true });
});

// Delete single log entry
app.post('/api/logs/:id/delete', (req, res) => {
  if (!checkPassword(req, res)) return;
  const id     = Number(req.params.id);
  const before = logs.length;
  logs = logs.filter(l => l.id !== id);
  if (logs.length === before) return res.status(404).json({ error: 'Log entry not found.' });
  res.json({ ok: true });
});

// Clear all logs
app.delete('/api/logs', (req, res) => {
  if (!checkPassword(req, res)) return;
  logs = [];
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
initUnits();
app.listen(PORT, () => console.log('Walkie Tracker running on port ' + PORT));
                
