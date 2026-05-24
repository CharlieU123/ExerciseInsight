"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    tone: "info" | "success" | "error";
  } | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordIsLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

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
    setMessage(null);

    if (!passwordIsLongEnough) {
      setMessage({
        text: "Use at least 8 characters for your password.",
        tone: "error",
      });
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setMessage({
        text: "The passwords do not match.",
        tone: "error",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({
        text: error.message,
        tone: "error",
      });
    } else {
      setMessage({
        text: "Account created. Check your email if confirmation is required, then come back and log in.",
        tone: "success",
      });
      setPassword("");
      setConfirmPassword("");
      setMode("login");
    }

    setIsLoading(false);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({
        text: error.message,
        tone: "error",
      });
    } else {
      setMessage({
        text: "You are logged in. Your workouts, profile, programs, and goals can now sync.",
        tone: "success",
      });
      setPassword("");
      setConfirmPassword("");
    }

    setIsLoading(false);
  }

  async function handleLogout() {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUserEmail("");
    setMessage({
      text: "You are logged out.",
      tone: "info",
    });
    setIsLoading(false);
  }

  async function handlePasswordReset() {
    if (!email) {
      setMessage({
        text: "Enter your email first, then click reset password.",
        tone: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined" ? window.location.origin + "/auth" : undefined,
    });

    setMessage(
      error
        ? {
            text: error.message,
            tone: "error",
          }
        : {
            text: "Password reset email sent. Check your inbox.",
            tone: "success",
          }
    );
    setIsLoading(false);
  }

  const messageStyles = {
    info: "border-white/10 bg-gray-950 text-gray-300",
    success: "border-green-900 bg-green-950/70 text-green-100",
    error: "border-red-900 bg-red-950/70 text-red-100",
  };

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            Account
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Join ExerciseInsight
          </h1>
          <p className="max-w-2xl text-gray-300">
            Create an account to sync workouts, programs, profile details, goals,
            and shared plans across devices.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 sm:p-6">
            <h2 className="text-2xl font-bold">Why make an account?</h2>
            <div className="mt-5 space-y-4">
              {[
                ["Cloud sync", "Keep your training data attached to your login."],
                ["Program sharing", "Receive plans from friends or coaches."],
                ["Progress history", "Come back later and keep building your log."],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-md border border-gray-800 bg-gray-950 p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-gray-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
          {userEmail ? (
            <div className="space-y-4">
              <div className="rounded-md border border-green-900 bg-green-950/60 p-4">
                <p className="text-sm text-green-200">You are signed in as</p>
                <p className="break-all text-lg font-semibold">{userEmail}</p>
                <p className="mt-2 text-sm text-green-100/80">
                  Your account can now sync app data and receive shared programs.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/programs"
                  className="rounded-md bg-blue-600 p-3 text-center font-semibold hover:bg-blue-500"
                >
                  View Programs
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="rounded-md bg-red-600 p-3 font-semibold hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  {isLoading ? "Signing out..." : "Log Out"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 rounded-md border border-gray-800 bg-gray-950 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage(null);
                  }}
                  className={`rounded px-3 py-2 font-semibold ${
                    mode === "signup" ? "bg-blue-600 text-white" : "text-gray-300"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage(null);
                  }}
                  className={`rounded px-3 py-2 font-semibold ${
                    mode === "login" ? "bg-blue-600 text-white" : "text-gray-300"
                  }`}
                >
                  Log In
                </button>
              </div>

              <form
                onSubmit={mode === "signup" ? handleSignUp : handleLogin}
                className="space-y-4"
              >
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
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>

              {mode === "signup" && (
                <>
                  <div>
                    <label
                      htmlFor="auth-confirm-password"
                      className="mb-1 block text-sm text-gray-300"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="auth-confirm-password"
                      name="auth-confirm-password"
                      className="w-full rounded-md border border-gray-700 bg-gray-950 p-3"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter password"
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="rounded-md border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">
                    <p className={passwordIsLongEnough ? "text-green-300" : ""}>
                      Password is at least 8 characters
                    </p>
                    <p className={confirmPassword && passwordsMatch ? "text-green-300" : ""}>
                      Passwords match
                    </p>
                  </div>
                </>
              )}

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full rounded-md bg-blue-600 p-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  {isLoading
                    ? mode === "signup"
                      ? "Creating account..."
                      : "Logging in..."
                    : mode === "signup"
                      ? "Create Account"
                      : "Log In"}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                    className="w-full rounded-md bg-white/10 p-3 font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    Reset Password
                  </button>
                )}
              </form>
            </div>
          )}

          {message && (
            <p className={`mt-4 rounded-md border p-3 text-sm ${messageStyles[message.tone]}`}>
              {message.text}
            </p>
          )}
          </div>
        </section>
      </section>
    </main>
  );
}
