'use client';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function GlobalConfirmation({ 
 isOpen, 
 title, 
 message, 
 confirmText, 
 cancelText, 
 type, 
 onConfirm, 
 onCancel,
 onClose 
}) {
 const [isProcessing, setIsProcessing] = useState(false);

 const handleConfirm = async () => {
 setIsProcessing(true);
 try {
 await onConfirm();
 } finally {
 setIsProcessing(false);
 }
 };

 const colors = {
 danger: {
 bg: 'bg-rose-50',
 icon: 'text-rose-500',
 button: 'bg-rose-600 hover:bg-rose-700',
 border: 'border-rose-100',
 accent: 'bg-rose-500'
 },
 warning: {
 bg: 'bg-amber-50',
 icon: 'text-amber-500',
 button: 'bg-amber-600 hover:bg-amber-700',
 border: 'border-amber-100',
 accent: 'bg-amber-500'
 },
 info: {
 bg: 'bg-blue-50',
 icon: 'text-blue-500',
 button: 'bg-blue-600 hover:bg-blue-700',
 border: 'border-blue-100',
 accent: 'bg-blue-500'
 }
 };

 const style = colors[type] || colors.danger;

 return (
 <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onCancel}
 className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
 />
 
 <motion.div 
 initial={{ scale: 0.98, opacity: 0, y: 10 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.98, opacity: 0, y: 10 }}
 transition={{ type: "spring", damping: 25, stiffness: 400 }}
 className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden border border-slate-200 p-6"
 >
 <div className="flex items-start gap-4 mb-8">
 <div className={`w-11 h-11 ${style.bg} ${style.icon} rounded-full flex items-center justify-center shrink-0 border ${style.border}`}>
 {type === 'danger' && <ShieldAlert size={18} strokeWidth={2.5} />}
 {type === 'warning' && <AlertTriangle size={18} strokeWidth={2.5} />}
 {type === 'info' && <Info size={18} strokeWidth={2.5} />}
 </div>
 
 <div className="pt-1">
 <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
 {title}
 </h3>
 <p className="text-[12px] font-medium text-slate-500 leading-relaxed mt-1.5 px-0.5">
 {message}
 </p>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2">
 <button
 onClick={onCancel}
 disabled={isProcessing}
 className="h-9 px-4 text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-200"
 >
 {cancelText}
 </button>
 
 <button
 onClick={handleConfirm}
 disabled={isProcessing}
 className={`h-9 px-5 ${style.button} text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-2 border ${style.button.replace('bg-', 'border-').replace('700', '800')}`}
 >
 {isProcessing ? (
 <Loader2 className="animate-spin" size={14} />
 ) : confirmText}
 </button>
 </div>
 </motion.div>
 </div>
 );
}


