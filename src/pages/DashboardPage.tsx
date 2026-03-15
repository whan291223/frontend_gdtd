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

interface BloodRecord {
  id: number;
  blood_level: number;
  recorded_at: string | null;
}

interface NavCard {
  id: number;
  icon: string;
  label: string;
  description: string;
  route: string;
  accent: string;
  bgAccent: string;
  borderAccent: string;
}

const cards: NavCard[] = [
  {
    id: 1,
    icon: "⚙️",
    label: "Profile Settings",
    description: "Update your name & account info",
    route: "/profile/settings",
    accent: "text-sky-400",
    bgAccent: "bg-sky-500/10",
    borderAccent: "border-sky-500/30 hover:border-sky-400/60",
  },
  {
    id: 2,
    icon: "🧪",
    label: "Spent-NAF Test",
    description: "Take the latest spent-NAF assessment",
    route: "/test/spent",
    accent: "text-violet-400",
    bgAccent: "bg-violet-500/10",
    borderAccent: "border-violet-500/30 hover:border-violet-400/60",
  },
  {
    id: 3,
    icon: "🩸",
    label: "Blood Test",
    description: "Log and update your blood test results",
    route: "/health/blood-test",
    accent: "text-rose-400",
    bgAccent: "bg-rose-500/10",
    borderAccent: "border-rose-500/30 hover:border-rose-400/60",
  },
  {
    id: 4,
    icon: "📈",
    label: "NAF Score History",
    description: "View your past spent-NAF score trends",
    route: "/history/spent-naf",
    accent: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/30 hover:border-emerald-400/60",
  },
  {
    id: 5,
    icon: "🥗",
    label: "Today's Food",
    description: "Track what you've eaten today",
    route: "/food/today",
    accent: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    borderAccent: "border-amber-500/30 hover:border-amber-400/60",
  },
];

function BloodLevelTag({ level }: { level: number }) {
  if (level < 70)
    return <span className="text-xs px-2 py-0.5 rounded-full border bg-rose-500/10 border-rose-500/30 text-rose-400">Low</span>;
  if (level <= 100)
    return <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">Normal</span>;
  if (level <= 125)
    return <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400">Pre-high</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 border-red-500/30 text-red-400">High</span>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lastBlood, setLastBlood] = useState<BloodRecord | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/v0.1/users/liff-id");
      const data = await res.json();
      await liff.init({ liffId: data.liffId, withLoginOnExternalBrowser: true });

      if (!liff.isLoggedIn()) { navigate("/", { replace: true }); return; }

      const lineProfile = await liff.getProfile();
      const userRes = await fetch(`/api/v0.1/users/${lineProfile.userId}`);
      if (!userRes.ok) { navigate("/", { replace: true }); return; }

      const userData: UserProfile = await userRes.json();
      if (!userData?.real_name) { navigate("/", { replace: true }); return; }
      setUser(userData);

      // Load last blood test — first item is most recent (ordered desc)
      const bloodRes = await fetch(`/api/v0.1/blood-test/history/${userData.id}`);
      if (bloodRes.ok) {
        const bloodData: BloodRecord[] = await bloodRes.json();
        if (bloodData.length > 0) setLastBlood(bloodData[0]);
      }
    } catch {
      navigate("/", { replace: true });
      return;
    }
    setChecking(false);
  }

  if (checking)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-emerald-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 tracking-widest uppercase">Loading</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-sm mx-auto space-y-5">

        {/* ── User profile card ───────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
          <div className="flex items-center gap-4">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.picture_url ? (
                <img
                  src={user.picture_url}
                  alt="profile"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-700 ring-offset-2 ring-offset-gray-900"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              )}
              {/* Online dot */}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900" />
            </div>

            {/* Name info */}
            <div className="flex-1 min-w-0">
              {/* Full real name */}
              <p className="text-white font-semibold text-base truncate">
                {user?.real_name && user?.surname
                  ? `${user.real_name} ${user.surname}`
                  : user?.real_name ?? user?.display_name}
              </p>
              {/* LINE display name */}
              <p className="text-xs text-gray-500 truncate mt-0.5">{user?.display_name}</p>
              <p className="text-xs text-gray-600">LINE Account</p>
            </div>
          </div>

          {/* Blood level strip */}
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🩸</span>
              <span className="text-xs text-gray-500">Last blood level</span>
            </div>
            {lastBlood ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {lastBlood.blood_level}
                  <span className="text-xs font-normal text-gray-500 ml-1">mg/dL</span>
                </span>
                <BloodLevelTag level={lastBlood.blood_level} />
              </div>
            ) : (
              <button
                onClick={() => navigate("/health/blood-test")}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                Add result →
              </button>
            )}
          </div>
        </div>

        {/* ── Section label ───────────────────────────────────── */}
        <div className="px-1">
          <p className="text-xs text-emerald-500 uppercase tracking-[0.2em] font-medium">Dashboard</p>
          <h2 className="text-lg font-bold text-white tracking-tight">What would you like to do?</h2>
        </div>

        {/* ── Nav cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className={`
                group w-full text-left
                bg-gray-900 border ${card.borderAccent}
                rounded-2xl p-5
                flex items-center gap-4
                transition-all duration-200
                hover:bg-gray-800/80 active:scale-[0.98]
                shadow-sm hover:shadow-lg hover:shadow-black/30
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl ${card.bgAccent}
                flex items-center justify-center text-2xl flex-shrink-0
                transition-transform duration-200 group-hover:scale-110
              `}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${card.accent} tracking-wide`}>{card.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{card.description}</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-700 pt-2 pb-4">powered by pluto solution</p>
      </div>
    </div>
  );
}