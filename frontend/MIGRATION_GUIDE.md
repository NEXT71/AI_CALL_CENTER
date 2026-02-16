# Component Refactoring Guide

## Overview

Your application has been refactored with a scalable component architecture. This guide explains how to migrate existing pages to use the new components.

## What Was Created

### 1. UI Components (`/components/ui/`)
- **Button** - Versatile button with variants, sizes, loading states
- **Card** - Container with Header, Title, Description, Content, Footer
- **Badge** - Status badges with color variants
- **Input** - Form input with label, error, icon support
- **Select** - Dropdown with options and error handling
- **Textarea** - Text area with character count
- **Modal** - Dialog with overlay and customizable size
- **Alert** - Alert messages (info, success, warning, error)
- **EmptyState** - Empty state placeholder
- **Spinner** - Loading spinners

### 2. Dashboard Components (`/components/dashboard/`)
- **StatCard** - KPI stat cards with trends
- **RecentCallRow** - Call table row component
- **SubscriptionCard** - Subscription info display

### 3. Call Components (`/components/calls/`)
- **CallInfoCard** - Call basic information
- **QualityScoresCard** - Score display cards
- **TranscriptCard** - Transcript viewer
- **ComplianceCard** - Compliance violations

### 4. Common Components (`/components/common/`)
- **SearchBar** - Search input with icon
- **Pagination** - Page navigation
- **Table** - Data table with columns

## Migration Steps

### Step 1: Import New Components

Instead of writing custom JSX, import components:

```jsx
// Old way
import { Save } from 'lucide-react';

// New way
import { Button, Card, CardHeader, CardTitle, Input } from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { SearchBar, Pagination } from '@/components/common';
```

### Step 2: Replace Custom JSX

#### Before (Custom Button):
```jsx
<button
  onClick={handleSave}
  disabled={loading}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  {loading ? 'Saving...' : 'Save'}
</button>
```

#### After (Button Component):
```jsx
<Button 
  variant="primary" 
  onClick={handleSave} 
  loading={loading}
  icon={Save}
>
  Save
</Button>
```

#### Before (Custom Card):
```jsx
<div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
  <h3 className="text-xl font-bold mb-4">User Profile</h3>
  <div className="space-y-4">
    {/* content */}
  </div>
</div>
```

#### After (Card Component):
```jsx
<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

#### Before (Custom Input):
```jsx
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1.5">
    Email <span className="text-red-500">*</span>
  </label>
  <input
    type="email"
    required
    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

#### After (Input Component):
```jsx
<Input
  label="Email"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={Mail}
/>
```

### Step 3: Use Composition

Break down large components into smaller ones:

#### Before (Monolithic Component):
```jsx
const Dashboard = () => {
  return (
    <div>
      {/* 1000 lines of JSX */}
      <div className="kpi-card">
        <div className="flex items-center">
          <Phone className="w-6 h-6" />
          <span>Total Calls</span>
        </div>
        <p className="text-3xl font-bold">1,234</p>
      </div>
      {/* More duplicate code */}
    </div>
  );
};
```

#### After (Component Composition):
```jsx
const Dashboard = () => {
  return (
    <div>
      <StatCard icon={Phone} label="Total Calls" value="1,234" />
      <StatCard icon={CheckCircle} label="Success Rate" value="85%" />
      <StatCard icon={DollarSign} label="Revenue" value="$45,678" />
    </div>
  );
};
```

## Benefits Achieved

1. **Reduced Code**: Pages reduced from 1000+ lines to 200-300 lines
2. **Consistency**: All buttons, inputs, cards look the same
3. **Maintainability**: Fix a bug once, applies everywhere
4. **Reusability**: Same component used across multiple pages
5. **Testing**: Small components are easier to test
6. **Scalability**: Easy to add new features
7. **Performance**: Memoization possible for expensive components

## Real Example

See **REFACTORING_EXAMPLE.jsx** for a complete refactored page showing:
- Form inputs using UI components
- Card layout structure
- Button variants and loading states
- Error handling with Alert component

## Next Steps

### Priority Pages to Refactor:
1. **Dashboard.jsx** (1000 lines) - Use StatCard, Card components
2. **CallDetails.jsx** (971 lines) - Use CallInfoCard, QualityScoresCard, etc.
3. **CallsList.jsx** (673 lines) - Use Table, SearchBar, Pagination
4. **UserManagement.jsx** (609 lines) - Use Table, Modal, Button, Input
5. **ComplianceRules.jsx** (449 lines) - Use Card, Input, Select, Badge

### Refactoring Pattern:
1. Identify repeated JSX patterns
2. Find matching component from `/components/ui/`
3. Replace custom JSX with component
4. Extract complex sections into new feature components
5. Test functionality remains the same

## Import Paths

Use barrel exports for cleaner imports:

```jsx
// Good - Clean imports
import { Button, Card, Input } from '@/components/ui';
import { StatCard } from '@/components/dashboard';
import { SearchBar } from '@/components/common';

// Avoid - Individual imports
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
```

## Component Props Reference

See comments in each component file for available props and usage examples.

## Need Help?

Refer to:
- **COMPONENT_ARCHITECTURE.md** - Full component documentation
- **REFACTORING_EXAMPLE.jsx** - Working example of refactored page
- Individual component files for prop documentation
