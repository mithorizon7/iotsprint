import { useTranslation } from 'react-i18next';
import { useGame } from '@/contexts/GameContext';
import { MetricsPanel } from '@/components/MetricsPanel';
import { InitiativeCard } from '@/components/InitiativeCard';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { RoundFeedback } from '@/components/RoundFeedback';
import { GameMetrics } from '@shared/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface RoundHistory {
  round: number;
  allocations: Record<string, number>;
  metricsAfter: GameMetrics;
}

interface GameDashboardProps {
  onComplete: (metrics: GameMetrics, roundHistory: RoundHistory[], finalAllocations: Record<string, number>) => void;
}

export function GameDashboard({ onComplete }: GameDashboardProps) {
  const { t } = useTranslation();
  const { gameState, availableCards, allocateTokens, runPlan, nextRound, canRunPlan } = useGame();
  const [showFeedback, setShowFeedback] = useState(false);
  const [previousMetrics, setPreviousMetrics] = useState(gameState.metrics);

  const tokensUsed = Object.values(gameState.allocations).reduce((sum, t) => sum + t, 0);
  const tokensRemaining = gameState.tokensAvailable - tokensUsed;

  // Calculate actual carryover tokens from previous round (50% of previous allocations)
  const previousRoundAllocations = gameState.roundHistory.length > 0
    ? gameState.roundHistory[gameState.roundHistory.length - 1].allocations
    : {};
  const carryoverTokens = gameState.currentRound > 1
    ? Object.values(previousRoundAllocations).reduce((sum, t) => sum + Math.floor(t * 0.5), 0)
    : 0;
  
  const baseTokens = gameState.currentRound === 1 
    ? 10 
    : 5;
  const newTokensThisRound = gameState.currentRound > 1 
    ? baseTokens 
    : 0;

  const handleRunPlan = () => {
    setPreviousMetrics(gameState.metrics);
    runPlan();
    setShowFeedback(true);
  };

  const handleNextRound = () => {
    setShowFeedback(false);
    
    // Check if we've completed all 3 rounds
    if (gameState.roundHistory.length === 3) {
      // All rounds complete, show final summary
      // Pass final allocations (current state after Round 3)
      onComplete(gameState.metrics, gameState.roundHistory, gameState.allocations);
    } else {
      // Move to next round
      nextRound();
    }
  };

  // Get event message for current round
  const getEventMessage = () => {
    if (gameState.currentRound === 1) {
      return null; // No event for round 1
    }

    const { metrics } = gameState;

    if (gameState.currentRound === 2) {
      if (metrics.complexity_risk > 40) {
        return t('events.round2.highComplexity');
      }
      if (metrics.efficiency_throughput < 40) {
        return t('events.round2.lowEfficiency');
      }
      if (metrics.sustainability_emissions < 40) {
        return t('events.round2.lowSustainability');
      }
      if (metrics.early_warning_prevention < 30) {
        return t('events.round2.lowEarlyWarning');
      }
      return t('events.round2.general');
    }

    if (gameState.currentRound === 3) {
      if (metrics.complexity_risk > 60) {
        return t('events.round3.highRisk');
      }
      const totalTokens = gameState.roundHistory.reduce(
        (sum, round) => sum + Object.values(round.allocations).reduce((s, t) => s + t, 0),
        0
      );
      if (totalTokens > 15) {
        return t('events.round3.overIoT');
      }
      const avgScore = (
        metrics.visibility_insight +
        metrics.efficiency_throughput +
        metrics.sustainability_emissions +
        metrics.early_warning_prevention
      ) / 4;
      if (avgScore > 55) {
        return t('events.round3.nearTarget');
      }
      return t('events.round3.general');
    }

    return null;
  };

  const eventMessage = getEventMessage();

  if (showFeedback) {
    return (
      <RoundFeedback
        currentRound={gameState.currentRound}
        metricsBefore={previousMetrics}
        metricsAfter={gameState.metrics}
        allocations={gameState.allocations}
        onNext={handleNextRound}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-bold" data-testid="text-round-title">
              {t('dashboard.roundTitle', { round: gameState.currentRound })}
            </h2>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-lg font-mono font-bold" data-testid="text-tokens-remaining">
                  {tokensRemaining}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.tokensAvailable', { count: tokensRemaining })}
                </span>
              </div>
              {gameState.currentRound > 1 && (
                <div className="text-xs text-muted-foreground" data-testid="text-token-breakdown">
                  {carryoverTokens} reallocatable + {newTokensThisRound} new = {gameState.tokensAvailable} total
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {eventMessage && (
          <Alert className="mb-6" data-testid="alert-event">
            <Info className="h-4 w-4" />
            <AlertDescription>{eventMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-[350px_1fr] gap-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-card border border-card-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6" data-testid="text-metrics-title">
                Organization Metrics
              </h3>
              <MetricsPanel metrics={gameState.metrics} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold" data-testid="text-initiatives-title">
                IoT Initiatives
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-instructions">
                {t('dashboard.instructions')}
              </p>
              {gameState.currentRound > 1 && (
                <Alert className="mt-2" data-testid="alert-reallocation">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Reallocation:</strong> Half of your previous investments are available to reallocate. 
                    You also receive {newTokensThisRound} new tokens. Adjust your strategy based on your results.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {availableCards.map((card) => (
                <InitiativeCard
                  key={card.id}
                  card={card}
                  allocation={gameState.allocations[card.id] || 0}
                  onAllocate={(tokens) => allocateTokens(card.id, tokens)}
                  disabled={
                    tokensRemaining === 0 &&
                    (gameState.allocations[card.id] || 0) === 0
                  }
                />
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Button
                size="lg"
                onClick={handleRunPlan}
                disabled={!canRunPlan}
                className="px-12 text-base"
                data-testid="button-run-plan"
              >
                {t('dashboard.runPlanButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
