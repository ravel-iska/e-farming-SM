import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit3, Trash2, X } from 'lucide-react';
import { getEdukasi, createAdminEdukasi, updateAdminEdukasi, deleteAdminEdukasi } from '../../utils/api';

export default function AdminEdukasi() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', category: '', type: 'Artikel', readTime: '', link: '', content: '', imageUrl: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getEdukasi();
      setArticles(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getImageUrl = (url) => url ? (url.startsWith('data:') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '')}${url}`) : '';

  const openAdd = () => { 
    setEditItem(null); 
    setForm({ title: '', category: '', type: 'Artikel', readTime: '', link: '', content: '', imageUrl: '' }); 
    setImagePreview(null); 
    setShowModal(true); 
  };

  const openEdit = (item) => { 
    setEditItem(item); 
    setForm({ 
      title: item.title || '', 
      category: item.category || '', 
      type: item.type || 'Artikel', 
      readTime: item.readTime || '', 
      link: item.link || '', 
      content: item.content || '', 
      imageUrl: item.imageUrl || '' 
    }); 
    setImagePreview(getImageUrl(item.imageUrl) || null); 
    setShowModal(true); 
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateAdminEdukasi(editItem.id, form);
      } else {
        await createAdminEdukasi(form);
      }
      setShowModal(false);
      setImagePreview(null);
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { 
      await deleteAdminEdukasi(id); 
      setDeleteConfirm(null); 
      fetchData(); 
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="admin-edukasi animate-fade-in">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>Konten Edukasi</h3>
            <p className="text-muted text-sm" style={{ margin: 0 }}>Kelola artikel, berita, dan panduan untuk petani.</p>
          </div>
          <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Tambah Artikel
          </button>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat data...</div>
          ) : articles.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Belum ada artikel edukasi.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Judul Artikel</th>
                    <th>Tipe & Kategori</th>
                    <th>Estimasi Baca</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {article.imageUrl ? <img src={getImageUrl(article.imageUrl)} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BookOpen size={24} color="rgba(255,255,255,0.5)" />}
                          </div>
                          <span style={{ fontWeight: 600 }}>{article.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge info" style={{ marginRight: '8px' }}>{article.type}</span>
                        {article.category}
                      </td>
                      <td className="text-muted">{article.readTime || '-'}</td>
                      <td>
                        <div className="action-btns" style={{ justifyContent: 'center' }}>
                          <button className="btn-icon-sm" title="Edit" onClick={() => openEdit(article)}><Edit3 size={15} /></button>
                          <button className="btn-icon-sm danger" title="Hapus" onClick={() => setDeleteConfirm(article.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%', maxHeight: '90vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', marginBottom: 0, borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <h3>{editItem ? 'Edit Artikel Edukasi' : 'Tambah Artikel Edukasi'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'left', overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              
              <div className="form-group">
                <label>Foto Header / Thumbnail (Upload atau Paste URL)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '8px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {imagePreview || form.imageUrl ? <img src={imagePreview || getImageUrl(form.imageUrl)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BookOpen size={24} color="rgba(255,255,255,0.3)" />}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" className="form-input" placeholder="https://contoh.com/gambar.jpg" value={form.imageUrl && form.imageUrl.startsWith('http') ? form.imageUrl : ''} onChange={e => { setForm({ ...form, imageUrl: e.target.value }); setImagePreview(null); }} />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="edu-img-upload" />
                      <label htmlFor="edu-img-upload" style={{ cursor: 'pointer', padding: '6px 14px', background: 'var(--emerald-muted)', color: 'var(--emerald-primary)', borderRadius: '6px', fontSize: '0.8rem', display: 'inline-block', margin: 0 }}>📷 Upload Foto</label>
                      {(imagePreview || form.imageUrl) && <button onClick={() => { setImagePreview(null); setForm(prev => ({...prev, imageUrl: ''})); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Hapus Gambar</button>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Judul Artikel <span className="text-danger">*</span></label>
                <input type="text" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Mis: Panduan Menanam Padi SRI" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipe Konten</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="Artikel">Artikel</option>
                    <option value="Berita">Berita</option>
                    <option value="Panduan">Panduan</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Kategori</label>
                  <input type="text" className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Mis: Tanaman Pangan" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Estimasi Waktu Baca</label>
                  <input type="text" className="form-input" value={form.readTime} onChange={e => setForm({ ...form, readTime: e.target.value })} placeholder="Mis: 5 Menit" />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Link Eksternal (Opsional)</label>
                  <input type="text" className="form-input" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <label>Isi Konten / Teks Artikel</label>
                <p className="text-muted text-sm" style={{ marginBottom: '8px' }}>Gunakan **Teks Tebal** untuk judul kecil, dan strip (-) untuk list item.</p>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '150px', resize: 'vertical' }} 
                  value={form.content} 
                  onChange={e => setForm({ ...form, content: e.target.value })} 
                  placeholder="Tulis konten edukasi di sini..."
                ></textarea>
              </div>

            </div>
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexShrink: 0 }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Menyimpan...' : editItem ? 'Update Artikel' : 'Simpan Artikel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth:'350px' }}>
            <h3>Hapus Artikel?</h3>
            <p className="text-muted" style={{ margin: '1rem 0' }}>Artikel ini akan dihapus secara permanen dari sistem.</p>
            <div className="modal-footer" style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn-primary" style={{ background: 'var(--danger)' }} onClick={() => handleDelete(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
