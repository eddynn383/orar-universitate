"use client"

import React, { useState, useRef } from "react"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import { Spinner } from "@/components/Spinner"
import { P, H4 } from "@/components/Typography"
import { FileUp, Download, CheckCircle2, AlertCircle } from "lucide-react"
import { downloadCSVTemplate } from "@/lib/import"

interface ImportModalProps {
    title: string
    description: string
    entityType: "students" | "teachers" | "secretaries" | "admins"
    templateColumns: Array<{
        key: string
        label: string
        example?: string
    }>
    onImportComplete?: () => void
}

interface ImportResult {
    success: boolean
    total: number
    successful: number
    failed: number
    errors: Array<{
        row: number
        email?: string
        message: string
    }>
}

export function ImportModal({
    title,
    description,
    entityType,
    templateColumns,
    onImportComplete
}: ImportModalProps) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setResult(null) // Resetăm rezultatul anterior
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(`/api/${entityType}/import`, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Eroare la import")
            }

            setResult(data)

            // Dacă importul a fost complet cu succes, apelăm callback-ul
            if (data.success && onImportComplete) {
                setTimeout(() => {
                    onImportComplete()
                }, 2000) // Așteptăm 2 secunde ca utilizatorul să vadă rezultatul
            }
        } catch (error) {
            console.error("Eroare la upload:", error)
            setResult({
                success: false,
                total: 0,
                successful: 0,
                failed: 0,
                errors: [{
                    row: 0,
                    message: error instanceof Error ? error.message : "Eroare necunoscută"
                }]
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDownloadTemplate = () => {
        downloadCSVTemplate(`template-${entityType}.csv`, templateColumns)
    }

    const handleReset = () => {
        setFile(null)
        setResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleClose = () => {
        handleReset()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="w-4 h-4 mr-2" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {/* Download template section */}
                    <div className="bg-muted/50 border border-primary-300 rounded-lg p-4">
                        <P className="mb-2">
                            Descarcă template
                        </P>
                        <P className="[&:not(:first-child)]:mt-3 mb-3 text-sm text-muted-foreground">
                            Descarcă un fișier template CSV cu coloanele necesare pentru import
                        </P>
                        <Button
                            variant="outline"
                            size="S"
                            onClick={handleDownloadTemplate}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Descarcă Template CSV
                        </Button>
                    </div>

                    {/* File upload section */}
                    <div className="space-y-2">
                        <H4 className="text-base mt-4">Selectează fișier</H4>
                        <P className="text-muted-foreground text-sm [&:not(:first-child)]:mt-2">
                            Încarcă un fișier CSV sau XLSX cu datele pentru import
                        </P>
                        <div className="border border-primary-300 rounded-lg p-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-muted-foreground
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-primary-200 file:text-primary-foreground
                                hover:file:bg-primary-300
                                cursor-pointer"
                            />
                        </div>
                        {file && (
                            <P className="text-muted-foreground">
                                Fișier selectat: {file.name}
                            </P>
                        )}
                    </div>

                    {/* Results section */}
                    {result && (
                        <div className={`border rounded-lg p-4 ${result.success
                            ? "bg-success-100 border-success-400"
                            : "bg-fail-200 border-fail-400"
                            }`}>
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-fail-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 space-y-2 ">
                                    <P className={
                                        result.success ? "text-success-400" : "text-fail-400"
                                    }>
                                        {result.success ? "Import finalizat cu succes!" : "Import finalizat cu erori"}
                                    </P>
                                    <div className={`text-sm space-y-1 ${result.success ? "text-success-600" : "text-fail-600"}`}>
                                        <p className="text-muted-foreground">
                                            <span className="bg-primary-1200 text-primary-100 px-2 py-1 rounded-md mr-2">
                                                Total: {result.total}
                                            </span>
                                            <span className="bg-success-100 text-success-400 px-2 py-1 rounded-md mr-2">
                                                Succes: {result.successful}
                                            </span>
                                            <span className="bg-fail-100 text-fail-400 px-2 py-1 rounded-md mr-2">
                                                Eșuate: {result.failed}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Show errors */}
                                    {result.errors.length > 0 && (
                                        <div className="mt-3 max-h-48 overflow-y-auto">
                                            <P className={`font-medium mb-2 ${result.success ? "text-success-600" : "text-fail-600"}`}>
                                                Erori:
                                            </P>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                {result.errors.slice(0, 10).map((error, index) => (
                                                    <li key={index} className="text-red-700">
                                                        {error.email && `${error.email}: `}
                                                        Rând {error.row}: {error.message}
                                                    </li>
                                                ))}
                                                {result.errors.length > 10 && (
                                                    <li className="text-muted-foreground italic">
                                                        ...și încă {result.errors.length - 10} erori
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    {result ? (
                        <>
                            <Button variant="outline" onClick={handleReset}>
                                Import nou
                            </Button>
                            <Button onClick={handleClose}>
                                Închide
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Anulează
                            </Button>
                            <Button
                                variant="brand"
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Spinner className="w-4 h-4" />
                                        Se importă...
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="w-4 h-4" />
                                        Începe importul
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
