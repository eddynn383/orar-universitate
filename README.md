This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configurare

Prima data se instaleaza pachetele si dependentele folosind comanda

```bash
npm install
```

Dupa ce pachetele s-au instalat, se genereaza clientul Prisma folosind comanda

```bash
npx prisma generate
```

Dupa ce clientul Prisma a fost generat, se poate porni aplicatia in modul de dezvoltare folosind comanda

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Autentificare

Authentificate with admin user
user: eduard.boboc@admin.com
pass: eduardAdmin

Open [http://localhost:3888] with your browser to see the result.

## Documentație API

Acest proiect include documentație completă OpenAPI/Swagger pentru toate endpoint-urile API.

### Accesare Documentație

Pentru a accesa documentația interactivă Swagger UI:

1. Pornește serverul de dezvoltare (vezi secțiunea Configurare)
2. Deschide [http://localhost:3888/api-docs](http://localhost:3888/api-docs) în browser

### Fișier OpenAPI Spec

Specificația OpenAPI completă este disponibilă în:

- `openapi.yaml` - Specificație completă în format YAML
- `public/openapi.yaml` - Versiune publică pentru Swagger UI

### Caracteristici Documentație

- **Toate endpoint-urile documentate** - Discipline, Săli, Ani de Studiu, Orar, Grupe, Cicluri, Cadre Didactice
- **Scheme de validare** - Modele complete pentru request/response
- **Exemple** - Exemple pentru fiecare tip de date
- **Autentificare** - Documentare completă pentru roluri și permisiuni
- **Try it out** - Testează API-ul direct din browser
