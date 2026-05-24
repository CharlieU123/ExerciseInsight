import { supabase } from "./supabaseClient";
import type { ExerciseLibraryItem } from "./fitnessData";

const customExercisesStorageKey = "customExercises";

type CustomExerciseRow = {
  id: string;
  exercise: string;
  muscle_group: string;
  equipment: string;
  target: string;
  default_sets: string;
  default_reps: string;
  cues: string[];
  substitutions: string[];
};

function mapCustomExerciseFromSupabase(
  row: CustomExerciseRow
): ExerciseLibraryItem {
  return {
    exercise: row.exercise,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    target: row.target,
    defaultSets: row.default_sets,
    defaultReps: row.default_reps,
    cues: row.cues,
    substitutions: row.substitutions,
  };
}

function normalizeCustomExercise(exercise: ExerciseLibraryItem) {
  return {
    exercise: exercise.exercise.trim(),
    muscleGroup: exercise.muscleGroup.trim(),
    equipment: exercise.equipment.trim(),
    target: exercise.target.trim(),
    defaultSets: exercise.defaultSets.trim(),
    defaultReps: exercise.defaultReps.trim(),
    cues: exercise.cues.map((cue) => cue.trim()).filter(Boolean),
    substitutions: exercise.substitutions
      .map((substitution) => substitution.trim())
      .filter(Boolean),
  };
}

export function loadCustomExercisesFromDevice() {
  const savedExercises = localStorage.getItem(customExercisesStorageKey);

  if (!savedExercises) {
    return [];
  }

  try {
    return JSON.parse(savedExercises) as ExerciseLibraryItem[];
  } catch {
    return [];
  }
}

export function saveCustomExercisesToDevice(exercises: ExerciseLibraryItem[]) {
  localStorage.setItem(customExercisesStorageKey, JSON.stringify(exercises));
}

export async function loadCustomExercisesFromSupabase() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("custom_exercises")
    .select(
      "id, exercise, muscle_group, equipment, target, default_sets, default_reps, cues, substitutions"
    )
    .eq("user_id", userId)
    .order("exercise", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load custom exercises.");
  }

  return (data as CustomExerciseRow[]).map(mapCustomExerciseFromSupabase);
}

export async function saveCustomExerciseToSupabase(
  exercise: ExerciseLibraryItem
) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("You must be logged in to save custom exercises.");
  }

  const normalizedExercise = normalizeCustomExercise(exercise);
  const { data, error } = await supabase
    .from("custom_exercises")
    .insert({
      user_id: userId,
      exercise: normalizedExercise.exercise,
      muscle_group: normalizedExercise.muscleGroup,
      equipment: normalizedExercise.equipment,
      target: normalizedExercise.target,
      default_sets: normalizedExercise.defaultSets,
      default_reps: normalizedExercise.defaultReps,
      cues: normalizedExercise.cues,
      substitutions: normalizedExercise.substitutions,
    })
    .select(
      "id, exercise, muscle_group, equipment, target, default_sets, default_reps, cues, substitutions"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save custom exercise.");
  }

  return mapCustomExerciseFromSupabase(data as CustomExerciseRow);
}
