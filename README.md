# Pots.ro

Marketplace românesc pentru produse de floristică - cutii, ghivece, accesorii.

## Tehnologii

- **Next.js 14** cu App Router
- **TypeScript** pentru type safety
- **Tailwind CSS** pentru styling
- **Radix UI** pentru componente accesibile
- **Inter font** pentru tipografie

## Configurare

1. Instalează dependențele:
```bash
npm install
```

2. Pornește serverul de dezvoltare:
```bash
npm run dev
```

3. Deschide [http://localhost:3000](http://localhost:3000) în browser.

## Structura proiectului

```
├── app/                 # App Router (Next.js 14)
│   ├── globals.css     # Stiluri globale + Tailwind
│   ├── layout.tsx      # Layout principal cu font Inter
│   └── page.tsx        # Homepage cu produse demo
├── components/         # Componente reutilizabile
│   ├── ui/            # Componente UI de bază
│   │   └── button.tsx # Button cu variante
│   ├── navbar.tsx     # Navigație principală
│   ├── product-card.tsx # Card pentru produse
│   └── footer.tsx     # Footer
├── public/            # Assets statice
│   └── placeholder.svg # Imagine placeholder
└── tailwind.config.ts # Configurare Tailwind cu culori brand
```

## Culori brand

- **Brand**: `#0EA5E9` (albastru principal)
- **Brand Dark**: `#0369A1` (albastru închis)
- **Brand Light**: `#7DD3FC` (albastru deschis)
- **Ink**: `#0f172a` (text principal)
- **Mist**: `#f8fafc` (background deschis)

## Dezvoltare

Proiectul folosește feature branches pentru dezvoltare:

```bash
git checkout -b feature/nume-feature
# ... dezvoltare ...
git add .
git commit -m "feat: descriere"
git push -u origin feature/nume-feature
```
