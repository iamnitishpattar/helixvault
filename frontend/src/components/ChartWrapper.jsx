 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartWrapper({ data }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.8)' }} />
        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.8)' }} domain={[0, 100]} />
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--accent-cyan)' }}
          itemStyle={{ color: 'var(--accent-cyan)' }}
        />
        <Area type="monotone" dataKey="gc" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorGc)" name="GC Content %" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
