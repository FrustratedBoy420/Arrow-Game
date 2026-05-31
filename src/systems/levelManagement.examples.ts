/**
 * LEVEL MANAGEMENT SYSTEM - DEMONSTRATION & USAGE EXAMPLES
 * 
 * This file demonstrates how to use the scalable level management system
 * and shows various scenarios including:
 * - Creating and initializing levels
 * - Calculating stars for different performance scenarios
 * - Checking level unlocks based on progression
 * - Dynamically adding new levels
 */

import {
  LEVEL_CONFIG,
  type LevelProgress,
  type StarCalculationResult,
  type UnlockCheckResult,
  calculateStars,
  checkLevelUnlocks,
  updateLevelProgress,
  createLevelProgress,
  initializeLevelMap,
  addLevel,
  getLevel,
  getAllLevelsSorted,
  getTotalStarsEarned,
  getCompletedLevelCount,
  getUnlockedLevelCount,
  generateProgressReport,
  printProgressReport
} from './levelManagement';

// ============================================================================
// EXAMPLE 1: Initialize the Level System with Starter Levels
// ============================================================================

export function exampleInitializeSystem(): void {
  console.log('\n' + '='.repeat(70));
  console.log('📚 EXAMPLE 1: Initialize Level System with Starter Levels');
  console.log('='.repeat(70));

  // Create a fresh level map with Levels 1-6
  const levelMap = initializeLevelMap();

  console.log('\n✅ Initial State:');
  levelMap.forEach((progress) => {
    const lockStatus = progress.isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED';
    console.log(`  Level ${progress.levelNumber}: ${lockStatus} | ${progress.totalArrows} arrows (${progress.totalArrows}s baseline)`);
  });
}

// ============================================================================
// EXAMPLE 2: Star Calculation Scenarios
// ============================================================================

export function exampleStarCalculations(): void {
  console.log('\n' + '='.repeat(70));
  console.log('⭐ EXAMPLE 2: Star Calculation Scenarios');
  console.log('='.repeat(70));

  // Scenario A: Perfect performance on Level 3 (15 arrows = 15s baseline)
  console.log('\n📍 Scenario A: Level 3 - Fast & Perfect');
  console.log('   Level 3 has 15 arrows (15s baseline)');
  console.log('   Player completes in 12 seconds with 0 hearts lost');
  const resultA = calculateStars(12, 15, 0);
  console.log(`   Result: ${resultA.finalStars} stars`);
  console.log(`   ${resultA.breakdown}`);

  // Scenario B: Good but slightly slow, no damage on Level 5 (20 arrows = 20s baseline)
  console.log('\n📍 Scenario B: Level 5 - Slightly Slow & Perfect');
  console.log('   Level 5 has 20 arrows (20s baseline)');
  console.log('   Player completes in 23 seconds with 0 hearts lost');
  const resultB = calculateStars(23, 20, 0);
  console.log(`   Result: ${resultB.finalStars} stars`);
  console.log(`   ${resultB.breakdown}`);

  // Scenario C: Slow completion with some damage on Level 4 (18 arrows = 18s baseline)
  console.log('\n📍 Scenario C: Level 4 - Very Slow & Damaged');
  console.log('   Level 4 has 18 arrows (18s baseline)');
  console.log('   Player completes in 28 seconds with 2 hearts lost');
  const resultC = calculateStars(28, 18, 2);
  console.log(`   Result: ${resultC.finalStars} stars (clamped to minimum)`);
  console.log(`   ${resultC.breakdown}`);

  // Scenario D: Over 5 seconds slower than baseline with 1 heart lost (Level 2, 12 arrows)
  console.log('\n📍 Scenario D: Level 2 - Over Limit & Damaged');
  console.log('   Level 2 has 12 arrows (12s baseline)');
  console.log('   Player completes in 20 seconds with 1 heart lost');
  const resultD = calculateStars(20, 12, 1);
  console.log(`   Result: ${resultD.finalStars} stars (clamped to minimum)`);
  console.log(`   ${resultD.breakdown}`);

  // Scenario E: Perfect execution on a custom level (Level 7, 24 arrows)
  console.log('\n📍 Scenario E: Level 7 (Future Custom Level) - Perfect Execution');
  console.log('   Level 7 has 24 arrows (24s baseline)');
  console.log('   Player completes in 24 seconds with 0 hearts lost');
  const resultE = calculateStars(24, 24, 0);
  console.log(`   Result: ${resultE.finalStars} stars`);
  console.log(`   ${resultE.breakdown}`);
}

// ============================================================================
// EXAMPLE 3: Simulating Level Progression & Star Accumulation
// ============================================================================

export function exampleProgressionSimulation(): void {
  console.log('\n' + '='.repeat(70));
  console.log('🎮 EXAMPLE 3: Simulate Player Progression & Star Accumulation');
  console.log('='.repeat(70));

  // Initialize the system
  const levelMap = initializeLevelMap();
  console.log('\n▶️  Starting: 6 levels initialized (Level 6 is LOCKED)');
  console.log(`   Unlock Threshold for Level 6+: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2} stars`);

  // Simulate player completing levels
  const completionData = [
    { levelNum: 1, timeTaken: 8, heartsLost: 0, description: 'Level 1: Perfect!' },
    { levelNum: 2, timeTaken: 14, heartsLost: 0, description: 'Level 2: Good time!' },
    { levelNum: 3, timeTaken: 18, heartsLost: 1, description: 'Level 3: One mistake' },
    { levelNum: 4, timeTaken: 19, heartsLost: 0, description: 'Level 4: Solid!' },
    { levelNum: 5, timeTaken: 25, heartsLost: 2, description: 'Level 5: Struggled a bit' }
  ];

  completionData.forEach(({ levelNum, timeTaken, heartsLost, description }) => {
    const progress = getLevel(levelMap, levelNum);
    if (progress) {
      const starResult = calculateStars(timeTaken, progress.totalArrows, heartsLost);
      const updated = updateLevelProgress(progress, timeTaken, heartsLost);
      levelMap.set(levelNum, updated);

      console.log(`\n  ✓ ${description}`);
      console.log(`    Time: ${timeTaken}s | Hearts Lost: ${heartsLost} → ${starResult.finalStars} stars earned`);
    }
  });

  // Check for level unlocks
  console.log(`\n▶️  Checking for Level Unlocks...`);
  const unlockResult = checkLevelUnlocks(levelMap);
  console.log(`   Total Stars Accumulated: ${unlockResult.totalStarsEarned}/${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2}`);

  if (unlockResult.newlyUnlockedLevels.length > 0) {
    console.log(`   🔓 LEVEL UNLOCK! Levels ${unlockResult.newlyUnlockedLevels.join(', ')} are now available!`);
  } else {
    console.log(`   🔒 Level 6 still locked. ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2 - unlockResult.totalStarsEarned} more stars needed.`);
  }

  // Print final progress report
  printProgressReport(levelMap);
}

// ============================================================================
// EXAMPLE 4: Dynamically Adding New Levels
// ============================================================================

export function exampleDynamicLevelAddition(): void {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 EXAMPLE 4: Dynamically Add New Levels (Future Expansion)');
  console.log('='.repeat(70));

  // Start with base levels
  const levelMap = initializeLevelMap();
  console.log('\n▶️  Starting with 6 levels...');
  console.log(`   Total Levels: ${levelMap.size}`);

  // Dynamically add new levels - THIS IS THE KEY FEATURE!
  console.log('\n▶️  Adding new levels dynamically (no hardcoding required)...');

  addLevel(levelMap, 7, 24);
  console.log('  ✓ Added Level 7 with 24 arrows');

  addLevel(levelMap, 8, 26);
  console.log('  ✓ Added Level 8 with 26 arrows');

  addLevel(levelMap, 9, 28);
  console.log('  ✓ Added Level 9 with 28 arrows');

  addLevel(levelMap, 10, 30);
  console.log('  ✓ Added Level 10 with 30 arrows');

  // Even add a tier-3 level!
  addLevel(levelMap, 11, 32);
  console.log('  ✓ Added Level 11 with 32 arrows (future tier-3 content)');

  console.log(`\n✅ New Total Levels: ${levelMap.size}`);
  console.log('\n   Level List:');
  getAllLevelsSorted(levelMap).forEach((progress) => {
    const lockStatus = progress.isLocked ? '🔒' : '🔓';
    console.log(`     ${lockStatus} Level ${progress.levelNumber}: ${progress.totalArrows} arrows`);
  });
}

// ============================================================================
// EXAMPLE 5: Complex Progression Scenario
// ============================================================================

export function exampleComplexScenario(): void {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 EXAMPLE 5: Complex Real-World Scenario');
  console.log('='.repeat(70));

  // Setup: Initialize with base + extended levels
  const levelMap = initializeLevelMap();
  addLevel(levelMap, 7, 24);
  addLevel(levelMap, 8, 26);
  addLevel(levelMap, 9, 28);
  addLevel(levelMap, 10, 30);
  addLevel(levelMap, 11, 35);

  console.log(`\n▶️  Scenario: Player with partial progression on 11 levels`);
  console.log(`   Tier 2 Threshold: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2} stars (Levels 6-10)`);
  console.log(`   Tier 3 Threshold: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_3} stars (Levels 11+)`);

  // Simulate mixed player performance
  const scores = [
    [1, 8, 0, 3],    // Level 1: 8s, 0 hearts → 3 stars
    [2, 12, 0, 3],   // Level 2: 12s, 0 hearts → 3 stars
    [3, 16, 1, 2],   // Level 3: 16s, 1 heart → 2 stars
    [4, 20, 0, 2],   // Level 4: 20s, 0 hearts → 2 stars
    [5, 24, 2, 1],   // Level 5: 24s, 2 hearts → 1 star
    [6, 25, 0, 2],   // Level 6: 25s, 0 hearts → 2 stars (unlocked)
    [7, 27, 1, 2],   // Level 7: 27s, 1 heart → 2 stars
    [8, 31, 0, 1]    // Level 8: 31s, 0 hearts → 1 star
  ] as const;

  scores.forEach(([levelNum, timeTaken, heartsLost]) => {
    const progress = getLevel(levelMap, levelNum);
    if (progress) {
      const updated = updateLevelProgress(progress, timeTaken, heartsLost);
      levelMap.set(levelNum, updated);
    }
  });

  // Check unlocks after each completion
  checkLevelUnlocks(levelMap);

  console.log('\n   Levels Completed:');
  getAllLevelsSorted(levelMap).forEach((p) => {
    if (p.isCompleted) {
      const lockStatus = p.isLocked ? '🔒' : '🔓';
      const stars = '⭐'.repeat(p.starsEarned);
      console.log(`     ${lockStatus} Level ${p.levelNumber}: ${stars} (${p.bestTime}s)`);
    }
  });

  printProgressReport(levelMap);
}

// ============================================================================
// EXAMPLE 6: Configuration Changes
// ============================================================================

export function exampleConfigurationFlexibility(): void {
  console.log('\n' + '='.repeat(70));
  console.log('⚙️  EXAMPLE 6: Configuration Flexibility');
  console.log('='.repeat(70));

  console.log('\n▶️  Current Configuration:');
  console.log(`   REQUIRED_TOTAL_STARS_FOR_TIER_2: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_2}`);
  console.log(`   REQUIRED_TOTAL_STARS_FOR_TIER_3: ${LEVEL_CONFIG.REQUIRED_TOTAL_STARS_FOR_TIER_3}`);
  console.log(`   MIN_STARS_PER_LEVEL: ${LEVEL_CONFIG.MIN_STARS_PER_LEVEL}`);
  console.log(`   MAX_STARS_PER_LEVEL: ${LEVEL_CONFIG.MAX_STARS_PER_LEVEL}`);

  console.log('\n💡 To adjust difficulty:');
  console.log('   1. Modify LEVEL_CONFIG in levelManagement.ts');
  console.log('   2. Changes apply instantly - no need to recompile level data');
  console.log('   3. Example: Set REQUIRED_TOTAL_STARS_FOR_TIER_2 to 8 for easier progression');
}

// ============================================================================
// MAIN: Run All Examples
// ============================================================================

export function runAllExamples(): void {
  console.log('\n' + '█'.repeat(70));
  console.log('█  LEVEL MANAGEMENT SYSTEM - COMPLETE DEMONSTRATION');
  console.log('█'.repeat(70));

  exampleInitializeSystem();
  exampleStarCalculations();
  exampleProgressionSimulation();
  exampleDynamicLevelAddition();
  exampleComplexScenario();
  exampleConfigurationFlexibility();

  console.log('\n' + '█'.repeat(70));
  console.log('█  END OF DEMONSTRATION');
  console.log('█'.repeat(70) + '\n');
}

// Uncomment this line to run examples in your app:
// runAllExamples();
