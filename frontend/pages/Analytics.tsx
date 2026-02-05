
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricChart from '../components/Dashboard/MetricChart';
import { useMetrics } from '../hooks/useMetrics';
import { useAuth } from '../context/AuthContext';
import {
  BarChart2,
  Calendar,
  Zap,
  RefreshCcw,
  Filter,
  LayoutGrid,
  Cpu,
  Database,
  Activity,
  History,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Sub-component for individual device history chart
const DeviceAnalyticsCard: React.FC<{
  device: any;
  dateRange: { start: string; end: string } | null;
}> = ({ device, dateRange }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/monitoring/history/${device.id}`;
      if (dateRange) {
        endpoint = `/monitoring/filter/${device.id}?start=${dateRange.start}&end=${dateRange.end}`;
      }

      const response = await api.get(endpoint);
      const rawData = response.data.history || response.data;

      let parsedData = rawData.map((item: any) => {
        const data = item.data;
        const nestedMetrics = data.metrics || {};
        const resolvedCpu = data.cpu ?? data.cpu_load ?? nestedMetrics.cpu;
        const resolvedRam = data.ram ?? nestedMetrics.ram;
        const resolvedDisk = data.disk ?? data.storage ?? nestedMetrics.disk ?? nestedMetrics.storage;
        const resolvedValue = data.value ?? data.load ?? resolvedCpu ?? 0;

        return {
          timestamp: item.timestamp,
          value: resolvedValue,
          cpu: resolvedCpu,
          ram: resolvedRam,
          disk: resolvedDisk,
          deviceId: item.device_id.toString()
        };
      }).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // SAMPLING LOGIC: If we have too many points, sample it down to ~200 points for the preview
      if (parsedData.length > 200) {
        const step = Math.ceil(parsedData.length / 200);
        parsedData = parsedData.filter((_, idx) => idx % step === 0);
      }

      setHistory(parsedData);
    } catch (err) {
      console.error(`Failed to fetch history for device ${device.id}:`, err);
    } finally {
      setLoading(false);
    }
  }, [device.id, dateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-[32px] border border-slate-800/50 flex flex-col h-full bg-slate-900/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${device.category === 'iot_device' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            {device.category === 'iot_device' ? <Zap size={18} /> : <Cpu size={18} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">{device.name}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{device.type} • ID: {device.id}</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${device.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {device.status}
        </div>
      </div>

      <div className="flex-1 min-h-[220px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCcw className="text-cyan-500 animate-spin" size={20} />
          </div>
        ) : history.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase"> No Data in Period </div>
        ) : (
          <MetricChart
            data={history}
            isIot={device.category === 'iot_device'}
            hideLegend={true}
          />
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <History size={12} className="text-cyan-400" />
            <span className="font-bold">{history.length} points</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="font-bold">Active</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Analytics: React.FC = () => {
  const { isAdmin } = useAuth();
  const { devices, devicesLoading } = useMetrics();
  const [dateRange, setDateRange] = useState('Last 24 Hours');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [filterType, setFilterType] = useState('all');

  // Handle preset date ranges
  useEffect(() => {
    if (dateRange === 'Custom') return;

    const end = new Date();
    let start = new Date();

    if (dateRange === 'Last 2 Minutes') start.setMinutes(end.getMinutes() - 2);
    else if (dateRange === 'Last 5 Minutes') start.setMinutes(end.getMinutes() - 5);
    else if (dateRange === 'Last 15 Minutes') start.setMinutes(end.getMinutes() - 15);
    else if (dateRange === 'Last 30 Minutes') start.setMinutes(end.getMinutes() - 30);
    else if (dateRange === 'Last Hour') start.setHours(end.getHours() - 1);
    else if (dateRange === 'Last 6 Hours') start.setHours(end.getHours() - 6);
    else if (dateRange === 'Last 24 Hours') start.setHours(end.getHours() - 24);
    else if (dateRange === 'Last 7 Days') start.setDate(end.getDate() - 7);
    else if (dateRange === 'Last 30 Days') start.setDate(end.getDate() - 30);

    setCustomRange({
      start: start.toISOString(),
      end: end.toISOString()
    });
  }, [dateRange]);

  const filteredDevices = devices.filter(d => {
    if (filterType === 'all') return true;
    return d.category === filterType;
  });

  return (
    <div className="p-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">
              <BarChart2 size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Fleet Analytics</h1>
              <p className="text-slate-400 mt-1 font-medium italic">Comprehensive performance metrics across the cluster.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-1">
            {['all', 'iot_device', 'end_device'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === type ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {type === 'all' ? 'All nodes' : type === 'iot_device' ? 'IoT Sensors' : 'Workstations'}
              </button>
            ))}
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-slate-300">
            <Calendar size={18} className="text-cyan-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-bold cursor-pointer appearance-none pr-4 uppercase tracking-widest"
            >
              <option value="Last 2 Minutes" className="bg-slate-900 italic">Last 2 Minutes</option>
              <option value="Last 5 Minutes" className="bg-slate-900 italic">Last 5 Minutes</option>
              <option value="Last 15 Minutes" className="bg-slate-900 italic">Last 15 Minutes</option>
              <option value="Last 30 Minutes" className="bg-slate-900 italic">Last 30 Minutes</option>
              <option value="Last Hour" className="bg-slate-900 italic">Last Hour</option>
              <option value="Last 6 Hours" className="bg-slate-900 italic">Last 6 Hours</option>
              <option value="Last 24 Hours" className="bg-slate-900 italic">Last 24 Hours</option>
              <option value="Last 7 Days" className="bg-slate-900 italic">Last 7 Days</option>
              <option value="Last 30 Days" className="bg-slate-900 italic">Last 30 Days</option>
              <option value="Custom" className="bg-slate-900 italic" disabled>Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {devicesLoading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">Scanning Cluster Map...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredDevices.map((device) => (
              <DeviceAnalyticsCard
                key={device.id}
                device={device}
                dateRange={customRange}
              />
            ))}
          </AnimatePresence>

          {filteredDevices.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[40px]">
              <Filter size={48} className="mb-4 opacity-20" />
              <p className="text-xl font-bold uppercase tracking-widest">No devices match selection</p>
              <p className="text-sm mt-2 font-medium">Try adjusting your filters or node category.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Stats / Global Metrics */}
      {!devicesLoading && filteredDevices.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Network Health', val: '99.9%', icon: Activity, color: 'text-emerald-400' },
            { label: 'Active Streams', val: filteredDevices.length, icon: Zap, color: 'text-cyan-400' },
            { label: 'Data Points', val: '~4.2k/hr', icon: Database, color: 'text-amber-400' },
            { label: 'Fleet Latency', val: '12ms', icon: TrendingUp, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analytics;
