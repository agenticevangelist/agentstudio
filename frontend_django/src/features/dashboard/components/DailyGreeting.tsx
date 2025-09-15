"use client";

import * as React from "react";
import { createWheelSound } from "@/shared/lib/audio/wheelSound";

// Plays a greeting sound once per day when the app is opened.
// Uses localStorage key 'greeting_last_played' with value YYYY-MM-DD (local time).
// Handles autoplay restrictions by deferring playback until first user interaction if necessary.
export function DailyGreeting() {
  const SOUND_SRC = "/audio/greeating.mp3"; // note: file is in /public/audio/
  const VOLUME = 0.6; // tune as desired
  const KEY_LAST = "greeting_last_played";

  const soundRef = React.useRef<ReturnType<typeof createWheelSound> | null>(null);
  const didAttemptRef = React.useRef(false);
  const playedTodayRef = React.useRef(false);

  // Utility: format local date as YYYY-MM-DD
  const todayStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Create sound object
  React.useEffect(() => {
    soundRef.current = createWheelSound({ src: SOUND_SRC, volume: VOLUME, enabled: true });
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  // Determine if we've already greeted today
  React.useEffect(() => {
    try {
      const last = localStorage.getItem(KEY_LAST);
      playedTodayRef.current = last === todayStr;
    } catch {
      // ignore storage errors
    }
  }, [todayStr]);

  const markPlayed = React.useCallback(() => {
    try {
      localStorage.setItem(KEY_LAST, todayStr);
    } catch {
      // ignore storage errors
    }
    playedTodayRef.current = true;
  }, [todayStr]);

  const tryPlay = React.useCallback(async () => {
    if (playedTodayRef.current) return;
    const snd = soundRef.current;
    if (!snd) return;
    snd.setVolume(VOLUME);
    try {
      await snd.play();
      markPlayed();
    } catch {
      // Autoplay likely blocked; will wait for a gesture
    }
  }, [markPlayed]);

  // Attempt immediate playback if allowed, otherwise arm listeners for first gesture
  React.useEffect(() => {
    if (didAttemptRef.current) return;
    didAttemptRef.current = true;

    if (!playedTodayRef.current && document.visibilityState === "visible") {
      // fire-and-forget; errors handled inside
      void tryPlay();
    }

    const onUserGesture = async () => {
      if (playedTodayRef.current) {
        cleanup();
        return;
      }
      await tryPlay();
      if (playedTodayRef.current) cleanup();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void tryPlay();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
      window.removeEventListener("touchstart", onUserGesture);
      document.removeEventListener("visibilitychange", onVisibility);
    };

    window.addEventListener("pointerdown", onUserGesture, { once: false });
    window.addEventListener("keydown", onUserGesture, { once: false });
    window.addEventListener("touchstart", onUserGesture, { once: false });
    document.addEventListener("visibilitychange", onVisibility, { once: false });

    return cleanup;
  }, [tryPlay]);

  return null;
}
