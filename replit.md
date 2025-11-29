# Apex F1 Manager - Replit Setup

## Project Overview
This is a 16-bit retro-styled Formula 1 racing management game built with React, TypeScript, and Vite. The game uses Google's Gemini AI to generate dynamic images and content including driver portraits, race highlights, and media interviews.

## Technology Stack
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **UI**: TailwindCSS (via CDN), custom retro styling
- **AI Integration**: Google Gemini AI via Replit AI Integrations
  - Models used: gemini-2.5-flash, gemini-2.5-flash-image
- **State Management**: React hooks (local state)

## Replit Configuration

### Development
- **Port**: 5000
- **Host**: 0.0.0.0
- **Workflow**: `npm run dev` (Vite dev server)

### Deployment
- **Type**: Autoscale (stateless web app)
- **Build**: `npm run build`
- **Run**: `npx vite preview --host 0.0.0.0 --port 5000`

### Environment Variables
The app uses Replit AI Integrations for Gemini access:
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Automatically set by Replit
- `AI_INTEGRATIONS_GEMINI_BASE_URL` - Automatically set by Replit

## Important Notes

### AI Integration Architecture
✅ **Security**: The application now uses a secure backend proxy architecture to protect Gemini API credentials.

**Current Architecture**: Mixed Frontend/Backend
- **Frontend** (React/Vite on port 5000): User interface and game logic
- **Backend** (Express on port 3001): Proxies all Gemini AI API requests
- API keys remain server-side only and are never exposed to the client
- Frontend makes secure requests to `/api/*` endpoints
- Vite dev server proxies API requests to the backend in development

**Production**: Both frontend and backend run together via the deployment configuration

### AI Features
The game generates various AI-powered content:
- **Driver Portraits**: Pixel art character images based on mood
- **Race Highlights**: Victory celebration images
- **Event Images**: Weather, crashes, safety car scenarios
- **Media Interviews**: Dynamic questions and answers
- **Car Renders**: Team-colored vehicle blueprints
- **HQ Backgrounds**: Isometric city builder-style base

All generated images are cached in browser localStorage to reduce API calls.

## Project Structure
```
/
├── components/          # React components for game screens
├── server/
│   └── index.ts        # Express backend for Gemini API proxy
├── services/           
│   └── geminiService.ts # Frontend API client (calls backend)
├── App.tsx             # Main game component
├── index.tsx           # React entry point
├── index.html          # HTML template
├── constants.ts        # Game data (teams, drivers, tracks)
├── types.ts            # TypeScript definitions
├── vite.config.ts      # Vite configuration (with API proxy)
└── package.json        # Dependencies
```

## Game Features
- Team management with customizable name and colors
- Driver hiring/firing with mood system
- Race weekends: Practice → Qualifying → Race
- Dynamic weather and race events
- Financial management with sponsors
- Championship standings
- Media interviews affecting team morale
- Car upgrades and HQ building
- Retro 16-bit pixel art aesthetic

## Recent Changes (Replit Import Setup)
- ✅ Installed Node.js 20 and all dependencies
- ✅ Configured Vite for port 5000 with proper host settings and API proxy
- ✅ Set up Gemini AI integration using Replit AI Integrations (secure)
- ✅ **Created Express backend** (port 3001) to proxy Gemini API calls
- ✅ **Refactored frontend service** to call backend API instead of direct Gemini access
- ✅ Removed API keys from client bundle (security fix)
- ✅ Updated .gitignore for Node.js and Replit files
- ✅ Added script tag to index.html to load React app
- ✅ Configured deployment for autoscale with both frontend and backend
- ✅ Verified app loads and runs without errors
