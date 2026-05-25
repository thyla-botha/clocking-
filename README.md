# Clockify

Time tracker with location capture on clock-in and clock-out. Next.js (App Router) + Supabase.

## Features

- Email + password login (no public signup — admin creates all accounts)
- Clock in / clock out with browser geolocation (lat/lng/accuracy)
- One open entry per user, enforced at the DB layer via a unique partial index
- Notes on the open entry (auto-save) and shown in the entries list
- CSV export (user dashboard + admin)
- **Admin panel** with full user management (create users, mark as admin), all-user entry view, force-close stuck entries
- Auto-close stale entries (hourly Vercel cron, default threshold 16 hours)
- Installable PWA (add to home screen)

## Roles & routing

- **Normal user** lands on `/dashboard`. Sees their own entries only. No admin UI visible at all.
- **Admin** lands on `/admin`. Sees user management, everyone's entries, open entries. Can also click **My time** to use `/dashboard` and clock themselves in.

## Setup

### 1. Supabase project

1. Create a project at https://supabase.com.
2. In the SQL editor, run [supabase/schema.sql](supabase/schema.sql). Safe to re-run.
3. In **Authentication → Providers → Email**:
   - Enable **Email** provider.
   - **Disable** "Confirm email" (users are created by an admin with confirmed emails).
4. In **Authentication → Sign In / Up** (or "Settings" depending on dashboard version):
   - **Disable signups**. Only admins should create users. (If you can't find this toggle, it's fine — the app doesn't expose a signup form anyway.)
5. In **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (and your prod URL once deployed).

### 2. Env

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from **Project Settings → API**.
- `SUPABASE_SERVICE_ROLE_KEY` — also from **Project Settings → API** (the `service_role` key). Server-only.
- `CRON_SECRET` — any long random string. Used to authenticate the auto-close cron.

### 3. Run

```bash
npm install
npm run dev
```

### 4. Create your first admin (bootstrap)

The app's user-creation form requires an admin to be signed in, so the first admin must be created manually.

1. In Supabase dashboard → **Authentication → Users** → **Add user → Create new user**. Enter your email and a password. Tick **Auto-confirm user**.
2. In the SQL editor:
   ```sql
   update profiles set is_admin = true where email = 'you@example.com';
   ```
3. Visit http://localhost:3000/login, sign in, and you'll land on `/admin`.
4. Use the **Create user** form to add everyone else.

## How it works

### Clock in / out
- The browser asks for location permission. If denied, the action is blocked.
- Location coords + accuracy are written to `time_entries`.
- The unique partial index `time_entries_one_open_per_user` prevents a second open entry; the UI also detects the `23505` duplicate error and shows a friendly message.

### Auto-close stale entries
- A Vercel cron hits `GET /api/cron/close-stale` every hour (see [vercel.json](vercel.json)).
- Any entry open longer than `STALE_HOURS` (default 16) is closed with `end_at = now()`, `auto_closed = true`, and a `[auto-closed …]` line appended to its notes.
- The cron uses the service-role key (bypasses RLS, since it operates across all users).
- Local dev: trigger manually with
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/close-stale
  ```

### Admin user creation
- `POST /api/admin/users` — gated by an `is_admin` check on the calling user.
- Uses the service-role client to call `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
- Sets `is_admin` on the new profile if the form checkbox is ticked.

### PWA
- Manifest at [public/manifest.webmanifest](public/manifest.webmanifest), minimal service worker at [public/sw.js](public/sw.js), icon at [public/icon.svg](public/icon.svg).
- On Android/desktop Chrome you'll get an install prompt. On iOS Safari, users can "Add to Home Screen" manually.
- The service worker does **not** cache app shell or data — stale time-tracking data would be worse than a network failure. The SW exists only to make the app installable.
- For full iOS install polish, generate PNG icons (192 and 512) from the SVG and drop them in `public/`:
  ```bash
  # one option, using rsvg-convert (brew install librsvg)
  rsvg-convert -w 192 -h 192 public/icon.svg -o public/icon-192.png
  rsvg-convert -w 512 -h 512 public/icon.svg -o public/icon-512.png
  ```

### Geolocation gotchas
- Requires HTTPS in production. `localhost` is exempt.
- Some browsers re-prompt for permission every session. Nothing the app can do.
- Accuracy varies wildly indoors. The accuracy value (in metres) is stored alongside the coords.

## Schema notes

- `profiles` mirrors `auth.users` (a trigger inserts a row on signup) and carries `is_admin`.
- `is_admin()` is a `security definer` SQL function — RLS policies call it to avoid recursive policy evaluation against `profiles`.
- Projects are shared across all authenticated users in this MVP. Add more directly in Supabase, or extend `projects` with `user_id` / org logic later.

## Deploying to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Set all four env vars from `.env.local.example` in **Project Settings → Environment Variables**.
3. Vercel reads [vercel.json](vercel.json) and registers the hourly cron automatically (hobby tier supports one cron). It sends `Authorization: Bearer $CRON_SECRET` to the route.
4. After deploy, in Supabase → Authentication → URL Configuration, set the Site URL to your Vercel URL.

## Demo mode

For a quick UI walkthrough without setting up Supabase, visit `/demo`. It renders the dashboard and admin views with mock data. Buttons are inert — nothing persists.
