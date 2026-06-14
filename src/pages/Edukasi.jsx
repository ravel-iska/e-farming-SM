import React, { useState, useEffect } from 'react';
import { BookOpen, Video, PlayCircle, Clock, ChevronRight, ArrowLeft, Search, Leaf, Bug, Droplets, Sun, Handshake, Users, TrendingUp } from 'lucide-react';
import { getEdukasi } from '../utils/api';
import './Ekstensi.css';

export default function Edukasi() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getEdukasi();
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => url ? (url.startsWith('data:') || url.startsWith('http') ? url : `http://localhost:5000${url}`) : '';

  const categories = ['Semua', ...new Set(articles.map(a => a.category).filter(Boolean))];

  const filtered = articles.filter(a => {
    const matchCategory = activeCategory === 'Semua' || a.category === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (selectedArticle) {
    return (
      <div className="extensi-container animate-fade-in">
        <button className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setSelectedArticle(null)}>
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="article-detail glass-panel">
          <div className="article-hero" style={{ backgroundImage: `url(${getImageUrl(selectedArticle.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!selectedArticle.imageUrl && <BookOpen size={64} color="rgba(255,255,255,0.5)" />}
          </div>
          <div className="article-body">
            <span className="edu-tag">{selectedArticle.category || 'Umum'}</span>
            <h1>{selectedArticle.title}</h1>
            <div className="article-meta">
              <span><Clock size={14} /> {selectedArticle.readTime || '-'}</span>
              <span>{selectedArticle.type}</span>
            </div>
            {selectedArticle.link && (
              <div style={{ marginBottom: '1rem' }}>
                <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald-primary)', textDecoration: 'underline' }}>Baca selengkapnya di sumber asli</a>
              </div>
            )}
            <div className="article-content">
              {(selectedArticle.content || '').split('\n').map((line, i) => {
                // Clean all asterisks for display
                const clean = (txt) => txt.replace(/\*+/g, '');
                
                if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i}>{clean(line)}</h3>;
                if (line.startsWith('- ')) return <li key={i}>{clean(line.slice(2))}</li>;
                if (line.match(/^\d+\.\s/)) return <li key={i} className="numbered">{clean(line)}</li>;
                if (line.trim() === '') return <br key={i} />;
                
                // Split on **bold** patterns, render bold parts as <strong>
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return <p key={i}>{parts.map((part, j) => 
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part.replace(/\*/g, '')
                )}</p>;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="extensi-container animate-fade-in">
      <div className="extensi-header">
        <h1 className="text-gradient">Pusat Edukasi</h1>
        <p className="text-muted">Tingkatkan wawasan bertani Anda dengan materi pilihan dari para ahli.</p>
      </div>

      <div className="edu-toolbar">
        <div className="edu-search glass-panel">
          <Search size={18} />
          <input type="text" placeholder="Cari artikel..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="edu-categories">
          {categories.map(cat => (
            <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Memuat artikel...</div>
      ) : (
        <>
          <div className="edu-grid">
            {filtered.map((item) => (
              <div key={item.id} className="edu-card glass-panel" onClick={() => setSelectedArticle(item)}>
                <div className="edu-thumbnail" style={{ backgroundImage: `url(${getImageUrl(item.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!item.imageUrl && <BookOpen size={36} color="rgba(255,255,255,0.3)" />}
                </div>
                <div className="edu-content">
                  <span className="edu-tag">{item.category || 'Umum'}</span>
                  <h3>{item.title}</h3>
                  <p className="text-muted"><Clock size={12} /> {item.readTime || '-'} • {item.type}</p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="no-result glass-panel">
              <BookOpen size={48} style={{ opacity: 0.3 }} />
              <h3>Artikel Tidak Ditemukan</h3>
              <p className="text-muted">Coba kata kunci atau kategori lain.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
