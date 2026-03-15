import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

interface Question {
  id: number;
  text: string;
  options: string[];
}

// Replace with your real questions
const SPENT_QUESTIONS: Question[] = [
  { id: 0, text: "Is a chicken a mammal?", options: ["Yes", "No", "Nope", "Ok"] },
  { id: 1, text: "Do you feel tired most days?", options: ["Never", "Sometimes", "Often", "Always"] },
  // ...more questions
];

export default function SpentPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { initUser(); }, []);

  async function initUser() {
    const res = await fetch("/api/v0.1/users/liff-id");
    const data = await res.json();
    await liff.init({ liffId: data.liffId, withLoginOnExternalBrowser: true });
    if (!liff.isLoggedIn()) { navigate("/", { replace: true }); return; }
    const profile = await liff.getProfile();
    const userRes = await fetch(`/api/v0.1/users/${profile.userId}`);
    const user = await userRes.json();
    setUserId(user.id); // your DB integer id
    setLoading(false);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];

    if (current + 1 < SPENT_QUESTIONS.length) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
      setSelected(null);
    } else {
      submitSpent(newAnswers);
    }
  }

  async function submitSpent(finalAnswers: number[]) {
    setSubmitting(true);
    const res = await fetch("/api/v0.1/test/spent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, answers: finalAnswers }),
    });
    const data = await res.json();

    if (data.is_high_risk) {
      navigate("/test/naf", { state: { sessionId: data.session_id } });
    } else {
      navigate("/test/complete");
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-950">
    <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-emerald-400 animate-spin" />
  </div>;

  const q = SPENT_QUESTIONS[current];
  const progress = ((current) / SPENT_QUESTIONS.length) * 100;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">

          {/* Progress header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-800">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Spent test</span>
              <span>Question <span className="text-white font-medium">{current + 1}</span> of {SPENT_QUESTIONS.length}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
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
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-600"
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                    ${selected === i ? "border-emerald-500" : "border-gray-600"}`}>
                    {selected === i && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => { if (current > 0) { setCurrent(current - 1); setSelected(answers[current - 1] ?? null); setAnswers(answers.slice(0, -1)); } }}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-all"
            >Back</button>
            <button
              onClick={handleNext}
              disabled={selected === null || submitting}
              className="flex-2 py-2.5 rounded-xl bg-emerald-500 text-gray-950 text-sm font-semibold disabled:opacity-40 hover:bg-emerald-400 transition-all active:scale-95"
            >
              {submitting ? "Saving…" : current + 1 === SPENT_QUESTIONS.length ? "Submit" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}