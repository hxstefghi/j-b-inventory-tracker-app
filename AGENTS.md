# AGENTS.md — JB Inventory Tracker App

## Project Overview
Cross-platform inventory tracker built with **Expo (SDK ~54)**, **React Native 0.81**, **TypeScript ~5.9**, and **Supabase** (PostgreSQL). Uses **Expo Router** for file-based routing, **Drizzle ORM** for schema definitions, and **React Native Reanimated** for animations.

## Quick Start
```bash
cd mobile-frontend
npm install
npx expo start
```

## Commands

| Command | Description |
|---|---|
| `cd mobile-frontend && npx expo start` | Start Expo dev server |
| `cd mobile-frontend && npx expo start --android` | Run on Android |
| `cd mobile-frontend && npx expo start --ios` | Run on iOS |
| `cd mobile-frontend && npx expo start --web` | Run on web |
| `cd mobile-frontend && npm run lint` | Run ESLint |
| `cd mobile-frontend && npm run reset-project` | Reset starter code to clean state |

**No test framework is installed.** If adding tests, use Jest or Vitest with React Native Testing Library.

## Code Style

### Formatting
- **2-space indentation**
- **Single quotes** for strings
- **Semicolons** required
- **Trailing commas** in multi-line structures
- **80-character soft line limit** (not strictly enforced)

### TypeScript
- **Strict mode** enabled (`"strict": true`)
- Use `import type` for type-only imports
- Prefer explicit types on function return values and public APIs
- Use `as const` for design token objects and constant definitions
- Path alias: `@/*` maps to `mobile-frontend/` root

### Imports
Group and order imports (auto-sorted on save via VS Code):
1. React / React Native core
2. Third-party libraries (expo-*, @supabase/*, etc.)
3. Internal modules using `@/` alias
4. Type imports (`import type`)

Within groups, sort alphabetically.

### Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Components | PascalCase | `HomeScreen`, `Button` |
| Files (components) | kebab-case | `icon-symbol.tsx`, `hello-wave.tsx` |
| Files (hooks/utils) | kebab-case | `use-auth.ts`, `format.ts` |
| Hooks | camelCase, `use` prefix | `useAuth`, `useColorScheme` |
| Functions/variables | camelCase | `formatCurrency`, `loadData` |
| Types/Interfaces | PascalCase | `ButtonProps`, `InventorySession` |
| Constants | UPPER_SNAKE_CASE or camelCase | `EMPTY_FORM`, `TAB_CONFIG` |

### Export Patterns
- **Route screens**: `export default function ScreenName()`
- **Reusable UI components**: `export function ComponentName()` (named)
- **Utilities/constants/hooks**: named exports (no default)
- Barrel exports via `index.ts` files (e.g., `components/ui/index.ts`)

### Error Handling
- **Database queries**: destructure `{ data, error }` from Supabase calls; throw on error
  ```ts
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data as SomeType
  ```
- **Screens**: use `try/catch/finally` for async operations
  - Log with `console.error('Error doing X:', error)`
  - Show user-facing errors via `Alert.alert('Error', 'message')`
  - Reset loading state in `finally`
- **Auth/hooks**: use `.catch()` on promises; guard against unmounted state updates

## Architecture

### Routing (Expo Router)
```
app/
  _layout.tsx              # Root layout with auth guard
  (auth)/                  # Route group: login, signup
  (tabs)/                  # Tab navigator: home, history, items, profile
  session/                 # Stack: new session, [id] detail
```
Auth guard in `_layout.tsx` redirects unauthenticated users to `/(auth)/login`.

### Project Structure
```
mobile-frontend/
  app/                     # Expo Router screens
  components/
    ui/                    # Reusable UI (button, input, card, badge, etc.)
    text.tsx               # Text system with typography variants
  constants/               # Design tokens (colors, spacing, typography, borders)
  hooks/                   # Custom hooks (use-auth, use-color-scheme)
  lib/
    supabase.ts            # Supabase client
    db/                    # Drizzle schema + typed query functions
  utils/                   # Formatting and PDF utilities
```

### Design System
- **Primary color**: `#FF6B00` (orange, JB Chicken branding)
- **Spacing**: 8pt grid (4, 8, 16, 24, 32, 48, 64)
- **Typography**: Plus Jakarta Sans, sizes xs(12)–3xl(32)
- **Light mode only** — `userInterfaceStyle: "light"` in app.json
- Components support variants (primary/secondary/ghost/destructive) and sizes (small/default/large)

### Database
- **Supabase** (PostgreSQL) with Row Level Security enabled
- Tables: `profiles`, `inventory_sessions`, `inventory_items`, `preset_items`
- Query functions in `lib/db/queries.ts` follow `get*`, `create*`, `update*`, `delete*` pattern
- Drizzle ORM schemas in `lib/db/schema.ts` with manual TypeScript interfaces

## Guidelines for Adding Code
- Prefer **Expo Router conventions** for new screens and navigation
- Use existing **UI components** from `components/ui/` before creating new ones
- Follow the **design token system** in `constants/` for colors, spacing, typography
- Add **haptic feedback** (`expo-haptics`) on important user actions
- Handle **loading, empty, and error states** in every screen
- Use **pull-to-refresh** pattern on list screens
- The `backend/` folder is currently empty — ask the user before scaffolding backend code
