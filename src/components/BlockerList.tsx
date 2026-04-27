'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Clock, ExternalLink, Flag, ShieldCheck } from 'lucide-react';
import type { Blocker, BlockerDocument, BlockerType } from '@/types/ssot';

export function BlockerList({ blockers }: { blockers: Blocker[] }) {
  const getBadgeColor = (type: BlockerType) => {
    switch (type) {
      case 'Collection': return 'border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)]';
      case 'Charge Off': return 'border-[color:var(--text)] bg-transparent text-[color:var(--text)]';
      case 'Past Due': return 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]';
      case 'Late History': return 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]';
      default: return 'border-[color:var(--border)] bg-transparent text-[color:var(--muted)]';
    }
  };

  const getStatusColor = (status: Blocker['status']) => {
    switch (status) {
      case 'action_required':
        return 'border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)]';
      case 'disputed':
        return 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]';
      case 'resolved':
        return 'border-[color:var(--success)] bg-transparent text-[color:var(--success)]';
      default:
        return 'border-[color:var(--border)] bg-transparent text-[color:var(--muted)]';
    }
  };

  const getBureauColor = () => {
    return 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]';
  };

  const getDaysRemaining = (disputeDate: string) => {
    if (!disputeDate) return null;
    const start = new Date(disputeDate).getTime();
    const end = start + (30 * 24 * 60 * 60 * 1000);
    const now = new Date().getTime();
    const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
  };

  const formatMoney = (value?: number) => {
    if (typeof value !== 'number') return null;
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-display">
          <AlertTriangle className="h-5 w-5 text-[color:var(--text)]" />
          Live Negative Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {blockers.map((blocker) => (
            <AccordionItem
              key={blocker.id}
              value={blocker.id}
              className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-5 transition-all duration-300 hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow-card)]"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-display text-xl tracking-tight text-[color:var(--text)]">{blocker.creditor}</span>
                    {blocker.originalCreditor && (
                      <span className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Orig: {blocker.originalCreditor}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-light text-[color:var(--text)]">{formatMoney(blocker.amount)}</span>
                    <Badge variant="outline" className={getBadgeColor(blocker.type)}>
                      {blocker.type}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-[color:var(--border-strong)] pt-4 pb-6">
                <div className="grid grid-cols-1 gap-6 mt-2 lg:grid-cols-[1fr_1.1fr_1fr]">
                  <div className="space-y-4">
                    <div>
                      <h4 className="editorial-kicker mb-2">State</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getStatusColor(blocker.status)}>
                          {blocker.status.replace('_', ' ')}
                        </Badge>
                        {blocker.bureaus.map((bureau) => (
                          <Badge key={bureau} variant="outline" className={getBureauColor()}>
                            {bureau}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-l-2 border-[color:var(--border-strong)] pl-3">
                        <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Balance</p>
                        <p className="mt-1 text-sm font-light text-[color:var(--text)]">
                          {formatMoney(blocker.balanceAmount ?? blocker.amount)}
                        </p>
                      </div>
                      <div className="border-l-2 border-[color:var(--border-strong)] pl-3">
                        <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Past Due</p>
                        <p className="mt-1 text-sm font-light text-[color:var(--text)]">
                          {formatMoney(blocker.pastDueAmount ?? 0)}
                        </p>
                      </div>
                    </div>

                    {blocker.estimatedRemoval && (
                      <div className="border-l-2 border-[color:var(--border-strong)] pl-3">
                        <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Estimated Removal</p>
                        <p className="mt-1 text-xs font-light text-[color:var(--text)]">{blocker.estimatedRemoval}</p>
                      </div>
                    )}

                    {blocker.disputeDate && (
                      <div className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3.5 w-3.5 text-[color:var(--text)]" />
                          <span className="text-[9px] uppercase tracking-widest text-[color:var(--text)] font-medium">FCRA 30-Day Timer</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-light text-[color:var(--text)]">Disputed: {blocker.disputeDate}</span>
                          <span className="font-display text-xl tracking-tight text-[color:var(--text)]">{getDaysRemaining(blocker.disputeDate)} days left</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="editorial-kicker mb-2 flex items-center gap-2">
                        <Flag className="h-3 w-3" />
                        Next Move
                      </h4>
                      <div className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4">
                        <p className="text-xs leading-relaxed font-light text-[color:var(--text)]">{blocker.nextStep}</p>
                      </div>
                    </div>

                    <div>
                      <div className="editorial-kicker mb-2 flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" />
                        Custodian Note
                      </div>
                      <div className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4">
                        <p className="text-xs leading-relaxed font-light muted-copy">{blocker.notes}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="editorial-kicker mb-2">Verified Documents</h4>
                    {blocker.documents && blocker.documents.length > 0 ? (
                      <div className="space-y-2">
                        {blocker.documents.map((doc: BlockerDocument, i: number) => (
                          <a 
                            key={i} 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-[12px] border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-3 transition-colors hover:bg-[color:var(--text)] hover:text-[color:var(--bg)]"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5" />
                              <span className="text-xs font-light">{doc.name}</span>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[16px] border border-dashed border-[color:var(--border-strong)] p-4 text-center text-xs font-light muted-copy">
                        No verified documents linked yet.
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
