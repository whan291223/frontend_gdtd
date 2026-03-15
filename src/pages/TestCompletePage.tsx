import { useNavigate } from "react-router-dom";

export default function TestCompletePage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black/60 text-center space-y-6">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              {/* Checkmark SVG */}
              <svg
                className="w-9 h-9 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white tracking-tight">Test Complete</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your answers have been recorded.<br />
              You can view your score history anytime from the dashboard.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/history/spent-naf")}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-gray-950 text-sm font-semibold tracking-wide transition-all duration-200"
            >
              View My Score History
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 rounded-xl border border-gray-700 hover:border-gray-600 text-gray-400 text-sm transition-all duration-200"
            >
              Back to Dashboard
            </button>
          </div>

        </div>

        <p className="text-center text-xs text-gray-700 mt-6">powered by pluto solution</p>
      </div>
    </div>
  );
}