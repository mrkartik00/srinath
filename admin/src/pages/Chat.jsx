import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

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
    socket.on('message:new', ({ message, conversationId }) => {
      if (conversationId === activeIdRef.current) {
        setMessages(prev => [...prev, message]);
        socket.emit('messages:read', conversationId);
      }
      fetchConversations();
    });
    socket.on('typing:indicator', ({ conversationId, isTyping: t }) => {
      if (conversationId === activeIdRef.current) setTyping(t);
    });
    socket.on('messages:read_receipt', ({ conversationId }) => {
      if (conversationId === activeIdRef.current)
        setMessages(prev => prev.map(m => (m.senderId?._id === user?.id || m.senderId === user?.id) ? { ...m, readAt: m.readAt || new Date().toISOString() } : m));
    });
    socket.on('notification:message', () => fetchConversations());
    socket.on('conversation:escalated', ({ conversationId, reason }) => {
      toast('⚠️ AI escalated: ' + (reason || 'Patient needs doctor'), { icon: '🔔' });
      fetchConversations();
    });
    return () => { socket.disconnect(); };
  }, []);

  const fetchConversations = useCallback(() => {
    api.get('/api/v1/chat/conversations').then(r => setConversations(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId && conversations.length && activeId !== urlId) {
      const conv = conversations.find(c => c._id === urlId);
      if (conv) selectConversation(conv);
    }
  }, [conversations, searchParams]);

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
    toast.success('Conversation resolved');
    fetchConversations();
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
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', `📎 ${file.name}`);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/v1/chat/conversations/${activeId}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (data.success) { setMessages(prev => [...prev, data.data]); toast.success('Sent!'); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Upload failed'); }
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#36565F] border-t-transparent rounded-full" /></div>;

  const activeConv = conversations.find(c => c._id === activeId);

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const timeAgo = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-[20px] border border-[rgba(54,86,95,0.1)] shadow-sm overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Sidebar - Conversations */}
      <div className="w-[300px] border-r border-[#eaedf1] flex flex-col">
        <div className="p-5 border-b border-[#eaedf1]">
          <h2 className="text-[17px] font-bold text-[#253a5a]">Messages</h2>
          <p className="text-xs text-[#6B7C84] mt-0.5">{conversations.length} patient{conversations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(c => {
            const isActive = activeId === c._id;
            const hasUnread = c.unreadByDoctor > 0;
            return (
              <div key={c._id} onClick={() => selectConversation(c)} className={`px-5 py-4 cursor-pointer border-b border-[#eaedf1]/50 transition-colors ${isActive ? 'bg-[#f0f4f8]' : 'hover:bg-[#fafbfc]'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E2F0F0] text-[#36565F] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {getInitials(c.patientId?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${hasUnread ? 'font-bold text-[#253a5a]' : 'font-medium text-[#253a5a]'}`}>{c.patientId?.name || 'Patient'}</span>
                      <span className="text-[10px] text-[#6B7C84] flex-shrink-0 ml-2">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${hasUnread ? 'text-[#253a5a] font-medium' : 'text-[#6B7C84]'}`}>{c.lastMessagePreview || 'No messages'}</p>
                      {hasUnread && <span className="w-5 h-5 rounded-full bg-[#36565F] text-white text-[10px] flex items-center justify-center flex-shrink-0 ml-1">{c.unreadByDoctor}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f0f4f8] flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="#6B7C84" strokeWidth="1.5"><path d="M3 15l4-4 4 4 5-5"/><rect x="1" y="1" width="18" height="18" rx="3"/></svg>
              </div>
              <p className="text-sm text-[#6B7C84]">No conversations yet</p>
              <p className="text-xs text-[#94a3b8] mt-1">Patient messages will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#fafbfc]">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#E2F0F0] flex items-center justify-center mb-4">
              <svg width="28" height="28" fill="none" stroke="#36565F" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-[#253a5a]">Select a conversation</h3>
            <p className="text-sm text-[#6B7C84] mt-1">Choose a patient from the left to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-[#eaedf1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E2F0F0] text-[#36565F] text-xs font-bold flex items-center justify-center">
                  {getInitials(activeConv.patientId?.name)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#253a5a]">{activeConv.patientId?.name}</h3>
                  <p className="text-[11px] text-[#6B7C84] capitalize flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeConv.status === 'resolved' ? 'bg-gray-300' : 'bg-green-400'}`} />
                    {activeConv.status === 'resolved' ? 'Resolved' : activeConv.status === 'escalated' ? '⚠️ Escalated to you' : 'Active'}
                  </p>
                </div>
              </div>
              {activeConv.status !== 'resolved' && (
                <button onClick={resolveConversation} className="text-xs px-4 py-2 bg-[#f0f4f8] hover:bg-[#36565F] hover:text-white border border-[#eaedf1] rounded-full text-[#6B7C84] font-medium transition-colors">
                  ✓ Resolve
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.map(m => {
                const isMine = (m.senderId?._id || m.senderId) === user?.id;
                const isAI = m.senderRole === 'ai';
                return (
                  <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isMine && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${isAI ? 'bg-[#EDE9FE] text-[#7C3AED]' : 'bg-[#E2F0F0] text-[#36565F]'}`}>
                        {isAI ? 'AI' : getInitials(activeConv.patientId?.name)}
                      </div>
                    )}
                    <div className={`max-w-[65%] ${isMine ? 'order-first' : ''}`}>
                      <div className={`px-4 py-3 rounded-[18px] text-[14px] leading-relaxed ${
                        isMine ? 'bg-[#36565F] text-white rounded-br-[6px]'
                        : isAI ? 'bg-[#F5F3FF] text-[#4C1D95] border border-[#EDE9FE] rounded-bl-[6px]'
                        : 'bg-white text-[#253a5a] border border-[#eaedf1] rounded-bl-[6px] shadow-sm'
                      }`}>
                        <p>{m.body}</p>
                        {m.attachments?.length > 0 && (
                          <div className="mt-2">
                            {m.attachments.map((att, idx) => (
                              <button key={idx} onClick={async () => {
                                try {
                                  const baseUrl = import.meta.env.VITE_API_URL || '';
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${baseUrl}/api/v1/chat/attachments/${m._id}/download`, { headers: { Authorization: `Bearer ${token}` } });
                                  const data = await res.json();
                                  if (data.success) window.open(data.data.url, '_blank');
                                  else toast.error('Cannot open');
                                } catch { toast.error('Failed'); }
                              }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mt-1 ${isMine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-[#f0f4f8] hover:bg-[#E2F0F0] text-[#36565F]'}`}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
                                <span className="truncate max-w-[140px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMine ? 'justify-end' : ''}`}>
                        {isAI && <span className="text-[10px] text-[#7C3AED] font-medium">AI Assistant</span>}
                        <span className="text-[10px] text-[#94a3b8]">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <span className={`text-[10px] ${m.readAt ? 'text-blue-400' : 'text-[#94a3b8]'}`}>{m.readAt ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E2F0F0] text-[#36565F] text-[10px] font-bold flex items-center justify-center">{getInitials(activeConv.patientId?.name)}</div>
                  <div className="bg-white border border-[#eaedf1] px-4 py-2.5 rounded-[18px] rounded-bl-[6px]">
                    <div className="flex gap-1"><span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" /><span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:0.1s]" /><span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:0.2s]" /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-white border-t border-[#eaedf1]">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-10 h-10 rounded-full bg-[#f0f4f8] hover:bg-[#E2F0F0] text-[#36565F] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40">
                  {uploading ? <div className="w-4 h-4 border-2 border-[#36565F] border-t-transparent rounded-full animate-spin" />
                  : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>}
                </button>
                <input value={input} onChange={handleTyping} placeholder="Type your message..." className="flex-1 px-5 py-3 bg-[#f0f4f8] border border-[#eaedf1] rounded-full text-sm text-[#253a5a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#36565F] focus:ring-2 focus:ring-[#36565F]/10 transition-all" />
                <button type="submit" disabled={!input.trim()} className="w-10 h-10 rounded-full bg-[#36565F] hover:bg-[#253a5a] text-white flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
