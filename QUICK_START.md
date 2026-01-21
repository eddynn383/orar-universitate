# 🚀 Quick Start - Testare Aplicație

## 📥 Pasul 1: Pull Branch-ul

```bash
git fetch origin
git checkout claude/merge-users-admin-page-2j8T0
git pull origin claude/merge-users-admin-page-2j8T0
```

## 📦 Pasul 2: Instalare Dependențe

```bash
npm install
# sau
yarn install
```

**⚠️ IMPORTANT:** Asigură-te că ai Node.js 18+ și PostgreSQL instalat.

## 🗄️ Pasul 3: Backup Baza de Date (OBLIGATORIU!)

```bash
# PostgreSQL
pg_dump -U postgres -d orar_universitate > backup_$(date +%Y%m%d_%H%M%S).sql

# Sau folosind pgAdmin: Right-click pe DB → Backup
```

## 🔄 Pasul 4: Rulare Migrație

```bash
# 1. Generează migrația Prisma
npx prisma migrate dev --name unify_users_model

# 2. Generează clientul Prisma
npx prisma generate

# 3. Rulează scriptul de migrare date
npx ts-node scripts/migrate-to-unified-users.ts
```

**Output așteptat:**
```
🚀 Începere migrare la modelul unificat User

🔄 Migrare profesori...
   Găsiți X profesori
   ✓ Actualizat profesor: ...
✓ Migrare profesori completată

🔄 Migrare studenți...
   Găsiți Y studenți
   ✓ Actualizat student: ...
✓ Migrare studenți completată

🔍 Verificare migrare...
   ✓ Profesori migrați: X
   ✓ Studenți migrați: Y

✅ Migrare completată cu succes!
```

## 🚀 Pasul 5: Start Aplicația

```bash
npm run dev
# sau
yarn dev
```

Aplicația va rula pe: `http://localhost:3000`

## ✅ Pasul 6: Testare Funcționalități

### 🧭 Navigație Actualizată & Redirect-uri Automate

**După login, vei fi redirecționat automat către:**
- 🎓 **PROFESOR** → `/profesor/dashboard`
- 📚 **STUDENT** → `/student/dashboard`
- 👨‍💼 **ADMIN/SECRETAR** → `/utilizatori`
- 👤 **Neautentificat** → `/orar`

**Meniu Navigație per Rol:**

**🔴 ADMIN:**
```
├── Orar
├── Utilizatori (înlocuiește "Cadre didactice")
├── Discipline
├── Grupe
├── Sali clasa
└── Import Studenți (NOU!)
```

**🔵 SECRETAR:**
```
├── Orar
├── Utilizatori (înlocuiește "Cadre didactice")
├── Discipline
├── Grupe
├── Sali clasa
└── Import Studenți (NOU!)
```

**🟢 PROFESOR:**
```
├── Dashboard (NOU!)
└── Orar
```

**🟡 STUDENT:**
```
├── Dashboard (NOU!)
└── Orar
```

### 1️⃣ Testează Pagina Utilizatori

**URL:** `http://localhost:3000/utilizatori`

**Login ca:** ADMIN sau SECRETAR

**Sau:** Click pe "Utilizatori" în meniul de navigație (prima pagină după login pentru admin/secretar)

**Testează:**
- [ ] Vezi lista utilizatori
- [ ] Filtrare: Toți, Profesori, Studenți, Secretari, Admini
- [ ] Căutare după nume/email/publicId
- [ ] Afișare informații per rol (titlu profesor, grup student)

### 2️⃣ Testează Dashboard Profesor

**URL:** `http://localhost:3000/profesor/dashboard`

**Login ca:** PROFESOR

**Sau:** Click pe "Dashboard" în meniul de navigație (prima pagină după login pentru profesori)

**Credențiale default:**
- Email: [email profesor din DB]
- Parolă: `Profesor123!`

**Testează:**
- [ ] Vezi statistici (discipline, studenți, examene, materiale)
- [ ] Vezi lista disciplinelor cu detalii
- [ ] Vezi examene viitoare cu badge-uri (astăzi/mâine)
- [ ] Click pe butoanele de acțiuni rapide

### 3️⃣ Testează Dashboard Student

**URL:** `http://localhost:3000/student/dashboard`

**Login ca:** STUDENT

**Sau:** Click pe "Dashboard" în meniul de navigație (prima pagină după login pentru studenți)

**Credențiale default:**
- Email: [email student din DB]
- Parolă: `Student123!`

**Testează:**
- [ ] Vezi statistici (cursuri, medie, note, examene)
- [ ] Vezi lista cursurilor
- [ ] Click pe curs pentru expand și vezi materiale
- [ ] Vezi notele grupate pe disciplină
- [ ] Vezi trend-ul notelor (↑↓→)
- [ ] Vezi examene viitoare

### 4️⃣ Testează Import CSV

**URL:** `http://localhost:3000/admin/import-studenti`

**Login ca:** ADMIN sau SECRETAR

**Sau:** Click pe "Import Studenți" în meniul de navigație

**Testează:**
- [ ] Descarcă template CSV
- [ ] Editează template cu date noi
- [ ] Upload CSV
- [ ] Vezi raport import (succes + erori)

**Template CSV:**
```csv
firstname,lastname,email,publicId,sex,cnp,birthDate,birthPlace,groupName
Test,Student,test.student@univ.ro,TEST001,MASCULIN,1234567890123,2000-01-15,București,A1
```

## 🔍 Verificare Migrare în DB

```sql
-- Verifică profesori migrați
SELECT COUNT(*), role FROM users WHERE role = 'PROFESOR' GROUP BY role;

-- Verifică studenți migrați
SELECT COUNT(*), role FROM users WHERE role = 'STUDENT' GROUP BY role;

-- Verifică discipline cu profesor asignat
SELECT COUNT(*) FROM disciplines WHERE "professorId" IS NOT NULL;

-- Verifică note cu userId
SELECT COUNT(*) FROM grades WHERE "userId" IS NOT NULL;
```

## 📊 Statistici Așteptate

După migrare, ar trebui să vezi:
- ✅ Toți profesorii în `users` cu `role='PROFESOR'`
- ✅ Toți studenții în `users` cu `role='STUDENT'`
- ✅ Toate disciplinele au `professorId` populat
- ✅ Toate `studentDiscipline` au `userId` populat
- ✅ Toate `grades` au `userId` și `professorId` populat

## 🐛 Probleme Comune

### ❌ "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### ❌ "Table users doesn't have column firstname"

```bash
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

### ❌ Script de migrare dă eroare

1. Verifică că ai rulat `npx prisma migrate dev` înainte
2. Verifică că baza de date este accesibilă
3. Verifică logurile pentru detalii

### ❌ Profesorii/Studenții nu apar în listă

- Asigură-te că ai rulat scriptul de migrare
- Verifică în DB că `role` este setat corect
- Verifică că `firstname` și `lastname` sunt populate

### ❌ Nu sunt redirecționat către dashboard

- Verifică că sesiunea este activă (logout + login)
- Verifică că rolul este setat corect în DB
- Curăță cache-ul browserului

## ✅ Checklist Testare Completă

Înainte de merge, verifică:

- [ ] Migrația s-a rulat cu succes (0 erori)
- [ ] Toți profesorii pot face login
- [ ] Toți studenții pot face login
- [ ] Redirect automat funcționează per rol
- [ ] Navigația afișează link-uri corecte per rol
- [ ] Profesorii văd disciplinele lor în dashboard
- [ ] Studenții văd cursurile lor în dashboard
- [ ] Notele sunt vizibile pentru studenți
- [ ] Materialele de curs sunt accesibile
- [ ] Importul CSV funcționează corect
- [ ] Filtrarea pe rol funcționează
- [ ] Căutarea funcționează
- [ ] Nu există erori în consolă

## 📞 Dacă Întâmpini Probleme

1. **Verifică fișierele de documentație:**
   - `MIGRATION_GUIDE.md` - Ghid detaliat de migrare
   - `README_NEW_FEATURES.md` - Documentație funcționalități

2. **Verifică logurile:**
   - Browser console pentru erori frontend
   - Terminal pentru erori backend
   - Prisma Studio pentru date: `npx prisma studio`

3. **Rollback la backup:**
   ```bash
   psql -U postgres -d orar_universitate < backup_XXX.sql
   ```

## 🎯 După Testare

Dacă totul funcționează:

1. **Mergeează branch-ul:**
   ```bash
   git checkout main
   git merge claude/merge-users-admin-page-2j8T0
   git push origin main
   ```

2. **Șterge branch-ul (opțional):**
   ```bash
   git branch -d claude/merge-users-admin-page-2j8T0
   git push origin --delete claude/merge-users-admin-page-2j8T0
   ```

3. **Notifică utilizatorii:**
   - Profesori: parola default `Profesor123!`
   - Studenți: parola default `Student123!`
   - Toți trebuie să-și schimbe parola!

---

**Branch:** `claude/merge-users-admin-page-2j8T0`
**Status:** ✅ Ready for Testing
**Commits:** 7 commits
**Files Changed:** 27+ files
**Lines Added:** ~5000 lines

**Ultimul update:** 2026-01-21 - Navigație și redirect-uri actualizate!

---

## 🎉 Enjoy testing!

Dacă ai întrebări sau probleme, consultă fișierele de documentație sau contactează-mă.
