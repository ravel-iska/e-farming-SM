import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsers, updateAdminUser, deleteAdminUser, getAdminUserDetails } from '../../utils/api';
import { Search, Edit3, Trash2, X, Eye, Map, Sprout, User, Leaf } from 'lucide-react';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');
  
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState('petani');

  const [detailModal, setDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setUsers(await getAdminUsers());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setNewRole(user.role);
    setShowModal(true);
  };

  const saveEdit = async () => {
    try {
      await updateAdminUser(editUser.id, { role: newRole });
      setShowModal(false);
      fetchUsers();
    } catch (err) { alert(err.message); }
  };

  const handleViewDetail = async (user) => {
    setDetailModal(true);
    setLoadingDetail(true);
    try {
      const data = await getAdminUserDetails(user.id);
      setDetailUser(data);
    } catch (err) {
      alert(err.message);
      setDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Yakin ingin menghapus ${user.name}?`)) {
      try {
        await deleteAdminUser(user.id);
        fetchUsers();
      } catch (err) { alert(err.message); }
    }
  };

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'Semua' || u.role === filterRole.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) return <div>Memuat...</div>;

  return (
    <div className="admin-users animate-fade-in">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Manajemen Pengguna</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select style={{ padding: '6px 12px', borderRadius: '6px' }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="Semua">Semua Role</option>
              <option value="Petani">Petani</option>
              <option value="Admin">Admin</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
              <Search size={16} />
              <input type="text" placeholder="Cari nama/email..." style={{ background: 'transparent', border: 'none', outline: 'none', marginLeft: '8px' }} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  {/* <th>Tgl Daftar</th> */}
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td className="text-muted">#{user.id}</td>
                    <td>
                      <button 
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--emerald-primary)', fontWeight: 600, textDecoration: 'none', padding: 0, fontSize: 'inherit', textAlign: 'left' }}
                        title="Lihat Profil Detail"
                      >
                        {user.name} ↗
                      </button>
                    </td>
                    <td>{user.email}</td>
                    <td><span className={`admin-badge ${user.role === 'admin' ? 'danger' : 'info'}`}>{user.role}</span></td>
                    {/* <td>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td> */}
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn-action" onClick={() => navigate(`/admin/users/${user.id}`)} title="Detail Pengguna" style={{ color: 'var(--emerald-primary)' }}><Eye size={16} /></button>
                        <button className="admin-btn-action edit" onClick={() => handleEdit(user)} title="Edit Role"><Edit3 size={16} /></button>
                        <button className="admin-btn-action delete" onClick={() => handleDelete(user)} title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ubah Role Pengguna</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Pengguna: <strong>{editUser.name}</strong> ({editUser.email})</p>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Role</label>
                <select className="form-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="petani">Petani</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn-primary" onClick={saveEdit}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail User */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>Detail Profil Pengguna</h3>
              <button className="btn-icon" onClick={() => setDetailModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
              {loadingDetail ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Memuat detail...</p>
              ) : detailUser ? (
                <div>
                  {/* Profil Utama */}
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px' }}>
                      {detailUser.user.avatar ? <img src={detailUser.user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={40} />}
                    </div>
                    <div>
                      <h2 style={{ margin: '0 0 5px 0' }}>{detailUser.user.name}</h2>
                      <p className="text-muted" style={{ margin: '0 0 10px 0' }}>{detailUser.user.email}</p>
                      <span className={`admin-badge ${detailUser.user.role === 'admin' ? 'danger' : 'info'}`} style={{ display: 'inline-block' }}>{detailUser.user.role.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Lahan */}
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--emerald-primary)' }}>
                    <Map size={20} /> Data Lahan ({detailUser.lahan.length})
                  </h4>
                  {detailUser.lahan.length === 0 ? (
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Pengguna belum mendaftarkan lahan.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      {detailUser.lahan.map(l => (
                        <div key={l.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                          <h5 style={{ margin: '0 0 5px 0' }}>{l.name}</h5>
                          <p className="text-muted" style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>Luas: {l.area} Ha &bull; Irigasi: {l.irrigation}</p>
                          <span style={{ fontSize: '0.8rem', color: l.status === 'Aktif' ? 'var(--emerald-primary)' : 'var(--warning)' }}>Status: {l.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tanaman */}
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--emerald-primary)' }}>
                    <Sprout size={20} /> Data Tanaman ({detailUser.tanaman.length})
                  </h4>
                  {detailUser.tanaman.length === 0 ? (
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Pengguna belum mendaftarkan tanaman.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                      {detailUser.tanaman.map(t => (
                        <div key={t.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {t.imageUrl ? <img src={t.imageUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={20} color="rgba(255,255,255,0.5)" />}
                          </div>
                          <div>
                            <h5 style={{ margin: '0 0 5px 0' }}>{t.name}</h5>
                            <p className="text-muted" style={{ margin: '0 0 5px 0', fontSize: '0.8rem' }}>Lahan: {t.lahanName}</p>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                              <span style={{ color: 'var(--info)' }}>Prog: {t.progress}%</span>
                              <span style={{ color: t.health === 'Baik' ? 'var(--emerald-primary)' : 'var(--danger)' }}>{t.health}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted" style={{ textAlign: 'center' }}>Gagal memuat detail</p>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', paddingTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setDetailModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
