import React, { useState, useEffect } from "react";
import { Edit3, Save, Eye, Send, Code, Sparkles, FileText, Trash2, Loader2, Plus } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const EventEmailEditor = ({ eventId, eventName }) => {
    const [template, setTemplate] = useState("");
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState([]);

    // AI & Drafts
    const [aiPrompt, setAiPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [showDrafts, setShowDrafts] = useState(false);

    // Saving Draft
    const [draftName, setDraftName] = useState("");
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Default Template if none exists
    const defaultTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{eventName}} Invitation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f9;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background:#2d3e50;padding:30px 20px;color:#ffffff;">
              <h1 style="margin:0;font-size:28px;letter-spacing:1px;">
                {{eventName}}
              </h1>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:30px 20px;color:#333333;">
              <p style="margin:0 0 15px 0;font-size:16px;">
                Hello {{name}},
              </p>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.5;">
                We’re thrilled to have you join us for a magical night of stargazing and moon‑watching. Below you’ll find your entry details.
              </p>
              <!-- QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <img src="{{qrUrl}}" alt="QR Code" width="200" style="display:block;border:2px solid #2d3e50;border-radius:4px;">
                  </td>
                </tr>
              </table>
              <!-- Token -->
              <p style="margin:0 0 10px 0;font-size:16px;">
                <strong>Entry Code:</strong> <span style="font-size:18px;background:#e8f0fe;color:#0b5394;padding:4px 8px;border-radius:4px;">{{token}}</span>
              </p>
              <p style="margin:0 0 20px 0;font-size:16px;">
                Please present the QR code or the entry code at the entrance.
              </p>
              <!-- Call to Action -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:20px;">
                <tr>
                  <td align="center" bgcolor="#0b5394" style="border-radius:4px;">
                    <a href="https://example.com/" target="_blank" style="display:inline-block;padding:12px 25px;color:#ffffff;font-size:16px;text-decoration:none;">
                      View Event Details 🚀
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f0f3f5;padding:20px;text-align:center;font-size:12px;color:#777777;">
              <p style="margin:0;">If you have any questions, contact us at <a href="mailto:ketangaikwad035@gmail.com" style="color:#0b5394;text-decoration:none;">{contact_email}</a> or call +91 {contact_number}.</p>
              <p style="margin:5px 0 0 0;">© {year} Moon Gazing Events. All rights reserved.</p>
            </td>
          </tr>
        </table>
        <!-- End Container -->
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const [activeDraftId, setActiveDraftId] = useState(null); // Track ID of currently active/loaded draft

    useEffect(() => {
        fetchEventDetails();
        fetchParticipants();
        fetchDrafts();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const res = await api.get(`/events/${eventId}`);
            // If there is an active template relation, use it.
            if (res.data.activeTemplate) {
                setTemplate(res.data.activeTemplate.template);
                setActiveDraftId(res.data.activeTemplate.id);
            } else {
                setTemplate(defaultTemplate);
                setActiveDraftId(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async () => {
        try {
            const res = await api.get(`/events/${eventId}/participants`);
            setParticipants(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchDrafts = async () => {
        try {
            const res = await api.get(`/events/${eventId}/email-drafts`);
            setDrafts(res.data);
        } catch (err) { console.error(err); }
    };

    // This is now "Set Active Template" essentially
    const handleSaveMainTemplate = async () => {
        if (!template.trim()) return toast.error("Template cannot be empty");

        // If we have an active draft linked, ask if we want to update IT or create NEW.
        // For simplicity, let's open the Save Modal but with a flag that we intend to Activate it too.
        // Or better yet, a dedicated "Publish/Activate" flow.

        // User said: "it should ask as a which template you want to save"
        // So let's show a modal with options.
        setShowSaveModal(true); // Re-use save modal or make it smarter
    };

    const handleSaveDraft = async () => {
        if (!draftName.trim()) return toast.error("Please enter a name for the draft");
        try {
            // Create new draft
            const res = await api.post(`/events/${eventId}/email-drafts`, {
                name: draftName,
                template: template,
                subject: "Draft Subject"
            });

            // Should we activate it?
            if (window.confirm("Draft saved. Do you want to set this as the MAIN active template for the event?")) {
                await api.put(`/events/${eventId}`, { activeTemplateId: res.data.id });
                toast.success("Main template updated!");
                setActiveDraftId(res.data.id);
            } else {
                toast.success("Draft saved");
            }

            setDraftName("");
            setShowSaveModal(false);
            fetchDrafts();
        } catch (err) {
            toast.error("Failed to save draft");
        }
    };


    const handleDeleteDraft = async (id) => {
        if (!window.confirm("Delete this draft?")) return;
        try {
            await api.delete(`/events/${eventId}/email-drafts/${id}`);
            setDrafts(prev => prev.filter(d => d.id !== id));
            toast.success("Draft deleted");
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleLoadDraft = (draftTemp) => {
        if (window.confirm("Load this draft? Current unsaved changes will be lost.")) {
            setTemplate(draftTemp);
            setShowDrafts(false);
            toast.success("Draft loaded");
        }
    };

    const getAllKeys = () => {
        const keys = new Set(["name", "email", "eventName", "qrCode", "teamName", "token", "teamId", "phone", "branch", "year", "qrUrl"]);
        participants.forEach(p => {
            if (p.data && typeof p.data === 'object') {
                Object.keys(p.data).forEach(k => {


                    keys.add(k)
                });
            }
        });
        return Array.from(keys);
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return toast.error("Please describe the email you want");
        setGenerating(true);
        try {
            const res = await api.post(`/events/${eventId}/generate-email`, {
                prompt: aiPrompt,
                eventName: eventName || "Event",
                attributes: getAllKeys()
            });
            setTemplate(res.data.html);
            setShowAiModal(false);
            toast.success("Template generated!");
        } catch (err) {
            toast.error("AI Generation failed");
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const previewParticipant = participants.length > 0 ? participants[0] : null;

    const getPreviewHtml = () => {
        const p = previewParticipant || {
            name: "John Doe",
            email: "john@example.com",
            teamName: "Team Alpha",
            token: "DEMO-TOKEN",
            data: {}
        };

        // Mock Event Name if needed
        const eName = eventName || "Tech Nova 2024";

        let html = template
            .replace(/{{name}}/g, p.name)
            .replace(/{{email}}/g, p.email)
            .replace(/{{eventName}}/g, eName)
            .replace(/{{qrCode}}/g, `https://placehold.co/150x150?text=QR+Code`) // Placeholder for preview
            .replace(/{{teamName}}/g, p.teamName || "Individual")
            .replace(/{{token}}/g, p.token)
            .replace(/{{teamId}}/g, p.teamId || "N/A")
            .replace(/{{phone}}/g, p.phone || "N/A")
            .replace(/{{branch}}/g, p.branch || "N/A")
            .replace(/{{year}}/g, p.year || "N/A")
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
        setTemplate(prev => prev + tag);
        toast.success(`Inserted ${tag}`);
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading editor...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px] relative">

            {/* Editor Area */}
            <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 border-b border-white/10 p-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold flex items-center gap-2"><Code className="w-4 h-4" /> Code</h3>
                        <button
                            onClick={() => setShowDrafts(true)}
                            className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:text-white flex items-center gap-1"
                        >
                            <FileText className="w-3 h-3" /> Drafts ({drafts.length})
                        </button>
                    </div>

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
                </div>
                <textarea
                    className="flex-1 w-full bg-slate-900 p-4 text-white font-mono text-sm resize-none focus:outline-none"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    spellCheck="false"
                    placeholder="<html> ... </html>"
                />
                <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-between items-center">
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
                    >
                        <Save className="w-4 h-4" /> Save as Draft
                    </button>
                    <button
                        onClick={handleSaveMainTemplate}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <Save className="w-4 h-4" /> Save Main Template
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden relative border border-white/10">
                <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center justify-between text-slate-600">
                    <h3 className="font-bold flex items-center gap-2"><Eye className="w-4 h-4" /> Live Preview</h3>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs font-medium truncate max-w-[150px]">
                            {previewParticipant ? previewParticipant.name : "Demo User"}
                        </span>
                        <span className="text-xs uppercase bg-slate-200 px-2 py-1 rounded">Read Only</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-white text-black bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                    <div
                        className="prose max-w-none mx-auto bg-white shadow-sm min-h-[400px]"
                        style={{ maxWidth: '600px' }} // Email width simulation
                        dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                </div>
            </div>

            {/* AI Generator Modal */}
            {showAiModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-3xl">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" /> AI Email Designer
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Describe the email you want (e.g., "Registration confirmation for TechNova with a QR code").
                            We'll format it beautifully with inline CSS.
                        </p>
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
                        <h3 className="text-lg font-bold text-white mb-4">Save/Active Template</h3>
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

            {/* Drafts List Modal (Overlay) */}
            {showDrafts && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-3xl">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Saved Drafts</h3>
                            <button onClick={() => setShowDrafts(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {drafts.length === 0 ? (
                                <p className="text-center text-slate-500 py-10">No drafts saved yet.</p>
                            ) : drafts.map(d => (
                                <div key={d.id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between group hover:bg-white/10">
                                    <div>
                                        <p className="text-white font-medium text-sm">{d.name}</p>
                                        <p className="text-xs text-slate-500">{new Date(d.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleLoadDraft(d.template)} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-900/30 rounded border border-blue-500/30">Load</button>
                                        <button onClick={() => handleDeleteDraft(d.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
export default EventEmailEditor;
