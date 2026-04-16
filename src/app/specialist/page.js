'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, User, Stethoscope } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LandingNavbar from '@/components/Home/LandingNavbar';
import CustomDropdown from '@/components/UI/CustomDropdown';

import { useSearchParams } from 'next/navigation';

export default function SpecialistPage() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    if (!db) return;
    onSnapshot(collection(db, 'specialties'), (snapshot) => {
      setSpecialties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const q = query(collection(db, 'users'), where('role', '==', 'doctor'), where('status', '==', 'approved'));
    if (db) {
      onSnapshot(q, (snapshot) => {
        setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const specialtyOptions = [
    { label: 'All Specialties', value: 'All' },
    ...specialties.map(spec => ({ label: spec.name, value: spec.name }))
  ];

  const filteredDoctors = doctors.filter(doc => {
    const nameMatch = doc.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const specialtyMatch = selectedSpecialty === 'All' || doc.specialties?.includes(selectedSpecialty);
    return nameMatch && specialtyMatch;
  });

  return (
    <main className="min-h-screen bg-[#FCFCFC] font-sans text-slate-900 selection:bg-emerald-50">
      <LandingNavbar />

      <div className="pt-52 pb-24 px-4 lg:px-6 container mx-auto">
        {/* --- Header Controls --- */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-8 pb-4 border-b border-zinc-200">
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-end">
            <div className="w-full sm:w-64">
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

            <div className="w-full sm:w-64">
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-0.5 mb-1.5 block">
                Search Doctor
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Type doctor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 px-4 bg-white border border-zinc-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDoctors.map((doctor) => (
              <DoctorCardItem key={doctor.id} doctor={doctor} />
            ))}
          </AnimatePresence>
        </div>

        {loading && (
          <div className="flex justify-center py-20 text-slate-200 animate-pulse text-sm font-medium">
            Fetching specialists...
          </div>
        )}
      </div>
    </main>
  );
}

function DoctorCardItem({ doctor }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white border border-zinc-300 rounded-lg overflow-hidden flex flex-col hover:bg-slate-50 transition-colors"
    >
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
        <div className="flex-1 flex flex-col min-w-0">
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
          href={`/specialist/${doctor.id}`}
          className="h-7 px-3 border border-emerald-500 text-emerald-600 rounded-md text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap flex items-center justify-center"
        >
          Book Now
        </Link>
      </div>
    </motion.div>
  );
}
