"use client";

import { useEffect, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { EmptyState } from "../components/EmptyState";
import {
  loadFitnessGoals,
  saveFitnessGoals,
  type FitnessGoal,
} from "../lib/fitnessData";
import {
  deleteGoalFromSupabase,
  loadGoalsFromSupabase,
  saveGoalToSupabase,
  updateGoalInSupabase,
} from "../lib/supabasePlanning";
import { supabase } from "../lib/supabaseClient";

const goalTypes = ["Strength", "Bodyweight", "Consistency", "Endurance", "Muscle Gain"];
const goalStatuses = ["Active", "Completed", "Paused"];

function getGoalProgress(goal: FitnessGoal) {
  const current = Number(goal.current);
  const target = Number(goal.target);

  if (!current || !target) {
    return 0;
  }

  return Math.min(Math.round((current / target) * 100), 100);
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [goalType, setGoalType] = useState(goalTypes[0]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [userId, setUserId] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const [hasLoadedGoals, setHasLoadedGoals] = useState(false);

  useEffect(() => {
    let shouldIgnore = false;

    async function loadGoals() {
      const { data } = await supabase.auth.getUser();
      const currentUserId = data.user?.id ?? "";

      if (shouldIgnore) {
        return;
      }

      setUserId(currentUserId);

      if (!currentUserId) {
        setGoals(loadFitnessGoals());
        setHasLoadedGoals(true);
        setGoalMessage("Log in to sync goals to Supabase. Goals are saved on this device.");
        return;
      }

      try {
        const savedGoals = await loadGoalsFromSupabase();
        if (!shouldIgnore) {
          setGoals(savedGoals);
          setHasLoadedGoals(true);
          setGoalMessage("Goals are syncing with Supabase.");
        }
      } catch {
        if (!shouldIgnore) {
          setGoals(loadFitnessGoals());
          setHasLoadedGoals(true);
          setGoalMessage("Could not load goals from Supabase. Showing this device.");
        }
      }
    }

    loadGoals();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedGoals) {
      return;
    }

    saveFitnessGoals(goals);
  }, [goals, hasLoadedGoals]);

  async function saveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newGoal = {
      id: Date.now(),
      goalType,
      title,
      target,
      current,
      deadline,
      status: "Active",
    };

    if (userId) {
      try {
        const savedGoal = await saveGoalToSupabase(newGoal);
        setGoals([savedGoal, ...goals]);
        setGoalMessage("Goal saved to Supabase.");
      } catch {
        setGoalMessage("Could not save goal to Supabase. Try again.");
        return;
      }
    } else {
      setGoals([newGoal, ...goals]);
      setGoalMessage("Goal saved on this device.");
    }

    setGoalType(goalTypes[0]);
    setTitle("");
    setTarget("");
    setCurrent("");
    setDeadline("");
  }

  async function updateGoal(id: string | number, field: keyof FitnessGoal, value: string) {
    const updatedGoals = goals.map((goal) =>
      goal.id === id
        ? {
            ...goal,
            [field]: value,
          }
        : goal
    );
    const updatedGoal = updatedGoals.find((goal) => goal.id === id);

    setGoals(updatedGoals);

    if (!userId || !updatedGoal) {
      return;
    }

    try {
      await updateGoalInSupabase(updatedGoal);
      setGoalMessage("Goal updated in Supabase.");
    } catch {
      setGoalMessage("Could not update goal in Supabase.");
    }
  }

  async function deleteGoal(id: string | number) {
    setGoals(goals.filter((goal) => goal.id !== id));

    if (!userId) {
      return;
    }

    try {
      await deleteGoalFromSupabase(id);
      setGoalMessage("Goal deleted from Supabase.");
    } catch {
      setGoalMessage("Could not delete goal from Supabase.");
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Goals
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Goal Tracker</h1>
          <p className="max-w-3xl text-gray-300">
            Set strength, bodyweight, consistency, and performance goals, then
            update progress over time.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <CollapsibleSection title="Create Goal">
            {goalMessage && (
              <p className="mb-4 rounded-md border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">
                {goalMessage}
              </p>
            )}
            <form onSubmit={saveGoal} className="space-y-4">
              <div>
                <label htmlFor="goal-title" className="mb-1 block text-sm text-gray-300">
                  Goal
                </label>
                <input
                  id="goal-title"
                  name="goal-title"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Bench 225 lbs"
                  required
                />
              </div>

              <div>
                <label htmlFor="goal-type" className="mb-1 block text-sm text-gray-300">
                  Goal Type
                </label>
                <select
                  id="goal-type"
                  name="goal-type"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={goalType}
                  onChange={(event) => setGoalType(event.target.value)}
                >
                  {goalTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="goal-current" className="mb-1 block text-sm text-gray-300">
                    Current
                  </label>
                  <input
                    id="goal-current"
                    name="goal-current"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                    placeholder="185"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="goal-target" className="mb-1 block text-sm text-gray-300">
                    Target
                  </label>
                  <input
                    id="goal-target"
                    name="goal-target"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="225"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal-deadline" className="mb-1 block text-sm text-gray-300">
                  Deadline
                </label>
                <input
                  id="goal-deadline"
                  name="goal-deadline"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-green-600 p-3 font-semibold hover:bg-green-500"
              >
                Save Goal
              </button>
            </form>
          </CollapsibleSection>

          <CollapsibleSection title="Active Goals">
            {goals.length === 0 ? (
              <EmptyState
                title="No goals saved yet"
                description="Create a strength, bodyweight, or consistency goal to track progress beyond individual workouts."
              />
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = getGoalProgress(goal);

                  return (
                    <article
                      key={goal.id}
                      className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-blue-300">
                            {goal.goalType}
                          </p>
                          <h2 className="text-xl font-semibold">{goal.title}</h2>
                          <p className="text-sm text-gray-400">
                            {goal.current} / {goal.target}
                            {goal.deadline ? " · Due " + goal.deadline : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mb-4 h-3 rounded-full bg-gray-900">
                        <div
                          className="h-3 rounded-full bg-blue-600"
                          style={{ width: progress + "%" }}
                        />
                      </div>

                      <div className="grid gap-3">
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          value={goal.title}
                          onChange={(event) =>
                            updateGoal(goal.id, "title", event.target.value)
                          }
                          aria-label="Goal title"
                        />
                        <select
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          value={goal.goalType}
                          onChange={(event) =>
                            updateGoal(goal.id, "goalType", event.target.value)
                          }
                          aria-label="Goal type"
                        >
                          {goalTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          type="number"
                          value={goal.current}
                          onChange={(event) =>
                            updateGoal(goal.id, "current", event.target.value)
                          }
                          aria-label="Current goal progress"
                        />
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          type="number"
                          value={goal.target}
                          onChange={(event) =>
                            updateGoal(goal.id, "target", event.target.value)
                          }
                          aria-label="Goal target"
                        />
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          type="date"
                          value={goal.deadline}
                          onChange={(event) =>
                            updateGoal(goal.id, "deadline", event.target.value)
                          }
                          aria-label="Goal deadline"
                        />
                        <select
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          value={goal.status}
                          onChange={(event) =>
                            updateGoal(goal.id, "status", event.target.value)
                          }
                          aria-label="Goal status"
                        >
                          {goalStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
