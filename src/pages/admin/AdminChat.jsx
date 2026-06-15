import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, User, MessageSquare, Bot } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import './AdminChat.css';

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeUserRef = useRef(null);

  // Keep activeUserRef in sync
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Initialize socket ONCE
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_admin');
    });

    socket.on('newMessage', (message) => {
      // Update conversation list
      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.user.id === message.userId);
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], latestMessage: message };
          const [moved] = copy.splice(idx, 1);
          return [moved, ...copy];
        } else {
          fetchConversations();
          return copy;
        }
      });

      // Append to active chat if it matches
      const current = activeUserRef.current;
      if (current && current.user.id === message.userId) {
        setMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    fetchConversations();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await api.get('/chat/admin/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  // When admin selects a user → notify server (disable auto-reply for that user)
  const handleSelectUser = useCallback((conv) => {
    const socket = socketRef.current;

    // Tell server: admin left previous user
    if (activeUserRef.current) {
      socket?.emit('admin_left', activeUserRef.current.user.id);
    }

    setActiveUser(conv);
    setMessages([]);

    // Tell server: admin is now viewing this user
    socket?.emit('admin_viewing', conv.user.id);

    // Load history
    api.get(`/chat/admin/history/${conv.user.id}`)
      .then(data => setMessages(data))
      .catch(err => console.error(err));

    // Mark as read locally
    setConversations(prev => prev.map(c =>
      c.user.id === conv.user.id
        ? { ...c, latestMessage: { ...c.latestMessage, isRead: true } }
        : c
    ));
  }, []);

  // Cleanup when admin leaves page
  useEffect(() => {
    return () => {
      if (activeUserRef.current && socketRef.current) {
        socketRef.current.emit('admin_left', activeUserRef.current.user.id);
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !activeUser || isSending) return;

    setIsSending(true);
    try {
      const sentMsg = await api.post(`/chat/admin/send/${activeUser.user.id}`, { message: trimmed });
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, activeUser, isSending]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Pusat Bantuan</h2>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Cari petani..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          {filteredConversations.length === 0 ? (
            <div className="chat-list-empty">Belum ada percakapan</div>
          ) : (
            filteredConversations.map(conv => {
              const isUnread = conv.latestMessage && !conv.latestMessage.isFromAdmin && !conv.latestMessage.isRead;
              const isActive = activeUser?.user.id === conv.user.id;
              return (
                <div
                  key={conv.user.id}
                  className={`chat-list-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                  onClick={() => handleSelectUser(conv)}
                >
                  <div className="chat-list-avatar">
                    <User size={20} color="white" />
                  </div>
                  <div className="chat-list-info">
                    <div className="chat-list-name-time">
                      <h4>{conv.user.name}</h4>
                      <span>
                        {conv.latestMessage
                          ? new Date(conv.latestMessage.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <p className="chat-list-preview">
                      {conv.latestMessage?.isFromAdmin ? 'Anda: ' : ''}
                      {conv.latestMessage?.message?.length > 35
                        ? conv.latestMessage.message.substring(0, 35) + '...'
                        : conv.latestMessage?.message}
                    </p>
                  </div>
                  {isUnread && <span className="unread-dot" />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {activeUser ? (
          <>
            <div className="chat-main-header">
              <div className="chat-list-avatar">
                <User size={20} color="white" />
              </div>
              <div>
                <h3>{activeUser.user.name}</h3>
                <span className="chat-active-status">🟢 Sedang aktif • Auto-reply dinonaktifkan</span>
              </div>
              <div className="auto-reply-badge">
                <Bot size={14} /> Auto-reply OFF
              </div>
            </div>

            <div className="chat-messages-area">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`chat-bubble-wrapper ${msg.isFromAdmin ? 'admin-reply' : 'user-msg'}`}>
                  <div className="chat-bubble">
                    {msg.isFromAdmin && msg.message.includes('Auto-reply') && (
                      <span className="bot-label"><Bot size={11} /> Bot</span>
                    )}
                    <p>{msg.message}</p>
                    <span className="chat-time">
                      {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-area">
              <input
                type="text"
                placeholder="Ketik balasan untuk petani..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                disabled={isSending}
              />
              <button type="submit" className="chat-send-btn-admin" disabled={!newMessage.trim() || isSending}>
                <Send size={18} /> {isSending ? 'Mengirim...' : 'Kirim'}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-main-empty">
            <MessageSquare size={64} />
            <h3>Pilih percakapan untuk memulai</h3>
            <p>Pesan dari petani akan muncul di panel sebelah kiri.</p>
          </div>
        )}
      </div>
    </div>
  );
}
