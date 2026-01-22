"use server"

import { getStudentById } from "@/data/student"
import { decryptCNP } from "@/lib/encryption"
import { StudentActions } from "../StudentActions"

type CardActionsProps = {
    studentId: string
}

export async function CardActions({ studentId }: CardActionsProps) {
    const student = await getStudentById(studentId)

    if (!student) {
        return null
    }

    console.log("student: ", student)

    // Decriptăm CNP-ul pentru a-l trimite la form
    const decryptedCNP = decryptCNP(student.cnpEncrypted)

    const defaultValues = {
        id: student.id,
        firstname: student.user?.firstname || "",
        lastname: student.user?.lastname || "",
        email: student.email,
        sex: student.user?.sex || "MASCULIN",
        cnp: decryptedCNP,
        birthDate: student.birthDate,
        birthPlace: student.birthCity || "", // TODO: Schema mismatch - form expects birthPlace but DB has birthCity/birthAddress/birthCountry
        ethnicity: student.ethnicity || undefined,
        religion: student.religion || undefined,
        citizenship: student.citizenship,
        maritalStatus: student.maritalStatus,
        socialSituation: student.socialSituation || undefined,
        isOrphan: student.isOrphan,
        needsSpecialConditions: student.needsSpecialConditions,
        parentsNames: undefined, // TODO: Schema mismatch - form expects parentsNames but DB has motherFirstname/motherLastname/fatherFirstname/fatherLastname
        residentialAddress: undefined, // TODO: Schema mismatch - form expects residentialAddress but field doesn't exist in DB
        specialMedicalCondition: student.specialMedicalCondition || undefined,
        disability: student.disability,
        groupId: student.groupId || undefined,
        image: student.user?.image || undefined,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        createdById: student.createdById,
        updatedById: student.updatedById
    }

    return <StudentActions defaultValues={defaultValues} />
}
