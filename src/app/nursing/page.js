'use client';
import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  User, Check, ChevronRight, Star, ShieldCheck, 
  Baby, Activity, HeartPulse, Stethoscope, Clock, Briefcase, Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';



export default function NursingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [liveCaregivers, setLiveCaregivers] = useState([]);
  const [nursingPackages, setNursingPackages] = useState([]);
  const [nursingTypes, setNursingTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Caregivers
    const qC = query(collection(db, 'nursing_providers'), where('status', '==', 'active'));
    const unC = onSnapshot(qC, (snap) => {
      setLiveCaregivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    // Packages
    const unP = onSnapshot(collection(db, 'nursing_packages'), (snap) => {
      setNursingPackages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Types
    const unT = onSnapshot(collection(db, 'nursing_types'), (snap) => {
      setNursingTypes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unC(); unP(); unT(); };
  }, []);

  const handleBooking = (caregiver) => {
    if (!user) {
      toast.error('Please login to book a caregiver');
      router.push('/login?redirect=/nursing');
      return;
    }

    const pkg = nursingPackages.find(p => p.id === selectedPackage);
    const type = nursingTypes.find(t => t.id === selectedType);

    // Direct Checkout Preparation
    const checkoutPayload = {
      type: 'nursing',
      items: [{
        id: `${caregiver.id}-${pkg.id}`,
        name: caregiver.name,
        price: pkg.price,
        type: 'nursing',
        category: type.label,
        providerName: `${pkg.label} ${pkg.duration}`
      }],
      totalAmount: pkg.price,
      patientName: profile?.userName || user.displayName || 'Patient',
      patientPhone: profile?.phone || '',
      date: new Date().toISOString(),
      time: 'Immediate Coordination'
    };

    sessionStorage.setItem('medita_checkout', JSON.stringify(checkoutPayload));
    router.push('/checkout');
  };

  return (
    <main className="min-h-screen bg-white font-sans text-[#1e4a3a] antialiased selection:bg-emerald-100">

      <div className="pt-24 lg:pt-32 pb-24 w-full max-w-[1825px] mx-auto px-4 lg:px-10">
        <div className="space-y-6">
          
          {/* --- Section: Select Caregiver Type --- */}
          <section className="space-y-3">
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Choose Nurse or Caregiver Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nursingTypes.map((type) => {
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-4 p-2 rounded-lg border transition-all duration-200 group ${
                      selectedType === type.id 
                      ? 'bg-emerald-50/50 border-[#10B981] ring-0.5 ring-[#10B981]' 
                      : 'bg-white border-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden ${selectedType === type.id ? 'bg-emerald-100' : 'bg-slate-50 transition-colors'}`}>
                      {type.image ? (
                        <img src={type.image} className="w-full h-full object-cover" />
                      ) : (
                        <Stethoscope className={selectedType === type.id ? 'text-[#10B981]' : 'text-slate-300'} size={20} />
                      )}
                    </div>
                    <span className={`text-[14px] font-semibold ${selectedType === type.id ? 'text-black' : 'text-slate-600 group-hover:text-[#1e4a3a]'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* --- Section: Select Package --- */}
          {selectedType && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Select Care Duration</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {nursingPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`flex flex-row justify-between items-center p-4 rounded-lg border transition-all duration-200 group ${
                      selectedPackage === pkg.id 
                      ? 'bg-emerald-50/50 border-[#10B981] ring-0.5 ring-[#10B981]' 
                      : 'bg-white border-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-black">{pkg.label}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{pkg.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Total</span>
                      <span className={`text-[15px] font-bold ${selectedPackage === pkg.id ? 'text-[#10B981]' : 'text-emerald-400'}`}>
                        ৳ {pkg.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* --- Section: Choose Caregiver --- */}
          {selectedType && selectedPackage ? (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Choose Nurse or Caregiver</h2>
                <p className="text-[12px] text-slate-500 font-medium">
                  {liveCaregivers.filter(c => c.specialty === nursingTypes.find(t => t.id === selectedType)?.label).length} caregivers available
                </p>
              </div>

              {/* Active Filters / Tags */}
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#1e4a3a] px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-widest">
                  {nursingTypes.find(t => t.id === selectedType)?.label}
                </div>
                <div className="bg-emerald-500 px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-widest">
                  {nursingPackages.find(p => p.id === selectedPackage)?.label} {nursingPackages.find(p => p.id === selectedPackage)?.duration}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning for available specialists...</p>
                  </div>
                ) : (() => {
                  const selectedTypeName = nursingTypes.find(t => t.id === selectedType)?.label;
                  const filtered = liveCaregivers.filter(c =>
                    c.specialty === selectedTypeName &&
                    (c.packages && c.packages.includes(selectedPackage))
                  );
                  return filtered.length > 0 ? filtered.map((caregiver) => {
                    const offeredPkgs = (caregiver.packages || []).map(pid => nursingPackages.find(p => p.id === pid)).filter(Boolean);
                    return (
                      <div
                        key={caregiver.id}
                        className="bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col group transition-all hover:border-slate-400"
                      >
                        <div className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-lg border border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center text-slate-200 group-hover:border-slate-200 transition-all overflow-hidden">
                            {caregiver.photoURL ? (
                              <img src={caregiver.photoURL} className="w-full h-full object-cover" />
                            ) : (
                              <User size={32} strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-bold text-slate-800 leading-snug">{caregiver.name}</h3>
                            {/* Experience badge */}
                            {caregiver.experience && (
                              <div className="flex items-center gap-1 mt-1">
                                <Briefcase size={10} className="text-emerald-500 shrink-0" />
                                <span className="text-[10px] font-bold text-emerald-600">{caregiver.experience} yr{caregiver.experience > 1 ? 's' : ''} experience</span>
                              </div>
                            )}
                            {/* Bio */}
                            {caregiver.bio && (
                              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mt-1">
                                {caregiver.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="px-4 pb-4 mt-auto">
                          <button
                            onClick={() => handleBooking(caregiver)}
                            className="w-full h-9 rounded-lg border border-slate-300 bg-white text-[#1e4a3a] text-[11px] font-bold uppercase tracking-wider hover:bg-[#1e4a3a] hover:border-[#1e4a3a] hover:text-white transition-all shadow-sm"
                          >
                            Book Profile
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">No Matching Specialists</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No caregiver offers this package for the selected type.</p>
                    </div>
                  );
                })()}
              </div>
            </motion.section>
          ) : (
            <div className="pt-10 border-t border-slate-100 flex flex-col items-center text-center">
               <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-200">
                  <HeartPulse size={32} />
               </div>
               <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Initial Configuration Required</p>
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">
                 Please select your {selectedType ? 'preferred package duration' : 'carepayer type'} above to see available specialists.
               </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
