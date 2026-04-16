'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, User, ArrowRight, ChevronLeft, Globe, 
  Calendar, Phone, MapPin, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/UI/CustomDropdown';
import DatePicker from '@/components/UI/DatePicker';

export default function SignupPage() {
  const { t, locale, switchLanguage } = useLanguage();
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
    <main className="min-h-screen bg-white flex selection:bg-black selection:text-white">
      
      {/* ── Left Column: Immersive Visual ── */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden sticky top-0 h-screen shrink-0">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="/curate_medical_concept_1776363557484.png" 
            alt="Curate Concept" 
            className="w-full h-full object-cover grayscale brightness-50"
          />
        </motion.div>
        
        {/* Overlay Branding */}
        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white uppercase">Curate <span className="text-white/40">Health</span></span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none mb-4 uppercase">
              Start Your <br />Journey.
            </h1>
            <p className="max-w-xs text-white/50 text-[11px] font-medium leading-relaxed uppercase tracking-widest">
              Create your secure medical profile and access premium healthcare services instantly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Right Column: Minimalist Form ── */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col overflow-y-auto">
        
        {/* Top bar with back and language */}
        <div className="w-full px-8 py-6 flex items-center justify-between shrink-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <Link 
              href="/" 
              className="group flex items-center gap-2 text-slate-400 hover:text-black transition-colors"
            >
              <div className="w-9 h-9 border border-slate-200 rounded-full flex items-center justify-center group-hover:border-black transition-all">
                <ChevronLeft size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('home')}</span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <button 
              onClick={() => switchLanguage(locale === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-black transition-colors"
            >
              <Globe size={12} />
              <span className={locale === 'en' ? 'text-black' : ''}>EN</span>
              <span className="text-slate-200">/</span>
              <span className={locale === 'bn' ? 'text-black' : ''}>BN</span>
            </button>
          </motion.div>
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
              <h2 className="text-2xl font-extrabold tracking-tighter text-black leading-none mb-3 uppercase">
                Create Account
              </h2>
              <div className="w-8 h-0.5 bg-black rounded-full" />
            </motion.div>

            <form className="space-y-5" onSubmit={handleSignup}>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-black mb-4"
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
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Md. Hasan Rafi" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-black transition-all text-[13px] font-medium text-black placeholder:text-slate-200" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="name@email.com" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-black transition-all text-[13px] font-medium text-black placeholder:text-slate-200" />
                  </div>
                </motion.div>
              </div>

              {/* Group 2: Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+880" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-black transition-all text-[13px] font-medium text-black placeholder:text-slate-200" />
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
                    <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Area/Road/House" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-black transition-all text-[13px] font-medium text-black placeholder:text-slate-200" />
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" className="w-full h-11 px-5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-black transition-all text-[13px] font-medium text-black placeholder:text-slate-200" />
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
                    <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-black transition-all text-[13px] font-medium text-black placeholder:text-slate-200" />
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="pt-6 flex justify-start">
                <button 
                  disabled={isLoading}
                  className="group relative flex items-center justify-end h-11 bg-black text-white rounded-full hover:bg-slate-800 transition-all overflow-hidden disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-32 h-full flex items-center justify-center">
                      <Loader2 className="animate-spin" size={18} />
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ width: 44 }}
                      animate={{ width: "auto" }}
                      transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center"
                    >
                      <motion.span 
                        initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="text-[12px] font-bold tracking-[0.15em] leading-none whitespace-nowrap ml-6 mr-3 uppercase text-white"
                      >
                        Sign Up Now
                      </motion.span>
                      
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-9 h-9 border border-white/30 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300 shrink-0 mr-1"
                      >
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </motion.div>
                    </motion.div>
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Already have an account?{' '}
                <Link href="/login" className="text-black hover:underline ml-1">
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
