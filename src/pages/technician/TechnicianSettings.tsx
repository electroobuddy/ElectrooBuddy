import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Shield, Key, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { nativeApiErrorMessage, nativeRequestPasswordReset } from "@/lib/apiClient";

const TechnicianSettings = () => {
  const { user, signOut, signOutAll } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/technician/login");
    toast.success("Signed out successfully");
  };

  const handleChangePassword = async () => {
    if (!user?.email) return toast.error("No email is linked to this account.");
    try {
      await nativeRequestPasswordReset(user.email);
      toast.success("Password reset link sent to your email.");
    } catch (error) {
      toast.error(nativeApiErrorMessage(error, "Unable to send a password reset link."));
    }
  };

  const handleSignOutAll = async () => {
    try {
      await signOutAll();
      toast.success("Signed out from all devices.");
      navigate("/technician/login");
    } catch (error) {
      toast.error(nativeApiErrorMessage(error, "Unable to sign out all sessions."));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">Email Notifications</p>
            <p className="text-sm text-zinc-500">Receive updates about new bookings</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Security</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleChangePassword}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-zinc-500" />
              <span className="font-medium text-zinc-900 dark:text-white">Change Password</span>
            </div>
            <span className="text-sm text-zinc-500">Update your password</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="font-bold text-lg text-red-900 dark:text-red-400">Danger Zone</h2>
        </div>
        <div className="space-y-3">
        <button
          onClick={handleSignOutAll}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Sign Out All Devices</span>
          </div>
          <span className="text-sm opacity-80">Revoke every session</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sign Out</span>
          </div>
          <span className="text-sm opacity-80">End your session</span>
        </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicianSettings;
