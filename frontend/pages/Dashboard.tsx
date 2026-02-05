
import React, { useState, useEffect } from 'react';
import KPIStats from '../components/Dashboard/KPIStats';
import MetricChart from '../components/Dashboard/MetricChart';
import ClusterHealth from '../components/Dashboard/ClusterHealth';
import { useMetrics } from '../hooks/useMetrics';
import { useAuth } from '../context/AuthContext';
import { Calendar, ChevronDown, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import RealTimeLogs from '../components/Dashboard/RealTimeLogs';
import WeatherWidget from '../components/Dashboard/WeatherWidget';

const Dashboard: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('1'); // Default to first ID
  const { metrics, devices, loading, isConnected, refresh } = useMetrics(selectedDeviceId);
  const { isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState('Today');

  // Sync with available devices if selected is not in list
  useEffect(() => {
    if (devices.length > 0 && !devices.find(d => d.id.toString() === selectedDeviceId)) {
      setSelectedDeviceId(devices[0].id.toString());
    }
  }, [devices, selectedDeviceId]);

  // Handle Date Filter Changes
  useEffect(() => {
    let start: Date;
    const end = new Date();

    if (dateRange === 'Last 2 Minutes') {
      start = new Date();
      start.setMinutes(end.getMinutes() - 2);
    } else if (dateRange === 'Last 5 Minutes') {
      start = new Date();
      start.setMinutes(end.getMinutes() - 5);
    } else if (dateRange === 'Last 15 Minutes') {
      start = new Date();
      start.setMinutes(end.getMinutes() - 15);
    } else if (dateRange === 'Last 30 Minutes') {
      start = new Date();
      start.setMinutes(end.getMinutes() - 30);
    } else if (dateRange === 'Last Hour') {
      start = new Date();
      start.setHours(end.getHours() - 1);
    } else if (dateRange === 'Last 6 Hours') {
      start = new Date();
      start.setHours(end.getHours() - 6);
    } else if (dateRange === 'Today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === 'Yesterday') {
      start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'Last 7 Days') {
      start = new Date();
      start.setDate(start.getDate() - 7);
    } else if (dateRange === 'Last 30 Days') {
      start = new Date();
      start.setDate(start.getDate() - 30);
    } else {
      return;
    }

    refresh(start.toISOString(), end.toISOString());
  }, [dateRange, selectedDeviceId, refresh]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-8 overflow-y-auto"
    >
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Systems Dashboard</h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-300">
            <Calendar size={18} className="text-cyan-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none text-sm font-semibold cursor-pointer appearance-none pr-4"
            >
              <option value="Last 2 Minutes" className="bg-slate-900">Last 2 Minutes</option>
              <option value="Last 5 Minutes" className="bg-slate-900">Last 5 Minutes</option>
              <option value="Last 15 Minutes" className="bg-slate-900">Last 15 Minutes</option>
              <option value="Last 30 Minutes" className="bg-slate-900">Last 30 Minutes</option>
              <option value="Last Hour" className="bg-slate-900">Last Hour</option>
              <option value="Last 6 Hours" className="bg-slate-900">Last 6 Hours</option>
              <option value="Today" className="bg-slate-900">Today</option>
              <option value="Yesterday" className="bg-slate-900">Yesterday</option>
              <option value="Last 7 Days" className="bg-slate-900">Last 7 Days</option>
              <option value="Last 30 Days" className="bg-slate-900">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 items-stretch">
        <div className="lg:col-span-1">
          <WeatherWidget />
        </div>
        <div className="lg:col-span-3">
          <KPIStats
            deviceCount={devices.length}
            criticalCount={devices.filter(d => d.status !== 'online').length}
          />
        </div>
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        <div className="xl:col-span-2 glass-card p-8 rounded-[32px] border border-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {devices.find(d => d.id.toString() === selectedDeviceId)?.category === 'iot_device' ? 'Environmental Performance' : 'System Performance'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">Real-time telemetry streams</p>
            </div>
            <div className="flex items-center gap-4">
              {devices.find(d => d.id.toString() === selectedDeviceId)?.category === 'iot_device' ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-xs text-slate-400 font-bold uppercase">Sensor Value</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <span className="text-xs text-slate-400 font-bold uppercase">CPU Load</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                    <span className="text-xs text-slate-400 font-bold uppercase">RAM</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="h-[400px] w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm font-medium animate-pulse">Syncing with K8s cluster...</p>
              </div>
            </div>
          ) : (
            <MetricChart
              key={selectedDeviceId} // Force re-render on device change to prevent data bleeding
              data={metrics}
              isIot={devices.find(d => d.id.toString() === selectedDeviceId)?.category === 'iot_device'}
            />
          )}
        </div>

        <div className="glass-card p-8 rounded-[32px] border border-slate-800/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-wide">Device Status</h2>
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="space-y-5 overflow-y-auto max-h-[400px] pr-2">
            {devices.map((device) => (
              <div
                key={device.id}
                onClick={() => setSelectedDeviceId(device.id.toString())}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all group cursor-pointer ${selectedDeviceId === device.id.toString()
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}></div>
                  <div>
                    <h4 className={`text-sm font-bold transition-colors ${selectedDeviceId === device.id.toString() ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'}`}>{device.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{device.category} • {device.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${device.status === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {device.status.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">{device.type}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800/50">
            <button onClick={() => window.location.hash = '#/devices'} className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl font-bold text-sm transition-all border border-slate-700/50">
              Manage All Devices
            </button>
          </div>
        </div>
      </div>

      {/* Admin Specific Content */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ClusterHealth />
        </motion.div>
      )}

      {/* Real-time Telemetry Logs */}
      <div className="mt-8 mb-12">
        <RealTimeLogs />
      </div>
    </motion.main>
  );
};

export default Dashboard;
