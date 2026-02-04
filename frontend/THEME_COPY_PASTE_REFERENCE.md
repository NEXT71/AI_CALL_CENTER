# Theme Quick Start Guide - Copy & Paste Reference

## 🎨 Complete Theme Implementation Quick Reference

---

## PUBLIC PAGES THEME

### 1. Page Background
**Use this for all public page `<div>` containers:**
```jsx
className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 relative overflow-hidden"
```

### 2. Background Decorative Elements
**Add this INSIDE your page container for visual interest:**
```jsx
{/* Background Pattern */}
<div className="absolute inset-0 opacity-40 pointer-events-none">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
  <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
</div>
```

### 3. Main Content Card
**Use this for form containers or main content areas:**
```jsx
className="bg-white rounded-3xl shadow-xl border border-slate-200/60 p-8"
```

### 4. Icon Container
**Use for any icon backgrounds (headers, feature icons, etc.):**
```jsx
className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"
```

### 5. Form Input Fields
**Use for ALL text inputs, email, password, etc.:**
```jsx
className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-300"
```

### 6. Form Labels
**Use above all form inputs:**
```jsx
className="block text-sm font-semibold text-slate-700 mb-2"
```

### 7. Primary Button
**Use for main actions (Login, Sign Up, Submit, etc.):**
```jsx
className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
```

### 8. Secondary Button
**Use for less important actions (Cancel, Back, etc.):**
```jsx
className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-base transition-all duration-200 hover:bg-slate-200 shadow-md hover:shadow-lg"
```

### 9. Text Link
**Use for navigation links:**
```jsx
className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200"
```

### 10. Feature Card (for landing pages)
**Use for feature boxes:**
```jsx
className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
```

### 11. Text Hierarchy
```jsx
// Main Heading
className="text-4xl font-bold text-slate-900"

// Subheading
className="text-2xl font-bold text-slate-900 mb-2"

// Tertiary Heading
className="text-xl font-semibold text-slate-700"

// Body Text
className="text-slate-600 leading-relaxed"

// Small Text / Caption
className="text-sm text-slate-500"

// Tiny Text / Label
className="text-xs text-slate-400 uppercase tracking-wider"
```

### 12. Error Message
**Use for error alerts:**
```jsx
className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3"
```

### 13. Success Message
**Use for success alerts:**
```jsx
className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-3"
```

### 14. Info Banner
**Use for information messages:**
```jsx
className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-start gap-3"
```

---

## AUTHENTICATED APP THEME (Dark)

### 1. Page Background
**Use for all authenticated pages:**
```jsx
className="app-layout min-h-screen bg-slate-50 flex"
```
(The Layout component handles the dark theme styling)

### 2. Main Content Card
**Use for dashboard cards:**
```jsx
className="card-enhanced"
```
**Or with more control:**
```jsx
className="bg-slate-blue rounded-xl border border-slate-blue-light p-6 shadow-sm hover:shadow-md transition-shadow"
```

### 3. Form Inputs (Dark Theme)
**Use for all form fields in authenticated pages:**
```jsx
className="input-enhanced"
```

### 4. Primary Button (Dark Theme)
**Use for main actions:**
```jsx
className="btn-enhanced btn-primary-enhanced"
```

### 5. KPI/Stat Card
**Use for key metrics display:**
```jsx
className="kpi-card-enhanced"
```

### 6. Table Styling
**Use for data tables:**
```jsx
className="table-enhanced-compact"
```

---

## COMPLETE PAGE EXAMPLES

### Example 1: Login Page Template
```jsx
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200/60">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
              <LogInIcon size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome</h1>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          {/* Form */}
          <form className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-300"
                placeholder="you@company.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-300"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Feature Card on Landing Page
```jsx
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
```

---

## COLOR REFERENCE

### Public Pages
```
Primary Background:  #F1F5F9 → #FFFFFF → #EFF6FF (gradient)
Card Background:     #FFFFFF
Text Primary:        #1E293B (slate-900)
Text Secondary:      #475569 (slate-600)
Text Tertiary:       #64748B (slate-500)
Border:              #CBD5E1 at 60% opacity (slate-200/60)
Accent (Button):     #2563EB → #4F46E5 (blue-600 to indigo-600)
Icon Accent:         #2563EB (blue-600)
Shadow:              0 10px 15px rgba(0,0,0,0.1)
```

### Authenticated App (Dark)
```
Background:          #0F172A (navy)
Card Background:     #334155 (slate-blue)
Text Primary:        #F8FAFC (cool-white)
Text Secondary:      #E2E8F0 (cool-white/80)
Text Tertiary:       #CBD5E1 (cool-white/60)
Border:              #475569 (slate-blue-light)
Accent (Button):     #3B82F6 (electric-blue)
Shadow:              More subtle, uses dark colors
```

---

## ANIMATION CLASSES

```jsx
// Fade In
className="animate-fade-in"

// Scale In
className="animate-scale-in"

// Slide In Right
className="animate-slide-in-right"

// Gentle Bounce
className="animate-bounce-gentle"

// Smooth Transition
className="transition-all duration-200"
className="transition-all duration-300"
className="transition-colors duration-200"
```

---

## RESPONSIVE BREAKPOINTS

```jsx
// Mobile First (default)
className="text-lg"

// Tablet (768px)
className="md:text-xl"

// Desktop (1024px)
className="lg:text-2xl"

// Large Desktop (1280px)
className="xl:text-3xl"
```

---

## UTILITY CLASSES TO AVOID

❌ Don't use:
- `.card` (use `.card-enhanced` or inline white styling)
- `.input` (use `.input-enhanced` or inline styling)
- `.btn` (use `.btn-enhanced` or inline gradient)

✅ Do use:
- For public: Inline Tailwind classes (see templates above)
- For app: `.card-enhanced`, `.input-enhanced`, `.btn-primary-enhanced`

---

## COMMON PATTERNS

### Form Group
```jsx
<div>
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    Label
  </label>
  <input className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl..." />
</div>
```

### Button Group
```jsx
<div className="flex gap-3">
  <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600...">
    Primary
  </button>
  <button className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl...">
    Secondary
  </button>
</div>
```

### Alert
```jsx
<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3">
  <AlertIcon className="text-red-600 mt-0.5" />
  <p className="text-sm font-medium">Error message</p>
</div>
```

---

## VALIDATION STATES

### Input Focus
```jsx
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
```

### Input Error
```jsx
border-red-500 focus:ring-red-500 focus:border-red-500
```

### Button Disabled
```jsx
disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
```

---

## ACCESSIBILITY NOTES

✅ Always include:
- `<label>` with `htmlFor` for form inputs
- `alt` text for images
- Keyboard accessible buttons
- Focus visible indicators
- Proper heading hierarchy (h1 → h2 → h3)
- Color contrast ratio > 4.5:1

---

**Ready to use! Copy any section and paste directly into your code.**

Last Updated: February 4, 2026
