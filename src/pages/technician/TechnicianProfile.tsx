import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getNativeTechnicianProfile, updateNativeTechnicianProfile, submitNativeTechnicianApplication } from "@/lib/nativeTechnician";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Wrench, Briefcase, Save, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { NativeTechnician, TechnicianStatus } from "@/lib/apiContracts";

const TechnicianProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [technician, setTechnician] = useState<NativeTechnician | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    skills: [] as string[],
    experience: 0,
    daily_limit: 5,
    status: "active" as TechnicianStatus,
  });

  const skillOptions = [
    "Electrical Repair", "HVAC", "Plumbing", "Appliance Repair",
    "Electronics", "Carpentry", "Painting", "Cleaning",
    "General Maintenance", "Other"
  ];

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      let data:NativeTechnician|null=null;
      try { data = await getNativeTechnicianProfile(); } catch { data = null; }

      if (data) {
        setHasProfile(true);
        setTechnician(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          skills: data.skills || [],
          experience: data.experience || 0,
          daily_limit: data.daily_limit || 5,
          status: data.status || "active",
        });
      } else {
        setHasProfile(false);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      if (!hasProfile) {
        const data = await submitNativeTechnicianApplication({ name:form.name,email:user?.email||'',phone:form.phone||null,address:form.address||null,skills:form.skills,experience:form.experience,profileUrl:null });
        setHasProfile(true); setTechnician(data); toast.success("Technician application submitted");
      } else {
        const data = await updateNativeTechnicianProfile({ name:form.name.trim(),phone:form.phone.trim(),address:form.address.trim(),skills:form.skills,experience:form.experience,dailyLimit:form.daily_limit,status:form.status });
        setTechnician(data); toast.success("Profile updated successfully");
      }
    } catch (error) {
      logger.error(error);
      toast.error(hasProfile ? "Failed to update profile" : "Failed to create profile");
    } finally {
      setSaving(false);
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

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  // Show create profile mode
  if (!hasProfile) {
    return (
      <div className="p-6 space-y-6">
        {/* Create Profile Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <h2 className="text-xl font-bold mb-2">🔧 Create Your Technician Profile</h2>
          <p className="text-blue-100">
            Complete the form below to start receiving bookings and managing your schedule.
          </p>
        </motion.div>

        {/* Profile Creation Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-emerald-600" />
          
          {/* Content */}
          <div className="px-6 pb-6 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 flex items-center justify-center mb-4 shadow-lg">
              <User className="w-12 h-12 text-zinc-400" />
            </div>

            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">New Technician</h2>
            <p className="text-sm text-zinc-500">{user?.email}</p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mt-3 bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
              <CheckCircle className="w-3 h-3" />
              <span>Profile Not Created Yet</span>
            </div>
          </div>
        </div>

        {/* Form content remains the same as below */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Service Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Years of Experience *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="number"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="50"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>

            {/* Daily Limit */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Daily Booking Limit *
              </label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="number"
                  value={form.daily_limit}
                  onChange={(e) => setForm({ ...form, daily_limit: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="20"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Availability Status *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TechnicianStatus })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="active">Active</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
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

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving || form.skills.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Profile
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Existing profile view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your information and preferences</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-emerald-600" />
        
        {/* Content */}
        <div className="px-6 pb-6 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 flex items-center justify-center mb-4 shadow-lg">
            <User className="w-12 h-12 text-zinc-400" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{technician?.name}</h2>
          <p className="text-sm text-zinc-500">{user?.email}</p>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mt-3 ${
            form.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
            form.status === 'busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
            'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              form.status === 'active' ? 'bg-emerald-500' :
              form.status === 'busy' ? 'bg-orange-500' : 'bg-zinc-500'
            }`} />
            <span className="capitalize">{form.status}</span>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Experience */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Years of Experience
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="number"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })}
                min="0"
                max="50"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Daily Booking Limit
            </label>
            <div className="relative">
              <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="number"
                value={form.daily_limit}
                onChange={(e) => setForm({ ...form, daily_limit: parseInt(e.target.value) || 5 })}
                min="1"
                max="20"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Availability Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TechnicianStatus })}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="active">Active</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Skills & Expertise
        </label>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((skill) => (
            <button
              key={skill}
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
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TechnicianProfile;
