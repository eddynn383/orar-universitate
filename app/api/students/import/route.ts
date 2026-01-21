import { NextRequest, NextResponse } from "next/server"
import { requireAdminOrSecretar } from "@/lib/auth-action"
import prisma from "@/lib/prisma"
import { parse } from "csv-parse/sync"
import bcrypt from "bcrypt"

/**
 * API pentru importul studenților din fișier CSV/Excel
 *
 * Format CSV așteptat:
 * firstname,lastname,email,publicId,sex,cnp,birthDate,birthPlace,groupName
 *
 * Exemplu:
 * Ion,Popescu,ion.popescu@student.ro,STD001,MASCULIN,1234567890123,2000-01-15,București,A1
 */

export async function POST(request: NextRequest) {
    try {
        // Verificăm autorizarea (doar ADMIN și SECRETAR pot importa)
        const authResult = await requireAdminOrSecretar()
        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "Nu a fost furnizat niciun fișier" },
                { status: 400 }
            )
        }

        // Verificăm tipul fișierului
        const fileName = file.name.toLowerCase()
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
            return NextResponse.json(
                { error: "Fișierul trebuie să fie CSV sau Excel (.csv, .xls, .xlsx)" },
                { status: 400 }
            )
        }

        // Citim conținutul fișierului
        const fileContent = await file.text()

        // Parsăm CSV-ul
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        })

        if (records.length === 0) {
            return NextResponse.json(
                { error: "Fișierul nu conține nicio înregistrare validă" },
                { status: 400 }
            )
        }

        // Validăm structura
        const requiredColumns = ['firstname', 'lastname', 'email', 'publicId', 'sex']
        const firstRecord = records[0]
        const missingColumns = requiredColumns.filter(col => !(col in firstRecord))

        if (missingColumns.length > 0) {
            return NextResponse.json(
                {
                    error: `Lipsesc coloanele obligatorii: ${missingColumns.join(', ')}`,
                    hint: 'Format așteptat: firstname,lastname,email,publicId,sex,cnp,birthDate,birthPlace,groupName'
                },
                { status: 400 }
            )
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as any[]
        }

        // Procesăm fiecare student
        for (let i = 0; i < records.length; i++) {
            const record = records[i]
            const rowNumber = i + 2 // +2 pentru header + index 0

            try {
                // Validări
                if (!record.firstname || !record.lastname || !record.email || !record.publicId) {
                    throw new Error('Lipsesc câmpuri obligatorii')
                }

                // Verificăm dacă email-ul există deja
                const existingUser = await prisma.user.findUnique({
                    where: { email: record.email }
                })

                if (existingUser) {
                    throw new Error('Email-ul există deja în sistem')
                }

                // Verificăm dacă publicId există deja
                const existingPublicId = await prisma.user.findUnique({
                    where: { publicId: record.publicId }
                })

                if (existingPublicId) {
                    throw new Error('PublicId există deja în sistem')
                }

                // Găsim sau creăm grupa
                let groupId = null
                if (record.groupName) {
                    const group = await prisma.group.findFirst({
                        where: {
                            name: record.groupName
                        }
                    })

                    if (!group) {
                        throw new Error(`Grupa "${record.groupName}" nu există în sistem`)
                    }

                    groupId = group.id
                }

                // Criptăm CNP-ul dacă există
                let cnpEncrypted = null
                if (record.cnp) {
                    cnpEncrypted = await bcrypt.hash(record.cnp, 10)
                }

                // Parola default
                const defaultPassword = await bcrypt.hash('Student123!', 10)

                // Parsăm data nașterii dacă există
                let birthDate = null
                if (record.birthDate) {
                    birthDate = new Date(record.birthDate)
                    if (isNaN(birthDate.getTime())) {
                        birthDate = null
                    }
                }

                // Creăm utilizatorul
                await prisma.user.create({
                    data: {
                        email: record.email,
                        password: defaultPassword,
                        role: 'STUDENT',
                        firstname: record.firstname,
                        lastname: record.lastname,
                        publicId: record.publicId,
                        sex: record.sex?.toUpperCase() === 'MASCULIN' || record.sex?.toUpperCase() === 'M' ? 'MASCULIN' : 'FEMININ',
                        cnpEncrypted,
                        birthDate,
                        birthPlace: record.birthPlace || null,
                        citizenship: record.citizenship || 'Română',
                        maritalStatus: record.maritalStatus || 'Necăsătorit/ă',
                        groupId,
                        ethnicity: record.ethnicity || null,
                        religion: record.religion || null,
                        socialSituation: record.socialSituation || null,
                        isOrphan: record.isOrphan === 'true' || record.isOrphan === '1',
                        needsSpecialConditions: record.needsSpecialConditions === 'true' || record.needsSpecialConditions === '1',
                        parentsNames: record.parentsNames || null,
                        residentialAddress: record.residentialAddress || null,
                        specialMedicalCondition: record.specialMedicalCondition || null,
                        disability: record.disability?.toUpperCase() || 'NONE'
                    }
                })

                results.success++

            } catch (error: any) {
                results.failed++
                results.errors.push({
                    row: rowNumber,
                    email: record.email,
                    error: error.message
                })
            }
        }

        return NextResponse.json({
            message: `Import complet: ${results.success} studenți importați cu succes, ${results.failed} eșuați`,
            results
        })

    } catch (error: any) {
        console.error('Eroare la importul studenților:', error)
        return NextResponse.json(
            { error: 'Eroare la procesarea fișierului: ' + error.message },
            { status: 500 }
        )
    }
}
