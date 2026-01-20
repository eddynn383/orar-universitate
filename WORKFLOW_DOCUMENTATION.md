# Documentație Workflow Aprobare Calendar Academic

## Prezentare Generală

Acest document descrie implementarea sistemului de workflow cu aprobare pentru calendarul academic (orar), care permite:
- Gestionarea permisiunilor bazate pe rol (Administrator, Secretar, Profesor, Student)
- Workflow de aprobare pentru modificările orarului
- Vizibilitate controlată a evenimentelor
- Export PDF al orarului

---

## 1. Roluri și Permisiuni

### 1.1. Administrator (ADMIN)
**Permisiuni:**
- ✅ Creare evenimente → Status: `PUBLISHED` (publicare directă, fără aprobare)
- ✅ Editare orice eveniment
- ✅ Ștergere orice eveniment
- ✅ Vizualizare toate evenimentele (orice status)
- ✅ Aprobare/Respingere evenimente
- ✅ Publicare evenimente
- ✅ Export PDF orar

**Caracteristici speciale:**
- Bypass-uie complet workflow-ul de aprobare
- Evenimentele create sunt automat publicate și vizibile pentru toți

### 1.2. Secretar (SECRETAR)
**Permisiuni:**
- ✅ Creare evenimente → Status: `PENDING_APPROVAL` sau `PUBLISHED` (opțional)
- ✅ Editare orice eveniment
- ✅ Vizualizare toate evenimentele (orice status)
- ✅ **Aprobare evenimente** → Schimbă status din `PENDING_APPROVAL` în `APPROVED`
- ✅ **Respingere evenimente** → Schimbă status în `REJECTED` (cu motiv)
- ✅ **Publicare evenimente** → Schimbă status în `PUBLISHED`
- ✅ Export PDF orar

**Responsabilități:**
- Revizuiește și aprobă modificările profesorilor
- Decide ce evenimente sunt publicate și vizibile pentru studenți
- Poate respinge evenimente cu un motiv specific

### 1.3. Profesor (PROFESOR)
**Permisiuni:**
- ✅ Creare evenimente → Status: `PENDING_APPROVAL` (necesită aprobare)
- ✅ Editare propriile evenimente
- ✅ Vizualizare:
  - Propriile evenimente (orice status)
  - Evenimentele publicate ale altor profesori
- ✅ Export PDF orar (doar evenimente vizibile)

**Limitări:**
- ❌ Nu poate publica direct evenimente
- ❌ Nu poate aproba/respinge evenimente
- Toate modificările trebuie aprobate de secretar

### 1.4. Student (STUDENT)
**Permisiuni:**
- ✅ Vizualizare DOAR evenimente cu status `PUBLISHED`
- ✅ Export PDF orar (doar evenimente publicate)

**Limitări:**
- ❌ Nu poate crea evenimente
- ❌ Nu poate edita evenimente
- ❌ Nu vede evenimente în draft, pending sau rejected

---

## 2. Statusuri Evenimente

### Fluxul Statusurilor

```
                    ┌─────────────────────────────────┐
                    │        DRAFT                    │
                    │   (Eveniment creat)             │
                    └─────────────┬───────────────────┘
                                  │
                                  │ Profesor trimite
                                  ▼
                    ┌─────────────────────────────────┐
                    │    PENDING_APPROVAL             │
                    │   (Așteaptă aprobare)           │
                    └─────┬───────────────────┬───────┘
                          │                   │
        Secretar aprobă   │                   │  Secretar respinge
                          ▼                   ▼
              ┌───────────────────┐   ┌──────────────┐
              │     APPROVED      │   │   REJECTED   │
              │   (Aprobat)       │   │  (Respins)   │
              └─────┬─────────────┘   └──────────────┘
                    │
   Secretar publică │
                    ▼
              ┌──────────────────────┐
              │     PUBLISHED        │
              │  (Vizibil studenți)  │
              └──────────────────────┘

ADMIN: Poate crea direct cu status PUBLISHED (bypass workflow)
```

### Descriere Statusuri

#### `DRAFT`
- Eveniment creat dar necompletat
- Vizibil doar pentru creator
- Poate fi editat liber

#### `PENDING_APPROVAL`
- Eveniment trimis spre aprobare
- Vizibil pentru:
  - Profesorul creator
  - Secretari
  - Administratori
- Așteaptă decizia secretarului

#### `APPROVED`
- Eveniment aprobat de secretar
- Încă nu este vizibil pentru studenți
- Poate fi publicat de secretar

#### `PUBLISHED`
- Eveniment publicat și vizibil pentru TOȚI
- Apare în orarul studenților
- Poate fi inclus în export PDF

#### `REJECTED`
- Eveniment respins de secretar
- Include motiv de respingere
- Profesorul poate vedea motivul și poate crea un nou eveniment

---

## 3. API Endpoints

### 3.1. Creare Eveniment
**POST** `/api/orar`

**Request Body:**
```json
{
  "zi": "LUNI",
  "oraInceput": "08:00",
  "oraSfarsit": "10:00",
  "tipActivitate": "C",
  "frecventa": "toate",
  "semestru": 1,
  "anUniversitarId": "...",
  "cicluId": "...",
  "profesorId": "...",
  "disciplinaId": "...",
  "salaId": "...",
  "grupeIds": ["...", "..."],
  "publishDirect": false  // Doar pentru SECRETAR
}
```

**Comportament bazat pe rol:**
- **ADMIN**: Status automat `PUBLISHED`
- **PROFESOR**: Status automat `PENDING_APPROVAL`
- **SECRETAR**: Status `PENDING_APPROVAL` sau `PUBLISHED` (dacă `publishDirect: true`)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "status": "PENDING_APPROVAL",
    "message": "Eveniment creat și trimis spre aprobare"
  }
}
```

### 3.2. Aprobare Eveniment
**POST** `/api/orar/[id]/approve`

**Permisiuni:** ADMIN, SECRETAR

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "status": "APPROVED",
    "message": "Eveniment aprobat cu succes. Poate fi acum publicat."
  }
}
```

### 3.3. Respingere Eveniment
**POST** `/api/orar/[id]/reject`

**Permisiuni:** ADMIN, SECRETAR

**Request Body:**
```json
{
  "rejectionReason": "Conflict de orar cu altă activitate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "status": "REJECTED",
    "rejectionReason": "Conflict de orar cu altă activitate",
    "message": "Eveniment respins cu succes"
  }
}
```

### 3.4. Publicare Eveniment
**POST** `/api/orar/[id]/publish`

**Permisiuni:** ADMIN, SECRETAR

**Comportament:**
- Schimbă status în `PUBLISHED`
- Dacă evenimentul nu era `APPROVED`, îl aprobă automat
- Evenimentul devine vizibil pentru studenți

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "status": "PUBLISHED",
    "message": "Eveniment publicat cu succes. Este acum vizibil pentru studenți."
  }
}
```

### 3.5. Listare Evenimente
**GET** `/api/orar`

**Query Parameters:**
```
?anUniversitar=2024-2025
&ciclu=licenta
&semestru=1
&an=1
&profesor=...
&disciplina=...
&sala=...
&zi=LUNI
&grupa=...
&page=1
&limit=50
```

**Filtrare automată bazată pe rol:**
- **STUDENT**: Doar `status=PUBLISHED`
- **PROFESOR**: Propriile evenimente SAU `status=PUBLISHED`
- **ADMIN/SECRETAR**: Toate evenimentele

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm...",
      "zi": "LUNI",
      "oraInceput": "08:00",
      "oraSfarsit": "10:00",
      "status": "PUBLISHED",
      "profesor": {...},
      "disciplina": {...},
      "sala": {...},
      "grupe": [...],
      "approvedAt": "2024-01-20T10:30:00Z",
      "publishedAt": "2024-01-20T10:35:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### 3.6. Export PDF
**GET** `/api/orar/export-pdf`

**Query Parameters:**
```
?anUniversitar=2024-2025
&ciclu=licenta
&semestru=1
&an=1
&grupa=...
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "zi": "LUNI",
      "oraInceput": "08:00",
      "oraSfarsit": "10:00",
      "tipActivitate": "C",
      "frecventa": "toate",
      "profesor": "Prof. Dr. Ion Popescu",
      "disciplina": "Matematică",
      "sala": "A101 (Corp A)",
      "grupe": "A1, A2"
    }
  ],
  "metadata": {
    "anUniversitar": "2024-2025",
    "ciclu": "Licenta",
    "semestru": 1,
    "an": 1,
    "dataGenerare": "20.01.2026"
  }
}
```

---

## 4. Modificări Bază de Date

### 4.1. Enum-uri Noi

```prisma
enum EventStatus {
    DRAFT
    PENDING_APPROVAL
    APPROVED
    PUBLISHED
    REJECTED
}

enum UserRole {
    ADMIN
    SECRETAR
    PROFESOR
    STUDENT  // Adăugat
    USER
}
```

### 4.2. Model Event Actualizat

```prisma
model Event {
    // ... câmpuri existente ...

    // Workflow de aprobare
    status           EventStatus @default(DRAFT)

    // Tracking aprobare
    approvedBy       User?       @relation("EventApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)
    approvedById     String?
    approvedAt       DateTime?

    // Tracking publicare
    publishedBy      User?       @relation("EventPublishedBy", fields: [publishedById], references: [id], onDelete: SetNull)
    publishedById    String?
    publishedAt      DateTime?

    // Motiv respingere
    rejectionReason  String?     @db.Text

    // ... audit fields existente ...

    @@index([status])  // Index pentru performanță
}
```

### 4.3. Migrare

Fișier: `prisma/migrations/20260120103200_add_event_approval_workflow/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

-- AlterTable
ALTER TABLE "events"
    ADD COLUMN "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "approvedById" TEXT,
    ADD COLUMN "approvedAt" TIMESTAMP(3),
    ADD COLUMN "publishedById" TEXT,
    ADD COLUMN "publishedAt" TIMESTAMP(3),
    ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

---

## 5. Export PDF

### 5.1. Funcționalitate

**Fișiere:**
- `lib/pdf-export.ts` - Logică generare PDF
- `app/api/orar/export-pdf/route.ts` - API endpoint
- `app/orar/.../ExportPDFButton/index.tsx` - Component UI

### 5.2. Caracteristici PDF

- **Format:** A4 Landscape
- **Organizare:** Grupat pe zile (Luni - Vineri)
- **Conținut:** Interval orar, Tip activitate, Disciplină, Profesor, Sală, Grupe, Frecvență
- **Metadata:** An universitar, Ciclu, An studiu, Semestru, Data generării
- **Styling:** Tabele cu header colorat, rânduri alternate, formatare profesională

### 5.3. Utilizare

```typescript
import { fetchAndExportSchedule } from "@/lib/pdf-export"

// Export orar cu filtre
await fetchAndExportSchedule({
  anUniversitar: "2024-2025",
  ciclu: "licenta",
  semestru: 1,
  an: 1,
  grupa: "cm123..."  // Opțional
})

// Rezultat: Descarcă fișier "orar_2024-2025_sem1_an1.pdf"
```

---

## 6. Scenarii de Utilizare

### Scenariu 1: Profesor Creează Eveniment
1. Profesorul accesează calendarul
2. Selectează un slot liber (zi + oră)
3. Completează detalii eveniment (disciplină, sală, grupe)
4. Apasă "Salvează"
5. **Sistem:** Eveniment creat cu status `PENDING_APPROVAL`
6. **Notificare:** "Eveniment creat și trimis spre aprobare"

### Scenariu 2: Secretar Aprobă Eveniment
1. Secretara vede lista evenimente cu status `PENDING_APPROVAL`
2. Revizuiește detaliile evenimentului
3. Apasă butonul "Aprobă"
4. **Sistem:** Status schimbat în `APPROVED`
5. **Notificare:** "Eveniment aprobat. Poate fi publicat."

### Scenariu 3: Secretar Publică Eveniment
1. Secretara vede evenimentele `APPROVED`
2. Selectează evenimentul dorit
3. Apasă butonul "Publică"
4. **Sistem:** Status schimbat în `PUBLISHED`
5. **Efect:** Evenimentul devine vizibil pentru studenți

### Scenariu 4: Secretar Respinge Eveniment
1. Secretara identifică un conflict sau eroare
2. Selectează evenimentul `PENDING_APPROVAL`
3. Apasă butonul "Respinge"
4. Introduce motivul: "Conflict de orar cu Matematică"
5. **Sistem:** Status schimbat în `REJECTED`
6. **Notificare profesorului:** "Eveniment respins. Motiv: Conflict de orar cu Matematică"

### Scenariu 5: Administrator Creează Eveniment
1. Administratorul creează un eveniment
2. **Sistem:** Eveniment creat cu status `PUBLISHED` (automat)
3. **Efect:** Vizibil imediat pentru toți (bypass workflow)

### Scenariu 6: Student Exportă Orar
1. Studentul accesează orarul său
2. Apasă butonul "Descarcă PDF"
3. **Sistem:** Generează PDF cu DOAR evenimentele `PUBLISHED`
4. **Rezultat:** Fișier PDF descărcat cu orarul vizibil

---

## 7. Considerații de Securitate

### 7.1. Validare Permisiuni
- Toate endpoint-urile verifică rolul utilizatorului
- Filtrarea se face la nivel de bază de date
- Nu există bypass posibil pentru studenți

### 7.2. Audit Trail
- Toate modificările sunt trackuite:
  - `createdBy` + `createdAt`
  - `updatedBy` + `updatedAt`
  - `approvedBy` + `approvedAt`
  - `publishedBy` + `publishedAt`

### 7.3. Integritate Date
- Foreign keys cu `ON DELETE SET NULL` pentru referințe utilizatori
- Enum-uri pentru a preveni statusuri invalide
- Validare cu Zod la nivel de API

---

## 8. Teste Recomandate

### 8.1. Teste Unitare
- [ ] Validare schema evenimente
- [ ] Logică filtrare bazată pe rol
- [ ] Generare PDF corectă

### 8.2. Teste Integrare
- [ ] Flow complet: Creare → Aprobare → Publicare
- [ ] Flow respingere cu motiv
- [ ] Vizibilitate evenimente pe roluri
- [ ] Export PDF cu filtre

### 8.3. Teste E2E
- [ ] Profesor creează → Secretar aprobă → Student vede
- [ ] Admin creează → Publicare directă
- [ ] Export PDF pentru fiecare rol

---

## 9. Evoluții Viitoare

### 9.1. Notificări
- [ ] Email notificare la aprobare/respingere
- [ ] Notificări in-app pentru profesori
- [ ] Dashboard cu evenimente pending

### 9.2. UI Îmbunătățiri
- [ ] Badge-uri status în calendar
- [ ] Butoane aprobare/respingere în popover
- [ ] Dialog pentru motivul respingerii
- [ ] Istoric modificări eveniment

### 9.3. Raportare
- [ ] Raport evenimente aprobate/respinse
- [ ] Statistici per profesor
- [ ] Timp mediu aprobare

---

## 10. Migrarea Bazei de Date

Pentru a aplica modificările în producție:

```bash
# 1. Rulează migrarea
npx prisma migrate deploy

# 2. Regenerează client Prisma
npx prisma generate

# 3. Restart aplicație
npm run build
npm start
```

---

## 11. Troubleshooting

### Problema: Evenimente nu apar pentru studenți
**Soluție:** Verificați că evenimentele au status `PUBLISHED`

### Problema: Profesorul nu vede butonul de creare
**Soluție:** Verificați rolul în baza de date (trebuie `PROFESOR`, `SECRETAR` sau `ADMIN`)

### Problema: Export PDF eșuează
**Soluție:**
- Verificați că librăriile sunt instalate: `npm install jspdf jspdf-autotable`
- Verificați că API-ul returnează date corecte

### Problema: Migrarea eșuează
**Soluție:**
- Verificați că enum-ul `STUDENT` nu există deja
- Rulați manual SQL-ul din fișierul de migrare

---

## 12. Contact și Suport

Pentru întrebări sau probleme:
1. Verificați documentația API
2. Consultați codul sursă cu comentarii detaliate
3. Verificați logs pentru erori specifice

---

**Data ultimei actualizări:** 20 Ianuarie 2026
**Versiune:** 1.0.0
**Autor:** Claude (Agent AI)
