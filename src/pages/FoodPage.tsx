import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";

type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack";

interface FoodEntry {
  id: number;
  food_name: string;
  calories: number;
  meal_category: MealCategory;
  eaten_date: string;
}

interface DailySummary {
  date: string;
  total_calories: number;
  goal: number;
  entries: FoodEntry[];
}

const CATEGORIES: MealCategory[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

const CATEGORY_STYLE: Record<MealCategory, { dot: string; badge: string }> = {
  Breakfast: { dot: "bg-amber-400",  badge: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  Lunch:     { dot: "bg-emerald-400",badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  Dinner:    { dot: "bg-violet-400", badge: "bg-violet-500/10 border-violet-500/30 text-violet-400" },
  Snack:     { dot: "bg-sky-400",    badge: "bg-sky-500/10 border-sky-500/30 text-sky-400" },
};

function toInputDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === toInputDate(today)) return "Today";
  if (dateStr === toInputDate(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function FoodPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date navigation
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Goal editing
  const [goal, setGoal] = useState(2000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [goalSaving, setGoalSaving] = useState(false);

  // New food form
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [mealCategory, setMealCategory] = useState<MealCategory>("Breakfast");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCal, setEditCal] = useState("");
  const [editCat, setEditCat] = useState<MealCategory>("Snack");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { initAndLoad(); }, []);
  useEffect(() => { if (userId) loadSummary(userId, selectedDate); }, [selectedDate, userId]);

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

      // Load goal
      const goalRes = await fetch(`/api/v0.1/food/goal/${user.id}`);
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoal(goalData.daily_goal);
        setGoalInput(String(goalData.daily_goal));
      }

      await loadSummary(user.id, toInputDate(new Date()));
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary(uid: number, dateStr: string) {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/v0.1/food/date/${uid}?target_date=${dateStr}`);
      if (!res.ok) throw new Error("Failed to load");
      setSummary(await res.json());
    } catch {
      setSummary({ date: dateStr, total_calories: 0, goal, entries: [] });
    } finally {
      setSummaryLoading(false);
    }
  }

  function shiftDate(days: number) {
  const d = new Date(selectedDate + "T00:00:00"); // parse as local, not UTC
  d.setDate(d.getDate() + days);
  const next = toInputDate(d);
  const today = toInputDate(new Date());
  if (next <= today) setSelectedDate(next);        // only block future dates
}

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !foodName || !calories) return;
    setAdding(true);
    let success = false;
    try {
      const res = await fetch("/api/v0.1/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          food_name: foodName,
          calories: parseInt(calories),
          meal_category: mealCategory,
          eaten_date: selectedDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      success = true;
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setAdding(false);
    }
    if (success) {
      setFoodName("");
      setCalories("");
      setShowForm(false);
      await loadSummary(userId, selectedDate);
    }
  }

  async function handleSaveGoal() {
    if (!userId) return;
    setGoalSaving(true);
    let success = false;
    try {
      const res = await fetch(`/api/v0.1/food/goal/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_goal: parseInt(goalInput) }),
      });
      if (!res.ok) throw new Error("Failed to save goal");
      setGoal(parseInt(goalInput));
      success = true;
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setGoalSaving(false);
    }
    if (success) setEditingGoal(false);
  }

  function startEdit(entry: FoodEntry) {
    setEditingId(entry.id);
    setEditName(entry.food_name);
    setEditCal(String(entry.calories));
    setEditCat(entry.meal_category);
  }

  async function handleEdit(entryId: number) {
    if (!userId) return;
    setEditSaving(true);
    let success = false;
    try {
      const res = await fetch(`/api/v0.1/food/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food_name: editName, calories: parseInt(editCal), meal_category: editCat }),
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
      await loadSummary(userId, selectedDate);
    }
  }

  async function handleDelete(entryId: number) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/v0.1/food/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadSummary(userId, selectedDate);
    } catch (err: any) {
      setError(err?.message);
    }
  }

  // Group entries by meal category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = summary?.entries.filter(e => e.meal_category === cat) ?? [];
    return acc;
  }, {} as Record<MealCategory, FoodEntry[]>);

  const total = summary?.total_calories ?? 0;
  const pct = Math.min((total / goal) * 100, 100);
  const isOverGoal = total > goal;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-amber-400 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 tracking-widest uppercase">Loading</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-64 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-sm mx-auto space-y-5">

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
            <p className="text-xs text-amber-400 uppercase tracking-[0.2em] font-medium">Nutrition</p>
            <h1 className="text-xl font-bold text-white tracking-tight">Food Log</h1>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 ml-3 text-xs">✕</button>
          </div>
        )}

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3">
          <button
            onClick={() => shiftDate(-1)}
            className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{formatDisplayDate(selectedDate)}</p>
            <p className="text-xs text-gray-500">{selectedDate}</p>
          </div>
          <button
            onClick={() => shiftDate(1)}
            disabled={selectedDate >= toInputDate(new Date())}
            className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calorie summary card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Calories</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-3xl font-bold ${isOverGoal ? "text-red-400" : "text-white"}`}>
                  {total.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">/ {goal.toLocaleString()} kcal</span>
              </div>
            </div>

            {/* Goal edit */}
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-20 bg-gray-800 border border-gray-600 focus:border-amber-500 rounded-lg px-2 py-1 text-sm text-white outline-none text-center"
                />
                <button
                  onClick={handleSaveGoal}
                  disabled={goalSaving}
                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-gray-950 font-semibold disabled:opacity-40"
                >
                  {goalSaving ? "…" : "Save"}
                </button>
                <button onClick={() => setEditingGoal(false)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all"
              >
                Set goal
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverGoal ? "bg-red-500" : "bg-amber-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{isOverGoal ? `${(total - goal).toLocaleString()} over goal` : `${(goal - total).toLocaleString()} remaining`}</span>
              <span>{Math.round(pct)}%</span>
            </div>
          </div>

          {/* Category mini totals */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {CATEGORIES.map(cat => {
              const catTotal = grouped[cat].reduce((s, e) => s + e.calories, 0);
              return (
                <div key={cat} className="text-center space-y-1">
                  <div className={`w-2 h-2 rounded-full mx-auto ${CATEGORY_STYLE[cat].dot}`} />
                  <p className="text-xs font-medium text-white">{catTotal > 0 ? catTotal : "—"}</p>
                  <p className="text-[10px] text-gray-600">{cat}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add food button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-2xl border border-dashed border-gray-700 hover:border-amber-500/50 text-gray-500 hover:text-amber-400 text-sm transition-all duration-200"
          >
            + Add food
          </button>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Add Food</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-300 text-xs">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              {/* Meal category selector */}
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMealCategory(cat)}
                    className={`py-1.5 rounded-xl text-xs font-medium border transition-all
                      ${mealCategory === cat
                        ? `${CATEGORY_STYLE[cat].badge} border-opacity-60`
                        : "border-gray-700 text-gray-500 hover:border-gray-600"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
                placeholder="Food name"
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              />

              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                min={0}
                placeholder="Calories (kcal)"
                className="w-full bg-gray-800/60 border border-gray-700 hover:border-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              />

              <button
                type="submit"
                disabled={adding || !foodName || !calories}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-gray-950 text-sm font-semibold transition-all"
              >
                {adding ? "Adding…" : "Add Food"}
              </button>
            </form>
          </div>
        )}

        {/* Meal category sections */}
        {summaryLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 rounded-full border-2 border-gray-700 border-t-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const entries = grouped[cat];
              if (entries.length === 0) return null;
              return (
                <div key={cat} className="space-y-2">
                  {/* Category header */}
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-2 h-2 rounded-full ${CATEGORY_STYLE[cat].dot}`} />
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{cat}</span>
                    <span className="text-xs text-gray-600 ml-auto">
                      {entries.reduce((s, e) => s + e.calories, 0)} kcal
                    </span>
                  </div>

                  {entries.map(entry => (
                    <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                      {editingId === entry.id ? (
                        // Edit mode
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-4 gap-1.5">
                            {CATEGORIES.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditCat(c)}
                                className={`py-1 rounded-lg text-xs border transition-all
                                  ${editCat === c
                                    ? `${CATEGORY_STYLE[c].badge}`
                                    : "border-gray-700 text-gray-500"
                                  }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-gray-800/60 border border-gray-700 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-white outline-none transition-all"
                          />
                          <input
                            type="number"
                            value={editCal}
                            onChange={(e) => setEditCal(e.target.value)}
                            className="w-full bg-gray-800/60 border border-gray-700 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-white outline-none transition-all"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 text-xs hover:border-gray-600 transition-all"
                            >Cancel</button>
                            <button
                              onClick={() => handleEdit(entry.id)}
                              disabled={editSaving}
                              className="flex-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 text-xs font-semibold transition-all"
                            >{editSaving ? "Saving…" : "Save"}</button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{entry.food_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{entry.calories} kcal</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => startEdit(entry)}
                              className="w-7 h-7 rounded-lg border border-gray-700 flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="w-7 h-7 rounded-lg border border-gray-700 flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0H5m14 0h-2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Empty state */}
            {(summary?.entries.length ?? 0) === 0 && (
              <div className="text-center py-8 space-y-1">
                <p className="text-gray-600 text-sm">Nothing logged yet</p>
                <p className="text-gray-700 text-xs">Tap "+ Add food" to start tracking</p>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-700 pb-4">powered by pluto solution</p>
      </div>
    </div>
  );
}