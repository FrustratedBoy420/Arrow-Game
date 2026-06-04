import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Pusher from 'pusher-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { AmbientBackground } from '../components/AmbientBackground';
import { LivesIndicator } from '../components/LivesIndicator';
import { findArrowAtPoint, PuzzleBoardCanvas } from '../components/PuzzleBoardCanvas';
import { ZoomableBoardViewport } from '../components/ZoomableBoardViewport';
import { createInitialBoard, findBlockingArrow, resolveTap } from '../game/engine';
import type { ArrowNode, BoardState, LevelDefinition } from '../game/types';
import { theme } from '../theme/theme';
import type { AppNavigation } from '../types/navigation';
import { playCorrectFeedback, playWrongFeedback } from '../utils/feedback';
import { registerUserProfile } from '../utils/userRegistration';

type MultiplayerStep = 'setup' | 'lobby' | 'game' | 'results';

function formatCompletionTime(timeMs: number | null | undefined): string {
  if (timeMs == null || timeMs < 0) return '-';
  const totalSec = Math.round(timeMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

function getElapsedMs(startedAt: number | null): number | null {
  if (startedAt == null) return null;
  return Math.max(0, Date.now() - startedAt);
}

interface ServerPlayer {
  name: string;
  status: 'playing' | 'won' | 'failed' | 'failed_lives' | 'abandoned';
  timeMs: number | null;
  arrowsLeft: number | null;
}

// Helpers for Shared Board Mode progress encoding/decoding
function encodeArrowsLeft(remainingCount: number, arrowId: string, originalArrows: any[]): number {
  const index = originalArrows.findIndex((a) => a.id === arrowId);
  if (index === -1) return remainingCount;
  return remainingCount + index / 1000;
}

function decodeArrowsLeft(arrowsLeft: number): { remainingCount: number; index: number } {
  const remainingCount = Math.floor(arrowsLeft);
  const fractional = arrowsLeft - remainingCount;
  const index = Math.round(fractional * 1000);
  return { remainingCount, index };
}

export function MultiplayerScreen() {
  const navigation = useNavigation<AppNavigation>();
  const route = useRoute<any>();
  const linkRoomCode = route.params?.roomCode;
  const { width, height } = useWindowDimensions();

  // Connection & Room state
  const [playerName, setPlayerName] = useState('');
  const [serverUrl, setServerUrl] = useState('https://arrow-game-backend.vercel.app/');
  const [pusherKey, setPusherKey] = useState('1d9ae595090f679858b4');
  const [roomCode, setRoomCode] = useState('');
  const [step, setStep] = useState<MultiplayerStep>('setup');
  const [connecting, setConnecting] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [readyStates, setReadyStates] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Game state
  const [level, setLevel] = useState<LevelDefinition | null>(null);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [exitingArrows, setExitingArrows] = useState<ArrowNode[]>([]);
  const [blockedArrows, setBlockedArrows] = useState<{ arrow: ArrowNode; blocker: ArrowNode | null }[]>([]);
  const [flashingArrows, setFlashingArrows] = useState<ArrowNode[]>([]);
  const [lastTap, setLastTap] = useState<{ x: number; y: number; timestamp: number } | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  
  // Live progress tracking
  const [opponentName, setOpponentName] = useState('');
  const [opponentArrowsLeft, setOpponentArrowsLeft] = useState<number>(0);
  const [myArrowsInitial, setMyArrowsInitial] = useState(0);
  const [myElapsedSec, setMyElapsedSec] = useState(0);
  const [localPlayerTimes, setLocalPlayerTimes] = useState<Record<string, number>>({});

  // Results state
  const [matchWinner, setMatchWinner] = useState('');
  const [matchResults, setMatchResults] = useState<ServerPlayer[]>([]);
  const [rematchStates, setRematchStates] = useState<Record<string, boolean>>({});
  const [requestingRematch, setRequestingRematch] = useState(false);

  // Shared Board state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [arrowOwners, setArrowOwners] = useState<Record<string, string>>({});
  const [confirmedClears, setConfirmedClears] = useState<Record<string, boolean>>({});

  const scoresRef = useRef(scores);
  const arrowOwnersRef = useRef(arrowOwners);
  const confirmedClearsRef = useRef(confirmedClears);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    arrowOwnersRef.current = arrowOwners;
  }, [arrowOwners]);

  useEffect(() => {
    confirmedClearsRef.current = confirmedClears;
  }, [confirmedClears]);

  const computeScores = useCallback((owners: Record<string, string>) => {
    const nextScores: Record<string, number> = {};
    playersRef.current.forEach((p) => {
      nextScores[p] = 0;
    });
    Object.values(owners).forEach((owner) => {
      const matchedPlayer = playersRef.current.find(
        (p) => p.toLowerCase() === owner.toLowerCase()
      );
      if (matchedPlayer) {
        nextScores[matchedPlayer] = (nextScores[matchedPlayer] || 0) + 1;
      }
    });
    return nextScores;
  }, []);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const boardScale = useSharedValue(1);
  const boardOpacity = useSharedValue(1);

  // Refs to avoid stale closures in event handlers
  const playerNameRef = useRef(playerName);
  const opponentNameRef = useRef(opponentName);
  const boardRef = useRef(board);
  const levelRef = useRef(level);
  const playersRef = useRef(players);
  const stepRef = useRef(step);
  const roomCodeRef = useRef(roomCode);
  const gameStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    opponentNameRef.current = opponentName;
  }, [opponentName]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (step !== 'game' || gameStartedAtRef.current == null) {
      return;
    }

    const tick = () => {
      const elapsed = getElapsedMs(gameStartedAtRef.current);
      if (elapsed != null) {
        setMyElapsedSec(Math.floor(elapsed / 1000));
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  const joinRoomWithDetails = async (
    nameVal: string,
    codeVal: string,
    urlVal: string,
    keyVal: string
  ) => {
    const trimmedName = nameVal.trim();
    const formattedCode = codeVal.trim().toUpperCase();
    const trimmedUrl = urlVal.trim();
    const trimmedKey = keyVal.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your name first.');
      return;
    }
    if (!formattedCode) {
      Alert.alert('Code Required', 'Please enter a 4-letter room code.');
      return;
    }
    if (!trimmedUrl) {
      Alert.alert('Server URL Required', 'Please enter a valid Server URL.');
      return;
    }
    if (!trimmedKey) {
      Alert.alert('Pusher Key Required', 'Please enter your Pusher App Key.');
      return;
    }

    // If already in a room/lobby/game, leave the old room first
    if (stepRef.current !== 'setup' && roomCodeRef.current && roomCodeRef.current.trim().toUpperCase() !== formattedCode) {
      try {
        let cleanUrl = trimmedUrl;
        cleanUrl = cleanUrl.replace(/\/$/, '');
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = `https://${cleanUrl}`;
        }
        await fetch(`${cleanUrl}/api/leave-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerNameRef.current.trim(),
            roomCode: roomCodeRef.current.trim().toUpperCase()
          })
        });
      } catch (err) {
        console.warn('leave-room during auto-join failed:', err);
      }
    }

    setConnecting(true);
    try {
      let cleanUrl = trimmedUrl;
      cleanUrl = cleanUrl.replace(/\/$/, '');
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      const response = await fetch(`${cleanUrl}/api/join-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          roomCode: formattedCode
        }),
      });

      const text = await response.text();
      let resData;
      try {
        resData = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response: ${text.slice(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(resData?.data?.message || resData?.error || 'Request failed');
      }

      const { roomCode: newCode, players: roomPlayers, level: newLevel } = resData.data;

      await AsyncStorage.setItem('multiplayer_name', trimmedName);
      await AsyncStorage.setItem('multiplayer_url', trimmedUrl);
      await AsyncStorage.setItem('multiplayer_pusher_key', trimmedKey);

      // Update registration profile in DB with new name
      void registerUserProfile();

      setRoomCode(newCode);
      setPlayers(roomPlayers);
      setLevel(newLevel);
      setReadyStates({});
      setStep('lobby');

      const other = roomPlayers.find((p: string) => p.toLowerCase() !== trimmedName.toLowerCase());
      if (other) setOpponentName(other);

      connectAndSubscribePusher(newCode, trimmedKey);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join room.');
    } finally {
      setConnecting(false);
    }
  };

  // Load saved credentials on start
  useEffect(() => {
    async function loadSavedData() {
      try {
        const savedName = await AsyncStorage.getItem('multiplayer_name');
        let savedUrl = await AsyncStorage.getItem('multiplayer_url');
        let savedPusherKey = await AsyncStorage.getItem('multiplayer_pusher_key');
        
        // If the URL is not set, or contains a local host address, point it to the production URL
        if (!savedUrl || savedUrl.includes('localhost') || savedUrl.includes('127.0.0.1')) {
          savedUrl = 'https://arrow-game-backend.vercel.app/';
          await AsyncStorage.setItem('multiplayer_url', savedUrl);
        }

        if (!savedPusherKey) {
          savedPusherKey = '1d9ae595090f679858b4';
        }

        if (savedName) setPlayerName(savedName);
        if (savedUrl) setServerUrl(savedUrl);
        if (savedPusherKey) setPusherKey(savedPusherKey);

        // If there's an incoming roomCode from deep linking, auto-join if we have player name
        if (linkRoomCode) {
          const code = linkRoomCode.trim().toUpperCase();
          setRoomCode(code);
          
          const nameToUse = savedName || playerNameRef.current;
          const urlToUse = savedUrl;
          const keyToUse = savedPusherKey;

          if (nameToUse && nameToUse.trim()) {
            console.log(`[Deep Link] Auto-joining room ${code} as ${nameToUse}`);
            void joinRoomWithDetails(nameToUse, code, urlToUse, keyToUse);
          } else {
            Alert.alert(
              'Battle Invitation',
              `Welcome! Enter your name to join room "${code}".`
            );
          }
        }
      } catch (err) {
        console.error('AsyncStorage load error:', err);
      }
    }
    loadSavedData();

    return () => {
      disconnectPusher();
    };
  }, [linkRoomCode]);

  const disconnectPusher = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (channelRef.current && roomCodeRef.current) {
      channelRef.current.unbind_all();
    }
    if (pusherRef.current) {
      if (roomCodeRef.current) {
        pusherRef.current.unsubscribe(`room-${roomCodeRef.current}`);
      }
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
    channelRef.current = null;
  };

  const apiPost = useCallback(async (endpoint: string, body: object) => {
    let cleanUrl = serverUrl.trim();
    if (!cleanUrl) {
      throw new Error('Please enter a valid Server URL.');
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const response = await fetch(`${cleanUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let resData;
    try {
      resData = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid response: ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(resData?.data?.message || resData?.error || 'Request failed');
    }
    return resData;
  }, [serverUrl]);

  const startCountdownTimer = (gameStartsAt: number, countdownSeconds: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const initialCount = Math.max(0, Math.ceil((gameStartsAt - Date.now()) / 1000));
    setCountdown(initialCount);

    countdownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remainingSeconds = Math.ceil((gameStartsAt - now) / 1000);

      if (now >= gameStartsAt || remainingSeconds <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);

        const currentLevel = levelRef.current;
        if (currentLevel) {
          gameStartedAtRef.current = Date.now();
          setMyElapsedSec(0);
          setLocalPlayerTimes({});
          setBoard(createInitialBoard(currentLevel, 3));
          setMyArrowsInitial(currentLevel.arrows.length);
          setOpponentArrowsLeft(currentLevel.arrows.length);

          const other = playersRef.current.find(p => p.toLowerCase() !== playerNameRef.current.toLowerCase()) || 'Opponent';
          setOpponentName(other);

          // Initialise Shared Board Mode scores and owners
          setArrowOwners({});
          setConfirmedClears({});
          const initialScores: Record<string, number> = {};
          playersRef.current.forEach((p) => {
            initialScores[p] = 0;
          });
          setScores(initialScores);

          setExitingArrows([]);
          setStep('game');
          
          boardOpacity.value = 0;
          boardScale.value = 0.94;
          boardOpacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) });
          boardScale.value = withSpring(1, { damping: 15, stiffness: 100, mass: 0.8 });
        }
      } else {
        setCountdown(remainingSeconds);
      }
    }, 100);
  };

  const connectAndSubscribePusher = (code: string, keyToUse: string) => {
    disconnectPusher();

    try {
      console.log('Connecting to Pusher with key:', keyToUse);
      const PusherConstructor: any = (Pusher as any).Pusher || Pusher;
      const pusher = new PusherConstructor(keyToUse || '1d9ae595090f679858b4', {
        cluster: 'ap2',
        forceTLS: true,
      });

      pusherRef.current = pusher;

      const channelName = `room-${code}`;
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      channel.bind('player_joined', (data: any) => {
        console.log('Pusher received: [player_joined]', data);
        setPlayers(data.players);
        const other = data.players.find((p: string) => p.toLowerCase() !== playerNameRef.current.toLowerCase());
        if (other) setOpponentName(other);
      });

      channel.bind('player_left', (data: any) => {
        console.log('Pusher received: [player_left]', data);
        setPlayers(data.players);
        setReadyStates({});
        setOpponentName('');
        // Also update match results status if we are on results screen
        setMatchResults((prev) =>
          prev.map((r) =>
            r.name.toLowerCase() === data.playerName.toLowerCase()
              ? { ...r, status: 'abandoned' }
              : r
          )
        );
        Alert.alert('Notice', `${data.playerName} left the lobby.`);
      });

      channel.bind('ready_states', (data: any) => {
        console.log('Pusher received: [ready_states]', data);
        setReadyStates(data.readyStates);
      });

      channel.bind('start_countdown', (data: any) => {
        console.log('Pusher received: [start_countdown]', data);
        startCountdownTimer(data.gameStartsAt, data.countdownSeconds || 5);
      });

      channel.bind('opponent_progress', (data: any) => {
        console.log('Pusher received: [opponent_progress]', data);
        const progressName = String(data.name || data.playerName || '').trim();
        const me = playerNameRef.current.trim().toLowerCase();

        if (!progressName) {
          return;
        }

        let arrowId = data.removedArrowId || data.boardState?.removedArrowId;

        if (!arrowId && typeof data.arrowsLeft === 'number') {
          const isFloat = data.arrowsLeft % 1 !== 0;
          if (isFloat) {
            const { index } = decodeArrowsLeft(data.arrowsLeft);
            const levelArrows = levelRef.current?.arrows || [];
            const decodedArrow = levelArrows[index];
            if (decodedArrow) {
              arrowId = decodedArrow.id;
            }
          }
        }

        // Reconcile arrowOwners using functional state to prevent rollback race conditions
        setArrowOwners((currentOwners) => {
          const serverOwners: Record<string, string> = data.arrowOwners || {};
          const nextOwners = { ...currentOwners };

          // 1. Merge server verified owners (this resolves conflicts and confirms claims)
          Object.entries(serverOwners).forEach(([id, owner]) => {
            nextOwners[id] = owner;
          });

          // 2. Set scores based on reconciled owners to prevent score jumps/rollbacks due to network latency
          setScores(computeScores(nextOwners));

          // 3. Mark server verified arrows as confirmed clears
          setConfirmedClears((currentConfirmed) => {
            const nextConfirmed = { ...currentConfirmed };
            Object.keys(serverOwners).forEach((id) => {
              nextConfirmed[id] = true;
            });
            return nextConfirmed;
          });

          // 4. Reconcile exiting arrows color based on server verified ownership
          setExitingArrows((currentExiting) => {
            return currentExiting.map((arrow) => {
              const verifiedOwner = nextOwners[arrow.id];
              if (verifiedOwner) {
                const isMe = verifiedOwner.toLowerCase() === playerNameRef.current.trim().toLowerCase();
                const expectedColor = isMe ? '#43A047' : '#2196F3';
                if (arrow.color !== expectedColor) {
                  return { ...arrow, color: expectedColor };
                }
              }
              return arrow;
            });
          });

          // 5. Update the board state to filter out any cleared arrows
          setBoard((currentBoard) => {
            if (!currentBoard) return null;

            // An arrow is removed if it is in nextOwners
            const remainingArrows = currentBoard.arrows.filter((a) => !nextOwners[a.id]);
            const removedIds = currentBoard.removedIds.slice();
            Object.keys(nextOwners).forEach((id) => {
              if (!removedIds.includes(id)) {
                removedIds.push(id);
              }
            });

            // Trigger exited animation if opponent cleared a new arrow in our current active board
            const arrowNode = currentBoard.arrows.find((a) => a.id === arrowId);
            if (arrowNode && progressName.toLowerCase() !== me) {
              setExitingArrows((prev) => {
                if (!prev.some((a) => a.id === arrowNode.id)) {
                  return [...prev, { ...arrowNode, color: '#2196F3' }]; // Opponent exit color is blue
                }
                return prev;
              });
              void playCorrectFeedback();
            }

            const nextBoard = {
              ...currentBoard,
              arrows: remainingArrows,
              removedIds: removedIds
            };

            if (nextBoard.arrows.length === 0 && currentBoard.arrows.length > 0) {
              const timeMs = recordMyCompletionTime();
              apiPost('/api/player-finished', {
                name: playerNameRef.current,
                roomCode: roomCodeRef.current.trim().toUpperCase(),
                timeMs
              }).catch((err) => console.error('Failed to notify finished:', err));
            }

            return nextBoard;
          });

          return nextOwners;
        });

        if (typeof data.arrowsLeft === 'number') {
          setOpponentArrowsLeft(Math.floor(data.arrowsLeft));
        }
      });

      channel.bind('room_terminated', (data: any) => {
        console.log('Pusher received: [room_terminated]', data);
        Alert.alert('Room Terminated', data.message || 'This room has been terminated by the administrator.');
        setStep('setup');
        disconnectPusher();
      });

      channel.bind('match_results', (data: any) => {
        console.log('Pusher received: [match_results]', data);
        setMatchWinner(data.winner);
        setLocalPlayerTimes((localTimes) => {
          const serverPlayers: ServerPlayer[] = data.players || [];
          setMatchResults(
            serverPlayers.map((p) => ({
              ...p,
              timeMs: p.timeMs ?? localTimes[p.name] ?? null
            }))
          );
          return localTimes;
        });
        setRematchStates({});
        setStep('results');
      });

      channel.bind('rematch_states', (data: any) => {
        console.log('Pusher received: [rematch_states]', data);
        setRematchStates(data.rematchStates);
      });

      channel.bind('rematch_start', (data: any) => {
        console.log('Pusher received: [rematch_start]', data);
        
        const code = roomCodeRef.current;
        if (code) {
          apiPost('/api/get-room', { roomCode: code })
            .then((res) => {
              if (res.success && res.data) {
                setLevel(res.data.level);
                setPlayers(res.data.players);
                const other = res.data.players.find((p: string) => p.toLowerCase() !== playerNameRef.current.toLowerCase()) || 'Opponent';
                setOpponentName(other);
              }
            })
            .catch((err) => console.error('Failed to get room details after rematch:', err));
        }

        setReadyStates({});
        setRematchStates({});
        setRequestingRematch(false);
        setStep('lobby');
      });

      pusher.connection.bind('error', (err: any) => {
        console.error('Pusher connection error:', err);
      });

      pusher.connection.bind('state_change', (states: any) => {
        console.log('Pusher state changed:', states.current);
        if (states.current === 'failed') {
          Alert.alert('Connection Error', 'Pusher connection failed. Please check your Pusher credentials.');
          disconnectPusher();
          setStep('setup');
        }
      });

    } catch (err) {
      console.error('Pusher initialization error:', err);
      Alert.alert('Error', 'Failed to initialize real-time connection.');
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name first.');
      return;
    }
    if (!serverUrl.trim()) {
      Alert.alert('Server URL Required', 'Please enter a valid Server URL.');
      return;
    }
    if (!pusherKey.trim()) {
      Alert.alert('Pusher Key Required', 'Please enter your Pusher App Key.');
      return;
    }

    setConnecting(true);
    try {
      const res = await apiPost('/api/create-room', { name: playerName.trim() });
      const { roomCode: newCode, players: roomPlayers, level: newLevel } = res.data;
      
      await AsyncStorage.setItem('multiplayer_name', playerName.trim());
      await AsyncStorage.setItem('multiplayer_url', serverUrl.trim());
      await AsyncStorage.setItem('multiplayer_pusher_key', pusherKey.trim());

      // Update registration profile in DB with new name
      void registerUserProfile();

      setRoomCode(newCode);
      setPlayers(roomPlayers);
      setLevel(newLevel);
      setReadyStates({});
      setStep('lobby');
      
      connectAndSubscribePusher(newCode, pusherKey.trim());
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create room.');
    } finally {
      setConnecting(false);
    }
  };

  const handleJoinRoom = () => {
    void joinRoomWithDetails(playerName, roomCode, serverUrl, pusherKey);
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await Share.share({ message: roomCode, title: 'Room Code' });
    } catch (err) {
      console.error('Failed to share room code:', err);
    }
  };

  const handleShareRoom = async () => {
    if (!roomCode) return;
    try {
      let cleanUrl = serverUrl.trim();
      cleanUrl = cleanUrl.replace(/\/$/, '');
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      const inviteUrl = `${cleanUrl}/api/join?code=${roomCode}`;
      const message = `⚔️ Join my Arrow Escape Battle Arena!\n\nUse Room Code: *${roomCode}*\nClick here to join directly: ${inviteUrl}`;

      await Share.share({
        message,
        url: inviteUrl,
        title: 'Arrow Escape Arena Invitation',
      });
    } catch (err: any) {
      console.error('Sharing failed:', err);
    }
  };

  const handleToggleReady = async () => {
    try {
      await apiPost('/api/toggle-ready', {
        name: playerName.trim(),
        roomCode: roomCode.trim().toUpperCase()
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle ready state.');
    }
  };

  const handleRequestRematch = async () => {
    if (requestingRematch) return;
    setRequestingRematch(true);
    try {
      await apiPost('/api/rematch-request', {
        name: playerName.trim(),
        roomCode: roomCode.trim().toUpperCase()
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to request rematch.');
    } finally {
      setRequestingRematch(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await apiPost('/api/leave-room', {
        name: playerName.trim(),
        roomCode: roomCode.trim().toUpperCase()
      });
    } catch (err) {
      console.warn('leave-room API call failed/ignored:', err);
    }
    disconnectPusher();
    gameStartedAtRef.current = null;
    setStep('setup');
    setRoomCode('');
    setPlayers([]);
    setLevel(null);
    setBoard(null);
    setLocalPlayerTimes({});
    setArrowOwners({});
    setConfirmedClears({});
  };

  const recordMyCompletionTime = useCallback((): number | null => {
    const elapsedMs = getElapsedMs(gameStartedAtRef.current);
    if (elapsedMs == null) return null;
    const me = playerNameRef.current.trim();
    setLocalPlayerTimes((prev) => ({ ...prev, [me]: elapsedMs }));
    return elapsedMs;
  }, []);

  // Gameplay Board interactions
  const handleExitDone = useCallback((arrowId: string) => {
    setExitingArrows((prev) => prev.filter((a) => a.id !== arrowId));
  }, []);

  const handleBlockedDone = useCallback((arrowId: string) => {
    setBlockedArrows((prev) => prev.filter((b) => b.arrow.id !== arrowId));
  }, []);

  const handleCollisionPoint = useCallback((blocker: import('../game/types').ArrowNode | null) => {
    if (!blocker) return;
    setFlashingArrows((prev) => [...prev, blocker]);
    setTimeout(() => {
      setFlashingArrows((prev) => prev.filter((a) => a.id !== blocker.id));
    }, 520);
  }, []);

  const handleArrowPress = useCallback((arrowId: string) => {
    if (!roomCode) return;

    setBoard((currentBoard) => {
      if (!currentBoard) return null;

      // Check if the arrow is already owned by someone else
      const currentOwners = arrowOwnersRef.current;
      if (currentOwners[arrowId]) {
        return currentBoard; // Already cleared, ignore tap
      }

      const arrow = currentBoard.arrows.find((a) => a.id === arrowId);
      const result = resolveTap(arrowId, currentBoard);

      if (result.type === 'REMOVED' && arrow) {
        setExitingArrows((prev) => [...prev, { ...arrow, color: '#43A047' }]);
        void playCorrectFeedback();

        const nextBoard = result.board;

        // Claim ownership locally
        const myName = playerNameRef.current;
        const nextOwners = {
          ...currentOwners,
          [arrowId]: myName
        };
        setArrowOwners(nextOwners);

        const newScores = computeScores(nextOwners);
        setScores(newScores);

        // Encode arrowsLeft
        const levelArrows = levelRef.current?.arrows || [];
        const encodedProgress = encodeArrowsLeft(nextBoard.arrows.length, arrowId, levelArrows);

        apiPost('/api/update-progress', {
          name: myName,
          roomCode: roomCode.trim().toUpperCase(),
          arrowsLeft: encodedProgress,
          removedArrowId: arrowId,
          scores: newScores,
          boardState: {
            removedArrowId: arrowId,
            scores: newScores
          }
        }).catch(err => console.error('Failed to update progress:', err));

        if (nextBoard.arrows.length === 0) {
          const timeMs = recordMyCompletionTime();
          apiPost('/api/player-finished', {
            name: myName,
            roomCode: roomCode.trim().toUpperCase(),
            timeMs
          }).catch(err => console.error('Failed to notify finished:', err));
        }

        return nextBoard;
      } else if (result.type === 'BLOCKED' && arrow) {
        // Find which arrow is physically blocking, then start the red-slide animation.
        const blocker = findBlockingArrow(arrow, currentBoard) ?? null;
        setBlockedArrows((prev) => [...prev, { arrow, blocker }]);
        void playWrongFeedback(hapticsEnabled);

        const nextBoard = result.board;
        if (nextBoard.livesLeft <= 0) {
          const myName = playerNameRef.current;
          const code = roomCode;
          if (code) {
            apiPost('/api/player-failed', {
              name: myName,
              roomCode: code.trim().toUpperCase()
            }).catch((err) => console.error('Failed to notify failed:', err));
          }
        }
        return nextBoard;
      }

      return currentBoard;
    });
  }, [roomCode, hapticsEnabled, apiPost, recordMyCompletionTime, computeScores]);

  const handleUndo = useCallback(() => {
    // No undo in Shared Board Mode
  }, []);

  // Animated Board styling
  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
    opacity: boardOpacity.value,
    overflow: 'visible'
  }));

  // Render Sub-Views
  const renderSetup = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerTitle}>Battle Arena</Text>
          <Text style={styles.headerSub}>Compete real-time against another player!</Text>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Choose Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SpeedRunner99"
              placeholderTextColor={theme.colors.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={15}
            />

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              onPress={handleCreateRoom}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Create New Room</Text>
              )}
            </Pressable>

            <View style={styles.orContainer}>
              <Text style={styles.orText}>OR JOIN EXISTING</Text>
            </View>

            <Text style={styles.inputLabel}>Room Code</Text>
            <TextInput
              style={[styles.input, styles.codeField]}
              placeholder="CODE"
              placeholderTextColor={theme.colors.textMuted}
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              maxLength={4}
            />

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              onPress={handleJoinRoom}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color={theme.colors.arrowStroke} />
              ) : (
                <Text style={styles.secondaryBtnText}>Join Room</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.backBtn}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.backBtnText}>← Return to Menu</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderLobby = () => {
    const isReady = readyStates[playerName] || false;
    const otherPlayer = players.find(p => p.toLowerCase() !== playerName.toLowerCase());
    const otherReady = otherPlayer ? readyStates[otherPlayer] || false : false;

    return (
      <View style={styles.lobbyContainer}>
        <Text style={styles.lobbyLabel}>ROOM CODE</Text>

        <View style={styles.codeShareRow}>
          <Pressable 
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.codeContainer, 
              pressed && styles.btnPressed
            ]}
            onPress={handleCopyCode}
          >
            <Text style={styles.lobbyCode}>{roomCode}</Text>
            <Text style={styles.copyLabel}>📋 Copy Code</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.lobbyShareBtn,
              pressed && styles.btnPressed
            ]}
            onPress={handleShareRoom}
          >
            <Text style={styles.lobbyShareBtnIcon}>🔗</Text>
            <Text style={styles.lobbyShareBtnText}>Share Link</Text>
          </Pressable>
        </View>

        <Text style={styles.lobbySub}>Tap code to copy, or Share Link with friends</Text>

        <View style={styles.playersCard}>
          <Text style={styles.cardHeader}>PLAYERS IN LOBBY</Text>
          
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerDot}>🎮</Text>
              <Text style={styles.playerNameText}>{playerName} (You)</Text>
            </View>
            <View style={[styles.readyBadge, isReady ? styles.readyActive : styles.readyWait]}>
              <Text style={styles.readyText}>{isReady ? 'READY' : 'WAITING'}</Text>
            </View>
          </View>

          {otherPlayer ? (
            <View style={styles.playerRow}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerDot}>⚔️</Text>
                <Text style={styles.playerNameText}>{otherPlayer}</Text>
              </View>
              <View style={[styles.readyBadge, otherReady ? styles.readyActive : styles.readyWait]}>
                <Text style={styles.readyText}>{otherReady ? 'READY' : 'WAITING'}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.playerRow, styles.waitingRow]}>
              <ActivityIndicator color={theme.colors.textMuted} size="small" style={{ marginRight: 10 }} />
              <Text style={styles.waitingOpponentText}>Waiting for opponent to join...</Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.lobbyActionBtn,
            isReady ? styles.lobbyWaitBtn : styles.lobbyReadyBtn,
            pressed && styles.btnPressed
          ]}
          onPress={handleToggleReady}
          disabled={!otherPlayer}
        >
          <Text style={styles.lobbyActionBtnText}>
            {!otherPlayer ? 'Waiting for Player...' : isReady ? 'Cancel Ready' : 'I am Ready!'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.lobbyLeaveBtn}
          onPress={handleLeaveRoom}
        >
          <Text style={styles.lobbyLeaveBtnText}>Leave Room</Text>
        </Pressable>
      </View>
    );
  };

  const renderGame = () => {
    if (!board || !level) return null;

    const maxW = width * 0.82;
    const maxH = height * 0.44;
    const { columns, rows } = board.level.gridSize;
    const sizeFromWidth = maxW / columns;
    const sizeFromHeight = maxH / rows;
    const cellSize = Math.min(sizeFromWidth, sizeFromHeight, 60);
    const boardWidth = cellSize * columns;
    const boardHeight = cellSize * rows;

    const handleBoardPress = (x: number, y: number) => {
      setLastTap({ x, y, timestamp: Date.now() });
      const arrow = findArrowAtPoint(board.arrows, x, y, cellSize);
      if (arrow) handleArrowPress(arrow.id);
    };

    const remainingCount = board.arrows.length;
    const myScore = scores[playerName] || 0;
    const oppScore = scores[opponentName] || 0;
    const isLeading = myScore > oppScore;
    const isTrailing = myScore < oppScore;

    let statusText = "Clear as many arrows as you can! ⚡";
    if (isLeading) {
      statusText = "You are leading! Keep it up! 👑";
    } else if (isTrailing) {
      statusText = `${opponentName} is leading! Hurry up! 🔥`;
    } else if (myScore > 0 || oppScore > 0) {
      statusText = "Tie match! Race to the finish! 🤝";
    }

    return (
      <View style={styles.gameContainer}>
        {/* Shared Scoreboard Header */}
        <View style={styles.scoreboardContainer}>
          {/* Player 1 (Local Player) */}
          <View style={[
            styles.scoreCard, 
            isLeading ? styles.scoreCardActive : null
          ]}>
            <Text style={styles.scorePlayerName} numberOfLines={1}>
              {playerName} {isLeading && "👑"}
            </Text>
            <Text style={styles.scoreNumber}>{myScore}</Text>
            {isLeading && <Text style={styles.scoreActiveDot}>LEADING</Text>}
          </View>

          {/* Central Info */}
          <View style={styles.scoreCenterColumn}>
            <View style={styles.vsBadgeContainer}>
              <Text style={styles.vsBadgeText}>VS</Text>
            </View>
            <Text style={styles.scoreRemainingText}>{remainingCount} left</Text>
          </View>

          {/* Player 2 (Opponent) */}
          <View style={[
            styles.scoreCard, 
            isTrailing ? styles.scoreCardActiveOpponent : null
          ]}>
            <Text style={[styles.scorePlayerName, { textAlign: 'right' }]} numberOfLines={1}>
              {isTrailing && "👑 "} {opponentName}
            </Text>
            <Text style={[styles.scoreNumber, { textAlign: 'right' }]}>{oppScore}</Text>
            {isTrailing && <Text style={styles.scoreActiveDotOpponent}>LEADING</Text>}
          </View>
        </View>

        {/* Real-time Status Message Bar */}
        <View style={[
          styles.turnPromptBar,
          isLeading ? styles.turnPromptBarActive : isTrailing ? styles.turnPromptBarTrailing : styles.turnPromptBarWaiting
        ]}>
          <Text style={[
            styles.turnPromptText,
            isLeading ? styles.turnPromptTextActive : isTrailing ? styles.turnPromptTextTrailing : styles.turnPromptTextWaiting
          ]}>
            {statusText}
          </Text>
        </View>

        {/* Lives Indicator */}
        <LivesIndicator livesLeft={board.livesLeft} />

        {/* Puzzle Canvas */}
        <View style={styles.boardStage}>
          <ZoomableBoardViewport
            key={`${roomCode}-${level.id}`}
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            onBoardPress={handleBoardPress}
          >
            <Animated.View style={animatedBoardStyle}>
              <PuzzleBoardCanvas
                board={board}
                exitingArrows={exitingArrows}
                blockedArrows={blockedArrows}
                flashingArrows={flashingArrows}
                width={boardWidth}
                enableTouch={false}
                onArrowPress={handleArrowPress}
                onExitDone={handleExitDone}
                onBlockedDone={handleBlockedDone}
                onCollisionPoint={handleCollisionPoint}
                lastTap={lastTap}
              />
            </Animated.View>
          </ZoomableBoardViewport>
        </View>

        {/* Battle Controls */}
        <View style={styles.battleControls}>
          <Pressable style={[styles.controlBtn, styles.controlLeaveBtn]} onPress={handleLeaveRoom}>
            <Text style={[styles.controlBtnText, styles.controlLeaveText]}>🏳️ Resign</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderResults = () => {
    const otherPlayer = players.find(p => p.toLowerCase() !== playerName.toLowerCase()) || 'Opponent';
    const isRematchRequested = rematchStates[playerName] || false;
    const isOtherRematchRequested = rematchStates[otherPlayer] || false;

    // Detect resign / abandon scenarios
    const abandonedPlayer = matchResults.find(r => r.status === 'abandoned');
    const isOpponentAbandoned = abandonedPlayer && abandonedPlayer.name.toLowerCase() !== playerName.toLowerCase();
    const didIAbandon = abandonedPlayer && abandonedPlayer.name.toLowerCase() === playerName.toLowerCase();

    const getSharedBoardWinner = (): string => {
      if (abandonedPlayer) {
        return matchWinner || 'None'; // Use server winner if someone resigned
      }
      const playersList = players;
      if (playersList.length < 2) return matchWinner || playerName || 'None';
      const p1Name = playersList[0] || '';
      const p2Name = playersList[1] || '';
      const p1Score = scores[p1Name] || 0;
      const p2Score = scores[p2Name] || 0;
      if (p1Score > p2Score) return p1Name;
      if (p2Score > p1Score) return p2Name;
      return 'None'; // Draw
    };

    const localWinner = getSharedBoardWinner();
    const isMeWinner = localWinner.toLowerCase() === playerName.toLowerCase();
    const isDraw = localWinner === 'None';
    const heroIcon = isDraw ? '🤝' : isMeWinner ? '🏆' : '💀';
    const heroColor = isDraw ? '#806F5D' : isMeWinner ? '#C9A227' : '#A0522D';

    // Build title and subtitle based on scenario
    let titleText: string;
    let subtitleText: string;

    const myResult = matchResults.find(r => r.name.toLowerCase() === playerName.toLowerCase());
    const oppResult = matchResults.find(r => r.name.toLowerCase() === otherPlayer.toLowerCase());

    const isMyStatusFailed = myResult && myResult.status === 'failed_lives';
    const isOppStatusFailed = oppResult && oppResult.status === 'failed_lives';

    if (isDraw) {
      titleText = 'DRAW MATCH';
      subtitleText = `Equal performance! Both players cleared ${scores[playerName] || 0} arrows.`;
    } else if (isOpponentAbandoned) {
      titleText = 'YOU WON!';
      subtitleText = `${abandonedPlayer!.name} resigned — Victory is yours!`;
    } else if (didIAbandon) {
      titleText = 'YOU RESIGNED';
      subtitleText = `${matchWinner} wins by default.`;
    } else if (isMeWinner) {
      titleText = 'YOU WON!';
      if (isOppStatusFailed) {
        subtitleText = `${otherPlayer} lost all lives — Victory is yours!`;
      } else {
        subtitleText = `You removed more arrows (${scores[playerName] || 0} vs ${scores[otherPlayer] || 0})!`;
      }
    } else {
      titleText = 'YOU LOST';
      if (isMyStatusFailed) {
        subtitleText = `You lost all 3 lives! ${localWinner} wins.`;
      } else {
        subtitleText = `${localWinner} removed more arrows (${scores[localWinner] || 0} vs ${scores[playerName] || 0}).`;
      }
    }

    return (
      <View style={styles.resultsContainer}>
        {/* Hero card */}
        <View style={[styles.resultsCard, isMeWinner && !isDraw && styles.resultsCardWinner]}>

          {/* Decorative top bar */}
          <View style={[styles.resultsAccentBar, { backgroundColor: heroColor }]} />

          {/* Hero icon */}
          <View style={[styles.heroIconWrap, { backgroundColor: heroColor + '18', borderColor: heroColor + '30' }]}>
            <Text style={styles.heroIcon}>{heroIcon}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.winTitle, { color: heroColor }]}>{titleText}</Text>
          <Text style={styles.winSub}>{subtitleText}</Text>

          {/* Divider */}
          <View style={styles.resultsDivider} />

          {/* Player result rows */}
          {matchResults.map((result) => {
            const isMe = result.name.toLowerCase() === playerName.toLowerCase();
            const isWinner = result.name.toLowerCase() === localWinner.toLowerCase();
            const playerScore = scores[result.name] || 0;

            return (
              <View
                key={result.name}
                style={[
                  styles.playerResultRow,
                  isMe && styles.playerResultRowMe
                ]}
              >
                {/* Medal / avatar */}
                <View style={[styles.playerResultMedal, { backgroundColor: isWinner ? '#FFF8E1' : '#F6F1E8' }]}>
                  <Text style={styles.playerResultMedalText}>
                    {isWinner && !isDraw ? '🏆' : isMe ? '🎮' : '⚔️'}
                  </Text>
                </View>

                {/* Name + you tag */}
                <View style={styles.playerResultInfo}>
                  <Text style={[styles.playerResultName, isMe && styles.playerResultNameMe]} numberOfLines={1}>
                    {result.name}
                  </Text>
                  {isMe && (
                    <Text style={styles.playerResultYouTag}>YOU</Text>
                  )}
                </View>

                {/* Status badge */}
                <View style={[styles.statusBadge, { 
                  backgroundColor: result.status === 'failed_lives' 
                    ? '#FFEBEE' 
                    : (isWinner && !isDraw ? '#FFF9C4' : '#E8F5E9') 
                }]}>
                  <Text style={[styles.statusBadgeText, { 
                    color: result.status === 'failed_lives' 
                       ? '#C62828' 
                       : (isWinner && !isDraw ? '#F57F17' : '#2E7D32') 
                  }]}>
                    {result.status === 'abandoned' 
                      ? 'Resigned' 
                      : result.status === 'failed_lives' 
                      ? 'Out of Lives' 
                      : `${playerScore} arrows`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Rematch Section */}
        <View style={styles.rematchCard}>
          {isOtherRematchRequested && (
            <View style={styles.rematchTipBox}>
              <Text style={styles.rematchTipText}>⚡ {otherPlayer} wants a rematch!</Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.rematchBtn,
              (isRematchRequested || requestingRematch) ? styles.rematchBtnWaiting : styles.rematchBtnActive,
              pressed && styles.btnPressed
            ]}
            onPress={handleRequestRematch}
            disabled={isRematchRequested || requestingRematch}
          >
            <Text style={styles.rematchBtnText}>
              {requestingRematch
                ? 'Sending…'
                : isRematchRequested
                ? '⏳ Waiting for opponent…'
                : '⚔️ Request Rematch'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.resultsLeaveBtn}
          onPress={handleLeaveRoom}
        >
          <Text style={styles.resultsLeaveBtnText}>← Exit Arena</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientBackground />
      {step !== 'setup' && step !== 'game' && (
        <View style={styles.lobbyHeader}>
          <Text style={styles.lobbyTitle}>⚔️ Arena Lobby</Text>
        </View>
      )}

      {/* Main View Transition */}
      {step === 'setup' && renderSetup()}
      {step === 'lobby' && renderLobby()}
      {step === 'game' && renderGame()}
      {step === 'results' && renderResults()}

      {/* Synchronized Countdown Overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownTitle}>GET READY</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownSub}>Shared board. Get the most arrows!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    textAlign: 'center',
    marginTop: 20
  },
  headerSub: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    fontWeight: '600'
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: theme.radius.xl,
    padding: 24,
    ...theme.shadows.lg
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    marginTop: 14
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.black,
    backgroundColor: theme.colors.bgPrimary,
    fontWeight: '600'
  },
  codeField: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  divider: {
    height: 1.5,
    backgroundColor: theme.colors.borderSoft,
    marginVertical: 20
  },
  orContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  orText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textMuted,
    letterSpacing: 2
  },
  primaryBtn: {
    backgroundColor: theme.colors.arrowStroke,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800'
  },
  secondaryBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: theme.colors.arrowStroke,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...theme.shadows.md
  },
  secondaryBtnText: {
    color: theme.colors.arrowStroke,
    fontSize: 18,
    fontWeight: '800'
  },
  btnPressed: {
    transform: [{ scale: 0.97 }]
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 24
  },
  backBtnText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '700'
  },

  // Lobby Styles
  lobbyHeader: {
    alignItems: 'center',
    marginTop: 16
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  lobbyContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lobbyLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textMuted,
    letterSpacing: 2
  },
  codeShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
    width: '100%'
  },
  codeContainer: {
    flex: 2,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: theme.colors.arrowStroke,
    borderRadius: theme.radius.lg,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md
  },
  lobbyCode: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    color: theme.colors.arrowStroke,
    textAlign: 'center'
  },
  copyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase'
  },
  lobbyShareBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderColor: '#1EBE57',
    borderWidth: 2,
    borderRadius: theme.radius.lg,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md
  },
  lobbyShareBtnIcon: {
    fontSize: 22,
    marginBottom: 2
  },
  lobbyShareBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  lobbySub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600'
  },
  playersCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: theme.radius.xl,
    padding: 20,
    marginBottom: 30,
    ...theme.shadows.md
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 14
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft
  },
  waitingRow: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    paddingVertical: 16
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  playerDot: {
    fontSize: 20,
    marginRight: 10
  },
  playerNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.arrowStroke
  },
  waitingOpponentText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '600'
  },
  readyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm
  },
  readyActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#43A047',
    borderWidth: 1
  },
  readyWait: {
    backgroundColor: '#ECEFF1',
    borderColor: '#B0BEC5',
    borderWidth: 1
  },
  readyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#37474F'
  },
  lobbyActionBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md
  },
  lobbyReadyBtn: {
    backgroundColor: theme.colors.arrowStroke
  },
  lobbyWaitBtn: {
    backgroundColor: '#B0BEC5'
  },
  lobbyActionBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800'
  },
  lobbyLeaveBtn: {
    marginTop: 20,
    padding: 10
  },
  lobbyLeaveBtnText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '700'
  },

  // Game UI
  gameContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    ...theme.shadows.md
  },
  vsPlayerColumn: {
    flex: 1
  },
  vsPlayerName: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.arrowStroke
  },
  vsProgressSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginTop: 2
  },
  vsProgressBarBg: {
    height: 8,
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
    width: '100%'
  },
  vsProgressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  vsBadgeContainer: {
    paddingHorizontal: 10,
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 12,
    marginHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft
  },
  vsBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textPrimary
  },
  boardStage: {
    flex: 1,
    width: '100%',
    marginVertical: 6,
    overflow: 'visible'
  },
  battleControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  controlBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.pill,
    minWidth: 100,
    alignItems: 'center',
    ...theme.shadows.md
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.arrowStroke
  },
  controlLeaveBtn: {
    borderColor: theme.colors.lifeRed,
    borderWidth: 1
  },
  controlLeaveText: {
    color: theme.colors.lifeRed
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

  // Countdown overlay
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  countdownContainer: {
    alignItems: 'center'
  },
  countdownTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.accentGold,
    letterSpacing: 4,
    marginBottom: 10
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFF'
  },
  countdownSub: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 10,
    opacity: 0.8,
    fontWeight: '600'
  },
  // Shared Board Scoreboard Styles
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    gap: 12
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    ...theme.shadows.sm
  },
  scoreCardActive: {
    borderColor: '#FFD54F',
    backgroundColor: '#FFFDE7',
    ...theme.shadows.md
  },
  scoreCardActiveOpponent: {
    borderColor: '#FFD54F',
    backgroundColor: '#FFFDE7',
    ...theme.shadows.md
  },
  scorePlayerName: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textPrimary
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.arrowStroke,
    marginTop: 4
  },
  scoreActiveDot: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFB300',
    marginTop: 4,
    letterSpacing: 0.5
  },
  scoreActiveDotOpponent: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFB300',
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'right'
  },
  scoreCenterColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70
  },
  scoreRemainingText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textMuted,
    marginTop: 6
  },
  turnPromptBar: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  turnPromptBarActive: {
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.25)'
  },
  turnPromptBarTrailing: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)'
  },
  turnPromptBarWaiting: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)'
  },
  turnPromptText: {
    fontSize: 14,
    fontWeight: '800'
  },
  turnPromptTextActive: {
    color: '#A0700A'
  },
  turnPromptTextTrailing: {
    color: '#D32F2F'
  },
  turnPromptTextWaiting: {
    color: theme.colors.textMuted
  }
});
