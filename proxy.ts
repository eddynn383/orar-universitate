// middleware.ts

import { NextResponse } from 'next/server'
import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutes } from "@/routes"

const { auth: middleware } = NextAuth(authConfig)

export default middleware((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const userRole = req.auth?.user?.role
    console.log("login: ", req.auth)
    console.log("userRole in middleware:", userRole)

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isPublicRoute = publicRoutes.some(route =>
        nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
    )
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    // Allow API auth routes
    if (isApiAuthRoute) {
        return NextResponse.next()
    }

    // Handle auth routes (login, register, etc.)
    if (isAuthRoute) {
        if (isLoggedIn) {
            // Redirect logged-in users away from auth pages
            return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
        return NextResponse.next()
    }

    // Allow public routes
    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Redirect unauthenticated users to login
    if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname)
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
    }

    // Role-based access control
    const adminOnlyRoutes = ["/users"]
    const secretarRoutes = ["/cadre", "/classrooms", "/discipline", "/grupe"]

    // Check admin-only routes
    if (adminOnlyRoutes.some(route => nextUrl.pathname.startsWith(route))) {
        if (userRole !== "ADMIN") {

            console.log("USER ROLE:", userRole)
            return NextResponse.redirect(new URL("/unauthorized", nextUrl))
        }
    }

    // Check secretar routes (ADMIN and SECRETAR can access)
    if (secretarRoutes.some(route => nextUrl.pathname.startsWith(route))) {
        if (!["ADMIN", "SECRETAR"].includes(userRole || "")) {
            return NextResponse.redirect(new URL("/unauthorized", nextUrl))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}