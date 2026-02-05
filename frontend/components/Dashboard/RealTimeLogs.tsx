import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Terminal } from 'lucide-react';
import { MetricData } from '../../types';

interface LogEntry {
    id: string;
    timestamp: string;
    parsedTime: string;
    deviceId: string;
    metricType: string;
    value: any;
    raw: MetricData;
}

import { useAuth } from '../../context/AuthContext';

const RealTimeLogs: React.FC = () => {
    const { latestMetric, isConnected } = useSocket();
    const { user, isAdmin } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Buffer limit to prevent memory issues
    const MAX_LOGS = 100;

    useEffect(() => {
        if (latestMetric) {
            // RBAC Filtering: If not admin, only show logs for user's devices
            // Check if latestMetric belongs to current user or if user is admin
            if (!isAdmin && user && latestMetric.ownerId !== undefined && latestMetric.ownerId !== Number(user.id)) {
                return;
            }

            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });

            // Determine metric content
            const metrics: string[] = [];
            if (latestMetric.cpu !== undefined) metrics.push(`CPU:${latestMetric.cpu.toFixed(1)}%`);
            if (latestMetric.ram !== undefined) metrics.push(`RAM:${latestMetric.ram.toFixed(1)}%`);
            if (latestMetric.disk !== undefined) metrics.push(`DSK:${latestMetric.disk.toFixed(1)}%`);

            // Logic for IoT devices (primary value + unit)
            // If no system metrics are present, or if it's explicitly an IoT type
            if (metrics.length === 0 && latestMetric.value !== undefined) {
                const valStr = latestMetric.unit ? `${latestMetric.value} ${latestMetric.unit}` : `${latestMetric.value}`;
                metrics.push(valStr);
            } else if (latestMetric.value !== undefined && !metrics.some(m => m.includes('CPU'))) {
                // Fallback if value exists and CPU is missing (unlikely overlap)
                metrics.push(`VAL:${latestMetric.value}`);
            }

            let displayValue = metrics.join(' | ');
            let type = latestMetric.dataType ? latestMetric.dataType.toUpperCase() : 'MULTI_METRIC';

            // Heuristic to determine type label if dataType is missing
            if (metrics.length > 1) {
                type = 'SYS_METRICS';
            } else if (metrics.length === 1 && !latestMetric.dataType) {
                if (latestMetric.cpu !== undefined) type = 'CPU_LOAD';
                else if (latestMetric.ram !== undefined) type = 'RAM_USAGE';
                else if (latestMetric.disk !== undefined) type = 'DISK_USAGE';
                else type = 'SENSOR_VAL';
            }

            const newLog: LogEntry = {
                id: Math.random().toString(36).substring(7),
                timestamp: now.toISOString(),
                parsedTime: timeString,
                deviceId: latestMetric.deviceId,
                metricType: type,
                value: displayValue,
                raw: latestMetric
            };

            setLogs(prev => {
                const updated = [...prev, newLog];
                if (updated.length > MAX_LOGS) return updated.slice(updated.length - MAX_LOGS);
                return updated;
            });
        }
    }, [latestMetric]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Expand state
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    return (
        <div className="glass-card rounded-[32px] border border-slate-800/50 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700/50 shadow-inner">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-wide">Live Telemetry Stream</h2>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shadow-[0_0_8px_current]`}></span>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                                {isConnected ? 'Connection Established via WebSocket' : 'Connecting to Stream...'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                    buf_size: {logs.length}/{MAX_LOGS}
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 bg-slate-950 p-6 overflow-y-auto font-mono text-sm custom-scrollbar relative"
            >
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>

                {logs.length === 0 && isConnected && (
                    <div className="text-slate-600 italic text-center mt-20">Waiting for incoming telemetry packets...</div>
                )}

                <div className="space-y-1.5 relative z-10">
                    {logs.map((log) => (
                        <div key={log.id} className="group">
                            <div
                                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                className="flex items-start gap-3 hover:bg-slate-900/40 p-1 rounded transition-colors cursor-pointer"
                            >
                                <span className="text-slate-500 shrink-0">[{log.parsedTime}]</span>

                                <span className="text-cyan-400 font-bold shrink-0 w-24">
                                    {log.deviceId.startsWith('temp') ? 'TEMP_SENS' :
                                        log.deviceId.startsWith('gate') ? 'GATEWAY' :
                                            `DEVICE_${log.deviceId}`}
                                </span>

                                <span className={`shrink-0 w-32 font-bold ${log.metricType === 'CPU_LOAD' ? 'text-amber-400' :
                                    log.metricType === 'RAM_USAGE' ? 'text-violet-400' :
                                        log.metricType === 'SYS_METRICS' ? 'text-blue-400' :
                                            'text-emerald-400'
                                    }`}>
                                    {log.metricType}
                                </span>

                                <span className="text-slate-600">{'>>'}</span>

                                <span className="text-slate-200 group-hover:text-white transition-colors">
                                    {log.value}
                                </span>
                            </div>
                            {expandedLogId === log.id && (
                                <div className="ml-12 mt-1 mb-2 p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-400">
                                    <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(log.raw, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Cursor effect */}
                    <div className="animate-pulse w-2 h-4 bg-emerald-500/50 inline-block align-middle ml-1"></div>
                </div>
            </div>
        </div>
    );
};

export default RealTimeLogs;
