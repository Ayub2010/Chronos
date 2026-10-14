import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

let app: FirebaseApp | null = null;

/** Returns null on the server or when the Firebase env vars are missing. */
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const instance = getFirebaseApp();
  return instance ? getAuth(instance) : null;
}

export function getFirebaseDb(): Firestore | null {
  const instance = getFirebaseApp();
  return instance ? getFirestore(instance) : null;
}
