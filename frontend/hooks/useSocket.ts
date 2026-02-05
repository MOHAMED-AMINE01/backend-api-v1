
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MetricData } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://172.26.80.134';
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/monitoring/socket.io';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [latestMetric, setLatestMetric] = useState<MetricData | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const s = io(SOCKET_URL, {
            path: '/monitoring/socket.io',
            transports: ['websocket'],
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
        });

        s.on('connect', () => {
            console.log('[SOCKET] Connected to K8s Real-time server');
            setIsConnected(true);
        });

        s.on('disconnect', () => {
            console.log('[SOCKET] Disconnected');
            setIsConnected(false);
        });

        s.on('new_metric', (rawData) => {
            const metric = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            console.log('[SOCKET] New metric received:', metric);

            const data = metric.data;
            const nestedMetrics = data.metrics || {};

            // Resolve values checking both root level and nested 'metrics' object
            const resolvedCpu = data.cpu ?? data.cpu_load ?? nestedMetrics.cpu;
            const resolvedRam = data.ram ?? nestedMetrics.ram;
            const resolvedDisk = data.disk ?? data.storage ?? nestedMetrics.disk ?? nestedMetrics.storage;
            const resolvedValue = data.value ?? data.load ?? resolvedCpu ?? 0;

            setLatestMetric({
                timestamp: metric.timestamp || new Date().toISOString(),
                value: resolvedValue,
                // User requested original values ONLY. No simulation.
                cpu: resolvedCpu,
                ram: resolvedRam,
                disk: resolvedDisk,
                deviceId: metric.device_id.toString(),
                unit: data.unit,
                dataType: data.type,
                ownerId: metric.owner_id
            });
        });

        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, []);

    return { latestMetric, isConnected };
};
