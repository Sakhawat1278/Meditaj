'use client';
import React, { useState } from 'react';
import { m as motion } from 'framer-motion';
import { Search, MapPin, Calendar, ArrowRight, UserCheck, X } from 'lucide-react';
import CurateButton from '@/components/UI/Buttons/CurateButton';
import DatePicker from '@/components/UI/DatePicker';
import { useRouter } from 'next/navigation';
import { bdLocations } from '@/lib/locationData';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';

const CurateBookingGateway = () => {
  const router = useRouter();
  const [specialistName, setSpecialistName] = useState('');
  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showSpecDrop, setShowSpecDrop] = useState(false);
  const [showAreaDrop, setShowAreaDrop] = useState(false);

  // Fetch Specialties & Doctors for Suggestions
  React.useEffect(() => {
    if (!db) return;
    const unsubSpec = onSnapshot(collection(db, 'specialties'), (snapshot) => {
      setSpecialties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'specialty' })));
    });
    
    // Fetch doctors (less restrictive on status initially to ensure visibility)
    const qDoctors = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const unsubDocs = onSnapshot(qDoctors, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'doctor' })));
    });

    return () => {
      unsubSpec();
      unsubDocs();
    };
  }, []);

  // Filtered Suggestions - PRIORITIZE DOCTOR NAMES
  const specSuggestions = React.useMemo(() => {
    if (!specialistName.trim()) return [];
    const queryStr = specialistName.toLowerCase();
    
    // 1. Matched Doctors (by name or specialty)
    const matchedDocs = doctors.filter(d => 
      d.fullName?.toLowerCase().includes(queryStr) || 
      d.specialties?.some(s => s.toLowerCase().includes(queryStr))
    );

    // 2. Matched Specialties
    const matchedSpecs = specialties.filter(s => 
      s.name.toLowerCase().includes(queryStr)
    );

    // Return combined list with individual clinicians at the top
    return [...matchedDocs, ...matchedSpecs].slice(0, 8);
  }, [specialistName, specialties, doctors]);

  const areaSuggestions = React.useMemo(() => {
    if (!location.trim()) return [];
    const query = location.toLowerCase();
    const matches = [];
    for (const [div, districts] of Object.entries(bdLocations)) {
      for (const [dist, areas] of Object.entries(districts)) {
        areas.forEach(a => {
          if (a.toLowerCase().includes(query)) {
            matches.push({ area: a, district: dist, division: div });
          }
        });
      }
    }
    return matches.slice(0, 6);
  }, [location]);

  // Helper to find parent hierarchy for an area
  const findAreaHierarchy = (areaName) => {
    if (!areaName) return null;
    const lowerArea = areaName.toLowerCase().trim();
    for (const [div, districts] of Object.entries(bdLocations)) {
      for (const [dist, areas] of Object.entries(districts)) {
        if (areas.some(a => a.toLowerCase() === lowerArea)) {
          // Return the actual cased names from the object
          const actualArea = areas.find(a => a.toLowerCase() === lowerArea);
          return { division: div, district: dist, area: actualArea };
        }
      }
    }
    return null;
  };

  const handleSearch = (overrideSpec, overrideArea) => {
    const sName = (typeof overrideSpec === 'string' ? overrideSpec : specialistName) || '';
    const locName = (typeof overrideArea === 'string' ? overrideArea : location) || '';
    
    setErrorVisible(false);

    if (sName.trim()) {
      const params = new URLSearchParams();
      params.set('search', sName);
      if (preferredDate) params.set('date', preferredDate);
      router.push(`/specialist?${params.toString()}`);
    } else if (locName.trim()) {
      const hierarchy = findAreaHierarchy(locName);
      if (hierarchy) {
        const params = new URLSearchParams();
        params.set('division', hierarchy.division);
        params.set('district', hierarchy.district);
        params.set('area', hierarchy.area);
        if (preferredDate) params.set('date', preferredDate);
        router.push(`/labs?${params.toString()}`);
      } else {
        setErrorVisible(true);
      }
    } else {
      router.push('/specialist');
    }
  };

  return (
    <section className="w-full pt-0 pb-6 px-2 lg:px-4 bg-med-bg">
      <div className="w-full">
        
        {/* The Gateway Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-[16px] border border-slate-200 p-1"
        >
          {/* Search Inputs Grid */}
          <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 lg:gap-0 p-4 lg:p-5 items-center">
            
            {/* Field 1: Search */}
            <div className={`lg:pr-6 lg:border-r border-slate-200 space-y-1 relative transition-opacity duration-300 ${location.trim() ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Search size={10} className="text-emerald-500" /> Find Specialist
              </label>
              <div className="h-10 px-4 flex items-center bg-white border border-slate-200 rounded-full focus-within:border-[#1e4a3a] focus-within:ring-4 focus-within:ring-[#1e4a3a]/5 transition-all relative">
                <input 
                  type="text" 
                  placeholder="Neurologist, Dr. Smith"
                  value={specialistName}
                  onChange={(e) => setSpecialistName(e.target.value)}
                  onFocus={() => setShowSpecDrop(true)}
                  onBlur={() => setTimeout(() => setShowSpecDrop(false), 200)}
                  disabled={!!location.trim()}
                  className="w-full h-full text-[12px] font-medium outline-none placeholder:text-slate-300 text-slate-800 bg-transparent pr-8"
                />
                {specialistName && (
                  <button 
                    onClick={() => setSpecialistName('')}
                    className="absolute right-3 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown (Top) */}
              <AnimatePresence>
                {showSpecDrop && specSuggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 right-0 z-[100] bg-white border border-slate-200 rounded-[20px] shadow-2xl p-2 mb-2 overflow-hidden mx-4"
                  >
                    {/* Clinicians Section Header */}
                    {specSuggestions.some(s => s.type === 'doctor') && (
                      <div className="px-3 py-1 mb-1">
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">Medical Professionals</p>
                      </div>
                    )}

                    {specSuggestions.filter(s => s.type === 'doctor').map(s => (
                      <button 
                        key={s.id}
                        onMouseDown={() => {
                          setSpecialistName(s.fullName);
                          setShowSpecDrop(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-white flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-900/5 transition-colors">
                          <UserCheck size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-700 leading-tight">{s.fullName}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            {s.specialties?.[0] || 'Member Doctor'}
                          </p>
                        </div>
                      </button>
                    ))}

                    {/* Specialties Section Header */}
                    {specSuggestions.some(s => s.type === 'specialty') && (
                      <div className="px-3 py-1 mt-2 mb-1 border-t border-slate-50 pt-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Find by Specialty</p>
                      </div>
                    )}

                    {specSuggestions.filter(s => s.type === 'specialty').map(s => (
                      <button 
                        key={s.id}
                        onMouseDown={() => {
                          setSpecialistName(s.name);
                          setShowSpecDrop(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                          <Search size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-600 group-hover:text-[#1e4a3a] leading-tight transition-colors">{s.name}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">General Category</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`lg:px-6 lg:border-r border-slate-200 space-y-1 relative transition-opacity duration-300 ${specialistName.trim() ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-2"><MapPin size={10} className="text-blue-500" /> Area</span>
                {errorVisible && <span className="text-rose-500 lowercase font-bold italic animate-pulse">no area found</span>}
              </label>
              <div className={`h-10 px-4 flex items-center bg-white border rounded-full transition-all focus-within:ring-4 focus-within:ring-[#1e4a3a]/5 relative ${errorVisible ? 'border-rose-300 ring-rose-400/10' : 'border-slate-200 focus-within:border-[#1e4a3a]'}`}>
                <input 
                  type="text" 
                  placeholder="City or Postcode"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errorVisible) setErrorVisible(false);
                  }}
                  onFocus={() => setShowAreaDrop(true)}
                  onBlur={() => setTimeout(() => setShowAreaDrop(false), 200)}
                  disabled={!!specialistName.trim()}
                  className={`w-full h-full text-[12px] font-medium outline-none placeholder:text-slate-300 bg-transparent pr-8 ${errorVisible ? 'text-rose-500' : 'text-slate-800'}`}
                />
                {location && (
                  <button 
                    onClick={() => {
                      setLocation('');
                      setErrorVisible(false);
                    }}
                    className="absolute right-3 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Area Suggestions Dropdown (Top) */}
              <AnimatePresence>
                {showAreaDrop && areaSuggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 right-0 z-[100] bg-white border border-slate-200 rounded-[20px] shadow-2xl p-1.5 mb-2 overflow-hidden mx-4"
                  >
                    {areaSuggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onMouseDown={() => {
                          setLocation(s.area);
                          setShowAreaDrop(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-white flex items-center justify-center text-blue-500 transition-colors">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-700 leading-tight">{s.area}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.district}, {s.division}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Field 3: Date (Custom System DatePicker) */}
            <div className="lg:px-6 relative">
              <DatePicker 
                value={preferredDate}
                onChange={setPreferredDate}
                placeholder="Select Date"
                label="Preferred Date"
                icon={Calendar}
                position="top"
                className="!space-y-1"
                // We add some custom styles to override the DatePicker default input styling to match the grid
              />
              <style jsx global>{`
                .lg\\:px-8 .relative.w-full > div:first-child {
                  padding: 0 !important;
                  border: none !important;
                  height: auto !important;
                  background: transparent !important;
                  box-shadow: none !important;
                }
                .lg\\:px-8 .relative.w-full > label {
                  margin-left: 0 !important;
                  color: #64748b !important; /* slate-500 */
                }
                .lg\\:px-8 .relative.w-full span {
                  font-size: 12px !important;
                  font-weight: 500 !important;
                }
              `}</style>
            </div>

            {/* CTA */}
            <div className="lg:pl-6">
              <CurateButton 
                label="Search"
                variant="primary"
                onClick={() => handleSearch()}
                disabled={(!specialistName && !location) || !preferredDate}
                className="h-12 w-full lg:w-36 px-1 text-[12px]"
              />
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CurateBookingGateway;
