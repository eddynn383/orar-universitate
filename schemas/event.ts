// schemas/event.ts

import { z } from "zod"

export const eventSchema = z.object({
    day: z.enum(["LUNI", "MARTI", "MIERCURI", "JOI", "VINERI"], {
        message: "Ziua este obligatorie"
    }),
    startHour: z.string({ message: "Ora de început este obligatorie" }).min(1, "Ora de început este obligatorie"),
    endHour: z.string({ message: "Ora de sfârșit este obligatorie" }).min(1, "Ora de sfârșit este obligatorie"),
    duration: z.string().transform((val) => val ? parseInt(val, 10) : null).optional(),
    academicYearId: z.string({ message: "Anul academic este obligatoriu" }).min(1, "Anul academic este obligatoriu"),
    semester: z.string({ message: "Semestrul este obligatoriu" }).transform((val) => parseInt(val, 10)).pipe(
        z.number().min(1, "Semestrul trebuie să fie 1 sau 2").max(2, "Semestrul trebuie să fie 1 sau 2")
    ),
    eventType: z.string({ message: "Tipul de activitate este obligatoriu" }).min(1, "Tipul de activitate este obligatoriu"),
    eventRecurrence: z.string().optional(),
    learningId: z.string({ message: "Tipul de educație este obligatoriu" }).min(1, "Tipul de educație este obligatoriu"),
    teacherId: z.string({ message: "Cadrul didactic este obligatoriu" }).min(1, "Cadrul didactic este obligatoriu"),
    disciplineId: z.string({ message: "Disciplina este obligatorie" }).min(1, "Disciplina este obligatorie"),
    classroomId: z.string({ message: "Sala este obligatorie" }).min(1, "Sala este obligatorie"),
    // Support for multiple groups - can be undefined, single string, or array
    groupIds: z.union([
        z.string(),
        z.array(z.string())
    ]).transform((val) => {
        // Convert to array and filter empty values
        if (typeof val === 'string') {
            const trimmed = val.trim()
            return trimmed.length > 0 ? [trimmed] : []
        }
        return val.filter(id => id && id.trim().length > 0)
    }).refine((arr) => arr.length > 0, {
        message: "Cel puțin o grupă este obligatorie"
    }),
})

export type EventInput = z.infer<typeof eventSchema>