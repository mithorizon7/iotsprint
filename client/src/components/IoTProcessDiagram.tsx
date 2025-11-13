import { useTranslation } from 'react-i18next';
import { Wifi, Database, Cpu, Zap } from 'lucide-react';

export function IoTProcessDiagram() {
  const { t } = useTranslation();

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative" data-testid={`card-process-${step.key}`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-base font-semibold mb-2" data-testid={`text-step-${step.key}`}>
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid={`text-desc-${step.key}`}>
                  {step.desc}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -translate-y-1/2 -ml-3">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-border rotate-45 translate-x-1/2" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
