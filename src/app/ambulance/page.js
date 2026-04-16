'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ambulance, Navigation, MapPin, Clock, ShieldCheck, 
  Phone, AlertTriangle, ChevronRight, FileText, Check, Calendar, ArrowRight, Info
} from 'lucide-react';
import LandingNavbar from '@/components/Home/LandingNavbar';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CustomDropdown from '@/components/UI/CustomDropdown';
import DatePicker from '@/components/UI/DatePicker';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AmbulancePage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [bookingData, setBookingData] = useState({
    category: '',
    dateTime: '',
    phone: '',
    pickupAddress: '',
    dropoffAddress: '',
  });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const ambulanceCategories = [
    { value: 'ac', label: 'AC Ambulance', price: 2500 },
    { value: 'non-ac', label: 'Non-AC Ambulance', price: 1500 },
    { value: 'icu', label: 'ICU / Ventilator', price: 8000 },
    { value: 'freezer', label: 'Freezer Van', price: 5000 },
  ];

  const handleRequestAmbulance = async () => {
    if (!bookingData.category || !bookingData.dateTime || !bookingData.phone || !bookingData.pickupAddress || !bookingData.dropoffAddress) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!agreedTerms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = ambulanceCategories.find(c => c.value === bookingData.category);
      
      const bookingRecord = {
        patientId: user?.uid || 'guest',
        patientName: user?.fullName || 'Guest User',
        phone: bookingData.phone,
        category: selectedCat.label,
        pickupAddress: bookingData.pickupAddress,
        dropoffAddress: bookingData.dropoffAddress,
        dateTime: bookingData.dateTime,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'ambulance_bookings'), bookingRecord);
      
      setBookingSuccess(true);
      toast.success('Ambulance requested successfully!');
      setBookingData({
        category: '',
        dateTime: '',
        phone: '',
        pickupAddress: '',
        dropoffAddress: '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-emerald-100">
        <LandingNavbar />

        <div className="pt-40 lg:pt-56 pb-16 container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* LEFT CONTENT: Booking Information Form (50%) */}
            <div className="lg:col-span-6 space-y-8 order-1">
              {/* Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100/50">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900">{t('bookingInformation')}</h1>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Please fill out the details below</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <CustomDropdown
                    label={t('ambulanceCategory') + " *"}
                    options={ambulanceCategories}
                    value={bookingData.category}
                    onChange={(val) => setBookingData({ ...bookingData, category: val })}
                    placeholder="Select Category"
                    icon={Ambulance}
                  />
                  <DatePicker
                    label={t('selectDateTime') + " *"}
                    value={bookingData.dateTime}
                    onChange={(val) => setBookingData({ ...bookingData, dateTime: val })}
                    placeholder="Select date"
                    icon={Calendar}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">
                    {t('phoneLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      placeholder="e.g. 01XXXXXXXXX"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-med-primary/40 transition-all text-[12px] font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      <Phone size={12} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">
                      {t('pickupAddress')} *
                    </label>
                    <textarea
                      value={bookingData.pickupAddress}
                      onChange={(e) => setBookingData({ ...bookingData, pickupAddress: e.target.value })}
                      placeholder="House/Road, Area, City..."
                      rows={2}
                      className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-med-primary/40 transition-all text-[12px] font-medium resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">
                      {t('dropoffAddress')} *
                    </label>
                    <textarea
                      value={bookingData.dropoffAddress}
                      onChange={(e) => setBookingData({ ...bookingData, dropoffAddress: e.target.value })}
                      placeholder="Destination Hospital name or address..."
                      rows={2}
                      className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-med-primary/40 transition-all text-[12px] font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR: What to Expect + Action (50%) */}
            <aside className="lg:col-span-6 space-y-6 lg:sticky lg:top-32 order-2">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">{t('whatToExpect')}</h2>
                </div>

                {/* White Hotline Information at Top */}
                <div className="p-4 bg-white border border-slate-300 rounded-xl flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                   <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                      <Phone size={18} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Direct Hotline</h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-black tracking-tight text-slate-900 leading-none">10657</p>
                        <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider leading-none">24/7 Service</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    "Our Customer Service team will contact you within 15 minutes to confirm your booking.",
                    "We aim to dispatch an ambulance quickly, but arrival times may vary due to traffic or other conditions.",
                    "All personal details are kept strictly confidential and used only for service delivery and quality checks.",
                    "There will be a direct call from the driver to confirm your pickup location, then safe transport with a trained attendant onboard."
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 items-start bg-slate-50 border border-slate-300 rounded-lg transition-all group">
                      <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Disclaimer & Action Block (Moved Here) */}
                <div className="pt-6 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-300">
                  <div className="flex gap-4 items-start p-3 bg-white border border-slate-300 rounded-lg">
                    <div className="w-7 h-7 rounded bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                       <AlertTriangle size={12} />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                      Meditaj will process your ambulance service request through its partners; however, for any grievous emergency, please contact the national <span className="text-slate-900 font-bold">999</span> emergency helpline directly.
                    </p>
                  </div>
                  
                  <div className="space-y-5">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input 
                          type="checkbox"
                          checked={agreedTerms}
                          onChange={(e) => setAgreedTerms(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-4 h-4 border border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-all flex items-center justify-center text-white bg-slate-50 group-hover:border-slate-400">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed max-w-md">
                        {t('agreeTermsDesc')}
                      </span>
                    </label>

                    <button 
                      onClick={handleRequestAmbulance}
                      disabled={!agreedTerms || isSubmitting}
                      className={`w-full h-12 rounded-lg font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 border ${
                        agreedTerms && !isSubmitting
                        ? 'bg-slate-950 text-white hover:bg-emerald-600 border-slate-800 hover:border-emerald-700' 
                        : 'bg-slate-100 text-slate-300 border-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? 'Processing...' : t('requestAmbulance')}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      
      <AnimatePresence>
        {bookingSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setBookingSuccess(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-sm bg-white rounded-2xl p-8 text-center border border-slate-300"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 border border-emerald-100">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Request Received</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed mb-8">
                Your request for an ambulance has been submitted. Our team will contact you within 15 minutes to confirm assignment.
              </p>
              <button 
                onClick={() => setBookingSuccess(false)}
                className="w-full h-12 bg-slate-950 text-white rounded-xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-emerald-600 transition-all border border-slate-800"
              >
                Back to Form
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
