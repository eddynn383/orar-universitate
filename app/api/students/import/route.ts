import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { parseFile, cleanImportData, parseBooleanFields, mapHeadersToKeys } from "@/lib/import"
import { importStudents } from "@/actions/import"

// Maparea coloanelor pentru import studenți
const STUDENT_COLUMNS = [
    { key: "firstname", label: "Prenume" },
    { key: "lastname", label: "Nume" },
    { key: "email", label: "Email" },
    { key: "sex", label: "Sex" },
    { key: "cnp", label: "CNP" },
    { key: "birthDate", label: "Data Nașterii" },
    { key: "birthPlace", label: "Locul Nașterii" },
    { key: "citizenship", label: "Cetățenie" },
    { key: "maritalStatus", label: "Stare Civilă" },
    { key: "motherFirstname", label: "Prenume Mamă" },
    { key: "motherLastname", label: "Nume Mamă" },
    { key: "fatherFirstname", label: "Prenume Tată" },
    { key: "fatherLastname", label: "Nume Tată" },
    { key: "isOrphan", label: "Orfan?" },
    { key: "needsSpecialConditions", label: "Nevoi Speciale?" },
    { key: "disability", label: "Dizabilitate" },
]

export async function POST(request: NextRequest) {
    try {
        // Verificăm autentificarea
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Neautentificat" },
                { status: 401 }
            )
        }

        // Verificăm dacă utilizatorul are rol de ADMIN sau SECRETAR
        if (session.user.role !== "ADMIN" && session.user.role !== "SECRETAR") {
            return NextResponse.json(
                { error: "Nu ai permisiunea să imporți studenți" },
                { status: 403 }
            )
        }

        // Citim fișierul din formData
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "Fișier lipsă" },
                { status: 400 }
            )
        }

        // Parsăm fișierul (CSV sau XLSX)
        let data = await parseFile(file)

        // Mapăm headerele de la label la key (ex: "Prenume" -> "firstname")
        data = mapHeadersToKeys(data, STUDENT_COLUMNS)

        // Curățăm datele
        data = cleanImportData(data)

        // Parsăm câmpurile boolean
        data = parseBooleanFields(data, ['isOrphan', 'needsSpecialConditions'])

        // Importăm studenții
        const result = await importStudents(data, session.user.id)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Eroare la importul studenților:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Eroare necunoscută la import"
            },
            { status: 500 }
        )
    }
}
