import { auth } from "@/auth"
import { UserRole } from "@/types/global"
import { NextRequest, NextResponse } from "next/server"

// Standard API Response types
export type ApiResponse<T = any> = {
    success: true
    data: T
    meta?: {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
    }
} | {
    success: false
    error: string
    code?: string
}

// Helper pentru a crea răspunsuri de succes
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta'], status = 200): NextResponse {
    const response: ApiResponse<T> = { success: true, data }
    if (meta) response.meta = meta
    return NextResponse.json(response, { status })
}

// Helper pentru a crea răspunsuri de eroare
export function errorResponse(
    error: string,
    status = 400,
    code?: string
): NextResponse {
    const response: ApiResponse = { success: false, error }
    if (code) response.code = code
    return NextResponse.json(response, { status })
}

// Erori predefinite
export const API_ERRORS = {
    UNAUTHORIZED: { message: "Neautorizat - Autentificare necesară", status: 401, code: "UNAUTHORIZED" },
    FORBIDDEN: { message: "Acces interzis - Nu aveți permisiunile necesare", status: 403, code: "FORBIDDEN" },
    NOT_FOUND: { message: "Resursa nu a fost găsită", status: 404, code: "NOT_FOUND" },
    BAD_REQUEST: { message: "Cerere invalidă", status: 400, code: "BAD_REQUEST" },
    VALIDATION_ERROR: { message: "Eroare de validare", status: 422, code: "VALIDATION_ERROR" },
    CONFLICT: { message: "Conflict - Resursa există deja", status: 409, code: "CONFLICT" },
    INTERNAL_ERROR: { message: "Eroare internă a serverului", status: 500, code: "INTERNAL_ERROR" },
}

// Tipuri pentru authenticated user
export type AuthenticatedUser = {
    id: string
    role: UserRole
    email: string
    name?: string
}

// Verifică autentificarea și returnează user-ul
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    return {
        id: (session.user as any).id,
        role: (session.user as any).role as UserRole,
        email: session.user.email || "",
        name: session.user.name || undefined
    }
}

// Middleware pentru verificarea autentificării
export async function requireAuth(): Promise<
    { success: true; user: AuthenticatedUser } |
    { success: false; response: NextResponse }
> {
    const user = await getAuthenticatedUser()

    if (!user) {
        return {
            success: false,
            response: errorResponse(
                API_ERRORS.UNAUTHORIZED.message,
                API_ERRORS.UNAUTHORIZED.status,
                API_ERRORS.UNAUTHORIZED.code
            )
        }
    }

    return { success: true, user }
}

// Middleware pentru verificarea rolurilor
export async function requireRole(allowedRoles: UserRole[]): Promise<
    { success: true; user: AuthenticatedUser } |
    { success: false; response: NextResponse }
> {
    const authResult = await requireAuth()

    if (!authResult.success) {
        return authResult
    }

    if (!allowedRoles.includes(authResult.user.role)) {
        return {
            success: false,
            response: errorResponse(
                API_ERRORS.FORBIDDEN.message,
                API_ERRORS.FORBIDDEN.status,
                API_ERRORS.FORBIDDEN.code
            )
        }
    }

    return authResult
}

// Shortcut pentru a cere rol de admin
export async function requireAdmin() {
    return requireRole(["ADMIN"])
}

// Shortcut pentru a cere rol de admin sau secretar
export async function requireAdminOrSecretar() {
    return requireRole(["ADMIN", "SECRETAR"])
}

// Helper pentru a parsa query params cu valori default
export function parseQueryParams(searchParams: URLSearchParams) {
    return {
        page: parseInt(searchParams.get("page") || "1"),
        limit: Math.min(parseInt(searchParams.get("limit") || "50"), 100), // max 100
        // Filtre comune
        an: searchParams.get("an") ? parseInt(searchParams.get("an")!) : undefined,
        ciclu: searchParams.get("ciclu") || undefined,
        semestru: searchParams.get("semestru") ? parseInt(searchParams.get("semestru")!) : undefined,
        grupa: searchParams.get("grupa") || undefined,
        profesor: searchParams.get("profesor") || undefined,
        disciplina: searchParams.get("disciplina") || undefined,
        sala: searchParams.get("sala") || undefined,
        zi: searchParams.get("zi") || undefined,
        anUniversitar: searchParams.get("anUniversitar") || undefined,
    }
}

// Helper pentru paginare
export function paginate<T>(items: T[], page: number, limit: number) {
    const total = items.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedItems = items.slice(offset, offset + limit)

    return {
        data: paginatedItems,
        meta: {
            total,
            page,
            limit,
            totalPages
        }
    }
}