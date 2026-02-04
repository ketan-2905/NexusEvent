import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ParticipantManager from "./pages/ParticipantManager";
import { Events } from "./pages/events/Events";
import Overview from "./pages/dashboard/Overview";
import CheckpointManager from "./components/checkpoints/CheckpointManager";
import StaffManager from "./components/staff/StaffManager";
import StaffCheckpointManager from "./components/checkpoints/StaffCheckpointManager";
import EventLayout from "./components/EventLayout";
import EventStaffLayout from "./components/EventStaffLayout";
import ScannerLayout from "./pages/scanner/ScannerLayout";
import ScannerLogin from "./pages/scanner/ScannerLogin";
import ScannerDashboard from "./pages/scanner/ScannerDashboard";
import ActiveScanner from "./pages/scanner/ActiveScanner";
import { StaffAuthProvider } from "./context/StaffAuthContext"; // Import provider
import StaffProtectedLayout from "./pages/scanner/StaffProtectedLayout"; // Import layout
import CheckpointStats from "./components/stats/CheckpointStats";
import CheckpointStatsStaff from "./components/stats/CheckpointStatsStaff";


const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-white text-center p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-0"> {/* Removed padding to let DashboardLayout handle full screen */}
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected Routes */}
        {/* <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Events />}>
            <Route path="event" element={<EventLayout />} >
              <Route path=":eventId/overview" element={<Overview />} />
              <Route path=":eventId/participants" element={<ParticipantManager />} />
              <Route path=":eventId/checkpoints" element={<CheckpointManager />} />
              <Route path=":eventId/staff" element={<StaffManager />} />
            </Route>
          </Route>
        </Route> */}

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard">
            <Route index element={<Events />} />
            <Route path="event/:eventId" element={<EventLayout />}>
              <Route index element={<Overview />} />
              <Route path="participants" element={<ParticipantManager />} />
              <Route path="checkpoints">
                <Route index element={<CheckpointManager />} />
                <Route
                  path=":checkpointId/stats"
                  element={<CheckpointStats />}
                />
              </Route>
              <Route path="staff" element={<StaffManager />} />
            </Route>
          </Route>
        </Route>

        {/* Scanner Routes */}
        <Route path="/scan" element={
          <StaffAuthProvider>
            <ScannerLayout />
          </StaffAuthProvider>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="login" element={<ScannerLogin />} />

          {/* Protected Scanner Routes */}
          <Route element={<StaffProtectedLayout />}>
            <Route path="dashboard" element={<ScannerDashboard />} />
            <Route path="checkpoint/:checkpointId" element={<ActiveScanner />} />

            {/* Admin Staff View */}
            <Route path="event/:eventId" element={<EventStaffLayout />}>
              <Route index element={<Navigate to="checkpoints" replace />} />
              <Route path="checkpoints">
                <Route index element={<StaffCheckpointManager />} />
                <Route
                  path=":checkpointId/stats"
                  element={<CheckpointStatsStaff />}
                />
              </Route>
            </Route>
          </Route>
        </Route>




        {/* <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Events />} />

            <Route path=":eventId/overview" element={<Overview />} />
            <Route path=":eventId/participants" element={<ParticipantManager />} />
            <Route path=":eventId/checkpoints" element={<CheckpointManager />} />
            <Route path=":eventId/staff" element={<StaffManager />} />
          </Route>
        </Route> */}




        <Route path="*" element={<div className="text-center p-10">404 Not Found</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
