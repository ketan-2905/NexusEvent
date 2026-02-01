import React from "react";
import { Plus, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const EventsList = ({ events, onCreateOpen }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Your Events</h2>
                <button
                    onClick={onCreateOpen}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Create Event
                </button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                    <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
                    <p className="text-slate-400 mb-6">Create your first event to get started.</p>
                    <button
                        onClick={onCreateOpen}
                        className="text-blue-400 hover:text-white font-medium hover:underline"
                    >
                        Create Event
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/dashboard/event/${event.id}`)}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group cursor-pointer active:scale-95"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                                        event.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                                            event.status === "DRAFT" ? "bg-slate-500/20 text-slate-400" :
                                                "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-3 mt-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Participants</span>
                                    <span className="text-white font-medium">{event?._count?.participants || 0} / {event.participantLimit}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(((event?._count?.participants || 0) / event.participantLimit) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm pt-2">
                                    <span className="text-slate-400">Staff Members</span>
                                    <span className="text-white font-medium">{event?._count?.staff || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventsList;
