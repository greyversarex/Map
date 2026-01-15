# Tajikistan Interactive Map

## Overview

This is an interactive map application for exploring locations in Tajikistan. The project features a public-facing map view where users can browse points of interest, and an admin panel for managing location data. Built with React on the frontend and Express on the backend, it uses MapLibre GL for map rendering and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Map Rendering**: MapLibre GL JS with react-map-gl wrapper
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **API Design**: RESTful endpoints under `/api` prefix
- **Session Management**: express-session with simple credential-based admin auth

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command

### Authentication
- **Admin Auth**: Simple username/password authentication stored in environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- **Session Storage**: Server-side sessions with express-session
- **Replit Auth Integration**: Optional OIDC-based auth exists in `server/replit_integrations/auth/` for user accounts

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schemas and types used by both frontend and backend
- **API Contract**: Route definitions in `shared/routes.ts` define request/response schemas
- **Storage Layer**: `server/storage.ts` implements a DatabaseStorage class that abstracts database operations

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Map Services
- **OpenStreetMap Tiles**: Default raster tile source for colored map style
- **Carto Basemaps**: Positron style for minimal map appearance
- **No API key required**: Uses open map tile providers

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ADMIN_USERNAME`: Admin login username (defaults to "admin")
- `ADMIN_PASSWORD`: Admin login password (defaults to "admin123")

### Frontend Libraries
- **MapLibre GL**: Open-source map rendering engine
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend dev server with HMR
- **tsx**: TypeScript execution for server
- **Drizzle Kit**: Database schema management