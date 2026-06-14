import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import api, { checkMaintenanceStatus, getUser } from '../utils/api';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }
      
      try {
        const res = await checkMaintenanceStatus();
        if (res.active && user.role !== 'admin') {
          navigate('/maintenance');
          return;
        }
      } catch (err) {
        console.error(err);
      }
      
      setChecking(false);
    };
    checkStatus();
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      <div className="layout-main">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
