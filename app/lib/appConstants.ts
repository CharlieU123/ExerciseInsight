import type { Profile } from "./types";

export const emptyProfile: Profile = {
  name: "",
  gender: "",
  age: "",
  height: "",
  weight: "",
};

export const genderOptions = [
  "Prefer not to say",
  "Female",
  "Male",
  "Non-binary",
  "Self-describe",
];

export const splitTypes = ["Push/Pull/Legs", "Upper/Lower", "Full Body EOD"];

export const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Forearms",
  "Neck",
  "Cardio",
  "Full Body",
  "Other",
];
