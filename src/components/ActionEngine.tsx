'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Circle, CheckCircle2 } from 'lucide-react';

export function ActionEngine({ plan }: { plan: any[] }) {
  return (
    <Card className="bg-[#111111] border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          The Action Engine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {plan.map((phase) => (
            <div key={phase.phase} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                  {phase.phase}
                </div>
                <h3 className="text-lg font-semibold text-slate-200">{phase.title}</h3>
              </div>
              
              <div className="space-y-3 pl-4 border-l border-slate-800 ml-4">
                {phase.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      item.completed 
                        ? 'bg-emerald-950/10 border-emerald-900/30' 
                        : 'bg-black/20 border-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
