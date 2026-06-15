import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Lock, Mail, ArrowRight, Loader, BookOpen } from 'lucide-react';
import { loginAPI, setAuth, getEdukasi, getImageUrl } from '../utils/api';
import './Login.css';

const DEFAULT_ARTICLES = [
  {
    title: 'Cara Meningkatkan Hasil Panen Padi di Musim Kemarau',
    content: 'Musim kemarau seringkali menjadi tantangan bagi petani padi. Namun dengan pengelolaan air yang tepat dan pemilihan varietas tahan kering, hasil panen bisa tetap maksimal. Berikut panduannya...',
    imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f2aa0c8cb08?w=800',
    link: '#'
  },
  {
    title: 'Panduan Lengkap Pemupukan Berimbang',
    content: 'Pemberian pupuk yang tidak tepat dosis dapat merusak kesuburan tanah. Pemupukan berimbang adalah kunci untuk menjaga produktivitas lahan secara berkelanjutan dan menghemat biaya produksi...',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    link: '#'
  },
  {
    title: 'Mengenal Hama Wereng dan Cara Mengatasinya',
    content: 'Wereng adalah salah satu hama paling merugikan bagi tanaman padi. Deteksi dini dan penggunaan pestisida nabati dapat membantu meminimalisir kerusakan tanpa merusak ekosistem alami...',
    imageUrl: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?w=800',
    link: '#'
  }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getEdukasi().then(data => {
      if (data && data.length > 0) {
        setArticles(data);
      } else {
        setArticles(DEFAULT_ARTICLES);
      }
    }).catch(err => {
      console.error("Gagal load edukasi:", err);
      setArticles(DEFAULT_ARTICLES);
    });
  }, []);

  // Slider effect
  useEffect(() => {
    if (articles.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % articles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [articles]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginAPI(email, password);
      if (data.user.role === 'admin') {
        throw new Error('Akses ditolak. Harap gunakan halaman khusus admin. (/admin/login)');
      }
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-split login-left">
        <div className="login-brand glass-panel">
          <Leaf className="brand-icon" size={32} />
          <h1 className="brand-title">Tani.Smart</h1>
        </div>
        
        {/* Educational Slider */}
        <div className="left-content slider-container">
          <div className="slides-wrapper" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {articles.map((article, idx) => {
              return (
                <div key={idx} className="slide-item">
                  <div className="slide-image-wrapper">
                    {article.link && article.link !== '#' ? (
                      <a href={article.link} target="_blank" rel="noopener noreferrer" className="slide-link" title="Klik untuk membaca artikel selengkapnya">
                        {article.imageUrl ? <img src={getImageUrl(article.imageUrl)} alt={article.title} className="slide-image" /> : <div style={{width:'100%', height:'100%', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center'}}><BookOpen size={48} color="rgba(255,255,255,0.3)"/></div>}
                      </a>
                    ) : (
                      article.imageUrl ? <img src={getImageUrl(article.imageUrl)} alt={article.title} className="slide-image" /> : <div style={{width:'100%', height:'100%', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center'}}><BookOpen size={48} color="rgba(255,255,255,0.3)"/></div>
                    )}
                  </div>
                  <h2 className="left-headline">{article.title}</h2>
                  <p className="left-sub">{(article.content || '').substring(0, 150)}...</p>
                </div>
              );
            })}
          </div>
          <div className="slider-dots">
            {articles.map((_, idx) => (
              <span 
                key={idx} 
                className={`dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              ></span>
            ))}
          </div>
        </div>

        <div className="login-footer">
          <p>&copy; 2026 Tani.Smart System</p>
        </div>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="login-split login-right">
        <div className="login-form-wrapper glass-panel">
          <div className="form-header">
            <h3>Selamat Datang</h3>
            <p>Silakan masuk ke akun Anda untuk melanjutkan</p>
          </div>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Username / Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="Masukkan Email atau Username Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Ingat saya</span>
              </label>
              <a href="#" className="forgot-password">Lupa Password?</a>
            </div>
            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? <><Loader size={18} className="spin" /> Memproses...</> : <>Masuk Sekarang <ArrowRight size={18} /></>}
            </button>
            <p className="auth-switch">
              Belum punya akun? <Link to="/register" className="auth-link">Daftar di sini</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
