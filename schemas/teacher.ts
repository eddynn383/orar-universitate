import { z } from "zod"

export const teacherSchema = z.object({
    // Date de bază
    firstname: z.string().min(2, "Prenumele trebuie sa fie format din minim 2 caractere"),
    lastname: z.string().min(2, "Numele trebuie sa fie format din minim 2 caractere"),
    email: z.string().email("Adresa de email introdusa este invalida"),
    phone: z.string().optional(),
    image: z.url("URL invalid pentru imagine").optional().nullable().or(z.literal("")),
    sex: z.enum(["MASCULIN", "FEMININ"]).refine(val => val !== undefined, {
        message: "Te rog să selectezi sexul",
    }),
    // Informații academice
    title: z.string().optional(),
    grade: z.string().optional(),
    education: z.string().optional(),
})

export const teacherIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipseste")
})

export type CreateTeacherInput = z.infer<typeof teacherSchema>    