#!/usr/bin/env tsx

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seeding...')

    // 1. Create admin user
    console.log('👤 Creating admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@univ.ro' },
        update: {},
        create: {
            email: 'admin@univ.ro',
            name: 'Administrator',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })
    console.log(`✓ Admin user created: ${admin.email}`)

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

    // 5. Create Teachers
    console.log('👨‍🏫 Creating teachers...')
    const teachers = await Promise.all([
        prisma.teacher.upsert({
            where: { email_phone: { email: 'ion.popescu@univ.ro', phone: '0740123456' } },
            update: {},
            create: {
                firstname: 'Ion',
                lastname: 'Popescu',
                email: 'ion.popescu@univ.ro',
                phone: '0740123456',
                title: 'Prof. Dr.',
                grade: 'Profesor',
                createdById: admin.id
            }
        }),
        prisma.teacher.upsert({
            where: { email_phone: { email: 'maria.ionescu@univ.ro', phone: '0740123457' } },
            update: {},
            create: {
                firstname: 'Maria',
                lastname: 'Ionescu',
                email: 'maria.ionescu@univ.ro',
                phone: '0740123457',
                title: 'Conf. Dr.',
                grade: 'Conferențiar',
                createdById: admin.id
            }
        }),
        prisma.teacher.upsert({
            where: { email_phone: { email: 'andrei.vasilescu@univ.ro', phone: '0740123458' } },
            update: {},
            create: {
                firstname: 'Andrei',
                lastname: 'Vasilescu',
                email: 'andrei.vasilescu@univ.ro',
                phone: '0740123458',
                title: 'Lect. Dr.',
                grade: 'Lector',
                createdById: admin.id
            }
        }),
        prisma.teacher.upsert({
            where: { email_phone: { email: 'elena.georgescu@univ.ro', phone: '0740123459' } },
            update: {},
            create: {
                firstname: 'Elena',
                lastname: 'Georgescu',
                email: 'elena.georgescu@univ.ro',
                phone: '0740123459',
                title: 'Asist. Dr.',
                grade: 'Asistent',
                createdById: admin.id
            }
        }),
        prisma.teacher.upsert({
            where: { email_phone: { email: 'mihai.dumitrescu@univ.ro', phone: '0740123460' } },
            update: {},
            create: {
                firstname: 'Mihai',
                lastname: 'Dumitrescu',
                email: 'mihai.dumitrescu@univ.ro',
                phone: '0740123460',
                title: 'Prof. Dr.',
                grade: 'Profesor',
                createdById: admin.id
            }
        })
    ])
    console.log(`✓ ${teachers.length} teachers created`)

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

    // 9. Create Events with EventGroups
    console.log('📅 Creating events...')
    let eventCount = 0

    // Licenta Year 1 - POO - Semester 1
    const event1 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.licenta.slice(0, 4).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Licenta Year 1 - Algoritmi - Semester 1
    const event2 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.licenta.slice(0, 4).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Licenta Year 1 - POO Lab - Semester 1
    const event3 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: [{ groupId: groups.licenta[0].id }, { groupId: groups.licenta[1].id }]
            }
        }
    })
    eventCount++

    // Licenta Year 1 - Baze de Date - Semester 2
    const event4 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.licenta.slice(0, 4).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Licenta Year 2 - Tehnologii Web - Semester 1
    const event5 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.licenta.slice(4, 7).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Licenta Year 2 - Tehnologii Web Lab - Semester 1
    const event6 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: [{ groupId: groups.licenta[4].id }]
            }
        }
    })
    eventCount++

    // Licenta Year 2 - Sisteme de Operare - Semester 2
    const event7 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.licenta.slice(4, 7).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Licenta Year 3 - Inteligență Artificială - Semester 1
    const event8 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.licenta.slice(7, 9).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Master Year 1 - Arhitecturi Software - Semester 1
    const event9 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.master.slice(0, 2).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Master Year 1 - Machine Learning - Semester 1
    const event10 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.master.slice(0, 2).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Master Year 1 - Cloud Computing - Semester 2
    const event11 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.master.slice(0, 2).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    // Master Year 2 - Securitate - Semester 1
    const event12 = await prisma.event.create({
        data: {
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
            createdById: admin.id,
            groups: {
                create: groups.master.slice(2, 4).map(g => ({ groupId: g.id }))
            }
        }
    })
    eventCount++

    console.log(`✓ ${eventCount} events created`)

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - 1 admin user`)
    console.log(`   - 1 academic year (${academicYear.start}-${academicYear.end})`)
    console.log(`   - 2 learning types (Licenta, Master)`)
    console.log(`   - 5 study years (3 Licenta + 2 Master)`)
    console.log(`   - ${teachers.length} teachers`)
    console.log(`   - ${classrooms.length} classrooms`)
    console.log(`   - ${disciplines.licenta.length + disciplines.master.length} disciplines`)
    console.log(`   - ${groups.licenta.length + groups.master.length} groups`)
    console.log(`   - ${eventCount} events`)
    console.log('\n🔑 Login credentials:')
    console.log(`   Email: admin@univ.ro`)
    console.log(`   Password: admin123`)
}

main().catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
}).finally(async () => {
    await prisma.$disconnect()
})
