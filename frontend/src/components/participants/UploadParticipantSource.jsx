import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, FileText, AlertCircle, Loader2, Trash2, X } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import api from "../../utils/api";

const UploadParticipantSource = ({ eventId, onUploaded, sources, onDelete }) => {
    const { register, watch, reset } = useForm();
    const [activeUploads, setActiveUploads] = useState([]); // Array of { id, name, status: 'uploading' | 'error', errorMsg? }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Max 5MB check
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File bigger than 5MB");
            return;
        }

        // Add to active uploads
        const tempId = Date.now().toString();
        setActiveUploads(prev => [{ id: tempId, name: file.name, status: "uploading" }, ...prev]);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post(`/events/${eventId}/sources`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Success
            toast.success("File uploaded successfully");
            onUploaded(); // Refresh DB list

            // Remove from active uploads
            setActiveUploads(prev => prev.filter(u => u.id !== tempId));
        } catch (err) {
            console.error("Upload failed", err);
            const msg = err.response?.data?.message || "Upload failed";
            toast.error(msg);

            // Update status to error
            setActiveUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: "error", errorMsg: msg } : u));
        }

        // Reset input so change event fires again if same file selected
        e.target.value = "";
    };

    const clearErrorUpload = (id) => {
        setActiveUploads(prev => prev.filter(u => u.id !== id));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Upload Box */}
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center h-full flex flex-col justify-center transition-all hover:bg-white/10 relative group">
                    <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upload Participant List</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">Click or Drag & Drop CSV/Excel file here. (Max 5MB)</p>

                    {/* Hidden File Input covering the area */}
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="pointer-events-none">
                        <button className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-600/20">
                            Select File
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Files List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[500px] flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    Files <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{sources.length + activeUploads.length}</span>
                </h3>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Active Uploads Section */}
                    {activeUploads.map(upload => (
                        <div key={upload.id} className={clsx(
                            "p-4 rounded-xl flex items-center justify-between border transition-all",
                            upload.status === "error" ? "bg-red-500/10 border-red-500/20" : "bg-blue-600/10 border-blue-500/20"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", upload.status === "error" ? "bg-red-500/20 text-red-400" : "bg-blue-600/20 text-blue-400")}>
                                    {upload.status === "uploading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-white font-medium truncate max-w-[200px]">{upload.name}</p>
                                    <p className={clsx("text-xs uppercase", upload.status === "error" ? "text-red-400" : "text-blue-400")}>
                                        {upload.status === "uploading" ? "Uploading..." : "Failed"}
                                    </p>
                                </div>
                            </div>
                            {upload.status === "error" && (
                                <button onClick={() => clearErrorUpload(upload.id)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                            )}
                        </div>
                    ))}

                    {/* Database Sources */}
                    {sources.length === 0 && activeUploads.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No files uploaded yet.</p>
                        </div>
                    ) : (
                        sources.map(source => (
                            <div key={source.id} className="bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium truncate max-w-[200px]">{source.fileName}</p>
                                        <p className="text-xs text-slate-500 uppercase flex items-center gap-1">
                                            {source.status === "PROCESSED" ? <span className="text-emerald-400">Processed</span> : source.status}
                                            • {new Date(source.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDelete(source.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete File"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadParticipantSource;
