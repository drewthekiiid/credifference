import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import stateData from '@/data/state.json';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, TrendingUp, Lock, CheckCircle, Clock } from 'lucide-react';
import { ScoreChart } from '@/components/ScoreChart';
import { LevelUnlock } from '@/components/LevelUnlock';
import { BlockerList } from '@/components/BlockerList';
import { ActionEngine } from '@/components/ActionEngine';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { currentScore, scoreHistory, blockers, actionPlan, custodianLog } = stateData;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <header className="glass-card p-6 md:p-8 sticky top-4 z-50 backdrop-blur-xl bg-[#111111]/90 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SSOT: The 10/10 Machine
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Agent-Native Custodian Active
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-black/50 p-4 rounded-xl border border-slate-800">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                <circle 
                  className="text-indigo-500 stroke-current transition-all duration-1000 ease-out" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  cx="50" cy="50" r="40" fill="transparent" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 - (251.2 * (currentScore - 300)) / 550}
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-display">{currentScore}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Current FICO</p>
              <p className="text-xs text-slate-500 mt-1">Goal: 800</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-1 space-y-8">
          <Card className="bg-[#111111] border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Score Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreChart data={scoreHistory} />
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Clock className="w-5 h-5 text-slate-400" />
                Custodian Log
              </CardTitle>
              <CardDescription>Latest updates from the AI Custodian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {custodianLog.map((log, i) => (
                  <div key={i} className="border-l-2 border-indigo-500/30 pl-4 py-1">
                    <p className="text-xs text-indigo-400 mb-1">{log.date}</p>
                    <p className="text-sm text-slate-300">{log.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle/Right Column */}
        <div className="xl:col-span-2 space-y-8">
          <LevelUnlock currentScore={currentScore} />
          <BlockerList blockers={blockers} />
          <ActionEngine plan={actionPlan} />
        </div>
      </div>
    </div>
  );
}
