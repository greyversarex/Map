# Tajikistan Interactive Map

## Production Deployment Info

**ВАЖНО: Сайт развёрнут на облачном сервере Timeweb**

### Рабочий процесс
- Replit используется ТОЛЬКО для разработки и улучшения сайта
- После изменений делаем push в репозиторий из Replit
- Затем обновляем код на продакшн сервере через командную строку
- **КРИТИЧЕСКИ ВАЖНО**: При обновлениях НИКОГДА не стирать и не повреждать данные на продакшене!

### Продакшн сервер
- **Путь**: `/var/www/ecomap`
- **Хост**: `msk-1-vm-soga` (Timeweb)

### Переменные окружения продакшена
```
DATABASE_URL=postgresql://ecomap_user:eco2026@localhost:5432/ecomap
SESSION_SECRET=ecomap_secret_key_2024_secure
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NODE_ENV=production
PORT=3000
```

### Безопасное обновление продакшена
1. Делаем изменения в Replit
2. Тестируем локально
3. `git push` из Replit
4. На сервере: `git pull` + restart приложения
5. НЕ запускать миграции которые удаляют данные!

---

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

## Recent Changes (January 2026)

### Database-Driven Location Types
- New `location_types` table for customizable location categories
- Circular icons with custom colors uploaded via admin panel
- Admin page at `/admin/location-types` for CRUD operations
- ImageCropper component using react-easy-crop for circular cropping

### Multiple Media per Location
- New `location_media` table for storing multiple photos/videos per location
- MediaCarousel component with arrow navigation for viewing gallery
- MultiMediaUploader component in location form for managing media:
  - Upload multiple photos/videos
  - Set primary media (shown first)
  - Reorder media items
  - Remove unwanted media
- Backward compatible: Falls back to legacy imageUrl/videoUrl if no media records

### Key Files for New Features
- `client/src/components/image-cropper.tsx` - Circular image cropping
- `client/src/components/media-carousel.tsx` - Multi-media carousel viewer
- `client/src/components/multi-media-uploader.tsx` - Upload manager
- `client/src/pages/admin-location-types.tsx` - Admin type management
- `client/src/hooks/use-location-types.ts` - Location types API hooks
- `client/src/hooks/use-location-media.ts` - Location media API hooks

## Recent Changes (February 2026)

### Books/Documents Library Feature
- New `books` table in database for storing documents and publications
- **Map Page**: Added "Книги" (Books) button next to Filters button that navigates to library
- **Books Page** (`/books`): Beautiful bookshelf design with:
  - Wooden shelf appearance with realistic shadows
  - Book cards with hover animations (scale up and lift)
  - Search functionality for books and documents
  - Modal dialog for viewing book details
  - Download/Open buttons for documents
  - Multi-language support (Tajik, Russian, English)
- **Admin Panel**: New "Книги" (Books) tab for managing library:
  - Add/Edit/Delete books
  - Upload cover images and PDF documents
  - Multi-language titles and descriptions
  - Sort order control

### Key Files for Books Feature
- `client/src/pages/books.tsx` - Public bookshelf library page
- `client/src/components/book-form.tsx` - Admin form for book management
- `client/src/hooks/use-books.ts` - Books API hooks
- `shared/schema.ts` - Books table definition