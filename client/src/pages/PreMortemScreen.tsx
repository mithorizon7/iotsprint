import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '@/contexts/GameContext';
import { PreMortemChoice } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, TrendingDown, TreeDeciduous } from 'lucide-react';

interface PreMortemScreenProps {
  onComplete: () => void;
}

export default function PreMortemScreen({ onComplete }: PreMortemScreenProps) {
  const { t } = useTranslation();
  const { setPreMortemAnswer } = useGame();
  const [selectedChoice, setSelectedChoice] = useState<PreMortemChoice | null>(null);

  const choices: { id: PreMortemChoice; icon: typeof AlertTriangle; labelKey: string; descKey: string }[] = [
    {
      id: 'security_risk',
      icon: AlertTriangle,
      labelKey: 'premortem.choices.securityRisk.label',
      descKey: 'premortem.choices.securityRisk.description',
    },
    {
      id: 'inefficiency',
      icon: TrendingDown,
      labelKey: 'premortem.choices.inefficiency.label',
      descKey: 'premortem.choices.inefficiency.description',
    },
    {
      id: 'environmental_fine',
      icon: TreeDeciduous,
      labelKey: 'premortem.choices.environmentalFine.label',
      descKey: 'premortem.choices.environmentalFine.description',
    },
  ];

  const handleSubmit = () => {
    if (selectedChoice) {
      setPreMortemAnswer(selectedChoice);
      onComplete();
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" data-testid="text-premortem-title">
            {t('premortem.title')}
          </CardTitle>
          <CardDescription className="text-base mt-4" data-testid="text-premortem-description">
            {t('premortem.description')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground italic">
              {t('premortem.prompt')}
            </p>
          </div>

          <RadioGroup
            value={selectedChoice || ''}
            onValueChange={(value) => setSelectedChoice(value as PreMortemChoice)}
          >
            <div className="space-y-4">
              {choices.map((choice) => {
                const Icon = choice.icon;
                const isSelected = selectedChoice === choice.id;
                
                return (
                  <div
                    key={choice.id}
                    className={`
                      relative flex items-start space-x-4 p-4 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover-elevate active-elevate-2 cursor-pointer'
                      }
                    `}
                    onClick={() => setSelectedChoice(choice.id)}
                    data-testid={`choice-${choice.id}`}
                  >
                    <RadioGroupItem value={choice.id} id={choice.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={choice.id} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{t(choice.labelKey)}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(choice.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedChoice}
              size="lg"
              data-testid="button-submit-premortem"
            >
              {t('premortem.continue')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
