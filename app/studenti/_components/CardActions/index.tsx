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

    // Decriptăm CNP-ul pentru a-l trimite la form
    const decryptedCNP = decryptCNP(student.cnpEncrypted)

    const defaultValues = {
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        sex: student.sex,
        cnp: decryptedCNP,
        birthDate: student.birthDate,
        birthPlace: student.birthPlace,
        ethnicity: student.ethnicity || undefined,
        religion: student.religion || undefined,
        citizenship: student.citizenship,
        maritalStatus: student.maritalStatus,
        socialSituation: student.socialSituation || undefined,
        isOrphan: student.isOrphan,
        needsSpecialConditions: student.needsSpecialConditions,
        parentsNames: student.parentsNames || undefined,
        residentialAddress: student.residentialAddress || undefined,
        specialMedicalCondition: student.specialMedicalCondition || undefined,
        disability: student.disability,
        groupId: student.groupId || undefined,
        image: student.image,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        createdBy: student.createdBy
            ? {
                  id: student.createdBy.id,
                  name: student.createdBy.name || "Unknown",
              }
            : undefined,
        updatedBy: student.updatedBy
            ? {
                  id: student.updatedBy.id,
                  name: student.updatedBy.name || "Unknown",
              }
            : undefined,
    }

    return <StudentActions defaultValues={defaultValues} />
}
