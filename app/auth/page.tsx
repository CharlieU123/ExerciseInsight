"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created. Check your email if confirmation is required.");
      setPassword("");
    }

    setIsLoading(false);
  }

  async function handleLogin() {
    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("You are logged in.");
      setPassword("");
    }

    setIsLoading(false);
  }

  async function handleLogout() {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUserEmail("");
    setMessage("You are logged out.");
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Account
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            ExerciseInsight Login
          </h1>
          <p className="text-gray-300">
            Create an account so workouts can eventually save to your Supabase
            database instead of only this device.
          </p>
        </div>

        <section className="rounded-lg border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
          {userEmail ? (
            <div className="space-y-4">
              <div className="rounded-md border border-green-900 bg-green-950/60 p-4">
                <p className="text-sm text-green-200">Logged in as</p>
                <p className="font-semibold">{userEmail}</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full rounded-md bg-red-600 p-3 font-semibold hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                Log Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="mb-1 block text-sm text-gray-300">
                  Email
                </label>
                <input
                  id="auth-email"
                  name="auth-email"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-1 block text-sm text-gray-300"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  name="auth-password"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-blue-600 p-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  Sign Up
                </button>

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading || !email || !password}
                  className="rounded-md bg-white/10 p-3 font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  Log In
                </button>
              </div>
            </form>
          )}

          {message && (
            <p className="mt-4 rounded-md border border-white/10 bg-gray-950 p-3 text-sm text-gray-300">
              {message}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
