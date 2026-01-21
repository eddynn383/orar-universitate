import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { parseFile, cleanImportData } from "@/lib/import"
import { importTeachers } from "@/actions/import"

export async function POST(request: NextRequest) {
    try {
        // Verificăm autentificarea
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Neautentificat" },
                { status: 401 }
            )
        }

        // Verificăm dacă utilizatorul are rol de ADMIN
        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Nu ai permisiunea să imporți profesori" },
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

        // Curățăm datele
        data = cleanImportData(data)

        // Importăm profesorii
        const result = await importTeachers(data, session.user.id)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Eroare la importul profesorilor:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Eroare necunoscută la import"
            },
            { status: 500 }
        )
    }
}
