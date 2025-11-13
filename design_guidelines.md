# IoT Strategy Sprint - Design Guidelines

## Design Approach

**Selected System: Material Design 3**
- Rationale: Information-dense educational game requiring strong component hierarchy, clear interactive feedback, and robust data visualization patterns
- Core principles: Clear visual hierarchy, purposeful interaction feedback, accessible information architecture

## Typography

**Font Family:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for metric values)

**Type Scale:**
- H1 (Game Title): 2.5rem, font-weight 700
- H2 (Round Headers): 2rem, font-weight 600  
- H3 (Section Titles): 1.5rem, font-weight 600
- Card Titles: 1.125rem, font-weight 600
- Body: 1rem, font-weight 400, line-height 1.6
- Small (Tooltips/Helper): 0.875rem, font-weight 400
- Metric Labels: 0.875rem, font-weight 500, uppercase, letter-spacing 0.05em
- Metric Values: 1.5rem, font-weight 700, monospace

## Layout System

**Spacing Primitives (Tailwind units):**
- Core spacing: 4, 6, 8, 12, 16, 24 units (corresponds to 1rem, 1.5rem, 2rem, 3rem, 4rem, 6rem)
- Consistent padding: p-6 for cards, p-8 for sections, p-4 for compact elements
- Gap spacing: gap-4 for tight groupings, gap-6 for card grids, gap-8 for major sections

**Container Strategy:**
- Max-width: 1280px (max-w-7xl) centered
- Side padding: px-6 on mobile, px-8 on desktop
- Vertical rhythm: py-8 between major sections

## Component Library

### 1. Onboarding Screen
- Single-screen centered layout (max-w-4xl)
- IoT process diagram: 4-step horizontal flow with connecting arrows
- Intro text: max-w-prose, centered
- CTA button: Large, prominent, centered below content

### 2. Game Dashboard (Main Screen)
**Layout Structure:**
- Top bar: Round indicator + token counter (sticky)
- Left sidebar (desktop) / Top section (mobile): Metrics panel
- Main content area: Card grid
- Bottom: Action button section

**Metrics Panel:**
- 5 horizontal bars, each with:
  - Label (left-aligned, uppercase)
  - Value (right-aligned, monospace)
  - Progress bar (full-width, 8px height, rounded corners)
  - Subtle animation on value change (300ms ease-out)
- Stack vertically with gap-4
- Panel padding: p-6, rounded corners

### 3. Initiative Cards
**Card Structure:**
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Card dimensions: Flexible height based on content
- Card padding: p-6
- Rounded corners, subtle elevation
- Contains:
  - Title (card-title styling, mb-3)
  - Category badge (top-right, small pill)
  - Short description (body text, mb-4, line-clamp-3)
  - "When to use" section (small text, mb-4)
  - Token allocation control (bottom)

**Token Allocation Control:**
- Horizontal layout: Label + Counter display + Plus/Minus buttons
- Buttons: 40px × 40px, rounded, clear touch targets
- Counter: Monospace, 1.25rem, centered between buttons
- Disabled state when limits reached

### 4. Round Feedback Panel
**Structure:**
- Full-width banner or modal overlay
- Metrics: Before/After comparison (side-by-side on desktop, stacked on mobile)
- Feedback text: max-w-3xl, organized as:
  - Key changes (bulleted list, mb-6)
  - Tradeoff callouts (highlighted boxes with icons)
  - Article references (subtle italic text)
- Dismiss/Continue button at bottom

### 5. Final Summary Screen
**Layout:**
- Three-section vertical layout:
  1. Final metrics display (compact horizontal bars)
  2. Archetype card (featured, centered, max-w-2xl):
     - Archetype title (H2)
     - Icon/badge representation
     - Description text (body, max-w-prose)
  3. Debrief section (bulleted insights + replay suggestions)
- Action buttons: Replay primary, Exit secondary

### 6. Navigation & Controls
**Primary Actions:**
- Large button: min-height 48px, px-8, rounded, font-weight 600
- Secondary button: min-height 44px, px-6, rounded

**Token Counter (Top Bar):**
- Pill-shaped container with icon + number
- Monospace for count
- Fixed to top on scroll (mobile)

### 7. Event Notifications (Rounds 2-3)
- Toast-style or inline banner
- Icon + Title + Short description
- Appears above card grid
- Dismissible or auto-dismiss after reading

## Critical UX Patterns

**Information Density Management:**
- Cards use line-clamp initially, expand on interaction
- Tooltips (hover/focus) for metric definitions
- Collapsible "More info" sections where needed

**Text Expansion Support:**
- No fixed-width containers that break with longer text
- Card titles: min-height to prevent layout shift
- Button labels: px padding scales with content
- Allow multi-line for all body text

**Keyboard Navigation:**
- Clear focus rings on all interactive elements (2px offset)
- Tab order: Top bar → Metrics → Cards (left-to-right, top-to-bottom) → Action buttons
- Arrow keys for token allocation (+/- on focused card)
- Enter/Space to activate buttons

**Responsive Breakpoints:**
- Mobile (<768px): Single column, stacked layout
- Tablet (768-1024px): 2-column card grid
- Desktop (>1024px): 3-column card grid, sidebar metrics

**Animation Constraints:**
- Metric bar transitions: 300ms ease-out only
- Card hover: Subtle lift (translate-y), no other effects
- Minimal flourishes, focus on functional feedback

## Accessibility Requirements

- Minimum touch target: 44×44px
- All interactive elements keyboard accessible
- ARIA labels for metrics progress bars
- Sufficient spacing between interactive elements (min 8px)
- High contrast text throughout (checked during color implementation phase)
- Focus visible on all elements

This design creates a focused, data-rich educational interface that prioritizes clarity and usability while supporting the complex game mechanics and internationalization requirements.