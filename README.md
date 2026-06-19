# ArrowVerse-Multiplayer

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo 54" />
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=111111" alt="React Native 0.81" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Vitest-tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
</p>

<p align="center">
  <strong>A bright, fast, animated arrow puzzle game built with Expo and React Native.</strong>
</p>

<p align="center">
  Tap the arrows that can escape, clear the board, protect your lives, and unlock all 50 levels.
</p>

---

## Game Overview

ArrowVerse-Multiplayer is a mobile puzzle game where every move matters. Each level contains arrows placed on a grid. An arrow can be removed only when the space in front of it is clear, so players need to think through the order, use hints wisely, and recover with undo when the board gets tricky.

| Feature | Details |
| --- | --- |
| Levels | 50 handcrafted levels |
| Difficulty | Easy, Medium, Hard, Expert |
| Core loop | Tap clear arrows, avoid blocked moves, finish the board |
| Feedback | Animation, haptics, sound-ready helpers |
| Progress | Saved locally with AsyncStorage |
| Testing | Vitest coverage for puzzle engine logic |

## Tech Stack

| Area | Tools |
| --- | --- |
| App | Expo 54, React Native 0.81, React 19 |
| Language | TypeScript |
| Navigation | React Navigation Native Stack |
| State | Zustand with AsyncStorage persistence |
| Animation | React Native Reanimated |
| Rendering | React Native Skia |
| Feedback | Expo AV, Expo Haptics |
| Tests | Vitest |

## Quick Start

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start the Expo development server:

```bash
npm start
```

Run on a target platform:

```bash
npm run android
npm run ios
npm run web
```

## Environment Variables

This project uses Expo public environment variables. Anything prefixed with `EXPO_PUBLIC_` can be included in the client bundle, so do not place secrets there.

```env
EXPO_PUBLIC_APP_NAME=ArrowVerse-Multiplayer
EXPO_PUBLIC_APP_SLUG=arrowverse-multiplayer
EXPO_PUBLIC_APP_VERSION=0.1.0
EXPO_PUBLIC_APP_SCHEME=arrowversemultiplayer
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_HAPTICS=true
EXPO_PUBLIC_ENABLE_SOUND=true
```

Use [.env.example](./.env.example) as the template for local setup. The real `.env` file is ignored by git.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo |
| `npm run android` | Open Android target |
| `npm run ios` | Open iOS target |
| `npm run web` | Open web target |
| `npm test` | Run Vitest tests |
| `npm run typecheck` | Run TypeScript checks |

## Project Structure

```text
.
|-- App.tsx
|-- app.json
|-- eas.json
|-- assets/
|-- UI/
`-- src/
    |-- analytics/
    |-- components/
    |-- game/
    |-- levels/
    |-- screens/
    |-- state/
    |-- theme/
    |-- types/
    `-- utils/
```

## Key Folders

| Path | Description |
| --- | --- |
| `src/game` | Puzzle rules, board helpers, validation, and tests |
| `src/levels` | Level definitions and level lookup helpers |
| `src/screens` | Home, Tutorial, Gameplay, Level Select, Victory, and Fail screens |
| `src/state` | Persisted game progress and gameplay actions |
| `src/components` | Reusable board, header, controls, and UI components |
| `src/utils/feedback.ts` | Sound and haptic feedback helpers |

## Testing

Run unit tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

## EAS Builds

The project includes EAS profiles for development, preview, and production builds.

```bash
eas build --profile development
eas build --profile preview
eas build --profile production
```

## Dynamic Configuration & Backend Integration

The app supports **dynamic configuration** loaded from the backend database (Redis):
- **Dynamic Levels**: Game levels can be updated, added, or deleted from the database.
- **Dynamic Audio**: Pasting hosted audio URLs dynamically overrides background music and move/victory sound effects.
- **Dynamic Accent Icon**: Home Screen top character symbol is fetched from the database icons config.

### Connecting to Your Backend
The app fetches configurations from the server URL saved in `AsyncStorage` under `multiplayer_url` (defaulting to the production URL `https://arrow-game-be.vercel.app`).
To point the app to a custom or local backend:
1. Open the app and navigate to **⚔️ Multiplayer Mode ⚔️**.
2. Change the **Server URL** to your server IP address (e.g., `http://192.168.1.5:3000` for local running backend).
3. Trigger a room creation or join once. This saves the URL to AsyncStorage.
4. On subsequent app launches, the singleplayer mode will query your server to download latest levels and configurations.

### Offline & Fallback Support
If the backend server is unreachable or offline, the app automatically:
1. Uses the previously cached config saved in `AsyncStorage`.
2. Falls back to the bundled local `levels.json` and static asset soundtracks if no cache is available.

## ⚔️ Multiplayer Mode Features

The **Multiplayer Arena** provides a real-time head-to-head shared board competitive gameplay:
- **Shared Board Scoring**: Both players solve the same board. Tap clear arrows to gain points.
- **3-Hearts Life System**: Protected lives prevent reckless tapping. Every blocked tap decrements a heart. Running out of 3 lives forces an automatic loss.
- **Lobby Inactivity Timer**: The lobby displays a ticking 2-minute countdown. If no activity (joins, ready state toggles) occurs for 120 seconds, the lobby terminates and kicks players back to setup.
- **1-Hour Session Expiration**: To maintain system sanity, every room code expires exactly 1 hour after creation. This happens automatically in the background and terminates the active session with a clean notification.
- **Pinch Zoom-Out & Layout Scaling**: The board supports pinch-to-zoom gestures (zoom out down to 0.5x scale) to let players inspect full grids and corner layouts comfortably.
- **Pusher Real-time Communication**: Syncs board removes, score values, and rematch requests in real-time. Suppresses developer Redbox connection LogBox popups under WebSocket network drops.

## Notes

- Game progress is persisted locally under `arrowverse-multiplayer-progress`.
- Analytics currently logs events in development through `src/analytics/analytics.ts`.
- The Expo project ID is configured in `app.json` for EAS builds.

## Contributors

## 👤 Mridul Jaiswal

**GitHub:** [FrustratedBoy420](https://github.com/FrustratedBoy420) | **LinkedIn:** [mridul-jaiswal-823985324](https://www.linkedin.com/in/mridul-jaiswal-823985324/)

Mridul served as the primary developer for Arrow Escape, responsible for the architecture, development, and integration of the game's core systems — spanning the complete puzzle gameplay engine, multiplayer infrastructure, real-time events, admin panel, and production deployment.

---

### 🎮 Puzzle Gameplay Engine & Core Systems

- Designed and implemented the complete puzzle gameplay engine and game mechanics
- Developed level management, progression systems, validation logic, and player state handling
- Built and integrated gameplay UI, animations, feedback systems, and user interactions
- Implemented local persistence using **AsyncStorage** and state management with **Zustand**
- Integrated audio, haptics, analytics, and supporting game services
- Implemented dynamic configuration support for levels, audio assets, and application settings
- Configured production builds, deployment workflows, and **EAS build pipelines**
- Performed testing, debugging, optimization, and overall application maintenance

---

### 🔄 Multiplayer Room Lifecycle & Real-Time Gameplay Sync

- Built the room creation system generating unique 4-character room codes and picking random levels from the database
- Implemented the joining system with room availability validation, 2-player maximum enforcement, and duplicate name prevention
- Built the ready-toggle mechanism with synchronized `gameStartsAt` timestamp broadcast to ensure both players start simultaneously regardless of network latency
- Developed the core progress update system tracking arrow ownership via the `arrowOwners` map, handling simultaneous claim conflicts (first claim wins), and server-side score recalculation to prevent client-side manipulation
- Implemented end-game scenarios (player finished / player failed), winner determination logic including draws and forfeits via `endMatch()`
- Built disconnect handling (forfeit on leave), host inactivity termination, and the rematch system with fresh level selection and full room state reset

**Multiplayer Infrastructure also included:**
- Real-time room creation and matchmaking
- Shared board synchronization
- Score tracking and competitive gameplay logic
- Life system and match state management
- Rematch workflows and session lifecycle handling
- Network communication and backend integration

---

### 📡 Real-Time Events (Pusher)

- Integrated all **9 Pusher event types** powering the entire live multiplayer experience:

| Event | Description |
|-------|-------------|
| `player_joined` | Notifies room when a new player connects |
| `player_left` | Broadcasts disconnect or forfeit |
| `ready_states` | Syncs ready status of both players |
| `start_countdown` | Broadcasts synchronized game start timestamp |
| `opponent_progress` | Streams live arrow removal updates |
| `match_results` | Delivers final scores and winner declaration |
| `rematch_states` | Tracks mutual rematch agreement |
| `rematch_start` | Initiates a fresh match session |
| `room_terminated` | Notifies all clients on room closure |

- Built the invite page (`_join-redirect.js`) — a styled HTML page with the room code and a deep link (`arrowescape://join/{code}`) for sharing with friends directly into a room

---

### 🛡️ Admin Panel APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/rooms` | `GET` | Lists all active multiplayer rooms by scanning Redis keys |
| `/api/admin/users` | `GET` | Lists all registered users with lazy cleanup of expired device IDs |
| `/api/admin/update-config` | `POST` | Updates game config in Redis and broadcasts `config_updated` Pusher event for live client refresh without app restart |
| `/api/admin/toggle-user-levels` | `POST` | Toggles level unlock flag and sends `level_access_changed` Pusher event to the user's device channel for immediate effect |

---

### 🛠️ Technologies Used

`React Native` `JavaScript` `Node.js` `Express.js` `Pusher` `Upstash Redis` `Zustand` `AsyncStorage` `EAS Build` `Vercel Serverless Functions`


## 👤 Himanshu Yadav

**GitHub:** [codeWith-hmnsh](https://github.com/codeWith-hmnsh) | **LinkedIn:** [himanshu-yadav-ab2860381](https://www.linkedin.com/in/himanshu-yadav-ab2860381/)

Himanshu contributed to the development of Arrow Escape by designing and building the backend data layer, authentication system, and game configuration pipeline, while also driving the frontend implementation across gameplay interfaces, multiplayer user experience, and overall application integration. His work spanned the full stack — from serverless infrastructure and database architecture to interactive UI and client-side integration.

---

### 🗄️ Database & Data Model (Upstash Redis)

- Set up the Redis client (`_lib/redis.js`) using `@upstash/redis` via REST API with environment-variable-based credentials
- Designed the complete data model with **7 key patterns**:

| Key Pattern | Description | TTL |
|-------------|-------------|-----|
| `room:XXXX` | Multiplayer room state (JSON) | 2 hrs active / 5 min finished |
| `user:{systemId}` | User profiles (JSON) | 30-day, refreshed on app open |
| `game:users` | Redis Set of all registered device IDs | Persistent |
| `game:levels` | Dynamic level configuration | Persistent |
| `game:music` | Music/SFX URLs | Persistent |
| `game:icons` | Home screen icon config | Persistent |
| `game:version` | App version metadata | Persistent |

---

### 🔐 User Registration & Authentication

- Built the user registration endpoint using the device's unique `systemId` as the primary identifier — no traditional login or password required
- Handles device ID, player name, OS info, and highest unlocked level; preserves the `unlocked` flag across re-registrations
- All admin endpoints protected via `ADMIN_SECRET` validated in the `x-admin-secret` HTTP header (returns `401 Unauthorized` on mismatch)
- CORS configured to accept requests from all origins (`*`)

---

### ⚙️ Game Configuration System

- Built the dynamic config pipeline (`_lib/config.js`) managing levels, music URLs, icons, and version info stored in Redis
- Implemented a **5-minute in-memory cache** for Vercel serverless warm-instance optimization — subsequent requests serve cached data instead of hitting Redis
- Auto-seeds level data from the static `level.json` file (456 KB) if Redis has no data
- Public `/api/config` endpoint serves full configuration to the mobile app on every launch, including the Pusher public key for real-time connection setup

---

### 🖥️ CLI Database Management Tool & Deployment

- Built `scripts/update-db.js` for direct Redis management:

```bash
node scripts/update-db.js status   # Shows current DB state (level count, music URLs, icon settings)
node scripts/update-db.js levels   # Uploads levels from level.json to Redis
node scripts/update-db.js music    # Configures custom music/SFX URLs
node scripts/update-db.js icons    # Configures custom home screen icon
```

- Configured Vercel deployment (`vercel.json`) with `/api/*` rewrite to `index.js`, production CORS headers, and **10 MB JSON body limit** for level uploads
- Local development setup via `dotenv` on port 3000

---

### 🎨 Frontend Development

**Gameplay Screens & Interfaces**
- Developed and implemented gameplay screens and frontend interfaces for core game flows
- Worked on puzzle board interactions, gameplay UI components, and user input handling
- Contributed to responsive UI implementation and maintaining consistent visual design across all screens

**Multiplayer User Experience**
- Built and refined multiplayer user experiences including lobby flows, room interactions, match screens, and result screens
- Worked on frontend state integration and screen-level interactions across gameplay systems

**Application Integration & Polish**
- Assisted in integrating navigation flows, screen transitions, and shared application components
- Contributed to improving user experience through animations, transitions, and interface refinements
- Participated in testing, debugging, UI improvements, and feature integration throughout development
- Collaborated on overall application structure and frontend architecture to ensure maintainability and scalability

---

### 🛠️ Technologies Used

`React Native` `JavaScript` `Node.js` `Express.js v5` `Upstash Redis` `Vercel Serverless Functions` `dotenv`


## 👤 Ayushman Jaiswal

**GitHub:** [Ayushjais27](https://github.com/Ayushjais27) | **LinkedIn:** [ayushman-jaiswal-12b33a2a7](https://www.linkedin.com/in/ayushman-jaiswal-12b33a2a7/)

Ayushman contributed to Arrow Escape by owning the level design pipeline and frontend UI/UX across the entire game. His work shaped how players experience the puzzle — from the flow of each handcrafted level to the visual consistency and layout polish of every screen.

---

### 🎮 Level Design & Puzzle Architecture

- Designed and structured all handcrafted puzzle levels for Arrow Escape, balancing challenge progression across Easy, Medium, Hard, and Expert difficulty tiers
- Engineered the level design flow to ensure logical puzzle solvability, engaging progression curves, and a satisfying increase in complexity across all 50 levels
- Iterated on level configurations to eliminate dead-ends, enforce fair difficulty spikes, and maintain player engagement throughout the game
- Collaborated on validating level states against the puzzle engine to ensure every designed level was mechanically sound and completable

---

### 🎨 UI/UX Design & Frontend Implementation

- Created and refined the user interface layout for all major game screens including Home, Level Select, Gameplay, Tutorial, Victory, and Fail screens
- Drove visual consistency across the app — standardizing spacing, color usage, typography, component sizing, and interaction patterns
- Focused on making the mobile experience intuitive and accessible, reducing friction in player onboarding and core gameplay loops
- Contributed to animation polish, screen transition design, and visual feedback improvements to enhance the overall feel of the game
- Collaborated on the level selection experience, improving how players browse, unlock, and navigate between levels
- Participated in cross-functional debugging and UI refinement throughout the development cycle to maintain quality and visual cohesion

---

### 🛠️ Technologies Used

`React Native` `TypeScript` `Expo` `React Native Reanimated` `React Native Skia` `Zustand`

