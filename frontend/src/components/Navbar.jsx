import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

function Navbar({ role }) {
  const { logout } = useAuth();

  const linkClass = "px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors text-slate-100";
  const activeClass = "bg-white/20 text-white shadow-sm backdrop-blur-sm";

  return (
    <nav className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/dashboard" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        NexusEvent
      </Link>

      <div className="flex items-center gap-2">
        {role === "superadmin" && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
              Dashboard
            </NavLink>
          </>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all ml-4 border border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
