import admin from 'firebase-admin';

if (!admin.apps.length) {
    // Use environment variables for service account if available, 
    // or default Google Cloud discovery if running in an environment that supports it.
    // For standard usage without a service account JSON file in env, we might need a workaround for local dev.
    // However, `admin.credential.applicationDefault()` often works if user is logged in via gcloud.
    // If not, we might be blocked. But the user asked for "Firebase Realtime Database" + "Server Actions".
    // Best practice is `GOOGLE_APPLICATION_CREDENTIALS` env var.

    // Since we don't have the explicit service json in the prompt's env list, 
    // I will assume standard initialization or use partial env vars if I had them.
    // For now, I'll initialize with no arguments which works in many cloud environments or throw a warning.
    // Actually, for local dev without a key, it's tricky. 
    // I'll try to use the public config as a fallback/placeholder or rely on ADC.

    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
        });
    } catch (e) {
        console.warn("Firebase Admin Init Error (Local Dev may need Service Account):", e);
        // Fallback for purely local testing without Admin privs if possible? 
        // No, Admin SDK needs privs.
    }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.database() : null;
