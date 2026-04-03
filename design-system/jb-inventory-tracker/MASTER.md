# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** JB Inventory Tracker
**Generated:** 2026-04-03 20:27:01
**Category:** Productivity Tool

---

## Global Rules

### Color Palette (Light Mode Only)

| Role | Hex | Usage |
|------|-----|-------|
| **Primary** | `#0D9488` | Primary actions, active states, focus |
| **Primary Foreground** | `#FFFFFF` | Text on primary buttons |
| **Secondary** | `#14B8A6` | Secondary actions, highlights |
| **Secondary Foreground** | `#0F172A` | Text on secondary elements |
| **Accent/CTA** | `#EA580C` | Call-to-action buttons, FAB, important actions |
| **Accent Foreground** | `#FFFFFF` | Text on accent buttons |
| **Background** | `#FAFAFA` | App background |
| **Surface** | `#FFFFFF` | Cards, sheets, modals |
| **Text Primary** | `#0F172A` | Headlines, body text (Slate 900) |
| **Text Secondary** | `#475569` | Secondary text, labels (Slate 600) |
| **Text Muted** | `#94A3B8` | Helper text, timestamps (Slate 400) |
| **Success** | `#10B981` | Success messages, confirmations |
| **Warning** | `#F59E0B` | Warning messages, alerts |
| **Error** | `#DC2626` | Error messages, destructive actions |
| **Border** | `#E2E8F0` | Input borders, dividers (Slate 200) |
| **Border Strong** | `#CBD5E1` | Emphasized borders (Slate 300) |
| **Table Header** | `#F1F5F9` | Table header background (Slate 100) |
| **Table Row Alt** | `#F8FAFC` | Alternate row background (Slate 50) |

**Color Strategy:** Teal for productivity/trust + Orange for warmth/action. Optimized for food stall business context (Filipino market).

### Typography

**Font Family:** Plus Jakarta Sans (Single family for consistency)

- **Mood:** Modern, friendly, professional, approachable, clean
- **Best For:** SaaS products, productivity tools, business apps, data-heavy interfaces
- **Why:** Excellent number rendering (critical for inventory), versatile weights, modern feel

**React Native Font Configuration:**
```typescript
// Load fonts in app/_layout.tsx
import { useFonts } from 'expo-font';

const [loaded] = useFonts({
  'PlusJakartaSans-Regular': require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_400Regular,
  'PlusJakartaSans-Medium': require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_500Medium,
  'PlusJakartaSans-SemiBold': require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_600SemiBold,
  'PlusJakartaSans-Bold': require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_700Bold,
  'PlusJakartaSans-ExtraBold': require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_800ExtraBold,
});
```

**Type Scale:**
| Token | Size (px) | Weight | Usage |
|-------|-----------|--------|-------|
| `xs` | 12 | 400/500 | Helper text, timestamps, badges |
| `sm` | 14 | 400/500 | Secondary text, table cells, labels |
| `base` | 16 | 400 | Body text, input values, default |
| `lg` | 18 | 500/600 | Section headers, card titles |
| `xl` | 20 | 600 | Screen subtitles, prominent labels |
| `2xl` | 24 | 700 | Screen titles, modal headers |
| `3xl` | 32 | 800 | Large display numbers, totals, hero |

**Font Weights:**
- **400 Regular** - Body text, descriptions, paragraphs
- **500 Medium** - Labels, navigation items, subtle emphasis
- **600 SemiBold** - Section headers, buttons, card titles
- **700 Bold** - Screen titles, important headers
- **800 ExtraBold** - Large numbers (Grand Total, prices), hero text

**Line Heights:**
| Context | Ratio | Usage |
|---------|-------|-------|
| Tight | 1.2 | Headlines, titles, numbers |
| Normal | 1.5 | Body text, descriptions |
| Relaxed | 1.75 | Long-form content (if any) |

**Letter Spacing:**
| Context | Value | Usage |
|---------|-------|-------|
| Tight | -0.5px | Large headlines (≥24px) |
| Normal | 0px | Body text, most UI |
| Wide | 0.5px | Labels, all-caps text |

**Number Typography (Critical for Inventory):**
- Use **tabular figures** (monospace digits) for table columns
- Use **ExtraBold (800)** for totals and grand totals
- Format currency: `₱` peso sign before number with comma separators
- Example: `₱6,265.00`

### Spacing Variables (8pt Grid System)

| Token | Value (px) | Value (dp) | Usage |
|-------|------------|------------|-------|
| `xs` | 4 | 4dp | Tight internal spacing, icon gaps |
| `sm` | 8 | 8dp | Related elements, inline spacing |
| `md` | 16 | 16dp | Component padding, standard gaps |
| `lg` | 24 | 24dp | Section padding, card spacing |
| `xl` | 32 | 32dp | Screen section gaps, large margins |
| `2xl` | 48 | 48dp | Major section breaks |
| `3xl` | 64 | 64dp | Hero sections (if applicable) |

### Component Sizing (Touch-Friendly)

| Component | Height (pt) | Notes |
|-----------|-------------|-------|
| **Button** | 48 | Meets 44pt minimum touch target |
| **Input Field** | 48 | Comfortable for typing |
| **Table Row** | 52 | Enough for two-line content |
| **List Item** | 56 | Standard list row height |
| **Bottom Nav** | 64 | Includes safe area padding |
| **Header** | 56 | Top navigation/app bar |
| **FAB** | 56 | Floating action button (diameter) |
| **Icon Button** | 44 | Minimum touch target |

### Border Radius

| Element | Radius (px) | Usage |
|---------|-------------|-------|
| Small | 4 | Badges, chips |
| Default | 8 | Buttons, inputs, small cards |
| Medium | 12 | Standard cards, modals |
| Large | 16 | Large cards, bottom sheets |
| Full | 999 | Pill buttons, circular avatars |

### Shadow Depths (React Native Elevation)

**Note:** Use minimal shadows for Flat Design style. React Native shadows require platform-specific config.

| Level | iOS Shadow | Android Elevation | Usage |
|-------|------------|-------------------|-------|
| **None** | `shadowOpacity: 0` | `elevation: 0` | Flat surfaces, inline elements |
| **Subtle** | `shadowOpacity: 0.05, shadowRadius: 2` | `elevation: 1` | Slight lift, input fields |
| **Card** | `shadowOpacity: 0.1, shadowRadius: 4` | `elevation: 2` | Cards, session items |
| **Modal** | `shadowOpacity: 0.15, shadowRadius: 8` | `elevation: 4` | Bottom sheets, modals |
| **FAB** | `shadowOpacity: 0.2, shadowRadius: 8` | `elevation: 6` | Floating action button |

**React Native Shadow Example:**
```typescript
// iOS
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
// Android
elevation: 2,
```

---

## Component Specs (React Native)

### Buttons

```typescript
// Primary Button (Accent/CTA)
const primaryButton = {
  backgroundColor: '#EA580C',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 8,
  height: 48,
  justifyContent: 'center',
  alignItems: 'center',
};

const primaryButtonText = {
  color: '#FFFFFF',
  fontSize: 16,
  fontFamily: 'PlusJakartaSans-SemiBold',
  fontWeight: '600',
};

// Secondary Button (Outline)
const secondaryButton = {
  backgroundColor: 'transparent',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: '#0D9488',
  height: 48,
  justifyContent: 'center',
  alignItems: 'center',
};

const secondaryButtonText = {
  color: '#0D9488',
  fontSize: 16,
  fontFamily: 'PlusJakartaSans-SemiBold',
  fontWeight: '600',
};

// Ghost Button
const ghostButton = {
  backgroundColor: 'transparent',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 8,
  height: 48,
  justifyContent: 'center',
  alignItems: 'center',
};

const ghostButtonText = {
  color: '#0D9488',
  fontSize: 16,
  fontFamily: 'PlusJakartaSans-Medium',
  fontWeight: '500',
};
```

**Interaction States:**
- **Press**: Opacity 0.7, duration 150ms
- **Disabled**: Opacity 0.4, no interaction
- **Haptic**: Use `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` on press

### Cards

```typescript
const card = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  // iOS shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  // Android shadow
  elevation: 2,
};

// Session card variant
const sessionCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 20,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};
```

### Text Inputs

```typescript
const input = {
  height: 48,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 8,
  paddingHorizontal: 16,
  fontSize: 16,
  fontFamily: 'PlusJakartaSans-Regular',
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
};

const inputLabel = {
  fontSize: 14,
  fontFamily: 'PlusJakartaSans-Medium',
  fontWeight: '500',
  color: '#475569',
  marginBottom: 6,
};

const inputError = {
  fontSize: 12,
  fontFamily: 'PlusJakartaSans-Regular',
  color: '#DC2626',
  marginTop: 4,
};

// Focus state: borderColor: '#0D9488'
// Error state: borderColor: '#DC2626'
```

### Badges (Status Indicators)

```typescript
const badgeOpen = {
  backgroundColor: '#10B98120', // 20% opacity
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 999,
  alignSelf: 'flex-start',
};

const badgeOpenText = {
  color: '#10B981',
  fontSize: 12,
  fontFamily: 'PlusJakartaSans-SemiBold',
  fontWeight: '600',
  textTransform: 'uppercase',
};

const badgeClosed = {
  backgroundColor: '#94A3B820',
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 999,
  alignSelf: 'flex-start',
};

const badgeClosedText = {
  color: '#475569',
  fontSize: 12,
  fontFamily: 'PlusJakartaSans-SemiBold',
  fontWeight: '600',
  textTransform: 'uppercase',
};
```

### Modals / Bottom Sheets

```typescript
const modalOverlay = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  flex: 1,
  justifyContent: 'flex-end', // Bottom sheet style
};

const modalContent = {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingTop: 8,
  paddingBottom: 32, // Safe area padding
  paddingHorizontal: 20,
  minHeight: 200,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
};

const modalHandle = {
  width: 40,
  height: 4,
  backgroundColor: '#CBD5E1',
  borderRadius: 2,
  alignSelf: 'center',
  marginBottom: 16,
};
```

### Table / Data Grid

```typescript
const tableHeader = {
  backgroundColor: '#F1F5F9',
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#CBD5E1',
};

const tableHeaderText = {
  fontSize: 12,
  fontFamily: 'PlusJakartaSans-SemiBold',
  fontWeight: '600',
  color: '#475569',
  textTransform: 'uppercase',
};

const tableRow = {
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
  minHeight: 52,
  justifyContent: 'center',
};

const tableCellText = {
  fontSize: 14,
  fontFamily: 'PlusJakartaSans-Regular',
  color: '#0F172A',
};

const tableFooter = {
  backgroundColor: '#F8FAFC',
  paddingVertical: 16,
  paddingHorizontal: 12,
  borderTopWidth: 2,
  borderTopColor: '#CBD5E1',
};

const tableTotalText = {
  fontSize: 18,
  fontFamily: 'PlusJakartaSans-ExtraBold',
  fontWeight: '800',
  color: '#0F172A',
};
```

## React Native Specific Guidelines

### Safe Area Handling
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

// Use SafeAreaView for all screen containers
<SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
  {/* Screen content */}
</SafeAreaView>
```

### Platform-Specific Spacing
```typescript
import { Platform } from 'react-native';

const headerPadding = Platform.select({
  ios: 16,
  android: 20,
});
```

### Keyboard Handling
```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* Form content */}
</KeyboardAvoidingView>
```

### Accessibility Labels
```typescript
// Required for screen readers
<Pressable
  accessibilityLabel="Add new session"
  accessibilityRole="button"
  accessibilityHint="Opens a form to create a new inventory session"
>
  <Text>+ New</Text>
</Pressable>
```

### Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// On button press
const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // ... action
};

// On success
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// On error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### List Performance (For Inventory Items)
```typescript
import { FlashList } from '@shopify/flash-list';

// Use FlashList for better performance with 50+ items
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={52}
  keyExtractor={(item) => item.id}
/>
```

### Press States (Pressable)
```typescript
import { Pressable } from 'react-native';

<Pressable
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    pressed && { opacity: 0.7 }
  ]}
>
  <Text>Press Me</Text>
</Pressable>
```

---

## Style Guidelines

**Style:** Flat Design + Swiss Minimalism Hybrid

**Keywords:** 2D, minimalist, clean, typography-focused, data-dense, professional, no-frills

**Best For:** Productivity tools, business apps, inventory management, dashboards, data-heavy interfaces

**Key Effects:** 
- No gradients (except subtle shadows)
- Simple press states (opacity shift 0.7)
- Fast, responsive interactions
- Clean transitions (150-200ms)
- Minimal use of icons (use `@expo/vector-icons` - Ionicons or MaterialCommunityIcons)

### Animation Timing
| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button press | 150ms | Linear |
| Screen transition | 250ms | Ease-out |
| Modal appear | 300ms | Ease-out |
| Toast | 200ms | Ease-in-out |

### Page Pattern

**Pattern Name:** Minimal Single Column (Mobile-First)

- **Conversion Strategy:** Single CTA focus. Large typography. Generous whitespace. Clear hierarchy.
- **CTA Placement:** Bottom-right FAB for primary action, or full-width button at bottom
- **Navigation:** Bottom tabs (4 items max) for main sections
- **Content Flow:** Vertical scroll, no horizontal scroll except tables

---

## Anti-Patterns (Do NOT Use)

### Design Anti-Patterns
- ❌ **Complex onboarding** — Cashiers need speed, not tutorials
- ❌ **Emojis as icons** — Use `@expo/vector-icons` (Ionicons, MaterialCommunityIcons)
- ❌ **Low contrast text** — Maintain 4.5:1 minimum (WCAG AA)
- ❌ **Invisible focus states** — All interactive elements need clear focus indicators
- ❌ **Gradients** — Keep to Flat Design style (solid colors only)
- ❌ **Decorative shadows** — Only use functional shadows for elevation
- ❌ **Placeholder-only labels** — Inputs must have visible labels above field
- ❌ **Horizontal scroll on main content** — Only allow for wide tables

### React Native Anti-Patterns
- ❌ **Missing SafeAreaView** — Content hidden behind notches/status bars
- ❌ **No keyboard avoidance** — Forms covered by keyboard
- ❌ **Missing accessibility labels** — Screen readers can't navigate
- ❌ **No haptic feedback** — Missing tactile confirmation
- ❌ **Uncontrolled inputs** — Must use `value` + `onChangeText`
- ❌ **Missing platform checks** — iOS/Android need different handling
- ❌ **Large lists without virtualization** — Use FlashList for 50+ items
- ❌ **Instant state changes** — Always animate (150-200ms)
- ❌ **Touch targets <44pt** — Accessibility requirement
- ❌ **Nested horizontal ScrollViews** — Causes gesture conflicts

### Performance Anti-Patterns
- ❌ **Inline function definitions in renderItem** — Causes re-renders
- ❌ **Missing key extractors** — List performance suffers
- ❌ **Heavy computations on main thread** — Use useMemo/useCallback
- ❌ **No loading states** — Users need feedback during async operations
- ❌ **Optimistic updates without error handling** — Show errors gracefully

---

## Pre-Delivery Checklist (React Native)

Before delivering any screen or component, verify:

### Visual Quality
- [ ] No emojis used as icons (use `@expo/vector-icons`)
- [ ] All icons from consistent set (Ionicons or MaterialCommunityIcons)
- [ ] Plus Jakarta Sans fonts loaded and applied
- [ ] Pressed states use opacity 0.7 transition (150ms)
- [ ] Semantic color tokens used (no hardcoded hex in components)
- [ ] Number formatting uses tabular figures (for tables)
- [ ] Currency formatted as `₱6,265.00` (Philippine Peso)

### Interaction
- [ ] All tappable elements ≥44pt touch target (use `hitSlop` if needed)
- [ ] Haptic feedback on button press and important actions
- [ ] Press feedback within 100ms (opacity or color change)
- [ ] Disabled states visually clear (opacity 0.4)
- [ ] No nested horizontal ScrollViews
- [ ] Swipe gestures don't conflict with navigation

### Accessibility
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Form inputs have visible labels (not placeholder-only)
- [ ] Text contrast ≥4.5:1 in light mode
- [ ] Focus order matches visual order
- [ ] Error messages near the related field
- [ ] Screen reader can navigate entire flow

### Layout
- [ ] SafeAreaView used on all screens
- [ ] Content not hidden behind bottom tabs or headers
- [ ] Keyboard avoidance implemented on forms
- [ ] Tested on small phone (375px width)
- [ ] Tested on large phone (414px width)
- [ ] Portrait and landscape orientations work
- [ ] 8dp spacing rhythm maintained
- [ ] No horizontal scroll on main content

### Performance
- [ ] Lists use FlashList for 50+ items
- [ ] No inline functions in renderItem
- [ ] Key extractors defined
- [ ] Heavy computations use useMemo
- [ ] Loading states shown for async operations (>300ms)
- [ ] Optimistic updates with error rollback

### Data/Business Logic
- [ ] Auto-computed fields not editable (ending, total)
- [ ] Negative numbers prevented
- [ ] Grand total always visible (sticky footer)
- [ ] Auto-save on field blur
- [ ] Offline state handled gracefully
