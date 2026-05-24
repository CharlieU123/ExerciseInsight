import { supabase } from "./supabaseClient";
import type { FitnessGoal, ProgramExercise, TrainingProgram } from "./fitnessData";

type SupabaseGoalRow = {
  id: string;
  goal_type: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  status: string;
};

type SupabaseProgramExerciseRow = {
  id: string;
  exercise: string;
  muscle_group: string;
  sets: string;
  reps: string;
  notes: string;
};

type SupabaseProgramRow = {
  id: string;
  name: string;
  split_type: string;
  days_per_week: string;
  notes: string;
  program_exercises: SupabaseProgramExerciseRow[];
};

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? "";
}

function mapGoalFromSupabase(row: SupabaseGoalRow): FitnessGoal {
  return {
    id: row.id,
    goalType: row.goal_type,
    title: row.title,
    target: row.target,
    current: row.current,
    deadline: row.deadline,
    status: row.status,
  };
}

function mapProgramExerciseFromSupabase(
  row: SupabaseProgramExerciseRow
): ProgramExercise {
  return {
    id: row.id,
    exercise: row.exercise,
    muscleGroup: row.muscle_group,
    sets: row.sets,
    reps: row.reps,
    notes: row.notes,
  };
}

function mapProgramFromSupabase(row: SupabaseProgramRow): TrainingProgram {
  return {
    id: row.id,
    name: row.name,
    splitType: row.split_type,
    daysPerWeek: row.days_per_week,
    notes: row.notes,
    exercises: row.program_exercises.map(mapProgramExerciseFromSupabase),
  };
}

export async function loadGoalsFromSupabase() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("fitness_goals")
    .select("id, goal_type, title, target, current, deadline, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load goals.");
  }

  return (data as SupabaseGoalRow[]).map(mapGoalFromSupabase);
}

export async function saveGoalToSupabase(goal: FitnessGoal) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to save goals.");
  }

  const { data, error } = await supabase
    .from("fitness_goals")
    .insert({
      user_id: userId,
      goal_type: goal.goalType,
      title: goal.title,
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline,
      status: goal.status,
    })
    .select("id, goal_type, title, target, current, deadline, status")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save goal.");
  }

  return mapGoalFromSupabase(data as SupabaseGoalRow);
}

export async function updateGoalInSupabase(goal: FitnessGoal) {
  const { error } = await supabase
    .from("fitness_goals")
    .update({
      goal_type: goal.goalType,
      title: goal.title,
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline,
      status: goal.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(goal.id));

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteGoalFromSupabase(goalId: string | number) {
  const { error } = await supabase
    .from("fitness_goals")
    .delete()
    .eq("id", String(goalId));

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadProgramsFromSupabase() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("training_programs")
    .select(
      "id, name, split_type, days_per_week, notes, program_exercises(id, exercise, muscle_group, sets, reps, notes)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load programs.");
  }

  return (data as SupabaseProgramRow[]).map(mapProgramFromSupabase);
}

export async function saveProgramToSupabase(program: TrainingProgram) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to save programs.");
  }

  const { data: savedProgram, error: programError } = await supabase
    .from("training_programs")
    .insert({
      user_id: userId,
      name: program.name,
      split_type: program.splitType,
      days_per_week: program.daysPerWeek,
      notes: program.notes,
    })
    .select("id, name, split_type, days_per_week, notes")
    .single();

  if (programError || !savedProgram) {
    throw new Error(programError?.message ?? "Could not save program.");
  }

  const exerciseRows = program.exercises.map((programExercise, index) => ({
    program_id: savedProgram.id,
    user_id: userId,
    exercise_order: index + 1,
    exercise: programExercise.exercise,
    muscle_group: programExercise.muscleGroup,
    sets: programExercise.sets,
    reps: programExercise.reps,
    notes: programExercise.notes,
  }));

  const { data: savedExercises, error: exercisesError } = await supabase
    .from("program_exercises")
    .insert(exerciseRows)
    .select("id, exercise, muscle_group, sets, reps, notes");

  if (exercisesError || !savedExercises) {
    throw new Error(exercisesError?.message ?? "Could not save program exercises.");
  }

  return mapProgramFromSupabase({
    ...(savedProgram as Omit<SupabaseProgramRow, "program_exercises">),
    program_exercises: savedExercises as SupabaseProgramExerciseRow[],
  });
}

export async function updateProgramInSupabase(program: TrainingProgram) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to update programs.");
  }

  const { data: savedProgram, error: programError } = await supabase
    .from("training_programs")
    .update({
      name: program.name,
      split_type: program.splitType,
      days_per_week: program.daysPerWeek,
      notes: program.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(program.id))
    .select("id, name, split_type, days_per_week, notes")
    .single();

  if (programError || !savedProgram) {
    throw new Error(programError?.message ?? "Could not update program.");
  }

  const { error: deleteExercisesError } = await supabase
    .from("program_exercises")
    .delete()
    .eq("program_id", String(program.id));

  if (deleteExercisesError) {
    throw new Error(deleteExercisesError.message);
  }

  const exerciseRows = program.exercises.map((programExercise, index) => ({
    program_id: savedProgram.id,
    user_id: userId,
    exercise_order: index + 1,
    exercise: programExercise.exercise,
    muscle_group: programExercise.muscleGroup,
    sets: programExercise.sets,
    reps: programExercise.reps,
    notes: programExercise.notes,
  }));

  const { data: savedExercises, error: exercisesError } = await supabase
    .from("program_exercises")
    .insert(exerciseRows)
    .select("id, exercise, muscle_group, sets, reps, notes");

  if (exercisesError || !savedExercises) {
    throw new Error(exercisesError?.message ?? "Could not update program exercises.");
  }

  return mapProgramFromSupabase({
    ...(savedProgram as Omit<SupabaseProgramRow, "program_exercises">),
    program_exercises: savedExercises as SupabaseProgramExerciseRow[],
  });
}

export async function deleteProgramFromSupabase(programId: string | number) {
  const { error } = await supabase
    .from("training_programs")
    .delete()
    .eq("id", String(programId));

  if (error) {
    throw new Error(error.message);
  }
}
