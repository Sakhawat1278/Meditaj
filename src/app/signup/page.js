'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, User, ArrowRight, ChevronLeft, Globe, 
  Calendar, Phone, MapPin, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/UI/CustomDropdown';
import DatePicker from '@/components/UI/DatePicker';
import CurateButton from '@/components/UI/Buttons/CurateButton';
import Logo from '@/components/UI/Logo';

const OrbitalAvatar = ({ angle, distance, img, delay }) => {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      transition={{ 
        delay, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }}
      className="absolute"
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4 + Math.random() * 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="w-14 h-14 rounded-full border-2 border-white/20 bg-slate-200 overflow-hidden shadow-2xl p-0.5"
      >
        <div className="w-full h-full rounded-full overflow-hidden border border-white/10">
          <img src={img} alt="person" className="w-full h-full object-cover" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function SignupPage() {
  const { registerPatient } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '', dob: '', email: '', phone: '', address: '', city: '', country: 'BD', postalCode: '', password: ''
  });
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await registerPatient(formData.email, formData.password, {
        fullName: formData.fullName,
        dob: formData.dob,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
        gender,
        bloodType
      });
      router.push('/dashboard/patient');
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  return (
    <main className="min-h-screen bg-white flex selection:bg-[#1e4a3a] selection:text-white">
      
      {/* ── Left Column: Orbital Design ── */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#1e4a3a] overflow-hidden sticky top-0 h-screen shrink-0 items-center justify-center">
        {/* Abstract Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>

        {/* Orbiting System Container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12">
          
          <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            
            {/* Concentric Orbit Rings */}
            <div className="absolute inset-0 border border-white/5 rounded-full" />
            <div className="absolute inset-[15%] border border-white/10 rounded-full" />
            <div className="absolute inset-[30%] border border-white/10 rounded-full" />
            
            {/* Central Brand Core */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
              className="relative z-30 w-32 h-32 bg-white rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center"
            >
              <Logo size="lg" />
            </motion.div>

            {/* Orbiting Avatars */}
            <OrbitalAvatar angle={30} distance={250} img="https://i.pravatar.cc/150?u=11" delay={1.0} />
            <OrbitalAvatar angle={90} distance={250} img="https://i.pravatar.cc/150?u=12" delay={1.2} />
            <OrbitalAvatar angle={150} distance={250} img="https://i.pravatar.cc/150?u=13" delay={1.4} />
            <OrbitalAvatar angle={210} distance={250} img="https://i.pravatar.cc/150?u=14" delay={1.6} />
            <OrbitalAvatar angle={270} distance={250} img="https://i.pravatar.cc/150?u=15" delay={1.8} />
            <OrbitalAvatar angle={330} distance={250} img="https://i.pravatar.cc/150?u=16" delay={2.0} />

            {/* Inner Ring Avatars */}
            <OrbitalAvatar angle={15} distance={175} img="https://i.pravatar.cc/150?u=17" delay={2.2} />
            <OrbitalAvatar angle={135} distance={175} img="https://i.pravatar.cc/150?u=18" delay={2.4} />
            <OrbitalAvatar angle={255} distance={175} img="https://i.pravatar.cc/150?u=19" delay={2.6} />
          </div>

          {/* Title Overlay */}
          <div className="mt-16 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-3xl font-black text-white tracking-tighter leading-none mb-4 uppercase"
            >
              Join the <br /><span className="text-white/40">Community.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="max-w-xs mx-auto text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] leading-relaxed"
            >
              Initialize your profile and connect with a global network of trusted medical experts.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Right Column: Minimalist Form ── */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col overflow-y-auto">
        
        {/* Top bar with back and branding (mobile-only logo) */}
        <div className="w-full px-8 py-6 flex items-center justify-between shrink-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <Link 
              href="/" 
              className="group flex items-center gap-2 text-slate-400 hover:text-[#1e4a3a] transition-colors"
            >
              <div className="w-9 h-9 border border-slate-200 rounded-full flex items-center justify-center group-hover:border-[#1e4a3a] transition-all">
                <ChevronLeft size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            </Link>
          </motion.div>

          {/* mobile logo appear only on mobile device */}
          <div className="lg:hidden flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm font-black tracking-tighter text-[#1e4a3a] uppercase whitespace-nowrap">CURATE <span className="opacity-40">HEALTH</span></span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-12">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl w-full mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-10">
              <h2 className="text-2xl font-extrabold tracking-tighter text-[#1e4a3a] leading-none mb-3 uppercase">
                Create Account
              </h2>
              <div className="w-8 h-0.5 bg-[#1e4a3a] rounded-full" />
            </motion.div>

            <form className="space-y-5" onSubmit={handleSignup}>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-[#1e4a3a] mb-4"
                >
                  <AlertCircle size={16} className="text-slate-400 shrink-0" />
                  <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">{errorMessage}</p>
                </motion.div>
              )}

              {/* Group 1: Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Md. Hasan Rafi" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="name@email.com" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                  </div>
                </motion.div>
              </div>

              {/* Group 2: Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+880" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5 focus-within:z-10">
                  <DatePicker 
                    label="Birth Date"
                    value={formData.dob} 
                    onChange={(val) => setFormData({...formData, dob: val})} 
                    placeholder="YYYY-MM-DD" 
                    className="w-full"
                  />
                </motion.div>
              </div>

              {/* Group 3: Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div variants={itemVariants} className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Area/Road/House" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" className="w-full h-11 px-5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                </motion.div>
              </div>

              {/* Group 4: Options & Password */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <CustomDropdown 
                    label="GENDER" 
                    options={[{value:'male',label:'Male'},{value:'female',label:'Female'}]} 
                    value={gender} 
                    onChange={setGender} 
                    placeholder="Select" 
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <CustomDropdown 
                    label="BLOOD GROUP" 
                    options={['A+','B+','O+','AB+'].map(v=>({value:v,label:v}))} 
                    value={bloodType} 
                    onChange={setBloodType} 
                    placeholder="Select" 
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="pt-6 flex justify-start">
                <CurateButton type="submit" label="Sign Up Now" isLoading={isLoading} />
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Already have an account?{' '}
                <Link href="/login" className="text-[#1e4a3a] hover:underline ml-1">
                  Sign In
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="w-full px-8 py-8 shrink-0">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.3em] text-center">
            &copy; 2026 CURATE HEALTH SYSTEM. ALL RIGHTS RESERVED.
          </p>
        </div>

      </section>
    </main>
  );
}
