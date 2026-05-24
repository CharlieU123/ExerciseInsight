"use client";

import { useEffect, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { EmptyState } from "../components/EmptyState";
import {
  buildSetEntries,
  loadWorkouts,
  muscleGroups,
  saveWorkouts,
  summarizeExerciseSets,
  type AppId,
  type ExerciseEntry,
  type SetEntry,
  type Workout,
} from "../lib/fitnessData";
import {
  addExerciseToSupabase,
  deleteExerciseFromSupabase,
  deleteWorkoutFromSupabase,
  getCurrentUserId,
  loadWorkoutsFromSupabase,
  updateExerciseInSupabase,
  updateWorkoutSessionInSupabase,
} from "../lib/supabaseWorkouts";

type EditingExercise = {
  workoutId: AppId;
  exerciseId: AppId | null;
} | null;

function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInputDateFromISO(dateISO: string) {
  if (!dateISO) {
    return getTodayInputDate();
  }

  return new Date(dateISO).toISOString().slice(0, 10);
}

function formatWorkoutDate(dateValue: string) {
  const date = new Date(dateValue + "T12:00:00");

  return date.toLocaleDateString();
}

export default function HistoryPage() {
  const [exercise, setExercise] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");
  const [pump, setPump] = useState("0");
  const [soreness, setSoreness] = useState("0");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [setEntries, setSetEntries] = useState<SetEntry[]>([]);
  const [didPartials, setDidPartials] = useState(false);
  const [exerciseError, setExerciseError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [feelingFilter, setFeelingFilter] = useState("All");
  const [sessionFeeling, setSessionFeeling] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionDate, setSessionDate] = useState(getTodayInputDate());
  const [editingSessionId, setEditingSessionId] = useState<AppId | null>(null);
  const [editingExercise, setEditingExercise] = useState<EditingExercise>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [userId, setUserId] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);

  useEffect(() => {
    async function loadSavedWorkouts() {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);

      if (currentUserId) {
        try {
          setWorkouts(await loadWorkoutsFromSupabase());
          setHistoryMessage("Showing workouts from Supabase.");
        } catch {
          setWorkouts(loadWorkouts());
          setHistoryMessage("Could not load Supabase workouts. Showing this device.");
        }
      } else {
        setWorkouts(loadWorkouts());
        setHistoryMessage("Log in to view workouts saved to Supabase.");
      }

      setHasLoadedSavedData(true);
    }

    loadSavedWorkouts();
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedData || userId) {
      return;
    }

    saveWorkouts(workouts);
  }, [hasLoadedSavedData, userId, workouts]);

  function resetExerciseForm() {
    setExercise("");
    setMuscleGroup("Chest");
    setWeight("");
    setReps("");
    setRir("");
    setPump("0");
    setSoreness("0");
    setExerciseNotes("");
    setSetEntries([]);
    setDidPartials(false);
    setExerciseError("");
    setEditingExercise(null);
  }

  function resetSessionForm() {
    setSessionFeeling("");
    setSessionNotes("");
    setSessionDate(getTodayInputDate());
    setEditingSessionId(null);
  }

  function startEditingSession(workout: Workout) {
    setEditingSessionId(workout.id);
    setSessionFeeling(workout.feeling ?? "");
    setSessionNotes(workout.notes ?? "");
    setSessionDate(getInputDateFromISO(workout.dateISO));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveSessionChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingSessionId) {
      return;
    }

    const selectedDate = new Date(sessionDate + "T12:00:00");
    const updatedWorkouts = workouts.map((workout) => {
      if (workout.id !== editingSessionId) {
        return workout;
      }

      return {
        ...workout,
        date: formatWorkoutDate(sessionDate),
        dateISO: selectedDate.toISOString(),
        feeling: sessionFeeling,
        notes: sessionNotes,
      };
    });

    if (userId) {
      try {
        await updateWorkoutSessionInSupabase(
          String(editingSessionId),
          formatWorkoutDate(sessionDate),
          selectedDate.toISOString(),
          sessionFeeling,
          sessionNotes
        );
        setHistoryMessage("Workout session updated in Supabase.");
      } catch {
        setHistoryMessage("Could not update workout session in Supabase.");
        return;
      }
    }

    setWorkouts(updatedWorkouts);
    resetSessionForm();
  }

  function startAddingExercise(workoutId: AppId) {
    resetExerciseForm();
    setSetEntries(buildSetEntries("3", "0", "10", "2"));
    setEditingExercise({
      workoutId,
      exerciseId: null,
    });
    setExerciseError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditingExercise(workoutId: AppId, exerciseEntry: ExerciseEntry) {
    setEditingExercise({
      workoutId,
      exerciseId: exerciseEntry.id,
    });
    setExercise(exerciseEntry.exercise ?? "");
    setMuscleGroup(exerciseEntry.muscleGroup ?? "Other");
    setWeight(exerciseEntry.weight ?? "");
    setReps(exerciseEntry.reps ?? "");
    setRir(exerciseEntry.rir ?? "");
    setPump(exerciseEntry.pump ?? "0");
    setSoreness(exerciseEntry.soreness ?? "0");
    setExerciseNotes(exerciseEntry.notes ?? "");
    setSetEntries(exerciseEntry.setEntries ?? []);
    setDidPartials(
      exerciseEntry.setEntries?.some((setEntry) => setEntry.didPartials) ??
        exerciseEntry.didPartials ??
        false
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateEditedSet(
    setId: AppId,
    field: keyof Pick<SetEntry, "weight" | "reps" | "rir" | "didPartials">,
    value: string | boolean
  ) {
    const updatedSetEntries = setEntries.map((setEntry) =>
      setEntry.id === setId
        ? {
            ...setEntry,
            [field]: value,
          }
        : setEntry
    );

    setSetEntries(updatedSetEntries);
    setDidPartials(updatedSetEntries.some((setEntry) => setEntry.didPartials));
  }

  function updateAllEditedSetPartials(checked: boolean) {
    setDidPartials(checked);
    setSetEntries(
      setEntries.map((setEntry) => ({
        ...setEntry,
        didPartials: checked,
      }))
    );
  }

  function addEditedSet() {
    const lastSet = setEntries[setEntries.length - 1];

    setSetEntries([
      ...setEntries,
      {
        id: Date.now(),
        setNumber: setEntries.length + 1,
        weight: lastSet?.weight ?? weight,
        reps: lastSet?.reps ?? reps,
        rir: lastSet?.rir ?? rir,
        didPartials: lastSet?.didPartials ?? false,
      },
    ]);
  }

  function removeEditedSet(setId: AppId) {
    if (setEntries.length <= 1) {
      setExerciseError("An exercise must have at least 1 set.");
      return;
    }

    setSetEntries(
      setEntries
        .filter((setEntry) => setEntry.id !== setId)
        .map((setEntry, index) => ({
          ...setEntry,
          setNumber: index + 1,
        }))
    );
  }

  async function saveExerciseChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingExercise) {
      return;
    }

    const invalidSet = setEntries.some((setEntry) => {
      const setWeight = Number(setEntry.weight);
      const setReps = Number(setEntry.reps);
      const setRir = Number(setEntry.rir);

      return setWeight < 0 || setReps < 1 || setRir < 0 || setRir > 10;
    });

    if (setEntries.length < 1) {
      setExerciseError("An exercise must have at least 1 set.");
      return;
    }

    if (invalidSet) {
      setExerciseError("Each set needs weight 0 or higher, reps 1 or higher, and RIR 0-10.");
      return;
    }

    setExerciseError("");

    const savedExercise: ExerciseEntry = {
      id: editingExercise.exerciseId ?? Date.now(),
      exercise,
      muscleGroup,
      setEntries,
      sets: String(setEntries.length),
      weight: setEntries[0]?.weight ?? "",
      reps: setEntries[0]?.reps ?? "",
      rir: setEntries[0]?.rir ?? "",
      pump,
      soreness,
      didPartials: setEntries.some((setEntry) => setEntry.didPartials),
      notes: exerciseNotes,
    };

    if (!editingExercise.exerciseId) {
      let exerciseToAdd = savedExercise;

      if (userId) {
        try {
          exerciseToAdd = await addExerciseToSupabase(
            String(editingExercise.workoutId),
            savedExercise
          );
          setHistoryMessage("Exercise added to saved workout in Supabase.");
        } catch {
          setHistoryMessage("Could not add exercise to Supabase.");
          return;
        }
      }

      setWorkouts(
        workouts.map((workout) =>
          workout.id === editingExercise.workoutId
            ? {
                ...workout,
                exercises: [...workout.exercises, exerciseToAdd],
              }
            : workout
        )
      );
      resetExerciseForm();
      return;
    }

    let updatedExercise: ExerciseEntry | null = null;

    const updatedWorkouts = workouts.map((workout) => {
      if (workout.id !== editingExercise.workoutId) {
        return workout;
      }

      return {
        ...workout,
        exercises: workout.exercises.map((exerciseEntry) => {
          if (exerciseEntry.id !== editingExercise.exerciseId) {
            return exerciseEntry;
          }

          updatedExercise = {
            ...exerciseEntry,
            ...savedExercise,
            id: exerciseEntry.id,
          };

          return updatedExercise;
        }),
      };
    });

    if (userId && updatedExercise) {
      try {
        await updateExerciseInSupabase(updatedExercise);
        setHistoryMessage("Exercise updated in Supabase.");
      } catch {
        setHistoryMessage("Could not update exercise in Supabase.");
        return;
      }
    }

    setWorkouts(updatedWorkouts);
    resetExerciseForm();
  }

  async function deleteWorkout(id: AppId) {
    const confirmed = window.confirm(
      "Delete this entire workout session? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    if (userId) {
      try {
        await deleteWorkoutFromSupabase(String(id));
        setHistoryMessage("Workout deleted from Supabase.");
      } catch {
        setHistoryMessage("Could not delete workout from Supabase.");
        return;
      }
    }

    const updatedWorkouts = workouts.filter((workout) => workout.id !== id);
    setWorkouts(updatedWorkouts);

    if (editingExercise?.workoutId === id) {
      resetExerciseForm();
    }

    if (editingSessionId === id) {
      resetSessionForm();
    }
  }

  async function deleteExercise(workoutId: AppId, exerciseId: AppId) {
    const workout = workouts.find((workoutEntry) => workoutEntry.id === workoutId);
    const isLastExercise = workout?.exercises.length === 1;
    const confirmed = window.confirm(
      isLastExercise
        ? "Delete this exercise? It is the last exercise, so the whole workout session will be removed."
        : "Delete this exercise from the workout?"
    );

    if (!confirmed) {
      return;
    }

    if (userId) {
      try {
        if (isLastExercise) {
          await deleteWorkoutFromSupabase(String(workoutId));
        } else {
          await deleteExerciseFromSupabase(String(exerciseId));
        }
        setHistoryMessage("Exercise deleted from Supabase.");
      } catch {
        setHistoryMessage("Could not delete exercise from Supabase.");
        return;
      }
    }

    const updatedWorkouts = workouts
      .map((workout) => {
        if (workout.id !== workoutId) {
          return workout;
        }

        return {
          ...workout,
          exercises: workout.exercises.filter(
            (exerciseEntry) => exerciseEntry.id !== exerciseId
          ),
        };
      })
      .filter((workout) => workout.exercises.length > 0);

    setWorkouts(updatedWorkouts);

    if (
      editingExercise?.workoutId === workoutId &&
      editingExercise.exerciseId === exerciseId
    ) {
      resetExerciseForm();
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setFeelingFilter("All");
  }

  const hasActiveFilters = searchTerm !== "" || feelingFilter !== "All";

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesFeeling =
      feelingFilter === "All" || workout.feeling === feelingFilter;

    const matchesSearch = workout.exercises.some((exerciseEntry) =>
      exerciseEntry.exercise.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return matchesFeeling && matchesSearch;
  });

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            History
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Workout History</h1>
          <p className="text-gray-300">
            Review previous workout sessions, edit exercise details, or delete
            old sessions.
          </p>
          {historyMessage && (
            <p className="mt-3 rounded-md border border-white/10 bg-gray-950 p-3 text-sm text-gray-300">
              {historyMessage}
            </p>
          )}
        </div>

        {editingSessionId && (
          <form
            onSubmit={saveSessionChanges}
            className="mb-8 space-y-4 rounded-lg border border-blue-800 bg-gray-900 p-6"
          >
            {exerciseError && (
              <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-200">
                {exerciseError}
              </p>
            )}
            <div>
              <h2 className="text-2xl font-semibold">Edit Session</h2>
              <p className="mt-1 text-sm text-gray-400">
                Update the workout date, feeling, and notes.
              </p>
            </div>

            <div>
              <label htmlFor="session-date" className="mb-1 block text-sm text-gray-300">
                Workout date
              </label>
              <input
                id="session-date"
                name="session-date"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="date"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="session-feeling" className="mb-1 block text-sm text-gray-300">
                Workout feeling
              </label>
              <select
                id="session-feeling"
                name="session-feeling"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={sessionFeeling}
                onChange={(event) => setSessionFeeling(event.target.value)}
                required
              >
                <option value="">Choose one</option>
                <option value="Great">Great</option>
                <option value="Good">Good</option>
                <option value="Okay">Okay</option>
                <option value="Tired">Tired</option>
                <option value="Weak">Weak</option>
              </select>
            </div>

            <div>
              <label htmlFor="session-notes" className="mb-1 block text-sm text-gray-300">
                Workout notes
              </label>
              <textarea
                id="session-notes"
                name="session-notes"
                className="min-h-28 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                placeholder="Add or update notes for this workout."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
              >
                Save Session Changes
              </button>
              <button
                type="button"
                onClick={resetSessionForm}
                className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
              >
                Cancel Edit
              </button>
            </div>
          </form>
        )}

        {editingExercise && (
          <form
            onSubmit={saveExerciseChanges}
            className="mb-8 space-y-4 rounded-lg border border-blue-800 bg-gray-900 p-6"
          >
            <div>
              <h2 className="text-2xl font-semibold">Edit Exercise</h2>
              <p className="mt-1 text-sm text-gray-400">
                {editingExercise.exerciseId
                  ? "Update the fields below, then save your changes."
                  : "Add another exercise to this saved workout."}
              </p>
            </div>

            <div>
              <label htmlFor="edit-exercise" className="mb-1 block text-sm text-gray-300">
                Exercise
              </label>
              <input
                id="edit-exercise"
                name="edit-exercise"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="text"
                value={exercise}
                onChange={(event) => setExercise(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="edit-muscle-group" className="mb-1 block text-sm text-gray-300">
                Muscle Group
              </label>
              <select
                id="edit-muscle-group"
                name="edit-muscle-group"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={muscleGroup}
                onChange={(event) => setMuscleGroup(event.target.value)}
                required
              >
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold">Sets</h3>
                <button
                  type="button"
                  onClick={addEditedSet}
                  className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                >
                  Add Set
                </button>
              </div>

              {setEntries.map((setEntry) => (
                <div
                  key={setEntry.id}
                  className="grid gap-3 rounded-md border border-gray-800 bg-gray-950 p-3 sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto]"
                >
                  <p className="self-center text-sm font-semibold text-gray-300">
                    Set {setEntry.setNumber}
                  </p>

                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      Weight
                    </label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                      type="number"
                      min="0"
                      step="0.5"
                      value={setEntry.weight}
                      onChange={(event) =>
                        updateEditedSet(setEntry.id, "weight", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      Reps
                    </label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                      type="number"
                      min="1"
                      step="1"
                      value={setEntry.reps}
                      onChange={(event) =>
                        updateEditedSet(setEntry.id, "reps", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      RIR
                    </label>
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      value={setEntry.rir}
                      onChange={(event) =>
                        updateEditedSet(setEntry.id, "rir", event.target.value)
                      }
                    />
                  </div>

                  <label className="flex items-end gap-2 text-sm text-gray-300 sm:pb-2">
                    <input
                      type="checkbox"
                      checked={setEntry.didPartials}
                      onChange={(event) =>
                        updateEditedSet(
                          setEntry.id,
                          "didPartials",
                          event.target.checked
                        )
                      }
                    />
                    Partials
                  </label>

                  <button
                    type="button"
                    onClick={() => removeEditedSet(setEntry.id)}
                    className="self-end rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500 sm:self-center"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-pump" className="mb-1 block text-sm text-gray-300">
                  Pump
                </label>
                <select
                  id="edit-pump"
                  name="edit-pump"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={pump}
                  onChange={(event) => setPump(event.target.value)}
                >
                  <option value="0">0 - None</option>
                  <option value="1">1 - Mild</option>
                  <option value="2">2 - Good</option>
                  <option value="3">3 - Strong</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-soreness" className="mb-1 block text-sm text-gray-300">
                  Soreness
                </label>
                <select
                  id="edit-soreness"
                  name="edit-soreness"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={soreness}
                  onChange={(event) => setSoreness(event.target.value)}
                >
                  <option value="0">0 - None</option>
                  <option value="1">1 - Mild</option>
                  <option value="2">2 - Moderate</option>
                  <option value="3">3 - High</option>
                </select>
              </div>
            </div>

            <label htmlFor="edit-did-partials" className="flex items-center gap-3 text-gray-300">
              <input
                id="edit-did-partials"
                name="edit-did-partials"
                type="checkbox"
                checked={didPartials}
                onChange={(event) =>
                  updateAllEditedSetPartials(event.target.checked)
                }
              />
              Mark exercise as having partial reps
            </label>

            <div>
              <label htmlFor="edit-exercise-notes" className="mb-1 block text-sm text-gray-300">
                Exercise notes
              </label>
              <textarea
                id="edit-exercise-notes"
                name="edit-exercise-notes"
                className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={exerciseNotes}
                onChange={(event) => setExerciseNotes(event.target.value)}
                placeholder="Technique notes, machine settings, grip width..."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
              >
                {editingExercise.exerciseId
                  ? "Save Exercise Changes"
                  : "Add Exercise To Workout"}
              </button>
              <button
                type="button"
                onClick={resetExerciseForm}
                className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
              >
                Cancel Edit
              </button>
            </div>
          </form>
        )}

        <CollapsibleSection title="Previous Workouts">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] lg:w-[660px]">
              <div>
                <label htmlFor="history-search" className="mb-1 block text-sm text-gray-300">
                  Search Exercise
                </label>
                <input
                  id="history-search"
                  name="history-search"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Bench press"
                />
              </div>

              <div>
                <label htmlFor="history-feeling" className="mb-1 block text-sm text-gray-300">
                  Feeling
                </label>
                <select
                  id="history-feeling"
                  name="history-feeling"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={feelingFilter}
                  onChange={(event) => setFeelingFilter(event.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Great">Great</option>
                  <option value="Good">Good</option>
                  <option value="Okay">Okay</option>
                  <option value="Tired">Tired</option>
                  <option value="Weak">Weak</option>
                </select>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="self-end rounded-md bg-gray-800 px-4 py-3 font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-950 disabled:text-gray-500"
              >
                Clear
              </button>
            </div>
          </div>

          {workouts.length === 0 ? (
            <EmptyState
              title="No workouts saved yet"
              description="Saved workout sessions will appear here after you build and save one."
              actionHref="/add-workout"
              actionLabel="Add Workout"
            />
          ) : filteredWorkouts.length === 0 ? (
            <EmptyState
              title="No workouts match your filters"
              description="Try clearing search or changing the feeling filter to see more workout sessions."
            />
          ) : (
            <div className="space-y-4">
              {filteredWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                >
                  <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold">
                        Workout Session
                      </h3>
                      <p className="text-sm text-gray-400">
                        {workout.date} · Feeling: {workout.feeling}
                      </p>
                      {workout.notes && (
                        <p className="mt-2 max-w-2xl text-sm text-gray-300">
                          Notes: {workout.notes}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                      <button
                        type="button"
                        onClick={() => startEditingSession(workout)}
                        className="h-fit rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"
                      >
                        Edit Session
                      </button>
                      <button
                        type="button"
                        onClick={() => startAddingExercise(workout.id)}
                        className="h-fit rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                      >
                        Add Exercise
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWorkout(workout.id)}
                        className="h-fit rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {workout.exercises.map((exerciseEntry) => (
                      <div
                        key={exerciseEntry.id}
                        className="rounded-md border border-gray-800 bg-gray-900 p-3"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold">
                              {exerciseEntry.exercise}
                            </h4>
                            <p className="text-sm font-semibold text-blue-300">
                              {exerciseEntry.muscleGroup}
                            </p>
                            <p className="text-sm text-gray-300">
                              {summarizeExerciseSets(exerciseEntry)}
                            </p>
                            <p className="text-sm text-gray-400">
                              Pump: {exerciseEntry.pump}/3 · Soreness:{" "}
                              {exerciseEntry.soreness}/3 · Partials:{" "}
                              {exerciseEntry.didPartials ? "Yes" : "No"}
                            </p>
                            {exerciseEntry.notes && (
                              <p className="mt-2 text-sm text-gray-300">
                                Notes: {exerciseEntry.notes}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                            <button
                              type="button"
                              onClick={() =>
                                startEditingExercise(workout.id, exerciseEntry)
                              }
                              className="h-fit rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteExercise(workout.id, exerciseEntry.id)
                              }
                              className="h-fit rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </section>
    </main>
  );
}
