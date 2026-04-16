'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowUpRight, Camera, Send, MessageCircle, Smartphone, Download, Play } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import Magnetic from '@/components/UI/Motion/Magnetic';
import TextReveal from '@/components/UI/Motion/TextReveal';

const SunriseHero = () => {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  const springY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.5
      }
    }
  };

  const floatingVariants = (delay = 0) => ({
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: delay
      }
    },
    float: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  });

  return (
    <motion.section 
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-screen min-h-[850px] flex items-center justify-center overflow-hidden bg-slate-950"
    >
      {/* Immersive Background Asset with Advanced Parallax */}
      <motion.div style={{ y: springY, opacity, scale }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 z-10" />
        <motion.img 
          initial={{ scale: 1.2, filter: 'blur(10px)' }}
          animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          src="/images/hero/sunrise_bg.png" 
          alt="Sunrise Medical Center"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="container mx-auto px-4 lg:px-6 relative z-20">
        
        {/* Top-Mid Content: Main Narrative */}
        <div className="max-w-4xl mx-auto text-center mb-16 px-4">
          <TextReveal 
            text={t('sunriseTitle')}
            className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] mb-8"
            mode="word"
            stagger={0.1}
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 1.2 }}
            className="text-slate-200 text-sm md:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-80"
          >
            {t('sunriseSub')}
          </motion.p>
        </div>

        {/* Central Action: Discovery UI */}
        <div className="flex flex-col items-center gap-12">
           <Magnetic strength={0.2}>
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1.4 }}
             >
                <Link href="/services" className="group h-16 md:h-24 px-10 md:px-16 bg-white rounded-full flex items-center justify-between gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all duration-500">
                   <span className="text-slate-900 text-2xl md:text-3xl font-black uppercase tracking-tighter">{t('sunriseFind')}</span>
                   <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                      <ArrowUpRight size={32} />
                   </div>
                </Link>
             </motion.div>
           </Magnetic>
        </div>

        {/* Floating Component Layer: Social Proof & Metadata */}
        <div className="absolute inset-0 pointer-events-none p-4 lg:p-12">
          
          {/* Left Side: Medical Excellence Stack */}
          <motion.div 
            variants={floatingVariants(1.6)}
            initial="initial"
            animate="animate"
            className="absolute left-6 lg:left-24 top-1/2 -translate-y-1/2 pointer-events-auto"
          >
             <motion.div animate="float" variants={floatingVariants()} className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[40px] max-w-[320px] shadow-2xl">
                <div className="flex -space-x-4 mb-6">
                   {[1,2,3].map(i => (
                     <motion.div 
                       key={i} 
                       whileHover={{ y: -5, scale: 1.1 }}
                       className="w-14 h-14 rounded-full border-4 border-white/30 bg-slate-200 overflow-hidden cursor-pointer"
                     >
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Specialist" className="w-full h-full object-cover" />
                     </motion.div>
                   ))}
                </div>
                <p className="text-white text-base font-medium leading-relaxed opacity-90">
                   We're committed to delivering a high-quality experience in a welcoming and supportive atmosphere.
                </p>
             </motion.div>
          </motion.div>

          {/* Absolute Bottom Left: Satisfaction Hub */}
          <motion.div 
            variants={floatingVariants(1.8)}
            initial="initial"
            animate="animate"
            className="absolute left-6 lg:left-24 bottom-12 pointer-events-auto"
          >
             <div className="bg-white/95 backdrop-blur-xl p-3 pr-8 rounded-full flex items-center gap-5 shadow-2xl border border-white">
                <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-white">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-black tracking-widest text-slate-900 uppercase">{t('sunriseSatisfied')}</span>
                   <div className="flex -space-x-2 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                      ))}
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Right Side: Social Media Rail */}
          <motion.div 
            variants={floatingVariants(2.0)}
            initial="initial"
            animate="animate"
            className="absolute right-6 lg:right-24 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto"
          >
             <Magnetic strength={0.3}><SocialPill icon={<Camera size={20} />} label="Instagram" /></Magnetic>
             <Magnetic strength={0.3}><SocialPill icon={<Send size={20} />} label="Twitter" /></Magnetic>
             <Magnetic strength={0.3}><SocialPill icon={<MessageCircle size={20} />} label="Facebook" /></Magnetic>
          </motion.div>

          {/* Absolute Bottom Right: App Ecosystem */}
          <motion.div 
            variants={floatingVariants(2.2)}
            initial="initial"
            animate="animate"
            className="absolute right-6 lg:right-24 bottom-12 pointer-events-auto"
          >
             <div className="bg-white rounded-full p-3 flex items-center gap-8 shadow-2xl border border-slate-100">
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest pl-6">Get the app</span>
                <div className="flex items-center gap-3">
                   <Magnetic strength={0.4}><IconBtn icon={<Smartphone size={18} />} /></Magnetic>
                   <Magnetic strength={0.4}><IconBtn icon={<Play size={18} />} /></Magnetic>
                   <Magnetic strength={0.4}><IconBtn icon={<Download size={18} />} /></Magnetic>
                </div>
             </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
};

const SocialPill = ({ icon, label }) => (
  <motion.button 
    whileHover={{ x: -15, scale: 1.05 }}
    className="h-14 px-8 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full flex items-center gap-4 shadow-xl text-slate-900 transition-all duration-300 font-bold text-[13px] group"
  >
     <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-500 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap">
       {label}
     </span>
     {icon}
  </motion.button>
);

const IconBtn = ({ icon }) => (
  <button className="w-12 h-12 rounded-full border border-slate-100 hover:bg-slate-950 hover:text-white transition-all duration-500 flex items-center justify-center text-slate-900">
     {icon}
  </button>
);

export default SunriseHero;

