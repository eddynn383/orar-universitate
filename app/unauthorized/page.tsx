// app/unauthorized/page.tsx

import { Button } from "@/components/Button"
import { H1, P } from "@/components/Typography"
import { ShieldX } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-100 px-4">
            <div className="text-center max-w-md">
                <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <ShieldX className="size-12 text-red-500" />
                </div>

                <H1 className="text-2xl mb-4">Acces Interzis</H1>

                <P className="text-primary-600 mb-8 [&:not(:first-child)]:mt-0">
                    Nu aveți permisiunile necesare pentru a accesa această pagină.
                    Contactați administratorul dacă credeți că aceasta este o eroare.
                </P>

                <div className="flex gap-4 justify-center">
                    <Link href="/orar">
                        <Button variant="brand">
                            Pagina principală
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline">
                            Schimbă contul
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}