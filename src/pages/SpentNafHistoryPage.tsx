import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
// TODO change to testAPI.ts
interface ScoreRecord {
  id: number;
  user_id: number;
  spent_score: number | null;
  is_high_risk: boolean | null;
  naf_score: number | null;
  status: string;
  submitted_at: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed:    { label: "Completed",    className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
    skipped_naf:  { label: "Skipped NAF",  className: "bg-sky-500/10 border-sky-500/30 text-sky-400" },
    pending_naf:  { label: "Pending NAF",  className: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
    pending_spent:{ label: "Incomplete",   className: "bg-gray-700/40 border-gray-600/30 text-gray-400" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-700/40 border-gray-600/30 text-gray-400" };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${s.className}`}>
      {s.label}
    </span>
  );
}

function RiskBadge({ isHighRisk }: { isHighRisk: boolean | null }) {
  if (isHighRisk === null) return null;
  return isHighRisk ? (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-rose-500/10 border-rose-500/30 text-rose-400">
      High Risk
    </span>
  ) : (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
      Low Risk
    </span>
  );
}

function ScoreBar({ label, score, max, color }: { label: string; score: number | null; max: number; color: string }) {
  const pct = score !== null ? Math.min((score / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-white">
          {score !== null ? score : "—"}{score !== null ? ` / ${max}` : ""}
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function SpentNafHistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

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

      const histRes = await fetch(`/api/v0.1/test/history/${user.id}`);
      if (!histRes.ok) throw new Error("Failed to load history");
      const history = await histRes.json();
      setRecords(history);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-emerald-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 tracking-widest uppercase">Loading</p>
      </div>
    );

  // ── Error ────────────────────────────────────────────────────────
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-6">
        <div className="bg-red-950/40 border border-red-800/50 rounded-2xl px-8 py-6 text-center max-w-sm">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );

  // ── Empty ────────────────────────────────────────────────────────
  if (records.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M9 7a3 3 0 110 6 3 3 0 010-6z" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-white text-sm font-medium">No tests yet</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              You haven't completed any Spent-NAF tests.<br />Take your first one from the dashboard.
            </p>
          </div>
          <button
            onClick={() => navigate("/test/spent-naf")}
            className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-sm font-semibold transition-all active:scale-95"
          >
            Take the test
          </button>
        </div>
      </div>
    );

  const completedCount = records.filter(r => r.status === "completed" || r.status === "skipped_naf").length;
  const latestSpent = records[0]?.spent_score ?? null;
  const latestNaf = records.find(r => r.naf_score !== null)?.naf_score ?? null;

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-64 bg-emerald-500/5 rounded-full blur-3xl" />
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
            <p className="text-xs text-emerald-500 uppercase tracking-[0.2em] font-medium">Records</p>
            <h1 className="text-xl font-bold text-white tracking-tight">Score History</h1>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{records.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total tests</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{latestSpent ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">Latest SPENT</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{latestNaf ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">Latest NAF</p>
          </div>
        </div>

        {/* Records list */}
        <div className="space-y-3">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all duration-200"
            >
              {/* Row header — always visible */}
              <button
                onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-800/40 transition-colors"
              >
                {/* Index bubble */}
                <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-400">#{records.length - index}</span>
                </div>

                {/* Date + status */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{formatDate(record.submitted_at)}</p>
                  <p className="text-xs text-gray-500">{formatTime(record.submitted_at)}</p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={record.status} />
                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${expanded === record.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === record.id && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4">
                  {/* Risk badge */}
                  <div className="flex items-center gap-2">
                    <RiskBadge isHighRisk={record.is_high_risk} />
                    {record.status === "skipped_naf" && (
                      <span className="text-xs text-gray-500">NAF not required</span>
                    )}
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3">
                    <ScoreBar
                      label="SPENT score"
                      score={record.spent_score}
                      max={20}
                      color="bg-emerald-500"
                    />
                    {record.is_high_risk && (
                      <ScoreBar
                        label="NAF score"
                        score={record.naf_score}
                        max={20}
                        color="bg-violet-500"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Take test again CTA */}
        <button
          onClick={() => navigate("/test/spent-naf")}
          className="w-full py-3 rounded-2xl border border-dashed border-gray-700 hover:border-emerald-500/50 text-gray-500 hover:text-emerald-400 text-sm transition-all duration-200"
        >
          + Take the test again
        </button>

        <p className="text-center text-xs text-gray-700 pb-4">powered by pluto solution</p>
      </div>
    </div>
  );
}