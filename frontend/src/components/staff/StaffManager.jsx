import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, ChevronRight, X, Plus } from "lucide-react";
import clsx from "clsx";
import api from "../../utils/api";
import { useParams } from "react-router-dom";
import useEventStore from "../../store/eventStore";

const StaffManager = () => {
    const { register, handleSubmit, reset } = useForm();
    const [loading, setLoading] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [staffList, setStaffList] = useState({}); // { eventId: [staff] }
    const [fetchingStaff, setFetchingStaff] = useState(false);
    const [message, setMessage] = useState("");
    const [addStaffFor, setAddStaffFor] = useState(null); // eventId to add staff to

    const { eventId } = useParams()
    const { selectedEvent } = useEventStore()

    useEffect(() => {
        if (eventId) {
            fetchStaff()
        }
    }, [eventId])

    const toggleEvent = async () => {
        if (expandedEventId === eventId) {
            setExpandedEventId(null);
        } else {
            setExpandedEventId(eventId);
            if (!staffList[eventId]) {
                await fetchStaff(eventId);
            }
        }
    };

    const fetchStaff = async () => {
        setFetchingStaff(true);
        try {
            const res = await api.get(`/events/${eventId}/staff`);
            setStaffList(prev => ({ ...prev, [eventId]: res.data }));
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingStaff(false);
        }
    };

    const onAddStaff = async (data) => {
        if (!addStaffFor) return;
        setLoading(true);
        setMessage("");
        try {
            await api.post(`/events/${addStaffFor}/staff`, {
                name: data.name,
                email: data.email,
                role: data.role
            });
            setMessage("Staff added & credentials sent!");
            reset();
            // Refresh staff list
            await fetchStaff(addStaffFor);
            setTimeout(() => {
                setAddStaffFor(null);
                setMessage("");
            }, 1500);
        } catch (err) {
            setMessage("Error: " + (err.response?.data?.message || "Failed to add staff"));
        } finally {
            setLoading(false);
        }
    };


    if (!selectedEvent) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Manage Staff</h2>
            </div>

            <div className="space-y-4">

                <div key={selectedEvent.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all">
                    <button
                        onClick={() => toggleEvent(selectedEvent.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                    >

                        <div>
                            <h3 className="text-lg font-bold text-white">{selectedEvent.name}</h3>
                            <p className="text-sm text-slate-400">{selectedEvent._count?.staff || 0} Staff Members</p>
                        </div>
                    </button>


                    <div className="border-t border-white/10 bg-slate-900/50 p-6">
                        {fetchingStaff && !staffList[selectedEvent.id] ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-400" /></div>
                        ) : (
                            <div>
                                {/* Staff List */}
                                <div className="space-y-3 mb-6">
                                    {staffList[selectedEvent.id]?.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-4">No staff assigned yet.</p>
                                    ) : (
                                        staffList[selectedEvent.id]?.map(staff => (
                                            <div key={staff.id} className={clsx("flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5", !staff.isActive && "opacity-50")}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white">
                                                        {staff.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{staff.name}</p>
                                                        <p className="text-xs text-slate-500">{staff.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        className="bg-slate-900 border border-white/10 rounded-lg p-1 text-xs text-slate-300 outline-none focus:border-blue-500"
                                                        value={staff.role}
                                                        onChange={async (e) => {
                                                            const newRole = e.target.value;
                                                            try {
                                                                await api.put(`/events/${selectedEvent.id}/staff/${staff.id}`, { role: newRole, isActive: staff.isActive });
                                                                fetchStaff(); // Refresh
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert("Failed to update role");
                                                            }
                                                        }}
                                                    >
                                                        <option value="SCANNER">Scanner</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>

                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await api.put(`/events/${selectedEvent.id}/staff/${staff.id}`, { role: staff.role, isActive: !staff.isActive });
                                                                fetchStaff(); // Refresh
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert("Failed to update status");
                                                            }
                                                        }}
                                                        className={clsx("text-xs px-2 py-1 rounded border transition-colors",
                                                            staff.isActive
                                                                ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                                                                : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                                        )}
                                                    >
                                                        {staff.isActive ? "Active" : "Inactive"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Staff Button/Form */}
                                {addStaffFor === selectedEvent.id ? (
                                    <div className="bg-slate-800 rounded-xl p-4 border border-blue-500/30 shadow-lg shadow-blue-900/20">
                                        <div className="flex justify-between mb-4">
                                            <h4 className="text-white font-medium">Add New Staff</h4>
                                            <button onClick={() => setAddStaffFor(null)}><X className="w-4 h-4 text-slate-400" /></button>
                                        </div>
                                        <form onSubmit={handleSubmit(onAddStaff)} className="space-y-3">
                                            <input {...register("name", { required: true })} placeholder="Name" className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            <input {...register("email", { required: true })} placeholder="Email" className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            <select {...register("role")} className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-sm">
                                                <option value="SCANNER">Show Admin (Scanner)</option>
                                                <option value="ADMIN">Co-Admin (Full Access)</option>
                                            </select>
                                            {message && <p className={clsx("text-xs", message.startsWith("Error") ? "text-red-400" : "text-emerald-400")}>{message}</p>}
                                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium flex justify-center gap-2">
                                                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Add Member
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddStaffFor(selectedEvent.id)}
                                        className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Staff Member
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default StaffManager;
