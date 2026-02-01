import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
// import socket from "../socket";

const QRScanner = () => {
    const [checkpoints, setCheckpoints] = useState([]);
    const [eventId, setEventId] = useState(null);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [token, setToken] = useState("");
    const [scanning, setScanning] = useState(false);
    const [resultMessage, setResultMessage] = useState("");
    const [participantStatus, setParticipantStatus] = useState(null); // INSIDE / EXITED / NOT_VISITED
    const [isvalidating, setIsValidating] = useState(false);

    const [scannedUser, setScannedUser] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const authToken = localStorage.getItem("token");



    useEffect(() => {
        const fetchUserAndCheckpoints = async () => {
            try {
                // 1. Get User Info to determine Admin vs Staff
                const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                if (!userRes.ok) {
                    console.error("Failed to fetch user info");
                    return;
                }
                const userData = await userRes.json();

                let targetEventId = null;

                if (userData.type === "staff") {
                    targetEventId = userData.eventId;
                } else {
                    // If Admin, for now we might need to let them pick an event or fetch the first active one.
                    // IMPORTANT: The user said "checking into the add event staff".
                    // If admin is scanning, they should probably select an event. 
                    // For this MVP step, let's fetch the most recent event or all checkpoints if possible (but backed blocked it).
                    // Let's assume Admin selects event elsewhere or we fetch the first one.
                    const eventsRes = await fetch(`${API_BASE_URL}/events`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    const events = await eventsRes.json();
                    if (events.length > 0) {
                        targetEventId = events[0].id; // Default to first event for Admin simplicity
                    }
                }

                if (!targetEventId) {
                    console.error("No active event found for scanning.");
                    return;
                }

                setEventId(targetEventId); // Set state for socket subscription

                // 2. Fetch Checkpoints for the target event
                const res = await fetch(`${API_BASE_URL}/events/${targetEventId}/checkpoints`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const data = await res.json();
                setCheckpoints(Array.isArray(data) ? data : []);

            } catch (err) {
                console.error("Failed to load data:", err);
            }
        };

        if (authToken) {
            fetchUserAndCheckpoints();
        }

        return () => {
            // Cleanup socket listeners will be handled inside the effect if we move logic there, 
            // but for now, we can't easily subscribe to dynamic eventId outside. 
            // Ideally we need state for eventId.  
        };
    }, [authToken, API_BASE_URL]);

    // Separate effect for socket subscription once eventId is known
    // We need to store eventId in state to use it here.
    useEffect(() => {
        if (!eventId) return;

        const handleUpdate = (updatedCheckpoint) => {
            setCheckpoints(prev => {
                const index = prev.findIndex(c => c.id === updatedCheckpoint.id);
                if (index > -1) {
                    const newArr = [...prev];
                    newArr[index] = updatedCheckpoint;
                    return newArr;
                }
                return [...prev, updatedCheckpoint];
            });
        };

        const handleCreate = (newCheckpoint) => {
            setCheckpoints(prev => [...prev, newCheckpoint]);
        };

        const handleDelete = ({ id }) => {
            setCheckpoints(prev => prev.filter(c => c.id !== id));
        };

        // socket.on(`event:${eventId}:checkpoint:updated`, handleUpdate);
        // socket.on(`event:${eventId}:checkpoint:created`, handleCreate);
        // socket.on(`event:${eventId}:checkpoint:deleted`, handleDelete);

        // return () => {
        //     socket.off(`event:${eventId}:checkpoint:updated`, handleUpdate);
        //     socket.off(`event:${eventId}:checkpoint:created`, handleCreate);
        //     socket.off(`event:${eventId}:checkpoint:deleted`, handleDelete);
        // };
    }, [eventId]);

    // ✅ Check participant status once valid token entered or scanned
    useEffect(() => {
        const fetchStatus = async () => {
            if (token.length < 5 || !selectedCheckpoint) return;

            try {
                const res = await fetch(
                    `${API_BASE_URL}/participant-status/${token}/${selectedCheckpoint.id}`,
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Status fetch failed");

                setParticipantStatus(data.status);
            } catch (err) {
                console.error("Status check failed:", err);
                setParticipantStatus(null);
            }
        };

        fetchStatus();
    }, [token, selectedCheckpoint]);

    // ✅ Handle QR Scan
    const handleScan = (result) => {
        if (result && result[0]) {
            const qrText = result[0].rawValue;
            const parts = qrText.split("/");
            const qrToken = parts[parts.length - 1];
            setToken(qrToken);
            setScanning(false);
        }
    };

    // ✅ Validate entry or exit
    const handleValidate = async (action) => {
        if (!token || !selectedCheckpoint) return alert("Missing data");

        try {
            setIsValidating(true);
            const res = await fetch(`${API_BASE_URL}/scan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    token,
                    checkpointId: selectedCheckpoint.id,
                    action,
                }),
            });

            const data = await res.json();

            if (!res.ok)
                throw new Error(data.error.message || "Error validating scan");


            setScannedUser(data.participant);

            setResultMessage(
                `✅ ${data.message}. Active participants: ${data.activeCount}`
            );
            setParticipantStatus(action === "entry" ? "INSIDE" : "EXITED");
            setToken("");

            setIsValidating(false);
        } catch (err) {
            console.error(err);
            setResultMessage(`❌ ${err.message}`);
            setIsValidating(false);
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center">📍 Checkpoints</h1>

            {/* Checkpoint Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {checkpoints.map((cp) => (
                    <div
                        key={cp.id}
                        onClick={() => {
                            setSelectedCheckpoint(cp);
                            setShowModal(true);
                            setResultMessage("");
                            setToken("");
                            setParticipantStatus(null);
                        }}
                        className="p-5 bg-white rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-transform transform hover:-translate-y-1"
                    >
                        <h2 className="text-xl font-semibold">{cp.name}</h2>
                        <p className="text-gray-600">{cp.type}</p>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && selectedCheckpoint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setScannedUser(null);
                                setResultMessage("");
                                setToken("");
                                setParticipantStatus(null);
                                setScanning(false);
                            }}
                            className="absolute top-3 right-4 text-gray-500 hover:text-red-600"
                        >
                            ✖
                        </button>

                        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">
                            {selectedCheckpoint.name}
                        </h2>

                        {/* Scanner */}
                        {scanning ? (
                            <div className="mb-4">
                                <Scanner
                                    onScan={handleScan}
                                    onError={() => setScanning(false)}
                                    styles={{ container: { width: "100%" } }}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setScanning(true);
                                    setScannedUser(null);
                                    setResultMessage("");
                                }}
                                className="bg-green-500 text-white py-2 px-4 rounded w-full mb-4"
                            >
                                📷 Open Camera
                            </button>
                        )}

                        {/* Manual Input */}
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter Token Manually"
                            className="w-full p-2 border rounded mb-4"
                        />

                        {/* Conditional Buttons */}
                        {token.length >= 5 && participantStatus && (
                            <div className="flex gap-3">
                                {participantStatus !== "INSIDE" && (
                                    <button
                                        onClick={() => handleValidate("entry")}
                                        className={`bg-blue-500 text-white px-4 py-2 rounded w-full ${isvalidating ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                        disabled={isvalidating}
                                    >
                                        {isvalidating ? "Validating..." : "Validate Entry"}
                                    </button>
                                )}
                                {participantStatus === "INSIDE" && (
                                    <button
                                        onClick={() => handleValidate("exit")}
                                        className={`bg-red-500 text-white px-4 py-2 rounded w-full ${isvalidating ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                        disabled={isvalidating}
                                    >
                                        {isvalidating ? "Validating..." : "Validate Exit"}
                                    </button>
                                )}
                            </div>
                        )}

                        {scannedUser && (
                            <div className="mt-3 p-3 border rounded bg-gray-100 text-sm">
                                <p>
                                    <strong>Name:</strong> {scannedUser.name}
                                </p>
                                <p>
                                    <strong>Email:</strong> {scannedUser.email}
                                </p>
                                <p>
                                    <strong>Phone:</strong> {scannedUser.phone}
                                </p>
                                <p>
                                    <strong>Branch:</strong> {scannedUser.branch || "N/A"}
                                </p>
                                <p>
                                    <strong>Year:</strong> {scannedUser.year || "N/A"}
                                </p>
                                <p>
                                    <strong>Token:</strong> {scannedUser.token}
                                </p>
                            </div>
                        )}

                        {/* Result Message */}
                        {resultMessage && (
                            <div className="mt-4 text-center font-semibold">
                                {resultMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
