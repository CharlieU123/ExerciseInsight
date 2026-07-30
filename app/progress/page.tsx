"use client";

import { useEffect, useMemo, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { SorenessHeatmap } from "../components/SorenessHeatmap";
import {
  getDeloadRecommendation,
  getExerciseAverageRir,
  getExerciseRecommendation,
  getExerciseSetEntries,
  getExerciseSetCount,
  getExerciseTopWeight,
  getProgramDays,
  isWorkoutThisWeek,
  loadTrainingPrograms,
  loadWorkouts,
  muscleGroups,
  summarizeExerciseSets,
  type ExerciseEntry,
  type TrainingProgram,
  type Workout,
} from "../lib/fitnessData";
import { loadProgramsFromSupabase } from "../lib/supabasePlanning";
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

type MonthlyRecap = {
  monthName: string;
  workouts: number;
  exercises: number;
  sets: number;
  uniqueExercises: number;
  topExercise: string;
  bestEstimatedOneRepMax: number;
};

type AdvancedProgress = {
  currentWeekVolume: number;
  previousWeekVolume: number;
  volumeChangePercent: number;
  currentStreak: number;
  averageRir: number;
  mostTrainedMuscle: string;
  muscleBalance: {
    muscleGroup: string;
    sets: number;
    percent: number;
  }[];
};

type ProgressTab = "Strength" | "Volume" | "Reps" | "Bodyweight";
type DateRangeFilter = "30" | "90" | "all";
type TrendMode = "raw" | "smooth";

type BodyweightLog = {
  id: number;
  date: string;
  weight: string;
};

type ChartPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

type ExerciseMetricSummary = {
  estimatedOneRepMax: number;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  weeklyHardSets: number;
  exerciseFrequency: number;
};

type WorkoutCalendarDay = {
  dateKey: string;
  dayNumber: number;
  weekday: number;
  isToday: boolean;
  isFuture: boolean;
  isPlanned: boolean;
  hasPr: boolean;
  workouts: Workout[];
  workoutType: string;
  status: "completed" | "skipped" | "recovery" | "future";
};

const progressTabs: ProgressTab[] = ["Strength", "Volume", "Reps", "Bodyweight"];
const bodyweightLogsKey = "exerciseinsight-bodyweight-logs";
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calculateEstimatedOneRepMax(weight: number, reps: number) {
  if (!weight || !reps) {
    return 0;
  }

  return Math.round(weight * (1 + reps / 30));
}

function formatShortDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function filterWorkoutsByDateRange(workouts: Workout[], dateRange: DateRangeFilter) {
  if (dateRange === "all") {
    return workouts;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(dateRange));
  cutoff.setHours(0, 0, 0, 0);

  return workouts.filter((workout) => getWorkoutTime(workout) >= cutoff.getTime());
}

function smoothChartPoints(points: ChartPoint[]) {
  return points.map((point, index) => {
    const previousPoint = points[index - 1];
    const nextPoint = points[index + 1];
    const nearbyValues = [previousPoint?.value, point.value, nextPoint?.value].filter(
      (value): value is number => typeof value === "number"
    );

    return {
      ...point,
      value:
        Math.round(
          (nearbyValues.reduce((total, value) => total + value, 0) /
            nearbyValues.length) *
            10
        ) / 10,
    };
  });
}

function getDisplayPoints(points: ChartPoint[], trendMode: TrendMode) {
  return trendMode === "smooth" ? smoothChartPoints(points) : points;
}

function calculateSetVolume(weight: string, reps: string) {
  const parsedWeight = Number(weight);
  const parsedReps = Number(reps);

  if (Number.isNaN(parsedWeight) || Number.isNaN(parsedReps)) {
    return 0;
  }

  return parsedWeight * parsedReps;
}

function getSelectedExerciseEntries(workouts: Workout[], selectedExercise: string) {
  const normalizedExerciseName = selectedExercise.toLowerCase();

  return workouts
    .slice()
    .reverse()
    .flatMap((workout) =>
      workout.exercises
        .filter(
          (exerciseEntry) =>
            exerciseEntry.exercise.trim().toLowerCase() === normalizedExerciseName
        )
        .map((exerciseEntry) => ({
          workout,
          exerciseEntry,
        }))
    );
}

function buildStrengthChartPoints(
  workouts: Workout[],
  selectedExercise: string
): ChartPoint[] {
  return getSelectedExerciseEntries(workouts, selectedExercise).map(
    ({ workout, exerciseEntry }) => {
      const bestSet = getExerciseSetEntries(exerciseEntry).reduce(
        (currentBest, setEntry) => {
          const currentEstimate = calculateEstimatedOneRepMax(
            Number(currentBest.weight),
            Number(currentBest.reps)
          );
          const nextEstimate = calculateEstimatedOneRepMax(
            Number(setEntry.weight),
            Number(setEntry.reps)
          );

          return nextEstimate > currentEstimate ? setEntry : currentBest;
        },
        getExerciseSetEntries(exerciseEntry)[0]
      );

      return {
        label: formatShortDate(workout.dateISO),
        value: calculateEstimatedOneRepMax(
          Number(bestSet?.weight ?? 0),
          Number(bestSet?.reps ?? 0)
        ),
        secondaryValue: Number(bestSet?.weight ?? 0),
      };
    }
  );
}

function buildRepsChartPoints(
  workouts: Workout[],
  selectedExercise: string
): ChartPoint[] {
  return getSelectedExerciseEntries(workouts, selectedExercise).map(
    ({ workout, exerciseEntry }) => ({
      label: formatShortDate(workout.dateISO),
      value: Math.max(
        ...getExerciseSetEntries(exerciseEntry).map((setEntry) =>
          Number(setEntry.reps)
        ),
        0
      ),
      secondaryValue: getExerciseSetCount(exerciseEntry),
    })
  );
}

function buildVolumeChartPoints(workouts: Workout[]): ChartPoint[] {
  return workouts
    .slice()
    .reverse()
    .map((workout) => {
      const workoutVolume = workout.exercises.reduce(
        (workoutTotal, exerciseEntry) =>
          workoutTotal +
          getExerciseSetEntries(exerciseEntry).reduce(
            (exerciseTotal, setEntry) =>
              exerciseTotal + calculateSetVolume(setEntry.weight, setEntry.reps),
            0
          ),
        0
      );
      const hardSets = workout.exercises.reduce(
        (workoutTotal, exerciseEntry) =>
          workoutTotal +
          getExerciseSetEntries(exerciseEntry).filter(
            (setEntry) => Number(setEntry.rir) <= 2
          ).length,
        0
      );

      return {
        label: formatShortDate(workout.dateISO),
        value: workoutVolume,
        secondaryValue: hardSets,
      };
    });
}

function buildBodyweightChartPoints(bodyweightLogs: BodyweightLog[]): ChartPoint[] {
  return bodyweightLogs
    .slice()
    .sort((firstLog, secondLog) => firstLog.date.localeCompare(secondLog.date))
    .map((log) => ({
      label: formatShortDate(log.date + "T12:00:00"),
      value: Number(log.weight),
    }))
    .filter((point) => !Number.isNaN(point.value));
}

function calculateExerciseMetricSummary(
  workouts: Workout[],
  selectedExercise: string
): ExerciseMetricSummary {
  const selectedEntries = getSelectedExerciseEntries(workouts, selectedExercise);
  let estimatedOneRepMax = 0;
  let bestWeight = 0;
  let bestReps = 0;
  let totalVolume = 0;
  let weeklyHardSets = 0;

  selectedEntries.forEach(({ workout, exerciseEntry }) => {
    getExerciseSetEntries(exerciseEntry).forEach((setEntry) => {
      const weight = Number(setEntry.weight);
      const reps = Number(setEntry.reps);
      const estimatedMax = calculateEstimatedOneRepMax(weight, reps);

      estimatedOneRepMax = Math.max(estimatedOneRepMax, estimatedMax);
      bestWeight = Math.max(bestWeight, Number.isNaN(weight) ? 0 : weight);
      bestReps = Math.max(bestReps, Number.isNaN(reps) ? 0 : reps);
      totalVolume += calculateSetVolume(setEntry.weight, setEntry.reps);

      if (isWorkoutThisWeek(workout) && Number(setEntry.rir) <= 2) {
        weeklyHardSets += 1;
      }
    });
  });

  return {
    estimatedOneRepMax,
    bestWeight,
    bestReps,
    totalVolume,
    weeklyHardSets,
    exerciseFrequency: selectedEntries.length,
  };
}

function calculateTotalVolume(workouts: Workout[]) {
  return buildVolumeChartPoints(workouts).reduce(
    (total, point) => total + point.value,
    0
  );
}

function calculateWeeklyHardSets(workouts: Workout[]) {
  return workouts
    .filter(isWorkoutThisWeek)
    .reduce(
      (workoutTotal, workout) =>
        workoutTotal +
        workout.exercises.reduce(
          (exerciseTotal, exerciseEntry) =>
            exerciseTotal +
            getExerciseSetEntries(exerciseEntry).filter(
              (setEntry) => Number(setEntry.rir) <= 2
            ).length,
          0
        ),
      0
    );
}

function SimpleLineChart({
  points,
  unit,
}: {
  points: ChartPoint[];
  unit: string;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-6 text-center text-sm text-gray-400">
        No chart data yet.
      </div>
    );
  }

  const chartWidth = 640;
  const chartHeight = 240;
  const padding = 28;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const valueRange = Math.max(maxValue - minValue, 1);
  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? chartWidth / 2
        : padding +
          (index / (points.length - 1)) * (chartWidth - padding * 2);
    const y =
      chartHeight -
      padding -
      ((point.value - minValue) / valueRange) * (chartHeight - padding * 2);

    return { x, y, point };
  });
  const pathData = coordinates
    .map((coordinate, index) =>
      `${index === 0 ? "M" : "L"} ${coordinate.x} ${coordinate.y}`
    )
    .join(" ");

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
      <svg
        className="h-64 w-full overflow-visible"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`Progress chart in ${unit}`}
      >
        <line
          x1={padding}
          x2={chartWidth - padding}
          y1={chartHeight - padding}
          y2={chartHeight - padding}
          className="stroke-gray-800"
          strokeWidth="2"
        />
        <line
          x1={padding}
          x2={padding}
          y1={padding}
          y2={chartHeight - padding}
          className="stroke-gray-800"
          strokeWidth="2"
        />
        <path
          d={pathData}
          className="fill-none stroke-blue-500"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {coordinates.map(({ x, y, point }) => (
          <g key={point.label + point.value + x}>
            <circle cx={x} cy={y} r="5" className="fill-blue-400" />
            <text
              x={x}
              y={Math.max(y - 12, 14)}
              textAnchor="middle"
              className="fill-gray-300 text-[12px] font-semibold"
            >
              {point.value.toLocaleString()} {unit}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {points.slice(-4).map((point) => (
          <div
            key={point.label + point.value}
            className="rounded-md border border-gray-800 bg-gray-900/70 p-3"
          >
            <p className="text-xs text-gray-400">{point.label}</p>
            <p className="font-semibold">
              {point.value.toLocaleString()} {unit}
            </p>
            {typeof point.secondaryValue === "number" && (
              <p className="text-xs text-gray-500">
                Secondary: {point.secondaryValue.toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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

function getWorkoutTime(workout: Workout) {
  return new Date(workout.dateISO || workout.date).getTime();
}

function calculateWorkoutSetVolume(workout: Workout) {
  return workout.exercises.reduce(
    (total, exerciseEntry) => total + getExerciseSetCount(exerciseEntry),
    0
  );
}

function calculateMonthlyRecap(workouts: Workout[]): MonthlyRecap {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthWorkouts = workouts.filter((workout) => {
    const workoutTime = getWorkoutTime(workout);
    return workoutTime >= monthStart.getTime() && workoutTime < nextMonth.getTime();
  });
  const exerciseCounts = new Map<string, number>();
  let bestEstimatedOneRepMax = 0;

  monthWorkouts.forEach((workout) => {
    workout.exercises.forEach((exerciseEntry) => {
      const exerciseName = exerciseEntry.exercise.trim();
      exerciseCounts.set(exerciseName, (exerciseCounts.get(exerciseName) ?? 0) + 1);

      getExerciseSetEntries(exerciseEntry).forEach((setEntry) => {
        const estimatedOneRepMax = calculateEstimatedOneRepMax(
          Number(setEntry.weight),
          Number(setEntry.reps)
        );
        bestEstimatedOneRepMax = Math.max(bestEstimatedOneRepMax, estimatedOneRepMax);
      });
    });
  });

  const topExercise =
    Array.from(exerciseCounts.entries()).sort(
      (firstExercise, secondExercise) => secondExercise[1] - firstExercise[1]
    )[0]?.[0] ?? "None yet";

  return {
    monthName: now.toLocaleDateString(undefined, { month: "long" }),
    workouts: monthWorkouts.length,
    exercises: monthWorkouts.reduce(
      (total, workout) => total + workout.exercises.length,
      0
    ),
    sets: monthWorkouts.reduce(
      (total, workout) =>
        total +
        workout.exercises.reduce(
          (exerciseTotal, exerciseEntry) =>
            exerciseTotal + getExerciseSetCount(exerciseEntry),
          0
        ),
      0
    ),
    uniqueExercises: exerciseCounts.size,
    topExercise,
    bestEstimatedOneRepMax,
  };
}

function calculateWeekRange(offset: number) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  start.setDate(now.getDate() - distanceFromMonday + offset * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

function calculateVolumeForWeek(workouts: Workout[], offset: number) {
  const { start, end } = calculateWeekRange(offset);

  return workouts
    .filter((workout) => {
      const workoutTime = getWorkoutTime(workout);
      return workoutTime >= start.getTime() && workoutTime < end.getTime();
    })
    .reduce((total, workout) => total + calculateWorkoutSetVolume(workout), 0);
}

function calculateCurrentStreak(workouts: Workout[]) {
  const workoutDays = new Set(
    workouts.map((workout) => new Date(getWorkoutTime(workout)).toDateString())
  );
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < 30; index += 1) {
    if (workoutDays.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (index === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

function calculateAdvancedProgress(workouts: Workout[]): AdvancedProgress {
  const currentWeekVolume = calculateVolumeForWeek(workouts, 0);
  const previousWeekVolume = calculateVolumeForWeek(workouts, -1);
  const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const muscleSets = new Map<string, number>();
  const recentRirs: number[] = [];

  workouts
    .filter((workout) => getWorkoutTime(workout) >= recentCutoff)
    .forEach((workout) => {
      workout.exercises.forEach((exerciseEntry) => {
        const group = exerciseEntry.muscleGroup || "Other";
        muscleSets.set(group, (muscleSets.get(group) ?? 0) + getExerciseSetCount(exerciseEntry));
        getExerciseSetEntries(exerciseEntry).forEach((setEntry) => {
          const rir = Number(setEntry.rir);
          if (!Number.isNaN(rir)) {
            recentRirs.push(rir);
          }
        });
      });
    });

  const totalSets = Array.from(muscleSets.values()).reduce(
    (total, sets) => total + sets,
    0
  );
  const muscleBalance = Array.from(muscleSets.entries())
    .map(([muscleGroup, sets]) => ({
      muscleGroup,
      sets,
      percent: totalSets ? Math.round((sets / totalSets) * 100) : 0,
    }))
    .sort((firstGroup, secondGroup) => secondGroup.sets - firstGroup.sets);
  const mostTrainedMuscle = muscleBalance[0]?.muscleGroup ?? "None yet";
  const volumeChangePercent = previousWeekVolume
    ? Math.round(((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100)
    : currentWeekVolume > 0
      ? 100
      : 0;

  return {
    currentWeekVolume,
    previousWeekVolume,
    volumeChangePercent,
    currentStreak: calculateCurrentStreak(workouts),
    averageRir: recentRirs.length
      ? Math.round(
          (recentRirs.reduce((total, rir) => total + rir, 0) / recentRirs.length) *
            10
        ) / 10
      : 0,
    mostTrainedMuscle,
    muscleBalance,
  };
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

function buildPrDateKeys(workouts: Workout[]) {
  const bestByExercise = new Map<string, number>();
  const prDateKeys = new Set<string>();

  workouts
    .slice()
    .reverse()
    .forEach((workout) => {
      workout.exercises.forEach((exerciseEntry) => {
        const exerciseName = exerciseEntry.exercise.trim().toLowerCase();
        const topWeight = getExerciseTopWeight(exerciseEntry);
        const previousBest = bestByExercise.get(exerciseName) ?? 0;

        if (!exerciseName || Number.isNaN(topWeight)) {
          return;
        }

        if (topWeight > previousBest && previousBest > 0) {
          prDateKeys.add(getDateKey(new Date(getWorkoutTime(workout))));
        }

        if (topWeight > previousBest) {
          bestByExercise.set(exerciseName, topWeight);
        }
      });
    });

  return prDateKeys;
}

function getWorkoutType(workout: Workout) {
  const programDayMatch = workout.notes.match(/Started from .+ - ([^.]+)\./);

  if (programDayMatch?.[1]) {
    return programDayMatch[1];
  }

  const muscleCounts = new Map<string, number>();

  workout.exercises.forEach((exerciseEntry) => {
    muscleCounts.set(
      exerciseEntry.muscleGroup,
      (muscleCounts.get(exerciseEntry.muscleGroup) ?? 0) + 1
    );
  });

  return (
    Array.from(muscleCounts.entries()).sort(
      (firstGroup, secondGroup) => secondGroup[1] - firstGroup[1]
    )[0]?.[0] ?? "Workout"
  );
}

function getEstimatedPlannedWeekdays(programs: TrainingProgram[]) {
  const activeProgram = programs[0];

  if (!activeProgram) {
    return new Set<number>();
  }

  const programDays = getProgramDays(activeProgram);
  const trainingDayCount =
    programDays.filter((day) => !day.isRestDay && day.exercises.length > 0).length ||
    Number(activeProgram.daysPerWeek) ||
    0;
  const plannedPatterns: Record<number, number[]> = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };

  return new Set(plannedPatterns[Math.min(Math.max(trainingDayCount, 0), 7)] ?? []);
}

function buildWorkoutCalendar(workouts: Workout[], programs: TrainingProgram[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const plannedWeekdays = getEstimatedPlannedWeekdays(programs);
  const prDateKeys = buildPrDateKeys(workouts);
  const workoutsByDate = new Map<string, Workout[]>();

  workouts.forEach((workout) => {
    const dateKey = getDateKey(new Date(getWorkoutTime(workout)));
    workoutsByDate.set(dateKey, [...(workoutsByDate.get(dateKey) ?? []), workout]);
  });

  const leadingEmptyDays = Array.from({ length: monthStart.getDay() }, () => null);
  const calendarDays: WorkoutCalendarDay[] = [];

  for (let dayNumber = 1; dayNumber <= monthEnd.getDate(); dayNumber += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), dayNumber);
    const dateKey = getDateKey(date);
    const dayWorkouts = workoutsByDate.get(dateKey) ?? [];
    const isFuture = date.getTime() > new Date().setHours(23, 59, 59, 999);
    const isPlanned = plannedWeekdays.has(date.getDay());
    const hasPr = prDateKeys.has(dateKey);
    const status =
      dayWorkouts.length > 0
        ? "completed"
        : isFuture
          ? "future"
          : isPlanned
            ? "skipped"
            : "recovery";

    calendarDays.push({
      dateKey,
      dayNumber,
      weekday: date.getDay(),
      isToday: dateKey === getDateKey(now),
      isFuture,
      isPlanned,
      hasPr,
      workouts: dayWorkouts,
      workoutType: dayWorkouts[0] ? getWorkoutType(dayWorkouts[0]) : "",
      status,
    });
  }

  return {
    monthName: now.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    days: [...leadingEmptyDays, ...calendarDays],
  };
}

function getCalendarDayClasses(day: WorkoutCalendarDay) {
  if (day.status === "completed" && day.hasPr) {
    return "border-green-400/50 bg-green-500/20 shadow-[0_0_22px_rgba(34,197,94,0.18)]";
  }

  if (day.status === "completed") {
    return "border-blue-400/40 bg-blue-500/15";
  }

  if (day.status === "skipped") {
    return "border-yellow-400/40 bg-yellow-500/10";
  }

  if (day.status === "recovery") {
    return "border-cyan-400/20 bg-cyan-500/10";
  }

  return "border-gray-800 bg-gray-950/60 opacity-70";
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
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedTrendExercise, setSelectedTrendExercise] = useState("");
  const [selectedProgressTab, setSelectedProgressTab] =
    useState<ProgressTab>("Strength");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("90");
  const [trendMode, setTrendMode] = useState<TrendMode>("raw");
  const [bodyweightLogs, setBodyweightLogs] = useState<BodyweightLog[]>([]);
  const [bodyweightDate, setBodyweightDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [bodyweightValue, setBodyweightValue] = useState("");

  useEffect(() => {
    async function loadProgressWorkouts() {
      const currentUserId = await getCurrentUserId();

      if (currentUserId) {
        try {
          const [savedWorkouts, savedPrograms] = await Promise.all([
            loadWorkoutsFromSupabase(),
            loadProgramsFromSupabase(),
          ]);
          setWorkouts(savedWorkouts);
          setPrograms(savedPrograms);
        } catch {
          setWorkouts(loadWorkouts());
          setPrograms(loadTrainingPrograms());
        }
      } else {
        setWorkouts(loadWorkouts());
        setPrograms(loadTrainingPrograms());
      }
    }

    loadProgressWorkouts();
  }, []);

  useEffect(() => {
    const savedLogs = localStorage.getItem(bodyweightLogsKey);

    if (!savedLogs) {
      return;
    }

    try {
      const parsedLogs = JSON.parse(savedLogs) as BodyweightLog[];
      setBodyweightLogs(Array.isArray(parsedLogs) ? parsedLogs : []);
    } catch {
      localStorage.removeItem(bodyweightLogsKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(bodyweightLogsKey, JSON.stringify(bodyweightLogs));
  }, [bodyweightLogs]);

  function addBodyweightLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bodyweightDate || !bodyweightValue) {
      return;
    }

    setBodyweightLogs((currentLogs) =>
      [
        ...currentLogs.filter((log) => log.date !== bodyweightDate),
        {
          id: Date.now(),
          date: bodyweightDate,
          weight: bodyweightValue,
        },
      ].sort((firstLog, secondLog) => secondLog.date.localeCompare(firstLog.date))
    );
    setBodyweightValue("");
  }

  function deleteBodyweightLog(id: number) {
    setBodyweightLogs((currentLogs) =>
      currentLogs.filter((log) => log.id !== id)
    );
  }

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
  const filteredWorkouts = useMemo(
    () => filterWorkoutsByDateRange(workouts, dateRangeFilter),
    [dateRangeFilter, workouts]
  );
  const exerciseMetricSummary = calculateExerciseMetricSummary(
    filteredWorkouts,
    activeTrendExercise
  );
  const strengthChartPoints = getDisplayPoints(
    buildStrengthChartPoints(filteredWorkouts, activeTrendExercise),
    trendMode
  );
  const repsChartPoints = getDisplayPoints(
    buildRepsChartPoints(filteredWorkouts, activeTrendExercise),
    trendMode
  );
  const volumeChartPoints = getDisplayPoints(
    buildVolumeChartPoints(filteredWorkouts),
    trendMode
  );
  const bodyweightChartPoints = getDisplayPoints(
    buildBodyweightChartPoints(bodyweightLogs),
    trendMode
  );
  const filteredTotalVolume = calculateTotalVolume(filteredWorkouts);
  const filteredWeeklyHardSets = calculateWeeklyHardSets(filteredWorkouts);
  const exerciseTrend = buildExerciseTrend(workouts, activeTrendExercise);
  const monthlyRecap = calculateMonthlyRecap(workouts);
  const workoutCalendar = buildWorkoutCalendar(workouts, programs);
  const advancedProgress = calculateAdvancedProgress(workouts);
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
            Track consistency, set volume, and recent training activity.
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
            title="Progress Analytics"
            description="Separate views for strength, volume, reps, and bodyweight trends."
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-2 sm:grid-cols-4">
                  {progressTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedProgressTab(tab)}
                      className={
                        "rounded-md px-4 py-3 text-sm font-semibold " +
                        (selectedProgressTab === tab
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700")
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedProgressTab !== "Bodyweight" && (
                    <div>
                      <label
                        htmlFor="analytics-exercise"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400"
                      >
                        Exercise
                      </label>
                      <select
                        id="analytics-exercise"
                        className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                        value={activeTrendExercise}
                        onChange={(event) =>
                          setSelectedTrendExercise(event.target.value)
                        }
                      >
                        {exerciseNames.length === 0 ? (
                          <option value="">No exercises yet</option>
                        ) : (
                          exerciseNames.map((exerciseName) => (
                            <option key={exerciseName} value={exerciseName}>
                              {exerciseName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="analytics-date-range"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      Date Range
                    </label>
                    <select
                      id="analytics-date-range"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={dateRangeFilter}
                      onChange={(event) =>
                        setDateRangeFilter(event.target.value as DateRangeFilter)
                      }
                    >
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="all">All time</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="analytics-trend-mode"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      Trend
                    </label>
                    <select
                      id="analytics-trend-mode"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={trendMode}
                      onChange={(event) =>
                        setTrendMode(event.target.value as TrendMode)
                      }
                    >
                      <option value="raw">Raw data</option>
                      <option value="smooth">Smoothed trend</option>
                    </select>
                  </div>
                </div>
              </div>

              {selectedProgressTab === "Strength" && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Estimated 1RM</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.estimatedOneRepMax} lbs
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Best Weight</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.bestWeight} lbs
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Frequency</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.exerciseFrequency}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Hard Sets This Week</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.weeklyHardSets}
                      </p>
                    </div>
                  </div>
                  <SimpleLineChart points={strengthChartPoints} unit="lb" />
                </div>
              )}

              {selectedProgressTab === "Volume" && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Total Volume</p>
                      <p className="text-3xl font-bold">
                        {filteredTotalVolume.toLocaleString()} lbs
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Weekly Hard Sets</p>
                      <p className="text-3xl font-bold">{filteredWeeklyHardSets}</p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Workouts In Range</p>
                      <p className="text-3xl font-bold">{filteredWorkouts.length}</p>
                    </div>
                  </div>
                  <SimpleLineChart points={volumeChartPoints} unit="lbs" />
                  <p className="text-sm text-gray-500">
                    Secondary values below the chart are hard sets, counted as RIR 0-2.
                  </p>
                </div>
              )}

              {selectedProgressTab === "Reps" && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Best Rep Performance</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.bestReps} reps
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Total Volume</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.totalVolume.toLocaleString()} lbs
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Exercise Frequency</p>
                      <p className="text-3xl font-bold">
                        {exerciseMetricSummary.exerciseFrequency}
                      </p>
                    </div>
                  </div>
                  <SimpleLineChart points={repsChartPoints} unit="reps" />
                  <p className="text-sm text-gray-500">
                    Secondary values below the chart are sets completed in that session.
                  </p>
                </div>
              )}

              {selectedProgressTab === "Bodyweight" && (
                <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                  <div className="space-y-4">
                    <form
                      onSubmit={addBodyweightLog}
                      className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                    >
                      <h3 className="text-lg font-semibold">Log Bodyweight</h3>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label
                            htmlFor="bodyweight-date"
                            className="mb-1 block text-sm text-gray-300"
                          >
                            Date
                          </label>
                          <input
                            id="bodyweight-date"
                            className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                            type="date"
                            value={bodyweightDate}
                            onChange={(event) =>
                              setBodyweightDate(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="bodyweight-value"
                            className="mb-1 block text-sm text-gray-300"
                          >
                            Bodyweight
                          </label>
                          <input
                            id="bodyweight-value"
                            className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                            type="number"
                            min="0"
                            step="0.1"
                            value={bodyweightValue}
                            onChange={(event) =>
                              setBodyweightValue(event.target.value)
                            }
                            placeholder="185.4"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full rounded-md bg-blue-600 p-3 font-semibold hover:bg-blue-500"
                        >
                          Save Bodyweight
                        </button>
                      </div>
                    </form>

                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="text-sm text-gray-400">Latest Bodyweight</p>
                      <p className="text-3xl font-bold">
                        {bodyweightLogs[0]?.weight
                          ? `${bodyweightLogs[0].weight} lbs`
                          : "No data"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SimpleLineChart points={bodyweightChartPoints} unit="lbs" />
                    {bodyweightLogs.length > 0 && (
                      <div className="space-y-2">
                        {bodyweightLogs.slice(0, 5).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-gray-800 bg-gray-950 p-3"
                          >
                            <div>
                              <p className="font-semibold">{log.weight} lbs</p>
                              <p className="text-sm text-gray-400">{log.date}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteBodyweightLog(log.id)}
                              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>

        <div className="mb-8">
          <CollapsibleSection
            title="Monthly Recap"
            description={`A quick summary of your ${monthlyRecap.monthName} training.`}
          >
            {monthlyRecap.workouts === 0 ? (
              <p className="text-gray-400">
                Log a workout this month to generate your monthly recap.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm text-gray-400">Workouts</p>
                    <p className="text-3xl font-bold">{monthlyRecap.workouts}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm text-gray-400">Working Sets</p>
                    <p className="text-3xl font-bold">{monthlyRecap.sets}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm text-gray-400">Set Volume</p>
                    <p className="text-3xl font-bold">
                      {monthlyRecap.sets.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm text-gray-400">Exercises</p>
                    <p className="text-3xl font-bold">
                      {monthlyRecap.uniqueExercises}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4">
                    <p className="text-sm text-cyan-200">Most Logged Exercise</p>
                    <p className="mt-1 text-2xl font-bold">
                      {monthlyRecap.topExercise}
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                    <p className="text-sm text-green-200">Best Estimated 1RM</p>
                    <p className="mt-1 text-2xl font-bold">
                      {monthlyRecap.bestEstimatedOneRepMax} lbs
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>

        <div className="mb-8">
          <CollapsibleSection
            title="Workout Calendar"
            description="See completed workouts, planned misses, recovery days, workout types, and PR days."
          >
            <div className="space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                    {workoutCalendar.monthName}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    Training consistency at a glance
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-gray-400">
                    Planned days are estimated from your saved program frequency.
                    Later, a true schedule can make skipped days exact.
                  </p>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="h-3 w-3 rounded-sm bg-blue-600" />
                    Completed
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="h-3 w-3 rounded-sm bg-green-400" />
                    PR day
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="h-3 w-3 rounded-sm bg-yellow-500" />
                    Skipped planned
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="h-3 w-3 rounded-sm bg-cyan-500/50" />
                    Recovery
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {weekdayLabels.map((label) => (
                    <p key={label}>{label}</p>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {workoutCalendar.days.map((day, index) =>
                    day ? (
                      <div
                        key={day.dateKey}
                        className={
                          "min-h-24 rounded-lg border p-2 transition hover:-translate-y-0.5 " +
                          getCalendarDayClasses(day) +
                          (day.isToday ? " ring-2 ring-blue-400/70" : "")
                        }
                        title={`${day.dateKey}: ${
                          day.workouts.length
                            ? `${day.workouts.length} workout(s)`
                            : day.status === "skipped"
                              ? "Skipped planned day"
                              : day.status === "recovery"
                                ? "Recovery day"
                                : "Future day"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="font-semibold">{day.dayNumber}</p>
                          {day.hasPr && (
                            <span className="rounded-full bg-green-400 px-1.5 py-0.5 text-[10px] font-bold text-gray-950">
                              PR
                            </span>
                          )}
                        </div>

                        {day.workouts.length > 0 ? (
                          <div className="space-y-1">
                            <p className="truncate text-xs font-semibold text-white">
                              {day.workoutType}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {day.workouts.length}{" "}
                              {day.workouts.length === 1 ? "workout" : "workouts"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] font-semibold text-gray-400">
                            {day.status === "skipped"
                              ? "Skipped"
                              : day.status === "recovery"
                                ? "Recovery"
                                : day.isPlanned
                                  ? "Planned"
                                  : ""}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        key={`empty-${index}`}
                        className="min-h-24 rounded-lg border border-transparent"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        <div className="mb-8">
          <CollapsibleSection
            title="Advanced Progress Tools"
            description="Compare weekly set volume, effort, streaks, and muscle balance."
          >
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm text-gray-400">Weekly Set Volume Change</p>
                  <p
                    className={
                      "text-3xl font-bold " +
                      (advancedProgress.volumeChangePercent >= 0
                        ? "text-green-300"
                        : "text-yellow-300")
                    }
                  >
                    {advancedProgress.volumeChangePercent > 0 ? "+" : ""}
                    {advancedProgress.volumeChangePercent}%
                  </p>
                  <div className="mt-2 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-gray-300">This week:</span>{" "}
                      {advancedProgress.currentWeekVolume.toLocaleString()} sets
                    </p>
                    <p>
                      <span className="font-semibold text-gray-300">Last week:</span>{" "}
                      {advancedProgress.previousWeekVolume.toLocaleString()} sets
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm text-gray-400">Current Streak</p>
                    <p className="text-2xl font-bold">
                      {advancedProgress.currentStreak}{" "}
                      {advancedProgress.currentStreak === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="text-sm text-gray-400">Avg RIR, 30 Days</p>
                    <p className="text-2xl font-bold">
                      {advancedProgress.averageRir || "No data"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Muscle Balance, 30 Days</p>
                    <h3 className="text-xl font-semibold">
                      Most trained: {advancedProgress.mostTrainedMuscle}
                    </h3>
                  </div>
                </div>

                {advancedProgress.muscleBalance.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Log workouts with muscle groups to see muscle balance.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {advancedProgress.muscleBalance.slice(0, 6).map((volume) => (
                      <div key={volume.muscleGroup}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-300">
                            {volume.muscleGroup}
                          </span>
                          <span className="text-gray-400">
                            {volume.sets} sets · {volume.percent}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-900">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            style={{ width: Math.max(volume.percent, 5) + "%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>
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
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
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
            <SorenessHeatmap workouts={workouts} />
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
