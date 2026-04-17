'use client';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CurateButton from '@/components/UI/Buttons/CurateButton';

const slides = [
  {
    image: "/images/hero-bg.webp",
    title: "Healthcare",
    sub: "Solution"
  },
  {
    image: "/images/hero/sunrise_hero.webp",
    title: "Find Doctors",
    sub: "Everywhere"
  },
  {
    image: "/images/hero/hospital_hero.webp",
    title: "Book Lab",
    sub: "Tests"
  }
];

const CurateHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let timer;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        timer = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
      } else {
        clearInterval(timer);
      }
    }, { threshold: 0.1 });

    const el = document.querySelector('section');
    if (el) observer.observe(el);

    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="relative h-[600px] lg:h-[680px] w-full px-2 lg:px-4 pt-2 pb-4">
      
      {/* ── Main Rounded Container ── */}
      <div className="relative w-full h-full rounded-[16px] lg:rounded-[24px] overflow-hidden group">
        
        {/* Background Image Slider */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <Image 
                src={slides[currentSlide].image} 
                alt={slides[currentSlide].title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
                quality={95}
              />
            </motion.div>
          </AnimatePresence>
        </div>
          
        {/* --- Aesthetic Overlays (Linear Gradient Style) --- */}
        
        {/* Full Cinematic Gradient: Bottom-Left to Top-Right */}
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-emerald-950/80 via-emerald-900/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
 
        {/* ── Content Layer (Bottom Left) ── */}
        <div className="absolute bottom-10 left-8 lg:bottom-16 lg:left-16 z-20 max-w-6xl">
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 lg:space-y-8"
          >
            {/* Headline */}
            <h2 className="text-4xl lg:text-7xl font-normal text-white tracking-tight leading-[1.05]">
              {slides[currentSlide].title} <br />
              {slides[currentSlide].sub}
            </h2>
 
            {/* Subtext */}
            <p className="text-white/80 text-[14px] lg:text-[17px] leading-relaxed max-w-lg font-medium">
              We help patients access world-class clinical expertise, <br className="hidden lg:block" /> streamline diagnostic pathways, and manage <br className="hidden lg:block" /> healthcare with confidence.
            </p>
 
            {/* Action Button */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-2"
            >
              <CurateButton 
                href="/signup" 
                label="Get Started" 
                variant="secondary" 
                className="h-12 px-1 text-[12px]"
              />
            </motion.div>
          </motion.div>
        </div>
 
        {/* ── Trust Badge (Bottom Right) ── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-10 right-8 lg:bottom-16 lg:right-16 z-20 hidden md:block"
        >
          <div className="bg-white border border-slate-100 rounded-[18px] p-6 max-w-[240px] shadow-2xl shadow-emerald-950/10">
            <div className="flex -space-x-3 mb-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                  <Image src={`https://i.pravatar.cc/100?u=${i}`} alt="User" width={40} height={40} className="object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-white text-[12px] font-black shadow-sm">
                +
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[#1e4a3a] font-black text-2xl tracking-tighter">30k+</div>
              <div className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-snug">
                Happy clients we have world-wide.
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Navigation Dots (Bottom Middle) ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="group py-2 px-1 focus:outline-none"
              aria-label={`Cycle to slide ${idx + 1}`}
            >
              <div className={`transition-all duration-500 rounded-full h-1 ${currentSlide === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60'}`} />
            </button>
          ))}
        </div>

      </div>

    </section>
  );
};

export default CurateHero;
