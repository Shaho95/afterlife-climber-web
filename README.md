# Afterlife Climber

En Vite/Three.js-testversion av spelet.

## Kör lokalt

Installera dependencies:

```bash
npm install
```

Starta dev-servern:

```bash
npm run dev
```

Öppna sedan adressen som visas i terminalen, oftast:

```text
http://127.0.0.1:5173/
```

## Bygg spelet

Production build:

```bash
npm run build
```

Build-output hamnar i:

```text
dist
```

## Testa production build lokalt

Efter build kan du köra:

```bash
npm run preview
```

Öppna sedan preview-adressen som visas i terminalen, oftast:

```text
http://127.0.0.1:4173/
```

## Deploy till Vercel

Skapa ett nytt Vercel-projekt och använd dessa inställningar:

- Framework: Vite
- Build command: `npm run build`
- Output folder: `dist`
- Install command: `npm install`

När Vercel har byggt klart får du en publik länk som kan delas med testare.

