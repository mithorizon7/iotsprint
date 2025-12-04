import { useTranslation } from 'react-i18next';
import { GameMetrics, calculateMetricsDelta } from '@shared/schema';
import { MetricsPanel } from './MetricsPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

interface RoundFeedbackProps {
  currentRound: number;
  metricsBefore: GameMetrics;
  metricsAfter: GameMetrics;
  allocations: Record<string, number>;
  onNext: () => void;
}

export function RoundFeedback({
  currentRound,
  metricsBefore,
  metricsAfter,
  allocations,
  onNext,
}: RoundFeedbackProps) {
  const { t } = useTranslation();
  const { allCards, config, gameState } = useGame();
  
  // Check if any disasters occurred this round
  const currentRoundHistory = gameState.roundHistory.find(r => r.round === currentRound);
  const disasters = currentRoundHistory?.events || [];

  const delta = calculateMetricsDelta(metricsBefore, metricsAfter);
  const thresholds = config.feedbackThresholds;

  // Build dynamic mapping from card data
  const cardExampleKeys: Record<string, string> = allCards.reduce((acc, card) => {
    acc[card.id] = card.feedbackKey;
    return acc;
  }, {} as Record<string, string>);

  // Find which cards were invested in to provide specific feedback
  const investedCards = Object.entries(allocations)
    .filter(([, tokens]) => tokens > 0)
    .map(([cardId]) => cardId);

  // Generate feedback based on changes (using configurable thresholds)
  const feedbackItems: Array<{ icon: React.ReactNode; message: string; type: 'positive' | 'warning' | 'neutral' }> = [];

  if (delta.visibility_insight >= thresholds.highVisibilityDelta) {
    const relevantCard = investedCards.find(id => ['digitalTwin', 'warehouseFlow', 'gridSensors', 'emissionsDetection'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultTracking');
    feedbackItems.push({
      icon: <TrendingUp className="w-5 h-5" data-testid="icon-trending-up" />,
      message: t('feedback.highVisibility', { example }),
      type: 'positive',
    });
  }

  if (delta.efficiency_throughput >= thresholds.highEfficiencyDelta) {
    const relevantCard = investedCards.find(id => ['smartTools', 'warehouseFlow', 'fleetOptimization'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultAutomation');
    feedbackItems.push({
      icon: <TrendingUp className="w-5 h-5" data-testid="icon-trending-up" />,
      message: t('feedback.highEfficiency', { example }),
      type: 'positive',
    });
  }

  if (delta.sustainability_emissions >= thresholds.highSustainabilityDelta) {
    const relevantCard = investedCards.find(id => ['energyMonitoring', 'smartBuilding', 'fleetOptimization', 'emissionsDetection'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultEnergy');
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" data-testid="icon-check-circle" />,
      message: t('feedback.highSustainability', { example }),
      type: 'positive',
    });
  }

  if (delta.early_warning_prevention >= thresholds.highEarlyWarningDelta) {
    const relevantCard = investedCards.find(id => ['predictiveMaintenance', 'healthMonitoring', 'gridSensors', 'waterMonitoring'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultPredictive');
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" data-testid="icon-check-circle" />,
      message: t('feedback.highEarlyWarning', { example }),
      type: 'positive',
    });
  }

  if (delta.complexity_risk >= thresholds.highComplexityDelta) {
    const deviceCount = Object.values(allocations).reduce((sum, t) => sum + t, 0) * 50;
    feedbackItems.push({
      icon: <AlertCircle className="w-5 h-5" data-testid="icon-alert-circle" />,
      message: t('feedback.highComplexity', { deviceCount }),
      type: 'warning',
    });
  }

  if (metricsAfter.complexity_risk > thresholds.criticalComplexityAbsolute && delta.early_warning_prevention < thresholds.lowEarlyWarningDelta) {
    feedbackItems.push({
      icon: <TrendingDown className="w-5 h-5" data-testid="icon-trending-down" />,
      message: t('feedback.complexityWarning'),
      type: 'warning',
    });
  }

  // Balanced growth check
  const allPositive = [delta.visibility_insight, delta.efficiency_throughput, delta.sustainability_emissions, delta.early_warning_prevention].every(d => d > thresholds.balancedGrowthMinDelta);
  if (allPositive && delta.complexity_risk < thresholds.balancedGrowthMaxComplexity) {
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" data-testid="icon-check-circle" />,
      message: t('feedback.balancedGrowth'),
      type: 'positive',
    });
  }

  const nextButtonText =
    currentRound === 3
      ? t('dashboard.viewSummaryButton')
      : t('dashboard.nextRoundButton', { round: currentRound + 1 });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2" data-testid="text-feedback-title">
            {t('roundFeedback.title', { round: currentRound })}
          </h2>
          <p className="text-muted-foreground">
            {t('roundFeedback.subtitle')}
          </p>
        </div>

        {disasters.length > 0 && (
          <Card className="p-6 border-destructive bg-destructive/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="w-8 h-8 text-destructive" data-testid="icon-disaster" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-destructive mb-2" data-testid="text-disaster-title">
                  {t('disasters.criticalEvent')}
                </h3>
                {disasters.map((disaster, index) => (
                  <div key={index} className="space-y-2">
                    <p className="text-sm text-foreground leading-relaxed" data-testid={`text-disaster-${index}`}>
                      {t(disaster.copyKey)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {Object.entries(disaster.penalties).map(([metric, penalty]) => (
                        penalty !== undefined && (
                          <span key={metric} className="px-2 py-1 bg-destructive/10 rounded">
                            {t(`common.metrics.${metric}`)}: {penalty > 0 ? '+' : ''}{penalty}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('roundFeedback.before')}</h3>
            <MetricsPanel metrics={metricsBefore} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('roundFeedback.after')}</h3>
            <MetricsPanel
              metrics={metricsAfter}
              previousMetrics={metricsBefore}
              animate={true}
            />
          </Card>
        </div>

        {feedbackItems.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('roundFeedback.keyInsights')}</h3>
            <div className="space-y-3">
              {feedbackItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-md ${
                    item.type === 'positive'
                      ? 'bg-chart-3/10 dark:bg-chart-3/25 text-chart-3'
                      : item.type === 'warning'
                      ? 'bg-chart-5/10 dark:bg-chart-5/25 text-chart-5'
                      : 'bg-muted'
                  }`}
                  data-testid={`feedback-item-${index}`}
                >
                  <div className="mt-0.5">{item.icon}</div>
                  <p className="text-sm leading-relaxed flex-1 text-foreground">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onNext}
            className="px-12 text-base"
            data-testid="button-next-round"
          >
            {nextButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
