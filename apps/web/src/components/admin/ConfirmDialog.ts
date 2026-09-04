"use client";

/** Native confirm — good enough for an MVP admin panel and works without extra UI state. */
export function confirmAction(message: string): boolean {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}

/** Native prompt for an optional reason/note. Returns null when cancelled. */
export function promptText(message: string, defaultValue = ""): string | null {
  if (typeof window === "undefined") return null;
  const value = window.prompt(message, defaultValue);
  if (value === null) return null;
  return value.trim();
}
