"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, User, Shield, Key } from "lucide-react";
import { PushManager } from "@/components/PushManager";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      // Fetch user profile details to get department
      fetch(`/api/users/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.departmentId) setDepartmentId(data.departmentId);
        })
        .catch(console.error);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword && !currentPassword) {
      setError("Please enter your current password to change it.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          departmentId,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Update NextAuth session
      await update({ name });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Settings</h1>
        <p className="text-neutral-400 mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-neutral-100 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Profile Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-4 rounded-lg">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-700 bg-neutral-800/50 rounded-lg text-neutral-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={session.user.email || ""}
                    className="w-full px-4 py-2 border border-neutral-800 bg-neutral-900/80 rounded-lg text-neutral-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Role
                  </label>
                  <div className="px-4 py-2 border border-neutral-800 bg-neutral-900/80 rounded-lg text-neutral-400 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {session.user.role}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    placeholder="e.g. IT, HR, Finance"
                    className="w-full px-4 py-2 border border-neutral-700 bg-neutral-800/50 rounded-lg text-neutral-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <h3 className="text-md font-semibold text-neutral-200 mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-neutral-400" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full max-w-sm px-4 py-2 border border-neutral-700 bg-neutral-800/50 rounded-lg text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full max-w-sm px-4 py-2 border border-neutral-700 bg-neutral-800/50 rounded-lg text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full max-w-sm px-4 py-2 border border-neutral-700 bg-neutral-800/50 rounded-lg text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* System Settings / Notifications */}
        <div className="space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-neutral-200 mb-4 uppercase tracking-wider">
              Notifications
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Enable push notifications to receive real-time updates on your desktop even when you're not actively using the app.
            </p>
            <PushManager />
          </div>
        </div>

      </div>
    </div>
  );
}
