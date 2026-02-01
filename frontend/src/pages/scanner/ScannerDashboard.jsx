import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import staffApi from "../../utils/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext"; // Import context
// import socket from "../../socket";

const ScannerDashboard = () => {
    const [checkpoints, setCheckpoints] = useState([]);
    const [event, setEvent] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true); // Renamed to avoid conflict if we used context loading
    const navigate = useNavigate();
    const { staffUser, logout } = useStaffAuth(); // Consume context

    useEffect(() => {
        const fetchData = async () => {
            if (!staffUser) return; // Should be handled by protected layout, but safe check

            try {
                // 1. Get User/Event Info from Context (already loaded!)
                // const userRes = await staffApi.get("/staff/me"); -- removed redundant call
                // const user = userRes.data;
                const user = staffUser;

                if (user.type !== "staff") {
                    throw new Error("Invalid User Type");
                }

                const eventId = user.eventId;

                if (!eventId) {
                    setIsLoadingData(false);
                    return;
                }

                // 2. Fetch Event Details (Name, etc.)
                // Use new staff-specific route that bypasses ownership check but enforces assignment check
                const eventRes = await staffApi.get(`/staff/events/${eventId}`);
                setEvent(eventRes.data);

                // 3. Fetch Checkpoints
                const cpRes = await staffApi.get(`/staff/events/${eventId}/checkpoints`);
                setCheckpoints(cpRes.data || []);

                setIsLoadingData(false);

                // Socket Logic
                // socket.on(`event:${eventId}:checkpoint:updated`, (updated) => {
                //     setCheckpoints(prev => prev.map(p => p.id === updated.id ? updated : p));
                // });

            } catch (err) {
                console.error("Dashboard Load Error", err);
                setIsLoadingData(false);
            }
        };

        fetchData();
        // return () => {
        //     socket.offAny(); // Cleanup broadly or specific
        // }
    }, [staffUser]); // Depend on staffUser

    if (isLoadingData) return <div className="p-10 text-center text-white">Loading Dashboard Data...</div>;

    if (!event) return <div className="p-10 text-center text-white">No active event found.</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    {event.name}
                </h1>
                <p className="text-slate-400">Select a checkpoint to start scanning</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {checkpoints.map(cp => (
                    <button
                        key={cp.id}
                        onClick={() => navigate(`/scan/checkpoint/${cp.id}`)}
                        className="group relative p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-slate-700/50 transition-all text-left shadow-lg overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                                    {cp.name}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                                    {cp.type}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={() => {
                        logout();
                        navigate("/scan/login");
                    }}
                    className="text-slate-500 hover:text-red-400 text-sm underline"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default ScannerDashboard;
