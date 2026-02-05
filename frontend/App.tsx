
import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Analytics from './pages/Analytics';
import AdminUsers from './pages/AdminUsers';
import Settings from './pages/Settings';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

const App: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      setCurrentHash(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!isAuthenticated) {
    if (currentHash === '#/register') {
      return <Register />;
    }
    return <Login />;
  }

  const renderContent = () => {
    switch (currentHash) {
      case '#/':
        return <Dashboard />;
      case '#/devices':
        return <Devices />;
      case '#/analytics':
        return <Analytics />;
      case '#/admin/users':
        return isAdmin ? <AdminUsers /> : <Dashboard />;
      case '#/settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-['Outfit']">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
