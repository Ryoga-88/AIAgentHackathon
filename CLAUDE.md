# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Japanese AI Travel Planner** (旅行 AI プランナー) built with Next.js 15 and React 19. The application generates personalized travel itineraries using OpenAI's GPT-4 with search capabilities and integrates with Japan's Rakuten Travel API for hotel bookings.

**Key Features:**
- AI-powered travel plan generation with structured JSON output
- Japanese-language interface and content
- Hotel search and booking integration
- Detailed itinerary planning with activities, timing, and pricing
- Responsive UI with Japanese aesthetics

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Production server  
npm run start

# Code linting
npm run lint
```

## Architecture & Core Components

### API Routes (`/app/api/`)

**`/app/api/travel-plan-openai/route.js`** - Core travel plan generation
- Uses OpenAI GPT-4 with search preview model (`gpt-4o-search-preview-2025-03-11`)
- Implements sophisticated prompt engineering for structured JSON travel plans
- Supports customizable prompt templates (GET/PUT endpoints)
- Handles Japanese-language travel planning with detailed constraints
- Key function: `cleanAndParseJSON()` for processing AI responses

**`/app/api/search-hotels/route.jsx`** - Hotel search integration
- Integrates with Rakuten Travel API (`applicationId: "1037506766385892412"`)
- Currently hardcoded for Kyoto area searches
- Formats hotel results with pricing, ratings, and booking URLs

**`/app/api/calculate-distances/route.js`** - Distance/time calculation service
- Uses Google Maps Distance Matrix API for travel distance calculations
- POST: Calculates distances between a list of locations
- PUT: Processes travel plan JSON to add distance information between activities
- Supports Japanese language responses and transit mode calculations

### Frontend Pages (`/app/`)

**App Router Structure:**
- `page.jsx` - Landing page with travel planning form
- `plans/page.jsx` - Travel plan selection interface  
- `plan/[id]/page.jsx` - Individual plan detail view
- `confirm/page.jsx` - Booking confirmation

### Data Layer (`/data/`)

**`mockData.js`** - Comprehensive mock travel data
- Contains detailed JSON structures for destinations (Shirakawa-go, Tokyo, Kyoto)
- Defines the complete travel plan schema with activities, timing, pricing
- Used for development and testing before AI generation

## Travel Plan JSON Schema

The application uses a sophisticated JSON structure for travel plans:

```javascript
{
  trip_id: string,
  theme: string, // e.g., "wabi_sabi", "adventure", "relax"
  hero: {
    title: string,
    subtitle: string,
    destination: string,
    duration: string,
    budget: string,
    hero_image: string,
    key_visual: { main_image, alt_images[], mood },
    highlights: string[]
  },
  itinerary: [{
    day: number,
    date: "YYYY-MM-DD",
    city: { name, name_en, description, image },
    activities: [{
      id: string,
      time: "HH:MM - HH:MM",
      title: string,
      type: string, // "heritage", "culinary", "experience", "scenic"
      priority: string, // "must_see", "must_do", "recommended"
      description: string,
      location: string,
      price: string,
      rating: number,
      tips: string,
      // ... additional fields
    }],
    accommodation: string
  }]
}
```

## Environment Configuration

**Required Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API key for travel plan generation
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for distance/time calculations (optional)

**Current API Keys:**
- Rakuten Travel API ID is hardcoded in the hotel search route

## Styling & UI

- **Framework:** Tailwind CSS 4.0 with PostCSS
- **Fonts:** Inter + Playfair Display for Japanese typography
- **Design:** Modern, responsive design with Japanese aesthetic elements
- **Theme:** Supports various travel themes (wabi_sabi, adventure, relax, etc.)

## Development Notes

- The application is currently on the `dev_json` branch
- Core functionality focuses on structured JSON generation for travel plans
- Japanese language is the primary interface language
- Hotel search is currently limited to Kyoto area (hardcoded in API)
- Mock data in `/data/mockData.js` serves as the reference implementation for AI-generated plans

## Testing & Quality

Always run linting after making changes:
```bash
npm run lint
```

When modifying AI prompts or JSON structures, test with the mock data first to ensure compatibility.