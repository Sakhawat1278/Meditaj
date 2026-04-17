'use client';
import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, User, Stethoscope, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CustomDropdown from '@/components/UI/CustomDropdown';

import { useSearchParams } from 'next/navigation';

export default function SpecialistPage() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const preferredDate = searchParams.get('date');

  // Sync state with URL parameters
  useEffect(() => {
    const urlSpec = searchParams.get('specialty');
    const urlSearch = searchParams.get('search');
    
    if (urlSearch !== null) setSearchTerm(urlSearch);
    
    if (urlSpec) {
      // Robust match: try to find the specialty in the list once loaded, 
      // or just set it and let the dropdown handle the display.
      setSelectedSpecialty(urlSpec);
    } else {
      setSelectedSpecialty('All');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!db) return;
    onSnapshot(collection(db, 'specialties'), (snapshot) => {
      const fetchedSpecs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpecialties(fetchedSpecs);
      
      // If we have a specialty from the URL, try to find its exact casing from the DB
      const currentSpec = searchParams.get('specialty');
      if (currentSpec) {
        const exactMatch = fetchedSpecs.find(s => s.name?.toLowerCase() === currentSpec.toLowerCase());
        if (exactMatch) setSelectedSpecialty(exactMatch.name);
      }
    });

    const q = query(collection(db, 'users'), where('role', '==', 'doctor'), where('status', '==', 'approved'));
    onSnapshot(q, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  const specialtyOptions = React.useMemo(() => {
    // Only use DB specialties for the legitimate list
    const dbOptions = specialties.map(spec => ({ label: spec.name, value: spec.name }));
    
    // Safety: If selectedSpecialty is from URL but NOT in DB yet, 
    // we still want it to "show" in the dropdown so the user knows what they filtered for.
    const results = [
      { label: 'All Specialties', value: 'All' },
      ...dbOptions
    ];

    if (selectedSpecialty !== 'All' && !dbOptions.some(o => o.value === selectedSpecialty)) {
      results.push({ label: selectedSpecialty, value: selectedSpecialty });
    }

    return results;
  }, [specialties, selectedSpecialty]);

  const filteredDoctors = doctors.filter(doc => {
    const nameMatch = doc.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const specialtyMatch = selectedSpecialty === 'All' || doc.specialties?.includes(selectedSpecialty);
    return nameMatch && specialtyMatch;
  });

  // Check if a doctor is available on the preferred sub-date
  const isAvailableOnDate = (doctor, dateStr) => {
    if (!doctor || !dateStr) return true;
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Logic: If doctor has availableDays, check it. Otherwise assume available.
    if (doctor.availableDays && doctor.availableDays.length > 0) {
      return doctor.availableDays.includes(dayName);
    }
    return true; 
  };

  return (
    <main className="min-h-screen bg-[#FCFCFC] font-sans text-[#1e4a3a] selection:bg-emerald-50">

      <div className="pt-28 lg:pt-36 pb-24 w-full max-w-[1825px] mx-auto px-4 lg:px-10">
        {/* --- Header Controls --- */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-8 pb-4 border-b border-zinc-200">
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-end">
            <div className="w-full sm:w-64 text-left">
              <CustomDropdown
                label="Select Specialty"
                options={specialtyOptions}
                value={selectedSpecialty}
                onChange={setSelectedSpecialty}
                placeholder="Choose specialty"
                icon={Stethoscope}
                searchable
              />
            </div>

            <div className="w-full sm:w-64 text-left">
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-0.5 mb-1.5 block">
                Search Doctor
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Type doctor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 px-5 bg-white border border-zinc-300 rounded-full text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-emerald-500 transition-colors" size={14} />
              </div>
            </div>
          </div>

          <div className="text-right whitespace-nowrap hidden md:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-600 tracking-tight">{filteredDoctors.length}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Doctors available</span>
            </div>
          </div>
        </div>

        {/* --- Doctors Grid --- */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDoctors.map((doctor) => (
                <DoctorCardItem 
                  key={doctor.id} 
                  doctor={doctor} 
                  showDateAlert={preferredDate && !isAvailableOnDate(doctor, preferredDate)}
                  preferredDate={preferredDate}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
              <Stethoscope size={32} strokeWidth={1} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              No specialists found
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              We couldn't find any specialist in <b>{selectedSpecialty === 'All' ? 'any specialty' : selectedSpecialty}</b> matching your search. Try adjusting your filters or checking back later.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20 text-slate-200 animate-pulse text-sm font-medium">
            Fetching specialists...
          </div>
        )}
      </div>
    </main>
  );
}

function DoctorCardItem({ doctor, showDateAlert, preferredDate }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`bg-white border rounded-lg overflow-hidden flex flex-col hover:bg-slate-50 transition-colors relative ${showDateAlert ? 'border-amber-200' : 'border-zinc-300'}`}
    >
      {/* Date Availability Alert */}
      {showDateAlert && (
        <div className="bg-amber-50 border-b border-amber-100 px-3 py-2 flex items-start gap-2.5">
          <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider leading-tight">
              Booking unavailable
            </span>
            <span className="text-[9px] font-bold text-amber-600/80">
              Not available on {new Date(preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Please choose another date for this clinician.
            </span>
          </div>
        </div>
      )}

      <div className="p-3 flex gap-3">
        {/* Profile Image (Minimal Height) */}
        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-zinc-300 bg-slate-50 flex items-center justify-center relative">
          {doctor.photoURL ? (
            <img src={doctor.photoURL} alt={doctor.fullName} className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-slate-200" />
          )}
        </div>

        {/* Info Right Stack */}
        <div className="flex-1 flex flex-col min-w-0 text-left">
          <h3 className="text-[14px] font-semibold text-slate-800 truncate mb-0">
            {doctor.fullName}
          </h3>
          <p className="text-[10px] font-normal text-slate-400 line-clamp-1 mb-2">
            {doctor.degrees?.join(', ') || 'Specialist'}
          </p>
          
          <div className="inline-flex self-start px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-bold uppercase tracking-wider border border-emerald-100/30">
            {doctor.specialties?.[0] || 'Clinical'}
          </div>

          <div className="mt-auto pt-1">
            <span className="text-[14px] font-bold text-emerald-600 tracking-tight leading-none">
              ৳ {Number(doctor.fee || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Area (Reduced Height) */}
      <div className="mt-auto py-2 px-3 border-t border-zinc-300 flex items-center justify-between">
        <div className="text-[10px] text-emerald-600/80 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">
          <span className="font-bold">{doctor.experience || '0'} Years</span> Exp
        </div>
        
        <Link 
          href={`/specialist/${doctor.id}?date=${preferredDate || ''}`}
          className={`h-7 px-3 border rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center justify-center transition-all whitespace-nowrap
            ${showDateAlert 
              ? 'border-amber-400 text-amber-600 hover:bg-amber-400 hover:text-white' 
              : 'border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
        >
          {showDateAlert ? 'See Schedule' : 'Book Now'}
        </Link>
      </div>
    </motion.div>
  );
}
