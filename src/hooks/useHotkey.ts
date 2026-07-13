"use client";

import { useEffect } from "react";

/**
 * Custom hook for keyboard shortcuts.
 *
 * @param key     - The key to listen for, e.g. "Escape", "Control+k", "ArrowLeft".
 *                  Modifiers: "Control+", "Meta+", "Alt+", "Shift+" (case-insensitive key).
 * @param callback - The function to invoke when the key combination is pressed.
 * @param options  - Optional configuration.
 *   enabled:  When false, the listener is not registered (useful for conditional shortcuts).
 *   target:   Where to attach the listener (default: window for Escape, document otherwise).
 */
export function useHotkey(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options?: { enabled?: boolean; target?: EventTarget }
) {
  const enabled = options?.enabled !== false; // default true

  useEffect(() => {
    if (!enabled) return;

    const parts = key.toLowerCase().split("+");
    const mainKey = parts[parts.length - 1]; // last segment is the actual key
    const ctrlRequired = parts.includes("control");
    const metaRequired = parts.includes("meta");
    const altRequired = parts.includes("alt");
    const shiftRequired = parts.includes("shift");

    const handler = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === mainKey &&
        e.ctrlKey === ctrlRequired &&
        e.metaKey === metaRequired &&
        e.altKey === altRequired &&
        e.shiftKey === shiftRequired
      ) {
        // Don't fire when typing in an input/textarea/select
        const tag = (e.target as HTMLElement)?.tagName;
        const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
        // Allow Escape everywhere; other shortcuts skip when focused on input
        if (mainKey !== "escape" && isInput) return;

        e.preventDefault();
        callback(e);
      }
    };

    const target = options?.target ?? (mainKey === "escape" ? window : document);
    target.addEventListener("keydown", handler as EventListener);
    return () => target.removeEventListener("keydown", handler as EventListener);
  }, [key, callback, enabled, options?.target]);
}
