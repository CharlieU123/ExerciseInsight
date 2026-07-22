import type { ExerciseLibraryItem } from "../lib/fitnessData";

type ExerciseDemoProps = {
  exercise: ExerciseLibraryItem | undefined;
};

function getMotionLabel(muscleGroup: string) {
  const group = muscleGroup.toLowerCase();

  if (group.includes("quad") || group.includes("hamstring") || group.includes("glute")) {
    return "Lower with control, drive through the floor, finish tall.";
  }

  if (group.includes("back") || group.includes("bicep")) {
    return "Reach, pull with the target muscle, pause before returning.";
  }

  if (group.includes("chest") || group.includes("shoulder") || group.includes("tricep")) {
    return "Brace, press smoothly, control the lowering phase.";
  }

  return "Use a controlled range of motion and keep tension on the target.";
}

export function ExerciseDemo({ exercise }: ExerciseDemoProps) {
  if (!exercise) {
    return (
      <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
        Choose an exercise from the library to see setup cues and a simple movement demo.
      </div>
    );
  }

  const cues = exercise.cues.slice(0, 3);

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Demo and Cues
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
        <div className="relative h-20 overflow-hidden rounded-md bg-gray-900">
          <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-800" />
          <div className="absolute left-6 top-1/2 h-1 w-2/3 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
          <div className="absolute left-6 top-1/2 h-8 w-8 -translate-y-1/2 animate-pulse rounded-full border border-cyan-300 bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.5)]" />
          <div className="absolute bottom-3 left-6 right-6 flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Start</span>
            <span>Control</span>
            <span>Finish</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-300">{getMotionLabel(exercise.muscleGroup)}</p>
      </div>

      <div className="space-y-2">
        {cues.map((cue) => (
          <p key={cue} className="rounded-md bg-white/5 px-3 py-2 text-sm text-gray-300">
            {cue}
          </p>
        ))}
      </div>
    </div>
  );
}
