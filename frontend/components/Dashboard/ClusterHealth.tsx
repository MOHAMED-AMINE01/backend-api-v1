
import React from 'react';
import { Server, Activity, Database, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const ClusterHealth: React.FC = () => {
  const services = [
    { name: 'Auth-Service', replicas: '2/2', status: 'Healthy', ip: '10.1.0.45', icon: Key },
    { name: 'Device-Service', replicas: '3/3', status: 'Healthy', ip: '10.1.0.46', icon: Server },
    { name: 'Monitoring-Service', replicas: '2/2', status: 'Healthy', ip: '10.1.0.47', icon: Activity },
    { name: 'MongoDB-Cluster', replicas: '3/3', status: 'Healthy', ip: '10.1.0.48', icon: Database },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Server className="text-cyan-400" size={20} />
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Cluster Service Health</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc, idx) => (
          <motion.div
            key={svc.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
              <svc.icon size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{svc.name}</h4>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500 font-mono">{svc.ip}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{svc.replicas}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ClusterHealth;
