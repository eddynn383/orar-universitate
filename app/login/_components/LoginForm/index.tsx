// app/login/_components/LoginForm.tsx

"use client"

import { useActionState, useState } from "react"
import { login } from "@/actions/auth"
import { Button } from "@/components/Button"
import { Field, FieldGroup, FieldLabel } from "@/components/Field"
import { Input } from "@/components/Input"
import { Spinner } from "@/components/Spinner"
import { Eye, EyeOff, LogIn } from "lucide-react"

type LoginFormProps = {
    callbackUrl?: string
}

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        name?: string[]
        email?: string[]
        role?: string[]
        password?: string[]
        image?: string[]
    }
} | null

export function LoginForm({ callbackUrl }: LoginFormProps) {
    const [state, formAction, pending] = useActionState<ActionState, FormData>(login, null)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="callbackUrl" value={callbackUrl || "/orar"} />

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        sizes="L"
                        placeholder="exemplu@universitate.ro"
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Parolă</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            sizes="L"
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-700"
                        >
                            {showPassword ? (
                                <EyeOff className="size-5" />
                            ) : (
                                <Eye className="size-5" />
                            )}
                        </button>
                    </div>
                </Field>
            </FieldGroup>

            {state?.message && !state.success && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {state.message}
                </div>
            )}

            <Button
                type="submit"
                variant="brand"
                size="L"
                className="w-full"
                disabled={pending}
            >
                <Spinner
                    className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                    data-loading={pending}
                />
                <span
                    data-loading={pending}
                    className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0 inline-flex items-center gap-2"
                >
                    <LogIn className="size-5" />
                    Autentificare
                </span>
            </Button>
        </form>
    )
}