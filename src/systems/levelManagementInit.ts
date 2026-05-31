/**
 * LEVEL MANAGEMENT INITIALIZATION
 *
 * Call this function during app startup to load the level progress data.
 * Example: In your App.tsx root component useEffect
 */

import { initializeLevelProgressMap } from '../state/gameStore';

/**
 * Initialize the level management system.
 * Call this once when the app starts (e.g., in App.tsx useEffect with empty deps).
 *
 * This loads the saved level progress from storage and sets up the system.
 */
export async function initializeLevelManagement(): Promise<void> {
  try {
    console.log('📚 Initializing Level Management System...');
    await initializeLevelProgressMap();
    console.log('✅ Level Management System initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Level Management System:', error);
  }
}
