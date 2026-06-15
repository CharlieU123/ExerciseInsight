import type { ExerciseEntry, Workout } from "./types";

export function buildSetEntries(
  setCount: string,
  weight: string,
  reps: string,
  rir: string
) {
  const totalSets = Math.max(Number(setCount), 1);

  return Array.from({ length: totalSets }, (_item, index) => ({
    id: Date.now() + index,
    setNumber: index + 1,
    weight,
    reps,
    rir,
    didPartials: false,
  }));
}

export function getExerciseSetEntries(exerciseEntry: ExerciseEntry) {
  if (Array.isArray(exerciseEntry.setEntries) && exerciseEntry.setEntries.length > 0) {
    return exerciseEntry.setEntries;
  }

  return buildSetEntries(
    exerciseEntry.sets || "1",
    exerciseEntry.weight || "0",
    exerciseEntry.reps || "1",
    exerciseEntry.rir || "2"
  );
}

export function getExerciseSetCount(exerciseEntry: ExerciseEntry) {
  return getExerciseSetEntries(exerciseEntry).length;
}

export function getExerciseAverageRir(exerciseEntry: ExerciseEntry) {
  const setEntries = getExerciseSetEntries(exerciseEntry);
  const totalRir = setEntries.reduce((total, setEntry) => total + Number(setEntry.rir), 0);

  return setEntries.length === 0 ? Number(exerciseEntry.rir) : totalRir / setEntries.length;
}

export function getExerciseTopWeight(exerciseEntry: ExerciseEntry) {
  return Math.max(
    ...getExerciseSetEntries(exerciseEntry).map((setEntry) => Number(setEntry.weight))
  );
}

export function summarizeExerciseSets(exerciseEntry: ExerciseEntry) {
  const setEntries = getExerciseSetEntries(exerciseEntry);
  const topWeight = Math.max(...setEntries.map((setEntry) => Number(setEntry.weight)));
  const repsSummary = setEntries.map((setEntry) => setEntry.reps).join("/");
  const averageRir = Math.round(getExerciseAverageRir(exerciseEntry) * 10) / 10;
  const partialSets = setEntries.filter((setEntry) => setEntry.didPartials).length;
  const partialSummary =
    partialSets > 0
      ? ` · ${partialSets} partial ${partialSets === 1 ? "set" : "sets"}`
      : "";

  return `${setEntries.length} sets · ${topWeight} lbs top set · reps ${repsSummary} · avg RIR ${averageRir}${partialSummary}`;
}

export function normalizeWorkouts(savedWorkouts: Workout[]) {
  return savedWorkouts
    .filter((workout) => Array.isArray(workout.exercises))
    .map((workout) => ({
      ...workout,
      id: workout.id ?? Date.now(),
      feeling: workout.feeling ?? "",
      notes: workout.notes ?? "",
      date: workout.date ?? "",
      dateISO: workout.dateISO ?? new Date().toISOString(),
      exercises: workout.exercises.map((exerciseEntry) => {
        const setEntries =
          Array.isArray(exerciseEntry.setEntries) && exerciseEntry.setEntries.length > 0
            ? exerciseEntry.setEntries.map((setEntry, index) => ({
                id: setEntry.id ?? Date.now() + index,
                setNumber: setEntry.setNumber ?? index + 1,
                weight: setEntry.weight ?? exerciseEntry.weight ?? "0",
                reps: setEntry.reps ?? exerciseEntry.reps ?? "1",
                rir: setEntry.rir ?? exerciseEntry.rir ?? "2",
                didPartials:
                  setEntry.didPartials ?? exerciseEntry.didPartials ?? false,
              }))
            : buildSetEntries(
                exerciseEntry.sets ?? "1",
                exerciseEntry.weight ?? "0",
                exerciseEntry.reps ?? "1",
                exerciseEntry.rir ?? "2"
              );

        return {
          id: exerciseEntry.id ?? Date.now(),
          exercise: exerciseEntry.exercise ?? "",
          muscleGroup: exerciseEntry.muscleGroup ?? "Other",
          setEntries,
          sets: String(setEntries.length),
          weight: setEntries[0]?.weight ?? "",
          reps: setEntries[0]?.reps ?? "",
          rir: setEntries[0]?.rir ?? "",
          pump: exerciseEntry.pump ?? "0",
          soreness: exerciseEntry.soreness ?? "0",
          didPartials: exerciseEntry.didPartials ?? false,
          notes: exerciseEntry.notes ?? "",
        };
      }),
    }));
}

export function isWorkoutThisWeek(workout: Workout) {
  const today = new Date();
  const workoutDate = new Date(workout.dateISO);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return workoutDate >= startOfWeek && workoutDate < endOfWeek;
}
