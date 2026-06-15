import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, User, MessageCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import './GlobalChat.css';

// WhatsApp admin number — ganti sesuai nomor admin
const WA_NUMBER = '6281234567890';

export default function GlobalChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const isOpenRef = useRef(false);

  // Keep isOpenRef in sync
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Initialize socket ONCE on mount
  useEffect(() => {
    if (!user || user.role !== 'petani') return;

    const SOCKET_URL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('newMessage', (message) => {
      setMessages(prev => {
        // Prevent duplicates
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Show badge only if window is closed and message is from admin
      if (!isOpenRef.current && message.isFromAdmin) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Load history on mount
  useEffect(() => {
    if (!user || user.role !== 'petani') return;
    api.get('/chat/history')
      .then(data => {
        setMessages(data);
        const unread = data.filter(m => m.isFromAdmin && !m.isRead).length;
        setUnreadCount(unread);
      })
      .catch(err => console.error('Gagal memuat chat:', err));
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const sentMsg = await api.post('/chat/send', { message: trimmed });
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setNewMessage('');
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      alert('Gagal mengirim pesan. Coba lagi.');
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!user || user.role !== 'petani') return null;

  return (
    <div className="global-chat-container">
      {isOpen ? (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <User size={20} color="white" />
              </div>
              <div>
                <h4>Admin Pusat Bantuan</h4>
                <span className="chat-status">🟢 Online</span>
              </div>
            </div>
            <button onClick={toggleChat} className="chat-close-btn" aria-label="Tutup chat">
              <X size={20} />
            </button>
          </div>

          {/* WA Fallback Banner */}
          <div className="chat-wa-fallback">
            <span>Butuh respon cepat?</span>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn"
            >
              <MessageCircle size={14} /> Hubungi WA Admin
            </a>
          </div>

          {/* Messages */}
          <div className="chat-body">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <MessageSquare size={36} />
                <p>Belum ada pesan. Kirim pesan untuk mulai bertanya kepada Admin!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`chat-bubble-wrapper ${msg.isFromAdmin ? 'admin' : 'user'}`}
                >
                  <div className="chat-bubble">
                    <p>{msg.message}</p>
                    <span className="chat-time">
                      {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="chat-input-area">
            <input
              type="text"
              placeholder="Ketik pesan Anda..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              disabled={isSending}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim() || isSending}
              aria-label="Kirim pesan"
            >
              {isSending ? (
                <span className="chat-sending-dot" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      ) : (
        <button className="chat-fab" onClick={toggleChat} aria-label="Buka chat">
          <MessageSquare size={28} />
          {unreadCount > 0 && <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      )}
    </div>
  );
}
