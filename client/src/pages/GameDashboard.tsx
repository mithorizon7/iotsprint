import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { getTokensPerRound } from '@shared/gameLogic';
import iotLogo from '@assets/internet-of-things_1764882370466.png';
import { MetricsPanel } from '@/components/MetricsPanel';
import { InitiativeCard } from '@/components/InitiativeCard';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { StrategyHints } from '@/components/StrategyHints';
import { TutorialTrigger } from '@/components/Tutorial';
import { TokenPool } from '@/components/TokenPool';
import { IoTLoopDashboard } from '@/components/IoTLoopDashboard';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { Button } from '@/components/ui/button';
import { Info, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { RoundFeedback } from '@/components/RoundFeedback';
import { GameMetrics, RoundHistoryEntry } from '@shared/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

interface GameDashboardProps {
  onComplete: (
    metrics: GameMetrics,
    roundHistory: RoundHistoryEntry[],
    finalAllocations: Record<string, number>,
  ) => void;
}

interface SynergyConfig {
  cardSynergies: Record<string, string[]>;
}

export function GameDashboard({ onComplete }: GameDashboardProps) {
  const { t } = useTranslation();
  const {
    gameState,
    availableCards,
    allCards,
    allocateTokens,
    runPlan,
    nextRound,
    canRunPlan,
    resetRound,
    difficulty,
    maxTokensPerCard,
  } = useGame();
  const [showFeedback, setShowFeedback] = useState(false);
  const [previousMetrics, setPreviousMetrics] = useState(gameState.metrics);
  const [synergies, setSynergies] = useState<SynergyConfig>({ cardSynergies: {} });

  useEffect(() => {
    fetch('/config/synergies.json')
      .then((res) => res.json())
      .then((data) => setSynergies(data))
      .catch((err) => console.error('Failed to load synergies:', err));
  }, []);

  const tokensUsed = Object.values(gameState.allocations).reduce((sum, t) => sum + t, 0);
  const tokensRemaining = Math.max(0, gameState.tokensAvailable - tokensUsed);

  const previousRoundAllocations =
    gameState.roundHistory.length > 0
      ? gameState.roundHistory[gameState.roundHistory.length - 1].allocations
      : {};
  const carryoverTokens =
    gameState.currentRound > 1
      ? Object.values(previousRoundAllocations).reduce((sum, t) => sum + Math.floor(t * 0.5), 0)
      : 0;

  const tokensPerRound = getTokensPerRound(difficulty);
  const baseTokens = tokensPerRound[gameState.currentRound - 1] ?? 0;
  const newTokensThisRound = gameState.currentRound > 1 ? baseTokens : 0;

  const handleRunPlan = () => {
    setPreviousMetrics(gameState.metrics);
    runPlan();
    setShowFeedback(true);
  };

  const handleNextRound = () => {
    setShowFeedback(false);

    if (gameState.isGameComplete) {
      onComplete(gameState.metrics, gameState.roundHistory, gameState.allocations);
    } else {
      nextRound();
    }
  };

  const handleResetRound = () => {
    if (resetRound) {
      resetRound();
    }
  };

  const getEventMessage = () => {
    if (gameState.currentRound === 1) {
      return null;
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
        0,
      );
      if (totalTokens > 15) {
        return t('events.round3.overIoT');
      }
      const avgScore =
        (metrics.visibility_insight +
          metrics.efficiency_throughput +
          metrics.sustainability_emissions +
          metrics.early_warning_prevention) /
        4;
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
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <img
                src={iotLogo}
                alt={t('game.title')}
                className="w-8 h-8 sm:w-10 sm:h-10"
                data-testid="img-logo"
              />
              <h2 className="text-xl sm:text-2xl font-bold truncate" data-testid="text-round-title">
                {t('dashboard.roundTitle', { round: gameState.currentRound })}
              </h2>
              <div className="hidden md:block">
                <ProgressIndicator currentRound={gameState.currentRound} showLabels={false} />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <TutorialTrigger />
              <GlossaryPanel variant="icon" />
              <ThemeToggle />
              <LanguageSwitcher />
              <TokenPool
                total={gameState.tokensAvailable}
                remaining={tokensRemaining}
                showBreakdown={gameState.currentRound > 1}
                carryover={carryoverTokens}
                newTokens={newTokensThisRound}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {eventMessage && (
          <Alert className="mb-6" data-testid="alert-event">
            <Info className="h-4 w-4" data-testid="icon-info" />
            <AlertDescription>{eventMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-[350px_1fr] gap-8">
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <div className="bg-card border border-card-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6" data-testid="text-metrics-title">
                {t('dashboard.metricsTitle')}
              </h3>
              <MetricsPanel metrics={gameState.metrics} />
            </div>

            <IoTLoopDashboard allocations={gameState.allocations} cards={allCards} />
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold" data-testid="text-initiatives-title">
                  {t('dashboard.initiativesTitle')}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-instructions">
                  {t('dashboard.instructions', { max: maxTokensPerCard })}
                </p>
              </div>
              {tokensUsed > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRound}
                  className="gap-2 shrink-0"
                  data-testid="button-reset-round"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('dashboard.resetRound')}
                </Button>
              )}
            </div>

            {gameState.currentRound > 1 && (
              <Alert data-testid="alert-reallocation">
                <Info className="h-4 w-4" data-testid="icon-info" />
                <AlertDescription className="text-xs">
                  {t('dashboard.reallocationAlert', { newTokens: newTokensThisRound })}
                </AlertDescription>
              </Alert>
            )}

            <StrategyHints
              metrics={gameState.metrics}
              allocations={gameState.allocations}
              currentRound={gameState.currentRound}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {availableCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <InitiativeCard
                    card={card}
                    allocation={gameState.allocations[card.id] || 0}
                    onAllocate={(tokens) => allocateTokens(card.id, tokens)}
                    disabled={tokensRemaining === 0 && (gameState.allocations[card.id] || 0) === 0}
                    synergies={synergies.cardSynergies[card.id] || []}
                    allCards={allCards}
                    maxTokensPerCard={maxTokensPerCard}
                  />
                </motion.div>
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
