
export interface User {
  id: string;
  email: string;
  role: boolean; // true = admin, false = user
  name: string;
}

export interface Device {
  id: string;
  name: string;
  category: 'iot_device' | 'end_device';
  type: string;
  status: 'online' | 'offline' | 'maintenance' | 'warning';
  owner_id: number;
  last_seen: string;
  configuration?: any;
}

export interface MetricData {
  timestamp: string;
  value: number;
  cpu?: number;
  ram?: number;
  disk?: number;
  deviceId: string;
  unit?: string;
  dataType?: string;
  ownerId?: number;
}

export interface ClusterStatus {
  service: string;
  replicas: number;
  status: 'running' | 'scaling' | 'error';
  ip: string;
}
