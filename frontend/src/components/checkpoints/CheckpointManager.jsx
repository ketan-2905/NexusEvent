import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { MapPin, Plus, Users, Mail, Loader2, Utensils } from "lucide-react";
import toast from "react-hot-toast";

import CheckpointStats from "../stats/CheckpointStats";
import useEventStore from "../../store/eventStore";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";



const CheckpointManager = ({ events }) => {

    const [checkpoints, setCheckpoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [viewStatsId, setViewStatsId] = useState(null); // VIEW STATS STATE

    // Create Form
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("SINGLE"); // SINGLE or MULTIPLE
    const [isFood, setIsFood] = useState(false);

    const { eventId } = useParams()

    const { selectedEvent } = useEventStore()

    useEffect(() => {
        if (eventId) {
            fetchCheckpoints()
        }
    }, [eventId]);

    const fetchCheckpoints = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/events/${eventId}/checkpoints`);
            setCheckpoints(res.data);
        } catch (err) {
            toast.error("Failed to load checkpoints");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post(`/events/${eventId}/checkpoints`, {
                name: newName,
                type: newType,
                isFoodCheckpoint: isFood
            });
            toast.success("Checkpoint created");
            setNewName("");
            setIsFood(false);
            fetchCheckpoints();
        } catch (err) {
            toast.error("Failed to create checkpoint");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this checkpoint?")) return;
        try {
            await api.delete(`/events/${eventId}/checkpoints/${id}`);
            toast.success("Deleted");
            setCheckpoints(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const { user } = useAuth();
    const isStaff = user?.type === "staff";

    if (!selectedEvent) return <div className="text-center text-slate-500 mt-10">No events found. Create an event first.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl  overflow-x-auto text-white">
                <h1 className=" font-medium whitespace-nowrap text-4xl">Event:</h1>

                <span
                    className={`rounded-lg font-bold whitespace-nowrap transition-all text-4xl  hover:text-white`}
                >
                    {selectedEvent.name}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Section - Hidden for Staff */}
                {!isStaff && (
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-400" /> New Checkpoint
                            </h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-1">Checkpoint Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                                        placeholder="e.g. Main Entrance"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm mb-1">Access Type</label>
                                    <select
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                    >
                                        <option value="SINGLE">Single Entry</option>
                                        <option value="MULTIPLE">Multiple Entry/Exit</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer border border-transparent hover:border-emerald-500/30 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded bg-slate-700 border-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                                        checked={isFood}
                                        onChange={e => setIsFood(e.target.checked)}
                                    />
                                    <div>
                                        <span className="text-emerald-400 font-bold block text-sm flex items-center gap-2">
                                            <Utensils className="w-3 h-3" /> Food Checkpoint
                                        </span>
                                        <span className="text-slate-500 text-xs">Shows food preference when scanning</span>
                                    </div>
                                </label>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Checkpoint"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* List Section */}
                <div className={isStaff ? "lg:col-span-3 space-y-4" : "lg:col-span-2 space-y-4"}>
                    {loading ? (
                        <div className="text-center py-10 text-slate-500 animate-pulse">Loading checkpoints...</div>
                    ) : checkpoints.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10 text-slate-500">
                            No checkpoints yet.
                        </div>
                    ) : (
                        checkpoints.map(cp => (
                            <CheckpointCard
                                key={cp.id}
                                checkpoint={cp}
                                onDelete={() => handleDelete(cp.id)}
                                onViewStats={() => setViewStatsId(cp.id)}
                                eventId={eventId}
                                isStaff={isStaff} // Pass prop
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CheckpointCard = ({ checkpoint, onDelete, eventId, isStaff }) => {
    const isRegDesk = checkpoint.name === "Registration Desk";

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${checkpoint.isFoodCheckpoint
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        }`}>
                        {checkpoint.isFoodCheckpoint ? <Utensils className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-white font-bold">{checkpoint.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                                {checkpoint.type}
                            </span>
                            {checkpoint.isFoodCheckpoint && (
                                <span className="text-xs bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Food
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {!isRegDesk && !isStaff && (
                    <button
                        onClick={onDelete}
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 p-2 rounded-lg text-sm"
                    >
                        Delete
                    </button>
                )}
            </div>

            {/* Minimal Stats Row */}
            <div className="flex items-center gap-4 mb-4 text-sm text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Participant Count: <span className="text-white font-bold">{checkpoint._count?.visits || 0}</span>
                </span>
            </div>

            <div className="flex gap-2">
                <a
                    href={`/dashboard/event/${eventId}/checkpoints/${checkpoint.id}/stats`}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    View Stats
                </a>
            </div>
        </div>
    );
};

export default CheckpointManager;
