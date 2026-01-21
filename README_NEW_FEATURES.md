# 🎓 Sistem Unificat de Gestionare Utilizatori - Funcționalități Noi

## 🌟 Prezentare Generală

Aplicația a fost extinsă cu un sistem unificat de gestionare a utilizatorilor care combină profesorii și studenții într-un singur model `User`, oferind funcționalități avansate pentru fiecare rol.

---

## 📦 Funcționalități Implementate

### 1. **Pagină Unificată Utilizatori** (`/utilizatori`)

**Acces:** ADMIN, SECRETAR

**Funcționalități:**
- 📊 Vizualizare centralizată a tuturor utilizatorilor
- 🔍 Filtrare rapidă pe rol: Toți, Profesori, Studenți, Secretari, Admini
- 🔎 Căutare avansată: nume, prenume, email, publicId
- 👤 Afișare informații specifice per rol:
  - **Profesori:** Titlu academic, grad didactic
  - **Studenți:** Grup, publicId (GDPR)
  - **Toți:** Email, avatar, rol
- ➕ Creare utilizatori noi (ADMIN only)

**Screenshot Features:**
```
┌─────────────────────────────────────────┐
│  [Toți] [Profesori] [Studenți] [Search] │
├─────────────────────────────────────────┤
│  👤 Prof. Dr. Ion Popescu               │
│     🎓 Profesor | 📚 Conferențiar       │
│     📧 ion.popescu@univ.ro              │
├─────────────────────────────────────────┤
│  👤 Maria Ionescu                        │
│     🎓 Student | 👥 Grupa A1            │
│     🆔 STD001 | 📧 maria@student.ro     │
└─────────────────────────────────────────┘
```

### 2. **Dashboard Profesor** (`/profesor/dashboard`)

**Acces:** PROFESOR

**Secțiuni:**

#### A. Statistici Rapide
- 📚 Nr. discipline active
- 👥 Nr. studenți înscriși
- 📅 Nr. examene viitoare
- 📄 Nr. materiale încărcate

#### B. Acțiuni Rapide (4 butoane mari cu iconițe)
1. **Asignează Studenți** - Asignare studenți la discipline
2. **Creează Examen** - Programare examene noi
3. **Încarcă Material** - Upload materiale de curs
4. **Adaugă Note** - Sistem de notare

#### C. Lista Disciplinelor
Pentru fiecare disciplină:
- Nume disciplină
- An și semestru
- Nr. studenți înscriși
- Nr. materiale disponibile
- Data următorului examen (dacă există)
- Link către detalii disciplină

#### D. Examene Viitoare (Sidebar)
- Badge-uri colorate pentru:
  - 🔴 **Astăzi** - Roșu/Portocaliu
  - 🟡 **Mâine** - Galben
  - 🔵 **Viitoare** - Albastru
- Informații: Dată, oră, locație, disciplină

### 3. **Dashboard Student** (`/student/dashboard`)

**Acces:** STUDENT

**Secțiuni:**

#### A. Statistici Rapide
- 📚 Nr. cursuri înscrise
- 📊 Media generală
- 📝 Nr. total note
- 📅 Nr. examene viitoare

#### B. Cursurile Mele
- Lista completă cursuri înscrise
- Click pentru expand și acces materiale
- Pentru fiecare curs:
  - Nume disciplină
  - Profesor (cu titlu academic)
  - An și semestru
  - Nr. materiale disponibile
  - Data următorului examen
  - **Materiale descărcabile** (când e expandat)

#### C. Notele Mele
- Grupare automată pe disciplină
- Media la fiecare disciplină
- Trend indicator: ↑ (îmbunătățire) ↓ (scădere) → (stabil)
- Pentru fiecare notă:
  - Valoarea notei (cu culoare: verde ≥9, albastru ≥7, portocaliu ≥5, roșu <5)
  - Tipul (Examen, Colocviu, Laborator, etc.)
  - Data
  - Feedback de la profesor (dacă există)

#### D. Examene Viitoare (Sidebar)
Similar cu dashboard profesor:
- Badge-uri cu date
- Disciplină, oră, locație, durată
- Primele 5 examene viitoare

### 4. **Import CSV Studenți** (`/admin/import-studenti`)

**Acces:** ADMIN, SECRETAR

**Funcționalități:**
- 📥 Upload fișier CSV/XLS/XLSX
- 📝 Template descărcabil cu exemple
- ✅ Validare automată date
- 📊 Raport detaliat import:
  - Nr. studenți importați cu succes
  - Nr. eșuați cu detalii erori
  - Lista completă erori pe rânduri

**Format CSV Suportat:**
```csv
firstname,lastname,email,publicId,sex,cnp,birthDate,birthPlace,groupName
Ion,Popescu,ion@student.ro,STD001,MASCULIN,1234567890123,2000-01-15,București,A1
```

**Câmpuri obligatorii:**
- firstname, lastname, email, publicId, sex

**Câmpuri opționale:**
- cnp, birthDate, birthPlace, groupName, citizenship, etc.

**Validări:**
- ✅ Email unic în sistem
- ✅ PublicId unic în sistem
- ✅ Grupa există în sistem (dacă specificată)
- ✅ Format date corect
- ✅ Sex valid (MASCULIN/FEMININ)

---

## 🗄️ Modele de Date Noi

### CourseMaterial (Materiale de Curs)
```typescript
{
  id: string
  title: string
  description?: string
  disciplineId: string
  fileUrl: string
  fileName: string
  fileSize?: number
  category: "Curs" | "Seminar" | "Laborator" | "Altele"
  isPublished: boolean
  uploadedById: string (profesor)
}
```

### Exam (Examene)
```typescript
{
  id: string
  title: string
  description?: string
  disciplineId: string
  examDate: Date
  duration?: number (minute)
  location?: string
  examType: "Examen" | "Colocviu" | "Parțial" | "Test"
  maxScore: number (default: 10)
  instructions?: string
  isPublished: boolean
  createdById: string (profesor)
}
```

### Grade (Note - Extins)
```typescript
{
  id: string
  value: number
  gradeType: string
  date: Date
  feedback?: string // NOU - feedback de la profesor
  userId: string // Student
  disciplineId: string
  examId?: string // NOU - legătură cu examen
  professorId?: string // NOU - cine a dat nota
}
```

---

## 🔄 Flux de Lucru Tipic

### Pentru Profesori:

1. **Login** → Dashboard
2. **Vezi statistici** și disciplinele tale
3. **Asignează studenți** la o disciplină
4. **Încarcă materiale** de curs (PDF, PPT, etc.)
5. **Creează examene** cu instrucțiuni
6. **Notează studenți** cu feedback
7. **Vezi examene viitoare** și pregătește-te

### Pentru Studenți:

1. **Login** → Dashboard
2. **Vezi cursurile** la care ești înscris
3. **Descarcă materiale** de curs
4. **Verifică notele** și feedback-ul
5. **Vezi media** la fiecare disciplină
6. **Pregătește-te** pentru examene viitoare

### Pentru Admin/Secretari:

1. **Login** → Utilizatori
2. **Filtrează și caută** utilizatori
3. **Importă studenți** în masă (CSV)
4. **Asignează grupuri** studenților
5. **Gestionează roluri** și permisiuni

---

## 🎨 Design & UX

### Paleta de Culori pentru Roluri:
- 🔴 **ADMIN** - Roșu (bg-red-100)
- 🔵 **SECRETAR** - Albastru (bg-blue-100)
- 🟢 **PROFESOR** - Verde (bg-green-100)
- 🟡 **STUDENT** - Galben (bg-yellow-100)
- ⚪ **USER** - Gri (bg-gray-100)

### Iconițe Utilizate:
- 📚 BookOpen - Discipline/Cursuri
- 👥 Users - Utilizatori/Studenți
- 📅 Calendar - Examene/Date
- 📄 FileText - Materiale/Documente
- 🎓 GraduationCap - Studenți/Educație
- 📊 Award - Note/Performanță
- ✉️ Mail - Email
- 🔍 Search - Căutare
- ➕ Plus - Adăugare
- 📥 Upload - Încărcare

---

## 🔐 Sistem de Permisiuni

### Ierarhie Roluri:
```
ADMIN (100) > SECRETAR (80) > PROFESOR (60) > STUDENT (40) > USER (20)
```

### Matrice Permisiuni:

| Funcționalitate | ADMIN | SECRETAR | PROFESOR | STUDENT |
|----------------|-------|----------|----------|---------|
| Vezi utilizatori | ✅ | ✅ | ❌ | ❌ |
| Creare utilizatori | ✅ | ✅ | ❌ | ❌ |
| Import CSV | ✅ | ✅ | ❌ | ❌ |
| Asignare studenți | ✅ | ✅ | ✅* | ❌ |
| Creare examene | ✅ | ✅ | ✅ | ❌ |
| Upload materiale | ✅ | ✅ | ✅ | ❌ |
| Notare studenți | ✅ | ✅ | ✅ | ❌ |
| Vezi note proprii | ❌ | ❌ | ❌ | ✅ |
| Download materiale | ✅ | ✅ | ✅ | ✅ |

*Profesorii pot asigna doar la propriile discipline

---

## 📊 Statistici & Metrici

### Dashboard Profesor:
- Discipline active
- Total studenți înscriși (la toate disciplinele)
- Examene programate (viitoare)
- Materiale încărcate (total)

### Dashboard Student:
- Cursuri înscrise
- Media generală (calculată automat)
- Total note primite
- Examene viitoare

---

## 🚀 API Routes Disponibile

```typescript
POST   /api/students/import       // Import CSV studenți
GET    /api/users                 // Lista utilizatori (ADMIN)
POST   /api/users                 // Creare utilizator (ADMIN)
GET    /api/materials             // Lista materiale
POST   /api/materials             // Upload material (PROFESOR)
GET    /api/exams                 // Lista examene
POST   /api/exams                 // Creare examen (PROFESOR)
POST   /api/grades                // Adăugare notă (PROFESOR)
```

---

## 📚 Exemple de Utilizare

### 1. Import Studenți CSV

```csv
firstname,lastname,email,publicId,sex,birthDate,groupName
Ion,Popescu,ion@student.ro,STD001,MASCULIN,2000-01-15,A1
Maria,Ionescu,maria@student.ro,STD002,FEMININ,2001-03-20,A2
```

Rezultat:
```
✅ Import realizat cu succes!
✓ 2 studenți importați
✓ 0 eșuați
Parola default: Student123!
```

### 2. Asignare Student la Disciplină

```typescript
// Verificare compatibilitate
const canAssign = await canAssignStudentToDiscipline(
  studentId,
  disciplineId
)

// Dacă e compatibil (același an + semestru)
if (canAssign.canAssign) {
  await assignStudentToDiscipline({
    userId: studentId,
    disciplineId
  })
}
```

### 3. Calcul Medie Student

```typescript
const average = await calculateAverageGrade(
  studentId,
  disciplineId
)

// Rezultat: { average: 8.75, totalGrades: 4 }
```

---

## 🔧 Configurare & Setup

Vezi [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) pentru:
- Setup inițial
- Rulare migrație
- Testare funcționalități
- Troubleshooting

---

## 📝 Note Importante

1. **Parole Default:**
   - Profesori: `Profesor123!`
   - Studenți: `Student123!`
   - ⚠️ Trebuie schimbate la prima autentificare!

2. **CNP Criptat:**
   - CNP-urile sunt stocate criptat (bcrypt)
   - Nu pot fi decriptate înapoi
   - Folosite doar pentru verificare

3. **PublicId (GDPR):**
   - Folosit pentru afișare publică note
   - Nu conține date personale
   - Format: STD001, STD002, etc.

4. **Materiale de Curs:**
   - Suport pentru PDF, PPT, DOCX
   - Categorii: Curs, Seminar, Laborator
   - Control vizibilitate (isPublished)

5. **Examene:**
   - Pot fi draft sau publicate
   - Notele sunt legate de examene
   - Restricții semestru/an la asignare

---

## 🎯 Next Steps

După testarea aplicației, poți extinde cu:

1. **Notificări Email** pentru:
   - Note noi primite
   - Examene apropiatea
   - Materiale noi disponibile

2. **Statistici Avansate:**
   - Grafice evoluție note
   - Comparație între grupe
   - Rapoarte profesori

3. **Calendar Integrat:**
   - Vezi toate examenele într-un calendar
   - Export iCal pentru Google Calendar
   - Reminder-e automate

4. **Chat/Forum:**
   - Comunicare profesor-studenți
   - Forum întrebări pe disciplină
   - Anunțuri importante

---

**Versiune:** 1.0.0
**Data:** 2026-01-21
**Autor:** Claude (Anthropic)
