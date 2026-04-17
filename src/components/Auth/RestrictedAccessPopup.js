'use client';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Lock, Phone, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function RestrictedAccessPopup({ isOpen, onClose, referenceId }) {
 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-[#1e4a3a]/40"
 />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 overflow-hidden p-6"
 >
 
 <div className="flex items-start gap-4 mb-8">
 <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100">
 <Lock size={18} />
 </div>
 <div className="pt-0.5">
 <h2 className="text-[14px] font-bold text-[#1e4a3a] tracking-tight uppercase leading-none mb-2">Access Restricted</h2>
 <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
 Your medical profile has been <span className="text-rose-600 font-bold">Deactivated</span> by the hospital administration. Please verify your credentials or contact support.
 </p>
 </div>
 </div>
 
 <div className="space-y-2">
 <a 
 href="tel:+8801700000000" 
 className="w-full h-9 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#163529] transition-all"
 >
 <Phone size={12} className="text-rose-400" />
 Speak to Support
 </a>
 
 <button 
 onClick={onClose}
 className="w-full h-9 border border-slate-200 text-slate-500 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
 >
 <ArrowLeft size={12} />
 Return to Login
 </button>
 </div>
 
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}


