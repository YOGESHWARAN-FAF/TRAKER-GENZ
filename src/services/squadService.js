import { db } from "@/lib/firebase/client";
import { ref, push, set, update, get, remove, query, orderByChild, equalTo } from "firebase/database";

export const TASK_STATUS = {
    OPEN: 'open',
    WAITING: 'waiting_verification',
    COMPLETED: 'completed'
};

export const squadService = {
    createSquad: async (creator, name, description) => {
        const squadRef = push(ref(db, 'squads'));
        await set(squadRef, {
            id: squadRef.key,
            name,
            description,
            createdAt: Date.now(),
            members: {
                [creator.uid]: {
                    uid: creator.uid,
                    name: creator.displayName,
                    role: 'admin',
                    joinedAt: Date.now()
                }
            }
        });
        squadService.logActivity(squadRef.key, `${creator.displayName} created the squad.`);
        // Also add to user's squad list for easier querying if needed, but keeping simple for now
        return squadRef.key;
    },

    findUserByEmail: async (email) => {
        try {
            const cleanEmail = email.trim();
            const usersRef = ref(db, 'users');

            try {
                // Attempt optimized server-side search
                const q = query(usersRef, orderByChild('email'), equalTo(cleanEmail));
                const snapshot = await get(q);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const uid = Object.keys(data)[0];
                    return { uid, ...data[uid] };
                }
            } catch (indexError) {
                // Fallback: If index is missing, download snapshot and filter client-side (Prototype only)
                console.warn("Index missing, falling back to client-side search:", indexError);
                const snapshot = await get(usersRef);
                if (snapshot.exists()) {
                    const allUsers = snapshot.val();
                    const foundUid = Object.keys(allUsers).find(key => allUsers[key].email === cleanEmail);
                    if (foundUid) {
                        return { uid: foundUid, ...allUsers[foundUid] };
                    }
                }
            }

            return null;
        } catch (e) {
            console.error("Search Error:", e);
            throw new Error("Search failed: " + e.message);
        }
    },

    sendInvite: async (squadId, fromUser, toUser) => {
        // 1. Create Invite Record
        const invRef = push(ref(db, 'squadInvites'));
        const inviteData = {
            id: invRef.key,
            squadId,
            fromUid: fromUser.uid,
            fromName: fromUser.displayName,
            toUid: toUser.uid,
            toEmail: toUser.email,
            status: 'pending',
            createdAt: Date.now()
        };
        await set(invRef, inviteData);

        // 2. The "Trick": Mark request directly in user's profile for instant UI popup
        const userInviteRef = ref(db, `users/${toUser.uid}/invites/${invRef.key}`);
        await set(userInviteRef, inviteData);
    },

    acceptInvite: async (inviteId, toUser) => {
        // Read from user invites or global invites (using global for source of truth)
        const invRef = ref(db, `squadInvites/${inviteId}`);
        const snap = await get(invRef);
        if (!snap.exists()) return; // Already handled

        const invite = snap.val();

        // Add to squad
        const memberRef = ref(db, `squads/${invite.squadId}/members/${toUser.uid}`);
        await set(memberRef, {
            uid: toUser.uid,
            name: toUser.displayName,
            role: 'member',
            joinedAt: Date.now()
        });

        // Cleanup
        await remove(invRef); // Remove global invite
        await remove(ref(db, `users/${toUser.uid}/invites/${inviteId}`)); // Remove user notification

        squadService.logActivity(invite.squadId, `${toUser.displayName} joined the squad.`);
        return invite.squadId;
    },

    rejectInvite: async (inviteId, toUid) => {
        await remove(ref(db, `squadInvites/${inviteId}`));
        await remove(ref(db, `users/${toUid}/invites/${inviteId}`));
    },

    createTask: async (squadId, title, assignedToUids) => {
        const taskRef = push(ref(db, `squads/${squadId}/tasks`));
        const assignments = {};
        assignedToUids.forEach(uid => assignments[uid] = true);

        await set(taskRef, {
            id: taskRef.key,
            title,
            assignedTo: assignments,
            status: TASK_STATUS.OPEN,
            createdAt: Date.now()
        });

        squadService.logActivity(squadId, `New task created: ${title}`);
    },

    uploadProof: async (squadId, taskId, base64Image) => {
        await update(ref(db, `squads/${squadId}/tasks/${taskId}`), {
            proofImageBase64: base64Image,
            status: TASK_STATUS.WAITING
        });
        squadService.logActivity(squadId, `Proof uploaded for a task.`);
    },

    verifyTask: async (squadId, taskId, verifierUid, memberName, totalMembersCount) => {
        const verifyRef = ref(db, `squads/${squadId}/tasks/${taskId}/verifications/${verifierUid}`);
        await set(verifyRef, true);

        squadService.logActivity(squadId, `${memberName || 'Someone'} verified a task.`);

        const taskRef = ref(db, `squads/${squadId}/tasks/${taskId}`);
        const taskSnap = await get(taskRef);
        const task = taskSnap.val();

        const verifications = task.verifications ? Object.keys(task.verifications).length : 0;
        const needed = totalMembersCount > 2 ? 2 : 1;

        if (verifications >= needed) {
            await update(taskRef, { status: TASK_STATUS.COMPLETED });
            squadService.logActivity(squadId, `Task "${task.title}" completed! 🔥`);
        }
    },

    logActivity: async (squadId, text) => {
        const logRef = push(ref(db, `squads/${squadId}/activity`));
        await set(logRef, {
            id: logRef.key,
            text,
            timestamp: Date.now()
        });
    }
};
