import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Layers, X, Edit3, Trash2, Droplets, Ruler, Camera, Navigation } from 'lucide-react';
import { getLahan, createLahan, updateLahan, deleteLahan } from '../utils/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ManajemenLahan.css';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SOIL_TYPES = ['Lempung', 'Gambut', 'Andosol', 'Pasir Berlempung', 'Lempung Berliat'];
const IRRIGATIONS = ['Baik', 'Sedang', 'Buruk'];
const STATUSES = ['Aktif', 'Istirahat'];

const LocationMarker = ({ position, onChange }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return position.lat ? <Marker position={[position.lat, position.lng]} /> : null;
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], map.getZoom());
    }
  }, [center?.lat, center?.lng, map]);
  return null;
};

export default function ManajemenLahan() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ 
    name: '', area: '', soilType: 'Lempung', irrigation: 'Baik', status: 'Aktif', 
    latitude: -5.397140, longitude: 105.266792, imageUrl: '', address: '' 
  });

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setForm(prev => ({ ...prev, address: data.display_name }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch address", error);
    }
  };

  const handleLocationChange = (lat, lng) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
    fetchAddress(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm(prev => ({ 
            ...prev, 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
          }));
          fetchAddress(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          alert('Gagal mendapatkan lokasi. Pastikan Anda telah memberikan izin akses lokasi pada browser Anda.');
        }
      );
    } else {
      alert('Browser Anda tidak mendukung fitur Geolocation.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran gambar maksimal 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => { fetchLahan(); }, []);

  const fetchLahan = async () => {
    try { setLands(await getLahan()); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ 
      name: '', area: '', soilType: 'Lempung', irrigation: 'Baik', status: 'Aktif',
      latitude: -5.397140, longitude: 105.266792, imageUrl: '', address: '' 
    });
    setShowModal(true);
  };

  const openEdit = (land) => {
    setEditItem(land);
    setForm({ 
      name: land.name, area: land.area, soilType: land.soilType, irrigation: land.irrigation, status: land.status || 'Aktif',
      latitude: land.latitude ? Number(land.latitude) : -5.397140,
      longitude: land.longitude ? Number(land.longitude) : 105.266792,
      imageUrl: land.imageUrl || '',
      address: land.address || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateLahan(editItem.id, { ...form, area: Number(form.area) });
      } else {
        await createLahan({ ...form, area: Number(form.area) });
      }
      setShowModal(false);
      fetchLahan();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteLahan(id); setDeleteConfirm(null); fetchLahan(); }
    catch (err) { alert(err.message); }
  };

  const filtered = lands.filter(l => {
    const matchStatus = filterStatus === 'Semua' || (l.status || 'Aktif') === filterStatus;
    const matchSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.soilType || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalArea = lands.reduce((s, l) => s + (Number(l.area) || 0), 0);

  return (
    <div className="manajemen-lahan animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Manajemen Lahan</h2>
          <p className="text-muted">Kelola blok lahan pertanian dan informasi tanah Anda.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Lahan Baru
        </button>
      </div>

      {/* Stats */}
      <div className="lahan-stats">
        <div className="stat-mini glass-panel">
          <Layers size={20} className="text-emerald" />
          <div><strong>{lands.length}</strong> <span className="text-muted">Blok Lahan</span></div>
        </div>
        <div className="stat-mini glass-panel">
          <Ruler size={20} className="text-info" />
          <div><strong>{totalArea.toFixed(1)}</strong> <span className="text-muted">Hektar Total</span></div>
        </div>
        <div className="stat-mini glass-panel">
          <Droplets size={20} className="text-warning" />
          <div><strong>{lands.filter(l => l.irrigation === 'Baik').length}</strong> <span className="text-muted">Irigasi Baik</span></div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-bar inline">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Cari nama blok atau jenis tanah..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-controls">
          {['Semua', 'Aktif', 'Istirahat'].map(s => (
            <button key={s} className={`btn-filter ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s === 'Semua' ? 'Semua Lahan' : s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Memuat data lahan...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-panel">
          <MapPin size={48} style={{ opacity: 0.3 }} />
          <h3>{lands.length === 0 ? 'Belum ada lahan' : 'Tidak ditemukan'}</h3>
          <p className="text-muted">{lands.length === 0 ? 'Klik "Tambah Lahan Baru" untuk memulai.' : 'Coba kata kunci atau filter lain.'}</p>
        </div>
      ) : (
        <div className="land-grid">
          {filtered.map((land) => (
            <div key={land.id} className="land-card glass-panel">
              <div className="land-image-wrapper" style={land.imageUrl ? { backgroundImage: `url(${land.imageUrl.startsWith('data:') ? land.imageUrl : `http://localhost:5000${land.imageUrl}`})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                <div className="land-image-gradient" style={land.imageUrl ? { background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' } : { background: `linear-gradient(135deg, ${['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444'][land.id % 5]}44, ${['#059669','#2563eb','#d97706','#7c3aed','#dc2626'][land.id % 5]}88)` }}>
                  {!land.imageUrl && <MapPin size={40} color="rgba(255,255,255,0.5)" />}
                </div>
                <div className={`status-badge ${(land.status || 'aktif').toLowerCase()}`}>{land.status || 'Aktif'}</div>
              </div>
              <div className="land-content">
                <h3>{land.name}</h3>
                {land.address && <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', gap: '4px' }}><Navigation size={12} style={{ marginTop: '2px' }}/> {land.address.length > 50 ? land.address.substring(0, 50) + '...' : land.address}</p>}
                <div className="land-meta">
                  <div className="meta-item"><Ruler size={16} /> <span>{land.area} Hektar</span></div>
                  <div className="meta-item"><Layers size={16} /> <span>{land.soilType}</span></div>
                  <div className="meta-item"><Droplets size={16} /> <span>Irigasi: {land.irrigation}</span></div>
                </div>
                <div className="land-actions">
                  <button className="btn-icon-sm" title="Edit" onClick={() => openEdit(land)}><Edit3 size={15} /></button>
                  <button className="btn-icon-sm danger" title="Hapus" onClick={() => setDeleteConfirm(land.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Lahan' : 'Tambah Lahan Baru'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label>Nama Blok Lahan</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Blok Barat" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Luas (Hektar)</label>
                  <input type="number" step="0.1" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="0.0" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Jenis Tanah</label>
                  <select value={form.soilType} onChange={e => setForm({ ...form, soilType: e.target.value })}>
                    {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sistem Irigasi</label>
                  <select value={form.irrigation} onChange={e => setForm({ ...form, irrigation: e.target.value })}>
                    {IRRIGATIONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Dokumentasi Gambar Lahan (Maks 5MB)</label>
                <div className="image-upload-wrapper" style={{ border: '2px dashed var(--border)', padding: '1rem', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                  {form.imageUrl ? (
                    <img src={form.imageUrl.startsWith('data:') ? form.imageUrl : `http://localhost:5000${form.imageUrl}`} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
                      <Camera size={32} style={{ margin: '0 auto 0.5rem' }} />
                      <p>Klik untuk mengunggah foto lahan</p>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Koordinat Lahan</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Pilih dari peta, ketik manual, atau gunakan GPS.</p>
                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleGetCurrentLocation}>
                    <Navigation size={14} style={{ marginRight: '4px' }} /> Lokasi Saat Ini
                  </button>
                </div>
                
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem' }}>Latitude</label>
                    <input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem' }}>Longitude</label>
                    <input type="number" step="any" value={form.longitude} onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm({ ...form, longitude: val });
                      if(form.latitude) fetchAddress(form.latitude, val);
                    }} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem' }}>Alamat Terdeteksi</label>
                  <textarea rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Alamat otomatis akan muncul saat Anda mengklik peta..."></textarea>
                </div>

                <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <MapContainer center={[form.latitude, form.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapUpdater center={{ lat: form.latitude, lng: form.longitude }} />
                    <LocationMarker position={{ lat: form.latitude, lng: form.longitude }} onChange={handleLocationChange} />
                  </MapContainer>
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

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content glass-panel small animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3>Hapus Lahan?</h3>
            <p className="text-muted">Data lahan yang dihapus tidak dapat dikembalikan.</p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
