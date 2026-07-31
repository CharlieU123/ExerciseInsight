"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ExerciseDetailModal } from "../components/ExerciseDetailModal";
import {
  exerciseLibrary,
  muscleGroups,
  splitTypes,
  type ExerciseLibraryItem,
} from "../lib/fitnessData";

const allMuscles = "All";

const goals = [
  {
    name: "Hypertrophy",
    description: "Build muscle with moderate reps, stable technique, and enough weekly sets.",
    movements: ["Press", "Pull", "Row", "Squat", "Hinge", "Curl", "Extension", "Raise", "Fly"],
    repRange: "8-15 reps",
  },
  {
    name: "Strength",
    description: "Prioritize heavier compound lifts, lower reps, and repeatable progression.",
    movements: ["Press", "Squat", "Hinge", "Row", "Pull"],
    repRange: "3-8 reps",
  },
  {
    name: "Beginner",
    description: "Start with easy-to-learn movements and simple full-body progression.",
    movements: ["Press", "Row", "Squat", "Hinge", "Core", "Carry"],
    repRange: "8-12 reps",
  },
  {
    name: "Bodybuilding",
    description: "Use muscle-specific choices, substitutions, and recovery-aware volume.",
    movements: ["Press", "Fly", "Row", "Pull", "Curl", "Extension", "Raise", "Squat", "Hinge"],
    repRange: "10-20 reps",
  },
];

const splitRecommendations = [
  {
    name: "Push/Pull/Legs",
    goal: "Hypertrophy",
    days: "3-6 days/week",
    detail: "Great when users want more muscle-group focus and repeatable weekly volume.",
    sample: ["Push: chest, shoulders, triceps", "Pull: back, biceps", "Legs: quads, hamstrings, glutes"],
  },
  {
    name: "Upper/Lower",
    goal: "Strength",
    days: "4 days/week",
    detail: "Strong balance of practice frequency, recovery, and big compound lift progress.",
    sample: ["Upper: press and row", "Lower: squat and hinge", "Repeat with variations"],
  },
  {
    name: "Full Body EOD",
    goal: "Beginner",
    days: "3-4 days/week",
    detail: "Simple rhythm for learning movements while keeping recovery days built in.",
    sample: ["Full body session", "Rest day", "Full body session"],
  },
  {
    name: "Bodybuilding Rotation",
    goal: "Bodybuilding",
    days: "4-5 days/week",
    detail: "Useful for physique-focused users who want dedicated work for lagging muscles.",
    sample: ["Chest/back", "Legs", "Shoulders/arms", "Rest or weak-point day"],
  },
];

function matchesGoal(exercise: ExerciseLibraryItem, selectedGoal: string) {
  const goal = goals.find((goalOption) => goalOption.name === selectedGoal);

  if (!goal) {
    return true;
  }

  const exerciseText = [
    exercise.exercise,
    exercise.target,
    exercise.movement,
    exercise.equipment,
    ...exercise.cues,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (selectedGoal === "Strength") {
    return (
      exerciseText.includes("barbell") ||
      exerciseText.includes("squat") ||
      exerciseText.includes("deadlift") ||
      exerciseText.includes("press") ||
      exerciseText.includes("row") ||
      exerciseText.includes("pull-up")
    );
  }

  if (selectedGoal === "Beginner") {
    return (
      !exerciseText.includes("advanced") &&
      !exerciseText.includes("olympic") &&
      !exerciseText.includes("snatch")
    );
  }

  return goal.movements.some((movement) =>
    exerciseText.includes(movement.toLowerCase())
  );
}

export default function DiscoverPage() {
  const [selectedGoal, setSelectedGoal] = useState(goals[0].name);
  const [selectedMuscle, setSelectedMuscle] = useState(allMuscles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExerciseDetail, setSelectedExerciseDetail] =
    useState<ExerciseLibraryItem | null>(null);

  const filteredExercises = useMemo(
    () =>
      exerciseLibrary
        .filter((exercise) => {
          const search = searchTerm.trim().toLowerCase();
          const matchesSearch =
            search === "" ||
            exercise.exercise.toLowerCase().includes(search) ||
            exercise.target.toLowerCase().includes(search) ||
            exercise.equipment.toLowerCase().includes(search) ||
            (exercise.movement ?? "").toLowerCase().includes(search);
          const matchesMuscle =
            selectedMuscle === allMuscles || exercise.muscleGroup === selectedMuscle;

          return matchesSearch && matchesMuscle && matchesGoal(exercise, selectedGoal);
        })
        .slice(0, 24),
    [searchTerm, selectedGoal, selectedMuscle]
  );

  const selectedGoalDetails = goals.find((goal) => goal.name === selectedGoal) ?? goals[0];
  const matchingSplits = splitRecommendations.filter(
    (split) => split.goal === selectedGoal || splitTypes.includes(split.name)
  );

  function addExerciseToWorkout(exerciseName: string) {
    window.location.href = `/add-workout?exercise=${encodeURIComponent(exerciseName)}`;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-fuchsia-500/10 to-gray-950 p-6 shadow-2xl shadow-cyan-950/20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Discover
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-5xl">
            Find exercises and splits for your goal.
          </h1>
          <p className="max-w-3xl text-gray-300">
            Explore movements by muscle group, equipment, and training goal. Open any
            exercise to see a demonstration, then send it straight to your workout.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {goals.map((goal) => (
            <button
              key={goal.name}
              type="button"
              onClick={() => setSelectedGoal(goal.name)}
              className={
                selectedGoal === goal.name
                  ? "rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-4 text-left shadow-lg shadow-cyan-950/20"
                  : "rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30"
              }
            >
              <p className="text-lg font-semibold">{goal.name}</p>
              <p className="mt-2 text-sm text-gray-400">{goal.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                {goal.repRange}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                  Exercise Finder
                </p>
                <h2 className="text-2xl font-bold">{selectedGoal} Exercises</h2>
              </div>
              <p className="text-sm text-gray-400">
                Showing {filteredExercises.length} suggestions
              </p>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <input
                className="rounded-md border border-gray-700 bg-gray-950 p-3"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search press, cable, quads..."
                aria-label="Search discovered exercises"
              />
              <select
                className="rounded-md border border-gray-700 bg-gray-950 p-3"
                value={selectedMuscle}
                onChange={(event) => setSelectedMuscle(event.target.value)}
                aria-label="Filter discovered exercises by muscle"
              >
                <option value={allMuscles}>All muscles</option>
                {muscleGroups.map((muscleGroup) => (
                  <option key={muscleGroup} value={muscleGroup}>
                    {muscleGroup}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedMuscle(allMuscles);
                }}
                className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            {filteredExercises.length === 0 ? (
              <EmptyState
                title="No suggestions found"
                description="Try another goal, muscle group, or search term."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.exercise}
                    type="button"
                    onClick={() => setSelectedExerciseDetail(exercise)}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-950/20"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                          {exercise.muscleGroup}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">
                          {exercise.exercise}
                        </h3>
                      </div>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-gray-300">
                        {exercise.movement ?? "Strength"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{exercise.target}</p>
                    <p className="mt-3 text-sm font-semibold text-green-300">
                      {exercise.defaultSets} x {exercise.defaultReps}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                Goal Notes
              </p>
              <h2 className="mt-2 text-2xl font-bold">{selectedGoalDetails.name}</h2>
              <p className="mt-3 text-sm text-gray-300">
                {selectedGoalDetails.description}
              </p>
              <p className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3 text-sm text-cyan-100">
                Suggested range: {selectedGoalDetails.repRange}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                Split Ideas
              </p>
              <div className="mt-4 space-y-3">
                {matchingSplits.map((split) => (
                  <article
                    key={split.name}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{split.name}</h3>
                        <p className="text-sm text-gray-400">{split.days}</p>
                      </div>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-gray-300">
                        {split.goal}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-300">{split.detail}</p>
                    <div className="mt-3 space-y-2">
                      {split.sample.map((line) => (
                        <p key={line} className="text-sm text-gray-400">
                          {line}
                        </p>
                      ))}
                    </div>
                    <Link
                      href="/programs"
                      className="mt-4 inline-flex rounded-md bg-fuchsia-600 px-3 py-2 text-sm font-semibold hover:bg-fuchsia-500"
                    >
                      Build This Split
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <ExerciseDetailModal
        exercise={selectedExerciseDetail}
        onAddToWorkout={addExerciseToWorkout}
        onClose={() => setSelectedExerciseDetail(null)}
      />
    </main>
  );
}
