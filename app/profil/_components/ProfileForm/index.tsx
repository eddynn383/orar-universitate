"use client"

import { useState, useActionState, useEffect } from "react"
import Image from "next/image"
import { updateProfile, updatePassword } from "@/actions/profile"
import { Button } from "@/components/Button"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field"
import { Input } from "@/components/Input"
import { Textarea } from "@/components/Textarea"
import { Spinner } from "@/components/Spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card"
import { ImageUpload } from "@/components/ImageUpload"
import { User, Mail, Phone, MapPin, Building, Globe, FileText, Lock, Camera } from "lucide-react"
import { H3 } from "@/components/Typography"
import { Badge } from "@/components/Badge"

type ProfileFormProps = {
    user: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        phone: string | null
        address: string | null
        city: string | null
        country: string | null
        bio: string | null
        role: string
        createdAt: Date
    }
}

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        errors: string[]
        properties?: Record<string, { errors: string[] }>
    }
} | null

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrator",
    SECRETAR: "Secretar",
    PROFESOR: "Profesor",
    USER: "Utilizator",
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700 border-red-200",
    SECRETAR: "bg-blue-100 text-blue-700 border-blue-200",
    PROFESOR: "bg-green-100 text-green-700 border-green-200",
    USER: "bg-gray-100 text-gray-700 border-gray-200",
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [profileState, profileAction, profilePending] = useActionState<ActionState, FormData>(updateProfile, null)
    const [passwordState, passwordAction, passwordPending] = useActionState<ActionState, FormData>(updatePassword, null)

    const [imageUrl, setImageUrl] = useState<string>(user.image || "")
    const [showSuccess, setShowSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")

    useEffect(() => {
        if (profileState?.success) {
            setSuccessMessage("Profilul a fost actualizat cu succes!")
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }
    }, [profileState])

    useEffect(() => {
        if (passwordState?.success) {
            setSuccessMessage("Parola a fost schimbată cu succes!")
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }
    }, [passwordState])

    const profileErrors = profileState?.errors?.properties
    const passwordErrors = passwordState?.errors?.properties

    return (
        <div className="space-y-6">
            {/* Success notification */}
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Profile Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Informații personale</CardTitle>
                            <CardDescription>
                                Actualizează-ți datele de profil
                            </CardDescription>
                        </div>
                        <Badge className={`${ROLE_COLORS[user.role]} border`}>
                            {ROLE_LABELS[user.role]}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={profileAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="image" value={imageUrl} />

                        <FieldSet>
                            <FieldGroup>
                                {/* Profile Image */}
                                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-primary-200">
                                    <div className="relative">
                                        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-primary-200">
                                            {imageUrl ? (
                                                <Image
                                                    src={imageUrl}
                                                    alt={user.name || "Profile"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl font-medium text-primary-500">
                                                    {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <H3 className="mb-2">Fotografie de profil</H3>
                                        <p className="text-sm text-primary-600 mb-4">
                                            JPG, PNG sau GIF. Dimensiune maximă 4MB.
                                        </p>
                                        <ImageUpload
                                            value={imageUrl}
                                            onChange={setImageUrl}
                                            endpoint="userImage"
                                        />
                                    </div>
                                </div>

                                {/* Name and Email Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field data-invalid={profileErrors?.name ? true : undefined}>
                                        <FieldLabel className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Nume complet
                                        </FieldLabel>
                                        <Input
                                            name="name"
                                            defaultValue={user.name || ""}
                                            placeholder="Ion Popescu"
                                            sizes="L"
                                        />
                                        <FieldError>{profileErrors?.name?.errors?.[0]}</FieldError>
                                    </Field>

                                    <Field data-invalid={profileErrors?.email ? true : undefined}>
                                        <FieldLabel className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </FieldLabel>
                                        <Input
                                            name="email"
                                            type="email"
                                            defaultValue={user.email || ""}
                                            placeholder="ion.popescu@example.com"
                                            sizes="L"
                                        />
                                        <FieldError>{profileErrors?.email?.errors?.[0]}</FieldError>
                                    </Field>
                                </div>

                                {/* Phone */}
                                <Field data-invalid={profileErrors?.phone ? true : undefined}>
                                    <FieldLabel className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Telefon
                                    </FieldLabel>
                                    <Input
                                        name="phone"
                                        type="tel"
                                        defaultValue={user.phone || ""}
                                        placeholder="+40 712 345 678"
                                        sizes="L"
                                    />
                                    <FieldError>{profileErrors?.phone?.errors?.[0]}</FieldError>
                                </Field>

                                {/* Address */}
                                <Field data-invalid={profileErrors?.address ? true : undefined}>
                                    <FieldLabel className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Adresă
                                    </FieldLabel>
                                    <Input
                                        name="address"
                                        defaultValue={user.address || ""}
                                        placeholder="Strada Exemplu, Nr. 123"
                                        sizes="L"
                                    />
                                    <FieldError>{profileErrors?.address?.errors?.[0]}</FieldError>
                                </Field>

                                {/* City and Country Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field data-invalid={profileErrors?.city ? true : undefined}>
                                        <FieldLabel className="flex items-center gap-2">
                                            <Building className="w-4 h-4" />
                                            Oraș
                                        </FieldLabel>
                                        <Input
                                            name="city"
                                            defaultValue={user.city || ""}
                                            placeholder="București"
                                            sizes="L"
                                        />
                                        <FieldError>{profileErrors?.city?.errors?.[0]}</FieldError>
                                    </Field>

                                    <Field data-invalid={profileErrors?.country ? true : undefined}>
                                        <FieldLabel className="flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            Țară
                                        </FieldLabel>
                                        <Input
                                            name="country"
                                            defaultValue={user.country || ""}
                                            placeholder="România"
                                            sizes="L"
                                        />
                                        <FieldError>{profileErrors?.country?.errors?.[0]}</FieldError>
                                    </Field>
                                </div>

                                {/* Bio */}
                                <Field data-invalid={profileErrors?.bio ? true : undefined}>
                                    <FieldLabel className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Despre mine
                                    </FieldLabel>
                                    <Textarea
                                        name="bio"
                                        defaultValue={user.bio || ""}
                                        placeholder="Scrie câteva cuvinte despre tine..."
                                        rows={4}
                                    />
                                    <FieldError>{profileErrors?.bio?.errors?.[0]}</FieldError>
                                </Field>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" variant="brand" disabled={profilePending}>
                                        <Spinner
                                            className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                                            data-loading={profilePending}
                                        />
                                        <span
                                            data-loading={profilePending}
                                            className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0"
                                        >
                                            Salvează modificările
                                        </span>
                                    </Button>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    </form>
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Schimbă parola
                    </CardTitle>
                    <CardDescription>
                        Actualizează-ți parola pentru a-ți proteja contul
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={passwordAction}>
                        <input type="hidden" name="userId" value={user.id} />

                        <FieldSet>
                            <FieldGroup>
                                <Field data-invalid={passwordErrors?.currentPassword ? true : undefined}>
                                    <FieldLabel>Parola curentă</FieldLabel>
                                    <Input
                                        name="currentPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        sizes="L"
                                    />
                                    <FieldError>{passwordErrors?.currentPassword?.errors?.[0]}</FieldError>
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field data-invalid={passwordErrors?.newPassword ? true : undefined}>
                                        <FieldLabel>Parola nouă</FieldLabel>
                                        <Input
                                            name="newPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            sizes="L"
                                        />
                                        <FieldError>{passwordErrors?.newPassword?.errors?.[0]}</FieldError>
                                    </Field>

                                    <Field data-invalid={passwordErrors?.confirmPassword ? true : undefined}>
                                        <FieldLabel>Confirmă parola nouă</FieldLabel>
                                        <Input
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            sizes="L"
                                        />
                                        <FieldError>{passwordErrors?.confirmPassword?.errors?.[0]}</FieldError>
                                    </Field>
                                </div>

                                {passwordState?.success === false && passwordState?.message && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {passwordState.message}
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" variant="outline" disabled={passwordPending}>
                                        <Spinner
                                            className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                                            data-loading={passwordPending}
                                        />
                                        <span
                                            data-loading={passwordPending}
                                            className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0"
                                        >
                                            Schimbă parola
                                        </span>
                                    </Button>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    </form>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Informații cont</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-primary-600">
                        <p>
                            <span className="font-medium">Cont creat:</span>{" "}
                            {new Date(user.createdAt).toLocaleDateString("ro-RO", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}