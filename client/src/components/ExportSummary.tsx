import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { GameMetrics, RoundHistoryEntry } from '@shared/schema';
import { formatDate, formatDateForFilename } from '@/lib/dateFormat';

interface ExportSummaryProps {
  metrics: GameMetrics;
  archetypeTitle: string;
  archetypeDescription: string;
  roundHistory: RoundHistoryEntry[];
  topInvestments: { cardId: string; tokens: number; title: string; company: string }[];
}

export function ExportSummary({ 
  metrics, 
  archetypeTitle, 
  archetypeDescription, 
  roundHistory,
  topInvestments 
}: ExportSummaryProps) {
  const { t } = useTranslation();

  const generatePrintContent = () => {
    const date = formatDate(new Date(), 'long');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('export.title')} - ${archetypeTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            color: #1a1a1a;
            line-height: 1.6;
          }
          h1 { font-size: 28px; margin-bottom: 8px; color: #0066cc; }
          h2 { font-size: 20px; margin: 24px 0 12px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
          h3 { font-size: 16px; margin: 16px 0 8px; }
          .header { text-align: center; margin-bottom: 32px; }
          .date { color: #666; font-size: 14px; }
          .archetype { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 24px; 
            border-radius: 12px; 
            margin: 24px 0;
            border: 1px solid #bae6fd;
          }
          .archetype h3 { color: #0066cc; margin-top: 0; font-size: 22px; }
          .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 16px; 
            margin: 16px 0; 
          }
          .metric { 
            background: #f8fafc; 
            padding: 16px; 
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; }
          .investments { margin: 16px 0; }
          .investment { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #eee; 
          }
          .rounds { margin: 16px 0; }
          .round { margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; }
          .round-header { font-weight: 600; margin-bottom: 8px; }
          .footer { 
            margin-top: 32px; 
            padding-top: 16px; 
            border-top: 1px solid #eee; 
            text-align: center; 
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('game.title')}</h1>
          <p class="date">${t('export.generatedOn', { date })}</p>
        </div>

        <div class="archetype">
          <h3>${t('export.yourArchetype')}</h3>
          <p style="font-size: 24px; font-weight: bold; color: #0f172a; margin: 8px 0;">${archetypeTitle}</p>
          <p style="color: #475569;">${archetypeDescription}</p>
        </div>

        <h2>${t('export.finalMetrics')}</h2>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">${t('metrics.visibility.label')}</div>
            <div class="metric-value">${metrics.visibility_insight}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">${t('metrics.efficiency.label')}</div>
            <div class="metric-value">${metrics.efficiency_throughput}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">${t('metrics.sustainability.label')}</div>
            <div class="metric-value">${metrics.sustainability_emissions}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">${t('metrics.earlyWarning.label')}</div>
            <div class="metric-value">${metrics.early_warning_prevention}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">${t('metrics.complexity.label')}</div>
            <div class="metric-value">${metrics.complexity_risk}%</div>
          </div>
        </div>

        <h2>${t('export.topInvestments')}</h2>
        <div class="investments">
          ${topInvestments.map((inv) => `
            <div class="investment">
              <span>${inv.title} ${inv.company ? `(${inv.company})` : ''}</span>
              <span><strong>${inv.tokens}</strong> ${t('common.tokens')}</span>
            </div>
          `).join('')}
        </div>

        <h2>${t('export.roundByRound')}</h2>
        <div class="rounds">
          ${roundHistory.map((round, index) => `
            <div class="round">
              <div class="round-header">${t('progress.round', { number: index + 1 })}</div>
              <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr); gap: 8px;">
                <div class="metric" style="padding: 8px;">
                  <div class="metric-label" style="font-size: 10px;">${t('metrics.visibility.label')}</div>
                  <div class="metric-value" style="font-size: 16px;">${round.metricsAfter.visibility_insight}%</div>
                </div>
                <div class="metric" style="padding: 8px;">
                  <div class="metric-label" style="font-size: 10px;">${t('metrics.efficiency.label')}</div>
                  <div class="metric-value" style="font-size: 16px;">${round.metricsAfter.efficiency_throughput}%</div>
                </div>
                <div class="metric" style="padding: 8px;">
                  <div class="metric-label" style="font-size: 10px;">${t('metrics.sustainability.label')}</div>
                  <div class="metric-value" style="font-size: 16px;">${round.metricsAfter.sustainability_emissions}%</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>${t('game.title')} - ${t('export.learnMore')}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintContent());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const handleDownload = () => {
    const content = generatePrintContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-strategy-results-${formatDateForFilename(new Date())}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
        <Printer className="w-4 h-4 mr-2" />
        {t('export.print')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download">
        <Download className="w-4 h-4 mr-2" />
        {t('export.download')}
      </Button>
    </div>
  );
}
