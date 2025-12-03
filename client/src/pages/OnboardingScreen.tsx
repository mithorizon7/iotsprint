import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { IoTProcessDiagram } from '@/components/IoTProcessDiagram';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTutorial } from '@/components/Tutorial';
import { Lightbulb } from 'lucide-react';
import { logger } from '@/lib/logger';

interface OnboardingScreenProps {
  onStart: () => void;
}

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const { t, i18n } = useTranslation();
  const { hasCompletedTutorial, startTutorial } = useTutorial();
  
  logger.log('[OnboardingScreen] Rendering with language:', i18n.language, 'title:', t('game.title'));

  const handleStartWithTutorial = () => {
    startTutorial();
    onStart();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-5xl mx-auto space-y-12">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="text-game-title">
            {t('game.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-game-subtitle">
            {t('game.subtitle')}
          </p>
        </motion.div>

        <div className="bg-card border border-card-border rounded-lg p-8 space-y-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-base leading-relaxed" data-testid="text-intro">
              {t('onboarding.intro')}
            </p>
          </div>

          <IoTProcessDiagram />

          <div className="pt-6 border-t border-card-border space-y-4">
            <h3 className="text-lg font-semibold" data-testid="text-what-you-do">
              {t('onboarding.whatYouDo')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-what-you-do-desc">
              {t('onboarding.whatYouDoDesc')}
            </p>
          </div>
        </div>

        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!hasCompletedTutorial && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleStartWithTutorial}
              className="px-8 text-base gap-2"
              data-testid="button-start-tutorial"
            >
              <Lightbulb className="w-4 h-4" />
              {t('onboarding.startWithTutorial')}
            </Button>
          )}
          <Button
            size="lg"
            onClick={onStart}
            className="px-8 text-base"
            data-testid="button-start"
          >
            {t('onboarding.startButton')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
