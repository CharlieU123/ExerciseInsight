"use client";

import { useEffect, useState } from "react";
import type { ExerciseLibraryItem } from "../lib/fitnessData";

type ExerciseDemoProps = {
  exercise: ExerciseLibraryItem | undefined;
};

type ExerciseDbExercise = {
  name: string;
  gifUrl: string;
  bodyParts: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  equipments: string[];
  instructions: string[];
};

const exerciseDemoCache = new Map<string, ExerciseDbExercise | null>();

function normalizeExerciseName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildExerciseDbSearchTerm(exercise: ExerciseLibraryItem) {
  const exerciseName = exercise.exercise.toLowerCase();
  const equipment = exercise.equipment.toLowerCase();

  if (
    !exerciseName.includes("barbell") &&
    equipment.includes("barbell") &&
    !equipment.includes("dumbbell")
  ) {
    return `barbell ${exercise.exercise}`;
  }

  if (!exerciseName.includes("dumbbell") && equipment.includes("dumbbell")) {
    return `dumbbell ${exercise.exercise}`;
  }

  if (!exerciseName.includes("cable") && equipment.includes("cable")) {
    return `cable ${exercise.exercise}`;
  }

  return exercise.exercise;
}

function findBestExerciseDbMatch(
  exercise: ExerciseLibraryItem,
  apiExercises: ExerciseDbExercise[]
) {
  const normalizedExerciseName = normalizeExerciseName(exercise.exercise);
  const normalizedSearchTerm = normalizeExerciseName(buildExerciseDbSearchTerm(exercise));

  return (
    apiExercises.find(
      (apiExercise) => normalizeExerciseName(apiExercise.name) === normalizedSearchTerm
    ) ??
    apiExercises.find(
      (apiExercise) => normalizeExerciseName(apiExercise.name) === normalizedExerciseName
    ) ??
    apiExercises.find((apiExercise) =>
      normalizeExerciseName(apiExercise.name).includes(normalizedExerciseName)
    ) ??
    apiExercises[0] ??
    null
  );
}

function getMotionLabel(exercise: ExerciseLibraryItem) {
  const name = exercise.exercise.toLowerCase();
  const group = exercise.muscleGroup.toLowerCase();

  if (name.includes("squat")) {
    return "Descend with control, keep pressure through the foot, then drive up hard.";
  }

  if (
    name.includes("deadlift") ||
    name.includes("thrust") ||
    name.includes("pull-through")
  ) {
    return "Push the hips back, keep tension through the posterior chain, then squeeze through.";
  }

  if (group.includes("back")) {
    return "Reach into the stretch, pull through the elbow, then return under control.";
  }

  if (name.includes("curl")) {
    return "Keep your elbows mostly still, curl the weight smoothly, and lower it under control.";
  }

  if (name.includes("raise") || name.includes("fly") || name.includes("face pull")) {
    return "Lead with the target muscle, pause briefly, and lower slowly.";
  }

  if (name.includes("plank") || group.includes("core")) {
    return "Brace hard, hold position, and keep breathing controlled.";
  }

  if (group.includes("chest") || group.includes("shoulder") || group.includes("tricep")) {
    return "Brace, press smoothly, and control the lowering phase.";
  }

  return "Use a controlled range of motion and keep tension on the target.";
}

function getBenchPressSetupCue() {
  return "Lie with your eyes under the bar, plant your feet, and pull your shoulder blades back and down into the bench.";
}

function getBenchPressExecutionCue() {
  return "Lower the bar under control toward your mid-chest, keep your elbows slightly tucked, then press while keeping your upper back tight.";
}

function getBenchPressCommonMistakes() {
  return [
    "Bouncing the bar off your chest",
    "Letting shoulders roll forward",
    "Lifting your feet off the floor",
  ];
}

function getPracticeTip(exercise: ExerciseLibraryItem) {
  if (exercise.exercise.trim().toLowerCase() === "bench press") {
    return "Use a lighter load until every rep touches the same spot and moves on the same path.";
  }

  return "Start lighter than you think you need and make every rep look the same before adding load.";
}

function getSetupCue(exercise: ExerciseLibraryItem) {
  if (exercise.exercise.trim().toLowerCase() === "bench press") {
    return getBenchPressSetupCue();
  }

  const equipment = exercise.equipment.toLowerCase();

  if (equipment.includes("barbell")) {
    return "Set your grip, brace your torso, and keep the bar path repeatable.";
  }

  if (equipment.includes("dumbbell")) {
    return "Set your bench/body position first, then move both dumbbells evenly.";
  }

  if (equipment.includes("cable")) {
    return "Line the cable up with the target muscle and start with tension on the stack.";
  }

  if (equipment.includes("machine")) {
    return "Adjust the seat and pad so the machine lines up with the target joint.";
  }

  if (equipment.includes("bodyweight")) {
    return "Set a stable body position before the first rep.";
  }

  return "Set your position before loading the working reps.";
}

function getCommonMistakes(exercise: ExerciseLibraryItem) {
  if (exercise.exercise.trim().toLowerCase() === "bench press") {
    return getBenchPressCommonMistakes();
  }

  const group = exercise.muscleGroup.toLowerCase();

  if (group.includes("quad")) {
    return ["Cutting depth short", "Letting knees cave", "Rushing the bottom"];
  }

  if (group.includes("hamstring") || group.includes("glute")) {
    return [
      "Turning it into a lower-back lift",
      "Losing hip control",
      "Skipping the stretched range",
    ];
  }

  if (group.includes("back") || group.includes("bicep")) {
    return [
      "Pulling with momentum",
      "Shrugging into the traps",
      "Skipping the stretched position",
    ];
  }

  if (group.includes("chest") || group.includes("shoulder") || group.includes("tricep")) {
    return [
      "Bouncing reps",
      "Losing shoulder position",
      "Letting tension disappear",
    ];
  }

  if (group.includes("core")) {
    return ["Holding your breath too long", "Letting hips sag", "Losing rib position"];
  }

  return [
    "Moving too fast",
    "Using a shorter range than planned",
    "Chasing load before control",
  ];
}

export function ExerciseDemo({ exercise }: ExerciseDemoProps) {
  const [exerciseDbDemo, setExerciseDbDemo] = useState<ExerciseDbExercise | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  useEffect(() => {
    if (!exercise) {
      setExerciseDbDemo(null);
      return;
    }

    const selectedExercise = exercise;
    const searchTerm = buildExerciseDbSearchTerm(selectedExercise);
    const cacheKey = normalizeExerciseName(searchTerm);
    const cachedExercise = exerciseDemoCache.get(cacheKey);

    if (exerciseDemoCache.has(cacheKey)) {
      setExerciseDbDemo(cachedExercise ?? null);
      return;
    }

    let isMounted = true;

    async function loadExerciseDemo() {
      setIsLoadingDemo(true);

      try {
        const response = await fetch(
          `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(
            searchTerm
          )}&limit=50`
        );

        if (!response.ok) {
          throw new Error("Exercise demo unavailable");
        }

        const payload = (await response.json()) as { data?: ExerciseDbExercise[] };
        const bestMatch = findBestExerciseDbMatch(selectedExercise, payload.data ?? []);

        exerciseDemoCache.set(cacheKey, bestMatch);

        if (isMounted) {
          setExerciseDbDemo(bestMatch);
        }
      } catch {
        exerciseDemoCache.set(cacheKey, null);

        if (isMounted) {
          setExerciseDbDemo(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDemo(false);
        }
      }
    }

    loadExerciseDemo();

    return () => {
      isMounted = false;
    };
  }, [exercise]);

  if (!exercise) {
    return (
      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
        Choose an exercise from the library to see setup cues and a simple movement demo.
      </div>
    );
  }

  const commonMistakes = getCommonMistakes(exercise);
  const isBenchPress = exercise.exercise.trim().toLowerCase() === "bench press";
  const instructionSteps = exerciseDbDemo?.instructions?.length
    ? exerciseDbDemo.instructions.slice(0, 5).map((instruction) =>
        instruction.replace(/^Step:\d+\s*/i, "")
      )
    : exercise.cues;
  const demoSteps = [
    {
      title: "Setup",
      detail: getSetupCue(exercise),
    },
    {
      title: "Execution",
      detail: isBenchPress ? getBenchPressExecutionCue() : getMotionLabel(exercise),
    },
    {
      title: "Practice Tip",
      detail: getPracticeTip(exercise),
    },
  ];

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Form Cues
          </p>
          <h3 className="mt-1 font-semibold text-white">{exercise.exercise}</h3>
          <p className="text-sm text-gray-400">
            {exercise.target} · {exercise.equipment}
          </p>
        </div>
        <span className="w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {exercise.muscleGroup}
        </span>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-lg border border-cyan-500/20 bg-gray-950">
          {exerciseDbDemo?.gifUrl ? (
            <img
              src={exerciseDbDemo.gifUrl}
              alt={`${exerciseDbDemo.name} demonstration`}
              className="h-72 w-full object-contain"
            />
          ) : (
            <div className="flex h-72 items-center justify-center p-6 text-center text-sm text-gray-400">
              {isLoadingDemo
                ? "Loading movement demonstration..."
                : "No hosted GIF found yet. Use the form cues below."}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Demonstration Notes
          </p>
          <div className="space-y-2">
            {instructionSteps.map((instruction) => (
              <p
                key={instruction}
                className="rounded-md bg-white/5 px-3 py-2 text-sm text-gray-300"
              >
                {instruction}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {demoSteps.map((step) => (
          <div key={step.title} className="rounded-md bg-white/5 px-3 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              {step.title}
            </p>
            <p className="text-sm text-gray-300">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-yellow-500/20 bg-yellow-950/20 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-yellow-200">
          Common Mistakes
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {commonMistakes.map((mistake) => (
            <p key={mistake} className="text-sm text-gray-300">
              {mistake}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
