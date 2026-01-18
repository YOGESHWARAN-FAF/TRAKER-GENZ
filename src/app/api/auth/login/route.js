import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(request) {
    try {
        const { idToken } = await request.json();
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

        if (!adminAuth) {
            return NextResponse.json({ error: "Admin not initialized" }, { status: 500 });
        }

        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json({ success: true });
        response.cookies.set("__session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/"
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
