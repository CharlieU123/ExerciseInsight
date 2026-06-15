import type { TrainingProgram } from "./types";

function getDefaultProgramDayName(index: number, splitType = "") {
  if (splitType === "Push/Pull/Legs") {
    return ["Push", "Pull", "Legs", "Rest", "Push", "Pull", "Legs"][index] ?? `Day ${index + 1}`;
  }

  if (splitType === "Upper/Lower") {
    return ["Upper", "Lower", "Rest", "Upper", "Lower", "Rest", "Optional"][index] ?? `Day ${index + 1}`;
  }

  if (splitType === "Full Body EOD") {
    return index % 2 === 0 ? "Full Body" : "Rest";
  }

  return `Day ${index + 1}`;
}

export function createProgramDays(dayCount: string, splitType = "") {
  const totalDays = Math.min(Math.max(Number(dayCount) || 1, 1), 14);

  return Array.from({ length: totalDays }, (_item, index) => {
    const name = getDefaultProgramDayName(index, splitType);

    return {
      id: Date.now() + index,
      name,
      isRestDay: name.toLowerCase().includes("rest"),
      notes: "",
      exercises: [],
    };
  });
}

export function getProgramDays(program: TrainingProgram) {
  if (Array.isArray(program.days) && program.days.length > 0) {
    return program.days.map((day, dayIndex) => ({
      id: day.id ?? Date.now() + dayIndex,
      name: day.name || `Day ${dayIndex + 1}`,
      isRestDay: Boolean(day.isRestDay),
      notes: day.notes ?? "",
      exercises: Array.isArray(day.exercises)
        ? day.exercises.map((exercise, exerciseIndex) => ({
            ...exercise,
            id: exercise.id ?? Date.now() + dayIndex + exerciseIndex,
            dayId: day.id,
          }))
        : [],
    }));
  }

  const fallbackDayId = Date.now();

  return [
    {
      id: fallbackDayId,
      name: "Day 1",
      isRestDay: false,
      notes: "",
      exercises: Array.isArray(program.exercises)
        ? program.exercises.map((exercise) => ({
            ...exercise,
            dayId: fallbackDayId,
          }))
        : [],
    },
  ];
}

export function getProgramExercises(program: TrainingProgram) {
  const days = getProgramDays(program);
  const dayExercises = days.flatMap((day) =>
    day.exercises.map((exercise) => ({
      ...exercise,
      dayId: day.id,
    }))
  );

  if (dayExercises.length > 0) {
    return dayExercises;
  }

  return Array.isArray(program.exercises) ? program.exercises : [];
}
