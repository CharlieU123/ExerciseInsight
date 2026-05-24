"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CollapsibleSection } from "../components/CollapsibleSection";
import {
  emptyProfile,
  genderOptions,
  loadProfile,
  loadWorkouts,
  saveWorkouts,
  saveProfile,
  type Profile,
  type Workout,
} from "../lib/fitnessData";
import { supabase } from "../lib/supabaseClient";

type BackupData = {
  profile: Profile;
  workouts: Workout[];
  exportedAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [backupMessage, setBackupMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);

  useEffect(() => {
    async function loadProfileData(user: User | null) {
      if (!user) {
        setUserId("");
        setUserEmail("");
        setProfile(loadProfile());
        setProfileMessage("Profile is saving to this device. Log in to save it to Supabase.");
        setHasLoadedSavedData(true);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("name, gender, age, height, weight")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setProfile(loadProfile());
        setProfileMessage("Could not load Supabase profile. Using this device for now.");
      } else {
        const savedProfile = data
          ? {
              name: data.name ?? "",
              gender: data.gender ?? "",
              age: data.age ?? "",
              height: data.height ?? "",
              weight: data.weight ?? "",
            }
          : loadProfile();

        setProfile(savedProfile);
        saveProfile(savedProfile);
        setProfileMessage("Profile is connected to Supabase.");
      }

      setHasLoadedSavedData(true);
    }

    supabase.auth.getUser().then(({ data }) => {
      loadProfileData(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasLoadedSavedData(false);
      loadProfileData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedData) {
      return;
    }

    saveProfile(profile);

    if (!userId) {
      return;
    }

    supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          name: profile.name,
          gender: profile.gender,
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .then(({ error }) => {
        if (error) {
          setProfileMessage("Could not save profile to Supabase: " + error.message);
        } else {
          setProfileMessage("Profile saved to Supabase.");
        }
      });
  }, [hasLoadedSavedData, profile, userId]);

  function updateProfile(field: keyof Profile, value: string) {
    setProfile({
      ...profile,
      [field]: value,
    });
  }

  function exportData() {
    const backupData: BackupData = {
      profile,
      workouts: loadWorkouts(),
      exportedAt: new Date().toISOString(),
    };
    const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const backupUrl = URL.createObjectURL(backupBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = backupUrl;
    downloadLink.download = "exerciseinsight-backup.json";
    downloadLink.click();
    URL.revokeObjectURL(backupUrl);
    setBackupMessage("Backup exported.");
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const backupData = JSON.parse(String(reader.result)) as BackupData;

        if (!Array.isArray(backupData.workouts) || !backupData.profile) {
          setBackupMessage("That file does not look like a valid backup.");
          return;
        }

        saveWorkouts(backupData.workouts);
        saveProfile(backupData.profile);
        setProfile(backupData.profile);
        setBackupMessage("Backup imported. Refresh other pages to see updates.");
      } catch {
        setBackupMessage("Could not import that backup file.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Profile
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">User Profile</h1>
          <p className="text-gray-300">
            Save basic profile details for the person using ExerciseInsight.
          </p>
        </div>

        <CollapsibleSection title="Profile Details">
          <div className="mb-5 rounded-md border border-white/10 bg-gray-950 p-4 text-sm text-gray-300">
            {userEmail ? (
              <p>
                Logged in as <span className="font-semibold text-white">{userEmail}</span>.
              </p>
            ) : (
              <p>
                You are not logged in. This profile will stay on this device until
                you sign in.
              </p>
            )}
            {profileMessage && <p className="mt-1 text-gray-400">{profileMessage}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label htmlFor="profile-name" className="mb-1 block text-sm text-gray-300">Name</label>
              <input
                id="profile-name"
                name="profile-name"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="text"
                value={profile.name}
                onChange={(event) => updateProfile("name", event.target.value)}
                placeholder="Charlie"
              />
            </div>

            <div>
              <label htmlFor="profile-gender" className="mb-1 block text-sm text-gray-300">Gender</label>
              <select
                id="profile-gender"
                name="profile-gender"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                value={profile.gender}
                onChange={(event) => updateProfile("gender", event.target.value)}
              >
                <option value="">Select one</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profile-age" className="mb-1 block text-sm text-gray-300">Age</label>
              <input
                id="profile-age"
                name="profile-age"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="number"
                value={profile.age}
                onChange={(event) => updateProfile("age", event.target.value)}
                placeholder="20"
              />
            </div>

            <div>
              <label htmlFor="profile-height" className="mb-1 block text-sm text-gray-300">Height</label>
              <input
                id="profile-height"
                name="profile-height"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="text"
                value={profile.height}
                onChange={(event) => updateProfile("height", event.target.value)}
                placeholder="5'10"
              />
            </div>

            <div>
              <label htmlFor="profile-weight" className="mb-1 block text-sm text-gray-300">Weight</label>
              <input
                id="profile-weight"
                name="profile-weight"
                className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                type="text"
                value={profile.weight}
                onChange={(event) => updateProfile("weight", event.target.value)}
                placeholder="175 lbs"
              />
            </div>
          </div>

          {profile.name && (
            <p className="mt-4 text-gray-300">
              Welcome back, {profile.name}. Your profile is saved{" "}
              {userId ? "to Supabase" : "on this device"}.
            </p>
          )}
        </CollapsibleSection>

        <div className="mt-8">
          <CollapsibleSection
            title="Data Backup"
            description="Export or import workouts and profile data from this device."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={exportData}
                className="rounded-md bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
              >
                Export Data
              </button>

              <label className="cursor-pointer rounded-md bg-gray-800 px-4 py-3 text-center font-semibold hover:bg-gray-700">
                Import Data
                <input
                  id="backup-file"
                  name="backup-file"
                  className="hidden"
                  type="file"
                  accept="application/json"
                  onChange={importData}
                />
              </label>
            </div>

            {backupMessage && (
              <p className="mt-4 text-sm text-gray-300">{backupMessage}</p>
            )}
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
