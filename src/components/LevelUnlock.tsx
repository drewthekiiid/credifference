'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CheckCircle, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

const LEVELS = [
  {
    id: 1,
    title: 'Foundation',
    req: 500,
    items: ['Credit Versio Dispute Engine', 'myFICO / SmartCredit Active', 'Ally Bank (Safety Net)', 'Fidelity (Base Account)'],
  },
  {
    id: 2,
    title: 'Core Credit',
    req: 660,
    items: ['Apple Card (Apple Pay)', 'Amazon Prime Visa', 'AZEO Strategy Implementation'],
  },
  {
    id: 3,
    title: 'Pro Operator',
    req: 690,
    items: ['Amex Gold (Daily Life)', 'Fidelity Visa (2% Catch-all)', 'Float optimization (30-60 days)'],
  },
  {
    id: 4,
    title: 'Elite Hub',
    req: 720,
    items: ['Chase Private Client Hub', 'Amex Platinum (Travel/Status)', 'Institutional-level cashflow routing'],
  }
];

export function LevelUnlock({ currentScore }: { currentScore: number }) {
  return (
    <Card className="bg-[#111111] border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Unlock className="w-5 h-5 text-indigo-400" />
          The 10/10 Stack Unlocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEVELS.map((level, i) => {
            const isUnlocked = currentScore >= level.req;
            return (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-500 ${
                  isUnlocked 
                    ? 'bg-indigo-950/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'bg-black/40 border-slate-800 grayscale opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level {level.id}</span>
                    <h3 className={`text-lg font-bold mt-1 font-display ${isUnlocked ? 'text-slate-100' : 'text-slate-400'}`}>
                      {level.title}
                    </h3>
                  </div>
                  {isUnlocked ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <ul className="text-sm text-slate-400 space-y-2">
                  {level.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-indigo-500/50 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs bg-black/50 p-2 rounded text-slate-300 flex justify-between items-center">
                  <span><strong>Req:</strong> {level.req} FICO</span>
                  {!isUnlocked && <span className="text-slate-500">{level.req - currentScore} pts away</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
