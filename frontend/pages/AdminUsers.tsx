
import React, { useEffect, useState } from 'react';
import { Shield, Mail, Key, User, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

interface UserData {
  email: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const adminCount = users.filter(u => u.is_admin).length;
  const standardCount = users.length - adminCount;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Identity & Access</h1>
              <p className="text-slate-400 mt-1 font-medium italic">Global user directory and access control auditing.</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold px-6 py-3 rounded-2xl transition-all"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4 bg-cyan-500/5">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Admins</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : adminCount}</h3>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4 bg-emerald-500/5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standard Users</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : standardCount}</h3>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-slate-800/50 flex items-center gap-4 bg-amber-500/5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Key size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Sessions</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{users.length}</h3>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[32px] border border-slate-800/50 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-20 flex items-center justify-center">
            <RefreshCcw size={32} className="text-cyan-500 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">User Identity</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">System Role</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">Authorized Since</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {users.map((user, idx) => (
                  <motion.tr
                    key={user.email}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-slate-900/40 transition-colors border-b border-slate-800/50 last:border-0"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-inner">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 tracking-tight">{user.email.split('@')[0]}</p>
                          <p className="text-xs text-slate-500 font-medium italic">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all flex items-center gap-2 w-fit ${user.is_admin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                        {user.is_admin ? <Shield size={12} /> : null}
                        {user.is_admin ? 'Global Administrator' : 'Standard Operator'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-400 font-bold">
                        {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">Provisioned Access</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && !loading && (
        <div className="mt-12 py-20 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[40px]">
          <User size={48} className="mb-4 opacity-20" />
          <p className="text-xl font-bold uppercase tracking-widest">No users found</p>
          <p className="text-sm mt-2 font-medium">The identity database appears to be empty.</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
