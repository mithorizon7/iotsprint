import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { OnboardingScreen } from '@/pages/OnboardingScreen';
import { GameDashboard } from '@/pages/GameDashboard';
import PreMortemScreen from '@/pages/PreMortemScreen';
import { FinalSummary } from '@/pages/FinalSummary';
import { CardConfig, GameConfig } from '@shared/schema';
import i18n from './lib/i18n';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </I18nextProvider>
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
        <GameProvider cards={cards} config={gameConfig}>
          <GameFlow />
        </GameProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function GameFlow() {
  const [gameState, setGameState] = useState<'onboarding' | 'playing' | 'premortem' | 'summary'>('onboarding');
  const [finalMetrics, setFinalMetrics] = useState<any>(null);
  const [finalRoundHistory, setFinalRoundHistory] = useState<any[]>([]);
  const [finalAllocations, setFinalAllocations] = useState<Record<string, number>>({});
  const { reset, gameState: contextGameState } = useGame();

  const handleStart = () => {
    setGameState('playing');
  };

  const handleComplete = (metrics: any, roundHistory: any[], allocations: Record<string, number>) => {
    setFinalMetrics(metrics);
    setFinalRoundHistory(roundHistory);
    setFinalAllocations(allocations);
    // If round 3 is complete, go to pre-mortem first
    // Round history length will be 3 when all three rounds are completed
    if (roundHistory.length >= 3) {
      setGameState('premortem');
    } else {
      setGameState('summary');
    }
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

  if (gameState === 'onboarding') {
    return <OnboardingScreen onStart={handleStart} />;
  }

  if (gameState === 'playing') {
    return <GameDashboard onComplete={handleComplete} />;
  }

  if (gameState === 'premortem') {
    return <PreMortemScreen onComplete={handlePreMortemComplete} />;
  }

  return <FinalSummary metrics={finalMetrics} roundHistory={finalRoundHistory} finalAllocations={finalAllocations} onReplay={handleReplay} />;
}

export default App;
