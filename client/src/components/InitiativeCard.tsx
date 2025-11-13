import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { CardConfig } from '@shared/schema';

interface InitiativeCardProps {
  card: CardConfig;
  allocation: number;
  onAllocate: (tokens: number) => void;
  disabled?: boolean;
}

export function InitiativeCard({ card, allocation, onAllocate, disabled = false }: InitiativeCardProps) {
  const { t } = useTranslation();

  const title = t(card.copyKeys.title);
  const description = t(card.copyKeys.shortDescription);
  const whenToUse = t(card.copyKeys.whenToUse);
  const categoryLabel = t(`common.category.${card.category}`);

  const canDecrement = allocation > 0;
  const canIncrement = allocation < 3 && !disabled;

  return (
    <Card className="flex flex-col h-full" data-testid={`card-initiative-${card.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-lg leading-tight" data-testid={`text-title-${card.id}`}>
            {title}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs" data-testid={`badge-category-${card.id}`}>
            {categoryLabel}
          </Badge>
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
              className="h-10 w-10"
              data-testid={`button-decrement-${card.id}`}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span
              className="text-xl font-bold font-mono w-8 text-center"
              data-testid={`text-allocation-${card.id}`}
            >
              {allocation}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onAllocate(allocation + 1)}
              disabled={!canIncrement}
              className="h-10 w-10"
              data-testid={`button-increment-${card.id}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
