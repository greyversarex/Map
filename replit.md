# Интерактивная 3D Карта Таджикистана

## О проекте

Это веб-приложение — интерактивная геоинформационная система для Таджикистана. Разработано для государственной организации (КМЗ — Комитет по Международным Зелёным Зонам / структура, управляющая природными ресурсами). На карте отображаются точки — головные управления, филиалы, заповедники, ледники, рыбоводства, питомники — с мультиязычной поддержкой и цифровой библиотекой документов.

**Рабочий процесс:** код улучшается на Replit → пушится в GitHub репозиторий → обновляется production сервер на Timeweb.

---

## Стек технологий

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **react-map-gl** / **maplibre-gl** — интерактивная 3D карта с рельефом
- **Tailwind CSS** + **Radix UI** / **shadcn/ui** — UI компоненты
- **TanStack Query v5** — fetching и кэш данных
- **Wouter** — клиентский роутинг
- **Framer Motion** — анимации
- **jsPDF + jspdf-autotable** — генерация PDF отчётов
- **Lucide React** — иконки
- **Cinzel + Inter** (Google Fonts) — типографика

### Backend
- **Node.js + Express** — REST API сервер
- **Drizzle ORM** + **PostgreSQL (pg)** — база данных
- **Multer** — загрузка файлов (фото, видео, PDF), лимит 200MB
- **express-session** — сессии для авторизации администратора
- **Passport.js** — аутентификация (базовая сессионная для админа)

### Инфраструктура
- **Replit Object Storage** — хранение файлов (через Replit интеграцию)
- Локальная папка `/uploads/` — резервное хранилище файлов
- Порт **5000** — единый порт для backend API + Vite frontend (dev: middleware, prod: static)

---

## Архитектура файлов

```
├── client/
│   ├── src/
│   │   ├── App.tsx                    — Роутинг, провайдеры
│   │   ├── index.css                  — Глобальные стили, CSS анимации маркеров
│   │   ├── pages/
│   │   │   ├── map.tsx                — Главная страница с 3D картой
│   │   │   ├── books.tsx              — Страница библиотеки документов
│   │   │   ├── admin.tsx              — Админ панель (управление локациями/книгами)
│   │   │   ├── admin-login.tsx        — Страница входа в админку
│   │   │   └── not-found.tsx          — 404 страница
│   │   ├── components/
│   │   │   ├── location-icons.tsx     — Иконки/маркеры, конфиги типов, эффекты
│   │   │   ├── location-form.tsx      — Форма создания/редактирования локации
│   │   │   ├── location-type-form.tsx — Форма типа локации
│   │   │   ├── book-form.tsx          — Форма книги/документа
│   │   │   ├── multi-media-uploader.tsx — Загрузка нескольких фото/видео
│   │   │   ├── media-carousel.tsx     — Карусель медиа в детальном попапе
│   │   │   ├── image-cropper.tsx      — Обрезка изображений
│   │   │   ├── language-switcher.tsx  — Переключатель языка
│   │   │   ├── ObjectUploader.tsx     — Загрузчик через Replit Object Storage
│   │   │   └── ui/                    — shadcn/ui компоненты
│   │   ├── hooks/
│   │   │   ├── use-locations.ts       — CRUD локаций (TanStack Query)
│   │   │   ├── use-location-types.ts  — CRUD типов локаций
│   │   │   ├── use-location-media.ts  — CRUD медиа локаций
│   │   │   ├── use-books.ts           — CRUD книг
│   │   │   ├── use-admin-auth.ts      — Авторизация администратора
│   │   │   └── use-upload.ts          — Загрузка файлов
│   │   ├── lib/
│   │   │   ├── i18n.tsx               — Мультиязычность (ru/tj/en), LanguageProvider
│   │   │   ├── pdf-generator.ts       — Генерация PDF отчётов по категориям
│   │   │   ├── queryClient.ts         — TanStack Query клиент + apiRequest helper
│   │   │   ├── auth-utils.ts          — Утилиты авторизации
│   │   │   └── noto-font.ts           — Шрифт для PDF (поддержка кириллицы/таджикского)
│   │   └── data/
│   │       ├── tajikistan-accurate.ts — GeoJSON граница Таджикистана (OSM)
│   │       └── tajikistan-border.ts   — Дополнительные данные границы
├── server/
│   ├── index.ts                       — Точка входа Express, session middleware
│   ├── routes.ts                      — Все API маршруты, multer, seed данные
│   ├── storage.ts                     — DatabaseStorage класс, IStorage интерфейс
│   ├── db.ts                          — Drizzle + PostgreSQL подключение
│   ├── vite.ts                        — Vite dev middleware (только development)
│   ├── static.ts                      — Статика (только production)
│   └── replit_integrations/
│       ├── auth/                      — Replit Auth интеграция
│       └── object_storage/            — Replit Object Storage интеграция
├── shared/
│   ├── schema.ts                      — Drizzle схемы, Zod схемы, TypeScript типы
│   └── routes.ts                      — API контракты (типизированные маршруты)
├── uploads/                           — Загруженные файлы (локально)
├── attached_assets/                   — Статичные ассеты (фоны и т.д.)
└── script/build.ts                    — Production build скрипт
```

---

## База данных (PostgreSQL + Drizzle ORM)

### Таблицы

**`location_types`** — Типы/категории локаций (управляются из админки)
- `id`, `slug` (уникальный), `name` (tj), `nameRu`, `nameEn`
- `iconUrl` — кастомная иконка (URL)
- `color`, `bgColor`, `borderColor` — цвета маркера
- `markerEffect` — анимация маркера (`none | pulse | ring | ringSlow | glow | frost`)
- `sortOrder`, `createdAt`

**`locations`** — Точки на карте
- `id`, `name` (tj), `nameRu`, `nameEn`
- `description` (tj), `descriptionRu`, `descriptionEn`
- `lat`, `lng` — координаты (doublePrecision)
- `imageUrl`, `videoUrl` — устаревшие поля (заменены на `location_media`)
- `locationType` (slug, текстовый FK), `locationTypeId` (числовой FK)
- `foundedYear`, `workerCount`, `area`
- `createdAt`

**`location_media`** — Медиа файлы для локаций (несколько фото/видео на локацию)
- `id`, `locationId`, `mediaType` (`photo | video`)
- `url`, `thumbnailUrl`, `caption`
- `sortOrder`, `isPrimary`, `createdAt`

**`books`** — Документы/книги библиотеки
- `id`, `title` (tj), `titleRu`, `titleEn`
- `author`, `description` (tj), `descriptionRu`, `descriptionEn`
- `coverUrl`, `documentUrl`
- `category`, `year`, `sortOrder`, `createdAt`

### Seed данные (при первом запуске)
При пустой БД автоматически создаются 6 типов локаций (КМЗ, Шуъбахо, Мамнунгох, Пиряххо, Мохипарвари, Нихолхона) и 3 тестовые локации.

---

## API маршруты

### Публичные (без авторизации)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/locations` | Список всех локаций |
| GET | `/api/locations/:id` | Одна локация |
| GET | `/api/locations/:id/media` | Медиа локации |
| GET | `/api/location-types` | Список типов локаций |
| GET | `/api/location-types/:id` | Один тип |
| GET | `/api/books` | Список книг |
| GET | `/api/books/:id` | Одна книга |
| GET | `/api/admin/session` | Проверка сессии |

### Защищённые (требуют авторизации `isAdmin`)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/admin/login` | Вход в админку |
| POST | `/api/admin/logout` | Выход |
| POST | `/api/upload` | Загрузка файла (Multer) |
| POST/PUT/DELETE | `/api/locations` | CRUD локаций |
| POST/PUT/DELETE | `/api/location-types` | CRUD типов |
| POST/PUT/DELETE | `/api/locations/:id/media` | CRUD медиа |
| PUT/DELETE | `/api/media/:id` | Обновление/удаление медиа |
| POST/PUT/DELETE | `/api/books` | CRUD книг |

### Авторизация
- Простая сессионная: `ADMIN_USERNAME` / `ADMIN_PASSWORD` (env vars, дефолт: `admin` / `admin123`)
- Сессии в памяти (express-session)

---

## Страницы

### `/` — Карта (map.tsx)
- MapLibre GL карта Таджикистана с 3D рельефом (pitch: 45°, exaggeration: 1.5)
- 2 стиля карты: **Цветная** (OpenStreetMap тайлы) / **Минимал** (CartoCDN Positron)
- Красная линия границы Таджикистана (GeoJSON)
- Маркеры с CSS анимациями по типу локации
- Hover попап с фото/видео превью, именем, данными
- Клик → детальный диалог с медиа каруселью, описанием, координатами
- Поиск по локациям (имя на 3 языках) с выпадающим списком + flyTo на карте
- Фильтры по типам локаций (чекбоксы) с возможностью скачать PDF для каждой категории
- Кнопка перехода в библиотеку `/books`
- Переключатель языка (ru/tj/en)

### `/books` — Библиотека (books.tsx)
- UI книжной полки (3D эффект книг)
- Поиск по названию и автору
- Книги группируются по 5 на полку
- Клик → детальный диалог с обложкой, автором, годом, описанием
- Кнопки: открыть документ (новая вкладка) / скачать
- Фоновое изображение библиотеки

### `/admin` — Админ панель (admin.tsx)
- Sidebar с навигацией, управлением типами, выходом
- 2 вкладки: **Локации** и **Книги**
- Список локаций сгруппирован по типам, поиск по названию
- CRUD локаций через диалоговые формы (LocationForm)
- CRUD типов локаций (название на 3 языках, цвета, иконка, эффект маркера)
- CRUD книг (BookForm)
- Фоновое изображение (earth-anime style)

### `/admin/login` — Вход в админку

---

## Мультиязычность (i18n)

- **3 языка**: Русский (`ru`), Таджикский (`tj`), Английский (`en`)
- Дефолтный язык: `ru`, сохраняется в `localStorage`
- `LanguageProvider` + хук `useLanguage()` с `t(key)` функцией
- Переводы: статические строки в `client/src/lib/i18n.tsx`
- Данные из БД: у каждой локации/типа/книги есть поля `name`, `nameRu`, `nameEn`

---

## Анимации маркеров

6 статических эффектов для дефолтных типов (CSS классы в `index.css`):
- `marker-pulse-kmz` — зелёное пульсирующее кольцо
- `marker-pulse-branch` — серое свечение (glow)
- `marker-pulse-reserve` — изумрудная медленная волна
- `marker-pulse-glacier` — голубое мерцание (frost)
- `marker-pulse-fishery` — синяя рябь
- `marker-pulse-nursery` — лаймовое свечение

6 динамических эффектов для кастомных типов (CSS custom property `--marker-color`):
- `none`, `pulse`, `ring`, `ringSlow`, `glow`, `frost`

---

## Загрузка файлов

- **Multer** (локально): `/api/upload` → файлы в `./uploads/`, URL `/uploads/<filename>`
- **Replit Object Storage**: отдельные маршруты через `replit_integrations/object_storage`
- Лимит размера: 200MB
- Разрешённые типы: jpeg, jpg, png, gif, webp, mp4, webm, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf
- Видео поддерживает streaming (заголовок `Accept-Ranges: bytes`)

---

## Команды

```bash
npm run dev      # Dev сервер (Express + Vite) на порту 5000
npm run build    # Production сборка (tsx script/build.ts)
npm run start    # Запуск production сервера (dist/index.cjs)
npm run check    # TypeScript проверка
npm run db:push  # Синхронизация схемы Drizzle с БД
```

---

## Переменные окружения

| Переменная | Описание | Дефолт |
|-----------|----------|--------|
| `DATABASE_URL` | PostgreSQL строка подключения | обязателен |
| `ADMIN_USERNAME` | Логин администратора | `admin` |
| `ADMIN_PASSWORD` | Пароль администратора | `admin123` |
| `SESSION_SECRET` | Секрет для сессий | `tajikistan-map-secret-key` |
| `UPLOADS_DIR` | Путь к папке загрузок | `./uploads` |
| `PORT` | Порт сервера | `5000` |

---

## Важные технические детали

1. **Двойной FK на тип локации** — в `locations` есть и `locationType` (текстовый slug) и `locationTypeId` (числовой). Текстовый используется для фильтрации/отображения.
2. **Устаревшие поля** — `locations.imageUrl` и `locations.videoUrl` существуют для обратной совместимости, но основное медиа хранится в `location_media`.
3. **Нет soft-delete** — удаление реальное. При удалении локации автоматически удаляется всё её медиа (`deleteLocationMediaByLocationId`).
4. **PDF генерация** — через jsPDF, поддержка кириллицы через Noto шрифт (`client/src/lib/noto-font.ts`).
5. **GeoJSON граница** — данные OSM для отрисовки красной линии границы Таджикистана (`tajikistan-accurate.ts`).
6. **terrain source** — в OSM стиле нет terrain source, но `terrain` пропс передаётся в Map. При Minimal стиле рельеф подтягивается из CartoCDN.
