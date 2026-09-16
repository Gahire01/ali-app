# ALI Boxing Club — Member Mobile App

Private member mobile app for ALI Boxing Club, Kigali, Rwanda.

> Train Like a Champion.

---

## Quick Start

```bash
# 1 — install dependencies
npm install

# 2 — create env file (fill in values — see Supabase Setup below)
cp .env.example .env.local

# 3 — run the app
npx expo start
```

---

## Supabase Setup (Step-by-Step)

1. **Create a Supabase project**
   - Go to https://supabase.com/dashboard → New Project.
   - Set **Database Password** (save it securely).
   - Pick the region closest to your users (GCP `africa-south1` or `europe-west1` work well).
   - Leave **Enable email logins** on (we use email/password auth).

2. **Get your Project URL and Anon Key**
   - After the project is created, open **Project Settings → API**.
   - Copy **Project URL** → paste into `.env.local` as `EXPO_PUBLIC_SUPABASE_URL`.
   - Copy **anon / publishable** key → paste into `.env.local` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

3. **Run the migrations**
   - Install Supabase CLI if you haven't:
     ```bash
     npm i supabase --save-dev
     ```
   - Link your project (one time):
     ```bash
     npx supabase link --project-ref <your-project-ref>
     ```
     (The project ref is in your project URL: `https://<project-ref>.supabase.co`.)
   - Push all migrations in order:
     ```bash
     npx supabase db push
     ```
   - Alternatively, open the **Supabase Dashboard → SQL Editor** and paste each file from
     `supabase/migrations/` in order (0001 through 0005).

4. **Deploy the Edge Functions**
   ```bash
   npx supabase functions deploy on-new-user
   npx supabase functions deploy on-approval
   npx supabase functions deploy send-push
   ```

5. **Set Edge Function secrets** (Dashboard → Edge Functions → Secrets, or via CLI):
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_your_key_here
   npx supabase secrets set MAIL_TO_ADMIN=gahiredev01@gmail.com
   npx supabase secrets set FROM_EMAIL=club@aliboxing.vercel.app
   ```
   > `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
   > injected automatically.

6. **Seed the admin account**
   - Run `npx expo start`, register the account `gahiredev01@gmail.com` with any password.
   - After registering, go to **Dashboard → SQL Editor** and run:
     ```sql
     -- 0004_seed.sql
     update public.profiles
     set role = 'admin', status = 'approved'
     where email = 'gahiredev01@gmail.com';
     ```
   - You are now the first admin. Log out and log back in. The Dashboard tab will appear.

---

## Gmail SMTP Setup (Transactional Emails)

Supabase uses its own SMTP relay by default, which works out of the box for
low volume and shows emails as "from Supabase". To use your own Gmail address
as the sender:

1. In your Google Account, go to **Security → 2-Step Verification → App Passwords**.
   Create a new app password and copy it.
2. In Supabase Dashboard → **Project Settings → Authentication → SMTP Settings**:
   - Toggle **Enable SMTP** on.
   - Set **Sender email** to `gahiredev01@gmail.com`.
   - Set **Sender name** to `ALI Boxing Club`.
   - Set **Host** to `smtp.gmail.com`, **Port** to `465`.
   - Set **Username** to `gahiredev01@gmail.com`.
   - Paste the **App Password** you just generated.
   - Click Save.
3. Still in **Authentication → Email Templates**, update the confirmation email
   to use club-branded copy. The "From" name shows as "ALI Boxing Club".

---

## Google OAuth Setup

1. In [Google Cloud Console](https://console.cloud.google.com), create an OAuth consent screen.
   - Set app name to "ALI Boxing Club".
   - Add your email as a test user.

2. Create **three** OAuth 2.0 Client IDs under **Credentials → Create Credentials → OAuth client ID**:
   - **Web application**: use `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
   - **Android**: set package name to `rw.aliboxing.club`, and paste your app's SHA-1 signing certificate.
   - **iOS**: set bundle ID to `rw.aliboxing.club`.

3. Paste the client IDs into `.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

4. In Supabase Dashboard → **Authentication → Providers → Google**:
   - Toggle it **on**.
   - Paste the **Web client ID** and **Client Secret**.

---

## Supabase Redirect / Deep-Link Allow List

Add `aliboxing://auth/callback` to the list in:
**Authentication → URL Configuration → Redirect URLs**

---

## EAS Build Setup

1. Install EAS CLI:
   ```bash
   npm i -g eas-cli
   ```

2. Create an Expo account at https://expo.dev, then log in:
   ```bash
   eas login
   ```

3. Configure EAS in your project:
   ```bash
   eas build:configure
   ```
   (This reads the `eas.json` already in the repo.)

4. Build for both platforms:
   ```bash
   eas build --platform all --profile production
   ```

5. Submit to the stores:
   ```bash
   eas submit --platform all
   ```
   - **Google Play Console**: Follow the setup wizard on first submit. You'll need a developer account ($25).
   - **App Store Connect**: Follow the setup wizard. You'll need an Apple Developer account ($99/year).

---

## Environment Variables Reference

| Variable | Where to put it | Notes |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.local` (local) / EAS env (build) | Project URL from Supabase Dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / EAS env | Anon key from Supabase Dashboard |
| `EXPO_PUBLIC_SENTRY_DSN` | `.env.local` / EAS env | Create a React Native project in Sentry |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `.env.local` / EAS env | Google Cloud Console OAuth |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | `.env.local` / EAS env | Google Cloud Console OAuth |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | `.env.local` / EAS env | Google Cloud Console OAuth |
| `RESEND_API_KEY` | Supabase Edge Function Secrets | From resend.com API keys |
| `MAIL_TO_ADMIN` | Supabase Edge Function Secrets | Defaults to gahiredev01@gmail.com |
| `FROM_EMAIL` | Supabase Edge Function Secrets | Defaults to club@aliboxing.vercel.app |

> **NEVER** commit `.env.local` or hardcode the Supabase service role key
> anywhere in the app code.

---

## Project Structure

```
├── app.json
├── eas.json
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   ├── 0002_rls.sql
│   │   ├── 0003_storage.sql
│   │   ├── 0004_seed.sql
│   │   └── 0005_email_webhook.sql
│   └── functions/
│       ├── _shared/cors.ts
│       ├── on-new-user/index.ts
│       ├── on-approval/index.ts
│       └── send-push/index.ts
├── src/
│   ├── app/            # Expo Router screens
│   ├── components/     # Reusable UI components
│   ├── constants/      # Brand design tokens
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client, utilities
│   └── types/          # TypeScript types (Supabase schema)
└── .env.example
```

---

## Brand Design Tokens

| Token | Value |
|---|---|
| Background | `#0b0b0b` |
| Panel | `#161616` |
| Primary accent | `#b71c1c` |
| Gold / secondary | `#d6a83d` |
| Text | `#f7f5f0` |
| Muted | `#8f8d88` |
| Success | `#75b798` |
| Error | `#e57373` |
| Card radius | 12px |
| Input radius | 14px |
| Pill radius | 30px |

---

## License

Private — ALI Boxing Club internal use only.
