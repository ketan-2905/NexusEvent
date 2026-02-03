
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import staffApi from "../../utils/staffApi";
import { ArrowLeft, RefreshCw, LogIn, LogOut, XCircle } from "lucide-react"; // Icons

const ActiveScanner = () => {
    const { checkpointId } = useParams();
    const navigate = useNavigate();

    const [checkpoint, setCheckpoint] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [scanResult, setScanResult] = useState(null); // Validated preview data
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false); // For action request

    useEffect(() => {
        const fetchCheckpoint = async () => {
            try {
                const userRes = await staffApi.get("/staff/me");
                const eventId = userRes.data.eventId;
                if (eventId) {
                    const cpRes = await staffApi.get(`/staff/events/${eventId}/checkpoints`);
                    const found = cpRes.data.find(c => c.id === checkpointId);
                    if (found) setCheckpoint(found);
                    else navigate("/scan/dashboard");
                }
            } catch (err) {
                console.error("Error fetching checkpoint info", err);
                navigate("/scan/dashboard");
            }
        };
        fetchCheckpoint();
    }, [checkpointId, navigate]);

    const handleScan = async (result) => {
        if (!result || !result[0]) return;
        if (loading || scanResult) return; // Prevent double scan

        const qrRaw = result[0].rawValue;
        const parts = qrRaw.split("/");
        const token = parts[parts.length - 1]; // Assume last part is token

        if (!token) return;

        setScanning(false); // Pause Camera
        setLoading(true); // Show spinner
        setErrorMsg("");

        try {
            // New "Preview/Validate" Endpoint
            // We need to implement this in Backend or use a logic here?
            // User requested: "tapping on it it should make entry" implies we verify first.
            // I added POST /staff/validate in previous step.

            const res = await staffApi.post("/staff/validate", {
                token,
                checkpointId
            });

            setScanResult(res.data);
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.error?.message ||   // <-- THIS is the correct path
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Action failed";
            setErrorMsg(msg);
            setScanResult(null); // Show error state
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!scanResult || !scanResult.participant) return;

        setLoading(true);
        try {
            await staffApi.post("/scan", {
                token: scanResult.participant.token, // Use token from validated result
                checkpointId,
                action: scanResult.nextAction // 'entry' or 'exit'
            });

            // Success! 
            // Show result success state or auto-reset?
            // "scanning should be stopped... verifying... shows very fine"
            // Let's show a Success view then button to scan next.
            setScanResult(prev => ({ ...prev, success: true }));

        } catch (err) {
            const msg =
                err.response?.data?.error?.message ||   // <-- THIS is the correct path
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Action failed";
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScanning(true);
        setScanResult(null);
        setErrorMsg("");
        setLoading(false);
    };

    if (!checkpoint) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-start relative overflow-hidden">
            {/* Top Bar */}
            <div className="w-full h-[10%] absolute top-0 left-0 z-20 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => navigate("/scan/dashboard")} className="p-2 backdrop-blur-md bg-white/10 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <div className="font-bold text-lg drop-shadow-md">{checkpoint.name}</div>
                <div className="w-9" /> {/* Spacer */}
            </div>

            {/* Camera Viewport - Square/Aspect Ratio at Top */}
            <div className="w-full h-[68%] bg-black relative shadow-2xl z-10">
                {scanning ? (
                    <Scanner
                        onScan={handleScan}
                        onError={(err) => console.log(err)}
                        components={{
                            audio: true,
                            torch: true,
                        }}
                        styles={{
                            container: { width: "100%", height: "100%" },
                            video: { objectFit: "cover" }
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                        {loading && !scanResult && !errorMsg ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        ) : (
                            <div className="text-center p-6">
                                <div className="mb-2 text-6xl">📷</div>
                                <p>Scanner Paused</p>
                                {errorMsg && (
                                    <div className="mt-4 p-3 bg-red-500/20 text-red-100 rounded-lg border border-red-500/50">
                                        {errorMsg}
                                    </div>
                                )}
                                {(errorMsg || scanResult?.success) && (
                                    <button onClick={resetScanner} className="mt-6 px-6 py-2 bg-white text-slate-900 rounded-full font-bold">
                                        Scan Next
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Scanner Overlay Guide */}
                {scanning && (
                    <div className="absolute inset-0 border-2 border-white/30 m-12 rounded-3xl pointer-events-none flex items-center justify-center">
                        <div className="w-full h-[1px] bg-red-500/50 absolute animate-pulse"></div>
                    </div>
                )}
            </div>

            {/* Bottom Content Area */}
            <div className="w-full h-[22%] bg-slate-900 text-white relative -mt-6 rounded-t-3xl z-20 p-6 flex flex-col ">
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6 opacity-50"></div>

                {!scanResult && !errorMsg ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center h-full">
                        <p className="mb-2 text-lg">Point camera at QR Code</p>
                        <p className="text-sm opacity-60">Scanning for {checkpoint.name}</p>
                    </div>
                ) : scanResult ? (
                    <div className="flex flex-col animate-slide-up h-[22%]">
                        {/* User Info */}
                        <div className="text-center mb-6">
                            {/* <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-lg text-white">
                                {scanResult.participant.name.charAt(0)}
                            </div> */}
                            <h2 className="text-2xl font-bold text-white">{scanResult.participant.name}</h2>
                            <p className="text-slate-400 text-sm mt-1">{scanResult.participant.email}</p>
                            {/* <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
                                {scanResult.participant.token}
                            </div> */}
                        </div>

                        {/* Action Section */}
                        <div className="mt-auto space-y-4">
                            {!scanResult.success ? (
                                <>
                                    {scanResult.nextAction === "entry" && (
                                        <button
                                            onClick={handleConfirmAction}
                                            className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                        >
                                            <LogIn size={24} /> Verify ENTRY
                                        </button>
                                    )}
                                    {scanResult.nextAction === "exit" && (
                                        <button
                                            onClick={handleConfirmAction}
                                            className="w-full py-4 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                        >
                                            <LogOut size={24} /> Verify EXIT
                                        </button>
                                    )}
                                    {scanResult.nextAction === "none" && (
                                        <div className="flex flex-col gap-4"> <div className="w-full py-4 bg-slate-700 text-slate-300 rounded-xl font-bold text-lg text-center flex items-center justify-center gap-2 border border-slate-600 text-[16px]">
                                            <XCircle size={24} /> {scanResult.message}
                                        </div>
                                            <button
                                                onClick={resetScanner}
                                                className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={20} /> Scan Next
                                            </button></div>

                                    )}
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="inline-block p-4 bg-green-500/20 rounded-full text-green-400 mb-4 animate-bounce">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Verified!</h3>
                                    <p className="text-slate-400 mb-6">{scanResult.message}</p>

                                    <button
                                        onClick={resetScanner}
                                        className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={20} /> Scan Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-red-400 text-center">{errorMsg}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActiveScanner;
