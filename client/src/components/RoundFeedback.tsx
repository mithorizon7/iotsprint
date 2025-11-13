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

  // Generate feedback based on changes
  const feedbackItems: Array<{ icon: React.ReactNode; message: string; type: 'positive' | 'warning' | 'neutral' }> = [];

  if (delta.visibility_insight >= 8) {
    feedbackItems.push({
      icon: <TrendingUp className="w-5 h-5" />,
      message: t('feedback.highVisibility', { example: 'Siemens digital twin' }),
      type: 'positive',
    });
  }

  if (delta.efficiency_throughput >= 8) {
    feedbackItems.push({
      icon: <TrendingUp className="w-5 h-5" />,
      message: t('feedback.highEfficiency', { example: 'Airbus smart tools' }),
      type: 'positive',
    });
  }

  if (delta.sustainability_emissions >= 8) {
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" />,
      message: t('feedback.highSustainability', { example: 'Bosch Energy Platform' }),
      type: 'positive',
    });
  }

  if (delta.early_warning_prevention >= 8) {
    feedbackItems.push({
      icon: <CheckCircle className="w-5 h-5" />,
      message: t('feedback.highEarlyWarning', { example: 'Rio Tinto predictive maintenance' }),
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
            Year {currentRound} Results
          </h2>
          <p className="text-muted-foreground">
            See how your IoT investments changed the organization
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Before</h3>
            <MetricsPanel metrics={metricsBefore} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">After</h3>
            <MetricsPanel
              metrics={metricsAfter}
              previousMetrics={metricsBefore}
              animate={true}
            />
          </Card>
        </div>

        {feedbackItems.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
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
