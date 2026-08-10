# Technical Architecture — InterviewHub

## 1. Architectural Blueprint & Layer Boundaries

InterviewHub strictly enforces a **4-Layer Control Flow Architecture** with clear boundaries to ensure maintainability, testability, and low technical debt:

```
+-------------------------------------------------------------------+
|                        1. Presentation Layer                      |
|       (React Components, Page Views, UI Layouts, Modals)          |
+-------------------------------------------------------------------+
                                 │
                                 ▼
+-------------------------------------------------------------------+
|                  2. Feature & Business Logic Layer                 |
|       (Custom React Hooks, State Reducers, Quiz Logic)            |
+-------------------------------------------------------------------+
                                 │
                                 ▼
+-------------------------------------------------------------------+
|                     3. Application Service Layer                  |
|       (API Client Abstractions, Data mappers, Utility Services)   |
+-------------------------------------------------------------------+
                                 │
                                 ▼
+-------------------------------------------------------------------+
|                     4. Data Layer (BaaS / SDK)                    |
|       (Supabase SDK Client, PostgreSQL, Storage, RLS Security)    |
+-------------------------------------------------------------------+
```

> [!CAUTION]
> **Strict Rule**: React UI components must NEVER contain direct database calls, raw SQL strings, or third-party backend SDK invocations. All data access must pass through Layer 3 (`src/services/`).

---

## 2. Security & Authorization Pipeline

Frontend role checks and route boundaries exist **solely for UI element visibility and navigation UX**. Actual data protection and authorization are strictly enforced at the database level by Supabase Row-Level Security (RLS).

```
[ Authentication ]
       │
       ▼
[ User Identity ]
       │
       ▼
[ User Role / Profile Data ]
       │
       ▼
[ Frontend Role-Based UI ]  ──►  (Controls menu visibility & client route boundaries)
       │
       ▼
[ Supabase RLS Enforcement ] ──► (Database-level row security & policy authorization)
```

1. **Authentication**: Supabase Auth issues JWT containing user identity (`auth.uid()`).
2. **User Identity & Role Data**: User profile role (`user` vs `admin`) attached to session context.
3. **Frontend UI**: Filters desktop/mobile menus and guards routes (e.g. hiding `/admin` links for regular users).
4. **Supabase RLS Enforcement**: PostgreSQL policies evaluate `auth.uid()` and user roles on every query/mutation to block unauthorized reads, updates, or deletes.

---

## 3. Directory Layout Standards

```
src/
├── app/                  # Application initialization, router provider, root providers
├── components/           # Generic presentation components
│   ├── ui/              # Low-level primitives (Button, Card, Input, Modal, Badge, Spinner)
│   ├── layout/          # Page layouts (Header, DesktopNav, MobileNav, Sidebar, Footer)
│   └── shared/          # Shared composite components (SearchBar, FilterBar, EmptyState)
├── features/             # Feature-sliced domain modules
│   ├── questions/       # Question Bank feature slice
│   ├── quiz/            # Practice Quiz & scoring feature slice
│   ├── progress/        # Progress tracking & weak topic feature slice
│   ├── challenge/       # Daily challenge & streak feature slice
│   ├── community/       # Question submission feature slice
│   └── admin/           # Moderation queue feature slice
├── pages/                # Page route entrypoints (connects routing to features)
├── services/             # Application services layer (Supabase client wrappers, HTTP fetcher)
├── hooks/                # Global custom hooks (e.g. useMediaQuery, useDebounce, useAuth)
├── lib/                  # Helper utilities (cn utility, date formatters, sanitizers)
├── types/                # Global TypeScript type definitions
├── constants/            # App constants, navigation configs, error messages
└── assets/               # Static icons, graphics, SVGs
```

---

## 4. Navigation Architecture

### Desktop Navigation Structure
- **Primary Public Navigation**:
  - `Home` (`/`)
  - `Questions` (`/questions`)
  - `Practice` (`/practice`)
  - `Daily Challenge` (`/daily-challenge`)
- **User Dropdown Menu**:
  - `Dashboard` (`/dashboard`)
  - `Progress` (`/progress`)
  - `Logout`
  *(Note: Standalone Profile page is excluded from MVP).*
- **Admin Navigation** *(Rendered ONLY for users with `role === 'admin'`)*:
  - `Admin Dashboard` (`/admin`)
  - `Review Community Questions` (`/admin/community`)

### Mobile Navigation Structure
- **Mobile Top Header**: App logo, Notification badge, User avatar / Login button.
- **Bottom Navigation Bar** (4 key quick actions):
  1. `Home` (`/`)
  2. `Questions` (`/questions`)
  3. `Practice` (`/practice`)
  4. `Daily` (`/daily-challenge`)
- **Mobile Slide-Over Drawer**: Navigation list including Authenticated User links (`Dashboard`, `Bookmarks`, `Progress`, `Submit Question`) and Admin links if privileged.

---

## 5. UI State Management Standard
All feature hooks handling remote data MUST expose standard state flags:
- `isLoading`: boolean (renders skeleton placeholders or spinner)
- `error`: Error | null (renders user-friendly alert banner with retry button)
- `data`: T | null (renders content UI when successful)
- `isEmpty`: boolean (renders dedicated empty state Graphic & Action)

---

## 6. Admin Security Foundation (Phase 8A)

1. **Trusted Role Source**: User role (`'user'` vs `'admin'`) is derived strictly from `public.users.role` via `authService.fetchUserProfile()`. Client-side metadata (`user_metadata`, `raw_user_meta_data`, `localStorage`) is NEVER trusted for role authorization.
2. **Frontend UX Guard**: `AdminGuard` component enforces navigation UX (redirecting anonymous callers to `/login?redirect=...` and rendering product-safe `403 UnauthorizedView` for regular users). `AdminGuard` is UX ONLY; database RLS is authoritative.
3. **Database RLS Authorization Boundary**: PostgreSQL RLS policies (`EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')`) independently authorize server-side access to `public.community_questions` and `public.questions`.
4. **Developer Bootstrap Strategy**: Developers promote a verified user to admin using trusted SQL Editor: `UPDATE public.users SET role = 'admin' WHERE id = '<verified-user-uuid>';`.

