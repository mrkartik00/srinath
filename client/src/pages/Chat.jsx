import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Chat() {
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
  const messagesEndRef = useRef(null);
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchConversations();
    api.get('/api/v1/auth/doctors').then((r) => setDoctors(r.data || [])).catch(() => {});
  }, [fetchConversations]);

  const selectConversation = async (conv) => {
    if (activeIdRef.current) socketRef.current?.emit('conversation:leave', activeIdRef.current);
    setActiveId(conv._id);
    try {
      const res = await api.get(`/api/v1/chat/conversations/${conv._id}/messages`);
      setMessages(res.data || []);
      socketRef.current?.emit('conversation:join', conv._id);
      socketRef.current?.emit('messages:read', conv._id);
    } catch {}
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeConv = conversations.find((c) => c._id === activeId);
  const formattedInitials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U';

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#253a5a]">Secure Messaging</h1>
        <p className="text-sm text-[#6B7C84]">Chat directly with your healthcare providers</p>
      </div>
      
      <div className="bg-white rounded-[24px] border border-[#E8E5DE]/60 overflow-hidden shadow-[0_4px_20px_rgba(54,86,95,0.03)] flex h-[calc(100vh-240px)] min-h-[680px]">
        
        {/* Messages Sidebar (History List) */}
        <div className="w-72 border-r border-[#E8E5DE]/70 flex flex-col flex-shrink-0 bg-white">
          <div className="p-5 border-b border-[#E8E5DE]/60">
            <div className="flex justify-between items-center mb-3">
              <h4 style={{ fontFamily: "'Figtree', sans-serif" }} className="text-base font-bold text-[#253a5a]">
                Messages
              </h4>
              <button className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {/* Doctor Selector Dropdown */}
            <select 
              onChange={(e) => e.target.value && startConversation(e.target.value)} 
              className="w-full text-xs font-semibold px-3 py-2 border border-[#E8E5DE] rounded-xl text-[#253a5a] bg-[#F8F6F0]/20 hover:border-[#36565F]/40 focus:outline-none transition-all"
              defaultValue=""
            >
              <option value="">+ Start Chat with Doctor...</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E8E5DE]/30">
            {conversations.map((c) => {
              const isSelected = activeId === c._id;
              const docInitials = c.doctorId?.name
                ? c.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                : 'DR';
              return (
                <div 
                  key={c._id} 
                  onClick={() => selectConversation(c)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors relative hover:bg-[#F8F6F0]/20 ${
                    isSelected ? 'bg-[#F8F6F0]/50' : ''
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E56B55]" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-[#E2F0F0] flex items-center justify-center text-xs font-bold text-[#36565F] border border-white shadow-xs flex-shrink-0">
                    {docInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-[#253a5a] truncate">{c.doctorId?.name || 'Doctor'}</p>
                      <span className="text-[9px] text-[#6B7C84]">1 min ago</span>
                    </div>
                    <p className="text-[11px] text-[#6B7C84] truncate mt-0.5">
                      {c.lastMessagePreview || 'No messages yet...'}
                    </p>
                  </div>
                  {c.unreadByPatient > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#E56B55] text-white text-[9px] font-bold flex items-center justify-center">
                      {c.unreadByPatient}
                    </span>
                  )}
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-xs text-[#6B7C84]">
                No chat logs yet. Choose a doctor from the selector dropdown to start!
              </div>
            )}
          </div>
        </div>

        {/* Active Messaging Thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF6]/10">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <span className="text-4xl mb-3">💬</span>
              <h4 className="text-sm font-bold text-[#253a5a] mb-1">My Secure Conversations</h4>
              <p className="text-xs text-[#6B7C84] max-w-xs">Select a conversation or start a new chat with a doctor above.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E8E5DE]/60 bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E2F0F0] flex items-center justify-center text-xs font-bold text-[#36565F] border border-white shadow-xs">
                    {activeConv.doctorId?.name ? activeConv.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'DR'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#253a5a]">{activeConv.doctorId?.name}</p>
                    <p className="text-[10px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] inline-block" /> Online
                    </p>
                  </div>
                </div>

                {/* Mock header icons */}
                <div className="flex items-center gap-3 text-[#6B7C84]">
                  <button className="hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-sm">📹</span></button>
                  <button className="hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-sm">📞</span></button>
                  <button className="hover:text-[#36565F] transition-colors focus:outline-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button className="hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-xs">⋮</span></button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((m) => {
                  const isMine = (m.senderId?._id || m.senderId) === (user?._id || user?.id);
                  const senderInitials = isMine ? formattedInitials : (activeConv.doctorId?.name ? activeConv.doctorId.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'DR');
                  
                  return (
                    <div key={m._id} className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-[#E2F0F0] text-[10px] font-bold text-[#36565F] border border-white flex items-center justify-center flex-shrink-0">
                          {senderInitials}
                        </div>
                      )}

                      <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-[18px] text-sm shadow-xs ${
                          isMine 
                            ? 'bg-[#E2F0F0] text-[#36565F] rounded-br-none border border-[#36565F]/10' 
                            : 'bg-white text-[#253a5a] rounded-bl-none border border-[#E8E5DE]'
                        }`}>
                          <p className="leading-relaxed text-[13px]">{m.body}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[9px] text-[#6B7C84]">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <span className={`text-[9px] font-bold ${m.readAt ? 'text-[#36565F]' : 'text-[#6B7C84]/65'}`}>
                              {m.readAt ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>

                      {isMine && (
                        <div className="w-7 h-7 rounded-full bg-[#36565F]/10 text-[10px] font-bold text-[#36565F] border border-white flex items-center justify-center flex-shrink-0">
                          {senderInitials}
                        </div>
                      )}
                    </div>
                  );
                })}
                {typing && <p className="text-[11px] text-[#6B7C84] italic">Doctor is typing...</p>}
                <div ref={messagesEndRef} />
              </div>

              {/* Messages Input Footer */}
              <form onSubmit={sendMessage} className="p-4 border-t border-[#E8E5DE]/60 bg-white flex gap-3 items-center">
                <button type="button" className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-base">😊</span></button>
                <button type="button" className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-base">📎</span></button>
                
                <input 
                  value={input} 
                  onChange={handleTyping} 
                  placeholder="Type your message..." 
                  className="flex-1 px-4 py-2 border border-[#E8E5DE]/70 rounded-full text-xs focus:outline-none focus:border-[#36565F] placeholder:text-[#6B7C84]/50" 
                />
                
                <button type="button" className="text-[#6B7C84] hover:text-[#36565F] transition-colors focus:outline-none"><span className="text-base">🎤</span></button>
                <button 
                  type="submit"
                  className="bg-[#36565F] hover:bg-[#253F47] text-white text-xs font-bold rounded-full px-5 py-2.5 flex items-center gap-1.5 transition-colors focus:outline-none shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
