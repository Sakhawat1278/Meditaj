'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { 
 Calendar, Users, Clock, CheckCircle2, 
 Search, MoreVertical, MapPin, Phone,
 ChevronRight, AlertCircle, Filter,
 ArrowRight, Stethoscope, User, Plus,
 MoreHorizontal, Activity, ShieldCheck, Mail
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function ReceptionistDashboard() {
 const [patients, setPatients] = useState([
 { id: 'PWA97', name: 'Sakhawat', status: 'Deactivated', due: '-', phone: '1287312938', age: '--', nextAppt: 'No Schedule' },
 { id: 'PWA98', name: 'Hasan Rafi', status: 'Active', due: '৳ 500', phone: '01712345678', age: '28', nextAppt: '10:30 AM' },
 { id: 'PWA99', name: 'Abdur Rahman', status: 'Active', due: '-', phone: '01812345678', age: '45', nextAppt: '11:15 AM' },
 ]);

 const [doctors, setDoctors] = useState([]);
 const { profile } = useAuth();

 // Live listener for Doctors
 useEffect(() => {
 const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setDoctors(docs);
 });
 return () => unsubscribe();
 }, []);

 const stats = [
 { name: "Today's Appts", value: '24', icon: Calendar, color: 'text-med-primary', bg: 'bg-emerald-50' },
 { name: "Pending Check-ins", value: '08', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
 { name: "Arrived", value: '12', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
 { name: "Completed", value: '04', icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50' },
 ];

 return (
 <DashboardLayout role="receptionist">
 <div className="space-y-8 max-w-7xl mx-auto">
 
 {/* Header Section */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-xl font-extrabold text-med-text tracking-tight flex items-center gap-3 italic">
 Front Desk Operations
 <span className="w-2 h-2 bg-med-primary rounded-full animate-pulse not-italic" />
 </h1>
 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Patient Flow & Queue Management</p>
 </div>
 <div className="flex items-center gap-3">
 <button className="h-10 px-6 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all group">
 <Plus size={14} className="text-emerald-400" />
 New Appointment
 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
 {stats.map((stat, idx) => (
 <div key={idx} className="p-5 bg-white border border-slate-300 rounded-xl flex items-center gap-4 hover:border-med-primary transition-all group">
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

 {/* Patient Database Header Section (Matches Admin Style) */}
 <div className="bg-white border border-slate-300 rounded-2xl p-8 mb-6">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
 <div className="space-y-1">
 <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight uppercase">Patient Database</h2>
 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Secure repository for all registered patient profiles and clinical history</p>
 </div>
 
 <div className="flex items-center gap-3 w-full lg:w-auto">
 <div className="relative flex-1 lg:w-[420px] group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e4a3a] transition-colors" size={16} />
 <input 
 type="text" 
 placeholder="Search identifier, name or contact..."
 className="w-full h-11 pl-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all placeholder:text-slate-300 placeholder:font-medium"
 />
 </div>
 <button className="h-11 px-6 bg-[#0F172A] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2.5 shrink-0">
 <Filter size={14} />
 Filter
 </button>
 </div>
 </div>
 </div>

 {/* Patient Database Table Card */}
 <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden mb-12">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-100">
 {['ID No.', 'Patient Name', 'Status', 'Due', 'Phone', 'Age', 'Next Appointment', 'Action'].map((head, i) => (
 <th key={i} className="px-8 py-5 text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest whitespace-nowrap">
 {head}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {patients.map((patient, pIdx) => (
 <tr 
 key={pIdx} 
 className="hover:bg-slate-50/50 transition-all group"
 >
 <td className="px-8 py-6">
 <span className="text-[12px] font-bold text-slate-400 font-mono tracking-tighter uppercase">{patient.id}</span>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-400 group-hover:border-slate-300 transition-colors">
 {patient.name.charAt(0)}
 </div>
 <span className="text-[14px] font-bold text-[#1e4a3a] tracking-tight uppercase">{patient.name}</span>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
 patient.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
 patient.status === 'Deactivated' ? 'bg-rose-50 border-rose-100 text-rose-500' : 
 'bg-slate-50 border-slate-100 text-slate-400'
 }`}>
 {patient.status}
 </span>
 </td>
 <td className="px-8 py-6">
 <span className={`text-[12px] font-bold ${patient.due !== '-' ? 'text-rose-500' : 'text-slate-400 font-medium'}`}>
 {patient.due}
 </span>
 </td>
 <td className="px-8 py-6">
 <span className="text-[12px] font-bold text-slate-600 tracking-tight">{patient.phone}</span>
 </td>
 <td className="px-8 py-6">
 <span className="text-[12px] font-bold text-slate-400 italic">{patient.age}</span>
 </td>
 <td className="px-8 py-6">
 <span className="text-[12px] font-bold text-slate-600 tracking-tight uppercase">{patient.nextAppt}</span>
 </td>
 <td className="px-8 py-6 text-right">
 <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 hover:text-[#1e4a3a] hover:bg-white hover:border-slate-400 hover: transition-all opacity-0 group-hover:opacity-100">
 <MoreHorizontal size={18} />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
 {/* Sidebar: Quick Patient Lookup */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
 <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-slate-50/20">
 <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2 italic">
 <Clock size={14} className="text-med-primary" />
 Live Appointment Feed
 </h3>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Refreshing in 15s</span>
 </div>
 <div className="divide-y divide-slate-100">
 {[1, 2, 3].map((i) => (
 <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center flex-col shrink-0">
 <span className="text-[14px] font-bold text-med-text tracking-tighter leading-none">10</span>
 <span className="text-[9px] font-black text-slate-300 uppercase leading-none mt-1">AM</span>
 </div>
 <div>
 <h4 className="text-[14px] font-bold text-med-text tracking-tight flex items-center gap-2">
 Kamrul Islam
 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
 </h4>
 <p className="text-[11px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-tight">
 Dr. Alexander G. • <span className="text-med-primary">Cardiology</span>
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg">Pending</span>
 <button className="h-8 px-4 border border-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:border-black transition-all">
 Check In
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Sidebar: Health Profile Summary */}
 <div className="space-y-6">
 <div className="bg-[#1e4a3a] rounded-xl p-6 text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-med-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
 <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2 italic relative z-10">
 <Stethoscope size={16} className="text-med-primary" />
 Doctor Availabilities
 </h3>
 <div className="space-y-4 relative z-10">
 {doctors.length > 0 ? doctors.slice(0, 4).map((doc) => (
 <div key={doc.id} className="p-3.5 bg-white/5 rounded-xl border border-white/10 group/item hover:bg-white/10 transition-all">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-2 h-2 rounded-full ${doc.status === 'deactivated' ? 'bg-slate-500' : doc.isConsulting ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
 <span className="text-[12px] font-bold truncate max-w-[120px] tracking-tight">{doc.fullName}</span>
 </div>
 <span className={`text-[10px] font-black uppercase tracking-tighter ${doc.status === 'deactivated' ? 'text-slate-500' : doc.isConsulting ? 'text-emerald-400' : 'text-rose-400'}`}>
 {doc.status === 'deactivated' ? 'Offline' : doc.isConsulting ? 'In Room' : 'Off Duty'}
 </span>
 </div>
 </div>
 )) : (
 <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
 <Activity size={20} className="mx-auto text-white/20 mb-2 animate-pulse" />
 <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none">Scanning Network...</p>
 </div>
 )}
 </div>
 <button 
 onClick={() => window.location.href = '/dashboard/admin?view=doctors'}
 className="w-full mt-6 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn"
 >
 View Global Roster
 <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
 </button>
 </div>

 <div className="bg-white border border-slate-300 rounded-xl p-6 overflow-hidden group">
 <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
 <AlertCircle size={16} className="text-amber-500" />
 Pending Alerts
 </h3>
 <div className="space-y-5">
 <div className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 group-hover:border-amber-200 transition-all">
 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
 <Mail size={18} className="text-amber-500" />
 </div>
 <div>
 <p className="text-[13px] font-bold text-med-text tracking-tight uppercase leading-none mb-1.5">Unread Report</p>
 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter leading-snug">Patient #PWA97 uploaded new labs for review.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 </div>
 </DashboardLayout>
 );
}


