import { z } from "zod"

const learningCycles = ["Licenta", "Master"] as const;

export const learningTypeSchema = z.object({
    learningCycle: z.enum(learningCycles, { message: "Numele ciclului de invatamant este obligatoriu" }),
})