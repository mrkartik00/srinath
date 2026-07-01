import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Spinner } from '../components/ui/Spinner';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Chat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const socketRef = useRef(null);
  const activeIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

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
        setMessages((prev) => prev.map((m) => (m.senderId?._id === user?.id || m.senderId === user?.id) ? { ...m, readAt: m.readAt || new Date().toISOString() } : m));
      }
    });

    socket.on('notification:message', () => fetchConversations());

    return () => { socket.disconnect(); };
  }, []);

  const fetchConversations = useCallback(() => {
    api.get('/api/v1/chat/conversations').then((r) => setConversations(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId && conversations.length > 0 && activeId !== urlId) {
      const conv = conversations.find(c => c._id === urlId);
      if (conv) selectConversation(conv);
    }
  }, [conversations, searchParams, activeId]);

  const selectConversation = async (conv) => {
    if (activeIdRef.current) socketRef.current?.emit('conversation:leave', activeIdRef.current);
    setActiveId(conv._id);
    const res = await api.get(`/api/v1/chat/conversations/${conv._id}/messages`);
    setMessages(res.data);
    socketRef.current?.emit('conversation:join', conv._id);
    socketRef.current?.emit('messages:read', conv._id);
  };

  const resolveConversation = async () => {
    if (!activeId) return;
    await api.patch(`/api/v1/chat/conversations/${activeId}/resolve`);
    fetchConversations();
  };

  const toggleOnline = () => {
    const newStatus = !online;
    setOnline(newStatus);
    // Persist to backend
    api.patch('/api/v1/doctor/profile', { isOnline: newStatus }).catch(() => {});
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
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (data.success) { setMessages(prev => [...prev, data.data]); toast.success('File sent!'); }
      else toast.error(data.message || 'Upload failed');
    } catch { toast.error('Failed to upload'); }
    finally { setUploading(false); e.target.value = ''; }
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
    <div className="space-y-4">
      {/* Online Toggle */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-[#E8E5DE]/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-[#1e293b] font-medium">{online ? 'Online' : 'Offline'} — {online ? 'Patients can reach you' : 'You appear offline'}</span>
        </div>
        <button onClick={toggleOnline} className={`relative w-11 h-6 rounded-full transition-colors ${online ? 'bg-[#255946]' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${online ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Chat UI */}
      <div className="flex h-[calc(100vh-12rem)] bg-white rounded-xl border border-[#E8E5DE]/50 overflow-hidden">
        {/* Conversations list */}
        <div className="w-72 border-r border-[#E8E5DE] flex flex-col">
          <div className="p-4 border-b border-[#E8E5DE]">
            <h2 className="text-sm font-semibold text-[#1e293b]">Patient Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <div key={c._id} onClick={() => selectConversation(c)} className={`px-4 py-3 cursor-pointer border-b border-[#E8E5DE]/30 hover:bg-[#F8F6F0] ${activeId === c._id ? 'bg-[#F8F6F0]' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1e293b] truncate">{c.patientId?.name || 'Patient'}</p>
                  {c.unreadByDoctor > 0 && <span className="w-5 h-5 rounded-full bg-[#255946] text-white text-[10px] flex items-center justify-center">{c.unreadByDoctor}</span>}
                </div>
                <p className="text-xs text-[#64748b] truncate mt-0.5">{c.lastMessagePreview || 'No messages yet'}</p>
              </div>
            ))}
            {conversations.length === 0 && <p className="p-4 text-xs text-[#64748b] text-center">No patient chats yet</p>}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">Select a patient conversation</div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-[#E8E5DE] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">{activeConv.patientId?.name}</p>
                  <p className="text-xs text-[#64748b] capitalize">{activeConv.status}</p>
                </div>
                {activeConv.status !== 'resolved' && <button onClick={resolveConversation} className="text-xs px-3 py-1.5 bg-[#F8F6F0] border border-[#E8E5DE] rounded-lg text-[#64748b] hover:bg-[#255946] hover:text-white transition-colors">✓ Resolve</button>}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map((m) => {
                  const isMine = (m.senderId?._id || m.senderId) === user?.id;
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-[#255946] text-white rounded-br-md' : 'bg-[#F8F6F0] text-[#1e293b] rounded-bl-md border border-[#E8E5DE]'}`}>
                        <p>{m.body}</p>
                        {/* Attachments */}
                        {m.attachments?.length > 0 && (
                          <div className="mt-2">
                            {m.attachments.map((att, idx) => (
                              <button
                                key={idx}
                                onClick={async () => {
                                  try {
                                    const baseUrl = import.meta.env.VITE_API_URL || '';
                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`${baseUrl}/api/v1/chat/attachments/${m._id}/download`, { headers: { Authorization: `Bearer ${token}` } });
                                    const data = await res.json();
                                    if (data.success && data.data.url) window.open(data.data.url, '_blank');
                                    else toast.error('Could not open file');
                                  } catch { toast.error('Download failed'); }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isMine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-white hover:bg-[#E2F0F0] text-[#255946] border border-[#E8E5DE]'}`}
                              >
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
                                <span className="truncate max-w-[120px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-[#64748b]'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && <span className={`text-[10px] ${m.readAt ? 'text-blue-300' : 'text-white/40'}`}>{m.readAt ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typing && <p className="text-xs text-[#64748b] italic">patient is typing...</p>}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="px-5 py-3 border-t border-[#E8E5DE] flex gap-2 items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-9 h-9 rounded-full bg-[#F8F6F0] hover:bg-[#E2F0F0] text-[#255946] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40" title="Attach file">
                  {uploading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>}
                </button>
                <input value={input} onChange={handleTyping} placeholder="Type a message..." className="flex-1 px-4 py-2.5 bg-[#F8F6F0] border border-[#E8E5DE] rounded-full text-sm focus:outline-none focus:border-[#255946]" />
                <button type="submit" className="px-5 py-2.5 bg-[#255946] text-white rounded-full text-sm font-medium hover:bg-[#1a3f32]">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
