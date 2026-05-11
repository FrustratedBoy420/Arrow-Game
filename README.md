# Arrow Escape

Arrow Escape is an Expo React Native puzzle game where players clear a board by tapping arrows that can move freely in their facing direction. The game includes animated gameplay, level progression, lives, hints, undo, sound and haptic feedback, and 50 levels across Easy, Medium, Hard, and Expert difficulty.

## Tech Stack

- Expo 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- Zustand with AsyncStorage persistence
- React Native Reanimated
- React Native Skia
- Vitest

## Requirements

- Node.js 20 or newer is recommended
- npm
- Expo CLI through `npx expo`
- Android Studio, Xcode, or Expo Go for running the app on a device or emulator

## Environment Setup

This project includes a local `.env` file and a shareable `.env.example` file.

To create or refresh your local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Current environment variables:

```env
EXPO_PUBLIC_APP_NAME=Arrow Escape
EXPO_PUBLIC_APP_SLUG=arrow-escape
EXPO_PUBLIC_APP_VERSION=0.1.0
EXPO_PUBLIC_APP_SCHEME=arrowescape
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_HAPTICS=true
EXPO_PUBLIC_ENABLE_SOUND=true
```

Only variables prefixed with `EXPO_PUBLIC_` are available in the Expo client bundle. Do not store private API keys, service secrets, signing credentials, or database passwords in `EXPO_PUBLIC_*` variables.

## Installation

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

## Scripts

```bash
npm start
npm run android
npm run ios
npm run web
npm test
npm run typecheck
```

## Project Structure

```text
.
├── App.tsx
├── app.json
├── eas.json
├── src
│   ├── analytics
│   ├── components
│   ├── game
│   ├── levels
│   ├── screens
│   ├── state
│   ├── theme
│   ├── types
│   └── utils
├── assets
└── UI
```

Key areas:

- `src/game`: puzzle rules, board state helpers, validation, and tests
- `src/levels`: level definitions and level lookup helpers
- `src/screens`: Home, Tutorial, Gameplay, Level Select, Victory, and Fail screens
- `src/state`: persisted game progress and gameplay actions
- `src/components`: reusable game UI and board rendering components
- `src/utils/feedback.ts`: sound and haptic feedback helpers

## Testing

Run unit tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

## Building With EAS

The project includes `eas.json` profiles for development, preview, and production builds.

Development build:

```bash
eas build --profile development
```

Preview build:

```bash
eas build --profile preview
```

Production build:

```bash
eas build --profile production
```

## Notes

- Game progress is persisted locally with AsyncStorage under `arrow-escape-progress`.
- The app currently logs analytics events in development only through `src/analytics/analytics.ts`.
- The Expo project ID is configured in `app.json` for EAS builds.
