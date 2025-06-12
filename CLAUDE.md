# CLAUDE.md

必ず日本語で回答してください。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm start`
- **Linting**: `npm run lint`

## Architecture Overview

This is a Next.js 15 AI travel planning application using the App Router pattern. The application allows users to input travel preferences and generates personalized travel itineraries.

### Core Flow

1. **Landing Page** (`app/page.jsx`): Travel preference form with destination, duration, budget, and interests
2. **Plans Display** (`app/plans/page.jsx`): Shows 3 AI-generated travel plan options with tabbed interface
3. **Plan Details** (`app/plan/[id]/page.jsx`): Detailed view of selected travel plan with full itinerary
4. **Confirmation** (`app/confirm/page.jsx`): Final booking/confirmation step

### Key Components & Data Flow

- **Mock Data System** (`data/mockData.js`): Provides structured travel plan data with detailed itineraries, activities, pricing, and ratings. Uses `getMockSchedule()` and `getMockPlans()` functions.
- **Hotel Search API** (`app/api/search-hotels/route.jsx`): Integrates with Rakuten Travel API for real hotel searches using application ID and structured parameters.

### Styling & UI

- **Tailwind CSS 4**: Primary styling framework with gradient backgrounds and modern card layouts
- **Custom Fonts**: Inter (body) and Playfair Display (headings) via Google Fonts
- **Japanese Language**: All UI text and content is in Japanese (ja locale)
- **Design System**: Blue/indigo gradient theme with priority-based activity categorization (must_see, must_do, recommended)

### Data Structure

Travel plans follow a structured schema with:

- Hero sections (title, image, highlights)
- Daily itineraries organized by city
- Activities with timing, pricing, ratings, and priority levels
- Rich media integration (images from Unsplash)
