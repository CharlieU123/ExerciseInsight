import type { ExerciseLibraryItem } from "../lib/fitnessData";

type ExerciseDemoProps = {
  exercise: ExerciseLibraryItem | undefined;
};

type DemoPattern =
  | "press"
  | "pull"
  | "squat"
  | "hinge"
  | "curl"
  | "raise"
  | "brace";

function getDemoPattern(exercise: ExerciseLibraryItem): DemoPattern {
  const name = exercise.exercise.toLowerCase();
  const group = exercise.muscleGroup.toLowerCase();

  if (
    name.includes("deadlift") ||
    name.includes("thrust") ||
    name.includes("pull-through")
  ) {
    return "hinge";
  }

  if (name.includes("squat") || (name.includes("press") && group.includes("quad"))) {
    return "squat";
  }

  if (name.includes("curl")) {
    return "curl";
  }

  if (name.includes("raise") || name.includes("fly") || name.includes("face pull")) {
    return "raise";
  }

  if (name.includes("plank") || group.includes("core")) {
    return "brace";
  }

  if (group.includes("back") || group.includes("bicep")) {
    return "pull";
  }

  return "press";
}

function getMotionLabel(exercise: ExerciseLibraryItem) {
  const pattern = getDemoPattern(exercise);
  const group = exercise.muscleGroup.toLowerCase();

  if (pattern === "squat") {
    return "Descend with control, keep pressure through the foot, then drive up hard.";
  }

  if (pattern === "hinge") {
    return "Push the hips back, keep tension through the posterior chain, then squeeze through.";
  }

  if (pattern === "pull") {
    return "Reach into the stretch, pull through the elbow, then return under control.";
  }

  if (pattern === "curl") {
    return "Keep the upper arm quiet, curl with control, and avoid swinging the weight.";
  }

  if (pattern === "raise") {
    return "Lead with the target muscle, pause briefly, and lower slowly.";
  }

  if (pattern === "brace") {
    return "Brace hard, hold position, and keep breathing controlled.";
  }

  if (group.includes("chest") || group.includes("shoulder") || group.includes("tricep")) {
    return "Brace, press smoothly, and control the lowering phase.";
  }

  return "Use a controlled range of motion and keep tension on the target.";
}

function getSetupCue(exercise: ExerciseLibraryItem) {
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

  const pattern = getDemoPattern(exercise);
  const commonMistakes = getCommonMistakes(exercise);
  const demoSteps = [
    {
      title: "Setup",
      detail: getSetupCue(exercise),
    },
    {
      title: "Execution",
      detail: getMotionLabel(exercise),
    },
    {
      title: "Focus",
      detail: exercise.cues[0] ?? "Keep each rep consistent and controlled.",
    },
  ];

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Exercise Demo
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

      <div className="mb-4 rounded-lg border border-gray-800 bg-gray-950 p-4">
        <div className={"exercise-demo-stage exercise-demo-" + pattern}>
          <div className="exercise-demo-body">
            <span className="exercise-demo-head" />
            <span className="exercise-demo-torso" />
            <span className="exercise-demo-arm exercise-demo-arm-left" />
            <span className="exercise-demo-arm exercise-demo-arm-right" />
            <span className="exercise-demo-leg exercise-demo-leg-left" />
            <span className="exercise-demo-leg exercise-demo-leg-right" />
          </div>
          <div className="exercise-demo-track" />
          <div className="exercise-demo-load" />
          <div className="absolute bottom-3 left-6 right-6 flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Start</span>
            <span>Control</span>
            <span>Finish</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-300">{getMotionLabel(exercise)}</p>
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
