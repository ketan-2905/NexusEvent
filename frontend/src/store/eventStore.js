import { create } from "zustand";
import api from "../utils/api";

const useEventStore = create((set, get) => ({
    events: [],
    selectedEvent: null,
    loading: false,
    error: null,
    // Fetch all events
    fetchEvents: async () => {
        try {
            set({ loading: true, error: null });

            const res = await api.get("/events");

            set({ events: res.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    // Fetch single event by ID
    fetchEventById: async (eventId) => {
        try {
            set({ loading: true, error: null });

            const res = await api.get(`/events/${eventId}`);



            set({ selectedEvent: res.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    // Optional helpers
    clearSelectedEvent: () => set({ selectedEvent: null }),
}));

export default useEventStore;
