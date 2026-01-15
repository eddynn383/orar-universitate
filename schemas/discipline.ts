import { z } from "zod"

export const disciplineSchema = z.object({
    name: z.string()
        .min(2, "Numele disciplinei trebuie sa fie format din minim 2 caractere")
        .max(100, "Numele disciplinei este prea lung")
        .trim(),
    teacherId: z.string()
        .min(1, "Te rog sa selectezi un cadru didactic"),
    studyYearId: z.string()
        .min(1, "Te rog sa selectezi un an de studiu"),
    learningTypeId: z.string()
        .optional()
        .or(z.literal("")),
    semester: z.coerce.number()
        .int("Semestrul trebuie sa fie un numar intreg")
        .min(1, "Semestrul trebuie sa fie minim 1")
        .max(2, "Semestrul trebuie sa fie maxim 2"),
})

export const disciplineIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipseste")
})