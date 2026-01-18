"use client";
import { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Plus, CheckCircle, Circle, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function DailyTasks() {
    const { tasks, addTask, toggleTask, loadingTasks } = useTasks();
    const [newTask, setNewTask] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const { width, height } = useWindowSize(); // Client side only hook

    const completedCount = tasks.filter(t => t.completed).length;
    const isAllDone = tasks.length > 0 && completedCount === tasks.length;

    useEffect(() => {
        if (isAllDone) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isAllDone]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const success = await addTask(newTask);
        if (success) {
            setNewTask('');
        } else {
            alert("Bot limit reached! Max 7 tasks only. 🛑");
        }
    };

    if (loadingTasks) {
        return <div className="p-10 text-center animate-pulse">Loading grind...</div>;
    }

    return (
        <div className="p-6 space-y-6 pb-24 relative min-h-screen">
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <header className="flex justify-between items-end">
                <h1 className="text-4xl font-black italic tracking-tighter">
                    DAILY <span className="text-neon-pink">GRIND</span> ⚡
                </h1>
                <span className="text-xs font-mono text-gray-500 mb-2">{tasks.length}/7 TASKS</span>
            </header>

            <form onSubmit={handleAdd} className="relative group z-20">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink to-neon-blue rounded-xl blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex bg-dark-bg rounded-xl">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a task, machi..."
                        className="flex-1 bg-dark-surface border border-white/10 rounded-l-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-0"
                    />
                    <button type="submit" className="bg-neon-green text-black px-6 rounded-r-xl font-bold hover:bg-emerald-400 transition-colors">
                        <Plus size={24} />
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {tasks.length === 0 && (
                    <div className="text-center py-20 opacity-50 flex flex-col items-center">
                        <Sparkles size={48} className="text-neon-yellow mb-4" />
                        <p className="text-lg font-medium">No tasks yet.</p>
                        <p className="text-sm">Add something or go sleep. 😴</p>
                    </div>
                )}

                {tasks.map((task, index) => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id, task.completed)}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className={`group relative p-4 rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${task.completed
                                ? 'bg-dark-surface/50 border-neon-green/30 opacity-75'
                                : 'bg-dark-surface border-white/10 hover:border-white/20 hover:scale-[1.02]'
                            }`}
                    >
                        {task.completed && (
                            <div className="absolute inset-0 bg-neon-green/5 pointer-events-none"></div>
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <span className={`text-lg font-medium transition-all ${task.completed ? 'text-gray-500 line-through' : 'text-white'
                                }`}>
                                {task.text}
                            </span>

                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed
                                    ? 'bg-neon-green border-neon-green text-black scale-110'
                                    : 'border-gray-600 group-hover:border-neon-pink'
                                }`}>
                                {task.completed ? <CheckCircle size={20} /> : <Circle size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
