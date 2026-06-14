import React, { useEffect, useState } from 'react';
import { Sprout, Map, Calendar, Package, Sun, Droplets, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLahan, getTanaman, getJadwal, getInventori, getUser } from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [summary, setSummary] = useState({ lahan: 0, tanaman: 0, jadwalHariIni: 0, inventoriKritis: 0 });
  const [recentJadwal, setRecentJadwal] = useState([]);
  const [recentTanaman, setRecentTanaman] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lahanData, tanamanData, jadwalData, inventoriData] = await Promise.all([
        getLahan(), getTanaman(), getJadwal(), getInventori()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const jadwalHariIni = jadwalData.filter(j => j.date === today);
      const inventoriKritis = inventoriData.filter(i => i.status === 'Kritis' || i.status === 'Menipis');

      setSummary({
        lahan: lahanData.length,
        tanaman: tanamanData.length,
        jadwalHariIni: jadwalHariIni.length,
        inventoriKritis: inventoriKritis.length,
      });
      setRecentJadwal(jadwalData.slice(0, 4));
      setRecentTanaman(tanamanData.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  if (loading) return <div className="dashboard animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>Memuat data...</div>;

  return (
    <div className="dashboard animate-fade-in">
      {/* Greeting */}
      <div className="dashboard-header">
        <div>
          <h2>{greeting()}, <span className="text-gradient">{user?.name || 'Petani'}</span> 🌾</h2>
          <p className="text-muted">Berikut ringkasan kondisi pertanian Anda hari ini.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel green-glow" onClick={() => navigate('/lahan')} style={{ cursor: 'pointer' }}>
          <div className="metric-icon bg-green"><Map size={24} /></div>
          <div className="metric-info">
            <p>Total Lahan</p>
            <h3>{summary.lahan}</h3>
            <span className="trend neutral">Blok terdaftar</span>
          </div>
        </div>
        <div className="metric-card glass-panel blue-glow" onClick={() => navigate('/tanaman')} style={{ cursor: 'pointer' }}>
          <div className="metric-icon bg-blue"><Sprout size={24} /></div>
          <div className="metric-info">
            <p>Tanaman Aktif</p>
            <h3>{summary.tanaman}</h3>
            <span className="trend neutral">Sedang dikelola</span>
          </div>
        </div>
        <div className="metric-card glass-panel orange-glow" onClick={() => navigate('/jadwal')} style={{ cursor: 'pointer' }}>
          <div className="metric-icon bg-orange"><Calendar size={24} /></div>
          <div className="metric-info">
            <p>Jadwal Hari Ini</p>
            <h3>{summary.jadwalHariIni}</h3>
            <span className="trend neutral">Kegiatan</span>
          </div>
        </div>
        <div className="metric-card glass-panel purple-glow" onClick={() => navigate('/inventori')} style={{ cursor: 'pointer' }}>
          <div className="metric-icon bg-purple"><Package size={24} /></div>
          <div className="metric-info">
            <p>Stok Kritis</p>
            <h3>{summary.inventoriKritis}</h3>
            <span className={`trend ${summary.inventoriKritis > 0 ? 'negative' : 'positive'}`}>
              {summary.inventoriKritis > 0 ? 'Perlu restock!' : 'Aman semua'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="charts-grid">
        {/* Tanaman Terbaru */}
        <div className="chart-card glass-panel">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🌱 Tanaman Saya</h3>
            <button onClick={() => navigate('/tanaman')} style={{ background: 'none', border: 'none', color: 'var(--emerald-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 0.5rem' }}>
            {recentTanaman.length > 0 ? recentTanaman.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.imageUrl ? <img src={t.imageUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Sprout size={20} color="var(--emerald-primary)" />}
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{t.lahanName}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.progress}%</div>
                  <div style={{ width: '60px', height: '4px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${t.progress}%`, height: '100%', background: t.progress >= 90 ? 'var(--emerald-primary)' : 'var(--info)', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            )) : <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada tanaman. Mulai tanam sekarang!</p>}
          </div>
        </div>

        {/* Jadwal Terbaru */}
        <div className="chart-card glass-panel">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>📅 Jadwal Terdekat</h3>
            <button onClick={() => navigate('/jadwal')} style={{ background: 'none', border: 'none', color: 'var(--emerald-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 0.5rem' }}>
            {recentJadwal.length > 0 ? recentJadwal.map(j => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: j.status === 'Done' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: j.status === 'Done' ? 'var(--emerald-primary)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{j.title}</strong>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{j.date} • {j.type}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '50px', background: j.status === 'Done' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: j.status === 'Done' ? 'var(--emerald-primary)' : 'var(--warning)' }}>
                  {j.status}
                </span>
              </div>
            )) : <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada jadwal.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
