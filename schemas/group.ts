import { z } from "zod"

export const groupSchema = z.object({
    name: z.string()
        .min(2, "Numele grupului trebuie sa fie format din minim 2 caractere")
        .max(100, "Numele grupului este prea lung")
        .trim(),
    studyYearId: z.string()
        .min(1, "Te rog sa selectezi un an de studiu"),
    learningTypeId: z.string()
        .optional()
        .or(z.literal("")),
    semester: z.coerce.number()
        .int("Semestrul trebuie sa fie un numar intreg")
        .min(1, "Semestrul trebuie sa fie minim 1")
        .max(2, "Semestrul trebuie sa fie maxim 2"),
    group: z.coerce.number()
        .int("Grupa trebuie sa fie un numar intreg")
        .min(1, "Grupa trebuie sa fie minim 1")
})

export const groupIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipseste")
})