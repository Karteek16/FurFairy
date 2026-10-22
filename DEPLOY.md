# Deploying FurFairy (Netlify + Supabase + furfairy.in)

Production architecture:

```
furfairy.in            →  Netlify  (React frontend, served statically)
furfairy.in/api/v1/*   →  Netlify Function (Fastify API, single bundled function)
Postgres               →  Supabase
Domain / DNS           →  Hostinger (points furfairy.in at Netlify)
```

Everything runs on Netlify + Supabase. Hostinger is used only for the domain/DNS.

---

## 1. Supabase — the database

1. Create a project at https://supabase.com (region closest to your users, e.g. Mumbai / `ap-south-1` if available).
2. Set a strong database password when prompted (save it).
3. Go to **Project Settings → Database → Connection string** and copy TWO strings:
   - **Transaction pooler** (port `6543`) → this is your `DATABASE_URL`.
     Make sure it ends with `?pgbouncer=true`. Add it if missing.
   - **Direct connection** (port `5432`) → this is your `DIRECT_URL`.
4. Replace `[YOUR-PASSWORD]` in both with the password from step 2.

You now have:
```
DATABASE_URL = postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL   = postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

### Run migrations + seed (from your machine, once)

In the project root, with `.env` filled in (copy from `.env.example`):

```bash
npm install
npm run prisma:generate
npm run prisma:deploy     # applies migrations to Supabase via DIRECT_URL
npm run db:seed           # creates the platform super-admin + demo data
```

> If you have no migrations yet and only a schema, run `npx prisma migrate dev --name init` locally first to create one, then `prisma:deploy` in production.

The super-admin is created from `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD`.
Set these to real values before seeding production.

---

## 2. Netlify — frontend + API

### Connect the repo
1. Push this repo to GitHub/GitLab.
2. Netlify → **Add new site → Import from Git** → pick the repo.
3. Netlify auto-detects `netlify.toml`. Confirm:
   - Build command: `npm run build:netlify`
   - Publish directory: `web/dist`
   - Functions directory: `netlify/functions`

### Set environment variables
Netlify → **Site settings → Environment variables** → add (these mirror `.env.example`):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase transaction pooler string (`:6543/...?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct string (`:5432/postgres`) |
| `JWT_ACCESS_SECRET` | long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | long random string (32+ chars) |
| `PLATFORM_ADMIN_EMAIL` | your admin email |
| `PLATFORM_ADMIN_PASSWORD` | strong password |
| `CORS_ORIGINS` | `https://furfairy.in,https://www.furfairy.in` |
| `INTEGRATION_MODE` | `sandbox` (keep sandbox until payments are ready) |

> `VITE_API_BASE` is already set to `/api/v1` in `netlify.toml`, so the frontend
> calls the API same-origin — no separate API domain needed.

### Deploy
Trigger a deploy. Netlify will:
1. `tsc` the backend → `dist/`
2. `prisma generate`
3. build the React app → `web/dist/`
4. bundle `netlify/functions/api.ts` (with the Prisma client + engine)

Verify after deploy:
- `https://<your-site>.netlify.app/health` → returns `{"status":"ok",...}`
- `https://<your-site>.netlify.app/api/v1/shops` → returns shop list JSON
- The site loads and `/admin`, `/shops/<slug>` work on refresh (SPA fallback).

---

## 3. Hostinger — point furfairy.in at Netlify

In Netlify: **Domain settings → Add a domain → `furfairy.in`**. Netlify shows the
target records. Then in **Hostinger → Domains → furfairy.in → DNS / Nameservers**:

### Option A (recommended): use Netlify DNS
Set Hostinger nameservers to the ones Netlify gives you (e.g. `dns1.p0x.nsone.net`…).
Netlify then manages all records and auto-provisions HTTPS. Simplest and most reliable.

### Option B: keep Hostinger DNS, add records manually
Add these in Hostinger's DNS zone editor:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | `75.2.60.5` (Netlify's load balancer — confirm the exact IP Netlify shows you) |
| `CNAME` | `www` | `<your-site>.netlify.app` |

> Always use the exact values Netlify displays in Domain settings; the IP above
> can change. Remove any old Hostinger A/CNAME records for `@` and `www` first.

After DNS propagates (minutes to a few hours), Netlify issues a Let's Encrypt
certificate automatically. Force HTTPS in Netlify domain settings.

---

## 4. Post-deploy checklist

- [ ] `https://furfairy.in/health` returns ok
- [ ] Sign in at `https://furfairy.in/login` with the platform admin credentials
- [ ] Super Admin can onboard a shop; it gets a slug like `furfairy.in/<slug>`
- [ ] `CORS_ORIGINS` matches the live domain exactly (no trailing slash)
- [ ] Rotate `PLATFORM_ADMIN_PASSWORD` after first login
- [ ] Keep `INTEGRATION_MODE=sandbox` until real payments are configured

## Notes & limits of the serverless model

- The Fastify instance is cached across warm invocations; expect an occasional
  cold start (first request after idle) of ~1–2s.
- Prisma uses the Supabase **pooled** connection, which is required so concurrent
  function invocations don't exhaust Postgres connections.
- `@fastify/rate-limit` counts per warm instance (in-memory), so limits are
  approximate across many concurrent cold containers. For strict global limits,
  move to a shared store later.
