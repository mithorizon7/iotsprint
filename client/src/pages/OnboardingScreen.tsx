import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { IoTProcessDiagram } from '@/components/IoTProcessDiagram';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTutorial } from '@/components/Tutorial';
import { useGame } from '@/contexts/GameContext';
import { Lightbulb, Smile, Target, Flame } from 'lucide-react';
import { logger } from '@/lib/logger';
import { DifficultyMode } from '@shared/schema';
import { cn } from '@/lib/utils';
import iotLogo from '@assets/internet-of-things_1764882370466.png';

interface OnboardingScreenProps {
  onStart: () => void;
  onResume?: () => void;
  hasSavedGame?: boolean;
  resumeRound?: number;
}

const difficultyOptions: { id: DifficultyMode; icon: typeof Smile }[] = [
  { id: 'easy', icon: Smile },
  { id: 'normal', icon: Target },
  { id: 'hard', icon: Flame },
];

export function OnboardingScreen({
  onStart,
  onResume,
  hasSavedGame = false,
  resumeRound = 1,
}: OnboardingScreenProps) {
  const { t, i18n } = useTranslation();
  const { hasCompletedTutorial, startTutorial } = useTutorial();
  const { difficulty, setDifficulty } = useGame();
  const handleResume = onResume ?? onStart;

  logger.log(
    '[OnboardingScreen] Rendering with language:',
    i18n.language,
    'title:',
    t('game.title'),
  );

  const handleStartWithTutorial = () => {
    startTutorial();
    onStart();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-10">
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
          <motion.img
            src={iotLogo}
            alt={t('game.title')}
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            data-testid="img-hero-logo"
          />
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            data-testid="text-game-title"
          >
            {t('game.title')}
          </h1>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-testid="text-game-subtitle"
          >
            {t('game.subtitle')}
          </p>
        </motion.div>

        <div className="bg-card border border-card-border rounded-lg p-4 sm:p-8 space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed text-foreground" data-testid="text-intro">
              {t('onboarding.intro')}
            </p>
          </div>

          {hasSavedGame && (
            <div
              className="bg-muted/60 border border-border rounded-lg p-4"
              data-testid="resume-notice"
            >
              <p className="text-sm text-foreground">
                {t('onboarding.resumeNotice', { round: resumeRound })}
              </p>
            </div>
          )}

          <IoTProcessDiagram />

          <div className="pt-6 border-t border-card-border space-y-4">
            <h3 className="text-lg font-semibold" data-testid="text-what-you-do">
              {t('onboarding.whatYouDo')}
            </h3>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-what-you-do-desc"
            >
              {t('onboarding.whatYouDoDesc')}
            </p>
          </div>

          <div className="pt-6 border-t border-card-border space-y-4">
            <h3 className="text-lg font-semibold" data-testid="text-difficulty-title">
              {t('difficulty.selectTitle')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {difficultyOptions.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    'hover-elevate active-elevate-2',
                    difficulty === id
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-card-border bg-card',
                  )}
                  data-testid={`button-difficulty-${id}`}
                  aria-pressed={difficulty === id}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        difficulty === id ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold',
                        difficulty === id ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {t(`difficulty.${id}.name`)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(`difficulty.${id}.description`)}
                  </p>
                </button>
              ))}
            </div>
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
          {hasSavedGame ? (
            <>
              <Button
                size="lg"
                onClick={handleResume}
                className="px-8 text-base"
                data-testid="button-resume"
              >
                {t('onboarding.continueButton')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onStart}
                className="px-8 text-base"
                data-testid="button-start-new"
              >
                {t('onboarding.startNewButton')}
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              onClick={onStart}
              className="px-8 text-base"
              data-testid="button-start"
            >
              {t('onboarding.startButton')}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
