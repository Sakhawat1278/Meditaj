'use client';
import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { 
 Users, UserPlus, ShieldCheck, Activity, 
 Search, Filter, MoreHorizontal, Mail, Info, Building2, Shield,
 Phone, Calendar, ArrowUpRight, TrendingUp,
 Plus, X, Check, Clock, UserCheck, AlertCircle, Loader2, Stethoscope, UserCircle, CheckCircle2,
 LayoutGrid, Brain, Baby, Bone, Droplets, Eye, Heart, Microscope, Pill, Syringe, Thermometer, Settings, Settings2, Trash2, Edit3, Save, ChevronRight,
 FlaskConical, Dna, Zap, Waves, Smile, ShieldPlus, ClipboardList, ClipboardPlus, Hospital, Ambulance, Bandage, Ear, Footprints, Hand,
 MessageSquare, FolderOpen, Upload, FileText, ChevronDown, Landmark, CreditCard, Smartphone, Wallet,
 Camera, Lock, MapPin, Briefcase, ShieldAlert, LogOut, Navigation, Tag, MoreVertical, ImagePlus
} from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, onSnapshot, setDoc, deleteDoc, addDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, secondaryAuth, storage } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useConfirm } from '@/context/ConfirmationContext';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

const LabModals = dynamic(() => import('@/components/Dashboard/Admin/LabModals'), { 
  ssr: false, 
  loading: () => <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#1e4a3a]" size={24} /></div> 
});

const AmbulanceManagement = dynamic(() => import('@/components/Dashboard/Admin/AmbulanceManagement'), { 
  ssr: false, 
  loading: () => <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#1e4a3a]" size={24} /></div> 
});

const StoreManagement = dynamic(() => import('@/components/Dashboard/Admin/StoreManagement'), { 
  ssr: false, 
  loading: () => <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#1e4a3a]" size={24} /></div> 
});

const DatePicker = dynamic(() => import('@/components/UI/DatePicker'), { ssr: false });
const CustomDropdown = dynamic(() => import('@/components/UI/CustomDropdown'), { ssr: false });
import { bdLocations, getDivisions, getDistricts, getAreas, mergeLocations } from '@/lib/locationData';

function AdminDashboardContent() {
 const router = useRouter();
 const confirm = useConfirm();
 const doctorFormRef = useRef(null);
 const searchParams = useSearchParams();
 const activeTab = searchParams.get('view') || 'overview';
 const [showAddStaff, setShowAddStaff] = useState(false);
 const [showRegisterDoctor, setShowRegisterDoctor] = useState(false);
 const [showColorDropdown, setShowColorDropdown] = useState(false);
 const [showDoctorSpecialtyDropdown, setShowDoctorSpecialtyDropdown] = useState(false);
 const [isDataLoaded, setIsDataLoaded] = useState(false);
 const [pendingProviders, setPendingProviders] = useState([]);
 const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
 const [staff, setStaff] = useState([]);
 const [isCreatingStaff, setIsCreatingStaff] = useState(false);
 const [isCreatingDoctor, setIsCreatingDoctor] = useState(false);
 const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '' });
 const [doctorForm, setDoctorForm] = useState({ 
 fullName: '', email: '', phone: '', password: '', 
 gender: '', dob: '', nid: '', nationality: '',
 address: '', city: '', postalCode: '',
 bmdcCode: '', bmdcExpiry: '', experience: '', bio: '',
 degrees: [], specialties: [], services: [], 
 fee: '', followUpDays: '', followUpCost: '',
 bankName: '', accountNumber: '', routingNumber: '', mobilePaymentNo: '',
 paymentMethods: [],
 photoURL: ''
 });
 const [doctorPhotoFile, setDoctorPhotoFile] = useState(null);
 const [degreeInput, setDegreeInput] = useState('');
 const [patients, setPatients] = useState([]);
 const [patientSearch, setPatientSearch] = useState('');
 const [staffSearch, setStaffSearch] = useState('');
 const [isPatientsLoading, setIsPatientsLoading] = useState(true);
 const [selectedPatient, setSelectedPatient] = useState(null);
 const [patientAppointments, setPatientAppointments] = useState([]);
 const [filterStatus, setFilterStatus] = useState('all'); // all, active, deactivated
 const [showFilterDropdown, setShowFilterDropdown] = useState(false);
 const [doctors, setDoctors] = useState([]);
 const [doctorSearch, setDoctorSearch] = useState('');
 const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
 const [selectedDoctor, setSelectedDoctor] = useState(null);
 const [editingDoctor, setEditingDoctor] = useState(null);
 const [isEditingPatient, setIsEditingPatient] = useState(false);
 const [profileTab, setProfileTab] = useState('history'); // history, files
 const [patientFile, setPatientFile] = useState(null);
 const [patientForm, setPatientForm] = useState({ fullName: '', email: '', phone: '', address: '', bloodGroup: '', status: 'active', photoURL: '', isVerified: false });
 const [patientFiles, setPatientFiles] = useState([]);
 const [isFilesLoading, setIsFilesLoading] = useState(false);
 const [showBloodDropdown, setShowBloodDropdown] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 
 // Medical Setup State
 const [specialties, setSpecialties] = useState([]);
 const [isSpecialtiesLoaded, setIsSpecialtiesLoaded] = useState(false);
 const [selectedSpecialty, setSelectedSpecialty] = useState(null);
 const [showAddSpecialty, setShowAddSpecialty] = useState(false);
 const [showAddService, setShowAddService] = useState(false);
 const [editingService, setEditingService] = useState(null);
 const [isSaving, setIsSaving] = useState(false);
 
 const [specForm, setSpecForm] = useState({ name: '', icon: 'Heart', color: 'text-emerald-500', bg: 'bg-emerald-50' });
 const [serviceForm, setServiceForm] = useState({ name: '', price: '', telemed: false, telemedPrice: '' });
 const [activeMenuId, setActiveMenuId] = useState(null);
 
 // Settings & Payment State
 const [paymentMethods, setPaymentMethods] = useState([]);
 const [globalSettings, setGlobalSettings] = useState({ instantDoctorFee: 500, platformCommission: 10 });
 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [editingPayment, setEditingPayment] = useState(null);
 const [paymentForm, setPaymentForm] = useState({ 
 provider: 'bkash', 
 type: 'personal', 
 accountNumber: '', 
 status: 'active',
 // Bank specific
 bankName: '',
 accountName: '',
 branchName: '',
 routingNumber: '',
 // Merchant/Agent specific
 shopName: '',
 merchantId: '',
 counterNumber: '1',
 gatewayMode: 'manual', // manual | digital
 apiKey: '',
 apiSecret: ''
 });
 const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
 
 // Coupon Management State
 const [coupons, setCoupons] = useState([]);
 const [showCouponModal, setShowCouponModal] = useState(false);
 const [editingCoupon, setEditingCoupon] = useState(null);
 const [isSavingCoupon, setIsSavingCoupon] = useState(false);
 const [couponForm, setCouponForm] = useState({ 
 value: '', 
 status: 'active'
 });
 const [adminProfile, setAdminProfile] = useState({
 fullName: 'Admin User',
 email: '',
 phone: '',
 photoURL: ''
 });
 const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

 const [financeTab, setFinanceTab] = useState('overview');
 const [settingsTab, setSettingsTab] = useState('profile');
 const [apptSearch, setApptSearch] = useState('');
 const [apptFilter, setApptFilter] = useState('all'); // all, today, upcoming, completed, cancelled
 
 // Location Management State
 const [locForm, setLocForm] = useState({ division: '', district: '', area: '' });
 const [selectedLocDiv, setSelectedLocDiv] = useState('');
 const [selectedLocDist, setSelectedLocDist] = useState('');
 const [locVersion, setLocVersion] = useState(0);
 
 // Lab Management State
 const [labTab, setLabTab] = useState('bookings'); // bookings, providers, tests
 const [labProviders, setLabProviders] = useState([]);
 const [labTests, setLabTests] = useState([]);
 const [labBookings, setLabBookings] = useState([]);
 const [showAddLabProvider, setShowAddLabProvider] = useState(false);
 const [showAddLabTest, setShowAddLabTest] = useState(false);
 const [editingLabProvider, setEditingLabProvider] = useState(null);
 const [editingLabTest, setEditingLabTest] = useState(null);
 const [isLabsLoading, setIsLabsLoading] = useState(true);
 const [labSearch, setLabSearch] = useState('');
 
 const [labProviderForm, setLabProviderForm] = useState({ name: '', division: '', district: '', area: '', status: 'active' });
 const [labTestForm, setLabTestForm] = useState({ name: '', category: '', price: '', providerId: '', preparation: '', description: '', status: 'active' });
 const [lpDropOpen, setLpDropOpen] = useState({ division: false, district: false, area: false });
  const [ltProviderDropOpen, setLtProviderDropOpen] = useState(false);
  const [ltProviderSearch, setLtProviderSearch] = useState('');

  // Nursing & Care State
  const [nursingTab, setNursingTab] = useState('bookings'); // bookings, caregivers
  const [caregivers, setCaregivers] = useState([]);
  const [nursingBookings, setNursingBookings] = useState([]);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [caregiverForm, setCaregiverForm] = useState({ 
    name: '', specialty: '', experience: '', rating: '5.0', 
    availability: 'Available', status: 'active', price: '',
    phone: '', email: '', bio: '', specialties: [], photoURL: '',
    packages: []
  });
  const [isNursingLoading, setIsNursingLoading] = useState(true);
  const [nursingPackages, setNursingPackages] = useState([]);
  const [nursingTypes, setNursingTypes] = useState([]);
  const [showAddNursingPackage, setShowAddNursingPackage] = useState(false);
  const [showAddNursingType, setShowAddNursingType] = useState(false);
  const [nursingPackageForm, setNursingPackageForm] = useState({ label: '', duration: '', price: '' });
  const [nursingTypeForm, setNursingTypeForm] = useState({ label: '', image: '' });
  
  // Ambulance Management State
  const [ambulanceBookings, setAmbulanceBookings] = useState([]);
  const [ambulanceFleet, setAmbulanceFleet] = useState([]);
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);
  const [isAmbulanceLoading, setIsAmbulanceLoading] = useState(true);
  const [ambulanceForm, setAmbulanceForm] = useState({ 
    plateNumber: '', driverName: '', driverPhone: '', 
    type: 'AC', status: 'available', description: '',
    driverNID: '', licenseNo: '', city: '', baseLocation: '', coveredAreas: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBookingForAssignment, setSelectedBookingForAssignment] = useState(null);

  const uploadFile = async (file, path) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveLabProvider = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { division, district, area } = labProviderForm;
      
      if (editingLabProvider) {
        await updateDoc(doc(db, 'lab_providers', editingLabProvider), labProviderForm);
      } else {
        await addDoc(collection(db, 'lab_providers'), { ...labProviderForm, createdAt: new Date().toISOString() });
      }

      // Sync Location to Global Index
      if (division && district) {
        const divRef = doc(db, 'locations', division);
        const divSnap = await getDoc(divRef);
        
        if (divSnap.exists()) {
          // Division exists, update or add the district
          await updateDoc(divRef, {
            [district]: arrayUnion(area || ''),
            updatedAt: new Date().toISOString()
          });
        } else {
          // Create new division doc
          await setDoc(divRef, {
            [district]: area ? [area] : [],
            updatedAt: new Date().toISOString()
          });
        }
      }

      toast.success(editingLabProvider ? 'Provider updated' : 'Provider registered');
      setShowAddLabProvider(false);
    } catch (err) { 
      console.error("Provider Save Error:", err);
      toast.error('Check fields or connection'); 
    }
    setIsSaving(false);
  };

 const handleSaveLabTest = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  try {
  const data = { ...labTestForm, price: Number(labTestForm.price) };
  if (editingLabTest) {
  await updateDoc(doc(db, 'lab_tests', editingLabTest), data);
  toast.success('Test updated');
  } else {
  await addDoc(collection(db, 'lab_tests'), { ...data, createdAt: new Date().toISOString() });
  toast.success('Test added to catalog');
  }
  setShowAddLabTest(false);
  } catch (err) { toast.error('Check fields or connection'); }
  setIsSaving(false);
 };

  const handleSaveCaregiver = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = { ...caregiverForm, price: Number(caregiverForm.price) };
      if (editingCaregiver) {
        await updateDoc(doc(db, 'nursing_providers', editingCaregiver), data);
        toast.success('Caregiver updated');
      } else {
        await addDoc(collection(db, 'nursing_providers'), { ...data, createdAt: new Date().toISOString() });
        toast.success('Caregiver registered');
      }
      setShowAddCaregiver(false);
    } catch (err) { toast.error('Check fields or connection'); }
    setIsSaving(false);
  };

  const handleSaveNursingPackage = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'nursing_packages'), { ...nursingPackageForm, price: Number(nursingPackageForm.price), createdAt: new Date().toISOString() });
      setNursingPackageForm({ label: '', duration: '', price: '' });
      setShowAddNursingPackage(false);
      toast.success('Package Added');
    } catch (e) { toast.error('Save failed'); }
  };

  const handleSaveNursingType = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'nursing_types'), { ...nursingTypeForm, createdAt: new Date().toISOString() });
      setNursingTypeForm({ label: '', image: '' });
      setShowAddNursingType(false);
      toast.success('Service Type Added');
    } catch (e) { toast.error('Save failed'); }
  };

  const handleSaveAmbulance = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingAmbulance) {
        await updateDoc(doc(db, 'ambulance_fleet', editingAmbulance), ambulanceForm);
        toast.success('Ambulance Record Updated');
      } else {
        await addDoc(collection(db, 'ambulance_fleet'), { ...ambulanceForm, createdAt: new Date().toISOString() });
        toast.success('Ambulance Added to Fleet');
      }
      setShowAddAmbulance(false);
      setEditingAmbulance(null);
    } catch (err) { toast.error('Save failed'); }
    setIsSaving(false);
  };

  const handleUpdateAmbulanceBookingStatus = async (booking, newStatus) => {
    const isConfirmed = await confirm({
      title: 'Update Trip Status?',
      message: `Change medical transport status to "${newStatus}"? This will be reflected in the patient's tracker.`,
      confirmText: 'Update Status',
      type: 'warning'
    });
    if (!isConfirmed) return;
    try {
      await updateDoc(doc(db, 'ambulance_bookings', booking.id), { status: newStatus });
      
      // If completed or cancelled, free up the ambulance
      if ((newStatus === 'completed' || newStatus === 'cancelled') && booking.assignedAmbulanceId) {
        await updateDoc(doc(db, 'ambulance_fleet', booking.assignedAmbulanceId), { status: 'available' });
      }
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) { toast.error('Update failed'); }
  };

  const handleCompleteAssignment = async (ambulance) => {
    if (!selectedBookingForAssignment) return;
    const isConfirmed = await confirm({
      title: 'Confirm Dispatch?',
      message: `Assign ambulance ${ambulance.plateNumber} to ${selectedBookingForAssignment.patientName}'s request?`,
      confirmText: 'Confirm & Dispatch',
      type: 'success'
    });
    if (!isConfirmed) return;
    setIsSaving(true);
    try {
      // 1. Update Booking
      await updateDoc(doc(db, 'ambulance_bookings', selectedBookingForAssignment.id), {
        assignedAmbulanceId: ambulance.id,
        status: 'assigned'
      });

      // 2. Update Ambulance Status
      await updateDoc(doc(db, 'ambulance_fleet', ambulance.id), {
        status: 'on-trip'
      });

      toast.success(`Ambulance ${ambulance.plateNumber} assigned!`);
      setShowAssignModal(false);
      setSelectedBookingForAssignment(null);
    } catch (err) { toast.error('Assignment failed'); }
    setIsSaving(false);
  };

 const [pendingPayments, setPendingPayments] = useState([]);
 const [isProcessingPayment, setIsProcessingPayment] = useState(false);
 const [allAppointments, setAllAppointments] = useState([]);
 const [productOrders, setProductOrders] = useState([]);
 const [financials, setFinancials] = useState({
 totalEarnings: 0,
 serviceFees: 0,
 pendingPayouts: 0,
 activeCoupons: 0,
 monthlyData: new Array(12).fill(0).map((_, i) => ({ month: i, revenue: 0, commission: 0 }))
 });

 const [stats, setStats] = useState([
 { name: 'Total Doctors', value: '0', growth: '+12%', icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
 { name: 'Active Patients', value: '0', growth: '+18%', icon: UserCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
 { name: 'Staff Members', value: '0', growth: '+2%', icon: ShieldCheck, color: 'text-stone-600', bg: 'bg-stone-50' },
 { name: 'Revenue', value: '৳0k', growth: '+24%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
 ]);

 useEffect(() => {
 const qPending = query(collection(db, 'users'), where('status', '==', 'pending'));
 const unPending = onSnapshot(qPending, (snapshot) => {
 setPendingProviders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 });

    const unStaff = onSnapshot(query(collection(db, 'users'), where('role', '==', 'receptionist')), (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      setStaff(sorted);
    });

 const unAllUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
 let doctors = 0;
 let patients = 0;
 let receptionists = 0;
 snapshot.forEach(doc => {
 const data = doc.data();
 if (data.role === 'doctor') doctors++;
 if (data.role === 'patient') patients++;
 if (data.role === 'receptionist') receptionists++;
 });
 setStats(prev => [
 { ...prev[0], value: doctors.toString() },
 { ...prev[1], value: patients.toString() },
 { ...prev[2], value: receptionists.toString() },
 prev[3]
 ]);
 // Remove loading state once initial data stream is established
 setIsDataLoaded(true);
 });

 const unSpecialties = onSnapshot(collection(db, 'specialties'), (snapshot) => {
 setSpecialties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 setIsSpecialtiesLoaded(true);
 });

    const qPatients = query(collection(db, 'users'), where('role', '==', 'patient'));
    const unPatients = onSnapshot(qPatients, (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      setPatients(sorted);
      setIsPatientsLoading(false);
    });

    const qDoctors = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const unDoctors = onSnapshot(qDoctors, (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      setDoctors(sorted);
      setIsDoctorsLoading(false);
    });

 // Settings listeners
 const unSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
 if (snapshot.exists()) setGlobalSettings(snapshot.data());
 });

 const unPayMethods = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
 setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 });

 const unCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
 setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 });

    const unManualPayments = onSnapshot(query(collection(db, 'manual_payments'), where('status', '==', 'pending')), (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      setPendingPayments(sorted);
    });

  const unAllAppts = onSnapshot(collection(db, 'appointments'), (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    setAllAppointments(sorted);
  });

  const unProviders = onSnapshot(collection(db, 'lab_providers'), (snap) => {
  setLabProviders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  const unTests = onSnapshot(collection(db, 'lab_tests'), (snap) => {
  setLabTests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  const unLabBookings = onSnapshot(query(collection(db, 'lab_bookings'), orderBy('createdAt', 'desc')), (snap) => {
    setLabBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  const unLocations = onSnapshot(collection(db, 'locations'), (snap) => {
    const data = snap.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data() }), {});
    mergeLocations(data);
    setLocVersion(v => v + 1);
  });

  const unCaregivers = onSnapshot(collection(db, 'nursing_providers'), (snap) => {
    setCaregivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setIsNursingLoading(false);
  });

  const unNursingBookings = onSnapshot(query(collection(db, 'nursing_bookings'), orderBy('createdAt', 'desc')), (snap) => {
    setNursingBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  const unNursingPackages = onSnapshot(collection(db, 'nursing_packages'), (snap) => {
    setNursingPackages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  const unNursingTypes = onSnapshot(collection(db, 'nursing_types'), (snap) => {
    setNursingTypes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  return () => {
    unPending();
    unStaff();
    unAllUsers();
    unSpecialties();
    unPatients();
    unDoctors();
    unSettings();
    unPayMethods();
    unCoupons();
    unManualPayments();
    unAllAppts();
    unProviders();
    unTests();
    unLabBookings();
    unLocations();
    unCaregivers();
    unNursingBookings();
    unNursingPackages();
    unNursingTypes();
  };
 }, []);

 useEffect(() => {
  const unAmbulanceBookings = onSnapshot(query(collection(db, 'ambulance_bookings'), orderBy('createdAt', 'desc')), (snap) => {
    setAmbulanceBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  const unProductOrders = onSnapshot(query(collection(db, 'product_orders'), orderBy('createdAt', 'desc')), (snap) => {
    setProductOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  const unAmbulanceFleet = onSnapshot(collection(db, 'ambulance_fleet'), (snap) => {
    setAmbulanceFleet(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setIsAmbulanceLoading(false);
  });
  return () => {
    unAmbulanceBookings();
    unProductOrders();
    unAmbulanceFleet();
  };
 }, []);

 useEffect(() => {
 if (!auth.currentUser) return;
 const unAdmin = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snapshot) => {
 if (snapshot.exists()) setAdminProfile(snapshot.data());
 });
 return () => unAdmin();
 }, [auth.currentUser]);

 const handleUpdateAdminProfile = async () => {
 if (!auth.currentUser) return;
 setIsUpdatingProfile(true);
 try {
 await updateDoc(doc(db, 'users', auth.currentUser.uid), {
 fullName: adminProfile.fullName,
 phone: adminProfile.phone
 });
 toast.success('Profile updated successfully');
 } catch (e) { 
 console.error(e);
 toast.error('Failed to update profile'); 
 }
 setIsUpdatingProfile(false);
 };

 const handleAdminPhotoUpload = async (e) => {
 const file = e.target.files[0];
 if (!file || !auth.currentUser) return;
 
 setIsUpdatingProfile(true);
 try {
 const storageRef = ref(storage, `users/${auth.currentUser.uid}/profile_${Date.now()}`);
 await uploadBytes(storageRef, file);
 const url = await getDownloadURL(storageRef);
 await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: url });
 toast.success('Photo updated');
 } catch (e) { toast.error('Upload failed'); }
 setIsUpdatingProfile(false);
 };

 // Universal Financial Aggregator
 useEffect(() => {
   const allTransactions = [
     ...allAppointments.filter(a => a.status === 'completed' || a.status === 'confirmed' || a.paymentStatus === 'paid'),
     ...(labBookings || []).filter(l => l.status === 'confirmed' || l.paymentStatus === 'paid'),
     ...(nursingBookings || []).filter(n => n.status === 'confirmed' || n.paymentStatus === 'paid'),
     ...(productOrders || []).filter(p => (p.status === 'delivered' || p.status === 'processing') && p.paymentStatus !== 'failed')
   ];
   
   let earnings = 0;
   let fees = 0;
   let monthly = new Array(12).fill(0).map((_, i) => ({ month: i, revenue: 0, commission: 0 }));

   const commissionRate = Number(globalSettings?.platformCommission) || 10;

   allTransactions.forEach(tx => {
     const amount = Number(tx.amount || tx.totalAmount || tx.total || 0);
     const commission = (amount * commissionRate) / 100;
     
     earnings += amount;
     fees += commission;

     if (tx.createdAt) {
       let date;
       if (tx.createdAt.toDate) date = tx.createdAt.toDate();
       else date = new Date(tx.createdAt);

       if (!isNaN(date.getTime())) {
         const month = date.getMonth();
         if (month >= 0 && month < 12) {
           monthly[month].revenue += amount;
           monthly[month].commission += commission;
         }
       }
     }
   });

   setFinancials({
     totalEarnings: earnings,
     serviceFees: fees,
     pendingPayouts: doctors.reduce((acc, doc) => acc + (Number(doc.balance) || 0), 0),
     activeCoupons: coupons.filter(c => c.status === 'active').length,
     monthlyData: monthly
   });

   setStats(prev => {
     const newStats = [...prev];
     if (newStats[3]) {
       newStats[3] = { ...newStats[3], value: `৳${(earnings / 1000).toFixed(1)}k` };
     }
     return newStats;
   });
 }, [allAppointments, labBookings, nursingBookings, productOrders, globalSettings, doctors, coupons]);

 const getDoctorBalance = (doctorId) => {
 return allAppointments
 .filter(a => a.doctorId === doctorId && (a.status === 'completed' || a.paymentStatus === 'paid') && a.payoutStatus !== 'released')
 .reduce((acc, a) => {
 const amount = Number(a.amount) || 0;
 const commission = (amount * (Number(globalSettings.platformCommission) || 10)) / 100;
 return acc + (amount - commission);
 }, 0);
 };

 // --- SEEDING LOGIC ---
 useEffect(() => {
 if (isSpecialtiesLoaded && specialties.length === 0) {
 seedSpecialties();
 }
 }, [isSpecialtiesLoaded, specialties.length]);

 useEffect(() => {
 if (!selectedPatient) {
 setPatientAppointments([]);
 setPatientFiles([]);
 return;
 }
 
 // Live Appointments
 const qAppts = query(collection(db, 'appointments'), where('patientId', '==', selectedPatient.id));
 const unAppts = onSnapshot(qAppts, (snapshot) => {
 setPatientAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 });

 // Live Files/Records
 setIsFilesLoading(true);
 const qFiles = query(collection(db, 'medical_records'), where('patientId', '==', selectedPatient.id));
 const unFiles = onSnapshot(qFiles, (snapshot) => {
 setPatientFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 setIsFilesLoading(false);
 });

 // Hydrate form
 setPatientForm({
 fullName: selectedPatient.fullName || '',
 email: selectedPatient.email || '',
 phone: selectedPatient.phone || '',
 address: selectedPatient.address || '',
 bloodGroup: selectedPatient.bloodGroup || '',
 status: selectedPatient.status || 'active',
 photoURL: selectedPatient.photoURL || '',
 isVerified: !!selectedPatient.isVerified
 });
 setPatientFile(null);

 return () => {
 unAppts();
 unFiles();
 };
 }, [selectedPatient]);

  const filteredPatients = useMemo(() => patients.filter(p => {
    const matchesSearch = (p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.email?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone?.includes(patientSearch));
      
    if (filterStatus === 'active') return matchesSearch && (p.status === 'active' || p.status === 'approved');
    if (filterStatus === 'deactivated') return matchesSearch && (p.status !== 'active' && p.status !== 'approved');
    return matchesSearch;
  }), [patients, patientSearch, filterStatus]);

  const filteredDoctors = useMemo(() => doctors.filter(d => {
    return (
      d.fullName?.toLowerCase().includes(doctorSearch.toLowerCase()) || 
      d.email?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.phone?.includes(doctorSearch) ||
      d.specialties?.some(s => s.toLowerCase().includes(doctorSearch.toLowerCase()))
    );
  }), [doctors, doctorSearch]);

  const filteredStaff = useMemo(() => staff.filter(s => {
    const searchLower = staffSearch.toLowerCase();
    return (
      (s.fullName || s.name || '').toLowerCase().includes(searchLower) ||
      (s.email || '').toLowerCase().includes(searchLower) ||
      (s.phone || '').includes(staffSearch)
    );
  }), [staff, staffSearch]);

  const allClinicalRecords = useMemo(() => {
    return [
      ...allAppointments.map(a => ({ ...a, category: 'Specialist', providerName: a.doctorName || 'General Physician' })),
      ...labBookings.map(l => ({ ...l, category: 'Laboratory', providerName: 'Diagnostic Wing' })),
      ...nursingBookings.map(n => ({ ...n, category: 'Nursing', providerName: n.caregiverName || 'Healthcare Provider' })),
      ...productOrders.map(p => ({ ...p, category: 'Pharmacy', providerName: 'HealthStore' }))
    ].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, [allAppointments, labBookings, nursingBookings, productOrders]);

  const filteredAppointments = useMemo(() => allClinicalRecords.filter(appt => {
    const searchLower = (apptSearch || '').toLowerCase();
    const matchesSearch = 
      (appt.patientName || '').toLowerCase().includes(searchLower) ||
      (appt.providerName || '').toLowerCase().includes(searchLower) ||
      (appt.id || '').toLowerCase().includes(searchLower);
      
    if (!matchesSearch) return false;
    
    if (apptFilter === 'all') return true;
    if (apptFilter === 'today') {
      const today = new Date().toLocaleDateString();
      const apptDate = appt.date ? (appt.date.toDate ? appt.date.toDate().toLocaleDateString() : new Date(appt.date).toLocaleDateString()) : '';
      return apptDate === today;
    }
    if (apptFilter === 'upcoming') return appt.status === 'confirmed' || appt.status === 'pending';
    if (apptFilter === 'completed') return appt.status === 'completed';
    if (apptFilter === 'cancelled') return appt.status === 'cancelled';
    return true;
  }), [allClinicalRecords, apptSearch, apptFilter]);

 const handleCancelAppointment = async (apptId) => {
 const isConfirmed = await confirm({
 title: 'Cancel Appointment',
 message: 'Are you sure you want to cancel this appointment? This will notify the patient and the doctor.',
 confirmText: 'Cancel Appointment',
 type: 'danger'
 });
 if (!isConfirmed) return;
 try {
 await updateDoc(doc(db, 'appointments', apptId), { status: 'cancelled' });
 toast.success('Appointment cancelled');
 } catch (err) { toast.error('Cancellation failed'); }
 };

 const handleUpdatePatient = async (e) => {
 e.preventDefault();
 if (!selectedPatient) return;
 setIsSaving(true);
 try {
 let finalPhotoURL = patientForm.photoURL;

 // Handle Permanent Image Upload if a new file was selected
 if (patientFile) {
 try {
 const storageRef = ref(storage, `patient_photos/${selectedPatient.id}_${Date.now()}`);
 const uploadRes = await uploadBytes(storageRef, patientFile);
 finalPhotoURL = await getDownloadURL(uploadRes.ref);
 } catch (uploadErr) {
 console.error('Storage Upload Error:', uploadErr);
 if (uploadErr.code === 'storage/unauthorized' || uploadErr.message.includes('CORS')) {
 toast.error('CORS Error: Please check your Firebase Storage CORS configuration.');
 } else {
 toast.error('Failed to upload patient photo. Using existing photo.');
 }
 // Revert to old photo if upload fails, to prevent saving a blob URL
 finalPhotoURL = selectedPatient.photoURL || null;
 }
 } 
 
 // Final Sanitization: Ensure no blob URLs ever reach Firestore
 if (finalPhotoURL?.startsWith('blob:')) {
 finalPhotoURL = selectedPatient.photoURL || null;
 }

 const updateData = {
 fullName: patientForm.fullName,
 email: patientForm.email,
 phone: patientForm.phone,
 address: patientForm.address,
 bloodGroup: patientForm.bloodGroup,
 status: patientForm.status,
 photoURL: finalPhotoURL,
 isVerified: !!patientForm.isVerified
 };
 
 await updateDoc(doc(db, 'users', selectedPatient.id), updateData);
 
 setSelectedPatient({ ...selectedPatient, ...updateData });
 setIsEditingPatient(false);
 setPatientFile(null);
 toast.success(`Patient profile ${updateData.status === 'active' ? 'Activated' : 'Deactivated'} successfully`);
 } catch (err) {
 console.error('Update Failed:', err);
 toast.error('Failed to update clinical profile');
 } finally {
 setIsSaving(false);
 }
 };

 const handleDeactivatePatient = async (patientId) => {
 try {
 await updateDoc(doc(db, 'users', patientId), {
 status: 'deactivated',
 deactivatedAt: new Date().toISOString()
 });
 toast.success('Patient access revoked');
 } catch (error) {
 console.error(error);
 toast.error('Failed to revoke access');
 }
 };

 const handleReactivatePatient = async (patientId) => {
 try {
 await updateDoc(doc(db, 'users', patientId), {
 status: 'active',
 reactivatedAt: new Date().toISOString(),
 deactivatedAt: null
 });
 toast.success('Patient access restored');
 } catch (error) {
 console.error(error);
 toast.error('Failed to restore access');
 }
 };

 const handleUploadFile = async (e) => {
 const file = e.target.files?.[0];
 if (!file || !selectedPatient) return;
 
 setIsUploading(true);
 try {
 const newRecord = {
 patientId: selectedPatient.id,
 fileName: file.name,
 type: file.type.includes('image') ? 'Radiology Imaging' : 'Laboratory Report',
 createdAt: new Date().toISOString(),
 fileUrl: '#',
 size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
 };
 
 await setDoc(doc(collection(db, 'medical_records')), newRecord);
 toast.success(`${file.name} successfully archived`);
 } catch (err) {
 console.error(err);
 toast.error('File archiving failed');
 } finally {
 setIsUploading(false);
 }
 };

 const handleDeleteFile = async (file) => {
 if (!file.id) return;
 const isConfirmed = await confirm({
 title: 'Delete Document',
 message: `Are you sure you want to permanently delete "${file.fileName}"? This action cannot be undone.`,
 confirmText: 'Delete File',
 type: 'danger'
 });

 if (isConfirmed) {
 try {
 await deleteDoc(doc(db, 'medical_records', file.id));
 toast.success('Document removed from archive');
 } catch (err) {
 console.error(err);
 toast.error('Failed to remove document');
 }
 }
 };

 const seedSpecialties = async () => {
 const initialData = {
 'Cardiology': { icon: 'Heart', color: 'text-emerald-500', bg: 'bg-emerald-50', services: [
 { name: 'ECG Interpretation', price: 1500, telemed: true, telemedPrice: 1000 },
 { name: 'Stress Test (ETT)', price: 3500, telemed: false },
 { name: 'Echocardiogram', price: 4000, telemed: false }
 ]},
 'Neurology': { icon: 'Brain', color: 'text-blue-500', bg: 'bg-blue-50', services: [
 { name: 'Stroke Assessment', price: 2500, telemed: true, telemedPrice: 2000 },
 { name: 'Memory Screening', price: 2000, telemed: true, telemedPrice: 1500 }
 ]},
 'Pediatrics': { icon: 'Baby', color: 'text-rose-500', bg: 'bg-rose-50', services: [
 { name: 'Vaccination', price: 500, telemed: false },
 { name: 'Growth Monitoring', price: 1200, telemed: true, telemedPrice: 1000 }
 ]}
 };

 for (const [name, data] of Object.entries(initialData)) {
 await setDoc(doc(db, 'specialties', name), {
 name,
 ...data,
 createdAt: new Date().toISOString()
 });
 }
 };

 const handleSaveSpecialty = async (e) => {
 e.preventDefault();
 setIsSaving(true);
 try {
 await setDoc(doc(db, 'specialties', specForm.name), {
 ...specForm,
 services: [],
 createdAt: new Date().toISOString()
 });
 setShowAddSpecialty(false);
 setSpecForm({ name: '', icon: 'Heart', color: 'text-emerald-500', bg: 'bg-emerald-50' });
 } catch (error) {
 console.error("Save specialty error:", error);
 } finally {
 setIsSaving(false);
 }
 };

 const handleDeleteSpecialty = async (id) => {
 const isConfirmed = await confirm({
 title: 'Delete Specialty',
 message: 'Are you absolutely sure? This will permanently remove the specialty and all associated clinical services from the system.',
 confirmText: 'Delete Specialty',
 type: 'danger'
 });
 if (!isConfirmed) return;
 try {
 await updateDoc(doc(db, 'specialties', id), { deleted: true }); // Or actual delete
 // For now, actual delete for clean records
 const { deleteDoc } = await import('firebase/firestore');
 await deleteDoc(doc(db, 'specialties', id));
 if (selectedSpecialty?.id === id) setSelectedSpecialty(null);
 } catch (error) {
 console.error("Delete specialty error:", error);
 }
 };

 const handleSaveService = async (e) => {
 e.preventDefault();
 setIsSaving(true);
 try {
 const updatedServices = [...(selectedSpecialty.services || [])];
 const newService = {
 name: serviceForm.name,
 price: Number(serviceForm.price),
 telemed: serviceForm.telemed,
 telemedPrice: serviceForm.telemed ? Number(serviceForm.telemedPrice) : 0
 };

 if (editingService !== null) {
 updatedServices[editingService] = newService;
 } else {
 updatedServices.push(newService);
 }

 await updateDoc(doc(db, 'specialties', selectedSpecialty.id), {
 services: updatedServices
 });
 
 setShowAddService(false);
 setEditingService(null);
 setServiceForm({ name: '', price: '', telemed: false, telemedPrice: '' });
 // Update local selection for UI
 setSelectedSpecialty({ ...selectedSpecialty, services: updatedServices });
 } catch (error) {
 console.error("Save service error:", error);
 } finally {
 setIsSaving(false);
 }
 };

 const handleDeleteService = async (idx) => {
 const isConfirmed = await confirm({
 title: 'Remove Service',
 message: 'This will remove the selected treatment code from the active directory. Existing appointments are not affected.',
 confirmText: 'Remove Service',
 type: 'warning'
 });
 if (!isConfirmed) return;
 try {
 const updatedServices = selectedSpecialty.services.filter((_, i) => i !== idx);
 await updateDoc(doc(db, 'specialties', selectedSpecialty.id), {
 services: updatedServices
 });
 setSelectedSpecialty({ ...selectedSpecialty, services: updatedServices });
 } catch (error) {
 console.error("Delete service error:", error);
 }
 };

 const ICON_MAP = {
 Heart, Brain, Baby, Bone, Droplets, Eye, Microscope, Pill, Syringe, Thermometer, Stethoscope, Activity,
 FlaskConical, Dna, Zap, Waves, Smile, ShieldPlus, ClipboardList, Hospital, Ambulance, Bandage, Ear, Footprints, Hand
 };

 const COLORS = [
 { name: 'Emerald Green', color: 'text-emerald-500', bg: 'bg-emerald-50' },
 { name: 'Ocean Blue', color: 'text-blue-500', bg: 'bg-blue-50' },
 { name: 'Indigo Night', color: 'text-indigo-500', bg: 'bg-indigo-50' },
 { name: 'Rose Red', color: 'text-rose-500', bg: 'bg-rose-50' },
 { name: 'Amber Yellow', color: 'text-amber-500', bg: 'bg-amber-50' },
 { name: 'Cyan Teal', color: 'text-cyan-500', bg: 'bg-cyan-50' },
 { name: 'Vibrant Purple', color: 'text-purple-500', bg: 'bg-purple-50' },
 { name: 'Warm Orange', color: 'text-orange-500', bg: 'bg-orange-50' },
 { name: 'Slate Stone', color: 'text-slate-500', bg: 'bg-slate-50' },
 ];

 const IconComponent = ({ name, ...props }) => {
 const Icon = ICON_MAP[name] || Heart;
 return <Icon {...props} />;
 };

  const approveProvider = async (uid) => {
    const isConfirmed = await confirm({
      title: 'Approve Specialist?',
      message: 'This will grant the specialist full access to their dashboard and list them as an active provider in the directory.',
      confirmText: 'Approve Access',
      type: 'success'
    });
    
    if (!isConfirmed) return;

    try {
      await updateDoc(doc(db, 'users', uid), { 
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      toast.success('Provider approved successfully');
    } catch (error) {
      console.error("Approval error:", error);
      toast.error('Failed to approve provider');
    }
  };

  const rejectProvider = async (uid) => {
    const isConfirmed = await confirm({
      title: 'Reject Application?',
      message: 'This will deny the specialist access and notify them of the rejection. You can still review their details in the archive.',
      confirmText: 'Reject & Notify',
      type: 'danger'
    });
    
    if (!isConfirmed) return;

    try {
      await updateDoc(doc(db, 'users', uid), { 
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
      toast.error('Application rejected');
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error('Failed to reject application');
    }
  };

 const handleCreateStaff = async (e) => {
 e.preventDefault();
 setIsCreatingStaff(true);
 try {
 const res = await createUserWithEmailAndPassword(secondaryAuth, staffForm.email, staffForm.password);
 await setDoc(doc(db, 'users', res.user.uid), {
 uid: res.user.uid,
 email: staffForm.email,
 fullName: staffForm.name,
 phone: staffForm.phone,
 role: 'receptionist',
 status: 'approved',
 createdAt: new Date().toISOString()
 });
 secondaryAuth.signOut();
 setShowAddStaff(false);
 setStaffForm({ name: '', email: '', phone: '', password: '' });
 toast.success('Staff member registered successfully');
 } catch (error) {
 if (!['auth/email-already-in-use', 'auth/invalid-email'].includes(error.code)) {
 console.error(error);
 }
 let errorMsg = error.message;
 if (error.code === 'auth/email-already-in-use') {
 errorMsg = "This email address is already registered.";
 } else if (error.code === 'auth/invalid-email') {
 errorMsg = "Invalid email address style.";
 }
 toast.error(errorMsg);
 } finally {
 setIsCreatingStaff(false);
 }
 };

 const checkInstantBookingEligibility = (doctorServices) => {
 if (!doctorServices || doctorServices.length === 0) return false;
 // Check global specialties tree mapping
 return specialties.some(spec => 
 spec.services.some(serv => 
 serv.telemed && doctorServices.includes(serv.name)
 )
 );
 };

 const handleToggleDoctorStatus = async (doctorId, field, currentValue, services) => {
 try {
 if (field === 'instantBooking' && !currentValue) {
 // Enforce telemed rule when trying to turn it ON
 if (!checkInstantBookingEligibility(services)) {
 toast.error('Telemedicine service required for Instant Booking');
 return;
 }
 }

 await updateDoc(doc(db, 'users', doctorId), {
 [field]: !currentValue,
 lastStatusUpdate: new Date().toISOString()
 });
 
 toast.success(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated`);
 } catch (error) {
 console.error(error);
 toast.error('Failed to update status');
 }
 };

  const handleDeactivateDoctor = async (doctorId) => {
    try {
      await updateDoc(doc(db, 'users', doctorId), {
        status: 'deactivated',
        deactivatedAt: new Date().toISOString()
      });
      toast.success('Doctor access revoked safely');
    } catch (error) {
      console.error(error);
      toast.error('Failed to revoke access');
    }
  };

  const handleReactivateDoctor = async (doctorId) => {
    try {
      await updateDoc(doc(db, 'users', doctorId), {
        status: 'approved',
        reactivatedAt: new Date().toISOString(),
        deactivatedAt: null
      });
      toast.success('Doctor access restored');
    } catch (error) {
      console.error(error);
      toast.error('Failed to restore access');
    }
  };

  const approveManualPayment = async (payment) => {
    try {
      if (!payment?.id) return toast.error("Critical: No payment ID found");
      
      const isConfirmed = await confirm({
        title: 'Verify & Approve Payment?',
        message: `Are you sure you want to verify the transaction of ৳${payment.amount} for ${payment.userName || 'this user'}? This will confirm all linked services.`,
        confirmText: 'Approve & Confirm',
        type: 'success'
      });
      
      if (!isConfirmed) return;
      
      setIsProcessingPayment(true);
      const toastId = toast.loading('Verifying payment & updating linked bookings...');
      
      // 1. Resolve related bookings safely
      let related = [];
      if (Array.isArray(payment.relatedBookings)) {
        related = payment.relatedBookings;
      } else if (payment.appointmentId) {
        related = [{ id: payment.appointmentId, collection: payment.appointmentCollection || 'appointments' }];
      }

      let successes = 0;
      // 2. Process updates sequentially with existence checks
      for (const booking of related) {
        if (booking?.id && booking?.collection) {
          try {
            const bookingRef = doc(db, booking.collection, booking.id);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
              await updateDoc(bookingRef, {
                status: 'confirmed',
                paymentStatus: 'paid',
                confirmedAt: new Date().toISOString(),
                manualVerificationId: payment.id
              });
              successes++;
            } else {
              console.warn(`Booking document missing: ${booking.collection}/${booking.id}`);
            }
          } catch (e) {
            console.error(`Status update failed for ${booking.id}:`, e);
          }
        }
      }

      // 3. Update the payment record
      await updateDoc(doc(db, 'manual_payments', payment.id), {
        status: 'approved',
        processedAt: new Date().toISOString(),
        verifiedBy: auth.currentUser?.email || 'admin',
        successCount: successes
      });

      toast.success(successes > 0 ? `Verified! Updated ${successes} linked bookings.` : 'Payment approved (no linked bookings found).', { id: toastId });
    } catch (error) {
      console.error("Approve Error:", error);
      alert("Verification Error: " + error.message);
      toast.error('Process failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const rejectManualPayment = async (payment) => {
    try {
      if (!payment?.id) return toast.error("Error: Payment data missing");
      
      const isConfirmed = await confirm({
        title: 'Reject Payment Request?',
        message: `Reject payment from ${payment.userName || 'this user'}? This will mark the request as failed and cancel linked bookings.`,
        confirmText: 'Reject & Cancel',
        type: 'danger'
      });
      
      if (!isConfirmed) return;
      
      setIsProcessingPayment(true);
      const toastId = toast.loading('Processing rejection...');

      // 1. Identify all related bookings
      const related = payment.relatedBookings || [
        { id: payment.appointmentId, collection: payment.appointmentCollection || 'appointments' }
      ];

      for (const booking of related) {
        if (booking?.id && booking?.collection) {
          try {
            const bookingRef = doc(db, booking.collection, booking.id);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
              await updateDoc(bookingRef, {
                status: 'cancelled',
                paymentStatus: 'failed',
                rejectionReason: 'Payment verification failed'
              });
            }
          } catch (err) {
            console.error(`Failed to cancel booking ${booking.id}:`, err);
          }
        }
      }

      // 2. Update the manual payment record
      await updateDoc(doc(db, 'manual_payments', payment.id), {
        status: 'rejected',
        processedAt: new Date().toISOString()
      });

      toast.success('Payment rejected & bookings cancelled', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Rejection failed', { id: (typeof toastId !== 'undefined' ? toastId : undefined) });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const deleteManualPayment = async (payment) => {
    try {
      if (!payment?.id) return toast.error("Error: Payment ID missing");
      
      const isConfirmed = await confirm({
        title: 'Delete Payment Request?',
        message: 'Are you sure? This will PERMANENTLY remove the payment record and all associated clinical bookings. This cannot be undone.',
        confirmText: 'Delete Permanently',
        type: 'danger'
      });
      
      if (!isConfirmed) return;
      
      setIsProcessingPayment(true);
      const toastId = toast.loading('Purging records...');
      
      let related = [];
      if (Array.isArray(payment.relatedBookings)) {
        related = payment.relatedBookings;
      } else if (payment.appointmentId) {
        related = [{ id: payment.appointmentId, collection: payment.appointmentCollection || 'appointments' }];
      }

      for (const booking of related) {
        if (booking?.id && booking?.collection) {
          try {
            const bookingRef = doc(db, booking.collection, booking.id);
            const bookingSnap = await getDoc(bookingRef);
            if (bookingSnap.exists()) {
              await deleteDoc(bookingRef);
            }
          } catch (e) {
            console.error("Link delete failed:", e);
          }
        }
      }

      await deleteDoc(doc(db, 'manual_payments', payment.id));
      toast.success('Record purged', { id: toastId });
    } catch (error) {
      console.error("Purge Error:", error);
      alert("Delete Error: " + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };


 const handleRegisterDoctor = async (e) => {
 e.preventDefault();
 if (doctorForm.specialties.length === 0) {
 toast.error('Please select at least one specialty');
 return;
 }
 setIsCreatingDoctor(true);
 try {
 let finalPhotoURL = doctorForm.photoURL || '';
 const doctorId = editingDoctor ? editingDoctor.id : Math.random().toString(36).substring(7);

 if (doctorPhotoFile) {
 const storageRef = ref(storage, `doctor_photos/${doctorId}_${Date.now()}`);
 const uploadRes = await uploadBytes(storageRef, doctorPhotoFile);
 finalPhotoURL = await getDownloadURL(uploadRes.ref);
 }

 if (editingDoctor) {
 await updateDoc(doc(db, 'users', editingDoctor.id), {
 fullName: doctorForm.fullName,
 photoURL: finalPhotoURL,
 phone: doctorForm.phone,
 gender: doctorForm.gender,
 dob: doctorForm.dob,
 nid: doctorForm.nid,
 nationality: doctorForm.nationality,
 address: doctorForm.address,
 city: doctorForm.city,
 postalCode: doctorForm.postalCode,
 bmdcCode: doctorForm.bmdcCode,
 bmdcExpiry: doctorForm.bmdcExpiry,
 experience: doctorForm.experience,
 bio: doctorForm.bio,
 degrees: doctorForm.degrees,
 specialties: doctorForm.specialties,
 services: doctorForm.services,
 fee: doctorForm.fee,
 followUpDays: doctorForm.followUpDays,
 followUpCost: doctorForm.followUpCost,
 bankName: doctorForm.bankName,
 accountNumber: doctorForm.accountNumber,
 routingNumber: doctorForm.routingNumber,
 mobilePaymentNo: doctorForm.mobilePaymentNo,
 paymentMethods: doctorForm.paymentMethods,
 });
 toast.success('Doctor credentials updated successfully');
 } else {
 const res = await createUserWithEmailAndPassword(secondaryAuth, doctorForm.email, doctorForm.password);
 await setDoc(doc(db, 'users', res.user.uid), {
 uid: res.user.uid,
 email: doctorForm.email,
 fullName: doctorForm.fullName,
 photoURL: finalPhotoURL,
 phone: doctorForm.phone,
 role: 'doctor',
 gender: doctorForm.gender,
 dob: doctorForm.dob,
 nid: doctorForm.nid,
 nationality: doctorForm.nationality,
 address: doctorForm.address,
 city: doctorForm.city,
 postalCode: doctorForm.postalCode,
 bmdcCode: doctorForm.bmdcCode,
 bmdcExpiry: doctorForm.bmdcExpiry,
 experience: doctorForm.experience,
 bio: doctorForm.bio,
 degrees: doctorForm.degrees,
 specialties: doctorForm.specialties,
 services: doctorForm.services,
 fee: doctorForm.fee,
 followUpDays: doctorForm.followUpDays,
 followUpCost: doctorForm.followUpCost,
 bankName: doctorForm.bankName,
 accountNumber: doctorForm.accountNumber,
 routingNumber: doctorForm.routingNumber,
 mobilePaymentNo: doctorForm.mobilePaymentNo,
 paymentMethods: doctorForm.paymentMethods,
 status: 'approved',
 isVerified: true,
 createdAt: new Date().toISOString()
 });
 secondaryAuth.signOut();
 toast.success('Doctor registered successfully');
 }
 setShowRegisterDoctor(false);
 setEditingDoctor(null);
 setDoctorForm({ 
 fullName: '', email: '', phone: '', password: '', 
 gender: '', dob: '', nid: '', nationality: '',
 address: '', city: '', postalCode: '',
 bmdcCode: '', bmdcExpiry: '', experience: '', bio: '',
 degrees: [], specialties: [], services: [], 
 fee: '', followUpDays: '', followUpCost: '',
 bankName: '', accountNumber: '', routingNumber: '', mobilePaymentNo: '',
 paymentMethods: [],
 photoURL: ''
 });
 setDoctorPhotoFile(null);
 } catch (error) {
 if (!['auth/email-already-in-use', 'auth/invalid-email', 'auth/weak-password'].includes(error.code)) {
 console.error(error);
 }
 let errorMsg = error.message;
 if (error.code === 'auth/email-already-in-use') {
 errorMsg = "This email address is already registered to another user.";
 } else if (error.code === 'auth/invalid-email') {
 errorMsg = "The email address is invalid.";
 } else if (error.code === 'auth/weak-password') {
 errorMsg = "The password is too weak.";
 }
 toast.error(errorMsg);
 } finally {
 setIsCreatingDoctor(false);
 }
 };

 useEffect(() => {
 if (showRegisterDoctor && doctorForm.paymentMethods.length > 0 && doctorFormRef.current) {
 setTimeout(() => {
 doctorFormRef.current.scrollTo({
 top: doctorFormRef.current.scrollHeight,
 behavior: 'smooth'
 });
 }, 150);
 }
 }, [doctorForm.paymentMethods.length, showRegisterDoctor]);

 const containerVariants = {
 hidden: { opacity: 0, y: 15 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
 exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: "easeIn" } }
 };

 return (
 <DashboardLayout role="admin">
 <div className="w-full relative min-h-[60vh]">
 
 {/* Diagnostic Preloader */}
 <AnimatePresence>
 {!isDataLoaded && (
 <motion.div 
 initial={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
 >
 <div className="relative flex items-center justify-center">
 <div className="absolute inset-0 border-2 border-emerald-100 rounded-full animate-ping opacity-20"></div>
 <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 z-10">
 <Loader2 size={24} className="text-emerald-500 animate-spin" />
 </div>
 </div>
 <div className="mt-4 flex flex-col items-center">
 <span className="text-[10px] font-extrabold text-slate-400 tracking-[0.2em] uppercase">Initializing</span>
 <span className="text-[11px] font-bold text-[#1e4a3a] tracking-tight mt-1">Establishing secure connection...</span>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {isDataLoaded && activeTab === 'overview' && (
 <motion.div 
 key="overview"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-8"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {stats.map((stat, idx) => (
 <motion.div 
 key={idx} 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.15, duration: 0.15, ease: "easeOut" }}
 className={`p-5 ${stat.bg} rounded-xl border border-slate-300 transition-all hover:brightness-95`}
 >
 <div className="flex items-center justify-between mb-4">
 <div className={`w-10 h-10 bg-white ${stat.color} rounded-lg flex items-center justify-center shrink-0 border border-slate-200`}>
 <stat.icon size={20} />
 </div>
 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
 <ArrowUpRight size={10} />
 {stat.growth}
 </span>
 </div>
 <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{stat.name}</h3>
 <p className="text-2xl font-bold text-med-text tracking-tight mt-1">{stat.value}</p>
 </motion.div>
 ))}
 </div>
 </motion.div>
 )}

 {isDataLoaded && activeTab === 'appointments' && (
 <motion.div 
 key="appointments"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-6"
 >
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-300 ">
 <div>
 <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">Clinical Schedule</h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">
 Live monitoring of all patient consultations and bookings
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative group overflow-hidden bg-slate-50 rounded-xl border border-slate-300 focus-within:border-slate-400 transition-all">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="Search ID, Patient or Physician..." 
 value={apptSearch}
 onChange={(e) => setApptSearch(e.target.value)}
 className="w-[280px] h-10 pl-10 pr-4 bg-transparent text-[11px] font-bold text-[#1e4a3a] outline-none placeholder:text-slate-400 placeholder:font-medium" 
 />
 </div>
 <div className="flex items-center gap-1 p-1.5 bg-slate-50 border border-slate-300 rounded-xl">
 {[
 { id: 'all', label: 'All' },
 { id: 'today', label: 'Today' },
 { id: 'upcoming', label: 'Confirmed' },
 { id: 'completed', label: 'History' },
 { id: 'cancelled', label: 'Canceled' }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setApptFilter(tab.id)}
 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${apptFilter === tab.id ? 'bg-[#1e4a3a] text-white ' : 'text-slate-400 hover:text-[#1e4a3a]'}`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-300">
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Booking ID</th>
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Patient Identity</th>
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Category</th>
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Provider / Dept</th>
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-center">Schedule</th>
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-center">Status</th>
  <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {filteredAppointments.map((appt, idx) => (
 <motion.tr 
 key={appt.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.02 }}
 className="group hover:bg-slate-50/50 transition-all cursor-default"
 >
 <td className="px-6 py-4">
  <span className="text-[11px] font-bold text-slate-400">#{appt.id?.slice(0, 8).toUpperCase()}</span>
 </td>
 <td className="px-6 py-4">
  <div className="flex flex-col">
  <span className="text-[12px] font-black text-[#1e4a3a] leading-tight">{appt.patientName || 'Anonymous'}</span>
  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{appt.patientPhone || 'No Phone'}</span>
  </div>
 </td>
 <td className="px-6 py-4">
  <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tight">
  {appt.category || 'Service'}
  </span>
 </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-slate-700 leading-tight">{appt.providerName || 'Healthcare Provider'}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[200px]" title={appt.items?.map(i => i.name).join(', ')}>
                              {appt.items?.length > 0 ? appt.items.map(i => i.name).join(', ') : (appt.type || 'Clinical Service')}
                            </span>
                          </div>
                        </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-[11px] font-bold text-[#1e4a3a] tracking-tight">
 {appt.date ? (appt.date.toDate ? appt.date.toDate().toLocaleDateString('en-GB') : new Date(appt.date).toLocaleDateString('en-GB')) : '--'}
 </span>
 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{appt.time || '--'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className={`w-1.5 h-1.5 rounded-full ${appt.status === 'confirmed' ? 'bg-emerald-500 ' : appt.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
 <span className={`text-[10px] font-bold uppercase tracking-widest ${appt.status === 'confirmed' ? 'text-emerald-700' : appt.status === 'pending' ? 'text-amber-700' : 'text-slate-500'}`}>
 {appt.status || 'requested'}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => {
 setSelectedAppointment(appt);
 setShowApptModal(true);
 }}
 className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-[#1e4a3a] hover:text-white hover:border-[#1e4a3a] transition-all "
 >
 <Info size={14} />
 </button>
 <button 
 onClick={() => handleCancelAppointment(appt.id)}
 className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all "
 >
 <X size={14} />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>

 {filteredAppointments.length === 0 && (
 <div className="py-24 flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-300 flex items-center justify-center text-slate-200 mb-4">
 <Calendar size={28} />
 </div>
 <h3 className="text-[14px] font-bold text-[#1e4a3a] tracking-tight">Secure Registry Empty</h3>
 <p className="text-[11px] text-slate-500 font-medium tracking-tight max-w-[240px] mt-2">No clinical records found matching your current filter parameters.</p>
 </div>
 )}
 </div>
 </motion.div>
 )}

 {isDataLoaded && activeTab === 'doctors' && (
 <motion.div 
 key="doctors"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-6"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-300">
 <div>
 <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">Doctor Directory</h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">
 Manage and audit approved medical professionals
 </p>
 </div>
 <div className="flex items-center gap-3">
 <div className="relative group">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-med-primary transition-colors" />
 <input 
 type="text" 
 placeholder="Search by name, specialty or phone..." 
 value={doctorSearch}
 onChange={(e) => setDoctorSearch(e.target.value)}
 className="w-[300px] h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-[12px] font-bold text-slate-600 outline-none focus:bg-white focus:border-med-primary/30 transition-all placeholder:text-slate-400 placeholder:font-medium" 
 />
 </div>
 <button 
 onClick={() => { setEditingDoctor(null); setShowRegisterDoctor(true); }}
 className="h-10 px-6 bg-[#1e4a3a] hover:bg-black text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-2"
 >
 <Plus size={14} />
 Register Doctor
 </button>
 </div>
 </div>

 {filteredDoctors.length > 0 ? (
 <div className="bg-white rounded-2xl border border-slate-300">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-300">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none border-b border-slate-300">Doctor</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none border-b border-slate-300">Specialty</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none border-b border-slate-300">Status</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none border-b border-slate-300">Credentials</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none border-b border-slate-300 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {filteredDoctors.map((doc) => (
 <motion.tr 
 key={doc.id} 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }}
 className="group hover:bg-slate-50/50 transition-all border-b border-slate-200"
 >
 <td className="px-6 py-5">
 <div className="flex items-center gap-4">
 <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-300 overflow-hidden relative group-hover:border-[#1e4a3a] transition-colors">
                      {doc.photoURL ? (
                        <img src={doc.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={18} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#1e4a3a] tracking-tight leading-none mb-1.5">{doc.fullName}</span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter leading-none">{doc.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1.5">
                    {(doc.specialty || doc.specialties || []).slice(0, 2).map((spec, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    doc.status === 'active' || doc.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${doc.status === 'active' || doc.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">BMDC CODE</span>
                    <span className="text-[11px] font-bold text-[#1e4a3a] tracking-widest font-mono">{doc.bmdcCode || 'NOT_LINKED'}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-[#1e4a3a] border border-transparent hover:border-slate-200"
                  >
                    <MoreVertical size={16} />
                  </button>

                  <AnimatePresence>
                    {activeMenuId === doc.id && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-6 top-16 w-56 bg-white rounded-2xl border-2 border-[#1e4a3a] z-[70] overflow-hidden"
                        >
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 font-mono">Operations</p>
                          </div>
                          
                          <button 
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditingDoctor(doc);
                              setDoctorForm({
                                ...doc,
                                password: '',
                                paymentMethods: doc.paymentMethods || [],
                                specialties: doc.specialties || [],
                                services: doc.services || []
                              });
                              setShowRegisterDoctor(true);
                            }}
                            className="w-full flex items-center gap-3 p-3 text-slate-700 hover:bg-slate-50 transition-all font-bold text-[12px] border-b border-slate-50 text-left"
                          >
                            <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><Edit3 size={14} /></div>
                            Edit Credentials
                          </button>

                          {doc.status === 'deactivated' ? (
                            <button 
                              onClick={async () => {
                                setActiveMenuId(null);
                                const isConfirmed = await confirm({
                                  title: 'Reactivate Doctor Access?',
                                  message: `You are about to restore clinical access for ${doc.fullName}. They will once again be able to log in and manage patient appointments.`,
                                  type: 'success'
                                });
                                if (isConfirmed) handleReactivateDoctor(doc.id);
                              }}
                              className="w-full flex items-center gap-3 p-3 text-emerald-600 hover:bg-emerald-50 transition-all font-bold text-[12px] text-left"
                            >
                              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><CheckCircle2 size={14} /></div>
                              Grant Full Access
                            </button>
                          ) : (
                            <button 
                              onClick={async () => {
                                setActiveMenuId(null);
                                const isConfirmed = await confirm({
                                  title: 'Revoke Doctor Access?',
                                  message: 'This will temporarily prevent the doctor from creating new sessions. Active appointments must be handled manually.',
                                  type: 'danger'
                                });
                                if (isConfirmed) handleDeactivateDoctor(doc.id);
                              }}
                              className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 transition-all font-bold text-[12px] text-left"
                            >
                              <div className="w-7 h-7 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center"><Trash2 size={14} /></div>
                              Deactivate Access
                            </button>
                          )}
                        </motion.div>
                      </>
                    )}
                
                  </AnimatePresence>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-300">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-300 flex items-center justify-center text-slate-200 mb-4">
          <UserCircle size={28} />
        </div>
        <h3 className="text-[14px] font-bold text-[#1e4a3a] tracking-tight">No Doctors Found</h3>
        <p className="text-[11px] text-slate-500 font-medium tracking-tight max-w-[240px] mt-2">Adjust your search or register a new medical professional to get started.</p>
      </div>
    )}
  </motion.div>
 )}



 {activeTab === 'patients' && (
 <motion.div 
 key="patients"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-6"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#1e4a3a]/20">
 <div>
 <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">Patient Database</h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">
 Secure repository for all registered patient profiles and clinical history
 </p>
 </div>
 <div className="flex items-center gap-3">
 <div className="relative group">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-med-primary transition-colors" />
 <input 
 type="text" 
 placeholder="Search by name, email or ID..." 
 value={patientSearch}
 onChange={(e) => setPatientSearch(e.target.value)}
 className="w-[300px] h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-[12px] font-bold text-slate-600 outline-none focus:bg-white focus:border-med-primary/30 transition-all placeholder:text-slate-400 placeholder:font-medium" 
 />
 </div>
 <div className="relative">
 <button 
 onClick={() => setShowFilterDropdown(!showFilterDropdown)}
 className={`h-10 px-5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${filterStatus !== 'all' ? 'bg-med-primary text-white -primary/20' : 'bg-[#1e4a3a] text-white hover:bg-black'}`}
 >
 <Filter size={14} />
 {filterStatus === 'all' ? 'Filter' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
 </button>
 
 <AnimatePresence>
 {showFilterDropdown && (
 <>
 <div className="fixed inset-0 z-[110]" onClick={() => setShowFilterDropdown(false)} />
 <motion.div 
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 className="absolute right-0 mt-2 w-[180px] bg-white rounded-2xl border border-slate-200 p-2 z-[120] space-y-1"
 >
 {[
 { id: 'all', label: 'All Patients', icon: Users },
 { id: 'active', label: 'Active Only', icon: Check },
 { id: 'deactivated', label: 'Deactivated', icon: X }
 ].map((opt) => (
 <button
 key={opt.id}
 onClick={() => { setFilterStatus(opt.id); setShowFilterDropdown(false); }}
 className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${filterStatus === opt.id ? 'bg-slate-50 text-[#1e4a3a]' : 'text-slate-500 hover:bg-slate-50'}`}
 >
 <opt.icon size={14} className={filterStatus === opt.id ? 'text-med-primary' : 'text-slate-300'} />
 <span className="text-[12px] font-bold">{opt.label}</span>
 </button>
 ))}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-[#1e4a3a]/20">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-[#1e4a3a]/10">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none rounded-tl-2xl">ID No.</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Patient Name</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Status</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Due</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Phone</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Age</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Next Appointment</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-right rounded-tr-2xl">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {filteredPatients.map((patient, pIdx) => {
 // Logic for Age
 const age = patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : '--';
 
 // Status logic
 const isActive = patient.status === 'active' || patient.status === 'approved';
 
 return (
 <motion.tr 
 key={patient.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: pIdx * 0.02 }}
 className="group hover:bg-slate-50/50 transition-all cursor-default"
 >
 <td className="px-6 py-4">
 <span className="text-[12px] font-bold text-slate-400">P{patient.id.slice(0, 4).toUpperCase()}</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center">
 {(patient.photoURL && !patient.photoURL.startsWith('blob:')) ? (
 <img 
 src={patient.photoURL} 
 alt="" 
 className="w-full h-full object-cover" 
 onError={(e) => e.currentTarget.style.display = 'none'}
 />
 ) : (
 <span className="text-[11px] font-bold text-slate-400">{patient.fullName?.charAt(0) || 'P'}</span>
 )}
 </div>
 <span className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{patient.fullName || 'Anonymous'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
 {isActive ? 'Active' : 'Deactivated'}
 </span>
 </td>
 <td className="px-6 py-4">
 <span className={`text-[12px] font-bold ${patient.dueAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
 {patient.dueAmount > 0 ? `৳${patient.dueAmount} Due` : '-'}
 </span>
 </td>
 <td className="px-6 py-4">
 <span className="text-[12px] font-bold text-slate-600">{patient.phone || '--'}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-[12px] font-bold text-slate-600">{age}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-[12px] font-bold text-slate-600 tracking-tight">{patient.nextAppointmentDate || 'No Schedule'}</span>
 </td>
 <td className="px-6 py-4 text-right relative">
 <div className="flex justify-end">
 <button 
 onClick={() => setActiveMenuId(activeMenuId === patient.id ? null : patient.id)}
 className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeMenuId === patient.id ? 'bg-[#1e4a3a] text-white' : 'text-slate-400 hover:bg-slate-100'}`}
 >
 <MoreHorizontal size={16} />
 </button>
 
 <AnimatePresence>
 {activeMenuId === patient.id && (
 <>
 <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="absolute right-0 top-10 w-52 bg-white rounded-2xl border border-slate-200 p-2 z-[70] text-left"
 >
 <div className="px-3 py-2 border-b border-slate-200 mb-1">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Clinical Records</p>
 </div>
 <button onClick={() => { setActiveMenuId(null); setSelectedPatient(patient); setProfileTab('history'); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-all font-bold text-[12px]">
 <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Activity size={14} /></div>
 Medical History
 </button>
 <button onClick={() => { setActiveMenuId(null); setSelectedPatient(patient); setProfileTab('files'); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-all font-bold text-[12px]">
 <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><FolderOpen size={14} /></div>
 Clinical Files
 </button>
 <div className="h-px bg-[#1e4a3a]/5 my-1" />
 {patient.status === 'deactivated' ? (
 <button 
 onClick={async () => { 
 setActiveMenuId(null); 
 const isConfirmed = await confirm({
 title: 'Reactivate Patient Access?',
 message: `You are about to restore clinical access for ${patient.fullName}. They will once again be able to log in and manage patient appointments.`,
 type: 'success'
 });
 if (isConfirmed) handleReactivatePatient(patient.id);
 }} 
 className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all font-bold text-[12px]"
 >
 <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center"><CheckCircle2 size={14} /></div>
 Activate Access
 </button>
 ) : (
 <button 
 onClick={async () => { 
 setActiveMenuId(null); 
 const isConfirmed = await confirm({
 title: 'Revoke Patient Access?',
 message: `You are about to deactivate access for ${patient.fullName}. They will no longer be able to log in or manage patient appointments until manually reinstated.`,
 type: 'danger'
 });
 if (isConfirmed) handleDeactivatePatient(patient.id);
 }} 
 className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-all font-bold text-[12px]"
 >
 <div className="w-7 h-7 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center"><Trash2 size={14} /></div>
 Deactivate Access
 </button>
 )}
 <button onClick={() => { setActiveMenuId(null); setSelectedPatient(patient); setIsEditingPatient(true); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-all font-bold text-[12px]">
 <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center"><UserCircle size={14} /></div>
 Sync Profile
 </button>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>
 
 {patients.length === 0 && !isPatientsLoading && (
 <div className="p-20 flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center text-slate-200 mb-6">
 <UserCircle size={32} />
 </div>
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight">No Patient Records Found</h3>
 <p className="text-[13px] text-slate-500 font-medium max-w-xs mt-2">
 Your database is currently empty. Patients will appear here automatically upon registration.
 </p>
 </div>
 )}

 {isPatientsLoading && (
 <div className="p-20 flex flex-col items-center justify-center">
 <Loader2 className="animate-spin text-med-primary mb-4" size={32} />
 <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Encrypting PII...</span>
 </div>
 )}
 </div>
 </motion.div>
 )} {activeTab === 'receptionists' && (
 <motion.div 
 key="receptionists"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-6"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#1e4a3a]/20">
 <div>
 <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">Staff Directory</h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">
 Control platform access for receptionists and staff members
 </p>
 </div>
 <div className="flex items-center gap-3">
 <div className="relative group">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-med-primary transition-colors" />
 <input 
 type="text" 
 placeholder="Search staff by name or email..." 
 value={staffSearch}
 onChange={(e) => setStaffSearch(e.target.value)}
 className="w-[300px] h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-[12px] font-bold text-slate-600 outline-none focus:bg-white focus:border-med-primary/30 transition-all placeholder:text-slate-400 placeholder:font-medium" 
 />
 </div>
 <button 
 onClick={() => setShowAddStaff(true)}
 className="h-10 px-6 bg-[#1e4a3a] hover:bg-black text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-2"
 >
 <Plus size={14} />
 Register Staff
 </button>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-[#1e4a3a]/20">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-[#1e4a3a]/10">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none rounded-tl-2xl">Identity</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Contact Info</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Joined Date</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Status</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-right rounded-tr-2xl">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {filteredStaff.map((member, mIdx) => {
 const name = member.fullName || member.name || 'Staff Member';
 const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
 const joinedDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent';
 const isActive = member.status === 'active' || member.status === 'approved';

 return (
 <motion.tr 
 key={member.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: mIdx * 0.02 }}
 className="group hover:bg-slate-50/50 transition-all cursor-default"
 >
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-[12px]">
 {initials}
 </div>
 <div className="flex flex-col">
 <span className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{name}</span>
 <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">ID: #{member.id.slice(0, 5).toUpperCase()}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
 <Mail size={12} className="text-slate-300" /> {member.email}
 </div>
 <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
 <Phone size={12} className="text-slate-300" /> {member.phone || '--'}
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="text-[12px] font-bold text-slate-600">{joinedDate}</span>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
 {isActive ? 'Active' : 'Revoked'}
 </span>
 </td>
 <td className="px-6 py-4 text-right relative">
 <div className="flex justify-end">
 <button 
 onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
 className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeMenuId === member.id ? 'bg-[#1e4a3a] text-white' : 'text-slate-400 hover:bg-slate-100'}`}
 >
 <MoreHorizontal size={16} />
 </button>
 
 <AnimatePresence>
 {activeMenuId === member.id && (
 <>
 <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="absolute right-0 top-10 w-48 bg-white rounded-2xl border border-slate-200 p-2 z-[70] text-left"
 >
 <div className="px-3 py-2 border-b border-slate-200 mb-1">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Staff Controls</p>
 </div>
 <button onClick={() => { setActiveMenuId(null); toast.error('Edit feature coming soon'); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-all font-bold text-[12px]">
 <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><Edit3 size={14} /></div>
 Update Access
 </button>
 <div className="h-px bg-[#1e4a3a]/5 my-1" />
 {isActive ? (
 <button 
 onClick={async () => { 
 setActiveMenuId(null); 
 const isConfirmed = await confirm({
 title: 'Revoke Staff Access?',
 message: `You are about to deactivate system access for ${name}. They will be immediately logged out and blocked.`,
 type: 'danger'
 });
 if (isConfirmed) handleDeactivateDoctor(member.id);
 }} 
 className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-all font-bold text-[12px]"
 >
 <div className="w-7 h-7 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center"><Trash2 size={14} /></div>
 Revoke Access
 </button>
 ) : (
 <button 
 onClick={async () => { 
 setActiveMenuId(null); 
 const isConfirmed = await confirm({
 title: 'Restore Staff Access?',
 message: `Re-enable clinical portal access for ${name}?`,
 type: 'success'
 });
 if (isConfirmed) handleReactivateDoctor(member.id);
 }} 
 className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all font-bold text-[12px]"
 >
 <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><CheckCircle2 size={14} /></div>
 Restore Access
 </button>
 )}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>

 {filteredStaff.length === 0 && (
 <div className="p-20 flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center text-slate-200 mb-6">
 <Users size={32} />
 </div>
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight">No Staff Members Found</h3>
 <p className="text-[13px] text-slate-500 font-medium max-w-xs mt-2">
 {staffSearch ? "No staff matches your search query." : "There are currently no registered staff members in your department."}
 </p>
 </div>
 )}
 </div>
 </motion.div>
 )}

 {activeTab === 'audits' && (
 <motion.div 
 key="audits"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-6"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#1e4a3a]/20">
 <div>
 <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">Professional Credential Audit</h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">Review pending provider applications for clinical network access</p>
 </div>
 <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
 <ShieldCheck size={14} />
 <span className="text-[10px] font-bold uppercase tracking-widest">{pendingProviders.length} Pending Approval</span>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-[#1e4a3a]/20">
 {pendingProviders.length === 0 ? (
 <div className="py-24 flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-200">
 <ShieldCheck size={32} />
 </div>
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight">Network Fully Synchronized</h3>
 <p className="text-[13px] text-slate-500 font-medium max-w-xs mt-2">No pending provider applications require your attention at this time.</p>
 </div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-[#1e4a3a]/10">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none rounded-tl-2xl">Provider & Role</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Contact Details</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Submission Date</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-right rounded-tr-2xl">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {pendingProviders.map((provider, pIdx) => (
 <motion.tr 
 key={provider.uid}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: pIdx * 0.05 }}
 className="group hover:bg-slate-50/50 transition-all cursor-default"
 >
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-[13px]">
 {provider.fullName ? provider.fullName[0].toUpperCase() : 'P'}
 </div>
 <div className="flex flex-col">
 <span className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{provider.fullName}</span>
 <span className="text-[9px] text-white bg-[#1e4a3a] px-2 py-0.5 rounded-md uppercase tracking-widest font-bold self-start mt-1 ">{provider.role}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
 <Mail size={12} className="text-slate-300" /> {provider.email}
 </div>
 <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
 <Phone size={12} className="text-slate-300" /> {provider.phone}
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
 <Clock size={12} className="text-slate-300" />
 {new Date(provider.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => approveProvider(provider.uid)}
 className="h-8 px-4 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"
 >
 <UserCheck size={12} />
 Approve
 </button>
 <button 
 onClick={() => rejectProvider(provider.uid)}
 className="h-8 w-8 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg flex items-center justify-center hover:bg-rose-100 transition-all"
 >
 <X size={14} />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </motion.div>
 )}

 {activeTab === 'finance' && (
 <motion.div 
 key="finance"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-8"
 >
 {/* Internal Sub-navigation */}
 <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-[#1e4a3a]/20 rounded-2xl w-fit sticky top-0 z-30 ">
 {[
 { id: 'overview', label: 'Overview', icon: LayoutGrid },
 { id: 'manual', label: 'Payment Approvals', icon: ShieldAlert },
 { id: 'gateways', label: 'Payment Accounts', icon: Landmark },
 { id: 'coupons', label: 'Coupon Management', icon: Zap },
 { id: 'economics', label: 'Fees & Commission', icon: Activity },
 { id: 'payouts', label: 'Doctor Payments', icon: Users },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setFinanceTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
 financeTab === tab.id 
 ? 'bg-[#1e4a3a] text-white ' 
 : 'text-slate-500 hover:bg-slate-200/50 hover:text-[#1e4a3a]'
 }`}
 >
 <tab.icon size={14} />
 {tab.label}
 </button>
 ))}
 </div>

 {financeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Row */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { label: 'Total Earnings', value: `৳${(financials.totalEarnings / 1000).toFixed(1)}k`, growth: '+12.5%', icon: TrendingUp, color: 'text-[#1e4a3a]', bg: 'bg-white' },
 { label: 'Service Fees', value: `৳${(financials.serviceFees / 1000).toFixed(1)}k`, growth: '+10.2%', icon: Activity, color: 'text-emerald-700', bg: 'bg-white' },
 { label: 'Pending Payouts', value: `৳${(financials.pendingPayouts / 1000).toFixed(1)}k`, growth: '-4.1%', icon: Clock, color: 'text-amber-700', bg: 'bg-white' },
 { label: 'Active Coupons', value: financials.activeCoupons.toString().padStart(2, '0'), growth: '0%', icon: Zap, color: 'text-indigo-700', bg: 'bg-white' },
 ].map((stat, i) => (
 <div key={i} className={`p-6 rounded-2xl border border-[#1e4a3a]/20 ${stat.bg} group hover:border-slate-400 transition-all`}>
 <div className="flex items-center justify-between mb-4">
 <div className={`w-12 h-12 rounded-xl border border-[#1e4a3a]/10 flex items-center justify-center bg-slate-50 ${stat.color}`}>
 <stat.icon size={24} />
 </div>
 <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.growth.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
 {stat.growth}
 </span>
 </div>
 <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-none mb-2">{stat.label}</h4>
 <p className="text-2xl font-black text-[#1e4a3a] tracking-tight">{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Revenue Forecast (Visual Placeholder) */}
 <div className="bg-white rounded-2xl border border-[#1e4a3a]/20 p-8">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest">Revenue Forecast</h3>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Monthly transaction volume</p>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
 <div className="w-2 h-2 rounded-full bg-[#1e4a3a]" />
 <span className="text-[9px] font-bold text-slate-700 uppercase">Revenue</span>
 </div>
 <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
 <div className="w-2 h-2 rounded-full bg-emerald-600" />
 <span className="text-[9px] font-bold text-slate-700 uppercase">Commision</span>
 </div>
 </div>
 </div>
 
 <div className="h-[240px] w-full flex items-end justify-between gap-4 px-4 overflow-x-auto lg:overflow-visible">
 {financials.monthlyData.map((data, i) => {
 const maxVal = Math.max(...financials.monthlyData.map(d => d.revenue)) || 1;
 const h = (data.revenue / maxVal) * 100;
 const commH = data.revenue > 0 ? (data.commission / data.revenue) * 100 : 0;
 
 return (
 <div key={i} className="min-w-[40px] flex-1 group relative">
 <motion.div 
 initial={{ height: 0 }} 
 animate={{ height: `${Math.max(h, 5)}%` }} 
 className="w-full bg-slate-100 rounded-t-lg group-hover:bg-slate-200 transition-all flex flex-col justify-end overflow-hidden"
 >
 <div style={{ height: `${commH}%` }} className="w-full bg-emerald-500/20 border-t border-emerald-600/30" />
 </motion.div>
 <div className="mt-4 text-[9px] font-bold text-slate-400 uppercase text-center group-hover:text-[#1e4a3a]">
 {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* PAYMENT APPROVALS TAB */}
 {financeTab === 'manual' && (
 <div className="bg-white rounded-2xl border border-[#1e4a3a]/20 overflow-hidden ">
 <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white text-left">
 <div>
 <h3 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest">Payment Approvals</h3>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Review manual transactions via bKash/Nagad/Rocket</p>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-[#1e4a3a]/10">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Transaction ID</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Patient Identity</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Appointment</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Method</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Amount</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {pendingPayments.map((payment, idx) => (
 <motion.tr 
 key={payment.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.05 }}
 className="group hover:bg-slate-50/50 transition-all border-b border-slate-200"
 >
 <td className="px-6 py-4">
 <div className="flex flex-col gap-1">
 <span className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-tight">{payment.transactionId || 'N/A'}</span>
 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{payment.type || 'Booking'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-[12px] font-black text-[#1e4a3a] leading-tight">{payment.userName || 'Anonymous'}</span>
 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{payment.userPhone || 'No Phone'}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-[12px] font-bold text-slate-600">#{payment.appointmentId ? payment.appointmentId.slice(-6) : 'REF'}</td>
 <td className="px-6 py-4">
 <span className="text-[9px] text-[#1e4a3a] uppercase tracking-widest px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-bold">{payment.method}</span>
 </td>
 <td className="px-6 py-4 text-[12px] font-black text-[#1e4a3a]">৳{payment.amount}</td>
 <td className="px-6 py-4">
    <div className="flex justify-end gap-2">
      <button 
        onClick={() => approveManualPayment(payment)}
        disabled={isProcessingPayment}
        className="h-8 px-4 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#1e4a3a] transition-all disabled:opacity-50"
      >
        Approve
      </button>
      <button 
        onClick={() => rejectManualPayment(payment)}
        disabled={isProcessingPayment}
        title="Reject Payment"
        className="h-8 w-8 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg flex items-center justify-center hover:bg-amber-100 transition-all disabled:opacity-50"
      >
        <X size={14} />
      </button>
      <button 
        onClick={() => deleteManualPayment(payment)}
        disabled={isProcessingPayment}
        title="Permanently Delete"
        className="h-8 w-8 bg-rose-50 text-rose-500 border border-rose-200 rounded-lg flex items-center justify-center hover:bg-rose-100 transition-all disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </td>
 </motion.tr>
 ))}
 {pendingPayments.length === 0 && (
 <tr>
 <td colSpan="5" className="px-8 py-20 text-center">
 <div className="flex flex-col items-center gap-4 opacity-50">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
 <ShieldCheck size={32} />
 </div>
 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Queue Clean • All payments verified</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* PAYMENT ACCOUNTS TAB */}
 {financeTab === 'gateways' && (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest">Payment Accounts</h3>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Manage active clinical deposit methods</p>
 </div>
 <button 
 onClick={() => { 
 setEditingPayment(null); 
 setPaymentForm({ 
 provider: 'bkash', type: 'personal', accountNumber: '', status: 'active',
 bankName: '', accountName: '', branchName: '', routingNumber: '',
 shopName: '', merchantId: ''
 }); 
 setShowPaymentModal(true); 
 }}
 className="h-9 px-5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
 >
 <Plus size={14} /> Add Account
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {paymentMethods.map((method) => (
 <div key={method.id} className="group bg-white p-4 rounded-2xl border border-[#1e4a3a]/20 transition-all relative overflow-hidden hover:border-slate-400">
 <div className="flex items-start justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl border border-[#1e4a3a]/10 flex items-center justify-center p-1.5 bg-slate-50 overflow-hidden shrink-0">
 {method.provider === 'bkash' && <img src="/bkash.webp" className="w-full h-full object-contain" />}
 {method.provider === 'nagad' && <img src="/nagad.webp" className="w-full h-full object-contain" />}
 {method.provider === 'rocket' && <img src="/rocket.webp" className="w-full h-full object-contain" />}
 {method.provider === 'bank' && <Building2 size={24} className="text-blue-600" />}
 </div>
 <div>
 <h4 className="text-[14px] font-black text-[#1e4a3a] uppercase tracking-tight">{method.provider}</h4>
 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
 method.type === 'merchant' ? 'bg-emerald-50 text-emerald-700' : 
 method.type === 'agent' ? 'bg-amber-50 text-amber-700' :
 'bg-slate-100 text-slate-700'
 }`}>
 {method.type}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
 <button 
 onClick={() => { setEditingPayment(method.id); setPaymentForm({...method}); setShowPaymentModal(true); }}
 className="w-8 h-8 rounded-lg border border-[#1e4a3a]/10 flex items-center justify-center text-slate-500 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all"
 >
 <Edit3 size={14} />
 </button>
 <button 
 onClick={async () => {
 const isConfirmed = await confirm({
 title: 'Delete Account?',
 message: 'This payment method will be immediately removed from clinical bookings.',
 confirmText: 'Delete',
 type: 'danger'
 });
 if (isConfirmed) {
 await deleteDoc(doc(db, 'payment_methods', method.id));
 toast.success('Account removed');
 }
 }}
 className="w-8 h-8 rounded-lg border border-[#1e4a3a]/10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 
 <div className="space-y-4">
 {method.provider === 'bank' ? (
 <div className="space-y-2">
 <div className="space-y-0.5">
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Account Holder</p>
 <p className="text-[12px] font-bold text-[#1e4a3a] truncate">{method.accountName}</p>
 </div>
 <div className="space-y-0.5">
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Account Number</p>
 <p className="text-[13px] font-black text-[#1e4a3a] tracking-tighter">{method.accountNumber}</p>
 <p className="text-[10px] font-bold text-slate-600 truncate uppercase mt-0.5">{method.bankName}</p>
 </div>
 </div>
 ) : (
 <div className="space-y-2">
 <div className="space-y-0.5">
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Account Number</p>
 <p className="text-[16px] font-black text-[#1e4a3a] tracking-tight">{method.accountNumber}</p>
 </div>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* COUPON MANAGEMENT TAB */}
 {financeTab === 'coupons' && (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest">Coupon Management</h3>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Active discount codes and credit rules</p>
 </div>
 <button 
 onClick={() => { 
 setEditingCoupon(null); 
 setCouponForm({ code: '', type: 'percentage', value: '', status: 'active' }); 
 setShowCouponModal(true); 
 }}
 className="h-9 px-5 bg-[#1e4a3a] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
 >
 <Plus size={14} /> Create Coupon
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {coupons.map((coupon) => (
 <div key={coupon.id} className="group bg-white rounded-2xl border border-[#1e4a3a]/20 p-5 transition-all hover:border-slate-400 relative flex flex-col justify-between min-h-[160px]">
 <div className="flex items-start justify-between">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-[#1e4a3a] text-white flex items-center justify-center shrink-0">
 <Zap size={20} />
 </div>
 <h4 className="text-[20px] font-black text-[#1e4a3a] tracking-wider">#{coupon.code}</h4>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${coupon.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
 {coupon.status}
 </span>
 <span className="px-3 py-1 rounded-lg text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-tight">
 {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `৳${coupon.value} OFF`}
 </span>
 </div>
 </div>
 
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
 <button 
 onClick={() => { setEditingCoupon(coupon.id); setCouponForm({...coupon}); setShowCouponModal(true); }}
 className="w-8 h-8 rounded-lg border border-[#1e4a3a]/10 flex items-center justify-center text-slate-500 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all"
 >
 <Edit3 size={14} />
 </button>
 <button 
 onClick={async () => {
 const isConfirmed = await confirm({
 title: 'Delete Coupon?',
 message: `The coupon code #${coupon.code} will be immediately invalidated.`,
 confirmText: 'Delete',
 type: 'danger'
 });
 if (isConfirmed) {
 await deleteDoc(doc(db, 'coupons', coupon.id));
 toast.success('Coupon removed');
 }
 }}
 className="w-8 h-8 rounded-lg border border-[#1e4a3a]/10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 
 <div className="mt-6 flex items-center justify-between">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Status</p>
 <div className={`h-1.5 w-16 rounded-full ${coupon.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* FEES & COMMISSION TAB */}
 {financeTab === 'economics' && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Fee Config */}
 <div className="bg-white rounded-2xl border border-[#1e4a3a]/10 overflow-hidden/50">
 <div className="p-6 border-b border-slate-50 bg-slate-50/30">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl border border-[#1e4a3a]/10 flex items-center justify-center text-[#1e4a3a] bg-white">
 <Landmark size={20} />
 </div>
 <div>
 <h3 className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-widest">Finance Settings</h3>
 <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">Manage platform fees & commissions</p>
 </div>
 </div>
 </div>
 
 <div className="p-8 space-y-10">
 <div className="space-y-8">
 <div className="group">
 <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3 block group-focus-within:text-[#1e4a3a] transition-colors">Instant Booking Fee</label>
 <div className="flex items-end gap-3 pb-2 border-b-2 border-slate-100 focus-within:border-[#1e4a3a] transition-all">
 <span className="text-slate-400 text-lg font-bold">৳</span>
 <input 
 type="number" 
 value={globalSettings.instantDoctorFee}
 onChange={(e) => setGlobalSettings({...globalSettings, instantDoctorFee: e.target.value})}
 className="w-full bg-transparent text-3xl font-bold text-[#1e4a3a] outline-none placeholder:text-slate-200 tracking-tighter"
 />
 </div>
 <p className="text-[9px] text-slate-600 mt-3 font-bold uppercase tracking-widest flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
 Platform-wide booking fee per consultation.
 </p>
 </div>

 <div className="group">
 <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3 block group-focus-within:text-emerald-700 transition-colors">Platform Commission Rate (%)</label>
 <div className="flex items-end gap-3 pb-2 border-b-2 border-slate-100 focus-within:border-emerald-600 transition-all">
 <span className="text-emerald-600 text-lg font-bold">%</span>
 <input 
 type="number" 
 value={globalSettings.platformCommission}
 onChange={(e) => setGlobalSettings({...globalSettings, platformCommission: e.target.value})}
 className="w-full bg-transparent text-3xl font-bold text-[#1e4a3a] outline-none placeholder:text-slate-200 tracking-tighter"
 />
 </div>
 <p className="text-[9px] text-emerald-700 mt-3 font-bold uppercase tracking-widest flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 Percentage cut from doctor professional fees.
 </p>
 </div>
 </div>

 <button 
 onClick={async () => {
 setIsUpdatingSettings(true);
 try {
 await setDoc(doc(db, 'settings', 'global'), globalSettings, { merge: true });
 toast.success('Settings updated');
 } catch (e) { toast.error('Update failed'); }
 setIsUpdatingSettings(false);
 }}
 disabled={isUpdatingSettings}
 className="w-full h-12 bg-[#1e4a3a] text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
 >
 {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
 </button>
 </div>
 </div>

 {/* Informational Card */}
 <div className="space-y-6">
 <div className="p-8 bg-slate-50 border border-[#1e4a3a]/10 rounded-2xl">
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-xl bg-[#1e4a3a] text-white flex items-center justify-center shrink-0">
 <ShieldCheck size={20} />
 </div>
 <div>
 <h4 className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-widest mb-1">Financial Security</h4>
 <p className="text-[11px] text-slate-700 leading-relaxed font-bold uppercase tracking-tight">
 Policy updates are immediately pushed to all clinical departments. Financial adjustments are logged with immutable audit trails.
 </p>
 </div>
 </div>
 </div>

 <div className="p-8 bg-white border border-[#1e4a3a]/20 rounded-2xl">
 <div className="flex items-center justify-between mb-8">
 <h4 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">Revenue Projection</h4>
 <Activity size={16} className="text-slate-400" />
 </div>
 <div className="space-y-5">
 <div className="flex justify-between items-center group">
 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Monthly Transaction Flow</span>
 <span className="text-[14px] font-bold text-[#1e4a3a] tracking-tight">৳{financials.monthlyData[new Date().getMonth()].revenue.toLocaleString()}</span>
 </div>
 <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-[#1e4a3a] transition-all duration-700" 
 style={{ width: `${Math.min((financials.monthlyData[new Date().getMonth()].revenue / 50000) * 100, 100)}%` }} 
 />
 </div>
 <div className="flex justify-between items-center group">
 <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Platform Net Margin</span>
 <span className="text-[14px] font-bold text-emerald-700 tracking-tight">৳{financials.monthlyData[new Date().getMonth()].commission.toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* DOCTOR PAYMENTS TAB */}
 {financeTab === 'payouts' && (
 <div className="bg-white rounded-2xl border border-[#1e4a3a]/20 overflow-hidden ">
 <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white text-left">
 <div>
 <h3 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest">Doctor Payments</h3>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Manage doctor earnings and payment releases</p>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-[#1e4a3a]/10">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Doctor Profile</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Balance Status</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none">Commission Cut</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest leading-none text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {doctors.map((doc, idx) => {
 const balance = getDoctorBalance(doc.id);
 const totalVolume = allAppointments
 .filter(a => a.doctorId === doc.id && (a.status === 'completed' || a.paymentStatus === 'paid'))
 .reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
 const totalComm = totalVolume * (Number(globalSettings.platformCommission) || 10) / 100;

 return (
 <motion.tr 
 key={doc.id}
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 transition={{ delay: idx * 0.05 }}
 className="group hover:bg-slate-50/50 transition-all cursor-default"
 >
 <td className="px-6 py-4">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl border border-slate-300 overflow-hidden bg-slate-100 shrink-0">
 {doc.photoURL ? <img src={doc.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase">{doc.fullName?.[0] || 'D'}</div>}
 </div>
 <div className="flex flex-col">
 <span className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{doc.fullName}</span>
 <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest border border-slate-300 px-2 py-0.5 rounded-md">{doc.specialties?.[0] || 'Gen. Doctor'}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-[16px] font-black text-[#1e4a3a]">৳{balance.toLocaleString()}</span>
 <span className={`text-[9px] font-black uppercase tracking-widest ${balance > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
 {balance > 0 ? 'Available to Release' : 'No Pending Balance'}
 </span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight">৳{totalComm.toLocaleString()} Total</span>
 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">({globalSettings.platformCommission}%)</span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={async () => {
 if (balance <= 0) return;
 setIsProcessingPayment(true);
 try {
 const apptsToRelease = allAppointments.filter(a => a.doctorId === doc.id && (a.status === 'completed' || a.paymentStatus === 'paid') && a.payoutStatus !== 'released');
 const promises = apptsToRelease.map(a => updateDoc(doc(db, 'appointments', a.id), { payoutStatus: 'released', payoutDate: new Date().toISOString() }));
 await Promise.all(promises);
 toast.success(`৳${balance.toLocaleString()} released to ${doc.fullName}`);
 } catch (e) { toast.error('Payout failed'); }
 setIsProcessingPayment(false);
 }}
 disabled={balance <= 0 || isProcessingPayment}
 className="h-8 px-4 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:hover:bg-[#1e4a3a]"
 >
 Release Funds
 </button>
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </motion.div>
 )}

 {activeTab === 'medical-setup' && (
 <motion.div 
 key="medical-setup"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-4"
 >
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-300">
 <div>
 <h2 className="text-[15px] font-bold text-[#1e4a3a] tracking-tight">Medical Setup</h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">Manage medical specialties and services</p>
 </div>
 <button 
 onClick={() => setShowAddSpecialty(true)}
 className="h-9 px-5 bg-[#1e4a3a] hover:bg-black text-white text-[12px] font-bold rounded-lg transition-all flex items-center gap-2"
 >
 <Plus size={14} />
 Add Specialty
 </button>
 </div>

  {/* --- SPECIALTY LIST (ACCORDION) --- */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

 {specialties.map((spec) => (
  <div key={spec.id} className="flex flex-col bg-white border border-slate-300 rounded-lg overflow-hidden transition-all">
    <div 
      onClick={() => setSelectedSpecialty(selectedSpecialty?.id === spec.id ? null : spec)}
      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${spec.bg || 'bg-slate-50'} ${spec.color || 'text-slate-500'} rounded-lg flex items-center justify-center opacity-80 border border-slate-200`}>
          <IconComponent name={spec.icon} size={20} />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-[#1e4a3a] tracking-tight">{spec.name}</h3>
          <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">{spec.services?.length || 0} services</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={(e) => { e.stopPropagation(); handleDeleteSpecialty(spec.id); }} className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
          <Trash2 size={16} />
        </button>
        <div className={`p-1 text-slate-400 transform transition-transform duration-200 ${selectedSpecialty?.id === spec.id ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
    
    <AnimatePresence>
      {selectedSpecialty?.id === spec.id && (
         <motion.div
           initial={{ height: 0, opacity: 0 }}
           animate={{ height: "auto", opacity: 1 }}
           exit={{ height: 0, opacity: 0 }}
           className="border-t border-slate-200 bg-slate-50/50 overflow-hidden"
         >
           <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[13px] font-bold text-[#1e4a3a]">Services under {spec.name}</h4>
                <button
                  onClick={() => {
                   setEditingService(null);
                   setServiceForm({ name: '', price: '', telemed: false, telemedPrice: '' });
                   setShowAddService(true);
                  }}
                  className="h-8 px-4 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold tracking-tight hover:bg-black transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Service
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {(selectedSpecialty.services || []).map((service, idx) => (
                    <div 
                      key={idx} 
                      className="group p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                         <div className="space-y-1">
                            <h4 className="text-[13px] font-bold text-[#1e4a3a] tracking-tight">{service.name}</h4>
                            {service.telemed && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">
                                <Activity size={10} /> Telemedicine
                              </span>
                            )}
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingService(idx);
                                setServiceForm({ ...service });
                                setShowAddService(true);
                              }}
                              className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteService(idx);
                              }}
                              className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                         </div>
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                         <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-500 font-medium">In-Clinic Price</p>
                            <p className="text-[14px] font-bold text-[#1e4a3a]">৳{service.price}</p>
                         </div>
                         {service.telemed && (
                           <div className="text-right space-y-0.5">
                              <p className="text-[10px] text-blue-500 font-medium">Telemed Fee</p>
                              <p className="text-[13px] font-bold text-blue-600">৳{service.telemedPrice}</p>
                           </div>
                         )}
                      </div>
                    </div>
                 ))}
                 {(selectedSpecialty.services || []).length === 0 && (
                   <div className="col-span-full py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-white">
                      <p className="text-[12px] font-bold text-slate-500">No services configured yet</p>
                   </div>
                 )}
              </div>
           </div>
         </motion.div>
      )}
    </AnimatePresence>
  </div>
 ))}
  </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'settings' && (
 <motion.div 
 key="settings"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-8"
 >
 {/* Settings Sub-navigation */}
 <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded-2xl w-fit sticky top-0 z-30 ">
 {[
 { id: 'profile', label: 'Profile Settings', icon: UserCircle },
 { id: 'finance', label: 'Finance Shortcuts', icon: Landmark },
 { id: 'security', label: 'Security & Auth', icon: Lock },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setSettingsTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
 settingsTab === tab.id 
 ? 'bg-[#1e4a3a] text-white ' 
 : 'text-slate-500 hover:bg-slate-200/50 hover:text-[#1e4a3a]'
 }`}
 >
 <tab.icon size={14} />
 {tab.label}
 </button>
 ))}
 </div>

 {settingsTab === 'profile' && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Profile Card */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white rounded-2xl border border-slate-300 p-8 text-center flex flex-col items-center">
 <div className="relative group mb-6">
 <div className="w-32 h-32 rounded-3xl border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
 {adminProfile.photoURL ? (
 <img src={adminProfile.photoURL} className="w-full h-full object-cover" />
 ) : (
 <UserCircle size={64} className="text-slate-200" />
 )}
 </div>
 <button 
 onClick={() => document.getElementById('admin-photo-upload').click()}
 disabled={isUpdatingProfile}
 className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1e4a3a] text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50"
 >
 <Camera size={18} />
 </button>
 <input 
 id="admin-photo-upload"
 type="file"
 accept="image/*"
 onChange={handleAdminPhotoUpload}
 className="hidden"
 />
 </div>
 <h3 className="text-[16px] font-black text-[#1e4a3a] uppercase tracking-widest">{adminProfile.fullName || 'Admin User'}</h3>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hospital Administrator</p>
 
 <div className="w-full h-px bg-slate-100 my-8" />
 
 <div className="w-full space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</span>
 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-emerald-100">Verified</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Level</span>
 <span className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-tight">Root Admin</span>
 </div>
 </div>
 </div>
 </div>

 {/* Form Area */}
 <div className="lg:col-span-2 space-y-8">
 <div className="bg-white rounded-2xl border border-slate-300 p-10">
 <h4 className="text-[13px] font-black text-[#1e4a3a] uppercase tracking-widest mb-10 flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 Identity Information
 </h4>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
 <div className="group">
 <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3 block group-focus-within:text-[#1e4a3a] transition-colors">Full Name</label>
 <input 
 type="text" 
 value={adminProfile.fullName}
 onChange={(e) => setAdminProfile({...adminProfile, fullName: e.target.value})}
 placeholder="Enter administrator name"
 className="w-full bg-transparent text-[15px] font-bold text-[#1e4a3a] outline-none placeholder:text-slate-200 pb-2 border-b-2 border-slate-300 focus:border-[#1e4a3a] transition-all"
 />
 </div>
 <div className="group opacity-60">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Email Address (Primary)</label>
 <div className="w-full bg-transparent text-[15px] font-bold text-slate-400 outline-none pb-2 border-b-2 border-slate-300">
 {adminProfile.email || auth.currentUser?.email}
 </div>
 </div>
 <div className="group">
 <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3 block group-focus-within:text-[#1e4a3a] transition-colors">Contact Phone</label>
 <input 
 type="tel" 
 value={adminProfile.phone}
 onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
 placeholder="+880 1XXX-XXXXXX"
 className="w-full bg-transparent text-[15px] font-bold text-[#1e4a3a] outline-none placeholder:text-slate-200 pb-2 border-b-2 border-slate-300 focus:border-[#1e4a3a] transition-all"
 />
 </div>
 <div className="group">
 <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3 block group-focus-within:text-[#1e4a3a] transition-colors">Department</label>
 <input 
 type="text" 
 defaultValue="General Administration"
 disabled
 className="w-full bg-transparent text-[15px] font-bold text-slate-400 outline-none pb-2 border-b-2 border-slate-300"
 />
 </div>
 </div>

 <div className="mt-16 pt-8 border-t border-slate-50 flex justify-end">
 <button 
 onClick={handleUpdateAdminProfile}
 disabled={isUpdatingProfile}
 className="h-12 px-10 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
 >
 {isUpdatingProfile ? 'Saving Changes...' : 'Update Profile'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {settingsTab === 'finance' && (
 <div className="bg-white rounded-2xl border border-slate-300 p-12 text-center max-w-2xl mx-auto">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-center mx-auto mb-6">
 <Landmark size={32} className="text-slate-300" />
 </div>
 <h3 className="text-[16px] font-black text-[#1e4a3a] uppercase tracking-widest">Finance Shortcuts</h3>
 <p className="text-[12px] text-slate-400 font-medium uppercase tracking-widest mt-2 leading-relaxed">
 Advanced financial settings, payment accounts, and coupon management have been moved for better organization.
 </p>
 <button 
 onClick={() => router.push('/dashboard/admin?view=finance')}
 className="mt-8 px-8 h-12 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all"
 >
 Go to Finance Panel
 </button>
 </div>
 )}

 {settingsTab === 'security' && (
 <div className="bg-white rounded-2xl border border-slate-300 p-20 text-center">
 <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-300 flex items-center justify-center text-slate-200 mx-auto mb-6">
 <Lock size={32} />
 </div>
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight">Security Credentials</h3>
 <p className="text-[13px] text-slate-500 font-medium max-w-xs mx-auto mt-2">
 Multi-factor authentication and password policy management is coming soon to the administration panel.
 </p>
 </div>
 )}
 </motion.div>
 )}

 {activeTab === 'nursing' && (
  <motion.div 
  key="nursing"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  className="space-y-6"
  >
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-300 ">
      <div>
        <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">Nursing & Care Control</h2>
        <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">Manage home care specialists and track site-wide nursing requests</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {nursingTab === 'caregivers' && (
          <button onClick={() => { 
            setEditingCaregiver(null); 
            setCaregiverForm({ 
              name: '', specialty: '', experience: '', rating: '5.0', 
              availability: 'Available', status: 'active', price: '', 
              phone: '', email: '', bio: '', specialties: [],
              photoURL: '', selectedPackage: ''
            }); 
            setShowAddCaregiver(true); 
          }} className="h-10 px-6 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
            <Plus size={16} /> Add Caregiver
          </button>
        )}
        <div className="h-10 w-px bg-slate-300 hidden lg:block mx-1" />
        <div className="flex items-center gap-1 p-1 bg-slate-100/50 border border-slate-300 rounded-xl">
          {[
            { id: 'bookings', label: 'Care Bookings', icon: ClipboardPlus },
            { id: 'caregivers', label: 'Specialists', icon: Users },
            { id: 'config', label: 'Service Config', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setNursingTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${nursingTab === tab.id ? 'bg-[#1e4a3a] text-white ' : 'text-slate-500 hover:text-[#1e4a3a] hover:bg-white'}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {nursingTab === 'bookings' && (
      <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-300">
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Request ID</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Care Specialist</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Package Plan</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Period</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-[12px] font-bold text-slate-700">
              {nursingBookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">#{bk.id?.slice(-8).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[#1e4a3a]">{bk.patientName || 'Anonymous'}</span>
                      <span className="text-[10px] text-slate-400">{bk.patientPhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {bk.items ? (
                      <div className="flex flex-col gap-2">
                        {bk.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-200">
                               {item.name?.[0] || 'C'}
                            </div>
                            <span className="text-slate-700">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-200">
                            {bk.caregiverName?.[0] || 'C'}
                         </div>
                         <span className="text-slate-700">{bk.caregiverName}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {bk.items ? (
                      <div className="flex flex-wrap gap-1">
                        {bk.items.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] rounded uppercase border border-rose-100">{item.providerName}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] rounded uppercase border border-rose-100">{bk.packageName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{bk.startDate}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{bk.duration || 'Short Term'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${bk.status === 'confirmed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                      {bk.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={async () => {
                      if (bk.status === 'pending') {
                        await updateDoc(doc(db, 'nursing_bookings', bk.id), { status: 'confirmed' });
                        toast.success('Service Confirmed');
                      }
                    }} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-[#1e4a3a] hover:text-white transition-all">
                      <Check size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {nursingBookings.length === 0 && (
                <tr><td colSpan="7" className="py-20 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest">No nursing service requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {nursingTab === 'caregivers' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {caregivers.map(nc => (
          <div key={nc.id} className="bg-white p-4 rounded-xl border border-slate-300 hover:border-slate-400 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden transition-colors">
                {nc.photoURL ? (
                  <img src={nc.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <Users size={20} className="text-slate-300" />
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingCaregiver(nc.id); setCaregiverForm({...nc}); setShowAddCaregiver(true); }} className="w-8 h-8 bg-white border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] hover:border-slate-400 transition-all shadow-sm"><Edit3 size={12} /></button>
                <button onClick={async () => {
                  const isConfirmed = await confirm({
                    title: 'Remove Specialist?',
                    message: `Are you sure you want to remove ${nc.name}? This will invalidate their current profile.`,
                    confirmText: 'Delete Profile',
                    type: 'danger'
                  });
                  if (isConfirmed) {
                    await deleteDoc(doc(db, 'nursing_providers', nc.id));
                    toast.success('Profile removed');
                  }
                }} className="w-8 h-8 bg-white border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"><Trash2 size={12} /></button>
              </div>
            </div>
            <h4 className="text-[14px] font-black text-[#1e4a3a] uppercase tracking-tight">{nc.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{nc.specialty}</p>
            <div className="mt-4">
              {/* Package pills */}
              {nc.packages && nc.packages.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-3">
                  {nc.packages.map((pkgId, i) => {
                    const pkg = nursingPackages.find(p => p.id === pkgId);
                    if (!pkg) return null;
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">{pkg.label}</span>
                        <span className="text-[9px] font-black text-emerald-600">৳{pkg.price}</span>
                      </span>
                    );
                  })}
                </div>
              ) : nc.price ? (
                <p className="text-[11px] font-black text-[#1e4a3a] tracking-tighter mb-3">৳{nc.price}/day</p>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{nc.packages?.length || 0} Package{(nc.packages?.length || 0) !== 1 ? 's' : ''}</span>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${nc.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{nc.status}</span>
              </div>
            </div>
          </div>
        ))}
        {caregivers.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No home care specialists registered</p>
          </div>
        )}
      </div>
    )}

    {nursingTab === 'config' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-300 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Pricing Packages</h3>
            <button onClick={() => setShowAddNursingPackage(true)} className="h-8 px-4 bg-[#1e4a3a] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Add Package</button>
          </div>
          <div className="p-4 space-y-3">
             {nursingPackages.map(pkg => (
               <div key={pkg.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all">
                  <div>
                    <p className="text-[13px] font-bold text-[#1e4a3a]">{pkg.label} <span className="text-slate-400 font-medium">{pkg.duration}</span></p>
                    <p className="text-[12px] font-black text-emerald-600 mt-1">৳{pkg.price}</p>
                  </div>
                  <button onClick={async () => {
                    const isConfirmed = await confirm({
                      title: 'Delete Package?',
                      message: `Remove "${pkg.label}" from pricing options? This cannot be undone.`,
                      type: 'danger'
                    });
                    if (isConfirmed) deleteDoc(doc(db, 'nursing_packages', pkg.id));
                  }} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
               </div>
             ))}
             {nursingPackages.length === 0 && <p className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">No packages defined</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-300 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Specialist Types</h3>
            <button onClick={() => setShowAddNursingType(true)} className="h-8 px-4 bg-[#1e4a3a] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Add Type</button>
          </div>
          <div className="p-4 space-y-3">
             {nursingTypes.map(type => (
               <div key={type.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {type.image ? <img src={type.image} className="w-full h-full object-cover" /> : <Stethoscope className="text-slate-300" size={16} />}
                    </div>
                    <p className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-tight">{type.label}</p>
                  </div>
                  <button onClick={async () => {
                    const isConfirmed = await confirm({
                      title: 'Delete Category?',
                      message: `Remove "${type.label}" from specialties? This will hide all associated specialists from this category.`,
                      type: 'danger'
                    });
                    if (isConfirmed) deleteDoc(doc(db, 'nursing_types', type.id));
                  }} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
               </div>
             ))}
             {nursingTypes.length === 0 && <p className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">No specialist types defined</p>}
          </div>
        </div>
      </div>
    )}
  </motion.div>
  )}

 {activeTab === 'ambulance' && (
    <motion.div 
      key="ambulance"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <AmbulanceManagement 
        bookings={ambulanceBookings}
        fleet={ambulanceFleet}
        isLoading={isAmbulanceLoading}
        onAddAmbulance={() => {
          setEditingAmbulance(null);
          setAmbulanceForm({ 
            plateNumber: '', driverName: '', driverPhone: '', type: 'AC', status: 'available', description: '',
            driverNID: '', licenseNo: '', city: '', baseLocation: '', coveredAreas: ''
          });
          setShowAddAmbulance(true);
        }}
        onEditAmbulance={(unit) => {
          setEditingAmbulance(unit.id);
          setAmbulanceForm({ ...unit });
          setShowAddAmbulance(true);
        }}
        onUpdateStatus={handleUpdateAmbulanceBookingStatus}
        onAssignAmbulance={(booking) => {
          setSelectedBookingForAssignment(booking);
          setShowAssignModal(true);
        }}
      />
    </motion.div>
  )}

  {activeTab === 'store' && (
    <motion.div 
      key="store"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <StoreManagement />
    </motion.div>
  )}

 {activeTab === 'lab-tests' && (
 <motion.div 
 key="lab-tests"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className="space-y-6"
 >
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-300 ">
 <div>
 <h2 className="text-[16px] font-extrabold text-[#1e4a3a] tracking-tight">
 Diagnostics Control Center
 </h2>
 <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">
 Manage real-time lab bookings, service providers, and global test inventory
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-4">
 {labTab === 'providers' && (
 <button onClick={() => { setEditingLabProvider(null); setLabProviderForm({ name: '', division: '', district: '', area: '', status: 'active' }); setShowAddLabProvider(true); }} className="h-10 px-6 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
 <Plus size={16} /> Add Provider
 </button>
 )}
 {labTab === 'catalog' && (
 <button onClick={() => { setEditingLabTest(null); setLabTestForm({ name: '', category: '', price: '', providerId: '', preparation: '', description: '', status: 'active' }); setShowAddLabTest(true); }} className="h-10 px-6 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
 <Plus size={16} /> Add Test
 </button>
 )}
 <div className="h-10 w-px bg-slate-300 hidden lg:block mx-1" />
 <div className="flex items-center gap-1 p-1 bg-slate-100/50 border border-slate-300 rounded-xl">
 {[
 { id: 'bookings', label: 'Live Bookings', icon: ClipboardPlus },
 { id: 'providers', label: 'Lab Providers', icon: Building2 },
 { id: 'catalog', label: 'Global Catalog', icon: Microscope },
 { id: 'locations', label: 'Location Manager', icon: MapPin }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setLabTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${labTab === tab.id ? 'bg-[#1e4a3a] text-white ' : 'text-slate-500 hover:text-[#1e4a3a] hover:bg-white'}`}
 >
 <tab.icon size={13} />
 {tab.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {labTab === 'bookings' && (
 <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-300">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">ID</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Patient & Contact</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Location (Collection)</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Tests</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest text-center">Schedule</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Status</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-300 text-[12px] font-bold text-slate-700">
 {labBookings.map((bk, i) => (
 <tr key={bk.id} className="hover:bg-slate-50/50 transition-all">
 <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">#{bk.id?.slice(-8).toUpperCase()}</td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-[#1e4a3a]">{bk.patientName || 'Anonymous'}</span>
 <span className="text-[10px] text-slate-400">{bk.patientPhone}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col max-w-[200px]">
 <span className="truncate">{bk.location?.area}, {bk.location?.district}</span>
 <span className="text-[10px] text-slate-400 truncate">{bk.collectionAddress}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1">
 {bk.items?.map((item, idx) => (
 <span key={idx} className="px-1.5 py-0.5 bg-sky-50 text-sky-600 text-[8px] rounded uppercase border border-sky-100">{item.name}</span>
 ))}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex flex-col">
 <span>{bk.date}</span>
 <span className="text-[10px] text-slate-400 uppercase">{bk.time}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${bk.status === 'confirmed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
 {bk.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button onClick={async () => {
 if (bk.status === 'pending') {
 await updateDoc(doc(db, 'lab_bookings', bk.id), { status: 'confirmed' });
 toast.success('Booking Confirmed');
 }
 }} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-[#1e4a3a] hover:text-white transition-all">
 <Check size={14} />
 </button>
 </td>
 </tr>
 ))}
 {labBookings.length === 0 && (
 <tr><td colSpan="7" className="py-20 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest">No active lab bookings</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {labTab === 'providers' && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
 {labProviders.map(lp => (
 <div key={lp.id} className="bg-white p-4 rounded-xl border border-slate-300 hover:border-slate-400 transition-all group">
 <div className="flex items-start justify-between mb-4">
 <div className="w-12 h-12 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
 <Building2 size={24} />
 </div>
  <div className="flex gap-2">
 <button onClick={() => { setEditingLabProvider(lp.id); setLabProviderForm({...lp}); setShowAddLabProvider(true); }} className="w-8 h-8 bg-white border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] hover:border-slate-400 transition-all shadow-sm"><Edit3 size={12} /></button>
 <button onClick={async () => {
  const isConfirmed = await confirm({
  title: 'Terminate Provider?',
  message: `Are you sure you want to remove ${lp.name}? This will affect all associated clinical tests.`,
  confirmText: 'Delete Provider',
  type: 'danger'
  });
  if (isConfirmed) {
  await deleteDoc(doc(db, 'lab_providers', lp.id));
  toast.success('Provider removed');
  }
  }} className="w-8 h-8 bg-white border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"><Trash2 size={12} /></button>
 </div>
 </div>
 <h4 className="text-[14px] font-black text-[#1e4a3a] uppercase tracking-tight">{lp.name}</h4>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lp.area}, {lp.district}, {lp.division}</p>
 <div className="mt-6 flex items-center justify-between">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{labTests.filter(t => t.providerId === lp.id).length} Tests Listed</span>
 <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${lp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{lp.status}</span>
 </div>
 </div>
 ))}
 {labProviders.length === 0 && (
 <div className="col-span-full py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No diagnostic providers found</p>
 </div>
 )}
 </div>
 )}

 {labTab === 'catalog' && (
 <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
 <div className="p-6 border-b border-slate-300 flex items-center gap-4">
 <div className="relative group flex-1">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="Filter catalog by test name..." 
 value={labSearch}
 onChange={(e) => setLabSearch(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-[11px] font-bold outline-none placeholder:text-slate-400" 
 />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-300">
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Test Name</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest">Provider</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest text-right">Price</th>
 <th className="px-6 py-4 text-[10px] font-extrabold text-[#1e4a3a] uppercase tracking-widest text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-300 text-[12px] font-bold text-slate-700">
 {labTests.filter(t => t.name.toLowerCase().includes(labSearch.toLowerCase())).map(test => (
 <tr key={test.id} className="hover:bg-slate-50/50 transition-all">
 <td className="px-6 py-4 text-[#1e4a3a]">{test.name}</td>
 <td className="px-6 py-4 text-slate-500">{labProviders.find(p => p.id === test.providerId)?.name || 'Unknown'}</td>
 <td className="px-6 py-4 text-right text-[#1e4a3a]">৳{test.price}</td>
 <td className="px-6 py-4 text-right">
  <div className="flex justify-end gap-2">
 <button onClick={() => { setEditingLabTest(test.id); setLabTestForm({...test}); setShowAddLabTest(true); }} className="w-8 h-8 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] hover:bg-white transition-all"><Edit3 size={12} /></button>
 <button onClick={async () => {
  const isConfirmed = await confirm({
  title: 'Remove Test from Catalog?',
  message: `This will permanently remove ${test.name} from the diagnostic offerings.`,
  confirmText: 'Delete Test',
  type: 'danger'
  });
  if (isConfirmed) {
  await deleteDoc(doc(db, 'lab_tests', test.id));
  toast.success('Test removed from catalog');
  }
  }} className="w-8 h-8 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white transition-all"><Trash2 size={12} /></button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {labTab === 'locations' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden flex flex-col h-[650px]">
 <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
 <h3 className="text-[10px] font-black text-[#1e4a3a] uppercase tracking-widest">01. Divisions</h3>
 <MapPin size={14} className="text-slate-300" />
 </div>
 <div className="p-4 border-b border-slate-100 flex gap-2">
 <input 
 type="text" placeholder="New Division..." 
 value={locForm.division} onChange={e => setLocForm({...locForm, division: e.target.value})}
 className="flex-1 h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold outline-none focus:border-emerald-500" 
 />
 <button onClick={async () => {
 if (!locForm.division) return;
 try {
 await setDoc(doc(db, 'locations', locForm.division), { createdAt: new Date().toISOString() }, { merge: true });
 toast.success('Division Registered');
 setLocForm({...locForm, division: ''});
 } catch (e) { toast.error('Check access'); }
 }} className="w-9 h-9 bg-[#1e4a3a] text-white rounded-lg flex items-center justify-center hover:bg-black transition-all">
 <Plus size={16} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
 {getDivisions().map(div => (
 <div 
 key={div} 
 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${selectedLocDiv === div ? 'bg-[#1e4a3a] text-white font-black' : 'hover:bg-slate-50 text-[12px] font-bold text-slate-600'}`}
 onClick={() => { setSelectedLocDiv(div); setSelectedLocDist(''); }}
 >
 {div}
 <div className="flex items-center gap-2">
 {selectedLocDiv === div && (
 <button onClick={async (e) => {
 e.stopPropagation();
 const isConfirmed = await confirm({ title: 'Delete Division?', message: `This will remove ${div} and all its districts.`, type: 'danger' });
 if (isConfirmed) {
 await deleteDoc(doc(db, 'locations', div));
 setSelectedLocDiv('');
 toast.success('Division Deleted');
 }
 }}>
 <Trash2 size={12} className="text-rose-400 opacity-60 hover:opacity-100" />
 </button>
 )}
 <ChevronRight size={14} className={selectedLocDiv === div ? 'text-emerald-400' : 'text-slate-200'} />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden flex flex-col h-[650px]">
 <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
 <h3 className="text-[10px] font-black text-[#1e4a3a] uppercase tracking-widest">02. Districts {selectedLocDiv && `in ${selectedLocDiv}`}</h3>
 <Navigation size={14} className="text-slate-300" />
 </div>
 {selectedLocDiv ? (
 <>
 <div className="p-4 border-b border-slate-100 flex gap-2">
 <input 
 type="text" placeholder="New District..." 
 value={locForm.district} onChange={e => setLocForm({...locForm, district: e.target.value})}
 className="flex-1 h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold outline-none focus:border-emerald-500" 
 />
 <button onClick={async () => {
 if (!locForm.district) return;
 try {
 await setDoc(doc(db, 'locations', selectedLocDiv), { [locForm.district]: [] }, { merge: true });
 toast.success('District Indexed');
 setLocForm({...locForm, district: ''});
 } catch (e) { toast.error('Update failed'); }
 }} className="w-9 h-9 bg-[#1e4a3a] text-white rounded-lg flex items-center justify-center hover:bg-black transition-all">
 <Plus size={16} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
 {getDistricts(selectedLocDiv).map(dist => (
 <div 
 key={dist} 
 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${selectedLocDist === dist ? 'bg-[#1e4a3a] text-white font-black' : 'hover:bg-slate-50 text-[12px] font-bold text-slate-600'}`}
 onClick={() => setSelectedLocDist(dist)}
 >
 {dist}
 <div className="flex items-center gap-2">
 {selectedLocDist === dist && (
 <button onClick={async (e) => {
 e.stopPropagation();
 const isConfirmed = await confirm({ title: 'Delete District?', message: `This will remove ${dist} from ${selectedLocDiv}.`, type: 'danger' });
 if (isConfirmed) {
 const docRef = doc(db, 'locations', selectedLocDiv);
 const divSnap = await getDoc(docRef);
 let data = divSnap.data();
 delete data[dist];
 await setDoc(docRef, data);
 setSelectedLocDist('');
 toast.success('District Removed');
 }
 }}>
 <Trash2 size={12} className="text-rose-400 opacity-60 hover:opacity-100" />
 </button>
 )}
 <ChevronRight size={14} className={selectedLocDist === dist ? 'text-emerald-400' : 'text-slate-200'} />
 </div>
 </div>
 ))}
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
 <MapPin size={32} className="text-slate-100 mb-4" />
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[150px]">Select a division to manage districts</p>
 </div>
 )}
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden flex flex-col h-[650px]">
 <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
 <h3 className="text-[10px] font-black text-[#1e4a3a] uppercase tracking-widest">03. Areas {selectedLocDist && `in ${selectedLocDist}`}</h3>
 <Plus size={14} className="text-slate-300" />
 </div>
 {selectedLocDist ? (
 <>
 <div className="p-4 border-b border-slate-100 space-y-3">
 <div className="flex gap-2">
 <input 
 type="text" placeholder="Single Area..." 
 value={locForm.area} onChange={e => setLocForm({...locForm, area: e.target.value})}
 className="flex-1 h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold outline-none focus:border-emerald-500" 
 />
 <button onClick={async () => {
 if (!locForm.area) return;
 try {
 const docRef = doc(db, 'locations', selectedLocDiv);
 const divSnap = await getDoc(docRef);
 let currentAreas = divSnap.exists() ? (divSnap.data()[selectedLocDist] || []) : [];
 if (!currentAreas.includes(locForm.area)) {
 await setDoc(docRef, { [selectedLocDist]: [...currentAreas, locForm.area] }, { merge: true });
 toast.success('Area Indexed');
 setLocForm({...locForm, area: ''});
 }
 } catch (e) { toast.error('Sync failed'); }
 }} className="w-9 h-9 bg-[#1e4a3a] text-white rounded-lg flex items-center justify-center hover:bg-black transition-all">
 <Plus size={16} />
 </button>
 </div>
 <div className="flex gap-1">
 <textarea 
 placeholder="Bulk Add (comma separated)..." 
 className="flex-1 h-14 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold resize-none outline-none focus:border-[#1e4a3a] transition-all font-black"
 onKeyDown={async (e) => {
 if (e.key === 'Enter' && !e.shiftKey && e.target.value.trim()) {
 e.preventDefault();
 const areas = e.target.value.split(',').map(s => s.trim()).filter(s => s);
 if (areas.length === 0) return;
 try {
 const docRef = doc(db, 'locations', selectedLocDiv);
 const divSnap = await getDoc(docRef);
 const currentAreas = divSnap.exists() ? (divSnap.data()[selectedLocDist] || []) : [];
 const combined = [...new Set([...currentAreas, ...areas])];
 await setDoc(docRef, { [selectedLocDist]: combined }, { merge: true });
 toast.success(`${areas.length} Areas Indexed`);
 e.target.value = '';
 } catch (err) { toast.error('Bulk update failed'); }
 }
 }}
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
 {getAreas(selectedLocDiv, selectedLocDist).map(area => (
 <div key={area} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-800 lg:group">
 {area}
 <button onClick={async () => {
 const isConfirmed = await confirm({ title: 'Remove Area?', message: `This will remove ${area} from ${selectedLocDist}.`, type: 'danger' });
 if (isConfirmed) {
 const docRef = doc(db, 'locations', selectedLocDiv);
 const divSnap = await getDoc(docRef);
 const areas = divSnap.data()[selectedLocDist].filter(a => a !== area);
 await setDoc(docRef, { [selectedLocDist]: areas }, { merge: true });
 toast.success('Area removed');
 }
 }}>
 <Trash2 size={12} className="text-slate-300 hover:text-rose-500 transition-colors" />
 </button>
 </div>
 ))}
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
 <Navigation size={32} className="text-slate-100 mb-4" />
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[150px]">Select a district to manage areas</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </motion.div>
 )}

 <AnimatePresence>
 {showAddSpecialty && (
 <div key="add-specialty-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddSpecialty(false)} />
 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden">
 <form onSubmit={handleSaveSpecialty} className="p-6 space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-[16px] font-bold text-med-text tracking-tight uppercase">New Medical Specialty</h3>
 <button type="button" onClick={() => setShowAddSpecialty(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Specialty Name</label>
 <input required type="text" value={specForm.name} onChange={(e) => setSpecForm({...specForm, name: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-med-primary/30 transition-all" placeholder="e.g. Orthopedics, Psychology..." />
 </div>
 
 <div className="space-y-2">
 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Visual Identity (Icon)</label>
 <div className="grid grid-cols-6 gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-[160px] overflow-y-auto">
 {Object.keys(ICON_MAP).map((iconName) => (
 <button 
 key={iconName} type="button" onClick={() => setSpecForm({...specForm, icon: iconName})}
 className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${specForm.icon === iconName ? 'bg-[#1e4a3a] text-white scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'}`}
 >
 <IconComponent name={iconName} size={18} />
 </button>
 ))}
 </div>
 </div>

 <div className="flex gap-4">
 <div className="flex-1 space-y-1.5 relative">
 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Brand Color</label>
 
 <button 
 type="button"
 onClick={() => setShowColorDropdown(!showColorDropdown)}
 className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 flex items-center justify-between group hover:border-slate-300 transition-all"
 >
 <div className="flex items-center gap-3">
 <div className={`w-3 h-3 rounded-full ${specForm.color.replace('text', 'bg')}`} />
 <span className="text-[13px] font-bold text-slate-700">{COLORS.find(c => c.color === specForm.color)?.name || 'Select Color'}</span>
 </div>
 <ChevronRight size={16} className={`text-slate-400 transition-transform ${showColorDropdown ? 'rotate-90' : ''}`} />
 </button>

 <AnimatePresence>
 {showColorDropdown && (
 <>
 <div className="fixed inset-0 z-[110]" onClick={() => setShowColorDropdown(false)} />
 <motion.div 
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-xl border border-slate-200 p-2 z-[120] grid grid-cols-1 gap-1"
 >
 {COLORS.map((c) => (
 <button
 key={c.name}
 type="button"
 onClick={() => {
 setSpecForm({ ...specForm, color: c.color, bg: c.bg });
 setShowColorDropdown(false);
 }}
 className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-all group"
 >
 <div className={`w-6 h-6 rounded-lg ${c.bg} flex items-center justify-center`}>
 <div className={`w-2 h-2 rounded-full ${c.color.replace('text', 'bg')}`} />
 </div>
 <span className={`text-[12px] font-bold ${specForm.color === c.color ? 'text-[#1e4a3a]' : 'text-slate-500'}`}>{c.name}</span>
 {specForm.color === c.color && <Check size={14} className="ml-auto text-emerald-500" />}
 </button>
 ))}
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 <div className="w-11 h-11 rounded-lg flex items-center justify-center self-end border border-slate-200 bg-slate-50 ">
 <IconComponent name={specForm.icon} size={20} className={specForm.color} />
 </div>
 </div>
 </div>

 <div className="pt-2 flex justify-end gap-3">
 <button type="button" onClick={() => setShowAddSpecialty(false)} className="h-11 px-6 text-[12px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
 <button type="submit" disabled={isSaving} className="h-11 px-8 bg-[#1e4a3a] text-white rounded-xl text-[12px] font-bold hover:bg-black transition-all disabled:opacity-50">
 {isSaving ? 'Initializing...' : 'Register Specialty'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}

 {showAddService && (
 <div key="add-service-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddService(false)} />
 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white rounded-xl overflow-hidden">
 <form onSubmit={handleSaveService} className="p-6 space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-[14px] font-bold text-med-text tracking-tight uppercase">{editingService !== null ? 'Modify Treatment' : 'Define New Treatment'}</h3>
 <button type="button" onClick={() => setShowAddService(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Treatment Name</label>
 <input required type="text" value={serviceForm.name} onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-med-primary/30" placeholder="e.g. Heart Rhythm Monitoring..." />
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Base Price (৳)</label>
 <input required type="number" value={serviceForm.price} onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none" placeholder="1500" />
 </div>
 <div className="flex items-center gap-3 pt-6 pl-2">
 <button type="button" onClick={() => setServiceForm({...serviceForm, telemed: !serviceForm.telemed})} className={`w-10 h-5 rounded-full transition-all relative ${serviceForm.telemed ? 'bg-blue-600' : 'bg-slate-200'}`}>
 <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${serviceForm.telemed ? 'left-6' : 'left-1'}`} />
 </button>
 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Telemed</span>
 </div>
 </div>

 {serviceForm.telemed && (
 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
 <label className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest px-1">Telemedicine Pricing (৳)</label>
 <input required type="number" value={serviceForm.telemedPrice} onChange={(e) => setServiceForm({...serviceForm, telemedPrice: e.target.value})} className="w-full h-11 bg-white border border-blue-100 rounded-lg px-4 text-[13px] font-bold text-blue-700 outline-none" placeholder="800" />
 </motion.div>
 )}
 </div>

 <div className="pt-2 flex justify-end gap-3">
 <button type="button" onClick={() => setShowAddService(false)} className="h-10 px-6 text-[11px] font-bold text-slate-400">Discard</button>
 <button type="submit" disabled={isSaving} className="h-10 px-8 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold hover:bg-black transition-all disabled:opacity-50">
 {isSaving ? 'Processing...' : (editingService !== null ? 'Update Service' : 'Confirm Service')}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 
 <AnimatePresence>
 {showAddLabProvider && (
 <div key="add-lab-provider-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddLabProvider(false)} />
 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl">
 <form onSubmit={handleSaveLabProvider} className="p-8 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight uppercase">{editingLabProvider ? 'Edit Provider Identity' : 'Register Diagnostic Provider'}</h3>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure clinical branch details</p>
 </div>
 <button type="button" onClick={() => setShowAddLabProvider(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
 </div>
 
 <div className="space-y-5">
 <div className="space-y-1.5">
 <label className="input-label-premium">Provider / Center Name</label>
 <div className="input-wrapper-premium group">
 <Building2 className="input-icon-premium" size={14} />
 <input required type="text" value={labProviderForm.name} onChange={(e) => setLabProviderForm({...labProviderForm, name: e.target.value})} className="input-raw-premium" placeholder="e.g. Popular Diagnostic Center..." />
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
  {/* --- Division Dropdown --- */}
  <div className="space-y-1.5">
  <label className="input-label-premium">Division</label>
  <div className="relative">
  <button
  type="button"
  onClick={() => setLpDropOpen(s => ({...s, division: !s.division, district: false, area: false}))}
  className="w-full h-11 flex items-center justify-between px-4 bg-slate-50 border border-slate-300 rounded-xl text-[12px] font-bold text-left transition-all hover:border-slate-400 focus:outline-none focus:border-[#1e4a3a]"
  >
  <span className={labProviderForm.division ? 'text-[#1e4a3a]' : 'text-slate-400'}>{labProviderForm.division || 'Select Division...'}</span>
  <ChevronDown size={14} className={`text-slate-400 transition-transform ${lpDropOpen.division ? 'rotate-180' : ''}`} />
  </button>
  {lpDropOpen.division && (
  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-300 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
  {getDivisions().length === 0 ? (
  <p className="px-4 py-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest">No divisions — add via Location Manager</p>
  ) : getDivisions().map(div => (
  <button
  key={div}
  type="button"
  onClick={() => { setLabProviderForm(f => ({...f, division: div, district: '', area: ''})); setLpDropOpen({division: false, district: false, area: false}); }}
  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold transition-all hover:bg-slate-50 ${labProviderForm.division === div ? 'text-[#1e4a3a] bg-slate-50' : 'text-slate-600'}`}
  >
  {div}
  </button>
  ))}
  </div>
  )}
  </div>
  </div>

  {/* --- District Dropdown --- */}
  <div className="space-y-1.5">
  <label className="input-label-premium">District</label>
  <div className="relative">
  <button
  type="button"
  disabled={!labProviderForm.division}
  onClick={() => setLpDropOpen(s => ({...s, district: !s.district, division: false, area: false}))}
  className={`w-full h-11 flex items-center justify-between px-4 border rounded-xl text-[12px] font-bold text-left transition-all focus:outline-none ${
  labProviderForm.division
  ? 'bg-slate-50 border-slate-300 hover:border-slate-400 focus:border-[#1e4a3a]'
  : 'bg-slate-50/50 border-slate-200 opacity-50 cursor-not-allowed'
  }`}
  >
  <span className={labProviderForm.district ? 'text-[#1e4a3a]' : 'text-slate-400'}>{labProviderForm.district || (labProviderForm.division ? 'Select District...' : 'Choose division first')}</span>
  <ChevronDown size={14} className={`text-slate-400 transition-transform ${lpDropOpen.district ? 'rotate-180' : ''}`} />
  </button>
  {lpDropOpen.district && labProviderForm.division && (
  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-300 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
  {getDistricts(labProviderForm.division).length === 0 ? (
  <p className="px-4 py-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest">No districts in this division</p>
  ) : getDistricts(labProviderForm.division).map(dist => (
  <button
  key={dist}
  type="button"
  onClick={() => { setLabProviderForm(f => ({...f, district: dist, area: ''})); setLpDropOpen({division: false, district: false, area: false}); }}
  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold transition-all hover:bg-slate-50 ${labProviderForm.district === dist ? 'text-[#1e4a3a] bg-slate-50' : 'text-slate-600'}`}
  >
  {dist}
  </button>
  ))}
  </div>
  )}
  </div>
  </div>
 </div>
 
  {/* --- Area Dropdown --- */}
  <div className="space-y-1.5">
  <label className="input-label-premium">Area / Branch</label>
  <div className="relative">
  <button
  type="button"
  disabled={!labProviderForm.district}
  onClick={() => setLpDropOpen(s => ({...s, area: !s.area, division: false, district: false}))}
  className={`w-full h-11 flex items-center justify-between px-4 border rounded-xl text-[12px] font-bold text-left transition-all focus:outline-none ${
  labProviderForm.district
  ? 'bg-slate-50 border-slate-300 hover:border-slate-400 focus:border-[#1e4a3a]'
  : 'bg-slate-50/50 border-slate-200 opacity-50 cursor-not-allowed'
  }`}
  >
  <span className={labProviderForm.area ? 'text-[#1e4a3a]' : 'text-slate-400'}>{labProviderForm.area || (labProviderForm.district ? 'Select Area...' : 'Choose district first')}</span>
  <ChevronDown size={14} className={`text-slate-400 transition-transform ${lpDropOpen.area ? 'rotate-180' : ''}`} />
  </button>
  {lpDropOpen.area && labProviderForm.district && (
  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-300 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
  {getAreas(labProviderForm.division, labProviderForm.district).length === 0 ? (
  <p className="px-4 py-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest">No areas in this district</p>
  ) : getAreas(labProviderForm.division, labProviderForm.district).map(area => (
  <button
  key={area}
  type="button"
  onClick={() => { setLabProviderForm(f => ({...f, area})); setLpDropOpen({division: false, district: false, area: false}); }}
  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold transition-all hover:bg-slate-50 ${labProviderForm.area === area ? 'text-[#1e4a3a] bg-slate-50' : 'text-slate-600'}`}
  >
  {area}
  </button>
  ))}
  </div>
  )}
  </div>
  </div>
 
 <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-300">
 <div className="flex-1">
 <p className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-tight">Provider Status</p>
 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{labProviderForm.status === 'active' ? 'Currently visible to patients' : 'Temporarily suspended'}</p>
 </div>
 <button 
 type="button"
 onClick={() => setLabProviderForm({...labProviderForm, status: labProviderForm.status === 'active' ? 'inactive' : 'active'})}
 className={`relative w-10 h-5 rounded-full transition-all duration-300 ${labProviderForm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
 >
 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${labProviderForm.status === 'active' ? 'left-5.5' : 'left-0.5'}`} />
 </button>
 </div>
 </div>
 
 <div className="pt-4 flex justify-end gap-3">
 <button type="button" onClick={() => setShowAddLabProvider(false)} className="h-11 px-6 text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Discard</button>
 <button type="submit" disabled={isSaving} className="h-11 px-10 bg-[#1e4a3a] text-white rounded-xl text-[12px] font-bold hover:bg-black transition-all disabled:opacity-50 uppercase tracking-widest">
 {isSaving ? 'Processing...' : (editingLabProvider ? 'Push Updates' : 'Confirm Registration')}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 
 <AnimatePresence>
 {showAddLabTest && (
 <div key="add-lab-test-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddLabTest(false)} />
 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden border border-slate-300">
 <form onSubmit={handleSaveLabTest} className="p-8 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight uppercase">{editingLabTest ? 'Modify Diagnostic Test' : 'Add New Clinical Test'}</h3>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure global catalog entry</p>
 </div>
 <button type="button" onClick={() => setShowAddLabTest(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
 </div>
 
 <div className="space-y-5">
 <div className="space-y-1.5">
 <label className="input-label-premium">Test Name</label>
 <div className="input-wrapper-premium group">
 <Microscope className="input-icon-premium" size={14} />
 <input required type="text" value={labTestForm.name} onChange={(e) => setLabTestForm({...labTestForm, name: e.target.value})} className="input-raw-premium" placeholder="e.g. CBC, Lipid Profile..." />
 </div>
 </div>
 
  <div className="space-y-1.5">
  <label className="input-label-premium">Agent / Center</label>
  <div className="relative">
  <button
  type="button"
  onClick={() => { setLtProviderDropOpen(o => !o); setLtProviderSearch(''); }}
  className="w-full h-11 flex items-center justify-between px-4 bg-slate-50 border border-slate-300 rounded-xl text-[12px] font-bold text-left transition-all hover:border-slate-400 focus:outline-none"
  >
  <div className="flex items-center gap-2 overflow-hidden">
  <Building2 size={13} className="text-slate-400 shrink-0" />
  <span className={`truncate ${labTestForm.providerId ? 'text-[#1e4a3a]' : 'text-slate-400'}`}>
  {labTestForm.providerId
  ? ((labProviders.find(p => p.id === labTestForm.providerId)?.name || '') + ' \u2014 ' + (labProviders.find(p => p.id === labTestForm.providerId)?.area || ''))
  : 'Select Agent...'}
  </span>
  </div>
  <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${ltProviderDropOpen ? 'rotate-180' : ''}`} />
  </button>
  {ltProviderDropOpen && (
  <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
  <div className="p-2 border-b border-slate-100">
  <div className="flex items-center gap-2 px-3 h-9 bg-slate-50 border border-slate-200 rounded-lg">
  <Search size={12} className="text-slate-400 shrink-0" />
  <input autoFocus type="text" value={ltProviderSearch} onChange={e => setLtProviderSearch(e.target.value)} placeholder="Search agents..." className="flex-1 bg-transparent text-[11px] font-bold text-slate-700 outline-none placeholder:text-slate-300" />
  {ltProviderSearch && (<button type="button" onClick={() => setLtProviderSearch('')} className="text-slate-300 hover:text-slate-500"><X size={11} /></button>)}
  </div>
  </div>
  <div className="max-h-52 overflow-y-auto">
  {(labProviders.filter(p => !ltProviderSearch || p.name?.toLowerCase().includes(ltProviderSearch.toLowerCase()) || p.area?.toLowerCase().includes(ltProviderSearch.toLowerCase()) || p.district?.toLowerCase().includes(ltProviderSearch.toLowerCase()))).length === 0 ? (
  <p className="px-4 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">No agents match</p>
  ) : labProviders.filter(p => !ltProviderSearch || p.name?.toLowerCase().includes(ltProviderSearch.toLowerCase()) || p.area?.toLowerCase().includes(ltProviderSearch.toLowerCase()) || p.district?.toLowerCase().includes(ltProviderSearch.toLowerCase())).map(p => (
  <button key={p.id} type="button"
  onClick={() => { setLabTestForm(f => ({...f, providerId: p.id})); setLtProviderDropOpen(false); setLtProviderSearch(''); }}
  className={`w-full text-left px-4 py-3 transition-all border-b border-slate-50 last:border-0 hover:bg-slate-50 ${labTestForm.providerId === p.id ? 'bg-emerald-50' : ''}`}>
  <p className={`text-[12px] font-bold ${labTestForm.providerId === p.id ? 'text-emerald-700' : 'text-slate-700'}`}>{p.name}</p>
  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{[p.area, p.district].filter(Boolean).join(' \u00b7 ')}</p>
  </button>
  ))}
  </div>
  </div>
  )}
  </div>
  </div>
 
 <div className="space-y-1.5">
 <label className="input-label-premium">Standard Price (৳)</label>
 <div className="input-wrapper-premium group">
 <span className="ml-3 text-[12px] font-bold text-slate-400">৳</span>
 <input required type="number" value={labTestForm.price} onChange={(e) => setLabTestForm({...labTestForm, price: e.target.value})} className="input-raw-premium" placeholder="800" />
 </div>
 </div>
 
 <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-300">
 <div className="flex-1">
 <p className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-tight">Availability</p>
 <button 
 type="button"
 onClick={() => setLabTestForm({...labTestForm, status: labTestForm.status === 'active' ? 'inactive' : 'active'})}
 className={`relative w-10 h-5 rounded-full mt-1 transition-all duration-300 ${labTestForm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
 >
 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${labTestForm.status === 'active' ? 'left-5.5' : 'left-0.5'}`} />
 </button>
 </div>
 </div>
 </div>
 
 <div className="pt-4 flex justify-end gap-3 border-t border-slate-300">
 <button type="button" onClick={() => setShowAddLabTest(false)} className="h-11 px-6 text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Cancel</button>
 <button type="submit" disabled={isSaving} className="h-11 px-10 bg-[#1e4a3a] text-white rounded-xl text-[12px] font-bold hover:bg-black transition-all disabled:opacity-50 uppercase tracking-widest">
 {isSaving ? 'Publishing...' : (editingLabTest ? 'Update Catalog' : 'Publish Test')}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 
 <AnimatePresence>
 {selectedDoctor && (
 <div key="doctor-detail-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setSelectedDoctor(null)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden border border-slate-300 flex flex-col max-h-[85vh]"
 >
 {/* Header */}
 <div className="p-5 border-b border-slate-300 flex items-center justify-between bg-slate-50/30">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 overflow-hidden shrink-0">
 {selectedDoctor.photoURL ? (
 <img src={selectedDoctor.photoURL} alt="" className="w-full h-full object-cover" />
 ) : (
 <Stethoscope size={20} />
 )}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-[15px] font-bold text-[#1e4a3a] tracking-tight leading-none">{selectedDoctor.fullName}</h3>
 <div className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-widest leading-none">Verified</div>
 </div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{selectedDoctor.specialties?.join(' • ') || 'Medical Doctor'}</p>
 </div>
 </div>
 <button onClick={() => setSelectedDoctor(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all border border-transparent hover:border-slate-300">
 <X size={18} />
 </button>
 </div>

 {/* Content Scroll Area */}
 <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
 {/* Stats Row */}
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: 'BMDC REG.', value: selectedDoctor.bmdcCode || '--' },
 { label: 'EXPERIENCE', value: `${selectedDoctor.experience || 0} Years` },
 { label: 'CONSULTATION', value: `৳${selectedDoctor.fee || 0}` }
 ].map((stat, i) => (
 <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-300 flex flex-col items-center justify-center text-center">
 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
 <p className="text-[12px] font-bold text-slate-700">{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Bio Section */}
 <div className="space-y-2">
 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Professional Bio</h4>
 <div className="p-4 bg-slate-50 rounded-xl border border-slate-300">
 <p className="text-[12px] text-slate-700 leading-relaxed font-medium italic">
 "{selectedDoctor.bio || 'This doctor is a verified member of our medical network. Detailed professional biography is available upon credential verification.'}"
 </p>
 </div>
 </div>

 {/* Split View: Identity & Services */}
 <div className="grid grid-cols-2 gap-6 items-start">
 <div className="space-y-3">
 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Identity Details</h4>
 <div className="space-y-2">
 <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 truncate overflow-hidden border border-slate-300">
 <Mail size={12} className="text-slate-300 shrink-0" /> {selectedDoctor.email}
 </div>
 <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-300">
 <Phone size={12} className="text-slate-300 shrink-0" /> {selectedDoctor.phone}
 </div>
 <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-300">
 <MapPin size={12} className="text-slate-300 shrink-0" /> {selectedDoctor.city || 'Dhaka'}
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Clinical Scope</h4>
 <div className="space-y-4">
 {(() => {
 const allMappedServices = new Set();
 const specGroups = selectedDoctor.specialties?.map((specName, sIdx) => {
 const globalSpec = specialties.find(s => s.name === specName);
 const specServicesGlobal = globalSpec?.services?.map(serv => serv.name) || [];
 const doctorSpecServices = selectedDoctor.services?.filter(serv => specServicesGlobal.includes(serv)) || [];
 
 doctorSpecServices.forEach(s => allMappedServices.add(s));
 
 if (doctorSpecServices.length === 0) return null;
 
 return (
 <div key={sIdx} className="space-y-1.5">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tight">{specName}</span>
 </div>
 <div className="flex flex-wrap gap-1.5 pl-3.5">
 {doctorSpecServices.map((s, i) => (
 <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-300 text-[8px] font-bold uppercase tracking-tighter rounded-md">{s}</span>
 ))}
 </div>
 </div>
 );
 });

 const otherServices = selectedDoctor.services?.filter(s => !allMappedServices.has(s)) || [];
 
 const hasAnyServices = (selectedDoctor.services?.length || 0) > 0;
 
 if (!hasAnyServices) return <span className="text-[10px] text-slate-300 italic px-1">No services listed</span>;

 return (
 <>
 {specGroups}
 {otherServices.length > 0 && (
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Additional Offering</span>
 </div>
 <div className="flex flex-wrap gap-1.5 pl-3.5">
 {otherServices.map((s, i) => (
 <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-300 text-[8px] font-bold uppercase tracking-tighter rounded-md">{s}</span>
 ))}
 </div>
 </div>
 )}
 </>
 );
 })()}
 </div>
 </div>
 </div>
 </div>

 {/* Footer Actions */}
 <div className="p-5 border-t border-slate-300 bg-slate-50/30 flex gap-3 mt-auto">
 <button className="flex-1 h-10 bg-white border border-slate-300 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
 <FileText size={14} className="text-slate-400" />
 View Documents
 </button>
 <button 
 onClick={() => {
 setSelectedDoctor(null);
 setEditingDoctor(selectedDoctor);
 setDoctorForm({
 ...selectedDoctor,
 password: '',
 paymentMethods: selectedDoctor.paymentMethods || [],
 specialties: selectedDoctor.specialties || [],
 services: selectedDoctor.services || []
 });
 setShowRegisterDoctor(true);
 }}
 className="flex-1 h-10 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold hover:bg-black transition-all uppercase tracking-widest flex items-center justify-center gap-2"
 >
 <Edit3 size={14} className="text-slate-400" />
 Edit Profile
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {showRegisterDoctor && (
 <div key="register-doctor-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-[#1e4a3a]/40"
 onClick={() => setShowRegisterDoctor(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.98, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 className="relative w-full max-w-5xl bg-white rounded-xl overflow-hidden flex flex-col max-h-[92vh]"
 >
 {/* Header */}
 <div className="p-5 flex items-center justify-between border-b border-slate-300">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
 <Stethoscope size={16} />
 </div>
 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor'}</h3>
 </div>
 <button onClick={() => setShowRegisterDoctor(false)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all border border-transparent hover:border-slate-300">
 <X size={18} />
 </button>
 </div>

 <form ref={doctorFormRef} className="flex-grow overflow-y-auto custom-scrollbar" onSubmit={handleRegisterDoctor}>
 <div className="p-5 space-y-8">
 <section className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-bold">01</div>
 <h2 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-[0.15em]">Basic Info</h2>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
 {/* Profile Image - Span 1 */}
 <div className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-xl border border-slate-300">
 <div className="relative group w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center hover:border-emerald-500 transition-all cursor-pointer overflow-hidden shrink-0">
 {doctorPhotoFile ? (
 <img src={URL.createObjectURL(doctorPhotoFile)} alt="Preview" className="w-full h-full object-cover" />
 ) : (
 <Camera className="text-slate-400" size={18} />
 )}
 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setDoctorPhotoFile(e.target.files?.[0])} />
  {doctorPhotoFile && (
    <button 
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDoctorPhotoFile(null);
      }}
      className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
    >
      <X size={10} />
    </button>
  )}
 </div>
 <div className="space-y-0.5">
 <div className="text-[11px] font-bold text-slate-600">Profile Image</div>
 <p className="text-[9px] text-slate-400 font-medium">Clear ID photo</p>
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="input-label-premium">Legal Full Name</label>
 <div className="input-wrapper-premium group">
 <UserCircle className="input-icon-premium" size={14} />
 <input type="text" value={doctorForm.fullName} onChange={e => setDoctorForm({...doctorForm, fullName: e.target.value})} placeholder="Dr. John Doe" required className="input-raw-premium" />
 </div>
 </div>

 <div className={`space-y-1.5 ${editingDoctor ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
 <label className="input-label-premium">Secure Password</label>
 <div className="input-wrapper-premium group">
 <Lock className="input-icon-premium" size={14} />
 <input type="password" value={doctorForm.password} onChange={e => setDoctorForm({...doctorForm, password: e.target.value})} placeholder={editingDoctor ? '••••••••' : 'Min. 8 characters'} required={!editingDoctor} className="input-raw-premium" />
 </div>
 </div>

 <div className={`space-y-1.5 ${editingDoctor ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
 <label className="input-label-premium">Professional Email</label>
 <div className="input-wrapper-premium group">
 <Mail className="input-icon-premium" size={14} />
 <input type="email" value={doctorForm.email} onChange={e => setDoctorForm({...doctorForm, email: e.target.value})} placeholder="doctor@meditaj.doc" required className="input-raw-premium" disabled={!!editingDoctor} />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="input-label-premium">Mobile Number</label>
 <div className="input-wrapper-premium group">
 <Phone className="input-icon-premium" size={14} />
 <input type="tel" value={doctorForm.phone} onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})} placeholder="+880" required className="input-raw-premium" />
 </div>
 </div>

 <CustomDropdown 
 label="Gender" 
 icon={UserCheck} 
 options={['Male', 'Female', 'Other']}
 value={doctorForm.gender} 
 onChange={val => setDoctorForm({...doctorForm, gender: val})} 
 placeholder="Select gender"
 />

 <DatePicker 
 label="Date of Birth"
 icon={Calendar}
 value={doctorForm.dob}
 onChange={val => setDoctorForm({...doctorForm, dob: val})}
 placeholder="Select DOB"
 />

 <div className="space-y-1.5">
 <label className="input-label-premium">National ID (NID)</label>
 <div className="input-wrapper-premium group">
 <FileText className="input-icon-premium" size={14} />
 <input type="text" value={doctorForm.nid} onChange={e => setDoctorForm({...doctorForm, nid: e.target.value})} placeholder="NID Number" className="input-raw-premium" />
 </div>
 </div>

 <CustomDropdown 
 label="Nationality" 
 icon={MapPin}
 searchable={true}
 options={['Bangladeshi', 'Indian', 'American', 'British', 'Canadian', 'Australian']}
 value={doctorForm.nationality} 
 onChange={val => setDoctorForm({...doctorForm, nationality: val})} 
 placeholder="Select nationality"
 />

 <div className="space-y-1.5">
 <label className="input-label-premium">City / Hub</label>
 <div className="input-wrapper-premium group">
 <MapPin className="input-icon-premium" size={14} />
 <input type="text" value={doctorForm.city} onChange={e => setDoctorForm({...doctorForm, city: e.target.value})} placeholder="Dhaka" className="input-raw-premium" />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="input-label-premium">Postal Code</label>
 <div className="input-wrapper-premium group">
 <MapPin className="input-icon-premium" size={14} />
 <input type="text" value={doctorForm.postalCode} onChange={e => setDoctorForm({...doctorForm, postalCode: e.target.value})} placeholder="1212" className="input-raw-premium" />
 </div>
 </div>

 <div className="space-y-1.5 text-black">
 <label className="input-label-premium">Detailed Residential Address</label>
 <div className="input-wrapper-premium group">
 <MapPin className="input-icon-premium" size={14} />
 <input type="text" value={doctorForm.address} onChange={e => setDoctorForm({...doctorForm, address: e.target.value})} placeholder="House, Road, Area details..." className="input-raw-premium" />
 </div>
 </div>
 </div>
 </section>

 <section className="space-y-4 pt-8 border-t border-slate-200">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-bold">02</div>
 <h2 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-[0.15em]">Qualifications</h2>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
 <div className="space-y-1.5">
 <label className="input-label-premium">BMDC Number</label>
 <div className="input-wrapper-premium group">
 <ShieldCheck className="input-icon-premium" size={14} />
 <input type="text" value={doctorForm.bmdcCode} onChange={e => setDoctorForm({...doctorForm, bmdcCode: e.target.value})} placeholder="A-123456" required className="input-raw-premium" />
 </div>
 </div>
 <DatePicker 
 label="BMDC Expiry Date"
 icon={Clock}
 value={doctorForm.bmdcExpiry}
 onChange={val => setDoctorForm({...doctorForm, bmdcExpiry: val})}
 placeholder="Select expiry"
 />
 <div className="space-y-1.5">
 <label className="input-label-premium">Years of Experience</label>
 <div className="input-wrapper-premium group">
 <Briefcase className="input-icon-premium" size={14} />
 <input type="number" value={doctorForm.experience} onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})} placeholder="Years" className="input-raw-premium" />
 </div>
 </div>
 <div className="lg:col-span-3 space-y-1.5">
 <label className="input-label-premium">Academic Degrees (Press Enter to add)</label>
 <div className="min-h-[2.5rem] p-2 bg-white border border-slate-300 rounded-xl">
 <div className="flex flex-wrap gap-2 mb-1">
 {doctorForm.degrees.map((deg, i) => (
 <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 flex items-center gap-2">
 {deg} 
 <X size={10} className="cursor-pointer" onClick={() => setDoctorForm({...doctorForm, degrees: doctorForm.degrees.filter(d => d !== deg)})} />
 </span>
 ))}
 <input 
 type="text" value={degreeInput} onChange={e => setDegreeInput(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter' && degreeInput.trim()) {
 e.preventDefault();
 if (!doctorForm.degrees.includes(degreeInput.trim())) setDoctorForm({...doctorForm, degrees: [...doctorForm.degrees, degreeInput.trim()]});
 setDegreeInput('');
 }
 }}
 placeholder="MBBS, FCPS..." 
 className="flex-grow bg-transparent outline-none text-[13px] font-medium px-2"
 />
 </div>
 </div>
 </div>
 <div className="lg:col-span-3 space-y-1.5">
 <label className="input-label-premium">Professional Bio</label>
 <textarea value={doctorForm.bio} onChange={e => setDoctorForm({...doctorForm, bio: e.target.value})} rows={3} placeholder="Tell us about your expertise..." className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-[13px] font-medium" />
 </div>
 </div>
 </section>

 <section className="space-y-4 pt-8 border-t border-slate-200">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-bold">03</div>
 <h2 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-[0.15em]">Specialty & Fee</h2>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
 <div className="space-y-1.5">
 <label className="input-label-premium">Specialty Selection</label>
 <div className="flex flex-wrap gap-2">{specialties.map(spec => (
 <button 
 key={spec.id} type="button" 
 onClick={() => {
 const next = doctorForm.specialties.includes(spec.name) ? doctorForm.specialties.filter(s => s !== spec.name) : [...doctorForm.specialties, spec.name];
 setDoctorForm({...doctorForm, specialties: next, services: []});
 }}
 className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${doctorForm.specialties.includes(spec.name) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-300 text-slate-400 hover:border-emerald-200'}`}
 >
 {spec.name}
 </button>
 ))}</div>
 </div>
 <div className="lg:col-span-2 space-y-1.5">
 <label className="input-label-premium">Assigned Services</label>
 <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 min-h-[120px]">
 {doctorForm.specialties.length === 0 ? <p className="text-[11px] text-slate-300 italic p-1">Select specialties first...</p> : doctorForm.specialties.map(specName => {
 const spec = specialties.find(s => s.name === specName);
 return (
 <div key={specName} className="space-y-2 mb-4">
 <div className="flex items-center gap-2">
 <div className="w-1 h-1 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{specName} Services</span>
 </div>
 <div className="flex flex-wrap gap-2">
 {spec?.services?.map(s => (
 <button 
 key={s.name} type="button" 
 onClick={() => {
 const next = doctorForm.services.includes(s.name) ? doctorForm.services.filter(srv => srv !== s.name) : [...doctorForm.services, s.name];
 setDoctorForm({...doctorForm, services: next});
 }}
 className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${doctorForm.services.includes(s.name) ? 'bg-slate-800 border-slate-800 text-white ' : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'}`}
 >
 {s.name}
 </button>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="input-label-premium">Consultation Fee (৳)</label>
 <div className="input-wrapper-premium px-3"><span className="text-emerald-500 font-bold mr-2">৳</span><input type="number" value={doctorForm.fee} onChange={e => setDoctorForm({...doctorForm, fee: e.target.value})} placeholder="1000" className="bg-transparent outline-none w-full text-[13px] font-medium" /></div>
 </div>
 <div className="space-y-1.5">
 <label className="input-label-premium">Follow-up Window (Days)</label>
 <div className="input-wrapper-premium"><input type="number" value={doctorForm.followUpDays} onChange={e => setDoctorForm({...doctorForm, followUpDays: e.target.value})} placeholder="7" className="input-raw-premium !pl-4" /></div>
 </div>
 <div className="space-y-1.5">
 <label className="input-label-premium">Follow-up Fee (৳)</label>
 <div className="input-wrapper-premium px-3"><span className="text-emerald-500 font-bold mr-2">৳</span><input type="number" value={doctorForm.followUpCost} onChange={e => setDoctorForm({...doctorForm, followUpCost: e.target.value})} placeholder="400" className="bg-transparent outline-none w-full text-[13px] font-medium" /></div>
 </div>
 </div>
 </section>

 <section className="space-y-4 pt-8 border-t border-slate-200">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-bold">04</div>
 <h2 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-[0.15em]">Payout Architecture</h2>
 </div>
 <div className="space-y-6">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { id: 'bank', name: 'Bank Account', icon: Landmark, color: 'text-blue-600' },
 { id: 'bkash', name: 'bKash', icon: CreditCard, color: 'text-pink-600' },
 { id: 'nagad', name: 'Nagad', icon: CreditCard, color: 'text-orange-600' },
 { id: 'rocket', name: 'Rocket', icon: CreditCard, color: 'text-purple-600' }
 ].map(p => (
 <button 
 key={p.id} type="button" 
 onClick={() => {
 const next = doctorForm.paymentMethods.includes(p.id) ? doctorForm.paymentMethods.filter(pm => pm !== p.id) : [...doctorForm.paymentMethods, p.id];
 setDoctorForm({...doctorForm, paymentMethods: next});
 }}
 className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${doctorForm.paymentMethods.includes(p.id) ? 'bg-white border-emerald-500 -50' : 'bg-white border-slate-300'}`}
 >
 <p.icon className={doctorForm.paymentMethods.includes(p.id) ? p.color : 'text-slate-200'} size={18} />
 <span className={`text-[10px] font-bold uppercase ${doctorForm.paymentMethods.includes(p.id) ? 'text-slate-700' : 'text-slate-300'}`}>{p.name}</span>
 </button>
 ))}
 </div>
 <AnimatePresence>
 {doctorForm.paymentMethods.includes('bank') && (
 <motion.div key="bank-info-panel" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-6 bg-slate-50/50 rounded-xl border border-slate-300 mt-2">
 <div className="space-y-1.5"><label className="input-label-premium">Bank Name</label><div className="input-wrapper-premium"><input type="text" value={doctorForm.bankName} onChange={e => setDoctorForm({...doctorForm, bankName: e.target.value})} placeholder="e.g. Dutch Bangla Bank" className="input-raw-premium !pl-4" /></div></div>
 <div className="space-y-1.5"><label className="input-label-premium">Account Number</label><div className="input-wrapper-premium"><input type="text" value={doctorForm.accountNumber} onChange={e => setDoctorForm({...doctorForm, accountNumber: e.target.value})} placeholder="XXXX-XXXX-XXXX" className="input-raw-premium !pl-4" /></div></div>
 </motion.div>
 )}
 {doctorForm.paymentMethods.some(pm => ['bkash', 'nagad', 'rocket'].includes(pm)) && (
 <motion.div key="mfs-info-panel" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="p-6 bg-emerald-50/30 rounded-xl border border-emerald-300 mt-2 max-w-sm">
 <div className="space-y-1.5"><label className="input-label-premium">MFS Account Number</label><div className="input-wrapper-premium"><input type="tel" value={doctorForm.mobilePaymentNo} onChange={e => setDoctorForm({...doctorForm, mobilePaymentNo: e.target.value})} placeholder="+880" className="input-raw-premium !pl-4" /></div></div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </section>

 </div>

 <div className="p-5 border-t border-slate-200 bg-white sticky bottom-0 z-20 flex flex-col items-center gap-4">
 <div className="flex gap-4 w-full max-w-md">
 <button type="button" onClick={() => setShowRegisterDoctor(false)} className="flex-1 h-10 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Discard</button>
 <button type="submit" disabled={isCreatingDoctor} className="flex-[2] h-10 bg-emerald-500 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50">
 {isCreatingDoctor ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={16} />}
 {isCreatingDoctor ? (editingDoctor ? 'Updating...' : 'Creating...') : (editingDoctor ? 'Synchronize Credentials' : 'Finalize Registration')}
 </button>
 </div>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {showAddStaff && (
 <div key="add-staff-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-[#1e4a3a]/40"
 onClick={() => setShowAddStaff(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-md bg-white rounded-xl overflow-hidden"
 >
 <div className="p-5 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
 <UserPlus size={14} />
 </div>
 <h3 className="text-[14px] font-bold text-med-text tracking-tight">Staff Registration</h3>
 </div>
 <button onClick={() => setShowAddStaff(false)} className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all border border-transparent hover:border-slate-300">
 <X size={16} />
 </button>
 </div>

 <form className="p-5 space-y-4" onSubmit={handleCreateStaff}>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5 col-span-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Identity Name</label>
 <input type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} placeholder="Full Name" required className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500/40 focus:bg-white text-[12px] font-medium transition-all" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Work Email</label>
 <input type="email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} placeholder="staff@meditaj.com" required className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500/40 focus:bg-white text-[12px] font-medium transition-all" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Phone Contact</label>
 <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} placeholder="+880 1---" required className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500/40 focus:bg-white text-[12px] font-medium transition-all" />
 </div>
 <div className="space-y-1.5 col-span-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Initial Password</label>
 <input type="password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} placeholder="••••••••" required className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500/40 focus:bg-white text-[12px] font-medium transition-all" />
 </div>
 </div>

 <div className="pt-2 flex justify-end gap-2 text-[11px] font-bold">
 <button type="button" onClick={() => setShowAddStaff(false)} className="h-9 px-4 border border-transparent rounded-lg text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
 <button type="submit" disabled={isCreatingStaff} className="h-9 px-5 bg-[#1e4a3a] border border-slate-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50">
 {isCreatingStaff ? <span className="animate-spin text-lg leading-none">↻</span> : <Check size={14} />}
 {isCreatingStaff ? 'Processing...' : 'Complete Registration'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {selectedPatient && (
 <div key="patient-detail-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => { setSelectedPatient(null); setIsEditingPatient(false); }} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden border border-slate-300"
 >
 {/* Header */}
 <div className="p-5 border-b border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[15px] border border-blue-100">
 {selectedPatient.fullName?.charAt(0) || 'P'}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-[14px] font-bold text-[#1e4a3a] tracking-tight leading-none">{selectedPatient.fullName || 'Anonymous Patient'}</h3>
 {selectedPatient.isVerified && <ShieldCheck size={14} className="text-blue-500" />}
 </div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patient ID: {selectedPatient.id.slice(0, 8).toUpperCase()}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setIsEditingPatient(!isEditingPatient)} 
 className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${isEditingPatient ? 'bg-amber-50 text-amber-600 border-amber-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200'}`}
 >
 <Edit3 size={16} />
 </button>
 <button onClick={() => { setSelectedPatient(null); setIsEditingPatient(false); }} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200">
 <X size={16} />
 </button>
 </div>
 </div>

 {/* Tabs */}
 {!isEditingPatient && (
 <div className="px-6 flex items-center gap-6 border-b border-slate-200 bg-slate-50/30">
 <button onClick={() => setProfileTab('history')} className={`py-3 text-[11px] font-bold uppercase tracking-widest relative ${profileTab === 'history' ? 'text-[#1e4a3a]' : 'text-slate-400 hover:text-slate-600'}`}>
 Appointment History
 {profileTab === 'history' && <motion.div layoutId="tab-p" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e4a3a]" />}
 </button>
 <button onClick={() => setProfileTab('files')} className={`py-3 text-[11px] font-bold uppercase tracking-widest relative ${profileTab === 'files' ? 'text-[#1e4a3a]' : 'text-slate-400 hover:text-slate-600'}`}>
 Medical Files
 {profileTab === 'files' && <motion.div layoutId="tab-p" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e4a3a]" />}
 </button>
 </div>
 )}

 {/* Content */}
 <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
 {isEditingPatient ? (
 <form onSubmit={handleUpdatePatient} className="space-y-4">
 <div className="flex justify-center pb-4">
 <div className="relative group">
 <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
 {patientForm.photoURL ? (
 <img 
 src={patientForm.photoURL} 
 alt="" 
 className="w-full h-full object-cover" 
 onError={(e) => e.currentTarget.style.display = 'none'}
 />
 ) : (
 <Activity size={24} className="text-slate-200" />
 )}
 </div>
 <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
 <Upload size={18} className="text-white" />
 <input 
 type="file" 
 className="hidden" 
 accept="image/*"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) {
 setPatientFile(file);
 setPatientForm({...patientForm, photoURL: URL.createObjectURL(file)});
 }
 }} 
 />
 </label>
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
 <input required type="text" value={patientForm.fullName} onChange={(e) => setPatientForm({...patientForm, fullName: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-med-primary/30 focus:bg-white transition-all" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
 <input required type="email" value={patientForm.email} onChange={(e) => setPatientForm({...patientForm, email: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
 <input type="tel" value={patientForm.phone} onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5 relative">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Blood Group</label>
 <button 
 type="button"
 onClick={() => setShowBloodDropdown(!showBloodDropdown)}
 className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 text-left flex items-center justify-between"
 >
 {patientForm.bloodGroup || 'Select Group'}
 <ChevronDown size={14} className={`transition-transform ${showBloodDropdown ? 'rotate-180' : ''}`} />
 </button>
 
 <AnimatePresence>
 {showBloodDropdown && (
 <motion.div 
 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
 className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg overflow-hidden max-h-40 overflow-y-auto custom-scrollbar"
 >
 {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
 <button 
 key={bg} type="button" 
 onClick={() => { setPatientForm({...patientForm, bloodGroup: bg}); setShowBloodDropdown(false); }}
 className="w-full px-4 py-2.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 text-left transition-colors border-b border-slate-200 last:border-0"
 >
 {bg}
 </button>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 <div className="flex items-center gap-3 pt-6 pl-2">
 <button 
 type="button" 
 onClick={() => {
 const isCurrentActive = patientForm.status === 'active' || patientForm.status === 'approved';
 setPatientForm({...patientForm, status: isCurrentActive ? 'inactive' : 'active'});
 }} 
 className={`w-10 h-5 rounded-full transition-all relative ${(patientForm.status === 'active' || patientForm.status === 'approved') ? 'bg-emerald-500' : 'bg-slate-200'}`}
 >
 <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${(patientForm.status === 'active' || patientForm.status === 'approved') ? 'left-6' : 'left-1'}`} />
 </button>
 <div className="flex flex-col">
 <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">Profile Status</span>
 <span className={`text-[9px] font-bold uppercase tracking-widest ${(patientForm.status === 'active' || patientForm.status === 'approved') ? 'text-emerald-500' : 'text-slate-400'}`}>
 {(patientForm.status === 'active' || patientForm.status === 'approved') ? 'Active' : 'Deactivated'}
 </span>
 </div>
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Residential Address</label>
 <textarea value={patientForm.address} onChange={(e) => setPatientForm({...patientForm, address: e.target.value})} className="w-full h-20 bg-slate-50 border border-slate-300 rounded-lg p-4 text-[13px] font-bold text-slate-700 outline-none resize-none focus:bg-white transition-all" placeholder="Home address details..." />
 </div>
 <div className="pt-2 flex gap-3">
 <button type="button" onClick={() => setIsEditingPatient(false)} className="flex-1 h-10 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-50 uppercase tracking-widest">Cancel</button>
 <button type="submit" disabled={isSaving} className="flex-1 h-10 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold hover:bg-black transition-all uppercase tracking-widest">
 {isSaving ? 'Updating...' : 'Save Changes'}
 </button>
 </div>
 </form>
 ) : (
 <>
 {profileTab === 'history' ? (
 <div className="space-y-6">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Email Address</label>
 <div className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
 <Mail size={12} className="text-slate-300" />
 <span className="text-[12px] font-bold text-slate-700 truncate">{selectedPatient.email}</span>
 </div>
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Phone Number</label>
 <div className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
 <Phone size={12} className="text-slate-300" />
 <span className="text-[12px] font-bold text-slate-700">{selectedPatient.phone || '--'}</span>
 </div>
 </div>
 </div>

 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Appointments</h4>
 <span className="text-[10px] font-bold text-med-primary px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">{patientAppointments.length} Found</span>
 </div>
 
 <div className="space-y-2">
 {patientAppointments.length > 0 ? (
 patientAppointments.map((appt, idx) => (
 <div key={idx} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-white hover:border-slate-300 transition-all">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
 <Calendar size={14} />
 </div>
 <div>
 <span className="text-[12px] font-bold text-slate-800 block leading-tight">{appt.specialty}</span>
 <span className="text-[10px] font-bold text-slate-400">Dr. {appt.doctorName || 'Assigned'}</span>
 </div>
 </div>
 <div className="text-right">
 <span className="text-[11px] font-bold text-slate-700 block">{appt.date}</span>
 <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
 {appt.status || 'Active'}
 </span>
 </div>
 </div>
 ))
 ) : (
 <div className="p-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
 <UserCircle size={24} className="text-slate-200 mb-2" />
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">No appointments recorded</p>
 </div>
 )}
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medical Documents</h4>
 <label className="h-8 px-3 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-black transition-all cursor-pointer">
 {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
 {isUploading ? 'Archiving...' : 'Add New File'}
 <input type="file" className="hidden" disabled={isUploading} onChange={handleUploadFile} />
 </label>
 </div>
 
 {isFilesLoading ? (
 <div className="p-10 flex flex-col items-center justify-center">
 <Loader2 size={24} className="animate-spin text-med-primary mb-2" />
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Files...</span>
 </div>
 ) : patientFiles.length > 0 ? (
 <div className="grid grid-cols-2 gap-3">
 {patientFiles.map((file, fIdx) => (
 <div key={fIdx} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-200 transition-all cursor-pointer group">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
 <FileText size={14} />
 </div>
 <div className="flex-1 truncate">
 <span className="text-[12px] font-bold text-slate-800 block truncate leading-tight">{file.fileName}</span>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{file.type || 'Document'}</span>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
 <span className="text-[10px] font-bold text-slate-300">{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</span>
 <div className="flex items-center gap-2">
 <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Download</a>
 <button 
 onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
 className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
 <FolderOpen size={24} className="text-slate-200 mb-2" />
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">No documents uploaded yet</p>
 </div>
 )}
 </div>
 )}
 </>
 )}
 </div>

 {/* Footer - Only show when not editing */}
 {!isEditingPatient && (
 <div className="p-6 pt-2 flex gap-3 border-t border-slate-200 bg-slate-50/20">
 <button 
 onClick={() => {
 confirm({
 title: 'Initiate Secure Terminal',
 message: `You are about to open a private communication channel with ${selectedPatient.fullName}. Messages are encrypted and stored in patient logs.`,
 icon: 'ShieldCheck',
 confirmText: 'Establish Connection',
 confirmColor: 'bg-[#1e4a3a]'
 });
 }}
 className="flex-1 h-10 bg-slate-100 text-[#1e4a3a] border border-slate-300 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
 >
 <MessageSquare size={14} className="text-slate-400" />
 Secure Message
 </button>
 <button 
 onClick={() => setProfileTab('files')}
 className="flex-1 h-10 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold hover:bg-black transition-all uppercase tracking-widest flex items-center justify-center gap-2"
 >
 <FolderOpen size={14} className="text-slate-400" />
 Audit Files
 </button>
 </div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {showPaymentModal && (
 <div key="payment-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowPaymentModal(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden"
 >
 <div className="p-6 border-b border-slate-200 flex items-center justify-between">
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight uppercase">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h3>
 <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
 </div>

 <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
 {/* 01. Agent Selection */}
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-bold">01</div>
 <h4 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">Choose Agent</h4>
 </div>

 <div className="grid grid-cols-4 gap-3">
 {['bkash', 'nagad', 'rocket', 'bank'].map(p => (
 <button 
 key={p} type="button" 
 onClick={() => setPaymentForm({...paymentForm, provider: p, type: p === 'bank' ? 'transfer' : 'personal'})}
 className={`h-16 rounded-lg border transition-all flex flex-col items-center justify-center gap-1.5 p-2 ${paymentForm.provider === p ? 'border-emerald-500 bg-emerald-50 ' : 'border-slate-200 bg-slate-50 hover:border-slate-300 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}
 >
 <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
 {p === 'bkash' && <Smartphone size={24} className={paymentForm.provider === p ? 'text-[#E2136E]' : 'text-slate-400'} />}
 {p === 'nagad' && <Wallet size={24} className={paymentForm.provider === p ? 'text-[#F7941D]' : 'text-slate-400'} />}
 {p === 'rocket' && <Zap size={24} className={paymentForm.provider === p ? 'text-[#8B318F]' : 'text-slate-400'} />}
 {p === 'bank' && <Building2 size={24} className={paymentForm.provider === p ? 'text-blue-500' : 'text-slate-400'} />}
 </div>
 <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${paymentForm.provider === p ? 'text-emerald-600' : 'text-slate-400'}`}>{p}</span>
 </button>
 ))}
 </div>

 {paymentForm.provider !== 'bank' && (
 <div className="bg-slate-50 p-1 rounded-lg border border-slate-300 flex gap-1">
 {['personal', 'agent', 'merchant'].map(t => (
 <button 
 key={t} type="button" 
 onClick={() => setPaymentForm({...paymentForm, type: t})}
 className={`flex-1 py-1.5 rounded-md transition-all text-[9px] font-bold uppercase tracking-widest text-center ${paymentForm.type === t ? 'bg-white text-[#1e4a3a] border border-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
 >
 {t}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* 02. Configuration Details */}
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-bold">02</div>
 <h4 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">Account Details</h4>
 </div>

 <div className="space-y-4">
 {paymentForm.provider === 'bank' ? (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Bank Institution</label>
 <input type="text" value={paymentForm.bankName} onChange={e => setPaymentForm({...paymentForm, bankName: e.target.value})} placeholder="e.g. DBBL" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Account Holder</label>
 <input type="text" value={paymentForm.accountName} onChange={e => setPaymentForm({...paymentForm, accountName: e.target.value})} placeholder="Clinic Name" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 </div>
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
 <input type="text" value={paymentForm.accountNumber} onChange={e => setPaymentForm({...paymentForm, accountNumber: e.target.value})} placeholder="0000 0000 0000" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[14px] font-mono font-bold text-[#1e4a3a] outline-none focus:border-black transition-all" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
 <input type="text" value={paymentForm.branchName} onChange={e => setPaymentForm({...paymentForm, branchName: e.target.value})} placeholder="Gulshan-1" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Routing Code</label>
 <input type="text" value={paymentForm.routingNumber} onChange={e => setPaymentForm({...paymentForm, routingNumber: e.target.value})} placeholder="012345..." className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Wallet Number</label>
 <input type="text" value={paymentForm.accountNumber} onChange={e => setPaymentForm({...paymentForm, accountNumber: e.target.value})} placeholder="01XXX-XXXXXX" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>

 {(paymentForm.type === 'merchant' || paymentForm.type === 'agent') && (
 <div className="space-y-4 pt-4 border-t border-slate-200">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Store / Shop Name</label>
 <input type="text" value={paymentForm.shopName} onChange={e => setPaymentForm({...paymentForm, shopName: e.target.value})} placeholder="Clinic Identity" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>

 {paymentForm.type === 'merchant' && (
 <div className="space-y-4">
 <div className="bg-slate-50 p-1 rounded-lg border border-slate-300 flex gap-1">
 {['manual', 'digital'].map(m => (
 <button 
 key={m} type="button" 
 onClick={() => setPaymentForm({...paymentForm, gatewayMode: m})} 
 className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${paymentForm.gatewayMode === m ? 'bg-black text-white ' : 'text-slate-400 hover:text-slate-600'}`}
 >
 {m === 'manual' ? 'Manual Link' : 'Digital Gateway'}
 </button>
 ))}
 </div>

 {paymentForm.gatewayMode === 'manual' ? (
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Counter Number</label>
 <input type="text" value={paymentForm.counterNumber} onChange={e => setPaymentForm({...paymentForm, counterNumber: e.target.value})} placeholder="1" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">API Key</label>
 <input type="password" value={paymentForm.apiKey} onChange={e => setPaymentForm({...paymentForm, apiKey: e.target.value})} placeholder="••••••••" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">API Secret</label>
 <input type="password" value={paymentForm.apiSecret} onChange={e => setPaymentForm({...paymentForm, apiSecret: e.target.value})} placeholder="••••••••" className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 )}

 <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
 <Activity size={16} className="text-emerald-500 shrink-0" />
 <div className="flex-1">
 <p className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-tight">Live Status</p>
 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enable for payments</p>
 </div>
 <div 
 onClick={() => setPaymentForm({...paymentForm, status: paymentForm.status === 'active' ? 'inactive' : 'active'})}
 className={`relative w-10 h-5 rounded-full cursor-pointer transition-all duration-300 ${paymentForm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
 >
 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${paymentForm.status === 'active' ? 'left-5.5' : 'left-0.5'}`} />
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-6 border-t border-slate-200 bg-slate-50/30 flex gap-4">
 <button onClick={() => setShowPaymentModal(false)} className="flex-1 h-11 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
 <button 
 onClick={async () => {
 setIsUpdatingSettings(true);
 try {
 if (editingPayment) {
 await updateDoc(doc(db, 'payment_methods', editingPayment), paymentForm);
 } else {
 await addDoc(collection(db, 'payment_methods'), paymentForm);
 }
 toast.success('Gateway Synchronized');
 setShowPaymentModal(false);
 } catch (e) { toast.error('Connection failed'); }
 setIsUpdatingSettings(false);
 }}
 disabled={isUpdatingSettings}
 className="flex-[1.5] h-11 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
 >
 {isUpdatingSettings ? 'Saving...' : (editingPayment ? 'Push Updates' : 'Add Gateway')}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 

 <style jsx global>{`
 .input-label-premium {
 display: block;
 font-size: 10px;
 font-weight: 700;
 color: #64748b;
 text-transform: uppercase;
 letter-spacing: 0.1em;
 margin-bottom: 0.4rem;
 margin-left: 0.1rem;
 }
 .input-wrapper-premium {
 position: relative;
 display: flex;
 align-items: center;
 width: 100%;
 height: 2.35rem; /* ~38px like h-9 */
 background-color: #f8fafc; /* bg-slate-50 */
 border: 1px solid #e2e8f0; /* border-slate-300 */
 border-radius: 0.5rem;
 transition: all 0.2s ease;
 }
 .input-wrapper-premium.group:focus-within {
 background-color: white;
 border-color: rgba(16, 185, 129, 0.4);
 box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.05);
 }
 .input-icon-premium { color: #94a3b8; margin-left: 0.75rem; }
 .input-wrapper-premium.group:focus-within .input-icon-premium { color: #10b981; }
 .input-raw-premium {
 width: 100%; height: 100%; padding-left: 0.75rem; padding-right: 0.75rem;
 background: transparent; border: none; outline: none;
 font-size: 12px; font-weight: 500; color: #334155;
 }
 .input-raw-premium::placeholder { color: #94a3b8; }
 input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.3; cursor: pointer; }
 .custom-scrollbar::-webkit-scrollbar { width: 5px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
 `}</style>
 <AnimatePresence>
 {showCouponModal && (
 <div key="coupon-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowCouponModal(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="relative w-full max-w-md bg-white rounded-xl overflow-hidden border border-slate-300"
 >
 <div className="p-6 border-b border-slate-200 flex items-center justify-between">
 <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight uppercase">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
 <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
 </div>

 <form onSubmit={async (e) => {
 e.preventDefault();
 setIsSavingCoupon(true);
 try {
 const data = { ...couponForm, updatedAt: new Date().toISOString() };
 if (editingCoupon) {
 await updateDoc(doc(db, 'coupons', editingCoupon), data);
 toast.success('Coupon updated');
 } else {
 await setDoc(doc(collection(db, 'coupons')), { ...data, createdAt: new Date().toISOString() });
 toast.success('Coupon created');
 }
 setShowCouponModal(false);
 } catch (e) { toast.error('Check fields or connection'); }
 setIsSavingCoupon(false);
 }} className="p-6 space-y-6">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
 <input required type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="SAVE20" className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[14px] font-black tracking-widest text-[#1e4a3a] outline-none focus:border-black transition-all" />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
 <div className="bg-slate-50 p-1 rounded-lg border border-slate-300 flex gap-1 h-11">
 {['percentage', 'fixed'].map(t => (
 <button 
 key={t} type="button" 
 onClick={() => setCouponForm({...couponForm, type: t})}
 className={`flex-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${couponForm.type === t ? 'bg-white text-[#1e4a3a] border border-slate-300' : 'text-slate-400'}`}
 >
 {t === 'percentage' ? '%' : 'FIXED'}
 </button>
 ))}
 </div>
 </div>
 <div className="space-y-1.5 font-bold">
 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">{couponForm.type === 'percentage' ? 'Value (%)' : 'Amount (৳)'}</label>
 <input required type="number" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: e.target.value})} placeholder={couponForm.type === 'percentage' ? '10' : '50'} className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
 </div>
 </div>

 <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
 <Activity size={16} className="text-emerald-500 shrink-0" />
 <div className="flex-1">
 <p className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-tight">Active Status</p>
 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enable this coupon for users</p>
 </div>
 <button 
 type="button"
 onClick={() => setCouponForm({...couponForm, status: couponForm.status === 'active' ? 'inactive' : 'active'})}
 className={`relative w-10 h-5 rounded-full cursor-pointer transition-all duration-300 ${couponForm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
 >
 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${couponForm.status === 'active' ? 'left-5.5' : 'left-0.5'}`} />
 </button>
 </div>

 <div className="pt-4 flex gap-4 border-t border-slate-200">
 <button type="button" onClick={() => setShowCouponModal(false)} className="flex-1 h-11 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
 <button 
 type="submit" disabled={isSavingCoupon}
 className="flex-1 h-11 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50"
 >
 {isSavingCoupon ? 'Preparing...' : 'Save Coupon'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
  {showAddCaregiver && (
  <div key="add-caregiver-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-4">
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddCaregiver(false)} />
  <motion.div 
  initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
  className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden border border-slate-300"
  >
  <div className="p-6 border-b border-slate-200 flex items-center justify-between">
  <h3 className="text-[16px] font-bold text-[#1e4a3a] tracking-tight uppercase">{editingCaregiver ? 'Update Specialist' : 'Register Specialist'}</h3>
  <button onClick={() => setShowAddCaregiver(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
  </div>

  <form onSubmit={handleSaveCaregiver}>
    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center gap-4 mb-2">
        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
          {caregiverForm.photoURL ? (
            <img src={caregiverForm.photoURL} className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="text-slate-200" size={40} />
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                const url = await uploadFile(file, `nursing/specialists/${Date.now()}_${file.name}`);
                if (url) setCaregiverForm({ ...caregiverForm, photoURL: url });
              }
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[9px] font-bold uppercase tracking-widest">
             {isUploading ? 'Uploading...' : 'Change Photo'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 font-bold col-span-2">
          <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Specialist Name</label>
          <input required type="text" value={caregiverForm.name} onChange={e => setCaregiverForm({...caregiverForm, name: e.target.value})} placeholder="e.g. Sarah Johnson" className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
        </div>

        <div className="space-y-1.5 font-bold">
          <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
          <input required type="email" value={caregiverForm.email} onChange={e => setCaregiverForm({...caregiverForm, email: e.target.value})} placeholder="care@meditaj.com" className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
        </div>

        <div className="space-y-1.5 font-bold">
          <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
          <input required type="tel" value={caregiverForm.phone} onChange={e => setCaregiverForm({...caregiverForm, phone: e.target.value})} placeholder="+880 1XXX..." className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
        </div>

        <div className="space-y-1.5 font-bold">
          <CustomDropdown 
            label="Primary Specialty" 
            icon={Activity} 
            options={nursingTypes.map(t => t.label)}
            value={caregiverForm.specialty} 
            onChange={val => setCaregiverForm({...caregiverForm, specialty: val})} 
            placeholder="Select Specialty"
          />
        </div>

        <div className="space-y-1.5 font-bold">
          <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Experience (Years)</label>
          <input required type="number" value={caregiverForm.experience} onChange={e => setCaregiverForm({...caregiverForm, experience: e.target.value})} placeholder="5" className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1 font-bold">Offered Packages</label>
          {nursingPackages.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1">No packages configured yet. Add packages in the Config tab first.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {nursingPackages.map(pkg => {
                const isSelected = (caregiverForm.packages || []).includes(pkg.id);
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      const current = caregiverForm.packages || [];
                      const updated = isSelected
                        ? current.filter(id => id !== pkg.id)
                        : [...current, pkg.id];
                      setCaregiverForm({ ...caregiverForm, packages: updated });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#1e4a3a] border-[#1e4a3a] text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-[12px] font-bold">{pkg.label} <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{pkg.duration}</span></span>
                    <span className={`text-[12px] font-black ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}>৳{pkg.price}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-1.5 font-bold">
          <CustomDropdown 
            label="Presence Status" 
            icon={UserCheck} 
            options={['active', 'inactive']}
            value={caregiverForm.status} 
            onChange={val => setCaregiverForm({...caregiverForm, status: val})} 
            placeholder="Select Status"
          />
        </div>
      </div>

      <div className="space-y-1.5 font-bold">
        <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Short Bio / Credentials</label>
        <textarea value={caregiverForm.bio} onChange={e => setCaregiverForm({...caregiverForm, bio: e.target.value})} placeholder="Describe expertise and certifications..." className="w-full h-24 bg-slate-50 border border-slate-300 rounded-xl p-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all resize-none" />
      </div>
    </div>

    <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex gap-4">
      <button type="button" onClick={() => setShowAddCaregiver(false)} className="flex-1 h-11 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
      <button 
        type="submit" disabled={isSaving}
        className="flex-1 h-11 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50"
      >
        {isSaving ? 'Processing...' : (editingCaregiver ? 'Update Profile' : 'Register Profile')}
      </button>
    </div>
  </form>
  </motion.div>
  </div>
  )}
  </AnimatePresence>

  <AnimatePresence>
  {showAddNursingPackage && (
  <div key="add-np-modal" className="fixed inset-0 z-[130] flex items-center justify-center p-4">
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddNursingPackage(false)} />
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden p-6 space-y-6 border border-slate-300">
    <h3 className="text-[12px] font-black uppercase tracking-widest text-[#1e4a3a]">New Pricing Package</h3>
    <form onSubmit={handleSaveNursingPackage} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Label</label>
        <input required value={nursingPackageForm.label} onChange={e => setNursingPackageForm({...nursingPackageForm, label: e.target.value})} placeholder="e.g. Monthly" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[13px] font-bold" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Duration Hint</label>
        <input required value={nursingPackageForm.duration} onChange={e => setNursingPackageForm({...nursingPackageForm, duration: e.target.value})} placeholder="e.g. (12 Hours)" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[13px] font-bold" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Price (৳)</label>
        <input required type="number" value={nursingPackageForm.price} onChange={e => setNursingPackageForm({...nursingPackageForm, price: e.target.value})} placeholder="30000" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[13px] font-bold" />
      </div>
      <div className="pt-4 flex gap-3">
        <button type="button" onClick={() => setShowAddNursingPackage(false)} className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 h-10 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Save Basis</button>
      </div>
    </form>
  </motion.div>
  </div>
  )}
  </AnimatePresence>

  <AnimatePresence>
  {showAddNursingType && (
  <div key="add-nt-modal" className="fixed inset-0 z-[130] flex items-center justify-center p-4">
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddNursingType(false)} />
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden p-6 space-y-6 border border-slate-300">
    <h3 className="text-[12px] font-black uppercase tracking-widest text-[#1e4a3a]">New Specialist Type</h3>
    <form onSubmit={handleSaveNursingType} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Label</label>
        <input required value={nursingTypeForm.label} onChange={e => setNursingTypeForm({...nursingTypeForm, label: e.target.value})} placeholder="e.g. Physiotherapist" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[13px] font-bold outline-none focus:border-black transition-all" />
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category Banner</label>
        <div className="relative h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all hover:border-slate-400">
           {nursingTypeForm.image ? (
             <>
               <img src={nursingTypeForm.image} className="w-full h-full object-cover" />
               <button type="button" onClick={() => setNursingTypeForm({...nursingTypeForm, image: ''})} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-rose-500 shadow-sm"><X size={14}/></button>
             </>
           ) : (
             <>
               <div className="p-3 bg-white rounded-full shadow-sm text-slate-300 mb-2"><ImagePlus size={20} /></div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Service Image</p>
             </>
           )}
           <input 
             type="file" 
             accept="image/*" 
             className="absolute inset-0 opacity-0 cursor-pointer" 
             onChange={async (e) => {
               const file = e.target.files[0];
               if (file) {
                 const url = await uploadFile(file, `nursing/categories/${Date.now()}_${file.name}`);
                 if (url) setNursingTypeForm({ ...nursingTypeForm, image: url });
               }
             }}
           />
           {isUploading && (
             <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#1e4a3a]" />
             </div>
           )}
        </div>
      </div>
      <div className="pt-4 flex gap-3">
        <button type="button" onClick={() => setShowAddNursingType(false)} className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 h-10 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Add Category</button>
      </div>
    </form>
  </motion.div>
  </div>
  )}
   </AnimatePresence>

   {/* --- AMBULANCE FLEET MODAL --- */}
   <AnimatePresence>
    {showAddAmbulance && (
      <div key="add-ambulance-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddAmbulance(false)} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
        >
          <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-xl">
            <div>
              <h3 className="text-[16px] font-black text-[#1e4a3a] tracking-tight uppercase">{editingAmbulance ? 'Update Unit Registry' : 'New Ambulance Registry'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Provide full clinical & logistics documentation</p>
            </div>
            <button onClick={() => setShowAddAmbulance(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
          </div>

          <form onSubmit={handleSaveAmbulance} className="p-8 space-y-8 text-left">
            {/* Section 1: Vehicle Logistics */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-black">01</div>
                  <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest border-b border-[#1e4a3a]/10 pb-1 flex-grow">Vehicle Logistics</h4>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Plate Number / Registration</label>
                   <input required type="text" value={ambulanceForm.plateNumber} onChange={e => setAmbulanceForm({...ambulanceForm, plateNumber: e.target.value})} placeholder="DHK-METRO-KA-11-2222" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-black tracking-widest text-[#1e4a3a] outline-none focus:border-black transition-all" />
                 </div>
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Vehicle License No.</label>
                   <input required type="text" value={ambulanceForm.licenseNo} onChange={e => setAmbulanceForm({...ambulanceForm, licenseNo: e.target.value})} placeholder="BL-XXXXXXXXX" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Vehicle Category</label>
                   <CustomDropdown 
                     options={['AC', 'Non-AC', 'ICU', 'Freezer']}
                     value={ambulanceForm.type}
                     onChange={val => setAmbulanceForm({...ambulanceForm, type: val})}
                   />
                 </div>
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Fleet Status</label>
                   <CustomDropdown 
                     options={['available', 'on-trip', 'maintenance']}
                     value={ambulanceForm.status}
                     onChange={val => setAmbulanceForm({...ambulanceForm, status: val})}
                   />
                 </div>
               </div>
            </div>

            {/* Section 2: Driver Identity */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-black">02</div>
                  <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest border-b border-[#1e4a3a]/10 pb-1 flex-grow">Personnel Registry</h4>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Lead Driver Name</label>
                   <input required type="text" value={ambulanceForm.driverName} onChange={e => setAmbulanceForm({...ambulanceForm, driverName: e.target.value})} placeholder="Full Legal Name" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
                 </div>
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Verified Contact Mobile</label>
                   <input required type="tel" value={ambulanceForm.driverPhone} onChange={e => setAmbulanceForm({...ambulanceForm, driverPhone: e.target.value})} placeholder="+880 17..." className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
                 </div>
               </div>

               <div className="space-y-1.5 font-bold">
                 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Driver National ID (NID)</label>
                 <input required type="text" value={ambulanceForm.driverNID} onChange={e => setAmbulanceForm({...ambulanceForm, driverNID: e.target.value})} placeholder="10 or 17 digit NID number" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
               </div>
            </div>

            {/* Section 3: Operating Hub */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] flex items-center justify-center text-white text-[10px] font-black">03</div>
                  <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest border-b border-[#1e4a3a]/10 pb-1 flex-grow">Operating Territory</h4>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Metropolitan Hub (City)</label>
                   <input required type="text" value={ambulanceForm.city} onChange={e => setAmbulanceForm({...ambulanceForm, city: e.target.value})} placeholder="e.g. Dhaka" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
                 </div>
                 <div className="space-y-1.5 font-bold">
                   <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Base Standing Station</label>
                   <input required type="text" value={ambulanceForm.baseLocation} onChange={e => setAmbulanceForm({...ambulanceForm, baseLocation: e.target.value})} placeholder="Clinic or Hospital Base" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
                 </div>
               </div>

               <div className="space-y-1.5 font-bold">
                 <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Coverage Areas (Service Perimeter)</label>
                 <input required type="text" value={ambulanceForm.coveredAreas} onChange={e => setAmbulanceForm({...ambulanceForm, coveredAreas: e.target.value})} placeholder="e.g. Dhanmondi, Gulshan, Banani" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-black transition-all" />
               </div>
            </div>

            <div className="space-y-1.5 font-bold pb-10">
              <label className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Equipment & Technical Specs</label>
              <textarea 
                value={ambulanceForm.description} 
                onChange={e => setAmbulanceForm({...ambulanceForm, description: e.target.value})} 
                placeholder="Mention ICU equipment, oxygen capacity, or custom modifications..." 
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-bold text-slate-700 outline-none focus:border-black transition-all resize-none" 
              />
            </div>

            <div className="sticky bottom-0 bg-white p-8 pt-6 border-t border-slate-100 flex gap-4 flex-col md:flex-row z-10 -mx-8 -mb-8 rounded-b-xl">
              <button type="button" onClick={() => setShowAddAmbulance(false)} className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Discard & Close</button>
              <button 
                type="submit" disabled={isSaving}
                className="flex-grow h-11 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-[#1e4a3a]/10"
              >
                {isSaving ? 'Processing...' : (editingAmbulance ? 'Update Unit Info' : 'Confirm Fleet Entry')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
   </AnimatePresence>

   {/* --- ASSIGN AMBULANCE MODAL --- */}
   <AnimatePresence>
     {showAssignModal && (
       <div key="assign-ambulance-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-4 text-left">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAssignModal(false)} />
         <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
           className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden border border-slate-300"
         >
           <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-black text-[#1e4a3a] tracking-tight uppercase">Dispatch Ambulance</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Patient: {selectedBookingForAssignment?.patientName}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-[#1e4a3a]"><X size={20} /></button>
           </div>

           <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-500 border border-blue-100 shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#1e4a3a]">{selectedBookingForAssignment?.pickupAddress}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Requested: {selectedBookingForAssignment?.category}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Available Fleet Units</h4>
                <div className="grid gap-2">
                  {ambulanceFleet.filter(a => a.status === 'available').length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-xl text-center">
                      <AlertCircle size={32} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No units available right now</p>
                    </div>
                  ) : (
                    ambulanceFleet.filter(a => a.status === 'available').map(unit => (
                      <button 
                        key={unit.id}
                        onClick={() => handleCompleteAssignment(unit)}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-[#1e4a3a] transition-all flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#1e4a3a] group-hover:text-white transition-all">
                              <Ambulance size={20} />
                           </div>
                           <div>
                              <p className="text-[13px] font-black text-[#1e4a3a] uppercase">{unit.plateNumber}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{unit.driverName} • {unit.type}</p>
                           </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-[#1e4a3a] group-hover:translate-x-1 transition-all" />
                      </button>
                    ))
                  )}
                </div>
              </div>
           </div>

           <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[11px]">
              <p className="text-slate-400 font-bold uppercase tracking-widest italic">Manual dispatch required</p>
              <button onClick={() => setShowAssignModal(false)} className="font-black text-[#1e4a3a] uppercase tracking-widest hover:opacity-70">Close</button>
           </div>
         </motion.div>
       </div>
     )}
   </AnimatePresence>
  </div>
  </DashboardLayout>
  );
}

export default function AdminDashboard() {
 return (
 <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center">Loading Console...</div>}>
 <AdminDashboardContent />
 </Suspense>
 );
}



