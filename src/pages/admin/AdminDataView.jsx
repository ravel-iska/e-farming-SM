import React, { useState, useEffect } from 'react';
import { Leaf, Search, Map, Package, Wheat } from 'lucide-react';
import { getAdminLahan, getAdminTanaman, getAdminInventori, getAdminJadwal } from '../../utils/api';

// Generik tabel komponen untuk Lahan, Tanaman, Inventori, Jadwal
export default function AdminDataView({ type }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const getImageUrl = (url) => url ? (url.startsWith('data:') || url.startsWith('http') ? url : `http://localhost:5000${url}`) : '';

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (type === 'lahan') res = await getAdminLahan();
      else if (type === 'tanaman') res = await getAdminTanaman();
      else if (type === 'inventori') res = await getAdminInventori();
      else if (type === 'jadwal') res = await getAdminJadwal();
      setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(item => {
    const s = search.toLowerCase();
    return Object.values(item).some(val => val && val.toString().toLowerCase().includes(s));
  });

  const getColumns = () => {
    if (type === 'lahan') return ['Pemilik', 'Foto', 'Nama Blok', 'Luas', 'Sistem Irigasi', 'Koordinat', 'Status'];
    if (type === 'tanaman') return ['Pemilik', 'Foto', 'Tanaman', 'Lahan', 'Est. Panen', 'Progress', 'Kesehatan'];
    if (type === 'inventori') return ['Pemilik', 'Barang', 'Kategori', 'Stok', 'Status'];
    if (type === 'jadwal') return ['Pemilik', 'Kegiatan', 'Tanggal', 'Tipe', 'Status'];
    return [];
  };

  const renderRow = (item, type) => {
    if (type === 'lahan') return (
      <>
        <td><strong>{item.owner_name || 'Hapus/Anonim'}</strong></td>
        <td>
          {item.imageUrl ? (
            <img src={getImageUrl(item.imageUrl)} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Map size={20} color="rgba(255,255,255,0.6)" /></div>
          )}
        </td>
        <td>{item.name}</td>
        <td>{item.area} Ha</td>
        <td>{item.irrigation}</td>
        <td>{(item.latitude && item.longitude) ? <a href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Peta ({Number(item.latitude).toFixed(3)}, {Number(item.longitude).toFixed(3)})</a> : '-'}</td>
        <td><span className={`admin-badge ${item.status === 'Aktif' ? 'success' : 'warning'}`}>{item.status}</span></td>
      </>
    );
    if (type === 'tanaman') return (
      <>
        <td><strong>{item.owner_name || 'Hapus/Anonim'}</strong></td>
        <td>
          {item.imageUrl ? (
            <img src={getImageUrl(item.imageUrl)} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} color="rgba(255,255,255,0.6)" />
            </div>
          )}
        </td>
        <td>{item.name}</td>
        <td>{item.lahanName}</td>
        <td>{item.estHarvest ? new Date(item.estHarvest).toLocaleDateString('id-ID') : '-'}</td>
        <td>{item.progress}%</td>
        <td><span className={`admin-badge ${item.health === 'Baik' ? 'success' : item.health === 'Siap Panen' ? 'info' : 'danger'}`}>{item.health}</span></td>
      </>
    );
    if (type === 'inventori') return (
      <>
        <td><strong>{item.owner_name || 'Hapus/Anonim'}</strong></td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {item.imageUrl ? <img src={getImageUrl(item.imageUrl)} alt={item.item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (item.category === 'Hasil Panen' ? <Wheat size={16} color="rgba(255,255,255,0.5)" /> : <Package size={16} color="rgba(255,255,255,0.5)" />)}
            </div>
            {item.item}
          </div>
        </td>
        <td>{item.category}</td>
        <td>{item.stock} {item.unit}</td>
        <td><span className={`admin-badge ${item.status === 'Aman' ? 'success' : 'danger'}`}>{item.status}</span></td>
      </>
    );
    if (type === 'jadwal') return (
      <>
        <td><strong>{item.owner_name || 'Hapus/Anonim'}</strong></td>
        <td>{item.title}</td>
        <td>{item.date}</td>
        <td>{item.type}</td>
        <td><span className={`admin-badge ${item.status === 'Done' ? 'success' : 'warning'}`}>{item.status}</span></td>
      </>
    );
  };

  const titles = { lahan: 'Data Lahan Sistem', tanaman: 'Data Tanaman Sistem', inventori: 'Inventori Global', jadwal: 'Jadwal Agenda Sistem' };

  if (loading) return <div>Memuat {titles[type]}...</div>;

  return (
    <div className="admin-card animate-fade-in">
      <div className="admin-card-header">
        <h3>{titles[type]}</h3>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
          <Search size={16} />
          <input type="text" placeholder="Cari data..." style={{ background: 'transparent', border: 'none', outline: 'none', marginLeft: '8px' }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="admin-card-body" style={{ padding: 0 }}>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                {getColumns().map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  {renderRow(item, type)}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={getColumns().length} style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
