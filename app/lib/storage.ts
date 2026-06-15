import { emptyProfile } from "./appConstants";
import type { FitnessGoal, Profile, TrainingProgram, Workout } from "./types";
import { getProgramDays, getProgramExercises } from "./programUtils";
import { normalizeWorkouts } from "./workoutUtils";

const programsStorageKey = "trainingPrograms";
const goalsStorageKey = "fitnessGoals";

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
    return (JSON.parse(savedPrograms) as TrainingProgram[]).map((program) => {
      const days = getProgramDays(program);

      return {
        ...program,
        days,
        exercises: getProgramExercises({
          ...program,
          days,
        }),
      };
    });
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
