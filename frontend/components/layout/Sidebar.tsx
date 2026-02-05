
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, logout } = useAuth();
  const [activePath, setActivePath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setActivePath(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    // Set initial state
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '#/' },
    { name: 'Devices', icon: Cpu, path: '#/devices' },
    { name: 'Analytics', icon: Activity, path: '#/analytics' },
    ...(isAdmin ? [{ name: 'Users', icon: Users, path: '#/admin/users' }] : []),
  ];

  return (
    <aside
      className={`h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">K8S<span className="text-cyan-400">IOT</span></span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = activePath === item.path || (activePath === '#' && item.path === '#/');
          return (
            <a
              key={item.name}
              href={item.path}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-cyan-500/10'
                : 'hover:bg-slate-800/50'
                } ${!collapsed ? '' : 'justify-center'}`}
            >
              <item.icon size={22} className={
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-400 group-hover:text-cyan-400'
              } />
              {!collapsed && (
                <span className={
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-300 group-hover:text-white font-medium'
                }>
                  {item.name}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className={`flex items-center gap-4 px-3 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={22} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
