'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ScoreChart({ data }: { data: any[] }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#52525b" 
            fontSize={12} 
            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
          />
          <YAxis 
            domain={['dataMin - 20', 'dataMax + 20']} 
            stroke="#52525b" 
            fontSize={12} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111111', borderColor: '#262626', borderRadius: '8px' }}
            itemStyle={{ color: '#818cf8' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#818cf8" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#111111', stroke: '#818cf8', strokeWidth: 2 }} 
            activeDot={{ r: 6, fill: '#818cf8' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
