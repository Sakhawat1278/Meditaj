'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, CreditCard, ArrowRight, X, 
  CheckCircle2, Loader2, Info, Lock, Zap,
  ShoppingCart, Calendar, MapPin, Phone,
  Check, Copy, Smartphone, Wallet, ChevronRight
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import LandingNavbar from '@/components/Home/LandingNavbar';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const savedData = sessionStorage.getItem('medita_checkout');
    if (!savedData) {
      toast.error('No pending booking found');
      router.push('/');
      return;
    }
    setCheckoutData(JSON.parse(savedData));

    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
      setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.status === 'active'));
    });

    return () => unsubscribe();
  }, [isMounted, router]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleFinalizeBooking = async () => {
    if (!user) {
      toast.error('Session expired. Please login again.');
      return;
    }
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }
    if (!trxId) {
      toast.error('Please enter the Transaction ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalBooking = {
        ...checkoutData,
        userId: user.uid,
        userName: profile?.fullName || user.email || 'Patient',
        paymentMethod: selectedPayment.provider,
        trxId: trxId,
        status: 'pending',
        paymentStatus: 'pending_verification',
        createdAt: serverTimestamp(),
      };

      let collectionName = 'appointments';
      if (checkoutData.type === 'lab') collectionName = 'lab_bookings';
      if (checkoutData.type === 'nursing') collectionName = 'nursing_bookings';
      
      await addDoc(collection(db, collectionName), finalBooking);
      
      setIsSuccess(true);
      sessionStorage.removeItem('medita_checkout');
      toast.success('Successfully booked!');
      
      setTimeout(() => {
        router.push('/dashboard/patient');
      }, 5000);

    } catch (error) {
      console.error(error);
      toast.error('Booking failed. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!checkoutData) return null;

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center max-w-md text-center"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center mb-8 border border-emerald-200">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight uppercase">Booking Confirmed</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest leading-loose mb-8 text-[11px]">
            Your scheduling request has been received. Our clinical team is verifying your payment. 
            Redirecting to dashboard...
          </p>
          <button 
            onClick={() => router.push('/dashboard/patient')} 
            className="h-12 px-10 bg-slate-950 text-white rounded-lg font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all"
          >
            Enter Dashboard
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />

      <div className="pt-52 pb-12 w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="w-full">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-white border border-black">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase">Secure Checkout</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} className="text-emerald-500" /> 
                Professional Grade Encryption Enabled
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* LEFT COLUMN: ORDER SUMMARY & CONTEXT */}
            <div className="space-y-6">
              {/* Booking Context */}
              <div className="bg-white border border-slate-300 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Booking Context</h3>
                  <div className="p-1.5 bg-slate-50 rounded-lg"><Phone className="text-slate-400" size={14} /></div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-950 shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Schedule</p>
                      <p className="text-[13px] font-bold text-slate-900 tracking-tight">{checkoutData.date || 'Today (Instant)'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{checkoutData.time || 'As soon as possible'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-950 shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Verified Contact</p>
                      <p className="text-[14px] font-black text-slate-900 tracking-widest font-mono">{checkoutData.patientPhone || 'N/A'}</p>
                    </div>
                  </div>
                  {checkoutData.location && (
                    <div className="flex items-start gap-4 pt-4 border-t border-slate-200">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-950 shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Point of Service</p>
                        <p className="text-[12px] font-bold text-slate-700 leading-relaxed tracking-tight">{checkoutData.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Order Summary</h3>
                  <span className="text-[9px] font-black bg-slate-950 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                    {checkoutData.type || 'Clinical'}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {checkoutData.items ? (
                      checkoutData.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-[13px] font-bold text-slate-900 tracking-tight">{item.name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-none mt-1">{item.type} • {item.category || item.providerName}</p>
                            </div>
                          </div>
                          <span className="text-[13px] font-black text-slate-950 font-mono tracking-tighter">৳{item.price}</span>
                        </div>
                      ))
                    ) : checkoutData.type === 'lab' ? (
                      checkoutData.tests?.map((test, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-bold text-slate-800">{test.name}</span>
                          </div>
                          <span className="text-[13px] font-black text-slate-950 font-mono tracking-tighter">৳{test.price}</span>
                        </div>
                      ))
                    ) : checkoutData.type === 'nursing' ? (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 tracking-tight">{checkoutData.caregiverName || 'Care Specialist'}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{checkoutData.packageName}</p>
                          </div>
                        </div>
                        <span className="text-[14px] font-black text-slate-950 font-mono tracking-tighter">৳{checkoutData.fees}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 tracking-tight">{checkoutData.doctorName || 'General Doctor'}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{checkoutData.specialtyName || checkoutData.specialty}</p>
                          </div>
                        </div>
                        <span className="text-[14px] font-black text-slate-950 font-mono tracking-tighter">৳{checkoutData.fees}</span>
                      </div>
                    )}

                    {checkoutData.discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-200 pt-4">
                        <span className="text-[10px] uppercase tracking-widest flex items-center gap-2"><Zap size={10} /> Promotion Applied</span>
                        <span className="text-[13px] font-mono">- ৳{checkoutData.discount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t border-slate-300">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Amount</span>
                    <span className="text-[24px] font-black text-slate-900 font-mono tracking-tighter">৳{checkoutData.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PAYMENT ACTIONS */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-300 rounded-xl p-6 lg:p-8 xl:sticky xl:top-40 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
                
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Select Payment</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Gateway</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method)}
                        className={`group relative h-14 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedPayment?.id === method.id ? 'bg-white border-slate-950 scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                      >
                        <div className={`w-10 h-10 flex items-center justify-center transition-all ${selectedPayment?.id === method.id ? 'scale-110' : ''}`}>
                          {method.provider.toLowerCase() === 'bkash' ? (
                            <Smartphone size={24} className={selectedPayment?.id === method.id ? 'text-[#E2136E]' : 'text-slate-400'} />
                          ) : method.provider.toLowerCase() === 'nagad' ? (
                            <Wallet size={24} className={selectedPayment?.id === method.id ? 'text-[#F7941D]' : 'text-slate-400'} />
                          ) : method.provider.toLowerCase() === 'rocket' ? (
                            <Zap size={24} className={selectedPayment?.id === method.id ? 'text-[#8B318F]' : 'text-slate-400'} />
                          ) : (
                            <CreditCard size={24} className="text-slate-400" />
                          )}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${selectedPayment?.id === method.id ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-900'}`}>
                          {method.provider}
                        </span>
                        {selectedPayment?.id === method.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-950 rounded-full flex items-center justify-center text-white border border-white">
                            <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedPayment && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-slate-50 rounded-lg p-5 border border-slate-300 space-y-5"
                      >
                        <div className="space-y-6">
                          {/* Payment Configuration Header */}
                          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                              <h3 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em]">Transaction Setup</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <ShieldCheck size={10} className="text-emerald-500" /> Secure Clinical Gateway
                              </p>
                            </div>
                            <span className="text-[9px] font-black bg-slate-950 text-white px-3 py-1 rounded uppercase tracking-[0.1em] shadow-sm">
                              {selectedPayment.type || 'Personal'}
                            </span>
                          </div>

                          {/* Instruction Unit */}
                          <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                            selectedPayment.provider?.toLowerCase() === 'bkash' ? 'bg-[#fdf2f8] border-pink-200' :
                            selectedPayment.provider?.toLowerCase() === 'nagad' ? 'bg-[#fff7ed] border-orange-200' :
                            selectedPayment.provider?.toLowerCase() === 'rocket' ? 'bg-[#faf5ff] border-purple-200' :
                            'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-start gap-5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 ${
                                selectedPayment.provider?.toLowerCase() === 'bkash' ? 'bg-white border-pink-100 text-pink-600' :
                                selectedPayment.provider?.toLowerCase() === 'nagad' ? 'bg-white border-orange-100 text-orange-600' :
                                selectedPayment.provider?.toLowerCase() === 'rocket' ? 'bg-white border-purple-100 text-purple-600' :
                                'bg-white border-slate-100 text-slate-400'
                              } shadow-sm transition-colors`}>
                                <Info size={22} strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ${
                                  selectedPayment.provider?.toLowerCase() === 'bkash' ? 'text-pink-400' :
                                  selectedPayment.provider?.toLowerCase() === 'nagad' ? 'text-orange-400' :
                                  selectedPayment.provider?.toLowerCase() === 'rocket' ? 'text-purple-400' :
                                  'text-slate-400'
                                }`}>Instruction 01</p>
                                <p className={`text-[13px] font-bold leading-relaxed tracking-tight ${
                                  selectedPayment.provider?.toLowerCase() === 'bkash' ? 'text-pink-950' :
                                  selectedPayment.provider?.toLowerCase() === 'nagad' ? 'text-orange-950' :
                                  selectedPayment.provider?.toLowerCase() === 'rocket' ? 'text-purple-950' :
                                  'text-slate-900'
                                }`}>
                                  Open your <span className="font-black border-b-2 border-current">{selectedPayment.provider}</span> app and choose 
                                  <span className="inline-flex px-2 py-0.5 bg-white border border-current rounded mx-1.5 font-black uppercase">{selectedPayment.type === 'Merchant' ? 'Make Payment' : 'Send Money'}</span> 
                                  to the account below.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Recipient Account Component */}
                          <div 
                            onClick={() => copyToClipboard(selectedPayment.accountNumber)}
                            className="bg-white px-6 py-5 rounded-2xl border border-slate-200 cursor-pointer group hover:border-slate-950 transition-all active:scale-[0.99] shadow-sm relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between relative z-10">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recipient Account</p>
                                <div className="flex items-center gap-5">
                                  <p className="text-[20px] font-black text-slate-950 font-mono tracking-[0.25em] leading-none">{selectedPayment.accountNumber}</p>
                                  <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[8px] font-black uppercase text-slate-400 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all">Copy Number</div>
                                </div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all">
                                <Copy size={18} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            Step 3: Transaction ID 
                            <span className="text-rose-500 animate-pulse text-[14px] leading-none">•</span>
                          </label>
                          <input 
                            type="text" 
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                            placeholder="ABC123XYZ"
                            className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl outline-none text-[15px] font-black tracking-[0.3em] focus:border-slate-950 transition-all placeholder:text-slate-200 uppercase text-center focus:bg-slate-50 shadow-sm"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-4">
                    <button
                      onClick={handleFinalizeBooking}
                      disabled={isSubmitting || isSuccess}
                      className={`w-full h-11 rounded-lg font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border shadow-md group/btn ${
                        isSubmitting || isSuccess 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-950 border-slate-950 text-white hover:bg-emerald-600 hover:border-emerald-600'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm Booking
                          <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                            <ChevronRight size={14} />
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
