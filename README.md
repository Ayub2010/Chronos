# Chronos

Visual time audit for a 24-hour day, split into forty-eight 30-minute blocks.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase keys you can still use **Continue on this device**. Data stays in `localStorage`.

## Cloud sync (Supabase + Google)

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In SQL Editor, run `supabase/migrations/001_chronos_state.sql`, then `supabase/migrations/002_chronos_state_delete_policy.sql` (enables Erase all data).
4. Enable Google under Authentication → Providers.
5. Add redirect URL: `http://localhost:3000/auth/callback` (and your production origin).

Row-level security allows each user to select, insert, update, and delete only their own `chronos_state` row.

## Efficiency score

`productive hours / (productive hours + friction hours) × 100%`

Neutral categories (sleep, meals, downtime) are excluded.
