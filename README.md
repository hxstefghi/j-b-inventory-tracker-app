# JB Inventory Tracker - Documentation

Cross-platform chicken shop inventory management app built with **Expo SDK 54**, **React Native 0.81**, **TypeScript 5.9**, and **Supabase** (PostgreSQL). Enables cashiers to track daily inventory, enter POS sales, and generate PDF reports — all from a mobile device.

> **Brand**: JB Chicken (Orange / Black / White theme)  
> **Platform**: iOS & Android  
> **UI**: Light mode only, iOS-inspired minimalist design

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Architecture Overview](#2-architecture-overview)
3. [Routing (Expo Router)](#3-routing-expo-router)
4. [Screens](#4-screens)
5. [Design System](#5-design-system)
6. [Component Library](#6-component-library)
7. [Database](#7-database)
8. [API / Query Layer](#8-api--query-layer)
9. [Authentication](#9-authentication)
10. [Menu Configuration](#10-menu-configuration)
11. [POS Sales & Inventory Flow](#11-pos-sales--inventory-flow)
12. [PDF Export](#12-pdf-export)
13. [Utilities](#13-utilities)
14. [Project Structure](#14-project-structure)
15. [Configuration Files](#15-configuration-files)

---

## 1. Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI
- A Supabase project (see `backend/SUPABASE_SETUP.md`)

### Install & Run

```bash
cd mobile-frontend
npm install
npx expo start
```

| Command                    | Description      |
| -------------------------- | ---------------- |
| `npx expo start`           | Start dev server |
| `npx expo start --android` | Run on Android   |
| `npx expo start --ios`     | Run on iOS       |
| `npx expo start --web`     | Run on web       |
| `npm run lint`             | Run ESLint       |

### Environment Variables

Set these in `mobile-frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Expo Router (File-based routing)                       │
│  app/_layout.tsx ── app/(auth)/ ── app/(tabs)/         │
│                    └ app/session/                       │
├─────────────────────────────────────────────────────────┤
│  Components Layer                                       │
│  components/ui/*    (Button, Input, Card, Badge, etc.)  │
│  components/text.tsx (Typography system)                │
├─────────────────────────────────────────────────────────┤
│  State & Logic                                          │
│  hooks/use-auth.ts   hooks/use-color-scheme.ts          │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  lib/supabase.ts     lib/db/schema.ts    lib/db/queries │
├─────────────────────────────────────────────────────────┤
│  Constants & Config                                     │
│  constants/colors.ts  constants/spacing.ts              │
│  constants/typography.ts  constants/menu.ts             │
├─────────────────────────────────────────────────────────┤
│  Utilities                                              │
│  utils/format.ts     utils/pdf.ts                       │
└─────────────────────────────────────────────────────────┘
```

### Key Dependencies

| Library                                  | Purpose                  |
| ---------------------------------------- | ------------------------ |
| `expo-router` ~6.0                       | File-based navigation    |
| `@supabase/supabase-js` ~2.101           | Backend database & auth  |
| `drizzle-orm` ~0.45                      | ORM schema definitions   |
| `react-native-reanimated` ~4.1           | Animations               |
| `expo-print` + `expo-sharing`            | PDF generation & sharing |
| `expo-haptics`                           | Haptic feedback          |
| `@expo-google-fonts/plus-jakarta-sans`   | Font family              |
| `@shopify/flash-list`                    | High-performance lists   |
| `@react-native-community/datetimepicker` | Date picker              |

---

## 3. Routing (Expo Router)

All routes are defined in `mobile-frontend/app/`. Expo Router uses file-based routing — the file path determines the URL.

```
app/
├── _layout.tsx              # Root layout (auth guard + fonts + theme)
├── modal.tsx                # Example modal screen
├── (auth)/                  # Auth group (unauthenticated users)
│   ├── login.tsx            # Login screen
│   └── signup.tsx           # Sign up screen
├── (tabs)/                  # Tab navigator (authenticated users)
│   ├── _layout.tsx          # Custom tab bar with FAB
│   ├── index.tsx            # Home screen
│   ├── explore.tsx          # History screen (SectionList)
│   ├── items.tsx            # Preset items management
│   └── profile.tsx          # Profile & settings
└── session/                 # Session stack (authenticated users)
    ├── new.tsx              # Create new session (modal)
    └── [id].tsx             # Session detail / inventory table
```

### Root Layout (`app/_layout.tsx`)

- Loads **Plus Jakarta Sans** fonts via `expo-font`
- Wraps app in `ThemeProvider` (light/dark, though light is forced)
- Uses `useProtectedRoute()` to redirect:
  - Unauthenticated → `/(auth)/login`
  - Authenticated on auth screens → `/(tabs)`
- Prevents splash screen from hiding until fonts and auth are ready

### Auth Guard Logic

```ts
function useProtectedRoute(session, isReady) {
  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, isReady]);
}
```

---

## 4. Screens

### 4.1 Login (`app/(auth)/login.tsx`)

- Email + password form with validation
- Error states on each field
- "Sign In" button and "Create Account" link
- Uses `useAuth().signIn()`
- On success, navigates to `/(tabs)`

### 4.2 Sign Up (`app/(auth)/signup.tsx`)

- Full name, email, password, confirm password
- Per-field validation:
  - Full name: required, min 2 chars
  - Email: valid format required
  - Password: min 6 chars
  - Confirm: must match password
- Uses `useAuth().signUp()` which also creates a profile
- On success, shows alert and navigates to `/(tabs)`

### 4.3 Home (`app/(tabs)/index.tsx`)

- Greeting with user's first name
- Stats cards: Total Sessions, Open count, Closed count
- Recent Activity list (last 5 sessions)
- Empty state with call-to-action
- Pull-to-refresh
- Tapping a session → `/session/[id]`

**Data**: `getSessionsByUser(userId, 5)` + `getProfile(userId)`

### 4.4 History (`app/(tabs)/explore.tsx`)

- `SectionList` grouped by date
- Three filter tabs: All / Open / Closed
- Each session shows:
  - Shift badge (AM = orange, PM = black)
  - Cashier name
  - Status indicator dot
- Pull-to-refresh
- Tapping a session → `/session/[id]`

**Data**: `getSessionsByUser(userId, 100)`

### 4.5 Items (`app/(tabs)/items.tsx`)

- Preset items management (items reused across sessions)
- Two sections: **Raw Inventory** and **Menu Items**
- Tap to edit, long-press to delete (with confirmation)
- Add/Edit modal with:
  - Item name (required)
  - Category picker (Menu Item / Raw Inventory)
  - Price input (`NumberInput`)
- Haptic feedback on save/delete

**Data**: `getPresetsByUser`, `createPreset`, `updatePreset`, `deletePreset`

### 4.6 Profile (`app/(tabs)/profile.tsx`)

- Avatar circle, user name, email, role badge
- Stats: session count, member since
- Menu items: Edit Profile, Settings, Help & Support
- Sign Out button with confirmation alert

**Data**: `getProfile`, `getSessionsByUser` (for count)

### 4.7 New Session (`app/session/new.tsx`)

- Presented as a modal
- Fields:
  - **Date**: Touchable date button → `DateTimePicker` (max: today)
  - **Shift**: AM/PM toggle (auto-detects from current time)
  - **Cashier Name**: auto-filled from profile, editable
- Preview card showing date/shift/cashier
- "Start Session" button
- On create:
  1. Checks for existing open session (date + shift) — warns if found
  2. Creates session in Supabase
  3. Auto-creates **12 raw inventory items** (chicken, rice, gravy, etc.)
  4. Navigates to `/session/[id]`

### 4.8 Session Detail (`app/session/[id].tsx`)

The largest screen (2034 lines). Two-step flow:

#### Step 1: POS Data Entry

- Menu items grouped by 7 categories (Meals with Rice, Ala Carte, Assorted, Combos, Chicken Skin, Extras, Drinks)
- +/- quantity controls with inline text input
- Summary card: items sold count + total sales (PHP)
- Live "Calculated Raw Inventory" preview
- "Next: Review Inventory" button saves to `pos_sales` table

#### Step 2: Inventory Review

- Cards for each inventory item with fields:
  1. **Beginning Balance**
  2. **Delivery** & **Pull Out** (stock changes)
  3. **Ending**
  4. **Sold Out** (auto-calculated from POS for new sessions)
- Remarks field + total display
- Long-press to delete items
- "Add Item" button opens preset picker modal
- Bottom action bar: Back to POS, Export PDF, Complete (close session)
- Unsaved changes warning on navigation away

**Revenue Calculation**:

- Chicken items: revenue from combo meals (`calculateChickenRevenueFromPOS`)
- Coke 1.5L: revenue from menu item sales (`calculateCoke15LRevenueFromPOS`)
- All other items: `sold_out * price`

---

## 5. Design System

### 5.1 Color Palette (`constants/colors.ts`)

| Token           | Value     | Usage                                          |
| --------------- | --------- | ---------------------------------------------- |
| `primary`       | `#FF6B00` | Brand orange — buttons, accents, active states |
| `primaryLight`  | `#FF8534` | Hover/light backgrounds                        |
| `primaryDark`   | `#E55A00` | Pressed states                                 |
| `secondary`     | `#1A1A1A` | Near-black text, dark surfaces                 |
| `background`    | `#F5F5F5` | Screen backgrounds                             |
| `surface`       | `#FFFFFF` | Cards, inputs, modals                          |
| `textPrimary`   | `#1A1A1A` | Primary text                                   |
| `textSecondary` | `#666666` | Secondary text                                 |
| `textMuted`     | `#999999` | Placeholders, captions                         |
| `success`       | `#22C55E` | Open status, positive                          |
| `warning`       | `#F59E0B` | Warnings                                       |
| `error`         | `#EF4444` | Errors, destructive actions                    |
| `border`        | `#E5E5E5` | Default borders                                |
| `borderLight`   | `#F0F0F0` | Subtle dividers                                |

### 5.2 Typography (`constants/typography.ts`)

**Font**: Plus Jakarta Sans (5 weights)

| Variant         | Size | Weight    | Usage              |
| --------------- | ---- | --------- | ------------------ |
| `displayLarge`  | 32px | ExtraBold | Large totals       |
| `h1`            | 24px | Bold      | Screen titles      |
| `h2`            | 20px | SemiBold  | Section headers    |
| `h3`            | 18px | SemiBold  | Card titles        |
| `body`          | 16px | Regular   | Body text          |
| `bodySmall`     | 14px | Regular   | Secondary text     |
| `label`         | 14px | Medium    | Form labels        |
| `caption`       | 12px | Regular   | Timestamps, badges |
| `button`        | 16px | SemiBold  | Button text        |
| `overline`      | 12px | SemiBold  | Uppercase labels   |
| `numberRegular` | 14px | Regular   | Table cells        |
| `numberBold`    | 18px | ExtraBold | Table totals       |
| `numberLarge`   | 24px | ExtraBold | Grand totals       |

### 5.3 Spacing (`constants/spacing.ts`)

**8pt Grid System**:

| Token | Pixels |
| ----- | ------ |
| `xs`  | 4      |
| `sm`  | 8      |
| `md`  | 16     |
| `lg`  | 24     |
| `xl`  | 32     |
| `2xl` | 48     |
| `3xl` | 64     |

**Touch-friendly sizing**:

| Element          | Height |
| ---------------- | ------ |
| Button           | 48px   |
| Input            | 48px   |
| Icon button      | 44px   |
| FAB              | 56px   |
| List item        | 56px   |
| Min touch target | 44px   |

### 5.4 Shadows

Four shadow presets using iOS-style elevation:

- `small` — cards, sections (elevation 2)
- `medium` — modals, elevated cards (elevation 4)
- `large` — tab bar, FAB (elevation 8)
- `card` — session cards (elevation 3)

---

## 6. Component Library

All reusable UI components live in `components/ui/` and are barrel-exported from `index.ts`.

### 6.1 Button (`components/ui/button.tsx`)

| Prop        | Values                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| `variant`   | `primary` (orange), `secondary` (outlined), `ghost`, `destructive` (red) |
| `size`      | `default` (48px), `small` (40px), `large` (56px)                         |
| `fullWidth` | Boolean                                                                  |
| `loading`   | Shows `ActivityIndicator`                                                |
| `disabled`  | 40% opacity                                                              |
| `icon`      | Optional icon node (left or right)                                       |

Features: haptic feedback on press, scale animation on press, opacity on disabled.

### 6.2 Input (`components/ui/input.tsx`)

| Prop         | Values                            |
| ------------ | --------------------------------- |
| `label`      | Optional label above input        |
| `error`      | Error message (red border + text) |
| `helperText` | Helper text below input           |
| `required`   | Adds red asterisk to label        |

**NumberInput** variant: strips non-numeric characters, supports `min`/`max`/`step` validation.

### 6.3 Card (`components/ui/card.tsx`)

| Prop        | Values                                                                |
| ----------- | --------------------------------------------------------------------- |
| `variant`   | `default` (shadow), `elevated` (stronger shadow), `outlined` (border) |
| `pressable` | Makes card tappable with haptic feedback                              |
| `noPadding` | Removes default padding                                               |

Sub-components: `CardHeader`, `CardContent`, `CardFooter`.

### 6.4 Badge (`components/ui/badge.tsx`)

| Prop      | Values                                           |
| --------- | ------------------------------------------------ |
| `variant` | `success`, `warning`, `error`, `info`, `neutral` |
| `size`    | `default`, `small`                               |

**StatusBadge** convenience: `open` → success, `closed` → neutral.

### 6.5 IconSymbol (`components/ui/icon-symbol.tsx`)

Maps semantic icon names to MaterialIcons glyphs. Typed `IconKey` for autocomplete.

```ts
// Usage
<IconSymbol name="home" size={24} color={Colors.primary} />
```

OS-specific: `icon-symbol.ios.tsx` uses SF Symbols via `expo-symbols`.

### 6.6 Other Components

| Component            | File                       | Purpose                                      |
| -------------------- | -------------------------- | -------------------------------------------- |
| `IconButton`         | `icon-button.tsx`          | Circular icon button (44px), haptic feedback |
| `Divider`            | `divider.tsx`              | Horizontal or vertical line separator        |
| `Collapsible`        | `collapsible.tsx`          | Expandable section with chevron animation    |
| `Text`               | `text.tsx`                 | Typography system with variant + color props |
| `ThemedText`         | `themed-text.tsx`          | Legacy text with theme-aware colors          |
| `ThemedView`         | `themed-view.tsx`          | Legacy themed background container           |
| `HapticTab`          | `haptic-tab.tsx`           | Tab bar wrapper with haptic feedback         |
| `ParallaxScrollView` | `parallax-scroll-view.tsx` | Scroll view with parallax header             |

---

## 7. Database

### 7.1 Schema

5 tables defined via Drizzle ORM in `lib/db/schema.ts`:

#### `profiles`

| Column      | Type      | Notes                                   |
| ----------- | --------- | --------------------------------------- |
| `id`        | UUID (PK) | Matches Supabase Auth user ID           |
| `full_name` | TEXT      | User's display name                     |
| `role`      | ENUM      | `cashier` or `admin` (default: cashier) |

#### `inventory_sessions`

| Column         | Type      | Notes                    |
| -------------- | --------- | ------------------------ |
| `id`           | UUID (PK) | Auto-generated           |
| `user_id`      | UUID (FK) | References `profiles.id` |
| `session_date` | DATE      | Inventory date           |
| `shift`        | ENUM      | `AM` or `PM`             |
| `cashier_name` | TEXT      | Cashier's display name   |
| `table_number` | TEXT      | Default: "Table 1"       |
| `status`       | ENUM      | `open` or `closed`       |

#### `inventory_items`

| Column        | Type      | Notes                                 |
| ------------- | --------- | ------------------------------------- |
| `id`          | UUID (PK) | Auto-generated                        |
| `session_id`  | UUID (FK) | References `inventory_sessions.id`    |
| `item_name`   | TEXT      | e.g., "Chicken", "Rice"               |
| `unit`        | TEXT      | e.g., "pcs", "servings"               |
| `beg_balance` | TEXT      | Accepts numbers or strings like "N/A" |
| `delivery`    | TEXT      | Stock added                           |
| `pull_out`    | TEXT      | Stock removed                         |
| `sold_out`    | TEXT      | Calculated or manual entry            |
| `price`       | NUMERIC   | Unit price                            |
| `ending`      | TEXT      | Manual entry (not auto-computed)      |
| `total`       | NUMERIC   | Computed: `sold_out * price`          |
| `remarks`     | TEXT      | Optional notes                        |
| `sort_order`  | INTEGER   | Display order                         |

#### `preset_items`

| Column          | Type      | Notes                               |
| --------------- | --------- | ----------------------------------- |
| `id`            | UUID (PK) | Auto-generated                      |
| `user_id`       | UUID (FK) | References `profiles.id`            |
| `item_name`     | TEXT      | Display name                        |
| `category`      | ENUM      | `raw_inventory` or `menu_item`      |
| `default_price` | NUMERIC   | Default price when added to session |
| `sort_order`    | INTEGER   | Display order                       |

#### `pos_sales`

| Column          | Type      | Notes                              |
| --------------- | --------- | ---------------------------------- |
| `id`            | UUID (PK) | Auto-generated                     |
| `session_id`    | UUID (FK) | References `inventory_sessions.id` |
| `menu_item_id`  | TEXT      | References `MENU_ITEMS` constant   |
| `quantity_sold` | INTEGER   | Number sold                        |

### 7.2 TypeScript Types (`lib/database.types.ts`)

Full type definitions matching the Supabase response format (snake_case):

```ts
type Session = Database["public"]["Tables"]["inventory_sessions"]["Row"];
type SessionWithItems = Session & { items: InventoryItem[] };
type SessionSummary = {
  id: string;
  session_date: string;
  shift: "AM" | "PM";
  status: "open" | "closed";
  item_count: number;
  grand_total: number;
};
```

### 7.3 Row Level Security

All tables have RLS policies configured via the Supabase setup guide (`backend/SUPABASE_SETUP.md`).

---

## 8. API / Query Layer

All queries in `lib/db/queries.ts`. Pattern: destructure `{ data, error }`, throw on error.

### Profiles

| Function                          | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `getProfile(userId)`              | Get user profile (returns null if not found) |
| `createProfile(userId, fullName)` | Create profile with cashier role             |
| `updateProfile(userId, updates)`  | Update profile fields                        |

### Sessions

| Function                              | Description                      |
| ------------------------------------- | -------------------------------- |
| `getSessionsByUser(userId, limit?)`   | List sessions (newest first)     |
| `getSessionById(sessionId)`           | Single session                   |
| `getOpenSession(userId, date, shift)` | Check for duplicate open session |
| `createSession(session)`              | Insert session                   |
| `updateSession(sessionId, updates)`   | Update session                   |
| `closeSession(sessionId)`             | Set status to 'closed'           |

### Items

| Function                       | Description                     |
| ------------------------------ | ------------------------------- |
| `getItemsBySession(sessionId)` | List items sorted by sort_order |
| `createItem(item)`             | Insert item                     |
| `updateItem(itemId, updates)`  | Update item fields              |
| `deleteItem(itemId)`           | Delete item                     |
| `reorderItems(items)`          | Batch update sort_order         |

### Presets

| Function                          | Description                       |
| --------------------------------- | --------------------------------- |
| `getPresetsByUser(userId)`        | List presets sorted by sort_order |
| `createPreset(preset)`            | Insert preset                     |
| `updatePreset(presetId, updates)` | Update preset                     |
| `deletePreset(presetId)`          | Delete preset                     |

### POS Sales

| Function                                             | Description                          |
| ---------------------------------------------------- | ------------------------------------ |
| `getPosSalesBySession(sessionId)`                    | Get all POS sales for a session      |
| `upsertPosSale(sessionId, menuItemId, quantitySold)` | Upsert single sale                   |
| `upsertPosSalesBatch(sessionId, sales[])`            | Batch upsert (used on "Next" button) |
| `deletePosSalesBySession(sessionId)`                 | Clear all POS sales for session      |

### Aggregate

| Function                         | Description                              |
| -------------------------------- | ---------------------------------------- |
| `getSessionWithItems(sessionId)` | Session + items + grandTotal calculation |

---

## 9. Authentication

### Auth Hook (`hooks/use-auth.ts`)

Uses Supabase Auth with email/password.

| Method                              | Description                        |
| ----------------------------------- | ---------------------------------- |
| `signUp(email, password, fullName)` | Creates auth user + profile record |
| `signIn(email, password)`           | Email/password sign in             |
| `signOut()`                         | Clear session                      |
| `session`                           | Current Supabase session           |
| `user`                              | Current user object                |
| `loading`                           | True while initial session loads   |

### Auth Flow

1. App loads → `supabase.auth.getSession()`
2. `onAuthStateChange` listener monitors changes
3. `_layout.tsx` `useProtectedRoute` redirects based on session state
4. Splash screen stays visible until auth + fonts are ready

### Supabase Client (`lib/supabase.ts`)

- Reads config from `app.json` `extra` or `process.env`
- Uses `AsyncStorage` for session persistence
- Configures auto-refresh and session persistence

---

## 10. Menu Configuration

All menu items and inventory definitions in `constants/menu.ts` (381 lines).

### Menu Categories

7 categories: Meals with Rice, Ala Carte, Assorted Parts, Combo Meals, Chicken Skin, Extras, Drinks.

### Raw Inventory Items (12 items)

| ID                  | Name              | Unit     | Price |
| ------------------- | ----------------- | -------- | ----- |
| `chicken`           | Chicken           | pcs      | —     |
| `chicken_skin_60g`  | Chicken Skin 60g  | pcs      | P50   |
| `chicken_skin_120g` | Chicken Skin 120g | pcs      | P100  |
| `rice`              | Rice              | servings | P20   |
| `gravy_1oz`         | Gravy 1oz         | servings | P15   |
| `gravy_3oz`         | Gravy 3oz         | servings | P30   |
| `water`             | Water             | bottles  | P15   |
| `coke_mismo`        | Coke Mismo        | bottles  | P25   |
| `cups_coke`         | Cups Coke         | cups     | P1    |
| `coke_1_5l`         | Coke 1.5L         | bottles  | —     |
| `spicy_sauce`       | Spicy Sauce       | servings | P5    |
| `spicy`             | Spicy             | servings | P5    |

### Menu Items (20 items)

Each has a `recipe` mapping raw ingredients consumed. Key rules:

- Rice in meals combos is **NOT** tracked (only Extra Rice)
- Coke in combo meals is **NOT** tracked (only individual orders)
- Chicken skin items map to their respective 60g/120g variants

### Helper Functions

| Function                                | Description                               |
| --------------------------------------- | ----------------------------------------- |
| `getMenuItemsByCategory(category)`      | Filter items by category                  |
| `calculateRawInventoryFromSales(sales)` | Calculate ingredient usage from POS sales |
| `getRawInventoryItem(id)`               | Find raw item by ID                       |
| `getMenuItem(id)`                       | Find menu item by ID                      |

---

## 11. POS Sales & Inventory Flow

### New-Style Session Flow

```
Create Session (new.tsx)
    │
    ├─ Auto-create 12 raw inventory items
    │
    ▼
POS Data Entry (Step 1)
    │
    ├─ Enter quantities sold per menu item
    ├─ See live "Calculated Raw Inventory" preview
    ├─ Live total sales (PHP) displayed
    │
    ▼
Save POS → upsertPosSalesBatch() → pos_sales table
    │
    ▼
Inventory Review (Step 2)
    │
    ├─ Sold Out values auto-calculated from POS
    │  (via calculateRawInventoryFromSales recipes)
    ├─ Chicken revenue from combo meals
    ├─ Coke 1.5L revenue from menu items
    ├─ Manually enter Beg Balance, Delivery, Pull Out, Ending
    │
    ▼
Export PDF or Close Session
```

### Old-Style Sessions (no POS)

For sessions without raw inventory items, the POS step is skipped entirely. Cashiers manually enter all fields including "Sold Out".

### Revenue Calculation

```ts
// Non-chicken items: soldOut * price
// Chicken items: sum of combo meal prices that contain chicken
// Coke 1.5L items: sum of menu item prices that contain coke_1_5l
```

---

## 12. PDF Export

### Module: `utils/pdf.ts` (394 lines)

Generates an HTML table that matches the paper inventory format, then converts to PDF via `expo-print`.

**PDF Features**:

- Header: cashier name, date, shift, status
- Table columns: Item, Beg Balance, Delivery, Pull Out, Ending, Sold Out, Price, Total, Remarks
- Auto-calculated sold out values from POS
- Chicken revenue from combo meals
- Coke 1.5L revenue from menu item sales
- Grand total (POS revenue)
- Generated timestamp in Philippines timezone
- Orange/Black/White minimalist theme

**Usage**:

```ts
await generateSessionPDF(
  session,
  items,
  grandTotal,
  calculatedSoldOut,
  posTotal,
  chickenRevenue,
  coke15LRevenue,
);
```

Shares via native share sheet (`expo-sharing`).

---

## 13. Utilities

### Formatting (`utils/format.ts`)

| Function                     | Example                    |
| ---------------------------- | -------------------------- |
| `formatCurrency(6265)`       | `P6,265.00`                |
| `formatNumber(1234.5)`       | `1,234.5`                  |
| `formatDate(new Date())`     | `04/03/26`                 |
| `formatDateLong(new Date())` | `April 3, 2026`            |
| `formatTime(new Date())`     | `2:30 PM`                  |
| `formatDateTime(new Date())` | `April 3, 2026 2:30 PM`    |
| `parseCurrency("P6,265.00")` | `6265`                     |
| `getCurrentShift()`          | `AM` or `PM` (auto-detect) |

All use Filipino locale (`en-PH`).

---

## 14. Project Structure

```
jb-inventory-tracker-app/
├── mobile-frontend/
│   ├── app/                          # Expo Router screens
│   │   ├── _layout.tsx               # Root layout + auth guard
│   │   ├── modal.tsx                 # Example modal
│   │   ├── (auth)/                   # Auth screens
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── (tabs)/                   # Main tab screens
│   │   │   ├── _layout.tsx           # Custom tab bar
│   │   │   ├── index.tsx             # Home
│   │   │   ├── explore.tsx           # History
│   │   │   ├── items.tsx             # Preset items
│   │   │   └── profile.tsx           # Profile
│   │   └── session/                  # Session screens
│   │       ├── new.tsx               # Create session
│   │       └── [id].tsx              # Session detail (2034 lines)
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── divider.tsx
│   │   │   ├── icon-button.tsx
│   │   │   ├── icon-symbol.tsx
│   │   │   ├── icon-symbol.ios.tsx
│   │   │   └── input.tsx
│   │   ├── text.tsx                  # Typography system
│   │   ├── themed-text.tsx           # Legacy themed text
│   │   ├── themed-view.tsx           # Legacy themed view
│   │   ├── external-link.tsx         # App link opener
│   │   ├── haptic-tab.tsx            # Haptic tab wrapper
│   │   ├── hello-wave.tsx            # Animated wave
│   │   └── parallax-scroll-view.tsx  # Parallax scrolling
│   ├── constants/
│   │   ├── colors.ts                 # Color palette + shadows
│   │   ├── menu.ts                   # Menu items + recipes
│   │   ├── spacing.ts                # Spacing, sizing, radius
│   │   ├── theme.ts                  # Theme aggregation
│   │   └── typography.ts             # Font sizes, weights, presets
│   ├── hooks/
│   │   ├── use-auth.ts               # Supabase auth hook
│   │   ├── use-color-scheme.ts       # Color scheme hook
│   │   ├── use-color-scheme.web.ts   # Web-compatible version
│   │   └── use-theme-color.ts        # Theme color accessor
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client config
│   │   ├── database.types.ts         # Full DB type defs
│   │   └── db/
│   │       ├── index.ts              # Barrel export
│   │       ├── schema.ts             # Drizzle ORM schemas
│   │       └── queries.ts            # All database queries
│   ├── utils/
│   │   ├── format.ts                 # Currency/date formatting
│   │   └── pdf.ts                    # PDF generation
│   ├── assets/images/                # App icons, splash
│   ├── scripts/                      # reset-project.js
│   ├── .env                          # Supabase credentials
│   ├── app.json                      # Expo configuration
│   ├── eas.json                      # EAS Build config
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── SUPABASE_SETUP.md             # Full Supabase setup guide
│   ├── migration_pos_sales.sql       # POS sales migration
│   └── migration_text_fields.sql     # TEXT field migration
├── design-system/
│   └── jb-inventory-tracker/
│       └── MASTER.md                 # Design system spec
├── screenshot/                       # App screenshots
├── .agents/                          # Skills configuration
├── AGENTS.md                         # AI coding agent guide
└── DOCUMENTATION.md                  # This file
```

---

## 15. Configuration Files

### `app.json`

- App name: "JB Inventory Tracker"
- Scheme: `jb-inventory`
- User interface: **light only**
- New architecture enabled
- Splash screen: teal background (`#0D9488`)
- Plugins: `expo-router`, `expo-splash-screen`
- EAS project ID configured

### `tsconfig.json`

- Strict mode enabled
- Path alias: `@/*` → `mobile-frontend/`

### `eas.json`

- Build profiles: `development`, `preview` (APK), `production`
- Auto-increment version in production

### `.vscode/settings.json`

- Auto-fix on save (ESLint)
- Auto-organize imports on save

---

> **Total source files**: ~45 (`.ts`, `.tsx`, `.sql`, `.md`, `.json`)  
> **Total lines of code**: ~14,000  
> **Generated**: June 20, 2026
