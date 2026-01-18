import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("session")?.value;

    // Protect Dashboard
    if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect other internal routes
    if (!token && (req.nextUrl.pathname.startsWith("/tasks") || req.nextUrl.pathname.startsWith("/groups") || req.nextUrl.pathname.startsWith("/reports"))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Redirect Login if Authenticated
    if (token && req.nextUrl.pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/tasks/:path*", "/groups/:path*", "/reports/:path*", "/login"]
};
