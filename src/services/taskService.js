import { db } from "@/lib/firebase/client";
import { ref, update, push, set, remove, get } from "firebase/database";
import { format } from "date-fns";

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

export const taskService = {
    createDailyTask: async (userId, text) => {
        const today = getTodayKey();
        const taskRef = push(ref(db, `tasks/${userId}/${today}`));
        await set(taskRef, {
            id: taskRef.key,
            text,
            completed: false,
            createdAt: Date.now()
        });
        return taskRef.key;
    },

    markTaskComplete: async (userId, taskId, completed = true) => {
        const today = getTodayKey();
        await update(ref(db, `tasks/${userId}/${today}/${taskId}`), {
            completed
        });

        // Potentially handle XP/Streak here or via Cloud Functions/Triggers
        // For simplicity, we update XP directly on client or via separate service call
        if (completed) {
            // Optimistic update of user stats
            const userRef = ref(db, `users/${userId}`);
            const snap = await get(userRef);
            const u = snap.val();
            if (u) {
                const newXp = (u.xp || 0) + 10;
                await update(userRef, { xp: newXp });
            }
        }
    },

    // Reset logic is server-side usually, but client can check "lastReset" date
};
