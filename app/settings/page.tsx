"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { ThemeControls } from "../components/ThemeControls";
import { supabase } from "../lib/supabaseClient";

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? "");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail("");
    setMessage("You are logged out.");
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Settings
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">App Settings</h1>
          <p className="max-w-2xl text-gray-300">
            Manage your profile, account, theme, and app appearance from one place.
          </p>
          {message && (
            <p className="mt-3 rounded-md border border-white/10 bg-gray-950 p-3 text-sm text-gray-300">
              {message}
            </p>
          )}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Account</p>
            <p className="mt-1 font-semibold">
              {userEmail ? "Connected" : "Not logged in"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Appearance</p>
            <p className="mt-1 font-semibold">Saved on this device</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Data</p>
            <p className="mt-1 font-semibold">
              {userEmail ? "Supabase sync ready" : "Local device mode"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <CollapsibleSection
            title="Appearance"
            description="Choose light or dark mode and change the app accent color."
          >
            <ThemeControls layout="panel" />
          </CollapsibleSection>

          <CollapsibleSection
            title="Profile"
            description="Update your name, age, height, and weight."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">User Profile</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Keep your basic profile details connected to your account.
                </p>
              </div>
              <Link
                href="/profile"
                className="rounded-md bg-blue-600 px-4 py-3 text-center font-semibold hover:bg-blue-500"
              >
                Open Profile
              </Link>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Account"
            description="Log in, create an account, or sign out."
          >
            {userEmail ? (
              <div className="space-y-4">
                <div className="rounded-md border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm text-gray-400">Logged in as</p>
                  <p className="font-semibold">{userEmail}</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-md bg-red-600 p-3 font-semibold hover:bg-red-500 sm:w-auto sm:px-5"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Not logged in</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Log in to save workouts and profile data to Supabase.
                  </p>
                </div>
                <Link
                  href="/auth"
                  className="rounded-md bg-blue-600 px-4 py-3 text-center font-semibold hover:bg-blue-500"
                >
                  Open Account
                </Link>
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Data"
            description="Review where your app data is saved."
            defaultOpen={false}
          >
            <div className="rounded-md border border-gray-800 bg-gray-950 p-4">
              <h2 className="text-xl font-semibold">
                {userEmail ? "Cloud-backed mode" : "Local mode"}
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                {userEmail
                  ? "Workouts and profile details can save to Supabase for this account. Some planning features still save on this device while they are being built out."
                  : "Log in when you want workouts and profile details to save to Supabase. Until then, your browser keeps local data on this device."}
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="About"
            description="Project summary for ExerciseInsight."
            defaultOpen={false}
          >
            <div className="rounded-md border border-gray-800 bg-gray-950 p-4">
              <h2 className="text-xl font-semibold">ExerciseInsight</h2>
              <p className="mt-2 text-sm text-gray-400">
                A workout tracking app for logging sessions, managing programs,
                tracking goals, reviewing progress, and customizing the user
                experience.
              </p>
            </div>
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
