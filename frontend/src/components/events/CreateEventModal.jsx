import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import api from "../../utils/api";

const CreateEventModal = ({ isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post("/events", data);
            reset();
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Create New Event</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-400">Event Name</label>
                        <input {...register("name", { required: true })} className="w-full bg-slate-800 border-none rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500" placeholder="Your event" />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
