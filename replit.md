# IoT Strategy Sprint - Educational Game

## Overview

IoT Strategy Sprint is a 5-10 minute educational web game designed to teach non-technical professionals the fundamentals of the Internet of Things (IoT). Players take on the role of an "IoT program lead" at a fictional organization, making strategic resource allocation decisions across 3 rounds (years) to achieve different business and sustainability goals.

The game teaches IoT concepts through practical application rather than technical explanations, helping learners understand when to apply different IoT solutions, what tradeoffs exist, and how to match IoT patterns to organizational goals. The experience is fully browser-based, replayable, and designed to work alongside four short educational articles about IoT fundamentals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**State Management**: Context-based game state management through `GameContext` that handles:
- Round progression (3 rounds plus onboarding)
- Token allocation mechanics (players allocate limited tokens to different IoT initiatives)
- Metrics calculation and tracking across 5 dimensions (visibility, efficiency, sustainability, early warning, complexity/risk)
- Round history for feedback and final scoring

**UI Component System**: Shadcn/ui component library built on Radix UI primitives
- Material Design 3 principles for visual hierarchy and interaction patterns
- Tailwind CSS for styling with custom design tokens
- Typography using Inter (primary) and JetBrains Mono (metrics)
- Responsive layout with mobile-first approach

**Routing**: Single-page application with three main screens:
1. Onboarding (introduces game concept and IoT process flow)
2. Game Dashboard (main gameplay with card selection and metric tracking)
3. Final Summary (archetype classification and performance review)

**Data-Driven Content**: All game content (IoT initiative cards, metrics, archetypes, text) is loaded from JSON configuration files to enable easy updates and future localization

### Internationalization (i18n)

**Translation Framework**: react-i18next with JSON resource files
- **Infrastructure**: Dynamic locale loading with localStorage persistence and browser language detection
- **Supported Languages**: English (en), Russian (ru), Latvian (lv), Pseudo-locale (en-ps for testing)
- **English Pre-loaded**: Synchronously imported during i18n initialization to ensure fallback always available
- **Translation Files**: 
  - English complete: `client/public/locales/en/translation.json` (also at `client/src/locales-en.json` for import)
  - Russian stub: `client/public/locales/ru/translation.json` (ready for professional translation)
  - Latvian stub: `client/public/locales/lv/translation.json` (ready for professional translation)
  - Pseudo-locale: `client/public/locales/en-ps/translation.json` (tests text expansion ~40%)
- **Language Switcher**: LanguageSwitcher component in top-right corner of all screens (Onboarding, Dashboard, Summary)
- **Company Names**: Airbus, Bosch, Siemens, Rio Tinto, Marathon Oil, Microsoft, AT&T, etc. remain in English across all languages
- **Translation Keys**: All UI text externalized to translation keys (no hard-coded strings)
- **Translator Guide**: See `TRANSLATOR_GUIDE.md` for professional translation instructions

**Status**: ✅ COMPLETE - Full internationalization implementation with E2E testing validated (November 14, 2025)

**SOLUTION IMPLEMENTED**:
- **Root Cause**: i18next's `load: 'all'` option was stripping hyphenated language codes like 'en-ps' to base language 'en'
- **Fix**: Changed to `load: 'currentOnly'` to force exact language code matching
- **Configuration**: 
  ```typescript
  i18n.init({
    load: 'currentOnly', // Forces exact match for 'en-ps'
    nonExplicitSupportedLngs: false, // No implicit fallbacks
    supportedLngs: ['en', 'ru', 'lv', 'en-ps']
  })
  ```
- **Code Quality**: Complete i18n audit externalized all user-facing strings to translation keys
- **Verification**: Architect reviewed and approved (Pass verdict); E2E tests validate all four locales

**How It Works Now**:
1. User clicks language switcher
2. `changeLanguage(lng)` loads translation bundle if needed
3. Calls `i18n.changeLanguage(lng)` which updates both `i18n.language` and `i18n.resolvedLanguage` to exact code
4. React components re-render with new translations via `useTranslation()` hook
5. Language preference persisted to localStorage

**Ready for Translation**:
- ✓ Complete English translation.json (249 lines)
- ✓ Russian stub file ready at `client/public/locales/ru/translation.json`
- ✓ Latvian stub file ready at `client/public/locales/lv/translation.json`
- ✓ Pseudo-locale working for testing text expansion (~40% longer text)
- ✓ Translator guide available at `TRANSLATOR_GUIDE.md`
- ✓ All UI strings externalized (no hard-coded text)
- ✓ Company names remain in English across all languages per design

**E2E Testing Completed** (November 14, 2025):
- ✅ Language switching tested on all screens (Onboarding, Dashboard, Summary)
- ✅ All four locales validated (en, ru, lv, en-ps)
- ✅ UI updates immediately without page reload
- ✅ Pseudo-locale displays with special characters correctly
- ✅ Stub locales (ru, lv) handle graceful degradation without crashes
- ✅ Language preference persists across navigation
- ✅ Language preference persists across page reloads (localStorage)
- ✅ No console errors related to i18n

### Architecture Improvements (November 20, 2025)

**Critical Bug Fixes**:
1. **Metric Calculation Bug Fixed** - Changed from additive to cumulative state-based calculation
   - Previous: Metrics added to previous round totals on each runPlan(), causing double-counting and runaway growth
   - Fixed: Metrics now use stored values from previous rounds instead of recalculating
   - Implementation: 
     - `metricsBefore` = previous round's stored `metricsAfter` (or INITIAL_METRICS for round 1)
     - `metricsAfter` = `metricsBefore` + current round's allocation effects
     - Each round stores both metricsBefore and metricsAfter in roundHistory
   - Benefits:
     - Simple O(1) lookup instead of O(n) iteration
     - Immune to retroactive config/card changes
     - Correct deltas in all scenarios (first run, re-run, allocation changes)
   - Impact: Game balance restored, metrics properly cumulative across rounds 1-3

**Data Architecture Improvements**:
2. **Decoupled Content from Code**:
   - Added `companyName` and `feedbackKey` fields to CardConfig schema
   - All 12 cards updated in `client/public/config/cards.json` with company references
   - Removed hardcoded mappings from `RoundFeedback.tsx` and `FinalSummary.tsx`
   - Cards now fully data-driven and maintainable via JSON

3. **Configurable Game Balance**:
   - Created `client/public/config/gameConfig.json` with tunable thresholds
   - Extracted all magic numbers to configuration:
     - Feedback thresholds (delta >= 8, complexity > 60, etc.)
     - Token mechanics (diminishing returns at 3rd token, IoT sprawl at 12 tokens)
     - Unlock conditions (complexity_high at 40)
   - Game designers can now adjust difficulty without code changes
   - Added GameConfig interface to shared/schema.ts

**Design Considerations**:
- **Token Rounding Behavior**: Current implementation uses `Math.floor(tokens * 0.5)` for round-to-round carryover
  - Effect: 1 token becomes 0, 2 tokens becomes 1, 3 tokens becomes 1, etc.
  - This is intentional design to prevent overextension and encourage focused strategies
  - Players who spread tokens thinly (1 on everything) lose all carryover
  - Alternative would be Math.ceil or minimum carryover guarantee (pending design review)

### Game Mechanics

**Content Model**:
- **Cards**: IoT initiatives with configurable effects on metrics, round availability, and unlock conditions
- **Metrics**: Five tracked dimensions that respond to player choices
- **Archetypes**: Six personality profiles based on final metric distributions (Efficiency First, Sustainability Champion, Balanced Architect, etc.)
- **Tokens**: Limited resource (10 tokens per round) forcing strategic prioritization

**Token System**:
- Each round provides 10 fresh tokens (no carryover between rounds)
- Players allocate 0-3 tokens per initiative card
- Diminishing returns: Tokens 4+ on the same card have 50% effectiveness
- IoT Sprawl Penalty: Using >8 tokens in a round increases complexity/risk (+3 per extra token)

**Unlock Conditions**:
- Security Hardening card unlocks when Complexity & Risk metric reaches 40+
- Demonstrates dynamic content based on player choices

**Scoring System**: Multi-dimensional, open-ended scoring with no single "correct" answer. Success measured across visibility, efficiency, sustainability, early warning capability, and complexity risk.

### Backend Architecture

**Server**: Express.js with TypeScript
- Minimal backend for development server
- Static file serving for production build
- Vite middleware integration for HMR during development

**Storage**: In-memory storage implementation (`MemStorage`)
- Currently unused but scaffolded for potential future features (user accounts, progress tracking)
- Interface designed for easy swap to database implementation

**Database Schema**: Drizzle ORM configured for PostgreSQL
- Schema defined but not actively used in current game implementation
- User model exists for potential authentication features
- Database configuration ready via `DATABASE_URL` environment variable

### Application Flow

1. **Onboarding**: Player learns IoT fundamentals (sense → share → process → act) and game objectives
2. **Round Loop** (3 iterations):
   - View available IoT initiative cards filtered by round and unlock conditions
   - Allocate tokens (limited budget) to selected initiatives
   - Run plan and see metric changes with contextual feedback
   - Review round results with explanations tying back to real IoT examples
3. **Final Summary**: Archetype classification based on total metrics, strengths/weaknesses analysis, strategic suggestions

### Build and Development

**Development**: Vite dev server with HMR, React Fast Refresh
**Production Build**: 
- Client: Vite build outputting to `dist/public`
- Server: esbuild bundle outputting to `dist`
- Combined deployment serves static files from Express

**TypeScript Configuration**: Strict mode enabled with path aliases for clean imports (`@/`, `@shared/`)

## External Dependencies

### UI Framework
- **Radix UI**: Unstyled, accessible component primitives (dialogs, popovers, tooltips, etc.)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Shadcn/ui**: Pre-built component library following Material Design 3 patterns

### State and Data
- **React Query (@tanstack/react-query)**: Server state management (minimal use, scaffolded for future API features)
- **React Hook Form**: Form state management with Zod validation
- **date-fns**: Date manipulation utilities

### Internationalization
- **i18next + react-i18next**: Translation framework for multi-language support

### Database (Configured but Not Active)
- **Drizzle ORM**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon
- Database currently not used in game logic but ready for user accounts/progress tracking

### Development Tools
- **Vite**: Build tool and dev server
- **esbuild**: Production server bundling
- **TypeScript**: Type safety across client and server
- **Replit plugins**: Development banner, error overlay, cartographer (for Replit environment)

### Fonts
- **Google Fonts CDN**: Inter (primary typography), JetBrains Mono (metric values)

### Session Management (Configured but Unused)
- **express-session + connect-pg-simple**: Session middleware ready for authentication features