import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { Navigate } from "react-router-dom";

const SignupPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signup } = useAuth();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    try {
      await signup(data);
      // Redirect to verify email with email in state
      navigate("/verify-email", { state: { email: data.email } });
    } catch (error) {
      setServerError(error.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const { user, loading } = useAuth();

  if (loading) return <div className="text-white text-center p-10">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;


  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-400">Join NexusEvent today</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                {...register("name", { required: "Name is required" })}
                className={clsx(
                  "w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600",
                  errors.name && "border-red-500 focus:ring-red-500"
                )}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <span className="text-xs text-red-400 pl-1">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                className={clsx(
                  "w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600",
                  errors.email && "border-red-500 focus:ring-red-500"
                )}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <span className="text-xs text-red-400 pl-1">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
                className={clsx(
                  "w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600",
                  errors.password && "border-red-500 focus:ring-red-500"
                )}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <span className="text-xs text-red-400 pl-1">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Creating Account..." : <>Create Account <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
