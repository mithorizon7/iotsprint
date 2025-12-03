import { useTranslation } from 'react-i18next';
import { GameMetrics } from '@shared/schema';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

interface MetricsPanelProps {
  metrics: GameMetrics;
  previousMetrics?: GameMetrics;
  animate?: boolean;
}

export function MetricsPanel({ metrics, previousMetrics, animate = false }: MetricsPanelProps) {
  const { t } = useTranslation();

  const metricConfigs = [
    {
      key: 'visibility_insight',
      label: t('metrics.visibility.label'),
      tooltip: t('metrics.visibility.tooltip'),
      color: 'hsl(var(--chart-1))',
      testId: 'visibility',
    },
    {
      key: 'efficiency_throughput',
      label: t('metrics.efficiency.label'),
      tooltip: t('metrics.efficiency.tooltip'),
      color: 'hsl(var(--chart-2))',
      testId: 'efficiency',
    },
    {
      key: 'sustainability_emissions',
      label: t('metrics.sustainability.label'),
      tooltip: t('metrics.sustainability.tooltip'),
      color: 'hsl(var(--chart-3))',
      testId: 'sustainability',
    },
    {
      key: 'early_warning_prevention',
      label: t('metrics.earlyWarning.label'),
      tooltip: t('metrics.earlyWarning.tooltip'),
      color: 'hsl(var(--chart-4))',
      testId: 'early-warning',
    },
    {
      key: 'complexity_risk',
      label: t('metrics.complexity.label'),
      tooltip: t('metrics.complexity.tooltip'),
      color: 'hsl(var(--chart-5))',
      testId: 'complexity',
      inverse: true, // Lower is better
    },
  ];

  return (
    <div className="space-y-4">
      {metricConfigs.map((config) => {
        const value = metrics[config.key as keyof GameMetrics];
        const previousValue = previousMetrics?.[config.key as keyof GameMetrics] ?? value;
        
        return (
          <MetricBar
            key={config.key}
            label={config.label}
            tooltip={config.tooltip}
            value={value}
            previousValue={previousValue}
            color={config.color}
            testId={config.testId}
            inverse={config.inverse}
            animate={animate}
          />
        );
      })}
    </div>
  );
}

interface MetricBarProps {
  label: string;
  tooltip: string;
  value: number;
  previousValue: number;
  color: string;
  testId: string;
  inverse?: boolean;
  animate?: boolean;
}

function MetricBar({
  label,
  tooltip,
  value,
  previousValue,
  color,
  testId,
  inverse = false,
  animate = false,
}: MetricBarProps) {
  const { t } = useTranslation();
  const [displayValue, setDisplayValue] = useState(previousValue);

  useEffect(() => {
    if (animate) {
      const duration = 300;
      const steps = 20;
      const increment = (value - previousValue) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(previousValue + increment * currentStep);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue, animate]);

  const delta = value - previousValue;
  const percentage = Math.round(displayValue);

  return (
    <div className="space-y-2" data-testid={`metric-${testId}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('accessibility.metricInfo', { label })}
                data-testid={`button-info-${testId}`}
              >
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold font-mono"
            data-testid={`text-value-${testId}`}
          >
            {percentage}
          </span>
          {animate && delta !== 0 && (
            <span
              className={`text-sm font-medium ${
                (inverse ? delta < 0 : delta > 0) ? 'text-chart-3' : 'text-chart-5'
              }`}
              data-testid={`text-delta-${testId}`}
            >
              {delta > 0 ? '+' : ''}
              {Math.round(delta)}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
          data-testid={`bar-${testId}`}
        />
      </div>
    </div>
  );
}
