import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ImportResult {
    success: boolean
    total: number
    successful: number
    failed: number
    errors: Array<{
        row: number
        email?: string
        message: string
        details?: any
    }>
}

/**
 * Parsează un fișier CSV și returnează datele ca array de obiecte
 * Funcționează atât pe client cât și pe server
 */
export async function parseCSV(file: File): Promise<any[]> {
    const text = await file.text()

    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                resolve(results.data as any[])
            },
            error: (error: Error) => {
                reject(new Error(`Eroare la parsarea CSV: ${error.message}`))
            }
        })
    })
}

/**
 * Parsează un fișier Excel (XLSX) și returnează datele ca array de obiecte
 * Funcționează atât pe client cât și pe server
 */
export async function parseExcel(file: File): Promise<any[]> {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)

        const workbook = XLSX.read(data, { type: 'array' })

        // Citește prima foaie de calcul
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convertește în JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Păstrează datele ca string
            defval: '', // Valoare default pentru celule goale
        })

        return jsonData as any[]
    } catch (error) {
        throw new Error(`Eroare la parsarea Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Detectează tipul fișierului și parsează corespunzător
 */
export async function parseFile(file: File): Promise<any[]> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'csv') {
        return parseCSV(file)
    } else if (extension === 'xlsx' || extension === 'xls') {
        return parseExcel(file)
    } else {
        throw new Error('Tip de fișier nesuportat. Folosește CSV sau XLSX.')
    }
}

/**
 * Validează că toate coloanele necesare sunt prezente
 */
export function validateColumns(data: any[], requiredColumns: string[]): { valid: boolean; missing: string[] } {
    if (data.length === 0) {
        return { valid: false, missing: requiredColumns }
    }

    const columns = Object.keys(data[0])
    const missing = requiredColumns.filter(col => !columns.includes(col))

    return {
        valid: missing.length === 0,
        missing
    }
}

/**
 * Mapează headerele din label la key
 * Ex: "Prenume" -> "firstname"
 */
export function mapHeadersToKeys(
    data: any[],
    columnMapping: Array<{ key: string; label: string }>
): any[] {
    // Creăm un map de la label la key
    const labelToKey: Record<string, string> = {}
    columnMapping.forEach(col => {
        labelToKey[col.label.toLowerCase()] = col.key
    })

    return data.map(row => {
        const mapped: any = {}

        for (const [header, value] of Object.entries(row)) {
            const normalizedHeader = header.trim().toLowerCase()
            // Verificăm dacă headerul este un label și îl mapăm la key
            const key = labelToKey[normalizedHeader] || header.trim()
            mapped[key] = value
        }

        return mapped
    })
}

/**
 * Curăță și normalizează datele din fișier
 */
export function cleanImportData(data: any[]): any[] {
    return data.map(row => {
        const cleaned: any = {}

        // Curăță fiecare valoare
        for (const [key, value] of Object.entries(row)) {
            // Elimină spațiile de la început și final
            const cleanedKey = key.trim()

            if (typeof value === 'string') {
                const cleanedValue = value.trim()
                cleaned[cleanedKey] = cleanedValue === '' ? undefined : cleanedValue
            } else {
                cleaned[cleanedKey] = value
            }
        }

        return cleaned
    })
}

/**
 * Convertește valorile boolean din string
 */
export function parseBooleanFields(data: any[], booleanFields: string[]): any[] {
    return data.map(row => {
        const parsed = { ...row }

        booleanFields.forEach(field => {
            if (field in parsed) {
                const value = parsed[field]
                if (typeof value === 'string') {
                    const lowercased = value.toLowerCase()
                    parsed[field] = lowercased === 'true' || lowercased === 'da' || lowercased === 'yes' || lowercased === '1'
                } else {
                    parsed[field] = Boolean(value)
                }
            }
        })

        return parsed
    })
}

/**
 * Procesează import în batch-uri pentru performanță
 */
export async function processBatch<T>(
    items: T[],
    batchSize: number,
    processFn: (item: T) => Promise<{ success: boolean; error?: string }>
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        total: items.length,
        successful: 0,
        failed: 0,
        errors: []
    }

    // Procesează în batch-uri
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)

        // Procesează toate itemurile din batch în paralel
        const results = await Promise.allSettled(
            batch.map(item => processFn(item))
        )

        // Procesează rezultatele
        results.forEach((res, index) => {
            const rowNumber = i + index + 1

            if (res.status === 'fulfilled' && res.value.success) {
                result.successful++
            } else {
                result.failed++
                result.errors.push({
                    row: rowNumber,
                    message: res.status === 'fulfilled'
                        ? res.value.error || 'Eroare necunoscută'
                        : res.reason?.message || 'Eroare necunoscută'
                })
            }
        })
    }

    result.success = result.failed === 0

    return result
}

/**
 * Generează un template CSV pentru import
 */
export function generateCSVTemplate(columns: Array<{ key: string; label: string; example?: string }>): string {
    // Header row
    const headers = columns.map(col => col.label).join(',')

    // Example row
    const examples = columns.map(col => col.example || '').join(',')

    return `${headers}\n${examples}`
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(
    filename: string,
    columns: Array<{ key: string; label: string; example?: string }>
): void {
    const csv = generateCSVTemplate(columns)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
