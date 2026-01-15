// components/ImageUpload.tsx

"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "@uploadthing/react"
import { generateClientDropzoneAccept } from "uploadthing/client"
import { useUploadThing } from "@/lib/uploadthing-client"
import { Button } from "@/components/Button"
import { Camera, Trash2, User, Loader2, Upload } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type ImageUploadProps = {
    value?: string | null
    onChange: (value: string | null) => void
    endpoint: "teacherImage" | "userImage"
    name?: string
    disabled?: boolean
    className?: string
}

export function ImageUpload({
    value,
    onChange,
    endpoint,
    name = "image",
    disabled = false,
    className
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)

    const { startUpload, permittedFileInfo } = useUploadThing(endpoint, {
        onClientUploadComplete: (res) => {
            if (res?.[0]?.url) {
                onChange(res[0].url)
            }
            setIsUploading(false)
        },
        onUploadError: (error) => {
            console.error("Upload error:", error)
            alert(error.message || "Eroare la încărcarea imaginii")
            setIsUploading(false)
        },
        onUploadBegin: () => {
            setIsUploading(true)
        },
    })

    const fileTypes = permittedFileInfo?.config
        ? Object.keys(permittedFileInfo.config)
        : []

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                setIsUploading(true)
                await startUpload(acceptedFiles)
            }
        },
        [startUpload]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: fileTypes.length > 0
            ? generateClientDropzoneAccept(fileTypes)
            : { "image/*": [] },
        maxFiles: 1,
        disabled: disabled || isUploading,
    })

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
    }, [onChange])

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={value || ''} />

            {/* Preview or Upload area */}
            {value ? (
                <div className="relative group">
                    <div className="relative rounded-lg overflow-hidden border-2 border-primary-300 w-full max-w-[160px] aspect-square">
                        <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="size-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Overlay with actions */}
                    {!isUploading && (
                        <div className="absolute inset-0 w-full max-w-[160px] aspect-square rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-s"
                                    disabled={disabled}
                                    className="text-white hover:bg-white/20"
                                >
                                    <Camera className="size-4" />
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-s"
                                onClick={handleRemove}
                                disabled={disabled}
                                className="text-white hover:bg-red-500/50"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={cn(
                        "size-24 rounded-lg border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 w-full min-h-[160px] p-6",
                        isDragActive
                            ? "border-brand-400 bg-brand-400/10"
                            : "border-primary-400 hover:border-brand-400 hover:bg-primary-100",
                        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <Loader2 className="size-6 text-brand-400 animate-spin" />
                    ) : (
                        <>
                            <Upload className="size-8 text-primary-400" />
                            <span className="text-base text-primary-500">Încarca imagine</span>
                            <p className="text-xs text-primary-500">
                                (JPG, PNG sau GIF. Max 4MB.)
                            </p>
                        </>
                    )}
                </div>
            )}


        </div>
    )
}