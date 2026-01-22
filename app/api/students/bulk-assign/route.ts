import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { bulkAssignStudentsToGroup, bulkRemoveStudentsFromGroup } from "@/actions/student"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Neautentificat" },
                { status: 401 }
            )
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "SECRETAR") {
            return NextResponse.json(
                { error: "Nu ai permisiunea să asignezi studenți la grupe" },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { studentIds, groupId } = body

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json(
                { error: "Lista de studenți este invalidă sau goală" },
                { status: 400 }
            )
        }

        if (!groupId || typeof groupId !== "string") {
            return NextResponse.json(
                { error: "ID-ul grupei este invalid" },
                { status: 400 }
            )
        }

        const result = await bulkAssignStudentsToGroup(studentIds, groupId)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Eroare la asignarea în masă:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Eroare necunoscută"
            },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Neautentificat" },
                { status: 401 }
            )
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "SECRETAR") {
            return NextResponse.json(
                { error: "Nu ai permisiunea să modifici asignările studenților" },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { studentIds } = body

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json(
                { error: "Lista de studenți este invalidă sau goală" },
                { status: 400 }
            )
        }

        const result = await bulkRemoveStudentsFromGroup(studentIds)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Eroare la eliminarea asignării:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Eroare necunoscută"
            },
            { status: 500 }
        )
    }
}
