'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function AudioRoom({ remoteUsers, isMicOn, onToggleMic, doctorName, patientName }) {
  const [speakerLevel, setSpeakerLevel] = useState(0);

  // Animate waveform if remote is speaking
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeakerLevel(remoteUsers.length > 0 ? Math.random() * 80 + 20 : 0);
    }, 300);
    return () => clearInterval(interval);
  }, [remoteUsers]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 bg-[#0a0f0d] rounded-2xl">

      {/* Remote avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div
            className="w-28 h-28 rounded-full bg-[#1e4a3a]/30 border-2 border-[#4ade80]/30 flex items-center justify-center text-4xl font-bold text-[#4ade80] transition-all duration-300"
            style={{ boxShadow: `0 0 ${speakerLevel * 0.8}px rgba(74,222,128,0.3)` }}
          >
            {remoteUsers.length > 0 ? (doctorName?.[0] || patientName?.[0] || 'D') : '?'}
          </div>
          {remoteUsers.length > 0 && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4ade80] rounded-full border-2 border-[#0a0f0d]" />
          )}
        </div>
        <p className="text-white font-bold text-sm tracking-tight">
          {remoteUsers.length > 0 ? (doctorName || patientName || 'Participant') : 'Waiting for participant…'}
        </p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          {remoteUsers.length > 0 ? 'Connected · Audio Call' : 'Not yet connected'}
        </p>
      </div>

      {/* Waveform bars */}
      <div className="flex items-center gap-1 h-12">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-[#4ade80] transition-all duration-200"
            style={{
              height: remoteUsers.length > 0
                ? `${Math.max(4, Math.sin((i + Date.now() / 200) * 0.8) * speakerLevel * 0.5 + 8)}px`
                : '4px',
              opacity: remoteUsers.length > 0 ? 0.7 + Math.random() * 0.3 : 0.2,
            }}
          />
        ))}
      </div>

      {/* Mic toggle */}
      <button
        onClick={onToggleMic}
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
          isMicOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-rose-500 border-rose-400 text-white'
        }`}
      >
        {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
      </button>
    </div>
  );
}
