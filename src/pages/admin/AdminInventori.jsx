import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, AlertTriangle, Edit3, Trash2, X, Search, Filter, Store, Wheat, FileClock, CheckCircle, XCircle, History } from 'lucide-react';
import { getInventori, createInventori, updateInventori, deleteInventori, getAdminPengajuan, terimaPengajuan, tolakPengajuan, getAdminHistory } from '../../utils/api';

const CATEGORIES = ['Pupuk', 'Benih', 'Pestisida', 'Alat Pertanian', 'Lainnya'];
const STATUS_OPTIONS = ['Aman', 'Menipis', 'Kritis'];

export default function AdminInventori() {
  const [activeTab, setActiveTab] = useState('suplai'); // 'suplai', 'panen', 'pengajuan'
  const [inventory, setInventory] = useState([]);
  const [pengajuan, setPengajuan] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('Semua');
  
  const [form, setForm] = useState({ item: '', category: 'Pupuk', stock: '', unit: 'kg', status: 'Aman', imageUrl: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getImageUrl = (url) => url ? (url.startsWith('data:') || url.startsWith('http') ? url : `http://localhost:5000${url}`) : '';

  useEffect(() => { 
    fetchInventori(); 
    fetchPengajuan();
    fetchHistory();
  }, []);

  const fetchInventori = async () => {
    try { setInventory(await getInventori()); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPengajuan = async () => {
    try { setPengajuan(await getAdminPengajuan()); } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try { setHistory(await getAdminHistory()); } catch (err) { console.error(err); }
  };

  const openAdd = () => { 
    setEditItem(null); 
    setForm({ item: '', category: activeTab === 'panen' ? 'Hasil Panen' : 'Pupuk', stock: '', unit: 'kg', status: 'Aman', imageUrl: '' }); 
    setImagePreview(null);
    setShowModal(true); 
  };
  
  const openEdit = (inv) => { 
    setEditItem(inv); 
    setForm({ item: inv.item, category: inv.category, stock: inv.stock, unit: inv.unit, status: inv.status, imageUrl: inv.imageUrl || '' }); 
    setImagePreview(getImageUrl(inv.imageUrl) || null);
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
    if (!form.item.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateInventori(editItem.id, { ...form, stock: Number(form.stock) });
      } else {
        await createInventori({ ...form, stock: Number(form.stock) });
      }
      setShowModal(false);
      setImagePreview(null);
      fetchInventori();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteInventori(id); setDeleteConfirm(null); fetchInventori(); }
    catch (err) { alert(err.message); }
  };

  const handleKonfirmasi = async (id, jenis) => {
    try {
      if (jenis === 'terima') await terimaPengajuan(id);
      else await tolakPengajuan(id);
      fetchPengajuan();
      fetchInventori();
      fetchHistory();
    } catch (err) { alert(err.message); }
  };

  // Logika Filter Tab
  const currentTabInventory = inventory.filter(inv => {
    if (activeTab === 'suplai') return inv.category !== 'Hasil Panen';
    if (activeTab === 'panen') return inv.category === 'Hasil Panen';
    return false;
  });

  const filtered = currentTabInventory.filter(inv => {
    const matchCat = filterCat === 'Semua' || inv.category === filterCat;
    const matchSearch = inv.item.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredPengajuan = pengajuan.filter(p => p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || p.userName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredHistory = history.filter(p => p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || p.userName.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalItems = currentTabInventory.length;
  const criticalItems = currentTabInventory.filter(i => i.status === 'Kritis' || i.status === 'Menipis').length;
  const totalStock = currentTabInventory.reduce((sum, i) => sum + (Number(i.stock) || 0), 0);

  return (
    <div className="inventori animate-fade-in" style={{ padding: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2>Pusat Logistik & Inventori</h2>
          <p className="text-muted">Kelola katalog barang suplai, tampung panen, dan validasi penjualan Petani.</p>
        </div>
        {activeTab !== 'pengajuan' && activeTab !== 'history' && (
          <button className="btn-primary" onClick={openAdd} style={{ padding: '0.6rem 1.2rem', display: 'flex', gap: '0.5rem', background: 'var(--primary)' }}>
            <Plus size={18} /> Tambah Barang
          </button>
        )}
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn-tab ${activeTab === 'suplai' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('suplai'); setFilterCat('Semua'); }}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: activeTab === 'suplai' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeTab === 'suplai' ? 'white' : 'var(--text-secondary)' }}
        >
          <Store size={20} /> Katalog Suplai Petani
        </button>
        <button 
          className={`btn-tab ${activeTab === 'panen' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('panen'); setFilterCat('Semua'); }}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: activeTab === 'panen' ? 'var(--emerald-primary)' : 'rgba(255,255,255,0.05)', color: activeTab === 'panen' ? 'white' : 'var(--text-secondary)' }}
        >
          <Wheat size={20} /> Gudang Penampung Panen
        </button>
        <button 
          className={`btn-tab ${activeTab === 'pengajuan' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('pengajuan'); setFilterCat('Semua'); }}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', background: activeTab === 'pengajuan' ? 'var(--warning)' : 'rgba(255,255,255,0.05)', color: activeTab === 'pengajuan' ? 'white' : 'var(--text-secondary)' }}
        >
          <FileClock size={20} /> Pengajuan Masuk {pengajuan.length > 0 && <span style={{ background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '5px' }}>{pengajuan.length}</span>}
        </button>
        <button 
          className={`btn-tab ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('history'); setFilterCat('Semua'); }}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255,255,255,0.05)', color: activeTab === 'history' ? 'white' : 'var(--text-secondary)' }}
        >
          <History size={20} /> Riwayat Transaksi
        </button>
      </div>

      {activeTab !== 'pengajuan' && activeTab !== 'history' && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <PackageSearch size={32} color="var(--primary)" />
          <div><h3 style={{ fontSize: '1.5rem', margin: 0 }}>{totalItems}</h3><p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Total Jenis</p></div>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Store size={32} color="var(--emerald-primary)" />
          <div><h3 style={{ fontSize: '1.5rem', margin: 0 }}>{totalStock.toLocaleString('id-ID')}</h3><p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Total Stok</p></div>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', border: criticalItems > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : 'none' }}>
          <AlertTriangle size={32} color={criticalItems > 0 ? "var(--danger)" : "var(--text-muted)"} />
          <div><h3 style={{ fontSize: '1.5rem', margin: 0, color: criticalItems > 0 ? 'var(--danger)' : 'inherit' }}>{criticalItems}</h3><p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Stok Kritis</p></div>
        </div>
      </div>
      )}

      <div className="inv-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="inv-search glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', flex: 1, minWidth: '250px' }}>
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Cari barang atau nama petani..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
        </div>
        {activeTab === 'suplai' && (
          <div className="inv-filters" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {['Semua', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', background: filterCat === cat ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterCat === cat ? 'white' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Memuat data invenrori...</p>
        ) : activeTab === 'pengajuan' ? (
          filteredPengajuan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <FileClock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: 'var(--warning)' }} />
              <h3 style={{ color: 'var(--text-secondary)' }}>Belum ada pengajuan penjualan dari petani</h3>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Tanggal</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Petani</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Tipe</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Barang</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Kuantitas</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Total Rp</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Aksi Persetujuan</th>
                </tr>
              </thead>
              <tbody>
                {filteredPengajuan.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(p.date).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '1rem' }}><strong>{p.userName}</strong></td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: p.type === 'Jual' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: p.type === 'Jual' ? 'var(--emerald-primary)' : '#818cf8' }}>
                        {p.type === 'Jual' ? 'Petani Jual' : 'Petani Beli'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{p.itemName}</td>
                    <td style={{ padding: '1rem' }}>{p.quantity} Kg</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Rp {Number(p.totalNominal).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleKonfirmasi(p.id, 'terima')} title="Terima" style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={16} /> Terima
                        </button>
                        <button onClick={() => handleKonfirmasi(p.id, 'tolak')} title="Tolak" style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={16} /> Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === 'history' ? (
          filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <History size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#6366f1' }} />
              <h3 style={{ color: 'var(--text-secondary)' }}>Belum ada riwayat transaksi</h3>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Tanggal</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Petani</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Tipe</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Barang</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Kuantitas</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Total Rp</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Status Akhir</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(p.date).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '1rem' }}><strong>{p.userName}</strong></td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: p.type === 'Jual' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: p.type === 'Jual' ? 'var(--emerald-primary)' : '#818cf8' }}>
                        {p.type === 'Jual' ? 'Petani Jual' : 'Petani Beli'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{p.itemName}</td>
                    <td style={{ padding: '1rem' }}>{p.quantity} Kg</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Rp {Number(p.totalNominal).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: p.status === 'Selesai' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: p.status === 'Selesai' ? 'var(--emerald-primary)' : 'var(--danger)' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <PackageSearch size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--text-secondary)' }}>Tidak ada {activeTab === 'suplai' ? 'barang suplai' : 'hasil panen'}</h3>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nama Barang</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Kategori</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Stok</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {inv.imageUrl ? <img src={getImageUrl(inv.imageUrl)} alt={inv.item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (inv.category === 'Hasil Panen' ? <Wheat size={24} color="rgba(255,255,255,0.5)" /> : <PackageSearch size={24} color="rgba(255,255,255,0.5)" />)}
                      </div>
                      <strong>{inv.item}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}><span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }}>{inv.category}</span></td>
                  <td style={{ padding: '1rem' }}>{inv.stock} {inv.unit}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', background: inv.status === 'Aman' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: inv.status === 'Aman' ? 'var(--emerald-primary)' : 'var(--danger)' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => openEdit(inv)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit3 size={18} color="var(--text-muted)" /></button>
                      <button onClick={() => setDeleteConfirm(inv.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} color="var(--danger)" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>{editItem ? 'Edit Barang Pusat' : `Buat ${activeTab === 'panen' ? 'Pencatatan Panen' : 'Katalog Baru'}`}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Foto Barang (Opsional)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PackageSearch size={32} color="rgba(255,255,255,0.3)" />}
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="admin-inv-img-upload" />
                    <label htmlFor="admin-inv-img-upload" style={{ cursor: 'pointer', padding: '8px 16px', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald-primary)', borderRadius: '6px', fontSize: '0.85rem', display: 'inline-block' }}>📷 Pilih Foto</label>
                    {imagePreview && <button onClick={() => { setImagePreview(null); setForm(prev => ({...prev, imageUrl: ''})); }} style={{ marginLeft: '8px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Hapus</button>}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nama Barang</label>
                <input type="text" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="Contoh: Pupuk NPK / Jagung" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Kategori</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={activeTab === 'panen'} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', appearance: 'none' }}>
                    {activeTab === 'panen' ? (
                      <option value="Hasil Panen">Hasil Panen</option>
                    ) : (
                      CATEGORIES.map(c => <option key={c} value={c} style={{ background: 'var(--bg-primary)' }}>{c}</option>)
                    )}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', appearance: 'none' }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: 'var(--bg-primary)' }}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Jumlah Stok</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="0" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Satuan</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', appearance: 'none' }}>
                    {['kg', 'liter', 'unit', 'sak', 'botol', 'pack'].map(u => <option key={u} value={u} style={{ background: 'var(--bg-primary)' }}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}>Batal</button>
              <button disabled={saving || !form.item.trim()} onClick={handleSave} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--emerald-primary)', border: 'none', color: 'white', cursor: 'pointer', opacity: (saving || !form.item.trim()) ? 0.5 : 1 }}>
                {saving ? 'Menyimpan...' : editItem ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
         <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Hapus Barang?</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Data inventori ini akan dihapus permanen.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}>Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--danger)', border: 'none', color: 'white', cursor: 'pointer' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
