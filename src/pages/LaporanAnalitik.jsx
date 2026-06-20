import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Download, PieChart, Activity, DollarSign, Calendar, Loader } from 'lucide-react';
import { getLaporanProduktivitas, getLaporanRevenue } from '../utils/api';
import './LaporanAnalitik.css';

export default function LaporanAnalitik() {
  const [productivityData, setProductivityData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('produktivitas');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodData, revData] = await Promise.all([getLaporanProduktivitas(), getLaporanRevenue()]);
      setProductivityData(prodData.map(d => ({ name: d.month, padi: d.padi, jagung: d.jagung, kedelai: d.kedelai })));
      setRevenueData(revData.map(d => ({ name: d.quarter, revenue: d.revenue, expense: d.expense, profit: d.revenue - d.expense })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Compute stats from data
  const totalPadi = productivityData.reduce((s, d) => s + (d.padi || 0), 0);
  const totalJagung = productivityData.reduce((s, d) => s + (d.jagung || 0), 0);
  const totalKedelai = productivityData.reduce((s, d) => s + (d.kedelai || 0), 0);
  const totalPanen = totalPadi + totalJagung + totalKedelai;
  const totalRevenue = revenueData.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalExpense = revenueData.reduce((s, d) => s + (d.expense || 0), 0);
  const profit = totalRevenue - totalExpense;

  const summaryCards = [
    { title: 'Total Panen', value: totalPanen > 0 ? `${totalPanen.toLocaleString('id-ID')} ton` : '—', change: '+12%', icon: PieChart, color: 'var(--emerald-primary)' },
    { title: 'Pendapatan', value: totalRevenue > 0 ? `Rp ${(totalRevenue).toLocaleString('id-ID')}` : '—', change: '+8%', icon: DollarSign, color: 'var(--info)' },
    { title: 'Pengeluaran', value: totalExpense > 0 ? `Rp ${(totalExpense).toLocaleString('id-ID')}` : '—', change: '-4%', icon: Activity, color: 'var(--danger)' },
    { title: 'Laba Bersih', value: profit !== 0 ? `Rp ${profit.toLocaleString('id-ID')}` : '—', change: profit >= 0 ? '+' : '', icon: TrendingUp, color: 'var(--warning)' },
  ];

  const tooltipStyle = { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' };

  const handleDownload = () => {
    if (productivityData.length === 0 && revenueData.length === 0) {
      alert('Belum ada data laporan untuk diunduh.');
      return;
    }

    let csv = 'LAPORAN PERTANIAN TANI.SMART\n';
    csv += `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

    // Produktivitas
    if (productivityData.length > 0) {
      csv += 'PRODUKTIVITAS (Ton)\n';
      csv += 'Bulan,Padi,Jagung,Kedelai,Total\n';
      productivityData.forEach(d => {
        const total = (d.padi || 0) + (d.jagung || 0) + (d.kedelai || 0);
        csv += `${d.name},${d.padi || 0},${d.jagung || 0},${d.kedelai || 0},${total}\n`;
      });
      csv += `Total,${totalPadi},${totalJagung},${totalKedelai},${totalPanen}\n\n`;
    }

    // Revenue
    if (revenueData.length > 0) {
      csv += 'PENDAPATAN & PENGELUARAN (Juta Rp)\n';
      csv += 'Kuartal,Pendapatan,Pengeluaran,Laba\n';
      revenueData.forEach(d => {
        csv += `${d.name},${d.revenue || 0},${d.expense || 0},${d.profit || 0}\n`;
      });
      csv += `Total,${totalRevenue},${totalExpense},${profit}\n`;
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan_tani_smart_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="laporan-container animate-fade-in">
      <div className="laporan-header">
        <div>
          <h1 className="text-gradient">Laporan & Analitik</h1>
          <p className="text-muted">Pantau performa dan produktivitas pertanian Anda secara real-time.</p>
        </div>
        <button className="btn-primary" onClick={handleDownload}>
          <Download size={18} />
          <span>Unduh Laporan</span>
        </button>
      </div>

      <div className="summary-grid">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.change.startsWith('+');
          return (
            <div key={index} className="summary-card glass-panel">
              <div className="summary-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                <Icon size={24} />
              </div>
              <div className="summary-info">
                <h3>{card.title}</h3>
                <div className="summary-value-row">
                  <span className="summary-value">{card.value}</span>
                  <span className={`summary-change ${isPositive ? 'positive' : 'negative'}`}>
                    {card.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Tab Selector */}
      <div className="chart-tabs">
        <button className={`chart-tab ${activeChart === 'produktivitas' ? 'active' : ''}`} onClick={() => setActiveChart('produktivitas')}>
          📊 Produktivitas
        </button>
        <button className={`chart-tab ${activeChart === 'revenue' ? 'active' : ''}`} onClick={() => setActiveChart('revenue')}>
          💰 Pendapatan vs Pengeluaran
        </button>
        <button className={`chart-tab ${activeChart === 'profit' ? 'active' : ''}`} onClick={() => setActiveChart('profit')}>
          📈 Tren Laba
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}><Loader size={20} className="spin" /> Memuat data laporan...</p>
      ) : (
        <div className="chart-panel glass-panel">
          {activeChart === 'produktivitas' && (
            <>
              <div className="chart-header">
                <h2>Tren Produktivitas Bulanan</h2>
                <div className="chart-legend-custom">
                  <span><span className="dot" style={{ background: 'var(--emerald-primary)' }}></span> Padi</span>
                  <span><span className="dot" style={{ background: 'var(--warning)' }}></span> Jagung</span>
                  <span><span className="dot" style={{ background: 'var(--info)' }}></span> Kedelai</span>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityData}>
                    <defs>
                      <linearGradient id="gradPadi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--emerald-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--emerald-primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradJagung" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="padi" name="Padi" stroke="var(--emerald-primary)" fill="url(#gradPadi)" strokeWidth={3} />
                    <Area type="monotone" dataKey="jagung" name="Jagung" stroke="var(--warning)" fill="url(#gradJagung)" strokeWidth={3} />
                    <Line type="monotone" dataKey="kedelai" name="Kedelai" stroke="var(--info)" strokeWidth={3} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {activeChart === 'revenue' && (
            <>
              <div className="chart-header">
                <h2>Pendapatan vs Pengeluaran (Juta Rp)</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="revenue" name="Pendapatan" fill="var(--emerald-primary)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="var(--danger)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {activeChart === 'profit' && (
            <>
              <div className="chart-header">
                <h2>Tren Laba Bersih per Kuartal (Juta Rp)</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--emerald-primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--emerald-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="profit" name="Laba Bersih" stroke="var(--emerald-primary)" fill="url(#gradProfit)" strokeWidth={3} dot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* Data breakdown table */}
      {!loading && productivityData.length > 0 && (
        <div className="breakdown-section glass-panel">
          <h2>Rincian Produktivitas per Bulan (Ton)</h2>
          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Padi</th>
                  <th>Jagung</th>
                  <th>Kedelai</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {productivityData.map((d, i) => (
                  <tr key={i}>
                    <td className="item-name">{d.name}</td>
                    <td>{d.padi?.toLocaleString('id-ID') || 0}</td>
                    <td>{d.jagung?.toLocaleString('id-ID') || 0}</td>
                    <td>{d.kedelai?.toLocaleString('id-ID') || 0}</td>
                    <td className="font-medium">{((d.padi || 0) + (d.jagung || 0) + (d.kedelai || 0)).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
