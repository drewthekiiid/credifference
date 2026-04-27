'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CheckCircle, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

const LEVELS = [
  {
    id: 1,
    title: 'Stabilize',
    req: 580,
    items: ['Monarch linked', 'Credit Versio live', 'myFICO + SmartCredit active', 'Ally + Fidelity base accounts'],
  },
  {
    id: 2,
    title: 'Clean Revolver',
    req: 640,
    items: ['Perpay and Stellar current', 'Capital One under control', 'AZEO workflow started', 'No fresh lates'],
  },
  {
    id: 3,
    title: 'Everyday Cards',
    req: 660,
    items: ['Apple Card', 'Amazon Prime Visa', 'Routine statement control'],
  },
  {
    id: 4,
    title: 'Premium Core',
    req: 690,
    items: ['Amex Gold', 'Fidelity Visa', 'Roth IRA automation', 'Solo 401(k) shell'],
  },
  {
    id: 5,
    title: 'Elite Ops',
    req: 720,
    items: ['Chase Private Client', 'Amex Platinum', 'Phantom vault', 'Kamino only after true surplus'],
  },
];

export function LevelUnlock({ currentScore }: { currentScore: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-display">
          <Unlock className="h-5 w-5 text-[color:var(--text)]" />
          Stack Unlock Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-muted)] p-5 text-sm leading-relaxed muted-copy font-light">
          Estimated gates only. Replace the working score with real myFICO data before timing applications.
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {LEVELS.map((level, i) => {
            const isUnlocked = currentScore >= level.req;
            return (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col justify-between rounded-[24px] border p-6 transition-all duration-500 ${
                  isUnlocked 
                    ? 'border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)] shadow-[var(--shadow-luxe)]'
                    : 'border-[color:var(--border)] bg-[color:var(--panel-muted)] opacity-80'
                }`}
              >
                <div>
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <span className={`editorial-kicker ${isUnlocked ? 'text-[color:var(--bg)] opacity-70' : ''}`}>Level {level.id}</span>
                      <h3 className={`mt-2 font-display text-3xl tracking-tight ${isUnlocked ? 'text-[color:var(--bg)]' : 'text-[color:var(--text)]'}`}>
                        {level.title}
                      </h3>
                    </div>
                    {isUnlocked ? (
                      <CheckCircle className="h-5 w-5 text-[color:var(--bg)]" />
                    ) : (
                      <Lock className="h-5 w-5 text-[color:var(--soft)]" />
                    )}
                  </div>

                  <ul className={`space-y-3 text-sm leading-relaxed font-light ${isUnlocked ? 'text-[color:var(--bg)] opacity-90' : 'muted-copy'}`}>
                    {level.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span className={`mt-[0.4rem] h-1 w-1 rounded-full ${isUnlocked ? 'bg-[color:var(--bg)]' : 'bg-[color:var(--text)]'}`}></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`mt-8 flex items-center justify-between border-t pt-4 text-xs uppercase tracking-widest font-medium ${
                  isUnlocked 
                    ? 'border-[color:var(--bg)]/20 text-[color:var(--bg)]' 
                    : 'border-[color:var(--border)] text-[color:var(--muted)]'
                }`}>
                  <span>Req: {level.req} FICO</span>
                  {!isUnlocked && <span>{level.req - currentScore} pts away</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
