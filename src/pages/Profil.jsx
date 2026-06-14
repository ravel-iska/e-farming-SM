import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Calendar, Save, Lock, Eye, EyeOff, CheckCircle2, Camera, Trash2 } from 'lucide-react';
import api, { getUser, setAuth, getImageUrl } from '../utils/api';
import './Ekstensi.css';

export default function Profil() {
  const user = getUser();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [photoPreview, setPhotoPreview] = useState(user?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  // Password change
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setPhotoUrl(ev.target.result); // base64
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setPhotoUrl('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = await api.put('/auth/profile', { name, photoUrl });
      setAuth(localStorage.getItem('token'), { ...user, name: data.name, photoUrl: data.photoUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { setPwMsg('Password baru tidak cocok!'); return; }
    if (newPw.length < 6) { setPwMsg('Password minimal 6 karakter.'); return; }
    setPwMsg('');
    try {
      await api.put('/auth/change-password', { oldPassword: oldPw, newPassword: newPw });
      setPwMsg('✅ Password berhasil diubah!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg(err.message || 'Gagal mengubah password.');
    }
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="ekstensi-page animate-fade-in">
      <div className="ekstensi-header">
        <div className="ekstensi-icon" style={{ background: 'var(--emerald-muted)', color: 'var(--emerald-primary)' }}>
          <User size={28} />
        </div>
        <div>
          <h1>Profil Saya</h1>
          <p>Kelola informasi akun dan keamanan Anda</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Kartu Info Profil */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
          {/* Photo Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              {photoPreview ? (
                <img src={getImageUrl(photoPreview)} alt="Foto Profil" style={{
                  width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover',
                  border: '4px solid var(--emerald-primary)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                }} />
              ) : (
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: 'var(--emerald-muted)', color: 'var(--emerald-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', fontWeight: 700,
                  border: '4px solid var(--emerald-primary)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                }}>
                  {initial}
                </div>
              )}
              <button onClick={() => fileInputRef.current.click()} style={{
                position: 'absolute', bottom: '0', right: '0',
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--emerald-primary)', color: '#fff',
                border: '3px solid var(--bg-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Camera size={14} />
              </button>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </div>
            <h2 style={{ margin: '1rem 0 0', fontSize: '1.3rem' }}>{name}</h2>
            <span className="text-muted">{user?.role === 'admin' ? '🛡️ Administrator' : '🌾 Petani'}</span>
            {photoPreview && (
              <button onClick={handleRemovePhoto} style={{
                marginTop: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Trash2 size={12} /> Hapus Foto
              </button>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><User size={14} /> Nama Lengkap</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><Mail size={14} /> Email</label>
            <input type="email" className="form-input" value={email} disabled style={{ opacity: 0.6 }} />
            <small className="text-muted">Email tidak dapat diubah</small>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <Shield size={18} className="text-emerald" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '0.8rem' }} className="text-muted">Role</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <div className="glass-panel" style={{ flex: 1, padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <Calendar size={18} className="text-emerald" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '0.8rem' }} className="text-muted">Bergabung</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>2026</div>
            </div>
          </div>

          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saved ? <><CheckCircle2 size={18} /> Tersimpan!</> : saving ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
          </button>
        </div>

        {/* Kartu Ubah Password */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} /> Ubah Password
          </h3>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Password Lama</label>
            <div style={{ position: 'relative' }}>
              <input type={showOldPw ? 'text' : 'password'} className="form-input" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Masukkan password lama" />
              <button type="button" onClick={() => setShowOldPw(!showOldPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Password Baru</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPw ? 'text' : 'password'} className="form-input" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimal 6 karakter" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Konfirmasi Password Baru</label>
            <input type="password" className="form-input" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Ulangi password baru" />
          </div>

          {pwMsg && <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', background: pwMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: pwMsg.includes('✅') ? 'var(--emerald-primary)' : 'var(--danger)' }}>{pwMsg}</div>}

          <button className="btn-primary" onClick={handleChangePassword} disabled={!oldPw || !newPw || !confirmPw}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Lock size={18} /> Ubah Password
          </button>
        </div>
      </div>
    </div>
  );
}
