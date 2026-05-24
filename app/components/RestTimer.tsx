"use client";

import { useEffect, useState } from "react";

const timerOptions = [60, 90, 120, 180];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function RestTimer() {
  const [selectedSeconds, setSelectedSeconds] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setIsRunning(false);
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  function chooseTimer(seconds: number) {
    setSelectedSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
  }

  function resetTimer() {
    setRemainingSeconds(selectedSeconds);
    setIsRunning(false);
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Rest Timer</h2>
          <p className="text-sm text-gray-400">Use between hard sets.</p>
        </div>
        <p className="text-4xl font-bold">{formatTime(remainingSeconds)}</p>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {timerOptions.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => chooseTimer(seconds)}
            className={
              seconds === selectedSeconds
                ? "rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold"
                : "rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
            }
          >
            {seconds}s
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold hover:bg-gray-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
