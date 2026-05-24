"use client";

import { useEffect, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import {
  getDeloadRecommendation,
  getExerciseAverageRir,
  getExerciseRecommendation,
  getExerciseSetEntries,
  getExerciseSetCount,
  getExerciseTopWeight,
  isWorkoutThisWeek,
  loadWorkouts,
  muscleGroups,
  summarizeExerciseSets,
  type ExerciseEntry,
  type Workout,
} from "../lib/fitnessData";
import {
  getCurrentUserId,
  loadWorkoutsFromSupabase,
} from "../lib/supabaseWorkouts";

type DayActivity = {
  label: string;
  count: number;
};

type BestLift = {
  exercise: string;
  weight: number;
  reps: string;
  sets: string;
  rir: string;
  date: string;
  estimatedOneRepMax: number;
};

type RecommendedExercise = {
  exerciseEntry: ExerciseEntry;
  date: string;
};

type RecentPr = {
  exercise: string;
  date: string;
  weight: number;
  previousWeight: number;
};

type ExerciseTrendPoint = {
  date: string;
  weight: number;
  reps: string;
  estimatedOneRepMax: number;
};

function calculateEstimatedOneRepMax(weight: number, reps: number) {
  if (!weight || !reps) {
    return 0;
  }

  return Math.round(weight * (1 + reps / 30));
}

function buildLastSevenDays(workouts: Workout[]) {
  const today = new Date();
  const days: DayActivity[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const count = workouts.filter((workout) => {
      const workoutDate = new Date(workout.dateISO);
      return workoutDate >= day && workoutDate < nextDay;
    }).length;

    days.push({
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      count,
    });
  }

  return days;
}

function calculateBestLifts(workouts: Workout[]) {
  const bestLiftMap = new Map<string, BestLift>();

  workouts.forEach((workout) => {
    workout.exercises.forEach((exerciseEntry) => {
      const exerciseName = exerciseEntry.exercise.trim();
      const topSet = getExerciseSetEntries(exerciseEntry).reduce(
        (currentBest, setEntry) =>
          Number(setEntry.weight) > Number(currentBest.weight)
            ? setEntry
            : currentBest,
        getExerciseSetEntries(exerciseEntry)[0]
      );
      const weight = Number(topSet?.weight ?? getExerciseTopWeight(exerciseEntry));
      const reps = topSet?.reps ?? exerciseEntry.reps;
      const estimatedOneRepMax = calculateEstimatedOneRepMax(weight, Number(reps));

      if (!exerciseName || Number.isNaN(weight)) {
        return;
      }

      const key = exerciseName.toLowerCase();
      const currentBest = bestLiftMap.get(key);

      if (!currentBest || weight > currentBest.weight) {
        bestLiftMap.set(key, {
          exercise: exerciseName,
          weight,
          reps,
          sets: exerciseEntry.sets,
          rir: topSet?.rir ?? exerciseEntry.rir,
          date: workout.date,
          estimatedOneRepMax,
        });
      }
    });
  });

  return Array.from(bestLiftMap.values()).sort((firstLift, secondLift) =>
    firstLift.exercise.localeCompare(secondLift.exercise)
  );
}

function getUniqueExerciseNames(workouts: Workout[]) {
  return Array.from(
    new Set(
      workouts.flatMap((workout) =>
        workout.exercises
          .map((exerciseEntry) => exerciseEntry.exercise.trim())
          .filter(Boolean)
      )
    )
  ).sort((firstExercise, secondExercise) =>
    firstExercise.localeCompare(secondExercise)
  );
}

function buildExerciseTrend(
  workouts: Workout[],
  selectedExercise: string
): ExerciseTrendPoint[] {
  if (!selectedExercise) {
    return [];
  }

  return workouts
    .slice()
    .reverse()
    .flatMap((workout) =>
      workout.exercises
        .filter(
          (exerciseEntry) =>
            exerciseEntry.exercise.toLowerCase() === selectedExercise.toLowerCase()
        )
        .map((exerciseEntry) => {
          const topSet = getExerciseSetEntries(exerciseEntry).reduce(
            (currentBest, setEntry) =>
              Number(setEntry.weight) > Number(currentBest.weight)
                ? setEntry
                : currentBest,
            getExerciseSetEntries(exerciseEntry)[0]
          );
          const weight = Number(topSet?.weight ?? 0);
          const reps = topSet?.reps ?? "0";

          return {
            date: workout.date,
            weight,
            reps,
            estimatedOneRepMax: calculateEstimatedOneRepMax(weight, Number(reps)),
          };
        })
    )
    .slice(-8);
}

function calculateWeeklyMuscleVolume(workouts: Workout[]) {
  const weeklyWorkouts = workouts.filter(isWorkoutThisWeek);
  const volumeMap = new Map<string, number>();

  muscleGroups.forEach((group) => {
    volumeMap.set(group, 0);
  });

  weeklyWorkouts.forEach((workout) => {
    workout.exercises.forEach((exerciseEntry) => {
      const group = exerciseEntry.muscleGroup || "Other";
      const sets = getExerciseSetCount(exerciseEntry);

      if (Number.isNaN(sets)) {
        return;
      }

      volumeMap.set(group, (volumeMap.get(group) ?? 0) + sets);
    });
  });

  return Array.from(volumeMap.entries())
    .map(([muscleGroup, sets]) => ({ muscleGroup, sets }))
    .filter((volume) => volume.sets > 0)
    .sort((firstVolume, secondVolume) => secondVolume.sets - firstVolume.sets);
}

function calculateRecentPrs(workouts: Workout[]) {
  const bestByExercise = new Map<string, number>();
  const prs: RecentPr[] = [];

  workouts
    .slice()
    .reverse()
    .forEach((workout) => {
      workout.exercises.forEach((exerciseEntry) => {
        const exerciseName = exerciseEntry.exercise.trim();
        const key = exerciseName.toLowerCase();
        const topWeight = getExerciseTopWeight(exerciseEntry);
        const previousBest = bestByExercise.get(key) ?? 0;

        if (!exerciseName || Number.isNaN(topWeight)) {
          return;
        }

        if (topWeight > previousBest && previousBest > 0) {
          prs.push({
            exercise: exerciseName,
            date: workout.date,
            weight: topWeight,
            previousWeight: previousBest,
          });
        }

        if (topWeight > previousBest) {
          bestByExercise.set(key, topWeight);
        }
      });
    });

  return prs.slice(-6).reverse();
}

function getVolumeStatus(sets: number) {
  if (sets >= 10 && sets <= 20) {
    return "In target range";
  }

  if (sets > 20) {
    return "High volume";
  }

  return "Build up";
}

function getRecentRecommendedExercises(workouts: Workout[]) {
  const seenExercises = new Set<string>();
  const recommendations: RecommendedExercise[] = [];

  workouts.forEach((workout) => {
    workout.exercises.forEach((exerciseEntry) => {
      const key = exerciseEntry.exercise.trim().toLowerCase();

      if (!key || seenExercises.has(key)) {
        return;
      }

      seenExercises.add(key);
      recommendations.push({
        exerciseEntry,
        date: workout.date,
      });
    });
  });

  return recommendations.slice(0, 6);
}

function getRecommendationToneClasses(tone: string) {
  if (tone === "increase") {
    return "border-green-900 bg-green-950/50 text-green-200";
  }

  if (tone === "reduce" || tone === "recover") {
    return "border-yellow-900 bg-yellow-950/40 text-yellow-200";
  }

  return "border-blue-900 bg-blue-950/40 text-blue-200";
}

function getDeloadToneClasses(tone: string) {
  if (tone === "deload") {
    return "border-red-900 bg-red-950/50 text-red-200";
  }

  if (tone === "watch") {
    return "border-yellow-900 bg-yellow-950/40 text-yellow-200";
  }

  return "border-green-900 bg-green-950/40 text-green-200";
}

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedTrendExercise, setSelectedTrendExercise] = useState("");

  useEffect(() => {
    async function loadProgressWorkouts() {
      const currentUserId = await getCurrentUserId();

      if (currentUserId) {
        try {
          setWorkouts(await loadWorkoutsFromSupabase());
        } catch {
          setWorkouts(loadWorkouts());
        }
      } else {
        setWorkouts(loadWorkouts());
      }
    }

    loadProgressWorkouts();
  }, []);

  const workoutsThisWeek = workouts.filter(isWorkoutThisWeek).length;
  const totalExercises = workouts.reduce(
    (total, workout) => total + workout.exercises.length,
    0
  );
  const lastSevenDays = buildLastSevenDays(workouts);
  const bestDay = lastSevenDays.reduce(
    (currentBest, day) => (day.count > currentBest.count ? day : currentBest),
    lastSevenDays[0] ?? { label: "None", count: 0 }
  );
  const bestLifts = calculateBestLifts(workouts);
  const recentPrs = calculateRecentPrs(workouts);
  const weeklyMuscleVolume = calculateWeeklyMuscleVolume(workouts);
  const topMuscleGroup = weeklyMuscleVolume[0];
  const recommendedExercises = getRecentRecommendedExercises(workouts);
  const deloadRecommendation = getDeloadRecommendation(workouts);
  const exerciseNames = getUniqueExerciseNames(workouts);
  const activeTrendExercise = selectedTrendExercise || exerciseNames[0] || "";
  const exerciseTrend = buildExerciseTrend(workouts, activeTrendExercise);
  const highestTrendEstimate = Math.max(
    ...exerciseTrend.map((trendPoint) => trendPoint.estimatedOneRepMax),
    1
  );

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Progress
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Weekly Progress</h1>
          <p className="text-gray-300">
            Track consistency, workout volume, and recent training activity.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">This Week</p>
            <p className="text-3xl font-bold">{workoutsThisWeek}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Total Workouts</p>
            <p className="text-3xl font-bold">{workouts.length}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Total Exercises</p>
            <p className="text-3xl font-bold">{totalExercises}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Top Muscle</p>
            <p className="text-3xl font-bold">
              {topMuscleGroup ? topMuscleGroup.muscleGroup : "None"}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <CollapsibleSection
            title="Recent PRs"
            description="Detects when a top set beats your previous best weight for that exercise."
          >
            {recentPrs.length === 0 ? (
              <p className="text-gray-400">
                Log more workouts to detect personal records.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {recentPrs.map((pr) => (
                  <div
                    key={pr.exercise + pr.date + pr.weight}
                    className="rounded-lg border border-green-900 bg-green-950/40 p-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-200">
                      New PR
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">{pr.exercise}</h3>
                    <p className="mt-2 text-sm text-gray-300">
                      {pr.weight} lbs beat your previous {pr.previousWeight} lbs on{" "}
                      {pr.date}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <CollapsibleSection title="Last 7 Days">
            <div className="space-y-3">
              {lastSevenDays.map((day) => {
                const width = day.count === 0 ? "8%" : Math.min(day.count * 25, 100) + "%";

                return (
                  <div key={day.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-300">{day.label}</span>
                      <span className="text-gray-400">
                        {day.count} {day.count === 1 ? "workout" : "workouts"}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-950">
                      <div
                        className="h-3 rounded-full bg-blue-600"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Consistency">
            <div className="space-y-4 text-gray-300">
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm text-gray-400">Most Active Day</p>
                <p className="text-2xl font-bold text-white">{bestDay.label}</p>
                <p className="text-sm text-gray-400">
                  {bestDay.count} {bestDay.count === 1 ? "workout" : "workouts"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm text-gray-400">Weekly Status</p>
                <p className="text-2xl font-bold text-white">
                  {workoutsThisWeek > 0 ? "Active" : "No workouts yet"}
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        <div className="mt-8">
        <CollapsibleSection
          title="Deload Recommendation"
          description="Looks at recent soreness, hard sets, and workout feeling."
        >
          <div
            className={
              "rounded-lg border p-5 " +
              getDeloadToneClasses(deloadRecommendation.tone)
            }
          >
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
              Recovery Status
            </p>
            <h3 className="mt-2 text-2xl font-bold">
              {deloadRecommendation.action}
            </h3>
            <p className="mt-2 text-sm opacity-90">
              {deloadRecommendation.detail}
            </p>
          </div>
        </CollapsibleSection>
        </div>

        <div className="mt-8">
        <CollapsibleSection
          title="Training Recommendations"
          description="Rule-based suggestions from RIR, pump, soreness, and sets."
        >
          {recommendedExercises.length === 0 ? (
            <p className="text-gray-400">
              Add workouts with pump, soreness, and RIR to see recommendations.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recommendedExercises.map(({ exerciseEntry, date }) => {
                const recommendation = getExerciseRecommendation(exerciseEntry);

                return (
                  <div
                    key={exerciseEntry.id}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold">{exerciseEntry.exercise}</h3>
                        <p className="text-sm text-gray-400">
                          {exerciseEntry.muscleGroup} · {date}
                        </p>
                      </div>
                      <span
                        className={
                          "rounded-md border px-2 py-1 text-xs font-semibold " +
                          getRecommendationToneClasses(recommendation.tone)
                        }
                      >
                        {recommendation.action}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300">
                      {getExerciseSetCount(exerciseEntry)} sets · avg RIR{" "}
                      {Math.round(getExerciseAverageRir(exerciseEntry) * 10) / 10} · Pump{" "}
                      {exerciseEntry.pump}/3 · Soreness {exerciseEntry.soreness}/3
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      {recommendation.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
        </div>

        <div className="mt-8">
        <CollapsibleSection
          title="Weekly Muscle Volume"
          description="Track how many working sets each muscle group got this week."
        >
          {weeklyMuscleVolume.length === 0 ? (
            <p className="text-gray-400">
              Add workouts with muscle groups to see weekly volume.
            </p>
          ) : (
            <div className="space-y-4">
              {weeklyMuscleVolume.map((volume) => {
                const width = Math.min((volume.sets / 20) * 100, 100) + "%";

                return (
                  <div
                    key={volume.muscleGroup}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold">{volume.muscleGroup}</h3>
                        <p className="text-sm text-gray-400">
                          {getVolumeStatus(volume.sets)}
                        </p>
                      </div>
                      <p className="text-2xl font-bold">{volume.sets} sets</p>
                    </div>
                    <div className="h-3 rounded-full bg-gray-900">
                      <div className="h-3 rounded-full bg-blue-600" style={{ width }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      General hypertrophy target: about 10-20 sets per muscle per week.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
        </div>

        <div className="mt-8">
        <CollapsibleSection
          title="Exercise Progress Chart"
          description="Shows the estimated 1-rep max trend for one exercise."
        >
          {exerciseNames.length === 0 ? (
            <p className="text-gray-400">
              Add a few workouts to see exercise trends.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <label htmlFor="trend-exercise" className="mb-1 block text-sm text-gray-300">
                  Exercise
                </label>
                <select
                  id="trend-exercise"
                  name="trend-exercise"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={activeTrendExercise}
                  onChange={(event) => setSelectedTrendExercise(event.target.value)}
                >
                  {exerciseNames.map((exerciseName) => (
                    <option key={exerciseName} value={exerciseName}>
                      {exerciseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {exerciseTrend.map((trendPoint) => {
                  const width =
                    Math.max(
                      (trendPoint.estimatedOneRepMax / highestTrendEstimate) * 100,
                      8
                    ) + "%";

                  return (
                    <div
                      key={trendPoint.date + trendPoint.weight + trendPoint.reps}
                      className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                    >
                      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-semibold">{trendPoint.date}</h3>
                          <p className="text-sm text-gray-400">
                            Top set: {trendPoint.weight} lbs x {trendPoint.reps}
                          </p>
                        </div>
                        <p className="text-2xl font-bold">
                          {trendPoint.estimatedOneRepMax} lb est. 1RM
                        </p>
                      </div>
                      <div className="h-3 rounded-full bg-gray-900">
                        <div className="h-3 rounded-full bg-green-500" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CollapsibleSection>
        </div>

        <div className="mt-8">
        <CollapsibleSection title="Best Lifts">
          {bestLifts.length === 0 ? (
            <p className="text-gray-400">
              Add workouts with weights to see your best lifts.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {bestLifts.map((lift) => (
                <div
                  key={lift.exercise}
                  className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                >
                  <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-semibold">{lift.exercise}</h3>
                    <p className="text-sm text-gray-400">{lift.date}</p>
                  </div>

                  <p className="text-2xl font-bold">{lift.weight} lbs</p>
                  <p className="mb-2 inline-flex rounded-md border border-green-900 bg-green-950/50 px-2 py-1 text-xs font-semibold text-green-200">
                    PR · Est. 1RM {lift.estimatedOneRepMax} lbs
                  </p>
                  <p className="text-sm text-gray-300">
                    {summarizeExerciseSets({
                      id: lift.exercise,
                      exercise: lift.exercise,
                      muscleGroup: "",
                      setEntries: [],
                      sets: lift.sets,
                      weight: String(lift.weight),
                      reps: lift.reps,
                      rir: lift.rir,
                      pump: "0",
                      soreness: "0",
                      didPartials: false,
                      notes: "",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
