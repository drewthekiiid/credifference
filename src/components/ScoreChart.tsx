'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ScorePoint } from '@/types/ssot';

export function ScoreChart({ data }: { data: ScorePoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-[280px] items-center justify-center border border-[color:var(--border-strong)] bg-transparent">
        <div className="space-y-4 text-center px-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center border border-[color:var(--border-strong)] bg-[color:var(--panel-strong)]">
            <span className="font-display text-3xl font-light text-[color:var(--text)]">{data[0]?.score ?? '--'}</span>
          </div>
          <div>
            <p className="editorial-kicker">No true trend yet</p>
            <p className="mt-2 text-sm leading-relaxed muted-copy font-light max-w-sm mx-auto">
              Add recurring myFICO pulls to transform the dashboard from a baseline snapshot into a real trajectory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="var(--chart-axis)" 
            fontSize={12} 
            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
          />
          <YAxis 
            domain={['dataMin - 20', 'dataMax + 20']} 
            stroke="var(--chart-axis)" 
            fontSize={12} 
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--panel-strong)',
              borderColor: 'var(--border)',
              borderRadius: '18px',
              boxShadow: 'var(--shadow-card)',
              color: 'var(--text)',
            }}
            itemStyle={{ color: 'var(--text)' }}
            labelStyle={{ color: 'var(--muted)' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="var(--text)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: 'var(--panel-strong)', stroke: 'var(--text)', strokeWidth: 2 }} 
            activeDot={{ r: 6, fill: 'var(--text)' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
