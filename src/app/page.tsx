import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import stateData from '@/data/state.json';
import { BrandMark } from '@/components/BrandMark';
import { DashboardClient } from '@/components/DashboardClient';
import type { StateData } from '@/types/ssot';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const data = stateData as StateData;
  const { currentScore, blockers, stackChecklist } = data;

  const liveUrgentCount = blockers.filter((blocker) => blocker.status === 'action_required').length;
  const crossBureauCount = blockers.filter((blocker) => blocker.bureaus.length === 3).length;
  const buildNowCount = stackChecklist.filter((item) => item.status === 'build_now').length;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[color:var(--bg)]">
      <header className="flex-none border-b border-[color:var(--border-strong)] bg-[color:var(--panel-strong)] px-4 py-3 md:px-6 md:py-4">
        <div className="mx-auto flex w-full items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <BrandMark size="sm" framed={false} />
            <div>
              <h1 className="font-display text-lg md:text-xl tracking-tight text-[color:var(--text)] leading-none">Credifference</h1>
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[color:var(--muted)] mt-1">Command Center</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-[color:var(--muted)]">Live Urgent</span>
              <span className="font-display text-xl text-[color:var(--text)] leading-none mt-1">{liveUrgentCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-[color:var(--muted)]">3-Bureau Hits</span>
              <span className="font-display text-xl text-[color:var(--text)] leading-none mt-1">{crossBureauCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-[color:var(--muted)]">Build Now</span>
              <span className="font-display text-xl text-[color:var(--text)] leading-none mt-1">{buildNowCount}</span>
            </div>
            <div className="h-8 w-px bg-[color:var(--border-strong)]"></div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-[color:var(--muted)]">Baseline FICO</span>
              <span className="font-display text-2xl text-[color:var(--text)] leading-none mt-1">{currentScore}</span>
            </div>
          </div>
          
          {/* Mobile Score */}
          <div className="flex md:hidden flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-[color:var(--muted)]">FICO</span>
            <span className="font-display text-xl text-[color:var(--text)] leading-none mt-0.5">{currentScore}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <DashboardClient data={data} />
      </div>
    </main>
  );
}
