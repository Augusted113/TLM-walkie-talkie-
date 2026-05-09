const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory state ──────────────────────────────────────────────────────────
// units: { [number]: { status: 'available' | 'checked_out', name: string|null, since: string|null } }
let units = {};

// ── API ──────────────────────────────────────────────────────────────────────

// Get full state
app.get('/api/state', (req, res) => {
  res.json(units);
});

// Add a walkie-talkie unit
app.post('/api/units', (req, res) => {
  const { number } = req.body;
  const key = String(number || '').trim();
  if (!key) return res.status(400).json({ error: 'Unit number is required.' });
  if (units[key]) return res.status(400).json({ error: `Unit #${key} already exists.` });
  units[key] = { status: 'available', name: null, since: null };
  res.json({ ok: true });
});

// Remove a unit (only if available)
app.delete('/api/units/:number', (req, res) => {
  const key = req.params.number;
  if (!units[key]) return res.status(404).json({ error: 'Unit not found.' });
  if (units[key].status === 'checked_out')
    return res.status(400).json({ error: `Cannot remove #${key} — it is currently checked out.` });
  delete units[key];
  res.json({ ok: true });
});

// Checkout a unit
app.post('/api/checkout', (req, res) => {
  const { number, name } = req.body;
  const key = String(number || '').trim();
  const who = String(name || '').trim();
  if (!key || !who) return res.status(400).json({ error: 'Name and unit number are required.' });
  if (!units[key]) return res.status(404).json({ error: `Unit #${key} not found.` });
  if (units[key].status === 'checked_out')
    return res.status(400).json({ error: `Unit #${key} is already checked out by ${units[key].name}.` });
  units[key] = { status: 'checked_out', name: who, since: new Date().toISOString() };
  res.json({ ok: true });
});

// Return a unit
app.post('/api/return/:number', (req, res) => {
  const key = req.params.number;
  if (!units[key]) return res.status(404).json({ error: 'Unit not found.' });
  if (units[key].status === 'available')
    return res.status(400).json({ error: `Unit #${key} is already in stock.` });
  units[key] = { status: 'available', name: null, since: null };
  res.json({ ok: true });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Walkie Tracker running on http://localhost:${PORT}`);
});
