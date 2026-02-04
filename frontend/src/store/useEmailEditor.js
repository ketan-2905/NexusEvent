import { create } from 'zustand';

const useEmailEditor = create((set, get) => ({
    // Editor State
    view: 'dashboard', // 'dashboard' | 'editor'
    template: '',
    subject: 'Your Event Invitation',
    draftName: '',
    currentDraftId: null, // This is the ID of the draft being edited OR selected for sending
    selectedDraftName: '', // For display in modal mode

    // Data & Loading
    drafts: [],
    participants: [],
    loading: false,

    // UI Modals
    isModal: false, // Are we in the "Send Email" modal?
    showSaveModal: false,
    showDraftsListModal: false,
    showAiModal: false,

    // Actions
    setView: (view) => set({ view }),
    setTemplate: (template) => set({ template }),
    setSubject: (subject) => set({ subject }),
    setDraftName: (draftName) => set({ draftName }),
    setCurrentDraftId: (id) => set({ currentDraftId: id }),
    setSelectedDraftName: (name) => set({ selectedDraftName: name }),

    setDrafts: (drafts) => set({ drafts }),
    setParticipants: (participants) => set({ participants }),
    setLoading: (loading) => set({ loading }),

    setIsModal: (isModal) => set({ isModal }),
    setShowSaveModal: (show) => set({ showSaveModal: show }),
    setShowDraftsListModal: (show) => set({ showDraftsListModal: show }),
    setShowAiModal: (show) => set({ showAiModal: show }),

    // Reset for "Create New"
    resetEditor: (defaultTemplate) => set({
        template: defaultTemplate || '',
        subject: 'Your Event Invitation',
        draftName: '',
        currentDraftId: null,
        selectedDraftName: '',
        view: 'editor'
    }),

    // Reset when closing everything
    resetAll: () => set({
        view: 'dashboard',
        template: '',
        subject: '',
        draftName: '',
        currentDraftId: null,
        selectedDraftName: '',
        isModal: false,
        showSaveModal: false,
        showDraftsListModal: false,
        showAiModal: false
    })
}));

export default useEmailEditor;
