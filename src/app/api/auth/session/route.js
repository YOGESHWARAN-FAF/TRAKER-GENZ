import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";

// Prevent multiple initializations in dev hot-reload
const getAdminApp = () => {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Note: These env vars must be set in .env.local
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        // Fallback for verification during build without keys, or handling missing keys gracefully
        console.warn("Missing Firebase Admin Keys. Session creation will fail.");
    }

    return initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        }),
    });
};

export async function POST(request) {
    try {
        const { token } = await request.json();
        const app = getAdminApp();
        const auth = getAuth(app);

        // Verify the ID token first
        const decodedToken = await auth.verifyIdToken(token);

        // Create session cookie (5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

        const response = NextResponse.json({ success: true });

        // Set cookie using next/headers
        (await cookies()).set("session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Session API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
