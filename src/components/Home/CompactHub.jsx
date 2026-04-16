'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import ScrollReveal from '@/components/UI/Motion/ScrollReveal';

const CompactHub = () => {
  const { t } = useLanguage();

  const services = [
    { id: 'instant', key: 'featMbbs', cat: 'featInstant', img: '/images/features/instant.png', color: 'bg-[#f0f8f4]', link: '/ambulance', btn: 'featBooking' },
    { id: 'specialist', key: 'featDoctor', cat: 'featSpecialist', img: '/images/features/specialist.png', color: 'bg-[#f4f8fb]', link: '/specialist', btn: 'featBooking' },
    { id: 'store', key: 'featHStore', cat: 'featStore', img: '/images/features/store.png', color: 'bg-[#f9faf2]', link: '/shop', btn: 'featFlash' },
    { id: 'mental', key: 'featWellness', cat: 'featMental', img: '/images/features/wellness.png', color: 'bg-[#f5f5fe]', link: '/nursing', btn: 'featBooking' },
    { id: 'labs', key: 'featLabs', cat: 'featHome', img: '/images/features/labs.png', color: 'bg-[#fef4f4]', link: '/labs', btn: 'featBooking' },
    { id: 'ambulance', key: 'featAmbulance', cat: 'featHome', img: '/images/features/ambulance.png', color: 'bg-[#f2fafd]', link: '/ambulance', btn: 'featBooking' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  return (
    <ScrollReveal>
      <section className="py-24 bg-white selection:bg-emerald-50 relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />
        
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          
          {/* Compressed Header */}
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('heroSecondaryCTA')}</h2>
              <div className="h-6 w-[2px] bg-slate-100" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{services.length} Specialized Hubs</span>
            </div>
            <Link href="/services" className="group flex items-center gap-2 text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
              View All
              <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
            </Link>
          </div>

          {/* High-Density Matrix Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {services.map((svc) => (
              <motion.div
                key={svc.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative h-[120px] md:h-[130px] ${svc.color} border border-slate-100 rounded-[24px] overflow-hidden group transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer`}
              >
                {/* Content Overlay */}
                <div className="relative z-10 px-6 py-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t(svc.cat)}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/30" />
                    </div>
                    <h3 className="text-[17px] md:text-[18px] font-black text-slate-900 leading-none uppercase tracking-tight group-hover:text-emerald-600 transition-colors duration-300">
                      {t(svc.key)}
                    </h3>
                  </div>

                  <div className="flex">
                    <Link href={svc.link} className="inline-flex items-center gap-2 text-med-primary text-[10px] font-black uppercase tracking-[0.15em] hover:text-slate-950 transition-colors group/btn">
                      {t(svc.btn)}
                      <ArrowUpRight size={14} className="stroke-[3] group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Minimal Image Placement */}
                <div className="absolute top-0 right-0 h-full w-2/5 pointer-events-none select-none overflow-hidden">
                  <motion.img 
                    src={svc.img} 
                    alt={t(svc.key)}
                    className="h-full w-full object-contain object-right-bottom translate-y-4 translate-x-2 group-hover:scale-110 group-hover:translate-y-2 group-hover:translate-x-0 transition-all duration-700 ease-out"
                  />
                </div>

                {/* Hover Line Accent */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-emerald-500 transition-all duration-700 ease-out group-hover:w-full" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default CompactHub;

