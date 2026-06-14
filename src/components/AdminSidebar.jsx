import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Users, Map, Sprout, Package, Calendar, BookOpen, MessageSquare, Settings, LogOut, ArrowLeft, Bug, X } from 'lucide-react';
import './AdminSidebar.css';

import { clearAuth } from '../utils/api';

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  
  const mainNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Data Users', path: '/admin/users', icon: Users },
    { name: 'Data Lahan', path: '/admin/lahan', icon: Map },
    { name: 'Data Tanaman', path: '/admin/tanaman', icon: Sprout },
    { name: 'Data Inventori', path: '/admin/inventori', icon: Package },
    { name: 'Jadwal Sistem', path: '/admin/jadwal', icon: Calendar },
  ];

  const contentNavItems = [
    { name: 'Konten Edukasi', path: '/admin/edukasi', icon: BookOpen },
    { name: 'Pakar Konsultasi', path: '/admin/konsultasi', icon: MessageSquare },
  ];

  const systemNavItems = [
    { name: 'Laporan Bug', path: '/admin/bugs', icon: Bug },
    { name: 'Pengaturan Sistem', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const closeSidebar = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <aside className={`admin-sidebar shadow-lg ${isOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-brand" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck className="brand-icon text-emerald" size={28} />
          <h2>Tani.Admin</h2>
        </div>
        <button 
          className="btn-icon mobile-close-btn" 
          onClick={closeSidebar}
          style={{ color: '#aebacd' }}
        >
          <X size={22} />
        </button>
      </div>

      <nav className="admin-sidebar-nav custom-scrollbar">
        <div className="nav-divider">OVERVIEW</div>
        {mainNavItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/admin'} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
        
        <div className="nav-divider">KONTEN</div>
        {contentNavItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="nav-divider">SISTEM</div>
        {systemNavItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-btn-back" onClick={() => { closeSidebar(); navigate('/dashboard'); }}>
          <ArrowLeft size={18} /> Ke Panel Petani
        </button>
      </div>
    </aside>
  );
}
