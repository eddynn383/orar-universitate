# Documentație: Sincronizare Automată User-Teacher/Student și Sistem de Notificări

## Prezentare Generală

Această implementare adaugă funcționalități importante pentru gestionarea utilizatorilor, profesorilor și studenților, precum și un sistem de aprobare și notificări pentru evenimente.

## Funcționalități Implementate

### 1. Sincronizare Automată User-Teacher/Student

#### Problema Rezolvată
Anterior, când se crea un utilizator cu rol `PROFESOR` sau `STUDENT`, acesta nu apărea în paginile dedicate (cadre didactice / studenți) deoarece nu exista o legătură între tabelul `users` și tabelele `teachers`/`students`.

#### Soluție
- **Schema Prisma modificată**: Adăugate relații bidirecționale între `User` și `Teacher`/`Student`
- **Creare automată**: Când se creează un utilizator cu rol `PROFESOR`, se creează automat și un profil în tabelul `teachers`. Similar pentru `STUDENT`.
- **Sincronizare la actualizare**: Când se modifică rolul unui utilizator, profilul corespunzător este creat sau șters automat.

#### Fișiere Modificate
- `prisma/schema.prisma` - Adăugate câmpuri `userId` în `Teacher` și `Student`, relații inverse în `User`
- `actions/user.ts` - Modificate funcțiile `createUser` și `updateUser` pentru sincronizare automată

### 2. Restricții pentru Profesori la Crearea Evenimentelor

#### Funcționalitate
Profesorii pot crea evenimente **doar pentru ei înșiși** și **doar pentru disciplinele pe care le predau**.

#### Validări Implementate
1. Verifică că evenimentul este pentru profesorul însuși (nu poate crea evenimente pentru alți profesori)
2. Verifică că disciplina aparține profesorului
3. Verifică că profesorul are un profil valid asociat cu contul său

#### Fișier Modificat
- `app/api/orar/route.ts` - Adăugată validare în funcția `POST`

### 3. Publicare în Masă a Evenimentelor

#### Funcționalitate
Profesorii pot trimite toate evenimentele lor pentru aprobare printr-un singur click.

#### Workflow
1. Profesorul creează evenimente (status: `DRAFT` sau `PENDING_APPROVAL`)
2. Profesorul apasă "Publish All" (POST `/api/orar/publish-bulk`)
3. Toate evenimentele sunt setate la `PENDING_APPROVAL`
4. Secretarii primesc notificări

#### Endpoint Nou
- `POST /api/orar/publish-bulk` - Trimite toate evenimentele profesorului pentru aprobare

### 4. Sistem de Notificări

#### Funcționalitate
Sistem complet de notificări pentru a informa utilizatorii despre acțiuni importante.

#### Cazuri de Utilizare
- Secretarii primesc notificări când un profesor trimite evenimente pentru aprobare
- Notificările pot fi marcate ca citite individual sau în masă

#### Endpoints Noi
- `GET /api/notifications` - Obține notificările utilizatorului (cu paginare)
- `PUT /api/notifications/[id]/mark-read` - Marchează o notificare ca citită
- `PUT /api/notifications/mark-all-read` - Marchează toate notificările ca citite

#### Model Prisma
```prisma
model Notification {
    id        String   @id @default(cuid())
    userId    String
    user      User     @relation("UserNotifications", fields: [userId], references: [id])
    title     String
    message   String
    read      Boolean  @default(false)
    type      String   @default("INFO")
    createdAt DateTime @default(now())
}
```

### 5. Vizibilitate Evenimentelor

#### Workflow Actual
```
DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED
```

#### Reguli de Vizibilitate
| Rol | Vede |
|-----|------|
| **STUDENT** | Doar evenimente `PUBLISHED` |
| **PROFESOR** | Propriile evenimente (orice status) + evenimente `PUBLISHED` ale altora |
| **SECRETAR** | Toate evenimentele |
| **ADMIN** | Toate evenimentele |

## Migrare Date Existente

### Script de Migrație
Un script TypeScript pentru a lega utilizatorii existenți cu profilurile de profesor/student.

#### Rulare
```bash
npx ts-node scripts/migrate-user-teacher-student.ts
```

#### Operații
1. Leagă utilizatori `PROFESOR` existenți cu profiluri `Teacher` bazat pe email
2. Leagă utilizatori `STUDENT` existenți cu profiluri `Student` bazat pe email
3. Creează profiluri noi pentru utilizatori fără profil corespunzător
4. Afișează statistici detaliate și raport de erori

## Migrări Prisma

### Pasul 1: Generează Migrarea
```bash
npx prisma migrate dev --name add-user-teacher-student-links-and-notifications
```

Această comandă va:
1. Adăuga câmpul `userId` în tabelele `teachers` și `students`
2. Crea tabelul `notifications`
3. Adăuga index-uri pentru performanță

### Pasul 2: Aplică Migrarea în Producție
```bash
npx prisma migrate deploy
```

### Pasul 3: Rulează Scriptul de Migrație Date
```bash
npx ts-node scripts/migrate-user-teacher-student.ts
```

## Modificări Schema Prisma

### User
```prisma
model User {
    // ... câmpuri existente

    // Noi relații
    teacherProfile Teacher? @relation("UserAsTeacher")
    studentProfile Student? @relation("UserAsStudent")
    notifications Notification[] @relation("UserNotifications")
}
```

### Teacher
```prisma
model Teacher {
    // ... câmpuri existente

    // Nouă legătură cu User
    user        User?   @relation("UserAsTeacher", fields: [userId], references: [id])
    userId      String? @unique
}
```

### Student
```prisma
model Student {
    // ... câmpuri existente

    // Nouă legătură cu User
    user        User?   @relation("UserAsStudent", fields: [userId], references: [id])
    userId      String? @unique
}
```

## Testare

### 1. Testează Crearea Utilizator cu Rol PROFESOR
```bash
# Creează un utilizator cu rol PROFESOR
# Verifică că apare automat în pagina "Cadre Didactice"
```

### 2. Testează Crearea Utilizator cu Rol STUDENT
```bash
# Creează un utilizator cu rol STUDENT
# Verifică că apare automat în pagina "Studenți"
```

### 3. Testează Restricții Evenimente
```bash
# Autentifică-te ca profesor
# Încearcă să creezi un eveniment pentru alt profesor → Ar trebui să eșueze
# Încearcă să creezi un eveniment pentru o disciplină pe care nu o predai → Ar trebui să eșueze
# Creează un eveniment valid → Ar trebui să reușească
```

### 4. Testează Publicare în Masă
```bash
# Autentifică-te ca profesor
# Creează mai multe evenimente
# Apelează POST /api/orar/publish-bulk
# Verifică că toate evenimentele au status PENDING_APPROVAL
# Autentifică-te ca secretar
# Verifică că ai primit notificare
```

### 5. Testează Notificări
```bash
# GET /api/notifications → Obține lista de notificări
# PUT /api/notifications/[id]/mark-read → Marchează una ca citită
# PUT /api/notifications/mark-all-read → Marchează toate ca citite
```

## Considerații Importante

### Date Temporare pentru Studenți
Când se creează automat un profil de student, următoarele câmpuri primesc valori temporare:
- `publicId`: Generat automat (format: STD[timestamp][random])
- `sex`: "MASCULIN" (default)
- `cnpEncrypted`: "0000000000000" (temporar)
- `birthDate`: 2000-01-01 (default)
- `birthPlace`: "Necompletat"

**⚠️ Important**: Aceste date trebuie completate ulterior prin editarea profilului de student.

### Date pentru Profesori
Când se creează automat un profil de profesor:
- `firstname` și `lastname`: Extrase din câmpul `name` al utilizatorului
- `grade` și `title`: NULL (pot fi completate ulterior)
- `phone`: Copiat din profilul utilizatorului (dacă există)

### Performanță
- Index-uri adăugate pentru `userId` în `teachers` și `students`
- Index pentru `[userId, read]` în `notifications` pentru interogări rapide

## Rollback

Dacă este necesară revenirea la starea anterioară:

```bash
# 1. Revert migrarea Prisma
npx prisma migrate resolve --rolled-back [migration-name]

# 2. Șterge fișierele noi
rm app/api/orar/publish-bulk/route.ts
rm app/api/notifications/route.ts
rm app/api/notifications/[id]/mark-read/route.ts
rm app/api/notifications/mark-all-read/route.ts
rm scripts/migrate-user-teacher-student.ts

# 3. Revert modificări în fișiere
git checkout actions/user.ts app/api/orar/route.ts prisma/schema.prisma
```

## Support și Probleme

### Probleme Comune

#### 1. Profesorii nu pot crea evenimente
**Cauză**: Nu au profil de profesor asociat
**Soluție**: Rulează scriptul de migrație sau creează manual profilul

#### 2. Studenții nu apar în pagina dedicată
**Cauză**: Legătura User-Student nu există
**Soluție**: Rulează scriptul de migrație

#### 3. Notificările nu ajung la secretari
**Cauză**: Migrarea tabelului notifications nu a fost aplicată
**Soluție**: Rulează `npx prisma migrate deploy`

## Versiune
- Data implementării: 2026-01-20
- Versiune Prisma necesară: >= 5.0.0
- Versiune Node.js necesară: >= 18.0.0
