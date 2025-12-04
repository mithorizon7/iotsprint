import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import {
  GameState,
  GameMetrics,
  INITIAL_METRICS,
  CardConfig,
  GameConfig,
  evaluateUnlockCondition,
  PreMortemChoice,
  DisasterEvent,
  DifficultyMode,
  ActiveSynergyEntry,
} from '@shared/schema';
import {
  SynergyConfig,
  SynergiesData,
  calculateRoundEffects,
  getConfigForDifficulty,
  getTokensPerRound,
  getDisasterPenaltyScale,
  DIFFICULTY_PRESETS,
} from '@shared/gameLogic';

const STORAGE_KEY = 'iot-game-state';
const DIFFICULTY_KEY = 'iot-game-difficulty';

interface GameContextType {
  gameState: GameState;
  allCards: CardConfig[];
  availableCards: CardConfig[];
  config: GameConfig;
  synergies: SynergyConfig[];
  allocateTokens: (cardId: string, tokens: number) => void;
  runPlan: () => void;
  nextRound: () => void;
  reset: () => void;
  resetRound: () => void;
  canRunPlan: boolean;
  setPreMortemAnswer: (answer: PreMortemChoice) => void;
  setDifficulty: (difficulty: DifficultyMode) => void;
  difficulty: DifficultyMode;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
  cards: CardConfig[];
  config: GameConfig;
  synergiesData: SynergiesData;
}

function getStoredDifficulty(): DifficultyMode {
  try {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (stored && (stored === 'easy' || stored === 'normal' || stored === 'hard')) {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'normal';
}

function getInitialGameState(difficulty: DifficultyMode): GameState {
  const tokensPerRound = getTokensPerRound(difficulty);
  
  const defaultState: GameState = {
    currentRound: 1,
    metrics: { ...INITIAL_METRICS },
    tokensAvailable: tokensPerRound[0],
    allocations: {},
    roundHistory: [],
    disasterEvents: [],
    preMortemAnswer: null,
    isGameComplete: false,
    difficulty,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !parsed.isGameComplete) {
        return { ...defaultState, ...parsed, difficulty };
      }
    }
  } catch (e) {
    console.warn('Failed to restore game state from localStorage:', e);
  }

  return defaultState;
}

export function GameProvider({ children, cards, config: baseConfig, synergiesData }: GameProviderProps) {
  const [difficulty, setDifficultyState] = useState<DifficultyMode>(getStoredDifficulty);
  const [gameState, setGameState] = useState<GameState>(() => getInitialGameState(difficulty));

  const config = useMemo(() => 
    getConfigForDifficulty(baseConfig, difficulty),
    [baseConfig, difficulty]
  );

  const synergies = synergiesData.synergies;
  const tokensPerRound = useMemo(() => getTokensPerRound(difficulty), [difficulty]);
  const penaltyScale = useMemo(() => getDisasterPenaltyScale(difficulty), [difficulty]);

  useEffect(() => {
    try {
      if (!gameState.isGameComplete) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      }
    } catch (e) {
      console.warn('Failed to save game state to localStorage:', e);
    }
  }, [gameState]);

  const setDifficulty = useCallback((newDifficulty: DifficultyMode) => {
    setDifficultyState(newDifficulty);
    localStorage.setItem(DIFFICULTY_KEY, newDifficulty);
    
    const newTokensPerRound = getTokensPerRound(newDifficulty);
    setGameState(prev => ({
      ...prev,
      tokensAvailable: newTokensPerRound[prev.currentRound - 1],
      difficulty: newDifficulty,
    }));
  }, []);

  const availableCards = useMemo(() => {
    return cards.filter((card) => {
      if (!card.roundsAvailable.includes(gameState.currentRound)) {
        return false;
      }
      return evaluateUnlockCondition(card.unlockCondition, gameState.metrics, gameState.allocations, config);
    });
  }, [cards, gameState.currentRound, gameState.metrics, gameState.allocations, config]);

  const allocateTokens = useCallback((cardId: string, tokens: number) => {
    setGameState((prev) => {
      const currentAllocation = prev.allocations[cardId] || 0;
      const otherAllocations = Object.entries(prev.allocations)
        .filter(([id]) => id !== cardId)
        .reduce((sum, [, t]) => sum + t, 0);

      const usedTokens = otherAllocations;
      const available = prev.tokensAvailable - usedTokens;

      const newTokens = Math.max(0, Math.min(3, Math.min(tokens, currentAllocation + available)));

      return {
        ...prev,
        allocations: {
          ...prev.allocations,
          [cardId]: newTokens,
        },
      };
    });
  }, []);

  const runPlan = useCallback(() => {
    setGameState((prev) => {
      let metricsBefore: GameMetrics;
      if (prev.currentRound === 1) {
        metricsBefore = { ...INITIAL_METRICS };
      } else {
        const previousRound = prev.roundHistory.find(
          (r) => r.round === prev.currentRound - 1
        );
        if (previousRound) {
          metricsBefore = { ...previousRound.metricsAfter };
        } else {
          metricsBefore = { ...INITIAL_METRICS };
        }
      }

      const { metricsAfter, activeSynergies, triggeredDisasters } = calculateRoundEffects(
        metricsBefore,
        prev.allocations,
        cards,
        config,
        synergies,
        prev.currentRound,
        penaltyScale
      );

      const activeSynergyEntries: ActiveSynergyEntry[] = activeSynergies.map(s => ({
        id: s.id,
        nameKey: s.nameKey,
        bonusEffect: s.bonusEffect,
        bonusAmount: s.bonusAmount,
        participatingCards: s.participatingCards,
        scaledBonus: s.scaledBonus,
      }));

      const existingRoundIndex = prev.roundHistory.findIndex(
        (r) => r.round === prev.currentRound
      );

      let updatedHistory;
      if (existingRoundIndex >= 0) {
        updatedHistory = [...prev.roundHistory];
        updatedHistory[existingRoundIndex] = {
          round: prev.currentRound,
          metricsBefore,
          metricsAfter,
          allocations: { ...prev.allocations },
          events: triggeredDisasters.length > 0 ? triggeredDisasters : undefined,
          activeSynergies: activeSynergyEntries.length > 0 ? activeSynergyEntries : undefined,
        };
      } else {
        updatedHistory = [
          ...prev.roundHistory,
          {
            round: prev.currentRound,
            metricsBefore,
            metricsAfter,
            allocations: { ...prev.allocations },
            events: triggeredDisasters.length > 0 ? triggeredDisasters : undefined,
            activeSynergies: activeSynergyEntries.length > 0 ? activeSynergyEntries : undefined,
          },
        ];
      }

      const updatedDisasterEvents = [...prev.disasterEvents];
      triggeredDisasters.forEach((disaster: DisasterEvent) => {
        if (!updatedDisasterEvents.some((d) => d.id === disaster.id && d.round === disaster.round)) {
          updatedDisasterEvents.push(disaster);
        }
      });

      return {
        ...prev,
        metrics: metricsAfter,
        roundHistory: updatedHistory,
        disasterEvents: updatedDisasterEvents,
        isGameComplete: prev.currentRound === 3,
      };
    });
  }, [cards, config, synergies, penaltyScale]);

  const nextRound = useCallback(() => {
    setGameState((prev) => {
      const nextRoundNum = prev.currentRound + 1;
      if (nextRoundNum > 3) return prev;

      const keptAllocations =
        nextRoundNum > 1
          ? Object.fromEntries(
              Object.entries(prev.allocations).map(([cardId, tokens]) => [
                cardId,
                Math.floor(tokens * 0.5),
              ])
            )
          : {};

      const carryoverTotal = Object.values(keptAllocations).reduce((sum, t) => sum + t, 0);
      const totalBudget = tokensPerRound[nextRoundNum - 1] + carryoverTotal;

      return {
        ...prev,
        currentRound: nextRoundNum,
        tokensAvailable: totalBudget,
        allocations: keptAllocations,
      };
    });
  }, [tokensPerRound]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear game state from localStorage:', e);
    }
    setGameState({
      currentRound: 1,
      metrics: { ...INITIAL_METRICS },
      tokensAvailable: tokensPerRound[0],
      allocations: {},
      roundHistory: [],
      disasterEvents: [],
      preMortemAnswer: null,
      isGameComplete: false,
      difficulty,
    });
  }, [tokensPerRound, difficulty]);

  const resetRound = useCallback(() => {
    setGameState((prev) => {
      if (prev.currentRound === 1) {
        return {
          ...prev,
          allocations: {},
        };
      }

      const previousRound = prev.roundHistory[prev.roundHistory.length - 1];
      const keptAllocations = previousRound
        ? Object.fromEntries(
            Object.entries(previousRound.allocations).map(([cardId, tokens]) => [
              cardId,
              Math.floor(tokens * 0.5),
            ])
          )
        : {};

      return {
        ...prev,
        allocations: keptAllocations,
      };
    });
  }, []);

  const setPreMortemAnswer = useCallback((answer: PreMortemChoice) => {
    setGameState((prev) => ({
      ...prev,
      preMortemAnswer: answer,
    }));
  }, []);

  const tokensUsed = Object.values(gameState.allocations).reduce((sum, t) => sum + t, 0);
  const canRunPlan = tokensUsed > 0;

  return (
    <GameContext.Provider
      value={{
        gameState,
        allCards: cards,
        availableCards,
        config,
        synergies,
        allocateTokens,
        runPlan,
        nextRound,
        reset,
        resetRound,
        canRunPlan,
        setPreMortemAnswer,
        setDifficulty,
        difficulty,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
