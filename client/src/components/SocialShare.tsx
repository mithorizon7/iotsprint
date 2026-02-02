import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SocialShareProps {
  archetypeTitle: string;
  metrics: {
    visibility_insight: number;
    efficiency_throughput: number;
    sustainability_emissions: number;
    early_warning_prevention: number;
    complexity_risk: number;
  };
}

export function SocialShare({ archetypeTitle, metrics }: SocialShareProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const shareText = t('share.text', {
    archetype: archetypeTitle,
    visibility: metrics.visibility_insight,
    efficiency: metrics.efficiency_throughput,
    sustainability: metrics.sustainability_emissions,
  });

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const hashtags = 'IoT,StrategyGame,DigitalTransformation';

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-share">
          <Share2 className="w-4 h-4 mr-2" />
          {t('share.button')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleTwitterShare} data-testid="share-twitter">
          <Twitter className="w-4 h-4 mr-2" />
          {t('share.twitter')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLinkedInShare} data-testid="share-linkedin">
          <Linkedin className="w-4 h-4 mr-2" />
          {t('share.linkedin')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} data-testid="share-copy">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              {t('share.copied')}
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 mr-2" />
              {t('share.copyLink')}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
