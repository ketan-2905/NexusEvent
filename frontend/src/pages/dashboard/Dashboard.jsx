import { useState, useEffect } from 'react'
import EventsList from '../../components/events/EventsList';
import CreateEventModal from '../../components/events/CreateEventModal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    LogOut,
} from "lucide-react";

export const Dashboard = () => {

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [events, setEvents] = useState([]);
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchEvents();
    }, [])


    const fetchEvents = async () => {
        try {
            const res = await api.get("/events");


            setEvents(res.data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-display">
            {/* Sidebar for Desktop */}
            <header className="hidden md:flex w-full flex-row justify-between border-r border-white/10 p-6 sticky top-0 900/50 backdrop-blur-xl">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                        N
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        NexusEvent
                    </span>
                </div>
                <div className="flex justify-center items-center">
                    <div className="flex items-center justify-between gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold border border-white/10">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-400 hover:bg-red-500/10 transition-colors "
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 min-w-0 relative">
                {/* Mobile Header */}


                <div className="p-6 md:p-10 max-w-7xl mx-auto">
                    <CreateEventModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={fetchEvents}
                    />
                    <EventsList events={events} onCreateOpen={() => setIsCreateModalOpen(true)} />
                </div>
            </main>
        </div>
    );
}
