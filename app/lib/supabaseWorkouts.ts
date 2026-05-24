import { supabase } from "./supabaseClient";
import type { ExerciseEntry, SetEntry, Workout } from "./fitnessData";

type SupabaseSetRow = {
  id: string;
  set_number: number;
  weight: string;
  reps: string;
  rir: string;
  did_partials: boolean;
};

type SupabaseExerciseRow = {
  id: string;
  exercise: string;
  muscle_group: string;
  sets: string;
  weight: string;
  reps: string;
  rir: string;
  pump: string;
  soreness: string;
  did_partials: boolean;
  notes?: string | null;
  exercise_sets?: SupabaseSetRow[];
};

type SupabaseWorkoutRow = {
  id: string;
  date: string;
  date_iso: string;
  feeling: string;
  notes: string;
  exercises: SupabaseExerciseRow[];
};

function mapExerciseFromSupabase(row: SupabaseExerciseRow): ExerciseEntry {
  const setEntries =
    row.exercise_sets && row.exercise_sets.length > 0
      ? row.exercise_sets
          .sort((firstSet, secondSet) => firstSet.set_number - secondSet.set_number)
          .map((setRow) => ({
            id: setRow.id,
            setNumber: setRow.set_number,
            weight: setRow.weight,
            reps: setRow.reps,
            rir: setRow.rir,
            didPartials: setRow.did_partials,
          }))
      : Array.from({ length: Math.max(Number(row.sets), 1) }, (_item, index) => ({
          id: row.id + "-set-" + index,
          setNumber: index + 1,
          weight: row.weight,
          reps: row.reps,
          rir: row.rir,
          didPartials: row.did_partials,
        }));

  return {
    id: row.id,
    exercise: row.exercise,
    muscleGroup: row.muscle_group,
    setEntries,
    sets: row.sets,
    weight: row.weight,
    reps: row.reps,
    rir: row.rir,
    pump: row.pump,
    soreness: row.soreness,
    didPartials: row.did_partials,
    notes: row.notes ?? "",
  };
}

function mapWorkoutFromSupabase(row: SupabaseWorkoutRow): Workout {
  return {
    id: row.id,
    date: row.date,
    dateISO: row.date_iso,
    feeling: row.feeling,
    notes: row.notes,
    exercises: row.exercises.map(mapExerciseFromSupabase),
  };
}

function mapExerciseToSupabase(
  exerciseEntry: ExerciseEntry,
  workoutId: string,
  userId: string,
  includeNotes = true
) {
  const exerciseRow = {
    workout_id: workoutId,
    user_id: userId,
    exercise: exerciseEntry.exercise,
    muscle_group: exerciseEntry.muscleGroup,
    sets: String(exerciseEntry.setEntries.length),
    weight: exerciseEntry.setEntries[0]?.weight ?? exerciseEntry.weight,
    reps: exerciseEntry.setEntries[0]?.reps ?? exerciseEntry.reps,
    rir: exerciseEntry.setEntries[0]?.rir ?? exerciseEntry.rir,
    pump: exerciseEntry.pump,
    soreness: exerciseEntry.soreness,
    did_partials: exerciseEntry.didPartials,
  };

  if (!includeNotes) {
    return exerciseRow;
  }

  return {
    ...exerciseRow,
    notes: exerciseEntry.notes,
  };
}

function isMissingExerciseNotesColumn(errorMessage = "") {
  return errorMessage.includes("notes") && errorMessage.includes("exercises");
}

const exerciseSelectWithNotes =
  "id, exercise, muscle_group, sets, weight, reps, rir, pump, soreness, did_partials, notes";
const exerciseSelectWithoutNotes =
  "id, exercise, muscle_group, sets, weight, reps, rir, pump, soreness, did_partials";
const workoutSelectWithExerciseNotes =
  "id, date, date_iso, feeling, notes, exercises(id, exercise, muscle_group, sets, weight, reps, rir, pump, soreness, did_partials, notes, exercise_sets(id, set_number, weight, reps, rir, did_partials))";
const workoutSelectWithoutExerciseNotes =
  "id, date, date_iso, feeling, notes, exercises(id, exercise, muscle_group, sets, weight, reps, rir, pump, soreness, did_partials, exercise_sets(id, set_number, weight, reps, rir, did_partials))";

function mapSetToSupabase(
  setEntry: SetEntry,
  exerciseId: string,
  userId: string
) {
  return {
    exercise_id: exerciseId,
    user_id: userId,
    set_number: setEntry.setNumber,
    weight: setEntry.weight,
    reps: setEntry.reps,
    rir: setEntry.rir,
    did_partials: setEntry.didPartials,
  };
}

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? "";
}

export async function loadWorkoutsFromSupabase() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const query = supabase
    .from("workouts")
    .select(workoutSelectWithExerciseNotes)
    .eq("user_id", userId)
    .order("date_iso", { ascending: false });

  const response = await query;
  let data = response.data as SupabaseWorkoutRow[] | null;
  let error = response.error;

  if (error && isMissingExerciseNotesColumn(error.message)) {
    const fallbackResponse = await supabase
      .from("workouts")
      .select(workoutSelectWithoutExerciseNotes)
      .eq("user_id", userId)
      .order("date_iso", { ascending: false });

    data = fallbackResponse.data as SupabaseWorkoutRow[] | null;
    error = fallbackResponse.error;
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load workouts.");
  }

  return (data as SupabaseWorkoutRow[]).map(mapWorkoutFromSupabase);
}

export async function saveWorkoutToSupabase(workout: Workout) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to save workouts to Supabase.");
  }

  const { data: savedWorkout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      date: workout.date,
      date_iso: workout.dateISO,
      feeling: workout.feeling,
      notes: workout.notes,
    })
    .select("id, date, date_iso, feeling, notes")
    .single();

  if (workoutError || !savedWorkout) {
    throw new Error(workoutError?.message ?? "Could not save workout.");
  }

  const exerciseRows = workout.exercises.map((exerciseEntry) =>
    mapExerciseToSupabase(exerciseEntry, savedWorkout.id, userId)
  );

  const savedExercisesResponse = await supabase
    .from("exercises")
    .insert(exerciseRows)
    .select(exerciseSelectWithNotes);
  let savedExercises = savedExercisesResponse.data as SupabaseExerciseRow[] | null;
  let exercisesError = savedExercisesResponse.error;

  if (exercisesError && isMissingExerciseNotesColumn(exercisesError.message)) {
    const fallbackExerciseRows = workout.exercises.map((exerciseEntry) =>
      mapExerciseToSupabase(exerciseEntry, savedWorkout.id, userId, false)
    );
    const fallbackResponse = await supabase
      .from("exercises")
      .insert(fallbackExerciseRows)
      .select(exerciseSelectWithoutNotes);

    savedExercises = fallbackResponse.data as SupabaseExerciseRow[] | null;
    exercisesError = fallbackResponse.error;
  }

  if (exercisesError || !savedExercises) {
    throw new Error(exercisesError?.message ?? "Could not save exercises.");
  }

  const setRows = savedExercises.flatMap((savedExercise, index) =>
    workout.exercises[index].setEntries.map((setEntry) =>
      mapSetToSupabase(setEntry, savedExercise.id, userId)
    )
  );

  const { data: savedSets, error: setsError } = await supabase
    .from("exercise_sets")
    .insert(setRows)
    .select("id, exercise_id, set_number, weight, reps, rir, did_partials");

  if (setsError || !savedSets) {
    throw new Error(setsError?.message ?? "Could not save sets.");
  }

  const savedExercisesWithSets = (savedExercises as SupabaseExerciseRow[]).map(
    (savedExercise) => ({
      ...savedExercise,
      exercise_sets: (savedSets as Array<SupabaseSetRow & { exercise_id: string }>).filter(
        (setRow) => setRow.exercise_id === savedExercise.id
      ),
    })
  );

  return mapWorkoutFromSupabase({
    ...(savedWorkout as Omit<SupabaseWorkoutRow, "exercises">),
    exercises: savedExercisesWithSets,
  });
}

export async function updateWorkoutSessionInSupabase(
  workoutId: string,
  date: string,
  dateISO: string,
  feeling: string,
  notes: string
) {
  const { error } = await supabase
    .from("workouts")
    .update({
      date,
      date_iso: dateISO,
      feeling,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workoutId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function addExerciseToSupabase(
  workoutId: string,
  exerciseEntry: ExerciseEntry
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to add exercises.");
  }

  const savedExerciseResponse = await supabase
    .from("exercises")
    .insert(mapExerciseToSupabase(exerciseEntry, workoutId, userId))
    .select(exerciseSelectWithNotes)
    .single();

  let fallbackSavedExercise =
    savedExerciseResponse.data as SupabaseExerciseRow | null;
  let fallbackExerciseError = savedExerciseResponse.error;

  if (
    savedExerciseResponse.error &&
    isMissingExerciseNotesColumn(savedExerciseResponse.error.message)
  ) {
    const fallbackResponse = await supabase
      .from("exercises")
      .insert(mapExerciseToSupabase(exerciseEntry, workoutId, userId, false))
      .select(exerciseSelectWithoutNotes)
      .single();

    fallbackSavedExercise = fallbackResponse.data as SupabaseExerciseRow | null;
    fallbackExerciseError = fallbackResponse.error;
  }

  if (fallbackExerciseError || !fallbackSavedExercise) {
    throw new Error(fallbackExerciseError?.message ?? "Could not add exercise.");
  }

  const { data: savedSets, error: setsError } = await supabase
    .from("exercise_sets")
    .insert(
      exerciseEntry.setEntries.map((setEntry) =>
        mapSetToSupabase(setEntry, fallbackSavedExercise.id, userId)
      )
    )
    .select("id, exercise_id, set_number, weight, reps, rir, did_partials");

  if (setsError || !savedSets) {
    throw new Error(setsError?.message ?? "Could not add sets.");
  }

  return mapExerciseFromSupabase({
    ...(fallbackSavedExercise as SupabaseExerciseRow),
    exercise_sets: savedSets as SupabaseSetRow[],
  });
}

export async function updateExerciseInSupabase(exerciseEntry: ExerciseEntry) {
  let { error } = await supabase
    .from("exercises")
    .update({
      exercise: exerciseEntry.exercise,
      muscle_group: exerciseEntry.muscleGroup,
      sets: String(exerciseEntry.setEntries.length),
      weight: exerciseEntry.setEntries[0]?.weight ?? exerciseEntry.weight,
      reps: exerciseEntry.setEntries[0]?.reps ?? exerciseEntry.reps,
      rir: exerciseEntry.setEntries[0]?.rir ?? exerciseEntry.rir,
      pump: exerciseEntry.pump,
      soreness: exerciseEntry.soreness,
      did_partials: exerciseEntry.didPartials,
      notes: exerciseEntry.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(exerciseEntry.id));

  if (error && isMissingExerciseNotesColumn(error.message)) {
    const fallbackResponse = await supabase
      .from("exercises")
      .update({
        exercise: exerciseEntry.exercise,
        muscle_group: exerciseEntry.muscleGroup,
        sets: String(exerciseEntry.setEntries.length),
        weight: exerciseEntry.setEntries[0]?.weight ?? exerciseEntry.weight,
        reps: exerciseEntry.setEntries[0]?.reps ?? exerciseEntry.reps,
        rir: exerciseEntry.setEntries[0]?.rir ?? exerciseEntry.rir,
        pump: exerciseEntry.pump,
        soreness: exerciseEntry.soreness,
        did_partials: exerciseEntry.didPartials,
        updated_at: new Date().toISOString(),
      })
      .eq("id", String(exerciseEntry.id));

    error = fallbackResponse.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to update sets.");
  }

  const { error: deleteSetsError } = await supabase
    .from("exercise_sets")
    .delete()
    .eq("exercise_id", String(exerciseEntry.id));

  if (deleteSetsError) {
    throw new Error(deleteSetsError.message);
  }

  const { error: insertSetsError } = await supabase
    .from("exercise_sets")
    .insert(
      exerciseEntry.setEntries.map((setEntry) =>
        mapSetToSupabase(setEntry, String(exerciseEntry.id), userId)
      )
    );

  if (insertSetsError) {
    throw new Error(insertSetsError.message);
  }
}

export async function deleteWorkoutFromSupabase(workoutId: string) {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteExerciseFromSupabase(exerciseId: string) {
  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    throw new Error(error.message);
  }
}
