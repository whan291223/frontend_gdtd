import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import liff from "@line/liff";

interface Question {
  id: number;
  text: string;
  options: string[];
}

// Replace with your real NAF questions
const NAF_QUESTIONS: Question[] = [
  { id: 0, text: "How often do you feel physically exhausted?", options: ["Never", "Sometimes", "Often", "Always"] },
  { id: 1, text: "Do you have difficulty concentrating?", options: ["Never", "Rarely", "Often", "Always"] },
  // ...more NAF questions
];

export default function NafPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId as number | undefined;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    verifySession();
  }, []);

  async function verifySession() {
    try {
      const res = await fetch(`/api/v0.1/test/session/${sessionId}`);
      if (!res.ok) { navigate("/dashboard", { replace: true }); return; }
      const data = await res.json();
      if (!data.is_high_risk || data.status === "completed") {
        navigate("/dashboard", { replace: true });
        return;
      }
    } catch {
      navigate("/dashboard", { replace: true });
      return;
    }
    setLoading(false);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];

    if (current + 1 < NAF_QUESTIONS.length) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
      setSelected(null);
    } else {
      submitNaf(newAnswers);
    }
  }

async function submitNaf(finalAnswers: number[]) {
    setSubmitting(true);
    try {
        const res = await fetch(`/api/v0.1/test/naf/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answers: finalAnswers }),
        });

        const data = await res.json();
        console.log("NAF submit response:", res.status, data); // 👈 check this

        if (!res.ok) throw new Error(data.detail ?? "Failed to submit");
        navigate("/test/complete", { replace: true });
    } catch (err) {
        console.error("NAF submit error:", err); // 👈 and this
        setSubmitting(false);
    }
}

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-violet-400 animate-spin" />
      </div>
    );

  const q = NAF_QUESTIONS[current];
  const progress = (current / NAF_QUESTIONS.length) * 100;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* High-risk badge */}
        <div className="flex justify-center mb-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 tracking-wide">
            NAF Assessment
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">

          {/* Progress header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-800">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>NAF test</span>
              <span>
                Question <span className="text-white font-medium">{current + 1}</span> of {NAF_QUESTIONS.length}
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="px-6 py-6">
            <p className="text-white text-base font-medium leading-relaxed mb-6">{q.text}</p>

            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150
                    ${selected === i
                      ? "border-violet-500 bg-violet-500/10 text-white"
                      : "border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-600"
                    }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                      ${selected === i ? "border-violet-500" : "border-gray-600"}`}
                  >
                    {selected === i && <span className="w-2 h-2 rounded-full bg-violet-500" />}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => {
                if (current > 0) {
                  setCurrent(current - 1);
                  setSelected(answers[current - 1] ?? null);
                  setAnswers(answers.slice(0, -1));
                }
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={selected === null || submitting}
              className="flex-2 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-violet-400 transition-all active:scale-95"
            >
              {submitting ? "Saving…" : current + 1 === NAF_QUESTIONS.length ? "Submit" : "Next"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">powered by pluto solution</p>
      </div>
    </div>
  );
}