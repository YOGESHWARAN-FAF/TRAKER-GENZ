"use client";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { squadService, TASK_STATUS } from '@/services/squadService';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase/client';
import { Users, Plus, Star, CheckCircle, XCircle, Search, Mail, Camera, Eye, Activity } from 'lucide-react';

export default function SquadPage() {
    const { user } = useAuth();
    const [activeSquad, setActiveSquad] = useState(null);
    const [invites, setInvites] = useState([]);
    const [squads, setSquads] = useState([]);
    const [view, setView] = useState('list'); // list, create, detail

    // Create Form
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // Search User
    const [searchEmail, setSearchEmail] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [inviteStatus, setInviteStatus] = useState('');

    // Task Form
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState([]);

    // Listeners
    useEffect(() => {
        if (!user) return;

        // Listen to Squads
        const squadsRef = ref(db, 'squads');
        const unsubSquads = onValue(squadsRef, (snap) => {
            const data = snap.val();
            if (data) {
                const mySquads = Object.values(data).filter(s => s.members && s.members[user.uid]);
                setSquads(mySquads);
                if (activeSquad) {
                    const updated = mySquads.find(s => s.id === activeSquad.id);
                    if (updated) setActiveSquad(updated);
                }
            } else {
                setSquads([]);
            }
        });

        // Listen to Invites DIRECTLY from User Profile ("The Trick")
        // users/{uid}/invites
        const userInvitesRef = ref(db, `users/${user.uid}/invites`);
        const unsubInvites = onValue(userInvitesRef, (snap) => {
            if (snap.exists()) {
                setInvites(Object.values(snap.val()));
            } else {
                setInvites([]);
            }
        });

        return () => { off(squadsRef); off(userInvitesRef); };
    }, [user, activeSquad?.id]);

    // Handler: Create Squad
    const handleCreate = async () => {
        if (!newName.trim()) return;
        const id = await squadService.createSquad(user, newName, newDesc);
        setView('list');
        setNewName('');
        setNewDesc('');
    };

    // Handler: Search & Invite
    const handleSearch = async () => {
        setInviteStatus('Searching...');
        setFoundUser(null);
        try {
            const found = await squadService.findUserByEmail(searchEmail);
            if (found) {
                // Preventing self-invite
                if (found.uid === user.uid) {
                    setInviteStatus("That's you, dummy! 😂");
                } else {
                    setFoundUser(found);
                    setInviteStatus('');
                }
            } else {
                setFoundUser(null);
                setInviteStatus('User not found.');
            }
        } catch (e) {
            setInviteStatus("Error: " + e.message);
        }
    };

    const handleSendInvite = async () => {
        if (foundUser && activeSquad) {
            await squadService.sendInvite(activeSquad.id, user, foundUser);
            setInviteStatus('Invite sent! 🚀');
            setSearchEmail('');
            setFoundUser(null);
        }
    };

    const addTask = async () => {
        if (!newTaskTitle.trim() || selectedAssignees.length === 0) return;
        await squadService.createTask(activeSquad.id, newTaskTitle, selectedAssignees);
        setNewTaskTitle('');
        setSelectedAssignees([]);
    };

    const onUploadProof = (taskId, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => squadService.uploadProof(activeSquad.id, taskId, reader.result);
            reader.readAsDataURL(file);
        }
    };

    const onVerify = (taskId) => {
        const memberCount = activeSquad.members ? Object.keys(activeSquad.members).length : 1;
        squadService.verifyTask(activeSquad.id, taskId, user.uid, user.displayName, memberCount);
    };

    return (
        <div className="p-6 pb-24 min-h-screen space-y-8 relative">
            {/* Realtime Invite Popup "The Trick" */}
            {invites.length > 0 && (
                <div className="fixed top-20 right-4 z-50 w-80 animate-in slide-in-from-right duration-500">
                    <div className="bg-gradient-to-br from-[#FF00FF] to-[#B026FF] p-[2px] rounded-2xl shadow-2xl">
                        <div className="bg-[#161622] rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Mail className="text-[#39FF14] animate-bounce" size={18} />
                                    New Invite!
                                </h3>
                                <span className="bg-[#FF00FF]/20 text-[#FF00FF] text-[10px] px-2 py-0.5 rounded-full font-bold">{invites.length} Pending</span>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {invites.map(inv => (
                                    <div key={inv.id} className="bg-black/40 p-3 rounded-xl border border-white/5">
                                        <p className="text-sm text-gray-300 mb-2">
                                            <span className="text-white font-bold">{inv.fromName}</span> invited you to a Squad.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => squadService.acceptInvite(inv.id, user)}
                                                className="bg-[#39FF14] text-black py-1.5 rounded-lg text-xs font-bold hover:bg-white transition"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => squadService.rejectInvite(inv.id, user.uid)}
                                                className="bg-white/10 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main View Switch */}
            {view === 'list' && (
                <>
                    <header className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-black italic">MY <span className="text-neon-blue">SQUADS</span></h1>
                            <p className="text-gray-400">Collaborate or die trying.</p>
                        </div>
                        <button onClick={() => setView('create')} className="bg-neon-blue text-black p-3 rounded-xl hover:scale-110 transition"><Plus size={24} /></button>
                    </header>

                    <div className="grid gap-4">
                        {squads.map(s => (
                            <div key={s.id} onClick={() => { setActiveSquad(s); setView('detail'); }} className="bg-dark-surface border border-white/10 p-6 rounded-2xl hover:border-neon-blue/50 cursor-pointer transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold group-hover:text-neon-blue transition">{s.name}</h2>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded font-mono">{Object.keys(s.members || {}).length} MEMBERS</span>
                                </div>
                                <p className="text-gray-400 text-sm italic">"{s.description || "No description"}"</p>
                            </div>
                        ))}
                        {squads.length === 0 && <div className="text-center text-gray-500 py-10">No squads. Create one.</div>}
                    </div>
                </>
            )}

            {view === 'create' && (
                <div className="animate-in slide-in-from-right space-y-6">
                    <button onClick={() => setView('list')} className="text-gray-400 text-sm">Cancel</button>
                    <h2 className="text-3xl font-bold">New Squad Goal</h2>
                    <input placeholder="Squad Name (e.g. Gym Bros)" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-dark-card border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon-pink" />
                    <textarea placeholder="Goal Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-dark-card border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon-pink h-32" />
                    <button onClick={handleCreate} className="w-full bg-neon-pink text-white font-bold py-4 rounded-xl">CREATE SQUAD</button>
                </div>
            )}

            {view === 'detail' && activeSquad && (
                <div className="animate-in zoom-in-95 space-y-6">
                    <header className="flex flex-col space-y-4">
                        <button onClick={() => setView('list')} className="text-gray-400 text-sm self-start">← Back</button>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-black">{activeSquad.name}</h1>
                            <div className="flex -space-x-2">
                                {Object.values(activeSquad.members || {}).map(m => (
                                    <div key={m.uid} title={m.name} className="w-10 h-10 rounded-full bg-gray-700 border-2 border-black flex items-center justify-center text-xs font-bold text-white">
                                        {m.name?.[0]}
                                    </div>
                                ))}
                                <button onClick={() => document.getElementById('invite_modal').showModal()} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">+</button>
                            </div>
                        </div>
                        <p className="text-gray-400">{activeSquad.description}</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Task Section */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="bg-dark-card p-4 rounded-xl border border-white/5 space-y-4">
                                <h3 className="font-bold text-neon-blue">Create Task</h3>
                                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task Title..." className="w-full bg-black/30 p-3 rounded-lg text-white outline-none" />
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(activeSquad.members || {}).map(m => (
                                        <button
                                            key={m.uid}
                                            onClick={() => setSelectedAssignees(prev => prev.includes(m.uid) ? prev.filter(id => id !== m.uid) : [...prev, m.uid])}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${selectedAssignees.includes(m.uid) ? 'bg-neon-green text-black' : 'bg-white/10 text-gray-400'}`}
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={addTask} className="w-full bg-white/10 hover:bg-neon-blue hover:text-black transition py-2 rounded-lg font-bold">Assign Task</button>
                            </div>

                            {/* Tasks List */}
                            <div className="space-y-4 pt-4">
                                {activeSquad.tasks && Object.values(activeSquad.tasks)
                                    .sort((a, b) => b.createdAt - a.createdAt)
                                    .map(task => (
                                        <div key={task.id} className="relative bg-dark-surface p-5 rounded-2xl border border-white/5 overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === TASK_STATUS.COMPLETED ? 'bg-neon-green' :
                                                    task.status === TASK_STATUS.WAITING ? 'bg-neon-yellow' : 'bg-white/20'
                                                }`}></div>

                                            <div className="pl-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className={`font-bold text-lg ${task.status === TASK_STATUS.COMPLETED ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h4>
                                                    <span className="text-[10px] uppercase font-mono bg-white/5 px-2 py-1 rounded text-gray-400">{task.status.replace('_', ' ')}</span>
                                                </div>

                                                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                                                    <span>Assigned to:</span>
                                                    {task.assignedTo && Object.keys(task.assignedTo).map(uid => {
                                                        const m = activeSquad.members[uid];
                                                        return <span key={uid} className="text-white bg-white/10 px-2 rounded">{m?.name || 'Unknown'}</span>
                                                    })}
                                                </div>

                                                <div className="mt-4">
                                                    {task.status === TASK_STATUS.OPEN && task.assignedTo?.[user.uid] && (
                                                        <label className="flex items-center justify-center w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition text-sm">
                                                            <Camera size={16} className="mr-2" /> Upload Proof
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadProof(task.id, e)} />
                                                        </label>
                                                    )}

                                                    {(task.status === TASK_STATUS.WAITING || task.status === TASK_STATUS.COMPLETED) && task.proofImageBase64 && (
                                                        <div className="space-y-3">
                                                            <div className="h-40 w-full bg-black rounded-lg overflow-hidden">
                                                                <img src={task.proofImageBase64} alt="Proof" className="w-full h-full object-cover" />
                                                            </div>

                                                            {task.status === TASK_STATUS.WAITING && (
                                                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                                                    <span className="text-xs text-neon-yellow flex items-center"><Eye size={12} className="mr-1" /> Needs Verification</span>
                                                                    <button
                                                                        disabled={task.verifications?.[user.uid]}
                                                                        onClick={() => onVerify(task.id)}
                                                                        className={`text-xs font-bold px-4 py-2 rounded-lg transition ${task.verifications?.[user.uid] ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-neon-green text-black hover:scale-105'
                                                                            }`}
                                                                    >
                                                                        {task.verifications?.[user.uid] ? 'Verified ✓' : 'Verify Now'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="bg-dark-surface p-4 rounded-xl border border-white/5 h-fit max-h-[500px] overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase flex items-center"><Activity size={14} className="mr-2" /> Squad Activity</h3>
                            <div className="space-y-4">
                                {activeSquad.activity ? Object.values(activeSquad.activity).sort((a, b) => b.timestamp - a.timestamp).map(act => (
                                    <div key={act.id} className="text-xs border-l-2 border-white/10 pl-3">
                                        <p className="text-gray-300">{act.text}</p>
                                        <p className="text-gray-600 text-[10px] mt-1">{new Date(act.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                )) : <p className="text-xs text-gray-600">No activity yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Invite Modal (Native HTML Dialog) */}
                    <dialog id="invite_modal" className="bg-[#1e1e2d] text-white p-6 rounded-2xl w-full max-w-sm backdrop:bg-black/80">
                        <h3 className="text-xl font-bold mb-4">Invite Friend</h3>
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    value={searchEmail}
                                    onChange={e => setSearchEmail(e.target.value)}
                                    placeholder="Friend's Email"
                                    className="flex-1 bg-black/30 p-3 rounded-lg outline-none border border-white/10 focus:border-neon-blue"
                                />
                                <button onClick={handleSearch} className="bg-white/10 p-3 rounded-lg"><Search /></button>
                            </div>

                            {inviteStatus && <p className="text-xs text-center text-neon-yellow">{inviteStatus}</p>}

                            {foundUser && (
                                <div className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
                                    <span>{foundUser.displayName || "Unknown"}</span>
                                    <button onClick={handleSendInvite} className="bg-neon-blue text-black text-xs font-bold px-3 py-1 rounded">Send</button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => { document.getElementById('invite_modal').close(); setFoundUser(null); setSearchEmail(''); setInviteStatus(''); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XCircle /></button>
                    </dialog>
                </div>
            )}
        </div>
    );
}
