# QualityPulse - Page Navigation

## Public Marketing Pages

- **Landing Page** - http://localhost:3000/
  - Hero section with CTAs
  - Stats showcase
  - Features grid
  - Pricing table (Starter $299, Professional $799, Enterprise Custom)
  - Testimonials
  - FAQ section

- **About Us** - http://localhost:3000/about
  - Company story and mission
  - Values and technology
  - Industry statistics
  - Industries served

- **Contact** - http://localhost:3000/contact
  - Contact form
  - Support information
  - Office location
  - FAQ section

- **Terms of Service** - http://localhost:3000/terms
  - Complete legal terms
  - 15 comprehensive sections
  - Service description and policies

- **Privacy Policy** - http://localhost:3000/privacy
  - GDPR and CCPA compliant
  - 14 detailed sections
  - Data protection information

## Authentication

- **Login** - http://localhost:3000/login
  - User authentication page

## Application Pages (requires /app prefix)

- **Dashboard** - http://localhost:3000/app/dashboard
  - KPI overview (Total Calls, Avg Quality, Compliance, Sales Conversion)
  - Date range filters
  - Sales performance metrics
  - Recent calls table

- **Calls List** - http://localhost:3000/app/calls
  - Left sidebar with filters
  - Searchable call records
  - Advanced filtering (agent, campaign, status, quality, dates)
  - Export functionality
  - Pagination

- **Call Details** - http://localhost:3000/app/calls/:id
  - Individual call information
  - Audio player
  - Transcription
  - Quality analysis

- **Upload Call** - http://localhost:3000/app/upload
  - Drag & drop file upload
  - Call metadata entry
  - Bulk upload support

- **Compliance Rules** - http://localhost:3000/app/rules
  - Manage compliance phrases
  - Campaign configurations
  - Rule creation and editing

- **Analytics** - http://localhost:3000/app/analytics
  - Advanced analytics dashboard
  - Performance charts
  - Trend analysis

## Navigation Structure

```
Public Routes:
├── / (Landing)
├── /about
├── /contact
├── /terms
├── /privacy
└── /login

Authenticated Routes:
└── /app
    ├── /app/dashboard
    ├── /app/calls
    ├── /app/calls/:id
    ├── /app/upload
    ├── /app/rules
    └── /app/analytics
```

## Important Notes

1. **Public pages** (/, /about, /contact, /terms, /privacy) are accessible without authentication
2. **Application pages** require /app prefix (e.g., /app/dashboard instead of /dashboard)
3. **Logo** is located at `/logo.jpg` (frontend/public/logo.jpg)
4. **Branding** uses "QualityPulse" as the product name
5. **Default redirect** from unknown routes goes to landing page (/)
6. **Authentication** is currently disabled for testing purposes

## Design System

- **Color Palette**: Slate tones with blue accents (#3B82F6)
- **Typography**: Heading scale (heading-1 to heading-4) + body-text, caption-text
- **Components**: KPI cards, stat cards, badges, tables, modals, filters, pagination
- **Style**: Professional enterprise SaaS, no gradients, consistent spacing

## Footer Links (from Landing page)

### Product
- Features
- Pricing
- Demo
- API

### Company
- About (/about)
- Blog
- Careers
- Contact (/contact)

### Legal
- Privacy (/privacy)
- Terms (/terms)
- Security
- Compliance

### Support
- Help Center
- Documentation
- Status
- Contact (/contact)
