import type { ExerciseLibraryItem } from "../lib/fitnessData";

type ExerciseDemoProps = {
  exercise: ExerciseLibraryItem | undefined;
};

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
    return "Keep the upper arm quiet, curl with control, and avoid swinging the weight.";
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
  if (!exercise) {
    return (
      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
        Choose an exercise from the library to see setup cues and a simple movement demo.
      </div>
    );
  }

  const commonMistakes = getCommonMistakes(exercise);
  const isBenchPress = exercise.exercise.trim().toLowerCase() === "bench press";
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
