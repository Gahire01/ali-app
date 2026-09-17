# ALI Boxing Club — Deployment Checklist

Check every box before shipping. Links and commands reference the matching
sections in `README.md`.

## 0. Project hygiene
- [ ] `git init` and commit after every block (the repo should never be unversioned).
- [ ] `.env.local` exists locally and is in `.gitignore` — never committed.
- [ ] `npm install` runs clean with no errors.

## 1. Supabase project
- [ ] Create a project at https://supabase.com/dashboard (region near users, e.g. `africa-south1`).
- [ ] Save the Database Password securely (not in the repo).
- [ ] Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL` in `.env.local`.
- [ ] Copy **anon key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
- [ ] `npx supabase login` and `npx supabase link --project-ref <ref>` succeed.

## 2. Database migrations
- [ ] `npx supabase db push` applies `supabase/migrations/0001` → `0005` with no errors.
- [ ] Verify tables: `profiles`, `training_sessions`, `attendance`, `posts`, `media`, `likes`,
      `announcements`, `device_tokens`, `conversations`, `conversation_members`, `messages`,
      `fighter_cards`.
- [ ] Confirm **RLS is enabled on every table** (Dashboard → Table Editor → RLS is ON everywhere).
- [ ] Confirm the `handle_new_user()` trigger fires on `auth.users` insert (register a test account;
      a `status='pending'` row is auto-created).
- [ ] Make sure `0005_email_webhook.sql` created the `auth.users` INSERT webhook that calls
      `on-new-user`.

## 3. Email — Gmail SMTP (app password)
- [ ] Google Account → Security → 2-Step Verification is **on**.
- [ ] Create an **App Password** (Security → App Passwords) and copy it.
- [ ] Supabase → Authentication → SMTP Settings: **Enable SMTP**.
- [ ] Sender = `gahiredev01@gmail.com`, Sender name = `ALI Boxing Club`, Host = `smtp.gmail.com`,
      Port = `465`, Username = `gahiredev01@gmail.com`, Password = the app password. Save.
- [ ] **Do not commit the app password anywhere** — it lives only in the Supabase dashboard.
- [ ] Authentication → Email Templates: confirm signup / invitation copy is club-branded
      ("ALI Boxing Club", "Train Like a Champion").

## 4. Edge Functions
- [ ] Deploy all three:
      ```bash
      npx supabase functions deploy on-new-user
      npx supabase functions deploy on-approval
      npx supabase functions deploy send-push
      ```
- [ ] Set secrets:
      ```bash
      npx supabase secrets set RESEND_API_KEY=re_...
      npx supabase secrets set MAIL_TO_ADMIN=gahiredev01@gmail.com
      npx supabase secrets set FROM_EMAIL=club@aliboxing.vercel.app
      ```
- [ ] Register a throwaway account → `on-new-user` sends "New registration" to
      `gahiredev01@gmail.com` (check spam too).
- [ ] Approve that account from the app → the user receives the approval email
      and the "You're in." push notification.

## 5. Google OAuth
- [ ] Google Cloud Console: consent screen created (app name "ALI Boxing Club", scopes =
      email + profile **only**).
- [ ] Three OAuth client IDs created (Web / Android / iOS) with correct redirect URIs and
      package/bundle `rw.aliboxing.club`.
- [ ] Client IDs pasted into Supabase → Authentication → Providers → Google (Web client ID +
      secret), and into `.env.local` (web/ios/android client IDs).
- [ ] Sign in with Google from a device/build → works and creates a `pending` profile.

## 6. Deep links
- [ ] Supabase → Authentication → URL Configuration:
      add `aliboxing://auth/callback` to the Redirect URLs allow list.

## 7. Seed the admin
- [ ] Register `gahiredev01@gmail.com` in the app (or keep the account used in step 4/5).
- [ ] Run `supabase/migrations/0004_seed.sql` (SQL Editor):
      `update public.profiles set role = 'admin', status = 'approved' where email = 'gahiredev01@gmail.com';`
- [ ] Log out, log back in — the **Dashboard** tab now appears.

## 8. Crash reporting
- [ ] Create a React Native project at https://sentry.io (org + project).
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN` in `.env.local` and in EAS secrets for production builds.
- [ ] Force a test error in a dev build and confirm it appears in Sentry.

## 9. EAS build
- [ ] `npm i -g eas-cli` and `eas login`.
- [ ] `eas build:configure` succeeds (reads the `eas.json` already in the repo).
- [ ] Set env vars for cloud builds (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
      `EXPO_PUBLIC_SENTRY_DSN`, plus Google client IDs) in the **EAS dashboard → Environment variables**
      or via `eas env:create`. Do **not** put the service role key or the Gmail app password here.
- [ ] Development build: `eas build --platform all --profile development` — installs and runs.
- [ ] Production build: `eas build --platform all --profile production` — succeeds for iOS + Android.

## 10. Expo Go smoke test (final QA)
- [ ] `npx expo start` — app boots (`npm start` works).
- [ ] Register → pending screen → approved seed account → tabs appear.
- [ ] Feed: staff can post (text + image); players can like. No comments/pinning (V1 scope).
- [ ] Training: create session, mark Present/Absent/Late, close session auto-flags absent.
- [ ] Chat: 1:1 and group, send/receive in realtime, read receipts, member add/remove.
- [ ] Dashboard: pending approvals (approve w/ category / reject), player edit, stats,
      broadcast with Training Now / Reminder / Urgent / Announcement presets, fighter card.
- [ ] Profile: coach-assigned fields read-only, fighter card shown, sign out clears session.
- [ ] Test on a small phone (SE), a large phone (Pro Max), and a tablet; keyboard + safe areas OK.

## 11. Store submission
- [ ] `eas submit --platform all` (production profile).
- [ ] **Google Play Console**: registered ($25), app created, content rating + data safety filled.
- [ ] App Store Connect: registered ($99/year), app record + bundle id `rw.aliboxing.club` set.
- [ ] Screenshots, icons, and splash use the ALI Boxing Club logo; brand colors match the app.
- [ ] Privacy policy covers phone, email, DOB, guardian info, and push notifications.

## 12. After launch
- [ ] Monitor Sentry for new issues after the first week.
- [ ] Confirm the `on-new-user` approval emails arrive reliably (alert the coach if not).