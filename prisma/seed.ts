#!/usr/bin/env tsx

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'


const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

console.log("test outer")

async function main() {
    console.log("test inner")
    // Create admin user
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

    // Create sample data
    const disciplina = await prisma.disciplina.create({
        data: {
            nume: 'Programare Web',
            tip: 'LABORATOR',
            departament: 'Informatică',
            cicluStudii: 'LICENTA'
        }
    })

    const cadru = await prisma.cadruDidactic.create({
        data: {
            nume: 'Dr. Popescu Ion',
            email: 'popescu@univ.ro',
            functie: 'Conferențiar',
            departament: 'Informatică'
        }
    })

    const grupa = await prisma.grupa.create({
        data: {
            codGrupa: '2B',
            anStudiu: 2,
            cicluStudii: 'LICENTA'
        }
    })

    const sala = await prisma.sala.create({
        data: {
            numeSala: 'Lab 304',
            capacitate: 30,
            cladire: 'Corp A'
        }
    })

    await prisma.orar.create({
        data: {
            disciplinaId: disciplina.id,
            grupaId: grupa.id,
            salaId: sala.id,
            cadruDidacticId: cadru.id,
            zi: 'MARTI',
            interval: '10:00 - 12:00',
            anUniversitar: '2025-2026'
        }
    })

    console.log('Database seeded successfully!')
}

main().catch(async (e) => {
    console.error(e)
    process.exit(1)
}).finally(async () => {
    console.log("done")
    await prisma.$disconnect()
})