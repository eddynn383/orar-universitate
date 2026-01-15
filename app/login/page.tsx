// app/login/page.tsx

import { LoginForm } from "./_components/LoginForm"
import { H1, P } from "@/components/Typography"

export default async function LoginPage({
    searchParams
}: {
    searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
    const params = await searchParams
    // const callbackUrl = params.callbackUrl
    // const urlError = params.error === "OAuthAccountNotLinked"
    //     ? "Email already in use with different provider!"
    //     : "";

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-100 px-4">
            <div className="w-full max-w-md">
                <div className="bg-primary-200 rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <H1 className="text-2xl mb-2">Autentificare</H1>
                        <P className="text-primary-600 [&:not(:first-child)]:mt-0">
                            Introduceți datele de acces pentru a continua
                        </P>
                    </div>

                    {params.error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {params.error === "CredentialsSignin"
                                ? "Email sau parolă incorectă"
                                : "A apărut o eroare la autentificare"
                            }
                        </div>
                    )}

                    <LoginForm callbackUrl={params.callbackUrl} />
                </div>
            </div>
        </div>
    )
}