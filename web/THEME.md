# UI Theme Configuration

## Professional SaaS Design System

### Color Palette

#### Primary (Blue)
- Used for main CTAs, interactive elements, and key brand moments
- Variants from 50 (lightest) to 900 (darkest)
- Primary brand color: `primary-600` (#2563eb)

#### Secondary (Slate)
- Used for backgrounds, text, borders, and UI chrome
- Variants from 50 (lightest) to 900 (darkest)
- Main background: `secondary-900` (#0f172a)

#### Success
- Positive actions and confirmations
- Primary: `success-600` (#16a34a)

#### Warning
- Cautions and alerts requiring attention
- Primary: `warning-600` (#d97706)

#### Error
- Destructive actions and error states
- Primary: `error-600` (#dc2626)

### Typography

- Font: System UI stack (Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif)
- Base size: 16px
- Scale: sm (14px), md (16px), lg (18px), xl (20px)

### Spacing Scale

Uses a 4px base unit (0, 4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80px)

### Components

All components are built with:
- TypeScript for type safety
- Tailwind CSS for styling
- Forwarded refs for DOM access
- Semantic HTML where possible
- WCAG compliance in mind

### Component Library

Available in `src/components/`:

- `Button` - Multiple variants (primary, secondary, danger, ghost) and sizes
- `Card` - Container with optional header and footer
- `Badge` - Labels and status indicators
- `Modal` - Dialog component with backdrop
- `Table` - Responsive data tables with custom rendering
- `Spinner` - Loading indicator in multiple sizes
- `EmptyState` - Empty data display with optional action
- `ErrorState` - Error display with retry capability
- `LoadingState` - Full-screen loading state
