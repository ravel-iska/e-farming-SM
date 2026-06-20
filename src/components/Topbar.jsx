import React, { useEffect, useState, useRef } from 'react';
import { Bell, Search, Sun, Moon, User, LogOut, Settings, ChevronDown, Bug, Send, X, CheckCircle2, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, getUser, getMyBugs, createBug, getBugCount } from '../utils/api';
import './Topbar.css';

export default function Topbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [bugCount, setBugCount] = useState(0);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugCategory, setBugCategory] = useState('Bug');
  const [bugSending, setBugSending] = useState(false);
  const [bugSent, setBugSent] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const user = getUser();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchBugCount();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBugCount = async () => {
    try {
      const data = await getBugCount();
      setBugCount(data.unread || 0);
    } catch (err) { /* ignore */ }
  };

  const fetchBugs = async () => {
    try {
      const data = await getMyBugs();
      setBugs(data);
    } catch (err) { /* ignore */ }
  };

  const handleOpenNotif = () => {
    setShowNotif(!showNotif);
    setShowDropdown(false);
    if (!showNotif) fetchBugs();
  };

  const handleSubmitBug = async () => {
    if (!bugTitle.trim()) return;
    setBugSending(true);
    try {
      await createBug({ title: bugTitle, description: bugDesc, category: bugCategory });
      setBugSent(true);
      setBugTitle(''); setBugDesc(''); setBugCategory('Bug');
      setTimeout(() => { setBugSent(false); setShowBugForm(false); fetchBugs(); fetchBugCount(); }, 1500);
    } catch (err) { console.error(err); }
    finally { setBugSending(false); }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const handleLogout = () => { clearAuth(); navigate('/login'); };

  const userName = user?.name || 'Pengguna';
  const userRole = user?.role === 'admin' ? 'Administrator' : 'Petani';
  const userInitial = userName.charAt(0).toUpperCase();
  const userPhoto = user?.photoUrl;

  return (
    <>
    <header className="topbar glass-panel">
      <div className="topbar-left-mobile">
        <button className="btn-icon mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>
      <div className="search-bar">
        <Search className="search-icon" size={20} />
        <input type="text" placeholder="Cari data lahan, tanaman, dll..." />
      </div>
      
      <div className="topbar-actions">
        <button className="btn-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="btn-primary" onClick={() => setShowBugForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}>
          <Bug size={16} /> <span className="hide-on-mobile">Lapor Bug</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="btn-icon notification-btn" onClick={handleOpenNotif}>
            <Bell size={20} />
            {bugCount > 0 && <span className="badge">{bugCount}</span>}
          </button>
          
          {showNotif && (
            <div className="profile-dropdown glass-panel animate-fade-in" style={{ width: '340px', right: 0, top: 'calc(100% + 8px)', position: 'absolute', zIndex: 100 }}>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Laporan & Notifikasi</strong>
                <button onClick={() => { setShowNotif(false); setShowBugForm(true); }} style={{ background: 'var(--emerald-primary)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Bug size={12} /> Lapor Bug
                </button>
              </div>
              <div className="dropdown-divider"></div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {bugs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    <Bell size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p>Belum ada laporan.</p>
                  </div>
                ) : bugs.map(bug => (
                  <div key={bug.id} style={{ padding: '10px 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{bug.title}</strong>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50px', fontWeight: 600,
                        background: bug.status === 'Open' ? 'rgba(245,158,11,0.15)' : bug.status === 'In Progress' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                        color: bug.status === 'Open' ? 'var(--warning)' : bug.status === 'In Progress' ? 'var(--info)' : 'var(--emerald-primary)'
                      }}>{bug.status}</span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>{bug.category} • {new Date(bug.createdAt).toLocaleDateString('id-ID')}</p>
                    {bug.adminReply && (
                      <div style={{ marginTop: '6px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.08)', fontSize: '0.8rem' }}>
                        <strong style={{ color: 'var(--emerald-primary)' }}>Admin:</strong> {bug.adminReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile Dropdown */}
        <div className="user-profile-dropdown" ref={dropdownRef}>
          <button className="user-profile-trigger" onClick={() => { setShowDropdown(!showDropdown); setShowNotif(false); }}>
            {userPhoto ? <img src={userPhoto} alt="" className="avatar" style={{ objectFit: 'cover' }} /> : <div className="avatar">{userInitial}</div>}
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
            </div>
            <ChevronDown size={16} className={`dropdown-chevron ${showDropdown ? 'open' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="profile-dropdown glass-panel animate-fade-in">
              <div className="dropdown-header">
                {userPhoto ? <img src={userPhoto} alt="" className="avatar-lg" style={{ objectFit: 'cover' }} /> : <div className="avatar-lg">{userInitial}</div>}
                <div>
                  <strong>{userName}</strong>
                  <span className="text-muted">{user?.email}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profil'); }}>
                <User size={16} /> Profil Saya
              </button>

              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Bug Report Modal */}
    {showBugForm && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowBugForm(false)}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Bug size={20} className="text-emerald" /> Lapor Bug / Masukan</h3>
            <button onClick={() => setShowBugForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          
          {bugSent ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle2 size={48} className="text-emerald" />
              <h4 style={{ marginTop: '1rem' }}>Laporan Terkirim!</h4>
              <p className="text-muted">Tim kami akan meninjau segera.</p>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Kategori</label>
                <select className="form-input" value={bugCategory} onChange={e => setBugCategory(e.target.value)}>
                  <option value="Bug">🐛 Bug / Error</option>
                  <option value="Saran">💡 Saran Fitur</option>
                  <option value="UI">🎨 Masalah Tampilan</option>
                  <option value="Lainnya">📝 Lainnya</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Judul Laporan</label>
                <input type="text" className="form-input" value={bugTitle} onChange={e => setBugTitle(e.target.value)} placeholder="Ringkasan masalah..." />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Deskripsi (opsional)</label>
                <textarea className="form-input" value={bugDesc} onChange={e => setBugDesc(e.target.value)} placeholder="Jelaskan detail masalah atau saran Anda..." rows={4} style={{ resize: 'vertical' }} />
              </div>
              <button className="btn-primary" onClick={handleSubmitBug} disabled={bugSending || !bugTitle.trim()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={16} /> {bugSending ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}
