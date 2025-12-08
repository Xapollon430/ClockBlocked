import { DAYS } from "@/constants";

/**
 * Format time from 24-hour format to 12-hour format with AM/PM
 */
export const formatTime = (hours: number, minutes: number): string => {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${period}`;
};

/**
 * Format selected days array into a readable string
 */
export const formatDays = (selectedDays: number[]): string => {
  if (selectedDays.length === 7) return "Every day";
  if (selectedDays.length === 0) return "No days selected";
  return selectedDays
    .sort((a, b) => a - b)
    .map((idx) => DAYS[idx])
    .join(", ");
};
