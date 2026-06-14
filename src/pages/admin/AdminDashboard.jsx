import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Map, Sprout, MessageSquare, TrendingUp, Activity, Shield, Clock, Banknote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAdminStats, getAdminHistory } from '../../utils/api';

const activityData = [
  { name: 'Sen', users: 4 }, { name: 'Sel', users: 7 }, { name: 'Rab', users: 5 },
  { name: 'Kam', users: 9 }, { name: 'Jum', users: 12 }, { name: 'Sab', users: 6 }, { name: 'Min', users: 3 }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, lahan: 0, tanaman: 0, pakar: 0, recentUsers: [] });
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); fetchTransaksi(); }, []);

  const fetchStats = async () => {
    try { setStats(await getAdminStats()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTransaksi = async () => {
    try { setTransaksi(await getAdminHistory()); }
    catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--emerald-primary)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
      Memuat Dashboard...
    </div>
  );

  const pieData = [
    { name: 'Users', value: Number(stats.users) || 1 },
    { name: 'Lahan', value: Number(stats.lahan) || 1 },
    { name: 'Tanaman', value: Number(stats.tanaman) || 1 },
    { name: 'Pakar', value: Number(stats.pakar) || 1 },
  ];

  return (
    <div className="admin-dashboard animate-fade-in">
      {/* Welcome Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Selamat Datang, <span className="text-gradient">Administrator</span> 👋
          </h2>
          <p className="text-muted" style={{ marginTop: '4px' }}>Pantau seluruh aktivitas sistem Tani.Smart dari sini.</p>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} className="text-emerald" />
          <span style={{ fontSize: '0.85rem' }}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Pengguna', value: stats.users, icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.1)', trend: '+12%' },
          { label: 'Lahan Terdaftar', value: stats.lahan, icon: Map, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', trend: '+5%' },
          { label: 'Data Tanaman', value: stats.tanaman, icon: Sprout, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', trend: '+8%' },
          { label: 'Pakar Aktif', value: stats.pakar, icon: MessageSquare, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', trend: 'Stabil' },
        ].map((item, i) => (
          <div key={i} className="stat-widget" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Decorative gradient blob */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: item.color, filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%' }} />
            <div className="stat-icon" style={{ background: item.bg, color: item.color }}>
              <item.icon size={28} />
            </div>
            <div className="stat-details">
              <h4>{item.label}</h4>
              <h2>{item.value}</h2>
              <span style={{ fontSize: '0.75rem', color: item.color, fontWeight: 600 }}>
                <TrendingUp size={12} style={{ marginRight: '4px' }} />{item.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Activity Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} className="text-emerald" /> Aktivitas Pengguna Mingguan
            </h3>
          </div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.85rem' }} />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} fill="url(#adminGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Distribusi Data */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-emerald" /> Distribusi Data
            </h3>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
              {pieData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Pengguna Pendaftar Terbaru</h3>
          <span className="admin-badge info">{stats.recentUsers.length} terbaru</span>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr><th>Nama</th><th>Email</th><th>Role</th><th>Terdaftar</th></tr>
              </thead>
              <tbody>
                {stats.recentUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--emerald-muted)', color: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          {user.name.charAt(0)}
                        </div>
                        <button onClick={() => navigate(`/admin/users/${user.id}`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--emerald-primary)', fontWeight: 600, padding: 0, fontSize: 'inherit' }}>{user.name} ↗</button>
                      </div>
                    </td>
                    <td className="text-muted">{user.email}</td>
                    <td><span className={`admin-badge ${user.role === 'admin' ? 'danger' : 'info'}`}>{user.role}</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <div className="admin-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Banknote size={18} className="text-emerald" /> Riwayat Transaksi Terbaru</h3>
          <button onClick={() => navigate('/admin/inventori')} style={{ background: 'transparent', border: 'none', color: 'var(--emerald-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Lihat Semua →</button>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          {transaksi.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada riwayat transaksi.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Petani</th>
                    <th>Tipe</th>
                    <th>Barang</th>
                    <th>Qty</th>
                    <th>Harga Pasar / Unit</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.slice(0, 10).map(t => (
                    <tr key={t.id}>
                      <td className="text-muted">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                      <td><strong>{t.userName}</strong></td>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: t.type === 'Jual' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', color: t.type === 'Jual' ? 'var(--emerald-primary)' : '#818cf8' }}>
                          {t.type === 'Jual' ? 'Petani Jual' : 'Petani Beli'}
                        </span>
                      </td>
                      <td>{t.itemName}</td>
                      <td>{t.quantity}</td>
                      <td>Rp {Number(t.pricePerUnit).toLocaleString('id-ID')}</td>
                      <td><strong>Rp {Number(t.totalNominal).toLocaleString('id-ID')}</strong></td>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', background: t.status === 'Selesai' ? 'rgba(16,185,129,0.2)' : t.status === 'Pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: t.status === 'Selesai' ? 'var(--emerald-primary)' : t.status === 'Pending' ? 'var(--warning)' : 'var(--danger)' }}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
