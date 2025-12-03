import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TutorialProvider } from '@/components/Tutorial';
import { OnboardingScreen } from '@/pages/OnboardingScreen';
import { GameDashboard } from '@/pages/GameDashboard';
import PreMortemScreen from '@/pages/PreMortemScreen';
import { FinalSummary } from '@/pages/FinalSummary';
import { CardConfig, GameConfig, GameMetrics, RoundHistoryEntry } from '@shared/schema';
import i18n from './lib/i18n';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </I18nextProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<CardConfig[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load both card configurations and game config in parallel
    Promise.all([
      fetch('/config/cards.json').then((res) => {
        if (!res.ok) throw new Error('Failed to load cards configuration');
        return res.json();
      }),
      fetch('/config/gameConfig.json').then((res) => {
        if (!res.ok) throw new Error('Failed to load game configuration');
        return res.json();
      })
    ])
      .then(([cardsData, configData]) => {
        setCards(cardsData);
        setGameConfig(configData);
        setLoading(false);
      })
      .catch((error) => {
        logger.error('Failed to load game data:', error);
        setError(error.message || 'Failed to load game configuration');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('app.loadingGame')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('app.errorTitle')}</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover-elevate active-elevate-2"
          >
            {t('app.reloadButton')}
          </button>
        </div>
      </div>
    );
  }

  if (!gameConfig) {
    return null; // Should never happen since loading state handles this
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TutorialProvider>
          <GameProvider cards={cards} config={gameConfig}>
            <GameFlow />
          </GameProvider>
        </TutorialProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function GameFlow() {
  const [gameState, setGameState] = useState<'onboarding' | 'playing' | 'premortem' | 'summary'>('onboarding');
  const [finalMetrics, setFinalMetrics] = useState<GameMetrics | null>(null);
  const [finalRoundHistory, setFinalRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const [finalAllocations, setFinalAllocations] = useState<Record<string, number>>({});
  const { reset } = useGame();

  const handleStart = () => {
    setGameState('playing');
  };

  const handleComplete = (metrics: GameMetrics, roundHistory: RoundHistoryEntry[], allocations: Record<string, number>) => {
    setFinalMetrics(metrics);
    setFinalRoundHistory(roundHistory);
    setFinalAllocations(allocations);
    // Always go to pre-mortem first when called after final round
    // GameDashboard only calls this when isGameComplete=true (Round 3 finished)
    setGameState('premortem');
  };

  const handlePreMortemComplete = () => {
    setGameState('summary');
  };

  const handleReplay = () => {
    reset(); // Reset game state before going back to onboarding
    setFinalMetrics(null);
    setFinalRoundHistory([]);
    setFinalAllocations({});
    setGameState('onboarding');
  };

  const renderScreen = () => {
    if (gameState === 'onboarding') {
      return <OnboardingScreen onStart={handleStart} />;
    }

    if (gameState === 'playing') {
      return <GameDashboard onComplete={handleComplete} />;
    }

    if (gameState === 'premortem') {
      return <PreMortemScreen onComplete={handlePreMortemComplete} />;
    }

    if (!finalMetrics) {
      return null;
    }

    return <FinalSummary metrics={finalMetrics} roundHistory={finalRoundHistory} finalAllocations={finalAllocations} onReplay={handleReplay} />;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gameState}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full min-h-screen"
      >
        {renderScreen()}
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
