"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BodyChart,
  MUSCLE_MAP,
  ViewSide,
  type BodyState,
  type MuscleId,
} from "body-muscles";
import type { Workout } from "../lib/fitnessData";

type MuscleSoreness = {
  muscleGroup: string;
  soreness: number;
};

type ChartView = "front" | "back";

const muscleGroupToBodyIds: Record<string, MuscleId[]> = {
  Chest: [
    "chest-upper-left",
    "chest-upper-right",
    "chest-lower-left",
    "chest-lower-right",
  ],
  Back: [
    "lats-upper-left",
    "lats-mid-left",
    "lats-lower-left",
    "lats-upper-right",
    "lats-mid-right",
    "lats-lower-right",
    "lower-back-erectors-left",
    "lower-back-ql-left",
    "lower-back-erectors-right",
    "lower-back-ql-right",
    "spine",
  ],
  Shoulders: [
    "shoulder-front-left",
    "shoulder-front-right",
    "shoulder-side-left",
    "shoulder-side-right",
    "deltoid-rear-left",
    "deltoid-rear-right",
    "traps-upper-left",
    "traps-mid-left",
    "traps-lower-left",
    "traps-upper-right",
    "traps-mid-right",
    "traps-lower-right",
  ],
  Biceps: ["biceps-left", "biceps-right"],
  Triceps: [
    "triceps-long-left",
    "triceps-lateral-left",
    "triceps-long-right",
    "triceps-lateral-right",
  ],
  Quads: ["quads-left", "quads-right", "adductors-left", "adductors-right"],
  Hamstrings: [
    "hamstrings-medial-left",
    "hamstrings-lateral-left",
    "hamstrings-medial-right",
    "hamstrings-lateral-right",
  ],
  Glutes: [
    "gluteus-medius-left",
    "gluteus-maximus-left",
    "gluteus-medius-right",
    "gluteus-maximus-right",
  ],
  Calves: [
    "calves-gastroc-medial-left",
    "calves-gastroc-lateral-left",
    "calves-soleus-left",
    "calves-gastroc-medial-right",
    "calves-gastroc-lateral-right",
    "calves-soleus-right",
  ],
  Core: [
    "abs-upper-left",
    "abs-upper-right",
    "abs-lower-left",
    "abs-lower-right",
    "serratus-anterior-left",
    "serratus-anterior-right",
    "obliques-left",
    "obliques-right",
  ],
  Forearms: [
    "forearm-left",
    "forearm-right",
    "forearm-flexors-left",
    "forearm-extensors-left",
    "forearm-flexors-right",
    "forearm-extensors-right",
  ],
  Neck: ["head", "face", "neck-right", "neck-left", "head-back", "nape"],
};

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

function sorenessToIntensity(soreness: number) {
  if (soreness <= 0) {
    return 0;
  }

  return Math.max(1, Math.min(10, Math.round((soreness / 3) * 10)));
}

function buildBodyState(
  sorenessValues: MuscleSoreness[],
  selectedMuscleId: MuscleId | null
) {
  const nextState: BodyState = {};

  sorenessValues.forEach((entry) => {
    const bodyIds = muscleGroupToBodyIds[entry.muscleGroup] ?? [];
    const intensity = sorenessToIntensity(entry.soreness);

    bodyIds.forEach((id) => {
      nextState[id] = {
        intensity,
        selected: id === selectedMuscleId,
      };
    });
  });

  if (selectedMuscleId && !nextState[selectedMuscleId]) {
    nextState[selectedMuscleId] = {
      intensity: 0,
      selected: true,
    };
  }

  return nextState;
}

function getMuscleName(muscleId: MuscleId | null) {
  if (!muscleId) {
    return "No muscle selected";
  }

  return MUSCLE_MAP.find((muscle) => muscle.id === muscleId)?.name ?? muscleId;
}

function getMuscleSoreness(
  muscleId: MuscleId | null,
  sorenessValues: MuscleSoreness[]
) {
  if (!muscleId) {
    return 0;
  }

  const matchingEntry = sorenessValues.find((entry) =>
    (muscleGroupToBodyIds[entry.muscleGroup] ?? []).includes(muscleId)
  );

  return matchingEntry?.soreness ?? 0;
}

function BodyMusclesMap({
  view,
  bodyState,
  onSelectMuscle,
}: {
  view: ChartView;
  bodyState: BodyState;
  onSelectMuscle: (id: MuscleId) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const viewSide = view === "front" ? ViewSide.FRONT : ViewSide.BACK;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    chartRef.current = new BodyChart(containerRef.current, {
      view: viewSide,
      bodyState: {},
      onMuscleClick: (id) => onSelectMuscle(id),
      className: "exerciseinsight-body-chart",
      ariaLabel: `${view === "front" ? "Front" : "Back"} soreness body map`,
      enableTransitions: true,
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [onSelectMuscle, view, viewSide]);

  useEffect(() => {
    chartRef.current?.update({
      view: viewSide,
      bodyState,
    });
  }, [bodyState, viewSide]);

  return (
    <div className="rounded-2xl border border-pink-400/30 bg-slate-100/95 p-3 shadow-[0_0_30px_rgba(236,72,153,0.16)]">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {view === "front" ? "Front" : "Back"}
      </p>
      <div ref={containerRef} className="mx-auto h-[28rem] w-full max-w-[260px]" />
    </div>
  );
}

export function SorenessHeatmap({ workouts }: { workouts: Workout[] }) {
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleId | null>(
    "chest-lower-left"
  );
  const recentWorkouts = useMemo(() => getRecentWorkouts(workouts, 14), [workouts]);
  const sorenessValues = useMemo(
    () => getSorenessByMuscle(recentWorkouts),
    [recentWorkouts]
  );
  const bodyState = useMemo(
    () => buildBodyState(sorenessValues, selectedMuscleId),
    [selectedMuscleId, sorenessValues]
  );
  const activeSoreness = getMuscleSoreness(selectedMuscleId, sorenessValues);
  const topSoreMuscles = sorenessValues.slice(0, 5);

  return (
    <div className="grid gap-5 rounded-3xl border border-gray-800 bg-gray-950 p-5 sm:grid-cols-[0.85fr_1fr] sm:p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Soreness Heatmap
        </p>
        <h3 className="mt-2 text-2xl font-bold">Muscle Recovery</h3>
        <p className="mt-2 text-sm text-gray-400">
          Detailed body map powered by 70+ anatomical SVG regions. Click a
          muscle to inspect soreness from the last 14 days.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            None
          </span>
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
        </div>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["front", "back"] as const).map((view) => (
            <BodyMusclesMap
              key={view}
              view={view}
              bodyState={bodyState}
              onSelectMuscle={setSelectedMuscleId}
            />
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Selected Area
            </p>
            <h4 className="mt-2 text-2xl font-bold">
              {getMuscleName(selectedMuscleId)}
            </h4>
            <p className="mt-1 text-sm text-gray-300">
              {getSorenessLabel(activeSoreness)} soreness
              {activeSoreness > 0
                ? ` · ${Math.round(activeSoreness * 10) / 10}/3 average`
                : ""}
            </p>
            <div className="mt-4 h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-slate-400 via-yellow-300 via-orange-400 to-red-500"
                style={{
                  width:
                    Math.max(
                      (activeSoreness / 3) * 100,
                      activeSoreness > 0 ? 12 : 0
                    ) + "%",
                }}
              />
            </div>
          </div>

          {topSoreMuscles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-400">
              No recent soreness logged. Add soreness after exercises and this
              SVG map will start changing colors.
            </div>
          ) : (
            topSoreMuscles.map((entry) => {
              const width = Math.max((entry.soreness / 3) * 100, 12) + "%";
              const firstBodyId = muscleGroupToBodyIds[entry.muscleGroup]?.[0];

              return (
                <button
                  key={entry.muscleGroup}
                  type="button"
                  onClick={() => {
                    if (firstBodyId) {
                      setSelectedMuscleId(firstBodyId);
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
                      className="h-2 rounded-full bg-gradient-to-r from-slate-400 via-yellow-300 via-orange-400 to-red-500"
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
