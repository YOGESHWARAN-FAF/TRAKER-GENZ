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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch extra profile data if needed
                const userRef = ref(db, `users/${firebaseUser.uid}`);
                const snapshot = await get(userRef);
                let userData = snapshot.val();

                if (!userData) {
                    // Create profile if new Google Login (handled in googleLogin too but safe here)
                    userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || "Gamer",
                        photoURL: firebaseUser.photoURL || "",
                        level: 1,
                        xp: 0,
                        streak: 0,
                        joinedAt: serverTimestamp()
                    };
                    await set(userRef, userData);
                }

                setUser({ ...firebaseUser, ...userData });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            router.push("/dashboard");
        } catch (error) {
            console.error("Google Login Error", error);
            alert(error.message);
        }
    };

    const registerUser = async (email, password, name) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const userData = {
                uid: result.user.uid,
                email: email,
                displayName: name,
                photoURL: "",
                level: 1,
                xp: 0,
                streak: 0,
                joinedAt: serverTimestamp()
            };
            await set(ref(db, `users/${result.user.uid}`), userData);

            const idToken = await result.user.getIdToken();
            await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            router.push("/dashboard");
        } catch (error) {
            console.error("Register Error", error);
            throw error;
        }
    };

    const loginUser = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();

            await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            router.push("/dashboard");
        } catch (error) {
            console.error("Login Error", error);
            throw error;
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, googleLogin, registerUser, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};
