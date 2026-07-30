import type {
  ExerciseEntry,
  FitnessGoal,
  Profile,
  ProgramDay,
  TrainingProgram,
  Workout,
} from "./types";

function daysAgo(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(12, 0, 0, 0);
  return date;
}

function formatDemoDate(date: Date) {
  return date.toLocaleDateString();
}

function createSet(
  exerciseId: string,
  setNumber: number,
  weight: string,
  reps: string,
  rir: string,
  didPartials = false
) {
  return {
    id: `${exerciseId}-set-${setNumber}`,
    setNumber,
    weight,
    reps,
    rir,
    didPartials,
  };
}

function createExercise({
  id,
  exercise,
  muscleGroup,
  weight,
  reps,
  rir,
  pump,
  soreness,
  notes,
}: {
  id: string;
  exercise: string;
  muscleGroup: string;
  weight: string;
  reps: string[];
  rir: string[];
  pump: string;
  soreness: string;
  notes: string;
}): ExerciseEntry {
  const setEntries = reps.map((repValue, index) =>
    createSet(id, index + 1, weight, repValue, rir[index] ?? rir[0] ?? "2")
  );

  return {
    id,
    exercise,
    muscleGroup,
    setEntries,
    sets: String(setEntries.length),
    weight,
    reps: reps[0] ?? "1",
    rir: rir[0] ?? "2",
    pump,
    soreness,
    didPartials: false,
    notes,
  };
}

function createWorkout(
  id: string,
  daysBack: number,
  feeling: string,
  notes: string,
  exercises: ExerciseEntry[]
): Workout {
  const date = daysAgo(daysBack);

  return {
    id,
    date: formatDemoDate(date),
    dateISO: date.toISOString(),
    feeling,
    notes,
    exercises,
  };
}

const pushDayExercises = [
  {
    id: "demo-program-bench",
    exercise: "Bench Press",
    muscleGroup: "Chest",
    sets: "3",
    reps: "6-8",
    notes: "Stop around 1-2 RIR unless bar speed is excellent.",
  },
  {
    id: "demo-program-incline-db",
    exercise: "Incline Dumbbell Press",
    muscleGroup: "Chest",
    sets: "3",
    reps: "8-10",
    notes: "Keep shoulder blades pinned.",
  },
  {
    id: "demo-program-shoulder-press",
    exercise: "Shoulder Press",
    muscleGroup: "Shoulders",
    sets: "3",
    reps: "8-10",
    notes: "Use controlled negatives.",
  },
  {
    id: "demo-program-pushdown",
    exercise: "Tricep Pushdown",
    muscleGroup: "Triceps",
    sets: "3",
    reps: "10-15",
    notes: "Add partials only on the final set.",
  },
];

const pullDayExercises = [
  {
    id: "demo-program-pulldown",
    exercise: "Lat Pulldown",
    muscleGroup: "Back",
    sets: "3",
    reps: "8-12",
    notes: "Drive elbows down, not back.",
  },
  {
    id: "demo-program-row",
    exercise: "Barbell Row",
    muscleGroup: "Back",
    sets: "3",
    reps: "6-8",
    notes: "Keep torso angle consistent.",
  },
  {
    id: "demo-program-curl",
    exercise: "Bicep Curl",
    muscleGroup: "Biceps",
    sets: "3",
    reps: "10-12",
    notes: "Avoid swinging.",
  },
];

const legsDayExercises = [
  {
    id: "demo-program-squat",
    exercise: "Squat",
    muscleGroup: "Quads",
    sets: "3",
    reps: "5-8",
    notes: "Repeat load if depth or bracing slips.",
  },
  {
    id: "demo-program-rdl",
    exercise: "Romanian Deadlift",
    muscleGroup: "Hamstrings",
    sets: "3",
    reps: "8-10",
    notes: "Slow eccentric and hard hamstring stretch.",
  },
  {
    id: "demo-program-calf",
    exercise: "Calf Raise",
    muscleGroup: "Calves",
    sets: "4",
    reps: "10-15",
    notes: "Pause at stretch and top.",
  },
];

function createProgramDay(
  id: string,
  name: string,
  exercises: ProgramDay["exercises"],
  notes: string
): ProgramDay {
  return {
    id,
    name,
    isRestDay: false,
    notes,
    exercises,
  };
}

export const demoProfile: Profile = {
  name: "Demo Athlete",
  gender: "Prefer not to say",
  age: "27",
  height: "5'10",
  weight: "184",
};

export const demoGoals: FitnessGoal[] = [
  {
    id: "demo-goal-bench",
    goalType: "Strength",
    title: "Bench 225 lb",
    target: "225",
    current: "207",
    deadline: "2026-10-31",
    status: "Active",
  },
  {
    id: "demo-goal-consistency",
    goalType: "Consistency",
    title: "Train 4 days per week",
    target: "4",
    current: "3",
    deadline: "2026-08-31",
    status: "Active",
  },
];

export const demoPrograms: TrainingProgram[] = [
  {
    id: "demo-program-ppl",
    name: "Demo Push/Pull/Legs",
    splitType: "Push, Pull, Legs",
    daysPerWeek: "4",
    notes: "Sample program for recruiters and first-time users.",
    days: [
      createProgramDay(
        "demo-day-push",
        "Push A",
        pushDayExercises,
        "Chest and shoulder focus."
      ),
      createProgramDay(
        "demo-day-pull",
        "Pull A",
        pullDayExercises,
        "Back thickness and biceps."
      ),
      {
        id: "demo-day-rest",
        name: "Recovery Day",
        isRestDay: true,
        notes: "Walk, mobility, and easy recovery.",
        exercises: [],
      },
      createProgramDay(
        "demo-day-legs",
        "Legs A",
        legsDayExercises,
        "Quads, hamstrings, and calves."
      ),
    ],
    exercises: [...pushDayExercises, ...pullDayExercises, ...legsDayExercises],
  },
];

export const demoWorkouts: Workout[] = [
  createWorkout("demo-workout-1", 2, "Good", "Push day moved well. Bench felt stronger.", [
    createExercise({
      id: "demo-w1-bench",
      exercise: "Bench Press",
      muscleGroup: "Chest",
      weight: "190",
      reps: ["8", "7", "6"],
      rir: ["2", "1", "0"],
      pump: "2",
      soreness: "1",
      notes: "Add 5 lb if first two sets stay at 8 reps.",
    }),
    createExercise({
      id: "demo-w1-incline",
      exercise: "Incline Dumbbell Press",
      muscleGroup: "Chest",
      weight: "70",
      reps: ["10", "9", "8"],
      rir: ["2", "1", "1"],
      pump: "3",
      soreness: "1",
      notes: "Great chest pump.",
    }),
    createExercise({
      id: "demo-w1-press",
      exercise: "Shoulder Press",
      muscleGroup: "Shoulders",
      weight: "95",
      reps: ["8", "8", "7"],
      rir: ["2", "2", "1"],
      pump: "2",
      soreness: "1",
      notes: "Keep same load next time.",
    }),
  ]),
  createWorkout("demo-workout-2", 5, "Great", "Pull day PR on rows.", [
    createExercise({
      id: "demo-w2-pulldown",
      exercise: "Lat Pulldown",
      muscleGroup: "Back",
      weight: "145",
      reps: ["11", "10", "9"],
      rir: ["2", "1", "1"],
      pump: "3",
      soreness: "1",
      notes: "Use same load until all sets hit 12.",
    }),
    createExercise({
      id: "demo-w2-row",
      exercise: "Barbell Row",
      muscleGroup: "Back",
      weight: "175",
      reps: ["8", "8", "7"],
      rir: ["2", "1", "1"],
      pump: "2",
      soreness: "1",
      notes: "Best row session this month.",
    }),
    createExercise({
      id: "demo-w2-curl",
      exercise: "Bicep Curl",
      muscleGroup: "Biceps",
      weight: "35",
      reps: ["12", "11", "10"],
      rir: ["2", "1", "1"],
      pump: "3",
      soreness: "1",
      notes: "Strict reps.",
    }),
  ]),
  createWorkout("demo-workout-3", 8, "Tired", "Legs were productive but fatiguing.", [
    createExercise({
      id: "demo-w3-squat",
      exercise: "Squat",
      muscleGroup: "Quads",
      weight: "255",
      reps: ["6", "6", "5"],
      rir: ["2", "1", "1"],
      pump: "2",
      soreness: "2",
      notes: "Repeat load before progressing.",
    }),
    createExercise({
      id: "demo-w3-rdl",
      exercise: "Romanian Deadlift",
      muscleGroup: "Hamstrings",
      weight: "225",
      reps: ["9", "8", "8"],
      rir: ["2", "1", "1"],
      pump: "2",
      soreness: "2",
      notes: "Hamstrings sore after this.",
    }),
    createExercise({
      id: "demo-w3-calf",
      exercise: "Calf Raise",
      muscleGroup: "Calves",
      weight: "160",
      reps: ["15", "14", "12", "12"],
      rir: ["2", "1", "1", "0"],
      pump: "3",
      soreness: "2",
      notes: "Keep full ROM.",
    }),
  ]),
  createWorkout("demo-workout-4", 12, "Good", "Bench volume improved.", [
    createExercise({
      id: "demo-w4-bench",
      exercise: "Bench Press",
      muscleGroup: "Chest",
      weight: "185",
      reps: ["8", "8", "7"],
      rir: ["2", "1", "1"],
      pump: "2",
      soreness: "1",
      notes: "Previous benchmark session.",
    }),
    createExercise({
      id: "demo-w4-pushdown",
      exercise: "Tricep Pushdown",
      muscleGroup: "Triceps",
      weight: "65",
      reps: ["13", "12", "11"],
      rir: ["2", "1", "1"],
      pump: "3",
      soreness: "1",
      notes: "Triceps responded well.",
    }),
  ]),
];

export const demoBodyweightLogs = [
  { id: 1, date: daysAgo(21).toISOString().slice(0, 10), weight: "187.2" },
  { id: 2, date: daysAgo(14).toISOString().slice(0, 10), weight: "186.1" },
  { id: 3, date: daysAgo(7).toISOString().slice(0, 10), weight: "184.8" },
  { id: 4, date: daysAgo(1).toISOString().slice(0, 10), weight: "184.3" },
];
