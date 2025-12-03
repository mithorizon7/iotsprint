# IoT Strategy Sprint - Educational Game

## Overview

IoT Strategy Sprint is a 5-10 minute educational web game designed to teach non-technical professionals the fundamentals of the Internet of Things (IoT). Players act as an "IoT program lead," making strategic resource allocation decisions across three rounds to achieve business and sustainability goals. The game focuses on practical application of IoT concepts, demonstrating tradeoffs and matching solutions to organizational objectives. It is fully browser-based, replayable, and complements educational articles on IoT fundamentals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Framework**: React with TypeScript (Vite build tool).
**State Management**: Context-based `GameContext` manages round progression, token allocation, metric calculation across five dimensions (visibility, efficiency, sustainability, early warning, complexity/risk), and round history. State persists to localStorage for session recovery.
**Theme Support**: Dark/light mode toggle with `ThemeContext`. Respects system preference on first visit, persists choice to localStorage (key: 'iot-game-theme').
**UI Component System**: Shadcn/ui (built on Radix UI) with Material Design 3 principles, Tailwind CSS for styling, and Inter/JetBrains Mono fonts (loaded via Google Fonts). Responsive, mobile-first design.
**Accessibility**: ARIA labels on interactive elements, keyboard navigation for token allocation (arrow keys), focus indicators on initiative cards.
**Routing**: Single-page application with Onboarding, Game Dashboard, Pre-Mortem, and Final Summary screens.
**Data-Driven Content**: All game content (initiative cards, metrics, archetypes, text) is loaded from JSON configuration files for flexibility and localization.

### Internationalization (i18n)

**Framework**: react-i18next with JSON resource files. Supports English, Russian, Latvian, and a pseudo-locale for testing. Dynamic locale loading with localStorage persistence. All UI text is externalized to translation keys.
**Accessibility Compliance**: All aria-labels are translated using `t('accessibility.*')` keys. Document language attribute (`<html lang="...">`) updates automatically when language changes. Date formatting uses locale-aware `Intl.DateTimeFormat` with proper CLDR locale mappings.

### Game Mechanics

**Content Model**: IoT initiative cards with configurable effects on metrics, five tracked metrics, and six archetypes based on final metric distributions.
**Token System**: Players allocate 10 tokens per round to initiatives, with diminishing returns for excessive allocation to a single card and a "IoT Sprawl Penalty" for using too many tokens, increasing complexity.
**Unlock Conditions**: Dynamic content unlock (e.g., Security Hardening card unlocks at high Complexity & Risk).
**Scoring**: Multi-dimensional scoring across visibility, efficiency, sustainability, early warning capability, and complexity risk.

### Pedagogical Enhancements

- **IoT Process Loop Visualization**: Interactive diagram showing how initiatives map to the Sense → Share → Process → Act loop.
- **Disaster Scenario System**: Config-driven events (e.g., ransomware attack for high complexity without security) applying realistic penalties.
- **Pre-Mortem Reflection Screen**: Prompts critical thinking about strategic risks before revealing final results.
- **Archetype Rebranding**: Renamed "BALANCED_ARCHITECT" to "RESILIENT_OPERATOR" for positive reinforcement.

### Backend

**Server**: Express.js with TypeScript (minimal use for development server and static file serving).
**Storage**: In-memory storage scaffolded for future features.
**Database**: Drizzle ORM configured for PostgreSQL, ready for future integration (e.g., user accounts), but not currently active in game logic.

## External Dependencies

### UI Framework
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn/ui**: Pre-built components.

### State and Data
- **React Query**: Scaffolded for future API features.
- **React Hook Form**: Form management with Zod validation.
- **date-fns**: Date utilities.

### Internationalization
- **i18next + react-i18next**: Multi-language support.

### Database (Configured but Not Actively Used)
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **@neondatabase/serverless**: Serverless PostgreSQL driver.

### Development Tools
- **Vite**: Build tool and dev server.
- **esbuild**: Production server bundling.
- **TypeScript**: Type safety with proper typing throughout (no `any` types).
- **Google Fonts CDN**: Inter (primary text), JetBrains Mono (metric values).

## Mobile Accessibility (EU WCAG 2.1 Level AA / EN 301 549 Compliance)

The application meets EU accessibility requirements (enforcement deadline June 28, 2025):

**Touch Targets**: All interactive elements use the Button component's responsive sizing:
- Mobile (< 768px): 44×44px minimum touch targets (`h-11 w-11` or `min-h-11`)
- Desktop (≥ 768px): Standard 36px sizing (`h-9 w-9` or `min-h-9`)
- Implementation: `client/src/components/ui/button.tsx` defines responsive variants for all button sizes

**Viewport & Pinch-Zoom**: `client/index.html` uses `<meta name="viewport" content="width=device-width, initial-scale=1.0">` without `maximum-scale=1` to allow pinch-zoom on mobile devices

**Scrollable Containers**: Game dashboard uses `overflow-y-auto` to ensure all content is accessible on small screens

**Responsive Layouts**: Headers use `flex-wrap` to prevent horizontal overflow on narrow viewports

**Text Contrast**: Maintains 4.5:1 ratio for normal text using Tailwind's default color palette

## Recent Changes

- Added comprehensive UX enhancements:
  - **Page Transitions**: Smooth Framer Motion animations between screens
  - **Progress Indicator**: Visual progress tracker showing Round X of 3
  - **Social Sharing**: Share archetype results on Twitter/LinkedIn with pre-formatted messages
  - **Tutorial System**: Guided walkthrough for first-time players with localStorage persistence
  - **Strategy Hints**: Context-aware tips based on player behavior and metrics
  - **Export Functionality**: Print and download game results as HTML
  - **Achievement Badges**: Earned based on play style and metric thresholds
  - **Comparison Stats**: Compare performance against average player benchmarks
- Added dark mode toggle with ThemeProvider and localStorage persistence
- Added localStorage persistence for game state (auto-save during gameplay, cleared on game reset)
- Enhanced accessibility with ARIA labels and keyboard navigation for token allocation
- **i18n Accessibility Improvements** (December 2025):
  - Translated all hardcoded aria-labels in ThemeToggle, InitiativeCard, and MetricsPanel components
  - Added `document.documentElement.lang` updates when language changes (mapped 'en-ps' pseudo-locale to 'en')
  - Created locale-aware date formatting utility (`client/src/lib/dateFormat.ts`) with proper CLDR locale mappings
  - ExportSummary now renders localized dates based on current language
- Improved TypeScript type safety (replaced `any` types, consolidated `RoundHistoryEntry` in shared schema)
- Memoized available cards filtering for performance
- **EU Mobile Accessibility Compliance** (December 2025):
  - Button component now has responsive touch targets (44px mobile, 36px desktop) centralized in size variants
  - Removed viewport zoom restriction (maximum-scale) for pinch-zoom support
  - Added scroll containers and flex-wrap for small screen layouts

## New Components (December 2025)

- `Tutorial.tsx`: Interactive tutorial overlay with step navigation and localStorage persistence
- `TutorialProvider`: Context provider for tutorial state management
- `ProgressIndicator.tsx`: Visual round progress tracker (1-3)
- `StrategyHints.tsx`: Dynamic hints based on metrics and allocations
- `Achievements.tsx`: Achievement badge display with earned/locked states
- `ComparisonStats.tsx`: Comparison against average player metrics
- `SocialShare.tsx`: Social media sharing buttons
- `ExportSummary.tsx`: Print and download functionality
- `PageTransition.tsx`: Framer Motion page transition wrapper