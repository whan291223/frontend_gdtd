import { useNavigate } from "react-router-dom";

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
    description: "Update your name, photo & account info",
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
    route: "/test/spent-naf",
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

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150] h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-sm mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-1 pt-2 pb-2">
          <p className="text-xs text-emerald-500 uppercase tracking-[0.2em] font-medium">Dashboard</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">What would you<br />like to do?</h1>
        </div>

        {/* Cards grid */}
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
              {/* Icon bubble */}
              <div className={`
                w-12 h-12 rounded-xl ${card.bgAccent}
                flex items-center justify-center
                text-2xl shrink-0
                transition-transform duration-200 group-hover:scale-110
              `}>
                {card.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${card.accent} tracking-wide`}>
                  {card.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Arrow */}
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 pt-2">powered by pluto solution</p>
      </div>
    </div>
  );
}