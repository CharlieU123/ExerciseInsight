"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [showCoachingDetails, setShowCoachingDetails] = useState(false);

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
  const showOnboarding = !currentProgram;
  const weeklyWorkouts = workouts.filter(isWorkoutThisWeek).length;
  const weeklyTarget = currentProgram
    ? Math.max(Number(currentProgram.daysPerWeek) || 1, 1)
    : 0;
  const weeklyProgressPercent =
    weeklyTarget > 0
      ? Math.min(Math.round((weeklyWorkouts / weeklyTarget) * 100), 100)
      : 0;
  const hasReadinessData = workouts.length >= 2;
  const readinessStatus =
    smartCoachInsight.recoveryScore >= 80
      ? "Ready to train"
      : smartCoachInsight.recoveryScore >= 60
        ? "Train, but monitor fatigue"
        : "Back off today";
  const recentAchievement = lastExercise
    ? `${lastExercise.exercise} logged in your latest session`
    : "Complete your first workout to begin tracking PRs, streaks, and progression.";
  const todaysCoachTitle = !lastWorkout
    ? "Establish your baseline"
    : hasReadinessData
      ? deloadRecommendation.action
      : "Keep building your baseline";
  const todaysCoachDetail = !lastWorkout
    ? todaysProgramDay
      ? `Complete today's ${todaysProgramDay.name} workout and record your weights, repetitions, and RIR. ExerciseInsight will use this session to begin building your future targets.`
      : "Complete your first workout and record your weights, repetitions, and RIR. ExerciseInsight will use this session to begin building future targets."
    : hasReadinessData
      ? deloadRecommendation.detail
      : "Complete one more workout with weights, repetitions, RIR, and recovery feedback to unlock personalized training adjustments.";

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Today
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
              Good training starts here
            </h1>
            <p className="mt-3 text-gray-400">{todayLabel || "Today"}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-base font-bold text-gray-950 shadow-lg shadow-cyan-950/30 sm:flex">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : "EI"}
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[1.45fr_0.75fr]">
          <section className="rounded-3xl border border-cyan-400/25 bg-gray-900/75 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-7">
            {showOnboarding ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Build Your First Training Plan
                </p>
                <h2 className="mt-3 text-3xl font-bold">
                  Give every workout a clear purpose
                </h2>
                <p className="mt-3 max-w-2xl text-gray-300">
                  Choose your training days and exercises. Once a program is
                  saved, Today will open directly to the next scheduled session.
                </p>
                <Link
                  href="/programs"
                  className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                >
                  Build Program
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Today&apos;s Workout
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-4xl font-bold">
                      {todaysProgramDay?.name ?? currentProgram?.name}
                    </h2>
                    <p className="mt-2 text-gray-300">
                      {todaysProgramDay?.isRestDay
                        ? "Recovery day scheduled"
                        : `${todaysProgramDay?.exercises.length ?? 0} exercises · About ${todaysWorkoutEstimate} minutes`}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    {currentProgram?.name} · {currentProgram?.daysPerWeek} days/week
                  </p>
                </div>

                {todaysProgramDay && !todaysProgramDay.isRestDay && (
                  <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                    {todaysProgramDay.exercises.slice(0, 4).map((programExercise) => (
                      <div
                        key={programExercise.id}
                        className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="font-semibold">{programExercise.exercise}</p>
                        <p className="text-sm text-gray-400">
                          {programExercise.sets} × {programExercise.reps}
                        </p>
                      </div>
                    ))}
                    {todaysProgramDay.exercises.length > 4 && (
                      <p className="py-3 text-sm text-gray-400">
                        +{todaysProgramDay.exercises.length - 4} more exercises
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {!todaysProgramDay?.isRestDay && (
                    <Link
                      href={todaysWorkoutHref}
                      className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                    >
                      Start Workout
                    </Link>
                  )}
                  <Link
                    href="/train"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                  >
                    Preview Workout
                  </Link>
                  <Link
                    href="/add-workout"
                    className="rounded-2xl px-5 py-4 text-center font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    Log a Different Workout
                  </Link>
                </div>
                <Link
                  href="/programs"
                  className="mt-5 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  View Full Program <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-green-400/20 bg-green-950/20 p-5 shadow-xl shadow-green-950/10 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
              Readiness
            </p>
            {hasReadinessData ? (
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center">
                <RecoveryRing score={smartCoachInsight.recoveryScore} />
                <div>
                  <h2 className="text-2xl font-bold">{readinessStatus}</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    {smartCoachInsight.recoveryLabel} · Confidence{" "}
                    {smartCoachInsight.confidence}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCoachingDetails((isOpen) => !isOpen)}
                    className="mt-4 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15"
                  >
                    {showCoachingDetails
                      ? "Hide Coaching Details"
                      : "View Coaching Details"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="text-2xl font-bold">Not enough data</h2>
                <p className="mt-2 text-sm text-gray-300">
                  Complete at least two workouts and include recovery feedback
                  to generate your readiness score.
                </p>
              </div>
            )}
          </section>
        </div>

        {showCoachingDetails && hasReadinessData && (
          <section className="mb-8 border-y border-cyan-400/20 py-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Next Move
                </p>
                <p className="mt-3 text-sm text-gray-300">
                  {smartCoachInsight.nextMove}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Training Focus
                </p>
                <p className="mt-3 text-sm text-gray-300">
                  {smartCoachInsight.trainingFocus}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Program Guidance
                </p>
                <p className="mt-3 text-sm text-gray-300">
                  {smartCoachInsight.programNote}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-amber-400/20 bg-amber-950/10 p-5 shadow-xl shadow-amber-950/10 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
              Today&apos;s Coach
            </p>
            <h2 className="mt-3 text-2xl font-bold">{todaysCoachTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              {todaysCoachDetail}
            </p>
            {todaysProgramDay && !todaysProgramDay.isRestDay && (
              <Link
                href={todaysWorkoutHref}
                className="mt-5 inline-flex rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-gray-950 hover:bg-amber-300"
              >
                Start {todaysProgramDay.name} Workout
              </Link>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Weekly Progress
            </p>
            {currentProgram ? (
              <>
                <h2 className="mt-3 text-3xl font-bold">
                  {weeklyWorkouts} of {weeklyTarget} planned workouts completed
                </h2>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-950">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${weeklyProgressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  {weeklyWorkouts === 0 && todaysProgramDay
                    ? `Your first scheduled session is ${todaysProgramDay.name}.`
                    : `${weeklyProgressPercent}% of this week's plan is complete.`}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-3xl font-bold">No weekly target yet</h2>
                <p className="mt-3 text-sm text-gray-400">
                  Choose your training days when building a program.
                </p>
              </>
            )}
          </section>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Active Goal
                </p>
                {activeGoal ? (
                  <>
                    <h2 className="mt-3 text-2xl font-bold">{activeGoal.title}</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      {activeGoal.current} / {activeGoal.target}
                      {activeGoal.deadline ? ` · Due ${activeGoal.deadline}` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-3 text-2xl font-bold">No active goal yet</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Add a strength, bodyweight, or consistency goal to make
                      coaching recommendations more specific.
                    </p>
                  </>
                )}
              </div>
              <Link
                href="/goals"
                className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
              >
                {activeGoal ? "Edit" : "Create Goal"}
              </Link>
            </div>
            {activeGoal && (
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-gray-950">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${activeGoalProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {activeGoalProgress}% complete
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Recent Achievement
            </p>
            <h2 className="mt-3 text-2xl font-bold">{recentAchievement}</h2>
            {lastExercise && (
              <p className="mt-3 text-sm text-gray-400">
                ExerciseInsight will use this history to improve future targets
                and coaching recommendations.
              </p>
            )}
          </section>
        </div>

        <section className="mb-8 rounded-3xl border border-white/10 bg-gray-900/55 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Recent Workouts
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {recentWorkouts.length > 0
                  ? "Your latest sessions"
                  : "No completed workouts yet"}
              </h2>
            </div>
            {recentWorkouts.length > 0 && (
              <Link
                href="/history"
                className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                View History
              </Link>
            )}
          </div>
          {recentWorkouts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Complete today&apos;s session to begin building your training history.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {recentWorkouts.map((workout) => (
                <article
                  key={workout.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">Workout Session</h3>
                    <p className="mt-1 text-sm text-gray-300">
                      {workout.exercises.length} exercises · Feeling: {workout.feeling}
                    </p>
                    {workout.exercises[0] && (
                      <p className="mt-1 text-sm text-gray-500">
                        {workout.exercises[0].exercise} ·{" "}
                        {summarizeExerciseSets(workout.exercises[0])}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{workout.date}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-950/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Demo Mode
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Want to preview the complete experience?
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-300">
                Load fictional training data to explore coaching, progress
                charts, records, and recovery insights.
              </p>
              {isDemoMode && (
                <p className="mt-3 text-sm font-semibold text-cyan-200">
                  Sample data is currently active on this device.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={loadDemoDashboard}
                className="rounded-2xl bg-blue-600 px-4 py-4 text-center font-semibold text-white hover:bg-blue-500"
              >
                Explore Demo Dashboard
              </button>
              {isDemoMode && (
                <button
                  type="button"
                  onClick={clearDemoDashboard}
                  className="rounded-2xl bg-white/10 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                >
                  Clear Demo Data
                </button>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
