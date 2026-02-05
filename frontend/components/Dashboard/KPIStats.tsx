
import React from 'react';
import { Cpu, AlertTriangle, Network, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPIStatsProps {
  deviceCount: number;
  criticalCount: number;
}

const KPIStats: React.FC<KPIStatsProps> = ({ deviceCount, criticalCount }) => {
  const stats = [
    { label: 'Active Devices', value: deviceCount.toString(), trend: 'Real-time', icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { label: 'Critical Alerts', value: criticalCount.toString(), trend: 'Last 24h', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
    { label: 'Network Status', value: 'Nominal', trend: 'Stable', icon: Network, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'System Uptime', value: '99.98%', trend: 'Stable', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className={`glass-card p-6 rounded-3xl border ${stat.border} transition-all duration-300 relative overflow-hidden group h-full flex flex-col justify-between`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp size={14} className={stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-500'} />
            <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-500'}`}>
              {stat.trend} <span className="text-slate-600 ml-1 font-normal italic">vs last month</span>
            </span>
          </div>

          {/* Subtle glow effect on hover */}
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${stat.bg}`}></div>
        </motion.div>
      ))}
    </div>
  );
};

export default KPIStats;
