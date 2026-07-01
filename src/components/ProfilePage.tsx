import React, { useState } from "react";
import { User as UserIcon, Mail, Key, Save, Award, Sparkles, Clock, Globe, Mic, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { User as UserType, PREBUILT_VOICES } from "../types";

interface ProfilePageProps {
  token: string;
  user: UserType | null;
  onProfileUpdate: (updatedUser: UserType) => void;
  onNavigateToPricing: () => void;
}

export default function ProfilePage({
  token,
  user,
  onProfileUpdate,
  onNavigateToPricing,
}: ProfilePageProps) {
  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [useCase, setUseCase] = useState(user?.useCase || "creator");
  const [preferredVoice, setPreferredVoice] = useState(user?.preferredVoice || "Kore");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || "en");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading & Alert state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="text-sm text-slate-400 mt-2">Please sign in to view your user profile.</p>
      </div>
    );
  }

  // Handle profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          useCase,
          preferredVoice,
          preferredLanguage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onProfileUpdate(data.user);
        setProfileMessage({ type: "success", text: "Profile information saved successfully!" });
      } else {
        setProfileMessage({ type: "error", text: data.error || "Failed to update profile details" });
      }
    } catch (err: any) {
      setProfileMessage({ type: "error", text: "Network error occurred. Please try again." });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Password update failed" });
      }
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: "Network error occurred. Please try again." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">Your Creator Profile</h2>
        <p className="text-sm text-slate-400 mt-2">
          Manage your personal settings, language dialects, prebuilt vocal preferences, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile and Settings Panel (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              <span>Personal Profile Settings</span>
            </h3>

            {profileMessage && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 mb-6 border ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                {profileMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="text-sm">{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-500">
                      <UserIcon className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Arfat Ahemed"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Primary Use Case
                  </label>
                  <select
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/60 transition-all text-sm cursor-pointer"
                  >
                    <option value="creator" className="bg-[#050616]">Content Creator</option>
                    <option value="developer" className="bg-[#050616]">Developer</option>
                    <option value="educator" className="bg-[#050616]">Educator</option>
                    <option value="hobbyist" className="bg-[#050616]">Hobbyist</option>
                    <option value="other" className="bg-[#050616]">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Default Preferred Voice
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-500">
                      <Mic className="w-5 h-5" />
                    </span>
                    <select
                      value={preferredVoice}
                      onChange={(e) => setPreferredVoice(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/60 transition-all text-sm cursor-pointer"
                    >
                      {PREBUILT_VOICES.map((v) => (
                        <option key={v.id} value={v.id} className="bg-[#050616]">
                          {v.id} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Default Preferred Accent/Language
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-500">
                      <Globe className="w-5 h-5" />
                    </span>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/60 transition-all text-sm cursor-pointer"
                    >
                      <option value="en" className="bg-[#050616]">English (Indian Accent)</option>
                      <option value="hi" className="bg-[#050616]">Hindi (Standard Devanagari)</option>
                      <option value="hinglish" className="bg-[#050616]">Hinglish (Transliterated Romanized)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Profile Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Panel */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <span>Update Password Security</span>
            </h3>

            {passwordMessage && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 mb-6 border ${
                  passwordMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="text-sm">{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>Update Account Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Summary sidebar column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4">
              Account Metadata
            </h3>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Registered Email</div>
                  <div className="text-sm text-white font-medium break-all">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Active Tier Plan</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-white font-bold capitalize">{user.plan}</span>
                    <button
                      onClick={onNavigateToPricing}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade Plan</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Member Since</div>
                  <div className="text-sm text-white font-medium">{formatDate(user.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3">
              Helpful Resources
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              By saving your preferred voice and accent in your profile, the vocal synthesis engine will dynamically pre-populate those inputs when you launch a fresh script in the Voice Generator tab.
            </p>
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-[11px] text-indigo-200">
              <span className="font-bold">Pro Tip:</span> Separate sections of your text with punctuation marks to allow the Gemini TTS to breathe organically!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
