# Sistem de Mesagerie în Timp Real

Documentație pentru sistemul de mesagerie în timp real implementat în aplicația Manager Orar.

## 📋 Caracteristici

- ✅ Conversații directe (1-la-1) între utilizatori
- ✅ Conversații de grup (multiple persoane)
- ✅ Mesaje în timp real folosind WebSocket (Socket.io)
- ✅ Notificări pentru mesaje noi
- ✅ Indicator "typing..." când cineva scrie
- ✅ Marcarea mesajelor ca citite/necitite
- ✅ Istoric complet al mesajelor
- ✅ Căutare utilizatori pentru conversații noi
- ✅ Interfață responsive și modernă

## 🏗️ Arhitectură

### Backend

**Modele de date (Prisma):**
- `Conversation` - conversații între utilizatori
- `ConversationParticipant` - participanți în conversații (many-to-many)
- `Message` - mesajele din conversații

**API Endpoints:**
- `GET /api/conversations` - listă conversații
- `POST /api/conversations` - creare conversație nouă
- `GET /api/conversations/[id]/messages` - mesaje dintr-o conversație
- `POST /api/conversations/[id]/messages` - trimitere mesaj nou
- `POST /api/conversations/[id]/read` - marcare mesaje ca citite
- `GET /api/conversations/users` - listă utilizatori disponibili

**WebSocket Server (Socket.io):**
- Custom server Next.js cu Socket.io integrat
- Autentificare bazată pe userId
- Events: `join_conversation`, `leave_conversation`, `typing_start`, `typing_stop`, `new_message`, etc.

### Frontend

**Componente:**
- `ConversationList` - listă cu conversații și preview mesaj
- `ChatWindow` - fereastră de chat cu mesaje
- `MessageInput` - input pentru mesaje noi cu typing indicator
- `NewConversationDialog` - dialog pentru creare conversație nouă

**Context:**
- `SocketProvider` - provider pentru Socket.io client
- Hooks: `useSocket()` pentru acces la Socket.io

## 🚀 Instalare și Configurare

### 1. Dependențe

Dependențele au fost deja instalate:
```json
{
  "socket.io": "^4.8.3",
  "socket.io-client": "^4.8.3"
}
```

### 2. Configurare Bază de Date

Rulează migrarea Prisma pentru a crea tabelele necesare:

```bash
npx prisma migrate dev --name add_messaging_system
```

Dacă întâmpini erori cu DATABASE_URL, asigură-te că ai fișierul `.env` cu:
```
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

### 3. Pornire Server

Serverul custom a fost configurat în `package.json`:

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Serverul va porni pe portul 3888 cu Socket.io disponibil pe `/api/socket/io`.

## 📚 Utilizare

### Pentru Utilizatori

1. **Accesare Mesaje:**
   - Click pe "Mesaje" în meniul de navigare
   - Pagina este disponibilă pentru toți utilizatorii autentificați (Admin, Secretar, Profesor, Student)

2. **Începe o Conversație Nouă:**
   - Click pe butonul "+" din colțul din dreapta sus
   - Caută utilizatorul dorit
   - Click pe utilizator pentru a începe conversația

3. **Trimitere Mesaj:**
   - Selectează o conversație din listă
   - Scrie mesajul în input-ul de jos
   - Apasă Enter sau click pe butonul de trimitere

4. **Mesaje în Timp Real:**
   - Mesajele apar automat fără a reîmprospăta pagina
   - Vei vedea când cineva scrie ("typing...")
   - Mesajele necitite sunt marcate cu un badge

### Pentru Dezvoltatori

#### Utilizare Socket.io în componente:

```tsx
import { useSocket } from '@/app/contexts/socket-context'

function MyComponent() {
  const { socket, isConnected, joinConversation } = useSocket()

  useEffect(() => {
    if (socket) {
      // Ascultă evenimente
      socket.on('new_message', (message) => {
        console.log('New message:', message)
      })

      // Cleanup
      return () => {
        socket.off('new_message')
      }
    }
  }, [socket])

  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
}
```

#### Trimitere notificări:

```typescript
// În API route
if (global.io) {
  global.io.to(`user:${userId}`).emit('notification', {
    title: 'Mesaj nou',
    message: 'Ai primit un mesaj nou'
  })
}
```

## 🔒 Securitate

- ✅ Autentificare obligatorie pentru toate endpoint-urile
- ✅ Verificare participanți în conversații (nu poți citi mesaje din conversații unde nu ești participant)
- ✅ Validare date pe backend
- ✅ WebSocket authentication prin userId
- ✅ SQL injection prevenit prin Prisma ORM

## 🎨 Personalizare

### Modificare culori și stiluri

Componentele folosesc sistemul de design existent al aplicației (Tailwind CSS).
Stilurile pot fi modificate în fișierele componentelor din `/components/messaging/`.

### Adăugare funcționalități noi

1. **Atașamente fișiere:**
   - Adaugă câmp `attachments` în modelul `Message`
   - Integrează cu UploadThing (deja prezent în aplicație)

2. **Mesaje vocale:**
   - Adaugă suport pentru înregistrare audio
   - Salvează ca atașament

3. **Emojis și reacții:**
   - Adaugă model `MessageReaction`
   - Componente pentru picker de emoji

## 📊 Performanță

- Mesajele sunt paginate (50 per pagină)
- Socket.io folosește reconnection automată
- Lazy loading pentru conversații
- Debounce pentru typing indicators
- Optimized re-renders cu React hooks

## 🐛 Troubleshooting

### Socket.io nu se conectează

1. Verifică că serverul custom rulează (ar trebui să vezi "Socket.io ready on path /api/socket/io" în consolă)
2. Verifică că ești autentificat (SessionProvider trebuie să fie activ)
3. Verifică consola browserului pentru erori

### Mesajele nu apar în timp real

1. Verifică că `global.io` este disponibil în API routes
2. Verifică că te-ai alăturat conversației (`joinConversation`)
3. Verifică event listeners în componentă

### Erori de migrare Prisma

1. Asigură-te că DATABASE_URL este setat în `.env`
2. Rulează `npx prisma generate` după modificări schema
3. Verifică că PostgreSQL rulează

## 📝 To-Do (Îmbunătățiri Viitoare)

- [ ] Suport pentru atașamente (imagini, fișiere)
- [ ] Mesaje vocale
- [ ] Reactions la mesaje (emoji)
- [ ] Editare și ștergere mesaje
- [ ] Căutare în mesaje
- [ ] Arhivare conversații
- [ ] Notificări push (Web Push API)
- [ ] End-to-end encryption (opțional)

## 📄 Licență

Acest sistem face parte din aplicația Manager Orar și urmează aceeași licență.

---

**Dezvoltat pentru:** Universitate - Manager Orar
**Data:** Ianuarie 2026
**Versiune:** 1.0.0
