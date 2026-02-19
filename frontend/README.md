# Novi Frontend (Next.js PWA)

Progressive Web App built with Next.js, TypeScript, and Tailwind CSS.

## Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase and API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure
```
frontend/
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── lib/              # Utilities (Firebase, API client)
├── public/           # Static assets
└── styles/           # Global styles
```

## Key Dependencies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Firebase** - Backend services
- **next-pwa** - PWA capabilities

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for required variables.

## Deployment

Automatically deployed to Vercel on push to `main` branch.
