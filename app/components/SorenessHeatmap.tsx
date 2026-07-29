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

type HeatmapHotspot = {
  regionId: string;
  top: string;
  left: string;
  width: string;
  height: string;
  radius?: string;
};

const heatmapHotspots: HeatmapHotspot[] = [
  { regionId: "front-neck", top: "15%", left: "23.5%", width: "4%", height: "6%" },
  { regionId: "front-left-deltoid", top: "22%", left: "16.5%", width: "7%", height: "8%" },
  { regionId: "front-right-deltoid", top: "22%", left: "33%", width: "7%", height: "8%" },
  { regionId: "front-left-pec", top: "25%", left: "23%", width: "7%", height: "9%" },
  { regionId: "front-right-pec", top: "25%", left: "30%", width: "7%", height: "9%" },
  { regionId: "front-left-biceps", top: "31%", left: "13.5%", width: "5%", height: "15%" },
  { regionId: "front-right-biceps", top: "31%", left: "40%", width: "5%", height: "15%" },
  { regionId: "front-left-forearm", top: "44%", left: "8.5%", width: "5%", height: "17%" },
  { regionId: "front-right-forearm", top: "44%", left: "45%", width: "5%", height: "17%" },
  { regionId: "front-upper-abs", top: "34%", left: "26%", width: "8%", height: "12%" },
  { regionId: "front-lower-abs", top: "45%", left: "26%", width: "8%", height: "12%" },
  { regionId: "front-left-quad", top: "57%", left: "22%", width: "6%", height: "20%" },
  { regionId: "front-right-quad", top: "57%", left: "32%", width: "6%", height: "20%" },
  { regionId: "front-left-calf", top: "78%", left: "21%", width: "5%", height: "16%" },
  { regionId: "front-right-calf", top: "78%", left: "34%", width: "5%", height: "16%" },
  { regionId: "back-neck", top: "14%", left: "68.5%", width: "4%", height: "6%" },
  { regionId: "back-left-rear-delt", top: "23%", left: "58%", width: "7%", height: "8%" },
  { regionId: "back-right-rear-delt", top: "23%", left: "77%", width: "7%", height: "8%" },
  { regionId: "back-left-lat", top: "28%", left: "62%", width: "8%", height: "22%" },
  { regionId: "back-right-lat", top: "28%", left: "72%", width: "8%", height: "22%" },
  { regionId: "back-left-triceps", top: "32%", left: "55%", width: "5%", height: "15%" },
  { regionId: "back-right-triceps", top: "32%", left: "83%", width: "5%", height: "15%" },
  { regionId: "back-left-forearm", top: "46%", left: "51%", width: "5%", height: "17%" },
  { regionId: "back-right-forearm", top: "46%", left: "87%", width: "5%", height: "17%" },
  { regionId: "back-left-glute", top: "52%", left: "64%", width: "7%", height: "11%" },
  { regionId: "back-right-glute", top: "52%", left: "72%", width: "7%", height: "11%" },
  { regionId: "back-left-hamstring", top: "63%", left: "63%", width: "6%", height: "19%" },
  { regionId: "back-right-hamstring", top: "63%", left: "74%", width: "6%", height: "19%" },
  { regionId: "back-left-calf", top: "82%", left: "62%", width: "5%", height: "13%" },
  { regionId: "back-right-calf", top: "82%", left: "76%", width: "5%", height: "13%" },
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

function getRegionSoreness(region: MuscleRegion, sorenessValues: MuscleSoreness[]) {
  const matchingValues = sorenessValues
    .filter((entry) => region.muscleGroups.includes(entry.muscleGroup))
    .map((entry) => entry.soreness);

  if (matchingValues.length === 0) {
    return 0;
  }

  return Math.max(...matchingValues);
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

function getHotspotClasses(soreness: number, isSelected: boolean) {
  const baseClasses =
    "absolute cursor-pointer border transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-200";

  if (isSelected) {
    return (
      baseClasses +
      " border-cyan-200 bg-cyan-300/35 shadow-[0_0_24px_rgba(34,211,238,0.5)]"
    );
  }

  if (soreness >= 2.5) {
    return baseClasses + " border-red-200/70 bg-red-500/45 hover:bg-red-500/60";
  }

  if (soreness >= 1.5) {
    return baseClasses + " border-orange-100/70 bg-orange-400/45 hover:bg-orange-400/60";
  }

  if (soreness > 0) {
    return baseClasses + " border-yellow-100/70 bg-yellow-300/40 hover:bg-yellow-300/55";
  }

  return baseClasses + " border-transparent bg-transparent hover:border-cyan-200/50 hover:bg-cyan-300/15";
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

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-100 p-3">
          <div
            className="relative mx-auto max-w-3xl overflow-hidden rounded-xl"
            onMouseLeave={() => setHoveredRegionId(null)}
          >
            <img
              src="/muscles-front-back.svg"
              alt="Front and back human muscular anatomy"
              className="w-full select-none"
              draggable={false}
            />
            {heatmapHotspots.map((hotspot) => {
              const region = anatomyMuscleRegions.find(
                (muscleRegion) => muscleRegion.id === hotspot.regionId
              );

              if (!region) {
                return null;
              }

              const soreness = getRegionSoreness(region, sorenessValues);
              const isSelected = region.id === (hoveredRegionId ?? selectedRegionId);

              return (
                <button
                  key={hotspot.regionId}
                  id={region.id}
                  type="button"
                  data-muscle-group={region.muscleGroups.join(",")}
                  aria-label={`${region.label}: ${getSorenessLabel(soreness)}`}
                  className={getHotspotClasses(soreness, isSelected)}
                  style={{
                    top: hotspot.top,
                    left: hotspot.left,
                    width: hotspot.width,
                    height: hotspot.height,
                    borderRadius: hotspot.radius ?? "999px",
                  }}
                  onClick={() => setSelectedRegionId(region.id)}
                  onFocus={() => setHoveredRegionId(region.id)}
                  onBlur={() => setHoveredRegionId(null)}
                  onMouseEnter={() => setHoveredRegionId(region.id)}
                >
                  <span className="sr-only">
                    {region.label}: {getSorenessLabel(soreness)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Anatomy image adapted from Wikimedia Commons. Heatmap overlays are
            generated from your logged soreness.
          </p>
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
