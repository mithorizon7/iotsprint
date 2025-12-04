import { useTranslation } from 'react-i18next';
import { Wifi, Database, Cpu, Zap } from 'lucide-react';
import { logger } from '@/lib/logger';

export function IoTProcessDiagram() {
  const { t, i18n } = useTranslation();
  
  logger.log('[IoTProcessDiagram] Rendering with language:', i18n.language);

  const steps = [
    {
      key: 'sense',
      icon: Wifi,
      title: t('onboarding.processSteps.sense'),
      desc: t('onboarding.processSteps.senseDesc'),
    },
    {
      key: 'share',
      icon: Database,
      title: t('onboarding.processSteps.share'),
      desc: t('onboarding.processSteps.shareDesc'),
    },
    {
      key: 'process',
      icon: Cpu,
      title: t('onboarding.processSteps.process'),
      desc: t('onboarding.processSteps.processDesc'),
    },
    {
      key: 'act',
      icon: Zap,
      title: t('onboarding.processSteps.act'),
      desc: t('onboarding.processSteps.actDesc'),
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center mb-8" data-testid="text-process-title">
        {t('onboarding.processTitle')}
      </h3>
      
      {/* Mobile: Vertical layout */}
      <div className="flex flex-col gap-6 md:hidden">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center text-center" data-testid={`card-process-${step.key}`}>
              <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/25 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-base font-semibold mb-2" data-testid={`text-step-${step.key}`}>
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground" data-testid={`text-desc-${step.key}`}>
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal layout with connecting lines */}
      <div className="hidden md:block">
        {/* Icons row with connectors */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="contents">
                {/* Circle with icon */}
                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/25 flex items-center justify-center shrink-0">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                {/* Connector line between circles */}
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center mx-2">
                    <div className="flex-1 h-0.5 bg-border" />
                    <div className="w-2 h-2 bg-border rotate-45 shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Labels row */}
        <div className="grid grid-cols-4 gap-4">
          {steps.map((step) => (
            <div key={step.key} className="text-center" data-testid={`card-process-${step.key}`}>
              <h4 className="text-base font-semibold mb-2" data-testid={`text-step-${step.key}`}>
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground" data-testid={`text-desc-${step.key}`}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
