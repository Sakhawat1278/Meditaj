'use client';
import { useEffect, useRef, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, 
  Settings, User, Signal, Wifi, Activity, MessageSquare
} from 'lucide-react';

export default function VideoRoom({
  localVideoTrack,
  localAudioTrack,
  remoteUsers,
  isMicOn,
  isCamOn,
  onToggleMic,
  onToggleCam,
}) {
  const localRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState('Excellent');

  useEffect(() => {
    if (localVideoTrack && localRef.current) {
      localVideoTrack.play(localRef.current);
    }
    return () => {
      if (localVideoTrack) localVideoTrack.stop();
    };
  }, [localVideoTrack]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-[#050706] rounded-[24px] overflow-hidden flex items-center justify-center border border-white/5 shadow-2xl">
      
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1e4a3a30_0%,_transparent_70%)] opacity-50 pointer-events-none" />

      {/* Remote Video Canvas */}
      <div className="absolute inset-0 z-0">
        {remoteUsers.length > 0 ? (
          <RemoteVideoTrack user={remoteUsers[0]} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="relative"
            >
               <div className="absolute inset-0 bg-[#4ade80]/10 blur-3xl rounded-full scale-150" />
               <div className="w-24 h-24 rounded-3xl bg-[#0a0f0d] border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                 <Video size={40} className="text-[#4ade80]/40 animate-pulse" />
               </div>
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-white text-[14px] font-black uppercase tracking-[0.2em]">Waiting Room</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                 Establishing secure clinical connection...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Top HUD (Status Info) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <Signal size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
              <div className="w-px h-3 bg-white/20 mx-1" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{quality}</span>
           </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
           <button className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white transition-all">
             <Settings size={14} />
           </button>
           <button 
             onClick={toggleFullscreen}
             className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white transition-all"
           >
             {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
           </button>
        </div>
      </div>

      {/* Local Preview (Picture-in-Picture) */}
      <motion.div 
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="absolute top-24 right-6 w-48 h-36 bg-[#0a0f0d] rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-20 cursor-move group"
      >
        <div className="absolute inset-0 bg-black/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Your Camera</span>
        </div>
        {isCamOn ? (
          <div ref={localRef} className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0a0f0d]">
             <div className="relative">
                <VideoOff size={24} className="text-white/10" />
                <div className="absolute inset-0 blur-lg bg-rose-500/10" />
             </div>
          </div>
        )}
      </motion.div>

      {/* Floating Control Hub */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-[28px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 z-30 transition-all hover:border-white/20">
         <div className="flex items-center gap-4 border-r border-white/10 pr-6">
            <button
               onClick={onToggleMic}
               className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all ${
                 isMicOn ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
               }`}
            >
               {isMicOn ? <Mic size={20} strokeWidth={1.5} /> : <MicOff size={20} strokeWidth={1.5} />}
            </button>
            <button
               onClick={onToggleCam}
               className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all ${
                 isCamOn ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
               }`}
            >
               {isCamOn ? <Video size={20} strokeWidth={1.5} /> : <VideoOff size={20} strokeWidth={1.5} />}
            </button>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-1.5 mb-1">
                  <Activity size={10} className="text-emerald-500" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Encrypted</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">HD Secure</span>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}

function RemoteVideoTrack({ user }) {
  const remoteRef = useRef(null);
  useEffect(() => {
    if (user.videoTrack && remoteRef.current) {
      user.videoTrack.play(remoteRef.current);
    }
    return () => {
      if (user.videoTrack) user.videoTrack.stop();
    };
  }, [user]);
  
  return (
    <div className="w-full h-full relative">
       <div ref={remoteRef} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
       {/* Participant Plate */}
       <div className="absolute bottom-10 left-10 z-10 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
             <User size={16} />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Remote Health Professional</span>
       </div>
    </div>
  );
}
