import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminUserDetails } from '../../utils/api';
import { 
  ArrowLeft, User, Map, Sprout, Package, ShoppingCart, 
  Calendar, Mail, BadgeCheck, Banknote, TrendingUp, Clock, Leaf, Wheat
} from 'lucide-react';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const result = await getAdminUserDetails(id);
      setData(result);
    } catch (err) {
      alert('Gagal memuat detail pengguna: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <p>Memuat profil pengguna...</p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <p className="text-muted">Data tidak ditemukan.</p>
      <button className="btn-primary" onClick={() => navigate('/admin/users')} style={{ marginTop: '1rem' }}>Kembali</button>
    </div>
  );

  const { user, lahan, tanaman, inventori, transaksi } = data;
  const totalTransaksiNominal = (transaksi || []).filter(t => t.status === 'Selesai').reduce((sum, t) => sum + Number(t.totalNominal), 0);
  const tanamanAktif = (tanaman || []).filter(t => t.progress < 100).length;

  const getImageUrl = (url) => url ? (url.startsWith('data:') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '')}${url}`) : '';

  const tabStyle = (tab) => ({
    padding: '0.7rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    background: activeTab === tab ? 'var(--emerald-primary)' : 'rgba(255,255,255,0.05)',
    color: activeTab === tab ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      {/* Back Button */}
      <button onClick={() => navigate('/admin/users')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={18} /> Kembali ke Manajemen Pengguna
      </button>

      {/* === PROFILE HEADER (Shopee-style) === */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--emerald-primary), #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '3px solid var(--emerald-primary)' }}>
            {user.avatar ? <img src={getImageUrl(user.avatar)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={48} color="white" />}
          </div>

          {/* Info Utama */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{user.name}</h2>
              <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: user.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: user.role === 'admin' ? '#ef4444' : '#3b82f6' }}>
                {user.role.toUpperCase()}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> {user.email}
            </p>
            {/* <p style={{ color: 'var(--text-secondary)', margin: '0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <Calendar size={14} /> Bergabung sejak {new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p> */}
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { icon: <Map size={20} />, val: lahan.length, label: 'Lahan', color: '#10b981' },
              { icon: <Sprout size={20} />, val: tanaman.length, label: 'Tanaman', color: '#3b82f6' },
              { icon: <Package size={20} />, val: inventori.length, label: 'Barang Gudang', color: '#f59e0b' },
              { icon: <Banknote size={20} />, val: (transaksi || []).length, label: 'Transaksi', color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '90px' }}>
                <div style={{ color: s.color, marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Nominal Banner */}
        {totalTransaksiNominal > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={20} color="var(--emerald-primary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Total Nominal Transaksi Selesai:</span>
            <strong style={{ color: 'var(--emerald-primary)', fontSize: '1.1rem' }}>Rp {totalTransaksiNominal.toLocaleString('id-ID')}</strong>
          </div>
        )}
      </div>

      {/* === TABS === */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['overview', 'lahan', 'tanaman', 'inventori', 'transaksi'].map(tab => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'overview' ? '📊 Ringkasan' : tab === 'lahan' ? `🗺️ Lahan (${lahan.length})` : tab === 'tanaman' ? `🌱 Tanaman (${tanaman.length})` : tab === 'inventori' ? `📦 Gudang (${inventori.length})` : `💰 Transaksi (${(transaksi||[]).length})`}
          </button>
        ))}
      </div>

      {/* === TAB CONTENT === */}

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Lahan Preview */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--emerald-primary)' }}><Map size={18} /> Lahan Terbaru</h4>
            {lahan.length === 0 ? <p className="text-muted">Belum ada lahan.</p> : lahan.slice(0, 3).map(l => (
              <div key={l.id} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{l.name}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{l.area} Ha • {l.irrigation} • <span style={{ color: l.status === 'Aktif' ? 'var(--emerald-primary)' : 'var(--warning)' }}>{l.status}</span></div>
              </div>
            ))}
          </div>
          {/* Tanaman Preview */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#3b82f6' }}><Sprout size={18} /> Tanaman Aktif ({tanamanAktif})</h4>
            {tanaman.length === 0 ? <p className="text-muted">Belum ada tanaman.</p> : tanaman.slice(0, 3).map(t => (
              <div key={t.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {t.imageUrl ? <img src={getImageUrl(t.imageUrl)} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={20} color="rgba(255,255,255,0.5)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                    <span style={{ color: '#3b82f6' }}>Progress {t.progress}%</span>
                    <span style={{ color: t.health === 'Baik' ? 'var(--emerald-primary)' : 'var(--danger)' }}>{t.health}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Transaksi Terbaru */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#8b5cf6' }}><Clock size={18} /> Transaksi Terbaru</h4>
            {(transaksi || []).length === 0 ? <p className="text-muted">Belum ada transaksi.</p> : (transaksi || []).slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', background: t.type === 'Jual' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', color: t.type === 'Jual' ? 'var(--emerald-primary)' : '#818cf8', marginRight: '6px' }}>{t.type}</span>
                  <span style={{ fontSize: '0.85rem' }}>{t.itemName}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rp {Number(t.totalNominal).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lahan Tab */}
      {activeTab === 'lahan' && (
        <div className="glass-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
          {lahan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}><Map size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} /><p>Belum ada data lahan.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {lahan.map(l => (
                <div key={l.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px' }}>
                  {l.imageUrl && <img src={getImageUrl(l.imageUrl)} alt={l.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }} />}
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{l.name}</h5>
                  <div className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
                    <div>📐 Luas: <strong>{l.area} Ha</strong></div>
                    <div>💧 Irigasi: <strong>{l.irrigation || '-'}</strong></div>
                    <div>🪨 Jenis Tanah: <strong>{l.soilType || '-'}</strong></div>
                    {l.address && <div>📍 Alamat: {l.address}</div>}
                    {(l.latitude && l.longitude) && <div>🌍 Koordinat: <a href={`https://maps.google.com/?q=${l.latitude},${l.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Lihat Peta</a></div>}
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', background: l.status === 'Aktif' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: l.status === 'Aktif' ? 'var(--emerald-primary)' : 'var(--warning)' }}>{l.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tanaman Tab */}
      {activeTab === 'tanaman' && (
        <div className="glass-panel" style={{ borderRadius: '12px', padding: '1.5rem' }}>
          {tanaman.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}><Sprout size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} /><p>Belum ada data tanaman.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {tanaman.map(t => (
                <div key={t.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '140px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {t.imageUrl ? <img src={getImageUrl(t.imageUrl)} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={48} color="rgba(255,255,255,0.2)" />}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h5 style={{ margin: '0 0 4px 0' }}>{t.name}</h5>
                    <p className="text-muted" style={{ margin: '0 0 10px 0', fontSize: '0.8rem' }}>Lahan: {t.lahanName || '-'}</p>
                    {/* Progress Bar */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>Progress</span><span>{t.progress}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.progress}%`, background: 'linear-gradient(to right, var(--emerald-primary), #60a5fa)', borderRadius: '3px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: t.health === 'Baik' ? 'var(--emerald-primary)' : 'var(--danger)' }}>● {t.health}</span>
                      <span className="text-muted">Tanam: {new Date(t.plantDate).toLocaleDateString('id-ID')}</span>
                    </div>
                    {t.estHarvest && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem' }}>
                        <span className="text-muted">Panen: {new Date(t.estHarvest).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inventori Tab */}
      {activeTab === 'inventori' && (
        <div className="glass-panel" style={{ borderRadius: '12px', padding: '1.5rem', overflowX: 'auto' }}>
          {inventori.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}><Package size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} /><p>Belum ada barang di gudang.</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Barang', 'Kategori', 'Stok', 'Status'].map(h => <th key={h} style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {inventori.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {inv.imageUrl ? <img src={getImageUrl(inv.imageUrl)} alt={inv.item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (inv.category === 'Hasil Panen' ? <Wheat size={18} color="rgba(255,255,255,0.5)" /> : <Package size={18} color="rgba(255,255,255,0.5)" />)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{inv.item}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.07)' }}>{inv.category}</span></td>
                    <td style={{ padding: '0.75rem 1rem' }}><strong>{inv.stock}</strong> {inv.unit}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', background: inv.status === 'Aman' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: inv.status === 'Aman' ? 'var(--emerald-primary)' : 'var(--danger)' }}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transaksi Tab */}
      {activeTab === 'transaksi' && (
        <div className="glass-panel" style={{ borderRadius: '12px', padding: '1.5rem', overflowX: 'auto' }}>
          {(transaksi || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}><ShoppingCart size={48} style={{ opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} /><p>Belum ada riwayat transaksi.</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Tanggal', 'Tipe', 'Barang', 'Qty', 'Harga/Unit', 'Total', 'Status'].map(h => <th key={h} style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(transaksi || []).map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: t.type === 'Jual' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', color: t.type === 'Jual' ? 'var(--emerald-primary)' : '#818cf8' }}>{t.type}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t.itemName}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{t.quantity}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Rp {Number(t.pricePerUnit).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Rp {Number(t.totalNominal).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', background: t.status === 'Selesai' ? 'rgba(16,185,129,0.2)' : t.status === 'Pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: t.status === 'Selesai' ? 'var(--emerald-primary)' : t.status === 'Pending' ? 'var(--warning)' : 'var(--danger)' }}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
