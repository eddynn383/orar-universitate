"use client"

import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Button } from "@/components/Button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/Dropdown"
import { LogOut, Settings, User, Bell, BellOff } from "lucide-react"
import { useNotifications } from "@/app/hooks/use-notifications"
import Link from "next/link"

type UserNavProps = {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
    }
}

export function UserNav({ user }: UserNavProps) {
    const { permission, isSupported, requestPermission } = useNotifications()

    const initials = user.name
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
        : user.email?.[0].toUpperCase() || "U"

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case "ADMIN":
                return "bg-red-100 text-red-700"
            case "SECRETAR":
                return "bg-blue-100 text-blue-700"
            case "PROFESOR":
                return "bg-green-100 text-green-700"
            case "STUDENT":
                return "bg-yellow-100 text-yellow-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        {/* <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p> */}
                        {user.role && (
                            <span className={`text-xs px-2 py-0.5 rounded-full w-fit mt-1 ${getRoleBadge(user.role)}`}>
                                {user.role}
                            </span>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Link href="/profil" className="flex items-center gap-2"><User className="mr-2 h-4 w-4" /> Profil</Link>
                </DropdownMenuItem>
                {isSupported && (
                    <DropdownMenuItem
                        onClick={permission !== 'granted' ? requestPermission : undefined}
                        className={permission === 'granted' ? 'cursor-default' : 'cursor-pointer'}
                    >
                        {permission === 'granted' ? (
                            <>
                                <Bell className="mr-2 h-4 w-4 text-success-400" />
                                <span>Notificări active</span>
                            </>
                        ) : (
                            <>
                                <BellOff className="mr-2 h-4 w-4" />
                                <span>Activează notificări</span>
                            </>
                        )}
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Deconectare</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}