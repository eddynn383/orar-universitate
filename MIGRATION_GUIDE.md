# 📘 Ghid de Migrare - Sistem Unificat Users

## 📋 Cuprins
1. [Prezentare Generală](#prezentare-generală)
2. [Setup Inițial](#setup-inițial)
3. [Rularea Migrației](#rularea-migrației)
4. [Testare Funcționalități](#testare-funcționalități)
5. [Credențiale Default](#credențiale-default)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Prezentare Generală

Această migrare unific modelele `Teacher` și `Student` într-un singur model `User` cu câmpuri opționale specifice fiecărui rol.

### Modificări Principale:
- ✅ **Schema Prisma**: Unificare modele + adăugare `CourseMaterial` și `Exam`
- ✅ **Data Layer**: Funcții noi pentru materiale, examene, note, asignări
- ✅ **UI**: Pagină unificată `/utilizatori` + dashboard-uri profesor/student
- ✅ **Import**: Sistem de import CSV/XLS pentru studenți

---

## 🚀 Setup Inițial

### 1. Instalare Dependențe

```bash
npm install
# sau
yarn install
```

### 2. Configurare Bază de Date

Asigură-te că ai configurat corect `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/orar_universitate"
```

### 3. Backup Bază de Date (IMPORTANT!)

Înainte de migrare, fă backup la baza de date:

```bash
pg_dump -U user -d orar_universitate > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔄 Rularea Migrației

### Pas 1: Generare Migrație Prisma

```bash
npx prisma migrate dev --name unify_users_model
```

Acest comand va:
- Crea o nouă migrație SQL
- Actualiza schema bazei de date
- Adăuga câmpurile noi în tabela `users`
- Crea tabelele `course_materials` și `exams`

### Pas 2: Generare Client Prisma

```bash
npx prisma generate
```

### Pas 3: Rulare Script de Migrare Date

```bash
npx ts-node scripts/migrate-to-unified-users.ts
```

**Ce face acest script:**
1. Migrează toți profesorii din `Teacher` în `User` cu role='PROFESOR'
2. Migrează toți studenții din `Student` în `User` cu role='STUDENT'
3. Actualizează relațiile în `Discipline`, `StudentDiscipline`, `Grade`
4. Păstrează modelele vechi pentru rollback

**Output așteptat:**
```
🚀 Începere migrare la modelul unificat User

🔄 Migrare profesori...
   Găsiți 15 profesori
   ✓ Actualizat profesor: Ion Popescu
   ✓ Actualizat profesor: Maria Ionescu
   ...
✓ Migrare profesori completată

🔄 Migrare studenți...
   Găsiți 120 studenți
   ✓ Actualizat student: Andrei Georgescu
   ✓ Actualizat student: Elena Popa
   ...
✓ Migrare studenți completată

🔍 Verificare migrare...
   ✓ Profesori migrați: 15
   ✓ Studenți migrați: 120
   ✓ Discipline cu profesor asignat: 25
   ✓ StudentDiscipline cu userId: 450
   ✓ Grade cu userId: 380

✅ Migrare completată cu succes!
```

### Pas 4: Verificare Migrare

Rulează următoarele query-uri pentru verificare:

```sql
-- Verifică profesori migrați
SELECT COUNT(*) FROM users WHERE role = 'PROFESOR';

-- Verifică studenți migrați
SELECT COUNT(*) FROM users WHERE role = 'STUDENT';

-- Verifică discipline cu profesor asignat
SELECT COUNT(*) FROM disciplines WHERE "professorId" IS NOT NULL;

-- Verifică note cu userId
SELECT COUNT(*) FROM grades WHERE "userId" IS NOT NULL;
```

---

## 🧪 Testare Funcționalități

### 1. Testare Pagină Unificată `/utilizatori`

**Acces:** ADMIN sau SECRETAR

**Testează:**
- [x] Vizualizare listă utilizatori
- [x] Filtrare pe rol (ALL, PROFESOR, STUDENT, SECRETAR, ADMIN)
- [x] Căutare după nume, email, publicId
- [x] Afișare informații specifice per rol:
  - Profesori: titlu + grad didactic
  - Studenți: grup + publicId

**URL:** `http://localhost:3000/utilizatori`

### 2. Testare Dashboard Profesor

**Acces:** PROFESOR

**Testează:**
- [x] Statistici rapide (discipline, studenți, examene, materiale)
- [x] Lista disciplinelor asignate
- [x] Examene viitoare cu badge-uri
- [x] Acțiuni rapide (asignare, examene, materiale, notare)

**URL:** `http://localhost:3000/profesor/dashboard`

### 3. Testare Dashboard Student

**Acces:** STUDENT

**Testează:**
- [x] Statistici (cursuri, medie, note, examene)
- [x] Lista cursurilor cu materiale
- [x] Note grupate pe disciplină cu trend
- [x] Examene viitoare

**URL:** `http://localhost:3000/student/dashboard`

### 4. Testare Import CSV Studenți

**Acces:** ADMIN sau SECRETAR

**Testează:**
- [x] Download template CSV
- [x] Upload fișier CSV valid
- [x] Mesaj de succes cu statistici
- [x] Mesaje de eroare pentru înregistrări invalide

**URL:** `http://localhost:3000/admin/import-studenti`

**Template CSV:**
```csv
firstname,lastname,email,publicId,sex,cnp,birthDate,birthPlace,groupName
Ion,Test,ion.test@student.ro,TEST001,MASCULIN,1234567890123,2000-01-15,București,A1
Maria,Test,maria.test@student.ro,TEST002,FEMININ,2345678901234,2001-03-20,Cluj,A2
```

---

## 🔐 Credențiale Default

### Profesori Migrați
- **Email:** [email din baza de date]
- **Parolă:** `Profesor123!`

### Studenți Migrați
- **Email:** [email din baza de date]
- **Parolă:** `Student123!`

### Studenți Importați prin CSV
- **Email:** [email din CSV]
- **Parolă:** `Student123!`

**⚠️ IMPORTANT:** Toți utilizatorii trebuie să-și schimbe parola la prima autentificare!

---

## 🐛 Troubleshooting

### Eroare: "Table users doesn't have column firstname"

**Soluție:**
```bash
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

### Eroare: "Cannot read properties of null"

**Cauză:** Clientul Prisma nu a fost generat cu noile modificări.

**Soluție:**
```bash
npx prisma generate
npm run dev
```

### Eroare la migrarea datelor

**Cauză:** Date inconsistente în tabele vechi.

**Soluție:**
1. Verifică logurile scriptului
2. Corectează înregistrările problematice manual
3. Rulează din nou scriptul

### Profesorii/Studenții nu apar în lista unificată

**Cauză:** Scriptul de migrare nu a fost rulat.

**Soluție:**
```bash
npx ts-node scripts/migrate-to-unified-users.ts
```

---

## ✅ Checklist Post-Migrare

După ce migrarea este completă și verificată:

- [ ] Toate testele funcționează corect
- [ ] Profesorii se pot autentifica și văd disciplinele lor
- [ ] Studenții se pot autentifica și văd cursurile lor
- [ ] Importul CSV funcționează corect
- [ ] Notele sunt vizibile pentru studenți
- [ ] Materialele de curs sunt accesibile

Când totul funcționează:

1. **Șterge modelele vechi din schema** (opțional, după 1-2 săptămâni):
   ```prisma
   // Șterge din schema.prisma:
   // - model Teacher
   // - model Student
   ```

2. **Creează o nouă migrare**:
   ```bash
   npx prisma migrate dev --name remove_old_models
   ```

---

## 📞 Suport

Pentru probleme sau întrebări:
- Verifică secțiunea [Troubleshooting](#troubleshooting)
- Contactează echipa de dezvoltare

---

**Versiune:** 1.0.0
**Data:** 2026-01-21
**Autor:** Claude (Anthropic)
