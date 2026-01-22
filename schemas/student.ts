import { z } from "zod"
import { validateCNP } from "@/lib/encryption"

// Enum pentru sex
export const sexEnum = z.enum(["MASCULIN", "FEMININ"]).refine(val => val !== undefined, {
    message: "Te rog să selectezi sexul",
})

// Enum pentru dizabilitate
export const disabilityEnum = z.enum(["NONE", "GRAD_1", "GRAD_2"]).refine(val => val !== undefined, {
    message: "Te rog să selectezi gradul de dizabilitate",
})

// Enum pentru stare civilă
export const maritalStatusEnum = z.enum(["NECASATORIT", "CASATORIT", "DIVORTAT", "VADUV"]).refine(val => val !== undefined, {
    message: "Te rog să selectezi starea civilă",
})

// Schema principală pentru Student
export const studentSchema = z.object({
    // Date de bază
    firstname: z.string().min(2, "Prenumele trebuie să fie format din minim 2 caractere"),
    lastname: z.string().min(2, "Numele trebuie să fie format din minim 2 caractere"),
    email: z.email("Adresa de email introdusă este invalidă"),
    image: z.url("URL invalid pentru imagine").optional().nullable().or(z.literal("")),

    // Date personale
    sex: sexEnum,
    cnp: z
        .string()
        .length(13, "CNP-ul trebuie să aibă exact 13 cifre")
        .regex(/^\d{13}$/, "CNP-ul trebuie să conțină doar cifre")
        .refine((val) => validateCNP(val), {
            message: "CNP invalid - cifra de control nu este corectă",
        }),
    birthDate: z.string().min(1, "Data nașterii este obligatorie"),
    birthPlace: z.string().min(2, "Locul nașterii trebuie să aibă minim 2 caractere"),
    ethnicity: z.string().optional(),
    religion: z.string().optional(),
    citizenship: z.string().default("Română"),
    maritalStatus: maritalStatusEnum.default("NECASATORIT"),

    // Situație socială
    socialSituation: z.string().optional(),
    isOrphan: z.boolean().default(false),
    needsSpecialConditions: z.boolean().default(false),

    // Familie
    motherFirstname: z.string().optional(), // Prenume mamă
    motherLastname: z.string().optional(),  // Nume mamă
    fatherFirstname: z.string().optional(), // Prenume tată
    fatherLastname: z.string().optional(),  // Nume tată

    // Adresă
    residentialAddress: z.string().optional(),

    // Informații medicale
    specialMedicalCondition: z.string().optional(),
    disability: disabilityEnum.default("NONE"),

    // Grup (opțional)
    groupId: z.string().optional().nullable(),
})

export const studentIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipsește"),
})

export type CreateStudentInput = z.infer<typeof studentSchema>
export type StudentSex = z.infer<typeof sexEnum>
export type StudentDisability = z.infer<typeof disabilityEnum>
export type StudentMaritalStatus = z.infer<typeof maritalStatusEnum>
