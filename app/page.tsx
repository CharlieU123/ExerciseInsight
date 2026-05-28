"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { EmptyState } from "./components/EmptyState";
import {
  getDeloadRecommendation,
  getProgramDays,
  getSmartCoachInsight,
  isWorkoutThisWeek,
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
  const workoutsThisWeek = workouts.filter(isWorkoutThisWeek).length;
  const totalExercises = workouts.reduce(
    (total, workout) => total + workout.exercises.length,
    0
  );
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
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-lg border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Home
          </p>
          <h1 className="mb-3 max-w-3xl text-3xl font-bold sm:text-5xl">
            {profile.name
              ? "Welcome back, " + profile.name
              : "ExerciseInsight training dashboard"}
          </h1>
          <p className="max-w-2xl text-gray-300">
            See your weekly training, active goals, current program, and recent
            workout feedback in one place.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/add-workout"
              className="rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            >
              Build Workout
            </Link>
            {currentProgram && (
              <Link
                href={
                  currentProgramFirstDay
                    ? `/add-workout?programId=${currentProgram.id}&dayId=${currentProgramFirstDay.id}`
                    : `/add-workout?programId=${currentProgram.id}`
                }
                className="rounded-md bg-green-600 px-4 py-3 text-center font-semibold text-white shadow-lg shadow-green-950/30 hover:bg-green-500"
              >
                Start Current Program
              </Link>
            )}
            <Link
              href="/progress"
              className="rounded-md bg-white/10 px-4 py-3 text-center font-semibold text-gray-100 hover:bg-white/15"
            >
              View Progress
            </Link>
            <Link
              href="/programs"
              className="rounded-md bg-white/10 px-4 py-3 text-center font-semibold text-gray-100 hover:bg-white/15"
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

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10">
            <p className="text-sm text-gray-400">Total Workouts</p>
            <p className="text-3xl font-bold">{workouts.length}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10">
            <p className="text-sm text-gray-400">This Week</p>
            <p className="text-3xl font-bold">{workoutsThisWeek}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10">
            <p className="text-sm text-gray-400">Total Exercises</p>
            <p className="text-3xl font-bold">{totalExercises}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10">
            <p className="text-sm text-gray-400">Active Goals</p>
            <p className="text-3xl font-bold">
              {goals.filter((goal) => goal.status === "Active").length}
            </p>
          </div>
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

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <CollapsibleSection title="Recent Workouts">
            {recentWorkouts.length === 0 ? (
              <EmptyState
                title="No workouts saved yet"
                description="Build your first workout session to start filling the dashboard with useful training data."
                actionHref="/add-workout"
                actionLabel="Build Workout"
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

          <CollapsibleSection
            title="Smart Coach"
            description="Rule-based coaching from your recent training data."
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Recovery Score</p>
                    <h2 className="mt-1 text-4xl font-bold">
                      {smartCoachInsight.recoveryScore}
                      <span className="text-lg text-gray-400">/100</span>
                    </h2>
                  </div>
                  <span className="rounded-full bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-300">
                    {smartCoachInsight.confidence} confidence
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-900">
                  <div
                    className="h-3 rounded-full bg-blue-600"
                    style={{ width: smartCoachInsight.recoveryScore + "%" }}
                  />
                </div>
                <p className="mt-3 font-semibold">{smartCoachInsight.recoveryLabel}</p>
                <p className="mt-1 text-sm text-gray-300">
                  {deloadRecommendation.detail}
                </p>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm text-gray-400">Next Recommendation</p>
                <h2 className="mt-1 text-2xl font-bold">{deloadRecommendation.action}</h2>
                <p className="mt-2 text-sm text-gray-300">{smartCoachInsight.nextMove}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm text-gray-400">Training Focus</p>
                  <p className="mt-2 text-sm text-gray-300">
                    {smartCoachInsight.trainingFocus}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm text-gray-400">Program Guidance</p>
                  <p className="mt-2 text-sm text-gray-300">
                    {smartCoachInsight.programNote}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
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
      </section>
    </main>
  );
}
