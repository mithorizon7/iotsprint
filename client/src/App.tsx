import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { OnboardingScreen } from '@/pages/OnboardingScreen';
import { GameDashboard } from '@/pages/GameDashboard';
import { FinalSummary } from '@/pages/FinalSummary';
import { CardConfig } from '@shared/schema';
import './lib/i18n';

function App() {
  const [cards, setCards] = useState<CardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load card configurations
    fetch('/config/cards.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load game configuration');
        return res.json();
      })
      .then((data) => {
        setCards(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load cards:', error);
        setError(error.message || 'Failed to load game configuration');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Game</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover-elevate active-elevate-2"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider cards={cards}>
          <GameFlow />
        </GameProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function GameFlow() {
  const [gameState, setGameState] = useState<'onboarding' | 'playing' | 'summary'>('onboarding');
  const [finalMetrics, setFinalMetrics] = useState<any>(null);
  const [finalRoundHistory, setFinalRoundHistory] = useState<any[]>([]);
  const [finalAllocations, setFinalAllocations] = useState<Record<string, number>>({});
  const { reset } = useGame();

  const handleStart = () => {
    setGameState('playing');
  };

  const handleComplete = (metrics: any, roundHistory: any[], allocations: Record<string, number>) => {
    setFinalMetrics(metrics);
    setFinalRoundHistory(roundHistory);
    setFinalAllocations(allocations);
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

  return <FinalSummary metrics={finalMetrics} roundHistory={finalRoundHistory} finalAllocations={finalAllocations} onReplay={handleReplay} />;
}

export default App;
