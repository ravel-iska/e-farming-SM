import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Sprout, Calendar, Package, BarChart3, Leaf, BookOpen, MessageSquare, Activity, CloudSun, X } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Lahan', path: '/lahan', icon: Map },
    { name: 'Tanaman', path: '/tanaman', icon: Sprout },
    { name: 'Jadwal', path: '/jadwal', icon: Calendar },
    { name: 'Inventori', path: '/inventori', icon: Package },
    { name: 'Laporan', path: '/laporan', icon: BarChart3 },
  ];

  const extNavItems = [
    { name: 'Edukasi', path: '/edukasi', icon: BookOpen },
    { name: 'Konsultasi', path: '/konsultasi', icon: MessageSquare },
    { name: 'Diagnosa AI', path: '/diagnosa', icon: Activity },
    { name: 'Cuaca', path: '/cuaca', icon: CloudSun },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Leaf className="brand-icon" size={28} />
          <h2>Agro.Tani</h2>
        </div>
        <button 
          className="btn-icon mobile-close-btn" 
          onClick={() => setIsOpen(false)}
          style={{ display: 'none' }}
        >
          <X size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
        
        <div className="nav-divider">Ekstensi</div>
        
        {extNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
