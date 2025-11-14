import { useTranslation } from 'react-i18next';
import { GameMetrics, calculateMetricsDelta } from '@shared/schema';
import { MetricsPanel } from './MetricsPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

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

  const delta = calculateMetricsDelta(metricsBefore, metricsAfter);

  // Map card IDs to their translation keys for company examples
  const cardExampleKeys: Record<string, string> = {
    smartTools: 'feedback.airbus',
    warehouseFlow: 'feedback.logidot',
    energyMonitoring: 'feedback.bosch',
    smartBuilding: 'feedback.att',
    fleetOptimization: 'feedback.microsoft',
    predictiveMaintenance: 'feedback.rioTinto',
    digitalTwin: 'feedback.siemens',
    emissionsDetection: 'feedback.marathon',
    waterMonitoring: 'feedback.seattle',
    gridSensors: 'feedback.tensio',
    healthMonitoring: 'feedback.healthTech',
  };

  // Find which cards were invested in to provide specific feedback
  const investedCards = Object.entries(allocations)
    .filter(([, tokens]) => tokens > 0)
    .map(([cardId]) => cardId);

  // Generate feedback based on changes
  const feedbackItems: Array<{ icon: React.ReactNode; message: string; type: 'positive' | 'warning' | 'neutral' }> = [];

  if (delta.visibility_insight >= 8) {
    const relevantCard = investedCards.find(id => ['digitalTwin', 'warehouseFlow', 'gridSensors', 'emissionsDetection'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultTracking');
    feedbackItems.push({
      icon: <TrendingUp className="w-5 h-5" />,
      message: t('feedback.highVisibility', { example }),
      type: 'positive',
    });
  }

  if (delta.efficiency_throughput >= 8) {
    const relevantCard = investedCards.find(id => ['smartTools', 'warehouseFlow', 'fleetOptimization'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultAutomation');
    feedbackItems.push({
      icon: <TrendingUp className="w-5 h-5" />,
      message: t('feedback.highEfficiency', { example }),
      type: 'positive',
    });
  }

  if (delta.sustainability_emissions >= 8) {
    const relevantCard = investedCards.find(id => ['energyMonitoring', 'smartBuilding', 'fleetOptimization', 'emissionsDetection'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultEnergy');
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" />,
      message: t('feedback.highSustainability', { example }),
      type: 'positive',
    });
  }

  if (delta.early_warning_prevention >= 8) {
    const relevantCard = investedCards.find(id => ['predictiveMaintenance', 'healthMonitoring', 'gridSensors', 'waterMonitoring'].includes(id));
    const example = relevantCard ? t(cardExampleKeys[relevantCard]) : t('feedback.defaultPredictive');
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" />,
      message: t('feedback.highEarlyWarning', { example }),
      type: 'positive',
    });
  }

  if (delta.complexity_risk >= 10) {
    const deviceCount = Object.values(allocations).reduce((sum, t) => sum + t, 0) * 50;
    feedbackItems.push({
      icon: <AlertCircle className="w-5 h-5" />,
      message: t('feedback.highComplexity', { deviceCount }),
      type: 'warning',
    });
  }

  if (metricsAfter.complexity_risk > 60 && delta.early_warning_prevention < 5) {
    feedbackItems.push({
      icon: <TrendingDown className="w-5 h-5" />,
      message: t('feedback.complexityWarning'),
      type: 'warning',
    });
  }

  // Balanced growth check
  const allPositive = [delta.visibility_insight, delta.efficiency_throughput, delta.sustainability_emissions, delta.early_warning_prevention].every(d => d > 3);
  if (allPositive && delta.complexity_risk < 8) {
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" />,
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
                      ? 'bg-chart-3/10 text-chart-3'
                      : item.type === 'warning'
                      ? 'bg-chart-5/10 text-chart-5'
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
