'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, Calendar, Clock, Video, Phone, FileUp, 
  MessageSquare, ChevronLeft, ChevronRight,
  Briefcase, Users, Wallet, RotateCcw,
  CheckCircle2, Info, Loader2, X, Zap, ShieldCheck,
  Stethoscope, MapPin
} from 'lucide-react';
import { 
  doc, getDoc, collection, addDoc, query, where, 
  getDocs, serverTimestamp, setDoc, onSnapshot,
  deleteDoc, Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function DoctorBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection State
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [consultationType, setConsultationType] = useState('telemed'); // telemed | in-person
  const [paymentType, setPaymentType] = useState('later'); // now | later
  const [patientPhone, setPatientPhone] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Real-time Availability
  const [bookedSlots, setBookedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const blockTimerRef = useRef(null);

  useEffect(() => {
    async function fetchDoctor() {
      if (!params.id || !db) return;
      try {
        const docRef = doc(db, 'users', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDoctor({ id: docSnap.id, ...data });
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
  }, [params.id]);

  // Pre-fill user data
  useEffect(() => {
    if (profile) {
      setPatientPhone(profile.phone || '');
    }
  }, [profile]);

  // Listen to booked and temporary blocked slots
  useEffect(() => {
    if (!doctor || !selectedDate || !db) return;

    // 1. Query confirmed appointments for this date
    const apptsQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctor.id),
      where('dateId', '==', selectedDate.id)
    );

    const unsubscribeAppts = onSnapshot(apptsQuery, (snapshot) => {
      const booked = snapshot.docs.map(doc => doc.data().time);
      setBookedSlots(booked);
    });

    // 2. Query temporary blocks for this date
    const blocksQuery = query(
      collection(db, 'temporary_blocks'),
      where('doctorId', '==', doctor.id),
      where('dateId', '==', selectedDate.id)
    );

    const unsubscribeBlocks = onSnapshot(blocksQuery, (snapshot) => {
      const blocked = snapshot.docs
        .filter(doc => (doc.data().expiresAt?.toMillis() || 0) > Date.now())
        .map(doc => doc.data().time);
      setBlockedSlots(blocked);
    });

    return () => {
      unsubscribeAppts();
      unsubscribeBlocks();
    };
  }, [doctor, selectedDate]);

  const handleSlotSelection = async (time) => {
    if (!user) {
      toast.error("Please login to book an appointment");
      router.push('/login');
      return;
    }

    if (bookedSlots.includes(time) || blockedSlots.includes(time)) {
      toast.error("This slot is currently unavailable");
      return;
    }

    setSelectedTime(time);

    // Create a temporary block in Firestore (expires in 15 mins)
    try {
      const blockId = `${doctor.id}_${selectedDate.id}_${time.replace(/\s+/g, '')}`;
      await setDoc(doc(db, 'temporary_blocks', blockId), {
        doctorId: doctor.id,
        dateId: selectedDate.id,
        time,
        userId: user.uid,
        expiresAt: Timestamp.fromMillis(Date.now() + 15 * 60 * 1000)
      });
      
      // Cleanup previous block if user changes time
      if (blockTimerRef.current) clearTimeout(blockTimerRef.current);
      blockTimerRef.current = setTimeout(() => setSelectedTime(null), 15 * 60 * 1000);

    } catch (e) {
      console.error("Block error:", e);
    }
  };

  const handleBookingRedirect = async () => {
    if (!selectedDate || !selectedTime || !patientPhone) {
      toast.error("Please provide all required information");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Prepare Metadata for Checkout
      const checkoutSession = {
        type: 'specialist',
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialty: doctor.specialties?.[0] || 'Specialist',
        totalAmount: doctor.fee || 0,
        fees: doctor.fee || 0,
        discount: 0,
        date: selectedDate.fullDate,
        dateId: selectedDate.id,
        time: selectedTime,
        patientPhone,
        problemDescription,
        consultationType,
        paymentType // 'now' or 'later'
      };

      // 2. Persistent block cleanup when they leave (simplified for now as they're going to checkout)
      // 3. Redirect
      sessionStorage.setItem('medita_checkout', JSON.stringify(checkoutSession));
      router.push('/checkout');

    } catch (error) {
      console.error("Booking error:", error);
      toast.error("System error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const generateAvailableDates = () => {
    if (!doctor || !doctor.weeklySchedule) return [];
    
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) { // Show next 3 weeks
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      const dayNameFull = fullDayNames[nextDay.getDay()];
      
      // Only include if doctor has slots for this day
      if (doctor.weeklySchedule[dayNameFull] && doctor.weeklySchedule[dayNameFull].length > 0) {
        dates.push({
          dayName: dayNames[nextDay.getDay()],
          dayNameFull: dayNameFull,
          date: nextDay.getDate(),
          month: `${monthNames[nextDay.getMonth()]}, ${nextDay.getFullYear().toString().slice(-2)}`,
          fullDate: nextDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          id: nextDay.toDateString()
        });
      }
    }
    return dates;
  };

  const availableDates = generateAvailableDates();
  const availableSlots = (doctor && selectedDate) ? (doctor.weeklySchedule[selectedDate.dayNameFull] || []) : [];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Establishing secure link...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 pb-24 selection:bg-emerald-50">

      <div className="pt-24 lg:pt-32 w-full max-w-[1825px] mx-auto px-4 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT SIDEBAR (Doctor Info) --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-300 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {doctor.photoURL ? (
                    <img src={doctor.photoURL} alt={doctor.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900 leading-tight mb-1">{doctor.fullName}</h1>
                  <div className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest mb-2 border border-emerald-200">
                    {doctor.specialties?.[0] || 'Medical Specialist'}
                  </div>
                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-tight leading-relaxed">
                    {doctor.degrees?.join(', ') || 'MBBS, BDS, MCPS'}
                  </p>

                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <StatCard icon={Briefcase} label="Experience" value={`${doctor.experience || 0} years`} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <StatCard icon={Users} label="Patients Helped" value={doctor.totalPatients || "1,000 +"} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
                <StatCard icon={Wallet} label="Consultation Fee" value={`৳ ${doctor.fee || '0.00'}`} iconBg="bg-amber-50" iconColor="text-amber-500" />
                <StatCard icon={RotateCcw} label="Follow up period" value={`${doctor.followUpDays || 15} days`} iconBg="bg-rose-50" iconColor="text-rose-500" />
              </div>

              {/* Biography */}
              <div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info size={14} className="text-slate-400" />
                  Doctor Bio
                </h3>
                <div className="text-[11px] text-slate-800 leading-relaxed text-justify whitespace-pre-line p-4 bg-slate-50 border border-slate-200 rounded-lg font-medium">
                  {doctor.bio || `Dr. ${doctor.fullName} is a highly regarded medical specialist. Proposing a patient-first approach, they provide evidence-based treatments and diagnostics across all clinical scenarios.`}
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="bg-emerald-50/50 border border-emerald-300 rounded-lg p-4 flex items-center gap-4 border-2">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-500 border border-emerald-200 shrink-0">
                  <ShieldCheck size={20} />
               </div>
               <div>
                  <p className="text-[12px] font-black text-emerald-900 uppercase tracking-widest">Verified Doctor</p>
                  <p className="text-[10px] text-emerald-700/70 font-bold tracking-tight uppercase">Credentials verified by Govt. Licensing Authority</p>
               </div>
            </div>
          </div>

          {/* --- MAIN SECTION (Booking Form) --- */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Consultation & Fee Info */}
            <div className="bg-white border border-slate-300 rounded-lg p-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Select Consultation Mode</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-1 flex gap-1">
                     <button 
                        onClick={() => setConsultationType('telemed')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${consultationType === 'telemed' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                     >
                        Online
                     </button>
                     <button 
                         onClick={() => setConsultationType('in-person')}
                         className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${consultationType === 'in-person' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                     >
                        In-Person
                     </button>
                  </div>
               </div>

              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200">
                    {consultationType === 'telemed' ? <Video size={24} /> : <Stethoscope size={24} />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{consultationType === 'telemed' ? 'Online Consultation' : 'In-Clinic Appointment'}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Professional Consultation Fee (Inc. Tax)</p>
                  </div>
                </div>
                <div className="text-[20px] font-black text-emerald-600 tracking-tighter">
                  ৳ {Number(doctor.fee || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Schedules Slider */}
            <div className="bg-white border border-slate-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Choose a date</h3>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time availability</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {availableDates.length > 0 ? availableDates.map((d, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                    className={`flex-shrink-0 w-20 p-2.5 rounded-lg border transition-all text-center
                      ${selectedDate?.id === d.id 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600 shadow-sm' 
                        : 'border-slate-200 hover:border-emerald-200 text-slate-400 bg-white'}`}
                  >
                    <p className="text-[10px] font-black mb-1 opacity-60 uppercase tracking-widest">{d.dayName}</p>
                    <p className="text-xl font-black leading-none mb-1">{d.date}</p>
                    <p className="text-[px] font-black uppercase tracking-tighter">{d.month}</p>
                  </button>
                )) : (
                   <div className="w-full py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No available dates found for this specialist.</p>
                   </div>
                )}
              </div>
            </div>

            {/* Time Slots */}
            <AnimatePresence>
            {selectedDate && (
               <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-300 rounded-lg p-6"
               >
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Select a time for {selectedDate.fullDate}</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                 {availableSlots.length > 0 ? availableSlots.map((slot, i) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isBlocked = blockedSlots.includes(slot);
                    const isUnavailable = isBooked || isBlocked;
                    
                    return (
                        <button 
                         key={i}
                         disabled={isUnavailable}
                         onClick={() => handleSlotSelection(slot)}
                         className={`px-3 py-2.5 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                           ${selectedTime === slot
                             ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                             : isUnavailable 
                                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50 line-through'
                                : 'border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-700'}`}
                       >
                         {isUnavailable ? <Zap size={10} className="fill-slate-100" /> : <Clock size={12} />}
                         {slot}
                       </button>
                    )
                 }) : (
                    <div className="col-span-full py-4 text-center bg-slate-50 rounded-md border border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Doctor consultation limit reached for today.</p>
                    </div>
                 )}
               </div>
               </motion.div>
            )}
            </AnimatePresence>

            {/* Booking Form Part 2 */}
            <div className="bg-white border border-slate-300 rounded-lg p-6 space-y-6">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Patient Records & Validation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 ml-0.5">Contact Number *</label>
                    <div className="relative">
                       <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                       <input 
                         type="tel" 
                         placeholder="01700-000000"
                         value={patientPhone}
                         onChange={(e) => setPatientPhone(e.target.value)}
                         className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm font-black focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 placeholder:font-medium"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 ml-0.5">Attached Records (Optional)</label>
                    <label className="flex items-center gap-2 h-11 px-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all overflow-hidden border-dashed">
                       <FileUp size={16} className="text-emerald-500" />
                       <span className="text-[11px] font-black uppercase tracking-tight truncate text-slate-600">{selectedFile ? selectedFile.name : 'Click to add files'}</span>
                       <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        {selectedFile && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            className="shrink-0 w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all ml-2 border border-rose-100"
                          >
                            <X size={12} />
                          </button>
                        )}
                    </label>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 ml-0.5">Concerns Summary</label>
                <textarea 
                  placeholder="Describe your health condition briefly..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full h-24 p-4 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-sm shadow-slate-900/5 placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>

              {/* Payment Selection */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security & Billing Options</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <button 
                        onClick={() => setPaymentType('now')}
                        className={`p-4 rounded-xl border text-left transition-all ${paymentType === 'now' ? 'border-emerald-600 bg-emerald-50/50 shadow-lg' : 'border-slate-200 hover:border-emerald-200 bg-white'}`}
                     >
                        <div className="flex items-center justify-between mb-2">
                           <Zap size={16} className={paymentType === 'now' ? 'text-emerald-600 fill-emerald-600' : 'text-slate-100'} />
                           <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">Fast Track</span>
                        </div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Pay Now</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Guaranteed slot, instant confirmation</p>
                     </button>
                     <button 
                         onClick={() => setPaymentType('later')}
                         className={`p-4 rounded-xl border text-left transition-all ${paymentType === 'later' ? 'border-slate-900 bg-slate-50 shadow-lg' : 'border-slate-200 hover:border-slate-900 bg-white'}`}
                     >
                        <div className="flex items-center justify-between mb-2">
                           <Clock size={16} className={paymentType === 'later' ? 'text-slate-900' : 'text-slate-100'} />
                        </div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Pay Later</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Confirm now, settle payment later</p>
                     </button>
                  </div>
              </div>

              {/* Booking Button */}
              <button 
                onClick={handleBookingRedirect}
                disabled={submitting || !selectedDate || !selectedTime || !patientPhone}
                className={`w-full h-11 rounded-lg font-black text-[13px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border
                  ${(!submitting && selectedDate && selectedTime && patientPhone) 
                    ? 'bg-slate-950 text-white border-slate-950 hover:bg-black active:scale-[0.98] shadow-2xl shadow-slate-900/20' 
                    : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
              >
                {submitting ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                   <>
                      <CheckCircle2 size={18} />
                      {paymentType === 'later' ? 'Finalize Appointment' : `Authorize ৳${Number(doctor.fee || 0).toFixed(2)} & Book`}
                   </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3 hover:border-slate-300 transition-colors">
      <div className={`w-9 h-9 shrink-0 ${iconBg} ${iconColor} rounded flex items-center justify-center border border-current opacity-70`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate leading-none mb-1.5">{label}</p>
        <p className="text-[13px] font-black text-slate-900 tracking-tighter truncate leading-none">{value}</p>
      </div>
    </div>
  );
}
