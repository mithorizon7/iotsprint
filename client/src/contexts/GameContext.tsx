import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  GameState,
  GameMetrics,
  INITIAL_METRICS,
  TOKENS_PER_ROUND,
  clampMetrics,
  CardConfig,
  GameConfig,
  evaluateUnlockCondition,
} from '@shared/schema';

interface GameContextType {
  gameState: GameState;
  allCards: CardConfig[]; // All cards in the game
  availableCards: CardConfig[]; // Cards available in current round
  config: GameConfig; // Game configuration with tunable thresholds
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
  config: GameConfig;
}

export function GameProvider({ children, cards, config }: GameProviderProps) {
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
    return evaluateUnlockCondition(card.unlockCondition, gameState.metrics, gameState.allocations, config);
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
          },
        ];
      }

      return {
        ...prev,
        metrics: metricsAfter,
        roundHistory: updatedHistory,
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
        allCards: cards,
        availableCards,
        config,
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
