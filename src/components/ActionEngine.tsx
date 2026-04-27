'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Circle, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { ActionItem, ActionPhase } from '@/types/ssot';

export function ActionEngine({ plan }: { plan: ActionPhase[] }) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(plan.flatMap(p => p.items.filter(i => i.completed).map(i => i.id)))
  );

  const toggleItem = (id: string) => {
    const next = new Set(completedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompletedItems(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <CheckSquare className="h-4 w-4 text-[color:var(--text)]" />
          Operator Checklist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue={String(plan[0]?.phase)} className="w-full space-y-3">
          {plan.map((phase) => {
            const phaseCompletedCount = phase.items.filter(i => completedItems.has(i.id)).length;
            const totalCount = phase.items.length;
            const isAllDone = phaseCompletedCount === totalCount;

            return (
              <AccordionItem 
                key={phase.phase} 
                value={String(phase.phase)}
                className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-5 transition-all duration-300 hover:border-[color:var(--border-strong)]"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 text-left">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isAllDone ? 'bg-[color:var(--text)] text-[color:var(--bg)] border-[color:var(--text)]' : 'border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] text-[color:var(--text)]'} font-display text-sm transition-colors`}>
                      {isAllDone ? <CheckCircle2 className="h-4 w-4" /> : phase.phase}
                    </div>
                    <div>
                      <h3 className={`font-display text-xl tracking-tight ${isAllDone ? 'text-[color:var(--muted)] line-through decoration-1' : 'text-[color:var(--text)]'}`}>{phase.title}</h3>
                      <p className="text-xs text-[color:var(--muted)] font-light mt-0.5">{phaseCompletedCount} of {totalCount} tasks completed</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-5">
                  {phase.description && (
                    <p className="mb-5 text-xs leading-relaxed muted-copy font-light border-l-2 border-[color:var(--border-strong)] pl-3">{phase.description}</p>
                  )}
                  <div className="space-y-3">
                    {phase.items.map((item: ActionItem) => {
                      const isCompleted = completedItems.has(item.id);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItem(item.id)}
                          className={`flex items-start gap-3 rounded-[16px] border p-4 transition-all duration-300 cursor-pointer ${
                            isCompleted 
                              ? 'border-[color:var(--border)] bg-[color:var(--panel-strong)] opacity-50' 
                              : 'border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] hover:shadow-[var(--shadow-card)]'
                          }`}
                        >
                          <div className="mt-0.5 transition-transform duration-200 hover:scale-110 shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-[color:var(--text)]" />
                            ) : (
                              <Circle className="h-4 w-4 text-[color:var(--soft)]" />
                            )}
                          </div>
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className={`text-sm font-medium leading-relaxed transition-all duration-300 ${isCompleted ? 'soft-copy line-through' : 'text-[color:var(--text)]'}`}>
                              {item.task}
                            </div>

                            {(item.dueWindow || (item.unlocks && item.unlocks.length > 0)) && (
                              <div className="flex flex-wrap gap-2">
                                {item.dueWindow && (
                                  <Badge variant="outline" className="border-[color:var(--border)] bg-[color:var(--panel-strong)] text-[color:var(--text)]">
                                    <Clock className="mr-1.5 h-3 w-3" />
                                    {item.dueWindow}
                                  </Badge>
                                )}
                                {item.unlocks?.map((unlock) => (
                                  <Badge key={unlock} variant="outline" className="border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]">
                                    <ArrowRight className="mr-1.5 h-3 w-3" />
                                    {unlock}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {item.why && (
                              <p className="text-xs leading-relaxed muted-copy font-light">{item.why}</p>
                            )}

                            {(item.relatedAccounts && item.relatedAccounts.length > 0) ? (
                              <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">
                                Accounts: {item.relatedAccounts.join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
