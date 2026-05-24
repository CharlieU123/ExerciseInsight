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
  age: string;
  height: string;
  weight: string;
};

export type ProgramExercise = {
  id: AppId;
  exercise: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  notes: string;
};

export type TrainingProgram = {
  id: AppId;
  name: string;
  splitType: string;
  daysPerWeek: string;
  notes: string;
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

export const emptyProfile: Profile = {
  name: "",
  age: "",
  height: "",
  weight: "",
};

export const splitTypes = ["Push/Pull/Legs", "Upper/Lower", "Full Body EOD"];

const programsStorageKey = "trainingPrograms";
const goalsStorageKey = "fitnessGoals";

export const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Forearms",
  "Neck",
  "Cardio",
  "Full Body",
  "Other",
];

export const exerciseLibrary: ExerciseLibraryItem[] = [
  {
    exercise: "Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    target: "Mid chest, front delts, triceps",
    defaultSets: "3",
    defaultReps: "6-10",
    cues: ["Keep shoulder blades pinned", "Touch the same spot each rep", "Drive feet into the floor"],
    substitutions: ["Dumbbell Press", "Machine Chest Press", "Push-Up"],
  },
  {
    exercise: "Incline Dumbbell Press",
    muscleGroup: "Chest",
    equipment: "Dumbbells",
    target: "Upper chest",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Use a slight incline", "Lower under control", "Press up and slightly in"],
    substitutions: ["Incline Machine Press", "Incline Bench Press", "Cable Fly"],
  },
  {
    exercise: "Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Barbell or dumbbells",
    target: "Front and side delts",
    defaultSets: "3",
    defaultReps: "6-10",
    cues: ["Brace before pressing", "Keep ribs down", "Finish with biceps near ears"],
    substitutions: ["Dumbbell Shoulder Press", "Machine Shoulder Press", "Arnold Press"],
  },
  {
    exercise: "Lat Pulldown",
    muscleGroup: "Back",
    equipment: "Cable machine",
    target: "Lats",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Pull elbows down", "Keep chest tall", "Control the stretch at the top"],
    substitutions: ["Pull-Up", "Assisted Pull-Up", "Single-Arm Pulldown"],
  },
  {
    exercise: "Barbell Row",
    muscleGroup: "Back",
    equipment: "Barbell",
    target: "Mid back and lats",
    defaultSets: "3",
    defaultReps: "6-10",
    cues: ["Hinge and brace", "Pull toward lower ribs", "Do not bounce the weight"],
    substitutions: ["Chest-Supported Row", "Seated Cable Row", "Dumbbell Row"],
  },
  {
    exercise: "Squat",
    muscleGroup: "Quads",
    equipment: "Barbell",
    target: "Quads, glutes, core",
    defaultSets: "3",
    defaultReps: "5-8",
    cues: ["Brace hard before descending", "Keep pressure through midfoot", "Drive up with chest and hips together"],
    substitutions: ["Leg Press", "Hack Squat", "Goblet Squat"],
  },
  {
    exercise: "Romanian Deadlift",
    muscleGroup: "Hamstrings",
    equipment: "Barbell or dumbbells",
    target: "Hamstrings and glutes",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Push hips back", "Keep shins mostly vertical", "Stop when hamstrings are fully stretched"],
    substitutions: ["Seated Leg Curl", "Lying Leg Curl", "Good Morning"],
  },
  {
    exercise: "Leg Press",
    muscleGroup: "Quads",
    equipment: "Machine",
    target: "Quads and glutes",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Use a deep controlled range", "Keep lower back on pad", "Do not lock knees hard"],
    substitutions: ["Hack Squat", "Squat", "Bulgarian Split Squat"],
  },
  {
    exercise: "Leg Curl",
    muscleGroup: "Hamstrings",
    equipment: "Machine",
    target: "Hamstrings",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep hips down", "Squeeze at the curl", "Control the negative"],
    substitutions: ["Romanian Deadlift", "Seated Leg Curl", "Lying Leg Curl"],
  },
  {
    exercise: "Tricep Pushdown",
    muscleGroup: "Triceps",
    equipment: "Cable machine",
    target: "Triceps",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Pin elbows near sides", "Fully extend each rep", "Control the return"],
    substitutions: ["Overhead Tricep Extension", "Skull Crusher", "Close-Grip Bench Press"],
  },
  {
    exercise: "Bicep Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells, barbell, or cable",
    target: "Biceps",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep elbows steady", "Curl without swinging", "Squeeze at the top"],
    substitutions: ["Hammer Curl", "Cable Curl", "Preacher Curl"],
  },
  {
    exercise: "Calf Raise",
    muscleGroup: "Calves",
    equipment: "Machine or dumbbells",
    target: "Calves",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Pause at the stretched bottom", "Rise as high as possible", "Avoid bouncing"],
    substitutions: ["Seated Calf Raise", "Standing Calf Raise", "Leg Press Calf Raise"],
  },
  {
    exercise: "Lateral Raise",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells or cable",
    target: "Side delts",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Lead with elbows", "Stop around shoulder height", "Keep tension controlled"],
    substitutions: ["Cable Lateral Raise", "Machine Lateral Raise", "Lean-Away Lateral Raise"],
  },
  {
    exercise: "Hip Thrust",
    muscleGroup: "Glutes",
    equipment: "Barbell or machine",
    target: "Glutes",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Tuck ribs down", "Pause at lockout", "Drive through heels"],
    substitutions: ["Glute Bridge", "Cable Pull-Through", "Romanian Deadlift"],
  },
  {
    exercise: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    target: "Core stability",
    defaultSets: "3",
    defaultReps: "30-60 sec",
    cues: ["Squeeze glutes", "Keep ribs down", "Hold a straight line"],
    substitutions: ["Dead Bug", "Pallof Press", "Hollow Hold"],
  },
  {
    exercise: "Push-Up",
    muscleGroup: "Chest",
    equipment: "Bodyweight",
    target: "Chest, front delts, triceps",
    defaultSets: "3",
    defaultReps: "8-20",
    cues: ["Keep a straight body line", "Lower chest between hands", "Press the floor away"],
    substitutions: ["Bench Press", "Machine Chest Press", "Dumbbell Press"],
  },
  {
    exercise: "Cable Fly",
    muscleGroup: "Chest",
    equipment: "Cable machine",
    target: "Chest isolation",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep elbows softly bent", "Bring hands together in front of chest", "Control the stretch"],
    substitutions: ["Pec Deck", "Dumbbell Fly", "Incline Cable Fly"],
  },
  {
    exercise: "Pec Deck",
    muscleGroup: "Chest",
    equipment: "Machine",
    target: "Chest isolation",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep chest tall", "Squeeze at the middle", "Return slowly"],
    substitutions: ["Cable Fly", "Dumbbell Fly", "Push-Up"],
  },
  {
    exercise: "Pull-Up",
    muscleGroup: "Back",
    equipment: "Bodyweight",
    target: "Lats and upper back",
    defaultSets: "3",
    defaultReps: "5-10",
    cues: ["Start from a full hang", "Drive elbows down", "Control the lower"],
    substitutions: ["Assisted Pull-Up", "Lat Pulldown", "Single-Arm Pulldown"],
  },
  {
    exercise: "Seated Cable Row",
    muscleGroup: "Back",
    equipment: "Cable machine",
    target: "Mid back and lats",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Sit tall", "Pull elbows behind body", "Do not lean back hard"],
    substitutions: ["Chest-Supported Row", "Barbell Row", "Dumbbell Row"],
  },
  {
    exercise: "Chest-Supported Row",
    muscleGroup: "Back",
    equipment: "Machine or dumbbells",
    target: "Mid back",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Keep chest on pad", "Pull through elbows", "Pause briefly at the top"],
    substitutions: ["Seated Cable Row", "Dumbbell Row", "Barbell Row"],
  },
  {
    exercise: "Face Pull",
    muscleGroup: "Shoulders",
    equipment: "Cable machine",
    target: "Rear delts and upper back",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Pull toward eye level", "Separate the rope", "Keep shoulders down"],
    substitutions: ["Reverse Pec Deck", "Rear Delt Fly", "Band Pull-Apart"],
  },
  {
    exercise: "Rear Delt Fly",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells or machine",
    target: "Rear delts",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Lead with elbows", "Keep traps relaxed", "Use controlled reps"],
    substitutions: ["Reverse Pec Deck", "Face Pull", "Cable Rear Delt Fly"],
  },
  {
    exercise: "Arnold Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
    target: "Front and side delts",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Rotate smoothly", "Keep ribs down", "Press without leaning back"],
    substitutions: ["Dumbbell Shoulder Press", "Machine Shoulder Press", "Shoulder Press"],
  },
  {
    exercise: "Preacher Curl",
    muscleGroup: "Biceps",
    equipment: "Bench, barbell, or machine",
    target: "Biceps",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Keep upper arms on pad", "Curl without bouncing", "Control the bottom"],
    substitutions: ["Cable Curl", "Bicep Curl", "Incline Dumbbell Curl"],
  },
  {
    exercise: "Hammer Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells or rope cable",
    target: "Biceps and brachialis",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep thumbs up", "Avoid swinging", "Control each rep"],
    substitutions: ["Cable Curl", "Bicep Curl", "Reverse Curl"],
  },
  {
    exercise: "Incline Dumbbell Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells",
    target: "Biceps in a stretched position",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Let arms hang behind torso", "Keep elbows quiet", "Squeeze at the top"],
    substitutions: ["Preacher Curl", "Cable Curl", "Bicep Curl"],
  },
  {
    exercise: "Skull Crusher",
    muscleGroup: "Triceps",
    equipment: "EZ bar or dumbbells",
    target: "Triceps",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Keep elbows pointed up", "Lower under control", "Extend without flaring"],
    substitutions: ["Overhead Tricep Extension", "Tricep Pushdown", "Close-Grip Bench Press"],
  },
  {
    exercise: "Overhead Tricep Extension",
    muscleGroup: "Triceps",
    equipment: "Cable or dumbbell",
    target: "Long head of triceps",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep elbows high", "Get a deep stretch", "Extend fully"],
    substitutions: ["Skull Crusher", "Tricep Pushdown", "Dips"],
  },
  {
    exercise: "Dips",
    muscleGroup: "Triceps",
    equipment: "Parallel bars or assisted machine",
    target: "Triceps, chest, front delts",
    defaultSets: "3",
    defaultReps: "6-12",
    cues: ["Keep shoulders controlled", "Lower to a comfortable depth", "Drive through the bars"],
    substitutions: ["Close-Grip Bench Press", "Push-Up", "Tricep Pushdown"],
  },
  {
    exercise: "Hack Squat",
    muscleGroup: "Quads",
    equipment: "Machine",
    target: "Quads and glutes",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Use a deep range", "Keep back on pad", "Drive through midfoot"],
    substitutions: ["Leg Press", "Squat", "Goblet Squat"],
  },
  {
    exercise: "Bulgarian Split Squat",
    muscleGroup: "Quads",
    equipment: "Dumbbells or bodyweight",
    target: "Quads and glutes",
    defaultSets: "3",
    defaultReps: "8-12",
    cues: ["Keep front foot planted", "Lower under control", "Drive through the front leg"],
    substitutions: ["Lunge", "Leg Press", "Goblet Squat"],
  },
  {
    exercise: "Walking Lunge",
    muscleGroup: "Quads",
    equipment: "Dumbbells or bodyweight",
    target: "Quads, glutes, balance",
    defaultSets: "3",
    defaultReps: "10-16",
    cues: ["Take controlled steps", "Keep torso tall", "Push through the front foot"],
    substitutions: ["Bulgarian Split Squat", "Reverse Lunge", "Leg Press"],
  },
  {
    exercise: "Leg Extension",
    muscleGroup: "Quads",
    equipment: "Machine",
    target: "Quads",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Set pad above ankles", "Squeeze at the top", "Lower slowly"],
    substitutions: ["Hack Squat", "Leg Press", "Sissy Squat"],
  },
  {
    exercise: "Seated Leg Curl",
    muscleGroup: "Hamstrings",
    equipment: "Machine",
    target: "Hamstrings",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep hips down", "Curl through a full range", "Control the return"],
    substitutions: ["Lying Leg Curl", "Romanian Deadlift", "Nordic Curl"],
  },
  {
    exercise: "Lying Leg Curl",
    muscleGroup: "Hamstrings",
    equipment: "Machine",
    target: "Hamstrings",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Keep hips pressed down", "Curl without jerking", "Pause when fully curled"],
    substitutions: ["Seated Leg Curl", "Romanian Deadlift", "Nordic Curl"],
  },
  {
    exercise: "Deadlift",
    muscleGroup: "Full Body",
    equipment: "Barbell",
    target: "Posterior chain, back, grip",
    defaultSets: "3",
    defaultReps: "3-6",
    cues: ["Brace before pulling", "Keep bar close", "Stand tall without overextending"],
    substitutions: ["Romanian Deadlift", "Trap Bar Deadlift", "Rack Pull"],
  },
  {
    exercise: "Glute Bridge",
    muscleGroup: "Glutes",
    equipment: "Barbell or bodyweight",
    target: "Glutes",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Tuck ribs down", "Drive through heels", "Pause at lockout"],
    substitutions: ["Hip Thrust", "Cable Pull-Through", "Romanian Deadlift"],
  },
  {
    exercise: "Cable Pull-Through",
    muscleGroup: "Glutes",
    equipment: "Cable machine",
    target: "Glutes and hamstrings",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Hinge at the hips", "Keep arms relaxed", "Squeeze glutes to stand"],
    substitutions: ["Hip Thrust", "Glute Bridge", "Romanian Deadlift"],
  },
  {
    exercise: "Seated Calf Raise",
    muscleGroup: "Calves",
    equipment: "Machine",
    target: "Soleus-focused calves",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Pause deep in the stretch", "Rise fully", "Avoid bouncing"],
    substitutions: ["Standing Calf Raise", "Leg Press Calf Raise", "Calf Raise"],
  },
  {
    exercise: "Standing Calf Raise",
    muscleGroup: "Calves",
    equipment: "Machine or dumbbells",
    target: "Gastrocnemius-focused calves",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Keep knees mostly straight", "Stretch at the bottom", "Pause at the top"],
    substitutions: ["Seated Calf Raise", "Leg Press Calf Raise", "Calf Raise"],
  },
  {
    exercise: "Hanging Leg Raise",
    muscleGroup: "Core",
    equipment: "Pull-up bar",
    target: "Abs and hip flexors",
    defaultSets: "3",
    defaultReps: "8-15",
    cues: ["Control the swing", "Curl pelvis upward", "Lower slowly"],
    substitutions: ["Captain's Chair Raise", "Reverse Crunch", "Dead Bug"],
  },
  {
    exercise: "Cable Crunch",
    muscleGroup: "Core",
    equipment: "Cable machine",
    target: "Abs",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Round through the spine", "Keep hips mostly still", "Squeeze abs hard"],
    substitutions: ["Machine Crunch", "Crunch", "Plank"],
  },
  {
    exercise: "Pallof Press",
    muscleGroup: "Core",
    equipment: "Cable or band",
    target: "Anti-rotation core strength",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Stand tall", "Press straight out", "Resist rotation"],
    substitutions: ["Side Plank", "Dead Bug", "Cable Chop"],
  },
  {
    exercise: "Wrist Curl",
    muscleGroup: "Forearms",
    equipment: "Dumbbells or barbell",
    target: "Forearm flexors",
    defaultSets: "3",
    defaultReps: "12-20",
    cues: ["Use a full wrist range", "Keep forearms supported", "Control the lowering"],
    substitutions: ["Reverse Curl", "Farmer Carry", "Cable Wrist Curl"],
  },
  {
    exercise: "Reverse Curl",
    muscleGroup: "Forearms",
    equipment: "EZ bar or dumbbells",
    target: "Forearms and brachialis",
    defaultSets: "3",
    defaultReps: "10-15",
    cues: ["Use an overhand grip", "Keep elbows still", "Avoid swinging"],
    substitutions: ["Hammer Curl", "Wrist Curl", "Cable Curl"],
  },
  {
    exercise: "Farmer Carry",
    muscleGroup: "Forearms",
    equipment: "Dumbbells or trap bar",
    target: "Grip, traps, core",
    defaultSets: "3",
    defaultReps: "30-60 sec",
    cues: ["Stand tall", "Walk under control", "Keep shoulders packed"],
    substitutions: ["Suitcase Carry", "Dead Hang", "Trap Bar Carry"],
  },
  {
    exercise: "Neck Flexion",
    muscleGroup: "Neck",
    equipment: "Harness, plate, or band",
    target: "Front neck",
    defaultSets: "2",
    defaultReps: "12-20",
    cues: ["Use light resistance", "Move slowly", "Stop if anything feels sharp"],
    substitutions: ["Isometric Neck Hold", "Neck Extension", "Manual Resistance Neck Flexion"],
  },
  {
    exercise: "Treadmill Run",
    muscleGroup: "Cardio",
    equipment: "Treadmill",
    target: "Cardiovascular conditioning",
    defaultSets: "1",
    defaultReps: "10-30 min",
    cues: ["Start easy", "Keep posture relaxed", "Progress time or pace slowly"],
    substitutions: ["Outdoor Run", "Bike", "Rowing Machine"],
  },
  {
    exercise: "Bike",
    muscleGroup: "Cardio",
    equipment: "Stationary bike",
    target: "Low-impact conditioning",
    defaultSets: "1",
    defaultReps: "10-30 min",
    cues: ["Set seat height comfortably", "Keep cadence smooth", "Progress resistance gradually"],
    substitutions: ["Treadmill Run", "Elliptical", "Rowing Machine"],
  },
  {
    exercise: "Rowing Machine",
    muscleGroup: "Cardio",
    equipment: "Rower",
    target: "Conditioning and posterior chain endurance",
    defaultSets: "1",
    defaultReps: "5-20 min",
    cues: ["Push with legs first", "Finish with arms", "Return under control"],
    substitutions: ["Bike", "Treadmill Run", "Ski Erg"],
  },
];

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

export function loadWorkouts() {
  const savedWorkouts = localStorage.getItem("workouts");

  if (!savedWorkouts) {
    return [];
  }

  try {
    return normalizeWorkouts(JSON.parse(savedWorkouts));
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: Workout[]) {
  localStorage.setItem("workouts", JSON.stringify(workouts));
}

export function loadProfile() {
  const savedProfile = localStorage.getItem("profile");

  if (!savedProfile) {
    return emptyProfile;
  }

  try {
    return {
      ...emptyProfile,
      ...JSON.parse(savedProfile),
    };
  } catch {
    return emptyProfile;
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
}

export function loadTrainingPrograms() {
  const savedPrograms = localStorage.getItem(programsStorageKey);

  if (!savedPrograms) {
    return [];
  }

  try {
    return JSON.parse(savedPrograms) as TrainingProgram[];
  } catch {
    return [];
  }
}

export function saveTrainingPrograms(programs: TrainingProgram[]) {
  localStorage.setItem(programsStorageKey, JSON.stringify(programs));
}

export function loadFitnessGoals() {
  const savedGoals = localStorage.getItem(goalsStorageKey);

  if (!savedGoals) {
    return [];
  }

  try {
    return JSON.parse(savedGoals) as FitnessGoal[];
  } catch {
    return [];
  }
}

export function saveFitnessGoals(goals: FitnessGoal[]) {
  localStorage.setItem(goalsStorageKey, JSON.stringify(goals));
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

export function getExerciseRecommendation(
  exerciseEntry: ExerciseEntry
): ExerciseRecommendation {
  const sets = getExerciseSetCount(exerciseEntry);
  const rir = getExerciseAverageRir(exerciseEntry);
  const pump = Number(exerciseEntry.pump);
  const soreness = Number(exerciseEntry.soreness);

  if (soreness >= 3) {
    return {
      action: "Reduce volume",
      detail:
        "Soreness is high. Consider removing 1 set or keeping the load easier next time.",
      tone: "recover",
    };
  }

  if (rir <= 1 && soreness >= 2) {
    return {
      action: "Keep or reduce",
      detail:
        "This was close to failure and soreness is building. Hold steady or reduce 1 set.",
      tone: "reduce",
    };
  }

  if (rir >= 3 && pump <= 1 && sets < 5) {
    return {
      action: "Add 1 set",
      detail:
        "This looked recoverable and the pump was low. Add a set next time for more stimulus.",
      tone: "increase",
    };
  }

  if (rir >= 3 && pump >= 2 && soreness <= 1) {
    return {
      action: "Increase weight",
      detail:
        "You had reps in reserve with solid feedback. Add a small amount of weight next time.",
      tone: "increase",
    };
  }

  if (rir <= 1 && pump >= 2 && soreness <= 1) {
    return {
      action: "Keep volume",
      detail:
        "This was challenging with a good pump. Repeat the same sets and weight next time.",
      tone: "maintain",
    };
  }

  return {
    action: "Repeat and monitor",
    detail:
      "Feedback looks manageable. Repeat this setup and watch pump, soreness, and RIR.",
    tone: "maintain",
  };
}

export function getDeloadRecommendation(workouts: Workout[]): DeloadRecommendation {
  const recentWorkouts = workouts.slice(0, 5);
  const recentExercises = recentWorkouts.flatMap((workout) => workout.exercises);

  if (recentWorkouts.length < 3 || recentExercises.length < 6) {
    return {
      action: "Keep collecting data",
      detail:
        "Log a few more workouts before making a deload call. The app needs enough recent feedback to spot fatigue.",
      tone: "normal",
    };
  }

  const highSorenessCount = recentExercises.filter(
    (exerciseEntry) => Number(exerciseEntry.soreness) >= 3
  ).length;
  const veryHardCount = recentExercises.filter(
    (exerciseEntry) => Number(exerciseEntry.rir) <= 1
  ).length;
  const poorFeelingCount = recentWorkouts.filter((workout) =>
    ["Tired", "Weak"].includes(workout.feeling)
  ).length;

  if (
    highSorenessCount >= 3 ||
    (poorFeelingCount >= 2 && veryHardCount >= 3)
  ) {
    return {
      action: "Consider a deload",
      detail:
        "Recent workouts show high fatigue. Reduce sets by 30-50% for a week and keep most sets farther from failure.",
      tone: "deload",
    };
  }

  if (highSorenessCount >= 1 || poorFeelingCount >= 1) {
    return {
      action: "Watch recovery",
      detail:
        "Fatigue is showing up, but not enough to force a deload yet. Keep volume steady and avoid adding sets this week.",
      tone: "watch",
    };
  }

  return {
    action: "No deload needed",
    detail:
      "Recent soreness and workout feedback look manageable. Keep progressing normally.",
    tone: "normal",
  };
}
