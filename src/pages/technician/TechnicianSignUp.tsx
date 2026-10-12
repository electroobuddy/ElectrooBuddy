import { logger } from "@/lib/logger";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Mail, Lock, User, Phone, MapPin, Briefcase, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { isNativeApiError, nativeApiErrorMessage, nativeRegister, nativeLogin, nativeLogout } from "@/lib/apiClient";
import { submitNativeTechnicianApplication } from "@/lib/nativeTechnician";

const TechnicianSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    experience: 0,
    skills: [] as string[],
  });

  const skillOptions = [
    "Electrical Repair", "HVAC", "Plumbing", "Appliance Repair",
    "Electronics", "Carpentry", "Painting", "Cleaning",
    "General Maintenance", "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (form.skills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.password.length < 12 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      toast.error("Password must be at least 12 characters and include upper/lowercase and a number");
      return;
    }

    setLoading(true);

    try {
      let loggedIn = false;
      try {
        await nativeLogin(form.email, form.password);
        loggedIn = true;
      } catch (loginError) {
        if (isNativeApiError(loginError) && loginError.code === "EMAIL_NOT_VERIFIED") {
          toast.info("Verify your email, then return here and submit the form again to finish your technician application.", { duration:7000 });
          navigate(`/verify-email?email=${encodeURIComponent(form.email)}&returnTo=${encodeURIComponent('/technician/signup')}`);
          return;
        }
        try {
          await nativeRegister(form.email, form.password);
          toast.success("Account created. Verify your email before submitting the technician application.", { duration:7000 });
          navigate(`/verify-email?email=${encodeURIComponent(form.email)}&returnTo=${encodeURIComponent('/technician/signup')}`);
          return;
        } catch (registerError) {
          if (!(isNativeApiError(registerError) && registerError.status === 409)) throw registerError;
          throw loginError;
        }
      }
      if (!loggedIn) throw new Error("Unable to authenticate technician application.");
      await submitNativeTechnicianApplication({
        name:form.name.trim(),email:form.email.trim(),phone:form.phone.trim()||null,address:form.address.trim()||null,
        skills:form.skills,experience:form.experience,profileUrl:null
      });
      await nativeLogout();
      toast.success("Application submitted successfully. You can sign in after admin approval.", { duration:5000 });
      navigate("/technician/login");
    } catch (error) {
      logger.error(error);
      toast.error(nativeApiErrorMessage(error, "Sign up failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-10 text-center">
            <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Become a Technician</h1>
            <p className="text-blue-100 text-sm">Join our team and start managing bookings</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700 pb-2">
                Personal Information
              </h3>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Service Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>

            {/* Professional Info Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700 pb-2">
                Professional Details
              </h3>

              {/* Experience */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Years of Experience
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="number"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="50"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  Skills & Expertise * (Select at least one)
                </label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.skills.includes(skill)
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {form.skills.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">Please select at least one skill</p>
                )}
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700 pb-2">
                Account Security
              </h3>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || form.skills.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Verification + Approval Required</p>
                <p>Verify your email first, then submit your technician application. Portal access starts only after admin approval.</p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/technician/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default TechnicianSignUp;
