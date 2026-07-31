"use client";

import { ExerciseDemo } from "./ExerciseDemo";
import type { ExerciseLibraryItem } from "../lib/fitnessData";

type ExerciseDetailModalProps = {
  exercise: ExerciseLibraryItem | null;
  onAddToWorkout?: (exerciseName: string) => void;
  onClose: () => void;
};

export function ExerciseDetailModal({
  exercise,
  onAddToWorkout,
  onClose,
}: ExerciseDetailModalProps) {
  if (!exercise) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-950 p-4 shadow-2xl shadow-cyan-950/40 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              Exercise Detail
            </p>
            <h2 id="exercise-detail-title" className="text-2xl font-bold sm:text-3xl">
              {exercise.exercise}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {exercise.muscleGroup} · {exercise.equipment} ·{" "}
              {exercise.movement ?? "Strength"}
            </p>
          </div>

          <div className="flex gap-2">
            {onAddToWorkout && (
              <button
                type="button"
                onClick={() => onAddToWorkout(exercise.exercise)}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500"
              >
                Add to Workout
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        <ExerciseDemo exercise={exercise} />
      </div>
    </div>
  );
}
