'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ChevronLeft, Globe, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import RestrictedAccessPopup from '@/components/Auth/RestrictedAccessPopup';
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

export default function LoginPage() {
  const { login, logout, role, status, user } = useAuth();
  const router = useRouter();
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [restrictedUid, setRestrictedUid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email, password);
    } catch (error) {
      setErrorMessage("The credentials provided do not match our secure records.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role && status) {
      if (status === 'pending') {
        setErrorMessage("Your professional application is currently awaiting administrative validation.");
        setIsLoading(false);
        return;
      }

      const isRestricted = status !== 'active' && status !== 'approved' && status !== 'pending' && role !== 'admin';
      if (isRestricted) {
        setRestrictedUid(user?.uid || '');
        setShowRestrictedModal(true);
        setIsLoading(false);
        logout();
        return;
      }
      
      setIsLoading(false);
      router.push(`/dashboard/${role}`);
    }
  }, [role, status, router, logout, user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
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

            {/* Orbiting Avatars (Static positions but can be animated) */}
            <OrbitalAvatar angle={0} distance={250} img="https://i.pravatar.cc/150?u=1" delay={1.0} />
            <OrbitalAvatar angle={60} distance={250} img="https://i.pravatar.cc/150?u=2" delay={1.2} />
            <OrbitalAvatar angle={120} distance={250} img="https://i.pravatar.cc/150?u=3" delay={1.4} />
            <OrbitalAvatar angle={180} distance={250} img="https://i.pravatar.cc/150?u=4" delay={1.6} />
            <OrbitalAvatar angle={240} distance={250} img="https://i.pravatar.cc/150?u=5" delay={1.8} />
            <OrbitalAvatar angle={300} distance={250} img="https://i.pravatar.cc/150?u=6" delay={2.0} />

            {/* Inner Ring Avatars */}
            <OrbitalAvatar angle={45} distance={175} img="https://i.pravatar.cc/150?u=7" delay={2.2} />
            <OrbitalAvatar angle={165} distance={175} img="https://i.pravatar.cc/150?u=8" delay={2.4} />
            <OrbitalAvatar angle={285} distance={175} img="https://i.pravatar.cc/150?u=9" delay={2.6} />
          </div>

          {/* Epic Title Overlay */}
          <div className="mt-16 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-3xl font-black text-white tracking-tighter leading-none mb-4 uppercase"
            >
              Premium Care <br /><span className="text-white/40"> Everywhere.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="max-w-xs mx-auto text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] leading-relaxed"
            >
              Compatible with your healthcare needs, pharmacy, and diagnostic systems globally.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Right Column: Minimalist Form ── */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col">
        
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
        <div className="flex-1 flex items-center justify-center px-8 lg:px-24">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-sm w-full"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-2xl font-extrabold tracking-tighter text-[#1e4a3a] leading-none mb-3">
                SIGN IN
              </h2>
              <div className="w-8 h-0.5 bg-[#1e4a3a] rounded-full" />
            </motion.div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-[#1e4a3a] mb-4"
                  >
                    <AlertCircle size={16} className="text-slate-400 shrink-0" />
                    <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="email" 
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    PASSWORD
                  </label>
                  <Link href="/forgot-password" opacity={0.5} className="text-[9px] font-extrabold text-slate-400 hover:text-[#1e4a3a] transition-colors uppercase tracking-widest">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2 flex justify-start">
                <CurateButton type="submit" label="Sign In Now" isLoading={isLoading} />
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#1e4a3a] hover:underline ml-1">
                  Sign Up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="w-full px-8 lg:px-24 py-8 shrink-0">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.3em] text-center">
            &copy; 2026 CURATE HEALTH SYSTEM. ALL RIGHTS RESERVED.
          </p>
        </div>

      </section>

      <RestrictedAccessPopup 
        isOpen={showRestrictedModal} 
        onClose={() => setShowRestrictedModal(false)}
        referenceId={restrictedUid.slice(0, 8).toUpperCase()}
      />
    </main>
  );
}
