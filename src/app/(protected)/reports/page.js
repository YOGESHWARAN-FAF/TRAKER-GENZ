"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { performanceService } from '@/services/performanceService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
    const { user } = useAuth();
    const [data, setData] = useState([]);

    useEffect(() => {
        if (user) {
            performanceService.getWeeklyStats(user.uid).then(stats => setData(stats));
        }
    }, [user]);

    return (
        <div className="p-6 pb-24 min-h-screen">
            <h1 className="text-3xl font-black italic mb-8">YOUR <span className="text-neon-yellow">STATS</span> 📈</h1>

            <div className="bg-dark-card p-6 rounded-3xl border border-white/5 shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/10 rounded-full blur-xl -mr-10 -mt-10"></div>

                <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider relative z-10">Last 7 Days</h3>
                <div className="h-64 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barSize={12}>
                            <XAxis
                                dataKey="name"
                                stroke="#666"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{
                                    backgroundColor: '#161622',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}
                            />
                            <Bar dataKey="completed" stackId="a" fill="#39FF14" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="missed" stackId="a" fill="#FF00FF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex justify-center space-x-6 mt-6 text-[10px] font-mono font-bold text-gray-400">
                    <div className="flex items-center"><div className="w-2 h-2 bg-neon-green rounded-full mr-2"></div>COMPLETED</div>
                    <div className="flex items-center"><div className="w-2 h-2 bg-neon-pink rounded-full mr-2"></div>MISSED</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-surface p-5 rounded-2xl border border-white/5 hover:border-orange-500/50 transition duration-300 group">
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest mb-2">LONGEST STREAK</p>
                    <p className="text-4xl font-black text-white group-hover:text-orange-500 transition-colors">{user?.streak || 0} <span className="text-xl">🔥</span></p>
                </div>

                <div className="bg-dark-surface p-5 rounded-2xl border border-white/5 hover:border-neon-purple/50 transition duration-300 group">
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest mb-2">TOTAL XP</p>
                    <p className="text-4xl font-black text-white group-hover:text-neon-purple transition-colors">{user?.xp || 0} <span className="text-xl">✨</span></p>
                </div>
            </div>

            {/* Monthly badge */}
            <div className="mt-4 bg-gradient-to-r from-dark-surface to-transparent border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Current Level</p>
                    <p className="text-xl font-bold text-white">Level {user?.level || 1} Boss</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-2xl">
                    👑
                </div>
            </div>
        </div>
    );
}
