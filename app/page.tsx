"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { EmptyState } from "./components/EmptyState";
import {
  getDeloadRecommendation,
  getProgramDays,
  getSmartCoachInsight,
  loadFitnessGoals,
  loadProfile,
  loadTrainingPrograms,
  loadWorkouts,
  summarizeExerciseSets,
  type FitnessGoal,
  type Profile,
  type TrainingProgram,
  type Workout,
} from "./lib/fitnessData";
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

  const lastWorkout = workouts[0];
  const lastExercise = lastWorkout?.exercises[0];
  const recentWorkouts = workouts.slice(0, 3);
  const activeGoal = goals.find((goal) => goal.status === "Active") ?? goals[0];
  const activeGoalProgress = getGoalProgress(activeGoal);
  const currentProgram = programs[0];
  const deloadRecommendation = getDeloadRecommendation(workouts);
  const smartCoachInsight = getSmartCoachInsight(workouts, goals, programs);
  const currentProgramFirstDay = currentProgram
    ? getProgramDays(currentProgram)[0]
    : null;
  const isNewUser =
    workouts.length === 0 && goals.length === 0 && programs.length === 0;

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-400">Good training starts here,</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
              {profile.name ? profile.name : "ExerciseInsight"}
            </h1>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-base font-bold text-gray-950 shadow-lg shadow-cyan-950/30 sm:flex">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : "EI"}
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Dashboard
              </p>
              <h2 className="max-w-3xl text-2xl font-bold sm:text-3xl">
                Train smarter with your current program, recovery, and recent feedback.
              </h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/add-workout"
              className="rounded-2xl bg-blue-600 px-4 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            >
              Add Workout
            </Link>
            {currentProgram && (
              <Link
                href={
                  currentProgramFirstDay
                    ? `/add-workout?programId=${currentProgram.id}&dayId=${currentProgramFirstDay.id}`
                    : `/add-workout?programId=${currentProgram.id}`
                }
                className="rounded-2xl bg-green-600 px-4 py-4 text-center font-semibold text-white shadow-lg shadow-green-950/30 hover:bg-green-500"
              >
                Start Current Program
              </Link>
            )}
            <Link
              href="/progress"
              className="rounded-2xl bg-white/10 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
            >
              View Progress
            </Link>
            <Link
              href="/programs"
              className="rounded-2xl bg-white/10 px-4 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
            >
              Manage Program
            </Link>
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
                      href={
                        currentProgramFirstDay
                          ? `/add-workout?programId=${currentProgram.id}&dayId=${currentProgramFirstDay.id}`
                          : `/add-workout?programId=${currentProgram.id}`
                      }
                      className="rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold hover:bg-green-500"
                    >
                      Start Day 1
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
                  {currentProgramFirstDay ? (
                    <div className="rounded-md border border-gray-800 bg-gray-900 p-3">
                      <p className="font-semibold">Day 1: {currentProgramFirstDay.name}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {currentProgramFirstDay.isRestDay
                          ? "Rest day"
                          : `${currentProgramFirstDay.exercises.length} planned exercises`}
                      </p>
                      {currentProgramFirstDay.exercises.slice(0, 3).map((programExercise) => (
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
                {!currentProgramFirstDay && currentProgram.exercises.length > 4 && (
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
