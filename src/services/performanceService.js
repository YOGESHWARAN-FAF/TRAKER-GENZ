import { db } from "@/lib/firebase/client";
import { ref, get } from "firebase/database";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export const performanceService = {
    getWeeklyStats: async (userId) => {
        // In a real app with huge data, we'd aggregate this on the server/Cloud Functions.
        // For this prototype, we'll fetch the last 7 days of tasks.
        const weeklyData = [];
        const today = new Date();

        // Simple 7-day loop
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateKey = format(d, 'yyyy-MM-dd');

            const snap = await get(ref(db, `tasks/${userId}/${dateKey}`));
            const tasks = snap.val() ? Object.values(snap.val()) : [];

            weeklyData.push({
                name: format(d, 'EEE'),
                completed: tasks.filter(t => t.completed).length,
                total: tasks.length,
                missed: tasks.filter(t => !t.completed).length
            });
        }
        return weeklyData;
    },

    getStatsSummary: async (userId) => {
        const snap = await get(ref(db, `users/${userId}`));
        return snap.val() || { xp: 0, streak: 0, level: 1 };
    }
};
