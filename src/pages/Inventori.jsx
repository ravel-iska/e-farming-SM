import React, { useState, useEffect } from 'react';
import { PackageSearch, Store, Home, Search, Filter, ShoppingCart, Banknote, Plus, Edit3, Trash2, X, AlertTriangle, FileClock, Wheat } from 'lucide-react';
import { getInventori, getKatalog, jualBarang, beliBarang, createInventori, updateInventori, deleteInventori, getRiwayatTransaksi } from '../utils/api';
import './Inventori.css';

const CATEGORIES = ['Pupuk', 'Benih', 'Pestisida', 'Alat Pertanian', 'Hasil Panen', 'Lainnya'];
const STATUS_OPTIONS = ['Aman', 'Menipis', 'Kritis'];

const getMarketPrice = (category) => {
  const prices = {
    'Pupuk': 5000,
    'Benih': 20000,
    'Pestisida': 15000,
    'Alat Pertanian': 50000,
    'Hasil Panen': 8000,
    'Lainnya': 10000
  };
  return prices[category] || 10000;
};

export default function Inventori() {
  const [activeTab, setActiveTab] = useState('katalog'); // 'katalog', 'local', 'riwayat'
  const [katalog, setKatalog] = useState([]);
  const [localInv, setLocalInv] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('Semua');
  
  const [tradeModal, setTradeModal] = useState(null); 
  const [tradeForm, setTradeForm] = useState({ quantity: '', pricePerUnit: '' });
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ item: '', category: 'Pupuk', stock: '', unit: 'kg', status: 'Aman', imageUrl: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getImageUrl = (url) => url ? (url.startsWith('data:') || url.startsWith('http') ? url : `http://localhost:5000${url}`) : '';

  
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchDataSilent();
    }, 5000); // Auto refresh tiap 5 detik
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchDataSilent = async () => {
    try {
      if (activeTab === 'katalog') {
        const data = await getKatalog();
        setKatalog(data);
      } else if (activeTab === 'local') {
        const data = await getInventori();
        setLocalInv(data);
      } else if (activeTab === 'riwayat') {
        const data = await getRiwayatTransaksi();
        setRiwayat(data);
      }
    } catch (err) {} 
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'katalog') {
        setKatalog(await getKatalog());
      } else if (activeTab === 'local') {
        setLocalInv(await getInventori());
      } else if (activeTab === 'riwayat') {
        setRiwayat(await getRiwayatTransaksi());
      }
    } catch (err) { console.error(err); } 
      finally { setLoading(false); }
  };

  const handleTrade = async () => {
    if (!tradeForm.quantity) return;
    setSaving(true);
    try {
      if (tradeModal.type === 'Jual') {
        await jualBarang(tradeModal.item.id, tradeForm.quantity, 0); // price is ignored by backend
        alert('Pengajuan jual sukses! Menunggu konfirmasi Pusat Logistik.');
      } else {
        await beliBarang(tradeModal.item.id, tradeForm.quantity, 0); // price is ignored by backend
        alert('Pengajuan pembelian sukses! Menunggu konfirmasi Pusat Logistik.');
      }
      setTradeModal(null);
      setTradeForm({ quantity: '', pricePerUnit: '' });
      fetchData();
    } catch (err) { alert(err.message); } 
      finally { setSaving(false); }
  };

  const openAdd = () => { setEditItem(null); setForm({ item: '', category: 'Pupuk', stock: '', unit: 'kg', status: 'Aman', imageUrl: '' }); setImagePreview(null); setShowModal(true); };
  const openEdit = (inv) => { setEditItem(inv); setForm({ item: inv.item, category: inv.category, stock: inv.stock, unit: inv.unit, status: inv.status, imageUrl: inv.imageUrl || '' }); setImagePreview(getImageUrl(inv.imageUrl) || null); setShowModal(true); };

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
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteInventori(id); setDeleteConfirm(null); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const currentData = activeTab === 'katalog' ? katalog : localInv;
  const filtered = currentData.filter(inv => {
    const matchCat = filterCat === 'Semua' || inv.category === filterCat;
    const matchSearch = inv.item.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="inventori animate-fade-in" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Supply Chain & Inventori</h2>
          <p className="text-muted">Kelola gudang lokal, beli dari suplai Koperasi, atau jual hasil panen.</p>
        </div>
        {activeTab === 'local' && (
          <button className="btn-primary" onClick={openAdd} style={{ background: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Tambah Modal/Barang
          </button>
        )}
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn-tab ${activeTab === 'katalog' ? 'active' : ''}`} 
          onClick={() => setActiveTab('katalog')}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: activeTab === 'katalog' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeTab === 'katalog' ? 'white' : 'var(--text-secondary)' }}
        >
          <Store size={20} /> Toko Koperasi (Pusat)
        </button>
        <button 
          className={`btn-tab ${activeTab === 'local' ? 'active' : ''}`} 
          onClick={() => setActiveTab('local')}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: activeTab === 'local' ? 'var(--emerald-primary)' : 'rgba(255,255,255,0.05)', color: activeTab === 'local' ? 'white' : 'var(--text-secondary)' }}
        >
          <Home size={20} /> Gudang Milik Saya
        </button>
        <button 
          className={`btn-tab ${activeTab === 'riwayat' ? 'active' : ''}`} 
          onClick={() => setActiveTab('riwayat')}
          style={{ flex: 1, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: activeTab === 'riwayat' ? 'var(--warning)' : 'rgba(255,255,255,0.05)', color: activeTab === 'riwayat' ? 'white' : 'var(--text-secondary)' }}
        >
          <FileClock size={20} /> Riwayat Transaksi
        </button>
      </div>

      {activeTab !== 'riwayat' && (
      <div className="inv-toolbar">
        <div className="inv-search glass-panel">
          <Search size={18} />
          <input type="text" placeholder="Cari barang..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="inv-filters">
          {['Semua', ...CATEGORIES].map(cat => (
            <button key={cat} className={`cat-btn ${filterCat === cat ? 'active' : ''}`} onClick={() => setFilterCat(cat)}>{cat}</button>
          ))}
        </div>
      </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Memuat data {activeTab}...</p>
      ) : activeTab === 'riwayat' ? (
        riwayat.length === 0 ? (
          <div className="empty-state glass-panel">
            <FileClock size={48} style={{ opacity: 0.3 }} />
            <h3>Tidak ada riwayat transaksi</h3>
          </div>
        ) : (
          <div className="table-container glass-panel">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Nama Barang</th>
                  <th>Kuantitas</th>
                  <th>Total Nominal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr key={r.id}>
                    <td className="text-muted">{new Date(r.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`cat-badge ${r.type === 'Jual' ? 'hasil-panen' : 'pupuk'}`} style={{ padding: '4px 8px' }}>{r.type}</span>
                    </td>
                    <td className="font-medium">{r.itemName}</td>
                    <td>{r.quantity}</td>
                    <td>Rp {Number(r.totalNominal).toLocaleString('id-ID')}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                        background: r.status === 'Pending' ? 'rgba(234, 179, 8, 0.2)' : r.status === 'Selesai' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: r.status === 'Pending' ? 'var(--warning)' : r.status === 'Selesai' ? 'var(--emerald-primary)' : 'var(--danger)'
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-panel">
          <PackageSearch size={48} style={{ opacity: 0.3 }} />
          <h3>Tidak ada barang</h3>
          <p className="text-muted">Ganti kata kunci atau kategori lain.</p>
        </div>
      ) : (
        <div className="table-container glass-panel">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Sisa Stok</th>
                <th>Tgl. Update</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {inv.imageUrl ? <img src={getImageUrl(inv.imageUrl)} alt={inv.item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (inv.category === 'Hasil Panen' ? <Wheat size={20} color="rgba(255,255,255,0.5)" /> : <PackageSearch size={20} color="rgba(255,255,255,0.5)" />)}
                      </div>
                      <span className="item-name font-medium">{inv.item}</span>
                    </div>
                  </td>
                  <td><span className={`cat-badge ${(inv.category || '').toLowerCase().replace(' ', '-')}`}>{inv.category}</span></td>
                  <td className="stock-value">
                    <span className={(inv.stock <= 0) ? 'text-danger font-bold' : ''}>{inv.stock} {inv.unit}</span>
                  </td>
                  <td className="text-muted">{inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString('id-ID') : '-'}</td>
                  <td>
                    <div className="action-btns" style={{ justifyContent: 'center' }}>
                      {activeTab === 'katalog' ? (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} 
                          onClick={() => { setTradeModal({ type: 'Beli', item: inv }); setTradeForm({ quantity: '' }); }}
                          disabled={inv.stock <= 0}
                        >
                          <ShoppingCart size={14} /> Beli
                        </button>
                      ) : (
                        <>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--emerald-primary)' }} 
                            onClick={() => { setTradeModal({ type: 'Jual', item: inv }); setTradeForm({ quantity: inv.stock, pricePerUnit: ''}); }}
                          >
                            <Banknote size={14} /> Jual
                          </button>
                          <button className="btn-icon-sm" title="Edit" onClick={() => openEdit(inv)}><Edit3 size={15} /></button>
                          <button className="btn-icon-sm danger" title="Hapus" onClick={() => setDeleteConfirm(inv.id)}><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trade Modal */}
      {tradeModal && (
        <div className="modal-overlay" onClick={() => setTradeModal(null)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{tradeModal.type === 'Jual' ? '💰 Ajukan Penjualan ke Pusat' : '🛒 Beli Barang dari Pusat'}</h3>
              <button className="btn-icon" onClick={() => setTradeModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'left' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Item: <b>{tradeModal.item.item}</b> <br/> 
                Stok Tersedia: <b>{tradeModal.item.stock} {tradeModal.item.unit}</b>
              </p>
              
              <div className="form-group">
                <label>Jumlah ({tradeModal.item.unit})</label>
                <input 
                  type="number" 
                  value={tradeForm.quantity} 
                  onChange={e => setTradeForm({ ...tradeForm, quantity: e.target.value })} 
                  className="form-input" 
                  placeholder={tradeModal.type === 'Jual' ? 'Masukkan kuantitas dijual' : 'Masukkan jumlah yang dibeli'}
                  max={tradeModal.item.stock}
                  min="1"
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Estimasi Harga Pasar:</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--emerald-primary)' }}>
                    Rp {getMarketPrice(tradeModal.item.category).toLocaleString('id-ID')} / {tradeModal.item.unit}
                  </strong>
                </div>
              </div>
              
              {tradeForm.quantity && (
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <span className="text-muted">Total Transaksi:</span>
                  <h3 style={{ color: tradeModal.type === 'Jual' ? 'var(--emerald-primary)' : 'var(--danger)', marginTop: '5px' }}>
                    Rp {(Number(tradeForm.quantity) * getMarketPrice(tradeModal.item.category)).toLocaleString('id-ID')}
                  </h3>
                  <small className="text-muted">
                    {tradeModal.type === 'Jual' ? 'Status: Pending & Menunggu Konfirmasi' : 'Status: Pending & Menunggu Konfirmasi'}
                  </small>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setTradeModal(null)}>Batal</button>
              <button className="btn-primary" onClick={handleTrade} disabled={saving || !tradeForm.quantity} style={{ background: tradeModal.type === 'Jual' ? 'var(--emerald-primary)' : 'var(--info)' }}>
                {saving ? 'Memproses...' : `Konfirmasi ${tradeModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit (Local) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Barang Lokal' : 'Tambah Modal/Barang Lokal'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'left' }}>
              {/* Image Upload */}
              <div className="form-group">
                <label>Foto Barang (Opsional)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PackageSearch size={32} color="rgba(255,255,255,0.3)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="inv-img-upload" />
                    <label htmlFor="inv-img-upload" style={{ cursor: 'pointer', padding: '8px 16px', background: 'var(--emerald-muted)', color: 'var(--emerald-primary)', borderRadius: '6px', fontSize: '0.85rem', display: 'inline-block' }}>📷 Pilih Foto</label>
                    {imagePreview && <button onClick={() => { setImagePreview(null); setForm(prev => ({...prev, imageUrl: ''})); }} style={{ marginLeft: '8px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Hapus</button>}
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Nama Barang</label>
                <input type="text" className="form-input" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} placeholder="Mis: Pupuk NP" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Kategori</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Jumlah Stok</label>
                  <input type="number" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Satuan</label>
                  <select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="unit">unit</option>
                    <option value="sak">sak</option>
                    <option value="botol">botol</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.item.trim()}>
                {saving ? 'Menyimpan...' : editItem ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth:'350px' }}>
            <h3>Hapus Barang?</h3>
            <p className="text-muted" style={{ margin: '1rem 0' }}>Data inventori ini akan dihapus dari gudang Anda secara permanen.</p>
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
