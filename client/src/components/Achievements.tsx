import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Leaf, 
  Eye, 
  Zap, 
  Target, 
  Award,
  Trophy,
  Star,
  Lock
} from 'lucide-react';
import { GameMetrics, RoundHistoryEntry } from '@shared/schema';

interface AchievementsProps {
  metrics: GameMetrics;
  roundHistory: RoundHistoryEntry[];
  allocations: Record<string, number>;
}

interface Achievement {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  unlocked: boolean;
}

export function Achievements({ metrics, roundHistory, allocations }: AchievementsProps) {
  const { t } = useTranslation();

  const achievements = useMemo((): Achievement[] => {
    const totalTokensUsed = Object.values(allocations).reduce((sum, t) => sum + t, 0);
    const uniqueCards = Object.keys(allocations).filter((k) => allocations[k] > 0).length;
    
    const allRoundsComplete = roundHistory.length >= 3;

    return [
      {
        id: 'security-champion',
        titleKey: 'achievements.securityChampion.title',
        descriptionKey: 'achievements.securityChampion.description',
        icon: Shield,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        unlocked: metrics.complexity_risk < 30 && metrics.early_warning_prevention >= 60,
      },
      {
        id: 'green-pioneer',
        titleKey: 'achievements.greenPioneer.title',
        descriptionKey: 'achievements.greenPioneer.description',
        icon: Leaf,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        unlocked: metrics.sustainability_emissions >= 70,
      },
      {
        id: 'efficiency-expert',
        titleKey: 'achievements.efficiencyExpert.title',
        descriptionKey: 'achievements.efficiencyExpert.description',
        icon: Zap,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        unlocked: metrics.efficiency_throughput >= 70,
      },
      {
        id: 'visibility-master',
        titleKey: 'achievements.visibilityMaster.title',
        descriptionKey: 'achievements.visibilityMaster.description',
        icon: Eye,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        unlocked: metrics.visibility_insight >= 70,
      },
      {
        id: 'balanced-strategist',
        titleKey: 'achievements.balancedStrategist.title',
        descriptionKey: 'achievements.balancedStrategist.description',
        icon: Target,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        unlocked: 
          metrics.visibility_insight >= 40 &&
          metrics.efficiency_throughput >= 40 &&
          metrics.sustainability_emissions >= 40 &&
          metrics.early_warning_prevention >= 40 &&
          metrics.complexity_risk <= 50,
      },
      {
        id: 'focused-investor',
        titleKey: 'achievements.focusedInvestor.title',
        descriptionKey: 'achievements.focusedInvestor.description',
        icon: Award,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        unlocked: uniqueCards <= 4 && totalTokensUsed >= 20,
      },
      {
        id: 'completionist',
        titleKey: 'achievements.completionist.title',
        descriptionKey: 'achievements.completionist.description',
        icon: Trophy,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        unlocked: allRoundsComplete && uniqueCards >= 6,
      },
      {
        id: 'perfect-score',
        titleKey: 'achievements.perfectScore.title',
        descriptionKey: 'achievements.perfectScore.description',
        icon: Star,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        unlocked: 
          metrics.visibility_insight >= 60 &&
          metrics.efficiency_throughput >= 60 &&
          metrics.sustainability_emissions >= 60 &&
          metrics.early_warning_prevention >= 60 &&
          metrics.complexity_risk <= 40,
      },
    ];
  }, [metrics, roundHistory, allocations]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-4" data-testid="achievements-section">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{t('achievements.title')}</h3>
        <Badge variant="secondary" data-testid="achievement-count">
          {unlockedCount}/{totalCount} {t('achievements.unlocked')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`
                  p-4 text-center relative overflow-hidden
                  ${achievement.unlocked ? '' : 'opacity-50 grayscale'}
                `}
                data-testid={`achievement-${achievement.id}`}
              >
                {!achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <div className={`
                  w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center
                  ${achievement.unlocked ? achievement.bgColor : 'bg-muted'}
                `}>
                  <Icon className={`w-6 h-6 ${achievement.unlocked ? achievement.color : 'text-muted-foreground'}`} />
                </div>
                <h4 className="text-xs font-medium mb-1 line-clamp-2">
                  {t(achievement.titleKey)}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {t(achievement.descriptionKey)}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
