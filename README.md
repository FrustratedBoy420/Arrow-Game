# Arrow Escape

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

Arrow Escape is a mobile puzzle game where every move matters. Each level contains arrows placed on a grid. An arrow can be removed only when the space in front of it is clear, so players need to think through the order, use hints wisely, and recover with undo when the board gets tricky.

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
EXPO_PUBLIC_APP_NAME=Arrow Escape
EXPO_PUBLIC_APP_SLUG=arrow-escape
EXPO_PUBLIC_APP_VERSION=0.1.0
EXPO_PUBLIC_APP_SCHEME=arrowescape
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

## Notes

- Game progress is persisted locally under `arrow-escape-progress`.
- Analytics currently logs events in development through `src/analytics/analytics.ts`.
- The Expo project ID is configured in `app.json` for EAS builds.
