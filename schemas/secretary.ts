import { z } from "zod"

export const secretarySchema = z.object({
    // Date de bază
    firstname: z.string().min(2, "Prenumele trebuie să fie format din minim 2 caractere"),
    lastname: z.string().min(2, "Numele trebuie să fie format din minim 2 caractere"),
    email: z.string().email("Adresa de email introdusă este invalidă"),
    phone: z.string().optional(),
    image: z.url("URL invalid pentru imagine").optional().nullable().or(z.literal("")),

    // Informații specifice secretarului/secretarei
    department: z.string().optional(),
    office: z.string().optional(),
    officePhone: z.string().optional(),
    workSchedule: z.string().optional(),
    responsibilities: z.string().optional(),
})

export const secretaryIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipsește"),
})

export type CreateSecretaryInput = z.infer<typeof secretarySchema>
