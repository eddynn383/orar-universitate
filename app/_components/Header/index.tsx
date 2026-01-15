import { H1 } from "@/components/Typography";
import { MainNavigation } from "../Navigation";
import { Calendar } from "lucide-react";
import { UserNav } from "../UserNav";
import { auth } from "@/auth";

const Header = async () => {
    const session = await auth()

    console.log("session: ", session)

    return (
        <header className="flex justify-center bg-primary-100 text-primary-1400 border-b border-primary-200 p-4 sticky top-0 z-50">
            <div className="flex justify-between w-full max-w-7xl">
                <H1 className="text-xl flex gap-2 items-center"><Calendar /> Manager Orar</H1>
                <div className="flex items-center gap-6">
                    <MainNavigation session={session} />
                </div>
            </div>
        </header>
    );
}

export { Header };