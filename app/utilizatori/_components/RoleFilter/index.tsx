"use client"

import { Button } from "@/components/Button"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, GraduationCap, BookOpen, Shield, UserCircle } from "lucide-react"

type RoleFilterProps = {
    currentRole: string
}

const ROLE_OPTIONS = [
    { value: "ALL", label: "Toți", icon: Users },
    { value: "PROFESOR", label: "Profesori", icon: BookOpen },
    { value: "STUDENT", label: "Studenți", icon: GraduationCap },
    { value: "SECRETAR", label: "Secretari", icon: UserCircle },
    { value: "ADMIN", label: "Administratori", icon: Shield },
]

export function RoleFilter({ currentRole }: RoleFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleRoleChange = (role: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (role === "ALL") {
            params.delete("role")
        } else {
            params.set("role", role)
        }

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex gap-2 items-center">
            {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isActive = currentRole === value

                return (
                    <Button
                        key={value}
                        variant={isActive ? "filled" : "text"}
                        size="M"
                        onClick={() => handleRoleChange(value)}
                        className={`gap-2 ${isActive ? "" : "text-primary-600 hover:text-brand-400"}`}
                    >
                        <Icon className="size-4" />
                        {label}
                    </Button>
                )
            })}
        </div>
    )
}
