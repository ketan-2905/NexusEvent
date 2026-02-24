import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";

const VerifyEmailPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { verifyEmail, resendCode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      await verifyEmail(email, data.code);
    } catch (error) {
      setServerError(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    try {
      await resendCode(email);
      setResendMessage("Code resent successfully!");
    } catch (error) {
      setServerError(error.response?.data?.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Verify Email</h2>
          <p className="text-slate-400">Enter the code sent to <span className="text-white font-medium">{email}</span></p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {serverError}
          </div>
        )}
        
        {resendMessage && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {resendMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Verification Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                {...register("code", { required: "Code is required", minLength: { value: 6, message: "Must be 6 digits" } })}
                className={clsx(
                  "w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600 tracking-widest text-lg",
                  errors.code && "border-red-500 focus:ring-red-500"
                )}
                placeholder="123456"
              />
            </div>
            {errors.code && <span className="text-xs text-red-400 pl-1">{errors.code.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Verifying..." : <>Verify Email <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", resendLoading && "animate-spin")} />
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
