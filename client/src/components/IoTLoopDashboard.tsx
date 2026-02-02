import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Wifi, Database, Cpu, Zap } from 'lucide-react';
import { IotProcessStage, CardConfig } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IoTLoopDashboardProps {
  allocations: Record<string, number>;
  cards: CardConfig[];
}

const STAGE_CONFIG = {
  sense: {
    icon: Wifi,
    color: 'chart-1',
    ringClass: 'ring-chart-1',
    bgClass: 'bg-chart-1/20',
    textClass: 'text-chart-1',
  },
  share: {
    icon: Database,
    color: 'chart-2',
    ringClass: 'ring-chart-2',
    bgClass: 'bg-chart-2/20',
    textClass: 'text-chart-2',
  },
  process: {
    icon: Cpu,
    color: 'chart-3',
    ringClass: 'ring-chart-3',
    bgClass: 'bg-chart-3/20',
    textClass: 'text-chart-3',
  },
  act: {
    icon: Zap,
    color: 'chart-4',
    ringClass: 'ring-chart-4',
    bgClass: 'bg-chart-4/20',
    textClass: 'text-chart-4',
  },
} as const;

export function IoTLoopDashboard({ allocations, cards }: IoTLoopDashboardProps) {
  const { t } = useTranslation();

  const stageInvestments = useMemo(() => {
    const investments: Record<IotProcessStage, { tokens: number; cards: string[] }> = {
      sense: { tokens: 0, cards: [] },
      share: { tokens: 0, cards: [] },
      process: { tokens: 0, cards: [] },
      act: { tokens: 0, cards: [] },
    };

    cards.forEach((card) => {
      const tokens = allocations[card.id] || 0;
      if (tokens > 0) {
        card.iotProcessStages.forEach((stage) => {
          investments[stage].tokens += tokens;
          if (!investments[stage].cards.includes(card.id)) {
            investments[stage].cards.push(card.id);
          }
        });
      }
    });

    return investments;
  }, [allocations, cards]);

  const stages: IotProcessStage[] = ['sense', 'share', 'process', 'act'];
  const maxTokens = Math.max(...Object.values(stageInvestments).map((s) => s.tokens), 1);

  return (
    <div
      className="bg-card border border-card-border rounded-lg p-4 overflow-hidden"
      role="region"
      aria-label={t('dashboard.iotLoopTitle')}
      data-testid="iot-loop-dashboard"
    >
      <h4
        className="text-sm font-medium text-muted-foreground mb-3"
        data-testid="text-iot-loop-title"
      >
        {t('dashboard.iotLoopTitle')}
      </h4>
      <div
        className="flex items-center justify-around gap-1 sm:gap-2 w-full"
        role="list"
        aria-label={t('dashboard.iotLoopTitle')}
      >
        {stages.map((stage, index) => {
          const config = STAGE_CONFIG[stage];
          const Icon = config.icon;
          const investment = stageInvestments[stage];
          const intensity = investment.tokens / maxTokens;
          const hasInvestment = investment.tokens > 0;
          const stageLabel = t(`onboarding.processSteps.${stage}`);
          const stageDesc = t(`onboarding.processSteps.${stage}Desc`);

          return (
            <div key={stage} className="contents" role="listitem">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1 flex-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg p-1"
                    aria-label={`${stageLabel}: ${hasInvestment ? t('dashboard.investedTokens', { count: investment.tokens }) : t('dashboard.noInvestment')}`}
                    aria-describedby={`stage-desc-${stage}`}
                    data-testid={`button-iot-stage-${stage}`}
                  >
                    <motion.div
                      animate={{
                        scale: hasInvestment ? 1 : 0.9,
                        opacity: hasInvestment ? 1 : 0.5,
                      }}
                      data-testid={`iot-stage-${stage}`}
                    >
                      <motion.div
                        className={`
                          w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center
                          transition-all duration-300
                          ${
                            hasInvestment
                              ? `${config.bgClass} ring-2 ${config.ringClass}`
                              : 'bg-muted'
                          }
                        `}
                        style={{
                          backgroundColor: hasInvestment
                            ? `hsl(var(--${config.color}) / ${0.1 + intensity * 0.3})`
                            : undefined,
                          boxShadow: hasInvestment
                            ? `0 0 ${intensity * 20}px hsl(var(--${config.color}) / 0.3)`
                            : undefined,
                        }}
                      >
                        <Icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            hasInvestment ? config.textClass : 'text-muted-foreground'
                          }`}
                          style={{
                            color: hasInvestment ? `hsl(var(--${config.color}))` : undefined,
                          }}
                          aria-hidden="true"
                        />
                      </motion.div>
                    </motion.div>
                    <span
                      className={`text-xs font-medium ${
                        hasInvestment ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                      data-testid={`text-stage-label-${stage}`}
                    >
                      {stageLabel}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs font-mono ${hasInvestment ? 'text-foreground' : 'text-muted-foreground'}`}
                      data-testid={`text-stage-tokens-${stage}`}
                    >
                      {t('dashboard.investedShort', { count: investment.tokens })}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" id={`stage-desc-${stage}`}>
                  <div className="text-sm">
                    <p className="font-medium">{stageLabel}</p>
                    <p className="text-muted-foreground">{stageDesc}</p>
                    {investment.cards.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('dashboard.investedCards')}:
                        </p>
                        <ul className="text-xs">
                          {investment.cards.map((cardId) => (
                            <li key={cardId}>{t(`cards.${cardId}.title`)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {index < stages.length - 1 && (
                <motion.div
                  className="flex-shrink-0 flex items-center"
                  animate={{
                    opacity:
                      hasInvestment && stageInvestments[stages[index + 1]].tokens > 0 ? 1 : 0.3,
                  }}
                  aria-hidden="true"
                  data-testid={`connector-${stage}-${stages[index + 1]}`}
                >
                  <div className="w-2 sm:w-4 h-0.5 bg-border" />
                  <div className="w-0 h-0 border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent border-l-[2px] border-l-border" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
