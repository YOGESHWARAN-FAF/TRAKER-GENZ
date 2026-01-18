"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { ref, set, get, serverTimestamp } from "firebase/database";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Single source of truth for Auth State
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // 1. Sync Session with Server
                try {
                    const token = await firebaseUser.getIdToken();
                    await fetch("/api/auth/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token })
                    });
                } catch (e) {
                    console.error("Session Sync Error", e);
                }

                // 2. Sync/Create User Profile in DB
                const userRef = ref(db, `users/${firebaseUser.uid}`);
                const snapshot = await get(userRef);
                let userData = snapshot.val();

                if (!userData) {
                    userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || "Gen-Z User",
                        photoURL: firebaseUser.photoURL || "",
                        level: 1,
                        xp: 0,
                        streak: 0,
                        joinedAt: serverTimestamp()
                    };
                    await set(userRef, userData);
                }

                setUser({ ...firebaseUser, ...userData });

                // 3. Redirect if on Login page
                if (window.location.pathname === '/login' || window.location.pathname === '/') {
                    router.replace("/dashboard");
                }

            } else {
                setUser(null);
                // Clear server session
                try {
                    await fetch("/api/auth/logout", { method: "POST" });
                } catch (e) { /* ignore */ }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Stable Login Function
    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // Using Popup as it's more reliable for 'fixing' issues in varied environments
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error("Google Login Error", error);
            alert("Login Failed: " + error.message);
        }
    };

    const registerUser = async (email, password, name) => {
        try {
            // Create Auth User
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Create DB Profile manually here relative to 'register' flow specific fields
            const userRef = ref(db, `users/${result.user.uid}`);
            await set(userRef, {
                uid: result.user.uid,
                email: email,
                displayName: name,
                photoURL: "",
                level: 1,
                xp: 0,
                streak: 0,
                joinedAt: serverTimestamp()
            });

            // onAuthStateChanged will handle the rest (session, redirect)
        } catch (error) {
            console.error("Register Error", error);
            throw error;
        }
    };

    const loginUser = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login Error", error);
            throw error;
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
        router.push("/login"); // Immediate Client Redirect
    };

    return (
        <AuthContext.Provider value={{ user, loading, googleLogin, registerUser, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};
