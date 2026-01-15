import { z } from "zod"

export const teacherSchema = z.object({
    title: z.string().min(1, "Te rog sa selectezi un titlu"),
    grade: z.string().min(1, "Te rog sa selectezi un grad"),
    firstname: z.string().min(2, "Prenumele trebuie sa fie format din minim 2 caractere"),
    lastname: z.string().min(2, "Numele trebuie sa fie format din minim 2 caractere"),
    email: z.email("Adresa de email introdusa este invalida"),
    phone: z.string().optional(),
    image: z.url("URL invalid pentru imagine").optional().nullable().or(z.literal("")),
})

export const teacherIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipseste")
})

export type CreateTeacherInput = z.infer<typeof teacherSchema>    