# Arrow Escape — UI Fix + 50 Levels

## Current Issues (from UI screenshots)

1. **Board too small on early levels** — Easy levels with small grids (7×5) use `width * 0.65` which makes them tiny on screen
2. **Lives indicator (blue dots) are oversized** — The `fontSize: 48` blue dots are too large and misaligned
3. **No level select screen** — User goes Home → Gameplay directly with no ability to pick a level
4. **Tutorial/early levels missing header elements** — Inconsistent header between tutorial and gameplay
5. **Hard levels board is pushed to bottom** — With `width * 0.90` for large grids, the board sits too low
6. **Bottom controls missing on some screens** — Tutorial and some levels don't show undo/hint/restart
7. **Level 5 showing "Hard" incorrectly** — The difficulty badge logic is correct in engine but screenshots show level 5 as "Hard" (this is from an old screenshot, current code is correct)
8. **No progress indicator** — User doesn't know how many arrows remain
9. **Version text says "30 Levels"** — Need to update to 50

## Proposed Changes

### 1. UI Fixes

#### [MODIFY] [theme.ts](file:///d:/WORK_RELATED/Arrow-Game/src/theme/theme.ts)
- Add new colors for level select, difficulty badges with distinct colors per difficulty
- Add `Expert` difficulty color
- Better color palette for a more polished look

#### [MODIFY] [HomeScreen.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/screens/HomeScreen.tsx)
- Update version text from "30 Levels" → "50 Levels"
- Add "Level Select" button below "Start Now"
- Improve layout and animations

#### [NEW] [LevelSelectScreen.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/screens/LevelSelectScreen.tsx)
- Grid of level buttons (1-50) in a scrollable view
- Locked/unlocked states based on `highestUnlockedLevel`
- Difficulty color coding per level
- Stars/completion indicators

#### [MODIFY] [App.tsx](file:///d:/WORK_RELATED/Arrow-Game/App.tsx)
- Add `LevelSelect` to navigation stack

#### [MODIFY] [GameplayScreen.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/screens/GameplayScreen.tsx)
- Fix board sizing: use a smarter scaling approach based on available height, not just width
- Center the board better by computing available space after header/controls
- Add arrow count indicator (e.g., "3/5 arrows remaining")

#### [MODIFY] [PuzzleBoardCanvas.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/components/PuzzleBoardCanvas.tsx)
- Add subtle grid dots/background to make the board area visible
- Add color coding per arrow direction for better visual clarity on dense levels

#### [MODIFY] [LivesIndicator.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/components/LivesIndicator.tsx)
- Reduce dot size, improve alignment
- Use heart icons instead of giant circles

#### [MODIFY] [BottomControls.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/components/BottomControls.tsx)
- Better button styling with labels
- Consistent sizing

#### [MODIFY] [GameHeader.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/components/GameHeader.tsx)
- Add arrow count indicator
- Better spacing

#### [MODIFY] [DifficultyBadge.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/components/DifficultyBadge.tsx)
- Color-coded backgrounds per difficulty
- Pill-shaped badge

#### [MODIFY] [VictoryScreen.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/screens/VictoryScreen.tsx)
- Add animations (star burst, confetti feel)
- Better layout with level info

#### [MODIFY] [FailScreen.tsx](file:///d:/WORK_RELATED/Arrow-Game/src/screens/FailScreen.tsx)
- Better messaging and layout

---

### 2. Add 50 Levels (currently 30 → expand to 50)

#### [MODIFY] [levels.ts](file:///d:/WORK_RELATED/Arrow-Game/src/levels/levels.ts)
- Add `Expert` difficulty type
- Add levels 31-50 with increasing complexity:
  - L31-35: Expert — 10-12 arrows, 12×10 to 14×12 grids
  - L36-40: Expert — 12-15 arrows, 14×12 to 16×14 grids
  - L41-45: Expert — 14-18 arrows, 16×14 to 18×16 grids
  - L46-50: Expert — 16-20 arrows, 18×16 to 20×18 grids
- All levels will be verified as solvable using the existing `verify_levels.mjs` script

#### [MODIFY] [types.ts](file:///d:/WORK_RELATED/Arrow-Game/src/game/types.ts)
- Add `Expert` to `Difficulty` type

#### [MODIFY] [engine.ts](file:///d:/WORK_RELATED/Arrow-Game/src/game/engine.ts)
- Update `getDifficultyForLevel` to include Expert range

#### [MODIFY] [navigation.ts](file:///d:/WORK_RELATED/Arrow-Game/src/types/navigation.ts)
- Add `LevelSelect` screen type

---

## Verification Plan

### Automated Tests
1. Run `node verify_levels.mjs` to verify all 50 levels are solvable with no overlaps
2. Run `npx tsc --noEmit` to ensure TypeScript compiles without errors

### Manual Verification
- User should run `npx expo start` and test the app on device/emulator
