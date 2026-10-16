# Chronos

Visual time audit for a 24-hour day, split into forty-eight 30-minute blocks.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Firebase config you can still use **Continue on this device**. Data stays in `localStorage`.

## Cloud sync (Firebase + Google)

1. Create a Firebase project and add a Web app. Copy its config into `.env.local` using the keys in `.env.example`.
2. Authentication → Sign-in method → enable **Google**.
3. Authentication → Settings → Authorized domains: make sure `localhost` is listed (and your production domain).
4. Create a Firestore database, then publish the rules in `firestore.rules`:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
   (or paste the file into Firestore → Rules).

Sync stores one document per user at `chronos_state/{uid}`. The rules allow each signed-in user to read and write only the document whose ID matches their own uid.

Firebase web config values are public identifiers; access control comes from the security rules.

## Deploy to Netlify

The site is a static export (`output: "export"`) and is hosted on Netlify. Firebase is still used for Google sign-in and Firestore; only hosting moved.

1. Import this repo in Netlify. `netlify.toml` sets the build command (`npm run build`), publish directory (`out`), and Node 22.
2. Site configuration → Environment variables: add `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`. These are baked in at build time, so redeploy after changing them.
3. Firebase console → Authentication → Settings → Authorized domains: add your Netlify domain (`*.netlify.app` URL or custom domain).

## Efficiency score

`productive hours / (productive hours + friction hours) × 100%`

Neutral categories (sleep, meals, downtime) are excluded.
