# 📻 Walkie Tracker

Real-time walkie-talkie checkout tracker for your team. Accessible from any phone browser.

---

## Deploy to Render (Free, Outside Access)

### Step 1 — Put the code on GitHub
1. Create a free account at [github.com](https://github.com)
2. Create a **New Repository** (name it `walkie-tracker`, set to Public)
3. Upload all three files:
   - `server.js`
   - `package.json`
   - `public/index.html`

### Step 2 — Deploy on Render
1. Create a free account at [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub account and select the `walkie-tracker` repo
4. Fill in these settings:

| Field | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. Click **Create Web Service**
6. Wait ~2 minutes for the first deploy
7. Render gives you a public URL like: `https://walkie-tracker-xxxx.onrender.com`

**Share that URL with your team — works on any phone browser, anywhere.**

---

## ⚠ Important: Free Tier Sleep

Render's free tier **spins down after 15 minutes of inactivity** (first load after sleep takes ~30 seconds).

To keep it always awake for free, use **UptimeRobot**:
1. Go to [uptimerobot.com](https://uptimerobot.com) — free account
2. Add a new HTTP monitor pointing to your Render URL
3. Set interval to **5 minutes**

This pings your app every 5 minutes so it never sleeps during the day.

---

## How to Use

| Tab | What it does |
|---|---|
| **Dashboard** | Live overview — who has what, what's in stock |
| **Check Out** | Enter your name, pick a unit, tap Check Out |
| **Manage Units** | Add walkie-talkie numbers to the inventory, remove unused ones |

> **Note:** Data resets if the server restarts. This is by design — no logs, no database.

---

## Run Locally (optional)

```bash
npm install
npm start
# Open http://localhost:3000
```

Other devices on the same Wi-Fi can connect via your PC's local IP, e.g. `http://192.168.1.50:3000`.
