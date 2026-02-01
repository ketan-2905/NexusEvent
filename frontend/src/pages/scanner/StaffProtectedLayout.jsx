
import { Navigate, Outlet } from "react-router-dom";
import { useStaffAuth } from "../../context/StaffAuthContext";

const StaffProtectedLayout = () => {
    const { staffUser, loading } = useStaffAuth();

    if (loading) {
        return <div className="bg-slate-900 flex items-center justify-center text-white">Loading Staff Session...</div>;
    }

    if (!staffUser) {
        return <Navigate to="/scan/login" replace />;
    }

    return <Outlet />;
};

export default StaffProtectedLayout;
