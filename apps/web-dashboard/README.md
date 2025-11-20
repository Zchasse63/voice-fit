# VoiceFit Web Dashboard

Enterprise/B2B web dashboard for coaches and organizations to manage clients and programs.

## Features

- **Client Management**: View and manage client profiles, programs, and progress
- **Program Builder**: Create and edit workout programs with drag-and-drop interface
- **CSV Import**: Bulk upload programs with AI-assisted schema mapping and quality review
- **Analytics**: Track client adherence, progress, and performance metrics
- **Team Management**: Organize coaches and clients into teams (for organizations)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
apps/web-dashboard/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Dashboard pages (protected)
│   │   ├── clients/       # Client management
│   │   ├── programs/      # Program builder
│   │   ├── import/        # CSV import
│   │   └── analytics/     # Analytics
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── clients/          # Client-specific components
│   ├── programs/         # Program builder components
│   └── import/           # CSV import components
├── lib/                   # Utilities and services
│   ├── supabase/         # Supabase client
│   ├── stores/           # Zustand stores
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

Deploy to Vercel, Netlify, or any Node.js hosting platform.

