import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { GameMetrics, RoundHistoryEntry, CardConfig } from '@shared/schema';

interface JourneyTimelineProps {
  roundHistory: RoundHistoryEntry[];
  cards: CardConfig[];
  finalMetrics: GameMetrics;
}

export function JourneyTimeline({ roundHistory, cards, finalMetrics }: JourneyTimelineProps) {
  const { t } = useTranslation();

  const cardTitleMap = useMemo(() => {
    return cards.reduce((acc, card) => {
      acc[card.id] = t(card.copyKeys.title);
      return acc;
    }, {} as Record<string, string>);
  }, [cards, t]);

  const metricKeys: (keyof GameMetrics)[] = [
    'visibility_insight',
    'efficiency_throughput',
    'sustainability_emissions',
    'early_warning_prevention',
    'complexity_risk',
  ];

  const metricLabels: Record<keyof GameMetrics, string> = {
    visibility_insight: t('metrics.visibility.label'),
    efficiency_throughput: t('metrics.efficiency.label'),
    sustainability_emissions: t('metrics.sustainability.label'),
    early_warning_prevention: t('metrics.earlyWarning.label'),
    complexity_risk: t('metrics.complexity.label'),
  };

  const getMetricTrend = (before: number, after: number, isInverse = false) => {
    const delta = after - before;
    if (Math.abs(delta) < 1) return { icon: Minus, color: 'text-muted-foreground', delta: 0 };
    const isPositive = isInverse ? delta < 0 : delta > 0;
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-chart-3' : 'text-chart-5',
      delta: Math.round(delta),
    };
  };

  return (
    <Card className="p-4 sm:p-6" data-testid="journey-timeline">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {t('summary.journeyTitle')}
      </h3>

      <div className="space-y-6">
        {roundHistory.map((round, roundIndex) => {
          const topInvestments = Object.entries(round.allocations)
            .filter(([, tokens]) => tokens > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          const hadDisaster = round.events && round.events.length > 0;

          return (
            <motion.div
              key={round.round}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: roundIndex * 0.1 }}
              className="relative"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${hadDisaster 
                      ? 'bg-destructive/10 text-destructive border-2 border-destructive' 
                      : 'bg-primary/10 text-primary border-2 border-primary'
                    }
                  `}>
                    {round.round}
                  </div>
                  {roundIndex < roundHistory.length - 1 && (
                    <div className="w-0.5 h-full min-h-[60px] bg-border mt-2" />
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">
                      {t('dashboard.roundTitle', { round: round.round })}
                    </h4>
                    {hadDisaster && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t('summary.disasterOccurred')}
                      </Badge>
                    )}
                  </div>

                  {topInvestments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {t('summary.keyInvestments')}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {topInvestments.map(([cardId, tokens]) => (
                          <Badge key={cardId} variant="secondary" className="text-xs">
                            {cardTitleMap[cardId]} ({tokens})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {metricKeys.map(metric => {
                      const trend = getMetricTrend(
                        round.metricsBefore[metric],
                        round.metricsAfter[metric],
                        metric === 'complexity_risk'
                      );
                      const TrendIcon = trend.icon;

                      return (
                        <div
                          key={metric}
                          className="flex items-center gap-1 text-xs"
                        >
                          <TrendIcon className={`w-3 h-3 ${trend.color}`} />
                          <span className="text-muted-foreground truncate">
                            {metricLabels[metric].split(' ')[0]}
                          </span>
                          <span className={`font-mono ${trend.color}`}>
                            {trend.delta > 0 ? '+' : ''}{trend.delta}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: roundHistory.length * 0.1 }}
          className="pt-4 border-t border-border"
        >
          <h4 className="font-medium mb-3">{t('summary.finalState')}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metricKeys.map(metric => {
              const value = Math.round(finalMetrics[metric]);
              const isGood = metric === 'complexity_risk' ? value < 40 : value > 50;

              return (
                <div
                  key={metric}
                  className={`
                    p-2 rounded-lg text-center
                    ${isGood ? 'bg-chart-3/10' : 'bg-muted'}
                  `}
                >
                  <p className="text-xs text-muted-foreground truncate">
                    {metricLabels[metric].split('&')[0].trim()}
                  </p>
                  <p className={`text-lg font-bold font-mono ${
                    isGood ? 'text-chart-3' : 'text-foreground'
                  }`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </Card>
  );
}
