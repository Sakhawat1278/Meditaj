'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import CurateButton from '@/components/UI/Buttons/CurateButton';
import Image from 'next/image';

const slides = [
  {
    image: "/images/hero-bg.jpg",
    title: "Healthcare",
    sub: "Precision"
  },
  {
    image: "/images/hero/sunrise_hero.png",
    title: "Seamless",
    sub: "Diagnosis"
  },
  {
    image: "/images/hero/hospital_hero.png",
    title: "Expert",
    sub: "Treatment"
  }
];

const CurateHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[calc(100vh-88px)] w-full px-2 lg:px-3 pt-1 pb-3">
      
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
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ willChange: "transform" }}
              className="absolute inset-0 w-full h-full"
            >
              <Image 
                src={slides[currentSlide].image} 
                alt="Medical Background"
                fill
                priority={true}
                unoptimized={true}
                className="object-cover"
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
          {/* Multi-stage overlay for text legibility */}
          <div className="absolute inset-0 bg-black/30 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent z-10" />
        </div>

        {/* ── Content Layer (Curate Design Structure) ── */}
        <div className="relative z-20 w-full h-full flex flex-col justify-center px-8 lg:px-24">
          
          <div className="max-w-4xl space-y-10 lg:space-y-14">
            
            {/* Functional Badge */}
            <motion.div
              initial={currentSlide === 0 ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Diagnostic Framework 2.0</span>
            </motion.div>

            {/* Cinematic Headline */}
            <motion.div
              key={`content-${currentSlide}`}
              initial={currentSlide === 0 ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "opacity, transform" }}
              className="space-y-4"
            >
              <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black text-white leading-[0.85] tracking-[-0.04em] uppercase">
                {slides[currentSlide].title} <br />
                <span className="text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.4)]">Medical</span> <span className="text-emerald-400">Care</span>
              </h1>
              <p className="max-w-xl text-[13px] lg:text-[14px] font-bold text-white/40 uppercase tracking-[0.4em] leading-relaxed">
                Synchronizing expert clinical specialization with <br className="hidden lg:block" /> a fluid, patient-first diagnostic interface.
              </p>
            </motion.div>

            {/* High-End Action Group */}
            <motion.div 
              initial={currentSlide === 0 ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap items-center gap-8 pt-4"
            >
              <CurateButton 
                href="/signup" 
                label="Initiate Diagnosis" 
                variant="secondary" 
                className="h-16 px-12 text-[13px] shadow-2xl shadow-emerald-950/20"
              />
              <Link 
                href="/how-it-works" 
                className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.25em] text-white/40 hover:text-white transition-all"
              >
                <span>Our Protocol</span>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <ArrowRight size={18} />
                </div>
              </Link>
            </motion.div>

          </div>

        </div>

        {/* ── Precision Pagination Dots ── */}
        <div className="absolute bottom-12 left-12 lg:left-24 z-30 flex items-center gap-4">
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-700 rounded-full h-1 ${currentSlide === idx ? 'w-12 bg-emerald-400' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                aria-label={`Cycle to slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
            Phase 0{currentSlide + 1}
          </div>
        </div>

      </div>

    </section>
  );
};

export default CurateHero;
