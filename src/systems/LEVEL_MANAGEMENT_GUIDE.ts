/**
 * LEVEL MANAGEMENT SYSTEM - INTEGRATION GUIDE
 * 
 * This document explains how to integrate the scalable Level Management
 * and Star Rating system with your existing Arrow Game.
 */

// ============================================================================
// 1. SYSTEM OVERVIEW
// ============================================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURE                                                                │
│                                                                             │
│  Existing Arrow Game          Level Management System                      │
│  ├─ GameplayScreen (UI)       ├─ Level Metadata                            │
│  ├─ gameStore (Zustand)       ├─ Star Calculation                          │
│  ├─ engine.ts (Game Logic)    ├─ Progression Tracking                      │
│  └─ levels.ts (Level Definitions)  └─ Dynamic Unlocking                    │
│                                                                             │
│  Communication Flow:                                                       │
│  1. Player completes level in GameplayScreen                              │
│  2. GameplayScreen calls completeLevelWithStars(levelId, timeTaken, ...)  │
│  3. calculateStars() computes earned stars                                 │
│  4. updateLevelProgress() stores progress                                 │
│  5. checkLevelUnlocks() unlocks new levels if needed                      │
│  6. UI updates to show stars and unlocked levels                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
*/

// ============================================================================
// 2. QUICK START - 3 STEPS TO INTEGRATE
// ============================================================================

/*
STEP 1: Initialize the system in your app or game store
─────────────────────────────────────────────────────────

    import { initializeLevelMap } from './systems/levelManagement';
    
    // Call once on app startup
    const levelProgressMap = initializeLevelMap();
    
    // Or in your Zustand store:
    type GameStore = {
      levelProgressMap: Map<number, LevelProgress>;
      // ... other state
    };

STEP 2: Update gameStore when a level is completed
───────────────────────────────────────────────────

    import { 
      updateLevelProgress, 
      checkLevelUnlocks 
    } from './systems/levelManagement';
    
    // In your gameStore.completeLevelOrSimilar() function:
    const levelProgress = levelProgressMap.get(levelId);
    if (levelProgress) {
      const updated = updateLevelProgress(levelProgress, timeTaken, heartsLost);
      levelProgressMap.set(levelId, updated);
      
      // Check if new levels should unlock
      checkLevelUnlocks(levelProgressMap);
    }

STEP 3: Display stars in your UI
────────────────────────────────

    import { getLevel } from './systems/levelManagement';
    
    // In VictoryScreen.tsx:
    const levelProgress = getLevel(levelProgressMap, levelId);
    if (levelProgress) {
      return (
        <StarDisplay count={levelProgress.starsEarned} />
      );
    }
*/

// ============================================================================
// 3. DETAILED API REFERENCE
// ============================================================================

/*
MAIN FUNCTIONS
──────────────

1. calculateStars(timeTaken, totalArrows, heartsLost): StarCalculationResult
   ├─ Purpose: Calculate stars earned for a level completion
   ├─ Inputs:
   │  ├─ timeTaken: number (seconds)
   │  ├─ totalArrows: number (baseline seconds for that level)
   │  └─ heartsLost: number (0, 1, 2, or 3)
   ├─ Output: StarCalculationResult
   │  ├─ baseStars: 1-3 (based on time alone)
   │  ├─ penalty: 0 or 1 (if hearts were lost)
   │  ├─ finalStars: 1-3 (baseStars - penalty, floored to min 1)
   │  └─ breakdown: string (human-readable explanation)
   └─ Example:
      const result = calculateStars(15, 20, 1);
      // → { baseStars: 2, penalty: 1, finalStars: 1, breakdown: "..." }

2. checkLevelUnlocks(levelProgressMap): UnlockCheckResult
   ├─ Purpose: Check and apply unlock conditions for all levels
   ├─ Input: Map<number, LevelProgress>
   ├─ Output: UnlockCheckResult
   │  ├─ totalStarsEarned: number (sum across all levels)
   │  ├─ newlyUnlockedLevels: number[] (levels that just unlocked)
   │  └─ progressReport: string (human-readable summary)
   └─ Side Effect: Modifies isLocked flag in levelProgressMap
   
3. updateLevelProgress(progress, timeTaken, heartsLost): LevelProgress
   ├─ Purpose: Update a single level after completion
   ├─ Inputs:
   │  ├─ progress: LevelProgress (the level to update)
   │  ├─ timeTaken: number (seconds)
   │  └─ heartsLost: number
   ├─ Output: Updated LevelProgress
   │  ├─ isCompleted: true
   │  ├─ starsEarned: calculated value
   │  └─ bestTime: tracking best run
   └─ Example:
      const updatedProgress = updateLevelProgress(levelProgress, 18, 0);
      levelProgressMap.set(levelId, updatedProgress);

INITIALIZATION FUNCTIONS
──────────────────────────

1. initializeLevelMap(): Map<number, LevelProgress>
   ├─ Purpose: Create a fresh level map with Levels 1-6
   ├─ Output: Map with all starter levels
   └─ Use Case: App startup or reset game

2. createLevelProgress(levelNumber, totalArrows): LevelProgress
   ├─ Purpose: Create progress object for a single level
   ├─ Inputs:
   │  ├─ levelNumber: number
   │  └─ totalArrows: number (baseline seconds)
   ├─ Output: LevelProgress object
   └─ Behavior: Levels 1-5 unlocked, 6+ locked

3. addLevel(levelMap, levelNumber, totalArrows): void
   ├─ Purpose: Dynamically add a new level
   ├─ Example:
   │  addLevel(levelMap, 7, 24);  // Add Level 7
   └─ Note: Can be called anytime, no hardcoding needed

QUERY FUNCTIONS
────────────────

1. getLevel(levelMap, levelNumber): LevelProgress | undefined
   └─ Get progress data for a specific level

2. getAllLevelsSorted(levelMap): LevelProgress[]
   └─ Get all levels sorted by level number

3. getTotalStarsEarned(levelMap): number
   └─ Get sum of all stars across all levels

4. getCompletedLevelCount(levelMap): number
   └─ Get count of completed levels

5. getUnlockedLevelCount(levelMap): number
   └─ Get count of unlocked levels

REPORTING FUNCTIONS
─────────────────────

1. generateProgressReport(levelMap): string
   └─ Generate detailed progress report (returns string)

2. printProgressReport(levelMap): void
   └─ Print progress report to console for debugging
*/

// ============================================================================
// 4. CONFIGURATION REFERENCE
// ============================================================================

/*
LEVEL_CONFIG Object
───────────────────

export const LEVEL_CONFIG = {
  // Stars required to unlock Tier 2 (Levels 6-10)
  REQUIRED_TOTAL_STARS_FOR_TIER_2: 10,
  
  // Stars required to unlock Tier 3 (Levels 11+)
  REQUIRED_TOTAL_STARS_FOR_TIER_3: 25,
  
  // Minimum stars per successful completion
  MIN_STARS_PER_LEVEL: 1,
  
  // Maximum stars per level
  MAX_STARS_PER_LEVEL: 3
};

TO MODIFY DIFFICULTY:
─────────────────────
Just edit LEVEL_CONFIG values. No other changes needed.

Example 1: Easier Progression
  REQUIRED_TOTAL_STARS_FOR_TIER_2: 8  // Unlock tier 2 sooner

Example 2: Stricter Grading
  REQUIRED_TOTAL_STARS_FOR_TIER_2: 15  // Need more stars

Example 3: Allow 0-star completions
  MIN_STARS_PER_LEVEL: 0  // Not recommended for gameplay
*/

// ============================================================================
// 5. TYPE DEFINITIONS
// ============================================================================

/*
export interface LevelProgress {
  levelNumber: number;        // Unique identifier
  totalArrows: number;        // Baseline seconds (arrow count = base time)
  isLocked: boolean;          // Can player access this level?
  starsEarned: number;        // 0 (not completed) or 1-3 (stars earned)
  isCompleted: boolean;       // Has this level been beaten?
  bestTime: number | null;    // Best completion time (null if not completed)
}

export interface StarCalculationResult {
  baseStars: number;          // 1-3 based on time
  penalty: number;            // 0 or 1 (hearts lost penalty)
  finalStars: number;         // baseStars - penalty (min 1)
  breakdown: string;          // Human-readable explanation
}

export interface UnlockCheckResult {
  totalStarsEarned: number;   // Sum of all stars
  newlyUnlockedLevels: number[];  // Levels that just unlocked
  progressReport: string;     // Human-readable summary
}
*/

// ============================================================================
// 6. USAGE EXAMPLES
// ============================================================================

/*
EXAMPLE 1: Basic Level Completion
──────────────────────────────────

    import { 
      initializeLevelMap, 
      updateLevelProgress, 
      checkLevelUnlocks, 
      getLevel 
    } from './systems/levelManagement';

    // Setup
    const levelMap = initializeLevelMap();
    
    // Simulate player completing Level 3
    const levelProgress = getLevel(levelMap, 3);
    if (levelProgress) {
      // Player took 16 seconds, lost 0 hearts
      const updated = updateLevelProgress(levelProgress, 16, 0);
      levelMap.set(3, updated);
      
      // Check if any levels should unlock
      checkLevelUnlocks(levelMap);
      
      console.log(`Earned ${updated.starsEarned} stars!`);
    }

EXAMPLE 2: Add New Levels Dynamically
──────────────────────────────────────

    import { initializeLevelMap, addLevel } from './systems/levelManagement';

    const levelMap = initializeLevelMap();  // Levels 1-6
    
    // Add future levels without recompiling data
    addLevel(levelMap, 7, 24);   // Level 7: 24 arrows
    addLevel(levelMap, 8, 26);   // Level 8: 26 arrows
    addLevel(levelMap, 9, 28);   // Level 9: 28 arrows
    addLevel(levelMap, 10, 30);  // Level 10: 30 arrows
    
    // Level 7-10 start as LOCKED and unlock when Tier 2 requirement met
    // (REQUIRED_TOTAL_STARS_FOR_TIER_2 stars earned)

EXAMPLE 3: Display Progression UI
──────────────────────────────────

    import { 
      getTotalStarsEarned, 
      getUnlockedLevelCount, 
      getAllLevelsSorted 
    } from './systems/levelManagement';

    function ProgressScreen({ levelMap }) {
      const totalStars = getTotalStarsEarned(levelMap);
      const unlockedCount = getUnlockedLevelCount(levelMap);
      const allLevels = getAllLevelsSorted(levelMap);
      
      return (
        <div>
          <h1>Progress: {totalStars} Stars</h1>
          <h2>Unlocked: {unlockedCount}/{allLevels.length} Levels</h2>
          
          {allLevels.map(level => (
            <LevelCard
              key={level.levelNumber}
              level={level}
              locked={level.isLocked}
              stars={level.starsEarned}
            />
          ))}
        </div>
      );
    }

EXAMPLE 4: Zustand Store Integration
─────────────────────────────────────

    import { create } from 'zustand';
    import { 
      initializeLevelMap,
      updateLevelProgress,
      checkLevelUnlocks,
      getLevel
    } from './systems/levelManagement';

    type GameStore = {
      levelProgressMap: Map<number, LevelProgress>;
      completeLevelWithStars: (levelId: number, timeTaken: number, heartsLost: number) => void;
      // ...
    };

    export const useGameStore = create<GameStore>((set, get) => ({
      levelProgressMap: initializeLevelMap(),
      
      completeLevelWithStars: (levelId, timeTaken, heartsLost) => {
        const { levelProgressMap } = get();
        const progress = getLevel(levelProgressMap, levelId);
        
        if (progress) {
          const updated = updateLevelProgress(progress, timeTaken, heartsLost);
          levelProgressMap.set(levelId, updated);
          
          checkLevelUnlocks(levelProgressMap);
          
          set({ levelProgressMap: new Map(levelProgressMap) });
        }
      }
    }));
*/

// ============================================================================
// 7. STAR CALCULATION FORMULA
// ============================================================================

/*
STEP-BY-STEP CALCULATION
────────────────────────

Input:
  ├─ timeTaken = 18 seconds
  ├─ totalArrows = 15 (baseline 15 seconds)
  └─ heartsLost = 1

Step 1: Calculate Base Stars (time-based)
  ├─ Is 18 <= 15? NO
  ├─ Is 18 <= (15 + 5) = 20? YES
  └─ baseStars = 2

Step 2: Apply Hearts Loss Penalty
  ├─ Is heartsLost > 0? YES
  └─ penalty = 1

Step 3: Calculate Final Stars
  ├─ finalStars = baseStars - penalty = 2 - 1 = 1
  └─ Floor check: max(1, 1) = 1 ✓

Result: 1 star earned

────────────────────────────────────────

ANOTHER EXAMPLE
───────────────

Input:
  ├─ timeTaken = 12 seconds
  ├─ totalArrows = 15
  └─ heartsLost = 0

Step 1: Base Stars
  ├─ Is 12 <= 15? YES
  └─ baseStars = 3

Step 2: Penalty
  ├─ Is heartsLost > 0? NO
  └─ penalty = 0

Step 3: Final Stars
  ├─ finalStars = 3 - 0 = 3
  └─ Floor check: max(1, 3) = 3 ✓

Result: 3 stars earned
*/

// ============================================================================
// 8. LEVEL UNLOCK LOGIC
// ============================================================================

/*
DYNAMIC TIER SYSTEM
───────────────────

Tier 1 (Levels 1-5):
  ├─ Always UNLOCKED from the start
  ├─ No requirements
  └─ Players complete these to earn stars

Tier 2 (Levels 6-10):
  ├─ Start as LOCKED
  ├─ Unlock when totalStars >= REQUIRED_TOTAL_STARS_FOR_TIER_2 (default: 10)
  ├─ Once unlocked, stays unlocked
  └─ Can add more levels (e.g., 11-15) they automatically become Tier 3+

Tier 3 (Levels 11+):
  ├─ Start as LOCKED
  ├─ Unlock when totalStars >= REQUIRED_TOTAL_STARS_FOR_TIER_3 (default: 25)
  ├─ Perfect for future expansion
  └─ Add new levels without changing code

HOW TO EXTEND TO 4+ TIERS
────────────────────────

In levelManagement.ts, add to LEVEL_CONFIG:
  REQUIRED_TOTAL_STARS_FOR_TIER_4: 40,

In checkLevelUnlocks(), add tier logic:
  else if (levelNum >= 16 && levelNum <= 20) {
    shouldBeUnlocked = totalStarsEarned >= LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_4;
  }

Then dynamically add levels:
  addLevel(levelMap, 16, 32);
  addLevel(levelMap, 17, 35);
  // ... etc
*/

// ============================================================================
// 9. MIGRATING FROM EXISTING SYSTEM
// ============================================================================

/*
IF YOU HAVE EXISTING LEVEL COMPLETION DATA
────────────────────────────────────────────

Step 1: Create Migration Function

    function migrateExistingLevels(
      existingLevelCompletions: any[]
    ): Map<number, LevelProgress> {
      const levelMap = initializeLevelMap();
      
      existingLevelCompletions.forEach(completion => {
        const levelProgress = getLevel(levelMap, completion.levelId);
        if (levelProgress) {
          // Calculate stars if you have timeTaken and heartsLost data
          const starResult = calculateStars(
            completion.timeTaken,
            levelProgress.totalArrows,
            completion.heartsLost || 0
          );
          
          levelProgress.isCompleted = true;
          levelProgress.starsEarned = starResult.finalStars;
          levelProgress.bestTime = completion.timeTaken;
        }
      });
      
      checkLevelUnlocks(levelMap);
      return levelMap;
    }

Step 2: Call During App Initialization

    const savedCompletions = await AsyncStorage.getItem('levelCompletions');
    const levelMap = savedCompletions
      ? migrateExistingLevels(JSON.parse(savedCompletions))
      : initializeLevelMap();

Step 3: Persist to AsyncStorage

    AsyncStorage.setItem(
      'levelProgressMap',
      JSON.stringify(Array.from(levelMap.entries()))
    );
*/

// ============================================================================
// 10. TESTING & DEBUGGING
// ============================================================================

/*
USE THE EXAMPLE FILE FOR TESTING
──────────────────────────────────

    import { runAllExamples } from './systems/levelManagement.examples';
    
    // In your app or browser console:
    runAllExamples();
    
    This will output:
    ├─ Example 1: Initialize System
    ├─ Example 2: Star Calculations
    ├─ Example 3: Progression Simulation
    ├─ Example 4: Dynamic Level Addition
    ├─ Example 5: Complex Scenario
    └─ Example 6: Configuration Flexibility

DEBUG INDIVIDUAL CALCULATIONS
──────────────────────────────

    const result = calculateStars(18, 15, 1);
    console.log(result.breakdown);
    
    Output:
    ⏱️  Time Analysis: Time (18s) is within 15 to 20 seconds → 2 base stars
    ❤️  Health Penalty: Hearts lost: 1 (-1 star penalty)
    ⭐ Final Result: 1 stars (min floor: 1)

PRINT PROGRESS REPORT
──────────────────────

    printProgressReport(levelMap);
    
    Output:
    ==================================================
    📈 LEVEL PROGRESSION REPORT
    ==================================================
    Progress: 5/6 levels completed
    Unlocked: 5/6 levels available
    Total Stars: 11
    Next Tier Requirement: 10 stars
    
      Level 1: ✅ COMPLETE | ⭐⭐⭐ (8s)
      Level 2: ✅ COMPLETE | ⭐⭐⭐ (12s)
      Level 3: ✅ COMPLETE | ⭐⭐ (16s)
      Level 4: ✅ COMPLETE | ⭐⭐ (19s)
      Level 5: ✅ COMPLETE | ⭐ (24s)
      Level 6: 🔓 OPEN | ○ (—)
    ==================================================
*/

// ============================================================================
// 11. PERFORMANCE CONSIDERATIONS
// ============================================================================

/*
MAP PERFORMANCE
────────────────

✓ Uses Map<number, LevelProgress> for O(1) lookups
✓ Scales well even with 100+ levels
✓ Iteration is O(n) but only done on demand

MEMORY USAGE
─────────────

Small: Each LevelProgress object ~200 bytes
├─ 100 levels = ~20 KB (negligible)
├─ 1000 levels = ~200 KB (still negligible)
└─ Even with metadata, well within React Native budget

PERSISTENCE
─────────────

To save to AsyncStorage:
  const data = JSON.stringify(Array.from(levelMap.entries()));
  AsyncStorage.setItem('levelProgressMap', data);

To load from AsyncStorage:
  const data = await AsyncStorage.getItem('levelProgressMap');
  const levelMap = new Map(JSON.parse(data));
*/

// ============================================================================
// SUMMARY
// ============================================================================

/*
KEY ADVANTAGES OF THIS SYSTEM:

1. ZERO HARDCODING
   ✓ Add levels by calling addLevel() with just level number and arrow count
   ✓ No modification to core logic needed
   ✓ Configuration-driven progression

2. DYNAMIC TIER UNLOCKING
   ✓ Automatically unlocks levels based on total stars
   ✓ Easily add new tiers without changing code
   ✓ Flexible progression design

3. CLEAN API
   ✓ Simple, descriptive function names
   ✓ Type-safe TypeScript interfaces
   ✓ Clear separation of concerns

4. SCALABLE
   ✓ Works with 5, 50, or 500 levels equally well
   ✓ No performance degradation
   ✓ Designed for future expansion

5. TESTABLE
   ✓ Pure functions (no side effects except intentional updates)
   ✓ Easy to unit test
   ✓ Example file demonstrates all scenarios

6. DEBUGGABLE
   ✓ Detailed progress reports
   ✓ Clear calculation breakdowns
   ✓ Console logging helpers

7. EASILY INTEGRABLE
   ✓ Works standalone or with existing game store
   ✓ No forced architectural changes
   ✓ Compatible with React/React Native
*/
