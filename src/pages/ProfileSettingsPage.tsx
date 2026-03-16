import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

interface UserProfile {
  id: number;
  line_user_id: string;
  display_name: string;
  picture_url?: string;
  real_name?: string;
  surname?: string;
}

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [realName, setRealName] = useState("");
  const [surname, setSurname] = useState("");

  useEffect(() => { initAndLoad(); }, []);

  async function initAndLoad() {
    try {
      const res = await fetch("/api/v0.1/users/liff-id");
      const data = await res.json();
      await liff.init({ liffId: data.liffId, withLoginOnExternalBrowser: true });
      if (!liff.isLoggedIn()) { navigate("/", { replace: true }); return; }

      const lineProfile = await liff.getProfile();
      const userRes = await fetch(`/api/v0.1/users/${lineProfile.userId}`);
      if (!userRes.ok) { navigate("/", { replace: true }); return; }

      const user: UserProfile = await userRes.json();
      setProfile(user);
      setRealName(user.real_name ?? "");
      setSurname(user.surname ?? "");
    } catch (err: any) {
      setError(err?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    let success = false;
    try {
      const res = await fetch(`/api/v0.1/users/${profile.line_user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ real_name: realName, surname }),
      });
      if (!res.ok) throw new Error("Failed to update");
      success = true;
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // refresh local profile
      setProfile(prev => prev ? { ...prev, real_name: realName, surname } : prev);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-sky-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 tracking-widest uppercase">Loading</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-64 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-sm mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-xl border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-sky-400 uppercase tracking-[0.2em] font-medium">Account</p>
            <h1 className="text-xl font-bold text-white tracking-tight">Profile Settings</h1>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 ml-3 text-xs">✕</button>
          </div>
        )}

        {/* LINE identity card — read only */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">LINE Account</p>
          <div className="flex items-center gap-4">
            {profile?.picture_url ? (
              <img
                src={profile.picture_url}
                alt="LINE profile"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-700 ring-offset-2 ring-offset-gray-900 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <span className="text-xl text-gray-500">👤</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{profile?.display_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">LINE Display Name</p>
              <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                Connected
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Profile picture and display name are managed by LINE and cannot be changed here.
          </p>
        </div>

        {/* Editable fields */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-5">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-white">Personal Info</h2>
            <p className="text-xs text-gray-500">Update your name details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                First Name
              </label>
              <input
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
                placeholder="Enter your first name"
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
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
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                saved
                  ? "bg-emerald-600 text-white scale-95"
                  : "bg-sky-500 hover:bg-sky-400 active:scale-95 text-white disabled:opacity-40"
              }`}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-700 pb-4">powered by pluto solution</p>
      </div>
    </div>
  );
}