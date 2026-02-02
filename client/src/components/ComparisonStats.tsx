import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, Users } from 'lucide-react';
import { GameMetrics } from '@shared/schema';

interface ComparisonStatsProps {
  metrics: GameMetrics;
}

const AVERAGE_METRICS: GameMetrics = {
  visibility_insight: 48,
  efficiency_throughput: 52,
  sustainability_emissions: 42,
  early_warning_prevention: 38,
  complexity_risk: 45,
};

interface MetricComparison {
  key: keyof GameMetrics;
  labelKey: string;
  value: number;
  average: number;
  difference: number;
  percentile: number;
  isPositiveWhenHigher: boolean;
}

export function ComparisonStats({ metrics }: ComparisonStatsProps) {
  const { t } = useTranslation();

  const comparisons = useMemo((): MetricComparison[] => {
    const calculatePercentile = (
      value: number,
      average: number,
      isPositiveWhenHigher: boolean,
    ): number => {
      const deviation = average * 0.2;
      const normalizedDiff = (value - average) / deviation;
      const percentile = 50 + normalizedDiff * 15;
      const clampedPercentile = Math.max(5, Math.min(95, percentile));
      return isPositiveWhenHigher ? clampedPercentile : 100 - clampedPercentile;
    };

    return [
      {
        key: 'visibility_insight',
        labelKey: 'metrics.visibility.label',
        value: metrics.visibility_insight,
        average: AVERAGE_METRICS.visibility_insight,
        difference: metrics.visibility_insight - AVERAGE_METRICS.visibility_insight,
        percentile: calculatePercentile(
          metrics.visibility_insight,
          AVERAGE_METRICS.visibility_insight,
          true,
        ),
        isPositiveWhenHigher: true,
      },
      {
        key: 'efficiency_throughput',
        labelKey: 'metrics.efficiency.label',
        value: metrics.efficiency_throughput,
        average: AVERAGE_METRICS.efficiency_throughput,
        difference: metrics.efficiency_throughput - AVERAGE_METRICS.efficiency_throughput,
        percentile: calculatePercentile(
          metrics.efficiency_throughput,
          AVERAGE_METRICS.efficiency_throughput,
          true,
        ),
        isPositiveWhenHigher: true,
      },
      {
        key: 'sustainability_emissions',
        labelKey: 'metrics.sustainability.label',
        value: metrics.sustainability_emissions,
        average: AVERAGE_METRICS.sustainability_emissions,
        difference: metrics.sustainability_emissions - AVERAGE_METRICS.sustainability_emissions,
        percentile: calculatePercentile(
          metrics.sustainability_emissions,
          AVERAGE_METRICS.sustainability_emissions,
          true,
        ),
        isPositiveWhenHigher: true,
      },
      {
        key: 'early_warning_prevention',
        labelKey: 'metrics.earlyWarning.label',
        value: metrics.early_warning_prevention,
        average: AVERAGE_METRICS.early_warning_prevention,
        difference: metrics.early_warning_prevention - AVERAGE_METRICS.early_warning_prevention,
        percentile: calculatePercentile(
          metrics.early_warning_prevention,
          AVERAGE_METRICS.early_warning_prevention,
          true,
        ),
        isPositiveWhenHigher: true,
      },
      {
        key: 'complexity_risk',
        labelKey: 'metrics.complexity.label',
        value: metrics.complexity_risk,
        average: AVERAGE_METRICS.complexity_risk,
        difference: metrics.complexity_risk - AVERAGE_METRICS.complexity_risk,
        percentile: calculatePercentile(
          metrics.complexity_risk,
          AVERAGE_METRICS.complexity_risk,
          false,
        ),
        isPositiveWhenHigher: false,
      },
    ];
  }, [metrics]);

  const getComparisonColor = (difference: number, isPositiveWhenHigher: boolean): string => {
    const isGood = isPositiveWhenHigher ? difference > 0 : difference < 0;
    if (Math.abs(difference) < 3) return 'text-muted-foreground';
    return isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getComparisonIcon = (difference: number) => {
    if (Math.abs(difference) < 3) return <Minus className="w-4 h-4" />;
    const isUp = difference > 0;
    if (isUp) return <ArrowUp className="w-4 h-4" />;
    return <ArrowDown className="w-4 h-4" />;
  };

  return (
    <Card className="p-6" data-testid="comparison-stats">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">{t('comparison.title')}</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{t('comparison.description')}</p>

      <div className="space-y-3">
        {comparisons.map((comparison, index) => (
          <motion.div
            key={comparison.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            data-testid={`comparison-${comparison.key}`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{t(comparison.labelKey)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {t('comparison.yourScore')}: <strong>{comparison.value}%</strong>
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('comparison.average')}: {comparison.average}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 ${getComparisonColor(comparison.difference, comparison.isPositiveWhenHigher)}`}
              >
                {getComparisonIcon(comparison.difference)}
                <span className="text-sm font-medium">
                  {comparison.difference > 0 ? '+' : ''}
                  {comparison.difference}%
                </span>
              </div>

              <div className="text-right min-w-[60px]">
                <p className="text-xs text-muted-foreground">{t('comparison.percentile')}</p>
                <p className="text-sm font-bold text-primary">
                  {t('comparison.top', { percent: Math.round(100 - comparison.percentile) })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
