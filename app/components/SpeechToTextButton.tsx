"use client";

import { useRef, useState } from "react";

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: {
    [index: number]: {
      transcript: string;
    };
  };
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechToTextButtonProps = {
  onTranscript: (transcript: string) => void;
};

export function SpeechToTextButton({ onTranscript }: SpeechToTextButtonProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState("");

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("Speech-to-text is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      onTranscript(transcript.trim());
      setMessage("Voice note added.");
    };

    recognition.onerror = (event) => {
      setMessage("Microphone error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setMessage("Listening...");
    setIsListening(true);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setMessage("Stopped listening.");
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={
          isListening
            ? "rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
            : "rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        }
      >
        {isListening ? "Stop Listening" : "Add Voice Note"}
      </button>

      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
}
