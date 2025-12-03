import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentRound: number;
  totalRounds?: number;
  showLabels?: boolean;
}

export function ProgressIndicator({ currentRound, totalRounds = 3, showLabels = true }: ProgressIndicatorProps) {
  const { t } = useTranslation();
  
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const progress = ((currentRound - 1) / (totalRounds - 1)) * 100;

  return (
    <div className="w-full max-w-md mx-auto" data-testid="progress-indicator">
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        <div className="relative flex justify-between">
          {rounds.map((round) => {
            const isComplete = round < currentRound;
            const isCurrent = round === currentRound;
            
            return (
              <div key={round} className="flex flex-col items-center">
                <motion.div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-300
                    ${isComplete 
                      ? 'bg-primary text-primary-foreground' 
                      : isCurrent 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                  data-testid={`progress-step-${round}`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    round
                  )}
                </motion.div>
                
                {showLabels && (
                  <span 
                    className={`
                      mt-2 text-xs font-medium
                      ${isCurrent ? 'text-primary' : 'text-muted-foreground'}
                    `}
                  >
                    {t('progress.round', { number: round })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
