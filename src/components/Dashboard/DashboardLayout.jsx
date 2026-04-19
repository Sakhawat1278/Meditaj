'use client';
import { useState, useEffect, Suspense } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Calendar, ClipboardList, 
  Settings, LogOut, Search, Bell, Menu, X, 
  UserCircle, Activity, HeartPulse, CreditCard,
  ChevronRight, ChevronDown, Sparkles, ShieldCheck, Home, Stethoscope, LayoutGrid,
  Ambulance, FlaskConical, ClipboardPlus, Boxes, LayoutPanelLeft, UserCog, Loader2, MapPin, ShoppingCart, Radio, Moon, Sun
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import RestrictedAccessPopup from '@/components/Auth/RestrictedAccessPopup';

export default function DashboardLayout({ children, role = 'patient' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { logout, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

 // Auto-expand all dropdowns on mount or role change
 useEffect(() => {
   const dropdownIds = menuItems
     .filter(item => item.type === 'dropdown')
     .map(item => item.id);
   setExpandedGroups(dropdownIds);
 }, [role]);

 const [showRestrictedModal, setShowRestrictedModal] = useState(false);

 const toggleGroup = (groupId) => {
 setExpandedGroups(prev => 
 prev.includes(groupId) 
 ? prev.filter(id => id !== groupId) 
 : [...prev, groupId]
 );
 };

 // Live listener for Admin Notifications
 useEffect(() => {
 if (role !== 'admin' || !db) return;
 const q = query(collection(db, 'users'), where('status', '==', 'pending'));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 setPendingCount(snapshot.size);
 
 // Update notifications list based on pending providers
 const newAlerts = snapshot.docs.map(doc => ({
 id: doc.id,
 title: 'New Provider Registration',
 message: `${doc.data().fullName} is waiting for approval.`,
 time: 'Just now',
 type: 'alert'
 }));
 setNotifications(newAlerts);
 });
 return () => unsubscribe();
 }, [role]);
 
 // Security Gate: Real-time status enforcement
 const { status, user } = useAuth();
 useEffect(() => {
 const isRestricted = status && status !== 'active' && status !== 'approved' && status !== 'pending' && role !== 'admin';
 if (isRestricted) {
 setShowRestrictedModal(true);
 } else {
 setShowRestrictedModal(false);
 }
 }, [status, role]);

 const handleLogout = async () => {
 try {
 await logout();
 router.push('/login');
 } catch (error) {
 console.error("Logout error:", error);
 }
 };

 const navigation = {
 admin: [
 { type: 'heading', name: 'Core Management' },
 { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin', view: 'overview', color: 'text-indigo-500' },
 
 { 
 name: 'Clinical Registry', 
 icon: UserCog, 
 color: 'text-blue-500', 
 type: 'dropdown',
 id: 'clinical-registry',
 children: [
 { name: 'Appointments', icon: Calendar, href: '/dashboard/admin', view: 'appointments', color: 'text-blue-500' },
 { name: 'Doctors Directory', icon: Stethoscope, href: '/dashboard/admin', view: 'doctors', color: 'text-cyan-500' },
 { name: 'Patient Records', icon: UserCircle, href: '/dashboard/admin', view: 'patients', color: 'text-teal-500' },
 ]
 },

 { name: 'Receptionists', icon: Users, href: '/dashboard/admin', view: 'receptionists', color: 'text-emerald-500' },
 { name: 'Provider Audits', icon: ShieldCheck, href: '/dashboard/admin', view: 'audits', badge: pendingCount, color: 'text-amber-500' },
 { name: 'Finance', icon: CreditCard, href: '/dashboard/admin', view: 'finance', color: 'text-emerald-500' },
 
 { type: 'heading', name: 'Clinical Operations' },
 { 
 name: 'Services', 
 icon: Boxes, 
 color: 'text-purple-500', 
 type: 'dropdown',
 id: 'clinical-services',
 children: [
 { name: 'Medical Framework', icon: LayoutPanelLeft, href: '/dashboard/admin', view: 'medical-setup', color: 'text-purple-500' },
 { name: 'Nursing & Care', icon: ClipboardPlus, href: '/dashboard/admin', view: 'nursing', color: 'text-rose-500' },
 { name: 'Ambulance Fleet', icon: Ambulance, href: '/dashboard/admin', view: 'ambulance', color: 'text-red-600' },
 { name: 'Lab Diagnostics', icon: FlaskConical, href: '/dashboard/admin', view: 'lab-tests', color: 'text-sky-500' },
 { name: 'Health Store', icon: ShoppingCart, href: '/dashboard/admin', view: 'store', color: 'text-orange-500' },
 ]
 },
 
 { type: 'heading', name: 'Platform' },

 { name: 'Settings', icon: Settings, href: '/dashboard/admin', view: 'settings', color: 'text-slate-500' },
 ],
 receptionist: [
 { name: 'Front Desk', icon: LayoutDashboard, href: '/dashboard/receptionist', color: 'text-indigo-500' },
 { name: 'Live Bookings', icon: Calendar, href: '/dashboard/receptionist/bookings', color: 'text-blue-500' },
 { name: 'Patient Check-in', icon: Users, href: '/dashboard/receptionist/check-in', color: 'text-emerald-500' },
 { name: 'Payment Desk', icon: CreditCard, href: '/dashboard/receptionist/payments', color: 'text-amber-500' },
 ],
 doctor: [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/doctor', view: 'overview', color: 'text-indigo-500' },
  
  { type: 'heading', name: 'Clinical Operations' },
  { name: 'Appointments', icon: ClipboardList, href: '/dashboard/doctor', view: 'queue', color: 'text-blue-500' },
  { name: 'Schedule', icon: Calendar, href: '/dashboard/doctor', view: 'schedule', color: 'text-amber-500' },
  { name: 'Sessions', icon: Activity, href: '/dashboard/doctor', view: 'sessions', color: 'text-purple-500' },
  { name: 'Earnings', icon: CreditCard, href: '/dashboard/doctor', view: 'finance', color: 'text-emerald-500' },
  
  { type: 'heading', name: 'Account' },
  { name: 'Settings', icon: Settings, href: '/dashboard/doctor', view: 'settings', color: 'text-slate-500' },
 ],
 patient: [
  { name: 'My Health', icon: LayoutDashboard, href: '/dashboard/patient', view: 'overview', color: 'text-indigo-500' },
  
  { type: 'heading', name: 'Clinical Services' },
  { name: 'Appointments', icon: Calendar, href: '/dashboard/patient', view: 'appointments', color: 'text-blue-500' },
  { name: 'Instant Call', icon: Radio, href: '/dashboard/patient', view: 'instant-call', color: 'text-rose-500' },
  { name: 'Lab Bookings', icon: FlaskConical, href: '/dashboard/patient', view: 'lab-bookings', color: 'text-sky-500' },
  { name: 'Nursing Care', icon: ClipboardPlus, href: '/dashboard/patient', view: 'nursing', color: 'text-purple-500' },
  { name: 'Ambulance Trips', icon: Ambulance, href: '/dashboard/patient', view: 'ambulance', color: 'text-red-600' },
  { name: 'Pharmacy Orders', icon: ShoppingCart, href: '/dashboard/patient', view: 'pharmacy', color: 'text-orange-500' },
  
  { type: 'heading', name: 'Medical Identity' },
  { name: 'Health Library', icon: HeartPulse, href: '/dashboard/patient', view: 'results', color: 'text-rose-500' },
  { name: 'Billings', icon: CreditCard, href: '/dashboard/patient', view: 'billing', color: 'text-emerald-500' },
  { name: 'Settings', icon: Settings, href: '/dashboard/patient', view: 'settings', color: 'text-slate-500' },
  ]
 };

 const menuItems = navigation[role] || navigation.patient;

  // Helper to group menu items by heading
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (item.type === 'heading') {
      acc.push({ heading: item.name, items: [] });
    } else {
      if (acc.length === 0) acc.push({ heading: 'Main', items: [] });
      acc[acc.length - 1].items.push(item);
    }
    return acc;
  }, []);

  return (
  <div className="flex h-screen bg-med-bg">
  {/* ── SIDEBAR (Grouped Card Design) ── */}
  <motion.aside 
  initial={false}
  animate={{ width: isSidebarOpen ? '280px' : '80px' }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  className="fixed lg:relative z-50 h-full bg-med-bg flex flex-col transition-shadow duration-300 ease-in-out border-r border-med-border overflow-hidden"
  >
  {/* Sidebar Header */}
  <div className={`h-[72px] flex items-center shrink-0 px-6 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
  <AnimatePresence mode="wait">
  {isSidebarOpen && (
  <motion.div 
  key="logo-full"
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -10 }}
  className="flex items-center gap-3 min-w-0"
  >
  <div className="w-8 h-8 rounded-lg bg-med-primary flex items-center justify-center shrink-0">
    <Sparkles size={16} className="text-white" />
  </div>
  <span className="font-bold text-med-primary tracking-tight text-lg truncate">
    Meditaj
  </span>
  </motion.div>
  )}
  </AnimatePresence>

  <button 
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  className={`flex items-center justify-center transition-all shrink-0 ${isSidebarOpen ? 'w-8 h-8 text-med-muted hover:text-med-primary' : 'w-12 h-12 rounded-xl bg-med-card shadow-sm border border-med-border text-med-primary'}`}
  >
  {isSidebarOpen ? <X size={18} /> : <Menu size={20} />}
  </button>
  </div>

  {/* Navigation Groups */}
  <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto custom-scrollbar">
  {isSidebarOpen ? (
    groupedMenuItems.map((group, gIdx) => (
      <div key={gIdx} className="bg-med-card rounded-2xl border border-med-border p-1.5 space-y-0.5">
        <div className="px-3 py-2 flex items-center justify-between text-med-text font-semibold text-[13px]">
          <span>{group.heading}</span>
        </div>
        <div className="space-y-0.5">
          {group.items.map((item, idx) => {
            if (item.type === 'dropdown') {
               const isAnyChildActive = item.children.some(child => child.view === currentView);
               const isExpanded = expandedGroups.includes(item.id);
               return (
                <div key={`drop-${idx}`} className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={`w-full group flex items-center gap-3 h-10 px-3 rounded-xl transition-all ${isAnyChildActive ? 'text-med-primary' : 'text-med-muted hover:bg-med-bg'}`}
                  >
                    <item.icon size={18} className={isAnyChildActive ? 'text-med-primary' : 'text-med-muted'} />
                    <span className="text-[13px] font-medium flex-1 text-left">{item.name}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-med-muted"
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pl-9 pb-1 space-y-0.5 mt-0.5">
                          {item.children.map((child, cIdx) => (
                            <Link 
                              key={cIdx} 
                              href={`${child.href}?view=${child.view}`}
                              className={`block py-1.5 text-[12px] font-medium transition-all ${currentView === child.view ? 'text-med-primary' : 'text-med-muted hover:text-med-text'}`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
               );
            }

            const isActive = item.view ? currentView === item.view : pathname === item.href;
            return (
              <Link 
                key={idx}
                href={item.view ? `${item.href}?view=${item.view}` : item.href}
                className={`w-full group flex items-center gap-3 h-10 px-3 rounded-xl transition-all ${isActive ? 'text-med-primary' : 'text-med-muted hover:bg-med-bg'}`}
              >
                <item.icon size={18} className={isActive ? 'text-med-primary' : 'text-med-muted'} />
                <span className="text-[13px] font-medium flex-1 text-left">{item.name}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-med-primary" />}
              </Link>
            );
          })}
        </div>
      </div>
    ))
  ) : (
    /* Shrunken View */
    <div className="space-y-2">
      {menuItems.flatMap((item, idx) => {
        if (item.type === 'heading') return [];
        if (item.type === 'dropdown') {
          return item.children.map((child, cIdx) => {
            const isActive = currentView === child.view;
            return (
              <Link
                key={`${idx}-${cIdx}`}
                href={`${child.href}?view=${child.view}`}
                className={`w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-med-primary text-white' : 'bg-med-card border border-med-border text-med-muted hover:text-med-primary'}`}
              >
                <child.icon size={18} />
              </Link>
            );
          });
        }
        const isActive = item.view ? currentView === item.view : pathname === item.href;
        return [(
          <Link
            key={idx}
            href={item.view ? `${item.href}?view=${item.view}` : item.href}
            className={`w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-med-primary text-white' : 'bg-med-card border border-med-border text-med-muted hover:text-med-primary'}`}
          >
            <item.icon size={20} />
          </Link>
        )];
      })}
    </div>
  )}
  </nav>

  {/* Sidebar Footer */}
  <div className="p-4 mt-auto space-y-3">
    {isSidebarOpen && (
      <div className="bg-med-card rounded-2xl border border-med-border shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            {mounted && theme === 'dark' ? (
              <Moon size={18} className="text-med-text" />
            ) : (
              <Sun size={18} className="text-med-text" />
            )}
          </div>
          <span className="text-[13px] font-semibold text-med-text">Dark Mode</span>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`w-10 h-5 rounded-full relative p-0.5 transition-colors duration-300 ${theme === 'dark' ? 'bg-med-primary' : 'bg-med-muted/30'}`}
        >
          <motion.div 
            animate={{ x: theme === 'dark' ? 20 : 0 }}
            className="w-4 h-4 bg-white rounded-full shadow-sm" 
          />
        </button>
      </div>
    )}

    <button 
    onClick={() => setShowLogoutModal(true)}
    className={`flex items-center transition-all ${isSidebarOpen ? 'w-full gap-3 px-4 h-11 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100' : 'h-12 w-12 mx-auto justify-center rounded-xl bg-white border border-slate-100 text-rose-500'}`}
    >
    <LogOut size={18} />
    {isSidebarOpen && <span className="text-[13px] font-semibold">Sign Out</span>}
    </button>
  </div>
  </motion.aside>

  {/* ── MAIN CONTENT AREA (The Panel) ── */}
  <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-med-bg">
  
  {/* Top Tier Header (Integrated & Slim) */}
  <header className="h-[72px] px-8 shrink-0 relative z-40">
  <div className="flex items-center justify-between h-full border-b border-med-primary/5">
  <div className="flex items-center gap-6">
  <div className="flex flex-col">
    <h1 className="text-[14px] font-bold text-med-primary tracking-tight leading-none">
     {role === 'patient' ? 'Patient Terminal' : 
      role === 'doctor' ? 'Medical Terminal' : 
      role === 'receptionist' ? 'Front Desk Terminal' : 
      'Admin Terminal'}
   </h1>
  </div>
  <div className="hidden lg:flex items-center gap-2 h-9 px-4 bg-med-card border border-med-primary/20 rounded-lg w-[280px]">
  <Search size={14} className="text-med-muted" />
  <input type="text" placeholder="Global command search..." className="bg-transparent outline-none flex-1 text-[11px] font-bold text-med-text placeholder:text-med-muted" />
  </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="relative">
 <button 
 onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
 className={`relative w-10 h-10 ${isNotificationsOpen ? 'bg-med-primary text-white' : 'bg-med-card'} border border-med-primary/20 rounded-lg flex items-center justify-center text-med-muted hover:bg-med-card hover:text-med-primary transition-all`}
 >
 <Bell size={18} className={isNotificationsOpen ? 'text-white' : ''} />
 {pendingCount > 0 && (
 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
 )}
 </button>

 {/* Notifications Popover */}
 <AnimatePresence>
 {isNotificationsOpen && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
 <motion.div 
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 className="absolute right-0 mt-3 w-[320px] bg-med-card rounded-lg border border-med-primary/20 z-50 overflow-hidden"
 >
 <div className="p-4 border-b border-med-border flex items-center justify-between">
 <h3 className="text-[13px] font-bold text-med-primary uppercase tracking-tight">Clinical Alerts</h3>
 <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{notifications.length} New</span>
 </div>
 <div className="max-h-[300px] overflow-y-auto">
 {notifications.length > 0 ? notifications.map((notif) => (
 <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer">
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <Activity size={14} />
 </div>
 <div className="flex-1">
 <h4 className="text-[11px] font-bold text-[#1e4a3a]">{notif.title}</h4>
 <p className="text-[11px] text-slate-500 mt-0.5">{notif.message}</p>
 <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">{notif.time}</span>
 </div>
 </div>
 </div>
 )) : (
 <div className="p-12 text-center">
 <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
 <Bell size={20} />
 </div>
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No Alerts</p>
 </div>
 )}
 </div>
 <button className="w-full p-3 text-[11px] font-bold text-med-muted hover:text-med-primary transition-colors border-t border-med-border uppercase tracking-tighter">
 View All Notifications
 </button>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 
 <button 
 onClick={() => {
 const settingsHrefs = {
 admin: '/dashboard/admin?view=settings',
 doctor: '/dashboard/doctor/settings',
 patient: '/dashboard/patient/settings',
 receptionist: '/dashboard/receptionist/settings'
 };
 router.push(settingsHrefs[role] || settingsHrefs.patient);
 }}
 className="flex items-center gap-4 pl-4 border-l border-med-border hover:opacity-70 transition-opacity text-right"
 >
 <div className="flex flex-col items-end hidden md:flex">
 <span className="text-[12px] font-bold text-med-primary tracking-tight">{profile?.fullName || 'Meditaj User'}</span>
 <span className="text-[9px] font-medium text-white bg-med-primary px-2 py-0.5 rounded-full uppercase tracking-wider leading-none mt-1 ">
 {role === 'admin' ? 'Platform Admin' : role}
 </span>
 </div>
 <div className="w-10 h-10 rounded-lg bg-med-bg border border-med-primary/10 flex items-center justify-center text-med-muted overflow-hidden">
 {profile?.photoURL ? (
 <img src={profile.photoURL} className="w-full h-full object-cover" />
 ) : (
 <UserCircle size={28} />
 )}
 </div>
 </button>
 </div>
 </div>
 </header>

 {/* Dashboard Dynamic Content */}
 <main className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
 <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-300" /></div>}>
 {children}
 </Suspense>
 </main>
 </div>

 {/* ── LOGOUT CONFIRMATION MODAL ── */}
 <AnimatePresence>
 {showLogoutModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-[#1e4a3a]/40"
 onClick={() => setShowLogoutModal(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-sm bg-med-card rounded-xl border border-med-border overflow-hidden p-5"
 >
 <div className="flex items-start gap-4 mb-6">
 <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100">
 <LogOut size={16} />
 </div>
 <div className="pt-0.5">
 <h3 className="text-[14px] font-bold text-med-text tracking-tight">Sign out of Meditaj?</h3>
 <p className="text-[12px] text-med-muted leading-relaxed mt-1">You will be securely disconnected from this dashboard. You can log back in at any time.</p>
 </div>
 </div>
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => setShowLogoutModal(false)} 
 className="h-8 px-4 rounded-lg text-[11px] font-bold text-med-muted hover:bg-med-bg hover:text-med-text transition-all border border-transparent hover:border-med-border"
 >
 Cancel
 </button>
 <button 
 onClick={handleLogout} 
 className="h-8 px-5 bg-rose-500 text-white rounded-lg text-[11px] font-bold transition-all -200 border border-rose-600 hover:bg-rose-600"
 >
 Sign Out
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <style jsx global>{`
 .custom-scrollbar::-webkit-scrollbar { width: 4px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
 `}</style>

 <RestrictedAccessPopup 
 isOpen={showRestrictedModal}
 onClose={handleLogout}
 referenceId={user?.uid?.slice(0, 8).toUpperCase()}
 />
 </div>
 );
}



