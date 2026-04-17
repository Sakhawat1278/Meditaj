'use client';
import { useState } from 'react';
import { m as motion } from 'framer-motion';
import { 
  Activity, Heart, Wind, Thermometer, 
  Brain, Droplets, ChevronLeft, ChevronRight, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

const diseases = [
  {
    icon: Thermometer,
    title: "Cold, Cough,\nAllergy & Fever",
    desc: "Immediate care for seasonal fevers.",
    link: "/specialist?specialty=Internal%20medicine",
    color: "#0d9488",
    bgColor: "#f0fdfa"
  },
  {
    icon: Wind, // Activity or Wind?
    title: "Performance\nIssues in Bed",
    desc: "Confidential sexual health consultations.",
    link: "/specialist?specialty=Urology",
    color: "#be123c",
    bgColor: "#fff1f2"
  },
  {
    icon: Droplets,
    title: "Itching, Acne &\nSkin problems",
    desc: "Advanced dermatological solutions.",
    link: "/specialist?specialty=Dermatology",
    color: "#6d28d9",
    bgColor: "#f5f3ff"
  },
  {
    icon: Heart,
    title: "Period doubts\nor Pregnancy",
    desc: "Specialized gynecological care.",
    link: "/specialist?specialty=Gynaecology",
    color: "#db2777",
    bgColor: "#fdf2f8"
  },
  {
    icon: Activity,
    title: "Weight\nlose/gain, Die...",
    desc: "Nutrition and lifestyle planning.",
    link: "/specialist?specialty=Nutritionist",
    color: "#b45309",
    bgColor: "#fffbeb"
  },
  {
    icon: Activity, // Hair Fall usually Skin/Derma
    title: "Hair fall and\nDandruff",
    desc: "Scalp and hair health restoration.",
    link: "/specialist?specialty=Dermatology",
    color: "#1e40af",
    bgColor: "#eff6ff"
  },
  {
    icon: Brain,
    title: "Depression &\nAnxiety",
    desc: "Support for mental health and well-being.",
    link: "/specialist?specialty=Psychiatry",
    color: "#0ea5e9",
    bgColor: "#f0f9ff"
  },
  {
    icon: Activity,
    title: "Abdominal\nPain, Acidity ...",
    desc: "Care for stomach and digestive issues.",
    link: "/specialist?specialty=Gastroenterology",
    color: "#0d9488",
    bgColor: "#f0fdfa"
  },
  {
    icon: Heart,
    title: "Child Feeling\nUnwell",
    desc: "Dedicated pediatric care for children.",
    link: "/specialist?specialty=Pediatrics",
    color: "#f59e0b",
    bgColor: "#fffbeb"
  },
  {
    icon: Activity,
    title: "Headache &\nBody Pain",
    desc: "Treatment for aches and neurological pain.",
    link: "/specialist?specialty=Neuromedicine",
    color: "#6366f1",
    bgColor: "#eef2ff"
  }
];

const CurateDiseases = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    if (currentIndex < diseases.length - 6) {
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
              Most Common Diseases
            </motion.h2>
          </div>
        </div>

        {/* Diseases Slider Container */}
        <div className="relative group/slider">
          
          {/* Navigation Arrows */}
          <button 
            onClick={prev}
            disabled={currentIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-40 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center transition-all ${currentIndex === 0 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 hover:bg-emerald-50 text-[#1e4a3a]'}`}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={next}
            disabled={currentIndex >= diseases.length - 6}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-40 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center transition-all ${currentIndex >= diseases.length - 6 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 hover:bg-emerald-50 text-[#1e4a3a]'}`}
          >
            <ChevronRight size={18} />
          </button>

          <div className="overflow-hidden">
            <motion.div 
              animate={{ x: `calc(-${currentIndex * 16.666}% - ${currentIndex * (30/6)}px)` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="flex gap-6 w-full pb-4 pt-1"
            >
              {diseases.map((disease, idx) => (
                <motion.div
                  key={idx}
                  className="w-full md:w-[calc(33.33%-16px)] lg:w-[calc(16.666%-20px)] flex-shrink-0 group"
                >
                  <div 
                    className="relative h-[180px] p-5 rounded-[8px] transition-all duration-500 flex flex-col group/card overflow-hidden border"
                    style={{ 
                      background: `linear-gradient(135deg, ${disease.bgColor} 0%, #ffffff 100%)`,
                      borderColor: `${disease.color}45`
                    }}
                  >
                    {/* Title Top Left */}
                    <div className="relative z-10">
                      <h3 className="text-[18px] font-bold text-slate-800 leading-[1.2] whitespace-pre-line">
                        {disease.title}
                      </h3>
                    </div>

                    {/* Button Bottom Right */}
                    <div className="mt-auto flex justify-end relative z-10">
                      <Link 
                        href={disease.link}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white transition-all group/btn"
                        style={{ backgroundColor: disease.color }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="transition-transform duration-300 group-hover/btn:-rotate-45">
                          <ChevronRight size={16} strokeWidth={3} />
                        </div>
                      </Link>
                    </div>

                    {/* Icon Decorative at Bottom (Replacing Image) */}
                    <div 
                      className="absolute bottom-[-10%] left-[-5%] opacity-15 group-hover/card:opacity-25 transition-opacity duration-500"
                      style={{ color: disease.color }}
                    >
                      <disease.icon size={110} strokeWidth={1} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurateDiseases;
