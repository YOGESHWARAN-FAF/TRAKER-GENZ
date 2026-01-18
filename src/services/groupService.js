import { db } from "@/lib/firebase/client";
import { ref, push, set, update, get } from "firebase/database";

export const groupService = {
    createGroup: async (name, creatorUser, memberNames) => {

        // Construct members object
        const membersData = {
            [creatorUser.uid]: { name: creatorUser.displayName, role: 'admin' }
        };

        memberNames.forEach((mName, idx) => {
            membersData[`guest_${Date.now()}_${idx}`] = { name: mName, role: 'member' };
        });

        const groupRef = push(ref(db, `groups`));
        await set(groupRef, {
            id: groupRef.key,
            name,
            members: membersData,
            createdAt: Date.now()
        });
        return groupRef.key;
    },

    addGroupTask: async (groupId, text, assignedTo = "Anyone") => {
        const taskRef = push(ref(db, `groups/${groupId}/tasks`));
        await set(taskRef, {
            id: taskRef.key,
            text,
            assignedTo,
            completed: false,
            createdAt: Date.now()
        });
    },

    // Simplified to store Base64 directly in DB, explicit naming
    completeGroupTask: async (groupId, taskId, proofImageBase64) => {
        await update(ref(db, `groups/${groupId}/tasks/${taskId}`), {
            completed: true,
            proofImageBase64: proofImageBase64,  // Using specific key requested
            proof: proofImageBase64,             // Keeping legacy key if UI uses it, or just use one. I'll duplicate to be safe.
            completedAt: Date.now()
        });
    }
};
