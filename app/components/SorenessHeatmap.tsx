"use client";

import { useMemo, useState } from "react";
import {
  anatomyMuscleRegions,
  type MuscleRegion,
} from "../lib/anatomyHeatmap";
import type { Workout } from "../lib/fitnessData";

type MuscleSoreness = {
  muscleGroup: string;
  soreness: number;
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
      <path
        d="M150 103 L150 333"
        className="fill-none stroke-white/10"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M121 190 C135 198 165 198 179 190"
        className="fill-none stroke-white/10"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M118 238 C136 247 164 247 182 238"
        className="fill-none stroke-white/10"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M111 333 C129 344 171 344 189 333"
        className="fill-none stroke-white/10"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </g>
  );
}

function AnatomyFigure({
  side,
  selectedRegionId,
  hoveredRegionId,
  sorenessValues,
  onSelectRegion,
  onHoverRegion,
}: {
  side: "front" | "back";
  selectedRegionId: string;
  hoveredRegionId: string | null;
  sorenessValues: MuscleSoreness[];
  onSelectRegion: (regionId: string) => void;
  onHoverRegion: (regionId: string | null) => void;
}) {
  const visibleRegions = anatomyMuscleRegions.filter((region) => region.side === side);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
        {side}
      </p>
      <svg
        role="img"
        aria-label={`${side} human body soreness heatmap`}
        viewBox="0 0 300 610"
        className="mx-auto h-[26rem] w-full max-w-[210px]"
        onMouseLeave={() => onHoverRegion(null)}
      >
        <BodyOutline />
        {visibleRegions.map((region) => {
          const soreness = getRegionSoreness(region, sorenessValues);
          const isSelected = region.id === (hoveredRegionId ?? selectedRegionId);

          return (
            <path
              key={region.id}
              id={region.id}
              d={region.d}
              role="button"
              tabIndex={0}
              data-muscle-group={region.muscleGroups.join(",")}
              aria-label={`${region.label}: ${getSorenessLabel(soreness)}`}
              className={
                getHeatClasses(soreness, isSelected) +
                " cursor-pointer transition duration-200 hover:brightness-125 focus:outline-none"
              }
              onClick={() => onSelectRegion(region.id)}
              onFocus={() => onHoverRegion(region.id)}
              onBlur={() => onHoverRegion(null)}
              onMouseEnter={() => onHoverRegion(region.id)}
            >
              <title>
                {region.label}: {getSorenessLabel(soreness)}
              </title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}

export function SorenessHeatmap({ workouts }: { workouts: Workout[] }) {
  const [selectedRegionId, setSelectedRegionId] = useState("front-left-pec");
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const recentWorkouts = useMemo(() => getRecentWorkouts(workouts, 14), [workouts]);
  const sorenessValues = useMemo(
    () => getSorenessByMuscle(recentWorkouts),
    [recentWorkouts]
  );
  const activeRegion =
    anatomyMuscleRegions.find(
      (region) => region.id === (hoveredRegionId ?? selectedRegionId)
    ) ?? anatomyMuscleRegions[0];
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

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["front", "back"] as const).map((side) => (
            <AnatomyFigure
              key={side}
              side={side}
              selectedRegionId={selectedRegionId}
              hoveredRegionId={hoveredRegionId}
              sorenessValues={sorenessValues}
              onSelectRegion={setSelectedRegionId}
              onHoverRegion={setHoveredRegionId}
            />
          ))}
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
                    const matchingRegion = anatomyMuscleRegions.find((region) =>
                      region.muscleGroups.includes(entry.muscleGroup)
                    );

                    if (matchingRegion) {
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
