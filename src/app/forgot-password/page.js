'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Mail, ArrowRight, ChevronLeft, Globe, 
  ShieldCheck, Lock, Eye, EyeOff, Loader2, AlertCircle
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import CurateButton from '@/components/UI/Buttons/CurateButton';
import Logo from '@/components/UI/Logo';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  
  const [otp, setOtp] = useState(['', '', '', '']); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  const handleSendCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60000); 
      await setDoc(doc(db, 'password_resets', email), {
        otp: generatedOtp,
        expiresAt: expiresAt.toISOString(),
        verified: false
      });
      setStep(2);
      toast.success("Code sent!");
    } catch (error) { toast.error("Failed to send."); }
    finally { setIsSubmitting(false); }
  };

  const handleVerifyPin = async () => {
    const pinString = otp.join('');
    if (pinString.length < 4) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'password_resets', email);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) { toast.error("Invalid request."); return; }
      const data = docSnap.data();
      if (data.otp === pinString) {
        await updateDoc(docRef, { verified: true });
        setStep(3);
        toast.success("Verified!");
      } else { toast.error("Invalid code."); }
    } catch (error) { toast.error("Failed."); }
    finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Match error."); return; }
    setIsSubmitting(true);
    try {
      toast.success("Updated!");
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (error) { toast.error("Failed."); }
    finally { setIsSubmitting(false); }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 3) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleResend = async () => {
    if (isResendDisabled) return;
    setIsResendDisabled(true);
    await handleSendCode();
    setTimeout(() => setIsResendDisabled(false), 30000);
  };

  return (
    <main className="min-h-screen bg-white flex selection:bg-[#1e4a3a] selection:text-white">
      
      {/* ── Left Branding ── */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#1e4a3a] overflow-hidden sticky top-0 h-screen shrink-0">
        <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.7 }} transition={{ duration: 1.5 }} className="absolute inset-0 z-0">
          <img src="/curate_medical_concept_1776363557484.png" className="w-full h-full object-cover grayscale brightness-50" />
        </motion.div>
        <div className="relative z-10 w-full p-16 flex flex-col justify-between h-full text-white">
          <div>
            <div className="flex items-center gap-3">
              <Logo size="sm" color="white" />
              <span className="text-lg font-bold tracking-tight uppercase">CURATE <span className="text-white/40">HEALTH</span></span>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none mb-4 uppercase">Recover <br/>Access.</h1>
            <p className="max-w-xs text-white/50 text-[11px] font-medium leading-relaxed uppercase tracking-widest">Verify identity and restore medical dashboard access.</p>
          </div>
        </div>
      </section>

      {/* ── Right Form ── */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col overflow-y-auto bg-white">
        <div className="w-full px-8 py-6 flex items-center justify-between sticky top-0 z-50 bg-white/90 backdrop-blur-md">
          <Link href="/login" className="flex items-center gap-2 group text-slate-400 hover:text-[#1e4a3a] transition-colors">
            <div className="w-9 h-9 border border-slate-200 rounded-full flex items-center justify-center group-hover:border-[#1e4a3a] transition-all"><ChevronLeft size={16}/></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
            <ShieldCheck size={14} />
            Secure Portal
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 py-12">
          <div className="max-w-[420px] w-full mx-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tighter text-[#1e4a3a] uppercase mb-3">Forgot Password</h2>
                    <div className="w-8 h-0.5 bg-[#1e4a3a] rounded-full" />
                  </div>
                  <form className="space-y-5" onSubmit={handleSendCode}>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a] placeholder:text-slate-200" />
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="group relative flex items-center justify-end h-11 bg-[#1e4a3a] text-white rounded-full hover:bg-slate-800 transition-all overflow-hidden disabled:opacity-50">
                      {isSubmitting ? <div className="w-32 h-full flex items-center justify-center"><Loader2 className="animate-spin" size={18}/></div> : (
                        <motion.div initial={{ width: 44 }} animate={{ width: "auto" }} transition={{ delay: 0.1 }} className="flex items-center">
                          <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-[11px] font-bold tracking-[0.15em] ml-6 mr-3 uppercase text-white">Send Code</motion.span>
                          <div className="w-9 h-9 border border-white/30 rounded-full flex items-center justify-center mr-1 shrink-0 group-hover:bg-white group-hover:text-[#1e4a3a] transition-all"><ArrowRight size={16}/></div>
                        </motion.div>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 flex flex-col items-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 mx-auto"><ShieldCheck size={24}/></div>
                    <h2 className="text-2xl font-extrabold tracking-tighter text-[#1e4a3a] uppercase mb-2">Verify Code</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Identity verification required for {email}</p>
                  </div>
                  <div className="flex gap-4">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-12 h-12 text-center text-xl font-black bg-white border border-slate-200 rounded-full focus:border-[#1e4a3a] focus:ring-4 focus:ring-[#1e4a3a]/5 outline-none transition-all shadow-sm" />
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <button onClick={handleVerifyPin} disabled={isSubmitting || otp.some(d => !d)} className="group relative flex items-center justify-end h-11 bg-[#1e4a3a] text-white rounded-full hover:bg-slate-800 transition-all overflow-hidden disabled:opacity-50">
                      {isSubmitting ? <div className="w-48 h-full flex items-center justify-center"><Loader2 className="animate-spin" size={18}/></div> : (
                        <motion.div initial={{ width: 44 }} animate={{ width: "auto" }} transition={{ delay: 0.1 }} className="flex items-center">
                          <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-[11px] font-bold tracking-[0.15em] ml-6 mr-3 uppercase text-white">Verify & Continue</motion.span>
                          <div className="w-9 h-9 border border-white/30 rounded-full flex items-center justify-center mr-1 shrink-0 group-hover:bg-white group-hover:text-[#1e4a3a] transition-all"><ArrowRight size={16}/></div>
                        </motion.div>
                      )}
                    </button>
                    <button onClick={handleResend} disabled={isResendDisabled} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#1e4a3a] transition-colors">{isResendDisabled ? "Wait 30s" : "Resend Code"}</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tighter text-[#1e4a3a] uppercase mb-3">New Password</h2>
                    <div className="w-8 h-0.5 bg-[#1e4a3a] rounded-full" />
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-11 px-5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a]"/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#1e4a3a]">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Confirm</label>
                      <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-11 px-5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#1e4a3a] transition-all text-[13px] font-medium text-[#1e4a3a]"/>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="group relative flex items-center justify-end h-11 bg-[#1e4a3a] text-white rounded-full hover:bg-slate-800 transition-all overflow-hidden disabled:opacity-50">
                      {isSubmitting ? <div className="w-48 h-full flex items-center justify-center"><Loader2 className="animate-spin" size={18}/></div> : (
                        <motion.div initial={{ width: 44 }} animate={{ width: "auto" }} transition={{ delay: 0.1 }} className="flex items-center">
                          <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-[11px] font-bold tracking-[0.15em] ml-6 mr-3 uppercase text-white">Update Password</motion.span>
                          <div className="w-9 h-9 border border-white/30 rounded-full flex items-center justify-center mr-1 shrink-0 group-hover:bg-white group-hover:text-[#1e4a3a] transition-all"><ArrowRight size={16}/></div>
                        </motion.div>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full py-8 bg-white border-t border-slate-50">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.3em] text-center">&copy; 2026 CURATE HEALTH SYSTEM. ALL RIGHTS RESERVED.</p>
        </div>
      </section>
    </main>
  );
}
