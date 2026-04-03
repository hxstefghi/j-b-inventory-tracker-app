# 🚀 Quick Start Guide - JB Inventory Tracker

## ✅ Setup Complete!

Your app is now configured with:
- ✅ Design System (Minimalist Flat Design)
- ✅ Plus Jakarta Sans Typography
- ✅ Base UI Components (Button, Input, Card, Badge, etc.)
- ✅ Supabase Backend Connection
- ✅ Environment Variables Configured

---

## 🏃 Run the App

### Start Development Server

```bash
cd mobile-frontend
npm start
```

### Run on Simulator/Device

After `npm start`, press:
- **`i`** - Open iOS Simulator (Mac only)
- **`a`** - Open Android Emulator
- **`w`** - Open in web browser

Or scan the QR code with:
- **iOS**: Expo Go app
- **Android**: Expo Go app

---

## 🧪 What You'll See

The home screen now shows:

1. **Supabase Connection Status**
   - Should show "CONNECTED" badge in green
   - If error, check your `.env` file

2. **Design System Preview**
   - Typography samples (Plus Jakarta Sans)
   - Currency formatting (₱6,265.00)
   - Button variants (Primary, Secondary, Ghost)
   - Status badges

3. **Next Steps Checklist**

---

## 🔍 Verify Everything Works

### 1. Check Fonts
- Headlines should use Plus Jakarta Sans Bold
- Body text should be clean and readable
- Numbers should align in columns (tabular figures)

### 2. Test Interactions
- Tap buttons - you should feel haptic feedback (on device)
- Buttons should show press state (opacity 0.7)
- All text should be crisp and clear

### 3. Check Colors
- Primary color: Teal (`#0D9488`)
- Accent/CTA color: Orange (`#EA580C`)
- Background should be light gray (`#FAFAFA`)

---

## 📱 Current Screen Structure

```
App (Tabs Navigation)
├── Home (index.tsx) - Design system preview ✅
└── Explore (explore.tsx) - Original demo screen
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to Metro bundler"
**Solution:**
```bash
# Clear cache and restart
cd mobile-frontend
npm start -- --clear
```

### Issue: Fonts not loading
**Solution:**
- Wait for fonts to download on first run
- Check console for font loading errors
- Restart the app

### Issue: "Missing Supabase environment variables"
**Solution:**
- Verify `.env` file exists in `mobile-frontend/`
- Check that variables start with `EXPO_PUBLIC_`
- Restart Metro bundler after adding `.env`

### Issue: Supabase shows "ERROR" status
**Solution:**
1. Verify your Supabase project is running (go to supabase.com)
2. Check the URL and anon key in `.env`
3. Check console for detailed error message

---

## 📖 Next Development Steps

### Phase 3A: Authentication (Recommended Next)
Build the login and sign-up screens:
- Email/password authentication
- Form validation
- Error handling
- Session persistence

### Phase 3B: Dashboard
- Today's sessions (AM/PM cards)
- Quick stats
- "New Session" FAB button

### Phase 3C: Inventory Tracking
- Inline-editable table
- Auto-computed fields
- Grand total footer

---

## 🎨 Using the Design System

### Import Components
```typescript
import { Text, Title, Body, Label } from '@/components/ui';
import { Button, Input, Card, Badge } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
```

### Example Usage
```typescript
// Typography
<Title>Dashboard</Title>
<Body color="textSecondary">Welcome back!</Body>

// Button with haptic feedback
<Button variant="primary" onPress={handleSubmit}>
  Submit
</Button>

// Card with status badge
<Card pressable onPress={handlePress}>
  <Title>Session #1</Title>
  <Badge variant="success">OPEN</Badge>
</Card>

// Currency formatting
import { formatCurrency } from '@/utils/format';
<Text>{formatCurrency(6265)}</Text> // ₱6,265.00
```

---

## 📂 Key Files Reference

| File | Purpose |
|------|---------|
| `app/(tabs)/index.tsx` | Home screen (currently: design system demo) |
| `components/ui/` | Reusable UI components |
| `constants/colors.ts` | Color palette |
| `constants/typography.ts` | Font configuration |
| `constants/spacing.ts` | Spacing & sizing |
| `lib/supabase.ts` | Supabase client |
| `hooks/use-auth.ts` | Authentication hook |
| `utils/format.ts` | Currency/date formatting |

---

## 🎯 Success Criteria

Before moving to next phase, verify:
- ✅ App runs without errors
- ✅ Fonts load correctly (Plus Jakarta Sans)
- ✅ Supabase shows "CONNECTED"
- ✅ Buttons have haptic feedback (on device)
- ✅ Colors match design system
- ✅ Typography is clean and readable

---

## 💬 Ready for Next Phase?

Once you've verified everything works, we can proceed with:
1. **Authentication screens** - Login/Sign up
2. **Dashboard** - Session cards with real data
3. **Inventory tracking** - Core feature

Let me know when you're ready to continue!
