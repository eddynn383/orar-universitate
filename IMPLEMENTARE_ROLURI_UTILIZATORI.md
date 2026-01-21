# Implementare Sistem de Roluri și Gestionare Utilizatori

## Rezumat

Acest document descrie implementarea completă a sistemului de gestionare a utilizatorilor cu roluri diferite (Studenți, Profesori, Secretari, Administratori) folosind Prisma ORM.

## 📋 Cuprins

1. [Schema Prisma](#schema-prisma)
2. [Câmpuri Propuse pentru Fiecare Rol](#câmpuri-propuse-pentru-fiecare-rol)
3. [Funcționalitate Cross-Table](#funcționalitate-cross-table)
4. [Acțiuni Server](#acțiuni-server)
5. [Rulare Migrare](#rulare-migrare)
6. [Funcționalitate Import](#funcționalitate-import)

---

## Schema Prisma

### Modele Actualizate

#### 1. User (modelul de bază)

```prisma
model User {
    id            String    @id @default(cuid())
    name          String?
    email         String?   @unique
    emailVerified DateTime? @map("email_verified")
    password      String
    role          UserRole  @default(USER)
    image         String?

    // Legăturile cu profilurile specifice rolurilor
    teacherProfile   Teacher?   @relation("UserAsTeacher")
    studentProfile   Student?   @relation("UserAsStudent")
    secretaryProfile Secretary? @relation("UserAsSecretary")
    adminProfile     Admin?     @relation("UserAsAdmin")

    // ... alte relații
}

enum UserRole {
    ADMIN
    SECRETAR
    PROFESOR
    STUDENT
    USER
}
```

#### 2. Teacher (Profesori)

```prisma
model Teacher {
    id          String       @id @default(cuid())
    firstname   String
    lastname    String
    image       String?
    email       String
    phone       String?

    // Informații academice
    title     String? // Titlu academic (e.g., "Dr.", "Prof. Dr.", "Conf. Dr.")
    grade     String? // Grad didactic (e.g., "Profesor Universitar", "Conferențiar", "Lector")
    education String? @db.Text // Studii complete

    // Legătura cu User
    user   User?   @relation("UserAsTeacher", fields: [userId], references: [id], onDelete: Cascade)
    userId String? @unique

    // ... audit trail și timestamps
}
```

#### 3. Student (Studenți)

```prisma
model Student {
    id        String  @id @default(cuid())
    firstname String
    lastname  String
    image     String?
    email     String  @unique
    publicId  String  @unique

    // Date personale
    sex           Sex
    cnpEncrypted  String        // CNP criptat cu AES-256-CBC
    birthDate     DateTime
    birthPlace    String
    ethnicity     String?
    religion      String?
    citizenship   String        @default("Română")
    maritalStatus MaritalStatus @default(NECASATORIT)  // ENUM: NECASATORIT, CASATORIT, DIVORTAT, VADUV

    // Situație socială
    socialSituation        String?
    isOrphan               Boolean @default(false)
    needsSpecialConditions Boolean @default(false)

    // Familie - câmpuri separate pentru fiecare părinte
    motherFirstname String? // Prenume mamă
    motherLastname  String? // Nume mamă
    fatherFirstname String? // Prenume tată
    fatherLastname  String? // Nume tată

    // Adresă
    residentialAddress String?

    // Informații medicale
    specialMedicalCondition String?
    disability              Disability @default(NONE)

    // Legătura cu User
    user   User?   @relation("UserAsStudent", fields: [userId], references: [id], onDelete: Cascade)
    userId String? @unique

    // ... alte relații
}

enum MaritalStatus {
    NECASATORIT // Necăsătorit/ă
    CASATORIT   // Căsătorit/ă
    DIVORTAT    // Divorțat/ă
    VADUV       // Văduv/ă
}

enum Sex {
    MASCULIN
    FEMININ
}

enum Disability {
    NONE
    GRAD_1
    GRAD_2
}
```

#### 4. Secretary (Secretari/Secretare) - **NOU**

```prisma
model Secretary {
    id        String  @id @default(cuid())
    firstname String
    lastname  String
    image     String?
    email     String  @unique
    phone     String?

    // Informații specifice secretarului/secretarei
    department       String? // Departament (e.g., "Secretariat Studenți", "Secretariat Didactic")
    office           String? // Biroul/camera (e.g., "A101", "Corp C, et. 2")
    officePhone      String? // Telefon birou
    workSchedule     String? // Program de lucru (e.g., "Luni-Vineri: 08:00-16:00")
    responsibilities String? @db.Text // Responsabilități/sarcini

    // Legătura cu User
    user   User?   @relation("UserAsSecretary", fields: [userId], references: [id], onDelete: Cascade)
    userId String? @unique

    // ... audit trail și timestamps
}
```

#### 5. Admin (Administratori) - **NOU**

```prisma
model Admin {
    id        String  @id @default(cuid())
    firstname String
    lastname  String
    image     String?
    email     String  @unique
    phone     String?

    // Informații specifice administratorului
    department       String? // Departament (e.g., "IT", "Resurse Umane", "Academic")
    adminRole        String? // Rol specific (e.g., "Administrator IT", "Administrator Academic")
    officePhone      String? // Telefon birou
    responsibilities String? @db.Text // Responsabilități principale
    accessLevel      Int     @default(1) // Nivel de acces (1-5, 5 = acces complet)

    // Legătura cu User
    user   User?   @relation("UserAsAdmin", fields: [userId], references: [id], onDelete: Cascade)
    userId String? @unique

    // ... audit trail și timestamps
}
```

---

## Câmpuri Propuse pentru Fiecare Rol

### 👨‍🏫 Profesori (Teacher)

| Câmp | Tip | Descriere | Exemple |
|------|-----|-----------|---------|
| **firstname** | String | Prenumele | "Ion" |
| **lastname** | String | Numele de familie | "Popescu" |
| **email** | String | Email institutional | "ion.popescu@univ.ro" |
| **phone** | String? | Telefon personal | "+40712345678" |
| **image** | String? | URL imagine profil | - |
| **title** | String? | Titlu academic | "Dr.", "Prof. Dr.", "Conf. Dr." |
| **grade** | String? | Grad didactic | "Profesor Universitar", "Conferențiar", "Lector", "Asistent Universitar" |
| **education** | String? | Studii complete | "Doctorat în Informatică - Universitatea București, 2015<br>Master în Inteligență Artificială - UPB, 2010<br>Licență în Calculatoare - UPB, 2008" |

**Materii predate**: Gestionate automat prin relația cu modelul `Discipline`

### 👨‍🎓 Studenți (Student)

Toate câmpurile există deja în schema actuală:

| Categorie | Câmpuri |
|-----------|---------|
| **Identificare** | firstname, lastname, email, publicId (cod public pentru GDPR) |
| **Date personale** | sex, CNP (criptat), dată naștere, loc naștere, etnie, religie, cetățenie, stare civilă |
| **Situație socială** | situație socială, este orfan?, nevoi speciale? |
| **Familie** | nume părinți |
| **Adresă** | adresă rezidențială |
| **Informații medicale** | condiții medicale speciale, grad dizabilitate |
| **Academic** | grupă (relație cu Group) |

### 👔 Secretari/Secretare (Secretary)

| Câmp | Tip | Descriere | Exemple |
|------|-----|-----------|---------|
| **firstname** | String | Prenumele | "Maria" |
| **lastname** | String | Numele de familie | "Ionescu" |
| **email** | String | Email institutional | "maria.ionescu@univ.ro" |
| **phone** | String? | Telefon personal | "+40712345678" |
| **image** | String? | URL imagine profil | - |
| **department** | String? | Departamentul | "Secretariat Studenți", "Secretariat Didactic", "Secretariat Facultate" |
| **office** | String? | Biroul/camera | "A101", "Corp C, et. 2", "Sala Secretariat" |
| **officePhone** | String? | Telefon birou | "+40213141516" |
| **workSchedule** | String? | Program de lucru | "Luni-Vineri: 08:00-16:00", "L-J: 8-16, V: 8-14" |
| **responsibilities** | String? | Responsabilități | "Gestionare documente studenți<br>Eliberare adeverințe<br>Programare examene<br>Relații cu studenții" |

### 🔧 Administratori (Admin)

| Câmp | Tip | Descriere | Exemple |
|------|-----|-----------|---------|
| **firstname** | String | Prenumele | "Alexandru" |
| **lastname** | String | Numele de familie | "Vasilescu" |
| **email** | String | Email institutional | "alex.vasilescu@univ.ro" |
| **phone** | String? | Telefon personal | "+40712345678" |
| **image** | String? | URL imagine profil | - |
| **department** | String? | Departament | "IT", "Resurse Umane", "Academic", "Financiar", "Infrastructură" |
| **adminRole** | String? | Rol specific | "Administrator IT", "Administrator Academic", "Administrator Sistem", "Administrator Baze de Date", "Administrator Rețea" |
| **officePhone** | String? | Telefon birou | "+40213141517" |
| **responsibilities** | String? | Responsabilități | "Administrare servere<br>Backup baze de date<br>Suport tehnic utilizatori<br>Mentenanță infrastructură IT" |
| **accessLevel** | Int | Nivel de acces (1-5) | 1 = Acces limitat<br>3 = Acces mediu<br>5 = Acces complet (super admin) |

---

## Funcționalitate Cross-Table

### Comportament la Creare

#### 1. Crearea unui User → Creează automat profilul specific

Când creezi un **User** cu un anumit rol (în `/utilizatori`):
- ✅ Se creează automat un entry în tabelul specific (Teacher, Student, Secretary, sau Admin)
- ✅ Profilul conține doar informațiile de bază (nume, email, imagine)
- ✅ Câmpurile specifice rămân NULL și pot fi completate mai târziu

**Exemplu:**
```typescript
// Creăm un User cu rol PROFESOR
await prisma.user.create({
    data: {
        name: "Ion Popescu",
        email: "ion.popescu@univ.ro",
        role: "PROFESOR",
        password: hashedPassword,
        image: null,
    }
})

// Automat se creează și:
await prisma.teacher.create({
    data: {
        firstname: "Ion",
        lastname: "Popescu",
        email: "ion.popescu@univ.ro",
        userId: user.id, // Legătura cu User-ul creat
        title: null,     // Poate fi completat ulterior în /cadre
        grade: null,     // Poate fi completat ulterior în /cadre
        education: null, // Poate fi completat ulterior în /cadre
    }
})
```

#### 2. Crearea unui Student/Teacher/Secretary/Admin → Creează automat User

Când creezi direct un **Student** (în `/studenti`), **Teacher** (în `/cadre`), **Secretary** (în `/secretari`), sau **Admin** (în `/administratori`):

- ✅ **Dacă există deja un User cu același email:**
  - Verifică dacă are rolul corect
  - Asociază profilul nou cu User-ul existent

- ✅ **Dacă NU există User cu acest email:**
  - Creează automat un User nou cu rolul corespunzător
  - Generează o parolă temporară aleatorie
  - Asociază profilul cu User-ul nou creat

**Exemplu:**
```typescript
// Creăm un Student direct în /studenti
await prisma.student.create({
    data: {
        firstname: "Ana",
        lastname: "Ionescu",
        email: "ana.ionescu@student.univ.ro",
        publicId: "STD-ABC123",
        sex: "FEMININ",
        cnpEncrypted: "...",
        birthDate: new Date("2002-05-15"),
        birthPlace: "București",
        // ... alte câmpuri specifice studentului
    }
})

// Dacă NU există User cu email "ana.ionescu@student.univ.ro", se creează automat:
await prisma.user.create({
    data: {
        name: "Ana Ionescu",
        email: "ana.ionescu@student.univ.ro",
        role: "STUDENT",
        password: hashedPassword, // Parolă temporară generată
        image: null,
    }
})
```

### Comportament la Actualizare

#### Schimbarea rolului unui User

Când **schimbi rolul** unui User:
- ✅ Se șterge profilul vechi asociat cu rolul anterior
- ✅ Se creează un profil nou corespunzător noului rol
- ✅ Datele de bază (nume, email, imagine) sunt sincronizate

**Exemplu:**
```typescript
// Schimbăm rolul unui User din STUDENT în PROFESOR
// 1. Se șterge profilul de Student
await prisma.student.delete({ where: { userId: user.id } })

// 2. Se creează profil de Teacher
await prisma.teacher.create({
    data: {
        firstname: "Ana",
        lastname: "Ionescu",
        email: "ana.ionescu@univ.ro",
        userId: user.id,
        title: null,
        grade: null,
        education: null,
    }
})
```

### Comportament la Ștergere

Când ștergi un **User**:
- ✅ Profilurile asociate (Teacher, Student, Secretary, Admin) sunt șterse automat prin `onDelete: Cascade`
- ✅ Nu rămân date orfane în baza de date

---

## Acțiuni Server

Toate acțiunile server au fost create/actualizate pentru a suporta funcționalitatea cross-table:

### Fișiere create/modificate:

- ✅ `/actions/user.ts` - Actualizat pentru SECRETAR și ADMIN
- ✅ `/actions/student.ts` - Actualizat pentru creare automată User
- ✅ `/actions/teacher.ts` - Actualizat pentru creare automată User
- ✅ `/actions/secretary.ts` - **NOU** - Creare, actualizare, ștergere secretari
- ✅ `/actions/admin.ts` - **NOU** - Creare, actualizare, ștergere administratori

### Fișiere schema create/modificate:

- ✅ `/schemas/teacher.ts` - Actualizat cu câmpul `education`
- ✅ `/schemas/secretary.ts` - **NOU** - Validare pentru secretari
- ✅ `/schemas/admin.ts` - **NOU** - Validare pentru administratori

---

## Rulare Migrare

### Pasul 1: Configurează DATABASE_URL

Asigură-te că ai configurat variabila de mediu `DATABASE_URL` în fișierul `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/orar_universitate"
```

### Pasul 2: Generează migrarea

```bash
npx prisma migrate dev --name add_secretary_admin_and_update_teacher
```

Această comandă va:
1. Genera migrarea SQL bazată pe modificările din `schema.prisma`
2. Aplica migrarea pe baza de date
3. Regenera Prisma Client

### Pasul 3: Verifică migrarea

```bash
npx prisma studio
```

Deschide Prisma Studio pentru a verifica că noile tabele (`secretaries` și `admins`) au fost create corect.

---

## Funcționalitate Import

### Structură Propusă

Pentru fiecare pagină (`/studenti`, `/cadre`, `/secretari`, `/administratori`), funcționalitatea de import ar trebui să includă:

#### 1. Componentă UI pentru Import

```typescript
// app/[entitate]/_components/ImportModal/index.tsx
interface ImportModalProps {
    onImportComplete: () => void
}

export function ImportModal({ onImportComplete }: ImportModalProps) {
    // 1. Upload fișier (CSV/Excel)
    // 2. Mapare coloane (matching câmpuri CSV cu câmpuri model)
    // 3. Preview date (afișare primele 5 rânduri)
    // 4. Validare în masă
    // 5. Confirmare și import
    // 6. Raportare rezultate (succese/eșecuri)
}
```

#### 2. API Endpoint pentru Import

```typescript
// app/api/[entitate]/import/route.ts
export async function POST(request: Request) {
    // 1. Parsare fișier CSV/Excel
    // 2. Validare date (folosind schemas Zod)
    // 3. Procesare în batch-uri (pentru performanță)
    // 4. Creare entități + utilizatori asociați
    // 5. Returnare raport (succese, eșecuri, warnings)
}
```

#### 3. Format CSV/Excel așteptat

##### Pentru Studenți (`/studenti`):

```csv
firstname,lastname,email,sex,cnp,birthDate,birthPlace,groupId
Ana,Popescu,ana.popescu@student.ro,FEMININ,2990101123456,1999-01-01,București,group-id-1
Ion,Ionescu,ion.ionescu@student.ro,MASCULIN,1980202234567,1998-02-02,Cluj-Napoca,group-id-1
```

##### Pentru Profesori (`/cadre`):

```csv
firstname,lastname,email,phone,title,grade,education
Ion,Popescu,ion.popescu@univ.ro,+40712345678,Dr.,Profesor Universitar,"Doctorat în Informatică - UB, 2015"
Maria,Ionescu,maria.ionescu@univ.ro,+40723456789,Prof. Dr.,Conferențiar,"Doctorat în Matematică - UPB, 2012"
```

##### Pentru Secretari (`/secretari`):

```csv
firstname,lastname,email,phone,department,office,officePhone,workSchedule
Elena,Vasilescu,elena.vasilescu@univ.ro,+40734567890,Secretariat Studenți,A101,+40213141516,L-V: 8:00-16:00
```

##### Pentru Administratori (`/administratori`):

```csv
firstname,lastname,email,phone,department,adminRole,accessLevel
Alexandru,Popescu,alex.popescu@univ.ro,+40745678901,IT,Administrator IT,5
```

#### 4. Procesare și Validare

```typescript
// lib/import.ts
export async function importEntities(
    type: 'student' | 'teacher' | 'secretary' | 'admin',
    data: any[],
    userId: string // Pentru audit trail
) {
    const results = {
        success: [] as string[],
        errors: [] as { row: number; message: string }[]
    }

    for (const [index, row] of data.entries()) {
        try {
            // 1. Validare cu Zod schema
            const validated = schema.parse(row)

            // 2. Verificare duplicate (email)
            const existing = await checkExisting(validated.email)

            if (existing) {
                results.errors.push({
                    row: index + 1,
                    message: `Email ${validated.email} există deja`
                })
                continue
            }

            // 3. Creare entitate + User automat
            await createEntity(type, validated, userId)

            results.success.push(validated.email)
        } catch (error) {
            results.errors.push({
                row: index + 1,
                message: error.message
            })
        }
    }

    return results
}
```

#### 5. Buton Import în UI

Pe fiecare pagină (`/studenti`, `/cadre`, `/secretari`, `/administratori`), adaugă un buton de import:

```typescript
// app/studenti/page.tsx
export default function StudentiPage() {
    return (
        <div>
            <div className="flex justify-between">
                <h1>Studenți</h1>
                <div className="flex gap-2">
                    <ImportButton entity="student" />
                    <AddStudentButton />
                </div>
            </div>
            {/* Lista studenți */}
        </div>
    )
}
```

---

## Pași Următori

### 1. Rulează migrarea

```bash
npx prisma migrate dev --name add_secretary_admin_and_update_teacher
```

### 2. Creează paginile pentru Secretari și Administratori

- `/app/secretari/page.tsx` - Lista secretari
- `/app/administratori/page.tsx` - Lista administratori

Folosește ca model paginile existente `/app/studenti/page.tsx` și `/app/cadre/page.tsx`.

### 3. Creează componentele de formular

- `/app/secretari/_components/SecretaryForm/index.tsx`
- `/app/administratori/_components/AdminForm/index.tsx`

### 4. Utilizează funcționalitatea de import

✅ **Funcționalitatea de import este complet implementată!**

Pentru a adăuga buton de import pe orice pagină:

```tsx
import { ImportModal } from "@/components/ImportModal"

// Exemplu pentru studenți
<ImportModal
    title="Importă Studenți"
    description="Încarcă un fișier CSV sau XLSX cu datele studenților"
    entityType="students"
    templateColumns={[
        { key: "firstname", label: "Prenume", example: "Ion" },
        { key: "lastname", label: "Nume", example: "Popescu" },
        { key: "email", label: "Email", example: "ion.popescu@student.ro" },
        { key: "sex", label: "Sex", example: "MASCULIN" },
        { key: "cnp", label: "CNP", example: "1990101123456" },
        { key: "birthDate", label: "Data Nașterii", example: "1999-01-01" },
        { key: "birthPlace", label: "Locul Nașterii", example: "București" },
        { key: "citizenship", label: "Cetățenie", example: "Română" },
        { key: "maritalStatus", label: "Stare Civilă", example: "NECASATORIT" },
        { key: "motherFirstname", label: "Prenume Mamă", example: "Maria" },
        { key: "motherLastname", label: "Nume Mamă", example: "Popescu" },
        { key: "fatherFirstname", label: "Prenume Tată", example: "Gheorghe" },
        { key: "fatherLastname", label: "Nume Tată", example: "Popescu" },
        { key: "isOrphan", label: "Orfan?", example: "false" },
        { key: "needsSpecialConditions", label: "Nevoi Speciale?", example: "false" },
        { key: "disability", label: "Dizabilitate", example: "NONE" },
    ]}
    onImportComplete={() => {
        // Refresh lista
        router.refresh()
    }}
/>
```

**Fișiere implementate:**
- ✅ `/lib/import.ts` - Biblioteca de parsare CSV/XLSX
- ✅ `/actions/import.ts` - Server actions pentru import (importStudents, importTeachers, importSecretaries, importAdmins)
- ✅ `/app/api/students/import/route.ts` - API endpoint pentru import studenți
- ✅ `/app/api/teachers/import/route.ts` - API endpoint pentru import profesori
- ✅ `/app/api/secretaries/import/route.ts` - API endpoint pentru import secretari
- ✅ `/app/api/admins/import/route.ts` - API endpoint pentru import administratori
- ✅ `/components/ImportModal/index.tsx` - Componentă UI pentru import

**Caracteristici:**
- 📄 Suport pentru CSV și XLSX
- 📥 Download template CSV
- ✅ Validare automată cu Zod
- 🔄 Creare automată User pentru fiecare entitate importată
- 📊 Raportare detaliată (succese, eșecuri, erori)
- 🎨 UI modern cu Dialog, progress și results

### 5. Testare

- Testează crearea cross-table (User → Student, Student → User, etc.)
- Testează import în masă pentru toate entitățile
- Verifică sincronizarea datelor la actualizare

---

## Observații Importante

1. **Securitate CNP**: CNP-urile sunt criptate automat folosind AES-256-CBC (funcția `encryptCNP`)
2. **Public ID pentru studenți**: Fiecare student primește un cod public unic (format: STD-XXXXXX) pentru afișare publică note (GDPR compliant)
3. **Parole temporare**: La crearea automată a User-ilor, se generează parole temporare aleatorii. Utilizatorii trebuie să le schimbe la prima autentificare.
4. **Audit Trail**: Toate modelele au câmpuri `createdBy`, `updatedBy`, `createdAt`, `updatedAt` pentru urmărirea modificărilor
5. **Cascade Delete**: La ștergerea unui User, profilurile asociate sunt șterse automat pentru a evita date orfane

---

## Suport

Pentru întrebări sau probleme, verifică:
- Schema Prisma: `/prisma/schema.prisma`
- Acțiuni server: `/actions/`
- Schemes de validare: `/schemas/`

---

**Data ultimei actualizări**: 2026-01-21
**Versiune**: 2.0 - Actualizat cu:
- Câmpuri separate pentru părinți (motherFirstname, motherLastname, fatherFirstname, fatherLastname)
- Enum MaritalStatus pentru stare civilă (NECASATORIT, CASATORIT, DIVORTAT, VADUV)
- Funcționalitate completă de import CSV/XLSX pentru toate entitățile
- Componentă UI ImportModal reutilizabilă
