'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Building2, Search, Filter, ShoppingCart, 
  ChevronRight, Info, CheckCircle2, ArrowRight,
  ShieldCheck, Clock, CreditCard, X, Beaker, Calendar
} from 'lucide-react';
import CustomDropdown from '@/components/UI/CustomDropdown';
import DatePicker from '@/components/UI/DatePicker';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { bdLocations, getDivisions, getDistricts, getAreas } from '@/lib/locationData';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LabTestCard from '@/components/Labs/LabTestCard';
import { toast } from 'react-hot-toast';

export default function LabTestsPage() {
  const { user, profile } = useAuth();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const router = useRouter();
  
  // Filter States
  const [selectedDiv, setSelectedDiv] = useState(null);
  const [selectedDist, setSelectedDist] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  // Data States
  const [providers, setProviders] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // 1. Fetch Providers when Area changes
  useEffect(() => {
    if (!selectedArea) {
      setProviders([]);
      setSelectedProvider(null);
      return;
    }

    setLoading(true);
    if (!db) return;
    const q = query(
      collection(db, 'lab_providers'), 
      where('division', '==', selectedDiv),
      where('district', '==', selectedDist),
      where('area', '==', selectedArea),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProviders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedArea, selectedDiv, selectedDist]);

  // 2. Fetch Tests when Provider changes
  useEffect(() => {
    if (!selectedProvider) {
      setTests([]);
      return;
    }

    setLoading(true);
    if (!db) return;
    const q = query(
      collection(db, 'lab_tests'),
      where('providerId', '==', selectedProvider.id),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProvider]);

  // 3. Fetch Payment Methods
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
      setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.status === 'active'));
    });
    return () => unsubscribe();
  }, []);

  const handleAddToCart = (test) => {
    addToCart({
      id: test.id,
      name: test.name,
      price: test.price,
      type: 'lab',
      category: test.category,
      providerId: selectedProvider.id,
      providerName: selectedProvider.name
    });
  };

  const handleCheckoutRedirect = () => {
    router.push('/cart');
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD]">

      <div className="pt-28 lg:pt-36 pb-24 w-full max-w-[1825px] mx-auto px-4 lg:px-10">
        
        {/* --- HIERARCHICAL FILTERS --- */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 mb-10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={18} className="text-emerald-500" />
            <h2 className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Select Location & Provider</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CustomDropdown
              label="Division"
              placeholder="Select Division"
              options={getDivisions()}
              value={selectedDiv}
              onChange={(val) => {
                setSelectedDiv(val);
                setSelectedDist(null);
                setSelectedArea(null);
                setSelectedProvider(null);
              }}
              searchable
            />
            <CustomDropdown
              label="District"
              placeholder="Select District"
              options={getDistricts(selectedDiv)}
              value={selectedDist}
              onChange={(val) => {
                setSelectedDist(val);
                setSelectedArea(null);
                setSelectedProvider(null);
              }}
              searchable
              disabled={!selectedDiv}
            />
            <CustomDropdown
              label="Area"
              placeholder="Select Area"
              options={getAreas(selectedDiv, selectedDist)}
              value={selectedArea}
              onChange={(val) => {
                setSelectedArea(val);
                setSelectedProvider(null);
              }}
              searchable
              disabled={!selectedDist}
            />
            <CustomDropdown
              label="Lab Provider"
              placeholder="Select Lab Provider"
              options={providers.map(p => ({ label: p.name, value: p }))}
              value={selectedProvider}
              onChange={(val) => setSelectedProvider(val)}
              searchable
              disabled={!selectedArea || providers.length === 0}
            />
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          {!selectedProvider ? (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-8 text-slate-100">
                <Building2 size={120} strokeWidth={0.5} />
                <MapPin size={40} strokeWidth={2} className="absolute bottom-4 right-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1e4a3a] mb-2">Ready to find your tests?</h3>
              <p className="text-slate-400 font-medium text-[14px] max-w-sm mx-auto uppercase tracking-wide">
                Select a location and provider to view available tests.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="tests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Provider Info Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-300 pb-6">
                <div>
                  <h1 className="text-xl font-black text-[#1e4a3a] uppercase tracking-wide mb-0.5">{selectedProvider.name}</h1>
                  <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium">
                    <MapPin size={14} className="text-emerald-500" />
                    <span>{selectedProvider.area}, {selectedProvider.district}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">
                    <Beaker size={14} className="text-emerald-500" />
                    <span>{tests.length} Tests Available</span>
                  </div>
                </div>
              </div>

              {/* Tests Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {tests.map(test => (
                  <LabTestCard 
                    key={test.id} 
                    test={test} 
                    onAddToCart={handleAddToCart}
                    isInCart={!!cartItems.find(c => c.id === test.id)}
                  />
                ))}
              </div>

              {tests.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No tests listed for this provider yet.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
