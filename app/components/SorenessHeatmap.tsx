"use client";

import { useMemo, useState } from "react";
import type { Workout } from "../lib/fitnessData";

type MuscleSoreness = {
  muscleGroup: string;
  soreness: number;
};

type MuscleRegion = {
  id: string;
  label: string;
  muscleGroups: string[];
  side: "front" | "back";
  d: string;
};

const frontRegions: MuscleRegion[] = [
  {
    id: "front-neck",
    label: "Neck",
    muscleGroups: ["Neck"],
    side: "front",
    d: "M137 78 C142 72 158 72 163 78 L166 105 C158 111 142 111 134 105 Z",
  },
  {
    id: "front-shoulders-left",
    label: "Left Shoulder",
    muscleGroups: ["Shoulders"],
    side: "front",
    d: "M93 116 C104 98 126 100 134 116 C125 128 109 136 92 132 C85 128 86 121 93 116 Z",
  },
  {
    id: "front-shoulders-right",
    label: "Right Shoulder",
    muscleGroups: ["Shoulders"],
    side: "front",
    d: "M207 116 C196 98 174 100 166 116 C175 128 191 136 208 132 C215 128 214 121 207 116 Z",
  },
  {
    id: "front-chest-left",
    label: "Left Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M104 132 C113 115 138 114 147 132 L145 183 C125 190 106 179 98 160 C96 149 98 139 104 132 Z",
  },
  {
    id: "front-chest-right",
    label: "Right Chest",
    muscleGroups: ["Chest"],
    side: "front",
    d: "M196 132 C187 115 162 114 153 132 L155 183 C175 190 194 179 202 160 C204 149 202 139 196 132 Z",
  },
  {
    id: "front-biceps-left",
    label: "Left Biceps",
    muscleGroups: ["Biceps"],
    side: "front",
    d: "M75 146 C91 144 99 160 96 187 C94 213 84 235 68 232 C58 210 60 166 75 146 Z",
  },
  {
    id: "front-biceps-right",
    label: "Right Biceps",
    muscleGroups: ["Biceps"],
    side: "front",
    d: "M225 146 C209 144 201 160 204 187 C206 213 216 235 232 232 C242 210 240 166 225 146 Z",
  },
  {
    id: "front-forearms-left",
    label: "Left Forearm",
    muscleGroups: ["Forearms"],
    side: "front",
    d: "M61 242 C75 237 84 250 79 280 C75 307 65 331 52 327 C46 299 48 262 61 242 Z",
  },
  {
    id: "front-forearms-right",
    label: "Right Forearm",
    muscleGroups: ["Forearms"],
    side: "front",
    d: "M239 242 C225 237 216 250 221 280 C225 307 235 331 248 327 C254 299 252 262 239 242 Z",
  },
  {
    id: "front-core-upper",
    label: "Upper Core",
    muscleGroups: ["Core"],
    side: "front",
    d: "M121 190 C134 184 166 184 179 190 L174 252 C159 262 141 262 126 252 Z",
  },
  {
    id: "front-core-lower",
    label: "Lower Core",
    muscleGroups: ["Core"],
    side: "front",
    d: "M128 260 C142 268 158 268 172 260 L180 326 C164 338 136 338 120 326 Z",
  },
  {
    id: "front-quads-left",
    label: "Left Quad",
    muscleGroups: ["Quads"],
    side: "front",
    d: "M104 348 C124 338 144 351 140 396 L132 498 C116 507 101 497 97 472 C91 418 90 365 104 348 Z",
  },
  {
    id: "front-quads-right",
    label: "Right Quad",
    muscleGroups: ["Quads"],
    side: "front",
    d: "M196 348 C176 338 156 351 160 396 L168 498 C184 507 199 497 203 472 C209 418 210 365 196 348 Z",
  },
  {
    id: "front-calves-left",
    label: "Left Calf",
    muscleGroups: ["Calves"],
    side: "front",
    d: "M103 510 C118 503 132 512 130 548 L124 590 C113 596 101 590 98 568 C95 544 96 520 103 510 Z",
  },
  {
    id: "front-calves-right",
    label: "Right Calf",
    muscleGroups: ["Calves"],
    side: "front",
    d: "M197 510 C182 503 168 512 170 548 L176 590 C187 596 199 590 202 568 C205 544 204 520 197 510 Z",
  },
];

const backRegions: MuscleRegion[] = [
  {
    id: "back-neck",
    label: "Neck",
    muscleGroups: ["Neck"],
    side: "back",
    d: "M136 78 C142 72 158 72 164 78 L168 111 C158 117 142 117 132 111 Z",
  },
  {
    id: "back-shoulders-left",
    label: "Left Rear Delt",
    muscleGroups: ["Shoulders"],
    side: "back",
    d: "M89 121 C103 100 128 102 139 120 C129 135 106 141 90 132 C84 129 84 124 89 121 Z",
  },
  {
    id: "back-shoulders-right",
    label: "Right Rear Delt",
    muscleGroups: ["Shoulders"],
    side: "back",
    d: "M211 121 C197 100 172 102 161 120 C171 135 194 141 210 132 C216 129 216 124 211 121 Z",
  },
  {
    id: "back-lats-left",
    label: "Left Back",
    muscleGroups: ["Back"],
    side: "back",
    d: "M101 142 C114 120 139 128 146 151 L143 273 C120 268 101 244 94 210 C91 178 93 154 101 142 Z",
  },
  {
    id: "back-lats-right",
    label: "Right Back",
    muscleGroups: ["Back"],
    side: "back",
    d: "M199 142 C186 120 161 128 154 151 L157 273 C180 268 199 244 206 210 C209 178 207 154 199 142 Z",
  },
  {
    id: "back-triceps-left",
    label: "Left Triceps",
    muscleGroups: ["Triceps"],
    side: "back",
    d: "M73 148 C89 147 98 164 95 192 C92 219 82 236 66 232 C58 205 59 167 73 148 Z",
  },
  {
    id: "back-triceps-right",
    label: "Right Triceps",
    muscleGroups: ["Triceps"],
    side: "back",
    d: "M227 148 C211 147 202 164 205 192 C208 219 218 236 234 232 C242 205 241 167 227 148 Z",
  },
  {
    id: "back-forearms-left",
    label: "Left Forearm",
    muscleGroups: ["Forearms"],
    side: "back",
    d: "M61 242 C75 237 84 250 79 280 C75 307 65 331 52 327 C46 299 48 262 61 242 Z",
  },
  {
    id: "back-forearms-right",
    label: "Right Forearm",
    muscleGroups: ["Forearms"],
    side: "back",
    d: "M239 242 C225 237 216 250 221 280 C225 307 235 331 248 327 C254 299 252 262 239 242 Z",
  },
  {
    id: "back-glutes-left",
    label: "Left Glute",
    muscleGroups: ["Glutes"],
    side: "back",
    d: "M105 322 C124 304 147 314 149 344 C145 369 125 380 103 365 C95 350 96 333 105 322 Z",
  },
  {
    id: "back-glutes-right",
    label: "Right Glute",
    muscleGroups: ["Glutes"],
    side: "back",
    d: "M195 322 C176 304 153 314 151 344 C155 369 175 380 197 365 C205 350 204 333 195 322 Z",
  },
  {
    id: "back-hamstrings-left",
    label: "Left Hamstring",
    muscleGroups: ["Hamstrings"],
    side: "back",
    d: "M105 374 C125 363 144 377 140 423 L132 498 C116 507 101 497 97 472 C92 429 91 390 105 374 Z",
  },
  {
    id: "back-hamstrings-right",
    label: "Right Hamstring",
    muscleGroups: ["Hamstrings"],
    side: "back",
    d: "M195 374 C175 363 156 377 160 423 L168 498 C184 507 199 497 203 472 C208 429 209 390 195 374 Z",
  },
  {
    id: "back-calves-left",
    label: "Left Calf",
    muscleGroups: ["Calves"],
    side: "back",
    d: "M103 510 C118 503 132 512 130 548 L124 590 C113 596 101 590 98 568 C95 544 96 520 103 510 Z",
  },
  {
    id: "back-calves-right",
    label: "Right Calf",
    muscleGroups: ["Calves"],
    side: "back",
    d: "M197 510 C182 503 168 512 170 548 L176 590 C187 596 199 590 202 568 C205 544 204 520 197 510 Z",
  },
];

const bodyRegions = [...frontRegions, ...backRegions];

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

function getRegionSoreness(region: MuscleRegion, sorenessValues: MuscleSoreness[]) {
  const matchingValues = sorenessValues
    .filter((entry) => region.muscleGroups.includes(entry.muscleGroup))
    .map((entry) => entry.soreness);

  if (matchingValues.length === 0) {
    return 0;
  }

  return Math.max(...matchingValues);
}

function getHeatClasses(soreness: number, isSelected: boolean) {
  const selectedClasses = isSelected
    ? " stroke-cyan-200 stroke-[2.5] drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]"
    : " stroke-white/80 stroke-[1.4]";

  if (soreness >= 2.5) {
    return "fill-red-500/90" + selectedClasses;
  }

  if (soreness >= 1.5) {
    return "fill-orange-400/90" + selectedClasses;
  }

  if (soreness > 0) {
    return "fill-yellow-300/85" + selectedClasses;
  }

  return "fill-slate-700/75 stroke-slate-500 stroke-[1.2]";
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

function BodyOutline() {
  return (
    <g aria-hidden="true">
      <circle cx="150" cy="42" r="30" className="fill-slate-800/70 stroke-white/10" />
      <path
        d="M118 101 C122 86 178 86 182 101 L207 320 C209 350 188 374 150 374 C112 374 91 350 93 320 Z"
        className="fill-slate-900/75 stroke-white/10"
      />
      <path
        d="M88 124 C59 154 49 225 51 324"
        className="fill-none stroke-slate-800"
        strokeLinecap="round"
        strokeWidth="24"
      />
      <path
        d="M212 124 C241 154 251 225 249 324"
        className="fill-none stroke-slate-800"
        strokeLinecap="round"
        strokeWidth="24"
      />
      <path
        d="M122 367 C106 426 100 500 105 590"
        className="fill-none stroke-slate-800"
        strokeLinecap="round"
        strokeWidth="28"
      />
      <path
        d="M178 367 C194 426 200 500 195 590"
        className="fill-none stroke-slate-800"
        strokeLinecap="round"
        strokeWidth="28"
      />
    </g>
  );
}

export function SorenessHeatmap({ workouts }: { workouts: Workout[] }) {
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedRegionId, setSelectedRegionId] = useState("front-chest-left");
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const recentWorkouts = useMemo(() => getRecentWorkouts(workouts, 14), [workouts]);
  const sorenessValues = useMemo(
    () => getSorenessByMuscle(recentWorkouts),
    [recentWorkouts]
  );
  const visibleRegions = bodyRegions.filter((region) => region.side === view);
  const activeRegion =
    bodyRegions.find((region) => region.id === (hoveredRegionId ?? selectedRegionId)) ??
    visibleRegions[0];
  const activeSoreness = activeRegion
    ? getRegionSoreness(activeRegion, sorenessValues)
    : 0;
  const topSoreMuscles = sorenessValues.slice(0, 5);

  return (
    <div className="grid gap-5 rounded-3xl border border-gray-800 bg-gray-950 p-5 sm:grid-cols-[0.85fr_1fr] sm:p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Soreness Heatmap
        </p>
        <h3 className="mt-2 text-2xl font-bold">Muscle Recovery</h3>
        <p className="mt-2 text-sm text-gray-400">
          Hover or click a muscle to inspect soreness from the last 14 days.
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
            <span className="h-3 w-3 rounded-full bg-slate-700 ring-1 ring-slate-500" />
            Clear
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => {
                  setView(side);
                  setHoveredRegionId(null);
                  setSelectedRegionId(side === "front" ? "front-chest-left" : "back-lats-left");
                }}
                className={
                  "rounded-xl px-3 py-2 text-sm font-semibold capitalize transition " +
                  (view === side
                    ? "bg-cyan-400 text-gray-950 shadow-lg shadow-cyan-950/30"
                    : "bg-gray-900 text-gray-300 hover:bg-gray-800")
                }
              >
                {side}
              </button>
            ))}
          </div>

          <svg
            role="img"
            aria-label={`${view} human body soreness heatmap`}
            viewBox="0 0 300 610"
            className="mx-auto h-[28rem] w-full max-w-[220px]"
            onMouseLeave={() => setHoveredRegionId(null)}
          >
            <BodyOutline />
            {visibleRegions.map((region) => {
              const soreness = getRegionSoreness(region, sorenessValues);
              const isSelected = region.id === (hoveredRegionId ?? selectedRegionId);

              return (
                <path
                  key={region.id}
                  d={region.d}
                  role="button"
                  tabIndex={0}
                  aria-label={`${region.label}: ${getSorenessLabel(soreness)}`}
                  className={
                    getHeatClasses(soreness, isSelected) +
                    " cursor-pointer transition duration-200 hover:brightness-125 focus:outline-none"
                  }
                  onClick={() => setSelectedRegionId(region.id)}
                  onFocus={() => setHoveredRegionId(region.id)}
                  onBlur={() => setHoveredRegionId(null)}
                  onMouseEnter={() => setHoveredRegionId(region.id)}
                >
                  <title>
                    {region.label}: {getSorenessLabel(soreness)}
                  </title>
                </path>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Selected Area
            </p>
            <h4 className="mt-2 text-2xl font-bold">
              {activeRegion ? activeRegion.label : "No muscle selected"}
            </h4>
            <p className="mt-1 text-sm text-gray-300">
              {getSorenessLabel(activeSoreness)} soreness
              {activeSoreness > 0
                ? ` · ${Math.round(activeSoreness * 10) / 10}/3 average`
                : ""}
            </p>
            <div className="mt-4 h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500"
                style={{ width: Math.max((activeSoreness / 3) * 100, activeSoreness > 0 ? 12 : 0) + "%" }}
              />
            </div>
          </div>

          {topSoreMuscles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-400">
              No recent soreness logged. Add soreness after exercises and this
              body map will start lighting up.
            </div>
          ) : (
            topSoreMuscles.map((entry) => {
              const width = Math.max((entry.soreness / 3) * 100, 12) + "%";

              return (
                <button
                  key={entry.muscleGroup}
                  type="button"
                  onClick={() => {
                    const matchingRegion =
                      visibleRegions.find((region) =>
                        region.muscleGroups.includes(entry.muscleGroup)
                      ) ??
                      bodyRegions.find((region) =>
                        region.muscleGroups.includes(entry.muscleGroup)
                      );

                    if (matchingRegion) {
                      setView(matchingRegion.side);
                      setSelectedRegionId(matchingRegion.id);
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-800 bg-gray-900/70 p-4 text-left transition hover:border-cyan-400/40 hover:bg-gray-900"
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
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
