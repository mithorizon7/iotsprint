import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={
        theme === 'dark'
          ? t('accessibility.switchToLightMode')
          : t('accessibility.switchToDarkMode')
      }
      data-testid="button-theme-toggle"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 md:h-4 md:w-4" />
      ) : (
        <Moon className="h-5 w-5 md:h-4 md:w-4" />
      )}
    </Button>
  );
}
