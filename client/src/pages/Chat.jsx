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
    <div className={isEmbedded ? "w-full h-[calc(100vh-200px)] min-h-[600px]" : "p-6 md:p-8 flex flex-col gap-6 font-['Figtree'] bg-[#f8fafb] min-h-screen"}>
      {!isEmbedded && (
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-[#253a5a] tracking-tight">Chat Conversations</h1>
          <p className="text-[#8db5c4] text-xs font-semibold uppercase tracking-wider">Securely communicate with your medical practitioners</p>
        </div>
      )}

      <div className={isEmbedded ? "w-full h-full flex bg-white border border-[#eaedf1] overflow-hidden rounded-[20px] shadow-sm" : "w-full flex-1 bg-white border border-[#eaedf1] overflow-hidden rounded-[24px] shadow-sm flex h-[calc(100vh-180px)]"}>
        {/* Messages Sidebar (History List) */}
        <div className={`w-full md:w-[340px] border-r border-[#eaedf1] flex flex-col flex-shrink-0 bg-white relative ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-6 py-5 border-b border-[#eaedf1]/60 flex items-center justify-between bg-white">
            <h4 className="text-[20px] font-extrabold text-[#253a5a]">
              All Conversations
            </h4>
            <button className="text-[#8db5c4] hover:text-[#253a5a] transition-colors focus:outline-none">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {conversations.map((c) => {
              const isSelected = activeId === c._id;
              const docInitials = c.doctorId?.name
                ? c.doctorId.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                : 'DR';
              return (
                <div
                  key={c._id}
                  onClick={() => selectConversation(c)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors relative hover:bg-[#f0f4f8] ${isSelected ? 'bg-[#f0f4f8]' : ''}`}
                >
                  <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-colors ${isSelected ? 'bg-[#253a5a] text-white' : 'bg-[#E6F2F5] text-[#253a5a]'}`}>
                    {docInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-[15px] font-extrabold truncate ${isSelected ? 'text-[#253a5a]' : 'text-[#253a5a]/80'}`}>
                        {c.doctorId?.name || 'Doctor'}
                      </p>
                      <span className="text-[11px] text-[#8db5c4] font-bold">
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[13px] text-[#8db5c4] truncate flex-1 pr-2 font-medium">
                        {c.lastMessagePreview || 'No messages yet...'}
                      </p>
                      {c.unreadByPatient > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {c.unreadByPatient}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-sm text-[#8db5c4] font-medium">
                No conversations yet. Start a new one below!
              </div>
            )}
          </div>

          {/* Sidebar Footer with New Conversation Button */}
          <div className="p-5 bg-white relative border-t border-[#eaedf1]/60">
            {showDoctorDropdown && (
              <div className="absolute bottom-[calc(100%+16px)] left-5 right-5 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#eaedf1] overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
                <div className="px-5 py-4 border-b border-[#eaedf1]/60 bg-slate-50/50">
                  <span className="text-sm font-bold text-[#253a5a]">Select a Doctor</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto py-2">
                  {doctors.map(d => (
                    <button
                      key={d._id}
                      onClick={() => {
                        startConversation(d._id);
                        setShowDoctorDropdown(false);
                      }}
                      className="w-full text-left px-5 py-3 text-[14px] font-semibold text-[#8db5c4] hover:text-[#253a5a] hover:bg-[#f0f4f8] transition-colors"
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
              className="w-full bg-[#253a5a] hover:bg-[#1a2c44] text-white font-extrabold py-3.5 px-5 rounded-[16px] flex items-center justify-between transition-colors shadow-sm"
            >
              <span className="text-[14px] uppercase tracking-wider">New Conversation</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Active Messaging Thread */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8fafb]/30">
              <div className="w-20 h-20 bg-[#E6F2F5] rounded-full flex items-center justify-center mb-6 text-[#253a5a]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h4 className="text-2xl font-extrabold text-[#253a5a] mb-2">Welcome to Secure Chat</h4>
              <p className="text-[14px] text-[#8db5c4] max-w-xs font-semibold leading-relaxed">Select a conversation from the sidebar or start a new one to connect with your healthcare providers.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-4 md:px-8 py-4 md:py-5 border-b border-[#eaedf1]/60 bg-white flex justify-between items-center z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    className="md:hidden w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-slate-50 text-[#253a5a] border border-[#eaedf1]"
                    onClick={() => setActiveId(null)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </button>
                  <div className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] rounded-full bg-[#E6F2F5] flex items-center justify-center text-base md:text-lg font-extrabold text-[#253a5a] flex-shrink-0">
                    {activeConv.doctorId?.name ? activeConv.doctorId.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'DR'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-[#253a5a]">
                        {activeConv.doctorId?.name}
                      </h2>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981" stroke="none">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
                      </svg>
                    </div>
                    <p className="text-[12px] text-[#8db5c4] font-bold mt-0.5">
                      Direct Secure Message • Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-slate-50 text-[#8db5c4] hover:text-[#253a5a] transition-colors focus:outline-none">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6 bg-slate-50/30 scroll-smooth">
                {messages.map((m) => {
                  const isMine = (m.senderId?._id || m.senderId) === (user?._id || user?.id);
                  const senderInitials = isMine ? formattedInitials : (activeConv.doctorId?.name ? activeConv.doctorId.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'DR');

                  return (
                    <div key={m._id} className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-[34px] h-[34px] rounded-full bg-[#E6F2F5] text-[11px] font-extrabold text-[#253a5a] flex items-center justify-center flex-shrink-0">
                          {senderInitials}
                        </div>
                      )}

                      <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3.5 rounded-[20px] text-[14px] font-medium shadow-xs leading-relaxed ${isMine
                          ? 'bg-[#253a5a] text-white rounded-br-[4px]'
                          : 'bg-white text-[#253a5a] rounded-bl-[4px] border border-[#eaedf1]'
                          }`}>
                          <p>{m.body}</p>

                          {/* Time stamp inside bubble for sender */}
                          {isMine && (
                            <div className="flex items-center justify-end gap-1 mt-1.5 opacity-70 text-[10px] font-bold">
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>
                                {m.readAt ? '✓✓' : '✓'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Time stamp outside bubble for receiver */}
                        {!isMine && (
                          <div className="flex items-center gap-1.5 mt-1 px-2 text-[10px] font-bold text-[#8db5c4]">
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>

                      {isMine && (
                        <div className="w-[34px] h-[34px] rounded-full bg-[#E6F2F5] text-[11px] font-extrabold text-[#253a5a] flex items-center justify-center flex-shrink-0">
                          {senderInitials}
                        </div>
                      )}
                    </div>
                  );
                })}
                {typing && (
                  <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-full bg-[#E6F2F5] text-[11px] font-extrabold text-[#253a5a] flex items-center justify-center flex-shrink-0">
                      {activeConv.doctorId?.name ? activeConv.doctorId.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'DR'}
                    </div>
                    <div className="bg-white border border-[#eaedf1] px-4 py-3 rounded-[20px] rounded-bl-[4px] shadow-xs">
                      <p className="text-[13px] text-[#8db5c4] font-semibold animate-pulse">Doctor is typing...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Input Footer */}
              <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-t border-[#eaedf1]">
                <form onSubmit={sendMessage} className="flex gap-2 md:gap-4 items-center">
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={handleTyping}
                      placeholder="Message..."
                      className="w-full pl-4 md:pl-6 pr-12 md:pr-14 py-3.5 bg-white border-2 border-[#eaedf1] rounded-[24px] text-[14px] md:text-[15px] text-[#253a5a] focus:outline-none focus:border-[#253a5a] placeholder:text-[#8db5c4]/60 transition-colors"
                    />
                    <div className="absolute right-4 bottom-3.5 text-[10px] md:text-[11px] text-[#8db5c4] font-bold hidden sm:block">
                      {input.length}/300
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-[46px] h-[46px] md:w-[50px] md:h-[50px] bg-white border-2 border-[#253a5a] text-[#253a5a] hover:bg-[#253a5a] hover:text-white rounded-full flex items-center justify-center transition-colors focus:outline-none flex-shrink-0"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
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
  );
}
