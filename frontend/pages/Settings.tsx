
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Shield, Globe, Save, HelpCircle, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuration updated successfully.');
    }, 1000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings & Profile</h1>
        <p className="text-slate-400 mt-1">Configure your workspace and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <nav className="space-y-2">
          {[
            { id: 'profile', icon: User, label: 'Account Profile' },
            { id: 'notif', icon: Bell, label: 'Notifications' },
            { id: 'security', icon: Shield, label: 'Security & Keys' },
            { id: 'system', icon: Globe, label: 'Cluster Config' },
          ].map((item, i) => (
            <button 
              key={item.id}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${i === 0 ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="lg:col-span-3 space-y-8">
          <div className="glass-card p-8 rounded-[32px] border border-slate-800/50">
            <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                >
                  {loading ? 'Processing...' : <><Save size={18} /> Save Profile</>}
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card p-8 rounded-[32px] border border-slate-800/50">
            <h2 className="text-xl font-bold text-white mb-6">Cluster Connectivity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Globe className="text-emerald-400" size={24} />
                  <div>
                    <p className="text-sm font-bold text-white">Ingress Host (Nginx)</p>
                    <p className="text-xs font-mono text-slate-500">172.26.80.134</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded-full">Operational</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <HardDrive className="text-cyan-400" size={24} />
                  <div>
                    <p className="text-sm font-bold text-white">MicroK8s Namespace</p>
                    <p className="text-xs font-mono text-slate-500">industrial-iot-v2</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-slate-800 text-slate-500 text-[10px] font-bold uppercase rounded-full">v1.28.2</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <HelpCircle className="text-amber-500 shrink-0" size={24} />
            <p className="text-xs text-slate-400 leading-relaxed">
              If you are having trouble connecting to the 172.26.80.134 endpoint, please ensure your VPN is active or contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
