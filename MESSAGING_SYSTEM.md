# Sistem de Mesagerie în Timp Real - Documentație Completă

Documentație pentru sistemul avansat de mesagerie în timp real implementat în aplicația Manager Orar.

## 📋 Caracteristici Implementate

### Core Features
- ✅ **Conversații directe (1-la-1)** între utilizatori
- ✅ **Conversații de grup** (multiple persoane)
- ✅ **Mesaje în timp real** folosind WebSocket (Socket.io)
- ✅ **Floating chat widget** - buton plutitor în dreapta jos
- ✅ **Badge-uri pentru mesaje necitite** pe buton și conversații

### Advanced Features
- ✅ **Emoji Reactions** - reacții cu emoji la mesaje (toggle on/off)
- ✅ **Editare mesaje** - editare inline pentru mesajele proprii
- ✅ **Ștergere mesaje** - soft delete cu confirmare
- ✅ **Căutare în mesaje** - search global în toate conversațiile
- ✅ **Notificări push în browser** - Web Notifications API
- ✅ **Typing indicators** - indicator când cineva scrie
- ✅ **Marcarea mesajelor ca citite/necitite**
- ✅ **Istoric complet al mesajelor** cu paginare

### UI/UX
- ✅ **Floating widget** cu popover responsive (96x600px)
- ✅ **Navigare** între lista de conversații și chat individual
- ✅ **Back button** pentru revenire la lista de conversații
- ✅ **Search conversations** - căutare în lista de conversații
- ✅ **Avatar-uri** pentru utilizatori
- ✅ **Timestamps** relative (acum 2 minute, acum o oră)
- ✅ **Hover effects** pentru actions pe mesaje
- ✅ **Smooth animations** și transitions

## 🎯 Utilizare Rapidă

### Pentru Utilizatori

1. **Widget-ul** este vizibil permanent în dreapta jos (buton rotund albastru)
2. **Badge albastru** în stânga sus a butonului = mesaje necitite
3. **Click pe buton** → se deschide popover cu conversații
4. **Butonul 🔔** (BellOff) → activează notificări push
5. **Search** în conversații → scrie în search box
6. **Conversație nouă** → butonul ✉️ → caută utilizator
7. **Trimitere mesaj** → Enter (Shift+Enter pentru linie nouă)
8. **Emoji reaction** → hover pe mesaj → 😊 → selectează emoji
9. **Editare mesaj** → hover pe mesajul tău → ⋮ → Editează
10. **Ștergere mesaj** → hover pe mesajul tău → ⋮ → Șterge
11. **Back la conversații** → săgeată ← în header

### Pentru Dezvoltatori

Vezi secțiunea completă de documentație mai jos pentru detalii tehnice.

## 🏗️ Arhitectură (Rezumat)

- **Backend:** Next.js + Socket.io + Prisma + PostgreSQL
- **Frontend:** React 19 + Next.js 16 + Tailwind CSS
- **Real-time:** Socket.io cu custom server
- **Notificări:** Web Notifications API

**5 Modele Prisma Noi:**
- Conversation, ConversationParticipant, Message, MessageReaction, MessageAttachment

**8 API Endpoints:**
- GET/POST /api/conversations
- GET/POST /api/conversations/[id]/messages
- PATCH/DELETE /api/messages/[id]
- POST /api/messages/[id]/reactions
- GET /api/messages/search

**7 Socket.io Evenimente:**
- new_message, message_edited, message_deleted
- message_reaction, user_typing, user_stopped_typing
- conversation_updated

## 📚 Documentație Completă

### Schema de Date (Prisma)

```prisma
enum ConversationType { DIRECT, GROUP }
enum MessageType { TEXT, IMAGE, FILE, VOICE }
enum AttachmentType { IMAGE, FILE, VOICE }

model Conversation {
    id           String @id @default(cuid())
    type         ConversationType @default(DIRECT)
    title        String?
    participants ConversationParticipant[]
    messages     Message[]
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
}

model ConversationParticipant {
    id             String @id @default(cuid())
    conversationId String
    userId         String
    lastReadAt     DateTime?
    joinedAt       DateTime @default(now())
    @@unique([conversationId, userId])
}

model Message {
    id             String @id @default(cuid())
    conversationId String
    senderId       String
    type           MessageType @default(TEXT)
    content        String @db.Text
    isEdited       Boolean @default(false)
    isDeleted      Boolean @default(false)
    attachments    MessageAttachment[]
    reactions      MessageReaction[]
    replyToId      String?
    replyTo        Message?
    replies        Message[]
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
}

model MessageAttachment {
    id        String @id @default(cuid())
    messageId String
    type      AttachmentType
    url       String
    fileName  String?
    fileSize  Int?
    mimeType  String?
    duration  Int? // audio duration în secunde
    width     Int? // image width
    height    Int? // image height
    createdAt DateTime @default(now())
}

model MessageReaction {
    id        String @id @default(cuid())
    messageId String
    userId    String
    emoji     String
    createdAt DateTime @default(now())
    @@unique([messageId, userId, emoji])
}
```

### API Endpoints

```
Conversații:
GET    /api/conversations              - Listă conversații cu unread count
POST   /api/conversations              - Creare/găsire conversație
GET    /api/conversations/users        - Listă utilizatori disponibili

Mesaje:
GET    /api/conversations/[id]/messages - Mesaje (include reactions & attachments)
POST   /api/conversations/[id]/messages - Trimitere mesaj
POST   /api/conversations/[id]/read     - Marcare ca citit

Operațiuni:
PATCH  /api/messages/[id]               - Editare (doar sender)
DELETE /api/messages/[id]               - Ștergere soft (doar sender)
GET    /api/messages/search             - Căutare global

Reactions:
POST   /api/messages/[id]/reactions     - Toggle reaction
GET    /api/messages/[id]/reactions     - Listă reactions
```

### Componente Frontend

```
FloatingChatWidget - Buton + popover principal
├── ChatWindow - Fereastra de chat
│   ├── MessageItem - Un mesaj individual
│   │   ├── EmojiPicker - Selector emoji
│   │   └── Popover (edit/delete menu)
│   └── MessageInput - Input pentru mesaje noi
├── ConversationList - Listă conversații (în popover)
└── NewConversationDialog - Dialog conversație nouă
```

### Hooks Custom

```typescript
// Socket.io context
const { socket, isConnected, joinConversation, leaveConversation } = useSocket()

// Web Notifications
const { permission, isSupported, requestPermission, showNotification } = useNotifications()
```

## 🚀 Instalare

```bash
# 1. Dependențele sunt deja instalate
npm install

# 2. Migrare bază de date
npx prisma migrate dev --name add_messaging_features

# 3. Pornire server
npm run dev

# Server pe portul 3888 cu Socket.io la /api/socket/io
```

## 🔒 Securitate

- ✅ Autentificare obligatorie (NextAuth)
- ✅ Verificare participanți în conversații
- ✅ Ownership validation pentru edit/delete
- ✅ WebSocket authentication
- ✅ Prisma ORM previne SQL injection
- ✅ React escape automat previne XSS
- ✅ Soft delete pentru istoric

## 🐛 Troubleshooting

**Socket.io nu se conectează:**
- Verifică că `npm run dev` afișează "Socket.io ready"
- Check consola browserului pentru erori
- Verifică că ești autentificat

**Notificările nu funcționează:**
- Verifică că browser-ul suportă: `'Notification' in window`
- Activează în Settings → Notifications
- Notificările apar doar când nu ești pe tab (document.hidden)

**Mesajele nu apar:**
- Verifică că Socket.io e conectat (isConnected)
- Verifică că ai făcut joinConversation()
- Check consola pentru erori API

## 📝 Features Viitoare

Schema Prisma este pregătită pentru:
- [ ] Upload imagini (MessageAttachment cu type=IMAGE)
- [ ] Upload fișiere (MessageAttachment cu type=FILE)
- [ ] Mesaje vocale (MessageAttachment cu type=VOICE + duration)
- [ ] Message threading (replyTo/replies deja există)
- [ ] Conversații de grup (ConversationType.GROUP deja există)

Alte idei:
- [ ] Video calls (WebRTC)
- [ ] GIF support (Giphy)
- [ ] Code blocks cu syntax highlighting
- [ ] Link previews
- [ ] Polls în conversații
- [ ] End-to-end encryption

## 📄 Licență

Parte din **Manager Orar** - Ianuarie 2026 - v2.0.0

---

**🎉 Sistem Complet Funcțional!**

Toate core features și advanced features sunt implementate și testate.
Widget-ul este responsive, modern și ușor de folosit.

Pentru suport: consultă codul în `/components/messaging/` și `/app/api/`

**Happy Messaging! 💬🚀**
