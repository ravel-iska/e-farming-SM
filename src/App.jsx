import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ManajemenLahan from './pages/ManajemenLahan';
import DataTanaman from './pages/DataTanaman';
import JadwalKegiatan from './pages/JadwalKegiatan';
import Inventori from './pages/Inventori';
import LaporanAnalitik from './pages/LaporanAnalitik';
import Edukasi from './pages/Edukasi';
import Konsultasi from './pages/Konsultasi';
import Diagnosa from './pages/Diagnosa';
import Cuaca from './pages/Cuaca';
import Profil from './pages/Profil';
import Layout from './components/Layout';
import Maintenance from './pages/Maintenance';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLahan from './pages/admin/AdminLahan';
import AdminTanaman from './pages/admin/AdminTanaman';
import AdminInventori from './pages/admin/AdminInventori';
import AdminJadwal from './pages/admin/AdminJadwal';
import AdminEdukasi from './pages/admin/AdminEdukasi';
import AdminKonsultasi from './pages/admin/AdminKonsultasi';
import AdminSettings from './pages/admin/AdminSettings';
import AdminBugReports from './pages/admin/AdminBugReports';
import AdminUserDetail from './pages/admin/AdminUserDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/maintenance" element={<Maintenance />} />
      
      {/* Regular User Routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lahan" element={<ManajemenLahan />} />
        <Route path="/tanaman" element={<DataTanaman />} />
        <Route path="/jadwal" element={<JadwalKegiatan />} />
        <Route path="/inventori" element={<Inventori />} />
        <Route path="/laporan" element={<LaporanAnalitik />} />
        <Route path="/edukasi" element={<Edukasi />} />
        <Route path="/konsultasi" element={<Konsultasi />} />
        <Route path="/diagnosa" element={<Diagnosa />} />
        <Route path="/cuaca" element={<Cuaca />} />
        <Route path="/profil" element={<Profil />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="lahan" element={<AdminLahan />} />
        <Route path="tanaman" element={<AdminTanaman />} />
        <Route path="inventori" element={<AdminInventori />} />
        <Route path="jadwal" element={<AdminJadwal />} />
        <Route path="edukasi" element={<AdminEdukasi />} />
        <Route path="konsultasi" element={<AdminKonsultasi />} />
        <Route path="bugs" element={<AdminBugReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
