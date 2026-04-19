'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { 
  Calendar, Clock, HeartPulse, FileText, 
  Search, Bell, Sparkles, Navigation, 
  MapPin, User, ChevronRight, Activity,
  ShieldCheck, CreditCard, ArrowRight,
  TrendingUp, Download, Lock, Loader2,
  AlertCircle, Phone, Pill, Filter, MoreHorizontal,
  X, Check, UserCircle, Stethoscope, Video, ShoppingCart,
  Camera, Map, Mail, Hash, Baby, Bone, Droplets, Eye,
  Plus, FlaskConical, ClipboardPlus, Ambulance, Radio
} from 'lucide-react';
import Link from 'next/link';
import { 
  doc, onSnapshot, query, collection, 
  where, orderBy, updateDoc, getDoc, 
  getDocs, addDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { m as motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

const RestrictedAccessPopup = dynamic(() => import('@/components/Auth/RestrictedAccessPopup'), { ssr: false });

function PatientDashboardContent() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('view') || 'overview';
  
  const [userData, setUserData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  
  const [appointments, setAppointments] = useState([]);
  const [labBookings, setLabBookings] = useState([]);
  const [nursingBookings, setNursingBookings] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [ambulanceBookings, setAmbulanceBookings] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [instantCalls, setInstantCalls] = useState([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings Form State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    bloodGroup: '',
    age: '',
    gender: '',
    emergencyContact: ''
  });

  useEffect(() => {
    if (!user) return;
    
    // User Data Listener
    const unUser = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserData(data);
        setProfileForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          address: data.address || '',
          bloodGroup: data.bloodGroup || '',
          age: data.age || '',
          gender: data.gender || '',
          emergencyContact: data.emergencyContact || ''
        });
        if (data.status === 'inactive' || data.status === 'deactivated') {
          setShowRestrictedModal(true);
        }
      }
      setIsDataLoading(false);
    });

    // Unified Clinical Data Fetching
    const unAppts = onSnapshot(query(collection(db, 'appointments'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Consultation' }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setAppointments(sorted);
    });

    const unLabs = onSnapshot(query(collection(db, 'lab_bookings'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Laboratory' }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setLabBookings(sorted);
    });

    const unNursing = onSnapshot(query(collection(db, 'nursing_bookings'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Nursing' }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setNursingBookings(sorted);
    });

    const unOrders = onSnapshot(query(collection(db, 'product_orders'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Pharmacy' }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setProductOrders(sorted);
    });

    const unAmbulance = onSnapshot(query(collection(db, 'ambulance_bookings'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Ambulance' }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setAmbulanceBookings(sorted);
    });

    const unRecords = onSnapshot(query(collection(db, 'medical_records'), where('patientId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setMedicalRecords(sorted);
    });

    const unInstant = onSnapshot(query(collection(db, 'instant_doctor_requests'), where('userId', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'Instant Call' }));
      const sorted = data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setInstantCalls(sorted);
    });

    return () => {
      unUser(); unAppts(); unLabs(); unNursing(); unOrders(); unAmbulance(); unRecords(); unInstant();
    };
  }, [user]);

  const stats = useMemo(() => [
    { name: 'Active Bookings', value: (appointments.length + labBookings.length + nursingBookings.length + ambulanceBookings.length).toString().padStart(2, '0'), icon: Calendar, color: '#059669', bgColor: '#ecfdf5' },
    { name: 'Medical Reports', value: medicalRecords.length.toString().padStart(2, '0'), icon: FileText, color: '#2563eb', bgColor: '#eff6ff' },
    { name: 'Health Orders', value: productOrders.length.toString().padStart(2, '0'), icon: ShoppingCart, color: '#d97706', bgColor: '#fffbeb' },
    { name: 'Total Visits', value: (appointments.filter(a => a.status === 'completed').length + instantCalls.filter(i => i.status === 'completed').length).toString().padStart(2, '0'), icon: Activity, color: '#7c3aed', bgColor: '#f5f3ff' },
  ], [appointments, medicalRecords, productOrders, labBookings, nursingBookings, ambulanceBookings, instantCalls]);

  const allTimelineItems = useMemo(() => {
    const items = [
      ...appointments.map(a => ({ 
        ...a, 
        title: a.doctorName || 'General Physician', 
        subtitle: a.specialty || 'General Consultation', 
        category: 'Consultation',
        statusColor: a.status === 'completed' ? 'emerald' : a.status === 'cancelled' ? 'rose' : 'amber'
      })),
      ...instantCalls.map(i => ({
        ...i,
        title: 'Instant Consultation',
        subtitle: i.doctorName || 'Clinical Support',
        category: 'Instant Call',
        statusColor: i.status === 'completed' ? 'emerald' : i.status === 'cancelled' ? 'rose' : 'amber'
      })),
      ...labBookings.map(l => ({ 
        ...l, 
        title: l.providerName || 'Lab Diagnostics', 
        subtitle: l.items?.map(i => i.name).join(', ') || 'Health Checkup', 
        category: 'Laboratory',
        statusColor: l.status === 'completed' ? 'emerald' : l.status === 'cancelled' ? 'rose' : 'amber'
      })),
      ...nursingBookings.map(n => ({ 
        ...n, 
        title: n.caregiverName || 'Nursing Care', 
        subtitle: n.packageName || 'Healthcare Support', 
        category: 'Nursing',
        statusColor: n.status === 'completed' ? 'emerald' : n.status === 'cancelled' ? 'rose' : 'amber'
      })),
      ...ambulanceBookings.map(a => ({
        ...a,
        title: 'Ambulance Support',
        subtitle: a.type || 'Emergency Transport',
        category: 'Ambulance',
        statusColor: a.status === 'completed' ? 'emerald' : a.status === 'cancelled' ? 'rose' : 'amber'
      })),
      ...productOrders.map(p => ({ 
        ...p, 
        title: 'Health Store Order', 
        subtitle: `${p.items?.length || 0} items ordered`, 
        category: 'Pharmacy',
        date: p.date || (p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'N/A'),
        statusColor: p.status === 'delivered' ? 'emerald' : p.status === 'failed' ? 'rose' : 'amber'
      })),
    ].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return items;
  }, [appointments, labBookings, nursingBookings, productOrders, ambulanceBookings, instantCalls]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), profileForm);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
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
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-med-bg">
        <Loader2 size={32} className="animate-spin text-med-primary mb-3" />
        <p className="text-[12px] font-medium text-med-muted uppercase tracking-widest">Loading your health data...</p>
      </div>
    );
  }

  // ─── Reusable Category Color Map ───
  const getCategoryStyle = (cat) => {
    const map = {
      'Laboratory': { bg: '#ecfeff', color: '#0891b2', icon: FlaskConical },
      'Nursing': { bg: '#f5f3ff', color: '#7c3aed', icon: ClipboardPlus },
      'Pharmacy': { bg: '#fffbeb', color: '#d97706', icon: Pill },
      'Ambulance': { bg: '#fff1f2', color: '#dc2626', icon: Ambulance },
      'Instant Call': { bg: '#fff1f2', color: '#e11d48', icon: Radio },
      'Consultation': { bg: '#ecfdf5', color: '#059669', icon: Stethoscope },
    };
    return map[cat] || map['Consultation'];
  };

  // --- OVERVIEW ---

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="relative h-[180px] rounded-[16px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/90 via-emerald-900/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-med-primary z-0 opacity-80 dark:opacity-40" />
        <div className="absolute bottom-6 left-8 z-20">
          <h1 className="text-2xl lg:text-3xl font-normal text-white dark:text-emerald-50 tracking-tight leading-tight">
            Welcome Back, <br />{userData?.fullName?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-white/60 dark:text-emerald-50/60 text-[12px] font-medium mt-2">Your healthcare management, simplified.</p>
        </div>
        <div className="absolute bottom-6 right-8 z-20 flex items-center gap-3">
          <Link href="/doctors" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-all">
            <span>Book Consultation</span>
            <ChevronRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="h-[90px] rounded-[12px] border p-5 flex items-center gap-4 transition-all hover:shadow-md group bg-med-card border-med-border"
          >
            <div 
              className="w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
              style={{ color: stat.color }}
            >
              <stat.icon size={28} strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-med-muted leading-none mb-1">{stat.name}</p>
              <p className="text-xl font-bold text-med-text tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Activity + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-med-card rounded-[12px] border border-med-border overflow-hidden">
            <div className="px-6 py-4 border-b border-med-border flex items-center justify-between">
              <h3 className="text-[14px] font-medium text-med-primary tracking-tight">Recent Activity</h3>
              <button onClick={() => router.push('/dashboard/patient?view=appointments')} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="divide-y divide-med-border">
              {allTimelineItems.slice(0, 5).map((item) => {
                const cs = getCategoryStyle(item.category);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="px-6 py-4 hover:bg-med-bg transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: `${cs.color}15`, color: cs.color }}>
                        <cs.icon size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-medium text-med-text leading-tight">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-medium text-med-muted">{item.category}</span>
                          <span className="w-1 h-1 bg-med-border rounded-full" />
                          <span className="text-[11px] text-med-muted">{item.date || item.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        item.statusColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
                        item.statusColor === 'rose' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {item.status}
                      </span>
                      <ChevronRight size={16} className="text-med-muted group-hover:text-med-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
              {allTimelineItems.length === 0 && (
                <div className="text-center py-16">
                  <Activity size={28} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-[12px] font-medium text-slate-400">No clinical activity recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/patient?view=results" className="h-[100px] rounded-[12px] border border-med-border p-5 hover:border-blue-400 transition-all group flex items-center gap-4 bg-med-card">
              <div className="w-10 h-10 rounded-[8px] bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-med-text">My Prescriptions</h4>
                <p className="text-[11px] text-med-muted mt-0.5">Access medical records</p>
              </div>
            </Link>
            <Link href="/dashboard/patient?view=billing" className="h-[100px] rounded-[12px] border border-med-border p-5 hover:border-emerald-400 transition-all group flex items-center gap-4 bg-med-card">
              <div className="w-10 h-10 rounded-[8px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <CreditCard size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-med-text">Billing Center</h4>
                <p className="text-[11px] text-med-muted mt-0.5">Manage payments & invoices</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Profile Sidebar */}
        <div className="space-y-4">
          <div className="bg-med-card rounded-[12px] border border-med-border p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-med-muted mb-6 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Patient Identity
            </h3>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-[16px] bg-med-bg border border-med-border mx-auto flex items-center justify-center text-med-muted overflow-hidden mb-3">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="translate-y-3" />
                )}
              </div>
              <h4 className="text-[15px] font-bold text-med-primary tracking-tight">{userData?.fullName || 'Anonymous'}</h4>
              <p className="text-[10px] text-med-muted font-medium mt-1 tracking-wider uppercase">ID: MED-{userData?.id?.slice(0, 8).toUpperCase() || 'PENDING'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-med-bg rounded-[8px] border border-med-border text-center">
                <p className="text-[9px] font-bold text-med-muted uppercase tracking-widest mb-0.5">Blood Group</p>
                <p className="text-[14px] font-bold text-rose-500">{userData?.bloodGroup || 'N/A'}</p>
              </div>
              <div className="p-3 bg-med-bg rounded-[8px] border border-med-border text-center">
                <p className="text-[9px] font-bold text-med-muted uppercase tracking-widest mb-0.5">Age / Gender</p>
                <p className="text-[14px] font-bold text-med-primary">{userData?.age || '—'} / {userData?.gender?.charAt(0) || '—'}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-med-border">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-med-muted">Emergency</p>
                <span className="text-[11px] font-bold text-emerald-500">{userData?.emergencyContact || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-med-muted">Insurance</p>
                <span className="text-[11px] font-bold text-med-primary">Active • MetLife</span>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--med-primary) 0%, #0f3028 100%)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={80} />
            </div>
            <h3 className="text-[13px] font-medium tracking-tight mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              Vital Insights
            </h3>
            <p className="text-[11px] text-emerald-100/70 dark:text-emerald-50/70 leading-relaxed mb-4">Your health consistency is at <span className="text-white font-bold">84%</span> this month.</p>
            <div className="space-y-2">
              <div className="w-full bg-white/10 dark:bg-black/20 h-1.5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} className="h-full bg-emerald-400 rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-emerald-200/50">
                <span>Health Score</span>
                <span className="text-emerald-400">Target: 90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- REUSABLE SERVICE TABLE ---

  const ServiceTable = ({ data, category, icon: Icon, colorClass }) => {
    const meta = getCategoryStyle(category);
    return (
      <div className="bg-med-card rounded-[12px] border border-med-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-med-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ background: `${meta.color}15`, color: meta.color }}>
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-med-primary tracking-tight">{category} History</h2>
              <p className="text-[11px] text-med-muted">All your {category.toLowerCase()} records in one place</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-med-muted" size={16} />
            <input 
              type="text" placeholder={`Search ${category.toLowerCase()}...`}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[280px] h-10 bg-med-bg border border-med-border rounded-[8px] pl-10 pr-4 text-[12px] font-medium text-med-text outline-none focus:bg-med-card focus:border-med-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-med-bg/60 border-b border-med-border">
                <th className="px-6 py-3.5 text-[10px] font-bold text-med-muted uppercase tracking-widest">Detail</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-med-muted uppercase tracking-widest">Schedule</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-med-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-med-muted uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-med-border">
              {data.filter(item => 
                item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((item) => (
                <tr key={item.id} className="hover:bg-med-bg/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: `${meta.color}15`, color: meta.color }}>
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-medium text-med-text leading-tight">{item.title}</h4>
                        <p className="text-[10px] text-med-muted mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-med-text opacity-80">
                      <Calendar size={14} className="text-med-muted" />
                      {item.date || item.createdAt?.toDate?.()?.toLocaleDateString()}
                    </div>
                    {item.time && (
                      <div className="flex items-center gap-2 text-[10px] text-med-muted mt-1">
                        <Clock size={12} className="text-med-muted" />
                        {item.time}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      item.statusColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
                      item.statusColor === 'rose' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedItem(item)} className="text-[11px] font-bold text-med-primary hover:underline uppercase tracking-wider">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-16">
              <Icon size={28} className="text-slate-200 mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-[12px] font-medium text-slate-400">No {category.toLowerCase()} records yet</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- HEALTH LIBRARY ---

  const renderResults = () => {
    const prescriptions = medicalRecords.filter(r => r.type === 'prescription');
    const labReports = medicalRecords.filter(r => r.type === 'lab_report');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-med-primary tracking-tight uppercase">Health Library</h2>
            <p className="text-[11px] text-med-muted mt-0.5">Your prescriptions and diagnostic reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prescriptions */}
          <div className="bg-med-card rounded-[12px] border border-med-border overflow-hidden">
            <div className="px-6 py-4 border-b border-med-border flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-med-primary flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" />
                Prescriptions
              </h3>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">{prescriptions.length}</span>
            </div>
            <div className="divide-y divide-med-border">
              {prescriptions.map((rec) => (
                <div key={rec.id} className="px-6 py-4 flex items-center justify-between hover:bg-med-bg/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Pill size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-medium text-med-text">{rec.doctorName || 'Clinical Prescription'}</h5>
                      <p className="text-[10px] text-med-muted mt-0.5">Issued: {rec.date || rec.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(rec.fileURL, '_blank')}
                    className="w-8 h-8 border border-med-border rounded-[6px] flex items-center justify-center text-med-muted hover:text-emerald-500 hover:border-emerald-500 transition-all"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
              {prescriptions.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-[11px] text-slate-400">No prescriptions found</p>
                </div>
              )}
            </div>
          </div>

          {/* Lab Reports */}
          <div className="bg-med-card rounded-[12px] border border-med-border overflow-hidden">
            <div className="px-6 py-4 border-b border-med-border flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-med-primary flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                Diagnostic Reports
              </h3>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">{labReports.length}</span>
            </div>
            <div className="divide-y divide-med-border">
              {labReports.map((rec) => (
                <div key={rec.id} className="px-6 py-4 flex items-center justify-between hover:bg-med-bg/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Activity size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-medium text-med-text">{rec.title || 'Lab Report'}</h5>
                      <p className="text-[10px] text-med-muted mt-0.5">Released: {rec.date || rec.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(rec.fileURL, '_blank')}
                    className="w-8 h-8 border border-med-border rounded-[6px] flex items-center justify-center text-med-muted hover:text-blue-500 hover:border-blue-500 transition-all"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
              {labReports.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-[11px] text-slate-400">No diagnostic reports found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- BILLING ---

  const renderBilling = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-med-primary tracking-tight uppercase">Financial Center</h2>
          <p className="text-[11px] text-med-muted mt-0.5">Track your healthcare expenses</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-[8px] text-center">
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Spent</p>
            <p className="text-[15px] font-bold text-med-primary">৳{(allTimelineItems.reduce((acc, item) => acc + (Number(item.amount || item.totalAmount || 0)), 0)).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-med-card rounded-[12px] border border-med-border overflow-hidden">
        <div className="divide-y divide-med-border">
          {productOrders.map((order) => (
            <div key={order.id} className="px-6 py-5 hover:bg-med-bg/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-med-bg border border-med-border flex items-center justify-center text-med-muted shrink-0">
                    <ShoppingCart size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-medium text-med-text">Order #{order.id?.slice(-8).toUpperCase()}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {order.paymentStatus || 'Processing'}
                      </span>
                    </div>
                    <p className="text-[10px] text-med-muted mb-2">Placed on {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items?.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-med-bg text-[10px] font-medium text-med-muted rounded-[4px]">{item.name} x{item.quantity}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[16px] font-bold text-med-primary">৳{order.totalAmount || order.total}</p>
                  <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hover:underline mt-1">Track</button>
                </div>
              </div>
            </div>
          ))}
          {productOrders.length === 0 && (
            <div className="text-center py-16">
              <ShoppingCart size={28} className="text-slate-200 mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-[12px] font-medium text-slate-400">No order history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- SETTINGS ---

  const renderSettings = () => (
    <div className="max-w-4xl">
      <div className="bg-med-card rounded-[12px] border border-med-border overflow-hidden">
        <div className="px-8 py-6 border-b border-med-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-med-primary tracking-tight uppercase">Medical Profile</h2>
            <p className="text-[11px] text-med-muted mt-0.5">Configure your clinical identity and health records</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
              <div className="w-14 h-14 rounded-[12px] bg-med-primary text-white flex items-center justify-center group-hover:bg-emerald-600 transition-all overflow-hidden relative">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-med-card border border-med-border rounded-full flex items-center justify-center text-med-muted shadow-sm">
                <Plus size={10} />
              </div>
            </label>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Verified</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-[6px] bg-med-bg/50 border border-med-border flex items-center justify-center text-med-primary font-bold text-[10px]">01</div>
                <h4 className="text-[11px] font-bold text-med-primary uppercase tracking-widest">Personal Info</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <UserCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-med-muted" />
                    <input type="text" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] pl-10 pr-4 text-[13px] font-medium text-med-text outline-none focus:bg-med-card focus:border-med-primary transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Phone</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-med-muted" />
                      <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] pl-10 pr-4 text-[13px] font-medium text-med-text outline-none focus:bg-med-card focus:border-med-primary transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Gender</label>
                    <select value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})} className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] px-3 text-[12px] font-medium text-med-text outline-none focus:bg-med-card focus:border-med-primary transition-all">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-med-muted" />
                    <input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] pl-10 pr-4 text-[13px] font-medium text-med-text outline-none focus:bg-med-card focus:border-med-primary transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Data */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-[6px] bg-med-bg/50 border border-med-border flex items-center justify-center text-med-primary font-bold text-[10px]">02</div>
                <h4 className="text-[11px] font-bold text-med-primary uppercase tracking-widest">Clinical Data</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Blood Group</label>
                  <select value={profileForm.bloodGroup} onChange={e => setProfileForm({...profileForm, bloodGroup: e.target.value})} className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] px-3 text-[13px] font-bold text-rose-500 outline-none focus:bg-med-card focus:border-med-primary transition-all">
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Age</label>
                  <input type="number" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} placeholder="28" className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] px-3 text-[13px] font-medium text-med-text outline-none focus:bg-med-card focus:border-med-primary transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-med-muted uppercase tracking-widest">Emergency Contact</label>
                <div className="relative">
                  <AlertCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300" />
                  <input type="text" value={profileForm.emergencyContact} onChange={e => setProfileForm({...profileForm, emergencyContact: e.target.value})} placeholder="+880 1XXX-XXXXXX" className="w-full h-10 bg-med-bg border border-med-border rounded-[8px] pl-10 pr-4 text-[13px] font-bold text-rose-500 outline-none focus:bg-med-card focus:border-med-primary transition-all" />
                </div>
                <p className="text-[9px] text-med-muted mt-1 italic">This contact will be prioritized in emergencies.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-med-border flex items-center justify-end gap-3">
            <button type="button" onClick={() => router.push('/dashboard/patient')} className="h-9 px-5 text-[11px] font-bold text-med-muted hover:text-med-text transition-all uppercase tracking-wider">Cancel</button>
            <button type="submit" disabled={isSaving} className="h-9 px-6 bg-med-primary text-white rounded-[8px] text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
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
      case 'appointments': return (
        <ServiceTable 
          data={appointments.map(a => ({ ...a, title: a.doctorName, subtitle: a.specialty, statusColor: a.status === 'completed' ? 'emerald' : 'amber' }))} 
          category="Consultation" icon={Stethoscope} colorClass="text-emerald-500" 
        />
      );
      case 'instant-call': return (
        <ServiceTable 
          data={instantCalls.map(i => ({ ...i, title: 'Instant Live Session', subtitle: i.doctorName || 'Doctor', statusColor: i.status === 'completed' ? 'emerald' : 'amber' }))} 
          category="Instant Call" icon={Radio} colorClass="text-rose-500" 
        />
      );
      case 'lab-bookings': return (
        <ServiceTable 
          data={labBookings.map(l => ({ ...l, title: l.providerName, subtitle: l.items?.map(i => i.name).join(', '), statusColor: l.status === 'completed' ? 'emerald' : 'amber' }))} 
          category="Laboratory" icon={FlaskConical} colorClass="text-sky-500" 
        />
      );
      case 'nursing': return (
        <ServiceTable 
          data={nursingBookings.map(n => ({ ...n, title: n.caregiverName, subtitle: n.packageName, statusColor: n.status === 'completed' ? 'emerald' : 'amber' }))} 
          category="Nursing" icon={ClipboardPlus} colorClass="text-purple-500" 
        />
      );
      case 'ambulance': return (
        <ServiceTable 
          data={ambulanceBookings.map(a => ({ ...a, title: 'Ambulance Transport', subtitle: a.type, statusColor: a.status === 'completed' ? 'emerald' : 'amber' }))} 
          category="Ambulance" icon={Ambulance} colorClass="text-red-600" 
        />
      );
      case 'pharmacy': return (
        <ServiceTable 
          data={productOrders.map(p => ({ ...p, title: 'Health Store Order', subtitle: `${p.items?.length} Items`, statusColor: p.status === 'delivered' ? 'emerald' : 'amber', date: p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'N/A' }))} 
          category="Pharmacy" icon={ShoppingCart} colorClass="text-orange-500" 
        />
      );
      case 'results': return renderResults();
      case 'billing': return renderBilling();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  // --- RENDER ---

  return (
    <DashboardLayout role="patient">
      
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
              className="relative w-full max-w-md bg-med-card rounded-[16px] overflow-hidden shadow-2xl border border-med-border"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-[8px] flex items-center justify-center">
                      <ShieldCheck size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-med-primary">Service Details</h3>
                      <p className="text-[10px] text-med-muted mt-0.5">Ref: {selectedItem.id?.slice(0, 12).toUpperCase()}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-[6px] bg-med-bg text-med-muted hover:text-rose-500 transition-all flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-med-bg rounded-[10px] border border-med-border">
                    <div>
                      <p className="text-[10px] font-bold text-med-muted uppercase tracking-widest mb-1">Provider</p>
                      <p className="text-[13px] font-medium text-med-text">{selectedItem.title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-med-muted uppercase tracking-widest mb-1">Service</p>
                      <p className="text-[13px] font-medium text-med-text">{selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-med-muted uppercase tracking-widest mb-1">Date</p>
                      <p className="text-[13px] font-medium text-med-text opacity-70">{selectedItem.date || selectedItem.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-med-muted uppercase tracking-widest mb-1">Status</p>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-bold uppercase tracking-wider">{selectedItem.status}</span>
                    </div>
                  </div>

                  {(selectedItem.category === 'Consultation' || selectedItem.category === 'Instant Call') && selectedItem.status === 'confirmed' && (
                    <div className="p-4 rounded-[10px] text-white" style={{ background: 'linear-gradient(135deg, var(--med-primary) 0%, #0f3028 100%)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Video size={16} className="text-emerald-400" />
                        <h4 className="text-[13px] font-bold">Virtual Waiting Room</h4>
                      </div>
                      <p className="text-[11px] text-emerald-100/70 leading-relaxed mb-4">Your doctor will initiate the consultation shortly. Ensure camera and microphone access.</p>
                      <button 
                        onClick={() => {
                          if (selectedItem.sessionId) router.push(`/consultation/${selectedItem.sessionId}`);
                          else toast.error("Session not started yet");
                        }}
                        className="w-full h-9 bg-emerald-500 hover:bg-emerald-400 text-[#0c2e1f] rounded-[6px] font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        Launch Medical Room
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 h-9 border border-med-border text-med-muted rounded-[8px] text-[11px] font-bold uppercase tracking-wider hover:bg-med-bg transition-all">Support</button>
                    <button className="flex-1 h-9 bg-med-primary text-white rounded-[8px] text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                       <Download size={14} />
                       Export Receipt
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function PatientDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-med-bg">
        <Loader2 className="animate-spin text-med-primary" />
      </div>
    }>
      <PatientDashboardContent />
    </Suspense>
  );
}
