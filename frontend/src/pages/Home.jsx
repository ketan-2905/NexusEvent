import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import EventsList from "../components/events/EventsList";
import CreateEventModal from "../components/events/CreateEventModal";
import StaffManager from "../components/staff/StaffManager";
import CheckpointManager from "../components/checkpoints/CheckpointManager";
import api from "../utils/api";

const Home = () => {
    const [activeTab, setActiveTab] = useState("events"); // overview, events, staff, checkpoints
    const [events, setEvents] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { user } = useAuth();

    // Fetch events on mount and when tab changes to ensure freshness
    useEffect(() => {
        fetchEvents();
    }, [activeTab]);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events");
            setEvents(res.data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "overview":

            case "events":
                return <EventsList events={events} onCreateOpen={() => setIsCreateModalOpen(true)} />;
            case "checkpoints":
                return <CheckpointManager events={events} />;
            case "staff":
                return <StaffManager events={events} />;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default Home;
