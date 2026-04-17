'use client';
import React, { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { 
  Heart, Activity, Brain, Droplets, 
  Stethoscope, Syringe, User, Pill,
  Baby, Scissors, Eye, Bone, Ear,
  Waves, Thermometer, Wind, Zap,
  ChevronRight, Info
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Static mapping for icons and colors based on specialty name/slug
const specialtyMetadata = {
  "Anesthesiology": { icon: Syringe, color: "#0d9488" },
  "Cardiology": { icon: Heart, color: "#e11d48" },
  "Colorectal Surgery": { icon: Activity, color: "#059669" },
  "Dentistry": { icon: Activity, color: "#0284c7" },
  "Dermatology": { icon: User, color: "#7c3aed" },
  "Endocrinology": { icon: User, color: "#b45309" },
  "Gastroenterology": { icon: Activity, color: "#0891b2" },
  "General Physician": { icon: Stethoscope, color: "#059669" },
  "General Surgery": { icon: Scissors, color: "#4f46e5" },
  "Gynaecology": { icon: Activity, color: "#db2777" },
  "Haematology": { icon: Droplets, color: "#be123c" },
  "Hepatology": { icon: Activity, color: "#0d9488" },
  "Internal medicine": { icon: Stethoscope, color: "#1e40af" },
  "Nephrology": { icon: Activity, color: "#0369a1" },
  "Neuromedicine": { icon: Brain, color: "#6366f1" },
  "Neurosurgery": { icon: Brain, color: "#4338ca" },
  "Nutritionist": { icon: Pill, color: "#d97706" },
  "Oncology": { icon: Activity, color: "#9f1239" },
  "Orthopedics": { icon: Bone, color: "#115e59" },
  "Otolaryngology(ENT)": { icon: Ear, color: "#0ea5e9" },
  "Pediatrics": { icon: Baby, color: "#f59e0b" },
  "Psychiatry": { icon: Brain, color: "#0ea5e9" },
  "Urology": { icon: Activity, color: "#be123c" }
};

const CurateCategories = () => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'specialties'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbSpecialties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Merge Strategy: Start with our curated list and update from DB, or use all DB items
      const finalSpecialties = dbSpecialties.length > 0 ? dbSpecialties.map(data => {
        // Resolve Icon
        let DynamicIcon = Info;
        const iconName = data.icon || '';
        const AllIcons = require('lucide-react');
        
        if (iconName && AllIcons[iconName]) {
          DynamicIcon = AllIcons[iconName];
        } else {
          // Fallback to metadata mapping by name
          DynamicIcon = specialtyMetadata[data.name]?.icon || Info;
        }

        return {
          ...data,
          icon: DynamicIcon,
          color: data.color || specialtyMetadata[data.name]?.color || "#64748b"
        };
      }) : Object.keys(specialtyMetadata).map(name => ({
        id: name,
        name,
        ...specialtyMetadata[name]
      }));

      setSpecialties(finalSpecialties);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      // Fallback to static data on error
      const staticData = Object.keys(specialtyMetadata).map(name => ({
        id: name,
        name,
        ...specialtyMetadata[name]
      }));
      setSpecialties(staticData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ensure the section NEVER disappears
  const displayList = specialties.length > 0 ? specialties : Object.keys(specialtyMetadata).map(name => ({
    id: name,
    name,
    ...specialtyMetadata[name]
  }));

  return (
    <section className="py-4 select-none bg-white">
      <div className="max-w-[1825px] mx-auto px-4 lg:px-10">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg lg:text-xl font-medium text-[#1e4a3a] tracking-tight uppercase">
            Specialist Doctor Categories
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayList.map((cat, idx) => {
            const bgColor = `${cat.color}08`; // Very light version for background
            
            return (
              <motion.div
                key={cat.id || idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                whileHover={{ 
                  backgroundColor: `${cat.color}15`,
                  borderColor: `${cat.color}40`
                }}
                className="rounded-xl border border-slate-200 transition-colors bg-white group cursor-pointer overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${bgColor} 0%, #ffffff 100%)`,
                  borderColor: `${cat.color}45`
                }}
              >
                <Link 
                  href={`/specialist?specialty=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-4 p-4 w-full h-full"
                >
                  <div 
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ color: cat.color }}
                  >
                    <cat.icon size={28} strokeWidth={1.2} />
                  </div>
                  <span className="text-[14px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default CurateCategories;
