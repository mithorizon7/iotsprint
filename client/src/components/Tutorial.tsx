import { useState, createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

interface TutorialStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    titleKey: 'tutorial.welcome.title',
    descriptionKey: 'tutorial.welcome.description',
    position: 'center',
  },
  {
    id: 'metrics',
    titleKey: 'tutorial.metrics.title',
    descriptionKey: 'tutorial.metrics.description',
    targetSelector: '[data-testid="metrics-panel"]',
    position: 'bottom',
  },
  {
    id: 'tokens',
    titleKey: 'tutorial.tokens.title',
    descriptionKey: 'tutorial.tokens.description',
    targetSelector: '[data-testid="text-tokens-remaining"]',
    position: 'bottom',
  },
  {
    id: 'cards',
    titleKey: 'tutorial.cards.title',
    descriptionKey: 'tutorial.cards.description',
    position: 'center',
  },
  {
    id: 'allocation',
    titleKey: 'tutorial.allocation.title',
    descriptionKey: 'tutorial.allocation.description',
    position: 'center',
  },
  {
    id: 'ready',
    titleKey: 'tutorial.ready.title',
    descriptionKey: 'tutorial.ready.description',
    position: 'center',
  },
];

const STORAGE_KEY = 'iot-game-tutorial-completed';

interface TutorialContextType {
  showTutorial: boolean;
  startTutorial: () => void;
  endTutorial: () => void;
  hasCompletedTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const endTutorial = () => {
    setShowTutorial(false);
    setHasCompletedTutorial(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <TutorialContext.Provider value={{ showTutorial, startTutorial, endTutorial, hasCompletedTutorial }}>
      {children}
      <TutorialOverlay />
    </TutorialContext.Provider>
  );
}

function TutorialOverlay() {
  const { t } = useTranslation();
  const { showTutorial, endTutorial } = useTutorial();
  const [currentStep, setCurrentStep] = useState(0);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      endTutorial();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    endTutorial();
  };

  if (!showTutorial) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        data-testid="tutorial-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/25 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold" data-testid="tutorial-title">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('tutorial.step', { current: currentStep + 1, total: TUTORIAL_STEPS.length })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                aria-label={t('tutorial.skip')}
                data-testid="button-tutorial-skip"
              >
                <X className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="tutorial-description">
              {t(step.descriptionKey)}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1">
                {TUTORIAL_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {!isFirst && (
                  <Button variant="outline" size="sm" onClick={handlePrev} data-testid="button-tutorial-prev">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t('tutorial.back')}
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} data-testid="button-tutorial-next">
                  {isLast ? t('tutorial.finish') : t('tutorial.next')}
                  {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function TutorialTrigger() {
  const { t } = useTranslation();
  const { startTutorial } = useTutorial();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTutorial}
      className="gap-2"
      data-testid="button-tutorial-start"
    >
      <Lightbulb className="w-5 h-5 md:w-4 md:h-4" />
      {t('tutorial.helpButton')}
    </Button>
  );
}
