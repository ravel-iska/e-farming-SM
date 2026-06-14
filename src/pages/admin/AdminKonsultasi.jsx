import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getAdminPakar, createAdminPakar, updateAdminPakar, deleteAdminPakar } from '../../utils/api';
import { Search, Edit3, Trash2, X, Plus } from 'lucide-react';

export default function AdminKonsultasi() {
  const [pakars, setPakars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ name: '', focus: '', emoji: '👨‍🌾', color: '#10b981', wa: '', prompt: '', status: 'Online' });

  useEffect(() => { fetchPakar(); }, []);

  const fetchPakar = async () => {
    try { setPakars(await getAdminPakar()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', focus: '', emoji: '👨‍🌾', color: '#10b981', wa: '', prompt: '', status: 'Online' });
    setShowModal(true);
  };

  const openEdit = (pakar) => {
    setEditItem(pakar);
    setForm(pakar);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Mohon isi Nama Lengkap terlebih dahulu!");
      return;
    }
    setSaving(true);
    try {
      if (editItem) await updateAdminPakar(editItem.id, form);
      else await createAdminPakar(form);
      setShowModal(false);
      fetchPakar();
    } catch (err) { alert(err.stack); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Hapus pakar ${name}?`)) {
      try { await deleteAdminPakar(id); fetchPakar(); }
      catch (err) { alert(err.message); }
    }
  };

  if (loading) return <div>Memuat...</div>;

  return (
    <div className="admin-konsultasi animate-fade-in">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Manajemen Pakar Konsultasi</h3>
          <button className="btn-primary" onClick={openAdd} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            <Plus size={16} /> Tambah Pakar
          </button>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Profil Pakar</th>
                  <th>WhatsApp</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pakars.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          {p.emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.focus}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.wa}</td>
                    <td>
                      <span className={`admin-badge ${p.status === 'Online' ? 'success' : 'neutral'}`}>{p.status}</span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn-action edit" onClick={() => openEdit(p)}><Edit3 size={16} /></button>
                        <button className="admin-btn-action delete" onClick={() => handleDelete(p.id, p.name)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    {showModal && ReactDOM.createPortal(
        <div 
          onClick={() => setShowModal(false)} 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div 
            className="glass-panel" 
            onClick={e => e.stopPropagation()} 
            style={{
              width: '100%', maxWidth: '600px',
              maxHeight: '80vh',
              display: 'flex', flexDirection: 'column',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{editItem ? 'Edit Pakar' : 'Tambah Pakar Baru'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            {/* Body - scrollable */}
            <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Dr. Ir. Wahyudi" />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Bidang Fokus</label>
                <input type="text" className="form-input" value={form.focus} onChange={e => setForm({...form, focus: e.target.value})} placeholder="Ahli Hama & Penyakit" />
              </div>
              <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Emoji Avatar</label>
                  <input type="text" className="form-input" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder="👨‍🌾" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Warna Aksen</label>
                  <input type="color" style={{ width: '100%', height: '42px', border: 'none', background: 'transparent' }} value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nomor WhatsApp</label>
                  <input type="text" className="form-input" value={form.wa} onChange={e => setForm({...form, wa: e.target.value})} placeholder="628123..." />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>System Prompt AI (Kepribadian Bot)</label>
                <textarea className="form-input" rows="4" value={form.prompt} onChange={e => setForm({...form, prompt: e.target.value})} placeholder="Kamu adalah ahli..."></textarea>
              </div>
            </div>
            
            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name}>
                {saving ? 'Menyimpan...' : 'Simpan Pakar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
