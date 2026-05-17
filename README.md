# MedTrack — Medication Tracking App

Personal medication tracker: add medications, get reminders, track adherence, and export PDF/CSV reports.

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite + Chakra UI

---

## Quick Start (Local)

### 1. Backend

```bash
cd backend
npm install          # installs helmet, express-rate-limit, date-fns-tz, etc.
cp .env.example .env # then edit .env with your values
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # default points to localhost:5000
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Deploying (for friends & family)

The stack is split: **MongoDB Atlas** (database) + **Render** (backend) + **Vercel** (frontend). All three have free tiers.

### Step 1 — MongoDB Atlas (free)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free **M0 cluster**.
3. **Database Access** → add a user with password.
4. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — fine for free-tier deploys).
5. Click **Connect → Drivers** and copy the connection string. Replace `<password>` and append `/medtrack` before the `?`:
   ```
   mongodb+srv://user:PASS@cluster0.xxxxx.mongodb.net/medtrack?retryWrites=true&w=majority
   ```

### Step 2 — Deploy backend to Render

1. Push this repo to GitHub.
2. Go to https://render.com → **New → Web Service** → connect your repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Add **Environment Variables**:
   | Key            | Value                                                      |
   |----------------|------------------------------------------------------------|
   | `MONGODB_URI`  | Your Atlas connection string from Step 1                   |
   | `JWT_SECRET`   | A long random string (run `openssl rand -hex 32` to generate) |
   | `CORS_ORIGIN`  | Your Vercel URL once you have it (e.g. `https://medtrack.vercel.app`) |
   | `NODE_ENV`     | `production`                                               |
5. Deploy. Note the URL it gives you, e.g. `https://medtrack-1.onrender.com`.
6. Visit `https://<your-backend>.onrender.com/health` — should return `{"status":"ok",...}`.

> ⚠️ Render free tier sleeps after ~15 min of inactivity. First request after sleep takes ~30s to wake up. Friends & family scale is fine.

### Step 3 — Deploy frontend to Vercel

1. Go to https://vercel.com → **Add New → Project** → import the repo.
2. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
3. Add **Environment Variable**:
   | Key             | Value                                              |
   |-----------------|----------------------------------------------------|
   | `VITE_API_URL`  | `https://<your-backend>.onrender.com/api`          |
4. Deploy.

### Step 4 — Wire CORS

Once Vercel gives you a URL (e.g. `https://medtrack.vercel.app`), go back to Render and set `CORS_ORIGIN` to that exact URL (no trailing slash). The service will redeploy automatically.

For multiple origins (e.g. preview deploys), use comma separation:
```
CORS_ORIGIN=https://medtrack.vercel.app,https://medtrack-git-main-yourname.vercel.app
```

### Step 5 — Email reminders (free, via Gmail)

MedTrack sends reminder emails ~5–15 minutes before each scheduled dose. Setup is two parts: **Gmail App Password** + **external cron pinger**.

#### 5a. Get a Gmail App Password

1. Use the Gmail account you want reminders sent **from** (often your own).
2. Enable 2-Step Verification: https://myaccount.google.com/security
3. Generate an App Password: https://myaccount.google.com/apppasswords
   - App: "Mail", Device: "Other" → name it "MedTrack".
   - Google will show a 16-character password (e.g. `abcd efgh ijkl mnop`). Copy it **with no spaces**.
4. In Render → Environment, set:

   | Key                  | Value                                          |
   |----------------------|------------------------------------------------|
   | `EMAIL_USER`         | `your-gmail@gmail.com`                         |
   | `EMAIL_APP_PASSWORD` | the 16-char app password (no spaces)           |
   | `EMAIL_FROM`         | `MedTrack <your-gmail@gmail.com>` *(optional)* |
   | `CRON_SECRET`        | long random string (`openssl rand -hex 32`)    |

   Gmail's free SMTP allows ~500 outgoing messages per day — plenty for friends & family.

#### 5b. Trigger the cron from outside Render (free)

Render's free dyno sleeps after ~15 min idle, so an internal scheduler is unreliable. We instead let an external service ping a protected endpoint every few minutes — this **wakes the dyno** *and* runs the reminder check.

Use **cron-job.org** (free, no credit card):

1. Go to https://cron-job.org → sign up → **Create cronjob**.
2. **URL**:
   ```
   https://<your-backend>.onrender.com/api/cron/tick?secret=YOUR_CRON_SECRET
   ```
   Replace `YOUR_CRON_SECRET` with the value you set in Render.
3. **Schedule**: every 5 minutes.
4. **Save**. It should start showing 200 OK responses.

Alternative pingers: UptimeRobot (5-min minimum, free) or a GitHub Actions workflow with `schedule: cron: '*/5 * * * *'` and a `curl` step.

#### What the cron endpoint does

`GET /api/cron/tick` (header `x-cron-secret` OR `?secret=...`) — updates past-due doses to `late`/`missed` and emails reminders for doses scheduled in the next 15 minutes. Idempotent: each dose only gets one reminder (tracked via `reminderSentAt`).

> ⚠️ **Reminder accuracy**: with a 5-min ping interval and 15-min look-ahead window, reminders arrive 5–20 minutes before the scheduled dose time. Fine for medications; not suitable for second-precision alerts.

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable             | Required           | Description                                                   |
|----------------------|--------------------|---------------------------------------------------------------|
| `MONGODB_URI`        | yes                | MongoDB connection string                                     |
| `JWT_SECRET`         | yes                | Secret for signing JWTs (min 32 random chars)                 |
| `CORS_ORIGIN`        | prod               | Comma-separated allowed frontend origins                      |
| `FRONTEND_URL`       | for password reset | Public frontend URL (used in reset-password emails)           |
| `EMAIL_USER`         | for reminders      | Gmail address sending reminders                               |
| `EMAIL_APP_PASSWORD` | for reminders      | Gmail App Password (16 chars, no spaces)                      |
| `EMAIL_FROM`         | no                 | "From" header, defaults to `MedTrack <EMAIL_USER>`            |
| `CRON_SECRET`        | for reminders      | Secret required to call `/api/cron/*` endpoints               |
| `PORT`               | no                 | Defaults to `5000` (Render sets this automatically)           |
| `NODE_ENV`           | no                 | Set to `production` in production                             |

### Frontend (`frontend/.env`)
| Variable        | Required | Description                                                 |
|-----------------|----------|-------------------------------------------------------------|
| `VITE_API_URL`  | yes (prod) | Backend API base URL ending in `/api`                     |

---

## API Endpoints

### Auth
- `POST /api/auth/register` — register (body: `{ email, password, name, timezone? }`)
- `POST /api/auth/login` — login
- `GET  /api/auth/me` — get current user
- `PATCH /api/auth/me` — update profile (`name`, `timezone`, `notificationsEnabled`)
- `POST /api/auth/forgot-password` — request reset link (body: `{ email }`)
- `POST /api/auth/reset-password` — set new password (body: `{ token, password }`)

### Medications
- `GET    /api/medications` — list
- `POST   /api/medications` — create
- `PUT    /api/medications/:id` — update
- `DELETE /api/medications/:id` — delete

### Doses
- `GET  /api/doses/upcoming` — upcoming doses
- `GET  /api/doses/today` — today's doses
- `POST /api/doses/:id/take` — mark taken
- `GET  /api/doses/stats` — adherence stats
- `GET  /api/doses/medication/:medicationId/stats` — per-medication stats

### Reports
- `GET /api/reports/pdf` — PDF report
- `GET /api/reports/csv` — CSV report

### Health
- `GET /health` — uptime / health check

### Cron (protected by `CRON_SECRET`)
- `GET /api/cron/tick` — update statuses + send pending reminders (one-shot)
- `GET /api/cron/check-reminders` — only send reminders
- `GET /api/cron/update-statuses` — only mark past-due doses late/missed
- `GET /api/cron/test-email?to=you@example.com` — send a one-off test email to verify SMTP setup

Pass the secret as header `x-cron-secret: <value>` or query `?secret=<value>`.

**Verify your email setup right after deploy:**
```
https://<your-backend>.onrender.com/api/cron/test-email?secret=YOUR_CRON_SECRET&to=you@example.com
```
A 200 with `{ ok: true }` means SMTP is working. Check the inbox.

---

## License

MIT
