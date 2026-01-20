"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { SocketProvider } from "@/app/contexts/socket-context"

interface SessionProviderProps {
    children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
    return (
        <NextAuthSessionProvider>
            <SocketProvider>
                {children}
            </SocketProvider>
        </NextAuthSessionProvider>
    )
}
