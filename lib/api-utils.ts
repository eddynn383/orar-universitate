import { auth } from "@/auth"
import { UserRole } from "@/types/global"
import { NextRequest, NextResponse } from "next/server"

/**
 * Standard API response structure for all API endpoints.
 *
 * @template T - The type of data returned in successful responses
 *
 * @example
 * // Success response with data
 * const response: ApiResponse<User[]> = {
 *   success: true,
 *   data: [{ id: "1", name: "John" }],
 *   meta: { total: 1, page: 1, limit: 50, totalPages: 1 }
 * }
 *
 * @example
 * // Error response
 * const response: ApiResponse = {
 *   success: false,
 *   error: "User not found",
 *   code: "NOT_FOUND"
 * }
 */
export type ApiResponse<T = any> = {
    /** Indicates a successful response */
    success: true
    /** The response data payload */
    data: T
    /** Optional metadata for pagination and additional context */
    meta?: {
        /** Total number of items available */
        total?: number
        /** Current page number (1-indexed) */
        page?: number
        /** Number of items per page */
        limit?: number
        /** Total number of pages available */
        totalPages?: number
    }
} | {
    /** Indicates a failed response */
    success: false
    /** Human-readable error message */
    error: string
    /** Machine-readable error code for programmatic handling */
    code?: string
}

/**
 * Creates a standardized successful API response.
 *
 * This helper ensures all successful API responses follow a consistent format
 * with optional pagination metadata.
 *
 * @template T - The type of data being returned
 * @param {T} data - The response data to return to the client
 * @param {object} [meta] - Optional pagination and metadata information
 * @param {number} [meta.total] - Total number of items available
 * @param {number} [meta.page] - Current page number
 * @param {number} [meta.limit] - Items per page
 * @param {number} [meta.totalPages] - Total number of pages
 * @param {number} [status=200] - HTTP status code (defaults to 200)
 * @returns {NextResponse} A Next.js response object with standardized JSON structure
 *
 * @example
 * // Simple success response
 * return successResponse({ id: "123", name: "Math 101" })
 *
 * @example
 * // Paginated response
 * return successResponse(
 *   users,
 *   { total: 100, page: 1, limit: 20, totalPages: 5 },
 *   200
 * )
 *
 * @example
 * // Created resource response
 * return successResponse(newUser, undefined, 201)
 */
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta'], status = 200): NextResponse {
    const response: ApiResponse<T> = { success: true, data }
    if (meta) response.meta = meta
    return NextResponse.json(response, { status })
}

/**
 * Creates a standardized error API response.
 *
 * This helper ensures all error responses follow a consistent format with
 * human-readable messages and optional machine-readable error codes.
 *
 * @param {string} error - Human-readable error message for the client
 * @param {number} [status=400] - HTTP status code (defaults to 400 Bad Request)
 * @param {string} [code] - Optional machine-readable error code (e.g., "VALIDATION_ERROR")
 * @returns {NextResponse} A Next.js response object with standardized error structure
 *
 * @example
 * // Simple error response
 * return errorResponse("User not found", 404)
 *
 * @example
 * // Error with code
 * return errorResponse(
 *   "Invalid email format",
 *   422,
 *   "VALIDATION_ERROR"
 * )
 *
 * @example
 * // Using predefined error constants
 * return errorResponse(
 *   API_ERRORS.UNAUTHORIZED.message,
 *   API_ERRORS.UNAUTHORIZED.status,
 *   API_ERRORS.UNAUTHORIZED.code
 * )
 */
export function errorResponse(
    error: string,
    status = 400,
    code?: string
): NextResponse {
    const response: ApiResponse = { success: false, error }
    if (code) response.code = code
    return NextResponse.json(response, { status })
}

/**
 * Predefined API error constants for consistent error handling across the application.
 *
 * Each error object contains:
 * - `message`: Human-readable error message in Romanian
 * - `status`: HTTP status code
 * - `code`: Machine-readable error code for programmatic handling
 *
 * @example
 * // Using in an API route
 * const authResult = await requireAuth()
 * if (!authResult.success) {
 *   return errorResponse(
 *     API_ERRORS.UNAUTHORIZED.message,
 *     API_ERRORS.UNAUTHORIZED.status,
 *     API_ERRORS.UNAUTHORIZED.code
 *   )
 * }
 *
 * @example
 * // Checking for duplicate resources
 * if (existingUser) {
 *   return errorResponse(
 *     API_ERRORS.CONFLICT.message,
 *     API_ERRORS.CONFLICT.status,
 *     API_ERRORS.CONFLICT.code
 *   )
 * }
 */
export const API_ERRORS = {
    /** 401 - User is not authenticated, login required */
    UNAUTHORIZED: { message: "Neautorizat - Autentificare necesară", status: 401, code: "UNAUTHORIZED" },
    /** 403 - User lacks required permissions for the operation */
    FORBIDDEN: { message: "Acces interzis - Nu aveți permisiunile necesare", status: 403, code: "FORBIDDEN" },
    /** 404 - Requested resource does not exist */
    NOT_FOUND: { message: "Resursa nu a fost găsită", status: 404, code: "NOT_FOUND" },
    /** 400 - Request is malformed or invalid */
    BAD_REQUEST: { message: "Cerere invalidă", status: 400, code: "BAD_REQUEST" },
    /** 422 - Request validation failed (e.g., invalid input data) */
    VALIDATION_ERROR: { message: "Eroare de validare", status: 422, code: "VALIDATION_ERROR" },
    /** 409 - Resource conflict (e.g., duplicate entry) */
    CONFLICT: { message: "Conflict - Resursa există deja", status: 409, code: "CONFLICT" },
    /** 500 - Unexpected server error */
    INTERNAL_ERROR: { message: "Eroare internă a serverului", status: 500, code: "INTERNAL_ERROR" },
} as const

/**
 * Represents an authenticated user extracted from the session.
 *
 * This type is returned by authentication middleware and contains
 * essential user information needed for authorization checks.
 *
 * @property {string} id - Unique user identifier from the database
 * @property {UserRole} role - User's role (ADMIN, SECRETAR, PROFESOR, or STUDENT)
 * @property {string} email - User's email address
 * @property {string} [name] - Optional user display name
 */
export type AuthenticatedUser = {
    id: string
    role: UserRole
    email: string
    name?: string
}

/**
 * Retrieves the currently authenticated user from the session.
 *
 * This function extracts user information from the NextAuth session and
 * returns it in a standardized format. Returns null if no valid session exists.
 *
 * @async
 * @returns {Promise<AuthenticatedUser | null>} The authenticated user object, or null if not authenticated
 *
 * @example
 * // In an API route
 * const user = await getAuthenticatedUser()
 * if (!user) {
 *   return errorResponse("Authentication required", 401)
 * }
 * console.log(user.role) // "ADMIN", "PROFESOR", etc.
 *
 * @example
 * // Checking user role
 * const user = await getAuthenticatedUser()
 * if (user && user.role === "ADMIN") {
 *   // Admin-only logic
 * }
 */
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

/**
 * Authentication middleware that ensures a valid user session exists.
 *
 * This function checks for an authenticated user and returns either the user
 * object or an error response. Use this at the start of protected API routes.
 *
 * @async
 * @returns {Promise<{success: true, user: AuthenticatedUser} | {success: false, response: NextResponse}>}
 *   - On success: Returns `{success: true, user}` with the authenticated user
 *   - On failure: Returns `{success: false, response}` with a 401 error response
 *
 * @example
 * // In an API route handler
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth()
 *   if (!authResult.success) {
 *     return authResult.response
 *   }
 *
 *   const user = authResult.user
 *   // Continue with authenticated logic...
 * }
 *
 * @example
 * // Early return pattern
 * const auth = await requireAuth()
 * if (!auth.success) return auth.response
 *
 * // TypeScript now knows auth.user exists
 * console.log(auth.user.email)
 */
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

/**
 * Role-based authorization middleware that checks if the user has required permissions.
 *
 * This function first verifies authentication, then checks if the user's role
 * matches one of the allowed roles. Returns either the user or an appropriate error response.
 *
 * @async
 * @param {UserRole[]} allowedRoles - Array of roles that are permitted (e.g., ["ADMIN", "SECRETAR"])
 * @returns {Promise<{success: true, user: AuthenticatedUser} | {success: false, response: NextResponse}>}
 *   - On success: Returns `{success: true, user}` with the authorized user
 *   - On auth failure: Returns `{success: false, response}` with a 401 error
 *   - On role failure: Returns `{success: false, response}` with a 403 error
 *
 * @example
 * // Require admin or secretar roles
 * export async function DELETE(request: NextRequest) {
 *   const authResult = await requireRole(["ADMIN", "SECRETAR"])
 *   if (!authResult.success) {
 *     return authResult.response
 *   }
 *
 *   // User is either ADMIN or SECRETAR
 *   await deleteResource()
 *   return successResponse({ deleted: true })
 * }
 *
 * @example
 * // Require only admin
 * const auth = await requireRole(["ADMIN"])
 * if (!auth.success) return auth.response
 *
 * // Only admins reach here
 * console.log(auth.user.role) // "ADMIN"
 *
 * @example
 * // Multiple roles with business logic
 * const auth = await requireRole(["ADMIN", "PROFESOR", "SECRETAR"])
 * if (!auth.success) return auth.response
 *
 * if (auth.user.role === "PROFESOR") {
 *   // Professor-specific logic
 * }
 */
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

/**
 * Convenience function that requires ADMIN role.
 *
 * This is a shortcut for `requireRole(["ADMIN"])` to simplify common authorization checks.
 *
 * @async
 * @returns {Promise<{success: true, user: AuthenticatedUser} | {success: false, response: NextResponse}>}
 *   - On success: Returns `{success: true, user}` where user.role is "ADMIN"
 *   - On failure: Returns appropriate error response (401 if not authenticated, 403 if not admin)
 *
 * @example
 * // Restrict endpoint to admins only
 * export async function DELETE(request: NextRequest) {
 *   const auth = await requireAdmin()
 *   if (!auth.success) return auth.response
 *
 *   // Only admins can delete
 *   await performDangerousOperation()
 *   return successResponse({ message: "Deleted successfully" })
 * }
 */
export async function requireAdmin() {
    return requireRole(["ADMIN"])
}

/**
 * Convenience function that requires ADMIN or SECRETAR role.
 *
 * This is a shortcut for `requireRole(["ADMIN", "SECRETAR"])` for common administrative operations.
 * Both roles typically have permissions for data management operations.
 *
 * @async
 * @returns {Promise<{success: true, user: AuthenticatedUser} | {success: false, response: NextResponse}>}
 *   - On success: Returns `{success: true, user}` where user.role is "ADMIN" or "SECRETAR"
 *   - On failure: Returns appropriate error response (401 if not authenticated, 403 if insufficient role)
 *
 * @example
 * // Allow both admins and secretaries to manage resources
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAdminOrSecretar()
 *   if (!auth.success) return auth.response
 *
 *   // Both ADMIN and SECRETAR can create
 *   const data = await request.json()
 *   const result = await createResource(data)
 *   return successResponse(result, undefined, 201)
 * }
 *
 * @example
 * // Different logic based on role
 * const auth = await requireAdminOrSecretar()
 * if (!auth.success) return auth.response
 *
 * if (auth.user.role === "ADMIN") {
 *   // Admins can edit all fields
 * } else {
 *   // Secretaries have limited editing
 * }
 */
export async function requireAdminOrSecretar() {
    return requireRole(["ADMIN", "SECRETAR"])
}

/**
 * Parses and validates URL query parameters with sensible defaults for API endpoints.
 *
 * This utility extracts common pagination and filter parameters from URL search params,
 * applying default values and validation (e.g., limiting max page size to 100).
 *
 * @param {URLSearchParams} searchParams - URL search parameters from the request
 * @returns {object} Parsed query parameters object
 * @returns {number} returns.page - Page number (default: 1)
 * @returns {number} returns.limit - Items per page (default: 50, max: 100)
 * @returns {number} [returns.an] - Study year filter (e.g., 1, 2, 3)
 * @returns {string} [returns.ciclu] - Study cycle filter (e.g., "LICENTA", "MASTER")
 * @returns {number} [returns.semestru] - Semester filter (1 or 2)
 * @returns {string} [returns.grupa] - Group filter (group ID)
 * @returns {string} [returns.profesor] - Professor filter (professor ID)
 * @returns {string} [returns.disciplina] - Discipline filter (discipline ID)
 * @returns {string} [returns.sala] - Classroom filter (classroom ID)
 * @returns {string} [returns.zi] - Day of week filter (e.g., "LUNI", "MARTI")
 * @returns {string} [returns.anUniversitar] - Academic year filter (academic year ID)
 *
 * @example
 * // In an API route
 * export async function GET(request: NextRequest) {
 *   const { searchParams } = new URL(request.url)
 *   const params = parseQueryParams(searchParams)
 *
 *   console.log(params.page)   // 1 (default)
 *   console.log(params.limit)  // 50 (default)
 * }
 *
 * @example
 * // URL: /api/orar?page=2&limit=20&grupa=123&zi=LUNI
 * const params = parseQueryParams(searchParams)
 * console.log(params)
 * // {
 * //   page: 2,
 * //   limit: 20,
 * //   grupa: "123",
 * //   zi: "LUNI",
 * //   an: undefined,
 * //   ciclu: undefined,
 * //   ...
 * // }
 *
 * @example
 * // Limit is capped at 100 for performance
 * // URL: /api/users?limit=500
 * const params = parseQueryParams(searchParams)
 * console.log(params.limit) // 100 (not 500)
 */
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

/**
 * Paginates an array of items and returns data with pagination metadata.
 *
 * This utility slices an array based on page and limit parameters, calculating
 * pagination metadata (total pages, current page, etc.) for client consumption.
 *
 * @template T - The type of items in the array
 * @param {T[]} items - The full array of items to paginate
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Number of items per page
 * @returns {object} Paginated result with data and metadata
 * @returns {T[]} returns.data - The paginated subset of items for the current page
 * @returns {object} returns.meta - Pagination metadata
 * @returns {number} returns.meta.total - Total number of items across all pages
 * @returns {number} returns.meta.page - Current page number
 * @returns {number} returns.meta.limit - Items per page
 * @returns {number} returns.meta.totalPages - Total number of pages available
 *
 * @example
 * // Paginating a list of users
 * const allUsers = await db.user.findMany()
 * const result = paginate(allUsers, 1, 20)
 *
 * console.log(result.data.length) // 20 (or fewer if on last page)
 * console.log(result.meta)
 * // {
 * //   total: 100,
 * //   page: 1,
 * //   limit: 20,
 * //   totalPages: 5
 * // }
 *
 * @example
 * // Using with successResponse
 * export async function GET(request: NextRequest) {
 *   const { searchParams } = new URL(request.url)
 *   const { page, limit } = parseQueryParams(searchParams)
 *
 *   const allItems = await fetchAllItems()
 *   const { data, meta } = paginate(allItems, page, limit)
 *
 *   return successResponse(data, meta)
 * }
 *
 * @example
 * // Last page handling
 * const items = [1, 2, 3, 4, 5]
 * const result = paginate(items, 2, 3)
 * console.log(result.data)        // [4, 5]
 * console.log(result.meta.totalPages) // 2
 */
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