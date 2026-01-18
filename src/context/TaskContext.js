"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext'; // Next.js absolute import
import { db } from '@/lib/firebase/client';
import { ref, onValue, off } from 'firebase/database';
import { taskService } from '@/services/taskService'; // Services
import { groupService } from '@/services/groupService';
import { format } from 'date-fns';

export const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    const todayKey = format(new Date(), 'yyyy-MM-dd');

    // Realtime Tasks Listener
    useEffect(() => {
        if (!user) {
            setTasks([]);
            return;
        }

        const tasksRef = ref(db, `tasks/${user.uid}/${todayKey}`);
        const unsubscribe = onValue(tasksRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setTasks(Object.values(data));
            } else {
                setTasks([]);
            }
            setLoadingTasks(false);
        });

        return () => off(tasksRef);
    }, [user, todayKey]);

    // Realtime Groups Listener
    useEffect(() => {
        if (!user) return;

        const groupsRef = ref(db, 'groups');
        const unsubscribe = onValue(groupsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const allGroups = Object.keys(data).map(key => ({ ...data[key], id: key }));
                // Filter groups where user is a member
                const myGroups = allGroups.filter(g => g.members && g.members[user.uid]);

                // Process tasks array for each group
                const processedGroups = myGroups.map(g => ({
                    ...g,
                    tasks: g.tasks ? Object.values(g.tasks) : [],
                    memberNames: Object.values(g.members).map(m => m.name)
                }));
                setGroups(processedGroups);
            } else {
                setGroups([]);
            }
        });
        return () => off(groupsRef);
    }, [user]);

    const addTask = async (text) => {
        if (tasks.length >= 7) return false;
        await taskService.createDailyTask(user.uid, text);
        return true;
    };

    const toggleTask = async (taskId, currentStatus) => {
        await taskService.markTaskComplete(user.uid, taskId, !currentStatus);
    };

    const createGroup = async (name, memberNames) => {
        // For prototype, memberNames are just strings. 
        // We only strictly link the creator.
        await groupService.createGroup(name, user, memberNames);
    };

    const addGroupTask = async (groupId, text, assignedTo) => {
        await groupService.addGroupTask(groupId, text, assignedTo);
    };

    const completeGroupTask = async (groupId, taskId, proof) => {
        await groupService.completeGroupTask(groupId, taskId, proof);
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            loadingTasks,
            addTask,
            toggleTask,
            groups,
            createGroup,
            addGroupTask,
            completeGroupTask,
            user // Export user here too for convenience
        }}>
            {children}
        </TaskContext.Provider>
    );
};
