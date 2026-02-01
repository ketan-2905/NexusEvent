import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  MapPin
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Outlet, useLocation, useNavigate } from "react-router-dom";
import useEventStore from "../store/eventStore";

const SidebarItem = ({ icon: Icon, label, active, onClick, url }) => (
  <a
    href={url}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </a>
);

const EventLayout = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { eventId } = useParams();

  const pathname = useLocation().pathname.split('/')[4]

  const { fetchEventById } = useEventStore()

  const navigate = useNavigate();

  useEffect(() => {
    if (eventId) {
      fetchEventById(eventId);
    }
  }, [eventId, fetchEventById]);

  const tabs = [
    { id: "participants", label: "Participants", icon: Calendar, url: `/dashboard/event/${eventId}/participants` },
    { id: "checkpoints", label: "Checkpoints", icon: MapPin, url: `/dashboard/event/${eventId}/checkpoints` },
    { id: "staff", label: "Staff", icon: Users, url: `/dashboard/event/${eventId}/staff` },
  ];


  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 font-display">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 p-6 sticky top-0 h-screen bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            N
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            NexusEvent
          </span>
        </div>

        <div className="space-y-2 flex-1">
          {tabs.map((tab) => (
            <SidebarItem
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={pathname === tab.id}
              url={tab.url}
            />
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold border border-white/10">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
          <span className="text-lg font-bold">NexusEvent</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-40 bg-slate-900 pt-16 px-6 pb-6">
            {tabs.map((tab) => (
              <SidebarItem
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={pathname === tab.id}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </div>
        )}

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </button>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default EventLayout;
