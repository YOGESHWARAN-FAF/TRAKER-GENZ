import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";

const getAdminApp = () => {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.warn("Missing Firebase Admin Keys.");
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

        // Verify token
        await auth.verifyIdToken(token);

        // Create session cookie (5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

        const response = NextResponse.json({ success: true });

        const isProduction = process.env.NODE_ENV === "production";

        // Set cookie with strict security policies for Vercel
        (await cookies()).set("session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: isProduction, // True in Prod (Vercel), False in Local (http)
            sameSite: "lax",
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Session API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
