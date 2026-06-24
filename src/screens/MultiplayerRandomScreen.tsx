import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  unstable_batchedUpdates,
  useWindowDimensions,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { ExitConfirmModal } from '../components/ExitConfirmModal';
import { LivesIndicator } from '../components/LivesIndicator';
import { findArrowAtPoint, PuzzleBoardCanvas } from '../components/PuzzleBoardCanvas';
import { ZoomableBoardViewport } from '../components/ZoomableBoardViewport';

import { createInitialBoard, findBlockingArrow, resolveTap, isFrontClear } from '../game/engine';
import { calculateNextMoveDelay, recordMatchResult, shouldBotMissMove } from '../game/botEngine';
import { getRandomBotName } from '../game/botNames';
import type { ArrowNode, BoardState, LevelDefinition } from '../game/types';
import { useGameStore } from '../state/gameStore';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { playCorrectFeedback, playWrongFeedback } from '../utils/feedback';

type MatchState = 'searching' | 'found' | 'playing' | 'results';

const SEARCHING_MESSAGES = [
  'Looking for opponents...',
  'Matching skill levels...',
  'Almost there...',
  'Scanning arenas...',
  'Finding a worthy rival...',
];

export function MultiplayerRandomScreen() {
  const navigation = useNavigation<AppNavigation>();
  const { width, height } = useWindowDimensions();
  const dynamicLevels = useGameStore((s) => s.dynamicLevels);

  // ─── Matchmaking State ───────────────────────────────────────────
  const [matchState, setMatchState] = useState<MatchState>('searching');
  const [opponent, setOpponent] = useState<{ name: string } | null>(null);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [playerName, setPlayerName] = useState('You');
  const [userResigned, setUserResigned] = useState(false);
  const [rematchRequestedByMe, setRematchRequestedByMe] = useState(false);
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'waiting' | 'accepted' | 'declined'>('idle');
  const [dbLevels, setDbLevels] = useState<LevelDefinition[]>([]);
  const [rematchTimerVal, setRematchTimerVal] = useState<number | null>(null);

  useEffect(() => {
    const loadProfileName = async () => {
      try {
        const name = await AsyncStorage.getItem('user_profile_name');
        if (name) setPlayerName(name);
      } catch (e) {
        console.warn(e);
      }
    };
    
    const loadDbLevels = async () => {
      try {
        let savedUrl = await AsyncStorage.getItem('multiplayer_url');
        let baseUrl = savedUrl?.trim() || 'https://arrow-game-be.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }
        
        console.log('📡 Fetching complete levels list from DB config...');
        const response = await fetch(`${baseUrl}/api/config`);
        if (response.ok) {
          const resData = await response.json();
          if (resData && Array.isArray(resData.levels) && resData.levels.length > 0) {
            setDbLevels(resData.levels);
            console.log(`✅ Loaded ${resData.levels.length} levels from DB config for Multiplayer Random.`);
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to load DB levels for random play:', e);
      }
    };

    void loadProfileName();
    void loadDbLevels();
  }, []);

  // ─── Game State ──────────────────────────────────────────────────
  const [level, setLevel] = useState<LevelDefinition | null>(null);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [exitingArrows, setExitingArrows] = useState<ArrowNode[]>([]);
  const [blockedArrows, setBlockedArrows] = useState<{ arrow: ArrowNode; blocker: ArrowNode | null }[]>([]);
  const [lastTap, setLastTap] = useState<{ x: number; y: number; timestamp: number } | undefined>(undefined);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [opponentArrowsLeft, setOpponentArrowsLeft] = useState(0);
  const [totalArrows, setTotalArrows] = useState(0);
  // ─── Animated Values (ALL declared unconditionally at top level) ──
  const boardScale = useSharedValue(1);
  const boardOpacity = useSharedValue(1);
  // Searching animations
  const pulse1Scale = useSharedValue(1);
  const pulse1Opacity = useSharedValue(0.8);
  const pulse2Scale = useSharedValue(1);
  const pulse2Opacity = useSharedValue(0.8);
  // Match-found pop
  const matchFoundScale = useSharedValue(0);
  const matchFoundOpacity = useSharedValue(0);
  // Score pop animation
  const myScaleAnim = useSharedValue(1);
  const oppScaleAnim = useSharedValue(1);

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
    opacity: boardOpacity.value,
    overflow: 'visible',
  }));
  const p1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1Scale.value }],
    opacity: pulse1Opacity.value,
  }));
  const p2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2Scale.value }],
    opacity: pulse2Opacity.value,
  }));
  const matchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: matchFoundScale.value }],
    opacity: matchFoundOpacity.value,
  }));
  const myScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: myScaleAnim.value }],
  }));
  const oppScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: oppScaleAnim.value }],
  }));

  // ─── Bot logic refs ───────────────────────────────────────────────
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<BoardState | null>(board);
  const opponentArrowsLeftRef = useRef(opponentArrowsLeft);
  const levelRef = useRef<LevelDefinition | null>(level);
  const matchStateRef = useRef<MatchState>(matchState);
  const myScoreRef = useRef(myScore);
  const oppScoreRef = useRef(oppScore);
  const userWonRef = useRef(false);
  const [searchingMessage, setSearchingMessage] = useState(SEARCHING_MESSAGES[0]);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { opponentArrowsLeftRef.current = opponentArrowsLeft; }, [opponentArrowsLeft]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { matchStateRef.current = matchState; }, [matchState]);
  useEffect(() => { myScoreRef.current = myScore; }, [myScore]);
  useEffect(() => { oppScoreRef.current = oppScore; }, [oppScore]);

  // ─── Searching animations ─────────────────────────────────────────
  useEffect(() => {
    if (matchState !== 'searching') return;

    pulse1Scale.value = withRepeat(
      withTiming(2.8, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false
    );
    pulse1Opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false
    );
    pulse2Scale.value = withDelay(750, withRepeat(
      withTiming(2.8, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false
    ));
    pulse2Opacity.value = withDelay(750, withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false
    ));

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % SEARCHING_MESSAGES.length;
      setSearchingMessage(SEARCHING_MESSAGES[msgIndex]);
    }, 2000);

    const searchTime = Math.random() * 2000 + 1500;
    const searchTimer = setTimeout(() => {
      const name = getRandomBotName() ?? 'Opponent';
      setOpponent({ name });
      setMatchState('found');
    }, searchTime);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(searchTimer);
    };
  }, [matchState]);

  // ─── Match Found animation & start game ───────────────────────────
  useEffect(() => {
    if (matchState !== 'found') return;

    matchFoundScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    matchFoundOpacity.value = withTiming(1, { duration: 300 });

    const timer = setTimeout(() => startGame(), 1000);
    return () => clearTimeout(timer);
  }, [matchState]);

  const startGame = () => {
    const levelsToUse = dbLevels.length > 0 ? dbLevels : (dynamicLevels || []);
    if (levelsToUse.length === 0) {
      navigation.goBack();
      return;
    }
    const randLevel = levelsToUse[Math.floor(Math.random() * levelsToUse.length)];
    if (!randLevel) {
      navigation.goBack();
      return;
    }
    const initialBoard = createInitialBoard(randLevel, 3);
    const total = randLevel.arrows.length;

    unstable_batchedUpdates(() => {
      setLevel(randLevel);
      setBoard(initialBoard);
      setOpponentArrowsLeft(total);
      setTotalArrows(total);
      setMyScore(0);
      setOppScore(0);
      setExitingArrows([]);
      setBlockedArrows([]);
      userWonRef.current = false;
      setMatchState('playing');
    });

    boardRef.current = initialBoard;
    myScoreRef.current = 0;
    oppScoreRef.current = 0;
    opponentArrowsLeftRef.current = total;

    boardOpacity.value = 0;
    boardScale.value = 0.94;
    boardOpacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    boardScale.value = withSpring(1, { damping: 15, stiffness: 100, mass: 0.8 });
  };

  // ─── Bot game loop ────────────────────────────────────────────────
  const scheduleNextBotMove = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (matchStateRef.current !== 'playing' || !levelRef.current) return;

    const current = boardRef.current;
    if (!current || current.arrows.length === 0) return;

    const botArrows = opponentArrowsLeftRef.current;
    const total = levelRef.current.arrows.length;

    if (botArrows <= 0) return;

    const delay = calculateNextMoveDelay(
      opponentArrowsLeftRef.current,
      total - myScoreRef.current,
      total
    );

    botTimerRef.current = setTimeout(() => {
      if (matchStateRef.current !== 'playing') return;

      const liveBoard = boardRef.current;
      if (!liveBoard || !levelRef.current || liveBoard.arrows.length === 0) return;

      if (shouldBotMissMove()) {
        scheduleNextBotMove();
        return;
      }

      const clearArrows = liveBoard.arrows.filter((a) => isFrontClear(a, liveBoard));
      if (clearArrows.length === 0) {
        scheduleNextBotMove();
        return;
      }

      const pick = clearArrows[Math.floor(Math.random() * clearArrows.length)];
      if (!pick || !liveBoard.arrows.some((a) => a.id === pick.id)) {
        scheduleNextBotMove();
        return;
      }

      const result = resolveTap(pick.id, liveBoard);
      if (result.type !== 'REMOVED') {
        scheduleNextBotMove();
        return;
      }

      boardRef.current = result.board;

      unstable_batchedUpdates(() => {
        setExitingArrows((prev) => {
          if (prev.some((a) => a.id === pick.id)) return prev;
          return [...prev, { ...pick, color: '#2196F3' }];
        });
        setBoard(result.board);
      });

      const newOppLeft = Math.max(0, opponentArrowsLeftRef.current - 1);
      opponentArrowsLeftRef.current = newOppLeft;
      setOpponentArrowsLeft(newOppLeft);
      const newOppScore = (levelRef.current?.arrows.length ?? 0) - newOppLeft;
      oppScoreRef.current = newOppScore;
      setOppScore(newOppScore);
      oppScaleAnim.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );

      if (matchStateRef.current === 'playing') scheduleNextBotMove();
    }, delay);
  }, []);

  const handleGameOver = useCallback((userWon: boolean) => {
    if (matchStateRef.current !== 'playing') return;
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setMatchState('results');
    void recordMatchResult(userWon);
  }, []);

  useEffect(() => {
    if (matchState === 'playing') {
      scheduleNextBotMove();
    }
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [matchState, scheduleNextBotMove]);

  useEffect(() => {
    if (matchState !== 'playing') return;

    const boardComplete = board?.arrows.length === 0;
    const userOutOfLives = board?.livesLeft === 0;
    const animationsComplete = exitingArrows.length === 0;

    if (userOutOfLives) {
      handleGameOver(false);
    } else if (boardComplete && animationsComplete) {
      handleGameOver(myScoreRef.current > oppScoreRef.current);
    }
  }, [matchState, board?.arrows.length, board?.livesLeft, exitingArrows.length, handleGameOver]);

  const startRematch = useCallback(() => {
    const levelsToUse = dbLevels.length > 0 ? dbLevels : (dynamicLevels || []);
    if (levelsToUse.length === 0) {
      navigation.goBack();
      return;
    }
    const randLevel = levelsToUse[Math.floor(Math.random() * levelsToUse.length)];
    if (!randLevel) {
      navigation.goBack();
      return;
    }
    const initialBoard = createInitialBoard(randLevel, 3);
    const total = randLevel.arrows.length;

    unstable_batchedUpdates(() => {
      setLevel(randLevel);
      setBoard(initialBoard);
      setOpponentArrowsLeft(total);
      setTotalArrows(total);
      setMyScore(0);
      setOppScore(0);
      setExitingArrows([]);
      setBlockedArrows([]);
      setUserResigned(false);
      userWonRef.current = false;
      setMatchState('playing');
    });

    boardRef.current = initialBoard;
    myScoreRef.current = 0;
    oppScoreRef.current = 0;
    opponentArrowsLeftRef.current = total;

    boardOpacity.value = 0;
    boardScale.value = 0.94;
    boardOpacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    boardScale.value = withSpring(1, { damping: 15, stiffness: 100, mass: 0.8 });
  }, [dbLevels, dynamicLevels, navigation]);

  const handleRequestRematch = useCallback(() => {
    if (rematchRequestedByMe) return;

    setRematchRequestedByMe(true);
    setRematchStatus('waiting');

    const delay = Math.random() * 1000 + 1500;
    setTimeout(() => {
      const accepts = Math.random() < 0.65;
      if (accepts) {
        setRematchStatus('accepted');
        setTimeout(() => {
          setRematchRequestedByMe(false);
          setRematchStatus('idle');
          startRematch();
        }, 800);
      } else {
        setRematchStatus('declined');
        Alert.alert(
          'Rematch Request Declined',
          `${opponent?.name ?? 'Opponent'} has left the arena.`,
          [
            {
              text: 'Find New Match',
              onPress: () => {
                setRematchRequestedByMe(false);
                setRematchStatus('idle');
                setOpponent(null);
                setMatchState('searching');
              }
            }
          ]
        );
      }
    }, delay);
  }, [rematchRequestedByMe, opponent, startRematch]);

  const handleFindNewMatch = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setRematchRequestedByMe(false);
    setRematchStatus('idle');
    setOpponent(null);
    setMatchState('searching');
  }, []);

  useEffect(() => {
    if (matchState !== 'results') {
      setRematchTimerVal(null);
      return;
    }
    if (rematchRequestedByMe) {
      setRematchTimerVal(null);
      return;
    }

    setRematchTimerVal(5);

    const interval = setInterval(() => {
      setRematchTimerVal((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleFindNewMatch();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchState, rematchRequestedByMe, handleFindNewMatch]);

  // ─── Back Button ──────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // ─── Arrow interactions ───────────────────────────────────────────
  const handleArrowPress = useCallback((arrowId: string) => {
    if (matchStateRef.current !== 'playing') return;

    const currentBoard = boardRef.current;
    if (!currentBoard) return;

    const arrow = currentBoard.arrows.find((a) => a.id === arrowId);
    if (!arrow) return;

    const result = resolveTap(arrowId, currentBoard);

    if (result.type === 'REMOVED') {
      const nextBoard = result.board;
      boardRef.current = nextBoard;

      unstable_batchedUpdates(() => {
        setExitingArrows((prev) => {
          if (prev.some((a) => a.id === arrow.id)) return prev;
          return [...prev, { ...arrow, color: '#43A047' }];
        });
        setBoard(nextBoard);
      });

      setMyScore((prev) => {
        const next = prev + 1;
        myScoreRef.current = next;
        return next;
      });

      myScaleAnim.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );

      void playCorrectFeedback();
    } else if (result.type === 'BLOCKED') {
      const blocker = findBlockingArrow(arrow, currentBoard) ?? null;
      setBlockedArrows((prev) => {
        if (prev.some((b) => b.arrow.id === arrow.id)) return prev;
        return [...prev, { arrow, blocker }];
      });
      const nextBoard = result.board;
      boardRef.current = nextBoard;
      setBoard(nextBoard);
      void playWrongFeedback(true);
    }
  }, []);

  // ─── Board size calculation (matches MultiplayerFriendsScreen exactly) ──
  const currentBoard = board;
  const maxW = width * 0.92;
  const maxH = height * 0.52;

  const columns = currentBoard?.level.gridSize.columns ?? 5;
  const rows = currentBoard?.level.gridSize.rows ?? 5;
  const referenceCols = Math.min(columns, 10);
  const referenceRows = Math.min(rows, 10);
  const sizeFromWidth = maxW / referenceCols;
  const sizeFromHeight = maxH / referenceRows;
  const cellSize = Math.min(sizeFromWidth, sizeFromHeight, 52);
  const boardWidth = cellSize * columns;
  const boardHeight = cellSize * rows;

  // Keep a ref to the latest cellSize so handleBoardPress always has it.
  const cellSizeRef = useRef(cellSize);
  useEffect(() => { cellSizeRef.current = cellSize; }, [cellSize]);

  const handleBoardPress = useCallback((x: number, y: number) => {
    setLastTap({ x, y, timestamp: Date.now() });
    const currentBoard = boardRef.current;
    if (!currentBoard) return;
    const arrow = findArrowAtPoint(currentBoard.arrows, x, y, cellSizeRef.current);
    if (arrow) handleArrowPress(arrow.id);
  }, [handleArrowPress]);

  const handleExitDone = useCallback((arrowId: string) => {
    setExitingArrows((prev) => prev.filter((a) => a.id !== arrowId));
  }, []);

  const handleBlockedDone = useCallback((arrowId: string) => {
    setBlockedArrows((prev) => prev.filter((b) => b.arrow.id !== arrowId));
  }, []);



  const isLeading = myScore > oppScore;
  const isTrailing = myScore < oppScore;
  let statusText = 'Clear as many arrows as you can! ⚡';
  if (isLeading) statusText = 'You are leading! Keep it up! 👑';
  else if (isTrailing) statusText = `${opponent?.name ?? 'Opponent'} is leading! Hurry up! 🔥`;
  else if (myScore > 0 || oppScore > 0) statusText = 'Tie match! Race to the finish! 🤝';

  const remainingCount = currentBoard?.arrows.length ?? 0;

  const renderResults = () => {
    const userLostAllLives = board ? board.livesLeft <= 0 : false;
    const isMeWinner = !userResigned && !userLostAllLives && myScore > oppScore;
    const isDraw = !userResigned && !userLostAllLives && myScore === oppScore;
    const heroIcon = isDraw ? '🤝' : isMeWinner ? '🏆' : '💀';
    const heroColor = isDraw ? '#806F5D' : isMeWinner ? '#C9A227' : '#A0522D';

    let titleText: string;
    let subtitleText: string;

    if (isDraw) {
      titleText = 'DRAW MATCH';
      subtitleText = `Equal performance! Both players cleared ${myScore} arrows.`;
    } else if (userResigned) {
      titleText = 'YOU RESIGNED';
      subtitleText = `${opponent?.name ?? 'Opponent'} wins by default.`;
    } else if (isMeWinner) {
      titleText = 'YOU WON!';
      if (opponentArrowsLeft === 0) {
        subtitleText = `You removed more arrows (${myScore} vs ${oppScore})!`;
      } else {
        subtitleText = `Victory is yours!`;
      }
    } else {
      titleText = 'YOU LOST';
      if (board && board.livesLeft <= 0) {
        subtitleText = `You lost all 3 lives! ${opponent?.name ?? 'Opponent'} wins.`;
      } else {
        subtitleText = `${opponent?.name ?? 'Opponent'} removed more arrows (${oppScore} vs ${myScore}).`;
      }
    }

    const resultsList = [
      {
        name: playerName,
        isMe: true,
        score: myScore,
        status: userResigned ? 'abandoned' : (board && board.livesLeft <= 0 ? 'failed_lives' : 'completed'),
        isWinner: isMeWinner && !isDraw,
      },
      {
        name: opponent?.name ?? 'Opponent',
        isMe: false,
        score: oppScore,
        status: opponentArrowsLeft === 0 ? 'completed' : 'playing',
        isWinner: !isMeWinner && !isDraw && !userResigned,
      }
    ];

    resultsList.sort((a, b) => (b.isWinner ? 1 : 0) - (a.isWinner ? 1 : 0));

    return (
      <View style={styles.resultsContainer}>
        <View style={[styles.resultsCard, isMeWinner && !isDraw && styles.resultsCardWinner]}>
          <View style={[styles.resultsAccentBar, { backgroundColor: heroColor }]} />
          <View style={[styles.heroIconWrap, { backgroundColor: heroColor + '18', borderColor: heroColor + '30' }]}>
            <Text style={styles.heroIcon}>{heroIcon}</Text>
          </View>
          <Text style={[styles.winTitle, { color: heroColor }]}>{titleText}</Text>
          <Text style={styles.winSub}>{subtitleText}</Text>
          <View style={styles.resultsDivider} />
          {resultsList.map((result, index) => {
            return (
              <View
                key={`result-${index}-${result.isMe ? 'me' : 'opp'}`}
                style={[
                  styles.playerResultRow,
                  result.isMe && styles.playerResultRowMe
                ]}
              >
                <View style={[styles.playerResultMedal, { backgroundColor: result.isWinner ? '#FFF8E1' : '#F6F1E8' }]}>
                  <Text style={styles.playerResultMedalText}>
                    {result.isWinner ? '🏆' : result.isMe ? '🎮' : '⚔️'}
                  </Text>
                </View>
                <View style={styles.playerResultInfo}>
                  <Text style={[styles.playerResultName, result.isMe && styles.playerResultNameMe]} numberOfLines={1}>
                    {result.name}
                  </Text>
                  {result.isMe && (
                    <Text style={styles.playerResultYouTag}>YOU</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: result.status === 'failed_lives' 
                    ? '#FFEBEE' 
                    : (result.isWinner ? '#FFF9C4' : '#E8F5E9') 
                }]}>
                  <Text style={[styles.statusBadgeText, { 
                    color: result.status === 'failed_lives' 
                       ? '#C62828' 
                       : (result.isWinner ? '#F57F17' : '#2E7D32') 
                  }]}>
                    {result.status === 'abandoned' 
                      ? 'Resigned' 
                      : result.status === 'failed_lives' 
                      ? 'Out of Lives' 
                      : `${result.score} arrows`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.rematchCard}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.rematchBtn,
              rematchRequestedByMe ? styles.rematchBtnWaiting : styles.rematchBtnActive,
              pressed && styles.btnPressed
            ]}
            onPress={handleRequestRematch}
            disabled={rematchRequestedByMe}
          >
            <Text style={styles.rematchBtnText}>
              {rematchRequestedByMe
                ? rematchStatus === 'waiting'
                  ? '⏳ Waiting for opponent…'
                  : 'Sending…'
                : rematchTimerVal !== null
                ? `⚔️ Request Rematch (${rematchTimerVal}s)`
                : '⚔️ Request Rematch'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.findNewMatchBtn,
            pressed && styles.btnPressed
          ]}
          onPress={handleFindNewMatch}
        >
          <Text style={styles.findNewMatchBtnText}>🔄 Find New Match</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.resultsLeaveBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.resultsLeaveBtnText}>← Exit Arena</Text>
        </Pressable>
      </View>
    );
  };

  // ─── Renders ──────────────────────────────────────────────────────

  if (matchState === 'searching') {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        {/* Back button */}
        <Pressable style={styles.topBackBtn} onPress={() => setExitModalVisible(true)}>
          <Text style={styles.topBackText}>‹</Text>
        </Pressable>

        <View style={styles.matchmakingContainer}>
          <Text style={styles.matchmakingTitle}>Finding Match</Text>
          <Text style={styles.matchmakingSub}>Searching for a player...</Text>

          <View style={styles.radarWrapper}>
            <Animated.View style={[styles.pulseCircle, p1Style]} />
            <Animated.View style={[styles.pulseCircle, p2Style]} />
            <View style={styles.radarCenter}>
              <Text style={styles.radarIcon}>📡</Text>
            </View>
          </View>

          <Text style={styles.searchingMessage}>{searchingMessage}</Text>
        </View>

        <ExitConfirmModal
          visible={exitModalVisible}
          onClose={() => setExitModalVisible(false)}
          onConfirm={() => { setExitModalVisible(false); navigation.goBack(); }}
          title="Cancel Search"
          description="Are you sure you want to stop searching for a match?"
        />
      </SafeAreaView>
    );
  }

  if (matchState === 'found') {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        <View style={styles.matchmakingContainer}>
          <Animated.View style={[styles.matchFoundCard, matchStyle]}>
            <Text style={styles.matchFoundTitle}>MATCH FOUND!</Text>
            <Text style={styles.opponentAvatar}>👤</Text>
            <Text style={styles.opponentName}>{opponent?.name}</Text>

            <Text style={styles.matchFoundSub}>Get ready to play...</Text>
          </Animated.View>
        </View>

        <ExitConfirmModal
          visible={exitModalVisible}
          onClose={() => setExitModalVisible(false)}
          onConfirm={() => { setExitModalVisible(false); navigation.goBack(); }}
          title="Leave Match"
          description="Are you sure you want to leave?"
        />
      </SafeAreaView>
    );
  }

  if (matchState === 'playing' && currentBoard && level) {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />

        {/* ── Scoreboard Header (same as MultiplayerFriendsScreen) ── */}
        <View style={styles.scoreboardContainer}>
          {/* Me */}
          <View style={[styles.scoreCard, isLeading && styles.scoreCardActive]}>
            <Text style={styles.scorePlayerName} numberOfLines={1}>
              {playerName} {isLeading && '👑'}
            </Text>
            <Animated.Text style={[styles.scoreNumber, myScoreStyle]}>{myScore}</Animated.Text>
            {isLeading && <Text style={styles.scoreActiveDot}>LEADING</Text>}
          </View>

          {/* Center */}
          <View style={styles.scoreCenterColumn}>
            <View style={styles.vsBadgeContainer}>
              <Text style={styles.vsBadgeText}>VS</Text>
            </View>
            <Text style={styles.scoreRemainingText}>{remainingCount} left</Text>
          </View>

          {/* Opponent */}
          <View style={[styles.scoreCard, isTrailing && styles.scoreCardActiveOpponent]}>
            <Text style={[styles.scorePlayerName, { textAlign: 'right' }]} numberOfLines={1}>
              {isTrailing && '👑 '}{opponent?.name ?? 'Opponent'}
            </Text>
            <Animated.Text style={[styles.scoreNumber, { textAlign: 'right' }, oppScoreStyle]}>{oppScore}</Animated.Text>
            {isTrailing && <Text style={styles.scoreActiveDotOpponent}>LEADING</Text>}
          </View>
        </View>

        {/* ── Status Prompt Bar ── */}
        <View style={[
          styles.turnPromptBar,
          isLeading ? styles.turnPromptBarActive : isTrailing ? styles.turnPromptBarTrailing : styles.turnPromptBarWaiting
        ]}>
          <Text
            style={[
              styles.turnPromptText,
              isLeading ? styles.turnPromptTextActive : isTrailing ? styles.turnPromptTextTrailing : styles.turnPromptTextWaiting
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {statusText}
          </Text>
        </View>

        {/* Lives */}
        <LivesIndicator livesLeft={currentBoard.livesLeft} />

        {/* ── Board ── */}
        <View style={styles.boardStage}>
          <ZoomableBoardViewport
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            onBoardPress={handleBoardPress}
          >
            <Animated.View style={animatedBoardStyle}>
              <PuzzleBoardCanvas
              board={currentBoard}
              exitingArrows={exitingArrows}
              blockedArrows={blockedArrows}
              width={boardWidth}
              enableTouch={false}
              onArrowPress={handleArrowPress}
              onExitDone={handleExitDone}
              onBlockedDone={handleBlockedDone}
              lastTap={lastTap}
            />
            </Animated.View>
          </ZoomableBoardViewport>
        </View>

        {/* ── Battle Controls ── */}
        <View style={styles.battleControls}>
          <Pressable
            style={[styles.controlBtn, styles.controlLeaveBtn]}
            onPress={() => setExitModalVisible(true)}
          >
            <Text style={[styles.controlBtnText, styles.controlLeaveText]}>🏳️ Resign</Text>
          </Pressable>
        </View>

        <ExitConfirmModal
          visible={exitModalVisible}
          onClose={() => setExitModalVisible(false)}
          onConfirm={() => {
            setExitModalVisible(false);
            if (botTimerRef.current) clearTimeout(botTimerRef.current);
            setUserResigned(true);
            handleGameOver(false);
          }}
          title="Forfeit Match"
          description="Are you sure you want to resign? You will lose this match."
        />
      </SafeAreaView>
    );
  }

  if (matchState === 'results') {
    return (
      <SafeAreaView style={styles.screen}>
        <AmbientBackground />
        <View style={styles.lobbyHeader}>
          <Text style={styles.lobbyTitle}>⚔️ Arena Lobby</Text>
        </View>
        {renderResults()}
      </SafeAreaView>
    );
  }

  // fallback during transition to results
  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBackBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBackText: {
    fontSize: 50,
    fontWeight: '300',
    color: theme.colors.textMuted,
    lineHeight: 50,
  },

  // ─── Matchmaking ──────────────────────────────────────────────────
  matchmakingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  matchmakingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 6,
  },
  matchmakingSub: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 48,
  },
  radarWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  radarCenter: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  radarIcon: {
    fontSize: 32,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.arrowStroke,
    zIndex: 1,
  },
  searchingMessage: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 8,
  },

  // ─── Match Found ──────────────────────────────────────────────────
  matchFoundCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    ...theme.shadows.lg,
  },
  matchFoundTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#43A047',
    marginBottom: 16,
    letterSpacing: 1,
  },
  opponentAvatar: {
    fontSize: 56,
    marginBottom: 8,
  },
  opponentName: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginBottom: 12,
  },

  statBadge: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.arrowStroke,
  },
  streakBadge: {
    backgroundColor: '#FFECB3',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
  },
  matchFoundSub: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },

  // ─── Game UI (mirrors MultiplayerFriendsScreen exactly) ───────────
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    height: 96,
    backgroundColor: '#FFF',
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  scoreCardActive: {
    borderColor: '#FFD54F',
    backgroundColor: '#FFFDE7',
    ...theme.shadows.md,
  },
  scoreCardActiveOpponent: {
    borderColor: '#FFD54F',
    backgroundColor: '#FFFDE7',
    ...theme.shadows.md,
  },
  scorePlayerName: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginTop: 4,
  },
  scoreActiveDot: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFB300',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scoreActiveDotOpponent: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFB300',
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  scoreCenterColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  vsBadgeContainer: {
    paddingHorizontal: 10,
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 12,
    marginHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  vsBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  scoreRemainingText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  turnPromptBar: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnPromptBarActive: {
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.25)',
  },
  turnPromptBarTrailing: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)',
  },
  turnPromptBarWaiting: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  turnPromptText: {
    fontSize: 14,
    fontWeight: '800',
  },
  turnPromptTextActive: { color: '#A0700A' },
  turnPromptTextTrailing: { color: '#D32F2F' },
  turnPromptTextWaiting: { color: theme.colors.textMuted },
  boardStage: {
    flex: 1,
    width: '100%',
    marginVertical: 6,
    overflow: 'visible',
  },
  battleControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  controlBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.pill,
    minWidth: 100,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.arrowStroke,
  },
  controlLeaveBtn: {
    borderColor: theme.colors.lifeRed,
    borderWidth: 1,
  },
  controlLeaveText: {
    color: theme.colors.lifeRed,
  },
  // Results UI
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  resultsCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(106, 68, 40, 0.12)',
    ...theme.shadows.lg,
  },
  resultsCardWinner: {
    borderColor: 'rgba(201, 162, 39, 0.4)',
  },
  resultsAccentBar: {
    width: '100%',
    height: 6,
    borderRadius: 0,
    marginBottom: 0,
  },
  heroIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 10,
    borderWidth: 2,
  },
  heroIcon: {
    fontSize: 46,
  },
  winTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  winSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 20,
  },
  resultsDivider: {
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(106, 68, 40, 0.1)',
    marginBottom: 16,
  },
  playerResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  playerResultRowMe: {
    backgroundColor: 'rgba(106, 68, 40, 0.05)',
    marginHorizontal: 12,
    width: undefined,
  },
  playerResultMedal: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerResultMedalText: {
    fontSize: 22,
  },
  playerResultInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerResultName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.black,
    flexShrink: 1,
  },
  playerResultNameMe: {
    color: theme.colors.arrowStroke,
    fontWeight: '900',
  },
  playerResultYouTag: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    backgroundColor: 'rgba(168, 100, 46, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rematchCard: {
    width: '100%',
    alignItems: 'center',
    marginTop: 22,
    gap: 10,
  },
  rematchTipBox: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  rematchTipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A0700A',
  },
  rematchBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  rematchBtnActive: {
    backgroundColor: theme.colors.arrowStroke,
  },
  rematchBtnWaiting: {
    backgroundColor: '#B0BEC5',
  },
  rematchBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  findNewMatchBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: theme.colors.arrowStroke,
    backgroundColor: 'transparent',
  },
  findNewMatchBtnText: {
    color: theme.colors.arrowStroke,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultsLeaveBtn: {
    marginTop: 14,
    padding: 12,
    alignItems: 'center',
  },
  resultsLeaveBtnText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  lobbyHeader: {
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    letterSpacing: 0.5
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }]
  },
});
