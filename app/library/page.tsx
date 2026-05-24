"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { EmptyState } from "../components/EmptyState";
import {
  exerciseLibrary,
  muscleGroups,
  type ExerciseLibraryItem,
} from "../lib/fitnessData";
import {
  loadCustomExercisesFromDevice,
  loadCustomExercisesFromSupabase,
  saveCustomExercisesToDevice,
  saveCustomExerciseToSupabase,
} from "../lib/supabaseExerciseLibrary";
import { getCurrentUserId } from "../lib/supabaseWorkouts";

const allMuscles = "All";

export default function ExerciseLibraryPage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [muscleFilter, setMuscleFilter] = useState(allMuscles);
  const [copiedExercise, setCopiedExercise] = useState("");
  const [customExercises, setCustomExercises] = useState<ExerciseLibraryItem[]>([]);
  const [userId, setUserId] = useState("");
  const [libraryMessage, setLibraryMessage] = useState("");
  const [newExercise, setNewExercise] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState("Chest");
  const [newEquipment, setNewEquipment] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDefaultSets, setNewDefaultSets] = useState("3");
  const [newDefaultReps, setNewDefaultReps] = useState("8-12");
  const [newCues, setNewCues] = useState("");
  const [newSubstitutions, setNewSubstitutions] = useState("");

  useEffect(() => {
    async function loadLibrary() {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);

      if (currentUserId) {
        try {
          setCustomExercises(await loadCustomExercisesFromSupabase());
          setLibraryMessage("Showing your private custom exercises from Supabase.");
        } catch {
          setCustomExercises(loadCustomExercisesFromDevice());
          setLibraryMessage(
            "Could not load custom exercises from Supabase. Showing this device."
          );
        }
      } else {
        setCustomExercises(loadCustomExercisesFromDevice());
        setLibraryMessage("Log in to save custom exercises privately to Supabase.");
      }
    }

    loadLibrary();
  }, []);

  const allExercises = useMemo(
    () => [...exerciseLibrary, ...customExercises],
    [customExercises]
  );

  const filteredExercises = useMemo(
    () =>
      allExercises.filter((libraryExercise) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
          search === "" ||
          libraryExercise.exercise.toLowerCase().includes(search) ||
          libraryExercise.target.toLowerCase().includes(search) ||
          libraryExercise.substitutions.some((substitution) =>
            substitution.toLowerCase().includes(search)
          );
        const matchesMuscle =
          muscleFilter === allMuscles ||
          libraryExercise.muscleGroup === muscleFilter;

        return matchesSearch && matchesMuscle;
      }),
    [allExercises, muscleFilter, searchTerm]
  );

  async function copyExerciseName(exerciseName: string) {
    try {
      await navigator.clipboard.writeText(exerciseName);
      setCopiedExercise(exerciseName);
    } catch {
      setCopiedExercise("");
    }
  }

  function addExerciseToWorkout(exerciseName: string) {
    router.push(`/add-workout?exercise=${encodeURIComponent(exerciseName)}`);
  }

  function resetCustomExerciseForm() {
    setNewExercise("");
    setNewMuscleGroup("Chest");
    setNewEquipment("");
    setNewTarget("");
    setNewDefaultSets("3");
    setNewDefaultReps("8-12");
    setNewCues("");
    setNewSubstitutions("");
  }

  async function saveCustomExercise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customExercise = {
      exercise: newExercise,
      muscleGroup: newMuscleGroup,
      equipment: newEquipment || "Custom",
      target: newTarget || newMuscleGroup,
      defaultSets: newDefaultSets,
      defaultReps: newDefaultReps,
      cues: newCues
        .split(",")
        .map((cue) => cue.trim())
        .filter(Boolean),
      substitutions: newSubstitutions
        .split(",")
        .map((substitution) => substitution.trim())
        .filter(Boolean),
    };
    const exerciseExists = allExercises.some(
      (libraryExercise) =>
        libraryExercise.exercise.toLowerCase() ===
        customExercise.exercise.toLowerCase()
    );

    if (exerciseExists) {
      setLibraryMessage("That exercise already exists in your library.");
      return;
    }

    if (userId) {
      try {
        const savedExercise = await saveCustomExerciseToSupabase(customExercise);
        setCustomExercises([...customExercises, savedExercise]);
        setLibraryMessage("Custom exercise saved privately to Supabase.");
        resetCustomExerciseForm();
      } catch {
        setLibraryMessage("Could not save custom exercise to Supabase.");
      }

      return;
    }

    const updatedCustomExercises = [...customExercises, customExercise];
    setCustomExercises(updatedCustomExercises);
    saveCustomExercisesToDevice(updatedCustomExercises);
    setLibraryMessage("Custom exercise saved on this device.");
    resetCustomExerciseForm();
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Library
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Exercise Library
          </h1>
          <p className="max-w-3xl text-gray-300">
            Browse exercises by muscle group, check useful cues, and find
            substitutions when equipment is taken or a movement does not feel right.
          </p>
          {libraryMessage && (
            <p className="mt-3 rounded-md border border-white/10 bg-gray-950 p-3 text-sm text-gray-300">
              {libraryMessage}
            </p>
          )}
        </div>

        <CollapsibleSection
          title="Add Custom Exercise"
          description="Private custom exercises are only shown to the user who creates them."
        >
          <form onSubmit={saveCustomExercise} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="custom-exercise" className="mb-1 block text-sm text-gray-300">
                  Exercise
                </label>
                <input
                  id="custom-exercise"
                  name="custom-exercise"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={newExercise}
                  onChange={(event) => setNewExercise(event.target.value)}
                  placeholder="Smith Machine Incline Press"
                  required
                />
              </div>

              <div>
                <label htmlFor="custom-muscle" className="mb-1 block text-sm text-gray-300">
                  Muscle Group
                </label>
                <select
                  id="custom-muscle"
                  name="custom-muscle"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={newMuscleGroup}
                  onChange={(event) => setNewMuscleGroup(event.target.value)}
                >
                  {muscleGroups.map((muscleGroup) => (
                    <option key={muscleGroup} value={muscleGroup}>
                      {muscleGroup}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="custom-equipment" className="mb-1 block text-sm text-gray-300">
                  Equipment
                </label>
                <input
                  id="custom-equipment"
                  name="custom-equipment"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={newEquipment}
                  onChange={(event) => setNewEquipment(event.target.value)}
                  placeholder="Machine, cable, dumbbells..."
                />
              </div>

              <div>
                <label htmlFor="custom-target" className="mb-1 block text-sm text-gray-300">
                  Target
                </label>
                <input
                  id="custom-target"
                  name="custom-target"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={newTarget}
                  onChange={(event) => setNewTarget(event.target.value)}
                  placeholder="Upper chest, lats, quads..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="custom-sets" className="mb-1 block text-sm text-gray-300">
                  Starter Sets
                </label>
                <input
                  id="custom-sets"
                  name="custom-sets"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={newDefaultSets}
                  onChange={(event) => setNewDefaultSets(event.target.value)}
                  placeholder="3"
                  required
                />
              </div>

              <div>
                <label htmlFor="custom-reps" className="mb-1 block text-sm text-gray-300">
                  Starter Reps
                </label>
                <input
                  id="custom-reps"
                  name="custom-reps"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={newDefaultReps}
                  onChange={(event) => setNewDefaultReps(event.target.value)}
                  placeholder="8-12"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="custom-cues" className="mb-1 block text-sm text-gray-300">
                Cues
              </label>
              <input
                id="custom-cues"
                name="custom-cues"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={newCues}
                onChange={(event) => setNewCues(event.target.value)}
                placeholder="Comma separated: Control the negative, pause at the bottom"
              />
            </div>

            <div>
              <label htmlFor="custom-substitutions" className="mb-1 block text-sm text-gray-300">
                Substitutions
              </label>
              <input
                id="custom-substitutions"
                name="custom-substitutions"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={newSubstitutions}
                onChange={(event) => setNewSubstitutions(event.target.value)}
                placeholder="Comma separated: Dumbbell Press, Machine Press"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-3 font-semibold hover:bg-green-500"
            >
              Save Custom Exercise
            </button>
          </form>
        </CollapsibleSection>

        <CollapsibleSection
          title="Find Exercises"
          description="Search by exercise, target muscle, or substitution."
        >
          <div className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
            <div>
              <label htmlFor="library-search" className="mb-1 block text-sm text-gray-300">
                Search
              </label>
              <input
                id="library-search"
                name="library-search"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Bench, quads, cable..."
              />
            </div>

            <div>
              <label htmlFor="muscle-filter" className="mb-1 block text-sm text-gray-300">
                Muscle Group
              </label>
              <select
                id="muscle-filter"
                name="muscle-filter"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={muscleFilter}
                onChange={(event) => setMuscleFilter(event.target.value)}
              >
                <option value={allMuscles}>All</option>
                {muscleGroups.map((muscleGroup) => (
                  <option key={muscleGroup} value={muscleGroup}>
                    {muscleGroup}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setMuscleFilter(allMuscles);
              }}
              className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </CollapsibleSection>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {filteredExercises.map((libraryExercise) => (
            <article
              key={libraryExercise.exercise}
              className="rounded-lg border border-gray-800 bg-gray-900 p-5 shadow-xl shadow-black/10"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-300">
                    {libraryExercise.muscleGroup}
                  </p>
                  <h2 className="text-2xl font-bold">{libraryExercise.exercise}</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {libraryExercise.equipment}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => copyExerciseName(libraryExercise.exercise)}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"
                  >
                    {copiedExercise === libraryExercise.exercise ? "Copied" : "Copy Name"}
                  </button>

                  <button
                    type="button"
                    onClick={() => addExerciseToWorkout(libraryExercise.exercise)}
                    className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
                  >
                    Add to Workout
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-800 bg-gray-950 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Target
                  </p>
                  <p className="mt-1 text-sm text-gray-300">{libraryExercise.target}</p>
                </div>

                <div className="rounded-md border border-gray-800 bg-gray-950 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Starter Range
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    {libraryExercise.defaultSets} sets x {libraryExercise.defaultReps} reps
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-gray-300">Cues</p>
                <div className="grid gap-2">
                  {libraryExercise.cues.map((cue) => (
                    <p
                      key={cue}
                      className="rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300"
                    >
                      {cue}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-gray-300">
                  Substitutions
                </p>
                <div className="flex flex-wrap gap-2">
                  {libraryExercise.substitutions.map((substitution) => (
                    <span
                      key={substitution}
                      className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gray-200"
                    >
                      {substitution}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="mt-8">
            <EmptyState
              title="No exercises match your search"
              description="Try a different exercise name, muscle group, target, or substitution."
            />
          </div>
        )}

        <div className="mt-8 rounded-lg border border-blue-900 bg-blue-950/30 p-5">
          <h2 className="text-xl font-semibold">Using This In Workouts</h2>
          <p className="mt-2 text-sm text-blue-100/80">
            The Add Workout page already uses this same library for exercise
            selection and substitutions.
          </p>
          <Link
            href="/add-workout"
            className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
          >
            Build Workout
          </Link>
        </div>
      </section>
    </main>
  );
}
