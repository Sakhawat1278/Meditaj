'use client';
import { useState, useRef, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { 
  Stethoscope, Beaker, Truck, Clock, 
  ShieldCheck, Activity, PhoneCall, Zap,
  ChevronLeft, ChevronRight, ArrowUpRight,
  Heart
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    icon: Stethoscope,
    tagline: "Instant",
    title: "MBBS Doctor",
    desc: "Direct access to board-certified experts.",
    btnText: "CALL NOW",
    link: "/instant",
    color: "#059669",
    bgColor: "#ecfdf5" // Light Mint
  },
  {
    icon: Beaker,
    tagline: "Specialist",
    title: "Doctor",
    desc: "Precision diagnostics with gold-standard accuracy.",
    btnText: "BOOK NOW",
    link: "/specialist",
    color: "#2563eb",
    bgColor: "#eff6ff" // Light Blue
  },
  {
    icon: Zap,
    tagline: "Shukhee",
    title: "HealthStore",
    desc: "Genuine medicine delivered with precision.",
    btnText: "BUY NOW",
    link: "/shop",
    color: "#d97706",
    bgColor: "#f7fee7" // Light Lime
  },
  {
    icon: Heart,
    tagline: "Service",
    title: "Nursing",
    desc: "Quality nursing care in the comfort of your home.",
    btnText: "BOOK NOW",
    link: "/nursing",
    color: "#7c3aed",
    bgColor: "#f5f3ff" // Light Purple
  },
  {
    icon: Truck,
    tagline: "Home",
    title: "Lab Test",
    desc: "Professional sample collection at your doorstep.",
    btnText: "PURCHASE NOW",
    link: "/labs",
    color: "#0891b2",
    bgColor: "#ecfeff" // Light Cyan
  },
  {
    icon: PhoneCall,
    tagline: "Emergency",
    title: "Ambulance",
    desc: "24/7 road and air ambulance coordination.",
    btnText: "CALL NOW",
    link: "/ambulance",
    color: "#dc2626",
    bgColor: "#fff1f2" // Light Rose
  }
];

const CurateServices = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    if (currentIndex < services.length - 4) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <section className="py-4 overflow-hidden select-none">
      <div className="max-w-[1825px] mx-auto px-4 lg:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-3">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-lg lg:text-xl font-medium text-[#1e4a3a] tracking-tight leading-tight uppercase"
            >
              Our Medical Services
            </motion.h2>
          </div>
        </div>

        {/* Services Slider Container */}
        <div className="relative group/slider">
          
          {/* Navigation Arrows (Absolute L/R) */}
          <button 
            onClick={prev}
            disabled={currentIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-40 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center transition-all ${currentIndex === 0 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 hover:bg-emerald-50 text-[#1e4a3a]'}`}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={next}
            disabled={currentIndex >= services.length - 4}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-40 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center transition-all ${currentIndex >= services.length - 4 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 hover:bg-emerald-50 text-[#1e4a3a]'}`}
          >
            <ChevronRight size={18} />
          </button>

          <div className="overflow-hidden">
            <motion.div 
              animate={{ x: `calc(-${currentIndex * 25}% - ${currentIndex * (24/4)}px)` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="flex gap-6 w-full pb-4 pt-1"
            >
              {services.map((service, idx) => (
                <motion.div
                  key={idx}
                  className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] flex-shrink-0 group"
                >
                  <div 
                    className="relative h-[160px] p-6 rounded-[8px] transition-all duration-500 flex flex-col group/card overflow-hidden border"
                    style={{ 
                      background: `linear-gradient(135deg, ${service.bgColor} 0%, #ffffff 100%)`,
                      borderColor: `${service.color}45`
                    }}
                  >
                    {/* Content Left */}
                    <div className="relative z-10">
                      <p className="text-[12px] font-medium text-slate-500 mb-1">{service.tagline}</p>
                      <h3 className="text-[20px] font-bold text-slate-800 leading-tight mb-4">
                        {service.title}
                      </h3>
                      
                      <div className="flex">
                        <Link 
                          href={service.link}
                          className="inline-flex items-center justify-between gap-2 text-[8px] font-bold uppercase tracking-widest text-white px-3 py-1.5 rounded-full transition-all group/btn min-w-[100px]"
                          style={{ backgroundColor: service.color }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <span>{service.btnText}</span>
                          <div className="transition-transform duration-300 group-hover/btn:-rotate-45">
                            <ChevronRight size={12} strokeWidth={3} />
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Icon Decorative on Right (Replacing the Image) */}
                    <div 
                      className="absolute right-[-10%] bottom-[-10%] opacity-10 group-hover/card:opacity-20 transition-opacity duration-500 rotate-[-12deg]"
                      style={{ color: service.color }}
                    >
                      <service.icon size={120} strokeWidth={1} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Progress bar removed as requested */}
      </div>
    </section>
  );
};

export default CurateServices;
