import crypto from "crypto"

// Cheia de criptare trebuie să fie de 32 bytes pentru AES-256
// În producție, aceasta trebuie să fie într-o variabilă de mediu
const ENCRYPTION_KEY = process.env.CNP_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex").slice(0, 32)
const ALGORITHM = "aes-256-cbc"
const IV_LENGTH = 16 // Pentru AES, IV-ul este întotdeauna de 16 bytes

/**
 * Criptează un CNP folosind AES-256-CBC
 * @param cnp - CNP-ul în format text clar
 * @returns CNP criptat în format hex (IV:encryptedData)
 */
export function encryptCNP(cnp: string): string {
    if (!cnp) {
        throw new Error("CNP-ul nu poate fi gol")
    }

    // Generăm un IV aleatoriu pentru fiecare criptare
    const iv = crypto.randomBytes(IV_LENGTH)

    // Creăm cipher-ul
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)

    // Criptăm datele
    let encrypted = cipher.update(cnp, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Returnăm IV-ul concatenat cu datele criptate (separate prin :)
    return `${iv.toString("hex")}:${encrypted}`
}

/**
 * Decriptează un CNP criptat
 * @param encryptedCNP - CNP criptat în format hex (IV:encryptedData)
 * @returns CNP decriptat în format text clar
 */
export function decryptCNP(encryptedCNP: string): string {
    if (!encryptedCNP) {
        throw new Error("CNP-ul criptat nu poate fi gol")
    }

    // Separăm IV-ul de datele criptate
    const parts = encryptedCNP.split(":")

    if (parts.length !== 2) {
        throw new Error("Format invalid de CNP criptat")
    }

    const iv = Buffer.from(parts[0], "hex")
    const encryptedData = parts[1]

    // Creăm decipher-ul
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)

    // Decriptăm datele
    let decrypted = decipher.update(encryptedData, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
}

/**
 * Cenzurează un CNP pentru afișare
 * Arată doar primele și ultimele 2 cifre, restul sunt înlocuite cu *
 * Ex: 1234567890123 -> 12*********23
 * @param cnp - CNP-ul în format text clar
 * @returns CNP cenzurat
 */
export function censorCNP(cnp: string): string {
    if (!cnp || cnp.length < 4) {
        return "***"
    }

    const firstTwo = cnp.substring(0, 2)
    const lastTwo = cnp.substring(cnp.length - 2)
    const middleLength = cnp.length - 4
    const stars = "*".repeat(middleLength)

    return `${firstTwo}${stars}${lastTwo}`
}

/**
 * Validează formatul unui CNP românesc
 * @param cnp - CNP-ul de validat
 * @returns true dacă CNP-ul este valid, altfel false
 */
export function validateCNP(cnp: string): boolean {
    // CNP-ul românesc are 13 cifre
    if (!cnp || cnp.length !== 13) {
        return false
    }

    // Verificăm dacă conține doar cifre
    if (!/^\d{13}$/.test(cnp)) {
        return false
    }

    // Validare avansată cu algoritm de checksum
    const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]
    const digits = cnp.split("").map(Number)

    let sum = 0
    for (let i = 0; i < 12; i++) {
        sum += digits[i] * weights[i]
    }

    let checkDigit = sum % 11
    if (checkDigit === 10) {
        checkDigit = 1
    }

    return checkDigit === digits[12]
}

/**
 * Generează un cod de identificare public unic pentru student
 * Format: STD-XXXXXX (6 caractere aleatorii alfanumerice)
 * @returns Cod de identificare public
 */
export function generatePublicStudentId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = "STD-"

    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
}
