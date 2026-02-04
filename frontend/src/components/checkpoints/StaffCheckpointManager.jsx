
import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { MapPin, Users, Utensils } from "lucide-react";
import toast from "react-hot-toast";

import useEventStore from "../../store/eventStore";
import { useParams } from "react-router-dom";
import { useStaffAuth } from "../../context/StaffAuthContext";


const StaffCheckpointManager = ({ }) => {

    const [checkpoints, setCheckpoints] = useState([]);
    const [loading, setLoading] = useState(false);

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


    const { staffUser } = useStaffAuth();
    // const isStaff = staffUser?.type === "staff";

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

                {/* List Section */}
                <div className={"lg:col-span-3 space-y-4"}>
                    {loading ? (
                        <div className="text-center py-10 text-slate-500 animate-pulse">Loading checkpoints...</div>
                    ) : checkpoints.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10 text-slate-500">
                            No checkpoints yet.
                        </div>
                    ) : (
                        checkpoints.map(cp => (
                            <StaffCheckpointCard
                                key={cp.id}
                                checkpoint={cp}
                                eventId={eventId}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const StaffCheckpointCard = ({ checkpoint, eventId }) => {

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
                    href={`/scan/event/${eventId}/checkpoints/${checkpoint.id}/stats`}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    View Stats
                </a>
            </div>
        </div>
    );
};

export default StaffCheckpointManager;
