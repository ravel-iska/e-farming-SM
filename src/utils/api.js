const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

function isAdminPath() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

// Ambil token dari localStorage
function getToken() {
  return isAdminPath() ? localStorage.getItem('admin_token') : localStorage.getItem('token');
}

// Simpan token + user info
export function setAuth(token, user) {
  if (user.role === 'admin') {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
  } else {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Hapus auth (logout)
export function clearAuth() {
  if (isAdminPath()) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// Cek apakah user sudah login
export function isAuthenticated() {
  return !!getToken();
}

// Ambil info user
export function getUser() {
  const key = isAdminPath() ? 'admin_user' : 'user';
  const user = localStorage.getItem(key);
  return user ? JSON.parse(user) : null;
}

// Wrapper fetch dengan Authorization header
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  
  // Jika token expired/invalid, redirect ke login (Kecuali jika sedang mencoba login)
  if (res.status === 401 && !endpoint.includes('/auth/login')) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan.');
  }

  return data;
}

// ========== AUTH ==========
export async function loginAPI(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerAPI(name, email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

// ========== LAHAN ==========
export async function getLahan() {
  return apiFetch('/lahan');
}

export async function createLahan(data) {
  return apiFetch('/lahan', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateLahan(id, data) {
  return apiFetch(`/lahan/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteLahan(id) {
  return apiFetch(`/lahan/${id}`, { method: 'DELETE' });
}

// ========== TANAMAN ==========
export async function getTanaman() {
  return apiFetch('/tanaman');
}

export async function createTanaman(data) {
  return apiFetch('/tanaman', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTanaman(id, data) {
  return apiFetch(`/tanaman/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTanaman(id) {
  return apiFetch(`/tanaman/${id}`, { method: 'DELETE' });
}

// TIMELINE TANAMAN
export async function getTanamanTimeline(id) {
  return apiFetch(`/tanaman/${id}/timeline`);
}

export async function createTanamanTimeline(id, data) {
  return apiFetch(`/tanaman/${id}/timeline`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteTanamanTimeline(tanamanId, timelineId) {
  return apiFetch(`/tanaman/${tanamanId}/timeline/${timelineId}`, { method: 'DELETE' });
}

// ========== JADWAL ==========
export async function getJadwal() {
  return apiFetch('/jadwal');
}

export async function createJadwal(data) {
  return apiFetch('/jadwal', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateJadwal(id, data) {
  return apiFetch(`/jadwal/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteJadwal(id) {
  return apiFetch(`/jadwal/${id}`, { method: 'DELETE' });
}

// ========== INVENTORI ==========
export async function getInventori() {
  return apiFetch('/inventori');
}

export async function getKatalog() {
  return apiFetch('/inventori/katalog');
}

export async function createInventori(data) {
  return apiFetch('/inventori', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateInventori(id, data) {
  return apiFetch(`/inventori/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteInventori(id) {
  return apiFetch(`/inventori/${id}`, { method: 'DELETE' });
}

// ========== JUAL BELI & PANEN ==========
export async function panenTanaman(id, quantity) {
  return apiFetch(`/tanaman/${id}/panen`, { 
    method: 'POST', 
    body: JSON.stringify({ quantity }) 
  });
}

export async function jualBarang(inventoryId, quantity, pricePerUnit) {
  return apiFetch('/jualbeli/jual', {
    method: 'POST',
    body: JSON.stringify({ inventoryId, quantity, pricePerUnit })
  });
}

export async function getRiwayatTransaksi() {
  return apiFetch('/jualbeli');
}

export async function beliBarang(inventoryId, quantity, pricePerUnit) {
  return apiFetch('/jualbeli/beli', {
    method: 'POST',
    body: JSON.stringify({ inventoryId, quantity, pricePerUnit })
  });
}

export async function getAdminPengajuan() {
  return apiFetch('/jualbeli/admin/pengajuan');
}

export async function getAdminHistory() {
  return apiFetch('/jualbeli/admin/history');
}

export async function terimaPengajuan(id) {
  return apiFetch(`/jualbeli/admin/terima/${id}`, { method: 'PUT' });
}

export async function tolakPengajuan(id) {
  return apiFetch(`/jualbeli/admin/tolak/${id}`, { method: 'PUT' });
}

// ========== LAPORAN ==========
export async function getLaporanProduktivitas() {
  return apiFetch('/laporan/produktivitas');
}

export async function getLaporanRevenue() {
  return apiFetch('/laporan/revenue');
}

// ========== CUACA ==========
export async function getCuaca(lat, lon) {
  const params = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
  return apiFetch(`/cuaca${params}`);
}

export async function searchLokasi(query) {
  return apiFetch(`/cuaca/search?q=${encodeURIComponent(query)}`);
}

// ========== DIAGNOSA AI ==========
export async function getGejala() {
  return apiFetch('/diagnosa/gejala');
}

export async function analyzeDiagnosa(plant, symptoms) {
  return apiFetch('/diagnosa/analyze', {
    method: 'POST',
    body: JSON.stringify({ plant, symptoms }),
  });
}

export async function analyzeDiagnosaPhoto(imageBase64, plantHint) {
  return apiFetch('/diagnosa/photo', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64, plantHint }),
  });
}

// ========== KONSULTASI ==========
export async function chatKonsultasi(message, history, pakarId) {
  return apiFetch('/konsultasi/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, pakarId }),
  });
}

export async function getPakarPublic() {
  return apiFetch('/konsultasi/pakar');
}

// ========== EDUKASI ==========
export async function getEdukasi() { return apiFetch('/edukasi'); }
export async function createAdminEdukasi(data) { return apiFetch('/admin/edukasi', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateAdminEdukasi(id, data) { return apiFetch(`/admin/edukasi/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteAdminEdukasi(id) { return apiFetch(`/admin/edukasi/${id}`, { method: 'DELETE' }); }

// ========== ADMIN ==========
export async function getAdminStats() { return apiFetch('/admin/stats'); }
export async function getAdminUsers() { return apiFetch('/admin/users'); }
export async function updateAdminUser(id, data) { return apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteAdminUser(id) { return apiFetch(`/admin/users/${id}`, { method: 'DELETE' }); }
export async function getAdminUserDetails(id) { return apiFetch(`/admin/users/${id}/details`); }
export async function getAdminLahan() { return apiFetch('/admin/lahan'); }
export async function getAdminTanaman() { return apiFetch('/admin/tanaman'); }
export async function getAdminInventori() { return apiFetch('/admin/inventori'); }
export async function getAdminJadwal() { return apiFetch('/admin/jadwal'); }
export async function getAdminPakar() { return apiFetch('/admin/konsultasi'); }
export async function createAdminPakar(data) { return apiFetch('/admin/konsultasi', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateAdminPakar(id, data) { return apiFetch(`/admin/konsultasi/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteAdminPakar(id) { return apiFetch(`/admin/konsultasi/${id}`, { method: 'DELETE' }); }
export async function getAdminSettings() { return apiFetch('/admin/settings'); }
export async function updateAdminSettings(data) { return apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }); }
export async function testAdminApiKey(apiKey) { return apiFetch('/admin/test-apikey', { method: 'POST', body: JSON.stringify({ apiKey }) }); }
export async function checkMaintenanceStatus() { return apiFetch('/maintenance/status'); }

// ========== BUG REPORTS (User) ==========
export async function getMyBugs() { return apiFetch('/bugs'); }
export async function createBug(data) { return apiFetch('/bugs', { method: 'POST', body: JSON.stringify(data) }); }
export async function getBugCount() { return apiFetch('/bugs/count'); }

// ========== BUG REPORTS (Admin) ==========
export async function getAdminBugs() { return apiFetch('/admin/bugs'); }
export async function updateAdminBug(id, data) { return apiFetch(`/admin/bugs/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteAdminBug(id) { return apiFetch(`/admin/bugs/${id}`, { method: 'DELETE' }); }

const api = {
  get: (url) => apiFetch(url),
  post: (url, data) => apiFetch(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => apiFetch(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => apiFetch(url, { method: 'DELETE' }),
};

export default api;

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  const baseUrl = API_BASE.replace(/\/api$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
