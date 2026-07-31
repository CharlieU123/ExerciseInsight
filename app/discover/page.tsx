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
    rating: "4.9",
    tag: "Sample split",
    detail: "Best when users want muscle-group focus and repeatable weekly volume.",
    sample: ["Push: chest, shoulders, triceps", "Pull: back, biceps", "Legs: quads, hamstrings, glutes"],
  },
  {
    name: "Upper/Lower",
    goal: "Strength",
    days: "4 days/week",
    rating: "4.8",
    tag: "Balanced plan",
    detail: "A clean blend of practice frequency, recovery, and compound lift progress.",
    sample: ["Upper: press and row", "Lower: squat and hinge", "Repeat with variations"],
  },
  {
    name: "Full Body EOD",
    goal: "Beginner",
    days: "3-4 days/week",
    rating: "4.7",
    tag: "Beginner friendly",
    detail: "Simple rhythm for learning movements while keeping recovery days built in.",
    sample: ["Full body session", "Rest day", "Full body session"],
  },
  {
    name: "Powerbuilding 5-Day",
    goal: "Strength",
    days: "5 days/week",
    rating: "4.9",
    tag: "Advanced template",
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
    title: "How To Progressive Overload",
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
    title: "How Much Volume?",
    detail: "Most muscles grow best when weekly hard sets rise gradually.",
  },
];

const challenges = [
  "30 Day Bench Consistency",
  "100 Pull-Up Progression",
  "Four Week Leg Volume Build",
  "Three Day Full Body Streak",
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
  const totals = getMuscleSetTotals(workouts.slice(0, 12));
  const trainedMuscles = muscleGroups.filter((muscle) => muscle !== "Other");

  if (Object.keys(totals).length === 0) {
    return "Back";
  }

  return trainedMuscles.reduce((lowestMuscle, muscle) =>
    (totals[muscle] ?? 0) < (totals[lowestMuscle] ?? 0) ? muscle : lowestMuscle
  );
}

function getTopMuscles(workouts: Workout[]) {
  const totals = getMuscleSetTotals(workouts.slice(0, 12));

  return Object.entries(totals)
    .sort((firstMuscle, secondMuscle) => secondMuscle[1] - firstMuscle[1])
    .slice(0, 4);
}

function getRecommendationReason(exercise: ExerciseLibraryItem, lowVolumeMuscle: string) {
  if (exercise.muscleGroup === lowVolumeMuscle) {
    return `${lowVolumeMuscle} volume has room to grow based on recent logs.`;
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
  const activeGoal = goalsData.find((goal) => goal.status === "Active") ?? goalsData[0];
  const currentProgram = programs[0];

  if (workouts.length === 0) {
    return {
      title: "Start with useful data",
      detail:
        "Log one full workout with sets, reps, RIR, pump, and soreness. Discover will turn that into smarter exercise and split recommendations.",
    };
  }

  if (activeGoal) {
    return {
      title: `Today's insight for ${activeGoal.title}`,
      detail: `${lowVolumeMuscle} is your lowest-volume area recently. Add one targeted exercise or choose a split that gives it another weekly touch.`,
    };
  }

  if (currentProgram) {
    return {
      title: `Today's insight for ${currentProgram.name}`,
      detail: `${lowVolumeMuscle} has been trained less than your other muscle groups. Consider adding one accessory movement to the next matching day.`,
    };
  }

  return {
    title: "Today's insight",
    detail: `${lowVolumeMuscle} is your lowest-volume area recently. Discover found exercises that can help bring it up without rebuilding your whole plan.`,
  };
}

export default function DiscoverPage() {
  const [selectedGoal, setSelectedGoal] = useState(goals[0].name);
  const [selectedMuscle, setSelectedMuscle] = useState(allMuscles);
  const [selectedEquipment, setSelectedEquipment] = useState(allEquipment);
  const [searchTerm, setSearchTerm] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goalsData, setGoalsData] = useState<FitnessGoal[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedExerciseDetail, setSelectedExerciseDetail] =
    useState<ExerciseLibraryItem | null>(null);

  useEffect(() => {
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
    () =>
      exerciseLibrary
        .filter((exercise) => exercise.muscleGroup === lowVolumeMuscle)
        .filter((exercise) => matchesGoal(exercise, selectedGoal))
        .slice(0, 3),
    [lowVolumeMuscle, selectedGoal]
  );
  const selectedGoalDetails = goals.find((goal) => goal.name === selectedGoal) ?? goals[0];
  const matchingSplits = splitRecommendations.filter(
    (split) => split.goal === selectedGoal || splitTypes.includes(split.name)
  );
  const collectionCards = collections.filter(
    (collection) =>
      collection.goal === selectedGoal ||
      selectedMuscle === allMuscles ||
      collection.muscle === selectedMuscle
  );

  function addExerciseToWorkout(exerciseName: string) {
    window.location.href = `/add-workout?exercise=${encodeURIComponent(exerciseName)}`;
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

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-950/20 p-5 shadow-xl shadow-fuchsia-950/20">
              <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
                Today&apos;s Insight
              </p>
              <h2 className="mt-2 text-2xl font-bold">{todayInsight.title}</h2>
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
                    Recommended For You
                  </p>
                  <h2 className="text-2xl font-bold">Based on recent training</h2>
                </div>
                <p className="text-sm text-gray-400">Low-volume focus: {lowVolumeMuscle}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {recommendedExercises.map((exercise) => (
                  <button
                    key={exercise.exercise}
                    type="button"
                    onClick={() => setSelectedExerciseDetail(exercise)}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/40"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {exercise.muscleGroup}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{exercise.exercise}</h3>
                    <p className="mt-2 text-sm text-gray-400">
                      {getRecommendationReason(exercise, lowVolumeMuscle)}
                    </p>
                  </button>
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
                  Showing {filteredExercises.length} matches
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
                  {filteredExercises.map((exercise) => (
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
                          {exercise.movement ?? "Strength"}
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
            </section>

            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                AI Collections
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
                        <p className="text-sm text-gray-400">{split.days}</p>
                      </div>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-gray-300">
                        {split.rating} · {split.tag}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-300">{split.detail}</p>
                    <div className="mt-3 space-y-2">
                      {split.sample.map((line) => (
                        <p key={line} className="text-sm text-gray-400">
                          {line}
                        </p>
                      ))}
                    </div>
                    <Link
                      href="/programs"
                      className="mt-4 inline-flex rounded-md bg-fuchsia-600 px-3 py-2 text-sm font-semibold hover:bg-fuchsia-500"
                    >
                      Build This Split
                    </Link>
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
                    <div
                      key={muscle}
                      className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-3 py-2"
                    >
                      <span className="font-semibold">{muscle}</span>
                      <span className="text-sm text-gray-400">{sets} recent sets</span>
                    </div>
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
                  <p
                    key={challenge}
                    className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm font-semibold"
                  >
                    {challenge}
                  </p>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <ExerciseDetailModal
        exercise={selectedExerciseDetail}
        onAddToWorkout={addExerciseToWorkout}
        onClose={() => setSelectedExerciseDetail(null)}
      />
    </main>
  );
}
