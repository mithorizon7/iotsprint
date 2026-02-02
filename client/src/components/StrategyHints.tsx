import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingUp, Shield, Leaf, Eye, Zap } from 'lucide-react';
import { GameMetrics } from '@shared/schema';

interface StrategyHintsProps {
  metrics: GameMetrics;
  allocations: Record<string, number>;
  currentRound: number;
}

interface Hint {
  id: string;
  icon: typeof AlertCircle;
  messageKey: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
}

export function StrategyHints({ metrics, allocations, currentRound }: StrategyHintsProps) {
  const { t } = useTranslation();

  const hints = useMemo(() => {
    const activeHints: Hint[] = [];
    const totalAllocated = Object.values(allocations).reduce((sum, t) => sum + t, 0);

    if (metrics.complexity_risk > 50 && currentRound >= 2) {
      activeHints.push({
        id: 'high-complexity',
        icon: AlertCircle,
        messageKey: 'hints.highComplexity',
        priority: 'high',
        color: 'text-destructive',
      });
    }

    if (metrics.visibility_insight < 30 && currentRound >= 2) {
      activeHints.push({
        id: 'low-visibility',
        icon: Eye,
        messageKey: 'hints.lowVisibility',
        priority: 'medium',
        color: 'text-orange-500',
      });
    }

    if (metrics.efficiency_throughput < 30 && currentRound >= 2) {
      activeHints.push({
        id: 'low-efficiency',
        icon: Zap,
        messageKey: 'hints.lowEfficiency',
        priority: 'medium',
        color: 'text-yellow-500',
      });
    }

    if (metrics.sustainability_emissions < 25 && currentRound >= 2) {
      activeHints.push({
        id: 'low-sustainability',
        icon: Leaf,
        messageKey: 'hints.lowSustainability',
        priority: 'medium',
        color: 'text-green-500',
      });
    }

    if (metrics.early_warning_prevention < 20 && currentRound >= 2) {
      activeHints.push({
        id: 'low-early-warning',
        icon: Shield,
        messageKey: 'hints.lowEarlyWarning',
        priority: 'medium',
        color: 'text-blue-500',
      });
    }

    if (totalAllocated === 0 && currentRound === 1) {
      activeHints.push({
        id: 'no-allocation',
        icon: TrendingUp,
        messageKey: 'hints.noAllocation',
        priority: 'low',
        color: 'text-muted-foreground',
      });
    }

    const uniqueCards = Object.keys(allocations).filter((k) => allocations[k] > 0).length;
    if (uniqueCards >= 5 && currentRound >= 2) {
      activeHints.push({
        id: 'too-spread',
        icon: AlertCircle,
        messageKey: 'hints.tooSpread',
        priority: 'medium',
        color: 'text-orange-500',
      });
    }

    activeHints.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return activeHints.slice(0, 2);
  }, [metrics, allocations, currentRound]);

  if (hints.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="strategy-hints">
      <AnimatePresence mode="popLayout">
        {hints.map((hint, index) => {
          const Icon = hint.icon;
          return (
            <motion.div
              key={hint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              data-testid={`hint-${hint.id}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${hint.color}`} />
              <p className="text-sm text-muted-foreground">{t(hint.messageKey)}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
