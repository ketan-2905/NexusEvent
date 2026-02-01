import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
    ArrowLeft, Upload, List, Settings, Mail
} from "lucide-react";
import clsx from "clsx";
import toast, { Toaster } from "react-hot-toast";

import ParticipantsList from "../components/participants/ParticipantsList";
import UploadParticipantSource from "../components/participants/UploadParticipantSource";
import MapParticipantSource from "../components/participants/MapParticipantSource";
import EventEmailEditor from "../components/participants/EventEmailEditor";
import EmailLogs from "../components/participants/EmailLogs";
import useEventStore from "../store/eventStore";

const ParticipantManager = () => {
    const { eventId } = useParams();
    const [activeTab, setActiveTab] = useState("participants"); // participants, upload, map

    // Data States
    const [sources, setSources] = useState([]);

    const { selectedEvent } = useEventStore()

    useEffect(() => {
        if (eventId) {
            fetchSources()
        }
    }, [eventId])


    const fetchSources = async () => {
        try {
            const res = await api.get(`/events/${eventId}/sources`);
            setSources(res.data);
        } catch (err) { console.error(err); }
    };

    const deleteSource = async (id) => {
        if (!window.confirm("Delete this file record?")) return;
        try {
            await api.delete(`/events/${eventId}/sources/${id}`);
            toast.success("File deleted");
            fetchSources();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    return (
        <main>
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">

                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Participants</h1>
                        <p className="text-slate-400">Manage list for <span className="text-blue-400 font-medium">{selectedEvent?.name || "..."}</span></p>
                    </div>
                    {/* Top Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setActiveTab("participants")}
                            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "participants" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            <List className="w-4 h-4" /> Participants List
                        </button>
                        <button
                            onClick={() => setActiveTab("upload")}
                            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "upload" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            <Upload className="w-4 h-4" /> Upload List
                        </button>
                        <button
                            onClick={() => setActiveTab("map")}
                            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "map" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            <Settings className="w-4 h-4" /> Map & Generate
                        </button>
                        <button
                            onClick={() => setActiveTab("email")}
                            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "email" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            <Mail className="w-4 h-4" /> Email Editor
                        </button>
                        <button
                            onClick={() => setActiveTab("logs")}
                            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeTab === "logs" ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            <Mail className="w-4 h-4" /> Email Logs
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[600px]">
                    {activeTab === "participants" && <ParticipantsList eventId={eventId} />}
                    {activeTab === "upload" && (
                        <UploadParticipantSource
                            eventId={eventId}
                            onUploaded={() => { fetchSources(); setActiveTab("map"); toast.success("File uploaded! ready to map."); }}
                            sources={sources}
                            onDelete={deleteSource}
                        />
                    )}
                    {activeTab === "map" && (
                        <MapParticipantSource
                            eventId={eventId}
                            sources={sources}
                            onProcessed={() => {
                                setActiveTab("participants");
                                toast.success("Participants imported successfully!");
                            }}
                        />
                    )}
                    {activeTab === "email" && <EventEmailEditor eventId={eventId} eventName={selectedEvent?.name} />}
                    {activeTab === "logs" && <EmailLogs eventId={eventId} />}
                </div>
            </div>
        </main>

    );
};

export default ParticipantManager;
