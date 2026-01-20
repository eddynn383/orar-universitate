/**
 * @fileoverview Utility functions for exporting schedule as PDF
 */

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface EventData {
    zi: string
    oraInceput: string
    oraSfarsit: string
    tipActivitate: string
    frecventa?: string | null
    profesor: string
    disciplina: string
    sala: string
    grupe: string
}

interface PDFMetadata {
    anUniversitar: string
    ciclu: string
    semestru: number | string
    an: number | string
    dataGenerare: string
}

/**
 * Translates day names from Romanian to display format
 */
const DAY_NAMES: Record<string, string> = {
    LUNI: "Luni",
    MARTI: "Marți",
    MIERCURI: "Miercuri",
    JOI: "Joi",
    VINERI: "Vineri",
    SAMBATA: "Sâmbătă",
    DUMINICA: "Duminică"
}

/**
 * Translates activity types
 */
const ACTIVITY_TYPES: Record<string, string> = {
    C: "Curs",
    S: "Seminar",
    L: "Laborator",
    P: "Proiect"
}

/**
 * Translates recurrence patterns
 */
const RECURRENCE_PATTERNS: Record<string, string> = {
    toate: "Săptămânal",
    para: "Săptămâni pare",
    impara: "Săptămâni impare"
}

/**
 * Groups events by day of the week
 */
function groupEventsByDay(events: EventData[]): Record<string, EventData[]> {
    const grouped: Record<string, EventData[]> = {}

    events.forEach(event => {
        if (!grouped[event.zi]) {
            grouped[event.zi] = []
        }
        grouped[event.zi].push(event)
    })

    return grouped
}

/**
 * Exports schedule data as PDF
 */
export async function exportScheduleToPDF(
    events: EventData[],
    metadata: PDFMetadata,
    filename: string = "orar.pdf"
) {
    // Create PDF document
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    })

    // Set document properties
    doc.setProperties({
        title: `Orar ${metadata.anUniversitar}`,
        subject: `Orar universitar - Semestrul ${metadata.semestru}`,
        author: "Sistem Orar Universitar",
        keywords: "orar, universitate, calendar",
        creator: "Sistem Orar Universitar"
    })

    // Title
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("ORAR UNIVERSITAR", 148.5, 15, { align: "center" })

    // Metadata
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    let yPos = 25
    doc.text(`An universitar: ${metadata.anUniversitar}`, 20, yPos)
    doc.text(`Ciclu: ${metadata.ciclu}`, 20, yPos + 6)
    doc.text(`An de studiu: ${metadata.an}`, 20, yPos + 12)
    doc.text(`Semestru: ${metadata.semestru}`, 120, yPos)
    doc.text(`Data generării: ${metadata.dataGenerare}`, 120, yPos + 6)

    // Group events by day
    const eventsByDay = groupEventsByDay(events)
    const days = ["LUNI", "MARTI", "MIERCURI", "JOI", "VINERI"]

    // Starting position for table
    yPos = 50

    // Create table for each day
    days.forEach((day, index) => {
        const dayEvents = eventsByDay[day] || []

        if (dayEvents.length === 0) {
            return // Skip days with no events
        }

        // Check if we need a new page
        if (yPos > 180) {
            doc.addPage()
            yPos = 20
        }

        // Day header
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text(DAY_NAMES[day], 20, yPos)

        // Prepare table data
        const tableData = dayEvents.map(event => [
            `${event.oraInceput} - ${event.oraSfarsit}`,
            ACTIVITY_TYPES[event.tipActivitate] || event.tipActivitate,
            event.disciplina,
            event.profesor,
            event.sala,
            event.grupe,
            event.frecventa ? RECURRENCE_PATTERNS[event.frecventa] || event.frecventa : "Săptămânal"
        ])

        // Create table
        autoTable(doc, {
            startY: yPos + 3,
            head: [[
                "Interval orar",
                "Tip",
                "Disciplină",
                "Profesor",
                "Sală",
                "Grupe",
                "Frecvență"
            ]],
            body: tableData,
            theme: "grid",
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: "linebreak"
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: "bold",
                halign: "center"
            },
            columnStyles: {
                0: { cellWidth: 28, halign: "center" }, // Interval orar
                1: { cellWidth: 18, halign: "center" }, // Tip
                2: { cellWidth: 50 },  // Disciplină
                3: { cellWidth: 45 },  // Profesor
                4: { cellWidth: 25, halign: "center" }, // Sală
                5: { cellWidth: 25, halign: "center" }, // Grupe
                6: { cellWidth: 30, halign: "center" }  // Frecvență
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: 20, right: 20 }
        })

        // @ts-ignore - autoTable adds finalY property
        yPos = doc.lastAutoTable.finalY + 10
    })

    // Add footer
    const pageCount = doc.getNumberOfPages()
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(
            `Pagina ${i} din ${pageCount}`,
            148.5,
            200,
            { align: "center" }
        )
    }

    // Save the PDF
    doc.save(filename)
}

/**
 * Fetches schedule data and exports it as PDF
 */
export async function fetchAndExportSchedule(filters: {
    anUniversitar?: string
    ciclu?: string
    semestru?: number
    an?: number
    grupa?: string
}) {
    try {
        // Build query string
        const queryParams = new URLSearchParams()

        if (filters.anUniversitar) queryParams.append("anUniversitar", filters.anUniversitar)
        if (filters.ciclu) queryParams.append("ciclu", filters.ciclu)
        if (filters.semestru) queryParams.append("semestru", filters.semestru.toString())
        if (filters.an) queryParams.append("an", filters.an.toString())
        if (filters.grupa) queryParams.append("grupa", filters.grupa)

        // Fetch data from API
        const response = await fetch(`/api/orar/export-pdf?${queryParams.toString()}`)

        if (!response.ok) {
            throw new Error("Failed to fetch schedule data")
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error("Failed to fetch schedule data")
        }

        // Generate filename
        const filename = `orar_${result.metadata.anUniversitar}_sem${result.metadata.semestru}_an${result.metadata.an}.pdf`

        // Export to PDF
        await exportScheduleToPDF(result.data, result.metadata, filename)

        return { success: true }
    } catch (error) {
        console.error("Error exporting schedule:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }
    }
}
