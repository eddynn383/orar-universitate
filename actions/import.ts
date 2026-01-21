"use server"

import prisma from "@/lib/prisma"
import { studentSchema } from "@/schemas/student"
import { teacherSchema } from "@/schemas/teacher"
import { secretarySchema } from "@/schemas/secretary"
import { adminSchema } from "@/schemas/admin"
import { encryptCNP, generatePublicStudentId } from "@/lib/encryption"
import bcrypt from "bcryptjs"
import { ImportResult } from "@/lib/import"

/**
 * Importă studenți din date CSV/XLSX
 */
export async function importStudents(
    data: any[],
    userId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 1

        try {
            // Convertim valorile boolean din string
            const processedData = {
                ...row,
                isOrphan: row.isOrphan === "true" || row.isOrphan === "da" || row.isOrphan === true,
                needsSpecialConditions: row.needsSpecialConditions === "true" || row.needsSpecialConditions === "da" || row.needsSpecialConditions === true,
            }

            // Validare cu schema Zod
            const validation = studentSchema.safeParse(processedData)

            if (!validation.success) {
                const firstError = validation.error.errors[0]
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: `${firstError.path.join('.')}: ${firstError.message}`,
                    details: validation.error.errors
                })
                continue
            }

            // Verificăm dacă există deja un student cu acest email
            const existingStudent = await prisma.student.findUnique({
                where: { email: validation.data.email }
            })

            if (existingStudent) {
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: "Un student cu acest email există deja"
                })
                continue
            }

            // Verificăm dacă există un User cu acest email
            let userRecord = await prisma.user.findUnique({
                where: { email: validation.data.email }
            })

            let userIdToUse: string

            if (userRecord) {
                // Dacă există User, verificăm dacă are rolul corect
                if (userRecord.role !== "STUDENT") {
                    result.failed++
                    result.errors.push({
                        row: rowNumber,
                        email: row.email,
                        message: `Acest email este deja folosit de un utilizator cu rol ${userRecord.role}`
                    })
                    continue
                }
                userIdToUse = userRecord.id
            } else {
                // Creăm un User nou
                const password = Math.random().toString(36).slice(-8)
                const hashedPassword = await bcrypt.hash(password, 10)

                userRecord = await prisma.user.create({
                    data: {
                        name: `${validation.data.firstname} ${validation.data.lastname}`,
                        email: validation.data.email,
                        role: "STUDENT",
                        password: hashedPassword,
                        image: validation.data.image || null,
                    }
                })
                userIdToUse = userRecord.id
            }

            // Criptăm CNP-ul
            const cnpEncrypted = encryptCNP(validation.data.cnp)

            // Generăm publicId unic
            let publicId = generatePublicStudentId()
            let existingPublicId = await prisma.student.findUnique({
                where: { publicId }
            })

            while (existingPublicId) {
                publicId = generatePublicStudentId()
                existingPublicId = await prisma.student.findUnique({
                    where: { publicId }
                })
            }

            // Creăm studentul
            const { cnp, ...restData } = validation.data

            await prisma.student.create({
                data: {
                    ...restData,
                    cnpEncrypted,
                    publicId,
                    birthDate: new Date(validation.data.birthDate),
                    userId: userIdToUse,
                    createdById: userId,
                    updatedById: userId,
                }
            })

            result.successful++
        } catch (error) {
            console.error(`Eroare la importul rândului ${rowNumber}:`, error)
            result.failed++
            result.errors.push({
                row: rowNumber,
                email: row.email,
                message: error instanceof Error ? error.message : "Eroare necunoscută"
            })
        }
    }

    result.success = result.failed === 0

    return result
}

/**
 * Importă profesori din date CSV/XLSX
 */
export async function importTeachers(
    data: any[],
    userId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 1

        try {
            // Validare cu schema Zod
            const validation = teacherSchema.safeParse(row)

            if (!validation.success) {
                const firstError = validation.error.errors[0]
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: `${firstError.path.join('.')}: ${firstError.message}`,
                    details: validation.error.errors
                })
                continue
            }

            // Verificăm dacă există deja un profesor cu acest email
            const existingTeacher = await prisma.teacher.findFirst({
                where: { email: validation.data.email }
            })

            if (existingTeacher) {
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: "Un profesor cu acest email există deja"
                })
                continue
            }

            // Verificăm dacă există un User cu acest email
            let userRecord = await prisma.user.findUnique({
                where: { email: validation.data.email }
            })

            let userIdToUse: string

            if (userRecord) {
                // Dacă există User, verificăm dacă are rolul corect
                if (userRecord.role !== "PROFESOR") {
                    result.failed++
                    result.errors.push({
                        row: rowNumber,
                        email: row.email,
                        message: `Acest email este deja folosit de un utilizator cu rol ${userRecord.role}`
                    })
                    continue
                }
                userIdToUse = userRecord.id
            } else {
                // Creăm un User nou
                const password = Math.random().toString(36).slice(-8)
                const hashedPassword = await bcrypt.hash(password, 10)

                userRecord = await prisma.user.create({
                    data: {
                        name: `${validation.data.firstname} ${validation.data.lastname}`,
                        email: validation.data.email,
                        role: "PROFESOR",
                        password: hashedPassword,
                        image: validation.data.image || null,
                    }
                })
                userIdToUse = userRecord.id
            }

            // Creăm profesorul
            await prisma.teacher.create({
                data: {
                    ...validation.data,
                    userId: userIdToUse,
                    createdById: userId,
                    updatedById: userId,
                }
            })

            result.successful++
        } catch (error) {
            console.error(`Eroare la importul rândului ${rowNumber}:`, error)
            result.failed++
            result.errors.push({
                row: rowNumber,
                email: row.email,
                message: error instanceof Error ? error.message : "Eroare necunoscută"
            })
        }
    }

    result.success = result.failed === 0

    return result
}

/**
 * Importă secretari din date CSV/XLSX
 */
export async function importSecretaries(
    data: any[],
    userId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 1

        try {
            // Validare cu schema Zod
            const validation = secretarySchema.safeParse(row)

            if (!validation.success) {
                const firstError = validation.error.errors[0]
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: `${firstError.path.join('.')}: ${firstError.message}`,
                    details: validation.error.errors
                })
                continue
            }

            // Verificăm dacă există deja un secretar cu acest email
            const existingSecretary = await prisma.secretary.findUnique({
                where: { email: validation.data.email }
            })

            if (existingSecretary) {
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: "Un secretar cu acest email există deja"
                })
                continue
            }

            // Verificăm dacă există un User cu acest email
            let userRecord = await prisma.user.findUnique({
                where: { email: validation.data.email }
            })

            let userIdToUse: string

            if (userRecord) {
                // Dacă există User, verificăm dacă are rolul corect
                if (userRecord.role !== "SECRETAR") {
                    result.failed++
                    result.errors.push({
                        row: rowNumber,
                        email: row.email,
                        message: `Acest email este deja folosit de un utilizator cu rol ${userRecord.role}`
                    })
                    continue
                }
                userIdToUse = userRecord.id
            } else {
                // Creăm un User nou
                const password = Math.random().toString(36).slice(-8)
                const hashedPassword = await bcrypt.hash(password, 10)

                userRecord = await prisma.user.create({
                    data: {
                        name: `${validation.data.firstname} ${validation.data.lastname}`,
                        email: validation.data.email,
                        role: "SECRETAR",
                        password: hashedPassword,
                        image: validation.data.image || null,
                    }
                })
                userIdToUse = userRecord.id
            }

            // Creăm secretarul
            await prisma.secretary.create({
                data: {
                    ...validation.data,
                    userId: userIdToUse,
                    createdById: userId,
                    updatedById: userId,
                }
            })

            result.successful++
        } catch (error) {
            console.error(`Eroare la importul rândului ${rowNumber}:`, error)
            result.failed++
            result.errors.push({
                row: rowNumber,
                email: row.email,
                message: error instanceof Error ? error.message : "Eroare necunoscută"
            })
        }
    }

    result.success = result.failed === 0

    return result
}

/**
 * Importă administratori din date CSV/XLSX
 */
export async function importAdmins(
    data: any[],
    userId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 1

        try {
            // Convertim accessLevel din string în number
            const processedData = {
                ...row,
                accessLevel: row.accessLevel ? parseInt(row.accessLevel) : 1,
            }

            // Validare cu schema Zod
            const validation = adminSchema.safeParse(processedData)

            if (!validation.success) {
                const firstError = validation.error.errors[0]
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: `${firstError.path.join('.')}: ${firstError.message}`,
                    details: validation.error.errors
                })
                continue
            }

            // Verificăm dacă există deja un administrator cu acest email
            const existingAdmin = await prisma.admin.findUnique({
                where: { email: validation.data.email }
            })

            if (existingAdmin) {
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    message: "Un administrator cu acest email există deja"
                })
                continue
            }

            // Verificăm dacă există un User cu acest email
            let userRecord = await prisma.user.findUnique({
                where: { email: validation.data.email }
            })

            let userIdToUse: string

            if (userRecord) {
                // Dacă există User, verificăm dacă are rolul corect
                if (userRecord.role !== "ADMIN") {
                    result.failed++
                    result.errors.push({
                        row: rowNumber,
                        email: row.email,
                        message: `Acest email este deja folosit de un utilizator cu rol ${userRecord.role}`
                    })
                    continue
                }
                userIdToUse = userRecord.id
            } else {
                // Creăm un User nou
                const password = Math.random().toString(36).slice(-8)
                const hashedPassword = await bcrypt.hash(password, 10)

                userRecord = await prisma.user.create({
                    data: {
                        name: `${validation.data.firstname} ${validation.data.lastname}`,
                        email: validation.data.email,
                        role: "ADMIN",
                        password: hashedPassword,
                        image: validation.data.image || null,
                    }
                })
                userIdToUse = userRecord.id
            }

            // Creăm administratorul
            await prisma.admin.create({
                data: {
                    ...validation.data,
                    userId: userIdToUse,
                    createdById: userId,
                    updatedById: userId,
                }
            })

            result.successful++
        } catch (error) {
            console.error(`Eroare la importul rândului ${rowNumber}:`, error)
            result.failed++
            result.errors.push({
                row: rowNumber,
                email: row.email,
                message: error instanceof Error ? error.message : "Eroare necunoscută"
            })
        }
    }

    result.success = result.failed === 0

    return result
}
