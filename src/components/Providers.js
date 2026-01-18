"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TaskProvider } from "@/context/TaskContext";

export function Providers({ children }) {
    return (
        <AuthProvider>
            <TaskProvider>
                {children}
            </TaskProvider>
        </AuthProvider>
    );
}
