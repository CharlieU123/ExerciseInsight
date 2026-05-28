"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { EmptyState } from "../components/EmptyState";
import {
  exerciseLibrary,
  createProgramDays,
  getProgramDays,
  loadTrainingPrograms,
  muscleGroups,
  saveTrainingPrograms,
  splitTypes,
  type ProgramDay,
  type ProgramExercise,
  type SharedTrainingProgram,
  type TrainingProgram,
} from "../lib/fitnessData";
import {
  deleteProgramFromSupabase,
  loadProgramsFromSupabase,
  loadSharedProgramsFromSupabase,
  saveProgramToSupabase,
  saveSharedProgramCopyToSupabase,
  shareProgramToSupabase,
  updateProgramInSupabase,
} from "../lib/supabasePlanning";
import { supabase } from "../lib/supabaseClient";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [sharedPrograms, setSharedPrograms] = useState<SharedTrainingProgram[]>([]);
  const [name, setName] = useState("");
  const [splitType, setSplitType] = useState(splitTypes[0]);
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [notes, setNotes] = useState("");
  const [exercise, setExercise] = useState("Bench Press");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8-12");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [draftDays, setDraftDays] = useState<ProgramDay[]>(
    createProgramDays("4", splitTypes[0])
  );
  const [selectedDayId, setSelectedDayId] = useState<string | number>(
    draftDays[0]?.id ?? 1
  );
  const [userId, setUserId] = useState("");
  const [programMessage, setProgramMessage] = useState("");
  const [shareEmailByProgram, setShareEmailByProgram] = useState<Record<string, string>>(
    {}
  );
  const [sharePermissionByProgram, setSharePermissionByProgram] = useState<
    Record<string, "view" | "edit">
  >({});
  const [hasLoadedPrograms, setHasLoadedPrograms] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | number | null>(
    null
  );
  const draftExercises = draftDays.flatMap((day) => day.exercises);

  useEffect(() => {
    let shouldIgnore = false;

    async function loadPrograms() {
      const { data } = await supabase.auth.getUser();
      const currentUserId = data.user?.id ?? "";

      if (shouldIgnore) {
        return;
      }

      setUserId(currentUserId);

      if (!currentUserId) {
        setPrograms(loadTrainingPrograms());
        setHasLoadedPrograms(true);
        setProgramMessage(
          "Log in to sync programs to Supabase. Programs are saved on this device."
        );
        return;
      }

      try {
        const [savedPrograms, savedSharedPrograms] = await Promise.all([
          loadProgramsFromSupabase(),
          loadSharedProgramsFromSupabase(),
        ]);
        if (!shouldIgnore) {
          setPrograms(savedPrograms);
          setSharedPrograms(savedSharedPrograms);
          setHasLoadedPrograms(true);
          setProgramMessage("Programs are syncing with Supabase.");
        }
      } catch {
        if (!shouldIgnore) {
          setPrograms(loadTrainingPrograms());
          setHasLoadedPrograms(true);
          setProgramMessage("Could not load programs from Supabase. Showing this device.");
        }
      }
    }

    loadPrograms();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedPrograms) {
      return;
    }

    saveTrainingPrograms(programs);
  }, [programs, hasLoadedPrograms]);

  function chooseExercise(exerciseName: string) {
    setExercise(exerciseName);

    const libraryExercise = exerciseLibrary.find(
      (item) => item.exercise === exerciseName
    );

    if (libraryExercise) {
      setMuscleGroup(libraryExercise.muscleGroup);
      setSets(libraryExercise.defaultSets);
      setReps(libraryExercise.defaultReps);
    }
  }

  function addExerciseToDraft() {
    if (!exercise) {
      return;
    }

    setDraftDays(
      draftDays.map((day) =>
        String(day.id) === String(selectedDayId)
          ? {
              ...day,
              isRestDay: false,
              exercises: [
                ...day.exercises,
                {
                  id: Date.now(),
                  dayId: day.id,
                  exercise,
                  muscleGroup,
                  sets,
                  reps,
                  notes: exerciseNotes,
                },
              ],
            }
          : day
      )
    );
    setExerciseNotes("");
  }

  function syncProgramDays(dayCount: string, newSplitType = splitType) {
    const nextDays = createProgramDays(dayCount, newSplitType).map((day, index) => ({
      ...day,
      ...(draftDays[index] ?? {}),
      name: draftDays[index]?.name ?? day.name,
      isRestDay: draftDays[index]?.isRestDay ?? day.isRestDay,
      notes: draftDays[index]?.notes ?? "",
      exercises: draftDays[index]?.exercises ?? [],
    }));

    setDraftDays(nextDays);
    setSelectedDayId(nextDays[0]?.id ?? "");
  }

  function updateProgramDay(
    id: string | number,
    field: keyof ProgramDay,
    value: string | boolean
  ) {
    setDraftDays(
      draftDays.map((day) =>
        day.id === id
          ? {
              ...day,
              [field]: value,
              exercises: field === "isRestDay" && value === true ? [] : day.exercises,
            }
          : day
      )
    );
  }

  function removeDraftExercise(dayId: string | number, exerciseId: string | number) {
    setDraftDays(
      draftDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.filter(
                (draftExercise) => draftExercise.id !== exerciseId
              ),
            }
          : day
      )
    );
  }

  function updateDraftExercise(
    dayId: string | number,
    id: string | number,
    field: keyof ProgramExercise,
    value: string
  ) {
    setDraftDays(
      draftDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((draftExercise) =>
                draftExercise.id === id
                  ? {
                      ...draftExercise,
                      [field]: value,
                    }
                  : draftExercise
              ),
            }
          : day
      )
    );
  }

  function resetProgramForm() {
    const resetDays = createProgramDays("4", splitTypes[0]);

    setName("");
    setSplitType(splitTypes[0]);
    setDaysPerWeek("4");
    setNotes("");
    setDraftDays(resetDays);
    setSelectedDayId(resetDays[0]?.id ?? "");
    setEditingProgramId(null);
  }

  function editProgram(program: TrainingProgram) {
    const programDays = getProgramDays(program);

    setEditingProgramId(program.id);
    setName(program.name);
    setSplitType(program.splitType);
    setDaysPerWeek(program.daysPerWeek);
    setNotes(program.notes);
    setDraftDays(programDays);
    setSelectedDayId(programDays[0]?.id ?? "");
    setProgramMessage("Editing " + program.name + ".");
  }

  async function saveProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (draftDays.length === 0) {
      return;
    }

    const normalizedDays = draftDays.map((day) => ({
      ...day,
      exercises: day.isRestDay
        ? []
        : day.exercises.map((programExercise) => ({
            ...programExercise,
            dayId: day.id,
          })),
    }));

    const newProgram = {
      id: editingProgramId ?? Date.now(),
      name,
      splitType,
      daysPerWeek,
      notes,
      days: normalizedDays,
      exercises: normalizedDays.flatMap((day) => day.exercises),
    };

    if (editingProgramId) {
      if (userId) {
        try {
          const updatedProgram = await updateProgramInSupabase(newProgram);
          setPrograms(
            programs.map((program) =>
              program.id === editingProgramId ? updatedProgram : program
            )
          );
          setProgramMessage("Program updated in Supabase.");
        } catch {
          setProgramMessage("Could not update program in Supabase. Try again.");
          return;
        }
      } else {
        setPrograms(
          programs.map((program) =>
            program.id === editingProgramId ? newProgram : program
          )
        );
        setProgramMessage("Program updated on this device.");
      }

      resetProgramForm();
      return;
    }

    if (userId) {
      try {
        const savedProgram = await saveProgramToSupabase(newProgram);
        setPrograms([savedProgram, ...programs]);
        setProgramMessage("Program saved to Supabase.");
      } catch {
        setProgramMessage("Could not save program to Supabase. Try again.");
        return;
      }
    } else {
      setPrograms([newProgram, ...programs]);
      setProgramMessage("Program saved on this device.");
    }

    resetProgramForm();
  }

  async function deleteProgram(id: string | number) {
    setPrograms(programs.filter((program) => program.id !== id));

    if (!userId) {
      return;
    }

    try {
      await deleteProgramFromSupabase(id);
      setProgramMessage("Program deleted from Supabase.");
    } catch {
      setProgramMessage("Could not delete program from Supabase.");
    }
  }

  async function shareProgram(program: TrainingProgram) {
    const programKey = String(program.id);
    const email = shareEmailByProgram[programKey]?.trim().toLowerCase() ?? "";
    const permission = sharePermissionByProgram[programKey] ?? "view";

    if (!userId) {
      setProgramMessage("Log in to share programs.");
      return;
    }

    if (!email.includes("@")) {
      setProgramMessage("Enter the email address for the person you want to share with.");
      return;
    }

    try {
      await shareProgramToSupabase(program.id, email, permission);
      setShareEmailByProgram({
        ...shareEmailByProgram,
        [programKey]: "",
      });
      setProgramMessage(program.name + " shared with " + email + ".");
    } catch {
      setProgramMessage("Could not share that program. Check the SQL setup and try again.");
    }
  }

  async function saveSharedProgramCopy(program: SharedTrainingProgram) {
    if (!userId) {
      setProgramMessage("Log in to save a shared program copy.");
      return;
    }

    try {
      const copiedProgram = await saveSharedProgramCopyToSupabase(program);
      setPrograms([copiedProgram, ...programs]);
      setProgramMessage(program.name + " was saved as your own editable copy.");
    } catch {
      setProgramMessage("Could not save a copy of that shared program.");
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Programs
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Workout Program Builder
          </h1>
          <p className="max-w-3xl text-gray-300">
            Build reusable training programs with split type, weekly schedule,
            exercises, sets, reps, and notes.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <CollapsibleSection
            title={editingProgramId ? "Edit Program" : "Create Program"}
            description={
              editingProgramId
                ? "Update the plan details, exercises, sets, reps, and notes."
                : "Start with a split, then add exercises into the plan."
            }
          >
            {programMessage && (
              <p className="mb-4 rounded-md border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">
                {programMessage}
              </p>
            )}
            <form onSubmit={saveProgram} className="space-y-4">
              <div>
                <label htmlFor="program-name" className="mb-1 block text-sm text-gray-300">
                  Program Name
                </label>
                <input
                  id="program-name"
                  name="program-name"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Summer Hypertrophy Block"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="split-type" className="mb-1 block text-sm text-gray-300">
                    Split Type
                  </label>
                  <select
                    id="split-type"
                    name="split-type"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={splitType}
                    onChange={(event) => {
                      setSplitType(event.target.value);
                      syncProgramDays(daysPerWeek, event.target.value);
                    }}
                  >
                    {splitTypes.map((split) => (
                      <option key={split} value={split}>
                        {split}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="days-per-week" className="mb-1 block text-sm text-gray-300">
                    Days Per Week
                  </label>
                  <input
                    id="days-per-week"
                    name="days-per-week"
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    type="number"
                    min="1"
                    max="7"
                    value={daysPerWeek}
                    onChange={(event) => {
                      setDaysPerWeek(event.target.value);
                      syncProgramDays(event.target.value);
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="program-notes" className="mb-1 block text-sm text-gray-300">
                  Program Notes
                </label>
                <textarea
                  id="program-notes"
                  name="program-notes"
                  className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Focus on controlled reps and adding load slowly."
                />
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <h2 className="mb-3 font-semibold">Program Days</h2>
                <div className="space-y-3">
                  {draftDays.map((day, index) => (
                    <div
                      key={day.id}
                      className="rounded-md border border-gray-800 bg-gray-900 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-blue-300">
                          Day {index + 1}
                        </p>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={day.isRestDay}
                            onChange={(event) =>
                              updateProgramDay(day.id, "isRestDay", event.target.checked)
                            }
                          />
                          Rest day
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          value={day.name}
                          onChange={(event) =>
                            updateProgramDay(day.id, "name", event.target.value)
                          }
                          placeholder="Push, Pull, Legs, Rest"
                          aria-label={"Name for day " + (index + 1)}
                        />
                        <input
                          className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                          value={day.notes}
                          onChange={(event) =>
                            updateProgramDay(day.id, "notes", event.target.value)
                          }
                          placeholder="Day notes"
                          aria-label={"Notes for day " + (index + 1)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                <h2 className="mb-3 font-semibold">Add Exercise</h2>
                <div className="grid gap-3">
                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={String(selectedDayId)}
                    onChange={(event) => setSelectedDayId(event.target.value)}
                  >
                    {draftDays.map((day, index) => (
                      <option key={day.id} value={String(day.id)}>
                        Day {index + 1}: {day.name}
                        {day.isRestDay ? " (Rest)" : ""}
                      </option>
                    ))}
                  </select>

                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={exercise}
                    onChange={(event) => chooseExercise(event.target.value)}
                  >
                    {exerciseLibrary.map((libraryExercise) => (
                      <option key={libraryExercise.exercise} value={libraryExercise.exercise}>
                        {libraryExercise.exercise}
                      </option>
                    ))}
                  </select>

                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={muscleGroup}
                    onChange={(event) => setMuscleGroup(event.target.value)}
                  >
                    {muscleGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={sets}
                      onChange={(event) => setSets(event.target.value)}
                      placeholder="Sets"
                    />
                    <input
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      value={reps}
                      onChange={(event) => setReps(event.target.value)}
                      placeholder="Reps"
                    />
                  </div>

                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                    value={exerciseNotes}
                    onChange={(event) => setExerciseNotes(event.target.value)}
                    placeholder="Exercise notes"
                  />

                  <button
                    type="button"
                    onClick={addExerciseToDraft}
                    className="rounded-md bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
                  >
                    Add Exercise To Program
                  </button>
                </div>
              </div>

              {draftDays.length > 0 && (
                <div className="space-y-4">
                  {draftDays.map((day, dayIndex) => (
                    <div
                      key={day.id}
                      className="rounded-md border border-gray-800 bg-gray-950 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            Day {dayIndex + 1}: {day.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {day.isRestDay
                              ? "Rest day"
                              : `${day.exercises.length} exercise${
                                  day.exercises.length === 1 ? "" : "s"
                                }`}
                          </p>
                        </div>
                      </div>

                      {day.exercises.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          {day.isRestDay
                            ? "No exercises needed for this rest day."
                            : "No exercises added to this day yet."}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {day.exercises.map((draftExercise) => (
                            <div
                              key={draftExercise.id}
                              className="rounded-md border border-gray-800 bg-gray-900 p-3"
                            >
                              <div className="grid gap-3">
                                <input
                                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                                  value={draftExercise.exercise}
                                  onChange={(event) =>
                                    updateDraftExercise(
                                      day.id,
                                      draftExercise.id,
                                      "exercise",
                                      event.target.value
                                    )
                                  }
                                  aria-label="Program exercise name"
                                />
                                <select
                                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                                  value={draftExercise.muscleGroup}
                                  onChange={(event) =>
                                    updateDraftExercise(
                                      day.id,
                                      draftExercise.id,
                                      "muscleGroup",
                                      event.target.value
                                    )
                                  }
                                  aria-label="Program exercise muscle group"
                                >
                                  {muscleGroups.map((group) => (
                                    <option key={group} value={group}>
                                      {group}
                                    </option>
                                  ))}
                                </select>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <input
                                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                                    value={draftExercise.sets}
                                    onChange={(event) =>
                                      updateDraftExercise(
                                        day.id,
                                        draftExercise.id,
                                        "sets",
                                        event.target.value
                                      )
                                    }
                                    aria-label="Program exercise sets"
                                  />
                                  <input
                                    className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                                    value={draftExercise.reps}
                                    onChange={(event) =>
                                      updateDraftExercise(
                                        day.id,
                                        draftExercise.id,
                                        "reps",
                                        event.target.value
                                      )
                                    }
                                    aria-label="Program exercise reps"
                                  />
                                </div>
                                <input
                                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                                  value={draftExercise.notes}
                                  onChange={(event) =>
                                    updateDraftExercise(
                                      day.id,
                                      draftExercise.id,
                                      "notes",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Exercise notes"
                                  aria-label="Program exercise notes"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDraftExercise(day.id, draftExercise.id)}
                                className="mt-3 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={draftExercises.length === 0}
                className="w-full rounded-md bg-green-600 p-3 font-semibold hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                {editingProgramId ? "Save Program Changes" : "Save Program"}
              </button>

              {editingProgramId && (
                <button
                  type="button"
                  onClick={resetProgramForm}
                  className="w-full rounded-md bg-white/10 p-3 font-semibold hover:bg-white/15"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </CollapsibleSection>

          <CollapsibleSection title="Saved Programs">
            {programs.length === 0 ? (
              <EmptyState
                title="No programs saved yet"
                description="Create a reusable training plan so future workouts have structure before you start logging."
              />
            ) : (
              <div className="space-y-4">
                {programs.map((program) => (
                  <article
                    key={program.id}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{program.name}</h2>
                        <p className="text-sm text-gray-400">
                          {program.splitType} · {program.daysPerWeek} days/week
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`/add-workout?programId=${program.id}`}
                          className="rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold hover:bg-green-500"
                        >
                          Start Workout
                        </Link>
                        <button
                          type="button"
                          onClick={() => editProgram(program)}
                          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProgram(program.id)}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {userId && (
                      <div className="mb-3 rounded-md border border-gray-800 bg-gray-900 p-3">
                        <p className="mb-2 text-sm font-semibold text-gray-200">
                          Share Program
                        </p>
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                          <input
                            className="w-full rounded-md border border-gray-700 bg-gray-950 p-3 text-sm"
                            type="email"
                            value={shareEmailByProgram[String(program.id)] ?? ""}
                            onChange={(event) =>
                              setShareEmailByProgram({
                                ...shareEmailByProgram,
                                [String(program.id)]: event.target.value,
                              })
                            }
                            placeholder="client@example.com"
                            aria-label={"Email to share " + program.name}
                          />
                          <select
                            className="rounded-md border border-gray-700 bg-gray-950 p-3 text-sm"
                            value={sharePermissionByProgram[String(program.id)] ?? "view"}
                            onChange={(event) =>
                              setSharePermissionByProgram({
                                ...sharePermissionByProgram,
                                [String(program.id)]: event.target.value as "view" | "edit",
                              })
                            }
                            aria-label={"Sharing permission for " + program.name}
                          >
                            <option value="view">View only</option>
                            <option value="edit">Can copy/edit</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => shareProgram(program)}
                            className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    )}
                    {program.notes && (
                      <p className="mb-3 text-sm text-gray-300">{program.notes}</p>
                    )}
                    <div className="space-y-3">
                      {getProgramDays(program).map((day, index) => (
                        <div
                          key={day.id}
                          className="rounded-md border border-gray-800 bg-gray-900 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                Day {index + 1}: {day.name}
                              </p>
                              {day.notes && (
                                <p className="text-sm text-gray-400">{day.notes}</p>
                              )}
                            </div>
                            {day.isRestDay && (
                              <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-gray-200">
                                Rest
                              </span>
                            )}
                          </div>
                          {day.exercises.length === 0 ? (
                            <p className="text-sm text-gray-400">
                              {day.isRestDay ? "Rest day" : "No exercises planned."}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <Link
                                href={`/add-workout?programId=${program.id}&dayId=${day.id}`}
                                className="inline-flex rounded-md bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
                              >
                                Start Day {index + 1}
                              </Link>
                              {day.exercises.map((programExercise) => (
                                <div
                                  key={programExercise.id}
                                  className="rounded-md border border-gray-800 bg-gray-950 p-3"
                                >
                                  <p className="font-semibold">
                                    {programExercise.exercise}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {programExercise.muscleGroup} ·{" "}
                                    {programExercise.sets} x {programExercise.reps}
                                  </p>
                                  {programExercise.notes && (
                                    <p className="mt-1 text-sm text-gray-300">
                                      {programExercise.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {userId && (
            <CollapsibleSection
              title="Shared With Me"
              description="Programs shared to your account email appear here. Save a copy to make it your own."
            >
              {sharedPrograms.length === 0 ? (
                <EmptyState
                  title="No shared programs yet"
                  description="When a coach or friend shares a program to your login email, it will show up here."
                />
              ) : (
                <div className="space-y-4">
                  {sharedPrograms.map((program) => (
                    <article
                      key={program.shareId}
                      className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                            Shared Program
                          </p>
                          <h2 className="text-xl font-semibold">{program.name}</h2>
                          <p className="text-sm text-gray-400">
                            {program.splitType} · {program.daysPerWeek} days/week ·{" "}
                            {program.permission === "edit" ? "Copy/edit allowed" : "View only"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveSharedProgramCopy(program)}
                          className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
                        >
                          Save Copy
                        </button>
                      </div>
                      {program.notes && (
                        <p className="mb-3 text-sm text-gray-300">{program.notes}</p>
                      )}
                      <div className="space-y-3">
                        {getProgramDays(program).map((day, index) => (
                          <div
                            key={day.id}
                            className="rounded-md border border-gray-800 bg-gray-900 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">
                                  Day {index + 1}: {day.name}
                                </p>
                                {day.notes && (
                                  <p className="text-sm text-gray-400">{day.notes}</p>
                                )}
                              </div>
                              {day.isRestDay && (
                                <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-gray-200">
                                  Rest
                                </span>
                              )}
                            </div>
                            {day.exercises.length === 0 ? (
                              <p className="text-sm text-gray-400">
                                {day.isRestDay ? "Rest day" : "No exercises planned."}
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {day.exercises.map((programExercise) => (
                                  <div
                                    key={programExercise.id}
                                    className="rounded-md border border-gray-800 bg-gray-950 p-3"
                                  >
                                    <p className="font-semibold">
                                      {programExercise.exercise}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {programExercise.muscleGroup} ·{" "}
                                      {programExercise.sets} x {programExercise.reps}
                                    </p>
                                    {programExercise.notes && (
                                      <p className="mt-1 text-sm text-gray-300">
                                        {programExercise.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          )}
        </div>
      </section>
    </main>
  );
}
