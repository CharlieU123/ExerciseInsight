export type AppId = number | string;

export type SetEntry = {
  id: AppId;
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
  didPartials: boolean;
};

export type ExerciseEntry = {
  id: AppId;
  exercise: string;
  muscleGroup: string;
  setEntries: SetEntry[];
  sets: string;
  weight: string;
  reps: string;
  rir: string;
  pump: string;
  soreness: string;
  didPartials: boolean;
  notes: string;
};

export type Workout = {
  id: AppId;
  date: string;
  dateISO: string;
  feeling: string;
  notes: string;
  exercises: ExerciseEntry[];
};

export type ExerciseRecommendation = {
  action: string;
  detail: string;
  tone: "increase" | "maintain" | "reduce" | "recover";
};

export type DeloadRecommendation = {
  action: string;
  detail: string;
  tone: "normal" | "watch" | "deload";
};

export type SmartCoachInsight = {
  recoveryScore: number;
  recoveryLabel: string;
  nextMove: string;
  trainingFocus: string;
  programNote: string;
  confidence: "Low" | "Medium" | "High";
};

export type ExerciseLibraryItem = {
  exercise: string;
  muscleGroup: string;
  equipment: string;
  target: string;
  defaultSets: string;
  defaultReps: string;
  cues: string[];
  substitutions: string[];
};

export type Profile = {
  name: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
};

export type ProgramExercise = {
  id: AppId;
  dayId?: AppId;
  exercise: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  notes: string;
};

export type ProgramDay = {
  id: AppId;
  name: string;
  isRestDay: boolean;
  notes: string;
  exercises: ProgramExercise[];
};

export type TrainingProgram = {
  id: AppId;
  name: string;
  splitType: string;
  daysPerWeek: string;
  notes: string;
  days: ProgramDay[];
  exercises: ProgramExercise[];
};

export type SharedTrainingProgram = TrainingProgram & {
  shareId: string;
  ownerId: string;
  sharedWithEmail: string;
  permission: "view" | "edit";
};

export type FitnessGoal = {
  id: AppId;
  goalType: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  status: string;
};
