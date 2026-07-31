"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getProgramDays,
  getSmartCoachInsight,
  loadFitnessGoals,
  loadTrainingPrograms,
  loadWorkouts,
  type FitnessGoal,
  type ProgramDay,
  type TrainingProgram,
  type Workout,
} from "../lib/fitnessData";
import {
  loadGoalsFromSupabase,
  loadProgramsFromSupabase,
} from "../lib/supabasePlanning";
import {
  getCurrentUserId,
  loadWorkoutsFromSupabase,
} from "../lib/supabaseWorkouts";

function getTrainingDays(program?: TrainingProgram) {
  if (!program) {
    return [];
  }

  return getProgramDays(program).filter(
    (day) => !day.isRestDay && day.exercises.length > 0
  );
}

function getTodaysTrainingDay(
  program: TrainingProgram | undefined,
  workouts: Workout[]
): ProgramDay | null {
  const trainingDays = getTrainingDays(program);

  if (trainingDays.length === 0) {
    return null;
  }

  return trainingDays[workouts.length % trainingDays.length] ?? trainingDays[0];
}

function getWorkoutEstimateMinutes(day: ProgramDay | null) {
  if (!day || day.isRestDay || day.exercises.length === 0) {
    return 0;
  }

  return Math.max(35, day.exercises.length * 9 + 12);
}

function getProgramExerciseTotal(program?: TrainingProgram) {
  if (!program) {
    return 0;
  }

  return getProgramDays(program).reduce(
    (total, day) => total + day.exercises.length,
    0
  );
}

export default function TrainPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);

  useEffect(() => {
    async function loadTrainData() {
      const userId = await getCurrentUserId();

      if (userId) {
        try {
          setWorkouts(await loadWorkoutsFromSupabase());
        } catch {
          setWorkouts(loadWorkouts());
        }

        try {
          setPrograms(await loadProgramsFromSupabase());
        } catch {
          setPrograms(loadTrainingPrograms());
        }

        try {
          setGoals(await loadGoalsFromSupabase());
        } catch {
          setGoals(loadFitnessGoals());
        }

        return;
      }

      setWorkouts(loadWorkouts());
      setPrograms(loadTrainingPrograms());
      setGoals(loadFitnessGoals());
    }

    loadTrainData();
  }, []);

  const currentProgram = programs[0];
  const todaysDay = useMemo(
    () => getTodaysTrainingDay(currentProgram, workouts),
    [currentProgram, workouts]
  );
  const smartCoachInsight = getSmartCoachInsight(workouts, goals, programs);
  const estimateMinutes = getWorkoutEstimateMinutes(todaysDay);
  const startHref =
    currentProgram && todaysDay
      ? `/add-workout?programId=${currentProgram.id}&dayId=${todaysDay.id}`
      : "/add-workout";
  const programExerciseTotal = getProgramExerciseTotal(currentProgram);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Train
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Plan / Train / Review / Adjust
          </h1>
          <p className="mt-3 max-w-3xl text-gray-300">
            Start the workout that belongs to your program, review your recent
            training, and keep the library close when you need to change a
            movement.
          </p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-cyan-400/20 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur sm:p-7">
            {todaysDay && currentProgram ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Today's Workout
                </p>
                <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-4xl font-bold">{todaysDay.name}</h2>
                    <p className="mt-3 text-gray-300">
                      {todaysDay.exercises.length} exercises · About{" "}
                      {estimateMinutes} minutes
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Loaded from {currentProgram.name}. Starting it will use
                      this exact day and bring in previous set performance.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:min-w-56">
                    <Link
                      href={startHref}
                      className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                    >
                      Start Workout
                    </Link>
                    <Link
                      href="/programs"
                      className="rounded-2xl bg-white/10 px-5 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                    >
                      Preview Program
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {todaysDay.exercises.slice(0, 6).map((exercise) => (
                    <div
                      key={exercise.id}
                      className="rounded-2xl border border-white/10 bg-gray-950 p-4"
                    >
                      <p className="font-semibold">{exercise.exercise}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {exercise.muscleGroup} · {exercise.sets} x {exercise.reps}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Build Your First Training Plan
                </p>
                <h2 className="mt-4 text-4xl font-bold">
                  Turn workouts into a repeatable program
                </h2>
                <p className="mt-3 max-w-2xl text-gray-300">
                  Pick a split, choose your training days, add exercises, and
                  ExerciseInsight will make Today and Active Workout feel
                  connected.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/programs"
                    className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                  >
                    Build Program
                  </Link>
                  <Link
                    href="/discover"
                    className="rounded-2xl bg-white/10 px-5 py-4 text-center font-semibold text-gray-100 hover:bg-white/15"
                  >
                    Discover Templates
                  </Link>
                </div>
              </>
            )}
          </section>

          <aside className="grid gap-5">
            <div className="rounded-3xl border border-green-400/20 bg-green-950/20 p-5 shadow-xl shadow-green-950/10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
                Recovery Check
              </p>
              <p className="mt-4 text-5xl font-bold">
                {smartCoachInsight.recoveryScore}
                <span className="text-xl text-gray-400">/100</span>
              </p>
              <p className="mt-3 text-sm text-gray-300">
                {smartCoachInsight.nextMove}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Current Program
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                {currentProgram?.name ?? "No program yet"}
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                {currentProgram
                  ? `${currentProgram.splitType} · ${currentProgram.daysPerWeek} days/week · ${programExerciseTotal} total exercises`
                  : "Build a program to make training days easier to start."}
              </p>
            </div>
          </aside>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/add-workout"
            className="group rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-gray-900"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Active Workout
            </p>
            <h2 className="mt-4 text-2xl font-bold">Open gym mode</h2>
            <p className="mt-3 text-sm text-gray-400">
              Complete sets, edit each row, run rest timers, and autosave the
              session while training.
            </p>
          </Link>

          <Link
            href="/programs"
            className="group rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-gray-900"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Programs
            </p>
            <h2 className="mt-4 text-2xl font-bold">Plan the week</h2>
            <p className="mt-3 text-sm text-gray-400">
              Create Push/Pull/Legs, Upper/Lower, Full Body EOD, or custom
              program days.
            </p>
          </Link>

          <Link
            href="/history"
            className="group rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-gray-900"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Workout History
            </p>
            <h2 className="mt-4 text-2xl font-bold">Review sessions</h2>
            <p className="mt-3 text-sm text-gray-400">
              Check completed workouts, set details, notes, soreness, and
              training feedback.
            </p>
          </Link>

          <Link
            href="/library"
            className="group rounded-3xl border border-white/10 bg-gray-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-gray-900"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Exercise Library
            </p>
            <h2 className="mt-4 text-2xl font-bold">Find replacements</h2>
            <p className="mt-3 text-sm text-gray-400">
              Search movements by muscle, equipment, pattern, and substitutions.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
