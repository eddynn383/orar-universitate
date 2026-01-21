/**
 * Script de migrare pentru unificarea Teacher și Student în User
 *
 * Acest script:
 * 1. Migrează profesorii din Teacher în User cu role='PROFESOR'
 * 2. Migrează studenții din Student în User cu role='STUDENT'
 * 3. Actualizează relațiile în Discipline, StudentDiscipline, Grade
 * 4. Păstrează modelele vechi pentru rollback (se vor șterge manual după verificare)
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nu este definit în fișierul .env')
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function migrateTeachers() {
    console.log('🔄 Migrare profesori...')

    const teachers = await prisma.teacher.findMany({
        include: {
            user: true
        }
    })

    console.log(`   Găsiți ${teachers.length} profesori`)

    for (const teacher of teachers) {
        try {
            let userId = teacher.userId

            // Dacă profesorul are deja un User asociat, actualizăm User-ul
            if (teacher.userId && teacher.user) {
                await prisma.user.update({
                    where: { id: teacher.userId },
                    data: {
                        role: 'PROFESOR',
                        firstname: teacher.firstname,
                        lastname: teacher.lastname,
                        title: teacher.title,
                        grade: teacher.grade,
                        phone: teacher.phone,
                        email: teacher.email,
                        image: teacher.image
                    }
                })
                console.log(`   ✓ Actualizat profesor: ${teacher.firstname} ${teacher.lastname}`)
            } else {
                // Altfel, creăm un User nou
                const defaultPassword = await bcrypt.hash('Profesor123!', 10)

                const newUser = await prisma.user.create({
                    data: {
                        email: teacher.email,
                        password: defaultPassword,
                        role: 'PROFESOR',
                        firstname: teacher.firstname,
                        lastname: teacher.lastname,
                        title: teacher.title,
                        grade: teacher.grade,
                        phone: teacher.phone,
                        image: teacher.image
                    }
                })

                userId = newUser.id

                // Actualizăm Teacher cu legătura la User
                await prisma.teacher.update({
                    where: { id: teacher.id },
                    data: { userId: newUser.id }
                })

                console.log(`   ✓ Creat nou user pentru profesor: ${teacher.firstname} ${teacher.lastname}`)
            }

            // Actualizăm disciplinele profesorului
            await prisma.discipline.updateMany({
                where: { teacherId: teacher.id },
                data: { professorId: userId }
            })

            // Actualizăm eventurile profesorului
            await prisma.event.updateMany({
                where: { teacherId: teacher.id },
                data: { teacherId: teacher.id } // Păstrăm pentru compatibilitate
            })

        } catch (error) {
            console.error(`   ✗ Eroare la migrarea profesorului ${teacher.firstname} ${teacher.lastname}:`, error)
        }
    }

    console.log('✓ Migrare profesori completată\n')
}

async function migrateStudents() {
    console.log('🔄 Migrare studenți...')

    const students = await prisma.student.findMany({
        include: {
            user: true
        }
    })

    console.log(`   Găsiți ${students.length} studenți`)

    for (const student of students) {
        try {
            let userId = student.userId

            // Dacă studentul are deja un User asociat, actualizăm User-ul
            if (student.userId && student.user) {
                await prisma.user.update({
                    where: { id: student.userId },
                    data: {
                        role: 'STUDENT',
                        firstname: student.firstname,
                        lastname: student.lastname,
                        email: student.email,
                        image: student.image,
                        publicId: student.publicId,
                        sex: student.sex,
                        cnpEncrypted: student.cnpEncrypted,
                        birthDate: student.birthDate,
                        birthPlace: student.birthPlace,
                        ethnicity: student.ethnicity,
                        religion: student.religion,
                        citizenship: student.citizenship,
                        maritalStatus: student.maritalStatus,
                        socialSituation: student.socialSituation,
                        isOrphan: student.isOrphan,
                        needsSpecialConditions: student.needsSpecialConditions,
                        parentsNames: student.parentsNames,
                        residentialAddress: student.residentialAddress,
                        specialMedicalCondition: student.specialMedicalCondition,
                        disability: student.disability,
                        groupId: student.groupId
                    }
                })
                console.log(`   ✓ Actualizat student: ${student.firstname} ${student.lastname}`)
            } else {
                // Altfel, creăm un User nou
                const defaultPassword = await bcrypt.hash('Student123!', 10)

                const newUser = await prisma.user.create({
                    data: {
                        email: student.email,
                        password: defaultPassword,
                        role: 'STUDENT',
                        firstname: student.firstname,
                        lastname: student.lastname,
                        image: student.image,
                        publicId: student.publicId,
                        sex: student.sex,
                        cnpEncrypted: student.cnpEncrypted,
                        birthDate: student.birthDate,
                        birthPlace: student.birthPlace,
                        ethnicity: student.ethnicity,
                        religion: student.religion,
                        citizenship: student.citizenship,
                        maritalStatus: student.maritalStatus,
                        socialSituation: student.socialSituation,
                        isOrphan: student.isOrphan,
                        needsSpecialConditions: student.needsSpecialConditions,
                        parentsNames: student.parentsNames,
                        residentialAddress: student.residentialAddress,
                        specialMedicalCondition: student.specialMedicalCondition,
                        disability: student.disability,
                        groupId: student.groupId
                    }
                })

                userId = newUser.id

                // Actualizăm Student cu legătura la User
                await prisma.student.update({
                    where: { id: student.id },
                    data: { userId: newUser.id }
                })

                console.log(`   ✓ Creat nou user pentru student: ${student.firstname} ${student.lastname}`)
            }

            // Actualizăm StudentDiscipline
            await prisma.studentDiscipline.updateMany({
                where: { studentId: student.id },
                data: { userId }
            })

            // Actualizăm Grade
            await prisma.grade.updateMany({
                where: { studentId: student.id },
                data: { userId }
            })

        } catch (error) {
            console.error(`   ✗ Eroare la migrarea studentului ${student.firstname} ${student.lastname}:`, error)
        }
    }

    console.log('✓ Migrare studenți completată\n')
}

async function verifyMigration() {
    console.log('🔍 Verificare migrare...')

    const professorCount = await prisma.user.count({ where: { role: 'PROFESOR' } })
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } })

    const disciplinesWithProfessor = await prisma.discipline.count({
        where: { professorId: { not: null } }
    })

    const studentDisciplinesWithUser = await prisma.studentDiscipline.count({
        where: { userId: { not: null } }
    })

    const gradesWithUser = await prisma.grade.count({
        where: { userId: { not: null } }
    })

    console.log(`   ✓ Profesori migrați: ${professorCount}`)
    console.log(`   ✓ Studenți migrați: ${studentCount}`)
    console.log(`   ✓ Discipline cu profesor asignat: ${disciplinesWithProfessor}`)
    console.log(`   ✓ StudentDiscipline cu userId: ${studentDisciplinesWithUser}`)
    console.log(`   ✓ Grade cu userId: ${gradesWithUser}`)
    console.log('')
}

async function main() {
    console.log('🚀 Începere migrare la modelul unificat User\n')

    try {
        await migrateTeachers()
        await migrateStudents()
        await verifyMigration()

        console.log('✅ Migrare completată cu succes!')
        console.log('\n📝 Note importante:')
        console.log('   • Parole default profesori: Profesor123!')
        console.log('   • Parole default studenți: Student123!')
        console.log('   • Modelele Teacher și Student sunt păstrate pentru rollback')
        console.log('   • După verificare, poți șterge modelele Teacher și Student din schema')
        console.log('   • Rulează "npx prisma generate" pentru a actualiza clientul Prisma\n')

    } catch (error) {
        console.error('❌ Eroare la migrare:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
