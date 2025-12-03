import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GameMetrics, RoundHistoryEntry } from '@shared/schema';
import { MetricsPanel } from '@/components/MetricsPanel';
import { SocialShare } from '@/components/SocialShare';
import { ExportSummary } from '@/components/ExportSummary';
import { Achievements } from '@/components/Achievements';
import { ComparisonStats } from '@/components/ComparisonStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { classifyArchetype } from '@/lib/archetypes';
import { Trophy, RotateCcw, TrendingUp } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useGame } from '@/contexts/GameContext';

interface FinalSummaryProps {
  metrics: GameMetrics;
  roundHistory?: RoundHistoryEntry[];
  finalAllocations?: Record<string, number>;
  onReplay: () => void;
}

export function FinalSummary({ metrics, roundHistory = [], finalAllocations = {}, onReplay }: FinalSummaryProps) {
  const { t } = useTranslation();
  const { allCards } = useGame();

  const archetypeId = classifyArchetype(metrics);
  const archetypeTitle = t(`archetypes.${archetypeId}.title`);
  const archetypeDescription = t(`archetypes.${archetypeId}.description`);
  const archetypeSuggestions = t(`archetypes.${archetypeId}.suggestions`);

  // Build dynamic mapping from card data
  const cardToCompany: Record<string, string> = allCards.reduce((acc, card) => {
    acc[card.id] = card.companyName;
    return acc;
  }, {} as Record<string, string>);

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
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="fixed top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <motion.div 
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Trophy className="w-10 h-10 text-primary" data-testid="icon-trophy" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold" data-testid="text-summary-title">
            {t('summary.title')}
          </h1>
        </motion.div>

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
                <TrendingUp className="w-4 h-4 text-primary" data-testid="icon-trending-up" />
                {t('summary.yourStrategy')}
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
                          {t('summary.similarToApproach', { company: investment.company })}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {t('summary.tokensLabel', { count: investment.tokens })}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Achievements 
            metrics={metrics} 
            roundHistory={roundHistory} 
            allocations={finalAllocations} 
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ComparisonStats metrics={metrics} />
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex gap-2">
            <SocialShare 
              archetypeTitle={archetypeTitle} 
              archetypeId={archetypeId}
              metrics={metrics} 
            />
            <ExportSummary 
              metrics={metrics}
              archetypeTitle={archetypeTitle}
              archetypeDescription={archetypeDescription}
              roundHistory={roundHistory}
              topInvestments={topInvestments}
            />
          </div>
          <Button
            size="lg"
            variant="default"
            onClick={onReplay}
            className="px-8 gap-2"
            data-testid="button-replay"
          >
            <RotateCcw className="w-4 h-4" data-testid="icon-rotate-ccw" />
            {t('summary.replayButton')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
