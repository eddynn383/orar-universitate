/**
 * @fileoverview Migration script to link existing Users with Teachers and Students
 *
 * This script performs the following operations:
 * 1. Links existing Users with PROFESOR role to Teacher records based on email
 * 2. Links existing Users with STUDENT role to Student records based on email
 * 3. Creates Teacher records for Users with PROFESOR role that don't have a Teacher profile
 * 4. Creates Student records for Users with STUDENT role that don't have a Student profile
 *
 * Usage:
 *   npx ts-node scripts/migrate-user-teacher-student.ts
 *
 * @module scripts/migrate-user-teacher-student
 */

import prisma from "../lib/prisma"

interface MigrationStats {
    linkedTeachers: number
    linkedStudents: number
    createdTeachers: number
    createdStudents: number
    errors: string[]
}

async function migrateUserTeacherStudent() {
    console.log("🚀 Începe migrația User-Teacher-Student...\n")

    const stats: MigrationStats = {
        linkedTeachers: 0,
        linkedStudents: 0,
        createdTeachers: 0,
        createdStudents: 0,
        errors: []
    }

    try {
        // ===== PROFESORI =====
        console.log("📚 Procesare profesori...")

        // Găsește toți utilizatorii cu rol PROFESOR
        const profesorUsers = await prisma.user.findMany({
            where: { role: "PROFESOR" },
            include: {
                teacherProfile: true
            }
        })

        console.log(`   Găsiți ${profesorUsers.length} utilizatori cu rol PROFESOR\n`)

        for (const user of profesorUsers) {
            try {
                // Dacă utilizatorul are deja un profil de profesor, skip
                if (user.teacherProfile) {
                    console.log(`   ✓ ${user.name} (${user.email}) are deja profil de profesor`)
                    continue
                }

                // Caută profesor după email
                const teacher = await prisma.teacher.findFirst({
                    where: {
                        email: user.email!,
                        userId: null // Doar profesori fără user asociat
                    }
                })

                if (teacher) {
                    // Leagă profesorul de user
                    await prisma.teacher.update({
                        where: { id: teacher.id },
                        data: { userId: user.id }
                    })
                    stats.linkedTeachers++
                    console.log(`   ✓ Legat ${user.name} cu profesorul existent`)
                } else {
                    // Creează profil de profesor nou
                    const nameParts = (user.name || "").trim().split(" ")
                    const firstname = nameParts[0] || user.email!.split("@")[0]
                    const lastname = nameParts.slice(1).join(" ") || user.email!.split("@")[0]

                    await prisma.teacher.create({
                        data: {
                            firstname,
                            lastname,
                            email: user.email!,
                            phone: user.phone,
                            image: user.image,
                            userId: user.id,
                            createdById: user.id,
                            updatedById: user.id,
                        }
                    })
                    stats.createdTeachers++
                    console.log(`   ✓ Creat profil nou de profesor pentru ${user.name}`)
                }
            } catch (error: any) {
                const errorMsg = `Eroare la procesarea ${user.name}: ${error.message}`
                stats.errors.push(errorMsg)
                console.error(`   ✗ ${errorMsg}`)
            }
        }

        console.log("\n")

        // ===== STUDENȚI =====
        console.log("🎓 Procesare studenți...")

        // Găsește toți utilizatorii cu rol STUDENT
        const studentUsers = await prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                studentProfile: true
            }
        })

        console.log(`   Găsiți ${studentUsers.length} utilizatori cu rol STUDENT\n`)

        for (const user of studentUsers) {
            try {
                // Dacă utilizatorul are deja un profil de student, skip
                if (user.studentProfile) {
                    console.log(`   ✓ ${user.name} (${user.email}) are deja profil de student`)
                    continue
                }

                // Caută student după email
                const student = await prisma.student.findFirst({
                    where: {
                        email: user.email!,
                        userId: null // Doar studenți fără user asociat
                    }
                })

                if (student) {
                    // Leagă studentul de user
                    await prisma.student.update({
                        where: { id: student.id },
                        data: { userId: user.id }
                    })
                    stats.linkedStudents++
                    console.log(`   ✓ Legat ${user.name} cu studentul existent`)
                } else {
                    // Creează profil de student nou
                    const nameParts = (user.name || "").trim().split(" ")
                    const firstname = nameParts[0] || user.email!.split("@")[0]
                    const lastname = nameParts.slice(1).join(" ") || user.email!.split("@")[0]

                    // Generează publicId unic
                    const publicId = `STD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

                    await prisma.student.create({
                        data: {
                            firstname,
                            lastname,
                            email: user.email!,
                            publicId,
                            sex: "MASCULIN", // Default
                            cnpEncrypted: "0000000000000", // Temporar
                            birthDate: new Date("2000-01-01"), // Default
                            birthPlace: "Necompletat",
                            citizenship: "Română",
                            maritalStatus: "Necăsătorit/ă",
                            image: user.image,
                            userId: user.id,
                            createdById: user.id,
                            updatedById: user.id,
                        }
                    })
                    stats.createdStudents++
                    console.log(`   ✓ Creat profil nou de student pentru ${user.name}`)
                }
            } catch (error: any) {
                const errorMsg = `Eroare la procesarea ${user.name}: ${error.message}`
                stats.errors.push(errorMsg)
                console.error(`   ✗ ${errorMsg}`)
            }
        }

        console.log("\n")
        console.log("=" .repeat(60))
        console.log("📊 REZULTATE MIGRAȚIE")
        console.log("=" .repeat(60))
        console.log(`✓ Profesori legați:  ${stats.linkedTeachers}`)
        console.log(`✓ Profesori creați:  ${stats.createdTeachers}`)
        console.log(`✓ Studenți legați:   ${stats.linkedStudents}`)
        console.log(`✓ Studenți creați:   ${stats.createdStudents}`)
        console.log(`✗ Erori:            ${stats.errors.length}`)
        console.log("=" .repeat(60))

        if (stats.errors.length > 0) {
            console.log("\n⚠️  Erori întâlnite:")
            stats.errors.forEach(error => console.log(`   - ${error}`))
        }

        console.log("\n✅ Migrație finalizată cu succes!")

    } catch (error: any) {
        console.error("\n❌ Eroare critică în timpul migrației:", error.message)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Rulează migrația
migrateUserTeacherStudent()
    .catch((error) => {
        console.error("Migrația a eșuat:", error)
        process.exit(1)
    })
