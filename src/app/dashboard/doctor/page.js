'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { 
  ClipboardList, HeartPulse, Stethoscope, Clock, 
  User, CheckCircle2, MoreHorizontal, Activity,
  ChevronRight, Calendar, FileText, AlertCircle,
  TrendingUp, ArrowRight, ShieldCheck, Zap, Plus, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Patient Queue State
  const [patientQueue, setPatientQueue] = useState([
    { id: 1, name: 'Hasan Rafi', age: 28, gender: 'Male', service: 'Cardiology', time: '10:30 AM', status: 'In Waiting' },
    { id: 2, name: 'Nusrat Jahan', age: 24, gender: 'Female', service: 'Neurology', time: '11:15 AM', status: 'Arrived' },
    { id: 3, name: 'Abdur Rahman', age: 45, gender: 'Male', service: 'General Checkup', time: '12:00 PM', status: 'Scheduled' },
  ]);

  // Schedule Management State
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [newSlot, setNewSlot] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState({
    'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': []
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Live listener for Doctor Profile
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: docSnap.id, ...data });
        if (data.weeklySchedule) {
          setWeeklySchedule(data.weeklySchedule);
        }
        setIsDataLoaded(true);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch specialties for telemed rule
  useEffect(() => {
    const fetchSpecialties = async () => {
      const querySnapshot = await getDocs(collection(db, 'specialties'));
      const specs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpecialties(specs);
    };
    fetchSpecialties();
  }, []);

  const checkInstantBookingEligibility = (doctorServices) => {
    if (!doctorServices || doctorServices.length === 0) return false;
    return specialties.some(spec => 
      spec.services?.some(serv => 
        serv.telemed && doctorServices.includes(serv.name)
      )
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
      toast.success(`${field === 'isConsulting' ? 'Consultation' : 'Instant' } status updated`);
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
      console.error(error);
      toast.error('Failed to save schedule');
    }
  };

  const addSlot = () => {
    if (!newSlot) return;
    const currentDaySlots = weeklySchedule[selectedDay] || [];
    if (currentDaySlots.includes(newSlot)) {
      toast.error('Slot already exists');
      return;
    }
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

  const stats = [
    { name: "Today's Consults", value: '18', growth: '+4', icon: ClipboardList, color: 'text-med-primary', bg: 'bg-emerald-50' },
    { name: "Pending Queue", value: '05', growth: 'Low', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: "Completed Today", value: '13', growth: '72%', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: "Monthly Growth", value: '24%', growth: '+8%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (!user) return null;

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-med-text tracking-tight flex items-center gap-2">
              Clinical Control Center
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Physician Portal • {profile?.fullName || 'Physician'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-4">
              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden"><User size={24} className="text-slate-300 translate-y-2 translate-x-1" /></div>)}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#1e4a3a] flex items-center justify-center text-[10px] text-white font-bold">+2</div>
            </div>
            <button className="h-9 px-4 bg-med-text text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
              Generate Report <FileText size={14} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-5 bg-white border border-slate-300 rounded-2xl group hover:border-med-primary transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest leading-none">View All</span>
              </div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5">{stat.name}</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-med-text tracking-tight leading-none">{stat.value}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg">{stat.growth}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Consultation Queue */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-50/20">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2 italic">
                  <Clock size={14} className="text-med-primary" />
                  Active Consultation Queue
                </h3>
              </div>
              <div className="divide-y divide-slate-200">
                {patientQueue.map((patient) => (
                  <div key={patient.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[13px] font-bold text-slate-400 overflow-hidden">
                        <User size={20} className="translate-y-1.5 text-slate-300" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-med-text tracking-tight flex items-center gap-2">
                          {patient.name}
                          <span className="text-[10px] font-normal text-slate-400 capitalize">{patient.age}y / {patient.gender}</span>
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-med-primary uppercase tracking-tighter">{patient.service}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={12} /> {patient.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                          patient.status === 'In Waiting' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                          patient.status === 'Arrived' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                          'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          {patient.status}
                        </span>
                      </div>
                      <button className="h-8 px-5 bg-med-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 group">
                        Start Session
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Management Registry */}
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-50/20">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2 italic">
                  <Calendar size={14} className="text-med-primary" />
                  Personal Schedule Registry
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                        selectedDay === day 
                        ? 'bg-[#1e4a3a] text-white border-[#1e4a3a]' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-tight">{selectedDay} Availability</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Define your consultation slots</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 focus-within:border-med-primary transition-all">
                      <input 
                        type="time" 
                        value={newSlot}
                        onChange={(e) => setNewSlot(e.target.value)}
                        className="bg-transparent text-[11px] font-bold outline-none px-2"
                      />
                      <button 
                        onClick={addSlot}
                        className="h-8 w-8 bg-med-primary text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {weeklySchedule[selectedDay]?.length > 0 ? (
                      weeklySchedule[selectedDay].map((slot, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between group hover:border-med-primary transition-all">
                          <span className="text-[11px] font-bold text-slate-700 tracking-tight">{slot}</span>
                          <button 
                            onClick={() => removeSlot(idx)}
                            className="w-5 h-5 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-10 flex flex-col items-center justify-center text-center">
                        <Clock size={24} className="text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No slots defined for {selectedDay}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Clinical Insights */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-300 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={16} className="text-med-primary" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Clinical Availability</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/30">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-bold text-slate-700">Consultation Status</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-none uppercase tracking-tighter">Live platform presence</span>
                  </div>
                  <button 
                    onClick={() => handleToggleStatus('isConsulting', profile?.isConsulting)}
                    className={`w-10 h-5 rounded-full transition-all relative ${profile?.isConsulting ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${profile?.isConsulting ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/30">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-700">Instant Booking</span>
                      <Zap size={10} className={profile?.instantBooking ? "text-blue-500 fill-blue-500" : "text-slate-300"} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium leading-none uppercase tracking-tighter">Express Appointment Flow</span>
                  </div>
                  <button 
                    onClick={() => handleToggleStatus('instantBooking', profile?.instantBooking)}
                    className={`w-10 h-5 rounded-full transition-all relative ${profile?.instantBooking ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${profile?.instantBooking ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="px-1 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-snug">
                    * Changes are broadcasted in real-time to the public search engine
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded-2xl p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 leading-none">Next Case Analysis</h3>
              <div className="space-y-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Primary Concern</span>
                  <p className="text-[13px] font-medium text-slate-700">Chronic arrhythmia with recurring fatigue. Needs ECG review.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Last Visit</span>
                  <p className="text-[13px] font-medium text-slate-700 italic">March 12, 2026 • Follow-up</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={16} className="text-rose-500" />
                    <span className="text-[11px] font-bold text-med-text uppercase tracking-widest">Medical History Check</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-med-primary/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-sm font-bold text-med-primary tracking-tight mb-2 leading-none italic">Session Optimized</h3>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">Your schedule is synced. Patient waiting times are currently <span className="font-bold underline">below average (7m)</span>.</p>
              <button className="mt-4 flex items-center gap-2 text-[10px] font-bold text-med-primary uppercase tracking-widest hover:gap-3 transition-all">
                View Productivity Stats <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
