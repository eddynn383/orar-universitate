// routes.ts

/**
 * Public routes that don't require authentication
 * Anyone can access these routes
 */
export const publicRoutes = [
    "/",
    "/unauthorized",
    "/not-found",
    "/api",
    "/api/uploadthing"
    // "/api/orar",        // Public API for viewing schedule
]

/**
 * Auth routes - used for authentication
 * Logged-in users will be redirected away from these
 */
export const authRoutes = [
    "/login",
    "/register",
    "/error",
    "/forgot-password",
    "/reset-password",
]

/**
 * API auth prefix
 * Routes starting with this prefix are used for API authentication
 */
export const apiAuthPrefix = "/api/auth"

/**
 * Default redirect path after login
 */
export const DEFAULT_LOGIN_REDIRECT = "/orar"