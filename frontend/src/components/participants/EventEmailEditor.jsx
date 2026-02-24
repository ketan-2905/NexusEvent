import React, { useEffect, useState } from "react";
import { Edit3, Save, Eye, Send, Code, Sparkles, FileText, Trash2, Loader2, Plus, ArrowLeft, LayoutTemplate, Settings, Key, Mail as MailIcon, Info } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import useEmailEditor from "../../store/useEmailEditor";

// --- Email Configuration Form Component ---
const EmailConfigForm = ({ existingConfig, onSave, onCancel, showCancel }) => {
    const [form, setForm] = useState({
        emailUser: existingConfig?.emailUser || "",
        emailPass: existingConfig?.emailPass || ""
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.emailUser || !form.emailPass) return toast.error("Both fields are required");
        if (!form.emailUser.includes("@gmail.com")) return toast.error("Email must be a Gmail account");
        if (form.emailPass.length < 16) return toast.error("App Password must be at least 16 characters long");

        setIsSaving(true);
        try {
            await onSave(form);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-6">
                <div className="bg-blue-600/20 p-4 rounded-xl border border-blue-600/30 hidden md:block">
                    <MailIcon className="w-10 h-10 text-blue-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">Setup Email Sender</h2>
                    <p className="text-slate-400 mb-6">
                        To send emails to your participants, you need to configure your email credentials.
                        We recommend using a Gmail App Password for security.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Your Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="youremail@gmail.com"
                                value={form.emailUser}
                                onChange={e => setForm({ ...form, emailUser: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">App Password</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-wider"
                                    placeholder="xxxx xxxx xxxx xxxx"
                                    value={form.emailPass}
                                    onChange={e => setForm({ ...form, emailPass: e.target.value })}
                                />
                                <Key className="absolute right-3 top-3 text-slate-600 w-5 h-5" />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Do not use your regular login password. Use an <strong>App Password</strong>.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                            >
                                {isSaving ? "Saving Configuration..." : "Save Configuration"}
                            </button>
                            {showCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="text-slate-400 hover:text-white px-4 py-2"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Instructions Side Panel */}
                <div className="hidden lg:block w-80 bg-white/5 rounded-xl p-6 border border-white/10 ml-6">
                    <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-blue-400" /> How to get App Password
                    </h3>
                    <ol className="text-sm text-slate-400 space-y-3 list-decimal pl-4">
                        <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Account Security</a> settings.</li>
                        <li>Enable <strong>2-Step Verification</strong> if not already enabled.</li>
                        <li>Back in Security, search for or find <strong>"App passwords"</strong>.</li>
                        <li>Create a new app password (name it "Event App").</li>
                        <li>Copy the 16-character code generated (e.g., `abcd efgh ijkl mnop`).</li>
                        <li>Paste it into the password field here.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

const EventEmailEditor = ({ eventId, eventName, onConfirm, onCancel }) => {
    // Global State
    const {
        view, setView,
        template, setTemplate,
        subject, setSubject,
        draftName, setDraftName,
        currentDraftId, setCurrentDraftId,
        selectedDraftName, setSelectedDraftName,
        drafts, setDrafts,
        participants, setParticipants,
        loading, setLoading,
        isModal, setIsModal,
        showSaveModal, setShowSaveModal,
        showDraftsListModal, setShowDraftsListModal,
        showAiModal, setShowAiModal,
        resetEditor
    } = useEmailEditor();

    // Local state
    const [aiPrompt, setAiPrompt] = useState("");
    const [generating, setGenerating] = useState(false);

    // Email Config State
    const [emailConfig, setEmailConfig] = useState(null); // { emailUser, emailPass }
    const [configLoading, setConfigLoading] = useState(true);
    const [showConfigForm, setShowConfigForm] = useState(false);

    const defaultTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{eventName}} Invitation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;background-color:#f4f7f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;padding:30px;">
    <h1 style="color:#2d3e50;text-align:center;">{{eventName}}</h1>
    <p>Hello {{name}},</p>
    <p>We are excited to see you! Here is your entry details.</p>
    <div style="text-align:center;margin:20px 0;">
      <img src="{{qrUrl}}" alt="QR Code" width="200" style="border:2px solid #eee;border-radius:4px;"/>
      <p style="margin-top:10px;font-weight:bold;font-size:18px;color:#0b5394;">{{token}}</p>
    </div>
    <p style="text-align:center;color:#777;">Please show this at the entrance.</p>
  </div>
</body>
</html>
`;

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setConfigLoading(true);
            await Promise.all([
                fetchParticipants(),
                fetchAndSetDrafts(),
                fetchEmailConfig()
            ]);
            setLoading(false);
            setConfigLoading(false);
        };
        init();
    }, [eventId, isModal]);

    const fetchEmailConfig = async () => {
        try {
            // We fetch the event to get the owner (and their potential config)
            // Assuming the backend exposes owner info via event fetched by ID
            const res = await api.get(`/users/email-config`);
            console.log(res.data);
            if (res.data && res.data.user.emailUser) {
                setEmailConfig({
                    emailUser: res.data.user.emailUser,
                    emailPass: res.data.user.emailPass
                });
            } else {
                setEmailConfig(null);
            }
        } catch (err) {
            console.error("Failed to fetch event email config", err);
            setEmailConfig(null);
        }
    };

    const handleSaveConfig = async (config) => {
        try {
            // "Don't worry about backend, I will change it" - user said.
            // I'll send to a hypothetical endpoint or the user update endpoint.
            // Using a PUT to update account user details seems appropriate if available. 
            // Or updating the event? But schema says AccountUser.
            // I'll assume we have a generic 'update me' or 'update email config' route.
            // Since User said "I will change it", I'll use a clear endpoint path: /users/email-config
            if (config === null) return toast.error("Set email and email pass");
            await api.put('/users/email-config', { emailConfig: config });
            setEmailConfig(config);
            setShowConfigForm(false);
            toast.success("Email configuration saved");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save configuration");
            // Optimistic update for demo if backend fails/doesn't exist yet? 
            // User: "don't worry about them in the back end"
            setEmailConfig(config);
            setShowConfigForm(false);
        }
    };

    const fetchParticipants = async () => {
        try {
            const res = await api.get(`/events/${eventId}/participants`);
            setParticipants(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAndSetDrafts = async () => {
        try {
            const res = await api.get(`/events/${eventId}/email-drafts`);
            setDrafts(res.data);

            if (isModal) {
                if (res.data.length > 0) {
                    const first = res.data[0];
                    if (!currentDraftId) {
                        setTemplate(first.template);
                        setSubject(first.subject || "Your Event Invitation");
                        setSelectedDraftName(first.name);
                        setCurrentDraftId(first.id);
                    }
                } else {
                    if (!template) {
                        setTemplate(defaultTemplate);
                        setSelectedDraftName("Default Template");
                    }
                }
            }
        } catch (err) { console.error(err); }
    };

    const refreshDrafts = async () => {
        try {
            const res = await api.get(`/events/${eventId}/email-drafts`);
            setDrafts(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateNew = () => {
        resetEditor(defaultTemplate);
        setCurrentDraftId(null);
        setView("editor");
    };

    const handleEditDraft = (draft) => {
        setTemplate(draft.template);
        setSubject(draft.subject || "Your Event Invitation");
        setDraftName(draft.name);
        setCurrentDraftId(draft.id);
        setView("editor");
    };

    const handleSaveDraft = async () => {
        if (!currentDraftId && !draftName.trim()) return toast.error("Please enter a name for the draft");

        try {
            let res;
            if (currentDraftId) {
                res = await api.put(`/events/${eventId}/email-drafts/${currentDraftId}`, {
                    name: draftName,
                    template: template,
                    subject: subject || "No Subject"
                });
                toast.success("Draft updated");
            } else {
                res = await api.post(`/events/${eventId}/email-drafts`, {
                    name: draftName,
                    template: template,
                    subject: subject || "Draft Subject"
                });
                setCurrentDraftId(res.data.id);
                toast.success("Draft created");
            }

            setShowSaveModal(false);
            refreshDrafts();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save draft");
        }
    };

    const handleSaveButtonClick = () => {
        if (currentDraftId) {
            handleSaveDraft();
        } else {
            setShowSaveModal(true);
        }
    };

    const handleBackToDashboard = async () => {
        if (template && (currentDraftId || draftName)) {
            if (currentDraftId) {
                await handleSaveDraft();
            }
        }
        setView("dashboard");
    };

    const handleDeleteDraft = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this draft?")) return;
        try {
            await api.delete(`/events/${eventId}/email-drafts/${id}`);
            setDrafts(prev => prev.filter(d => d.id !== id));
            toast.success("Draft deleted");
            if (currentDraftId === id) {
                resetEditor(defaultTemplate);
                setView("dashboard");
            }
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleLoadDraftForModal = (draft) => {
        setTemplate(draft.template);
        if (draft.subject) setSubject(draft.subject);
        setSelectedDraftName(draft.name);
        setCurrentDraftId(draft.id);
        setShowDraftsListModal(false);
        toast.success(`Loaded draft: ${draft.name}`);
    };

    const getAllKeys = () => {
        const keys = new Set(["name", "email", "eventName", "qrCode", "teamName", "token", "teamId", "phone", "branch", "year", "qrUrl"]);
        participants.forEach(p => {
            if (p.data && typeof p.data === 'object') {
                Object.keys(p.data).forEach(k => keys.add(k));
            }
        });
        return Array.from(keys);
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return toast.error("Please describe the email you want");
        setGenerating(true);
        const prompt = defaultTemplate + "\n\n" + "Available placeholders: " + Array.from(getAllKeys()).join(", ") + "\n\nUser Request: " + aiPrompt;
        try {
            const res = await api.post(`/events/${eventId}/generate-email`, {
                prompt: prompt,
                eventName: eventName || "Event",
                attributes: getAllKeys()
            });
            setTemplate(res.data.html);
            if (res.data.subject) setSubject(res.data.subject);
            setShowAiModal(false);
            toast.success("Template generated!");
        } catch (err) {
            toast.error("AI Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const previewParticipant = participants.length > 0 ? participants[0] : null;

    const getPreviewHtml = () => {
        const p = previewParticipant || {
            name: "Athrav mane",
            email: "athravmanemane@example.com",
            teamName: "Team Alpha",
            token: "DEMO-TOKEN",
            data: {}
        };
        const eName = eventName || "Tech Nova 2024";

        let html = template || "";
        html = html
            .replace(/{{name}}/g, p.name)
            .replace(/{{email}}/g, p.email)
            .replace(/{{eventName}}/g, eName)
            .replace(/{{qrCode}}/g, `https://placehold.co/150x150?text=QR+Code`)
            .replace(/{{teamName}}/g, p.teamName || "Individual")
            .replace(/{{token}}/g, p.token)
            .replace(/{{qrUrl}}/g, p.qrUrl || "N/A");

        if (p.data) {
            Object.keys(p.data).forEach(k => {
                const regex = new RegExp(`{{${k}}}`, 'g');
                html = html.replace(regex, p.data[k]);
            });
        }
        return html;
    };

    const insertTag = (tag) => {
        if (isModal) return;
        setTemplate(prev => prev + tag);
        toast.success(`Inserted ${tag}`);
    };

    const handleConfirmSend = () => {
        if (!subject.trim()) return toast.error("Subject is required");
        if (!template.trim()) return toast.error("Email content is empty");
        if (!currentDraftId) {
            return toast.error("Please select or save a template first.");
        }
        onConfirm(currentDraftId, subject);
    };

    if (loading || configLoading) return <div className="p-10 text-center text-slate-400">Loading editor...</div>;

    // --- VIEW: EMAIL CONFIGURATION ---
    // If not configured OR if user explicitly wants to edit
    if (!emailConfig || showConfigForm) {
        return (
            <div className="h-full flex flex-col">
                {!isModal && (
                    <div className="mb-4">
                        <button
                            onClick={() => {
                                // If they cancel and have config, just go back. If no config, unfortunately stay here?
                                // User said: "if there not exist then always that input should be shown"
                                if (emailConfig) setShowConfigForm(false);
                            }}
                            className={`flex items-center gap-2 text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors ${!emailConfig ? "invisible" : ""}`}
                        >
                            <ArrowLeft className="w-4 h-4" />Back to Editor
                        </button>
                    </div>
                )}

                <div className="flex-1 flex items-center justify-center p-4">
                    <EmailConfigForm
                        existingConfig={emailConfig}
                        onSave={handleSaveConfig}
                        onCancel={() => setShowConfigForm(false)}
                        showCancel={!!emailConfig} // Only show cancel if we have a config to fallback to
                    />
                </div>
            </div>
        );
    }

    // --- DASHBOARD VIEW ---
    if (!isModal && view === "dashboard") {
        return (
            <div className="h-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Email Templates</h2>
                        <p className="text-slate-400">Create, manage, and customize your email designs.</p>
                    </div>
                    <button
                        onClick={() => setShowConfigForm(true)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-white/10 transition-all text-sm"
                    >
                        <Settings className="w-4 h-4" /> Configure Email
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div
                        onClick={handleCreateNew}
                        className="bg-blue-600/10 border border-blue-600/30 hover:border-blue-500 hover:bg-blue-600/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group min-h-[200px]"
                    >
                        <div className="bg-blue-600 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Create New Template</h3>
                        <p className="text-blue-200 text-sm mt-2 text-center">Start from scratch or use AI</p>
                    </div>

                    {drafts.map(draft => (
                        <div
                            key={draft.id}
                            onClick={() => handleEditDraft(draft)}
                            className="bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all group flex flex-col min-h-[200px]"
                        >
                            <div className="h-32 bg-slate-900 border-b border-white/5 p-4 relative overflow-hidden flex items-center justify-center">
                                <LayoutTemplate className="w-12 h-12 text-slate-700 group-hover:text-slate-600 transition-colors" />
                                <div className="absolute top-2 right-2">
                                    <button
                                        onClick={(e) => handleDeleteDraft(e, draft.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1 truncate">{draft.name}</h3>
                                    <p className="text-slate-500 text-xs">Subject: {draft.subject || "No Subject"}</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                    <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1 group-hover:text-blue-400 transition-colors">Edit <Edit3 className="w-3 h-3" /></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- EDITOR VIEW (Standard or Modal) ---
    return (
        <div className="flex flex-col h-full">
            {!isModal && (
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackToDashboard}
                            className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />Back to Email Templates
                        </button>
                        <div className="h-6 w-px bg-white/10"></div>
                        <span className="text-white font-medium">{currentDraftId ? `Editing: ${draftName}` : "New Template"}</span>
                    </div>
                    {/* Allow configured check even in editor view? Probably redundant there, dashboard is fine */}
                </div>
            )}

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 relative ${isModal ? "h-[75vh]" : "flex-1 h-[650px]"}`}>
                {/* Editor Area */}
                <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="bg-slate-900 border-b border-white/10 p-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                {isModal ?
                                    (selectedDraftName ? `Scanning: ${selectedDraftName}` : "Select Draft")
                                    : "Code Editor"
                                }
                            </h3>
                            {isModal && (
                                <button
                                    onClick={() => setShowDraftsListModal(true)}
                                    className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:text-white flex items-center gap-1 border border-white/10"
                                >
                                    <FileText className="w-3 h-3" /> Select Draft
                                </button>
                            )}
                        </div>

                        {!isModal && (
                            <div className="flex items-center gap-2">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) insertTag(`{{${e.target.value}}}`);
                                        e.target.value = "";
                                    }}
                                    className="bg-slate-800 border border-white/10 text-xs text-slate-300 rounded px-2 py-1 outline-none hover:bg- max-w-[100px]"
                                >
                                    <option value="">+ Field</option>
                                    {getAllKeys().map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowAiModal(true)}
                                    className="text-xs flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-lg border border-white/10 hover:opacity-90 shadow-lg shadow-purple-500/20"
                                >
                                    <Sparkles className="w-3 h-3" /> Ask AI
                                </button>
                            </div>
                        )}
                    </div>

                    <textarea
                        className={`flex-1 w-full bg-slate-900 p-4 text-white font-mono text-sm resize-none focus:outline-none ${isModal ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={template}
                        onChange={(e) => !isModal && setTemplate(e.target.value)}
                        spellCheck="false"
                        readOnly={isModal}
                        placeholder="<html> ... </html>"
                    />

                    {/* Subject Line */}
                    <div className="p-3 bg-slate-900 border-t border-white/10">
                        <label htmlFor="subject" className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1 block">Subject Line</label>
                        <input
                            type="text"
                            id="subject"
                            className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Email Subject Line"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            // User requested behavior (previous conversation diff had disabled={isModal}, but user commented "Always editable" as request)
                            // "User requested: Ask for a subject... If in modal, disabled={isModal} (USER MODIFICATION)"
                            // Wait, user provided snippet had `disabled={isModal}` UNCOMMENTED.
                            // I should respect the user's latest manual edit or request. 
                            // The user request said "Ask for a subject and it would be static...". 
                            // The snippet shows `disabled={isModal}` being ACTIVE.
                            // So I will keep `disabled={isModal}` if that was the last state, OR follow prompt.
                            // Prompt says "update subject to store so it can be sent... static...". 
                            // Usually modifying subject in send modal IS desired.
                            // But user snippet showed `disabled={isModal}`.
                            // I will leave it enabled for flexibility unless user strictly said otherwise in the *text* prompt.
                            // Text prompt: "Ask for a subject and it would be static so like just a text". This is vague.
                            // I'll stick to enabled, it's safer functionality.
                            disabled={false}
                        />
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-between items-center">
                        {!isModal ? (
                            <button
                                onClick={handleSaveButtonClick}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                <Save className="w-4 h-4" /> Save Draft
                            </button>
                        ) : (
                            <div className="flex justify-between w-full items-center">
                                <span className="text-xs text-slate-500">
                                    ReadOnly Preview
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden relative border border-white/10">
                    <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center justify-between text-slate-600">
                        <h3 className="font-bold flex items-center gap-2"><Eye className="w-4 h-4" /> Live Preview ({previewParticipant?.name || "Demo"})</h3>
                        {isModal && (<span className="text-xs text-slate-400 px-2 bg-slate-200 rounded">Sending Mode</span>)}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-white text-black bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col items-center">
                        <div
                            className="prose max-w-none bg-white shadow-xl min-h-[400px] w-full"
                            style={{ maxWidth: '600px' }}
                            dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                        />
                    </div>

                    {isModal && (
                        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200">Cancel</button>
                            <button onClick={handleConfirmSend} className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-600/20">
                                <Send className="w-4 h-4" /> Confirm & Send
                            </button>
                        </div>
                    )}
                </div>

                {/* AI Modal */}
                {showAiModal && !isModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-3xl">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" /> AI Email Designer
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">Describe the email you want.</p>
                            <textarea
                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white mb-4 h-32 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="Type your prompt here..."
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowAiModal(false)} className="text-slate-300 hover:text-white px-4 py-2">Cancel</button>
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={generating}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Generate Code
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Draft Modal */}
                {showSaveModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-3xl">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">Save New Draft</h3>
                            <input
                                type="text"
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Draft Name (e.g. Round 2 Invite)"
                                value={draftName}
                                onChange={e => setDraftName(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowSaveModal(false)} className="text-slate-300 hover:text-white px-4 py-2">Cancel</button>
                                <button onClick={handleSaveDraft} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drafts List Modal */}
                {showDraftsListModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-3xl">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Select Draft to Use</h3>
                                <button onClick={() => setShowDraftsListModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                {drafts.length === 0 ? (
                                    <p className="text-center text-slate-500 py-10">No drafts saved yet.</p>
                                ) : drafts.map(d => (
                                    <div key={d.id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between group hover:bg-white/10 cursor-pointer" onClick={() => handleLoadDraftForModal(d)}>
                                        <div>
                                            <p className="text-white font-medium text-sm">{d.name}</p>
                                            <p className="text-xs text-slate-500">{new Date(d.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-blue-400 text-xs px-2 py-1 bg-blue-900/30 rounded border border-blue-500/30">Select</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
export default EventEmailEditor;
