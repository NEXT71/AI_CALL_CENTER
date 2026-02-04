# QualityPulse Theme Consistency Guide

## Overview

The QualityPulse application now has a **unified and consistent theme** across all pages, with clear separation between public pages and authenticated app pages.

## Theme Architecture

### 1. **Public Pages Theme** (Light Mode)
Used for pages that don't require authentication:
- Landing page
- Login page
- Signup page
- Forgot Password
- Reset Password
- About page
- Contact page
- Privacy Policy
- Terms of Service

#### Color Palette:
- **Background**: Gradient from slate-50 via white to blue-50/30
- **Cards**: White (`bg-white`) with light borders (`border-slate-200/60`)
- **Text**: Slate-900 for headings, slate-600 for body text
- **Accents**: Blue gradients (blue-600 to indigo-600)
- **Icons**: Gradient backgrounds from blue-600 to indigo-600

#### Key Characteristics:
- Clean, modern light theme
- High contrast for readability
- Soft shadows (`shadow-lg`, `shadow-xl`)
- Smooth gradients and animations
- Professional appearance

### 2. **Authenticated App Theme** (Dark Mode)
Used for pages that require authentication:
- Dashboard
- Calls List
- Analytics
- Reports
- User Management
- Compliance Rules
- System Reports
- Subscription Management

#### Color Palette:
- **Background**: Navy (#0F172A)
- **Cards**: Slate-Blue (#334155)
- **Text**: Cool-White (#F8FAFC)
- **Accents**: Electric-Blue (#3B82F6)
- **Secondary**: Purple and secondary colors

#### Key Characteristics:
- Dark enterprise theme
- Eye-friendly for long usage
- High contrast white text on dark backgrounds
- Professional tech aesthetic
- Consistent with dashboard design systems

---

## Component Styling Standards

### Input Fields

#### Public Pages (Login, Signup, Forgot Password, Reset Password):
```jsx
className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-300"
```

**Standards:**
- 2px border (slate-200)
- Rounded-xl (16px radius)
- 12px padding (top/bottom), 16px (left/right)
- Focus state with blue ring
- Smooth transitions (200ms)

#### Authenticated App (Dashboard, Analytics, etc.):
```jsx
className="input-enhanced"
```
(Uses the dark theme `.input-enhanced` class)

---

### Button Styling

#### Primary Buttons (Public Pages):
```jsx
className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
```

**Standards:**
- Blue-to-indigo gradient background
- White text, semibold weight
- Rounded-xl (16px radius)
- Shadow with blue tint (30% opacity)
- Hover: Enhanced shadow + slight scale (1.02)
- Smooth transitions

#### Button Variants (Public):
- **Primary**: Blue-indigo gradient (shown above)
- **Secondary**: Light gray background (`bg-slate-100`)
- **Destructive**: Red background (`bg-red-600`)

---

### Card Components

#### Public Pages:
```jsx
className="bg-white rounded-2xl shadow-lg border border-slate-200/60"
```

**Standards:**
- White background
- Rounded-2xl (24px radius)
- Light shadow (lg)
- 60% opacity slate border for subtle separation

#### Authenticated App:
```jsx
className="card-enhanced"
```
(Uses dark theme `.card-enhanced` class)

---

### Icons & Accents

#### Public Pages Icon Backgrounds:
```jsx
className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"
```

**Standards:**
- Gradient from blue-600 to indigo-600
- White icons
- Rounded-2xl containers
- Box shadow for depth

---

## Typography

### Public Pages:
- **Headings**: Slate-900 (`text-slate-900`), bold weight
- **Body Text**: Slate-600, regular weight
- **Labels**: Slate-700, medium weight
- **Captions**: Slate-500, smaller text

### Authenticated App:
- **Headings**: Cool-White (`text-cool-white`)
- **Body Text**: Cool-White/80 (`text-cool-white/80`)
- **Labels**: Cool-White/70 (`text-cool-white/70`)
- **Captions**: Cool-White/60 (`text-cool-white/60`)

---

## Background Patterns

### Public Pages:
```jsx
<div className="absolute inset-0 opacity-40 pointer-events-none">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
  <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
</div>
```

**Characteristics:**
- Subtle gradient overlay
- Blurred circular elements
- Low opacity (5-10%) for minimal distraction
- Positioned at page edges

---

## Updated Files & Changes

### Pages Updated to Light Theme:
1. **Login.jsx** - ✅ Updated
   - Background gradient applied
   - White card styling
   - Input field standardization
   - Button gradient styling

2. **Signup.jsx** - ✅ Updated
   - Plan selection cards with white background
   - Form inputs standardized
   - Button styling updated
   - Icon gradients applied

3. **ForgotPassword.jsx** - ✅ Updated
   - Background gradient
   - Card styling
   - Input field standardization

4. **ResetPassword.jsx** - ✅ Updated
   - Background gradient
   - Password input fields
   - Button styling

5. **Privacy.jsx** - ✅ Updated
   - Background gradient
   - White card styling
   - Icon gradient backgrounds

6. **Terms.jsx** - ✅ Updated
   - White card styling
   - Consistent borders and shadows

### Pages Already Consistent (No Changes Needed):
- Landing.jsx (Already using light theme)
- About.jsx (Already using light theme)
- Contact.jsx (Already using light theme)
- Dashboard.jsx (Using dark theme correctly)
- CallsList.jsx (Using dark theme correctly)
- Analytics.jsx (Using dark theme correctly)
- All other authenticated app pages

---

## Tailwind Configuration

The theme is defined in `tailwind.config.js` with custom colors:

### Custom Colors:
```javascript
colors: {
  primary: { /* Blue shades */ },
  secondary: { /* Purple shades */ },
  navy: { DEFAULT: '#0F172A' },
  'slate-blue': { DEFAULT: '#334155' },
  'electric-blue': { DEFAULT: '#3B82F6' },
  'cool-white': { DEFAULT: '#F8FAFC' },
}
```

### Custom Components in `index.css`:
- `.btn-enhanced` - Enhanced button styling
- `.btn-primary-enhanced` - Primary button styling
- `.card-enhanced` - Dark theme card
- `.input-enhanced` - Form input field
- `.kpi-card-enhanced` - KPI statistics card

---

## Best Practices for New Components

### When Creating Public Page Components:
1. Use `bg-gradient-to-br from-slate-50 via-white to-blue-50/30` for backgrounds
2. Use `bg-white rounded-2xl shadow-lg border border-slate-200/60` for cards
3. Use the public input/button styling standards
4. Always include blue-to-indigo gradients for accents
5. Use slate-900/600/500 for text hierarchy

### When Creating Authenticated App Components:
1. Use the dark theme color palette
2. Apply `.card-enhanced` for cards
3. Use `.input-enhanced` for form inputs
4. Use `.btn-primary-enhanced` for buttons
5. Follow the established cool-white text colors

---

## Animation & Transitions

### Public Pages:
- `animate-fade-in` - Fade in with translateY
- `animate-scale-in` - Scale from 0.95 to 1
- `transition-all duration-200` - Smooth transitions
- `hover:scale-[1.02]` - Button scale on hover
- `hover:shadow-xl` - Enhanced shadows on hover

### Authenticated App:
- Uses similar animations but with dark theme adjustments
- Consistent duration (200-300ms) for all transitions

---

## Color Usage Reference

### Blue Gradient (Primary):
```
from-blue-600 via-indigo-600 to-blue-800
or
from-blue-600 to-indigo-600
```

### Text Hierarchy (Public):
- Primary: `text-slate-900` (headings)
- Secondary: `text-slate-700` (labels)
- Tertiary: `text-slate-600` (body)
- Quaternary: `text-slate-500` (captions)

### Borders & Dividers (Public):
- Primary: `border-slate-200/60` (cards)
- Secondary: `border-slate-200` (inputs)
- Light: `border-slate-100` (subtle)

---

## Validation & Error Styling

### Input Error State:
- Border: `border-red-500`
- Ring: `ring-red-500`

### Success Message:
- Background: `bg-emerald-50`
- Border: `border-emerald-100`
- Text: `text-emerald-800`

### Warning/Alert:
- Background: `bg-amber-50`
- Border: `border-amber-200`
- Text: `text-amber-800`

---

## Quality Assurance Checklist

Before committing any new pages/components:

- [ ] Light pages use `bg-gradient-to-br from-slate-50 via-white to-blue-50/30`
- [ ] Dark pages use `bg-navy` or appropriate dark backgrounds
- [ ] Cards use white for public, dark for app
- [ ] Input fields follow standardized styling
- [ ] Buttons use gradient or solid color appropriately
- [ ] Text colors match the theme (slate for light, cool-white for dark)
- [ ] Shadows and borders are consistent
- [ ] Animations are smooth (200-300ms duration)
- [ ] Hover states are clear and professional
- [ ] All icons have gradient backgrounds (public pages)

---

## Accessibility Notes

- ✅ High contrast ratios maintained (WCAG AA)
- ✅ Focus states clearly visible (blue ring)
- ✅ Semantic HTML structure
- ✅ Proper label associations
- ✅ Alt text for all images
- ✅ Keyboard navigation support

---

## Future Enhancements

1. **Dark Mode for Public Pages** (optional)
   - Create inverse theme variants
   - Add theme toggle in navbar

2. **Additional Theme Variants**
   - High contrast mode for accessibility
   - Custom company branding

3. **Animation Library**
   - Consistent animation patterns
   - Reusable transition utilities

---

## Quick Reference Card

| Element | Light Theme | Dark Theme |
|---------|------------|-----------|
| Background | `from-slate-50 via-white to-blue-50/30` | `bg-navy` |
| Card | `bg-white` | `bg-slate-blue` |
| Text (Primary) | `text-slate-900` | `text-cool-white` |
| Text (Secondary) | `text-slate-600` | `text-cool-white/80` |
| Border | `border-slate-200/60` | `border-slate-blue-light` |
| Button | `bg-gradient-to-r from-blue-600 to-indigo-600` | `.btn-primary-enhanced` |
| Input | Standard light styling | `.input-enhanced` |
| Icon Background | `from-blue-600 to-indigo-600` | Varies by context |

---

## Support & Questions

For any questions or updates needed to the theme system, refer to:
- `tailwind.config.js` - Theme configuration
- `src/index.css` - Component styles
- Individual page files for implementation examples

---

**Last Updated:** February 4, 2026
**Maintained By:** Development Team
**Status:** ✅ All pages consistent
