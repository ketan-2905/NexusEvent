import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { Mail, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Internal Modal Component for Editing
const EditParticipantModal = ({ participant, onClose, onSave, allKeys }) => {
    const [formData, setFormData] = useState({ ...participant, ...participant.data });
    const [saving, setSaving] = useState(false);

    // Standard fields definition
    const standardFields = [
        { key: "name", label: "Full Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "teamId", label: "Team ID" },
        { key: "teamName", label: "Team Name" },
        { key: "branch", label: "Branch" },
        { key: "year", label: "Year" },
        { key: "foodPreference", label: "Food Pref" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(participant.id, formData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <h3 className="text-xl font-bold text-white">Edit Participant</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Standard Fields Section */}
                    <div>
                        <h4 className="text-blue-400 font-bold mb-3 uppercase text-xs tracking-wider">Standard Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* {standardFields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-slate-400 text-sm mb-1">{field.label}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={formData[field.key] || ""}
                                        onChange={e => handleChange(field.key, e.target.value)}
                                    />
                                </div>
                            ))} */}

                            {standardFields.map(field => {
                                // ---- YEAR SELECT ----
                                if (field.key === "year") {
                                    return (
                                        <div key={field.key}>
                                            <label className="block text-slate-400 text-sm mb-1">
                                                {field.label}
                                            </label>

                                            <select
                                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                                                value={formData[field.key] || "1"}
                                                onChange={e => handleChange(field.key, e.target.value)}
                                            >
                                                {[1, 2, 3, 4].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                }

                                // ---- FOOD PREFERENCE SELECT ----
                                if (field.key === "foodPreference") {
                                    return (
                                        <div key={field.key}>
                                            <label className="block text-slate-400 text-sm mb-1">
                                                {field.label}
                                            </label>

                                            <select
                                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                                                value={formData[field.key] || "VEG"}
                                                onChange={e => handleChange(field.key, e.target.value)}
                                            >
                                                <option value="VEG">Veg</option>
                                                <option value="NON_VEG">Non Veg</option>
                                                <option value="JAIN">Jain</option>
                                            </select>
                                        </div>
                                    );
                                }

                                // ---- DEFAULT TEXT INPUT ----
                                return (
                                    <div key={field.key}>
                                        <label className="block text-slate-400 text-sm mb-1">
                                            {field.label}
                                        </label>

                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={formData[field.key] || ""}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                        />
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                    {/* Dynamic Fields Section */}
                    {allKeys.length > 0 && (
                        <div>
                            <h4 className="text-emerald-400 font-bold mb-3 uppercase text-xs tracking-wider border-t border-white/10 pt-4">Extra Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allKeys.map(key => (
                                    <div key={key}>
                                        <label className="block text-slate-400 text-sm mb-1 capitalize">{key.replace(/_/g, " ")}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-600 outline-none"
                                            value={formData[key] || ""}
                                            onChange={e => handleChange(key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-900 border-t border-white/10 p-4 -mx-6 -mb-6 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-300 hover:bg-white/10 px-4 py-2 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ParticipantsList = ({ eventId }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null); // { sent: 0, total: 0, errors: 0, completed: false }

    // Edit Modal State
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchParticipants();

        // Socket Listener for Email Progress
        // Ideally this should use the socket context. 
        // Since we don't have the context access in this file directly shown, 
        // we'll listen to the window event if the socket is global, OR 
        // we assume the socket is available. 
        // For this specific task, if you have a global socket or api.socket, use it.
        // Assuming `api.socket` or similar isn't readily available in this snippet, 
        // but let's assume standard `socket.on`.

        // MOCK/REAL implementation if we had the instance:
        /*
        socket.on(`event:${eventId}:email:progress`, (data) => {
            setEmailStatus(prev => ({ ...prev, ...data }));
            if (data.completed) setSending(false);
            if (data.sent) fetchParticipants(); // Live refresh list
        });
        */

        // We will polling fallback for robustness as requested "even if there is a reload".
        // The fetchJobStatus does the heavy lifting on mount.
        // Polling every 3 seconds if we have an active job is a safe backup.
        const interval = setInterval(() => {
            if (emailStatus && !emailStatus.completed) {
                fetchJobStatus();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [eventId, emailStatus?.completed]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/events/${eventId}/participants`);
            setList(res.data);

            // Also fetch active job status
            fetchJobStatus();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobStatus = async () => {
        try {
            const res = await api.get(`/events/${eventId}/email-job/active`);
            const job = res.data;
            if (job) {
                // If job is running or just finished, show it
                if (job.status === "PROCESSING" || job.status === "PENDING") {
                    setSending(true);
                    setEmailStatus({
                        jobId: job.id,
                        sent: job.sentCount,
                        total: job.totalCount,
                        errors: job.failedCount,
                        completed: false
                    });
                } else if (job.status === "COMPLETED") {
                    // Optional: Show completed state if it was recent? 
                    // For now, let's just let the user dismiss it or see it if they just reloaded.
                    // Actually, if it's completed, we might not want to block the UI forever.
                    // Let's only show if it looks "fresh" or let user dismiss.
                    // We'll show it as completed so they know what happened.
                    setEmailStatus({
                        jobId: job.id,
                        sent: job.sentCount,
                        total: job.totalCount,
                        errors: job.failedCount,
                        completed: true
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch job status", err);
        }
    };

    const handleSendEmails = async () => {
        if (!window.confirm("Start sending emails to ALL participants? This will run in the background.")) return;
        setSending(true);
        const toastId = toast.loading("Initiating email process...");
        try {
            const res = await api.post(`/events/${eventId}/send-emails`, {
                subject: `Your Ticket for Event`
            });
            toast.dismiss(toastId);
            toast.success("Email process started in background.");
            setEmailStatus({
                message: "Starting...",
                sent: 0,
                total: res.data.total,
                completed: false,
                jobId: res.data.jobId
            });
            // The socket will update 'emailStatus' in a real app. 
            // We set sending=true to keep UI blocked until job finishes (or user reloads and we fetch status)
            setSending(true);
        } catch (err) {
            toast.dismiss(toastId);
            toast.error("Failed to start email process");
            setSending(false);
            console.error(err);
        }
    };

    const handleResendSingle = async (participant) => {
        if (!window.confirm(`Resend email to ${participant.name}?`)) return;

        const toastId = toast.loading("Sending email...");
        try {
            await api.post(`/events/${eventId}/participants/${participant.id}/send-email`, {});
            toast.success("Email sent successfully!");
            fetchParticipants(); // Refresh to show new status
        } catch (err) {
            console.error(err);
            toast.error("Failed to send email");
        } finally {
            toast.dismiss(toastId);
        }
    };


    const handleUpdateParticipant = async (id, data) => {
        console.log("data", data);

        try {
            await api.put(`/events/${eventId}/participants/${id}`, data);
            toast.success("Participant updated");
            setList(prev => prev.map(p => {
                if (p.id !== id) return p;
                return { ...p, ...data, data: { ...(p.data || {}), ...(data.data || {}) } };
            }));
            fetchParticipants(); // Refresh to ensure sync
        } catch (err) {
            toast.error("Failed to update");
            throw err;
        }
    };

    const handleDeleteParticipant = async (id) => {
        if (!window.confirm("Are you sure you want to delete this participant? This cannot be undone.")) return;
        try {
            await api.delete(`/events/${eventId}/participants/${id}`);
            setList(prev => prev.filter(p => p.id !== id));
            toast.success("Participant deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete participant");
        }
    };

    const getAllKeys = () => {
        const keys = new Set();
        list.forEach(p => {
            if (p.data && typeof p.data === 'object') {
                Object.keys(p.data).forEach(k => keys.add(k));
            }
        });
        // Remove internal flags from keys if any - No longer needed as we use relation
        return Array.from(keys);
    };

    const extraColumns = getAllKeys();
    // console.log("extraColumns", extraColumns);


    if (loading) return <div className="p-10 text-center text-slate-400">Loading participants...</div>;

    const editingParticipant = list.find(p => p.id === editingId);

    return (
        <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Registered Participants <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{list.length}</span></h3>
                        <p className="text-slate-400 text-sm">List of people who have been imported successfully.</p>
                    </div>
                    {/* Button Removed as per request */}
                    <button
                        onClick={() =>

                            handleSendEmails()
                        }
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        Send Email
                    </button>
                </div>

                {emailStatus && !emailStatus.completed && (
                    <div className="mb-6 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                            <div>
                                <p className="text-white font-medium">Email Background Process</p>
                                <p className="text-blue-400 text-sm">
                                    {emailStatus.sent !== undefined
                                        ? `Sent: ${emailStatus.sent} / ${emailStatus.total} | Errors: ${emailStatus.errors}`
                                        : "Starting process..."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* {emailStatus && emailStatus.completed && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <div>
                                <p className="text-white font-medium">Email Process Completed</p>
                                <p className="text-green-400 text-sm">
                                    Sent: {emailStatus.sent} | Errors: {emailStatus.errors}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setEmailStatus(null)} className="text-slate-400 hover:text-white text-sm">Dismiss</button>
                    </div>
                )} */}

                {list.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <p>No participants found. Upload and map a CSV to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar pb-4">
                        <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
                            <thead className="bg-white/5 text-white uppercase text-xs">
                                <tr>
                                    <th className="p-3 rounded-tl-lg">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Phone</th>
                                    <th className="p-3">Team Name</th>
                                    <th className="p-3">Status</th>
                                    {extraColumns.map(col => (
                                        <th key={col} className="p-3 text-blue-300">{col}</th>
                                    ))}
                                    <th className="p-3 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map(p => {
                                    // Extract status from latest email log
                                    const latestLog = p.emailLogs && p.emailLogs.length > 0 ? p.emailLogs[0] : null;
                                    const status = latestLog ? latestLog.status : null;
                                    const error = latestLog ? latestLog.error : null;

                                    return (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 text-white font-medium">{p.name}</td>
                                            <td className="p-3 text-blue-400">{p.email}</td>
                                            <td className="p-3">{p.phone}</td>
                                            <td className="p-3">{p.teamName || "-"}</td>

                                            <td className="p-3">
                                                {status === 'SENT' ? (
                                                    <span className="text-green-400 flex items-center gap-1 text-xs bg-green-900/20 px-2 py-0.5 rounded"><CheckCircle className="w-3 h-3" /> Sent</span>
                                                ) : status === 'FAILED' ? (
                                                    <span className="text-red-400 flex items-center gap-1 text-xs bg-red-900/20 px-2 py-0.5 rounded cursor-help" title={error || "Unknown Error"}><AlertTriangle className="w-3 h-3" /> Failed</span>
                                                ) : (
                                                    <span className="text-slate-500 text-xs">-</span>
                                                )}
                                            </td>
                                            {extraColumns.map(col => (
                                                <td key={col} className="p-3 max-w-[200px] truncate" title={p.data?.[col] ?? ""}>
                                                    {p.data?.[col] ? p.data[col].toString() : "-"}
                                                </td>
                                            ))}
                                            <td className="p-3 flex items-center">
                                                <button
                                                    onClick={() => setEditingId(p.id)}
                                                    className="text-slate-500 hover:text-white px-3 py-1 bg-white/5 rounded border border-white/10 hover:bg-blue-600 hover:border-blue-500 transition-all mr-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleResendSingle(p)}
                                                    className="text-blue-400 hover:text-white px-3 py-1 bg-blue-900/20 rounded border border-blue-500/30 hover:bg-blue-600 transition-all mr-2"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteParticipant(p.id)}
                                                    className="text-slate-500 hover:text-white px-3 py-1 bg-white/5 rounded border border-white/10 hover:bg-red-600 hover:border-red-500 transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingId && editingParticipant && (
                <EditParticipantModal
                    participant={editingParticipant}
                    allKeys={extraColumns}
                    onClose={() => setEditingId(null)}
                    onSave={handleUpdateParticipant}
                />
            )}
        </>
    );
};

export default ParticipantsList;
