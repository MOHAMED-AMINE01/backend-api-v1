
import { useState, useEffect, useCallback } from 'react';
import { MetricData, Device } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from './useSocket';

export const useMetrics = (selectedDeviceId?: string) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const { isAdmin } = useAuth();

  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const endpoint = isAdmin ? '/devices/admin/all' : '/devices/my-devices';
      const res = await api.get(endpoint);
      setDevices(res.data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  }, [isAdmin]);

  const addDevice = async (device: Omit<Device, 'id' | 'last_seen' | 'status' | 'owner_id'>) => {
    try {
      const res = await api.post('/devices/add', device);
      setDevices(prev => [res.data, ...prev]);
      toast.success(`Device ${device.name} successfully registered.`);
      return true;
    } catch (err) {
      toast.error('Failed to register device.');
      return false;
    }
  };

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      const res = await api.put(`/devices/${id}`, updates);
      setDevices(prev => prev.map(d => d.id === id ? res.data : d));
      toast.success('Device configuration updated.');
    } catch (err) {
      toast.error('Failed to update device.');
    }
  };

  const removeDevice = async (id: string) => {
    try {
      await api.delete(`/devices/${id}`);
      setDevices(prev => prev.filter(d => d.id !== id));
      toast.success('Device removed from inventory.');
    } catch (err) {
      toast.error('Failed to remove device.');
    }
  };

  const fetchHistory = useCallback(async (startDate?: string, endDate?: string) => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      let endpoint = `/monitoring/history/${selectedDeviceId}?limit=100`;
      if (startDate && endDate) {
        endpoint = `/monitoring/filter/${selectedDeviceId}?start=${startDate}&end=${endDate}&limit=500`;
      }

      const response = await api.get(endpoint);

      // The filter endpoint returns a list directly, history returns an object with 'history' field
      const rawData = response.data.history ? response.data.history : response.data;

      const historyData = rawData.map((item: any) => {
        const data = item.data;
        const nestedMetrics = data.metrics || {};

        const resolvedCpu = data.cpu ?? data.cpu_load ?? nestedMetrics.cpu;
        const resolvedRam = data.ram ?? nestedMetrics.ram;
        const resolvedDisk = data.disk ?? data.storage ?? nestedMetrics.disk ?? nestedMetrics.storage;
        const resolvedValue = data.value ?? data.load ?? resolvedCpu ?? 0;

        return {
          timestamp: item.timestamp,
          value: resolvedValue,
          cpu: resolvedCpu, // Clean data: CPU is CPU.
          ram: resolvedRam,
          disk: resolvedDisk,
          deviceId: item.device_id.toString()
        };
      }).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setMetrics(historyData);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const { latestMetric, isConnected } = useSocket();

  // Handle Real-time updates
  // Handle Real-time updates with proper sorting to prevent chart jitter
  useEffect(() => {
    if (latestMetric && latestMetric.deviceId === selectedDeviceId) {
      setMetrics(prev => {
        const updated = [...prev, latestMetric].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // Keep the last 50 points to avoid memory bloat
        return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
      });
    }
  }, [latestMetric, selectedDeviceId]);

  return {
    metrics,
    devices,
    loading,
    devicesLoading,
    isConnected,
    refresh: fetchHistory,
    addDevice,
    removeDevice,
    updateDevice
  };
};
