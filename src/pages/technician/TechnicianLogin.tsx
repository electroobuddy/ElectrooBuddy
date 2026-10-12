import { logger } from "@/lib/logger";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Wrench, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getNativeTechnicianApplication, getNativeTechnicianProfile } from "@/lib/nativeTechnician";

const TechnicianLogin = () => {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(form.email, form.password);
      if (error) throw error;
      try { await getNativeTechnicianProfile(); }
      catch (e:any) {
        try {
          const application = await getNativeTechnicianApplication();
          await signOut();
          if (application.approval_status === "pending") throw new Error("Your technician application is still pending admin approval.");
          if (application.approval_status === "rejected") throw new Error("Your technician application was rejected. Contact support before reapplying.");
          throw new Error("Technician approval is required before portal access.");
        } catch (applicationError:any) {
          if (applicationError?.message?.includes("application")) throw applicationError;
          await signOut();
          throw new Error(e?.status === 404 ? "Technician application not found. Please apply first." : "Access denied. Technician approval is required.");
        }
      }
      toast.success("Welcome back!");
      navigate("/technician/dashboard");
    } catch (error: any) {
      logger.error(error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-10 text-center">
            <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Technician Panel</h1>
            <p className="text-blue-100 text-sm">Manage your bookings and profile</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="technician@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end"><Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link></div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>Sign In</>
              )}
            </button>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Technician Access Only</p>
                <p>This portal is exclusively for registered technicians. Contact admin if you need access.</p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/technician/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
            Apply to become a technician
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default TechnicianLogin;
