"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Landing() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');

    const { googleLogin, loginUser, registerUser } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await registerUser(email, password, name);
            } else {
                await loginUser(email, password);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] relative overflow-hidden">
            {/* Blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#B026FF]/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#00FFFF]/20 rounded-full blur-[100px]"></div>

            <div className="relative z-10 w-full max-w-sm">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black italic tracking-tighter mb-2">
                        <span className="text-white">TASKER</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF00FF] to-[#B026FF]">GEN-Z</span>
                    </h1>
                    <p className="text-gray-400 font-medium">No more procrastinating, machi. 😎</p>
                </div>

                <div className="bg-[#161622]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <h2 className="text-2xl font-bold mb-6 text-center">{isRegister ? "Join the Squad 🚀" : "Welcome Back 👋"}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <input
                                type="text"
                                placeholder="Un Per Enna? (Name)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-[#FF00FF] outline-none"
                                required
                            />
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-[#FF00FF] outline-none"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-[#FF00FF] outline-none"
                            required
                        />

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#FF00FF] to-[#B026FF] text-white font-black py-4 rounded-2xl text-lg hover:scale-[1.02] transition-all"
                        >
                            {isRegister ? "REGISTER PANNU" : "LOGIN DA"}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="px-4 text-gray-500 text-xs">OR</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    <button
                        onClick={googleLogin}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-200 transition"
                    >
                        <span>Login with Google</span>
                    </button>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        {isRegister ? "Already valid?" : "New ah nee?"}
                        <button onClick={() => setIsRegister(!isRegister)} className="text-[#39FF14] font-bold ml-2 hover:underline">
                            {isRegister ? "Login here" : "Create Account"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
