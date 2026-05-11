export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type GridPosition = {
  x: number;
  y: number;
};

export type ArrowNode = {
  id: string;
  direction: Direction;
  length: number;
  position: GridPosition;
};

export type LevelDefinition = {
  id: number;
  title: string;
  difficulty: Difficulty;
  gridSize: { columns: number; rows: number };
  arrows: ArrowNode[];
};

export type BoardState = {
  level: LevelDefinition;
  arrows: ArrowNode[];
  livesLeft: number;
  removedIds: string[];
};

export type TapResult =
  | { type: 'REMOVED'; arrowId: string; board: BoardState }
  | { type: 'BLOCKED'; arrowId: string; livesLeft: number; board: BoardState };

export type GameStatus = 'playing' | 'won' | 'failed';
