import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function DistributionLineChart({
  data,
  dataKey = 'count',
  name = 'Count',
  color = '#F59E0B',
  xKey = 'name',
  emptyMessage = 'No data available yet',
}) {
  const chartData = data || []

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 text-sm font-semibold">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 8, fontWeight: 700 }}
            labelStyle={{ color: '#F3F4F6', marginBottom: 4 }}
            itemStyle={{ color: color }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color }}
            name={name}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
