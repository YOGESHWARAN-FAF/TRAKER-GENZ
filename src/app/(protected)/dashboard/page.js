"use client";
import { useEffect, useState, useContext } from 'react';
import { useTasks, TaskContext } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';
import { Flame, Zap, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = "force-dynamic";

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-[#161622]/50 border border-white/5 p-4 rounded-2xl flex items-center space-x-4">
        <div className={`p-3 rounded-xl bg-black/40 ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();

    // SAFE CONTEXT ACCESS
    const taskCtx = useContext(TaskContext);

    // Handle loading/undefined state gracefully for Build/SSR
    if (!taskCtx) {
        return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;
    }

    const { tasks } = taskCtx;
    const [motivation, setMotivation] = useState("Loading vibes... 🤖");

    const completedToday = tasks ? tasks.filter(t => t.completed).length : 0;
    const progress = (tasks && tasks.length > 0) ? (completedToday / tasks.length) * 100 : 0;

    useEffect(() => {
        if (user && tasks && tasks.length > 0) {
            // Fetch AI motivation based on stats
            fetch('/api/ai', {
                method: 'POST',
                body: JSON.stringify({
                    performance: `Completed ${completedToday}/${tasks.length} tasks. Streak: ${user.streak}. User Level: ${user.level}`,
                    userId: user.uid
                })
            })
                .then(res => res.json())
                .then(data => setMotivation(data.message))
                .catch(err => console.error(err));
        } else {
            setMotivation("Start grinding to unlock AI roast! 🔥");
        }
    }, [user, tasks, completedToday]);

    return (
        <div className="p-6 space-y-8 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Watha, <span className="text-[#39FF14]">{user?.displayName}!</span> 👋</h1>
                    <p className="text-gray-400 text-sm">Let's cook today.</p>
                </div>
                <div className="bg-[#161622] border border-white/10 px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></div>
                    <span className="text-xs font-mono">ONLINE</span>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard icon={Flame} label="Streak" value={`${user?.streak || 0} Days`} color="text-orange-500" />
                <StatCard icon={Zap} label="Level" value={user?.level || 1} color="text-yellow-400" />
                <StatCard icon={Trophy} label="XP" value={user?.xp || 0} color="text-[#B026FF]" />

                {/* Completion Card */}
                <div className="bg-gradient-to-br from-[#FF00FF] to-[#B026FF] p-4 rounded-2xl flex flex-col justify-between text-white shadow-lg shadow-[#FF00FF]/20">
                    <p className="text-xs font-bold opacity-80">TODAY</p>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-black">{Math.round(progress)}%</span>
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative bg-[#1e1e2d] rounded-3xl p-6 border border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#39FF14]/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                <h2 className="text-xl font-bold mb-2">Ready to grind?</h2>
                <p className="text-gray-400 text-sm mb-6">You have {(tasks?.length || 0) - completedToday} tasks remaining today.</p>

                <Link href="/tasks" className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                    <span>Go to Tasks</span>
                    <ArrowRight size={18} />
                </Link>
            </div>

            {/* AI Motivation */}
            <div className="bg-black/20 rounded-2xl p-6 text-center border border-white/5">
                <p className="text-lg font-medium italic text-gray-300">"{motivation}"</p>
                <p className="text-xs text-gray-500 mt-2">- Verithanam AI Coach</p>
            </div>
        </div>
    );
}
