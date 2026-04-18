'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Video, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Mounts a floating notification for the patient when the doctor starts a session.
 * Usage: <SessionNotification userId={user.uid} />
 */
export default function SessionNotification({ userId }) {
  const [activeSession, setActiveSession] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userId || !db) return;

    const q = query(
      collection(db, 'consultation_sessions'),
      where('patientId', '==', userId),
      where('status', '==', 'waiting')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (sessions.length > 0) {
        setActiveSession(sessions[0]);
        if (!activeSession) { // only play if it's new
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1345/1345-preview.mp3');
          audio.loop = true;
          audio.play().catch(e => console.log("Audio blocked"));
          window._medita_ringtone = audio;
        }
      } else {
        setActiveSession(null);
        if (window._medita_ringtone) {
          window._medita_ringtone.pause();
          window._medita_ringtone = null;
        }
      }
    });

    return () => {
      unsub();
      if (window._medita_ringtone) {
        window._medita_ringtone.pause();
        window._medita_ringtone = null;
      }
    };
  }, [userId, activeSession]);

  const handleJoin = async () => {
    if (window._medita_ringtone) {
      window._medita_ringtone.pause();
      window._medita_ringtone = null;
    }
    router.push(`/consultation/${activeSession.id}`);
  };

  return (
    <AnimatePresence>
      {activeSession && !dismissed && (
        <motion.div
          key={activeSession.id}
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          className="fixed top-24 right-6 z-[9999] w-[340px]"
        >
          {/* Main Glass Container */}
          <div className="relative group overflow-hidden rounded-[24px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5">
            
            {/* Animated accent background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-[16px] bg-[#1e4a3a] border border-emerald-500/20 flex items-center justify-center">
                    <Video size={20} className="text-emerald-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#151a18] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-white tracking-tight leading-tight uppercase">Incoming Call</h4>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">Dr. {activeSession.doctorName?.split(' ').slice(-1)[0] || 'Specialist'}</p>
                </div>
              </div>
              <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/5">
               <p className="text-[11px] text-white/70 font-bold uppercase tracking-wide leading-relaxed">
                  The medical room is now active. Please join for your consultation.
               </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleJoin}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-[#050706] rounded-[14px] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
              >
                Join Console <ArrowRight size={14} strokeWidth={3} />
              </button>
              <button 
                onClick={() => setDismissed(true)}
                className="w-full h-11 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-[14px] font-black text-[10px] uppercase tracking-[0.2em] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
