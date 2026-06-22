import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Spinner } from '../components/ui';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const socketRef = useRef(null);
  const activeIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Keep ref in sync
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Connect socket once
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

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
  }, []);

  const fetchConversations = useCallback(() => {
    api.get('/api/v1/chat/conversations').then((r) => setConversations(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConversations(); api.get('/api/v1/auth/doctors').then((r) => setDoctors(r.data || [])).catch(() => {}); }, []);

  const selectConversation = async (conv) => {
    if (activeIdRef.current) socketRef.current?.emit('conversation:leave', activeIdRef.current);
    setActiveId(conv._id);
    const res = await api.get(`/api/v1/chat/conversations/${conv._id}/messages`);
    setMessages(res.data);
    socketRef.current?.emit('conversation:join', conv._id);
    socketRef.current?.emit('messages:read', conv._id);
  };

  const startConversation = async (doctorId) => {
    const res = await api.post('/api/v1/chat/conversations', { doctorId });
    await fetchConversations();
    selectConversation(res.data);
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

  if (loading) return <Spinner size="lg" />;

  const activeConv = conversations.find((c) => c._id === activeId);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-[#E8E5DE]/50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-[#E8E5DE] flex flex-col">
        <div className="p-4 border-b border-[#E8E5DE]">
          <h2 className="text-sm font-semibold text-[#1e293b]">Messages</h2>
          <select onChange={(e) => e.target.value && startConversation(e.target.value)} className="mt-2 w-full text-xs px-2 py-1.5 border border-[#E8E5DE] rounded-lg" defaultValue="">
            <option value="">+ New chat with doctor...</option>
            {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <div key={c._id} onClick={() => selectConversation(c)} className={`px-4 py-3 cursor-pointer border-b border-[#E8E5DE]/30 hover:bg-[#F8F6F0] ${activeId === c._id ? 'bg-[#F8F6F0]' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#1e293b] truncate">{c.doctorId?.name || 'Doctor'}</p>
                {c.unreadByPatient > 0 && <span className="w-5 h-5 rounded-full bg-[#255946] text-white text-[10px] flex items-center justify-center">{c.unreadByPatient}</span>}
              </div>
              <p className="text-xs text-[#64748b] truncate mt-0.5">{c.lastMessagePreview || 'No messages yet'}</p>
            </div>
          ))}
          {conversations.length === 0 && <p className="p-4 text-xs text-[#64748b] text-center">No conversations yet. Start one above!</p>}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">Select a conversation to start chatting</div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-[#E8E5DE]">
              <p className="text-sm font-semibold text-[#1e293b]">{activeConv.doctorId?.name}</p>
              <p className="text-xs text-[#64748b] capitalize">{activeConv.status}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((m) => {
                const isMine = (m.senderId?._id || m.senderId) === user?.id;
                return (
                  <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-[#255946] text-white rounded-br-md' : 'bg-[#F8F6F0] text-[#1e293b] rounded-bl-md border border-[#E8E5DE]'}`}>
                      <p>{m.body}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-[#64748b]'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <span className={`text-[10px] ${m.readAt ? 'text-blue-300' : 'text-white/40'}`}>{m.readAt ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typing && <p className="text-xs text-[#64748b] italic">typing...</p>}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="px-5 py-3 border-t border-[#E8E5DE] flex gap-2">
              <input value={input} onChange={handleTyping} placeholder="Type a message..." className="flex-1 px-4 py-2.5 bg-[#F8F6F0] border border-[#E8E5DE] rounded-full text-sm focus:outline-none focus:border-[#255946]" />
              <button type="submit" className="px-5 py-2.5 bg-[#255946] text-white rounded-full text-sm font-medium hover:bg-[#1a3f32]">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
