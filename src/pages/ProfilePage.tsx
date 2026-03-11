import { useEffect, useState } from "react";
import liff from "@line/liff";
import { createUserProfile, updateUser } from "../api/userApi";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [realName, setRealName] = useState("");
  const [surname, setSurname] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    initLiff();
  }, []);

  async function initLiff() {
    try {
      const res = await fetch("/api/v0.1/users/liff-id");
      const data = await res.json();
      await liff.init({ liffId: data.liffId, withLoginOnExternalBrowser: true });
      if (!liff.isLoggedIn()) { liff.login(); return; }
      const lineProfile = await liff.getProfile();
      setProfile({ userId: lineProfile.userId, displayName: lineProfile.displayName, pictureUrl: lineProfile.pictureUrl });
      try {
        await createUserProfile({ line_user_id: lineProfile.userId, display_name: lineProfile.displayName, picture_url: lineProfile.pictureUrl });
      } catch (apiErr) { console.error("Failed to sync profile:", apiErr); }
    } catch (err: any) {
      setError(err?.message ?? "Failed to initialize LIFF");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    try {
      await updateUser(profile.userId, { real_name: realName, surname });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-emerald-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 tracking-widest uppercase">Loading</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-6">
        <div className="bg-red-950/40 border border-red-800/50 rounded-2xl px-8 py-6 text-center max-w-sm">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-500 text-sm">
        No profile found.
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black/60 space-y-8">

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-white tracking-tight">Create Profile</h1>
            <p className="text-xs text-gray-500 tracking-wide">Complete your account setup</p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              {profile.pictureUrl ? (
                <img
                  src={profile.pictureUrl}
                  alt="profile"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-700 ring-offset-2 ring-offset-gray-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center ring-2 ring-gray-700">
                  <span className="text-2xl text-gray-500">👤</span>
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-900" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">{profile.displayName}</p>
              <p className="text-xs text-gray-500">LINE Account</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                First Name
              </label>
              <input
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
                placeholder="Enter your first name"
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Surname
              </label>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Enter your surname"
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                saved
                  ? "bg-emerald-600 text-white scale-95"
                  : "bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-gray-950"
              }`}
            >
              {saved ? "✓ Saved!" : "Save Profile"}
            </button>
          </form>

        </div>

        {/* Subtle footer */}
        <p className="text-center text-xs text-gray-700 mt-6">powered by pluto solution</p>
      </div>
    </div>
  );
}