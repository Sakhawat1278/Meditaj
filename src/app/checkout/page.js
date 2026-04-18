'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, CreditCard, ArrowRight, X, 
  CheckCircle2, Loader2, Info, Lock, Zap,
  ShoppingCart, Calendar, MapPin, Phone,
  Check, Copy, Smartphone, Wallet, ChevronRight
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { clearCart } = useCart();
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Editable Patient Info State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

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
    const data = JSON.parse(savedData);
    setCheckoutData(data);
    
    // Initialize editable states from payload or defaults
    setPatientName(data.patientName || profile?.fullName || user.displayName || '');
    setPatientPhone(data.patientPhone || profile?.phone || '');
    setLocation(data.location || '');
    
    // Date/Time specifically handling for Nursing/Direct Bookings
    const isImmediate = data.time === 'Immediate Coordination' || !data.time;
    setBookingDate(isImmediate ? '' : (data.date || ''));
    setBookingTime(isImmediate ? '' : (data.time || ''));

    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
      setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.status === 'active'));
    });

    return () => unsubscribe();
  }, [isMounted, router, profile, user]);

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
    // Only require TrxID if it's a manual payment method
    const providerName = selectedPayment.provider?.toLowerCase() || '';
    const isManual = providerName.includes('bkash') || 
                     providerName.includes('nagad') || 
                     providerName.includes('rocket') ||
                     selectedPayment.type === 'Manual';
                     
    if (isManual && !trxId) {
      toast.error('Please enter the Transaction ID');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const splitBookings = []; // To track all created docs
      const items = checkoutData.items || [];
      const userBase = {
        userId: user.uid,
        userName: patientName || profile?.fullName || user.email || 'Patient',
        patientPhone: patientPhone || '',
        location: location || '',
        date: bookingDate || checkoutData.date || new Date().toLocaleDateString('en-GB'),
        time: bookingTime || checkoutData.time || '10:00 AM',
        paymentMethod: selectedPayment.provider,
        trxId: trxId,
        status: 'pending',
        paymentStatus: 'pending_verification',
        createdAt: serverTimestamp(),
      };

      // 1. Handle Specialized Items (Lab, Nursing, Products, Specialist)
      const categories = {
        lab: { coll: 'lab_bookings', items: items.filter(i => i.type === 'lab') },
        nursing: { coll: 'nursing_bookings', items: items.filter(i => i.type === 'nursing') },
        product: { coll: 'product_orders', items: items.filter(i => i.type === 'product') },
        specialist: { coll: 'appointments', items: items.filter(i => i.type === 'specialist') },
      };

      // If no items (e.g. direct specialist booking), use the top-level type
      if (items.length === 0 && checkoutData.type) {
        let coll = 'appointments';
        if (checkoutData.type === 'lab') coll = 'lab_bookings';
        if (checkoutData.type === 'nursing') coll = 'nursing_bookings';
        if (checkoutData.type === 'product') coll = 'product_orders';
        
        const docRef = await addDoc(collection(db, coll), { ...userBase, ...checkoutData });
        splitBookings.push({ id: docRef.id, collection: coll });
      } else {
        // Process each category
        for (const [key, cat] of Object.entries(categories)) {
          if (cat.items.length > 0) {
            // Special Case: Specialists should each have their OWN individual document
            if (key === 'specialist') {
              for (const specItem of cat.items) {
                const specData = { 
                  ...userBase, 
                  ...specItem, 
                  type: 'specialist',
                  totalAmount: specItem.price 
                };
                const docRef = await addDoc(collection(db, cat.coll), specData);
                splitBookings.push({ id: docRef.id, collection: cat.coll });
              }
            } else {
              // Grouped items for Labs, Nursing, and Products
              const bookingData = { 
                ...userBase, 
                items: cat.items,
                type: key,
                totalAmount: cat.items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0)
              };
              
              if (key === 'product') {
                bookingData.customerName = userBase.userName;
                bookingData.phone = userBase.patientPhone;
                bookingData.total = bookingData.totalAmount;
              }

              const docRef = await addDoc(collection(db, cat.coll), bookingData);
              splitBookings.push({ id: docRef.id, collection: cat.coll });
            }
          }
        }
      }

      // 2. Create manual payment record for Admin verification
      if (isManual && splitBookings.length > 0) {
        // Create a human-readable summary of what's in this order
        const uniqueCategories = [...new Set(splitBookings.map(b => {
          if (b.collection === 'appointments') return 'Specialist';
          if (b.collection === 'lab_bookings') return 'Laboratory';
          if (b.collection === 'nursing_bookings') return 'Nursing';
          if (b.collection === 'product_orders') return 'Store';
          return 'Booking';
        }))];
        const categorySummary = uniqueCategories.join(' + ');

        const itemSummary = items.length > 0 
          ? items.map(i => i.name).join(', ') 
          : (checkoutData.doctorName || checkoutData.packageName || checkoutData.tests?.map(t => t.name).join(', ') || categorySummary);

        await addDoc(collection(db, 'manual_payments'), {
          relatedBookings: splitBookings,
          categorySummary: categorySummary,
          itemSummary: itemSummary,
          appointmentId: splitBookings[0].id,
          appointmentCollection: splitBookings[0].collection,
          userId: user.uid,
          userName: userBase.userName,
          userPhone: checkoutData.patientPhone || '',
          amount: checkoutData.totalAmount,
          method: selectedPayment.provider,
          transactionId: trxId,
          status: 'pending',
          type: categorySummary,
          createdAt: serverTimestamp()
        });
      }

      setIsSuccess(true);
      clearCart(); // NEW: Clear the cart after success
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
          <h2 className="text-xl font-bold text-[#1e4a3a] mb-4 tracking-tight uppercase">
            {checkoutData?.type === 'instant' ? 'Clinical Link Active' : 'Booking Confirmed'}
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest leading-loose mb-8 text-[11px]">
            {checkoutData?.type === 'instant' 
              ? 'Synchronizing with the first available professional. Please stay online for immediate connection.' 
              : 'Your scheduling request has been received. Our clinical team is verifying your payment.'}
            <span className="block mt-2">Redirecting to console...</span>
          </p>
          <button 
            onClick={() => router.push('/dashboard/patient')} 
            className="h-12 px-10 bg-[#1e4a3a] text-white rounded-lg font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all"
          >
            Enter Dashboard
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">

      <div className="pt-28 lg:pt-36 pb-24 w-full max-w-[1825px] mx-auto px-4 lg:px-10">
        <div className="w-full">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-[#1e4a3a] rounded-lg flex items-center justify-center text-white border border-black">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[20px] font-black text-[#1e4a3a] tracking-tighter uppercase">Secure Checkout</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} className="text-emerald-500" /> 
                Professional Grade Encryption Enabled
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* LEFT COLUMN: PATIENT REGISTRATION FORM */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
                
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Patient Information</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Identity</label>
                    <input 
                      type="text" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter Full Name"
                      className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                      <input 
                        type="tel" 
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="01XXX-XXXXXX"
                        className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Address / Location</label>
                      <input 
                        type="text" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="House, Road, Area..."
                        className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Date & Time Selection (Conditional: Only for Nursing or missing schedule, NOT for products) */}
                  {(checkoutData?.type === 'nursing' || (!checkoutData?.date && checkoutData?.type !== 'product')) && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Start Date</label>
                        <input 
                          type="date" 
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all uppercase"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                        <input 
                          type="time" 
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SUMMARY & PAYMENT */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Order Summary</h3>
                  <span className="text-[9px] font-black bg-[#1e4a3a] text-white px-2 py-0.5 rounded uppercase tracking-widest">
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
                              <p className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">
                                {item.name} {(item.quantity || 1) > 1 && <span className="text-[10px] text-slate-400 font-black ml-1 uppercase">x{(item.quantity || 1)}</span>}
                              </p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-none mt-1">{item.type} • {item.category || item.providerName}</p>
                            </div>
                          </div>
                          <span className="text-[13px] font-black text-[#1e4a3a] font-mono tracking-tighter">৳{Number(item.price) * (item.quantity || 1)}</span>
                        </div>
                      ))
                    ) : checkoutData.type === 'lab' ? (
                      checkoutData.tests?.map((test, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-bold text-slate-800">{test.name}</span>
                          </div>
                          <span className="text-[13px] font-black text-[#1e4a3a] font-mono tracking-tighter">৳{test.price}</span>
                        </div>
                      ))
                    ) : checkoutData.type === 'nursing' ? (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{checkoutData.caregiverName || 'Care Specialist'}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{checkoutData.packageName}</p>
                          </div>
                        </div>
                        <span className="text-[14px] font-black text-[#1e4a3a] font-mono tracking-tighter">৳{checkoutData.fees}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{checkoutData.doctorName || 'General Doctor'}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{checkoutData.specialtyName || checkoutData.specialty}</p>
                          </div>
                        </div>
                        <span className="text-[14px] font-black text-[#1e4a3a] font-mono tracking-tighter">৳{checkoutData.fees}</span>
                      </div>
                    )}

                    {checkoutData.discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-200 pt-4">
                        <span className="text-[10px] uppercase tracking-widest flex items-center gap-2"><Zap size={10} /> Promotion Applied</span>
                        <span className="text-[13px] font-mono">- ৳{checkoutData.discount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t border-slate-200">
                    <span className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Total Amount</span>
                    <span className="text-[24px] font-black text-[#1e4a3a] font-mono tracking-tighter">৳{checkoutData.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
                
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Select Payment</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Gateway</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method)}
                        className={`group relative h-14 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedPayment?.id === method.id ? 'bg-white border-[#1e4a3a] scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
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
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${selectedPayment?.id === method.id ? 'text-[#1e4a3a]' : 'text-slate-400 group-hover:text-[#1e4a3a]'}`}>
                          {method.provider}
                        </span>
                        {selectedPayment?.id === method.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#1e4a3a] rounded-full flex items-center justify-center text-white border border-white">
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
                        className="bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-5"
                      >
                        <div className="space-y-6">
                          {/* Payment Configuration Header */}
                          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                              <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Transaction Setup</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <ShieldCheck size={10} className="text-emerald-500" /> Secure Clinical Gateway
                              </p>
                            </div>
                            <span className="text-[9px] font-black bg-[#1e4a3a] text-white px-3 py-1 rounded uppercase tracking-[0.1em] shadow-sm">
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
                                  'text-[#1e4a3a]'
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
                            className="bg-white px-6 py-5 rounded-2xl border border-slate-200 cursor-pointer group hover:border-[#1e4a3a] transition-all active:scale-[0.99] relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between relative z-10">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recipient Account</p>
                                <div className="flex items-center gap-5">
                                  <p className="text-[20px] font-black text-[#1e4a3a] font-mono tracking-[0.25em] leading-none">{selectedPayment.accountNumber}</p>
                                  <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[8px] font-black uppercase text-slate-400 group-hover:bg-[#1e4a3a] group-hover:text-white group-hover:border-[#1e4a3a] transition-all">Copy Number</div>
                                </div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#1e4a3a] group-hover:text-white transition-all">
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
                            className="w-full h-12 px-8 bg-white border border-slate-200 rounded-full outline-none text-[15px] font-black tracking-[0.3em] focus:border-[#1e4a3a] transition-all placeholder:text-slate-200 uppercase text-center focus:bg-slate-50"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-6 flex justify-center">
                    <button
                      onClick={handleFinalizeBooking}
                      disabled={isSubmitting || isSuccess}
                      className={`w-fit px-12 h-11 rounded-full font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border group/btn ${
                        isSubmitting || isSuccess 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-[#1e4a3a] border-[#1e4a3a] text-white hover:bg-emerald-600 hover:border-emerald-600 shadow-lg shadow-[#1e4a3a]/10'
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
