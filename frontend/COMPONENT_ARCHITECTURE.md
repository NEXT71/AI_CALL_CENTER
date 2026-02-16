# Component Architecture

This application follows a scalable component-based architecture with small, reusable components.

## Directory Structure

```
src/components/
├── ui/                      # Base UI Components (Design System)
│   ├── Button.jsx          # Reusable button with variants
│   ├── Card.jsx            # Card container with sub-components
│   ├── Badge.jsx           # Status badges
│   ├── Input.jsx           # Form input with icons
│   ├── Select.jsx          # Dropdown select
│   ├── Textarea.jsx        # Text area with character count
│   ├── Modal.jsx           # Modal dialog
│   ├── Alert.jsx           # Alert messages
│   ├── EmptyState.jsx      # Empty state placeholder
│   ├── Spinner.jsx         # Loading spinner
│   └── index.js            # Export all UI components
│
├── dashboard/               # Dashboard-specific components
│   ├── StatCard.jsx        # KPI stat card
│   ├── RecentCallRow.jsx   # Recent call table row
│   ├── SubscriptionCard.jsx # Subscription info card
│   └── index.js
│
├── calls/                   # Call-related components
│   ├── CallInfoCard.jsx    # Call basic info
│   ├── QualityScoresCard.jsx # Quality score display
│   ├── TranscriptCard.jsx  # Call transcript
│   ├── ComplianceCard.jsx  # Compliance violations
│   └── index.js
│
├── common/                  # Shared components
│   ├── SearchBar.jsx       # Search input
│   ├── Pagination.jsx      # Pagination controls
│   ├── Table.jsx           # Data table
│   └── index.js
│
├── AudioPlayer.jsx          # Audio playback
├── AudioTrimmer.jsx         # Audio trimming
├── Layout.jsx               # App layout
├── ProtectedRoute.jsx       # Route protection
├── RoleGuard.jsx            # Role-based access
├── SalesWidget.jsx          # Sales dashboard widget
└── Toast.jsx                # Toast notifications
```

## Usage Examples

### UI Components

```jsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardContent>
    <Input label="Email" type="email" required />
    <Button variant="primary" loading={saving}>Save</Button>
  </CardContent>
</Card>
```

### Dashboard Components

```jsx
import { StatCard, RecentCallRow } from '@/components/dashboard';
import { Phone } from 'lucide-react';

<StatCard 
  icon={Phone}
  label="Total Calls"
  value="1,234"
  change="+12%"
  changeType="positive"
  color="text-blue-600"
/>
```

### Call Components

```jsx
import { CallInfoCard, QualityScoresCard, TranscriptCard } from '@/components/calls';

<CallInfoCard call={callData} />
<QualityScoresCard scores={{ quality: 85, compliance: 92 }} />
<TranscriptCard transcript={call.transcript} />
```

### Common Components

```jsx
import { SearchBar, Pagination, Table } from '@/components/common';

<SearchBar 
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search calls..."
/>

<Pagination 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>

<Table 
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' }
  ]}
  data={users}
/>
```

## Benefits

1. **Reusability**: Components can be used across multiple pages
2. **Maintainability**: Changes in one place affect all usages
3. **Consistency**: Uniform design and behavior
4. **Testability**: Small components are easier to test
5. **Scalability**: Easy to add new components
6. **Performance**: Memoization and optimization possible
7. **Type Safety**: Can add PropTypes or TypeScript easily

## Best Practices

- Keep components small and focused (Single Responsibility)
- Use composition over inheritance
- Memoize expensive components with `React.memo()`
- Extract repeated JSX into components
- Use barrel exports (`index.js`) for clean imports
- Document props with comments or PropTypes
