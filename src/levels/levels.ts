import type { ArrowNode, LevelDefinition } from '../game/types';

export const levels: LevelDefinition[] = [
  {
    "id": 1,
    "title": "Level 1",
    "difficulty": "Easy",
    "gridSize": {
      "columns": 7,
      "rows": 5
    },
    "arrows": [
      {
        "id": "1a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 1
        }
      },
      {
        "id": "1b",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "1c",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 2
        }
      }
    ]
  },
  {
    "id": 2,
    "title": "Level 2",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 8,
      "rows": 8
    },
    "arrows": [
      {
        "id": "6a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 1
        }
      },
      {
        "id": "6b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "6c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 6
        }
      },
      {
        "id": "6d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 6,
          "y": 5
        }
      },
      {
        "id": "6e",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 4
        }
      }
    ]
  },
  {
    "id": 3,
    "title": "Level 3",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 11,
      "rows": 9
    },
    "arrows": [
      {
        "id": "16a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 6,
          "y": 0
        }
      },
      {
        "id": "16b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "16c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 3
        }
      },
      {
        "id": "16d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 9,
          "y": 6
        }
      },
      {
        "id": "16e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "16f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 5
        }
      },
      {
        "id": "16g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 8,
          "y": 8
        }
      },
      {
        "id": "16h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 3
        }
      }
    ]
  },
  {
    "id": 4,
    "title": "Level 4",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 12,
      "rows": 10
    },
    "arrows": [
      {
        "id": "31a",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 2,
          "y": 5
        }
      },
      {
        "id": "31b",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 9
        }
      },
      {
        "id": "31c",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 9,
          "y": 2
        }
      },
      {
        "id": "31d",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 5
        }
      },
      {
        "id": "31e",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 10,
          "y": 6
        }
      },
      {
        "id": "31f",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 2
        }
      },
      {
        "id": "31g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 9
        }
      },
      {
        "id": "31h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 0,
          "y": 8
        }
      },
      {
        "id": "31i",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 2,
          "y": 4
        }
      },
      {
        "id": "31j",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 10,
          "y": 3
        }
      }
    ]
  },
  {
    "id": 5,
    "title": "Level 5",
    "difficulty": "Easy",
    "gridSize": {
      "columns": 7,
      "rows": 6
    },
    "arrows": [
      {
        "id": "2a",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 1
        }
      },
      {
        "id": "2b",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "2c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 5
        }
      },
      {
        "id": "2d",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 0
        }
      }
    ]
  },
  {
    "id": 6,
    "title": "Level 6",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 9,
      "rows": 9
    },
    "arrows": [
      {
        "id": "7a",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 4,
          "y": 2
        }
      },
      {
        "id": "7b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 5
        }
      },
      {
        "id": "7c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 4
        }
      },
      {
        "id": "7d",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 4
        }
      },
      {
        "id": "7e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 3
        }
      },
      {
        "id": "7f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 7,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 7,
    "title": "Level 7",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 11,
      "rows": 10
    },
    "arrows": [
      {
        "id": "17a",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 1,
          "y": 2
        }
      },
      {
        "id": "17b",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 6,
          "y": 0
        }
      },
      {
        "id": "17c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 5
        }
      },
      {
        "id": "17d",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 5
        }
      },
      {
        "id": "17e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 9,
          "y": 8
        }
      },
      {
        "id": "17f",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 4
        }
      },
      {
        "id": "17g",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 2,
          "y": 7
        }
      },
      {
        "id": "17h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 3
        }
      }
    ]
  },
  {
    "id": 8,
    "title": "Level 8",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 12,
      "rows": 10
    },
    "arrows": [
      {
        "id": "32a",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "32b",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 2,
          "y": 2
        }
      },
      {
        "id": "32c",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "32d",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 1,
          "y": 7
        }
      },
      {
        "id": "32e",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 7
        }
      },
      {
        "id": "32f",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 9
        }
      },
      {
        "id": "32g",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 7
        }
      },
      {
        "id": "32h",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 5
        }
      },
      {
        "id": "32i",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 7
        }
      },
      {
        "id": "32j",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 11,
          "y": 2
        }
      }
    ]
  },
  {
    "id": 9,
    "title": "Level 9",
    "difficulty": "Easy",
    "gridSize": {
      "columns": 8,
      "rows": 7
    },
    "arrows": [
      {
        "id": "3a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "3b",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 1
        }
      },
      {
        "id": "3c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "3d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 0,
          "y": 3
        }
      }
    ]
  },
  {
    "id": 10,
    "title": "Level 10",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 9,
      "rows": 8
    },
    "arrows": [
      {
        "id": "8a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 1
        }
      },
      {
        "id": "8b",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 0
        }
      },
      {
        "id": "8c",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "8d",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 7,
          "y": 3
        }
      },
      {
        "id": "8e",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 6
        }
      },
      {
        "id": "8f",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 0,
          "y": 6
        }
      }
    ]
  },
  {
    "id": 11,
    "title": "Level 11",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 11,
      "rows": 10
    },
    "arrows": [
      {
        "id": "18a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 0
        }
      },
      {
        "id": "18b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "18c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 3
        }
      },
      {
        "id": "18d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 9,
          "y": 6
        }
      },
      {
        "id": "18e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 2,
          "y": 6
        }
      },
      {
        "id": "18f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 5,
          "y": 6
        }
      },
      {
        "id": "18g",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 9
        }
      },
      {
        "id": "18h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 9
        }
      }
    ]
  },
  {
    "id": 12,
    "title": "Level 12",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 12,
      "rows": 10
    },
    "arrows": [
      {
        "id": "33a",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 9
        }
      },
      {
        "id": "33b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "33c",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 9,
          "y": 7
        }
      },
      {
        "id": "33d",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 0,
          "y": 4
        }
      },
      {
        "id": "33e",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 10,
          "y": 0
        }
      },
      {
        "id": "33f",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "33g",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 2
        }
      },
      {
        "id": "33h",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 6
        }
      },
      {
        "id": "33i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 2,
          "y": 8
        }
      },
      {
        "id": "33j",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 8,
          "y": 7
        }
      },
      {
        "id": "33k",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 6,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 13,
    "title": "Level 13",
    "difficulty": "Easy",
    "gridSize": {
      "columns": 7,
      "rows": 7
    },
    "arrows": [
      {
        "id": "4a",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 1
        }
      },
      {
        "id": "4b",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 3
        }
      },
      {
        "id": "4c",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 4
        }
      },
      {
        "id": "4d",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 2,
          "y": 3
        }
      }
    ]
  },
  {
    "id": 14,
    "title": "Level 14",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 9,
      "rows": 8
    },
    "arrows": [
      {
        "id": "9a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "9b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "9c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 4
        }
      },
      {
        "id": "9d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 5
        }
      },
      {
        "id": "9e",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "9f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 15,
    "title": "Level 15",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 11,
      "rows": 11
    },
    "arrows": [
      {
        "id": "19a",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 2,
          "y": 2
        }
      },
      {
        "id": "19b",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 6,
          "y": 0
        }
      },
      {
        "id": "19c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 4
        }
      },
      {
        "id": "19d",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "19e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 9,
          "y": 9
        }
      },
      {
        "id": "19f",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "19g",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 8,
          "y": 3
        }
      },
      {
        "id": "19h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 9
        }
      }
    ]
  },
  {
    "id": 16,
    "title": "Level 16",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 13,
      "rows": 11
    },
    "arrows": [
      {
        "id": "34a",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 11,
          "y": 8
        }
      },
      {
        "id": "34b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 2
        }
      },
      {
        "id": "34c",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 5
        }
      },
      {
        "id": "34d",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 2
        }
      },
      {
        "id": "34e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 11,
          "y": 4
        }
      },
      {
        "id": "34f",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 1,
          "y": 5
        }
      },
      {
        "id": "34g",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 3,
          "y": 2
        }
      },
      {
        "id": "34h",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 12,
          "y": 10
        }
      },
      {
        "id": "34i",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "34j",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 0
        }
      },
      {
        "id": "34k",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 3
        }
      }
    ]
  },
  {
    "id": 17,
    "title": "Level 17",
    "difficulty": "Easy",
    "gridSize": {
      "columns": 8,
      "rows": 7
    },
    "arrows": [
      {
        "id": "5a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "5b",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "5c",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 6,
          "y": 5
        }
      },
      {
        "id": "5d",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 4
        }
      },
      {
        "id": "5e",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 4
        }
      }
    ]
  },
  {
    "id": 18,
    "title": "Level 18",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 9,
      "rows": 9
    },
    "arrows": [
      {
        "id": "10a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 4,
          "y": 0
        }
      },
      {
        "id": "10b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "10c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 4
        }
      },
      {
        "id": "10d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "10e",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "10f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 19,
    "title": "Level 19",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 12,
      "rows": 10
    },
    "arrows": [
      {
        "id": "20a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 7,
          "y": 0
        }
      },
      {
        "id": "20b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "20c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 8,
          "y": 4
        }
      },
      {
        "id": "20d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 10,
          "y": 7
        }
      },
      {
        "id": "20e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "20f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 5,
          "y": 5
        }
      },
      {
        "id": "20g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "20h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 4
        }
      },
      {
        "id": "20i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 8
        }
      }
    ]
  },
  {
    "id": 20,
    "title": "Level 20",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 13,
      "rows": 11
    },
    "arrows": [
      {
        "id": "35a",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 9,
          "y": 6
        }
      },
      {
        "id": "35b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 11,
          "y": 0
        }
      },
      {
        "id": "35c",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 2
        }
      },
      {
        "id": "35d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 5,
          "y": 10
        }
      },
      {
        "id": "35e",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "35f",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 1
        }
      },
      {
        "id": "35g",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 1,
          "y": 1
        }
      },
      {
        "id": "35h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 10
        }
      },
      {
        "id": "35i",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 0,
          "y": 7
        }
      },
      {
        "id": "35j",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 12,
          "y": 3
        }
      },
      {
        "id": "35k",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "35l",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 21,
    "title": "Level 21",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 9,
      "rows": 9
    },
    "arrows": [
      {
        "id": "11a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 1
        }
      },
      {
        "id": "11b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "11c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 4
        }
      },
      {
        "id": "11d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "11e",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "11f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 22,
    "title": "Level 22",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 12,
      "rows": 11
    },
    "arrows": [
      {
        "id": "21a",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 1,
          "y": 2
        }
      },
      {
        "id": "21b",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 7,
          "y": 0
        }
      },
      {
        "id": "21c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 3
        }
      },
      {
        "id": "21d",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 8,
          "y": 5
        }
      },
      {
        "id": "21e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 10,
          "y": 9
        }
      },
      {
        "id": "21f",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "21g",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 7
        }
      },
      {
        "id": "21h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 7,
          "y": 10
        }
      },
      {
        "id": "21i",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 5,
          "y": 8
        }
      }
    ]
  },
  {
    "id": 23,
    "title": "Level 23",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 13,
      "rows": 11
    },
    "arrows": [
      {
        "id": "36a",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 4
        }
      },
      {
        "id": "36b",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 5
        }
      },
      {
        "id": "36c",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 7,
          "y": 9
        }
      },
      {
        "id": "36d",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 9,
          "y": 0
        }
      },
      {
        "id": "36e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 10,
          "y": 3
        }
      },
      {
        "id": "36f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "36g",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 2,
          "y": 10
        }
      },
      {
        "id": "36h",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 0,
          "y": 3
        }
      },
      {
        "id": "36i",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 2,
          "y": 6
        }
      },
      {
        "id": "36j",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 2
        }
      },
      {
        "id": "36k",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 7
        }
      },
      {
        "id": "36l",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 6,
          "y": 4
        }
      }
    ]
  },
  {
    "id": 24,
    "title": "Level 24",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 10,
      "rows": 9
    },
    "arrows": [
      {
        "id": "12a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "12b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "12c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 4
        }
      },
      {
        "id": "12d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "12e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "12f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 5
        }
      },
      {
        "id": "12g",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 8
        }
      }
    ]
  },
  {
    "id": 25,
    "title": "Level 25",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 12,
      "rows": 11
    },
    "arrows": [
      {
        "id": "22a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 7,
          "y": 0
        }
      },
      {
        "id": "22b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "22c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 2
        }
      },
      {
        "id": "22d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 10,
          "y": 5
        }
      },
      {
        "id": "22e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 4
        }
      },
      {
        "id": "22f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 8,
          "y": 4
        }
      },
      {
        "id": "22g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 8
        }
      },
      {
        "id": "22h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 2,
          "y": 8
        }
      },
      {
        "id": "22i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 10
        }
      }
    ]
  },
  {
    "id": 26,
    "title": "Level 26",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 14,
      "rows": 12
    },
    "arrows": [
      {
        "id": "37a",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 11,
          "y": 4
        }
      },
      {
        "id": "37b",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 7,
          "y": 3
        }
      },
      {
        "id": "37c",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "37d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "37e",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 11
        }
      },
      {
        "id": "37f",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 3,
          "y": 9
        }
      },
      {
        "id": "37g",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 8
        }
      },
      {
        "id": "37h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 13,
          "y": 10
        }
      },
      {
        "id": "37i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 8
        }
      },
      {
        "id": "37j",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 1
        }
      },
      {
        "id": "37k",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 4
        }
      },
      {
        "id": "37l",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 12,
          "y": 6
        }
      },
      {
        "id": "37m",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 2,
          "y": 2
        }
      }
    ]
  },
  {
    "id": 27,
    "title": "Level 27",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 10,
      "rows": 9
    },
    "arrows": [
      {
        "id": "13a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "13b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "13c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 4
        }
      },
      {
        "id": "13d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "13e",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "13f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 5
        }
      },
      {
        "id": "13g",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 6,
          "y": 8
        }
      }
    ]
  },
  {
    "id": 28,
    "title": "Level 28",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 13,
      "rows": 11
    },
    "arrows": [
      {
        "id": "23a",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 1,
          "y": 2
        }
      },
      {
        "id": "23b",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 8,
          "y": 0
        }
      },
      {
        "id": "23c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "23d",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 4
        }
      },
      {
        "id": "23e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 11,
          "y": 7
        }
      },
      {
        "id": "23f",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "23g",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 6,
          "y": 5
        }
      },
      {
        "id": "23h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "23i",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 8,
          "y": 9
        }
      },
      {
        "id": "23j",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 9
        }
      }
    ]
  },
  {
    "id": 29,
    "title": "Level 29",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 14,
      "rows": 12
    },
    "arrows": [
      {
        "id": "38a",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "38b",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 9,
          "y": 5
        }
      },
      {
        "id": "38c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 0
        }
      },
      {
        "id": "38d",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 8,
          "y": 7
        }
      },
      {
        "id": "38e",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 6
        }
      },
      {
        "id": "38f",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 4,
          "y": 10
        }
      },
      {
        "id": "38g",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 8,
          "y": 9
        }
      },
      {
        "id": "38h",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 11
        }
      },
      {
        "id": "38i",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 10,
          "y": 8
        }
      },
      {
        "id": "38j",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 4,
          "y": 9
        }
      },
      {
        "id": "38k",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 7,
          "y": 5
        }
      },
      {
        "id": "38l",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 13,
          "y": 1
        }
      },
      {
        "id": "38m",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 0,
          "y": 5
        }
      }
    ]
  },
  {
    "id": 30,
    "title": "Level 30",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 10,
      "rows": 9
    },
    "arrows": [
      {
        "id": "14a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "14b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "14c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 3
        }
      },
      {
        "id": "14d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "14e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "14f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 5
        }
      },
      {
        "id": "14g",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 7,
          "y": 8
        }
      }
    ]
  },
  {
    "id": 31,
    "title": "Level 31",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 13,
      "rows": 11
    },
    "arrows": [
      {
        "id": "24a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 8,
          "y": 0
        }
      },
      {
        "id": "24b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "24c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 3
        }
      },
      {
        "id": "24d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 11,
          "y": 7
        }
      },
      {
        "id": "24e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 5
        }
      },
      {
        "id": "24f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 5,
          "y": 4
        }
      },
      {
        "id": "24g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 8
        }
      },
      {
        "id": "24h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 8
        }
      },
      {
        "id": "24i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 10
        }
      },
      {
        "id": "24j",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 10,
          "y": 2
        }
      }
    ]
  },
  {
    "id": 32,
    "title": "Level 32",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 14,
      "rows": 12
    },
    "arrows": [
      {
        "id": "39a",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 8
        }
      },
      {
        "id": "39b",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 9,
          "y": 4
        }
      },
      {
        "id": "39c",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 8,
          "y": 5
        }
      },
      {
        "id": "39d",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 0,
          "y": 7
        }
      },
      {
        "id": "39e",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 6,
          "y": 2
        }
      },
      {
        "id": "39f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 0,
          "y": 0
        }
      },
      {
        "id": "39g",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 13,
          "y": 3
        }
      },
      {
        "id": "39h",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 3
        }
      },
      {
        "id": "39i",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 13,
          "y": 10
        }
      },
      {
        "id": "39j",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 3
        }
      },
      {
        "id": "39k",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 6,
          "y": 8
        }
      },
      {
        "id": "39l",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 10,
          "y": 8
        }
      },
      {
        "id": "39m",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 7
        }
      },
      {
        "id": "39n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 11,
          "y": 0
        }
      }
    ]
  },
  {
    "id": 33,
    "title": "Level 33",
    "difficulty": "Medium",
    "gridSize": {
      "columns": 10,
      "rows": 9
    },
    "arrows": [
      {
        "id": "15a",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "15b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 0
        }
      },
      {
        "id": "15c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 5
        }
      },
      {
        "id": "15d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "15e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "15f",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "15g",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 8
        }
      }
    ]
  },
  {
    "id": 34,
    "title": "Level 34",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 13,
      "rows": 12
    },
    "arrows": [
      {
        "id": "25a",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 1,
          "y": 2
        }
      },
      {
        "id": "25b",
        "direction": "RIGHT",
        "length": 5,
        "position": {
          "x": 7,
          "y": 0
        }
      },
      {
        "id": "25c",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 4,
          "y": 2
        }
      },
      {
        "id": "25d",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 5
        }
      },
      {
        "id": "25e",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 11,
          "y": 9
        }
      },
      {
        "id": "25f",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "25g",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "25h",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 10
        }
      },
      {
        "id": "25i",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 9
        }
      },
      {
        "id": "25j",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 11
        }
      }
    ]
  },
  {
    "id": 35,
    "title": "Level 35",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 15,
      "rows": 13
    },
    "arrows": [
      {
        "id": "40a",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 12
        }
      },
      {
        "id": "40b",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 14,
          "y": 1
        }
      },
      {
        "id": "40c",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 12
        }
      },
      {
        "id": "40d",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 9
        }
      },
      {
        "id": "40e",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 7,
          "y": 7
        }
      },
      {
        "id": "40f",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 6,
          "y": 3
        }
      },
      {
        "id": "40g",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 12
        }
      },
      {
        "id": "40h",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 1
        }
      },
      {
        "id": "40i",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 1,
          "y": 5
        }
      },
      {
        "id": "40j",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 12,
          "y": 6
        }
      },
      {
        "id": "40k",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 11,
          "y": 10
        }
      },
      {
        "id": "40l",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 10,
          "y": 6
        }
      },
      {
        "id": "40m",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "40n",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 5,
          "y": 7
        }
      }
    ]
  },
  {
    "id": 36,
    "title": "Level 36",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 14,
      "rows": 12
    },
    "arrows": [
      {
        "id": "26a",
        "direction": "RIGHT",
        "length": 5,
        "position": {
          "x": 8,
          "y": 0
        }
      },
      {
        "id": "26b",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "26c",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 9,
          "y": 4
        }
      },
      {
        "id": "26d",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 12,
          "y": 8
        }
      },
      {
        "id": "26e",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "26f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 6,
          "y": 5
        }
      },
      {
        "id": "26g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 8
        }
      },
      {
        "id": "26h",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 4,
          "y": 8
        }
      },
      {
        "id": "26i",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 8,
          "y": 10
        }
      },
      {
        "id": "26j",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 10,
          "y": 2
        }
      },
      {
        "id": "26k",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 11
        }
      },
      {
        "id": "26l",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 10
        }
      }
    ]
  },
  {
    "id": 37,
    "title": "Level 37",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 15,
      "rows": 13
    },
    "arrows": [
      {
        "id": "41a",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 6
        }
      },
      {
        "id": "41b",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 4,
          "y": 2
        }
      },
      {
        "id": "41c",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "41d",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 11,
          "y": 1
        }
      },
      {
        "id": "41e",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 7,
          "y": 10
        }
      },
      {
        "id": "41f",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 9
        }
      },
      {
        "id": "41g",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 12,
          "y": 11
        }
      },
      {
        "id": "41h",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 2,
          "y": 4
        }
      },
      {
        "id": "41i",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 8
        }
      },
      {
        "id": "41j",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 5
        }
      },
      {
        "id": "41k",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 3
        }
      },
      {
        "id": "41l",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 10
        }
      },
      {
        "id": "41m",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 8
        }
      },
      {
        "id": "41n",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 4,
          "y": 10
        }
      },
      {
        "id": "41o",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 0,
          "y": 12
        }
      }
    ]
  },
  {
    "id": 38,
    "title": "Level 38",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 15,
      "rows": 13
    },
    "arrows": [
      {
        "id": "27a",
        "direction": "RIGHT",
        "length": 5,
        "position": {
          "x": 9,
          "y": 0
        }
      },
      {
        "id": "27b",
        "direction": "DOWN",
        "length": 5,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "27c",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 10,
          "y": 5
        }
      },
      {
        "id": "27d",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 13,
          "y": 9
        }
      },
      {
        "id": "27e",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 0,
          "y": 7
        }
      },
      {
        "id": "27f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "27g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 8,
          "y": 9
        }
      },
      {
        "id": "27h",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "27i",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 11
        }
      },
      {
        "id": "27j",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 11,
          "y": 3
        }
      },
      {
        "id": "27k",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 12
        }
      },
      {
        "id": "27l",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 11
        }
      },
      {
        "id": "27m",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "27n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 7
        }
      }
    ]
  },
  {
    "id": 39,
    "title": "Level 39",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 15,
      "rows": 13
    },
    "arrows": [
      {
        "id": "42a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 0
        }
      },
      {
        "id": "42b",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 1
        }
      },
      {
        "id": "42c",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 6
        }
      },
      {
        "id": "42d",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 11
        }
      },
      {
        "id": "42e",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 10,
          "y": 9
        }
      },
      {
        "id": "42f",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 10
        }
      },
      {
        "id": "42g",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "42h",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 5,
          "y": 7
        }
      },
      {
        "id": "42i",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 10,
          "y": 5
        }
      },
      {
        "id": "42j",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 3,
          "y": 5
        }
      },
      {
        "id": "42k",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 0
        }
      },
      {
        "id": "42l",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "42m",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 10
        }
      },
      {
        "id": "42n",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 10,
          "y": 6
        }
      },
      {
        "id": "42o",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 0,
          "y": 2
        }
      }
    ]
  },
  {
    "id": 40,
    "title": "Level 40",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 15,
      "rows": 13
    },
    "arrows": [
      {
        "id": "28a",
        "direction": "RIGHT",
        "length": 5,
        "position": {
          "x": 9,
          "y": 0
        }
      },
      {
        "id": "28b",
        "direction": "DOWN",
        "length": 5,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "28c",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 10,
          "y": 5
        }
      },
      {
        "id": "28d",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 13,
          "y": 9
        }
      },
      {
        "id": "28e",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 0,
          "y": 8
        }
      },
      {
        "id": "28f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "28g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 9
        }
      },
      {
        "id": "28h",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "28i",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 12
        }
      },
      {
        "id": "28j",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 11,
          "y": 3
        }
      },
      {
        "id": "28k",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 12
        }
      },
      {
        "id": "28l",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 11
        }
      },
      {
        "id": "28m",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "28n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 7
        }
      },
      {
        "id": "28o",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 4
        }
      }
    ]
  },
  {
    "id": 41,
    "title": "Level 41",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 16,
      "rows": 14
    },
    "arrows": [
      {
        "id": "43a",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 8
        }
      },
      {
        "id": "43b",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 2,
          "y": 11
        }
      },
      {
        "id": "43c",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 9
        }
      },
      {
        "id": "43d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 0,
          "y": 3
        }
      },
      {
        "id": "43e",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 5
        }
      },
      {
        "id": "43f",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 12,
          "y": 2
        }
      },
      {
        "id": "43g",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 14,
          "y": 8
        }
      },
      {
        "id": "43h",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 11,
          "y": 9
        }
      },
      {
        "id": "43i",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 8,
          "y": 3
        }
      },
      {
        "id": "43j",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 6,
          "y": 11
        }
      },
      {
        "id": "43k",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 11,
          "y": 6
        }
      },
      {
        "id": "43l",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "43m",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 5
        }
      },
      {
        "id": "43n",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 4
        }
      },
      {
        "id": "43o",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 1,
          "y": 7
        }
      },
      {
        "id": "43p",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 4,
          "y": 6
        }
      }
    ]
  },
  {
    "id": 42,
    "title": "Level 42",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 15,
      "rows": 13
    },
    "arrows": [
      {
        "id": "29a",
        "direction": "RIGHT",
        "length": 5,
        "position": {
          "x": 9,
          "y": 0
        }
      },
      {
        "id": "29b",
        "direction": "DOWN",
        "length": 5,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "29c",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 10,
          "y": 5
        }
      },
      {
        "id": "29d",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 13,
          "y": 9
        }
      },
      {
        "id": "29e",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 0,
          "y": 8
        }
      },
      {
        "id": "29f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "29g",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 9
        }
      },
      {
        "id": "29h",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "29i",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 9,
          "y": 12
        }
      },
      {
        "id": "29j",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 11,
          "y": 3
        }
      },
      {
        "id": "29k",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 12
        }
      },
      {
        "id": "29l",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 11
        }
      },
      {
        "id": "29m",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 3
        }
      },
      {
        "id": "29n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 7
        }
      },
      {
        "id": "29o",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 4
        }
      },
      {
        "id": "29p",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "29q",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 11
        }
      }
    ]
  },
  {
    "id": 43,
    "title": "Level 43",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 16,
      "rows": 14
    },
    "arrows": [
      {
        "id": "44a",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 15,
          "y": 5
        }
      },
      {
        "id": "44b",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 4,
          "y": 3
        }
      },
      {
        "id": "44c",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 15,
          "y": 10
        }
      },
      {
        "id": "44d",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "44e",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 10
        }
      },
      {
        "id": "44f",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 4,
          "y": 13
        }
      },
      {
        "id": "44g",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 13,
          "y": 1
        }
      },
      {
        "id": "44h",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 12
        }
      },
      {
        "id": "44i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 2,
          "y": 4
        }
      },
      {
        "id": "44j",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 7,
          "y": 1
        }
      },
      {
        "id": "44k",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 8,
          "y": 4
        }
      },
      {
        "id": "44l",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 6,
          "y": 4
        }
      },
      {
        "id": "44m",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 14,
          "y": 5
        }
      },
      {
        "id": "44n",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 12,
          "y": 7
        }
      },
      {
        "id": "44o",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 12
        }
      },
      {
        "id": "44p",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 9,
          "y": 6
        }
      }
    ]
  },
  {
    "id": 44,
    "title": "Level 44",
    "difficulty": "Hard",
    "gridSize": {
      "columns": 16,
      "rows": 14
    },
    "arrows": [
      {
        "id": "30a",
        "direction": "RIGHT",
        "length": 6,
        "position": {
          "x": 9,
          "y": 0
        }
      },
      {
        "id": "30b",
        "direction": "DOWN",
        "length": 6,
        "position": {
          "x": 2,
          "y": 0
        }
      },
      {
        "id": "30c",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 11,
          "y": 6
        }
      },
      {
        "id": "30d",
        "direction": "UP",
        "length": 5,
        "position": {
          "x": 14,
          "y": 9
        }
      },
      {
        "id": "30e",
        "direction": "RIGHT",
        "length": 5,
        "position": {
          "x": 0,
          "y": 9
        }
      },
      {
        "id": "30f",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 7,
          "y": 6
        }
      },
      {
        "id": "30g",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 10,
          "y": 11
        }
      },
      {
        "id": "30h",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 5,
          "y": 11
        }
      },
      {
        "id": "30i",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 10,
          "y": 13
        }
      },
      {
        "id": "30j",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 12,
          "y": 3
        }
      },
      {
        "id": "30k",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 13
        }
      },
      {
        "id": "30l",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 1,
          "y": 12
        }
      },
      {
        "id": "30m",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 3
        }
      },
      {
        "id": "30n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 13,
          "y": 8
        }
      },
      {
        "id": "30o",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 9,
          "y": 10
        }
      },
      {
        "id": "30p",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 6,
          "y": 7
        }
      },
      {
        "id": "30q",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 13,
          "y": 12
        }
      },
      {
        "id": "30r",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 3,
          "y": 11
        }
      },
      {
        "id": "30s",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 8,
          "y": 4
        }
      },
      {
        "id": "30t",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 11,
          "y": 4
        }
      }
    ]
  },
  {
    "id": 45,
    "title": "Level 45",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 16,
      "rows": 14
    },
    "arrows": [
      {
        "id": "45a",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 13,
          "y": 2
        }
      },
      {
        "id": "45b",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 0,
          "y": 9
        }
      },
      {
        "id": "45c",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 11,
          "y": 11
        }
      },
      {
        "id": "45d",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 14,
          "y": 4
        }
      },
      {
        "id": "45e",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 15,
          "y": 8
        }
      },
      {
        "id": "45f",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 13,
          "y": 12
        }
      },
      {
        "id": "45g",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 13
        }
      },
      {
        "id": "45h",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 12
        }
      },
      {
        "id": "45i",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 0,
          "y": 3
        }
      },
      {
        "id": "45j",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 11,
          "y": 10
        }
      },
      {
        "id": "45k",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 5,
          "y": 2
        }
      },
      {
        "id": "45l",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 14,
          "y": 1
        }
      },
      {
        "id": "45m",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 12
        }
      },
      {
        "id": "45n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "45o",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 12,
          "y": 6
        }
      },
      {
        "id": "45p",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 10,
          "y": 11
        }
      },
      {
        "id": "45q",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 9,
          "y": 11
        }
      }
    ]
  },
  {
    "id": 46,
    "title": "Level 46",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 17,
      "rows": 15
    },
    "arrows": [
      {
        "id": "46a",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 4,
          "y": 2
        }
      },
      {
        "id": "46b",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 6,
          "y": 12
        }
      },
      {
        "id": "46c",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 12,
          "y": 6
        }
      },
      {
        "id": "46d",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 12,
          "y": 2
        }
      },
      {
        "id": "46e",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 0,
          "y": 7
        }
      },
      {
        "id": "46f",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 14
        }
      },
      {
        "id": "46g",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 11,
          "y": 10
        }
      },
      {
        "id": "46h",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 10,
          "y": 10
        }
      },
      {
        "id": "46i",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 10
        }
      },
      {
        "id": "46j",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 16,
          "y": 5
        }
      },
      {
        "id": "46k",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 2,
          "y": 1
        }
      },
      {
        "id": "46l",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 6,
          "y": 13
        }
      },
      {
        "id": "46m",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 13,
          "y": 10
        }
      },
      {
        "id": "46n",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 11
        }
      },
      {
        "id": "46o",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 14,
          "y": 8
        }
      },
      {
        "id": "46p",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 8,
          "y": 6
        }
      },
      {
        "id": "46q",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 7,
          "y": 11
        }
      }
    ]
  },
  {
    "id": 47,
    "title": "Level 47",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 17,
      "rows": 15
    },
    "arrows": [
      {
        "id": "47a",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 4
        }
      },
      {
        "id": "47b",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 11,
          "y": 6
        }
      },
      {
        "id": "47c",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 6,
          "y": 12
        }
      },
      {
        "id": "47d",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 4,
          "y": 4
        }
      },
      {
        "id": "47e",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 14,
          "y": 0
        }
      },
      {
        "id": "47f",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 7,
          "y": 3
        }
      },
      {
        "id": "47g",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 1
        }
      },
      {
        "id": "47h",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 13
        }
      },
      {
        "id": "47i",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 3,
          "y": 10
        }
      },
      {
        "id": "47j",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 14,
          "y": 11
        }
      },
      {
        "id": "47k",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 6
        }
      },
      {
        "id": "47l",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 6
        }
      },
      {
        "id": "47m",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 9,
          "y": 11
        }
      },
      {
        "id": "47n",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 0
        }
      },
      {
        "id": "47o",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 11,
          "y": 5
        }
      },
      {
        "id": "47p",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 14
        }
      },
      {
        "id": "47q",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 15,
          "y": 2
        }
      },
      {
        "id": "47r",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 1
        }
      }
    ]
  },
  {
    "id": 48,
    "title": "Level 48",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 17,
      "rows": 15
    },
    "arrows": [
      {
        "id": "48a",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 16,
          "y": 6
        }
      },
      {
        "id": "48b",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 3,
          "y": 12
        }
      },
      {
        "id": "48c",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 7,
          "y": 13
        }
      },
      {
        "id": "48d",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 10,
          "y": 7
        }
      },
      {
        "id": "48e",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 10,
          "y": 3
        }
      },
      {
        "id": "48f",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 0,
          "y": 6
        }
      },
      {
        "id": "48g",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 13
        }
      },
      {
        "id": "48h",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 5,
          "y": 2
        }
      },
      {
        "id": "48i",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 6,
          "y": 6
        }
      },
      {
        "id": "48j",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 6,
          "y": 4
        }
      },
      {
        "id": "48k",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 5
        }
      },
      {
        "id": "48l",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 3
        }
      },
      {
        "id": "48m",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 13,
          "y": 4
        }
      },
      {
        "id": "48n",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 1,
          "y": 8
        }
      },
      {
        "id": "48o",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 7,
          "y": 9
        }
      },
      {
        "id": "48p",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 0,
          "y": 14
        }
      },
      {
        "id": "48q",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 13,
          "y": 11
        }
      },
      {
        "id": "48r",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 11,
          "y": 4
        }
      }
    ]
  },
  {
    "id": 49,
    "title": "Level 49",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 18,
      "rows": 16
    },
    "arrows": [
      {
        "id": "49a",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 4,
          "y": 1
        }
      },
      {
        "id": "49b",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 14,
          "y": 4
        }
      },
      {
        "id": "49c",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 11,
          "y": 1
        }
      },
      {
        "id": "49d",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 2,
          "y": 5
        }
      },
      {
        "id": "49e",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 2,
          "y": 13
        }
      },
      {
        "id": "49f",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 10,
          "y": 0
        }
      },
      {
        "id": "49g",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 17,
          "y": 6
        }
      },
      {
        "id": "49h",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 12,
          "y": 10
        }
      },
      {
        "id": "49i",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 8,
          "y": 5
        }
      },
      {
        "id": "49j",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 6,
          "y": 5
        }
      },
      {
        "id": "49k",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 14,
          "y": 5
        }
      },
      {
        "id": "49l",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 3,
          "y": 10
        }
      },
      {
        "id": "49m",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 10,
          "y": 6
        }
      },
      {
        "id": "49n",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 14,
          "y": 11
        }
      },
      {
        "id": "49o",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 17,
          "y": 11
        }
      },
      {
        "id": "49p",
        "direction": "RIGHT",
        "length": 4,
        "position": {
          "x": 9,
          "y": 9
        }
      },
      {
        "id": "49q",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "49r",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 8,
          "y": 0
        }
      },
      {
        "id": "49s",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 2,
          "y": 11
        }
      }
    ]
  },
  {
    "id": 50,
    "title": "Level 50",
    "difficulty": "Expert",
    "gridSize": {
      "columns": 18,
      "rows": 16
    },
    "arrows": [
      {
        "id": "50a",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 5,
          "y": 9
        }
      },
      {
        "id": "50b",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 10,
          "y": 9
        }
      },
      {
        "id": "50c",
        "direction": "UP",
        "length": 2,
        "position": {
          "x": 16,
          "y": 7
        }
      },
      {
        "id": "50d",
        "direction": "RIGHT",
        "length": 3,
        "position": {
          "x": 11,
          "y": 15
        }
      },
      {
        "id": "50e",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 12,
          "y": 14
        }
      },
      {
        "id": "50f",
        "direction": "LEFT",
        "length": 4,
        "position": {
          "x": 16,
          "y": 3
        }
      },
      {
        "id": "50g",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 13,
          "y": 5
        }
      },
      {
        "id": "50h",
        "direction": "UP",
        "length": 4,
        "position": {
          "x": 11,
          "y": 11
        }
      },
      {
        "id": "50i",
        "direction": "RIGHT",
        "length": 2,
        "position": {
          "x": 16,
          "y": 8
        }
      },
      {
        "id": "50j",
        "direction": "DOWN",
        "length": 4,
        "position": {
          "x": 2,
          "y": 9
        }
      },
      {
        "id": "50k",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 7,
          "y": 3
        }
      },
      {
        "id": "50l",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 4,
          "y": 12
        }
      },
      {
        "id": "50m",
        "direction": "DOWN",
        "length": 2,
        "position": {
          "x": 12,
          "y": 7
        }
      },
      {
        "id": "50n",
        "direction": "UP",
        "length": 3,
        "position": {
          "x": 1,
          "y": 5
        }
      },
      {
        "id": "50o",
        "direction": "LEFT",
        "length": 2,
        "position": {
          "x": 14,
          "y": 4
        }
      },
      {
        "id": "50p",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 4,
          "y": 6
        }
      },
      {
        "id": "50q",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 5,
          "y": 15
        }
      },
      {
        "id": "50r",
        "direction": "DOWN",
        "length": 3,
        "position": {
          "x": 13,
          "y": 11
        }
      },
      {
        "id": "50s",
        "direction": "LEFT",
        "length": 3,
        "position": {
          "x": 6,
          "y": 7
        }
      }
    ]
  }
];

export function getLevel(id: number): LevelDefinition {
  const level = levels.find((l) => l.id === id);
  if (!level) throw new Error(`Level ${id} not found`);
  return level;
}

export function getTotalLevels(): number {
  return levels.length;
}

export function getNextLevelId(currentId: number): number {
  return currentId < levels.length ? currentId + 1 : currentId;
}
