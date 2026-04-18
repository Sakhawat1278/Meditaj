'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { joinChannel, leaveChannel } from '@/lib/agoraClient';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { toast } from 'react-hot-toast';
import { PhoneOff, MessageSquare, Video as VideoIcon, Mic, Volume2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

const VideoRoom = dynamic(() => import('@/components/Consultation/VideoRoom'), { ssr: false });
const AudioRoom = dynamic(() => import('@/components/Consultation/AudioRoom'), { ssr: false });
const ChatPanel = dynamic(() => import('@/components/Consultation/ChatPanel'), { ssr: false });
const PrescriptionForm = dynamic(() => import('@/components/Consultation/PrescriptionForm'), { ssr: false });

export default function ConsultationRoom({ params }) {
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.sessionId;
  const router = useRouter();
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showPrescription, setShowPrescription] = useState(false);

  // 1. Fetch Session Data
  useEffect(() => {
    if (!user || !sessionId) return;
    
    const sessionRef = doc(db, 'consultation_sessions', sessionId);
    const unsub = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData({ id: docSnap.id, ...data });
        
        // If session was ended remotely
        if (data.status === 'ended') {
           leaveChannel(localAudioTrack, localVideoTrack).then(() => {
             toast.success('Session has ended');
             router.push(`/dashboard/${data.doctorId === user.uid ? 'doctor' : 'patient'}`);
           });
        }
      } else {
        setError('Session not found');
      }
      setLoading(false);
    });

    return () => unsub();
  }, [sessionId, user]);

  // 2. Initialize Agora
  useEffect(() => {
    if (loading || error || !sessionData || !user) return;
    // Don't join an ended session
    if (sessionData.status === 'ended') return;

    let rtcClient;

    const initAgora = async () => {
      try {
        const clientModule = await import('@/lib/agoraClient');
        rtcClient = clientModule.getAgoraClient();

        rtcClient.on('user-published', async (agoraUser, mediaType) => {
          await rtcClient.subscribe(agoraUser, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers((prev) => [...prev.filter(u => u.uid !== agoraUser.uid), agoraUser]);
          }
          if (mediaType === 'audio') {
            agoraUser.audioTrack.play();
            setRemoteUsers((prev) => {
               if(prev.find(u => u.uid === agoraUser.uid)) return prev;
               return [...prev, agoraUser];
            });
          }
        });

        rtcClient.on('user-unpublished', (agoraUser, mediaType) => {
           if (mediaType === 'video') {
             setRemoteUsers((prev) => prev.filter(u => u.uid !== agoraUser.uid));
           }
        });

        rtcClient.on('user-left', (agoraUser) => {
          setRemoteUsers((prev) => prev.filter(u => u.uid !== agoraUser.uid));
          toast('Participant left', { icon: '👋' });
        });

        const tokenRes = await fetch(`/api/agora/token?channelName=${sessionData.channelName}&uid=${user.uid}`);
        const tokenData = await tokenRes.json();
        
        if (tokenData.error) {
            throw new Error(tokenData.error);
        }

        const { localAudioTrack, localVideoTrack } = await clientModule.joinChannel(
          sessionData.channelName, 
          tokenData.token, 
          user.uid
        );

        setLocalAudioTrack(localAudioTrack);
        if (sessionData.mode === 'video') {
           setLocalVideoTrack(localVideoTrack);
        }

        // Only update status to active if joining for the first time
        if (sessionData.status === 'waiting') {
           await updateDoc(doc(db, 'consultation_sessions', sessionId), { status: 'active' });
        }

      } catch (err) {
        console.error('Agora Init Error', err);
        toast.error('Failed to connect media');
      }
    };

    initAgora();

    return () => {
      import('@/lib/agoraClient').then(({ leaveChannel }) => {
         leaveChannel(localAudioTrack, localVideoTrack);
      });
    };
  }, [loading, error, sessionData?.mode]); // intentionally missing some deps to avoid re-joining

  const toggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setMuted(isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setMuted(isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

  const endSession = async () => {
    try {
       // Stop tracks instantly for better UX
       if (localAudioTrack) localAudioTrack.stop();
       if (localVideoTrack) localVideoTrack.stop();
       
       await updateDoc(doc(db, 'consultation_sessions', sessionId), { 
         status: 'ended',
         endedAt: new Date()
       });
       
       if (sessionData.appointmentId) {
          await updateDoc(doc(db, 'appointments', sessionData.appointmentId), { status: 'completed' });
       }
       
       // Note: the onSnapshot will redirect us
    } catch(e) {
      console.error(e);
      toast.error('Failed to end session');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] text-white">Connecting...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d] text-white">{error}</div>;
  if (!user || !sessionData) return null;

  const isDoctor = user.uid === sessionData.doctorId;
  const currentRole = isDoctor ? 'doctor' : 'patient';
  const otherName = isDoctor ? sessionData.patientName : sessionData.doctorName;

  return (
    <main className="h-screen w-full bg-[#050706] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 px-6 bg-[#0a0f0d] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-white font-black text-sm uppercase tracking-widest leading-none mt-0.5">Live Consult</span>
           </div>
           <div className="h-4 w-px bg-white/20" />
           <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{otherName}</span>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`h-9 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${showChat ? 'bg-[#1e4a3a] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              <MessageSquare size={14} /> Chat
            </button>
            {isDoctor && (
              <button 
                onClick={() => setShowPrescription(true)}
                className="h-9 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
              >
                 <Plus size={14} /> Prescription
              </button>
            )}
            <button 
              onClick={endSession}
              className="h-9 px-5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all ml-2"
            >
              <PhoneOff size={14} /> End
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Media Area */}
        <div className="flex-1 rounded-2xl overflow-hidden relative">
           {sessionData.mode === 'audio' ? (
             <AudioRoom 
                remoteUsers={remoteUsers} 
                isMicOn={isMicOn} 
                onToggleMic={toggleMic} 
                doctorName={sessionData.doctorName}
                patientName={sessionData.patientName}
             />
           ) : (
             <VideoRoom 
                localVideoTrack={localVideoTrack}
                localAudioTrack={localAudioTrack}
                remoteUsers={remoteUsers}
                isMicOn={isMicOn}
                isCamOn={isCamOn}
                onToggleMic={toggleMic}
                onToggleCam={toggleCam}
             />
           )}
        </div>

        {/* Sidebar Space (Chat / Prescription) */}
        {(showChat || showPrescription) && (
          <div className="w-[380px] shrink-0 flex flex-col gap-4">
             {showPrescription ? (
                <div className="flex-1 overflow-y-auto">
                   <PrescriptionForm 
                     sessionId={sessionId}
                     appointmentId={sessionData.appointmentId}
                     doctorId={sessionData.doctorId}
                     patientId={sessionData.patientId}
                     patientName={sessionData.patientName}
                     onDone={() => setShowPrescription(false)}
                   />
                </div>
             ) : (
                <ChatPanel 
                  sessionId={sessionId} 
                  currentUser={user} 
                  currentRole={currentRole} 
                />
             )}
          </div>
        )}

      </div>
    </main>
  );
}
