"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { EmptyState } from "../components/EmptyState";
import { ExerciseDemo } from "../components/ExerciseDemo";
import { SpeechToTextButton } from "../components/SpeechToTextButton";
import {
  exerciseLibrary,
  buildSetEntries,
  getExerciseAverageRir,
  getExerciseSetEntries,
  getExerciseTopWeight,
  getProgramDays,
  loadWorkouts,
  loadTrainingPrograms,
  muscleGroups,
  saveWorkouts,
  summarizeExerciseSets,
  type AppId,
  type ExerciseEntry,
  type ExerciseLibraryItem,
  type ProgramExercise,
  type TrainingProgram,
  type SetEntry,
  type Workout,
} from "../lib/fitnessData";
import {
  loadCustomExercisesFromDevice,
  loadCustomExercisesFromSupabase,
} from "../lib/supabaseExerciseLibrary";
import { loadProgramsFromSupabase } from "../lib/supabasePlanning";
import {
  getCurrentUserId,
  loadWorkoutsFromSupabase,
  saveWorkoutToSupabase,
} from "../lib/supabaseWorkouts";

const workoutTemplates = {
  Push: [
    { exercise: "Bench Press", muscleGroup: "Chest", sets: "3", reps: "8" },
    { exercise: "Shoulder Press", muscleGroup: "Shoulders", sets: "3", reps: "10" },
    { exercise: "Incline Dumbbell Press", muscleGroup: "Chest", sets: "3", reps: "10" },
    { exercise: "Tricep Pushdown", muscleGroup: "Triceps", sets: "3", reps: "12" },
  ],
  Pull: [
    { exercise: "Lat Pulldown", muscleGroup: "Back", sets: "3", reps: "10" },
    { exercise: "Barbell Row", muscleGroup: "Back", sets: "3", reps: "8" },
    { exercise: "Seated Cable Row", muscleGroup: "Back", sets: "3", reps: "10" },
    { exercise: "Bicep Curl", muscleGroup: "Biceps", sets: "3", reps: "12" },
  ],
  Legs: [
    { exercise: "Squat", muscleGroup: "Quads", sets: "3", reps: "8" },
    { exercise: "Romanian Deadlift", muscleGroup: "Hamstrings", sets: "3", reps: "10" },
    { exercise: "Leg Press", muscleGroup: "Quads", sets: "3", reps: "12" },
    { exercise: "Calf Raise", muscleGroup: "Calves", sets: "3", reps: "15" },
  ],
  Upper: [
    { exercise: "Bench Press", muscleGroup: "Chest", sets: "3", reps: "8" },
    { exercise: "Barbell Row", muscleGroup: "Back", sets: "3", reps: "8" },
    { exercise: "Shoulder Press", muscleGroup: "Shoulders", sets: "3", reps: "10" },
    { exercise: "Lat Pulldown", muscleGroup: "Back", sets: "3", reps: "10" },
  ],
  Lower: [
    { exercise: "Squat", muscleGroup: "Quads", sets: "3", reps: "8" },
    { exercise: "Romanian Deadlift", muscleGroup: "Hamstrings", sets: "3", reps: "10" },
    { exercise: "Leg Curl", muscleGroup: "Hamstrings", sets: "3", reps: "12" },
    { exercise: "Calf Raise", muscleGroup: "Calves", sets: "3", reps: "15" },
  ],
  "Full Body EOD": [
    { exercise: "Squat", muscleGroup: "Quads", sets: "3", reps: "8" },
    { exercise: "Bench Press", muscleGroup: "Chest", sets: "3", reps: "8" },
    { exercise: "Barbell Row", muscleGroup: "Back", sets: "3", reps: "10" },
    { exercise: "Romanian Deadlift", muscleGroup: "Hamstrings", sets: "2", reps: "10" },
  ],
};

type TemplateName = keyof typeof workoutTemplates;

const activeWorkoutDraftKey = "exerciseinsight-active-workout-draft";
const defaultRestSeconds = 90;
const allLibraryMuscles = "All";
const allLibraryMovements = "All";
const allLibraryEquipment = "All";
const allLibraryLevels = "All";

type ActiveWorkoutDraft = {
  workoutDate: string;
  feeling: string;
  notes: string;
  currentExercises: ExerciseEntry[];
  completedSetIds: Record<string, boolean>;
  activeStartedAt: number;
  isActiveTimerRunning: boolean;
};

type CompletedWorkoutSummary = {
  title: string;
  durationMinutes: number;
  workingSets: number;
  volume: number;
  averageRir: number;
  personalRecords: number;
  muscleInsight: string;
  workout: Workout;
  shareText: string;
};

type WorkoutMode = "plan" | "active" | "summary";

function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatWorkoutDate(dateValue: string) {
  const date = new Date(dateValue + "T12:00:00");

  return date.toLocaleDateString();
}

function getNumericRepsDefault(repsValue: string) {
  const firstNumber = repsValue.match(/\d+/)?.[0];

  return firstNumber ?? "1";
}

function programExerciseToWorkoutExercise(
  programExercise: ProgramExercise,
  index: number,
  workouts: Workout[]
): ExerciseEntry {
  const repsDefault = getNumericRepsDefault(programExercise.reps);
  const previousPerformance = getPreviousExercisePerformance(
    workouts,
    programExercise.exercise
  );
  const previousSetEntries = previousPerformance
    ? getExerciseSetEntries(previousPerformance.exercise)
    : [];
  const targetSetCount = Math.max(Number(programExercise.sets) || 1, 1);
  const setEntries = Array.from({ length: targetSetCount }, (_item, setIndex) => {
    const previousSet = previousSetEntries[setIndex] ?? previousSetEntries[0];

    return {
      id: Date.now() + index * 100 + setIndex,
      setNumber: setIndex + 1,
      weight: previousSet?.weight ?? "0",
      reps: previousSet?.reps ?? repsDefault,
      rir: previousSet?.rir ?? "2",
      didPartials: false,
    };
  });

  return {
    id: Date.now() + index,
    exercise: programExercise.exercise,
    muscleGroup: programExercise.muscleGroup,
    setEntries,
    sets: String(setEntries.length),
    weight: setEntries[0]?.weight ?? "0",
    reps: setEntries[0]?.reps ?? repsDefault,
    rir: setEntries[0]?.rir ?? "2",
    pump: "0",
    soreness: "0",
    didPartials: false,
    notes: [
      programExercise.notes,
      previousPerformance
        ? `Previous ${previousPerformance.date}: ${summarizeExerciseSets(
            previousPerformance.exercise
          )}`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function getPreviousExercisePerformance(
  workouts: Workout[],
  exerciseName: string
) {
  const normalizedExerciseName = exerciseName.trim().toLowerCase();

  if (!normalizedExerciseName) {
    return null;
  }

  for (const workout of workouts) {
    const matchingExercise = workout.exercises.find(
      (exerciseEntry) =>
        exerciseEntry.exercise.trim().toLowerCase() === normalizedExerciseName
    );

    if (matchingExercise) {
      return {
        date: workout.date,
        exercise: matchingExercise,
      };
    }
  }

  return null;
}

function getExerciseHistory(workouts: Workout[], exerciseName: string) {
  const normalizedExerciseName = exerciseName.trim().toLowerCase();

  if (!normalizedExerciseName) {
    return [];
  }

  return workouts
    .flatMap((workout) =>
      workout.exercises
        .filter(
          (exerciseEntry) =>
            exerciseEntry.exercise.trim().toLowerCase() === normalizedExerciseName
        )
        .map((exerciseEntry) => ({
          date: workout.date,
          exercise: exerciseEntry,
          topWeight: getExerciseTopWeight(exerciseEntry),
          averageRir: getExerciseAverageRir(exerciseEntry),
          setCount: getExerciseSetEntries(exerciseEntry).length,
        }))
    )
    .slice(0, 4);
}

function getExerciseHistorySuggestion(history: ReturnType<typeof getExerciseHistory>) {
  const lastSession = history[0];

  if (!lastSession) {
    return "Log this exercise a few times and ExerciseInsight will compare your recent sessions.";
  }

  if (lastSession.averageRir >= 3) {
    return "Last time looked comfortable. Consider adding a little weight or one extra rep if warmups feel strong.";
  }

  if (lastSession.averageRir <= 1) {
    return "Last time was close to failure. Repeat the same load or keep a rep in reserve today.";
  }

  return "Last session was in a productive range. Try to match it first, then progress if the sets move well.";
}

function ActiveExerciseHistory({
  workouts,
  exerciseName,
}: {
  workouts: Workout[];
  exerciseName: string;
}) {
  const history = getExerciseHistory(workouts, exerciseName);
  const lastSession = history[0];
  const bestSet = history
    .flatMap((historyEntry) => getExerciseSetEntries(historyEntry.exercise))
    .sort((firstSet, secondSet) => {
      const weightDifference = Number(secondSet.weight) - Number(firstSet.weight);

      return weightDifference !== 0
        ? weightDifference
        : Number(secondSet.reps) - Number(firstSet.reps);
    })[0];
  const suggestedWeight = lastSession
    ? Math.max(
        0,
        lastSession.topWeight + (lastSession.averageRir >= 3 ? 5 : 0)
      )
    : 0;
  const suggestedReps =
    lastSession?.exercise.setEntries[0]?.reps || "Build from your warmups";

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Last Session
        </p>
        <p className="mt-2 text-sm font-semibold">
          {lastSession
            ? summarizeExerciseSets(lastSession.exercise)
            : "No previous session"}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Best Set
        </p>
        <p className="mt-2 text-sm font-semibold">
          {bestSet ? `${bestSet.weight} lb x ${bestSet.reps}` : "No data yet"}
        </p>
      </div>
      <div className="rounded-lg border border-cyan-400/20 bg-cyan-950/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
          Suggested Today
        </p>
        <p className="mt-2 text-sm font-semibold">
          {lastSession
            ? `${suggestedWeight} lb · ${suggestedReps} reps`
            : "Use a comfortable starting load"}
        </p>
      </div>
      {lastSession && (
        <p className="text-xs text-gray-400 sm:col-span-3">
          {getExerciseHistorySuggestion(history)}
        </p>
      )}
    </div>
  );
}

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getSetCompletionId(exerciseId: AppId, setId: AppId) {
  return `${exerciseId}-${setId}`;
}

function getPreviousSetLabel(
  workouts: Workout[],
  exerciseName: string,
  setNumber: number
) {
  const previousPerformance = getPreviousExercisePerformance(workouts, exerciseName);
  const previousSet = previousPerformance?.exercise.setEntries.find(
    (setEntry) => setEntry.setNumber === setNumber
  );

  if (!previousSet) {
    return "No data";
  }

  return `${previousSet.weight} x ${previousSet.reps}`;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getLibraryItem(
  exerciseName: string,
  libraryExercises: ExerciseLibraryItem[]
) {
  const normalizedExerciseName = normalizeText(exerciseName);

  return libraryExercises.find(
    (libraryExercise) =>
      normalizeText(libraryExercise.exercise) === normalizedExerciseName
  );
}

function getSwapSuggestions(
  exerciseEntry: ExerciseEntry,
  libraryExercises: ExerciseLibraryItem[]
) {
  const currentLibraryItem = getLibraryItem(
    exerciseEntry.exercise,
    libraryExercises
  );
  const explicitSubstitutions = new Set(
    currentLibraryItem?.substitutions.map(normalizeText) ?? []
  );
  const currentTargetWords = new Set(
    (currentLibraryItem?.target ?? exerciseEntry.muscleGroup)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  );

  return libraryExercises
    .filter(
      (libraryExercise) =>
        normalizeText(libraryExercise.exercise) !==
        normalizeText(exerciseEntry.exercise)
    )
    .map((libraryExercise) => {
      let score = 0;
      const reasons: string[] = [];

      if (explicitSubstitutions.has(normalizeText(libraryExercise.exercise))) {
        score += 8;
        reasons.push("listed substitute");
      }

      if (libraryExercise.muscleGroup === exerciseEntry.muscleGroup) {
        score += 4;
        reasons.push("same primary muscle");
      }

      if (
        currentLibraryItem &&
        libraryExercise.equipment === currentLibraryItem.equipment
      ) {
        score += 2;
        reasons.push("similar equipment");
      }

      const targetOverlap = libraryExercise.target
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .some((word) => currentTargetWords.has(word));

      if (targetOverlap) {
        score += 2;
        reasons.push("similar movement target");
      }

      return {
        ...libraryExercise,
        score,
        reasons,
      };
    })
    .filter((libraryExercise) => libraryExercise.score > 0)
    .sort((firstExercise, secondExercise) => {
      if (secondExercise.score !== firstExercise.score) {
        return secondExercise.score - firstExercise.score;
      }

      return firstExercise.exercise.localeCompare(secondExercise.exercise);
    })
    .slice(0, 5);
}

function getSetVolume(setEntry: SetEntry) {
  const weight = Number(setEntry.weight);
  const reps = Number(setEntry.reps);

  if (Number.isNaN(weight) || Number.isNaN(reps)) {
    return 0;
  }

  return weight * reps;
}

function getWorkoutVolume(workout: Workout) {
  return workout.exercises.reduce(
    (workoutTotal, exerciseEntry) =>
      workoutTotal +
      getExerciseSetEntries(exerciseEntry).reduce(
        (exerciseTotal, setEntry) => exerciseTotal + getSetVolume(setEntry),
        0
      ),
    0
  );
}

function getWorkoutWorkingSets(workout: Workout) {
  return workout.exercises.reduce(
    (totalSets, exerciseEntry) =>
      totalSets + getExerciseSetEntries(exerciseEntry).length,
    0
  );
}

function getWorkoutAverageRir(workout: Workout) {
  const rirValues = workout.exercises.flatMap((exerciseEntry) =>
    getExerciseSetEntries(exerciseEntry)
      .map((setEntry) => Number(setEntry.rir))
      .filter((rirValue) => !Number.isNaN(rirValue))
  );

  if (rirValues.length === 0) {
    return 0;
  }

  const averageRir =
    rirValues.reduce((total, rirValue) => total + rirValue, 0) / rirValues.length;

  return Math.round(averageRir * 10) / 10;
}

function getWorkoutTitle(workout: Workout) {
  const programDayMatch = workout.notes.match(/Started from .+ - ([^.]+)\./);

  if (programDayMatch?.[1]) {
    return `${programDayMatch[1]} Complete`;
  }

  const firstExercise = workout.exercises[0];

  if (firstExercise) {
    return `${firstExercise.muscleGroup} Workout Complete`;
  }

  return "Workout Complete";
}

function getPersonalRecordCount(newWorkout: Workout, previousWorkouts: Workout[]) {
  return newWorkout.exercises.reduce((recordCount, exerciseEntry) => {
    const currentTopWeight = getExerciseTopWeight(exerciseEntry);
    const previousBestWeight = Math.max(
      0,
      ...previousWorkouts.flatMap((workout) =>
        workout.exercises
          .filter(
            (previousExercise) =>
              normalizeText(previousExercise.exercise) ===
              normalizeText(exerciseEntry.exercise)
          )
          .map((previousExercise) => getExerciseTopWeight(previousExercise))
      )
    );

    return currentTopWeight > previousBestWeight ? recordCount + 1 : recordCount;
  }, 0);
}

function getMuscleVolumeInsight(newWorkout: Workout, previousWorkouts: Workout[]) {
  const currentMuscleVolumes = new Map<string, number>();

  newWorkout.exercises.forEach((exerciseEntry) => {
    const exerciseVolume = getExerciseSetEntries(exerciseEntry).reduce(
      (totalVolume, setEntry) => totalVolume + getSetVolume(setEntry),
      0
    );

    currentMuscleVolumes.set(
      exerciseEntry.muscleGroup,
      (currentMuscleVolumes.get(exerciseEntry.muscleGroup) ?? 0) + exerciseVolume
    );
  });

  const topMuscleEntry = Array.from(currentMuscleVolumes.entries()).sort(
    (firstEntry, secondEntry) => secondEntry[1] - firstEntry[1]
  )[0];

  if (!topMuscleEntry) {
    return "Log more workouts to unlock muscle-volume comparisons.";
  }

  const [topMuscle, currentVolume] = topMuscleEntry;
  const workoutDate = new Date(newWorkout.dateISO);
  const previousWindowStart = new Date(workoutDate);
  previousWindowStart.setDate(previousWindowStart.getDate() - 7);

  const previousVolume = previousWorkouts.reduce((totalVolume, workout) => {
    const previousWorkoutDate = new Date(workout.dateISO);

    if (previousWorkoutDate < previousWindowStart || previousWorkoutDate >= workoutDate) {
      return totalVolume;
    }

    return (
      totalVolume +
      workout.exercises
        .filter((exerciseEntry) => exerciseEntry.muscleGroup === topMuscle)
        .reduce(
          (exerciseTotal, exerciseEntry) =>
            exerciseTotal +
            getExerciseSetEntries(exerciseEntry).reduce(
              (setTotal, setEntry) => setTotal + getSetVolume(setEntry),
              0
            ),
          0
        )
    );
  }, 0);

  if (previousVolume === 0) {
    return `${topMuscle} volume is now being tracked. Add another week to compare trends.`;
  }

  const percentChange = Math.round(
    ((currentVolume - previousVolume) / previousVolume) * 100
  );

  if (percentChange > 0) {
    return `${topMuscle} volume increased ${percentChange}% from the previous 7 days.`;
  }

  if (percentChange < 0) {
    return `${topMuscle} volume decreased ${Math.abs(
      percentChange
    )}% from the previous 7 days.`;
  }

  return `${topMuscle} volume matched the previous 7 days.`;
}

function buildShareText(summary: Omit<CompletedWorkoutSummary, "shareText">) {
  return [
    `${summary.title}`,
    `Duration: ${summary.durationMinutes} min`,
    `Working sets: ${summary.workingSets}`,
    `Volume: ${summary.volume.toLocaleString()} lb`,
    `Average RIR: ${summary.averageRir}`,
    `Personal records: ${summary.personalRecords}`,
    summary.muscleInsight,
  ].join("\n");
}

function buildCompletedWorkoutSummary(
  savedWorkout: Workout,
  previousWorkouts: Workout[],
  durationSeconds: number
): CompletedWorkoutSummary {
  const summaryWithoutShareText = {
    title: getWorkoutTitle(savedWorkout),
    durationMinutes: Math.max(0, Math.round(durationSeconds / 60)),
    workingSets: getWorkoutWorkingSets(savedWorkout),
    volume: getWorkoutVolume(savedWorkout),
    averageRir: getWorkoutAverageRir(savedWorkout),
    personalRecords: getPersonalRecordCount(savedWorkout, previousWorkouts),
    muscleInsight: getMuscleVolumeInsight(savedWorkout, previousWorkouts),
    workout: savedWorkout,
  };

  return {
    ...summaryWithoutShareText,
    shareText: buildShareText(summaryWithoutShareText),
  };
}

export default function AddWorkoutPage() {
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>("plan");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState("");
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [libraryMuscleFilter, setLibraryMuscleFilter] = useState(allLibraryMuscles);
  const [libraryMovementFilter, setLibraryMovementFilter] =
    useState(allLibraryMovements);
  const [libraryEquipmentFilter, setLibraryEquipmentFilter] =
    useState(allLibraryEquipment);
  const [libraryLevelFilter, setLibraryLevelFilter] =
    useState(allLibraryLevels);
  const [editingCurrentExerciseId, setEditingCurrentExerciseId] = useState<
    AppId | null
  >(null);
  const [exercise, setExercise] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [sets, setSets] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");
  const [pump, setPump] = useState("0");
  const [soreness, setSoreness] = useState("0");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [setEntries, setSetEntries] = useState<SetEntry[]>([]);
  const [didPartials, setDidPartials] = useState(false);
  const [exerciseError, setExerciseError] = useState("");
  const [workoutDate, setWorkoutDate] = useState(getTodayInputDate());
  const [feeling, setFeeling] = useState("");
  const [notes, setNotes] = useState("");
  const [currentExercises, setCurrentExercises] = useState<ExerciseEntry[]>([]);
  const [customExercises, setCustomExercises] = useState<ExerciseLibraryItem[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [userId, setUserId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [loadedProgramId, setLoadedProgramId] = useState("");
  const [completedSetIds, setCompletedSetIds] = useState<Record<string, boolean>>({});
  const [activeStartedAt, setActiveStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActiveTimerRunning, setIsActiveTimerRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(defaultRestSeconds);
  const [restRemainingSeconds, setRestRemainingSeconds] =
    useState(defaultRestSeconds);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [swapExerciseId, setSwapExerciseId] = useState<AppId | null>(null);
  const [completedWorkoutSummary, setCompletedWorkoutSummary] =
    useState<CompletedWorkoutSummary | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    async function loadSavedWorkouts() {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);

      if (currentUserId) {
        try {
          const [savedWorkouts, savedCustomExercises] = await Promise.all([
            loadWorkoutsFromSupabase(),
            loadCustomExercisesFromSupabase(),
          ]);

          setWorkouts(savedWorkouts);
          setCustomExercises(savedCustomExercises);
          setSaveMessage("Workouts are saving to Supabase.");
        } catch {
          setWorkouts(loadWorkouts());
          setCustomExercises(loadCustomExercisesFromDevice());
          setSaveMessage("Could not load Supabase workouts. Using this device.");
        }
      } else {
        setWorkouts(loadWorkouts());
        setCustomExercises(loadCustomExercisesFromDevice());
        setSaveMessage("Log in to save workouts to Supabase.");
      }

      setHasLoadedSavedData(true);
    }

    loadSavedWorkouts();
  }, []);

  useEffect(() => {
    const savedDraft = localStorage.getItem(activeWorkoutDraftKey);

    if (!savedDraft) {
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as Partial<ActiveWorkoutDraft>;

      if (Array.isArray(parsedDraft.currentExercises)) {
        setCurrentExercises(parsedDraft.currentExercises);
        if (parsedDraft.currentExercises.length > 0) {
          setWorkoutMode("active");
        }
      }

      if (typeof parsedDraft.workoutDate === "string") {
        setWorkoutDate(parsedDraft.workoutDate);
      }

      if (typeof parsedDraft.feeling === "string") {
        setFeeling(parsedDraft.feeling);
      }

      if (typeof parsedDraft.notes === "string") {
        setNotes(parsedDraft.notes);
      }

      if (parsedDraft.completedSetIds && typeof parsedDraft.completedSetIds === "object") {
        setCompletedSetIds(parsedDraft.completedSetIds);
      }

      if (typeof parsedDraft.activeStartedAt === "number") {
        setActiveStartedAt(parsedDraft.activeStartedAt);
      }

      if (typeof parsedDraft.isActiveTimerRunning === "boolean") {
        setIsActiveTimerRunning(parsedDraft.isActiveTimerRunning);
      }
    } catch {
      localStorage.removeItem(activeWorkoutDraftKey);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedData || userId) {
      return;
    }

    saveWorkouts(workouts);
  }, [hasLoadedSavedData, userId, workouts]);

  useEffect(() => {
    if (!isActiveTimerRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeStartedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeStartedAt, isActiveTimerRunning]);

  useEffect(() => {
    if (!isRestTimerRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setRestRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setIsRestTimerRunning(false);
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRestTimerRunning]);

  useEffect(() => {
    const draft: ActiveWorkoutDraft = {
      workoutDate,
      feeling,
      notes,
      currentExercises,
      completedSetIds,
      activeStartedAt,
      isActiveTimerRunning,
    };

    localStorage.setItem(activeWorkoutDraftKey, JSON.stringify(draft));
  }, [
    activeStartedAt,
    completedSetIds,
    currentExercises,
    feeling,
    isActiveTimerRunning,
    notes,
    workoutDate,
  ]);

  useEffect(() => {
    const exerciseFromLibrary = new URLSearchParams(window.location.search).get(
      "exercise"
    );

    if (!exerciseFromLibrary) {
      return;
    }

    const allLibraryExercises = [...exerciseLibrary, ...customExercises];
    const libraryExercise = allLibraryExercises.find(
      (item) => item.exercise === exerciseFromLibrary
    );

    if (!libraryExercise) {
      return;
    }

    const prefillForm = window.setTimeout(() => {
      const defaultReps = libraryExercise.defaultReps.includes("-")
        ? ""
        : libraryExercise.defaultReps;

      setSelectedLibraryExercise(libraryExercise.exercise);
      setExercise(libraryExercise.exercise);
      setMuscleGroup(libraryExercise.muscleGroup);
      setSets(libraryExercise.defaultSets);
      setReps(defaultReps);
      setSetEntries(
        buildSetEntries(libraryExercise.defaultSets, "0", defaultReps, "2")
      );
    }, 0);

    return () => window.clearTimeout(prefillForm);
  }, [customExercises]);

  useEffect(() => {
    if (!hasLoadedSavedData || loadedProgramId) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const programId = searchParams.get("programId");
    const dayId = searchParams.get("dayId");

    if (!programId) {
      return;
    }

    const selectedProgramId = programId;

    async function loadProgramWorkoutDraft() {
      let savedPrograms: TrainingProgram[] = [];

      if (userId) {
        try {
          savedPrograms = await loadProgramsFromSupabase();
        } catch {
          savedPrograms = loadTrainingPrograms();
        }
      } else {
        savedPrograms = loadTrainingPrograms();
      }

      const program = savedPrograms.find(
        (savedProgram) => String(savedProgram.id) === selectedProgramId
      );

      if (!program) {
        setSaveMessage("Could not find that program. It may have been deleted.");
        setLoadedProgramId(selectedProgramId);
        return;
      }

      const programDays = getProgramDays(program);
      const selectedDay =
        programDays.find((day) => String(day.id) === String(dayId)) ?? programDays[0];

      if (!selectedDay) {
        setSaveMessage("Could not find a training day for that program.");
        setLoadedProgramId(selectedProgramId);
        return;
      }

      const programExercises = selectedDay.exercises.map((programExercise, index) =>
        programExerciseToWorkoutExercise(programExercise, index, workouts)
      );

      setCurrentExercises(programExercises);
      setWorkoutMode(programExercises.length > 0 ? "active" : "plan");
      setSelectedTemplate("");
      setCompletedSetIds({});
      setActiveStartedAt(Date.now());
      setElapsedSeconds(0);
      setIsActiveTimerRunning(false);
      setRestRemainingSeconds(restSeconds);
      setIsRestTimerRunning(false);
      setNotes(
        [
          "Started from " + program.name + " - " + selectedDay.name + ".",
          selectedDay.notes,
          program.notes,
        ]
          .filter(Boolean)
          .join(" ")
      );
      setSaveMessage(
        selectedDay.exercises.length > 0
          ? "Loaded " + program.name + " - " + selectedDay.name + "."
          : program.name + " - " + selectedDay.name + " is a rest day or has no exercises."
      );
      setLoadedProgramId(selectedProgramId);
    }

    loadProgramWorkoutDraft();
  }, [hasLoadedSavedData, loadedProgramId, restSeconds, userId]);

  function resetExerciseForm() {
    setSelectedLibraryExercise("");
    setExercise("");
    setMuscleGroup("Chest");
    setSets("");
    setWeight("");
    setReps("");
    setRir("");
    setPump("0");
    setSoreness("0");
    setExerciseNotes("");
    setSetEntries([]);
    setDidPartials(false);
    setEditingCurrentExerciseId(null);
  }

  function syncSetCount(nextSetCount: string) {
    setSets(nextSetCount);

    const nextCount = Number(nextSetCount);

    if (Number.isNaN(nextCount) || nextCount < 1) {
      setSetEntries([]);
      return;
    }

    setSetEntries((currentSetEntries) =>
      Array.from({ length: nextCount }, (_item, index) => {
        const existingSet = currentSetEntries[index];

        return {
          id: existingSet?.id ?? Date.now() + index,
          setNumber: index + 1,
          weight: existingSet?.weight ?? weight,
          reps: existingSet?.reps ?? reps,
          rir: existingSet?.rir ?? rir,
          didPartials: existingSet?.didPartials ?? didPartials,
        };
      })
    );
  }

  function updateDefaultWeight(value: string) {
    setWeight(value);
    setSetEntries((currentSetEntries) =>
      currentSetEntries.map((setEntry) => ({
        ...setEntry,
        weight: value,
      }))
    );
  }

  function updateDefaultReps(value: string) {
    setReps(value);
    setSetEntries((currentSetEntries) =>
      currentSetEntries.map((setEntry) => ({
        ...setEntry,
        reps: value,
      }))
    );
  }

  function updateDefaultRir(value: string) {
    setRir(value);
    setSetEntries((currentSetEntries) =>
      currentSetEntries.map((setEntry) => ({
        ...setEntry,
        rir: value,
      }))
    );
  }

  function updateAllSetPartials(checked: boolean) {
    setDidPartials(checked);
    setSetEntries((currentSetEntries) =>
      currentSetEntries.map((setEntry) => ({
        ...setEntry,
        didPartials: checked,
      }))
    );
  }

  function updateDraftSet(
    setId: AppId,
    field: keyof Pick<SetEntry, "weight" | "reps" | "rir" | "didPartials">,
    value: string | boolean
  ) {
    const updatedSetEntries = setEntries.map((setEntry) =>
      setEntry.id === setId
        ? {
            ...setEntry,
            [field]: value,
          }
        : setEntry
    );

    setSetEntries(updatedSetEntries);
    setDidPartials(updatedSetEntries.some((setEntry) => setEntry.didPartials));
  }

  function addDraftSet() {
    const lastSet = setEntries[setEntries.length - 1];
    const newSetEntries = [
      ...setEntries,
      {
        id: Date.now(),
        setNumber: setEntries.length + 1,
        weight: lastSet?.weight ?? weight,
        reps: lastSet?.reps ?? reps,
        rir: lastSet?.rir ?? rir,
        didPartials: lastSet?.didPartials ?? didPartials,
      },
    ];

    setSetEntries(newSetEntries);
    setSets(String(newSetEntries.length));
  }

  function removeDraftSet(setId: AppId) {
    if (setEntries.length <= 1) {
      setExerciseError("An exercise must have at least 1 set.");
      return;
    }

    const updatedSetEntries = setEntries
      .filter((setEntry) => setEntry.id !== setId)
      .map((setEntry, index) => ({
        ...setEntry,
        setNumber: index + 1,
      }));

    setSetEntries(updatedSetEntries);
    setSets(String(updatedSetEntries.length));
    setDidPartials(updatedSetEntries.some((setEntry) => setEntry.didPartials));
  }

  function updateActiveSet(
    exerciseId: AppId,
    setId: AppId,
    field: keyof Pick<SetEntry, "weight" | "reps" | "rir" | "didPartials">,
    value: string | boolean
  ) {
    setCurrentExercises((currentWorkoutExercises) =>
      currentWorkoutExercises.map((exerciseEntry) => {
        if (exerciseEntry.id !== exerciseId) {
          return exerciseEntry;
        }

        const updatedSetEntries = exerciseEntry.setEntries.map((setEntry) =>
          setEntry.id === setId
            ? {
                ...setEntry,
                [field]: value,
              }
            : setEntry
        );

        return {
          ...exerciseEntry,
          setEntries: updatedSetEntries,
          sets: String(updatedSetEntries.length),
          weight: updatedSetEntries[0]?.weight ?? exerciseEntry.weight,
          reps: updatedSetEntries[0]?.reps ?? exerciseEntry.reps,
          rir: updatedSetEntries[0]?.rir ?? exerciseEntry.rir,
          didPartials: updatedSetEntries.some((setEntry) => setEntry.didPartials),
        };
      })
    );
  }

  function updateActiveExerciseNotes(exerciseId: AppId, value: string) {
    setCurrentExercises((currentWorkoutExercises) =>
      currentWorkoutExercises.map((exerciseEntry) =>
        exerciseEntry.id === exerciseId
          ? {
              ...exerciseEntry,
              notes: value,
            }
          : exerciseEntry
      )
    );
  }

  function swapActiveExercise(
    exerciseId: AppId,
    replacementExercise: ExerciseLibraryItem
  ) {
    setCurrentExercises((currentWorkoutExercises) =>
      currentWorkoutExercises.map((exerciseEntry) => {
        if (exerciseEntry.id !== exerciseId) {
          return exerciseEntry;
        }

        const swapNote = `Swapped from ${exerciseEntry.exercise} to ${replacementExercise.exercise}; original program history preserved.`;
        const updatedNotes = exerciseEntry.notes
          ? exerciseEntry.notes.includes(swapNote)
            ? exerciseEntry.notes
            : `${exerciseEntry.notes} ${swapNote}`
          : swapNote;

        return {
          ...exerciseEntry,
          exercise: replacementExercise.exercise,
          muscleGroup: replacementExercise.muscleGroup,
          notes: updatedNotes,
        };
      })
    );
    setSwapExerciseId(null);
  }

  function addActiveSet(exerciseId: AppId) {
    setCurrentExercises((currentWorkoutExercises) =>
      currentWorkoutExercises.map((exerciseEntry) => {
        if (exerciseEntry.id !== exerciseId) {
          return exerciseEntry;
        }

        const lastSet = exerciseEntry.setEntries[exerciseEntry.setEntries.length - 1];
        const updatedSetEntries = [
          ...exerciseEntry.setEntries,
          {
            id: Date.now(),
            setNumber: exerciseEntry.setEntries.length + 1,
            weight: lastSet?.weight ?? exerciseEntry.weight,
            reps: lastSet?.reps ?? exerciseEntry.reps,
            rir: lastSet?.rir ?? exerciseEntry.rir,
            didPartials: lastSet?.didPartials ?? exerciseEntry.didPartials,
          },
        ];

        return {
          ...exerciseEntry,
          setEntries: updatedSetEntries,
          sets: String(updatedSetEntries.length),
        };
      })
    );
  }

  function dropActiveSet(exerciseId: AppId, setId: AppId) {
    setCurrentExercises((currentWorkoutExercises) =>
      currentWorkoutExercises.map((exerciseEntry) => {
        if (exerciseEntry.id !== exerciseId || exerciseEntry.setEntries.length <= 1) {
          return exerciseEntry;
        }

        const updatedSetEntries = exerciseEntry.setEntries
          .filter((setEntry) => setEntry.id !== setId)
          .map((setEntry, index) => ({
            ...setEntry,
            setNumber: index + 1,
          }));

        return {
          ...exerciseEntry,
          setEntries: updatedSetEntries,
          sets: String(updatedSetEntries.length),
          weight: updatedSetEntries[0]?.weight ?? exerciseEntry.weight,
          reps: updatedSetEntries[0]?.reps ?? exerciseEntry.reps,
          rir: updatedSetEntries[0]?.rir ?? exerciseEntry.rir,
          didPartials: updatedSetEntries.some((setEntry) => setEntry.didPartials),
        };
      })
    );
    setCompletedSetIds((currentCompletedIds) => {
      const nextCompletedIds = { ...currentCompletedIds };
      delete nextCompletedIds[getSetCompletionId(exerciseId, setId)];
      return nextCompletedIds;
    });
  }

  function startRestTimer() {
    setRestRemainingSeconds(restSeconds);
    setIsRestTimerRunning(true);
  }

  function toggleActiveSetDone(exerciseId: AppId, setId: AppId) {
    const completionId = getSetCompletionId(exerciseId, setId);
    const isCurrentlyDone = completedSetIds[completionId];

    setCompletedSetIds((currentCompletedIds) => ({
      ...currentCompletedIds,
      [completionId]: !isCurrentlyDone,
    }));

    if (!isCurrentlyDone) {
      startRestTimer();
    }
  }

  function startOrPauseActiveTimer() {
    if (isActiveTimerRunning) {
      setIsActiveTimerRunning(false);
      return;
    }

    setActiveStartedAt(Date.now() - elapsedSeconds * 1000);
    setIsActiveTimerRunning(true);
  }

  function resetElapsedTimer() {
    setIsActiveTimerRunning(false);
    setActiveStartedAt(Date.now());
    setElapsedSeconds(0);
  }

  function resetActiveWorkoutDraft() {
    const confirmed = window.confirm("Reset the active workout timer and completed sets?");

    if (!confirmed) {
      return;
    }

    setCompletedSetIds({});
    resetElapsedTimer();
    setRestRemainingSeconds(restSeconds);
    setIsRestTimerRunning(false);
    localStorage.removeItem(activeWorkoutDraftKey);
  }

  function selectExerciseFromLibrary(exerciseName: string) {
    setSelectedLibraryExercise(exerciseName);

    const libraryExercise = allLibraryExercises.find(
      (item) => item.exercise === exerciseName
    );

    if (!libraryExercise) {
      return;
    }

    setExercise(libraryExercise.exercise);
    setMuscleGroup(libraryExercise.muscleGroup);
  }

  function applySubstitution(substitutionName: string) {
    setExercise(substitutionName);

    const substitutionExercise = allLibraryExercises.find(
      (item) => item.exercise === substitutionName
    );
    const currentLibraryExercise = allLibraryExercises.find(
      (item) => item.exercise === selectedLibraryExercise
    );

    if (substitutionExercise) {
      setSelectedLibraryExercise(substitutionExercise.exercise);
      setMuscleGroup(substitutionExercise.muscleGroup);
    } else if (currentLibraryExercise) {
      setMuscleGroup(currentLibraryExercise.muscleGroup);
    }
  }

  function addExerciseToWorkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draftSetEntries =
      setEntries.length > 0 ? setEntries : buildSetEntries(sets, weight, reps, rir);
    const invalidSet = draftSetEntries.some((setEntry) => {
      const setWeight = Number(setEntry.weight);
      const setReps = Number(setEntry.reps);
      const setRir = Number(setEntry.rir);

      return setWeight < 0 || setReps < 1 || setRir < 0 || setRir > 10;
    });

    if (draftSetEntries.length < 1) {
      setExerciseError("An exercise must have at least 1 set.");
      return;
    }

    if (invalidSet) {
      setExerciseError("Each set needs weight 0 or higher, reps 1 or higher, and RIR 0-10.");
      return;
    }

    setExerciseError("");

    if (editingCurrentExerciseId) {
      const updatedExercises = currentExercises.map((exerciseEntry) => {
        if (exerciseEntry.id !== editingCurrentExerciseId) {
          return exerciseEntry;
        }

        return {
          ...exerciseEntry,
          exercise,
          muscleGroup,
          setEntries: draftSetEntries,
          sets: String(draftSetEntries.length),
          weight: draftSetEntries[0]?.weight ?? "",
          reps: draftSetEntries[0]?.reps ?? "",
            rir: draftSetEntries[0]?.rir ?? "",
            pump,
            soreness,
            didPartials: draftSetEntries.some((setEntry) => setEntry.didPartials),
            notes: exerciseNotes,
          };
      });

      setCurrentExercises(updatedExercises);
      resetExerciseForm();
      return;
    }

    const newExercise = {
      id: Date.now(),
      exercise,
      muscleGroup,
      setEntries: draftSetEntries,
      sets: String(draftSetEntries.length),
      weight: draftSetEntries[0]?.weight ?? "",
      reps: draftSetEntries[0]?.reps ?? "",
      rir: draftSetEntries[0]?.rir ?? "",
      pump,
      soreness,
      didPartials: draftSetEntries.some((setEntry) => setEntry.didPartials),
      notes: exerciseNotes,
    };

    setCurrentExercises([...currentExercises, newExercise]);
    resetExerciseForm();
  }

  function deleteCurrentExercise(id: AppId) {
    const confirmed = window.confirm(
      "Remove this exercise from the current workout?"
    );

    if (!confirmed) {
      return;
    }

    setCurrentExercises(
      currentExercises.filter((exerciseEntry) => exerciseEntry.id !== id)
    );
    setCompletedSetIds((currentCompletedIds) =>
      Object.fromEntries(
        Object.entries(currentCompletedIds).filter(
          ([completionId]) => !completionId.startsWith(`${id}-`)
        )
      )
    );

    if (editingCurrentExerciseId === id) {
      resetExerciseForm();
    }
  }

  function startEditingCurrentExercise(exerciseEntry: ExerciseEntry) {
    setEditingCurrentExerciseId(exerciseEntry.id);
    setSelectedLibraryExercise("");
    setExercise(exerciseEntry.exercise);
    setMuscleGroup(exerciseEntry.muscleGroup);
    setSets(exerciseEntry.sets);
    setWeight(exerciseEntry.weight);
    setReps(exerciseEntry.reps);
    setRir(exerciseEntry.rir);
    setPump(exerciseEntry.pump);
    setSoreness(exerciseEntry.soreness);
    setExerciseNotes(exerciseEntry.notes ?? "");
    setSetEntries(exerciseEntry.setEntries);
    setDidPartials(exerciseEntry.setEntries.some((setEntry) => setEntry.didPartials));
  }

  function applyWorkoutTemplate(templateName: string) {
    setSelectedTemplate(templateName);

    if (!templateName) {
      return;
    }

    const templateExercises = workoutTemplates[templateName as TemplateName].map(
      (templateExercise, index) => ({
        id: Date.now() + index,
        exercise: templateExercise.exercise,
        muscleGroup: templateExercise.muscleGroup,
        sets: templateExercise.sets,
        weight: "0",
        reps: templateExercise.reps,
        rir: "2",
        setEntries: buildSetEntries(templateExercise.sets, "0", templateExercise.reps, "2"),
        pump: "0",
        soreness: "0",
        didPartials: false,
        notes: "",
      })
    );

    setCurrentExercises(templateExercises);
    setCompletedSetIds({});
    resetElapsedTimer();
  }

  function clearCurrentWorkout() {
    const confirmed = window.confirm(
      "Clear every exercise from the current workout?"
    );

    if (!confirmed) {
      return;
    }

    setCurrentExercises([]);
    setWorkoutMode("plan");
    setSelectedTemplate("");
    setCompletedSetIds({});
    resetElapsedTimer();
    setIsRestTimerRunning(false);
    localStorage.removeItem(activeWorkoutDraftKey);
    resetExerciseForm();
  }

  async function saveWorkout() {
    if (currentExercises.length === 0 || !feeling) {
      return;
    }

    const selectedDate = new Date(workoutDate + "T12:00:00");
    const durationSeconds = isActiveTimerRunning
      ? Math.max(
          elapsedSeconds,
          Math.floor((Date.now() - activeStartedAt) / 1000)
        )
      : elapsedSeconds;

    const newWorkout: Workout = {
      id: Date.now(),
      date: formatWorkoutDate(workoutDate),
      dateISO: selectedDate.toISOString(),
      feeling,
      notes,
      exercises: currentExercises,
    };
    let savedWorkoutForSummary = newWorkout;

    if (userId) {
      try {
        const savedWorkout = await saveWorkoutToSupabase(newWorkout);
        savedWorkoutForSummary = savedWorkout;
        setWorkouts([savedWorkout, ...workouts]);
        setSaveMessage("Workout saved to Supabase.");
      } catch {
        setSaveMessage("Could not save workout to Supabase. Try again.");
        return;
      }
    } else {
      setWorkouts([newWorkout, ...workouts]);
      setSaveMessage("Workout saved on this device.");
    }

    setCompletedWorkoutSummary(
      buildCompletedWorkoutSummary(savedWorkoutForSummary, workouts, durationSeconds)
    );
    setWorkoutMode("summary");
    setShareMessage("");
    setCurrentExercises([]);
    setCompletedSetIds({});
    resetElapsedTimer();
    setRestRemainingSeconds(restSeconds);
    setIsRestTimerRunning(false);
    setWorkoutDate(getTodayInputDate());
    setFeeling("");
    setNotes("");
    localStorage.removeItem(activeWorkoutDraftKey);
  }

  function finishCompletedSummary() {
    setCompletedWorkoutSummary(null);
    setShareMessage("");
    setWorkoutMode("plan");
  }

  function editCompletedWorkout() {
    if (!completedWorkoutSummary) {
      return;
    }

    setCurrentExercises(completedWorkoutSummary.workout.exercises);
    setWorkoutDate(completedWorkoutSummary.workout.dateISO.slice(0, 10));
    setFeeling(completedWorkoutSummary.workout.feeling);
    setNotes(completedWorkoutSummary.workout.notes);
    setCompletedSetIds({});
    resetElapsedTimer();
    setRestRemainingSeconds(restSeconds);
    setIsRestTimerRunning(false);
    setCompletedWorkoutSummary(null);
    setWorkoutMode("active");
    setShareMessage("");
    setSaveMessage(
      "Reopened that workout as an editable draft. Saving again creates a new saved version."
    );
  }

  async function shareCompletedWorkout() {
    if (!completedWorkoutSummary) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: completedWorkoutSummary.title,
          text: completedWorkoutSummary.shareText,
        });
        setShareMessage("Workout summary shared.");
        return;
      }

      await navigator.clipboard.writeText(completedWorkoutSummary.shareText);
      setShareMessage("Workout summary copied to clipboard.");
    } catch {
      setShareMessage("Could not share this workout summary.");
    }
  }

  function addVoiceNote(transcript: string) {
    if (!transcript) {
      return;
    }

    setNotes((currentNotes) =>
      currentNotes ? currentNotes + " " + transcript : transcript
    );
  }

  const allLibraryExercises = [...exerciseLibrary, ...customExercises];
  const libraryMovementOptions = Array.from(
    new Set(
      allLibraryExercises
        .map((libraryExercise) => libraryExercise.movement ?? "Strength")
        .filter(Boolean)
    )
  ).sort((firstMovement, secondMovement) =>
    firstMovement.localeCompare(secondMovement)
  );
  const libraryEquipmentOptions = Array.from(
    new Set(allLibraryExercises.map((libraryExercise) => libraryExercise.equipment))
  ).sort((firstEquipment, secondEquipment) =>
    firstEquipment.localeCompare(secondEquipment)
  );
  const libraryLevelOptions = Array.from(
    new Set(
      allLibraryExercises.map(
        (libraryExercise) => libraryExercise.level ?? "Curated"
      )
    )
  ).sort((firstLevel, secondLevel) => firstLevel.localeCompare(secondLevel));
  const recentExerciseRanks = new Map<string, number>();
  workouts.slice(0, 8).forEach((workout) => {
    workout.exercises.forEach((exerciseEntry) => {
      const exerciseName = normalizeText(exerciseEntry.exercise);

      if (!recentExerciseRanks.has(exerciseName)) {
        recentExerciseRanks.set(exerciseName, recentExerciseRanks.size);
      }
    });
  });
  const programExerciseNames = new Set(
    loadedProgramId
      ? currentExercises.map((exerciseEntry) =>
          normalizeText(exerciseEntry.exercise)
        )
      : []
  );
  const customExerciseNames = new Set(
    customExercises.map((libraryExercise) =>
      normalizeText(libraryExercise.exercise)
    )
  );
  const isVerifiedLibraryItem = (libraryExercise: ExerciseLibraryItem) =>
    !libraryExercise.level &&
    !customExerciseNames.has(normalizeText(libraryExercise.exercise));
  const librarySearch = librarySearchTerm.trim().toLowerCase();
  const filteredLibraryExercises = allLibraryExercises
    .filter((libraryExercise) => {
      const matchesSearch =
        librarySearch === "" ||
        libraryExercise.exercise.toLowerCase().includes(librarySearch) ||
        libraryExercise.target.toLowerCase().includes(librarySearch) ||
        libraryExercise.equipment.toLowerCase().includes(librarySearch) ||
        (libraryExercise.movement ?? "").toLowerCase().includes(librarySearch);
      const matchesMuscle =
        libraryMuscleFilter === allLibraryMuscles ||
        libraryExercise.muscleGroup === libraryMuscleFilter;
      const matchesMovement =
        libraryMovementFilter === allLibraryMovements ||
        (libraryExercise.movement ?? "Strength") === libraryMovementFilter;
      const matchesEquipment =
        libraryEquipmentFilter === allLibraryEquipment ||
        libraryExercise.equipment === libraryEquipmentFilter;
      const matchesLevel =
        libraryLevelFilter === allLibraryLevels ||
        (libraryExercise.level ?? "Curated") === libraryLevelFilter;

      return (
        matchesSearch &&
        matchesMuscle &&
        matchesMovement &&
        matchesEquipment &&
        matchesLevel
      );
    })
    .sort((firstExercise, secondExercise) => {
      const getPriority = (libraryExercise: ExerciseLibraryItem) => {
        const exerciseName = normalizeText(libraryExercise.exercise);
        const recentRank = recentExerciseRanks.get(exerciseName);

        if (recentRank !== undefined) {
          return recentRank;
        }

        if (programExerciseNames.has(exerciseName)) {
          return 100;
        }

        if (isVerifiedLibraryItem(libraryExercise)) {
          return 200;
        }

        return 300;
      };
      const priorityDifference =
        getPriority(firstExercise) - getPriority(secondExercise);

      return priorityDifference !== 0
        ? priorityDifference
        : firstExercise.exercise.localeCompare(secondExercise.exercise);
    })
    .slice(0, 80);
  const selectedLibraryItem = allLibraryExercises.find(
    (item) => item.exercise === selectedLibraryExercise
  );
  const previousExercisePerformance = getPreviousExercisePerformance(
    workouts,
    exercise
  );
  const exerciseHistory = getExerciseHistory(workouts, exercise);
  const totalActiveSets = currentExercises.reduce(
    (totalSets, exerciseEntry) => totalSets + exerciseEntry.setEntries.length,
    0
  );
  const completedActiveSets = currentExercises.reduce(
    (totalSets, exerciseEntry) =>
      totalSets +
      exerciseEntry.setEntries.filter(
        (setEntry) =>
          completedSetIds[getSetCompletionId(exerciseEntry.id, setEntry.id)]
      ).length,
    0
  );

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Train
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            {workoutMode === "plan"
              ? "Build or Start a Workout"
              : workoutMode === "active"
                ? "Active Workout"
                : "Workout Summary"}
          </h1>
          <p className="text-gray-300">
            {workoutMode === "plan"
              ? "Start from today's program, a template, or an empty workout."
              : workoutMode === "active"
                ? "Complete each set, run your rest timer, and finish when training is done."
                : "Review the session, share the result, or continue to your progress."}
          </p>
          {saveMessage && (
            <p className="mt-3 rounded-md border border-white/10 bg-gray-950 p-3 text-sm text-gray-300">
              {saveMessage}
            </p>
          )}
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-gray-900/70 p-2 shadow-xl shadow-black/10 backdrop-blur">
          {(["plan", "active", "summary"] as WorkoutMode[]).map((mode) => {
            const isDisabled =
              (mode === "active" && currentExercises.length === 0) ||
              (mode === "summary" && !completedWorkoutSummary);

            return (
              <button
                key={mode}
                type="button"
                disabled={isDisabled}
                onClick={() => setWorkoutMode(mode)}
                className={
                  "rounded-xl px-3 py-3 text-sm font-semibold capitalize sm:text-base " +
                  (workoutMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10") +
                  (isDisabled ? " cursor-not-allowed opacity-40" : "")
                }
              >
                {mode}
              </button>
            );
          })}
        </div>

        {workoutMode === "summary" && completedWorkoutSummary && (
          <section className="mb-8 rounded-2xl border border-green-400/30 bg-green-950/20 p-5 shadow-[0_0_40px_rgba(34,197,94,0.14)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-300">
                  Workout Complete
                </p>
                <h2 className="text-3xl font-bold">
                  {completedWorkoutSummary.title}
                </h2>
                <p className="mt-2 text-gray-300">
                  {completedWorkoutSummary.muscleInsight}
                </p>
              </div>
              <span className="w-fit rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-sm font-semibold text-green-200">
                Saved
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-white/10 bg-gray-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Duration
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {completedWorkoutSummary.durationMinutes} min
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gray-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Working Sets
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {completedWorkoutSummary.workingSets}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gray-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Volume
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {completedWorkoutSummary.volume.toLocaleString()} lb
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gray-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Average RIR
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {completedWorkoutSummary.averageRir}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gray-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Personal Records
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {completedWorkoutSummary.personalRecords}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/progress"
                className="rounded-md bg-blue-600 px-4 py-3 text-center font-semibold hover:bg-blue-500"
              >
                View insights
              </Link>
              <button
                type="button"
                onClick={shareCompletedWorkout}
                className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
              >
                Share result
              </button>
              <button
                type="button"
                onClick={editCompletedWorkout}
                className="rounded-md bg-gray-800 px-4 py-3 font-semibold hover:bg-gray-700"
              >
                Edit workout
              </button>
              <button
                type="button"
                onClick={finishCompletedSummary}
                className="rounded-md bg-green-600 px-4 py-3 font-semibold hover:bg-green-500"
              >
                Finish
              </button>
            </div>

            {shareMessage && (
              <p className="mt-3 text-sm font-semibold text-green-200">
                {shareMessage}
              </p>
            )}
          </section>
        )}

        <div
          className={
            workoutMode === "plan"
              ? "grid gap-8"
              : workoutMode === "active"
                ? "block"
                : "hidden"
          }
        >
          <div
            className={
              workoutMode === "plan" ? "min-w-0 space-y-6" : "hidden"
            }
          >
            <CollapsibleSection
              title="Workout Template (optional)"
              description="Pick a split to quickly load starter exercises."
            >
              <select
                id="workout-template"
                name="workout-template"
                aria-label="Workout template"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={selectedTemplate}
                onChange={(event) => applyWorkoutTemplate(event.target.value)}
              >
                <option value="">Choose a template</option>
                {Object.keys(workoutTemplates).map((templateName) => (
                  <option key={templateName} value={templateName}>
                    {templateName}
                  </option>
                ))}
              </select>
            </CollapsibleSection>

            <CollapsibleSection
              title={
                editingCurrentExerciseId
                  ? "Edit Current Exercise"
                  : "Exercise Details"
              }
              description={
                editingCurrentExerciseId
                  ? "Update this exercise before saving the workout."
                  : "Add exercises manually or edit exercises loaded from a template."
              }
            >
              <form onSubmit={addExerciseToWorkout} className="space-y-4">
              {exerciseError && (
                <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-200">
                  {exerciseError}
                </p>
              )}
              <div>
                <label htmlFor="exercise-library" className="mb-1 block text-sm text-gray-300">
                  Exercise Library{" "}
                  <span className="text-xs text-gray-500">(optional)</span>
                </label>
                <div className="mb-3 grid gap-3">
                  <div>
                    <input
                      id="exercise-library-search"
                      name="exercise-library-search"
                      list="add-workout-exercise-suggestions"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      type="text"
                      value={librarySearchTerm}
                      onChange={(event) => setLibrarySearchTerm(event.target.value)}
                      placeholder="Start typing: bench, row, cable..."
                    />
                    <datalist id="add-workout-exercise-suggestions">
                      {filteredLibraryExercises.slice(0, 30).map((libraryExercise) => (
                        <option
                          key={libraryExercise.exercise}
                          value={libraryExercise.exercise}
                        />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <select
                      aria-label="Filter library by muscle group"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={libraryMuscleFilter}
                      onChange={(event) => setLibraryMuscleFilter(event.target.value)}
                    >
                      <option value={allLibraryMuscles}>All muscles</option>
                      {muscleGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter library by movement"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={libraryMovementFilter}
                      onChange={(event) => setLibraryMovementFilter(event.target.value)}
                    >
                      <option value={allLibraryMovements}>All movements</option>
                      {libraryMovementOptions.map((movement) => (
                        <option key={movement} value={movement}>
                          {movement}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter library by equipment"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={libraryEquipmentFilter}
                      onChange={(event) =>
                        setLibraryEquipmentFilter(event.target.value)
                      }
                    >
                      <option value={allLibraryEquipment}>All equipment</option>
                      {libraryEquipmentOptions.map((equipment) => (
                        <option key={equipment} value={equipment}>
                          {equipment}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter library by difficulty"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={libraryLevelFilter}
                      onChange={(event) =>
                        setLibraryLevelFilter(event.target.value)
                      }
                    >
                      <option value={allLibraryLevels}>All difficulties</option>
                      {libraryLevelOptions.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {librarySearchTerm.trim() && filteredLibraryExercises.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {filteredLibraryExercises.slice(0, 6).map((libraryExercise) => (
                      <button
                        key={libraryExercise.exercise}
                        type="button"
                        onClick={() => {
                          selectExerciseFromLibrary(libraryExercise.exercise);
                          setLibrarySearchTerm(libraryExercise.exercise);
                        }}
                        className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/15"
                      >
                        {libraryExercise.exercise}
                        {isVerifiedLibraryItem(libraryExercise) && (
                          <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                            Verified
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <select
                  id="exercise-library"
                  name="exercise-library"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={selectedLibraryExercise}
                  onChange={(event) => selectExerciseFromLibrary(event.target.value)}
                >
                  <option value="">
                    Choose from {filteredLibraryExercises.length} matching exercises
                  </option>
                  {filteredLibraryExercises.map((libraryExercise) => (
                    <option
                      key={libraryExercise.exercise}
                      value={libraryExercise.exercise}
                    >
                      {libraryExercise.exercise} - {libraryExercise.muscleGroup}
                      {libraryExercise.movement ? ` - ${libraryExercise.movement}` : ""}
                      {isVerifiedLibraryItem(libraryExercise)
                        ? " - Verified"
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Showing the first {filteredLibraryExercises.length} matches from{" "}
                  {allLibraryExercises.length.toLocaleString()} exercises.
                </p>

                {selectedLibraryItem && (
                  <div className="mt-3 rounded-md border border-gray-800 bg-gray-950 p-3">
                    <p className="mb-2 text-sm font-semibold text-gray-300">
                      Substitutions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLibraryItem.substitutions.map((substitution) => (
                        <button
                          key={substitution}
                          type="button"
                          onClick={() => applySubstitution(substitution)}
                          className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/15"
                        >
                          {substitution}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="exercise" className="mb-1 block text-sm text-gray-300">
                  Exercise
                </label>
                <input
                  id="exercise"
                  name="exercise"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  type="text"
                  value={exercise}
                  onChange={(event) => setExercise(event.target.value)}
                  placeholder="Bench press"
                  required
                />
                {previousExercisePerformance && (
                  <p className="mt-2 rounded-md border border-blue-500/20 bg-blue-950/20 p-3 text-sm text-blue-100">
                    Last time on {previousExercisePerformance.date}:{" "}
                    {summarizeExerciseSets(previousExercisePerformance.exercise)}
                  </p>
                )}
              </div>

              <ExerciseDemo exercise={selectedLibraryItem} />

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                      Exercise History
                    </p>
                    <h3 className="mt-1 font-semibold">
                      {exercise.trim() || "Select an exercise"}
                    </h3>
                  </div>
                  {exerciseHistory.length > 0 && (
                    <span className="w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                      Last {exerciseHistory.length}
                    </span>
                  )}
                </div>

                {exerciseHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Previous sessions for this exercise will show here while logging.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="rounded-md border border-cyan-500/20 bg-cyan-950/20 p-3 text-sm text-cyan-100">
                      {getExerciseHistorySuggestion(exerciseHistory)}
                    </p>
                    {exerciseHistory.map((historyEntry) => (
                      <div
                        key={historyEntry.date + historyEntry.exercise.id}
                        className="rounded-md border border-gray-800 bg-gray-900 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="font-semibold">{historyEntry.date}</p>
                          <p className="text-sm text-gray-400">
                            {historyEntry.setCount}{" "}
                            {historyEntry.setCount === 1 ? "set" : "sets"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-300">
                          {summarizeExerciseSets(historyEntry.exercise)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Top weight: {historyEntry.topWeight || 0} lbs · Avg RIR:{" "}
                          {Math.round(historyEntry.averageRir * 10) / 10}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="muscle-group" className="mb-1 block text-sm text-gray-300">
                  Muscle Group
                </label>
                <select
                  id="muscle-group"
                  name="muscle-group"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={muscleGroup}
                  onChange={(event) => setMuscleGroup(event.target.value)}
                  required
                >
                  {muscleGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="sets" className="mb-1 block text-sm text-gray-300">Sets</label>
                  <input
                    id="sets"
                    name="sets"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    min="1"
                    step="1"
                    value={sets}
                    onChange={(event) => syncSetCount(event.target.value)}
                    placeholder="3"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="weight" className="mb-1 block text-sm text-gray-300">
                    Weight
                  </label>
                  <input
                    id="weight"
                    name="weight"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    min="0"
                    step="0.5"
                    value={weight}
                    onChange={(event) => updateDefaultWeight(event.target.value)}
                    placeholder="135"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="reps" className="mb-1 block text-sm text-gray-300">Reps</label>
                  <input
                    id="reps"
                    name="reps"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    min="1"
                    step="1"
                    value={reps}
                    onChange={(event) => updateDefaultReps(event.target.value)}
                    placeholder="10"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="rir" className="mb-1 block text-sm text-gray-300">RIR</label>
                  <input
                    id="rir"
                    name="rir"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={rir}
                    onChange={(event) => updateDefaultRir(event.target.value)}
                    placeholder="2"
                    required
                  />
                </div>
              </div>

              {setEntries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Set Details</h3>
                      <p className="text-sm text-gray-400">
                        Edit weight, reps, RIR, and partials before adding the exercise.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addDraftSet}
                      className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                    >
                      Add Set
                    </button>
                  </div>

                  {setEntries.map((setEntry) => (
                    <div
                      key={setEntry.id}
                      className="grid gap-3 rounded-md border border-gray-800 bg-gray-950 p-3 sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto]"
                    >
                      <p className="self-center text-sm font-semibold text-gray-300">
                        Set {setEntry.setNumber}
                      </p>

                      <div>
                        <label className="mb-1 block text-xs text-gray-400">
                          Weight
                        </label>
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                          type="number"
                          min="0"
                          step="0.5"
                          value={setEntry.weight}
                          onChange={(event) =>
                            updateDraftSet(setEntry.id, "weight", event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-gray-400">
                          Reps
                        </label>
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                          type="number"
                          min="1"
                          step="1"
                          value={setEntry.reps}
                          onChange={(event) =>
                            updateDraftSet(setEntry.id, "reps", event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-gray-400">
                          RIR
                        </label>
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                          type="number"
                          min="0"
                          max="10"
                          step="1"
                          value={setEntry.rir}
                          onChange={(event) =>
                            updateDraftSet(setEntry.id, "rir", event.target.value)
                          }
                        />
                      </div>

                      <label className="flex items-end gap-2 text-sm text-gray-300 sm:pb-2">
                        <input
                          type="checkbox"
                          checked={setEntry.didPartials}
                          onChange={(event) =>
                            updateDraftSet(
                              setEntry.id,
                              "didPartials",
                              event.target.checked
                            )
                          }
                        />
                        Partials
                      </label>

                      <button
                        type="button"
                        onClick={() => removeDraftSet(setEntry.id)}
                        className="self-end rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500 sm:self-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pump" className="mb-1 block text-sm text-gray-300">
                    Pump
                  </label>
                  <select
                    id="pump"
                    name="pump"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={pump}
                    onChange={(event) => setPump(event.target.value)}
                  >
                    <option value="0">0 - None</option>
                    <option value="1">1 - Mild</option>
                    <option value="2">2 - Good</option>
                    <option value="3">3 - Strong</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="soreness" className="mb-1 block text-sm text-gray-300">
                    Soreness
                  </label>
                  <select
                    id="soreness"
                    name="soreness"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={soreness}
                    onChange={(event) => setSoreness(event.target.value)}
                  >
                    <option value="0">0 - None</option>
                    <option value="1">1 - Mild</option>
                    <option value="2">2 - Moderate</option>
                    <option value="3">3 - High</option>
                  </select>
                </div>
              </div>

              <label htmlFor="did-partials" className="flex items-center gap-3 text-gray-300">
                <input
                  id="did-partials"
                  name="did-partials"
                  type="checkbox"
                  checked={didPartials}
                  onChange={(event) => updateAllSetPartials(event.target.checked)}
                />
                Mark all sets as partial reps
              </label>

              <div>
                <label htmlFor="exercise-notes" className="mb-1 block text-sm text-gray-300">
                  Exercise notes
                </label>
                <textarea
                  id="exercise-notes"
                  name="exercise-notes"
                  className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={exerciseNotes}
                  onChange={(event) => setExerciseNotes(event.target.value)}
                  placeholder="Technique notes, pain-free variation, seat setting, grip width..."
                />
              </div>

              <button
                className="w-full rounded-md bg-blue-600 p-3 font-semibold hover:bg-blue-500"
                type="submit"
              >
                {editingCurrentExerciseId
                  ? "Save Exercise Changes"
                  : "Add Exercise To Workout"}
              </button>

              {editingCurrentExerciseId && (
                <button
                  type="button"
                  onClick={resetExerciseForm}
                  className="w-full rounded-md bg-gray-800 p-3 font-semibold hover:bg-gray-700"
                >
                  Cancel Edit
                </button>
              )}
            </form>
            </CollapsibleSection>

            <CollapsibleSection
              title="Workout Details"
              description="Add how the full workout felt and any notes."
            >
            <div className="space-y-4">
              <div>
                <label htmlFor="workout-date" className="mb-1 block text-sm text-gray-300">
                  Workout date
                </label>
                <input
                  id="workout-date"
                  name="workout-date"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  type="date"
                  value={workoutDate}
                  onChange={(event) => setWorkoutDate(event.target.value)}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use this if you forgot to log a previous workout.
                </p>
              </div>

              <div>
                <label htmlFor="workout-feeling" className="mb-1 block text-sm text-gray-300">
                  How did the workout feel?
                </label>
                <select
                  id="workout-feeling"
                  name="workout-feeling"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={feeling}
                  onChange={(event) => setFeeling(event.target.value)}
                >
                  <option value="">Choose one</option>
                  <option value="Great">Great</option>
                  <option value="Good">Good</option>
                  <option value="Okay">Okay</option>
                  <option value="Tired">Tired</option>
                  <option value="Weak">Weak</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="workout-notes" className="block text-sm text-gray-300">
                    Workout notes
                  </label>
                  <SpeechToTextButton onTranscript={addVoiceNote} />
                </div>
                <textarea
                  id="workout-notes"
                  name="workout-notes"
                  className="min-h-28 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="How did the workout go? Any aches, PRs, or things to remember next time?"
                />
              </div>

              <button
                type="button"
                onClick={() => setWorkoutMode("active")}
                disabled={currentExercises.length === 0}
                className="w-full rounded-md bg-blue-600 p-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                Continue to Active Workout
              </button>
            </div>
            </CollapsibleSection>
          </div>

          <div className={workoutMode === "active" ? "min-w-0" : "hidden"}>
            <CollapsibleSection
              title="Active Workout"
              description="Complete sets during training. Your draft autosaves after every change."
            >
            <div className="mb-5 flex flex-col gap-2 rounded-lg border border-cyan-400/20 bg-cyan-950/20 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-cyan-100">
                Draft saved on this device
              </p>
              <p className="text-gray-300">
                {userId
                  ? "Finish the workout to sync it to your account."
                  : "Finish the workout to save it on this device."}
              </p>
            </div>
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                  Elapsed
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {formatElapsedTime(elapsedSeconds)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startOrPauseActiveTimer}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"
                  >
                    {isActiveTimerRunning
                      ? "Pause"
                      : elapsedSeconds > 0
                        ? "Resume"
                        : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={resetElapsedTimer}
                    className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-200">
                  Completed Sets
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {completedActiveSets}/{totalActiveSets}
                </p>
              </div>

              <div className="rounded-lg border border-pink-500/20 bg-pink-950/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-200">
                      Rest Timer
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {formatElapsedTime(restRemainingSeconds)}
                    </p>
                  </div>
                  <select
                    aria-label="Rest timer length"
                    className="rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
                    value={restSeconds}
                    onChange={(event) => {
                      const nextRestSeconds = Number(event.target.value);
                      setRestSeconds(nextRestSeconds);
                      setRestRemainingSeconds(nextRestSeconds);
                      setIsRestTimerRunning(false);
                    }}
                  >
                    <option value={60}>60s</option>
                    <option value={90}>90s</option>
                    <option value={120}>120s</option>
                    <option value={180}>180s</option>
                  </select>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRestTimerRunning(!isRestTimerRunning)}
                    className="rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold hover:bg-pink-500"
                  >
                    {isRestTimerRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestRemainingSeconds(restSeconds);
                      setIsRestTimerRunning(false);
                    }}
                    className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {currentExercises.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetActiveWorkoutDraft}
                    className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                  >
                    Reset Active Mode
                  </button>
                  <button
                    type="button"
                    onClick={clearCurrentWorkout}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                  >
                    Clear Workout
                  </button>
                </div>
              )}
            </div>

            {currentExercises.length === 0 ? (
              <EmptyState
                title="No exercises added yet"
                description="Add an exercise manually, choose one from the library, or load a workout template."
              />
            ) : (
              <div className="space-y-5">
                {currentExercises.map((exerciseEntry) => (
                  <div
                    key={exerciseEntry.id}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">
                          {exerciseEntry.exercise}
                        </h3>
                        <p className="text-sm font-semibold text-blue-300">
                          {exerciseEntry.muscleGroup}
                        </p>
                        <p className="text-sm text-gray-400">
                          Pump: {exerciseEntry.pump}/3 · Soreness:{" "}
                          {exerciseEntry.soreness}/3
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addActiveSet(exerciseEntry.id)}
                          className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                        >
                          Add Set
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSwapExerciseId(
                              swapExerciseId === exerciseEntry.id
                                ? null
                                : exerciseEntry.id
                            )
                          }
                          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"
                        >
                          Swap
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingCurrentExercise(exerciseEntry)}
                          className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                        >
                          Edit Exercise
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCurrentExercise(exerciseEntry.id)}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <ActiveExerciseHistory
                      workouts={workouts}
                      exerciseName={exerciseEntry.exercise}
                    />

                    {swapExerciseId === exerciseEntry.id && (
                      <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-950/20 p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
                              Swap {exerciseEntry.exercise}
                            </p>
                            <p className="mt-1 text-sm text-gray-300">
                              Suggestions prioritize same primary muscle, library
                              substitutions, similar equipment, and target overlap.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSwapExerciseId(null)}
                            className="w-fit rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {getSwapSuggestions(
                            exerciseEntry,
                            allLibraryExercises
                          ).map((suggestion) => (
                            <button
                              key={suggestion.exercise}
                              type="button"
                              onClick={() =>
                                swapActiveExercise(exerciseEntry.id, suggestion)
                              }
                              className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-left hover:bg-gray-900"
                            >
                              <span className="block font-semibold">
                                {suggestion.exercise}
                              </span>
                              <span className="mt-1 block text-sm text-gray-400">
                                {suggestion.muscleGroup} · {suggestion.equipment}
                              </span>
                              <span className="mt-2 block text-xs text-blue-200">
                                {suggestion.reasons.join(" · ")}
                              </span>
                            </button>
                          ))}
                        </div>

                        {getSwapSuggestions(exerciseEntry, allLibraryExercises)
                          .length === 0 && (
                          <p className="text-sm text-gray-400">
                            No close substitutions found yet. Add more exercises
                            to the library to improve suggestions.
                          </p>
                        )}

                        <p className="mt-3 text-xs text-gray-500">
                          Swapping changes this workout only. Past workouts and
                          the saved program stay unchanged.
                        </p>
                      </div>
                    )}

                    <div className="max-w-full overflow-x-auto">
                      <div className="min-w-[680px]">
                        <div className="grid grid-cols-[4rem_7rem_1fr_1fr_1fr_5rem_5rem_5rem] gap-2 border-b border-gray-800 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <p>Set</p>
                          <p>Previous</p>
                          <p>Weight</p>
                          <p>Reps</p>
                          <p>RIR</p>
                          <p>Partials</p>
                          <p>Done</p>
                          <p>Drop</p>
                        </div>

                        <div className="space-y-2 pt-2">
                          {exerciseEntry.setEntries.map((setEntry) => {
                            const completionId = getSetCompletionId(
                              exerciseEntry.id,
                              setEntry.id
                            );
                            const isDone = completedSetIds[completionId] ?? false;

                            return (
                              <div
                                key={setEntry.id}
                                className={
                                  "grid grid-cols-[4rem_7rem_1fr_1fr_1fr_5rem_5rem_5rem] items-center gap-2 rounded-lg border p-2 " +
                                  (isDone
                                    ? "border-green-500/30 bg-green-950/20"
                                    : "border-gray-800 bg-gray-900/60")
                                }
                              >
                                <p className="font-semibold">
                                  {setEntry.setNumber}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {getPreviousSetLabel(
                                    workouts,
                                    exerciseEntry.exercise,
                                    setEntry.setNumber
                                  )}
                                </p>
                                <input
                                  aria-label={`${exerciseEntry.exercise} set ${setEntry.setNumber} weight`}
                                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={setEntry.weight}
                                  onChange={(event) =>
                                    updateActiveSet(
                                      exerciseEntry.id,
                                      setEntry.id,
                                      "weight",
                                      event.target.value
                                    )
                                  }
                                />
                                <input
                                  aria-label={`${exerciseEntry.exercise} set ${setEntry.setNumber} reps`}
                                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={setEntry.reps}
                                  onChange={(event) =>
                                    updateActiveSet(
                                      exerciseEntry.id,
                                      setEntry.id,
                                      "reps",
                                      event.target.value
                                    )
                                  }
                                />
                                <input
                                  aria-label={`${exerciseEntry.exercise} set ${setEntry.setNumber} RIR`}
                                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2"
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={setEntry.rir}
                                  onChange={(event) =>
                                    updateActiveSet(
                                      exerciseEntry.id,
                                      setEntry.id,
                                      "rir",
                                      event.target.value
                                    )
                                  }
                                />
                                <label className="flex justify-center">
                                  <input
                                    aria-label={`${exerciseEntry.exercise} set ${setEntry.setNumber} partial reps`}
                                    type="checkbox"
                                    checked={setEntry.didPartials}
                                    onChange={(event) =>
                                      updateActiveSet(
                                        exerciseEntry.id,
                                        setEntry.id,
                                        "didPartials",
                                        event.target.checked
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleActiveSetDone(
                                      exerciseEntry.id,
                                      setEntry.id
                                    )
                                  }
                                  className={
                                    "rounded-md px-3 py-2 text-sm font-semibold " +
                                    (isDone
                                      ? "bg-green-600 hover:bg-green-500"
                                      : "bg-gray-800 hover:bg-gray-700")
                                  }
                                >
                                  {isDone ? "✓" : "○"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    dropActiveSet(exerciseEntry.id, setEntry.id)
                                  }
                                  disabled={exerciseEntry.setEntries.length <= 1}
                                  className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  -
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor={`active-notes-${exerciseEntry.id}`}
                        className="mb-1 block text-sm text-gray-300"
                      >
                        Notes for this exercise
                      </label>
                      <textarea
                        id={`active-notes-${exerciseEntry.id}`}
                        className="min-h-20 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                        value={exerciseEntry.notes}
                        onChange={(event) =>
                          updateActiveExerciseNotes(
                            exerciseEntry.id,
                            event.target.value
                          )
                        }
                        placeholder="Cues, equipment setup, pain, tempo, or next-session reminders..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentExercises.length > 0 && (
              <section className="mt-6 rounded-xl border border-green-400/20 bg-green-950/10 p-4 sm:p-5">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-300">
                    Finish Workout
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">
                    Final session check-in
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Add the workout date and how the session felt before saving.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="active-workout-date"
                      className="mb-1 block text-sm text-gray-300"
                    >
                      Workout date
                    </label>
                    <input
                      id="active-workout-date"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      type="date"
                      value={workoutDate}
                      onChange={(event) => setWorkoutDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="active-workout-feeling"
                      className="mb-1 block text-sm text-gray-300"
                    >
                      How did the workout feel?
                    </label>
                    <select
                      id="active-workout-feeling"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={feeling}
                      onChange={(event) => setFeeling(event.target.value)}
                    >
                      <option value="">Choose one</option>
                      <option value="Great">Great</option>
                      <option value="Good">Good</option>
                      <option value="Okay">Okay</option>
                      <option value="Tired">Tired</option>
                      <option value="Weak">Weak</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      htmlFor="active-workout-notes"
                      className="block text-sm text-gray-300"
                    >
                      Workout notes
                    </label>
                    <SpeechToTextButton onTranscript={addVoiceNote} />
                  </div>
                  <textarea
                    id="active-workout-notes"
                    className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="PRs, pain, technique notes, or what to change next time..."
                  />
                </div>

                <button
                  type="button"
                  onClick={saveWorkout}
                  disabled={!feeling}
                  className="mt-5 w-full rounded-lg bg-green-600 p-4 text-lg font-semibold hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  Finish and Save Workout
                </button>
                {!feeling && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    Choose how the workout felt to finish.
                  </p>
                )}
              </section>
            )}
            </CollapsibleSection>
          </div>
        </div>
      </section>
    </main>
  );
}
