'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Clock, ExternalLink } from 'lucide-react';

export function BlockerList({ blockers }: { blockers: any[] }) {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Collection': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Charge Off': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Past Due': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getDaysRemaining = (disputeDate: string) => {
    if (!disputeDate) return null;
    const start = new Date(disputeDate).getTime();
    const end = start + (30 * 24 * 60 * 60 * 1000);
    const now = new Date().getTime();
    const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
  };

  return (
    <Card className="bg-[#111111] border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Active Blockers & Disputes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {blockers.map((blocker) => (
            <AccordionItem key={blocker.id} value={blocker.id} className="border border-slate-800 rounded-lg px-4 bg-black/20">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold text-slate-200">{blocker.creditor}</span>
                    {blocker.originalCreditor && (
                      <span className="text-xs text-slate-500">Orig: {blocker.originalCreditor}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-300">${blocker.amount}</span>
                    <Badge variant="outline" className={getBadgeColor(blocker.type)}>
                      {blocker.type}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 border-t border-slate-800/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Status & Timers */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${blocker.status === 'disputed' ? 'bg-indigo-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-sm capitalize text-slate-300">{blocker.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    {blocker.disputeDate && (
                      <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">FCRA 30-Day Timer</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-sm text-slate-400">Disputed: {blocker.disputeDate}</span>
                          <span className="text-lg font-bold font-display text-indigo-300">{getDaysRemaining(blocker.disputeDate)} days left</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Linked Documents</h4>
                    {blocker.documents && blocker.documents.length > 0 ? (
                      <div className="space-y-2">
                        {blocker.documents.map((doc: any, i: number) => (
                          <a 
                            key={i} 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-300">{doc.name}</span>
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-800 rounded-lg text-center">
                        No documents linked yet.
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
