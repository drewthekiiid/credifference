'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreChart } from '@/components/ScoreChart';
import { LevelUnlock } from '@/components/LevelUnlock';
import { BlockerList } from '@/components/BlockerList';
import { ActionEngine } from '@/components/ActionEngine';
import { BureauCoverage } from '@/components/BureauCoverage';
import { StackChecklist } from '@/components/StackChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, LayoutDashboard, Wrench, Layers } from 'lucide-react';
import type { StateData } from '@/types/ssot';

type Tab = 'overview' | 'repair' | 'stack';

export function DashboardClient({ data }: { data: StateData }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { scoreHistory, scoreMeta, bureauReports, blockers, legacyIssues, stackChecklist, actionPlan, custodianLog } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'repair', label: 'Repair Engine', icon: Wrench },
    { id: 'stack', label: 'Wealth Stack', icon: Layers },
  ] as const;

  return (
    <div className="flex h-full flex-col md:flex-row bg-[color:var(--bg)]">
      {/* Sidebar Navigation */}
      <aside className="flex-none border-b md:border-b-0 md:border-r border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] p-3 md:w-56 md:p-5 z-10">
        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[color:var(--text)] text-[color:var(--bg)] shadow-md'
                    : 'text-[color:var(--muted)] hover:bg-[color:var(--panel-muted)] hover:text-[color:var(--text)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-5xl"
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-display">
                        <TrendingUp className="h-4 w-4 text-[color:var(--text)]" />
                        Score Trajectory
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScoreChart data={scoreHistory} />
                      <p className="mt-4 text-[11px] leading-relaxed muted-copy font-light">{scoreMeta.note}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-display">
                        <Clock className="h-4 w-4 text-[color:var(--text)]" />
                        Custodian Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {custodianLog.map((log, i) => (
                          <div key={i} className="border-l-2 border-[color:var(--border-strong)] pl-3 py-1">
                            <p className="text-[9px] uppercase tracking-widest text-[color:var(--muted)] mb-1">{log.date}</p>
                            <p className="text-xs leading-relaxed text-[color:var(--text)] font-light">{log.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <ActionEngine plan={actionPlan} />
                </div>
              </div>
            )}

            {activeTab === 'repair' && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <BlockerList blockers={blockers} />
                <BureauCoverage reports={bureauReports} legacyIssues={legacyIssues} />
              </div>
            )}

            {activeTab === 'stack' && (
              <div className="space-y-6">
                <LevelUnlock currentScore={data.currentScore} />
                <StackChecklist items={stackChecklist} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
