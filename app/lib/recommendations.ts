import type {
  DeloadRecommendation,
  ExerciseEntry,
  ExerciseRecommendation,
  FitnessGoal,
  SmartCoachInsight,
  TrainingProgram,
  Workout,
} from "./types";
import {
  getExerciseAverageRir,
  getExerciseSetCount,
  getExerciseSetEntries,
} from "./workoutUtils";

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

export function getSmartCoachInsight(
  workouts: Workout[],
  goals: FitnessGoal[],
  programs: TrainingProgram[]
): SmartCoachInsight {
  const recentWorkouts = workouts.slice(0, 5);
  const recentExercises = recentWorkouts.flatMap((workout) => workout.exercises);
  const recentSetEntries = recentExercises.flatMap(getExerciseSetEntries);
  const activeGoal = goals.find((goal) => goal.status === "Active") ?? goals[0];
  const currentProgram = programs[0];
  const hardSets = recentSetEntries.filter((setEntry) => Number(setEntry.rir) <= 1).length;
  const highSorenessExercises = recentExercises.filter(
    (exerciseEntry) => Number(exerciseEntry.soreness) >= 3
  ).length;
  const lowPumpExercises = recentExercises.filter(
    (exerciseEntry) => Number(exerciseEntry.pump) <= 1
  ).length;
  const tiredWorkouts = recentWorkouts.filter((workout) =>
    ["Tired", "Weak"].includes(workout.feeling)
  ).length;

  const lastWorkoutDate = recentWorkouts[0]?.date
    ? new Date(recentWorkouts[0].date)
    : null;
  const daysSinceLastWorkout =
    lastWorkoutDate && !Number.isNaN(lastWorkoutDate.getTime())
      ? Math.floor(
          (Date.now() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  let recoveryScore = 88;
  recoveryScore -= hardSets * 4;
  recoveryScore -= highSorenessExercises * 10;
  recoveryScore -= tiredWorkouts * 12;
  recoveryScore += Math.min(daysSinceLastWorkout * 12, 36);
  recoveryScore = Math.max(20, Math.min(98, recoveryScore));

  const recoveryLabel =
    recoveryScore >= 80
      ? "Ready to progress"
      : recoveryScore >= 65
        ? "Train normally"
        : recoveryScore >= 50
          ? "Manage fatigue"
          : "Back off today";

  const nextMove =
    recentWorkouts.length === 0
      ? "Log your first workout so Smart Coach can start reading your training patterns."
      : recoveryScore < 55
        ? "Keep today's session lighter: reduce load slightly or remove 1 set from hard movements."
        : hardSets >= 4
          ? "Repeat your last hard lifts before adding weight. You were close to failure often."
          : lowPumpExercises >= 3
            ? "Add 1 set to a low-pump muscle group or slow the tempo on isolation work."
            : "If your next session feels good, add a small amount of weight to one main lift.";

  const trainingFocus = activeGoal
    ? "Current focus: " + activeGoal.title + ". Keep logging workouts that support this goal."
    : currentProgram
      ? "Current focus: stay consistent with " + currentProgram.name + "."
      : "Current focus: create a goal or program so recommendations can become more specific.";

  const programNote = currentProgram
    ? "Program loaded: " +
      currentProgram.name +
      ". Start one training day at a time and compare feedback after each session."
    : "Build a program to unlock better day-by-day guidance.";

  const confidence =
    recentWorkouts.length >= 5 ? "High" : recentWorkouts.length >= 2 ? "Medium" : "Low";

  return {
    recoveryScore,
    recoveryLabel,
    nextMove,
    trainingFocus,
    programNote,
    confidence,
  };
}
