
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Trash2, Settings, X, Cpu, Info,
  Grid, List, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';
import { Device } from '../types';

const Devices: React.FC = () => {
  const { devices, addDevice, removeDevice, updateDevice } = useMetrics();

  // State Management
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Device; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  // Forms States
  const [addFormData, setAddFormData] = useState({
    name: '',
    category: 'iot_device' as 'iot_device' | 'end_device',
    type: 'temperature'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'iot_device' as 'iot_device' | 'end_device',
    status: 'online' as any
  });

  // Memoized Filtering and Sorting
  const sortedAndFilteredDevices = useMemo(() => {
    let filtered = devices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toString().toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'all' || d.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = (a[sortConfig.key] ?? '').toString();
        const bValue = (b[sortConfig.key] ?? '').toString();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [devices, search, filterStatus, sortConfig]);

  const requestSort = (key: keyof Device) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addDevice(addFormData);
    if (success) {
      setShowAddModal(false);
      setAddFormData({ name: '', category: 'iot_device', type: 'temperature' });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      updateDevice(editingDevice.id, editFormData);
      setEditingDevice(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingDevice) {
      removeDevice(deletingDevice.id);
      setDeletingDevice(null);
    }
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setEditFormData({ name: device.name, category: device.category, status: device.status });
  };

  const SortableHeader = ({ tKey, label }: { tKey: keyof Device, label: string }) => (
    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
      <button className="flex items-center gap-2 group" onClick={() => requestSort(tKey)}>
        <span>{label}</span>
        <ArrowUpDown
          size={12}
          className={`transition-colors ${sortConfig?.key === tKey ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}
        />
      </button>
    </th>
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Device Inventory</h1>
          <p className="text-slate-400 mt-1">Manage and provision industrial endpoints across the cluster.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><List size={20} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Grid size={20} /></button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-cyan-900/20"><Plus size={20} /><span>Provision Node</span></button>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Search by name, ID or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all" />
        </div>
        <div className="flex gap-2">
          {['all', 'online', 'maintenance', 'offline'].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status as any)} className={`px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all border ${filterStatus === status ? 'bg-slate-800 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{status}</button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card rounded-[32px] border border-slate-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/30">
                    <SortableHeader tKey="name" label="Node Details" />
                    <SortableHeader tKey="status" label="Status" />
                    <SortableHeader tKey="category" label="Category" />
                    <SortableHeader tKey="owner_id" label="Owner ID" />
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredDevices.map((device) => (
                    <tr key={device.id} className="group hover:bg-slate-900/40 transition-colors border-b border-slate-800/50 last:border-0">
                      <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400"><Cpu size={20} /></div><div><p className="font-bold text-slate-200">{device.name}</p><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{device.type} • {device.id}</p></div></div></td>
                      <td className="px-8 py-5"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500' : device.status === 'maintenance' ? 'bg-amber-500' : 'bg-rose-500'}`}></div><span className={`text-xs font-bold uppercase ${device.status === 'online' ? 'text-emerald-400' : device.status === 'maintenance' ? 'text-amber-400' : 'text-rose-400'}`}>{device.status}</span></div></td>
                      <td className="px-8 py-5"><span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest">{device.category.replace('_', ' ')}</span></td>
                      <td className="px-8 py-5 text-sm text-slate-400 font-medium">#{device.owner_id}</td>
                      <td className="px-8 py-5 text-right"><div className="flex justify-end gap-1"><button onClick={() => openEditModal(device)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title="Configure Device"><Settings size={18} /></button><button onClick={() => setDeletingDevice(device)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Remove Device"><Trash2 size={18} /></button></div></td>
                    </tr>
                  ))}
                  {sortedAndFilteredDevices.length === 0 && (<tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500 italic">No nodes found matching your criteria.</td></tr>)}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredDevices.map((device) => (
              <div key={device.id} className="glass-card p-6 rounded-[32px] border border-slate-800/50 hover:border-cyan-500/30 transition-all group">
                <div className="flex justify-between items-start mb-6"><div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform"><Cpu size={24} /></div><div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${device.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : device.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>{device.status}</div></div>
                <h3 className="text-lg font-bold text-white mb-1">{device.name}</h3><p className="text-xs text-slate-500 font-mono mb-4">#{device.id} • {device.type}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{device.category}</span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase">Last seen: {new Date(device.last_seen).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-end gap-2 mt-6"><button onClick={() => openEditModal(device)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all">Configure</button><button onClick={() => setDeletingDevice(device)} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><Trash2 size={16} /></button></div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg rounded-[32px] border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40">
                <h3 className="text-xl font-bold text-white">Provision New Device</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Device Label</label>
                  <input required type="text" value={addFormData.name} onChange={e => setAddFormData({ ...addFormData, name: e.target.value })} placeholder="e.g. Tank-Pressure-Monitor" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setAddFormData({ ...addFormData, category: 'iot_device', type: 'temperature' })} className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${addFormData.category === 'iot_device' ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>IoT Device</button>
                    <button type="button" onClick={() => setAddFormData({ ...addFormData, category: 'end_device', type: 'workstation' })} className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${addFormData.category === 'end_device' ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>End Device</button>
                  </div>
                </div>

                {addFormData.category === 'iot_device' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                    <select value={addFormData.type} onChange={e => setAddFormData({ ...addFormData, type: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none">
                      <option value="temperature">Temperature</option>
                      <option value="humidity">Humidity</option>
                      <option value="light">Light</option>
                      <option value="pressure">Pressure</option>
                      <option value="server">Server</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:text-white transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-cyan-600 text-white font-bold rounded-2xl hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20">Confirm Registration</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg rounded-[32px] border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40">
                <h3 className="text-xl font-bold text-white">Configure Node</h3>
                <button onClick={() => setEditingDevice(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Display Name</label>
                  <input required type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status Override</label>
                  <select value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none">
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingDevice(null)} className="flex-1 py-3 text-slate-500 font-bold hover:text-white transition-all">Discard Changes</button>
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">Update Configuration</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md rounded-[32px] border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-rose-500/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-3"><AlertTriangle className="text-rose-400" />Confirm Deletion</h3>
                <button onClick={() => setDeletingDevice(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8"><p className="text-slate-300 text-center">Are you sure you want to permanently remove <br /><strong className="font-bold text-white font-mono">{deletingDevice.name}</strong>?<br /> This action cannot be undone.</p><div className="flex gap-4 pt-8"><button type="button" onClick={() => setDeletingDevice(null)} className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-all">Cancel</button><button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20">Delete Device</button></div></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Devices;
