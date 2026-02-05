
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Activity } from 'lucide-react';
import { MetricData } from '../../types';

interface Props {
  data: MetricData[];
  isIot?: boolean;
  hideLegend?: boolean;
}

const MetricChart: React.FC<Props> = ({ data, isIot, hideLegend }) => {
  const formattedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(d => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  if (data.length === 0) {
    return (
      <div className="h-[400px] w-full mt-6 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-3">
          <Activity size={24} />
        </div>
        <p className="text-slate-500 text-sm font-medium">No telemetry data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full relative min-h-0 min-w-0" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
          <XAxis
            dataKey="timestamp"
            stroke="#475569"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
            tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
          <YAxis
            stroke="#475569"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            domain={isIot ? ['auto', 'auto'] : [0, 100]}
            tickFormatter={(value) => isIot ? value.toFixed(1) : `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '10px',
              padding: '8px'
            }}
            itemStyle={{ padding: '2px 0' }}
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {!hideLegend && <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />}

          <Area
            type="monotone"
            dataKey={isIot ? "value" : "cpu"}
            name={isIot ? "Sensor Value" : "CPU Usage"}
            stroke={isIot ? "#fbbf24" : "#22d3ee"}
            strokeWidth={3}
            fillOpacity={0.15}
            fill={isIot ? "url(#colorValue)" : "url(#colorCpu)"}
            isAnimationActive={false}
            connectNulls={true}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
          />
          {!isIot && (
            <>
              <Area
                type="monotone"
                dataKey="ram"
                name="RAM Usage"
                stroke="#a78bfa"
                strokeWidth={3}
                fillOpacity={0.1}
                fill="url(#colorRam)"
                isAnimationActive={false}
                connectNulls={true}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="disk"
                name="Disk Usage"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={0.1}
                fill="url(#colorDisk)"
                isAnimationActive={false}
                connectNulls={true}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricChart;
