'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import ScrollReveal from '@/components/UI/Motion/ScrollReveal';
import Magnetic from '@/components/UI/Motion/Magnetic';

const shortcuts = [
  { id: 'cold', titleKey: 'shortCold', image: '/images/shortcuts/cold.png', bgColor: 'bg-[#e7f6f7]' },
  { id: 'performance', titleKey: 'shortPerformance', image: '/images/shortcuts/performance.png', bgColor: 'bg-[#fff0f2]' },
  { id: 'skin', titleKey: 'shortSkin', image: '/images/shortcuts/skin.png', bgColor: 'bg-[#f4f1ff]' },
  { id: 'pregnancy', titleKey: 'shortPregnancy', image: '/images/shortcuts/pregnancy.png', bgColor: 'bg-[#fff2f9]' },
  { id: 'weight', titleKey: 'shortWeight', image: '/images/shortcuts/weight.png', bgColor: 'bg-[#fff9e6]' },
  { id: 'hair', titleKey: 'shortHair', image: '/images/shortcuts/hair.png', bgColor: 'bg-[#f0f3ff]' }
];

const SpecialtyShortcuts = () => {
  const { t } = useLanguage();
  const scrollRef = React.useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  };

  return (
    <ScrollReveal>
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t('shortTitle')}
            </h2>
            <div className="flex gap-4">
              <Magnetic strength={0.4}>
                <button 
                  onClick={() => scroll('left')}
                  className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
              </Magnetic>
              <Magnetic strength={0.4}>
                <button 
                  onClick={() => scroll('right')}
                  className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={24} />
                </button>
              </Magnetic>
            </div>
          </div>

          <motion.div 
            ref={scrollRef}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {shortcuts.map((item) => (
              <motion.div
                key={item.id}
                variants={cardVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative flex-shrink-0 w-[200px] md:w-[260px] h-[300px] md:h-[360px] ${item.bgColor} rounded-[32px] overflow-hidden group snap-start cursor-pointer transition-all duration-500 shadow-xl hover:shadow-2xl`}
              >
                <div className="p-8 relative z-20">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                    {t(item.titleKey)}
                  </h3>
                </div>

                {/* Character Image */}
                <div className="absolute bottom-0 left-0 w-full h-[75%] pointer-events-none select-none overflow-hidden">
                  <motion.img 
                    src={item.image} 
                    alt={t(item.titleKey)}
                    className="w-full h-full object-contain object-bottom translate-y-6 group-hover:translate-y-2 group-hover:scale-110 transition-all duration-700 ease-out"
                  />
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Accent Detail */}
                <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <ChevronRight size={20} className="text-slate-900" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default SpecialtyShortcuts;

