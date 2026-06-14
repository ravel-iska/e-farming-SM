import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { ShieldAlert, Bell, ChevronDown, LogOut, Sun, Moon, Menu } from 'lucide-react';
import api, { getAdminBugs, getUser, clearAuth } from '../utils/api';
import './Topbar.css'; // Reuse topbar classes
import '../pages/admin/Admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [maintenance, setMaintenance] = useState(false);
  const user = getUser();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Dropdown states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [bugs, setBugs] = useState([]);
  const [bugCount, setBugCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    const checkMaintenance = async () => {
      try {
        const res = await api.get('/maintenance/status');
        setMaintenance(res.data.active);
      } catch (err) {
        console.error(err);
      }
    };
    checkMaintenance();
    fetchBugs();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate, user, location.pathname]);

  const fetchBugs = async () => {
    try {
      const data = await getAdminBugs();
      const openBugs = data.filter(b => b.status === 'Open');
      setBugs(openBugs);
      setBugCount(openBugs.length);
    } catch (err) { /* ignore */ }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className={`app-layout admin-mode`}>
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {/* Mobile overlay for sidebar */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      <main className="main-content">
        {maintenance && (
          <div className="maintenance-banner animate-fade-in">
            <ShieldAlert size={20} />
            <span><strong>Maintenance Mode Aktif.</strong> Pengguna reguler (Petani) saat ini dialihkan ke halaman pemeliharaan.</span>
          </div>
        )}
        
        <header className="topbar glass-panel admin-topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-icon admin-mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Admin Panel</h1>
          </div>
          <div className="topbar-actions">
            <button className="btn-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="btn-icon notification-btn" onClick={() => { setShowNotif(!showNotif); setShowDropdown(false); if(!showNotif) fetchBugs(); }}>
                <Bell size={20} />
                {bugCount > 0 && <span className="badge">{bugCount}</span>}
              </button>
              
              {showNotif && (
                <div className="profile-dropdown glass-panel animate-fade-in" style={{ width: '340px', right: 0, top: 'calc(100% + 8px)', position: 'absolute', zIndex: 100 }}>
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Laporan Bug Menunggu</strong>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {bugs.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                        <Bell size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
                        <p>Tidak ada laporan baru.</p>
                      </div>
                    ) : bugs.map(bug => (
                      <div key={bug.id} style={{ padding: '10px 1.25rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => { setShowNotif(false); navigate('/admin/bugs'); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{bug.title}</strong>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50px', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>{bug.status}</span>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>oleh {bug.reporter_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="user-profile-dropdown" ref={dropdownRef}>
              <button className="user-profile-trigger" onClick={() => { setShowDropdown(!showDropdown); setShowNotif(false); }}>
                {user.photoUrl ? <img src={user.photoUrl} alt="" className="avatar" style={{ objectFit: 'cover' }} /> : <div className="avatar">{user.name.charAt(0)}</div>}
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role" style={{ color: 'var(--emerald-primary)', fontWeight: 600 }}>Administrator</span>
                </div>
                <ChevronDown size={16} className={`dropdown-chevron ${showDropdown ? 'open' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="profile-dropdown glass-panel animate-fade-in" style={{ right: 0, top: '100%', position: 'absolute' }}>
                  <div className="dropdown-header">
                    {user.photoUrl ? <img src={user.photoUrl} alt="" className="avatar-lg" style={{ objectFit: 'cover' }} /> : <div className="avatar-lg">{user.name.charAt(0)}</div>}
                    <div>
                      <strong>{user.name}</strong>
                      <span className="text-muted">{user.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={() => { clearAuth(); window.location.href = '/login'; }}>
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
