import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Chat({ isEmbedded = false }) {
  const { user } = useAuth();

  // Chat System States
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const socketRef = useRef(null);
  const activeIdRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Sync ref
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Connect Socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Chat Socket connected'));
    socket.on('connect_error', (err) => console.error('Chat Socket error:', err.message));

    socket.on('message:new', ({ message, conversationId }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => [...prev, message]);
        socket.emit('messages:read', conversationId);
      }
      fetchConversations();
    });

    socket.on('typing:indicator', ({ conversationId, isTyping: t }) => {
      if (conversationId === activeIdRef.current) setTyping(t);
    });

    socket.on('messages:read_receipt', ({ conversationId }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => prev.map((m) => m.senderId?._id === user?.id || m.senderId === user?.id ? { ...m, readAt: m.readAt || new Date().toISOString() } : m));
      }
    });

    socket.on('notification:message', () => fetchConversations());

    return () => { socket.disconnect(); };
  }, [user]);

  const fetchConversations = useCallback(() => {
    api.get('/api/v1/chat/conversations')
      .then((r) => setConversations(r.data || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchConversations();
    api.get('/api/v1/auth/doctors').then((r) => setDoctors(r.data || [])).catch(() => { });
  }, [fetchConversations]);

  const selectConversation = async (conv) => {
    if (activeIdRef.current) socketRef.current?.emit('conversation:leave', activeIdRef.current);
    setActiveId(conv._id);
    try {
      const res = await api.get(`/api/v1/chat/conversations/${conv._id}/messages`);
      setMessages(res.data || []);
      socketRef.current?.emit('conversation:join', conv._id);
      socketRef.current?.emit('messages:read', conv._id);
    } catch { }
  };

  const startConversation = async (doctorId) => {
    try {
      const res = await api.post('/api/v1/chat/conversations', { doctorId });
      fetchConversations();
      selectConversation(res.data);
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    socketRef.current?.emit('message:send', { conversationId: activeId, body: input.trim(), tempId: Date.now().toString() });
    setInput('');
    socketRef.current?.emit('typing:stop', activeId);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', `📎 ${file.name}`);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/v1/chat/conversations/${activeId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        toast.success('File sent!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch { toast.error('Failed to upload file'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeId) return;
    socketRef.current?.emit('typing:start', activeId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socketRef.current?.emit('typing:stop', activeId), 2000);
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const activeConv = conversations.find((c) => c._id === activeId);
  const formattedInitials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U';

  return (
    <div className={isEmbedded ? "w-full h-[calc(100vh-200px)] min-h-[600px]" : "bg-[#f0f4f8] h-screen pt-[90px] pb-0 w-full"} style={!isEmbedded ? { boxSizing: 'border-box' } : {}}>
      <div className={isEmbedded ? "w-full h-full flex bg-[#ffffff] border border-[#E8E5DE] overflow-hidden rounded-[20px] shadow-sm" : "max-w-[1400px] mx-auto w-full h-full px-4 lg:px-8"}>
        <div className="w-full h-full flex bg-[#ffffff] border border-[#E8E5DE] overflow-hidden rounded-[24px] shadow-[0_4px_20px_rgba(54,86,95,0.03)]">
          {/* Messages Sidebar (History List) */}
          <div className={`w-full md:w-[340px] border-r border-[#E8E5DE] flex-col flex-shrink-0 bg-[#Fcfcfc] relative ${activeConv ? 'hidden md:flex' : 'flex'}`}>
            <div className="px-6 py-5 border-b border-[#E8E5DE]/60 flex items-center justify-between bg-white">
              <h4 style={{ fontFamily: "'Figtree', sans-serif", letterSpacing: '-0.5px' }} className="text-[22px] font-bold text-[#1a2b30]">
                All Conversations
              </h4>
              <button className="text-[#8db5c4] hover:text-[#36565F] transition-colors focus:outline-none">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {conversations.map((c) => {
                const isSelected = activeId === c._id;
                const docInitials = c.doctorId?.name
                  ? c.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                  : 'DR';
                return (
                  <div
                    key={c._id}
                    onClick={() => selectConversation(c)}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors relative hover:bg-[#F8F9FA] ${isSelected ? 'bg-[#F8F9FA]' : ''
                      }`}
                  >
                    <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-[#36565F] text-white' : 'bg-[#eef5f7] text-[#36565F]'
                      }`}>
                      {docInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className={`text-[15px] font-bold truncate ${isSelected ? 'text-[#1a2b30]' : 'text-[#36565F]'}`}>
                          {c.doctorId?.name || 'Doctor'}
                        </p>
                        <span className="text-[11px] text-[#8db5c4] font-medium">12:25</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[13px] text-[#6B7C84] truncate flex-1 pr-2">
                          {c.lastMessagePreview || 'No messages yet...'}
                        </p>
                        {c.unreadByPatient > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#8db5c4] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {c.unreadByPatient}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {conversations.length === 0 && (
                <div className="p-8 text-center text-sm text-[#8db5c4]">
                  No conversations yet. Start a new one below!
                </div>
              )}
            </div>

            {/* Sidebar Footer with New Conversation Button */}
            <div className="p-5 bg-white relative border-t border-[#E8E5DE]/40">
              {showDoctorDropdown && (
                <div className="absolute bottom-[calc(100%+16px)] left-5 right-5 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-[#E8E5DE] overflow-hidden z-50">
                  <div className="px-5 py-4 border-b border-[#E8E5DE]/60 bg-[#fcfcfc]">
                    <span className="text-sm font-bold text-[#1a2b30]">Select a Doctor</span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto py-2">
                    {doctors.map(d => (
                      <button
                        key={d._id}
                        onClick={() => {
                          startConversation(d._id);
                          setShowDoctorDropdown(false);
                        }}
                        className="w-full text-left px-5 py-3 text-[15px] font-semibold text-[#36565F] hover:bg-[#eef5f7] transition-colors"
                      >
                        {d.name}
                      </button>
                    ))}
                    {doctors.length === 0 && (
                      <div className="px-5 py-4 text-sm text-[#8db5c4]">No doctors available</div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                className="w-full bg-[#1a2b30] hover:bg-[#2a3b40] text-white font-semibold py-4 px-5 rounded-[16px] flex items-center justify-between transition-colors shadow-lg"
              >
                <span className="text-[15px]">New Conversation</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Active Messaging Thread */}
          <div className={`flex-1 flex-col min-w-0 bg-[#ffffff] ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#Fcfcfc]">
                <div className="w-24 h-24 bg-[#eef5f7] rounded-full flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8db5c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h4 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-2xl font-bold text-[#1a2b30] mb-2">Welcome to Secure Chat</h4>
                <p className="text-[15px] text-[#6B7C84] max-w-sm">Select a conversation from the sidebar or start a new one to connect with your healthcare providers.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 md:px-8 py-4 md:py-5 border-b border-[#E8E5DE]/60 bg-white flex justify-between items-center z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <button
                      className="md:hidden w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-[#f8fafb] text-[#1a2b30] border border-[#E8E5DE]"
                      onClick={() => setActiveId(null)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                    </button>
                    <div className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-full bg-[#eef5f7] flex items-center justify-center text-base md:text-lg font-bold text-[#36565F] flex-shrink-0">
                      {activeConv.doctorId?.name ? activeConv.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'DR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 style={{ fontFamily: "'Figtree', sans-serif", letterSpacing: '-0.5px' }} className="text-xl font-bold text-[#1a2b30]">
                          {activeConv.doctorId?.name}
                        </h2>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6" stroke="none">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
                        </svg>
                      </div>
                      <p className="text-[13px] text-[#6B7C84] mt-0.5">
                        AI-assisted • Escalates to doctor when needed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3">
                    <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-[#F8F9FA] text-[#1a2b30] transition-colors focus:outline-none">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </button>
                    <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-[#F8F9FA] text-[#1a2b30] transition-colors focus:outline-none">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6 bg-[#fcfcfc] scroll-smooth">
                  {messages.map((m) => {
                    const isMine = (m.senderId?._id || m.senderId) === (user?._id || user?.id);
                    const senderInitials = isMine ? formattedInitials : (activeConv.doctorId?.name ? activeConv.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'DR');

                    return (
                      <div key={m._id} className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className="w-[34px] h-[34px] rounded-full bg-[#eef5f7] text-[11px] font-bold text-[#36565F] flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                              <rect x="9" y="9" width="6" height="6"></rect>
                              <line x1="9" y1="1" x2="9" y2="4"></line>
                              <line x1="15" y1="1" x2="15" y2="4"></line>
                              <line x1="9" y1="20" x2="9" y2="23"></line>
                              <line x1="15" y1="20" x2="15" y2="23"></line>
                              <line x1="20" y1="9" x2="23" y2="9"></line>
                              <line x1="20" y1="14" x2="23" y2="14"></line>
                              <line x1="1" y1="9" x2="4" y2="9"></line>
                              <line x1="1" y1="14" x2="4" y2="14"></line>
                            </svg>
                          </div>
                        )}

                        <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`px-5 py-4 rounded-[20px] text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${isMine
                            ? 'bg-[#436bdf] text-white rounded-br-[4px]'
                            : 'bg-white text-[#36565F] rounded-bl-[4px] border border-[#E8E5DE]/80'
                            }`}>
                            <p className="leading-relaxed">{m.body}</p>

                            {/* Time stamp inside bubble for sender */}
                            {isMine && (
                              <div className="flex items-center justify-end gap-1.5 mt-2 opacity-80">
                                <span className="text-[11px]">
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[11px] font-bold">
                                  {m.readAt ? '✓✓' : '✓'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Time stamp outside bubble for receiver */}
                          {!isMine && (
                            <div className="flex items-center gap-1.5 mt-1.5 px-2">
                              <span className="text-[11px] font-medium text-[#8db5c4]">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {isMine && (
                          <div className="w-[34px] h-[34px] rounded-full bg-[#E56B55] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                            {senderInitials}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-full bg-[#eef5f7] text-[11px] font-bold text-[#36565F] flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
                      </div>
                      <div className="bg-white border border-[#E8E5DE]/80 px-4 py-3 rounded-[20px] rounded-bl-[4px]">
                        <p className="text-[13px] text-[#8db5c4] font-medium">Doctor is typing...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Input Footer */}
                <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-t border-[#E8E5DE]/60">
                  <form onSubmit={sendMessage} className="flex gap-2 md:gap-4 items-center">
                    {/* File upload */}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !activeId}
                      className="w-[42px] h-[42px] md:w-[46px] md:h-[46px] rounded-full bg-[#f0f4f8] hover:bg-[#E2F0F0] text-[#36565F] flex items-center justify-center transition-colors focus:outline-none flex-shrink-0 disabled:opacity-40"
                      title="Attach file (PDF, Image)"
                    >
                      {uploading ? (
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 relative">
                      <input
                        value={input}
                        onChange={handleTyping}
                        placeholder="Message..."
                        className="w-full pl-4 md:pl-6 pr-12 md:pr-14 py-3 md:py-4 bg-white border-2 border-[#eaedf1] rounded-[20px] md:rounded-[24px] text-[14px] md:text-[15px] text-[#1a2b30] focus:outline-none focus:border-[#8db5c4] placeholder:text-[#8db5c4]/60 transition-colors"
                      />
                      <div className="absolute right-4 bottom-3 md:bottom-4 text-[10px] md:text-[11px] text-[#8db5c4] font-medium hidden sm:block">
                        {input.length}/300
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-[46px] h-[46px] md:w-[52px] md:h-[52px] bg-white border-2 border-[#436bdf] text-[#436bdf] hover:bg-[#436bdf] hover:text-white rounded-full flex items-center justify-center transition-colors focus:outline-none flex-shrink-0"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
