'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, HeartPulse, Truck, ArrowRight, 
  ShieldCheck, Zap, Globe2, ChevronLeft, 
  Plus, Minus, Mail, Phone, MapPin, User,
  Award, Briefcase, FileText, Calendar, 
  CreditCard, Camera, X, Check, Landmark, Lock,
  Globe, UserCircle2, Settings, ClipboardList,
  Baby, Heart, Activity, Siren, Navigation, Car, AlertCircle, Loader2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import LandingNavbar from '@/components/Home/LandingNavbar';
import CustomDropdown from '@/components/UI/CustomDropdown';
import DatePicker from '@/components/UI/DatePicker';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

const NURSING_TYPES = ['Nurse', 'Senior Care', 'Nanny'];
const NURSING_SKILLS = ['Vitals Monitoring', 'Wound Care', 'Elderly Nutrition', 'Child Safety', 'Medication Management', 'Post-Op Recovery', 'Exercise Assistance'];
const NURSING_PACKAGES = [
  { id: 'd12', name: 'Daily - 12 Hour Shift', price: 1200 },
  { id: 'd24', name: 'Daily - 24 Hour Shift', price: 2200 },
  { id: 'm12', name: 'Monthly - 12 Hour Shift', price: 28000 },
  { id: 'm24', name: 'Monthly - 24 Hour Full Care', price: 50000 }
];

const AMBULANCE_TYPES = ['Basic Life Support (Non-AC)', 'Advanced Life Support (AC)', 'ICU / Cardiac Ambulance', 'Freezer / Mortuary Ambulance'];
const AMBULANCE_PACKAGES = [
  { id: 'base', name: 'Base Fare (Inside City)', price: 1500 },
  { id: 'km', name: 'Outside City (Rate per KM)', price: 45 },
  { id: 'oxygen', name: 'Emergency Oxygen Support', price: 800 },
  { id: 'ventilator', name: 'Ventilator / ICU Surcharge', price: 3500 }
];

const PAYMENT_METHODS = [
  { id: 'bank', name: 'Bank Account', icon: Landmark, color: 'text-blue-600' },
  { id: 'bkash', name: 'bKash', icon: CreditCard, color: 'text-pink-600' },
  { id: 'nagad', name: 'Nagad', icon: CreditCard, color: 'text-orange-600' },
  { id: 'rocket', name: 'Rocket', icon: CreditCard, color: 'text-purple-600' }
];

export default function BecomeProviderPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic Framework State
  const [specialties, setSpecialties] = useState({});
  
  useEffect(() => {
    const q = query(collection(db, 'specialties'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const specs = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        specs[doc.id] = data.services?.map(s => s.name) || [];
      });
      setSpecialties(specs);
    });
    return () => unsubscribe();
  }, []);

  // Common identity & payment state logic
  const [identityData, setIdentityData] = useState({
    fullName: '', email: '', phone: '', password: '', 
    address: '', city: '', postalCode: '',
    bankName: '', accountNumber: '', routingNumber: ''
  });
  
  // Doctor State
  const [doctorData, setDoctorData] = useState({
    fullName: '', email: '', phone: '', password: '',
    gender: '', dob: '', nid: '', nationality: '', 
    address: '', city: '', postalCode: '',
    profileImage: null, bmdcCode: '', bmdcExpiry: '', experience: '', bio: '',
    specialty: [], services: [], fee: '', status: 'pending',
    followUpDays: '', followUpCost: '',
    payments: [], bankName: '', accountNo: '', mobilePaymentNo: ''
  });
  const [degrees, setDegrees] = useState([]);
  const [degreeInput, setDegreeInput] = useState('');

  // Nursing State
  const [nursingData, setNursingData] = useState({
    fullName: '', email: '', phone: '', gender: '', dob: '', nid: '', nationality: '', password: '',
    address: '', city: '', postalCode: '',
    profileImage: null, type: '', experience: '', bio: '', skills: [],
    packagePricing: {},
    payments: [], bankName: '', accountNo: '', mobilePaymentNo: ''
  });

  // Ambulance State
  const [ambulanceData, setAmbulanceData] = useState({
    fullName: '', email: '', phone: '', gender: '', dob: '', nid: '', nationality: '', password: '',
    address: '', city: '', postalCode: '',
    profileImage: null, vehicleType: '', licenseNo: '', baseLocation: '', coveredAreas: '', bio: '',
    packagePricing: {},
    payments: [], bankName: '', accountNo: '', mobilePaymentNo: ''
  });

  const providers = [
    { id: 'doctor', title: t('providerDoctor'), desc: t('providerDoctorDesc'), icon: Stethoscope, color: 'bg-emerald-50 text-emerald-600 border-emerald-300', tag: 'Verified Physicians' },
    { id: 'nursing', title: t('providerNursing'), desc: t('providerNursingDesc'), icon: HeartPulse, color: 'bg-blue-50 text-blue-600 border-blue-300', tag: 'Care Agencies' },
    { id: 'ambulance', title: t('providerAmbulance'), desc: t('providerAmbulanceDesc'), icon: Truck, color: 'bg-rose-50 text-rose-600 border-rose-300', tag: 'Transport Services' }
  ];

  const handleProviderSelect = (id) => {
    setSelectedProvider(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Doctor Helpers ---
  const handleDegreeAdd = (e) => {
    if (e.key === 'Enter' && degreeInput.trim()) {
      e.preventDefault();
      if (!degrees.includes(degreeInput.trim())) setDegrees([...degrees, degreeInput.trim()]);
      setDegreeInput('');
    }
  };

  const toggleSpecialty = (val) => {
    const next = doctorData.specialty.includes(val) ? doctorData.specialty.filter(s => s !== val) : [...doctorData.specialty, val];
    setDoctorData({ ...doctorData, specialty: next, services: [] });
  };

  const toggleService = (service) => {
    const next = doctorData.services.includes(service) ? doctorData.services.filter(s => s !== service) : [...doctorData.services, service];
    setDoctorData({ ...doctorData, services: next });
  };

  const togglePayment = (id, target) => {
    const data = target === 'doctor' ? doctorData : target === 'nursing' ? nursingData : ambulanceData;
    const setter = target === 'doctor' ? setDoctorData : target === 'nursing' ? setNursingData : setAmbulanceData;
    const next = data.payments.includes(id) ? data.payments.filter(p => p !== id) : [...data.payments, id];
    setter({ ...data, payments: next });
  };

  // --- Nursing Helpers ---
  const toggleNursingSkill = (skill) => {
    const next = nursingData.skills.includes(skill) ? nursingData.skills.filter(s => s !== skill) : [...nursingData.skills, skill];
    setNursingData({ ...nursingData, skills: next });
  };

  const toggleNursingPackage = (pkgId) => {
    const nextPricing = { ...nursingData.packagePricing };
    if (nextPricing[pkgId] !== undefined) delete nextPricing[pkgId];
    else nextPricing[pkgId] = true;
    setNursingData({ ...nursingData, packagePricing: nextPricing });
  };

  // --- Ambulance Helpers ---
  const toggleAmbulancePackage = (pkgId) => {
    const nextPricing = { ...ambulanceData.packagePricing };
    if (nextPricing[pkgId] !== undefined) delete nextPricing[pkgId];
    else nextPricing[pkgId] = true;
    setAmbulanceData({ ...ambulanceData, packagePricing: nextPricing });
  };

  const handleBecomeProvider = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = selectedProvider === 'doctor' ? doctorData : selectedProvider === 'nursing' ? nursingData : ambulanceData;
      
      // Basic validation
      if (!data.email || !data.password || !data.fullName) {
        throw new Error('Please fill in all account details.');
      }

      // Handle Image Upload if exists
      let finalPhotoURL = '';
      if (data.profileImage) {
        try {
          const storageRef = ref(storage, `provider_applications/${data.email}_${Date.now()}`);
          const uploadRes = await uploadBytes(storageRef, data.profileImage);
          finalPhotoURL = await getDownloadURL(uploadRes.ref);
        } catch (uploadErr) {
          console.error('Storage Upload Error:', uploadErr);
          toast.error('Failed to upload photo. Proceeding without photo.');
        }
      }

      // Prepare Application Object
      const applicationData = {
        ...data,
        role: selectedProvider,
        status: 'pending',
        photoURL: finalPhotoURL,
        degrees: selectedProvider === 'doctor' ? degrees : [],
        createdAt: new Date().toISOString()
      };
      
      // Remove the non-serializable File object before saving
      delete applicationData.profileImage;

      await addDoc(collection(db, 'users'), applicationData);
      
      setIsSuccess(true);
      toast.success('Application submitted successfully! Our team will review it shortly.');
      
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-3xl border border-emerald-100 flex flex-col items-center max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
            <ShieldCheck size={40} className="text-emerald-500 relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Application Received</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8 text-[15px]">
            Thank you, {selectedProvider === 'doctor' ? 'Doctor' : 'Partner'}. Your professional profile has been submitted for verification. 
            We will contact you via email once our clinical audit is complete.
          </p>
          <button onClick={() => router.push('/')} className="h-10 px-8 bg-slate-900 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all">
            Return Home
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />
      <div className="pt-52 pb-20 container mx-auto px-4 lg:px-6 relative overflow-hidden text-left">
        {/* Background Ornaments */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-50/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 -z-10" />

        <div className="w-full">
          <AnimatePresence mode="wait">
            {!selectedProvider ? (
              /* ── SELECTION VIEW ── */
              <motion.div key="selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="text-center space-y-3 mb-12 pt-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                    <Zap size={10} className="text-med-primary" />
                    <span>Partner with Meditaj</span>
                  </div>
                  <h1 className="text-xl lg:text-3xl font-black tracking-tight text-slate-900 uppercase">Enroll as a Provider</h1>
                  <p className="text-[12px] text-slate-400 font-bold max-w-xl mx-auto leading-relaxed uppercase tracking-widest">Join our medical network and start providing care to thousands.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {providers.map((provider) => (
                    <button key={provider.id} onClick={() => handleProviderSelect(provider.id)} className="group relative w-full flex flex-col p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-950 hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 text-left">
                      <div className={`w-11 h-11 ${provider.color} rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105 border border-current font-bold`}>
                        <provider.icon size={20} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2 opacity-80">{provider.tag}</span>
                      <h3 className="text-lg font-black text-slate-900 mb-1.5 uppercase tracking-tight group-hover:text-emerald-600 transition-colors leading-none">{provider.title}</h3>
                      <p className="text-[12px] text-slate-400 font-bold leading-relaxed mb-5 flex-grow uppercase tracking-wider">{provider.desc}</p>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 group-hover:gap-3 transition-all pt-4 border-t border-slate-50">
                        <span>Initiate Enrollment</span>
                        <ArrowRight size={12} className="text-emerald-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* ── PROVIDER FORMS SPA (Unified High-Density) ── */
              <motion.div key="form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }} className="w-full">
                {/* Unified Header */}
                <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
                  <div className="flex items-center gap-5">
                    <button onClick={() => setSelectedProvider(null)} className="shrink-0 w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-900 transition-all">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${providers.find(p => p.id === selectedProvider).color} flex items-center justify-center border border-slate-200 shadow-sm`}>
                        {selectedProvider === 'doctor' && <Stethoscope size={20} />}
                        {selectedProvider === 'nursing' && <HeartPulse size={20} />}
                        {selectedProvider === 'ambulance' && <Truck size={20} />}
                      </div>
                      <div>
                        <h1 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tight">
                          {selectedProvider === 'doctor' ? 'Clinical Board Enrollment' : 
                          selectedProvider === 'nursing' ? 'Nursing Force Registration' : 
                          'Logistics Fleet Enrollment'}
                        </h1>
                        <p className="text-[9px] text-slate-400 font-black mt-1.5 uppercase tracking-widest">Provide verified and compliant clinical data for audit.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleBecomeProvider} className="space-y-8 focus:outline-none">
                  {/* Common Personal Identity Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-950 flex items-center justify-center text-white text-[10px] font-black tracking-widest">01</div>
                      <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b-2 border-slate-950 pb-1">Registry & Identity Information</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-5">
                      {(() => {
                        const data = selectedProvider === 'doctor' ? doctorData : selectedProvider === 'nursing' ? nursingData : ambulanceData;
                        const setter = selectedProvider === 'doctor' ? setDoctorData : selectedProvider === 'nursing' ? setNursingData : setAmbulanceData;
                        
                        return (
                          <>
                          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="relative group w-14 h-14 rounded-2xl border border-dashed border-slate-400 bg-white flex flex-col items-center justify-center hover:border-emerald-500 transition-all cursor-pointer overflow-hidden shrink-0">
                              {data.profileImage ? (
                                <>
                                <img src={URL.createObjectURL(data.profileImage)} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setter({...data, profileImage: null});
                                  }}
                                  className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 border-2 border-white"
                                >
                                  <X size={12} />
                                </button>
                                </>
                              ) : (
                                <Camera className="text-slate-400 group-hover:text-emerald-500" size={24} />
                              )}
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setter({...data, profileImage: e.target.files?.[0]})} />
                            </div>
                            <div className="space-y-0.5"><div className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Profile Identity</div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Passport size biometric</p></div>
                          </div>

                          <div className="space-y-2">
                            <label className="input-label-premium">Legal Identity Name</label>
                            <div className="input-wrapper-premium group"><User className="input-icon-premium" size={14} /><input type="text" value={data.fullName} onChange={e => setter({...data, fullName: e.target.value})} placeholder="Official Full Name" required className="input-raw-premium" /></div>
                          </div>
                          <div className="space-y-2">
                            <label className="input-label-premium">Encrypted Password</label>
                            <div className="input-wrapper-premium group"><Lock className="input-icon-premium" size={14} /><input type="password" value={data.password} onChange={e => setter({...data, password: e.target.value})} placeholder="Min. 12 characters" required className="input-raw-premium" /></div>
                          </div>
                          <div className="space-y-2">
                            <label className="input-label-premium">Verified Mobile</label>
                            <div className="input-wrapper-premium group"><Phone className="input-icon-premium" size={14} /><input type="tel" value={data.phone} onChange={e => setter({...data, phone: e.target.value})} placeholder="+880 1XXX XXXXXX" required className="input-raw-premium" /></div>
                          </div>
                          <div className="space-y-2">
                            <label className="input-label-premium">Clinical Email</label>
                            <div className="input-wrapper-premium group"><Mail className="input-icon-premium" size={14} /><input type="email" value={data.email} onChange={e => setter({...data, email: e.target.value})} placeholder="professional@meditaj.io" required className="input-raw-premium" /></div>
                          </div>

                          <CustomDropdown 
                            label={t('genderLabel')} 
                            icon={UserCircle2} 
                            options={[t('genderMale'), t('genderFemale'), t('genderOther')]} 
                            value={data.gender} 
                            onChange={val => setter({...data, gender: val})} 
                            placeholder={t('genderLabel')} 
                          />

                          <DatePicker 
                            label={t('dobLabel')}
                            icon={Calendar}
                            value={data.dob}
                            onChange={val => setter({...data, dob: val})}
                            placeholder={t('dobLabel')}
                          />

                          <div className="space-y-2">
                            <label className="input-label-premium">National Identity (NID)</label>
                            <div className="input-wrapper-premium group"><FileText className="input-icon-premium" size={14} /><input type="text" value={data.nid} onChange={e => setter({...data, nid: e.target.value})} placeholder="10-17 Digit NID" required className="input-raw-premium" /></div>
                          </div>

                          <CustomDropdown 
                            label="Nationality" 
                            icon={Globe}
                            searchable={true}
                            options={['Bangladeshi', 'Indian', 'American', 'British', 'Canadian', 'Australian']}
                            value={data.nationality} 
                            onChange={val => setter({...data, nationality: val})} 
                            placeholder="Select Nationality"
                          />

                          <div className="space-y-2">
                            <label className="input-label-premium">Metropolitan Hub</label>
                            <div className="input-wrapper-premium group"><MapPin className="input-icon-premium" size={14} /><input type="text" value={data.city} onChange={e => setter({...data, city: e.target.value})} placeholder="Current Operating City" required className="input-raw-premium" /></div>
                          </div>

                          <div className="space-y-2">
                            <label className="input-label-premium">Postal Dispatch Code</label>
                            <div className="input-wrapper-premium group"><MapPin className="input-icon-premium" size={14} /><input type="text" value={data.postalCode} onChange={e => setter({...data, postalCode: e.target.value})} placeholder="e.g. 1212" className="input-raw-premium" /></div>
                          </div>

                          <div className="space-y-2">
                            <label className="input-label-premium">Primary Residence Address</label>
                            <div className="input-wrapper-premium group"><MapPin className="input-icon-premium" size={14} /><input type="text" value={data.address} onChange={e => setter({...data, address: e.target.value})} placeholder="House, Road, Area..." className="input-raw-premium" /></div>
                          </div>
                          </>
                        );
                      })()}
                    </div>
                  </section>

                  {/* ── DOCTOR SPECIFIC ── */}
                  {selectedProvider === 'doctor' && (
                    <>
                    <section className="space-y-6 pt-10 border-t border-slate-100">
                      <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-xl bg-slate-950 flex items-center justify-center text-white text-[10px] font-black tracking-widest">02</div><h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b-2 border-slate-950 pb-1">Clinical Credentials & Registry</h2></div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-5">
                        <div className="space-y-2"><label className="input-label-premium">BMDC Board Reg. Code</label><div className="input-wrapper-premium group"><ShieldCheck className="input-icon-premium" size={14} /><input type="text" value={doctorData.bmdcCode} onChange={e => setDoctorData({...doctorData, bmdcCode: e.target.value})} placeholder="Official BMDC Code" required className="input-raw-premium" /></div></div>
                        <div className="space-y-2"><label className="input-label-premium">License Expiry</label><DatePicker icon={Calendar} value={doctorData.bmdcExpiry} onChange={(val) => setDoctorData({...doctorData, bmdcExpiry: val})} placeholder="YYYY-MM-DD" /></div>
                        <div className="space-y-2"><label className="input-label-premium">Clinical Experience</label><div className="input-wrapper-premium group"><Briefcase className="input-icon-premium" size={14} /><input type="number" value={doctorData.experience} onChange={e => setDoctorData({...doctorData, experience: e.target.value})} placeholder="Total Years" required className="input-raw-premium" /></div></div>
                        <div className="lg:col-span-3 space-y-2"><label className="input-label-premium">Academic Accolades (Press Enter to add)</label><div className="min-h-[3rem] p-3 bg-slate-50 border border-slate-200 rounded-2xl transition-all focus-within:bg-white focus-within:border-emerald-500 shadow-inner shadow-slate-900/5"><div className="flex flex-wrap gap-2 mb-2">{degrees.map((deg, i) => (<span key={i} className="px-3 py-1.5 bg-slate-950 text-white text-[10px] font-black rounded-xl flex items-center gap-2 uppercase tracking-widest border border-slate-950 shadow-lg">{deg} <X size={12} className="cursor-pointer text-emerald-500" onClick={() => setDegrees(degrees.filter(d => d !== deg))} /></span>))}<input type="text" value={degreeInput} onChange={(e) => setDegreeInput(e.target.value)} onKeyDown={handleDegreeAdd} placeholder="MBBS, FCPS, MD..." className="flex-grow bg-transparent outline-none text-[13px] font-bold px-2 uppercase tracking-widest" /></div></div></div>
                        <div className="lg:col-span-3 space-y-2"><label className="input-label-premium">Professional Clinical Bio</label><textarea rows={3} value={doctorData.bio} onChange={e => setDoctorData({...doctorData, bio: e.target.value})} placeholder="Describe your specialization, treatment philosophy, and professional background for patient review..." className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600 text-[13px] font-bold uppercase tracking-tight placeholder:text-slate-300 shadow-sm" /></div>
                      </div>
                    </section>
                    <section className="space-y-6 pt-10 border-t border-slate-100">
                      <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-xl bg-slate-950 flex items-center justify-center text-white text-[10px] font-black tracking-widest">03</div><h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b-2 border-slate-950 pb-1">Specialization & Billing</h2></div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-5">
                        <div className="space-y-3"><label className="input-label-premium">Clinical Specialization</label><div className="flex flex-wrap gap-2 p-1">{Object.keys(specialties).map(spec => (<button key={spec} type="button" onClick={() => toggleSpecialty(spec)} className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black border transition-all uppercase tracking-widest ${doctorData.specialty.includes(spec) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900'}`}>{spec}</button>))}</div></div>
                        <div className="lg:col-span-2 space-y-3"><label className="input-label-premium">Treatment Codes Coverage</label><div className="min-h-[140px] p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-5 shadow-inner">{doctorData.specialty.length === 0 ? <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] italic text-center py-6">Pick specialties to enable clinical services...</p> : doctorData.specialty.map(spec => (<div key={spec} className="space-y-2"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">{spec} Diagnostic Scope</span></div><div className="flex flex-wrap gap-2">{(specialties[spec] || []).map(s => <button key={s} type="button" onClick={() => toggleService(s)} className={`px-2 py-1 rounded-lg text-[8px] font-black transition-all border uppercase tracking-widest ${doctorData.services.includes(s) ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'}`}>{s}</button>)}</div></div>))}</div></div>
                        <div className="space-y-2"><label className="input-label-premium">Consultation Tariff (৳)</label><div className="input-wrapper-premium group px-4 border"><span className="text-emerald-600 font-black mr-3">৳</span><input type="number" value={doctorData.fee} onChange={e => setDoctorData({...doctorData, fee: e.target.value})} placeholder="Default Fee" className="bg-transparent outline-none w-full text-[13px] font-black text-slate-900 placeholder:text-slate-300" /></div></div>
                        <div className="space-y-2"><label className="input-label-premium">Follow-up Window (Days)</label><div className="input-wrapper-premium group border"><Calendar className="input-icon-premium" size={14} /><input type="number" value={doctorData.followUpDays} onChange={e => setDoctorData({...doctorData, followUpDays: e.target.value})} placeholder="e.g. 15" className="input-raw-premium" /></div></div>
                        <div className="space-y-2"><label className="input-label-premium">Follow-up Discounted Fee (৳)</label><div className="input-wrapper-premium group px-4 border"><span className="text-emerald-600 font-black mr-3">৳</span><input type="number" value={doctorData.followUpCost} onChange={e => setDoctorData({...doctorData, followUpCost: e.target.value})} placeholder="Reduced Fee" className="bg-transparent outline-none w-full text-[13px] font-black text-slate-900 placeholder:text-slate-300" /></div></div>
                      </div>
                    </section>
                    </>
                  )}

                  {(() => {
                    const data = selectedProvider === 'doctor' ? doctorData : selectedProvider === 'nursing' ? nursingData : ambulanceData;
                    const setter = selectedProvider === 'doctor' ? setDoctorData : selectedProvider === 'nursing' ? setNursingData : setAmbulanceData;
                    return (
                      <>
                      {data.payments.includes('bank') && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 p-6 bg-slate-50 border border-slate-200 rounded-2xl mt-4 shadow-lg">
                          <div className="space-y-2"><label className="input-label-premium">Financial Institution</label><div className="input-wrapper-premium border"><input type="text" value={data.bankName} onChange={e => setter({...data, bankName: e.target.value})} placeholder="e.g. Brac Bank" className="input-raw-premium !pl-4 uppercase tracking-widest font-black" /></div></div>
                          <div className="space-y-2"><label className="input-label-premium">Settlement Account</label><div className="input-wrapper-premium border"><input type="text" value={data.accountNo} onChange={e => setter({...data, accountNo: e.target.value})} placeholder="Account Number" className="input-raw-premium !pl-4 font-mono font-bold" /></div></div>
                          <div className="space-y-2"><label className="input-label-premium">Clearing Routing No.</label><div className="input-wrapper-premium border"><input type="text" value={data.routingNumber} onChange={e => setter({...data, routingNumber: e.target.value})} placeholder="9-Digit Routing" className="input-raw-premium !pl-4 font-mono font-bold" /></div></div>
                        </motion.div>
                      )}
                      {data.payments.some(p => ['bkash', 'nagad', 'rocket'].includes(p)) && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-2xl mt-4 max-w-sm shadow-lg">
                          <div className="space-y-2"><label className="input-label-premium">Electronic Wallet Identity</label><div className="input-wrapper-premium border focus-within:border-emerald-600"><Phone className="input-icon-premium text-emerald-600" size={14} /><input type="tel" value={data.mobilePaymentNo} onChange={e => setter({...data, mobilePaymentNo: e.target.value})} placeholder="+880 Mobile Wallet" className="input-raw-premium font-black tracking-widest" /></div></div>
                        </motion.div>
                      )}
                      </>
                    );
                  })()}

                  {/* FINAL CONFIRMATION */}
                  <section className="pt-10 flex flex-col items-center border-t border-slate-200 pb-10 gap-6">
                    <p className="text-[11px] text-slate-400 text-center italic font-medium max-w-md">By submitting, you agree to Meditaj Provider Terms of Service and Clinical Audit protocols.</p>
                    <button type="submit" disabled={isLoading} className="w-[300px] h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                      {isLoading ? (locale === 'en' ? 'Processing...' : 'প্রক্রিয়াকরণ...') : t('confirmSubmit')}
                    </button>
                    {errorMessage && <p className="text-rose-500 text-[11px] font-bold uppercase tracking-tight">{errorMessage}</p>}
                  </section>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .input-label-premium {
          display: block;
          font-size: 10px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.6rem;
          margin-left: 0.2rem;
        }
        .input-wrapper-premium {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          height: 2.75rem;
          background-color: white;
          border: 1px solid #cbd5e1;
          border-radius: 0.6rem;
          transition: all 0.2s ease;
        }
        .input-wrapper-premium.group:focus-within {
          background-color: white;
          border-color: #0f172a;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
        .input-icon-premium { color: #94a3b8; margin-left: 1rem; }
        .input-wrapper-premium.group:focus-within .input-icon-premium { color: #0f172a; }
        .input-raw-premium {
          width: 100%; height: 100%; padding-left: 1rem;
          background: transparent; border: none; outline: none;
          font-size: 14px; font-weight: 700; color: #0f172a;
          letter-spacing: -0.01em;
        }
        .input-raw-premium::placeholder { color: #cbd5e1; font-weight: 500; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </main>
  );
}
