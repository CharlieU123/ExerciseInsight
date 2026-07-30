"use client";

import { useEffect, useState } from "react";
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

type ActiveWorkoutDraft = {
  workoutDate: string;
  feeling: string;
  notes: string;
  currentExercises: ExerciseEntry[];
  completedSetIds: Record<string, boolean>;
  activeStartedAt: number;
};

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

export default function AddWorkoutPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState("");
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
  const [restSeconds, setRestSeconds] = useState(defaultRestSeconds);
  const [restRemainingSeconds, setRestRemainingSeconds] =
    useState(defaultRestSeconds);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);

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
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeStartedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeStartedAt]);

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
    };

    localStorage.setItem(activeWorkoutDraftKey, JSON.stringify(draft));
  }, [
    activeStartedAt,
    completedSetIds,
    currentExercises,
    feeling,
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
      setSelectedTemplate("");
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
  }, [hasLoadedSavedData, loadedProgramId, userId]);

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

  function resetActiveWorkoutDraft() {
    const confirmed = window.confirm("Reset the active workout timer and completed sets?");

    if (!confirmed) {
      return;
    }

    setCompletedSetIds({});
    setActiveStartedAt(Date.now());
    setElapsedSeconds(0);
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
    setActiveStartedAt(Date.now());
  }

  function clearCurrentWorkout() {
    const confirmed = window.confirm(
      "Clear every exercise from the current workout?"
    );

    if (!confirmed) {
      return;
    }

    setCurrentExercises([]);
    setSelectedTemplate("");
    setCompletedSetIds({});
    setActiveStartedAt(Date.now());
    setElapsedSeconds(0);
    setIsRestTimerRunning(false);
    localStorage.removeItem(activeWorkoutDraftKey);
    resetExerciseForm();
  }

  async function saveWorkout() {
    if (currentExercises.length === 0 || !feeling) {
      return;
    }

    const selectedDate = new Date(workoutDate + "T12:00:00");

    const newWorkout = {
      id: Date.now(),
      date: formatWorkoutDate(workoutDate),
      dateISO: selectedDate.toISOString(),
      feeling,
      notes,
      exercises: currentExercises,
    };

    if (userId) {
      try {
        const savedWorkout = await saveWorkoutToSupabase(newWorkout);
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

    setCurrentExercises([]);
    setCompletedSetIds({});
    setActiveStartedAt(Date.now());
    setElapsedSeconds(0);
    setRestRemainingSeconds(restSeconds);
    setIsRestTimerRunning(false);
    setWorkoutDate(getTodayInputDate());
    setFeeling("");
    setNotes("");
    localStorage.removeItem(activeWorkoutDraftKey);
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
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Add Workout
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Build a Workout Session</h1>
          <p className="text-gray-300">
            Add exercises one at a time, then save the full workout.
          </p>
          {saveMessage && (
            <p className="mt-3 rounded-md border border-white/10 bg-gray-950 p-3 text-sm text-gray-300">
              {saveMessage}
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
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
                <select
                  id="exercise-library"
                  name="exercise-library"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={selectedLibraryExercise}
                  onChange={(event) => selectExerciseFromLibrary(event.target.value)}
                >
                  <option value="">Choose from library</option>
                  {allLibraryExercises.map((libraryExercise) => (
                    <option
                      key={libraryExercise.exercise}
                      value={libraryExercise.exercise}
                    >
                      {libraryExercise.exercise} - {libraryExercise.muscleGroup}
                    </option>
                  ))}
                </select>

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
                onClick={saveWorkout}
                disabled={currentExercises.length === 0 || !feeling}
                className="w-full rounded-md bg-green-600 p-3 font-semibold hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                Save Full Workout
              </button>
            </div>
            </CollapsibleSection>
          </div>

          <CollapsibleSection
            title="Active Workout"
            description="Use this screen during the workout. Changes autosave on this device."
          >
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                  Elapsed
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {formatElapsedTime(elapsedSeconds)}
                </p>
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

                    <div className="overflow-x-auto">
                      <div className="min-w-[760px]">
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
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
