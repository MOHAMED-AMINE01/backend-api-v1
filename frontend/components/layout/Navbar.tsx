import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User as UserIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <header className="h-20 bg-slate-950/30 backdrop-blur-md border-b border-slate-800/50 px-8 flex items-center justify-end sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-tight">{user?.email || 'Guest'}</p>
            <div className="flex items-center justify-end gap-1">
              {isAdmin && <ShieldCheck size={12} className="text-cyan-400" />}
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isAdmin ? 'Administrator' : 'Standard Operator'}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-xl">
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
