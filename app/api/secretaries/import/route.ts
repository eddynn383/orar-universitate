import { NextRequest, NextResponse } from "next/server"
import { parseFile, cleanImportData } from "@/lib/import"
import { importSecretaries } from "@/actions/import"
import { auth } from "@/auth"

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

        // Verificăm dacă utilizatorul are rol de ADMIN
        if (session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Nu ai permisiunea să imporți secretari" },
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

        // Importăm secretarii
        const result = await importSecretaries(data, session.user.id)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Eroare la importul secretarilor:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Eroare necunoscută la import"
            },
            { status: 500 }
        )
    }
}
