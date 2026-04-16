'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Upload, FileText, ChevronRight, Phone, MessageSquare, 
 ShieldCheck, CheckCircle2, Video, Activity, Info, 
 ArrowRight, CreditCard, Sparkles, UserCheck, Users, Lock, Globe, Building2, Shield,
 Check, Zap, Copy, ChevronDown, Stethoscope, X, ShoppingCart, Camera
} from 'lucide-react';
import LandingNavbar from '@/components/Home/LandingNavbar';
import { useLanguage } from '@/context/LanguageContext';
import { collection, onSnapshot, query, doc, addDoc, where, getDocs } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CustomDropdown from '@/components/UI/CustomDropdown';

export default function InstantDoctorPage() {
 const router = useRouter();
 const { t } = useLanguage();
 const { user, login, registerPatient } = useAuth();
 const [specialties, setSpecialties] = useState([]);
 const [selectedSpecialty, setSelectedSpecialty] = useState(null);
 const [loading, setLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 
 // Dynamic Config & Payments
 const [globalFee, setGlobalFee] = useState(500);
 const [paymentMethods, setPaymentMethods] = useState([]);
 const [selectedPayment, setSelectedPayment] = useState(null);
 const [showAuthPopup, setShowAuthPopup] = useState(false);
 const [authMode, setAuthMode] = useState('login'); // initial | login | signup
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [signupData, setSignupData] = useState({
 fullName: '', dob: '', phone: '', address: '', city: '', country: '', postalCode: '', gender: '', bloodType: ''
 });
 const [imageFile, setImageFile] = useState(null);
 const [profilePreview, setProfilePreview] = useState(null);
 const [bookingStep, setBookingStep] = useState('form'); // form | payment | success
 const [openFaq, setOpenFaq] = useState(null);
 
 // Patient Details Form
 const [patientData, setPatientData] = useState({ phone: '', reason: '' });
 const [attachedFiles, setAttachedFiles] = useState([]);

 // Coupon State
 const [couponCode, setCouponCode] = useState('');
 const [appliedCoupon, setAppliedCoupon] = useState(null);
 const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
 const [agreedToTerms, setAgreedToTerms] = useState(false);

 useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
 // 1. Fetch Specialties
 const q = query(collection(db, 'specialties'));
 const unSpec = onSnapshot(q, (snapshot) => {
 const allSpecs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 const telemedSpecs = allSpecs.filter(spec => (spec.services || []).some(s => s.telemed));
 setSpecialties(telemedSpecs);
 if (telemedSpecs.length > 0 && !selectedSpecialty) setSelectedSpecialty(telemedSpecs[0]);
 });

 // 2. Fetch Global Pricing
 const unSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
 if (snapshot.exists()) setGlobalFee(snapshot.data().instantDoctorFee || 500);
 });

 // 3. Fetch Payment Methods
 const unPay = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
 setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.status === 'active'));
 });

 setLoading(false);
 return () => { unSpec(); unSettings(); unPay(); };
 }, []);

  const handleLogin = async () => {
    if (!email || !password) return toast.error("Please fill all fields");
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      setShowAuthPopup(false);
    } catch (e) {
      toast.error(e.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error("Please enter your email address first");
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (e) {
      console.error("Reset error:", e);
      toast.error(e.message || "Failed to send reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSignup = async () => {
    const { fullName, ...rest } = signupData;
    if (!email || !password || !fullName) return toast.error("Required fields missing");
    setIsSubmitting(true);
    try {
      let photoURL = null;
      if (imageFile) {
        const imageRef = ref(storage, `users/${Date.now()}_${imageFile.name}`);
        const uploadRes = await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(uploadRes.ref);
      }
      await registerPatient(email, password, { fullName, ...rest, photoURL });
      toast.success("Account created successfully!");
      setShowAuthPopup(false);
    } catch (e) {
      toast.error(e.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleBookingRedirect = () => {
 if (!user) {
 setShowAuthPopup(true);
 return;
 }
 
 if (!patientData.phone) {
 toast.error(t('phoneRequired') || 'Phone number is required');
 return;
 }

 if (!agreedToTerms) {
 toast.error(t('agreeToTermsError') || 'Please check terms and conditions');
 return;
 }

 const checkoutSession = {
 type: 'instant',
 specialtyId: selectedSpecialty?.id,
 specialtyName: selectedSpecialty?.name || 'General Consult',
 totalAmount: currentPrice,
 fees: globalFee,
 discount: discountAmount,
 patientPhone: patientData.phone,
 problemDescription: patientData.reason,
 date: 'Today (Instant)',
 time: 'As soon as possible',
 couponCode: appliedCoupon?.code || null
 };

 sessionStorage.setItem('medita_checkout', JSON.stringify(checkoutSession));
 router.push('/checkout');
 };

  const handleApplyCoupon = async () => {
  if (!couponCode || !db) return;
  setIsVerifyingCoupon(true);
  try {
  const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()), where('status', '==', 'active'));
 const snap = await getDocs(q);
 if (!snap.empty) {
 const coupon = snap.docs[0].data();
 setAppliedCoupon(coupon);
 toast.success(`Coupon applied!`);
 } else {
 toast.error('Invalid or expired coupon');
 setAppliedCoupon(null);
 }
 } catch (e) {
 toast.error('Failed to verify coupon');
 } finally {
 setIsVerifyingCoupon(false);
 }
 };

 const discountAmount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? (globalFee * (appliedCoupon.value / 100)) : Number(appliedCoupon.value)) : 0;
 const currentPrice = Math.max(0, globalFee - discountAmount);

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <LandingNavbar />

      <div className="pt-52 pb-24 container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Form Section */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-8">
            <div className="space-y-1.5">
              <h1 className="text-[16px] font-bold tracking-tight text-black uppercase">Request Information</h1>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em]">Contact Number <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                  placeholder="e.g., 01XXXXXXXXX"
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:border-slate-400 focus:bg-slate-50 outline-none transition-all text-xs font-medium placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em]">Reason</label>
                <input 
                  type="text"
                  value={patientData.reason}
                  onChange={(e) => setPatientData({...patientData, reason: e.target.value})}
                  placeholder="e.g., Fever, Headache"
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:border-slate-400 focus:bg-slate-50 outline-none transition-all text-xs font-medium placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em]">Documents or Prescriptions</label>
                <div className="border border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-all cursor-pointer group relative">
                  <input 
                    type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setAttachedFiles(Array.from(e.target.files || []))}
                  />
                  <div className="flex items-center gap-3 text-slate-900">
                    <div className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center">
                      <Upload size={14} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest">{attachedFiles.length > 0 ? `${attachedFiles.length} Selected` : 'No files uploaded yet'}</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Max file size 2MB (Optional)</p>
              </div>
            </div>

            <div className="pt-4">
               <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                    <h3 className="text-[9px] font-bold text-black uppercase tracking-[0.2em]">Payment Summary</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-medium">
                      <span className="text-slate-500 uppercase">Consultancy Fee</span>
                      <span className="text-slate-950 font-bold">৳ {Number(globalFee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-medium">
                      <span className="text-slate-500 uppercase">Coupon Discount</span>
                      <span className="text-slate-950 font-bold">− ৳ {Number(discountAmount).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-950 font-bold uppercase tracking-tight">Total Payable</span>
                      <span className="text-slate-950 font-black text-[16px]">৳ {Number(currentPrice).toFixed(2)}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Why Consult with Meditaj Doctor?</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                    <Stethoscope size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900 leading-tight">100%</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 whitespace-nowrap">Valid Prescription</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                    <Users size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900 leading-tight">40+</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 whitespace-nowrap">Expert Doctors</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                    <ShieldCheck size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900 leading-tight">100%</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 whitespace-nowrap">Secure & Private</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em]">Available Specialty</h3>
                <div className="grid grid-cols-2 gap-2">
                  {specialties.map((spec) => (
                    <button
                      key={spec.id}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`h-11 px-3 border transition-all text-[10px] font-black uppercase tracking-widest rounded-lg ${
                        selectedSpecialty?.id === spec.id
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-300 text-slate-400 hover:border-slate-900 hover:text-slate-900'
                      }`}
                    >
                      {spec.name}
                    </button>
                  ))}
                  {specialties.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      No Specialties Available
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em]">Promo Code</h3>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="ENTER CODE"
                    className="flex-1 h-11 px-4 border border-slate-300 rounded-lg outline-none text-[10px] font-bold tracking-widest uppercase placeholder:text-slate-200"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={isVerifyingCoupon}
                    className="h-11 px-6 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-all text-[10px] uppercase tracking-widest"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input 
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-slate-300 rounded-sm peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-all flex items-center justify-center text-white">
                      {agreedToTerms && <Check size={12} strokeWidth={4} />}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight leading-normal">
                    Agree to <Link href="/terms" className="text-slate-900 underline">Terms</Link> and <Link href="/privacy" className="text-slate-900 underline">Privacy Policy</Link>
                  </span>
                </label>

                <button 
                  onClick={handleBookingRedirect}
                  disabled={!agreedToTerms || isSubmitting}
                  className={`w-full h-11 rounded-lg font-black text-[12px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-2 ${
                    agreedToTerms && !isSubmitting
                    ? 'bg-slate-950 text-white hover:bg-emerald-600' 
                    : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Processing' : 'Continue'}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secure Connection</span>
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                  <Lock size={12} className="text-emerald-500" />
                  Verified Doctor App
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-400 opacity-40">
                 <Shield size={20} />
                 <Globe size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section: Accordion */}
        <div className="mt-24 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-[0.2em]">Common Questions</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Everything you need to know about instant consult</p>
          </div>
          
          <div className="space-y-3">
            {[
              { q: "How long does it take to connect?", a: "Typically, you'll be connected with a verified doctor within 5-10 minutes of your request being confirmed.", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
              { q: "Is my medical data secure?", a: "Absolutely. We use end-to-end encryption and comply with international health data privacy standards.", icon: Shield, color: "text-blue-500", bg: "bg-blue-50" },
              { q: "Can I upload my previous reports?", a: "Yes, you can upload prescriptions or lab reports in the 'Request Information' section for the doctor to review.", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
              { q: "Is the prescription valid at pharmacies?", a: "Yes, our digital prescriptions are legally valid and accepted at all major pharmacies across the country.", icon: CheckCircle2, color: "text-rose-500", bg: "bg-rose-50" }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg ${faq.bg} flex items-center justify-center ${faq.color} border border-transparent group-hover:border-current transition-all backdrop-blur-sm`}>
                       <faq.icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{faq.q}</span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 pl-12">
                        <div className="h-px bg-slate-100 mb-4 w-12" />
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-wide">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAuthPopup && (
          <div key="auth-popup" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/40" onClick={() => setShowAuthPopup(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full ${authMode === 'signup' ? 'max-w-[440px]' : 'max-w-[360px]'} bg-white rounded-xl p-8 shadow-2xl border border-slate-100 transition-all duration-300`}
            >
              <button 
                onClick={() => setShowAuthPopup(false)}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-50 rounded-lg transition-all z-10"
              >
                <X size={18} />
              </button>
              <div className="flex items-start gap-4 mb-8">
                <div className="w-11 h-11 bg-slate-950 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/10 transition-all">
                  {authMode === 'login' ? <UserCheck size={20} /> : <Sparkles size={20} />}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 leading-none mb-1.5">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    {authMode === 'login' ? 'Sign in to access your profile' : 'Please provide your details below'}
                  </p>
                </div>
              </div>

              <div className={`space-y-4 ${authMode === 'signup' ? 'max-h-[400px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                
                {authMode === 'signup' && (
                  <>
                    {/* Profile Image Upload */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 group-hover:border-slate-400 transition-all overflow-hidden">
                          {profilePreview ? (
                            <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={20} />
                          )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-950 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-all shadow-lg">
                          <Camera size={12} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Profile Photo</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1">Full Name</label>
                      <input 
                        type="text" value={signupData.fullName} onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                        placeholder="e.g. Hasan Rafi"
                        className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 bg-slate-50/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 ml-1">DOB</label>
                        <input 
                          type="date" value={signupData.dob} onChange={(e) => setSignupData({...signupData, dob: e.target.value})}
                          className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-900 transition-all bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 ml-1">Phone</label>
                        <input 
                          type="tel" value={signupData.phone} onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                          placeholder="+880"
                          className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-bold text-slate-400 px-1">Email address</label>
                  </div>
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 bg-slate-50/50"
                  />
                </div>

                {authMode === 'signup' && (
                   <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1">Street Address</label>
                      <input 
                        type="text" value={signupData.address} onChange={(e) => setSignupData({...signupData, address: e.target.value})}
                        placeholder="House/Road/Area"
                        className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 bg-slate-50/50"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 ml-1">City</label>
                          <input type="text" value={signupData.city} onChange={(e) => setSignupData({...signupData, city: e.target.value})} placeholder="City" className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-slate-900 transition-all bg-slate-50/50" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 ml-1">Country</label>
                          <input type="text" value={signupData.country} onChange={(e) => setSignupData({...signupData, country: e.target.value})} placeholder="BD" className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-slate-900 transition-all bg-slate-50/50" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 ml-1">Postal</label>
                          <input type="text" value={signupData.postalCode} onChange={(e) => setSignupData({...signupData, postalCode: e.target.value})} placeholder="Code" className="w-full h-11 px-3 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-slate-900 transition-all bg-slate-50/50" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <CustomDropdown 
                        label="Gender"
                        options={[
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' },
                        ]}
                        value={signupData.gender}
                        onChange={(val) => setSignupData({...signupData, gender: val})}
                        placeholder="Select"
                      />
                      <CustomDropdown 
                        label="Blood Type"
                        options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => ({ value: t, label: t }))}
                        value={signupData.bloodType}
                        onChange={(val) => setSignupData({...signupData, bloodType: val})}
                        placeholder="Select"
                      />
                    </div>
                   </>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-bold text-slate-400">Password</label>
                    {authMode === 'login' && (
                      <button 
                        onClick={handleForgotPassword}
                        disabled={isSubmitting}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-tight disabled:opacity-50"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button 
                  onClick={authMode === 'login' ? handleLogin : handleSignup}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-slate-950 text-white rounded-lg text-[12px] font-bold flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10"
                >
                  {isSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
                
                <div className="mt-2 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="ml-1 font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                    >
                      {authMode === 'login' ? 'Create one' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
