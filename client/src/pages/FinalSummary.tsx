import { useTranslation } from 'react-i18next';
import { GameMetrics } from '@shared/schema';
import { MetricsPanel } from '@/components/MetricsPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { classifyArchetype } from '@/lib/archetypes';
import { Trophy, RotateCcw, TrendingUp } from 'lucide-react';

interface RoundHistory {
  round: number;
  allocations: Record<string, number>;
  metricsAfter: GameMetrics;
}

interface FinalSummaryProps {
  metrics: GameMetrics;
  roundHistory?: RoundHistory[];
  finalAllocations?: Record<string, number>;
  onReplay: () => void;
}

export function FinalSummary({ metrics, roundHistory = [], finalAllocations = {}, onReplay }: FinalSummaryProps) {
  const { t } = useTranslation();

  const archetypeId = classifyArchetype(metrics);
  const archetypeTitle = t(`archetypes.${archetypeId}.title`);
  const archetypeDescription = t(`archetypes.${archetypeId}.description`);
  const archetypeSuggestions = t(`archetypes.${archetypeId}.suggestions`);

  // Map card IDs to company names for strategy synthesis
  const cardToCompany: Record<string, string> = {
    smartTools: 'Airbus',
    warehouseFlow: 'Logidot',
    energyMonitoring: 'Bosch',
    smartBuilding: 'AT&T',
    fleetOptimization: 'Microsoft',
    predictiveMaintenance: 'Rio Tinto',
    digitalTwin: 'Siemens',
    emissionsDetection: 'Marathon Oil',
    waterMonitoring: 'Seattle',
    gridSensors: 'Tensio',
    healthMonitoring: 'Health Tech',
  };

  // Use the explicitly passed final allocations (true end state after all rounds)
  const topInvestments = Object.entries(finalAllocations || {})
    .filter(([, tokens]) => tokens > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cardId, tokens]) => ({
      cardId,
      tokens,
      title: t(`cards.${cardId}.title`),
      company: cardToCompany[cardId] || '',
    }));

  // Identify strengths and weaknesses
  const metricScores = [
    { key: 'visibility', value: metrics.visibility_insight, label: t('metrics.visibility.label') },
    { key: 'efficiency', value: metrics.efficiency_throughput, label: t('metrics.efficiency.label') },
    { key: 'sustainability', value: metrics.sustainability_emissions, label: t('metrics.sustainability.label') },
    { key: 'earlyWarning', value: metrics.early_warning_prevention, label: t('metrics.earlyWarning.label') },
  ];

  const sortedMetrics = [...metricScores].sort((a, b) => b.value - a.value);
  const strengths = sortedMetrics.slice(0, 2);
  const weaknesses = sortedMetrics.slice(-2);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold" data-testid="text-summary-title">
            {t('summary.title')}
          </h1>
        </div>

        <Card className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('summary.archetypeLabel')}
            </p>
            <h2 className="text-3xl font-bold text-primary" data-testid="text-archetype-title">
              {archetypeTitle}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-archetype-description">
              {archetypeDescription}
            </p>
          </div>

          <div className="pt-6 border-t border-card-border">
            <h3 className="text-lg font-semibold mb-4" data-testid="text-final-metrics-title">
              {t('summary.finalMetricsTitle')}
            </h3>
            <MetricsPanel metrics={metrics} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-chart-3" />
                {t('summary.whatYouPrioritized')}
              </h4>
              <div className="space-y-2">
                {strengths.map((metric) => (
                  <div key={metric.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <Badge variant="secondary" className="font-mono">
                      {Math.round(metric.value)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted" />
                {t('summary.whereYouLeftValue')}
              </h4>
              <div className="space-y-2">
                {weaknesses.map((metric) => (
                  <div key={metric.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <Badge variant="outline" className="font-mono">
                      {Math.round(metric.value)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {topInvestments.length > 0 && (
            <div className="pt-6 border-t border-card-border">
              <h4 className="text-base font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                Your IoT Strategy
              </h4>
              <div className="space-y-2">
                {topInvestments.map((investment) => (
                  <div 
                    key={investment.cardId} 
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-accent/20"
                    data-testid={`strategy-${investment.cardId}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{investment.title}</span>
                      {investment.company && (
                        <span className="text-xs text-muted-foreground">
                          Similar to {investment.company}'s approach
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {investment.tokens} tokens
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-card-border">
            <div className="bg-accent/30 rounded-lg p-4">
              <p className="text-sm text-foreground leading-relaxed" data-testid="text-suggestions">
                {archetypeSuggestions}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-center text-sm text-muted-foreground italic mb-4" data-testid="text-reflection">
              {t('summary.reflectionPrompt')}
            </p>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="default"
            onClick={onReplay}
            className="px-8 gap-2"
            data-testid="button-replay"
          >
            <RotateCcw className="w-4 h-4" />
            {t('summary.replayButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
