'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Activity, Dna, BrainCircuit, Sparkles } from 'lucide-react';

const slides = [
 {
 icon: <Dna className="w-16 h-16" />,
 titleKey: 'slide1Title',
 descKey: 'slide1Desc',
 color: 'from-emerald-600 to-teal-900',
 graphic: (
 <div className="relative w-full h-full flex items-center justify-center opacity-20">
 <motion.div 
 animate={{ rotate: 360 }}
 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
 className="absolute inset-0 border-[2px] border-dashed border-emerald-400/30 rounded-full"
 />
 <motion.div 
 animate={{ rotate: -360 }}
 transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
 className="absolute inset-10 border-[1px] border-emerald-300/20 rounded-full"
 />
 {[...Array(8)].map((_, i) => (
 <motion.div
 key={i}
 className="absolute w-2 h-2 bg-emerald-400 rounded-full"
 animate={{ 
 scale: [1, 1.5, 1],
 opacity: [0.3, 0.7, 0.3],
 y: [0, -100, 0],
 x: Math.sin(i) * 50
 }}
 transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
 style={{ left: `${20 + i * 10}%`, bottom: '10%' }}
 />
 ))}
 </div>
 )
 },
 {
 icon: <Activity className="w-16 h-16" />,
 titleKey: 'slide2Title',
 descKey: 'slide2Desc',
 color: 'from-teal-700 to-slate-900',
 graphic: (
 <div className="relative w-full h-full flex items-center justify-center opacity-25">
 <svg viewBox="0 0 800 200" className="w-full h-auto stroke-emerald-400 fill-none stroke-2">
 <motion.path
 initial={{ pathLength: 0 }}
 animate={{ pathLength: 1 }}
 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
 d="M0,100 L50,100 L65,70 L85,130 L100,100 L150,100 L165,20 L185,180 L200,100 L250,100 L265,70 L285,130 L300,100 L350,100 L365,20 L385,180 L400,100 L450,100 L465,70 L485,130 L500,100 L550,100 L565,20 L585,180 L600,100 L650,100 L665,70 L685,130 L700,100 L750,100 L765,20 L785,180 L800,100"
 />
 </svg>
 <motion.div 
 animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
 transition={{ duration: 0.8, repeat: Infinity }}
 className="absolute w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"
 />
 </div>
 )
 },
 {
 icon: <BrainCircuit className="w-16 h-16" />,
 titleKey: 'slide3Title',
 descKey: 'slide3Desc',
 color: 'from-slate-800 to-emerald-950',
 graphic: (
 <div className="relative w-full h-full flex items-center justify-center opacity-20">
 <div className="grid grid-cols-6 gap-8">
 {[...Array(24)].map((_, i) => (
 <motion.div
 key={i}
 className="w-1 h-1 bg-emerald-300 rounded-full"
 animate={{ 
 opacity: [0.1, 1, 0.1],
 boxShadow: ["0 0 0px rgba(52, 211, 153, 0)", "0 0 10px rgba(52, 211, 153, 0.8)", "0 0 0px rgba(52, 211, 153, 0)"]
 }}
 transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
 />
 ))}
 </div>
 <motion.div 
 animate={{ 
 x: [-100, 100, -100],
 y: [-50, 50, -50]
 }}
 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
 className="absolute w-1 h-1 bg-emerald-400 rounded-full(52,211,153,0.5)]"
 />
 </div>
 )
 }
];

export default function MedicalSlider() {
 const [current, setCurrent] = useState(0);
 const { t } = useLanguage();

 useEffect(() => {
 const timer = setInterval(() => {
 setCurrent((prev) => (prev + 1) % slides.length);
 }, 5000);
 return () => clearInterval(timer);
 }, []);

 return (
 <div className="relative w-full h-full overflow-hidden flex flex-col justify-center items-center px-12 text-white overflow-hidden">
 <AnimatePresence mode="wait">
 <motion.div
 key={current}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.8, ease: "easeOut" }}
 className="relative z-10 w-full max-w-lg"
 >
 {/* Graphical Backdrop */}
 <div className="absolute inset-0 -z-10 pointer-events-none transform scale-150">
 {slides[current].graphic}
 </div>

 <div className="mb-8 text-emerald-300 flex items-center gap-4">
 <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
 {slides[current].icon}
 </div>
 <motion.div 
 initial={{ scaleX: 0 }}
 animate={{ scaleX: 1 }}
 className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent origin-left"
 />
 </div>

 <motion.h2 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="text-4xl xl:text-5xl font-bold tracking-tight mb-4"
 >
 {t(slides[current].titleKey)}
 </motion.h2>

 <motion.p 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="text-xl text-emerald-100/70 font-light leading-relaxed mb-12 max-w-md"
 >
 {t(slides[current].descKey)}
 </motion.p>
 </motion.div>
 </AnimatePresence>

 {/* Navigation Dots */}
 <div className="absolute bottom-12 left-12 flex gap-3 z-10">
 {slides.map((_, i) => (
 <button
 key={i}
 onClick={() => setCurrent(i)}
 className={`h-1.5 transition-all duration-500 rounded-full ${
 current === i ? 'w-8 bg-emerald-400' : 'w-2 bg-emerald-400/20'
 }`}
 />
 ))}
 </div>

 {/* Background Gradient Layer */}
 <motion.div 
 className={`absolute inset-0 -z-20 bg-gradient-to-br transition-colors duration-1000 ${slides[current].color}`}
 />
 
 {/* Decorative Brand Tag */}
 <div className="absolute top-12 left-12 flex items-center gap-2 text-white/40">
 <Sparkles size={16} />
 <span className="text-xs font-bold uppercase tracking-[0.3em] font-sans">Meditaj Premium</span>
 </div>
 </div>
 );
}


