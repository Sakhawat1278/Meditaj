'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Send, Paperclip, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ChatPanel({ sessionId, currentUser, currentRole }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachFile, setAttachFile] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !db) return;
    const q = query(
      collection(db, 'consultation_sessions', sessionId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !attachFile) return;
    setIsSending(true);
    try {
      let fileUrl = null;
      let msgType = 'text';

      if (attachFile) {
        msgType = 'file';
        const storageRef = ref(storage, `consultation_files/${sessionId}/${Date.now()}_${attachFile.name}`);
        const uploaded = await uploadBytes(storageRef, attachFile);
        fileUrl = await getDownloadURL(uploaded.ref);
      }

      await addDoc(collection(db, 'consultation_sessions', sessionId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderRole: currentRole,
        text: text.trim(),
        type: msgType,
        fileUrl,
        fileName: attachFile?.name || null,
        createdAt: serverTimestamp(),
      });

      setText('');
      setAttachFile(null);
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Start the conversation</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
                {isMe ? 'You' : msg.senderName}
                {msg.senderRole === 'doctor' && ' · Doctor'}
              </span>
              {msg.type === 'file' ? (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[11px] font-bold max-w-[80%] transition-all hover:opacity-80 ${
                    isMe ? 'bg-[#1e4a3a] text-white border-[#1e4a3a]' : 'bg-slate-50 text-[#1e4a3a] border-slate-200'
                  }`}
                >
                  <FileText size={14} />
                  {msg.fileName || 'Attachment'}
                </a>
              ) : (
                <div
                  className={`px-4 py-2.5 rounded-xl text-[12px] font-medium leading-relaxed max-w-[80%] ${
                    isMe
                      ? 'bg-[#1e4a3a] text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Attach preview */}
      {attachFile && (
        <div className="mx-4 mb-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <FileText size={12} className="text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 flex-1 truncate">{attachFile.name}</span>
          <button onClick={() => setAttachFile(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-100 flex items-center gap-2">
        <label className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] cursor-pointer transition-colors shrink-0">
          <Paperclip size={16} />
          <input
            type="file"
            className="hidden"
            onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
          />
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-[12px] font-medium focus:border-[#1e4a3a] transition-all"
        />
        <button
          onClick={handleSend}
          disabled={isSending || (!text.trim() && !attachFile)}
          className="w-9 h-9 bg-[#1e4a3a] text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-30 shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
