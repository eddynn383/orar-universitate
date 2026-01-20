"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/Button"
import { fetchAndExportSchedule } from "@/lib/pdf-export"

type ExportPDFButtonProps = {
    academicYear: string
    learningCycle: string
    semester: number
    studyYear: number
    selectedGroupId?: string
}

export function ExportPDFButton({
    academicYear,
    learningCycle,
    semester,
    studyYear,
    selectedGroupId
}: ExportPDFButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const result = await fetchAndExportSchedule({
                anUniversitar: academicYear,
                ciclu: learningCycle,
                semestru: semester,
                an: studyYear,
                grupa: selectedGroupId
            })

            if (!result.success) {
                alert(`Eroare la exportul PDF: ${result.error}`)
            }
        } catch (error) {
            console.error("Error exporting PDF:", error)
            alert("Eroare la exportul PDF")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            size="S"
            className="gap-2"
        >
            <Download className="h-4 w-4" />
            {isExporting ? "Se generează..." : "Descarcă PDF"}
        </Button>
    )
}
