import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format date to Romanian locale
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

// Format time (e.g., "08:00")
export function formatTime(time: string): string {
    return time
}

// Calculate duration between two hours
export function calculateDuration(startHour: string, endHour: string): number {
    const start = parseInt(startHour.split(":")[0], 10)
    const end = parseInt(endHour.split(":")[0], 10)
    return Math.max(1, end - start)
}

// Convert hour number to time string
export function numberToHour(num: number): string {
    return `${String(num).padStart(2, "0")}:00`
}

// Convert time string to hour number
export function hourToNumber(hour: string): number {
    return parseInt(hour.split(":")[0], 10)
}
