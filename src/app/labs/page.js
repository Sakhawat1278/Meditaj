'use client';
import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Building2, Search, Filter, ShoppingCart, 
  ChevronRight, Info, CheckCircle2, ArrowRight,
  ShieldCheck, Clock, CreditCard, X, Beaker, Calendar, Loader2
} from 'lucide-react';
import CustomDropdown from '@/components/UI/CustomDropdown';
import DatePicker from '@/components/UI/DatePicker';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { bdLocations, getDivisions, getDistricts, getAreas } from '@/lib/locationData';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LabTestCard from '@/components/Labs/LabTestCard';
import { toast } from 'react-hot-toast';

export default function LabTestsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const divParam = searchParams.get('division');
  const distParam = searchParams.get('district');
  const areaParam = searchParams.get('area');
  const dateParam = searchParams.get('date');
  
  // Filter States
  const [selectedDiv, setSelectedDiv] = useState(divParam || null);
  const [selectedDist, setSelectedDist] = useState(distParam || null);
  const [selectedArea, setSelectedArea] = useState(areaParam || null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data States
  const [providers, setProviders] = useState([]);
  const [allAreaTests, setAllAreaTests] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // 1. Fetch Providers when Area changes (Filtered by Hierarchy)
  useEffect(() => {
    if (!selectedArea || !selectedDiv || !selectedDist) {
      setProviders([]);
      setSelectedProvider(null);
      return;
    }

    setLoading(true);
    if (!db) return;
    
    // Query providers in this area. We'll be slightly more permissive with status if needed, 
    // but stay consistent with active filtering.
    const q = query(
      collection(db, 'lab_providers'), 
      where('division', '==', selectedDiv),
      where('district', '==', selectedDist),
      where('area', '==', selectedArea),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProviders(pData);
      setLoading(false);
    }, (err) => {
      console.error("Providers Fetch Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedArea, selectedDiv, selectedDist]);

  // 2. Fetch All Tests for the Area (When multiple providers exist)
  useEffect(() => {
    if (!selectedArea || providers.length === 0) {
      setAllAreaTests([]);
      setTestsLoading(false);
      return;
    }

    setTestsLoading(true);
    // Filter tests for ANY provider in this area
    const providerIds = providers.map(p => p.id);
    if (providerIds.length === 0) {
      setTestsLoading(false);
      return;
    }

    if (!db) return;
    // Firestore 'in' query limit is 10.
    const q = query(
      collection(db, 'lab_tests'),
      where('providerId', 'in', providerIds),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTests = snapshot.docs.map(doc => {
        const data = doc.data();
        const provider = providers.find(p => p.id === data.providerId);
        return { 
          id: doc.id, 
          ...data,
          providerName: provider?.name || 'Local Lab'
        };
      });
      setAllAreaTests(fetchedTests);
      setTestsLoading(false);
    }, (err) => {
      console.error("Tests Fetch Error:", err);
      setTestsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedArea, providers]);

  // 3. Handle specific selected provider tests
  useEffect(() => {
    if (!selectedProvider) {
      setTests([]);
      return;
    }

    setTests(allAreaTests.filter(t => t.providerId === selectedProvider.id));
  }, [selectedProvider, allAreaTests]);

  // 4. Fetch Payment Methods
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
      setPaymentMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.status === 'active'));
    });
    return () => unsubscribe();
  }, []);

  // 5. Filter providers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProviders([]);
      return;
    }
    const filtered = providers.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.area.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProviders(filtered);
  }, [searchTerm, providers]);

  const handleBookNow = (test) => {
    if (!user) {
      toast.error('Please login to book a test');
      router.push('/login?redirect=/labs');
      return;
    }

    // Direct Checkout Preparation
    const checkoutPayload = {
      type: 'lab',
      items: [{
        id: test.id,
        name: test.name,
        price: test.price,
        type: 'lab',
        category: test.category || 'Diagnostic',
        providerName: test.providerName || 'Local Lab'
      }],
      totalAmount: test.price,
      patientName: profile?.userName || user.displayName || 'Patient',
      patientPhone: profile?.phone || '',
      date: new Date().toISOString(), // Default to today, can be refined with a picker
      time: 'As soon as possible'
    };

    sessionStorage.setItem('medita_checkout', JSON.stringify(checkoutPayload));
    router.push('/checkout');
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD]">

      <div className="pt-20 lg:pt-24 pb-24 w-full max-w-[1825px] mx-auto px-4 lg:px-10">
        
        {/* --- HIERARCHICAL FILTERS & SEARCH --- */}
        <div className="bg-white border border-slate-300 rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-[#1e4a3a] uppercase tracking-tight mb-1">Diagnostic Labs</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {selectedArea ? `Available facilities in ${selectedArea}` : 'Discover world-class testing centers'}
              </p>
            </div>

            <div className="flex-1 max-w-xs relative">
              <input
                type="text"
                placeholder="Search city or lab name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all placeholder:text-slate-300"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                setSearchTerm('');
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
                setSearchTerm('');
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
                setSearchTerm('');
              }}
              searchable
              disabled={!selectedDist}
            />
            <CustomDropdown
              label="Lab Provider"
              placeholder="Select Lab Provider"
              options={(searchTerm ? filteredProviders : providers).map(p => ({ label: p.name, value: p, id: p.id }))}
              value={selectedProvider}
              onChange={(val) => setSelectedProvider(val)}
              searchable
              disabled={!searchTerm && (!selectedArea || providers.length === 0)}
            />
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          {!selectedArea ? (
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
                Select a location to view available tests in your area.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="tests-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* If a provider is specifically selected, show only their tests */}
              {selectedProvider ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-300 pb-6">
                    <div>
                      <h1 className="text-xl font-black text-[#1e4a3a] uppercase tracking-wide mb-0.5">{selectedProvider.name}</h1>
                      <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium">
                        <MapPin size={14} className="text-emerald-500" />
                        <span>{selectedProvider.area}, {selectedProvider.district}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {tests.map(test => (
                      <LabTestCard 
                        key={test.id} 
                        test={test} 
                        onBookNow={handleBookNow}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Otherwise, show all tests in the area grouped by provider */
                <div className="space-y-12">
                  {loading || testsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Searching for labs in {selectedArea}...</p>
                    </div>
                  ) : providers.map(provider => {
                    const providerTests = allAreaTests.filter(t => t.providerId === provider.id);
                    if (providerTests.length === 0) return null;
                    
                    return (
                      <div key={provider.id} className="group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 mb-6 gap-4">
                          <div className="flex items-start gap-3">
                            <span className="h-4 w-1 bg-emerald-500 rounded-full mt-1.5" />
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-lg font-black text-[#1e4a3a] uppercase tracking-tight leading-none">{provider.name}</h2>
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded leading-none">Partner</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <MapPin size={10} className="text-emerald-500" />
                                  <span>{provider.area}, {provider.district}</span>
                                </div>
                                <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <Clock size={10} />
                                  <span>9am - 8pm</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                            <Beaker size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-[#1e4a3a] uppercase tracking-widest">{providerTests.length} Tests</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                          {providerTests.map(test => (
                            <LabTestCard 
                              key={test.id} 
                              test={test} 
                              onBookNow={handleBookNow}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {allAreaTests.length === 0 && !loading && !testsLoading && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No tests listed in this area yet.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
