import { useState, useCallback, KeyboardEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Minus, Plus, Info, Link2, Wifi, Database, Cpu, Zap } from 'lucide-react';
import { CardConfig, IotProcessStage } from '@shared/schema';
import { IotProcessDiagram } from './IotProcessCardDiagram';

interface InitiativeCardProps {
  card: CardConfig;
  allocation: number;
  onAllocate: (tokens: number) => void;
  disabled?: boolean;
  synergies?: string[];
  onHover?: (cardId: string | null) => void;
  isHighlighted?: boolean;
  allCards?: CardConfig[];
}

const STAGE_ICONS: Record<IotProcessStage, typeof Wifi> = {
  sense: Wifi,
  share: Database,
  process: Cpu,
  act: Zap,
};

const ALLOCATION_STYLES = {
  0: '',
  1: 'ring-2 ring-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-900/10',
  2: 'ring-2 ring-orange-400/50 bg-orange-50/30 dark:bg-orange-900/10',
  3: 'ring-2 ring-green-500/50 bg-green-50/30 dark:bg-green-900/10',
} as const;

export function InitiativeCard({ 
  card, 
  allocation, 
  onAllocate, 
  disabled = false,
  synergies = [],
  onHover,
  isHighlighted = false,
  allCards = [],
}: InitiativeCardProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const title = t(card.copyKeys.title);
  const description = t(card.copyKeys.shortDescription);
  const whenToUse = t(card.copyKeys.whenToUse);
  const categoryLabel = t(`common.category.${card.category}`);

  const canDecrement = allocation > 0;
  const canIncrement = allocation < 3 && !disabled;

  const synergyTitles = useMemo(() => {
    return synergies.map(id => {
      const synergyCard = allCards.find(c => c.id === id);
      return synergyCard ? t(synergyCard.copyKeys.title) : id;
    });
  }, [synergies, allCards, t]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (canIncrement) {
        onAllocate(allocation + 1);
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (canDecrement && !disabled) {
        onAllocate(allocation - 1);
      }
    }
  }, [allocation, canIncrement, canDecrement, disabled, onAllocate]);

  const allocationStyle = ALLOCATION_STYLES[allocation as keyof typeof ALLOCATION_STYLES] || '';

  const handleInteractionStart = () => {
    onHover?.(card.id);
  };

  const handleInteractionEnd = () => {
    onHover?.(null);
  };

  return (
    <div
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onFocus={handleInteractionStart}
      onBlur={handleInteractionEnd}
      className="h-full"
    >
      <Card 
        className={`
          flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          transition-all duration-300
          ${allocationStyle}
          ${isHighlighted ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20' : ''}
        `}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="group"
        aria-label={t('accessibility.cardStatus', { title, count: allocation })}
        data-testid={`card-initiative-${card.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-lg leading-tight" data-testid={`text-title-${card.id}`}>
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('accessibility.moreInfoAbout', { title })}
                    data-testid={`button-info-${card.id}`}
                  >
                    <Info className="h-5 w-5 md:h-4 md:w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle data-testid="text-dialog-title">
                      {title}
                    </DialogTitle>
                    <DialogDescription data-testid="text-dialog-description">
                      {t('iotProcess.dialogDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <IotProcessDiagram highlightedStages={card.iotProcessStages} cardTitle={title} />
                </DialogContent>
              </Dialog>
              <Badge variant="secondary" className="shrink-0 text-xs" data-testid={`badge-category-${card.id}`}>
                {categoryLabel}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {card.iotProcessStages.map(stage => {
                const StageIcon = STAGE_ICONS[stage];
                return (
                  <Tooltip key={stage}>
                    <TooltipTrigger asChild>
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <StageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{t(`onboarding.processSteps.${stage}`)}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {synergies.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{synergies.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs">
                    <p className="font-medium mb-1">{t('cards.synergyWith')}:</p>
                    <ul className="space-y-0.5">
                      {synergyTitles.map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="flex-1 space-y-3">
            <p className="text-sm text-card-foreground leading-relaxed" data-testid={`text-description-${card.id}`}>
              {description}
            </p>
            <div className="pt-2 border-t border-card-border">
              <p className="text-xs text-muted-foreground italic leading-relaxed" data-testid={`text-when-${card.id}`}>
                {whenToUse}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-card-border">
            <span className="text-sm font-medium text-muted-foreground">{t('common.tokens')}</span>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onAllocate(allocation - 1)}
                disabled={!canDecrement || disabled}
                aria-label={t('accessibility.removeTokenFrom', { title })}
                data-testid={`button-decrement-${card.id}`}
              >
                <Minus className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={allocation}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`
                    text-xl font-bold font-mono w-8 text-center
                    ${allocation > 0 ? 'text-primary' : ''}
                  `}
                  data-testid={`text-allocation-${card.id}`}
                >
                  {allocation}
                </motion.span>
              </AnimatePresence>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onAllocate(allocation + 1)}
                disabled={!canIncrement}
                aria-label={t('accessibility.addTokenTo', { title })}
                data-testid={`button-increment-${card.id}`}
              >
                <Plus className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
