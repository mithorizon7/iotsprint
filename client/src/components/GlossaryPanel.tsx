import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GlossaryTerm {
  id: string;
  termKey: string;
  definitionKey: string;
  exampleKey: string;
  relatedTerms: string[];
}

interface GlossaryPanelProps {
  variant?: 'button' | 'icon';
}

export function GlossaryPanel({ variant = 'button' }: GlossaryPanelProps) {
  const { t, i18n } = useTranslation();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/config/glossary.json')
      .then(res => res.json())
      .then(data => setTerms(data.terms))
      .catch(err => console.error('Failed to load glossary:', err));
  }, []);

  const filteredTerms = useMemo(() => {
    const currentLanguage = i18n.language;
    return terms.filter(term => {
      const termText = t(term.termKey).toLowerCase();
      const definitionText = t(term.definitionKey).toLowerCase();
      const query = searchQuery.toLowerCase();
      return termText.includes(query) || definitionText.includes(query);
    });
  }, [terms, searchQuery, t, i18n.language]);

  const handleTermClick = (term: GlossaryTerm) => {
    setSelectedTerm(selectedTerm?.id === term.id ? null : term);
  };

  const findRelatedTerm = (id: string) => {
    return terms.find(term => term.id === id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {variant === 'icon' ? (
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('glossary.openGlossary')}
            data-testid="button-glossary"
          >
            <Book className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="gap-2"
            data-testid="button-glossary"
          >
            <Book className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('glossary.title')}</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2" data-testid="text-glossary-title">
            <Book className="w-5 h-5 text-primary" aria-hidden="true" />
            {t('glossary.title')}
          </SheetTitle>
          <SheetDescription data-testid="text-glossary-description">
            {t('glossary.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t('glossary.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label={t('glossary.searchPlaceholder')}
              data-testid="input-glossary-search"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2 pr-4" role="list" aria-label={t('glossary.title')}>
              <AnimatePresence mode="popLayout">
                {filteredTerms.map((term) => (
                  <motion.div
                    key={`${term.id}-${i18n.language}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                    role="listitem"
                  >
                    <button
                      type="button"
                      onClick={() => handleTermClick(term)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all
                        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                        ${selectedTerm?.id === term.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover-elevate'
                        }
                      `}
                      aria-expanded={selectedTerm?.id === term.id}
                      data-testid={`glossary-term-${term.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t(term.termKey)}</span>
                        <ChevronRight 
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            selectedTerm?.id === term.id ? 'rotate-90' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </div>

                      <AnimatePresence>
                        {selectedTerm?.id === term.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 mt-3 border-t border-border space-y-3">
                              <p className="text-sm text-muted-foreground" data-testid={`text-definition-${term.id}`}>
                                {t(term.definitionKey)}
                              </p>
                              <div className="bg-muted/50 rounded p-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('glossary.example')}:
                                </p>
                                <p className="text-sm italic" data-testid={`text-example-${term.id}`}>
                                  {t(term.exampleKey)}
                                </p>
                              </div>
                              {term.relatedTerms.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {t('glossary.relatedTerms')}:
                                  </p>
                                  <div className="flex flex-wrap gap-1" role="list" aria-label={t('glossary.relatedTerms')}>
                                    {term.relatedTerms.map(relatedId => {
                                      const related = findRelatedTerm(relatedId);
                                      return related ? (
                                        <button
                                          key={relatedId}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTerm(related);
                                          }}
                                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                                          data-testid={`button-related-${relatedId}`}
                                        >
                                          {t(related.termKey)}
                                        </button>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTerms.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-results">
                  <p>{t('glossary.noResults')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
