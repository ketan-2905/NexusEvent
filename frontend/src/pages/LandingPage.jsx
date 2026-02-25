import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Shield, Zap } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-display selection:bg-blue-500 selection:text-white overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          NexusEvent
        </div>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-500 transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center mt-20 px-4">
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Next Gen Event Management
        </div> */}

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
          Manage Events with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-gradient-x">
            Unmatched Precision
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          The ultimate platform for secure QR ticketing, real-time analytics, and seamless entry management.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/signup"
            className="group relative px-8 py-4 rounded-full bg-white text-slate-900 font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 overflow-hidden"
          >
            <span className="relative z-10">Get Started Now</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-white opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-4 rounded-full glass-button border border-white/10 hover:bg-white/5 transition-all font-medium backdrop-blur-sm"
          >
            Access Dashboard
          </Link>
        </div>

        <div className="mt-8">
          <Link
            to="/scan"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium border-b border-transparent hover:border-blue-400 pb-0.5"
          >
            Event Staff/Scanner? Start Here →
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full px-4 text-left">
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-blue-400" />}
            title="Secure Auth"
            description="Enterprise-grade security with verified accounts and role-based access."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-purple-400" />}
            title="Real-time Sync"
            description="Instant updates across all devices for check-ins and payments."
          />
          <FeatureCard
            icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
            title="Easy Validation"
            description="Lightning fast QR scanning and participant verification."
          />
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10 backdrop-blur-md group">
    <div className="mb-4 p-3 rounded-xl bg-slate-800/50 w-fit group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
