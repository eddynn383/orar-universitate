"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import { Upload, Download, AlertCircle, CheckCircle, FileText } from "lucide-react"
import { useState } from "react"

export function ImportStudentsForm() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setResult(null)
            setError(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            setError("Te rog selectează un fișier")
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/students/import", {
                method: "POST",
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Eroare la importul fișierului")
            }

            setResult(data)
            setFile(null)

            // Reset input
            const fileInput = document.getElementById("file-input") as HTMLInputElement
            if (fileInput) fileInput.value = ""

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const csvContent = `firstname,lastname,email,publicId,sex,cnp,birthDate,birthPlace,groupName
Ion,Popescu,ion.popescu@student.ro,STD001,MASCULIN,1234567890123,2000-01-15,București,A1
Maria,Ionescu,maria.ionescu@student.ro,STD002,FEMININ,2345678901234,2001-03-20,Cluj-Napoca,A2
Andrei,Georgescu,andrei.georgescu@student.ro,STD003,MASCULIN,3456789012345,2000-11-10,Timișoara,B1`

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "template_import_studenti.csv"
        link.click()
    }

    return (
        <div className="space-y-6">
            {/* Instructions Card */}
            <Card className="bg-primary-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="size-5 text-brand-400" />
                        Instrucțiuni
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Format acceptat:</h3>
                        <p className="text-sm text-primary-600 mb-2">
                            Fișierul trebuie să fie în format CSV, XLS sau XLSX cu următoarele coloane:
                        </p>
                        <ul className="text-sm text-primary-600 space-y-1 ml-4">
                            <li>• <strong>firstname</strong> (obligatoriu) - Prenumele studentului</li>
                            <li>• <strong>lastname</strong> (obligatoriu) - Numele de familie</li>
                            <li>• <strong>email</strong> (obligatoriu) - Adresa de email</li>
                            <li>• <strong>publicId</strong> (obligatoriu) - ID public unic (ex: STD001)</li>
                            <li>• <strong>sex</strong> (obligatoriu) - MASCULIN sau FEMININ</li>
                            <li>• <strong>cnp</strong> (opțional) - CNP-ul studentului</li>
                            <li>• <strong>birthDate</strong> (opțional) - Data nașterii (format: YYYY-MM-DD)</li>
                            <li>• <strong>birthPlace</strong> (opțional) - Locul nașterii</li>
                            <li>• <strong>groupName</strong> (opțional) - Numele grupei (trebuie să existe în sistem)</li>
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-primary-200">
                        <h3 className="font-semibold mb-2">Note importante:</h3>
                        <ul className="text-sm text-primary-600 space-y-1 ml-4">
                            <li>• Toți studenții importați vor primi parola default: <strong>Student123!</strong></li>
                            <li>• Email-ul și publicId-ul trebuie să fie unice</li>
                            <li>• Grupa trebuie să existe în sistem înainte de import</li>
                            <li>• CNP-ul va fi criptat automat în baza de date</li>
                        </ul>
                    </div>

                    <Button
                        variant="outline"
                        size="M"
                        onClick={downloadTemplate}
                        className="gap-2"
                    >
                        <Download className="size-4" />
                        Descarcă fișier template
                    </Button>
                </CardContent>
            </Card>

            {/* Upload Form */}
            <Card className="bg-primary-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Upload className="size-5 text-brand-400" />
                        Încarcă fișier
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="file-input"
                                className="block text-sm font-medium text-primary-900 mb-2"
                            >
                                Selectează fișier CSV sau Excel
                            </label>
                            <input
                                id="file-input"
                                type="file"
                                accept=".csv,.xls,.xlsx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-primary-600
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-brand-400 file:text-white
                                    hover:file:bg-brand-500
                                    file:cursor-pointer cursor-pointer"
                            />
                            {file && (
                                <p className="text-sm text-primary-600 mt-2">
                                    Fișier selectat: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="filled"
                            size="L"
                            disabled={!file || loading}
                            className="w-full gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Se procesează...
                                </>
                            ) : (
                                <>
                                    <Upload className="size-4" />
                                    Importă Studenți
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-1">Eroare</h3>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Success Result */}
            {result && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-900 mb-1">
                                    Import realizat cu succes!
                                </h3>
                                <p className="text-sm text-green-700 mb-3">
                                    {result.message}
                                </p>

                                {result.results && (
                                    <div className="text-sm space-y-2">
                                        <div className="flex gap-4">
                                            <span className="text-green-700">
                                                ✓ Succes: <strong>{result.results.success}</strong>
                                            </span>
                                            {result.results.failed > 0 && (
                                                <span className="text-red-700">
                                                    ✗ Eșuați: <strong>{result.results.failed}</strong>
                                                </span>
                                            )}
                                        </div>

                                        {result.results.errors && result.results.errors.length > 0 && (
                                            <div className="mt-3 p-3 bg-white rounded border border-red-200">
                                                <h4 className="font-semibold text-red-900 mb-2 text-sm">
                                                    Erori ({result.results.errors.length}):
                                                </h4>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {result.results.errors.map((err: any, idx: number) => (
                                                        <div key={idx} className="text-xs text-red-700">
                                                            Rând {err.row} ({err.email}): {err.error}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
