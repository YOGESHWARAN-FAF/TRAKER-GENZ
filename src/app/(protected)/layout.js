"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, Users, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NavItem = ({ href, icon: Icon, label, color }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`flex flex-col md:flex-row items-center md:space-x-3 md:p-3 rounded-xl transition-all duration-300 ${isActive ? `${color} md:bg-white/10` : 'text-gray-500 hover:text-white'}`}
        >
            <Icon size={24} strokeWidth={2.5} />
            <span className="text-[10px] md:text-base mt-1 md:mt-0 font-bold tracking-wide uppercase md:capitalize">{label}</span>
        </Link>
    );
};

export default function ProtectedLayout({ children }) {
    const { logoutUser } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 md:pb-0 relative">
            {/* Glows */}
            <div className="fixed top-0 left-0 w-64 h-64 bg-[#B026FF]/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            <div className="fixed bottom-0 right-0 w-80 h-80 bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

            <div className="relative z-10 md:ml-64 min-h-screen">
                {children}
            </div>

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 w-full bg-[#161622]/90 backdrop-blur-xl border-t border-white/5 flex justify-around py-4 pb-6 z-50">
                <NavItem href="/dashboard" icon={Home} label="Home" color="text-[#FF00FF]" />
                <NavItem href="/tasks" icon={List} label="Tasks" color="text-[#39FF14]" />
                <NavItem href="/groups" icon={Users} label="Squad" color="text-[#00FFFF]" />
                <NavItem href="/reports" icon={BarChart2} label="Stats" color="text-[#FFFF00]" />
            </nav>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#161622] border-r border-white/5 p-8">
                <h1 className="text-3xl font-extrabold italic bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#00FFFF] mb-12">
                    TASKER<span className="text-white">GEN-Z</span>
                </h1>
                <div className="flex flex-col space-y-4 flex-1">
                    <NavItem href="/dashboard" icon={Home} label="Dashboard" color="text-[#FF00FF]" />
                    <NavItem href="/tasks" icon={List} label="Daily Tasks" color="text-[#39FF14]" />
                    <NavItem href="/groups" icon={Users} label="Squad Tasks" color="text-[#00FFFF]" />
                    <NavItem href="/reports" icon={BarChart2} label="Reports" color="text-[#FFFF00]" />
                </div>

                <button onClick={logoutUser} className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition mt-auto">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>
        </div>
    );
}
