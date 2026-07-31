"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ExerciseDetailModal } from "../components/ExerciseDetailModal";
import {
  exerciseLibrary,
  loadFitnessGoals,
  loadTrainingPrograms,
  loadWorkouts,
  muscleGroups,
  splitTypes,
  type ExerciseLibraryItem,
  type FitnessGoal,
  type TrainingProgram,
  type Workout,
} from "../lib/fitnessData";
import { getExerciseSetEntries } from "../lib/workoutUtils";
import {
  loadGoalsFromSupabase,
  loadProgramsFromSupabase,
} from "../lib/supabasePlanning";
import { getCurrentUserId, loadWorkoutsFromSupabase } from "../lib/supabaseWorkouts";

const allMuscles = "All";
const allEquipment = "All";
const savedDiscoverKey = "exerciseinsight-saved-discover-exercises";
const discoverTabs = ["For You", "Exercises", "Programs", "Learn", "Saved"] as const;

type DiscoverTab = (typeof discoverTabs)[number];
type RecommendationState = {
  label: "No data" | "Early Recommendation" | "Personalized Recommendation";
  confidence: "Not ready" | "Low confidence" | "High confidence";
  dataPeriod: string;
  isPersonalized: boolean;
};

const starterExerciseNames = [
  "Bench Press",
  "Lat Pulldown",
  "Goblet Squat",
  "Romanian Deadlift",
  "Dumbbell Shoulder Press",
  "Seated Cable Row",
];

const goals = [
  {
    name: "Hypertrophy",
    description: "Build muscle with moderate reps, stable form, and enough weekly sets.",
    movements: ["Press", "Pull", "Row", "Squat", "Hinge", "Curl", "Extension", "Raise", "Fly"],
    repRange: "8-15 reps",
  },
  {
    name: "Strength",
    description: "Prioritize heavier compounds, lower reps, and repeatable progression.",
    movements: ["Press", "Squat", "Hinge", "Row", "Pull"],
    repRange: "3-8 reps",
  },
  {
    name: "Beginner",
    description: "Start with easy-to-learn movements and simple full-body progress.",
    movements: ["Press", "Row", "Squat", "Hinge", "Core", "Carry"],
    repRange: "8-12 reps",
  },
  {
    name: "Bodybuilding",
    description: "Use muscle-specific choices, substitutions, and recovery-aware volume.",
    movements: ["Press", "Fly", "Row", "Pull", "Curl", "Extension", "Raise", "Squat", "Hinge"],
    repRange: "10-20 reps",
  },
];

const splitRecommendations = [
  {
    name: "Push/Pull/Legs",
    goal: "Hypertrophy",
    days: "3-6 days/week",
    level: "Intermediate",
    tag: "Popular Template",
    workouts: "6 workouts",
    duration: "60-75 min/session",
    detail: "Best when users want muscle-group focus and repeatable weekly volume.",
    sample: ["Push: chest, shoulders, triceps", "Pull: back, biceps", "Legs: quads, hamstrings, glutes"],
  },
  {
    name: "Upper/Lower",
    goal: "Strength",
    days: "4 days/week",
    level: "Intermediate",
    tag: "Balanced Plan",
    workouts: "4 workouts",
    duration: "55-70 min/session",
    detail: "A clean blend of practice frequency, recovery, and compound lift progress.",
    sample: ["Upper: press and row", "Lower: squat and hinge", "Repeat with variations"],
  },
  {
    name: "Full Body EOD",
    goal: "Beginner",
    days: "3-4 days/week",
    level: "Beginner",
    tag: "Beginner Friendly",
    workouts: "3 workouts",
    duration: "45-60 min/session",
    detail: "Simple rhythm for learning movements while keeping recovery days built in.",
    sample: ["Full body session", "Rest day", "Full body session"],
  },
  {
    name: "Powerbuilding 5-Day",
    goal: "Strength",
    days: "5 days/week",
    level: "Advanced",
    tag: "Strength Template",
    workouts: "5 workouts",
    duration: "70-90 min/session",
    detail: "Heavy compounds first, then bodybuilding accessories for weak points.",
    sample: ["Heavy upper", "Heavy lower", "Push", "Pull", "Legs"],
  },
];

const collections = [
  {
    title: "Science-Based Chest",
    goal: "Hypertrophy",
    muscle: "Chest",
    detail: "Presses and flies that make upper and mid-chest work easier to track.",
  },
  {
    title: "Bigger Arms",
    goal: "Bodybuilding",
    muscle: "Biceps",
    detail: "Curl and extension variations for direct arm volume.",
  },
  {
    title: "Back For Beginners",
    goal: "Beginner",
    muscle: "Back",
    detail: "Stable rows and pulldowns that teach good pulling mechanics.",
  },
  {
    title: "Knee-Friendly Legs",
    goal: "Hypertrophy",
    muscle: "Hamstrings",
    detail: "Leg options that bias control, machines, and posterior-chain work.",
  },
];

const learnCards = [
  {
    title: "How to Apply Progressive Overload",
    detail: "Add reps first, then load, then sets when recovery still looks strong.",
  },
  {
    title: "What Is RIR?",
    detail: "Reps in reserve tells the app how close a set was to failure.",
  },
  {
    title: "Signs You Need A Deload",
    detail: "High soreness, low performance, and tired sessions are warning signs.",
  },
  {
    title: "How to Find Your Weekly Training Volume",
    detail:
      "Learn how experience, recovery, and performance can help determine an appropriate weekly set range.",
  },
];

const challenges = [
  {
    title: "30-Day Bench Consistency",
    detail: "Complete 8 bench-focused workouts in 30 days.",
    progress: "0 of 8 workouts",
  },
  {
    title: "100 Pull-Up Progression",
    detail: "Build weekly pulling volume until 100 total reps feels realistic.",
    progress: "Week 1 of 4",
  },
  {
    title: "Four-Week Leg Volume Build",
    detail:
      "Gradually increase lower-body working sets without exceeding your recovery limit.",
    progress: "Week 1 of 4",
  },
  {
    title: "Three-Day Full Body Streak",
    detail: "Finish three full-body sessions with at least one rest day between each.",
    progress: "0 of 3 sessions",
  },
];

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function getExerciseText(exercise: ExerciseLibraryItem) {
  return [
    exercise.exercise,
    exercise.muscleGroup,
    exercise.equipment,
    exercise.target,
    exercise.movement,
    exercise.level,
    ...exercise.cues,
    ...exercise.substitutions,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getRecentWorkouts(workouts: Workout[], days = 14) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return workouts.filter((workout) => {
    const workoutDate = new Date(workout.dateISO || workout.date);

    return !Number.isNaN(workoutDate.getTime()) && workoutDate >= cutoffDate;
  });
}

function getWorkoutSpanDays(workouts: Workout[]) {
  const workoutDates = workouts
    .map((workout) => new Date(workout.dateISO || workout.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime());

  if (workoutDates.length < 2) {
    return workoutDates.length === 1 ? 1 : 0;
  }

  const firstDate = workoutDates[0];
  const lastDate = workoutDates[workoutDates.length - 1];
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.max(
    1,
    Math.round((lastDate.getTime() - firstDate.getTime()) / millisecondsPerDay)
  );
}

function getRecommendationState(workouts: Workout[]): RecommendationState {
  const completedWorkoutCount = workouts.length;
  const spanDays = getWorkoutSpanDays(workouts);

  if (completedWorkoutCount < 2) {
    return {
      label: "No data",
      confidence: "Not ready",
      dataPeriod: "Personalized recommendations need at least 2 logged workouts.",
      isPersonalized: false,
    };
  }

  if (completedWorkoutCount < 8) {
    return {
      label: "Early Recommendation",
      confidence: "Low confidence",
      dataPeriod: `Based on ${completedWorkoutCount} workouts over ${spanDays} days`,
      isPersonalized: true,
    };
  }

  return {
    label: "Personalized Recommendation",
    confidence: "High confidence",
    dataPeriod: `Based on ${completedWorkoutCount} workouts over ${spanDays} days`,
    isPersonalized: true,
  };
}

function getExerciseClassification(exercise: ExerciseLibraryItem) {
  const text = getExerciseText(exercise);

  if (text.includes("stretch") || text.includes("mobility") || text.includes("yoga")) {
    return "Mobility";
  }

  if (exercise.equipment.toLowerCase().includes("body")) {
    return "Bodyweight";
  }

  if (exercise.equipment.toLowerCase().includes("machine")) {
    return "Machine";
  }

  if (
    text.includes("curl") ||
    text.includes("extension") ||
    text.includes("raise") ||
    text.includes("fly") ||
    text.includes("calf") ||
    text.includes("crunch")
  ) {
    return "Isolation";
  }

  if (
    text.includes("press") ||
    text.includes("squat") ||
    text.includes("deadlift") ||
    text.includes("row") ||
    text.includes("pull-up") ||
    text.includes("lunge") ||
    text.includes("dip")
  ) {
    return "Compound";
  }

  if (text.includes("single") || text.includes("stability")) {
    return "Stability";
  }

  return exercise.movement && exercise.movement !== "Strength"
    ? exercise.movement
    : "General";
}

function matchesGoal(exercise: ExerciseLibraryItem, selectedGoal: string) {
  const goal = goals.find((goalOption) => goalOption.name === selectedGoal);

  if (!goal) {
    return true;
  }

  const exerciseText = getExerciseText(exercise);

  if (selectedGoal === "Strength") {
    return (
      exerciseText.includes("barbell") ||
      exerciseText.includes("squat") ||
      exerciseText.includes("deadlift") ||
      exerciseText.includes("press") ||
      exerciseText.includes("row") ||
      exerciseText.includes("pull-up")
    );
  }

  if (selectedGoal === "Beginner") {
    return (
      !exerciseText.includes("advanced") &&
      !exerciseText.includes("olympic") &&
      !exerciseText.includes("snatch")
    );
  }

  return goal.movements.some((movement) =>
    exerciseText.includes(movement.toLowerCase())
  );
}

function getMuscleSetTotals(workouts: Workout[]) {
  return workouts.reduce<Record<string, number>>((totals, workout) => {
    workout.exercises.forEach((exercise) => {
      totals[exercise.muscleGroup] =
        (totals[exercise.muscleGroup] ?? 0) + getExerciseSetEntries(exercise).length;
    });

    return totals;
  }, {});
}

function getLowVolumeMuscle(workouts: Workout[]) {
  const totals = getMuscleSetTotals(getRecentWorkouts(workouts).slice(0, 12));
  const trainedMuscles = muscleGroups.filter((muscle) => muscle !== "Other");

  if (Object.keys(totals).length === 0) {
    return null;
  }

  return trainedMuscles.reduce((lowestMuscle, muscle) =>
    (totals[muscle] ?? 0) < (totals[lowestMuscle] ?? 0) ? muscle : lowestMuscle
  );
}

function getTopMuscles(workouts: Workout[]) {
  const totals = getMuscleSetTotals(getRecentWorkouts(workouts).slice(0, 12));

  return Object.entries(totals)
    .sort((firstMuscle, secondMuscle) => secondMuscle[1] - firstMuscle[1])
    .slice(0, 4);
}

function getMuscleVolumeStatus(setCount: number) {
  if (setCount <= 6) {
    return "Below target";
  }

  if (setCount >= 22) {
    return "High volume";
  }

  return "Balanced";
}

function getRecommendationReason(
  exercise: ExerciseLibraryItem,
  lowVolumeMuscle: string | null,
  isPersonalized: boolean
) {
  const exerciseName = exercise.exercise.toLowerCase();

  if (!isPersonalized) {
    if (exerciseName.includes("bench")) {
      return "A simple press pattern that teaches stable upper-body progression.";
    }

    if (exerciseName.includes("pulldown")) {
      return "A stable vertical pull that makes lat volume easy to track.";
    }

    if (exerciseName.includes("goblet")) {
      return "A beginner-friendly squat pattern that is easy to load and control.";
    }

    return "A reliable starter movement that fits many beginner programs.";
  }

  if (exerciseName.includes("hip thrust")) {
    return "Best for directly loading the glutes through progressive overload.";
  }

  if (exerciseName.includes("glute bridge")) {
    return "A lower-fatigue option that works well at the end of a lower-body session.";
  }

  if (exerciseName.includes("pull-through")) {
    return "Adds a glute-focused hinge without the fatigue of another heavy deadlift variation.";
  }

  if (exerciseName.includes("chest supported")) {
    return "Keeps the torso stable so the upper back can do more of the work.";
  }

  if (exerciseName.includes("lat pulldown")) {
    return "A stable vertical pull that makes lat volume easy to track.";
  }

  if (exerciseName.includes("barbell row")) {
    return "Adds heavier horizontal pulling for mid-back strength.";
  }

  if (exerciseName.includes("pull-up")) {
    return "A bodyweight vertical pull that also tracks relative strength.";
  }

  if (exerciseName.includes("incline")) {
    return "Useful when upper-chest volume needs a direct, trackable movement.";
  }

  if (lowVolumeMuscle && exercise.muscleGroup === lowVolumeMuscle) {
    return `${lowVolumeMuscle} is your lowest-volume muscle group in the current analysis window.`;
  }

  if ((exercise.movement ?? "").toLowerCase().includes("row")) {
    return "Rows help balance pressing volume and build upper-back stability.";
  }

  if (exercise.equipment.toLowerCase().includes("machine")) {
    return "Machine work is easy to progress and simple to recover from.";
  }

  return "This matches your selected goal and is easy to plug into a program.";
}

function getTodayInsight(workouts: Workout[], goalsData: FitnessGoal[], programs: TrainingProgram[]) {
  const lowVolumeMuscle = getLowVolumeMuscle(workouts);
  const recommendationState = getRecommendationState(workouts);
  const activeGoal = goalsData.find((goal) => goal.status === "Active") ?? goalsData[0];
  const currentProgram = programs[0];
  const supportingContext = activeGoal
    ? `Supporting your goal: ${activeGoal.title}`
    : currentProgram
      ? `Supporting your program: ${currentProgram.name}`
      : "Based on your recent training";

  if (!recommendationState.isPersonalized || !lowVolumeMuscle) {
    return {
      title: "Start with useful data",
      context: recommendationState.dataPeriod,
      detail:
        "Log one full workout with sets, reps, RIR, pump, and soreness. Discover will turn that into smarter exercise and split recommendations.",
    };
  }

  return {
    title: `Bring Up Your ${lowVolumeMuscle}`,
    context: supportingContext,
    detail: `${lowVolumeMuscle} is currently your lowest-volume muscle group. Add one targeted movement or choose a program that trains it twice per week.`,
  };
}

export default function DiscoverPage() {
  const [selectedGoal, setSelectedGoal] = useState(goals[0].name);
  const [selectedMuscle, setSelectedMuscle] = useState(allMuscles);
  const [selectedEquipment, setSelectedEquipment] = useState(allEquipment);
  const [activeTab, setActiveTab] = useState<DiscoverTab>("For You");
  const [searchTerm, setSearchTerm] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goalsData, setGoalsData] = useState<FitnessGoal[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [savedExerciseNames, setSavedExerciseNames] = useState<string[]>([]);
  const [selectedExerciseDetail, setSelectedExerciseDetail] =
    useState<ExerciseLibraryItem | null>(null);

  useEffect(() => {
    const savedDiscoverItems = localStorage.getItem(savedDiscoverKey);

    if (savedDiscoverItems) {
      try {
        const parsedSavedItems = JSON.parse(savedDiscoverItems) as string[];
        setSavedExerciseNames(Array.isArray(parsedSavedItems) ? parsedSavedItems : []);
      } catch {
        localStorage.removeItem(savedDiscoverKey);
      }
    }

    async function loadDiscoverData() {
      const currentUserId = await getCurrentUserId();

      if (!currentUserId) {
        setWorkouts(loadWorkouts());
        setGoalsData(loadFitnessGoals());
        setPrograms(loadTrainingPrograms());
        return;
      }

      try {
        const [savedWorkouts, savedGoals, savedPrograms] = await Promise.all([
          loadWorkoutsFromSupabase(),
          loadGoalsFromSupabase(),
          loadProgramsFromSupabase(),
        ]);

        setWorkouts(savedWorkouts);
        setGoalsData(savedGoals);
        setPrograms(savedPrograms);
      } catch {
        setWorkouts(loadWorkouts());
        setGoalsData(loadFitnessGoals());
        setPrograms(loadTrainingPrograms());
      }
    }

    loadDiscoverData();
  }, []);

  const equipmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          exerciseLibrary
            .map((exercise) => exercise.equipment.split(",")[0].trim())
            .filter(Boolean)
        )
      )
        .sort((firstEquipment, secondEquipment) =>
          firstEquipment.localeCompare(secondEquipment)
        )
        .slice(0, 16),
    []
  );
  const lowVolumeMuscle = useMemo(() => getLowVolumeMuscle(workouts), [workouts]);
  const recommendationState = useMemo(
    () => getRecommendationState(workouts),
    [workouts]
  );
  const todayInsight = useMemo(
    () => getTodayInsight(workouts, goalsData, programs),
    [goalsData, programs, workouts]
  );
  const topMuscles = useMemo(() => getTopMuscles(workouts), [workouts]);

  const universalResults = useMemo(() => {
    const search = normalizeText(searchTerm);

    if (!search) {
      return [];
    }

    const exerciseResults = exerciseLibrary
      .filter((exercise) => getExerciseText(exercise).includes(search))
      .slice(0, 5)
      .map((exercise) => ({
        type: "Exercise",
        title: exercise.exercise,
        detail: `${exercise.muscleGroup} · ${exercise.equipment}`,
        exercise,
      }));
    const programResults = splitRecommendations
      .filter((split) => normalizeText(`${split.name} ${split.goal} ${split.detail}`).includes(search))
      .slice(0, 3)
      .map((split) => ({
        type: "Program",
        title: split.name,
        detail: `${split.days} · ${split.goal}`,
        exercise: null,
      }));
    const learnResults = learnCards
      .filter((card) => normalizeText(`${card.title} ${card.detail}`).includes(search))
      .slice(0, 3)
      .map((card) => ({
        type: "Learn",
        title: card.title,
        detail: card.detail,
        exercise: null,
      }));

    return [...exerciseResults, ...programResults, ...learnResults].slice(0, 8);
  }, [searchTerm]);

  const filteredExercises = useMemo(
    () =>
      exerciseLibrary
        .filter((exercise) => {
          const search = normalizeText(searchTerm);
          const matchesSearch = search === "" || getExerciseText(exercise).includes(search);
          const matchesMuscle =
            selectedMuscle === allMuscles || exercise.muscleGroup === selectedMuscle;
          const matchesEquipment =
            selectedEquipment === allEquipment ||
            exercise.equipment.toLowerCase().includes(selectedEquipment.toLowerCase());

          return (
            matchesSearch &&
            matchesMuscle &&
            matchesEquipment &&
            matchesGoal(exercise, selectedGoal)
          );
        })
        .slice(0, 18),
    [searchTerm, selectedEquipment, selectedGoal, selectedMuscle]
  );

  const recommendedExercises = useMemo(
    () => {
      if (!recommendationState.isPersonalized || !lowVolumeMuscle) {
        const starterExercises = starterExerciseNames
          .map((exerciseName) =>
            exerciseLibrary.find((exercise) => exercise.exercise === exerciseName)
          )
          .filter((exercise): exercise is ExerciseLibraryItem => Boolean(exercise));

        return starterExercises.length > 0
          ? starterExercises.slice(0, 3)
          : exerciseLibrary.slice(0, 3);
      }

      return exerciseLibrary
        .filter((exercise) => exercise.muscleGroup === lowVolumeMuscle)
        .filter((exercise) => matchesGoal(exercise, selectedGoal))
        .slice(0, 3);
    },
    [lowVolumeMuscle, recommendationState.isPersonalized, selectedGoal]
  );
  const visibleExercises =
    activeTab === "Exercises" ? filteredExercises : filteredExercises.slice(0, 6);
  const matchingSplits = splitRecommendations.filter(
    (split) => split.goal === selectedGoal || splitTypes.includes(split.name)
  );
  const collectionCards = collections.filter(
    (collection) =>
      collection.goal === selectedGoal ||
      selectedMuscle === allMuscles ||
      collection.muscle === selectedMuscle
  );
  const savedExercises = exerciseLibrary.filter((exercise) =>
    savedExerciseNames.includes(exercise.exercise)
  );

  function addExerciseToWorkout(exerciseName: string) {
    window.location.href = `/add-workout?exercise=${encodeURIComponent(exerciseName)}`;
  }

  function saveDiscoverExercise(exerciseName: string) {
    const updatedSavedExerciseNames = savedExerciseNames.includes(exerciseName)
      ? savedExerciseNames
      : [...savedExerciseNames, exerciseName];

    setSavedExerciseNames(updatedSavedExerciseNames);
    localStorage.setItem(savedDiscoverKey, JSON.stringify(updatedSavedExerciseNames));
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-fuchsia-500/10 to-gray-950 p-6 shadow-2xl shadow-cyan-950/20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Discover
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-5xl">
            Discover training knowledge, not just exercises.
          </h1>
          <p className="max-w-3xl text-gray-300">
            Search exercises, splits, goals, and coaching ideas. ExerciseInsight
            uses your logs to recommend useful movements instead of random ones.
          </p>

          <div className="relative mt-6">
            <input
              className="w-full rounded-2xl border border-cyan-400/30 bg-gray-950/90 p-4 text-lg shadow-xl shadow-cyan-950/20 outline-none transition focus:border-cyan-300"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search exercises, programs, RIR, deloads, muscles..."
              aria-label="Search ExerciseInsight Discover"
            />

            {universalResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/50">
                {universalResults.map((result) => (
                  <button
                    key={`${result.type}-${result.title}`}
                    type="button"
                    onClick={() => {
                      if (result.exercise) {
                        setSelectedExerciseDetail(result.exercise);
                      } else if (result.type === "Program") {
                        window.location.href = "/programs";
                      }
                    }}
                    className="flex w-full items-center justify-between gap-4 border-b border-white/5 px-4 py-3 text-left last:border-b-0 hover:bg-white/5"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        {result.title}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {result.detail}
                      </span>
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-gray-950/70 p-2">
          {discoverTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "whitespace-nowrap rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-950"
                  : "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white"
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Saved" ? (
          <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Saved Discoveries
            </p>
            <h2 className="mt-2 text-2xl font-bold">Exercises you saved for later</h2>

            {savedExercises.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No saved discoveries yet"
                  description="Save a recommended exercise and it will appear here."
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {savedExercises.map((exercise) => (
                  <article
                    key={exercise.exercise}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {getExerciseClassification(exercise)} · {exercise.muscleGroup}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{exercise.exercise}</h3>
                    <p className="mt-2 text-sm text-gray-400">{exercise.target}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseDetail(exercise)}
                        className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold hover:bg-cyan-500"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => addExerciseToWorkout(exercise.exercise)}
                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
                      >
                        Add to Workout
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-950/20 p-5 shadow-xl shadow-fuchsia-950/20">
              <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                Today&apos;s Insight
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Based on your last 14 days
              </p>
              <h2 className="mt-2 text-2xl font-bold">{todayInsight.title}</h2>
              <p className="mt-2 text-sm font-semibold text-fuchsia-200">
                {todayInsight.context}
              </p>
              <p className="mt-3 max-w-3xl text-gray-300">{todayInsight.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/progress"
                  className="rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-semibold hover:bg-fuchsia-500"
                >
                  View Progress
                </Link>
                <Link
                  href="/add-workout"
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-700"
                >
                  Log Workout
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                    {recommendationState.label}
                  </p>
                  <h2 className="text-2xl font-bold">
                    {recommendationState.isPersonalized
                      ? "Recommended For You"
                      : "Popular Starter Exercises"}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-cyan-200">
                    {recommendationState.confidence}
                  </p>
                  <p className="text-sm text-gray-400">
                    {recommendationState.isPersonalized && lowVolumeMuscle
                      ? `Low-volume focus: ${lowVolumeMuscle}`
                      : "No training pattern detected yet"}
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4">
                <p className="text-sm font-semibold text-cyan-100">
                  {recommendationState.dataPeriod}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {recommendationState.isPersonalized && lowVolumeMuscle
                    ? `${lowVolumeMuscle} appears lower than your other recent muscle groups. These picks are meant to add useful volume without changing your entire plan.`
                    : "Personalized recommendations are not ready yet. Log at least two complete workouts with muscle groups, sets, reps, and RIR."}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {recommendedExercises.map((exercise) => (
                  <article
                    key={exercise.exercise}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {getExerciseClassification(exercise)} · {exercise.muscleGroup}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{exercise.exercise}</h3>
                    <p className="mt-2 text-sm text-gray-400">
                      {getRecommendationReason(
                        exercise,
                        lowVolumeMuscle,
                        recommendationState.isPersonalized
                      )}
                    </p>
                    <p className="mt-3 rounded-md bg-white/5 px-3 py-2 text-xs text-gray-400">
                      Purpose: {recommendationState.isPersonalized
                        ? "address the observed training gap"
                        : "help you build enough workout history for better insights"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseDetail(exercise)}
                        className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold hover:bg-cyan-500"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => addExerciseToWorkout(exercise.exercise)}
                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
                      >
                        Add to Workout
                      </button>
                      <button
                        type="button"
                        onClick={() => saveDiscoverExercise(exercise.exercise)}
                        className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                      >
                        {savedExerciseNames.includes(exercise.exercise) ? "Saved" : "Save"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                    Explore Exercises
                  </p>
                  <h2 className="text-2xl font-bold">{selectedGoal} Exercise Finder</h2>
                </div>
                <p className="text-sm text-gray-400">
                  Showing {visibleExercises.length} of {filteredExercises.length} matches
                </p>
              </div>

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
                <select
                  className="rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={selectedGoal}
                  onChange={(event) => setSelectedGoal(event.target.value)}
                  aria-label="Filter by goal"
                >
                  {goals.map((goal) => (
                    <option key={goal.name} value={goal.name}>
                      {goal.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={selectedMuscle}
                  onChange={(event) => setSelectedMuscle(event.target.value)}
                  aria-label="Filter by muscle"
                >
                  <option value={allMuscles}>All muscles</option>
                  {muscleGroups.map((muscleGroup) => (
                    <option key={muscleGroup} value={muscleGroup}>
                      {muscleGroup}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={selectedEquipment}
                  onChange={(event) => setSelectedEquipment(event.target.value)}
                  aria-label="Filter by equipment"
                >
                  <option value={allEquipment}>All equipment</option>
                  {equipmentOptions.map((equipment) => (
                    <option key={equipment} value={equipment}>
                      {equipment}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedMuscle(allMuscles);
                    setSelectedEquipment(allEquipment);
                  }}
                  className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>

              {filteredExercises.length === 0 ? (
                <EmptyState
                  title="No suggestions found"
                  description="Try another goal, muscle group, equipment type, or search term."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleExercises.map((exercise) => (
                    <button
                      key={exercise.exercise}
                      type="button"
                      onClick={() => setSelectedExerciseDetail(exercise)}
                      className="rounded-lg border border-gray-800 bg-gray-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-950/20"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            {exercise.muscleGroup}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold">
                            {exercise.exercise}
                          </h3>
                        </div>
                        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-gray-300">
                          {getExerciseClassification(exercise)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{exercise.target}</p>
                      <p className="mt-3 text-sm font-semibold text-green-300">
                        {exercise.defaultSets} x {exercise.defaultReps}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {activeTab !== "Exercises" && filteredExercises.length > visibleExercises.length && (
                <button
                  type="button"
                  onClick={() => setActiveTab("Exercises")}
                  className="mt-5 rounded-md bg-cyan-600 px-4 py-3 text-sm font-semibold hover:bg-cyan-500"
                >
                  Browse All {filteredExercises.length} Exercises
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                Curated Collections
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {collectionCards.map((collection) => (
                  <button
                    key={collection.title}
                    type="button"
                    onClick={() => {
                      setSelectedGoal(collection.goal);
                      setSelectedMuscle(collection.muscle);
                    }}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-400/40"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
                      {collection.goal}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{collection.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{collection.detail}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                Popular Programs
              </p>
              <div className="mt-4 space-y-3">
                {matchingSplits.map((split) => (
                  <article
                    key={split.name}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{split.name}</h3>
                        <p className="text-sm text-gray-400">
                          {split.goal} · {split.level}
                        </p>
                      </div>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-gray-300">
                        {split.tag}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-cyan-200">
                      {split.days} · {split.workouts} · {split.duration}
                    </p>
                    <p className="mt-3 text-sm text-gray-300">{split.detail}</p>
                    <div className="mt-3 space-y-2">
                      {split.sample.map((line) => (
                        <p key={line} className="text-sm text-gray-400">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGoal(split.goal)}
                        className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                      >
                        Preview Program
                      </button>
                      <Link
                        href="/programs"
                        className="rounded-md bg-fuchsia-600 px-3 py-2 text-sm font-semibold hover:bg-fuchsia-500"
                      >
                        Use This Split
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                Muscle Explorer
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {muscleGroups.slice(0, 12).map((muscleGroup) => (
                  <button
                    key={muscleGroup}
                    type="button"
                    onClick={() => setSelectedMuscle(muscleGroup)}
                    className={
                      selectedMuscle === muscleGroup
                        ? "rounded-full bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-white"
                        : "rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-white/15"
                    }
                  >
                    {muscleGroup}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {topMuscles.length > 0 ? (
                  topMuscles.map(([muscle, sets]) => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => setSelectedMuscle(muscle)}
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-3 text-left hover:border-fuchsia-400/40"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{muscle}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-gray-300">
                          {getMuscleVolumeStatus(sets)}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-gray-400">
                        {sets} sets in the last 14 days
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
                    Muscle trends appear after workouts are logged.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                Learn
              </p>
              <div className="mt-4 space-y-3">
                {learnCards.map((card) => (
                  <article
                    key={card.title}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{card.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                Challenges
              </p>
              <div className="mt-4 space-y-2">
                {challenges.map((challenge) => (
                  <article
                    key={challenge.title}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <h3 className="font-semibold">{challenge.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{challenge.detail}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-cyan-200">
                        {challenge.progress}
                      </span>
                      <button
                        type="button"
                        className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                      >
                        Join Challenge
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
        )}
      </section>

      <ExerciseDetailModal
        exercise={selectedExerciseDetail}
        onAddToWorkout={addExerciseToWorkout}
        onClose={() => setSelectedExerciseDetail(null)}
      />
    </main>
  );
}
