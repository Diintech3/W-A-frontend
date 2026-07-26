import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function DistributionBarChart({
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
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 8, fontWeight: 700 }}
            labelStyle={{ color: '#F3F4F6', marginBottom: 4 }}
            itemStyle={{ color: color }}
          />
          <Bar dataKey={dataKey} fill={color} name={name} radius={[6, 6, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
