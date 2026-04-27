import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Layers2, LockKeyhole, Rocket, Workflow } from 'lucide-react';
import type { StackItem, StackItemStatus } from '@/types/ssot';

const STATUS_META: Record<
  StackItemStatus,
  { label: string; className: string; icon: typeof Rocket; order: number }
> = {
  build_now: {
    label: 'Build now',
    className: 'border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)]',
    icon: Rocket,
    order: 1,
  },
  sequence_next: {
    label: 'Sequence next',
    className: 'border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]',
    icon: Workflow,
    order: 2,
  },
  locked: {
    label: 'Locked',
    className: 'border-[color:var(--border)] bg-[color:var(--panel-strong)] text-[color:var(--muted)]',
    icon: LockKeyhole,
    order: 3,
  },
};

export function StackChecklist({ items }: { items: StackItem[] }) {
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(item);
    return acc;
  }, {} as Record<StackItemStatus, StackItem[]>);

  const sortedStatuses = (Object.keys(groupedItems) as StackItemStatus[]).sort(
    (a, b) => STATUS_META[a].order - STATUS_META[b].order
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Layers2 className="h-4 w-4 text-[color:var(--text)]" />
          10/10 Stack Checklist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="build_now" className="w-full space-y-3">
          {sortedStatuses.map((status) => {
            const meta = STATUS_META[status];
            const groupItems = groupedItems[status];
            const Icon = meta.icon;

            return (
              <AccordionItem
                key={status}
                value={status}
                className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-5 transition-all duration-300 hover:border-[color:var(--border-strong)]"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={meta.className}>
                      <Icon className="mr-1.5 h-3 w-3" />
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-[color:var(--muted)] font-light">
                      ({groupItems.length} items)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-[16px] border border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] p-4 hover:shadow-[var(--shadow-card)] transition-shadow duration-300"
                      >
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] mb-1">{item.category}</p>
                          <h3 className="font-display text-xl tracking-tight text-[color:var(--text)] mb-3">{item.name}</h3>

                          <div className="space-y-3">
                            <div className="border-l-2 border-[color:var(--border-strong)] pl-3">
                              <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Requirement</p>
                              <p className="mt-1 text-xs leading-relaxed text-[color:var(--text)] font-light">{item.requirement}</p>
                            </div>
                            <div className="border-l-2 border-[color:var(--border-strong)] pl-3">
                              <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Next Step</p>
                              <p className="mt-1 text-xs leading-relaxed text-[color:var(--text)] font-light">{item.nextStep}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-[color:var(--border)] pt-3">
                          <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] font-medium">Blocked By</p>
                          <p className="mt-1 text-xs leading-relaxed muted-copy font-light">
                            {item.blockedBy.length ? item.blockedBy.join(' | ') : 'Ready to build.'}
                          </p>
                        </div>
                      </div>
                    ))}
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
