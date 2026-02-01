
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ScannerLayout = () => {
    // This layout can handle scanner-specific shared UI or auth checks
    // For now, it just renders the outlet. 
    // We might want to check if user is staff here, but login page is also under /scan usually? 
    // Actually, usually /scan is the prefix.

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Outlet />
        </div>
    );
};

export default ScannerLayout;
