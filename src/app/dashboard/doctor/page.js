'use client';
import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { 
  ClipboardList, HeartPulse, Stethoscope, Clock, 
  User, CheckCircle2, Activity, ChevronRight, 
  Calendar, FileText, AlertCircle, TrendingUp, 
  ArrowRight, ShieldCheck, Zap, Plus, X, 
  Search, CreditCard, Settings, Loader2, Video,
  Phone, MapPin, UserCircle, Download, Filter,
  MoreHorizontal, Camera, Mail, Edit3
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { 
  doc, onSnapshot, updateDoc, collection, getDocs, 
  query, where, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { m as motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

function DoctorDashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('view') || 'overview';

  const [profile, setProfile] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Patients & Appointments
  const [allAppointments, setAllAppointments] = useState([]);
  const [patientQueue, setPatientQueue] = useState([]);
  const [consultationSessions, setConsultationSessions] = useState([]);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Schedule Management
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [newSlot, setNewSlot] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState({
    'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': []
  });

  // UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Settings Form
  const [profileForm, setProfileForm] = useState({
    fullName: '', phone: '', specialty: '', bio: '', 
    consultationFee: '', experience: '', address: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // --- DATA LISTENERS ---

  useEffect(() => {
    if (!user) return;

    // Profile listener
    const unProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: docSnap.id, ...data });
        if (data.weeklySchedule) setWeeklySchedule(data.weeklySchedule);
        setProfileForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          specialty: data.specialty || '',
          bio: data.bio || '',
          consultationFee: data.consultationFee || '',
          experience: data.experience || '',
          address: data.address || ''
        });
        setIsDataLoaded(true);
      }
    });

    // All appointments for this doctor
    const unAppts = onSnapshot(
      query(collection(db, 'appointments'), where('doctorId', '==', user.uid)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        setAllAppointments(sorted);
        
        // Show confirmed appointments OR pending instant calls
        const queue = sorted.filter(a => 
          (a.status === 'confirmed' || a.status === 'Confirmed') || 
          (a.status === 'pending' && a.type === 'instant')
        );
        setPatientQueue(queue);
      }
    );

    // Consultation sessions
    const unSessions = onSnapshot(
      query(collection(db, 'consultation_sessions'), where('doctorId', '==', user.uid)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a, b) => (b.startedAt?.toDate?.() || 0) - (a.startedAt?.toDate?.() || 0));
        setConsultationSessions(sorted);
      }
    );

    return () => { unProfile(); unAppts(); unSessions(); };
  }, [user]);

  // --- SOUND NOTIFICATIONS ---
  const prevQueueLength = useRef(0);
  useEffect(() => {
    if (patientQueue.length > prevQueueLength.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked"));
    }
    prevQueueLength.current = patientQueue.length;
  }, [patientQueue]);

  // Fetch specialties for telemed eligibility
  useEffect(() => {
    const fetchSpecialties = async () => {
      const querySnapshot = await getDocs(collection(db, 'specialties'));
      setSpecialties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchSpecialties();
  }, []);

  // --- COMPUTED ---

  const stats = useMemo(() => {
    const completed = allAppointments.filter(a => a.status === 'completed');
    const confirmed = patientQueue.length;
    const today = new Date().toDateString();
    const todayAppts = allAppointments.filter(a => {
      const date = a.createdAt?.toDate?.();
      return date && date.toDateString() === today;
    });
    return [
      { name: 'Today\'s Queue', value: todayAppts.length.toString().padStart(2, '0'), icon: ClipboardList, color: '#059669', bgColor: '#ecfdf5' },
      { name: 'Pending Review', value: confirmed.toString().padStart(2, '0'), icon: Clock, color: '#d97706', bgColor: '#fffbeb' },
      { name: 'Total Completed', value: completed.length.toString().padStart(2, '0'), icon: CheckCircle2, color: '#2563eb', bgColor: '#eff6ff' },
      { name: 'Sessions Held', value: consultationSessions.length.toString().padStart(2, '0'), icon: Video, color: '#7c3aed', bgColor: '#f5f3ff' },
    ];
  }, [allAppointments, patientQueue, consultationSessions]);

  // --- HANDLERS ---

  const checkInstantBookingEligibility = (doctorServices) => {
    if (!doctorServices || doctorServices.length === 0) return false;
    return specialties.some(spec => 
      spec.services?.some(serv => serv.telemed && doctorServices.includes(serv.name))
    );
  };

  const handleToggleStatus = async (field, currentValue) => {
    if (!user) return;
    try {
      if (field === 'instantBooking' && !currentValue) {
        if (!checkInstantBookingEligibility(profile.services)) {
          toast.error('Telemedicine services required for Instant Booking');
          return;
        }
      }
      await updateDoc(doc(db, 'users', user.uid), {
        [field]: !currentValue,
        lastStatusUpdate: new Date().toISOString()
      });
      toast.success(`Status updated successfully`);
    } catch (error) {
      console.error(error);
      toast.error('Update failed');
    }
  };

  const handleUpdateSchedule = async (updatedSchedule) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        weeklySchedule: updatedSchedule,
        lastScheduleUpdate: new Date().toISOString()
      });
      toast.success('Schedule updated');
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const addSlot = () => {
    if (!newSlot) return;
    const currentDaySlots = weeklySchedule[selectedDay] || [];
    if (currentDaySlots.includes(newSlot)) { toast.error('Slot already exists'); return; }
    const updated = { ...weeklySchedule, [selectedDay]: [...currentDaySlots, newSlot].sort() };
    setWeeklySchedule(updated);
    handleUpdateSchedule(updated);
    setNewSlot('');
  };

  const removeSlot = (index) => {
    const daySlots = weeklySchedule[selectedDay].filter((_, i) => i !== index);
    const updated = { ...weeklySchedule, [selectedDay]: daySlots };
    setWeeklySchedule(updated);
    handleUpdateSchedule(updated);
  };

  const startSession = async (appointment) => {
    setIsStartingSession(true);
    try {
      const sessionRef = await addDoc(collection(db, 'consultation_sessions'), {
        appointmentId: appointment.id,
        doctorId: user.uid,
        patientId: appointment.userId,
        doctorName: profile?.fullName || 'Doctor',
        patientName: appointment.patientName || appointment.userName || 'Patient',
        mode: 'video',
        status: 'waiting',
        channelName: `session_${appointment.id}_${Date.now()}`,
        startedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      router.push(`/consultation/${sessionRef.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to start session');
      setIsStartingSession(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), profileForm);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally { setIsSaving(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      toast.success('Photo updated');
    } catch (error) { toast.error('Upload failed'); }
    finally { setIsUploading(false); }
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-[#1e4a3a] mb-3" />
        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Loading clinical workspace...</p>
      </div>
    );
  }

  // --- OVERVIEW ---

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="relative h-[180px] rounded-[16px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/90 via-emerald-900/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-[#1e4a3a] z-0" />
        <div className="absolute bottom-6 left-8 z-20">
          <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-1">Physician Portal</p>
          <h1 className="text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight">
            Dr. {profile?.fullName?.split(' ').slice(-1)[0] || 'Physician'}
          </h1>
          <p className="text-white/60 text-[12px] font-medium mt-1">{profile?.specialty || 'General Practice'}</p>
        </div>
        <div className="absolute bottom-6 right-8 z-20 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${profile?.isConsulting ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{profile?.isConsulting ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="h-[90px] rounded-[12px] border p-5 flex items-center gap-4 transition-all hover:shadow-md group"
            style={{ background: `linear-gradient(135deg, ${stat.bgColor} 0%, #ffffff 100%)`, borderColor: `${stat.color}30` }}
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ color: stat.color }}>
              <stat.icon size={28} strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 leading-none mb-1">{stat.name}</p>
              <p className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[14px] font-medium text-[#1e4a3a] tracking-tight flex items-center gap-2">
                <Clock size={16} className="text-emerald-500" />
                Active Consultation Queue
              </h3>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{patientQueue.length} Waiting</span>
            </div>
            <div className="divide-y divide-slate-50">
              {patientQueue.length === 0 && (
                <div className="py-16 text-center">
                  <Clock size={28} className="text-slate-200 mx-auto mb-3" strokeWidth={1.2} />
                  <p className="text-[12px] font-medium text-slate-400">No active appointments in queue</p>
                </div>
              )}
              {patientQueue.map((patient) => {
                const isPendingInstant = patient.status === 'pending' && patient.type === 'instant';
                return (
                  <div key={patient.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[8px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden relative">
                        <User size={20} className="translate-y-1" />
                        {patient.type === 'instant' && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border border-white rounded-full flex items-center justify-center">
                            <Zap size={6} className="text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-medium text-slate-800 flex items-center gap-2">
                          {patient.patientName || patient.userName || 'Patient'}
                          {isPendingInstant && <span className="text-[8px] font-black bg-amber-500 text-white px-1 py-0.5 rounded uppercase tracking-widest">Verify Payment</span>}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-medium text-emerald-600">{patient.specialty || 'General'}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={12} />{patient.type === 'instant' ? 'Now' : patient.time || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        isPendingInstant ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {isPendingInstant ? 'Pending Finance' : patient.status}
                      </span>
                      <button 
                        onClick={() => startSession(patient)}
                        disabled={isStartingSession || (isPendingInstant && !profile?.instantBooking)}
                        className={`h-8 px-4 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                          isPendingInstant ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-[#1e4a3a] text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isStartingSession ? 'Starting...' : 'Start Session'}
                        {!isStartingSession && <ArrowRight size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/doctor?view=schedule" className="h-[100px] rounded-[12px] border border-slate-200 p-5 hover:border-amber-400 transition-all group flex items-center gap-4 bg-gradient-to-r from-amber-50/50 to-white">
              <div className="w-10 h-10 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calendar size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-slate-800">Manage Schedule</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Set your weekly availability</p>
              </div>
            </Link>
            <Link href="/dashboard/doctor?view=sessions" className="h-[100px] rounded-[12px] border border-slate-200 p-5 hover:border-purple-400 transition-all group flex items-center gap-4 bg-gradient-to-r from-purple-50/50 to-white">
              <div className="w-10 h-10 rounded-[8px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Video size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-slate-800">Session History</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Past consultations & records</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Availability Toggles */}
          <div className="bg-white rounded-[12px] border border-slate-200 p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Clinical Availability
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[8px] border border-slate-100 bg-slate-50/30">
                <div>
                  <p className="text-[12px] font-medium text-slate-700">Consultation Status</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Live platform presence</p>
                </div>
                <button 
                  onClick={() => handleToggleStatus('isConsulting', profile?.isConsulting)}
                  className={`w-10 h-5 rounded-full transition-all relative ${profile?.isConsulting ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${profile?.isConsulting ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[8px] border border-slate-100 bg-slate-50/30">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-medium text-slate-700">Instant Booking</p>
                    <Zap size={10} className={profile?.instantBooking ? "text-blue-500 fill-blue-500" : "text-slate-300"} />
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Express appointment flow</p>
                </div>
                <button 
                  onClick={() => handleToggleStatus('instantBooking', profile?.instantBooking)}
                  className={`w-10 h-5 rounded-full transition-all relative ${profile?.instantBooking ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${profile?.instantBooking ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 text-center pt-1">Changes broadcast in real-time to patient search</p>
            </div>
          </div>

          {/* Doctor Profile Card */}
          <div className="bg-white rounded-[12px] border border-slate-200 p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">Profile Summary</h3>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-[12px] bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-200 overflow-hidden mb-3">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="translate-y-2" />
                )}
              </div>
              <h4 className="text-[14px] font-bold text-[#1e4a3a]">Dr. {profile?.fullName || 'N/A'}</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{profile?.specialty || 'General Practice'}</p>
            </div>
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">Experience</p>
                <span className="text-[11px] font-bold text-[#1e4a3a]">{profile?.experience || 'N/A'} years</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">Fee</p>
                <span className="text-[11px] font-bold text-emerald-600">৳{profile?.consultationFee || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">Patients Served</p>
                <span className="text-[11px] font-bold text-[#1e4a3a]">{allAppointments.filter(a => a.status === 'completed').length}</span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="rounded-[16px] p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e4a3a 0%, #0f3028 100%)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={80} />
            </div>
            <h3 className="text-[13px] font-medium tracking-tight mb-3 flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />
              Performance
            </h3>
            <p className="text-[11px] text-emerald-100/70 leading-relaxed mb-4">Patient satisfaction rate: <span className="text-white font-bold">92%</span></p>
            <div className="space-y-2">
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-emerald-400 rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-emerald-200/50">
                <span>Rating</span>
                <span className="text-emerald-400">Target: 95%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- APPOINTMENTS TABLE ---

  const renderAppointments = () => (
    <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight">All Appointments</h2>
            <p className="text-[11px] text-slate-400">{allAppointments.length} total records</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            type="text" placeholder="Search patients..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[280px] h-10 bg-slate-50 border border-slate-200 rounded-[8px] pl-10 pr-4 text-[12px] font-medium outline-none focus:bg-white focus:border-[#1e4a3a] transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100">
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</th>
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allAppointments
              .filter(a => (a.patientName || a.userName || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map((appt) => (
              <tr key={appt.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-slate-800">{appt.patientName || appt.userName || 'Patient'}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{appt.specialty || 'General'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                    <Calendar size={14} className="text-slate-300" />
                    {appt.date || appt.createdAt?.toDate?.()?.toLocaleDateString()}
                  </div>
                  {appt.time && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <Clock size={12} className="text-slate-300" />
                      {appt.time}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                    appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>{appt.status}</span>
                </td>
                <td className="px-6 py-4">
                  {(appt.status === 'confirmed' || appt.status === 'Confirmed') ? (
                    <button onClick={() => startSession(appt)} disabled={isStartingSession} className="text-[11px] font-bold text-emerald-600 hover:underline uppercase tracking-wider">Start Session</button>
                  ) : (
                    <button onClick={() => setSelectedItem(appt)} className="text-[11px] font-bold text-[#1e4a3a] hover:underline uppercase tracking-wider">Details</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allAppointments.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList size={28} className="text-slate-200 mx-auto mb-3" strokeWidth={1.2} />
            <p className="text-[12px] font-medium text-slate-400">No appointment records yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- SCHEDULE ---

  const renderSchedule = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-[#1e4a3a] tracking-tight uppercase">Schedule Management</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Define your weekly consultation availability</p>
      </div>
      <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden">
        <div className="p-6">
          {/* Day Selector */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-2.5 rounded-[8px] border text-[9px] font-bold uppercase tracking-widest transition-all ${
                  selectedDay === day 
                  ? 'bg-[#1e4a3a] text-white border-[#1e4a3a]' 
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Slot Management */}
          <div className="bg-slate-50/50 border border-slate-200 rounded-[12px] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h4 className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{selectedDay} Availability</h4>
                <p className="text-[10px] text-slate-400">Add or remove time slots</p>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-[8px] border border-slate-200 focus-within:border-[#1e4a3a] transition-all">
                <input 
                  type="time" 
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="bg-transparent text-[11px] font-medium outline-none px-2"
                />
                <button 
                  onClick={addSlot}
                  className="h-7 w-7 bg-[#1e4a3a] text-white rounded-[6px] flex items-center justify-center hover:bg-emerald-700 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {weeklySchedule[selectedDay]?.length > 0 ? (
                weeklySchedule[selectedDay].map((slot, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-[8px] p-3 flex items-center justify-between group hover:border-emerald-400 transition-all">
                    <span className="text-[11px] font-medium text-slate-700">{slot}</span>
                    <button 
                      onClick={() => removeSlot(idx)}
                      className="w-5 h-5 bg-rose-50 text-rose-500 rounded-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center">
                  <Clock size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-[11px] font-medium text-slate-400">No slots defined for {selectedDay}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- SESSIONS ---

  const renderSessions = () => (
    <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-purple-50 text-purple-600 flex items-center justify-center">
            <Video size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight">Consultation Sessions</h2>
            <p className="text-[11px] text-slate-400">{consultationSessions.length} sessions recorded</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {consultationSessions.map((session) => (
          <div key={session.id} className="px-6 py-4 hover:bg-slate-50/40 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[8px] bg-purple-50 text-purple-500 flex items-center justify-center">
                <Video size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-slate-800">{session.patientName || 'Patient'}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400">{session.startedAt?.toDate?.()?.toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-[10px] text-slate-400">{session.mode || 'Video'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                session.status === 'active' ? 'bg-blue-50 text-blue-600' :
                'bg-amber-50 text-amber-600'
              }`}>{session.status}</span>
              {session.status === 'active' && (
                <Link href={`/consultation/${session.id}`} className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-wider">Rejoin</Link>
              )}
            </div>
          </div>
        ))}
        {consultationSessions.length === 0 && (
          <div className="py-16 text-center">
            <Video size={28} className="text-slate-200 mx-auto mb-3" strokeWidth={1.2} />
            <p className="text-[12px] font-medium text-slate-400">No consultation sessions yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- SETTINGS ---

  const renderSettings = () => (
    <div className="max-w-4xl">
      <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#1e4a3a] tracking-tight uppercase">Doctor Profile</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Update your professional information and credentials</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
              <div className="w-14 h-14 rounded-[12px] bg-[#1e4a3a] text-white flex items-center justify-center group-hover:bg-emerald-600 transition-all overflow-hidden relative">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                <Plus size={10} />
              </div>
            </label>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <Stethoscope size={12} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Verified MD</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Professional Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-[6px] bg-slate-100 flex items-center justify-center text-[#1e4a3a] font-bold text-[10px]">01</div>
                <h4 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">Professional Info</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input type="text" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[8px] px-4 text-[13px] font-medium text-[#1e4a3a] outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specialty</label>
                    <input type="text" value={profileForm.specialty} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[8px] px-4 text-[13px] font-medium text-[#1e4a3a] outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience (yrs)</label>
                    <input type="number" value={profileForm.experience} onChange={e => setProfileForm({...profileForm, experience: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[8px] px-4 text-[13px] font-medium text-[#1e4a3a] outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                  <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[8px] px-4 text-[13px] font-medium text-[#1e4a3a] outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Clinical Data */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-[6px] bg-slate-100 flex items-center justify-center text-[#1e4a3a] font-bold text-[10px]">02</div>
                <h4 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">Clinical Details</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultation Fee (BDT)</label>
                  <input type="number" value={profileForm.consultationFee} onChange={e => setProfileForm({...profileForm, consultationFee: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[8px] px-4 text-[13px] font-bold text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address / Clinic</label>
                  <input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[8px] px-4 text-[13px] font-medium text-[#1e4a3a] outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bio / About</label>
                  <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-4 py-3 text-[12px] font-medium text-[#1e4a3a] outline-none focus:bg-white focus:border-emerald-500 transition-all resize-none" placeholder="Brief professional bio..." />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onClick={() => router.push('/dashboard/doctor')} className="h-9 px-5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">Cancel</button>
            <button type="submit" disabled={isSaving} className="h-9 px-6 bg-[#1e4a3a] text-white rounded-[8px] text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // --- TAB ROUTER ---

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'queue': return renderAppointments();
      case 'schedule': return renderSchedule();
      case 'sessions': return renderSessions();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  // --- RENDER ---

  return (
    <DashboardLayout role="doctor">
      <div className="w-full pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-[16px] overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-bold text-[#1e4a3a]">Appointment Details</h3>
                  <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-[6px] bg-slate-50 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                    <p className="text-[13px] font-medium text-[#1e4a3a]">{selectedItem.patientName || selectedItem.userName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Specialty</p>
                    <p className="text-[13px] font-medium text-[#1e4a3a]">{selectedItem.specialty || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-[13px] font-medium text-slate-600">{selectedItem.date || selectedItem.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      selectedItem.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>{selectedItem.status}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-5">
                  <button onClick={() => setSelectedItem(null)} className="flex-1 h-9 border border-slate-200 text-slate-600 rounded-[8px] text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function DoctorDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#1e4a3a]" />
      </div>
    }>
      <DoctorDashboardContent />
    </Suspense>
  );
}
