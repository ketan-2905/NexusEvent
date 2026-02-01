import React, { useEffect } from 'react'
import useEventStore from '../../store/eventStore';
import { useParams } from 'react-router-dom';

const Overview = () => {
    const { selectedEvent, fetchEventById } = useEventStore()
    const { eventId } = useParams();

    // useEffect(() => {
    //     if (eventId) {
    //         fetchEventById(eventId);
    //     }
    // }, [eventId, fetchEventById]);

    if (!selectedEvent) {
        return <div className="text-slate-400">Loading event...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-blue-200 font-medium mb-1">Event Name</h3>
                <p className="text-4xl font-bold">{selectedEvent.name}</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 text-white border border-white/5">
                <h3 className="text-slate-400 font-medium mb-1">Active Staff</h3>
                {/* Calculated from selectedEvent expansion, simplified for now */}
                <p className="text-4xl font-bold">{selectedEvent.staff.length}</p>
            </div>
        </div>
    );
}

export default Overview;
