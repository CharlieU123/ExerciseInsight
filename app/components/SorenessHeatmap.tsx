import type { Workout } from "../lib/fitnessData";

type MuscleSoreness = {
  muscleGroup: string;
  soreness: number;
};

type BodyRegion = {
  id: string;
  label: string;
  muscleGroups: string[];
  shape: "ellipse" | "rect";
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
};

const bodyRegions: BodyRegion[] = [
  {
    id: "shoulders",
    label: "Shoulders",
    muscleGroups: ["Shoulders"],
    shape: "ellipse",
    cx: 150,
    cy: 112,
    rx: 62,
    ry: 22,
  },
  {
    id: "chest",
    label: "Chest",
    muscleGroups: ["Chest"],
    shape: "rect",
    x: 112,
    y: 122,
    width: 76,
    height: 48,
    rx: 22,
  },
  {
    id: "back",
    label: "Back",
    muscleGroups: ["Back"],
    shape: "rect",
    x: 112,
    y: 178,
    width: 76,
    height: 54,
    rx: 24,
  },
  {
    id: "biceps",
    label: "Biceps",
    muscleGroups: ["Biceps"],
    shape: "ellipse",
    cx: 76,
    cy: 176,
    rx: 22,
    ry: 58,
  },
  {
    id: "triceps",
    label: "Triceps",
    muscleGroups: ["Triceps"],
    shape: "ellipse",
    cx: 224,
    cy: 176,
    rx: 22,
    ry: 58,
  },
  {
    id: "forearms",
    label: "Forearms",
    muscleGroups: ["Forearms"],
    shape: "ellipse",
    cx: 68,
    cy: 258,
    rx: 18,
    ry: 48,
  },
  {
    id: "core",
    label: "Core",
    muscleGroups: ["Core"],
    shape: "rect",
    x: 120,
    y: 238,
    width: 60,
    height: 70,
    rx: 20,
  },
  {
    id: "glutes",
    label: "Glutes",
    muscleGroups: ["Glutes"],
    shape: "ellipse",
    cx: 150,
    cy: 326,
    rx: 46,
    ry: 28,
  },
  {
    id: "quads",
    label: "Quads",
    muscleGroups: ["Quads"],
    shape: "ellipse",
    cx: 124,
    cy: 410,
    rx: 24,
    ry: 72,
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    muscleGroups: ["Hamstrings"],
    shape: "ellipse",
    cx: 176,
    cy: 410,
    rx: 24,
    ry: 72,
  },
  {
    id: "calves",
    label: "Calves",
    muscleGroups: ["Calves"],
    shape: "ellipse",
    cx: 150,
    cy: 528,
    rx: 44,
    ry: 34,
  },
  {
    id: "neck",
    label: "Neck",
    muscleGroups: ["Neck"],
    shape: "rect",
    x: 132,
    y: 72,
    width: 36,
    height: 36,
    rx: 12,
  },
];

function getRecentWorkouts(workouts: Workout[], daysBack: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  cutoffDate.setHours(0, 0, 0, 0);

  return workouts.filter((workout) => new Date(workout.dateISO) >= cutoffDate);
}

function getSorenessByMuscle(workouts: Workout[]) {
  const sorenessMap = new Map<string, number[]>();

  workouts.forEach((workout) => {
    workout.exercises.forEach((exerciseEntry) => {
      const muscleGroup = exerciseEntry.muscleGroup || "Other";
      const soreness = Number(exerciseEntry.soreness);

      if (!Number.isFinite(soreness) || soreness <= 0) {
        return;
      }

      sorenessMap.set(muscleGroup, [
        ...(sorenessMap.get(muscleGroup) ?? []),
        Math.min(soreness, 3),
      ]);
    });
  });

  return Array.from(sorenessMap.entries())
    .map(([muscleGroup, sorenessValues]) => ({
      muscleGroup,
      soreness:
        sorenessValues.reduce((sum, value) => sum + value, 0) /
        sorenessValues.length,
    }))
    .sort((first, second) => second.soreness - first.soreness);
}

function getRegionSoreness(region: BodyRegion, sorenessValues: MuscleSoreness[]) {
  const matchingValues = sorenessValues
    .filter((entry) => region.muscleGroups.includes(entry.muscleGroup))
    .map((entry) => entry.soreness);

  if (matchingValues.length === 0) {
    return 0;
  }

  return Math.max(...matchingValues);
}

function getHeatClasses(soreness: number) {
  if (soreness >= 2.5) {
    return "fill-red-500/85 stroke-red-200";
  }

  if (soreness >= 1.5) {
    return "fill-orange-400/80 stroke-orange-100";
  }

  if (soreness > 0) {
    return "fill-yellow-300/75 stroke-yellow-100";
  }

  return "fill-slate-800 stroke-slate-600";
}

function getSorenessLabel(soreness: number) {
  if (soreness >= 2.5) {
    return "High";
  }

  if (soreness >= 1.5) {
    return "Moderate";
  }

  if (soreness > 0) {
    return "Mild";
  }

  return "No soreness";
}

export function SorenessHeatmap({ workouts }: { workouts: Workout[] }) {
  const recentWorkouts = getRecentWorkouts(workouts, 14);
  const sorenessValues = getSorenessByMuscle(recentWorkouts);
  const topSoreMuscles = sorenessValues.slice(0, 5);

  return (
    <div className="grid gap-5 rounded-3xl border border-gray-800 bg-gray-950 p-5 sm:grid-cols-[0.85fr_1fr] sm:p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Soreness Heatmap
        </p>
        <h3 className="mt-2 text-2xl font-bold">Muscle Recovery</h3>
        <p className="mt-2 text-sm text-gray-400">
          Highlights muscles with logged soreness from the last 14 days.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-300" />
            Mild
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-400" />
            Moderate
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            High
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-800 ring-1 ring-slate-600" />
            Clear
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[190px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <svg
            role="img"
            aria-label="Human body soreness heatmap"
            viewBox="0 0 300 600"
            className="mx-auto h-72 w-full max-w-[190px]"
          >
            <circle cx="150" cy="46" r="32" className="fill-slate-900 stroke-slate-600" />
            <path
              d="M117 102 C118 84 182 84 183 102 L205 318 C207 344 188 365 150 365 C112 365 93 344 95 318 Z"
              className="fill-slate-900 stroke-slate-600"
            />
            <path
              d="M93 120 C62 146 52 210 50 307"
              className="fill-none stroke-slate-700"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M207 120 C238 146 248 210 250 307"
              className="fill-none stroke-slate-700"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M125 354 C112 405 104 478 108 560"
              className="fill-none stroke-slate-700"
              strokeWidth="24"
              strokeLinecap="round"
            />
            <path
              d="M175 354 C188 405 196 478 192 560"
              className="fill-none stroke-slate-700"
              strokeWidth="24"
              strokeLinecap="round"
            />

            {bodyRegions.map((region) => {
              const soreness = getRegionSoreness(region, sorenessValues);
              const className =
                getHeatClasses(soreness) +
                " transition-colors duration-200 drop-shadow-[0_0_12px_rgba(248,113,113,0.18)]";

              if (region.shape === "ellipse") {
                return (
                  <ellipse
                    key={region.id}
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    className={className}
                  >
                    <title>
                      {region.label}: {getSorenessLabel(soreness)}
                    </title>
                  </ellipse>
                );
              }

              return (
                <rect
                  key={region.id}
                  x={region.x}
                  y={region.y}
                  width={region.width}
                  height={region.height}
                  rx={region.rx}
                  className={className}
                >
                  <title>
                    {region.label}: {getSorenessLabel(soreness)}
                  </title>
                </rect>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          {topSoreMuscles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-400">
              No recent soreness logged. Add soreness after exercises and this
              body map will start lighting up.
            </div>
          ) : (
            topSoreMuscles.map((entry) => {
              const width = Math.max((entry.soreness / 3) * 100, 12) + "%";

              return (
                <div
                  key={entry.muscleGroup}
                  className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.muscleGroup}</p>
                    <p className="text-sm text-gray-400">
                      {getSorenessLabel(entry.soreness)}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500"
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
