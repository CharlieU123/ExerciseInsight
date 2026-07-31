"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { EmptyState } from "./components/EmptyState";
import { SorenessHeatmap } from "./components/SorenessHeatmap";
import {
  getDeloadRecommendation,
  getProgramDays,
  getSmartCoachInsight,
  loadFitnessGoals,
  loadProfile,
  loadTrainingPrograms,
  loadWorkouts,
  isWorkoutThisWeek,
  saveFitnessGoals,
  saveProfile,
  saveTrainingPrograms,
  saveWorkouts,
  summarizeExerciseSets,
  type FitnessGoal,
  type Profile,
  type TrainingProgram,
  type Workout,
} from "./lib/fitnessData";
import {
  demoBodyweightLogs,
  demoGoals,
  demoProfile,
  demoPrograms,
  demoWorkouts,
} from "./lib/demoData";
import {
  loadGoalsFromSupabase,
  loadProgramsFromSupabase,
} from "./lib/supabasePlanning";
import { supabase } from "./lib/supabaseClient";
import {
  getCurrentUserId,
  loadWorkoutsFromSupabase,
} from "./lib/supabaseWorkouts";

function getGoalProgress(goal?: FitnessGoal) {
  if (!goal) {
    return 0;
  }

  const current = Number(goal.current);
  const target = Number(goal.target);

  if (!current || !target) {
    return 0;
  }

  return Math.min(Math.round((current / target) * 100), 100);
}

function getTodaysProgramDay(program: TrainingProgram, workouts: Workout[]) {
  const programDays = getProgramDays(program);
  const trainingDays = programDays.filter((day) => !day.isRestDay);

  if (trainingDays.length === 0) {
    return programDays[0] ?? null;
  }

  return trainingDays[workouts.length % trainingDays.length] ?? trainingDays[0];
}

function getWorkoutEstimateMinutes(exerciseCount: number) {
  if (exerciseCount === 0) {
    return 0;
  }

  return Math.max(30, exerciseCount * 8 + 15);
}

function RecoveryRing({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full shadow-[0_0_38px_rgba(34,211,238,0.22)]"
      style={{
        background: `conic-gradient(var(--accent-hover) ${score * 3.6}deg, rgba(30, 41, 59, 0.9) 0deg)`,
      }}
    >
      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-gray-950 text-center">
        <span className="text-4xl font-bold text-cyan-300">{score}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Recovery
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      const currentUserId = await getCurrentUserId();

      if (currentUserId) {
        try {
          setWorkouts(await loadWorkoutsFromSupabase());
        } catch {
          setWorkouts(loadWorkouts());
        }

        try {
          setGoals(await loadGoalsFromSupabase());
        } catch {
          setGoals(loadFitnessGoals());
        }

        try {
          setPrograms(await loadProgramsFromSupabase());
        } catch {
          setPrograms(loadTrainingPrograms());
        }

        const { data } = await supabase
          .from("profiles")
          .select("name, gender, age, height, weight")
          .eq("id", currentUserId)
          .maybeSingle();

        setProfile(
          data
            ? {
                name: data.name ?? "",
                gender: data.gender ?? "",
                age: data.age ?? "",
                height: data.height ?? "",
                weight: data.weight ?? "",
              }
            : loadProfile()
        );
      } else {
        setWorkouts(loadWorkouts());
        setGoals(loadFitnessGoals());
        setPrograms(loadTrainingPrograms());
        setProfile(loadProfile());
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    setIsDemoMode(localStorage.getItem("exerciseinsight-demo-mode") === "true");
    setTodayLabel(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date())
    );
  }, []);

  function loadDemoDashboard() {
    saveWorkouts(demoWorkouts);
    saveFitnessGoals(demoGoals);
    saveTrainingPrograms(demoPrograms);
    saveProfile(demoProfile);
    localStorage.setItem(
      "exerciseinsight-bodyweight-logs",
      JSON.stringify(demoBodyweightLogs)
    );
    localStorage.setItem("exerciseinsight-demo-mode", "true");

    setWorkouts(demoWorkouts);
    setGoals(demoGoals);
    setPrograms(demoPrograms);
    setProfile(demoProfile);
    setIsDemoMode(true);
  }

  function clearDemoDashboard() {
    localStorage.removeItem("workouts");
    localStorage.removeItem("fitnessGoals");
    localStorage.removeItem("trainingPrograms");
    localStorage.removeItem("profile");
    localStorage.removeItem("exerciseinsight-bodyweight-logs");
    localStorage.removeItem("exerciseinsight-demo-mode");

    setWorkouts([]);
    setGoals([]);
    setPrograms([]);
    setProfile({
      name: "",
      gender: "",
      age: "",
      height: "",
      weight: "",
    });
    setIsDemoMode(false);
  }

  const lastWorkout = workouts[0];
  const lastExercise = lastWorkout?.exercises[0];
  const recentWorkouts = workouts.slice(0, 3);
  const activeGoal = goals.find((goal) => goal.status === "Active") ?? goals[0];
  const activeGoalProgress = getGoalProgress(activeGoal);
  const currentProgram = programs[0];
  const deloadRecommendation = getDeloadRecommendation(workouts);
  const smartCoachInsight = getSmartCoachInsight(workouts, goals, programs);
  const todaysProgramDay = currentProgram
    ? getTodaysProgramDay(currentProgram, workouts)
    : null;
  const todaysWorkoutHref =
    currentProgram && todaysProgramDay
      ? `/add-workout?programId=${currentProgram.id}&dayId=${todaysProgramDay.id}`
      : "/add-workout";
  const todaysWorkoutEstimate = getWorkoutEstimateMinutes(
    todaysProgramDay?.exercises.length ?? 0
  );
  const isNewUser =
    workouts.length === 0 && goals.length === 0 && programs.length === 0;
  const weeklyWorkouts = workouts.filter(isWorkoutThisWeek).length;
  const weeklyTarget = Math.max(Number(currentProgram?.daysPerWeek) || 4, 1);
  const weeklyProgressPercent = Math.min(
    Math.round((weeklyWorkouts / weeklyTarget) * 100),
    100
  );
  const readinessStatus =
    smartCoachInsight.recoveryScore >= 80
      ? "Ready to train"
      : smartCoachInsight.recoveryScore >= 60
        ? "Train, but monitor fatigue"
        : "Back off today";
  const recentAchievement = lastExercise
    ? `${lastExercise.exercise} logged in your latest session`
    : "Log a workout to unlock achievements";

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Today
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
              Good training starts here{profile.name ? `, ${profile.name}` : ""}
            </h1>
            <p className="mt-3 text-gray-400">{todayLabel || "Today"}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-base font-bold text-gray-950 shadow-lg shadow-cyan-950/30 sm:flex">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : "EI"}
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-cyan-400/20 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-7">
            {isNewUser ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Build Your First Training Plan
                </p>
                <h2 className="mt-3 text-3xl font-bold">
                  Goal / Schedule / Equipment / Program
                </h2>
                <p className="mt-3 max-w-2xl text-gray-300">
                  Create a simple plan first. Once you have training data,
                  Today will switch into your daily coaching view.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/programs"
                    className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                  >
                    Build Program
                  </Link>
                  <Link
                    href="/add-workout"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                  >
                    Log First Workout
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Today's Workout
                  </p>
                  <h2 className="mt-3 text-4xl font-bold">
                    {todaysProgramDay?.name ?? "Add Workout"}
                  </h2>
                  <p className="mt-3 text-gray-300">
                    {todaysProgramDay
                      ? todaysProgramDay.isRestDay
                        ? "Rest day scheduled"
                        : `${todaysProgramDay.exercises.length} exercises · About ${todaysWorkoutEstimate} minutes`
                      : "No program day loaded yet. Start a manual workout or build a plan."}
                  </p>
                  {currentProgram && (
                    <p className="mt-2 text-sm text-gray-400">
                      From {currentProgram.name}
                    </p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Link
                    href={todaysWorkoutHref}
                    className="rounded-2xl bg-blue-600 px-4 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                  >
                    Start Workout
                  </Link>
                  <Link
                    href="/train"
                    className="rounded-2xl bg-white/10 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                  >
                    Preview
                  </Link>
                  <Link
                    href="/progress"
                    className="rounded-2xl bg-white/10 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                  >
                    Review Progress
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <div className="rounded-3xl border border-green-400/20 bg-green-950/20 p-5 shadow-xl shadow-green-950/10 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
                Readiness
              </p>
              <div className="mt-4 flex items-center gap-5">
                <RecoveryRing score={smartCoachInsight.recoveryScore} />
                <div>
                  <p className="text-2xl font-bold">{readinessStatus}</p>
                  <p className="mt-2 text-sm text-gray-400">
                    {smartCoachInsight.recoveryLabel} · Confidence{" "}
                    {smartCoachInsight.confidence}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-amber-950/10 p-5 shadow-xl shadow-amber-950/10 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
                Today's Adjustment
              </p>
              <h2 className="mt-3 text-2xl font-bold">{deloadRecommendation.action}</h2>
              <p className="mt-2 text-sm text-gray-300">
                {deloadRecommendation.detail}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Weekly Progress
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              {weeklyWorkouts} of {weeklyTarget} workouts completed
            </h2>
            <div className="mt-5 h-3 rounded-full bg-gray-950">
              <div
                className="h-3 rounded-full bg-cyan-400"
                style={{ width: `${weeklyProgressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-gray-400">
              {weeklyProgressPercent}% of this week's training target.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Recent Achievement
            </p>
            <h2 className="mt-3 text-3xl font-bold">{recentAchievement}</h2>
            <p className="mt-3 text-sm text-gray-400">
              ExerciseInsight will use this history to improve future workout
              targets and coaching recommendations.
            </p>
          </div>
        </div>

        {currentProgram && todaysProgramDay && (
          <div className="mb-8 rounded-3xl border border-green-400/30 bg-green-950/20 p-5 shadow-xl shadow-green-950/10 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
                  Program Preview
                </p>
                <h2 className="mt-2 text-3xl font-bold">{todaysProgramDay.name}</h2>
                <p className="mt-2 text-gray-300">
                  {todaysProgramDay.isRestDay
                    ? "Rest day"
                    : `${todaysProgramDay.exercises.length} exercises · Approximately ${todaysWorkoutEstimate} minutes`}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
                <Link
                  href={todaysWorkoutHref}
                  className="rounded-2xl bg-green-600 px-4 py-4 text-center font-semibold text-white shadow-lg shadow-green-950/30 hover:bg-green-500"
                >
                  Start Workout
                </Link>
                <Link
                  href="/programs"
                  className="rounded-2xl bg-white/10 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                >
                  Edit Program
                </Link>
              </div>
            </div>

            {!todaysProgramDay.isRestDay && todaysProgramDay.exercises.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {todaysProgramDay.exercises.slice(0, 4).map((programExercise) => (
                  <div
                    key={programExercise.id}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-3"
                  >
                    <p className="font-semibold">{programExercise.exercise}</p>
                    <p className="text-sm text-gray-400">
                      {programExercise.muscleGroup} · {programExercise.sets} x{" "}
                      {programExercise.reps}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-cyan-400/30 bg-cyan-950/20 p-5 shadow-xl shadow-cyan-950/10 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Demo Mode
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Explore ExerciseInsight with sample training data
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Loads a fictional athlete with workouts, goals, a program, PRs,
                bodyweight logs, soreness, and chart data so the dashboard shows
                what the app can do.
              </p>
              {isDemoMode && (
                <p className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-100">
                  Sample data is currently active on this device.
                </p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
              <button
                type="button"
                onClick={loadDemoDashboard}
                className="rounded-2xl bg-blue-600 px-4 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
              >
                Explore Demo Dashboard
              </button>
              {isDemoMode && (
                <button
                  type="button"
                  onClick={clearDemoDashboard}
                  className="rounded-2xl bg-gray-800 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-gray-700"
                >
                  Clear Demo Data
                </button>
              )}
            </div>
          </div>
        </div>

        {isNewUser && (
          <div className="mb-8 rounded-lg border border-blue-500/30 bg-blue-950/30 p-5 shadow-xl shadow-black/10 sm:p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-300">
              Quick Start
            </p>
            <h2 className="text-2xl font-bold">Set up ExerciseInsight in 3 steps</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link
                href="/profile"
                className="rounded-lg border border-white/10 bg-gray-950 p-4 hover:bg-gray-900"
              >
                <p className="font-semibold">1. Add Profile</p>
                <p className="mt-1 text-sm text-gray-400">
                  Save name, age, height, and weight.
                </p>
              </Link>
              <Link
                href="/goals"
                className="rounded-lg border border-white/10 bg-gray-950 p-4 hover:bg-gray-900"
              >
                <p className="font-semibold">2. Create Goal</p>
                <p className="mt-1 text-sm text-gray-400">
                  Pick a strength or consistency target.
                </p>
              </Link>
              <Link
                href="/programs"
                className="rounded-lg border border-white/10 bg-gray-950 p-4 hover:bg-gray-900"
              >
                <p className="font-semibold">3. Build Program</p>
                <p className="mt-1 text-sm text-gray-400">
                  Make a reusable plan you can start from.
                </p>
              </Link>
            </div>
          </div>
        )}

        <div className="mb-8">
          <CollapsibleSection
            title="Smart Coach"
            description="Rule-based coaching from your recent training data."
          >
            <div className="grid gap-4">
              <div className="rounded-3xl border border-gray-800 bg-gray-950 p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      Smart Coach
                    </p>
                    <h2 className="mt-4 text-3xl font-bold">Recovery Status</h2>
                    <p className="mt-2 text-gray-400">
                      {smartCoachInsight.recoveryLabel} · {smartCoachInsight.nextMove}
                    </p>
                  </div>
                  <RecoveryRing score={smartCoachInsight.recoveryScore} />
                </div>
                <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Confidence</p>
                    <p className="mt-1 text-xl font-bold">{smartCoachInsight.confidence}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Recommendation</p>
                    <p className="mt-1 text-xl font-bold">{deloadRecommendation.action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Exercise</p>
                    <p className="mt-1 text-xl font-bold">
                      {lastExercise ? lastExercise.exercise : "None yet"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-gray-300">
                    {deloadRecommendation.detail}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm text-gray-400">Training Focus</p>
                  <p className="mt-2 text-sm text-gray-300">
                    {smartCoachInsight.trainingFocus}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm text-gray-400">Program Guidance</p>
                  <p className="mt-2 text-sm text-gray-300">
                    {smartCoachInsight.programNote}
                  </p>
                </div>
              </div>

              <SorenessHeatmap workouts={workouts} />

              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm text-gray-400">Last Exercise Snapshot</p>
                <p className="mt-1 text-xl font-bold">
                  {lastExercise ? lastExercise.exercise : "None yet"}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {lastExercise
                    ? summarizeExerciseSets(lastExercise)
                    : "Log a workout to unlock exercise-level feedback."}
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <CollapsibleSection
            title="Active Goal"
            description="The main target currently guiding training."
          >
            {activeGoal ? (
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-300">
                      {activeGoal.goalType}
                    </p>
                    <h2 className="text-2xl font-bold">{activeGoal.title}</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {activeGoal.current} / {activeGoal.target}
                      {activeGoal.deadline ? " · Due " + activeGoal.deadline : ""}
                    </p>
                  </div>
                  <Link
                    href="/goals"
                    className="rounded-md bg-white/10 px-3 py-2 text-center text-sm font-semibold hover:bg-white/15"
                  >
                    Edit Goals
                  </Link>
                </div>
                <div className="h-3 rounded-full bg-gray-900">
                  <div
                    className="h-3 rounded-full bg-blue-600"
                    style={{ width: activeGoalProgress + "%" }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {activeGoalProgress}% complete
                </p>
              </div>
            ) : (
              <EmptyState
                title="No active goal yet"
                description="Create a strength, bodyweight, or consistency goal so the dashboard can track progress."
                actionHref="/goals"
                actionLabel="Create Goal"
              />
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Current Program"
            description="Your most recent saved training plan."
          >
            {currentProgram ? (
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{currentProgram.name}</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {currentProgram.splitType} · {currentProgram.daysPerWeek} days/week
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={todaysWorkoutHref}
                      className="rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold hover:bg-green-500"
                    >
                      Start Today
                    </Link>
                    <Link
                      href="/programs"
                      className="rounded-md bg-white/10 px-3 py-2 text-center text-sm font-semibold hover:bg-white/15"
                    >
                      Edit Program
                    </Link>
                  </div>
                </div>
                <div className="space-y-2">
                  {todaysProgramDay ? (
                    <div className="rounded-md border border-gray-800 bg-gray-900 p-3">
                      <p className="font-semibold">Today: {todaysProgramDay.name}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {todaysProgramDay.isRestDay
                          ? "Rest day"
                          : `${todaysProgramDay.exercises.length} planned exercises`}
                      </p>
                      {todaysProgramDay.exercises.slice(0, 3).map((programExercise) => (
                        <p key={programExercise.id} className="mt-2 text-sm text-gray-300">
                          {programExercise.exercise} · {programExercise.sets} x{" "}
                          {programExercise.reps}
                        </p>
                      ))}
                    </div>
                  ) : (
                    currentProgram.exercises.slice(0, 4).map((programExercise) => (
                      <div
                        key={programExercise.id}
                        className="rounded-md border border-gray-800 bg-gray-900 p-3"
                      >
                        <p className="font-semibold">{programExercise.exercise}</p>
                        <p className="text-sm text-gray-400">
                          {programExercise.muscleGroup} · {programExercise.sets} x{" "}
                          {programExercise.reps}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                {!todaysProgramDay && currentProgram.exercises.length > 4 && (
                  <p className="mt-3 text-sm text-gray-400">
                    +{currentProgram.exercises.length - 4} more exercises
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                title="No program saved yet"
                description="Build a Push/Pull/Legs, Upper/Lower, or Full Body EOD plan so workouts have structure."
                actionHref="/programs"
                actionLabel="Build Program"
              />
            )}
          </CollapsibleSection>
        </div>

        <div className="grid gap-6">
          <CollapsibleSection title="Recent Workouts">
            {recentWorkouts.length === 0 ? (
              <EmptyState
                title="No workouts saved yet"
                description="Build your first workout session to start filling the dashboard with useful training data."
                actionHref="/add-workout"
                actionLabel="Add Workout"
              />
            ) : (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <h3 className="font-semibold">Workout Session</h3>
                      <p className="text-sm text-gray-400">{workout.date}</p>
                    </div>
                    <p className="text-sm text-gray-300">
                      {workout.exercises.length} exercises · Feeling: {workout.feeling}
                    </p>
                    {workout.exercises[0] && (
                      <p className="mt-2 text-sm text-gray-400">
                        Top exercise: {workout.exercises[0].exercise} ·{" "}
                        {summarizeExerciseSets(workout.exercises[0])}
                      </p>
                    )}
                    {workout.notes && (
                      <p className="mt-2 text-sm text-gray-400">{workout.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
