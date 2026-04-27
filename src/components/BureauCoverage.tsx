import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FileSearch, Layers3 } from 'lucide-react';
import type { BureauName, BureauReport, LegacyIssue } from '@/types/ssot';

const BUREAU_STYLES: Record<BureauName, string> = {
  Experian: 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]',
  Equifax: 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]',
  TransUnion: 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]',
};

export function BureauCoverage({
  reports,
  legacyIssues,
}: {
  reports: BureauReport[];
  legacyIssues: LegacyIssue[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-display">
          <FileSearch className="h-5 w-5 text-[color:var(--text)]" />
          Three-Bureau Truth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="reports" className="w-full space-y-4">
          <AccordionItem value="reports" className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-6 transition-all duration-300 hover:border-[color:var(--border-strong)]">
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-3">
                <span className="font-display text-xl tracking-tight text-[color:var(--text)]">Bureau Reports</span>
                <span className="text-xs text-[color:var(--muted)] font-light">({reports.length} files)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 space-y-4">
              {reports.map((report) => (
                <div key={report.bureau} className="rounded-[16px] border border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] p-5 hover:shadow-[var(--shadow-card)] transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={BUREAU_STYLES[report.bureau]}>
                      {report.bureau}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
                      {report.reportDate}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[color:var(--text)] font-light mb-4">{report.summary}</p>
                  <div className="space-y-2">
                    {report.highlights.map((highlight, idx) => (
                      <div key={idx} className="border-l-2 border-[color:var(--border-strong)] pl-3 py-0.5">
                        <p className="text-xs leading-relaxed muted-copy font-light">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="legacy" className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-6 transition-all duration-300 hover:border-[color:var(--border-strong)]">
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-3">
                <Layers3 className="h-4 w-4 text-[color:var(--text)]" />
                <span className="font-display text-xl tracking-tight text-[color:var(--text)]">Legacy Late Marks</span>
                <span className="text-xs text-[color:var(--muted)] font-light">({legacyIssues.length} issues)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 space-y-4">
              {legacyIssues.map((issue) => (
                <div key={issue.id} className="rounded-[16px] border border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] p-5 hover:shadow-[var(--shadow-card)] transition-shadow duration-300">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-[color:var(--text)]">{issue.creditor}</p>
                    {issue.bureaus.map((bureau) => (
                      <Badge key={`${issue.id}-${bureau}`} variant="outline" className="text-[9px] px-1.5 py-0">
                        {bureau.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed muted-copy font-light mb-2">{issue.issue}</p>
                  <p className="text-xs leading-relaxed text-[color:var(--text)] font-light">{issue.strategy}</p>
                  {issue.estimatedRemoval && (
                    <p className="mt-3 text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">
                      Est. removal: {issue.estimatedRemoval}
                    </p>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
