import { IotProcessStage } from '@shared/schema';
import { useTranslation } from 'react-i18next';
import { Database, Radio, Cpu, Zap, ArrowRight } from 'lucide-react';

interface IotProcessDiagramProps {
  highlightedStages: IotProcessStage[];
  cardTitle: string;
}

export function IotProcessDiagram({ highlightedStages, cardTitle }: IotProcessDiagramProps) {
  const { t } = useTranslation();
  
  const stages = [
    {
      id: 'sense' as IotProcessStage,
      icon: Database,
      titleKey: 'iotProcess.sense.title',
      descKey: 'iotProcess.sense.description',
      color: 'from-blue-500 to-cyan-500',
      highlightColor: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'share' as IotProcessStage,
      icon: Radio,
      titleKey: 'iotProcess.share.title',
      descKey: 'iotProcess.share.description',
      color: 'from-purple-500 to-pink-500',
      highlightColor: 'from-purple-600 to-pink-600',
    },
    {
      id: 'process' as IotProcessStage,
      icon: Cpu,
      titleKey: 'iotProcess.process.title',
      descKey: 'iotProcess.process.description',
      color: 'from-amber-500 to-orange-500',
      highlightColor: 'from-amber-600 to-orange-600',
    },
    {
      id: 'act' as IotProcessStage,
      icon: Zap,
      titleKey: 'iotProcess.act.title',
      descKey: 'iotProcess.act.description',
      color: 'from-emerald-500 to-green-500',
      highlightColor: 'from-emerald-600 to-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" data-testid="text-iot-process-title">
          {t('iotProcess.howThisWorks')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('iotProcess.cardFitsIn', { cardTitle })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isHighlighted = highlightedStages.includes(stage.id);
          
          return (
            <div key={stage.id} className="relative flex flex-col items-center">
              <div
                className={`
                  relative w-full rounded-lg p-4 border-2 transition-all duration-300
                  ${isHighlighted 
                    ? `bg-gradient-to-br ${stage.highlightColor} border-white/30 shadow-lg scale-105` 
                    : `bg-gradient-to-br ${stage.color} border-white/10 opacity-40`
                  }
                `}
                data-testid={`iot-stage-${stage.id}`}
              >
                <div className="flex flex-col items-center text-white space-y-2">
                  <div className="p-2 rounded-full bg-white/20">
                    <Icon className="w-6 h-6" data-testid={`icon-${stage.id}`} />
                  </div>
                  <div className="text-sm font-bold">
                    {t(stage.titleKey)}
                  </div>
                  <div className="text-xs text-center opacity-90">
                    {t(stage.descKey)}
                  </div>
                </div>
                
                {isHighlighted && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
                  </div>
                )}
              </div>

              {index < stages.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight 
                    className={`w-6 h-6 ${isHighlighted && highlightedStages.includes(stages[index + 1].id) ? 'text-white' : 'text-muted-foreground/30'}`} 
                    data-testid={`arrow-${stage.id}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground italic">
          {t('iotProcess.highlightedStages')}
        </p>
      </div>
    </div>
  );
}
