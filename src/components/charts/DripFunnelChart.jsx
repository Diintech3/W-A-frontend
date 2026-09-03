import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

export function DripFunnelChart({ data }) {
  const chartData = (data || []).map((c) => ({
    name: c.name?.length > 14 ? `${c.name.slice(0, 12)}…` : c.name || 'Campaign',
    fullName: c.name || 'Campaign',
    mode: c.mode === 'ai' ? 'AI Generated ⚡' : 'Manual 🛠️',
    sent: c.stats?.delivery?.sent || 0,
    delivered: c.stats?.delivery?.delivered || 0,
    read: c.stats?.delivery?.read || 0,
    replied: c.stats?.delivery?.replied || 0,
    converted: c.stats?.enrollments?.converted || 0,
  }))

  if (!chartData.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-500 text-sm gap-2">
        <div className="text-2xl">💧</div>
        <div>No drip automation performance data yet</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload
      return (
        <div className="bg-[#1E293B] border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[180px]">
          <div className="font-bold text-slate-200 border-b border-slate-700/60 pb-1 flex items-center justify-between">
            <span>{item?.fullName || label}</span>
            <span className="text-[10px] text-cyan-400">{item?.mode}</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Dispatched:</span>
            <span className="font-semibold">{item?.sent}</span>
          </div>
          <div className="flex justify-between text-cyan-400">
            <span>Delivered:</span>
            <span className="font-semibold">{item?.delivered}</span>
          </div>
          <div className="flex justify-between text-blue-400">
            <span>Read:</span>
            <span className="font-semibold">{item?.read}</span>
          </div>
          <div className="flex justify-between text-purple-400">
            <span>Replied / Engaged:</span>
            <span className="font-semibold">{item?.replied}</span>
          </div>
          <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-700/40 font-bold">
            <span>🎯 Converted:</span>
            <span>{item?.converted}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            iconType="circle"
          />
          <Bar dataKey="sent" fill="#10B981" name="Sent" radius={[4, 4, 0, 0]} />
          <Bar dataKey="delivered" fill="#06B6D4" name="Delivered" radius={[4, 4, 0, 0]} />
          <Bar dataKey="read" fill="#3B82F6" name="Read" radius={[4, 4, 0, 0]} />
          <Bar dataKey="replied" fill="#A855F7" name="Replied" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
