import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWeight(value?: number | null, units: "metric" | "imperial" = "metric") {
  if (value === null || value === undefined) return "-"
  if (units === "imperial") {
    const lbs = value * 2.20462262185
    return `${lbs.toFixed(1)} lb`
  }
  return `${value.toFixed(1)} kg`
}

export function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return "-"
  const sec = Math.max(0, Math.floor(seconds))
  const hrs = Math.floor(sec / 3600)
  const mins = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${mins}:${String(s).padStart(2, "0")}`
}
