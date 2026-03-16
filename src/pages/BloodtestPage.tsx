import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

interface BloodRecord {
  id: number;
  user_id: number;
  blood_level: number;
  note: string | null;
  recorded_at: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

function LevelTag({ level }: { level: number }) {
  // Adjust ranges to match your actual reference values
  if (level < 70)
    return <span className="text-xs px-2.5 py-0.5 rounded-full border bg-rose-500/10 border-rose-500/30 text-rose-400">Low</span>;
  if (level <= 100)
    return <span className="text-xs px-2.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">Normal</span>;
  if (level <= 125)
    return <span className="text-xs px-2.5 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400">Pre-high</span>;
  return <span className="text-xs px-2.5 py-0.5 rounded-full border bg-red-500/10 border-red-500/30 text-red-400">High</span>;
}

export default function BloodTestPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [records, setRecords] = useState<BloodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New entry form
  const [newLevel, setNewLevel] = useState("");
  const [newNote, setNewNote] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLevel, setEditLevel] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { initAndLoad(); }, []);

  async function initAndLoad() {
    try {
      const res = await fetch("/api/v0.1/users/liff-id");
      const data = await res.json();
      await liff.init({ liffId: data.liffId, withLoginOnExternalBrowser: true });
      if (!liff.isLoggedIn()) { navigate("/", { replace: true }); return; }

      const profile = await liff.getProfile();
      const userRes = await fetch(`/api/v0.1/users/${profile.userId}`);
      if (!userRes.ok) { navigate("/", { replace: true }); return; }
      const user = await userRes.json();
      setUserId(user.id);

      await loadRecords(user.id);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecords(uid: number) {
    const res = await fetch(`/api/v0.1/blood-test/history/${uid}`);
    if (!res.ok) throw new Error("Failed to load records");
    setRecords(await res.json());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newLevel) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v0.1/blood-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          blood_level: parseInt(newLevel),
          note: newNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setNewLevel("");
      setNewNote("");
      await loadRecords(userId);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(record: BloodRecord) {
    setEditingId(record.id);
    setEditLevel(String(record.blood_level));
    setEditNote(record.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLevel("");
    setEditNote("");
  }

  async function handleEdit(record: BloodRecord) {
    if (!userId) return;
    setEditSaving(true);
    let success = false;
    try {
      const res = await fetch(`/api/v0.1/blood-test/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blood_level: parseInt(editLevel),
          note: editNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      success = true;
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setEditSaving(false);
    }
    if (success) {
      setEditingId(null);
      await loadRecords(userId);
    }
  }

  async function handleDelete(recordId: number) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/v0.1/blood-test/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadRecords(userId);
    } catch (err: any) {
      setError(err?.message);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-rose-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 tracking-widest uppercase">Loading</p>
      </div>
    );

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-64 bg-rose-500/5 rounded-full blur-3xl" />
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
            <p className="text-xs text-rose-400 uppercase tracking-[0.2em] font-medium">Health</p>
            <h1 className="text-xl font-bold text-white tracking-tight">Blood Test</h1>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 text-xs ml-3">✕</button>
          </div>
        )}

        {/* Add new record card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-white">Add New Result</h2>
            <p className="text-xs text-gray-500">Log your latest blood level reading</p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Blood Level <span className="text-gray-600 normal-case">(mg/dL)</span>
              </label>
              <input
                type="number"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                required
                placeholder="e.g. 95"
                min={0}
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Note <span className="text-gray-600 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Fasting, after meal..."
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !newLevel}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold tracking-wide transition-all duration-200"
            >
              {saving ? "Saving…" : "Save Result"}
            </button>
          </form>
        </div>

        {/* History */}
        {records.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-widest px-1">Past Results</p>

            {records.map((record) => (
              <div key={record.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

                {editingId === record.id ? (
                  // ── Edit mode ──────────────────────────────────
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Editing</p>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 uppercase tracking-widest">Blood Level</label>
                      <input
                        type="number"
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}
                        min={0}
                        className="w-full bg-gray-800/60 border border-gray-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 uppercase tracking-widest">Note</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Optional note"
                        className="w-full bg-gray-800/60 border border-gray-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={cancelEdit}
                        className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 text-xs hover:border-gray-600 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEdit(record)}
                        disabled={editSaving || !editLevel}
                        className="flex-2 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white text-xs font-semibold transition-all active:scale-95"
                      >
                        {editSaving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── View mode ──────────────────────────────────
                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Level number */}
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-white leading-none">{record.blood_level}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">mg/dL</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <LevelTag level={record.blood_level} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(record.recorded_at)}
                        <span className="text-gray-600 ml-1">{formatTime(record.recorded_at)}</span>
                      </p>
                      {record.note && (
                        <p className="text-xs text-gray-500 truncate">{record.note}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(record)}
                        className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center text-gray-500 hover:text-rose-400 hover:border-rose-500/50 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0H5m14 0h-2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty history */}
        {records.length === 0 && !loading && (
          <div className="text-center py-8 space-y-2">
            <p className="text-gray-600 text-sm">No records yet</p>
            <p className="text-gray-700 text-xs">Add your first result above</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-700 pb-4">powered by pluto solution</p>
      </div>
    </div>
  );
}