import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  GameState,
  GameMetrics,
  INITIAL_METRICS,
  TOKENS_PER_ROUND,
  clampMetrics,
  CardConfig,
  evaluateUnlockCondition,
} from '@shared/schema';

interface GameContextType {
  gameState: GameState;
  availableCards: CardConfig[];
  allocateTokens: (cardId: string, tokens: number) => void;
  runPlan: () => void;
  nextRound: () => void;
  reset: () => void;
  canRunPlan: boolean;
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
}

export function GameProvider({ children, cards }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1, // Start at round 1 (after onboarding)
    metrics: { ...INITIAL_METRICS },
    tokensAvailable: TOKENS_PER_ROUND[0],
    allocations: {},
    roundHistory: [],
  });

  const availableCards = cards.filter((card) => {
    // Check if card is available in current round
    if (!card.roundsAvailable.includes(gameState.currentRound)) {
      return false;
    }

    // Check unlock condition using the centralized evaluation function
    return evaluateUnlockCondition(card.unlockCondition, gameState.metrics, gameState.allocations);
  });

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
      const metricsBefore = { ...prev.metrics };
      let newMetrics = { ...prev.metrics };

      // Calculate total tokens used across all cards
      const totalTokensUsed = Object.values(prev.allocations).reduce((sum, t) => sum + t, 0);

      // Apply per-token effects
      Object.entries(prev.allocations).forEach(([cardId, tokens]) => {
        if (tokens === 0) return;

        const card = cards.find((c) => c.id === cardId);
        if (!card) return;

        // Apply effects with diminishing returns after 3rd token
        for (let i = 0; i < tokens; i++) {
          const multiplier = i >= 3 ? 0.5 : 1;

          newMetrics.visibility_insight += card.perTokenEffects.visibility_insight * multiplier;
          newMetrics.efficiency_throughput += card.perTokenEffects.efficiency_throughput * multiplier;
          newMetrics.sustainability_emissions += card.perTokenEffects.sustainability_emissions * multiplier;
          newMetrics.early_warning_prevention += card.perTokenEffects.early_warning_prevention * multiplier;
          newMetrics.complexity_risk += card.perTokenEffects.complexity_risk * multiplier;
        }
      });

      // Global complexity penalty for IoT sprawl (if more than 12 total tokens used)
      if (totalTokensUsed > 12) {
        newMetrics.complexity_risk += (totalTokensUsed - 12) * 2;
      }

      // Clamp all metrics
      newMetrics = clampMetrics(newMetrics);

      return {
        ...prev,
        metrics: newMetrics,
        roundHistory: [
          ...prev.roundHistory,
          {
            round: prev.currentRound,
            metricsBefore,
            metricsAfter: newMetrics,
            allocations: { ...prev.allocations },
          },
        ],
      };
    });
  }, [cards]);

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
    setGameState({
      currentRound: 1, // Reset to round 1
      metrics: { ...INITIAL_METRICS },
      tokensAvailable: TOKENS_PER_ROUND[0],
      allocations: {},
      roundHistory: [],
    });
  }, []);

  const tokensUsed = Object.values(gameState.allocations).reduce((sum, t) => sum + t, 0);
  const canRunPlan = tokensUsed > 0;

  return (
    <GameContext.Provider
      value={{
        gameState,
        availableCards,
        allocateTokens,
        runPlan,
        nextRound,
        reset,
        canRunPlan,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
