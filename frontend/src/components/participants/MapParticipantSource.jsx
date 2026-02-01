import React, { useState } from "react";
import { CheckCircle, Loader2, Database } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import api from "../../utils/api";

const MapParticipantSource = ({ eventId, sources, onProcessed }) => {
    const [selectedSourceId, setSelectedSourceId] = useState("");
    const [headers, setHeaders] = useState([]);
    const [preview, setPreview] = useState([]);
    const [loadingHeaders, setLoadingHeaders] = useState(false);
    const [mapping, setMapping] = useState({ name: "", email: "", phone: "", foodPreference: "" });
    const [processing, setProcessing] = useState(false);

    // Schema fields
    const schemaFields = [
        { key: "name", label: "Full Name", required: true },
        { key: "email", label: "Email Address", required: true },
        { key: "phone", label: "Phone Number", required: false },
        { key: "foodPreference", label: "Food Preference", required: false },
        { key: "teamName", label: "Team Name", required: false },
        { key: "teamId", label: "Team ID", required: false },
        { key: "branch", label: "Branch/Department", required: false },
        { key: "year", label: "Year/Class", required: false },
    ];

    const handleFetchHeaders = async (id) => {
        setSelectedSourceId(id);
        if (!id) { setHeaders([]); return; }

        setLoadingHeaders(true);
        try {
            const res = await api.get(`/events/${eventId}/sources/${id}/headers`);
            setHeaders(res.data.headers);
            setPreview(res.data.preview);
        } catch (err) {
            console.error(err);
            toast.error("Failed to read file headers");
        } finally {
            setLoadingHeaders(false);
        }
    };

    const handleProcess = async () => {
        // Validate required
        if (!mapping.name || !mapping.email) {
            toast.error("Name and Email are required fields.");
            return;
        }

        setProcessing(true);
        const toastId = toast.loading("Processing...");
        try {
            const res = await api.post(`/events/${eventId}/sources/${selectedSourceId}/process`, { mapping });
            toast.dismiss(toastId);
            toast.success(`Processed! Added: ${res.data.added}, Duplicates Scanned: ${res.data.duplicates}`);
            onProcessed();
        } catch (err) {
            toast.dismiss(toastId);
            console.error(err);
            toast.error("Processing failed: " + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const pendingSources = sources;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border-r border-white/10 pr-8">
                <h3 className="text-lg font-bold text-white mb-4">1. Select Source</h3>
                {pendingSources.length === 0 ? <p className="text-slate-500">No files available.</p> : (
                    <div className="space-y-2">
                        {pendingSources.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleFetchHeaders(s.id)}
                                className={clsx(
                                    "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between",
                                    selectedSourceId === s.id ? "bg-blue-600/20 border-blue-500 text-white" : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                                )}
                            >
                                <span className="truncate">{s.fileName}</span>
                                {s.status === "PROCESSED" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="lg:col-span-2">
                {!selectedSourceId ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        <p>Select a file to start mapping.</p>
                    </div>
                ) : loadingHeaders ? (
                    <div className="h-full flex items-center justify-center text-blue-400">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Reading file headers...</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">2. Map Columns</h3>
                        <p className="text-sm text-slate-400 mb-6 bg-slate-800 p-3 rounded-lg border border-white/5">
                            Match your file Columns to the System Fields. Use "Food Preference" for Veg/Non-Veg.
                        </p>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                            {schemaFields.map(field => (
                                <div key={field.key} className="grid grid-cols-3 items-center gap-4">
                                    <div className="text-right">
                                        <label className={clsx("text-sm font-medium", field.required ? "text-white" : "text-slate-400")}>
                                            {field.label} {field.required && <span className="text-red-400">*</span>}
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <select
                                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={mapping[field.key] || ""}
                                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                                        >
                                            <option value="">-- Select Column --</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleProcess}
                                disabled={processing}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                            >
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                                Generate List
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapParticipantSource;
