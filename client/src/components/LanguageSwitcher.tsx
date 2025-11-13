import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES, SupportedLanguage, changeLanguage } from '@/lib/i18n';
import { useState } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (lng: SupportedLanguage) => {
    setIsChanging(true);
    try {
      await changeLanguage(lng);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentLanguageName = SUPPORTED_LANGUAGES[currentLanguage]?.nativeName || 'English';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isChanging}
          data-testid="button-language-switcher"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">{currentLanguageName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, { nativeName }]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            disabled={isChanging || code === currentLanguage}
            data-testid={`menu-item-language-${code}`}
          >
            {nativeName}
            {code === currentLanguage && ' ✓'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
