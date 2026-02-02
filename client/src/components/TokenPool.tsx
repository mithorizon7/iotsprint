import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

interface TokenPoolProps {
  total: number;
  remaining: number;
  showBreakdown?: boolean;
  carryover?: number;
  newTokens?: number;
}

export function TokenPool({
  total,
  remaining,
  showBreakdown,
  carryover = 0,
  newTokens = 0,
}: TokenPoolProps) {
  const { t } = useTranslation();

  const tokens = useMemo(() => {
    return Array.from({ length: total }, (_, i) => ({
      id: i,
      isUsed: i >= remaining,
    }));
  }, [total, remaining]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <AnimatePresence mode="popLayout">
            {tokens.map((token) => (
              <motion.div
                key={token.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: token.isUsed ? 0.7 : 1,
                  opacity: token.isUsed ? 0.3 : 1,
                }}
                exit={{ scale: 0, opacity: 0, y: -20 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  delay: token.id * 0.02,
                }}
                className={`
                  w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center
                  transition-colors duration-200
                  ${
                    token.isUsed
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/20 text-primary border-2 border-primary/50'
                  }
                `}
              >
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <motion.span
            key={remaining}
            initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
            animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
            className="text-lg font-mono font-bold"
            data-testid="text-tokens-remaining"
          >
            {remaining}
          </motion.span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {t('dashboard.tokensAvailable', { count: remaining })}
          </span>
        </div>
      </div>
      {showBreakdown && (carryover > 0 || newTokens > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground"
          data-testid="text-token-breakdown"
        >
          {t('dashboard.tokenBreakdown', {
            carryover,
            newTokens,
            total,
          })}
        </motion.div>
      )}
    </div>
  );
}
