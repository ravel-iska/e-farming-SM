import React, { useState, useEffect } from 'react';
import { Calendar, Watch, CheckCircle2, AlertCircle, Plus, X, Edit3, Trash2, Leaf, PackagePlus, History, Camera, Image as ImageIcon } from 'lucide-react';
import { getTanaman, createTanaman, updateTanaman, deleteTanaman, getLahan, panenTanaman, getTanamanTimeline, createTanamanTimeline } from '../utils/api';
import './DataTanaman.css';

const PLANT_ICONS = { 'Padi': '🌾', 'Jagung': '🌽', 'Kedelai': '🌱', 'Tomat': '🍅', 'Cabai': '🌶️', 'Semangka': '🍉', 'Melon': '🍈' };
const HEALTH_OPTIONS = ['Baik', 'Perlu Perhatian', 'Siap Panen'];

export default function DataTanaman() {
  const [crops, setCrops] = useState([]);
  const [lahans, setLahans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [panenModal, setPanenModal] = useState(null);
  const [panenAmount, setPanenAmount] = useState('');
  const [form, setForm] = useState({ name: '', icon: '🌾', lahanName: '', plantDate: '', estHarvest: '', progress: 0, health: 'Baik', imageUrl: '' });

  const [timelineModal, setTimelineModal] = useState(null);
  const [timelines, setTimelines] = useState([]);
  const [timelineForm, setTimelineForm] = useState({ title: '', description: '', imageUrl: '', date: '' });
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cropsData, lahanData] = await Promise.all([getTanaman(), getLahan()]);
      setCrops(cropsData);
      setLahans(lahanData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', icon: '🌾', lahanName: lahans[0]?.name || '', plantDate: new Date().toISOString().split('T')[0], estHarvest: '', progress: 0, health: 'Baik', imageUrl: '' });
    setShowModal(true);
  };

  const openEdit = (crop) => {
    setEditItem(crop);
    setForm({ name: crop.name, lahanName: crop.lahanName, plantDate: crop.plantDate, estHarvest: crop.estHarvest, progress: crop.progress, health: crop.health, imageUrl: crop.imageUrl || '' });
    setShowModal(true);
  };

  const handleImageChange = (e, setTargetForm) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('Ukuran gambar maksimal 2MB');
      const reader = new FileReader();
      reader.onloadend = () => setTargetForm(prev => ({ ...prev, imageUrl: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateTanaman(editItem.id, { ...form, progress: Number(form.progress) });
      } else {
        await createTanaman({ ...form, progress: Number(form.progress) });
      }
      setShowModal(false);
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteTanaman(id); setDeleteConfirm(null); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const handlePanen = async () => {
    if (!panenAmount) return;
    setSaving(true);
    try {
      await panenTanaman(panenModal.id, panenAmount);
      setPanenModal(null);
      setPanenAmount('');
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const openTimeline = async (crop) => {
    setTimelineModal(crop);
    setLoadingTimeline(true);
    setTimelineForm({ title: '', description: '', imageUrl: '', date: new Date().toISOString().split('T')[0] });
    try {
      const data = await getTanamanTimeline(crop.id);
      setTimelines(data);
    } catch (err) { console.error(err); }
    finally { setLoadingTimeline(false); }
  };

  const handleSaveTimeline = async () => {
    if (!timelineForm.title) return;
    setSaving(true);
    try {
      await createTanamanTimeline(timelineModal.id, timelineForm);
      setTimelineForm({ title: '', description: '', imageUrl: '', date: new Date().toISOString().split('T')[0] });
      const data = await getTanamanTimeline(timelineModal.id);
      setTimelines(data);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const readyCount = crops.filter(c => c.progress >= 90).length;
  const warningCount = crops.filter(c => c.health === 'Perlu Perhatian').length;

  return (
    <div className="data-tanaman animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Data Tanaman</h2>
          <p className="text-muted">Pantau pertumbuhan dan masa panen seluruh tanaman Anda.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Data Tanaman
        </button>
      </div>

      <div className="crop-controls">
        <div className="progress-summary glass-panel">
          <div className="summary-stat">
            <span className="stat-value text-emerald">{crops.length}</span>
            <span className="stat-label">Total Jenis Tanaman</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value text-info">{readyCount}</span>
            <span className="stat-label">Siap Panen</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value text-warning">{warningCount}</span>
            <span className="stat-label">Perlu Perawatan</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Memuat data tanaman...</p>
      ) : crops.length === 0 ? (
        <div className="empty-state glass-panel">
          <Leaf size={48} style={{ opacity: 0.3 }} />
          <h3>Belum ada data tanaman</h3>
          <p className="text-muted">Klik "Tambah Data Tanaman" untuk memulai.</p>
        </div>
      ) : (
        <div className="crop-grid">
          {crops.map((crop) => (
            <div key={crop.id} className="crop-card glass-panel">
              <div className="crop-header">
                <div className="crop-title-area" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {crop.imageUrl ? <img src={crop.imageUrl} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={24} color="rgba(255,255,255,0.6)" />}
                  </div>
                  <div>
                    <h3>{crop.name}</h3>
                    <span className="crop-land">{crop.lahanName}</span>
                  </div>
                </div>
                <div className="crop-header-right">
                  <div className="crop-health" data-status={crop.health === 'Baik' ? 'good' : crop.health === 'Siap Panen' ? 'excellent' : 'warning'}>
                    {crop.health === 'Perlu Perhatian' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{crop.health}</span>
                  </div>
                  <div className="crop-action-btns">
                    <button className="btn-icon-sm" title="Monitoring Fase" onClick={() => openTimeline(crop)}><History size={14} /></button>
                    <button className="btn-icon-sm" title="Edit" onClick={() => openEdit(crop)}><Edit3 size={14} /></button>
                    <button className="btn-icon-sm danger" title="Hapus" onClick={() => setDeleteConfirm(crop.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>



              <div className="crop-progress-container">
                <div className="progress-labels">
                  <span>Progress Tumbuh</span>
                  <span>{crop.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${crop.progress}%`, background: crop.progress > 80 ? 'var(--emerald-primary)' : crop.progress > 40 ? 'var(--info)' : 'var(--warning)' }}></div>
                </div>
              </div>

              <div className="crop-timeline">
                <div className="timeline-item">
                  <Watch size={16} className="text-muted" />
                  <div className="timeline-text">
                    <span className="label">Tanam</span>
                    <span className="value">{crop.plantDate}</span>
                  </div>
                </div>
                <div className="timeline-line"></div>
                <div className="timeline-item">
                  <Calendar size={16} className="text-emerald" />
                  <div className="timeline-text">
                    <span className="label">Estimasi Panen</span>
                    <span className="value font-medium">{crop.estHarvest}</span>
                  </div>
                </div>
              </div>
              
              {crop.progress >= 90 && (
                <button className="btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'var(--emerald-primary)' }} onClick={() => setPanenModal(crop)}>
                  <PackagePlus size={16} /> Panen ke Gudang
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Data Tanaman' : 'Tambah Data Tanaman'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Foto Utama Tanaman (Opsional)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed rgba(255,255,255,0.2)' }}>
                    {form.imageUrl ? <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} style={{ opacity: 0.5 }} />}
                  </div>
                  <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={16} /> Pilih Foto
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageChange(e, setForm)} />
                  </label>
                  {form.imageUrl && <button className="btn-icon danger" onClick={() => setForm({...form, imageUrl: ''})}><Trash2 size={16}/></button>}
                </div>
              </div>
              
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nama Tanaman <span className="text-danger">*</span></label>
                  <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mis: Padi Inpari 32" />
                </div>
              <div className="form-group">
                <label>Lahan</label>
                <select value={form.lahanName} onChange={e => setForm({ ...form, lahanName: e.target.value })}>
                  {lahans.length > 0 ? lahans.map(l => <option key={l.id} value={l.name}>{l.name}</option>) : <option value="">Belum ada lahan</option>}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Tanam</label>
                  <input type="date" value={form.plantDate} onChange={e => setForm({ ...form, plantDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Estimasi Panen</label>
                  <input type="date" value={form.estHarvest} onChange={e => setForm({ ...form, estHarvest: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Progress (%)</label>
                  <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Kesehatan</label>
                  <select value={form.health} onChange={e => setForm({ ...form, health: e.target.value })}>
                    {HEALTH_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Menyimpan...' : editItem ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Panen */}
      {panenModal && (
        <div className="modal-overlay" onClick={() => setPanenModal(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Panen Tanaman: {panenModal.name}</h3>
              <button className="btn-icon" onClick={() => setPanenModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'left' }}>
              <p style={{ marginBottom: '1rem' }}>Masukkan hasil taksiran panen (Tonase) dari lahan <b>{panenModal.lahanName}</b> untuk dikirim otomatis ke Gudang Logistik.</p>
              <div className="form-group">
                <label>Hasil Panen (Satuan Kg)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Misal: 500" 
                  value={panenAmount}
                  onChange={(e) => setPanenAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setPanenModal(null)}>Batal</button>
              <button className="btn-primary" onClick={handlePanen} disabled={saving || !panenAmount} style={{ background: 'var(--emerald-primary)' }}>
                {saving ? 'Memproses...' : 'Kirim ke Gudang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content glass-panel small animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3>Hapus Tanaman?</h3>
            <p className="text-muted">Data yang dihapus tidak dapat dikembalikan.</p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
      {/* Timeline Modal */}
      {timelineModal && (
        <div className="modal-overlay" onClick={() => setTimelineModal(null)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Monitoring Fase: {timelineModal.name}</h3>
              <button className="btn-icon" onClick={() => setTimelineModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              {/* Form Tambah Timeline */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Tambah Catatan Baru</h4>
                <div className="form-group">
                  <label>Judul Fase / Peristiwa</label>
                  <input type="text" value={timelineForm.title} onChange={e => setTimelineForm({...timelineForm, title: e.target.value})} placeholder="Misal: Pemupukan Tahap 1" />
                </div>
                <div className="form-group">
                  <label>Deskripsi & Analisis</label>
                  <textarea value={timelineForm.description} onChange={e => setTimelineForm({...timelineForm, description: e.target.value})} placeholder="Jelaskan kondisi tanaman saat ini..." rows={3} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px' }}></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Tanggal</label>
                    <input type="date" value={timelineForm.date} onChange={e => setTimelineForm({...timelineForm, date: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Foto Dokumentasi</label>
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '42px' }}>
                      <Camera size={16} /> {timelineForm.imageUrl ? 'Ganti Foto' : 'Pilih Foto'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageChange(e, setTimelineForm)} />
                    </label>
                  </div>
                </div>
                
                {timelineForm.imageUrl && (
                  <div style={{ marginTop: '1rem', width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={timelineForm.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                
                <button className="btn-primary" onClick={handleSaveTimeline} disabled={saving || !timelineForm.title} style={{ marginTop: '1rem', width: '100%' }}>
                  {saving ? 'Menyimpan...' : 'Simpan Catatan Fase'}
                </button>
              </div>

              {/* Daftar Timeline */}
              <h4 style={{ marginBottom: '1rem' }}>Riwayat Pertumbuhan</h4>
              {loadingTimeline ? (
                <p className="text-muted" style={{ textAlign: 'center' }}>Memuat riwayat...</p>
              ) : timelines.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Belum ada catatan fase pertumbuhan.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {timelines.map(t => (
                    <div key={t.id} style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--emerald-primary)', marginTop: '6px' }}></div>
                        <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.1)', marginTop: '8px' }}></div>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: 'var(--emerald-primary)' }}>{t.title}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: t.imageUrl ? '1rem' : 0 }}>{t.description}</p>
                        {t.imageUrl && (
                          <div style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={t.imageUrl} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
