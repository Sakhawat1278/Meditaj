'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { 
Calendar, Clock, HeartPulse, FileText, 
Search, Bell, Sparkles, Navigation, 
MapPin, User, ChevronRight, Activity,
ShieldCheck, CreditCard, ArrowRight,
TrendingUp, Download, Lock, Loader2,
AlertCircle, Phone, Pill
} from 'lucide-react';
import Link from 'next/link';
import { doc, onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { m as motion } from 'framer-motion';
import dynamic from 'next/dynamic';
const RestrictedAccessPopup = dynamic(() => import('@/components/Auth/RestrictedAccessPopup'), { ssr: false });

export default function PatientDashboard() {
 const { user, logout } = useAuth();
 const [userData, setUserData] = useState(null);
 const [isDataLoading, setIsDataLoading] = useState(true);
 const [showRestrictedModal, setShowRestrictedModal] = useState(false);
 
 const [appointments, setAppointments] = useState([]);
 const [labBookings, setLabBookings] = useState([]);
 const [nursingBookings, setNursingBookings] = useState([]);
 const [productOrders, setProductOrders] = useState([]);

 const stats = [
 { name: 'Active Bookings', value: (appointments.length + labBookings.length + nursingBookings.length + productOrders.length).toString().padStart(2, '0'), icon: Calendar, color: 'text-med-primary', bg: 'bg-emerald-50' },
 { name: 'Medical Reports', value: '14', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
 { name: 'Health Coins', value: '250', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
 { name: 'Total Visits', value: '38', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
 ];

 useEffect(() => {
 if (!user) return;
 
 const unSub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
 if (snapshot.exists()) {
 const data = snapshot.data();
 setUserData(data);
 if (data.status === 'inactive' || data.status === 'deactivated') {
 setShowRestrictedModal(true);
 }
 }
 setIsDataLoading(false);
 });

  // Fetch Live Appointments
  const qAppts = query(collection(db, 'appointments'), where('userId', '==', user.uid));
  const unAppts = onSnapshot(qAppts, (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    setAppointments(sorted);
  });

  // Fetch Live Lab Bookings
  const qLabs = query(collection(db, 'lab_bookings'), where('userId', '==', user.uid));
  const unLabs = onSnapshot(qLabs, (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    setLabBookings(sorted);
  });

  // Fetch Live Nursing Bookings
  const qNursing = query(collection(db, 'nursing_bookings'), where('userId', '==', user.uid));
  const unNursing = onSnapshot(qNursing, (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    setNursingBookings(sorted);
  });

  // Fetch Live Product Orders
  const qProducts = query(collection(db, 'product_orders'), where('userId', '==', user.uid));
  const unProducts = onSnapshot(qProducts, (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    setProductOrders(sorted);
  });

 return () => {
 unSub();
 unAppts();
 unLabs();
 unNursing();
 unProducts();
 };
 }, [user]);

 const handleRestrictedExit = async () => {
 await logout();
 window.location.href = '/';
 };

 // View logic
 if (isDataLoading) {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
 <Loader2 size={40} className="animate-spin text-med-primary mb-4" />
 <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Verifying Clinical Sessions...</p>
 </div>
 );
 }

 // Security Gate - Whitelist Approach
 const isAuthorized = userData && (userData.status === 'active' || userData.status === 'approved');
 
 if (userData && !isAuthorized) {
 return (
 <RestrictedAccessPopup 
 isOpen={true} 
 onClose={handleRestrictedExit} 
 referenceId={user?.uid?.slice(0, 8).toUpperCase()} 
 />
 );
 }

 return (
 <DashboardLayout role="patient">
 <div className="space-y-8 max-w-7xl mx-auto">
 
 {/* Header Section */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-xl font-extrabold text-med-text tracking-tight flex items-center gap-3 italic">
 Welcome Back, {userData?.fullName?.split(' ')[0] || 'Member'}!
 <span className="w-2 h-2 bg-med-primary rounded-full animate-pulse not-italic" />
 </h1>
 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Your Personal Wellness Hub</p>
 </div>
 <Link href="/doctors" className="h-10 px-6 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all group">
 <Sparkles size={14} className="text-amber-400" />
 Book New Consultation
 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
 </Link>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
 {stats.map((stat, idx) => (
 <div key={idx} className="p-5 bg-white border border-slate-300 rounded-xl flex items-center gap-4 hover:border-med-primary transition-all">
 <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center shrink-0`}>
 <stat.icon size={20} />
 </div>
 <div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.name}</p>
 <p className="text-xl font-bold text-med-text tracking-tight">{stat.value}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Upcoming Consultations */}
 <div className="lg:col-span-2 space-y-4">
 <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
 <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-50/20">
 <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
 <Calendar size={14} className="text-med-primary" />
 Upcoming Appointments
 </h3>
 <Link href="/dashboard/patient/billing" className="text-[10px] font-bold text-med-primary uppercase tracking-widest hover:underline">View History</Link>
 </div>
 <div className="p-5 space-y-4">
 {(() => {
  const combined = [
    ...appointments.map(a => ({ ...a, serviceType: 'Specialist', service: a.specialty || 'General Consultation', doctor: a.doctorName })),
    ...labBookings.map(l => ({ 
      ...l, 
      doctor: l.providerName || 'Lab Service', 
      service: l.items?.map(i => i.name).join(', ') || 'Diagnostics',
      serviceType: 'Lab'
    })),
    ...nursingBookings.map(n => ({
      ...n,
      doctor: n.caregiverName || 'Nursing Care',
      service: n.packageName || 'Care Service',
      serviceType: 'Nursing'
    })),
    ...productOrders.map(p => ({
      ...p,
      doctor: 'Health Store',
      service: p.items?.map(i => i.name).join(', ') || 'Pharmacy',
      serviceType: 'Pharmacy',
      date: p.date || p.createdAt?.toDate?.()?.toLocaleDateString('en-GB') || 'Recent'
    }))
  ].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

 return combined.map((appt) => (
 <div key={appt.id} className="p-4 rounded-xl border border-slate-200 hover:border-med-primary/30 transition-all grid grid-cols-1 md:grid-cols-3 gap-4 items-center group relative">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-300 ${appt.serviceType === 'Lab' ? 'bg-sky-50 text-sky-500' : appt.serviceType === 'Nursing' ? 'bg-purple-50 text-purple-600' : appt.serviceType === 'Pharmacy' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100'}`}>
 {appt.serviceType === 'Lab' ? <Activity size={20} /> : appt.serviceType === 'Nursing' ? <HeartPulse size={20} /> : appt.serviceType === 'Pharmacy' ? <Pill size={20} /> : <User size={24} className="translate-y-1.5" />}
 </div>
 <div>
 <h4 className="text-[14px] font-bold text-med-text leading-tight">{appt.doctor || appt.doctorName}</h4>
 <span className={`text-[10px] font-bold uppercase tracking-tighter ${appt.serviceType === 'Lab' ? 'text-sky-600' : 'text-med-primary'}`}>{appt.service || appt.specialty}</span>
 </div>
 </div>
 <div className="flex flex-col gap-0.5">
 <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
 <Calendar size={12} className="text-slate-300" /> {appt.date}
 </div>
 <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 italic">
 <Clock size={12} className="text-slate-300" /> {appt.time}
 </div>
 </div>
 <div className="flex items-center justify-end gap-3">
 <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
 appt.status === 'confirmed' || appt.status === 'Confirmed' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
 appt.status === 'cancelled' ? 'bg-rose-50 border-rose-200 text-rose-600' :
 'bg-amber-50 border-amber-200 text-amber-600'
 }`}>
 {appt.status}
 </span>
 <button className="w-8 h-8 rounded-md border border-slate-300 flex items-center justify-center text-slate-400 group-hover:text-med-text hover:bg-slate-50 transition-all">
 <ChevronRight size={14} />
 </button>
 </div>
 </div>
 ));
 })()}
 {appointments.length === 0 && labBookings.length === 0 && nursingBookings.length === 0 && productOrders.length === 0 && (
 <div className="text-center py-10">
 <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">No active medical bookings</p>
 </div>
 )}
 </div>
 </div>

 {/* Recent Health Reports */}
 <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
 <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between">
 <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Digital Health Library</h3>
 </div>
 <div className="divide-y divide-slate-100">
 {[1, 2].map((i) => (
 <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <FileText size={20} />
 </div>
 <div>
 <h5 className="text-[13px] font-bold text-med-text tracking-tight">Blood Chemistry Report - Lipid Profile</h5>
 <p className="text-[10px] text-slate-400 mt-0.5">Released: April 02, 2026 • 2.4 MB</p>
 </div>
 </div>
 <button className="w-9 h-9 border border-slate-300 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all">
 <Download size={16} />
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Sidebar: Health Profile Summary */}
 <div className="space-y-6">
 <div className="bg-white border border-slate-300 rounded-xl p-6">
 <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
 <ShieldCheck size={14} className="text-med-primary" />
 Medical Identity Card
 </h3>
 <div className="text-center mb-6">
 <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-300 overflow-hidden mb-3">
 <User size={48} className="translate-y-3" />
 </div>
 <h4 className="text-[15px] font-bold text-med-text italic tracking-tight leading-none uppercase tracking-widest">{userData?.fullName || 'Anonymous'}</h4>
 <p className="text-[10px] text-slate-400 font-bold mt-2 tracking-widest">ID: MED-{userData?.id?.slice(0, 8).toUpperCase() || 'REF-PENDING'}</p>
 </div>
 <div className="grid grid-cols-2 gap-3 pb-6 border-b border-slate-100 mb-6">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blood Group</p>
 <p className="text-[14px] font-bold text-rose-600 leading-none">AB Positive</p>
 </div>
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age / Gender</p>
 <p className="text-[14px] font-bold text-slate-800 leading-none">28 / Male</p>
 </div>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-[11px] font-medium text-slate-500 italic">Primary Insurance</p>
 <span className="text-[11px] font-bold text-med-text">MetLife Medical</span>
 </div>
 <div className="flex items-center justify-between">
 <p className="text-[11px] font-medium text-slate-500 italic">Emergency Contact</p>
 <span className="text-[11px] font-bold text-med-primary underline">+880 1711-XX</span>
 </div>
 </div>
 </div>

 <div className="bg-[#1e4a3a] rounded-xl p-6 text-white relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-32 h-32 bg-med-primary/10 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2" />
 <h3 className="text-sm font-bold tracking-tight mb-3 italic flex items-center gap-2">
 <TrendingUp size={16} className="text-med-primary" />
 Vital Trends
 </h3>
 <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-5">Your <span className="text-white">Body Mass Index (BMI)</span> has improved by 4% since last screening. Keep up the movement!</p>
 <div className="space-y-3">
 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
 <div className="w-3/4 h-full bg-med-primary" />
 </div>
 <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
 <span>Weight Consistency</span>
 <span className="text-med-primary">Progress: 75%</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 </div>
 </DashboardLayout>
 );
}
