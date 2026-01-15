
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { getUserByEmail } from "./data/user"
import { passwordsMatch } from "./data/auth"

export default {
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await getUserByEmail(credentials.email as string)

                if (!user || !user.password) {
                    return null
                }

                const isValid = await passwordsMatch(credentials.password as string, user.password)

                if (!isValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
                token.role = (user as any).role as string
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        }
    },
} satisfies NextAuthConfig