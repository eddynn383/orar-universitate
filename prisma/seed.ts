#!/usr/bin/env tsx

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, Sex } from "@/app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { encryptCNP } from '@/lib/encryption';

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seeding...')

    // 1. Create users
    console.log('👤 Creating users...')

    // Admin - Boboc Eduard
    const adminPassword = await bcrypt.hash('eduardAdmin', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'eduard.boboc@admin.com' },
        update: {},
        create: {
            email: 'eduard.boboc@admin.com',
            firstname: 'Eduard',
            lastname: 'Boboc',
            password: adminPassword,
            role: 'ADMIN',
            sex: 'MASCULIN',
            phone: '0740100001',
        }
    })
    console.log(`✓ Admin user created: ${admin.email}`)

    // Creăm profilul de Admin
    await prisma.admin.upsert({
        where: { email: 'eduard.boboc@admin.com' },
        update: {},
        create: {
            email: 'eduard.boboc@admin.com',
            department: 'IT',
            adminRole: 'Administrator Sistem',
            officePhone: '0212100001',
            responsibilities: 'Administrare platformă, Gestionare utilizatori, Backup baze de date',
            accessLevel: 5,
            userId: admin.id
        }
    })
    console.log(`✓ Admin profile created`)

    // Secretar - Butoi Maria
    const secretarPassword = await bcrypt.hash('mariaSecretar', 10)
    const secretar = await prisma.user.upsert({
        where: { email: 'maria.butoi@secretar.com' },
        update: {},
        create: {
            email: 'maria.butoi@secretar.com',
            firstname: 'Maria',
            lastname: 'Butoi',
            password: secretarPassword,
            role: 'SECRETAR',
            phone: '0740100002',
            sex: 'FEMININ',
        }
    })
    console.log(`✓ Secretar user created: ${secretar.email}`)

    // Creăm profilul de Secretar
    await prisma.secretary.upsert({
        where: { email: 'maria.butoi@secretar.com' },
        update: {},
        create: {
            email: 'maria.butoi@secretar.com',
            department: 'Secretariat Studenți',
            office: 'A101',
            officePhone: '0212100002',
            workSchedule: 'Luni-Vineri: 08:00-16:00',
            responsibilities: 'Gestionare documente studenți, Eliberare adeverințe, Programare examene',
            userId: secretar.id
        }
    })
    console.log(`✓ Secretary profile created`)

    // Profesor - Mircea Eliade
    const profesorPassword = await bcrypt.hash('mirceaProfesor', 10)
    const profesor = await prisma.user.upsert({
        where: { email: 'mircea.eliade@profesor.com' },
        update: {},
        create: {
            email: 'mircea.eliade@profesor.com',
            firstname: 'Mircea',
            lastname: 'Eliade',
            phone: '0740100003',
            password: profesorPassword,
            role: 'PROFESOR',
            sex: 'MASCULIN'
        }
    })
    console.log(`✓ Profesor user created: ${profesor.email}`)

    // Creăm profilul de Teacher
    await prisma.teacher.upsert({
        where: { email: 'mircea.eliade@profesor.com' },
        update: {},
        create: {
            email: 'mircea.eliade@profesor.com',
            title: 'Prof. Dr.',
            grade: 'Profesor Universitar',
            education: 'Doctorat în Filosofie - Universitatea București, 2005\nMaster în Literatură Comparată - Sorbona, 2000',
            userId: profesor.id,
            createdById: admin.id
        }
    })
    console.log(`✓ Teacher profile created`)

    // Student - Andrei Popescu
    const studentPassword = await bcrypt.hash('andreiStudent', 10)
    const student = await prisma.user.upsert({
        where: { email: 'andrei.popescu@student.com' },
        update: {},
        create: {
            email: 'andrei.popescu@student.com',
            firstname: 'Andrei',
            lastname: 'Popescu',
            password: studentPassword,
            role: 'STUDENT',
            sex: 'MASCULIN',
        }
    })
    console.log(`✓ Student user created: ${student.email}`)

    // Creăm profilul de Student (îl vom asocia cu o grupă mai târziu)
    // const cnpEncrypted = await bcrypt.hash('1234567890123', 10)
    const cnpEncrypted = encryptCNP("1940515123456") // CNP fictiv pentru Andrei Popescu
    await prisma.student.upsert({
        where: { email: 'andrei.popescu@student.com' },
        update: {},
        create: {
            email: 'andrei.popescu@student.com',
            publicId: 'STD2025001',
            cnpEncrypted,
            birthDate: new Date('2003-05-15'),
            birthCity: 'București',
            birthCountry: 'România',
            citizenship: 'Română',
            maritalStatus: 'NECASATORIT',
            userId: student.id,
            createdById: admin.id
        }
    })
    console.log(`✓ Student profile created`)

    // 2. Create Academic Year
    console.log('📅 Creating academic year...')
    const academicYear = await prisma.academicYear.upsert({
        where: {
            start_end: {
                start: 2025,
                end: 2026
            }
        },
        update: {},
        create: {
            start: 2025,
            end: 2026,
            published: true
        }
    })
    console.log(`✓ Academic year created: ${academicYear.start}-${academicYear.end}`)

    // 3. Create Learning Types
    console.log('🎓 Creating learning types...')
    const licenta = await prisma.learningType.upsert({
        where: { learningCycle: 'Licenta' },
        update: {},
        create: { learningCycle: 'Licenta' }
    })

    const master = await prisma.learningType.upsert({
        where: { learningCycle: 'Master' },
        update: {},
        create: { learningCycle: 'Master' }
    })
    console.log(`✓ Learning types created: Licenta, Master`)

    // 4. Create Study Years
    console.log('📚 Creating study years...')
    const studyYears = {
        licenta: [] as any[],
        master: [] as any[]
    }

    // Licenta: years 1, 2, 3
    for (let year = 1; year <= 3; year++) {
        const studyYear = await prisma.studyYear.upsert({
            where: {
                learningTypeId_year: {
                    learningTypeId: licenta.id,
                    year: year
                }
            },
            update: {},
            create: {
                year: year,
                learningTypeId: licenta.id
            }
        })
        studyYears.licenta.push(studyYear)
    }

    // Master: years 1, 2
    for (let year = 1; year <= 2; year++) {
        const studyYear = await prisma.studyYear.upsert({
            where: {
                learningTypeId_year: {
                    learningTypeId: master.id,
                    year: year
                }
            },
            update: {},
            create: {
                year: year,
                learningTypeId: master.id
            }
        })
        studyYears.master.push(studyYear)
    }
    console.log(`✓ Study years created: 3 for Licenta, 2 for Master`)

    // 5. Create Teachers with Users
    console.log('👨‍🏫 Creating teachers and their user accounts...')

    const teachersData = [
        { firstname: 'Ion', lastname: 'Popescu', email: 'ion.popescu@univ.ro', phone: '0740123456', title: 'Prof. Dr.', grade: 'Profesor', sex: 'MASCULIN' },
        { firstname: 'Maria', lastname: 'Ionescu', email: 'maria.ionescu@univ.ro', phone: '0740123457', title: 'Conf. Dr.', grade: 'Conferențiar', sex: 'FEMININ' },
        { firstname: 'Andrei', lastname: 'Vasilescu', email: 'andrei.vasilescu@univ.ro', phone: '0740123458', title: 'Lect. Dr.', grade: 'Lector', sex: 'MASCULIN' },
        { firstname: 'Elena', lastname: 'Georgescu', email: 'elena.georgescu@univ.ro', phone: '0740123459', title: 'Asist. Dr.', grade: 'Asistent', sex: 'FEMININ' },
        { firstname: 'Mihai', lastname: 'Dumitrescu', email: 'mihai.dumitrescu@univ.ro', phone: '0740123460', title: 'Prof. Dr.', grade: 'Profesor', sex: 'MASCULIN' }
    ]

    const teachers = []
    for (const teacherData of teachersData) {
        // Creăm user pentru profesor
        const teacherPassword = await bcrypt.hash(`${teacherData.firstname.toLowerCase()}Profesor`, 10)
        const teacherUser = await prisma.user.upsert({
            where: { email: teacherData.email },
            update: {},
            create: {
                email: teacherData.email,
                firstname: teacherData.firstname,
                lastname: teacherData.lastname,
                password: teacherPassword,
                role: 'PROFESOR',
                phone: teacherData.phone,
                sex: teacherData.sex as Sex
            }
        })

        // Creăm profilul de Teacher
        const teacher = await prisma.teacher.upsert({
            where: {
                email: teacherData.email
            },
            update: {},
            create: {
                email: teacherData.email,
                title: teacherData.title,
                grade: teacherData.grade,
                userId: teacherUser.id,
                createdById: admin.id
            }
        })

        teachers.push(teacher)
        console.log(`   ✓ Created teacher: ${teacherData.firstname} ${teacherData.lastname} with user account`)
    }

    console.log(`✓ ${teachers.length} teachers created with user accounts`)

    // 6. Create Classrooms
    console.log('🏫 Creating classrooms...')
    const classrooms = await Promise.all([
        prisma.classroom.upsert({
            where: { name: 'A101' },
            update: {},
            create: {
                name: 'A101',
                capacity: 100,
                building: 'Corp A',
                createdById: admin.id
            }
        }),
        prisma.classroom.upsert({
            where: { name: 'A102' },
            update: {},
            create: {
                name: 'A102',
                capacity: 80,
                building: 'Corp A',
                createdById: admin.id
            }
        }),
        prisma.classroom.upsert({
            where: { name: 'Lab 304' },
            update: {},
            create: {
                name: 'Lab 304',
                capacity: 30,
                building: 'Corp B',
                createdById: admin.id
            }
        }),
        prisma.classroom.upsert({
            where: { name: 'Lab 305' },
            update: {},
            create: {
                name: 'Lab 305',
                capacity: 30,
                building: 'Corp B',
                createdById: admin.id
            }
        }),
        prisma.classroom.upsert({
            where: { name: 'C201' },
            update: {},
            create: {
                name: 'C201',
                capacity: 50,
                building: 'Corp C',
                createdById: admin.id
            }
        }),
        prisma.classroom.upsert({
            where: { name: 'C202' },
            update: {},
            create: {
                name: 'C202',
                capacity: 40,
                building: 'Corp C',
                createdById: admin.id
            }
        })
    ])
    console.log(`✓ ${classrooms.length} classrooms created`)

    // 7. Create Disciplines
    console.log('📖 Creating disciplines...')
    const disciplines = {
        licenta: [] as any[],
        master: [] as any[]
    }

    // Licenta Year 1 - Semester 1
    disciplines.licenta.push(
        await prisma.discipline.create({
            data: {
                name: 'Programare Orientată pe Obiecte',
                teacherId: teachers[0].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[0].id,
                semester: 1,
                createdById: admin.id
            }
        }),
        await prisma.discipline.create({
            data: {
                name: 'Algoritmi și Structuri de Date',
                teacherId: teachers[1].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[0].id,
                semester: 1,
                createdById: admin.id
            }
        })
    )

    // Licenta Year 1 - Semester 2
    disciplines.licenta.push(
        await prisma.discipline.create({
            data: {
                name: 'Baze de Date',
                teacherId: teachers[2].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[0].id,
                semester: 2,
                createdById: admin.id
            }
        })
    )

    // Licenta Year 2 - Semester 1
    disciplines.licenta.push(
        await prisma.discipline.create({
            data: {
                name: 'Tehnologii Web',
                teacherId: teachers[0].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[1].id,
                semester: 1,
                createdById: admin.id
            }
        }),
        await prisma.discipline.create({
            data: {
                name: 'Ingineria Programării',
                teacherId: teachers[3].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[1].id,
                semester: 1,
                createdById: admin.id
            }
        })
    )

    // Licenta Year 2 - Semester 2
    disciplines.licenta.push(
        await prisma.discipline.create({
            data: {
                name: 'Sisteme de Operare',
                teacherId: teachers[1].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[1].id,
                semester: 2,
                createdById: admin.id
            }
        })
    )

    // Licenta Year 3 - Semester 1
    disciplines.licenta.push(
        await prisma.discipline.create({
            data: {
                name: 'Inteligență Artificială',
                teacherId: teachers[4].id,
                learningTypeId: licenta.id,
                studyYearId: studyYears.licenta[2].id,
                semester: 1,
                createdById: admin.id
            }
        })
    )

    // Master Year 1 - Semester 1
    disciplines.master.push(
        await prisma.discipline.create({
            data: {
                name: 'Arhitecturi Software Avansate',
                teacherId: teachers[0].id,
                learningTypeId: master.id,
                studyYearId: studyYears.master[0].id,
                semester: 1,
                createdById: admin.id
            }
        }),
        await prisma.discipline.create({
            data: {
                name: 'Machine Learning',
                teacherId: teachers[4].id,
                learningTypeId: master.id,
                studyYearId: studyYears.master[0].id,
                semester: 1,
                createdById: admin.id
            }
        })
    )

    // Master Year 1 - Semester 2
    disciplines.master.push(
        await prisma.discipline.create({
            data: {
                name: 'Cloud Computing',
                teacherId: teachers[2].id,
                learningTypeId: master.id,
                studyYearId: studyYears.master[0].id,
                semester: 2,
                createdById: admin.id
            }
        })
    )

    // Master Year 2 - Semester 1
    disciplines.master.push(
        await prisma.discipline.create({
            data: {
                name: 'Securitate și Criptografie',
                teacherId: teachers[1].id,
                learningTypeId: master.id,
                studyYearId: studyYears.master[1].id,
                semester: 1,
                createdById: admin.id
            }
        })
    )

    console.log(`✓ ${disciplines.licenta.length} Licenta disciplines created`)
    console.log(`✓ ${disciplines.master.length} Master disciplines created`)

    // 8. Create Groups
    console.log('👥 Creating groups...')
    const groups = {
        licenta: [] as any[],
        master: [] as any[]
    }

    // Licenta groups - Year 1
    for (let i = 1; i <= 4; i++) {
        groups.licenta.push(
            await prisma.group.create({
                data: {
                    name: `1${String.fromCharCode(64 + i)}`,
                    group: i,
                    learningTypeId: licenta.id,
                    studyYearId: studyYears.licenta[0].id,
                    semester: 1,
                    createdById: admin.id
                }
            })
        )
    }

    // Licenta groups - Year 2
    for (let i = 1; i <= 3; i++) {
        groups.licenta.push(
            await prisma.group.create({
                data: {
                    name: `2${String.fromCharCode(64 + i)}`,
                    group: i,
                    learningTypeId: licenta.id,
                    studyYearId: studyYears.licenta[1].id,
                    semester: 1,
                    createdById: admin.id
                }
            })
        )
    }

    // Licenta groups - Year 3
    for (let i = 1; i <= 2; i++) {
        groups.licenta.push(
            await prisma.group.create({
                data: {
                    name: `3${String.fromCharCode(64 + i)}`,
                    group: i,
                    learningTypeId: licenta.id,
                    studyYearId: studyYears.licenta[2].id,
                    semester: 1,
                    createdById: admin.id
                }
            })
        )
    }

    // Master groups - Year 1
    for (let i = 1; i <= 2; i++) {
        groups.master.push(
            await prisma.group.create({
                data: {
                    name: `M1${String.fromCharCode(64 + i)}`,
                    group: i,
                    learningTypeId: master.id,
                    studyYearId: studyYears.master[0].id,
                    semester: 1,
                    createdById: admin.id
                }
            })
        )
    }

    // Master groups - Year 2
    for (let i = 1; i <= 2; i++) {
        groups.master.push(
            await prisma.group.create({
                data: {
                    name: `M2${String.fromCharCode(64 + i)}`,
                    group: i,
                    learningTypeId: master.id,
                    studyYearId: studyYears.master[1].id,
                    semester: 1,
                    createdById: admin.id
                }
            })
        )
    }

    console.log(`✓ ${groups.licenta.length} Licenta groups created`)
    console.log(`✓ ${groups.master.length} Master groups created`)

    // Asociem studentul cu prima grupă (1A)
    await prisma.student.update({
        where: { email: 'andrei.popescu@student.com' },
        data: {
            groupId: groups.licenta[0].id
        }
    })
    console.log(`✓ Student associated with group ${groups.licenta[0].name}`)

    // 9. Create Events with EventGroups
    console.log('📅 Creating events...')
    let eventCount = 0

    // Helper function pentru crearea evenimentelor publicate
    const createPublishedEvent = async (eventData: any) => {
        return prisma.event.create({
            data: {
                ...eventData,
                status: 'PUBLISHED',
                approvedById: admin.id,
                approvedAt: new Date(),
                publishedById: admin.id,
                publishedAt: new Date(),
                createdById: admin.id
            }
        })
    }

    // Licenta Year 1 - POO - Semester 1
    await createPublishedEvent({
        day: 'LUNI',
        startHour: '08:00',
        endHour: '10:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: licenta.id,
        teacherId: teachers[0].id,
        disciplineId: disciplines.licenta[0].id,
        classroomId: classrooms[0].id,
        groups: {
            create: groups.licenta.slice(0, 4).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Licenta Year 1 - Algoritmi - Semester 1
    await createPublishedEvent({
        day: 'MARTI',
        startHour: '10:00',
        endHour: '12:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: licenta.id,
        teacherId: teachers[1].id,
        disciplineId: disciplines.licenta[1].id,
        classroomId: classrooms[1].id,
        groups: {
            create: groups.licenta.slice(0, 4).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Licenta Year 1 - POO Lab - Semester 1
    await createPublishedEvent({
        day: 'MIERCURI',
        startHour: '12:00',
        endHour: '14:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Laborator',
        eventRecurrence: 'Saptamani pare',
        learningId: licenta.id,
        teacherId: teachers[0].id,
        disciplineId: disciplines.licenta[0].id,
        classroomId: classrooms[2].id,
        groups: {
            create: [{ groupId: groups.licenta[0].id }, { groupId: groups.licenta[1].id }]
        }
    })
    eventCount++

    // Licenta Year 1 - Baze de Date - Semester 2
    await createPublishedEvent({
        day: 'LUNI',
        startHour: '14:00',
        endHour: '16:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 2,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: licenta.id,
        teacherId: teachers[2].id,
        disciplineId: disciplines.licenta[2].id,
        classroomId: classrooms[0].id,
        groups: {
            create: groups.licenta.slice(0, 4).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Licenta Year 2 - Tehnologii Web - Semester 1
    await createPublishedEvent({
        day: 'MARTI',
        startHour: '08:00',
        endHour: '10:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: licenta.id,
        teacherId: teachers[0].id,
        disciplineId: disciplines.licenta[3].id,
        classroomId: classrooms[4].id,
        groups: {
            create: groups.licenta.slice(4, 7).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Licenta Year 2 - Tehnologii Web Lab - Semester 1
    await createPublishedEvent({
        day: 'JOI',
        startHour: '10:00',
        endHour: '12:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Laborator',
        eventRecurrence: 'Saptamani impare',
        learningId: licenta.id,
        teacherId: teachers[0].id,
        disciplineId: disciplines.licenta[3].id,
        classroomId: classrooms[3].id,
        groups: {
            create: [{ groupId: groups.licenta[4].id }]
        }
    })
    eventCount++

    // Licenta Year 2 - Sisteme de Operare - Semester 2
    await createPublishedEvent({
        day: 'VINERI',
        startHour: '12:00',
        endHour: '14:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 2,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: licenta.id,
        teacherId: teachers[1].id,
        disciplineId: disciplines.licenta[5].id,
        classroomId: classrooms[1].id,
        groups: {
            create: groups.licenta.slice(4, 7).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Licenta Year 3 - Inteligență Artificială - Semester 1
    await createPublishedEvent({
        day: 'MIERCURI',
        startHour: '08:00',
        endHour: '10:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: licenta.id,
        teacherId: teachers[4].id,
        disciplineId: disciplines.licenta[6].id,
        classroomId: classrooms[5].id,
        groups: {
            create: groups.licenta.slice(7, 9).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Master Year 1 - Arhitecturi Software - Semester 1
    await createPublishedEvent({
        day: 'LUNI',
        startHour: '16:00',
        endHour: '18:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: master.id,
        teacherId: teachers[0].id,
        disciplineId: disciplines.master[0].id,
        classroomId: classrooms[4].id,
        groups: {
            create: groups.master.slice(0, 2).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Master Year 1 - Machine Learning - Semester 1
    await createPublishedEvent({
        day: 'MARTI',
        startHour: '14:00',
        endHour: '16:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: master.id,
        teacherId: teachers[4].id,
        disciplineId: disciplines.master[1].id,
        classroomId: classrooms[5].id,
        groups: {
            create: groups.master.slice(0, 2).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Master Year 1 - Cloud Computing - Semester 2
    await createPublishedEvent({
        day: 'MIERCURI',
        startHour: '16:00',
        endHour: '18:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 2,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: master.id,
        teacherId: teachers[2].id,
        disciplineId: disciplines.master[2].id,
        classroomId: classrooms[4].id,
        groups: {
            create: groups.master.slice(0, 2).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    // Master Year 2 - Securitate - Semester 1
    await createPublishedEvent({
        day: 'JOI',
        startHour: '16:00',
        endHour: '18:00',
        duration: 2,
        academicYearId: academicYear.id,
        semester: 1,
        eventType: 'Curs',
        eventRecurrence: 'Toate saptamanile',
        learningId: master.id,
        teacherId: teachers[1].id,
        disciplineId: disciplines.master[3].id,
        classroomId: classrooms[5].id,
        groups: {
            create: groups.master.slice(2, 4).map(g => ({ groupId: g.id }))
        }
    })
    eventCount++

    console.log(`✓ ${eventCount} events created`)

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - 4 users (1 admin, 1 secretar, 1 profesor, 1 student)`)
    console.log(`   - 1 academic year (${academicYear.start}-${academicYear.end})`)
    console.log(`   - 2 learning types (Licenta, Master)`)
    console.log(`   - 5 study years (3 Licenta + 2 Master)`)
    console.log(`   - ${teachers.length} teachers`)
    console.log(`   - ${classrooms.length} classrooms`)
    console.log(`   - ${disciplines.licenta.length + disciplines.master.length} disciplines`)
    console.log(`   - ${groups.licenta.length + groups.master.length} groups`)
    console.log(`   - ${eventCount} events`)
    console.log('\n🔑 Login credentials:')
    console.log(`   Admin:    eduard.boboc@admin.com / eduardAdmin`)
    console.log(`   Secretar: maria.butoi@secretar.com / mariaSecretar`)
    console.log(`   Profesor: mircea.eliade@profesor.com / mirceaProfesor`)
    console.log(`   Student:  andrei.popescu@student.com / andreiStudent`)
}

main().catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
}).finally(async () => {
    await prisma.$disconnect()
})
