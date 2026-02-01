import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { AlertTriangle, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailLogs = ({ eventId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retryingId, setRetryingId] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [eventId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/events/${eventId}/email-logs`);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (log) => {
        setRetryingId(log.id);
        const toastId = toast.loading(`Retrying for ${log.participant.name}...`);
        try {
            await api.post(`/events/${eventId}/participants/${log.participantId}/send-email`, {});
            toast.success("Email sent successfully!");
            // Refresh logs
            fetchLogs();
        } catch (err) {
            console.error(err);
            toast.error("Retry failed: " + (err.response?.data?.message || err.message));
        } finally {
            setRetryingId(null);
            toast.dismiss(toastId);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading logs...</div>;

    const failedLogs = logs.filter(l => l.status === "FAILED");
    const otherLogs = logs.filter(l => l.status !== "FAILED");

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Email Error Logs
                    <span className="text-sm bg-red-900/20 text-red-400 px-2 py-0.5 rounded-full">{failedLogs.length} Failed</span>
                </h3>
                <button onClick={fetchLogs} className="text-slate-400 hover:text-white p-2">
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Failed Section */}
                <div className="space-y-3">
                    {failedLogs.length === 0 ? (
                        <div className="p-4 rounded-xl bg-green-900/10 border border-green-500/20 text-green-400 text-center">
                            No active errors found. Great job!
                        </div>
                    ) : (
                        failedLogs.map(log => (
                            <div key={log.id} className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-bold">{log.participant?.name || "Unknown Participant"}</p>
                                    <p className="text-red-300 text-sm mt-1">Error: {log.error}</p>
                                    <p className="text-slate-500 text-xs mt-1">{new Date(log.sentAt).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => handleRetry(log)}
                                    disabled={retryingId === log.id}
                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                >
                                    {retryingId === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                    Retry
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Others (sent) - Optional/Collapsible */}
                {otherLogs.length > 0 && (
                    <div className="pt-6 border-t border-white/10">
                        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Recently Sent</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-2">Name</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otherLogs.slice(0, 10).map(log => (
                                        <tr key={log.id} className="border-b border-white/5">
                                            <td className="p-2 text-white">{log.participant?.name}</td>
                                            <td className="p-2 text-green-400">Sent</td>
                                            <td className="p-2">{new Date(log.sentAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailLogs;
