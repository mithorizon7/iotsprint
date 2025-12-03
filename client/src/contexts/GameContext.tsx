import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import {
  GameState,
  GameMetrics,
  INITIAL_METRICS,
  TOKENS_PER_ROUND,
  clampMetrics,
  CardConfig,
  GameConfig,
  evaluateUnlockCondition,
  PreMortemChoice,
  DisasterEvent,
} from '@shared/schema';

const STORAGE_KEY = 'iot-game-state';

interface GameContextType {
  gameState: GameState;
  allCards: CardConfig[]; // All cards in the game
  availableCards: CardConfig[]; // Cards available in current round
  config: GameConfig; // Game configuration with tunable thresholds
  allocateTokens: (cardId: string, tokens: number) => void;
  runPlan: () => void;
  nextRound: () => void;
  reset: () => void;
  resetRound: () => void; // Reset current round allocations only
  canRunPlan: boolean;
  setPreMortemAnswer: (answer: PreMortemChoice) => void;
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
}

function getInitialGameState(): GameState {
  const defaultState: GameState = {
    currentRound: 1,
    metrics: { ...INITIAL_METRICS },
    tokensAvailable: TOKENS_PER_ROUND[0],
    allocations: {},
    roundHistory: [],
    disasterEvents: [],
    preMortemAnswer: null,
    isGameComplete: false,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !parsed.isGameComplete) {
        return { ...defaultState, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to restore game state from localStorage:', e);
  }

  return defaultState;
}

export function GameProvider({ children, cards, config }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState>(getInitialGameState);

  useEffect(() => {
    try {
      if (!gameState.isGameComplete) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      }
    } catch (e) {
      console.warn('Failed to save game state to localStorage:', e);
    }
  }, [gameState]);

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

      // Calculate available tokens
      const usedTokens = otherAllocations;
      const available = prev.tokensAvailable - usedTokens;

      // Clamp to 0-3 per card and available tokens
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
      // Helper function to apply allocation effects to a metrics object
      const applyAllocationEffects = (
        metricsToUpdate: GameMetrics,
        allocations: Record<string, number>
      ): GameMetrics => {
        const updated = { ...metricsToUpdate };
        const totalTokensUsed = Object.values(allocations).reduce((sum, t) => sum + t, 0);

        Object.entries(allocations).forEach(([cardId, tokens]) => {
          if (tokens === 0) return;

          const card = cards.find((c) => c.id === cardId);
          if (!card) return;

          // Apply effects with diminishing returns after threshold
          for (let i = 0; i < tokens; i++) {
            const multiplier = i >= config.tokenMechanics.diminishingReturnsThreshold 
              ? config.tokenMechanics.diminishingReturnsMultiplier 
              : 1;

            updated.visibility_insight += card.perTokenEffects.visibility_insight * multiplier;
            updated.efficiency_throughput += card.perTokenEffects.efficiency_throughput * multiplier;
            updated.sustainability_emissions += card.perTokenEffects.sustainability_emissions * multiplier;
            updated.early_warning_prevention += card.perTokenEffects.early_warning_prevention * multiplier;
            updated.complexity_risk += card.perTokenEffects.complexity_risk * multiplier;
          }
        });

        // Global complexity penalty for IoT sprawl (per round)
        if (totalTokensUsed > config.tokenMechanics.iotSprawlThreshold) {
          updated.complexity_risk += (totalTokensUsed - config.tokenMechanics.iotSprawlThreshold) * config.tokenMechanics.iotSprawlPenaltyPerToken;
        }

        return updated;
      };

      // Calculate metricsBefore by using stored metrics from previous round
      // This is more robust than recalculating and immune to config changes
      let metricsBefore: GameMetrics;
      if (prev.currentRound === 1) {
        // Round 1: start from baseline
        metricsBefore = { ...INITIAL_METRICS };
      } else {
        // Rounds 2-3: use metricsAfter from previous round
        const previousRound = prev.roundHistory.find(
          (r) => r.round === prev.currentRound - 1
        );
        if (previousRound) {
          metricsBefore = { ...previousRound.metricsAfter };
        } else {
          // Fallback (shouldn't happen in normal gameplay)
          metricsBefore = { ...INITIAL_METRICS };
        }
      }

      // Calculate metricsAfter: metricsBefore + current round effects
      let metricsAfter = applyAllocationEffects(metricsBefore, prev.allocations);
      metricsAfter = clampMetrics(metricsAfter);

      // Check for disaster events
      const triggeredDisasters: DisasterEvent[] = [];
      config.disasters.forEach((disasterConfig) => {
        // Only check disasters for matching round
        if (disasterConfig.round !== prev.currentRound) return;

        // Check if disaster is triggered
        const metricValue = metricsAfter[disasterConfig.triggerMetric];
        if (metricValue >= disasterConfig.threshold) {
          // Check if disaster is mitigated by any allocated cards
          const isMitigated = disasterConfig.mitigatedBy?.some(
            (cardId) => (prev.allocations[cardId] || 0) > 0
          );

          if (!isMitigated) {
            // Apply disaster penalties
            const penalizedMetrics = { ...metricsAfter };
            Object.entries(disasterConfig.penalties).forEach(([metric, penalty]) => {
              if (penalty !== undefined) {
                penalizedMetrics[metric as keyof GameMetrics] += penalty;
              }
            });
            metricsAfter = clampMetrics(penalizedMetrics);

            // Record the disaster event
            triggeredDisasters.push({
              id: disasterConfig.id,
              round: prev.currentRound,
              triggerMetric: disasterConfig.triggerMetric,
              threshold: disasterConfig.threshold,
              penalties: disasterConfig.penalties,
              copyKey: disasterConfig.copyKey,
              mitigatedBy: disasterConfig.mitigatedBy,
            });
          }
        }
      });

      // Update or append roundHistory entry for this round
      // If this round already exists in history (re-running), replace it
      // Otherwise, append it
      const existingRoundIndex = prev.roundHistory.findIndex(
        (r) => r.round === prev.currentRound
      );

      let updatedHistory;
      if (existingRoundIndex >= 0) {
        // Replace existing entry for this round
        updatedHistory = [...prev.roundHistory];
        updatedHistory[existingRoundIndex] = {
          round: prev.currentRound,
          metricsBefore,
          metricsAfter,
          allocations: { ...prev.allocations },
          events: triggeredDisasters.length > 0 ? triggeredDisasters : undefined,
        };
      } else {
        // Append new entry
        updatedHistory = [
          ...prev.roundHistory,
          {
            round: prev.currentRound,
            metricsBefore,
            metricsAfter,
            allocations: { ...prev.allocations },
            events: triggeredDisasters.length > 0 ? triggeredDisasters : undefined,
          },
        ];
      }

      // Update global disaster events list
      const updatedDisasterEvents = [...prev.disasterEvents];
      triggeredDisasters.forEach((disaster) => {
        // Only add if not already in the list (prevent duplicates on re-run)
        if (!updatedDisasterEvents.some((d) => d.id === disaster.id && d.round === disaster.round)) {
          updatedDisasterEvents.push(disaster);
        }
      });

      return {
        ...prev,
        metrics: metricsAfter,
        roundHistory: updatedHistory,
        disasterEvents: updatedDisasterEvents,
        isGameComplete: prev.currentRound === 3, // Mark game complete when Round 3 is run
      };
    });
  }, [cards, config]);

  const nextRound = useCallback(() => {
    setGameState((prev) => {
      const nextRoundNum = prev.currentRound + 1;
      if (nextRoundNum > 3) return prev;

      // Keep half of previous allocations for reallocation (rounds 2 and 3)
      const keptAllocations =
        nextRoundNum > 1
          ? Object.fromEntries(
              Object.entries(prev.allocations).map(([cardId, tokens]) => [
                cardId,
                Math.floor(tokens * 0.5),
              ])
            )
          : {};

      // Calculate how many tokens are in the carryover
      const carryoverTotal = Object.values(keptAllocations).reduce((sum, t) => sum + t, 0);

      // Total tokens = base for this round + carryover tokens
      // The carryover tokens are already allocated in keptAllocations
      const totalBudget = TOKENS_PER_ROUND[nextRoundNum - 1] + carryoverTotal;

      return {
        ...prev,
        currentRound: nextRoundNum,
        tokensAvailable: totalBudget,
        allocations: keptAllocations,
      };
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear game state from localStorage:', e);
    }
    setGameState({
      currentRound: 1,
      metrics: { ...INITIAL_METRICS },
      tokensAvailable: TOKENS_PER_ROUND[0],
      allocations: {},
      roundHistory: [],
      disasterEvents: [],
      preMortemAnswer: null,
      isGameComplete: false,
    });
  }, []);

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
        allocateTokens,
        runPlan,
        nextRound,
        reset,
        resetRound,
        canRunPlan,
        setPreMortemAnswer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
