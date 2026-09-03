import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

export function MessageStatsChart({ data, showBreakdown = true }) {
  const chartData = data || []

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
        No message timeline yet
      </div>
    )
  }

  const hasDripData = chartData.some((d) => (d.drip || 0) > 0)
  const hasBroadcastData = chartData.some((d) => (d.broadcast || 0) > 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1E293B] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1">
            {label}
          </div>
          {payload.map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-3" style={{ color: p.color }}>
              <span>{p.name}:</span>
              <span className="font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(d) => d?.slice(5)}
          />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          {(showBreakdown && (hasDripData || hasBroadcastData)) && (
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              iconType="circle"
            />
          )}
          <Line
            type="monotone"
            dataKey="messages"
            stroke="#25D366"
            strokeWidth={2.5}
            dot={{ fill: '#25D366', r: 3 }}
            name="Total Outbound"
          />
          {showBreakdown && hasBroadcastData && (
            <Line
              type="monotone"
              dataKey="broadcast"
              stroke="#38BDF8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: '#38BDF8', r: 2.5 }}
              name="Broadcast Campaigns"
            />
          )}
          {showBreakdown && hasDripData && (
            <Line
              type="monotone"
              dataKey="drip"
              stroke="#A855F7"
              strokeWidth={2}
              dot={{ fill: '#A855F7', r: 3 }}
              name="Drip Automations"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

