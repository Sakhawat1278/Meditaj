'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ChevronDown, ArrowRight, Globe, Clock, Star, ShoppingCart, Menu, X, AlignLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import CurateButton from '@/components/UI/Buttons/CurateButton';
import Logo from '@/components/UI/Logo';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const getUserColor = (uid) => {
  const colors = [
    { bg: '#e6f0ed', text: '#1e4a3a' }, // Soft Emerald
    { bg: '#f1f5f9', text: '#334155' }, // Soft Slate
    { bg: '#f0f9ff', text: '#0369a1' }, // Soft Sky
    { bg: '#fff7ed', text: '#b45309' }, // Soft Amber
    { bg: '#eef2ff', text: '#4338ca' }, // Soft Indigo
    { bg: '#fdf2f8', text: '#be185d' }, // Soft Rose
    { bg: '#f0fdf4', text: '#15803d' }, // Soft Green
  ];
  if (!uid) return colors[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CurateHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Throttle state updates to only fire when the threshold is crossed
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const placeholders = ["Search Doctors", "Search medicines"];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const [allSuggestions, setAllSuggestions] = useState([]);

  useEffect(() => {
    if (!db) return;

    // Fetch Specialties
    const unsubSpec = onSnapshot(collection(db, 'specialties'), (snapshot) => {
      const specs = snapshot.docs.map(doc => ({
        type: 'Specialty',
        name: doc.data().name,
        icon: Star
      }));
      setAllSuggestions(prev => [...prev.filter(i => i.type !== 'Specialty'), ...specs]);
    });

    // Fetch Doctors
    const qDoctors = query(collection(db, 'users'), where('role', '==', 'doctor'), where('status', '==', 'approved'));
    const unsubDoctors = onSnapshot(qDoctors, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        type: 'Professional',
        name: doc.data().fullName,
        icon: User
      }));
      setAllSuggestions(prev => [...prev.filter(i => i.type !== 'Professional'), ...docs]);
    });

    // Add static services
    const services = [
      { type: 'Service', name: 'Health Store', icon: Clock },
      { type: 'Service', name: 'Nursing Care', icon: Clock },
      { type: 'Service', name: 'Ambulance', icon: Clock },
      { type: 'Service', name: 'Lab Tests', icon: Clock }
    ];
    setAllSuggestions(prev => [...prev.filter(i => i.type !== 'Service'), ...services]);

    return () => {
      unsubSpec();
      unsubDoctors();
    };
  }, []);

  const filteredSuggestions = searchValue.trim().length >= 1 
    ? allSuggestions.filter(s => s.name.toLowerCase().includes(searchValue.toLowerCase()))
    : [];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  const handleSearch = (term) => {
    const query = term || searchValue;
    if (query.trim()) {
      router.push(`/specialist?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setSearchValue('');
    }
  };

  const navLinks = [
    { name: 'Instant Book', href: '/instant' },
    { 
      name: 'Services', 
      href: '#', 
      hasDropdown: true,
      subItems: [
        { name: 'All Doctors', href: '/specialist' },
        { name: 'Health Store', href: '/shop' },
        { name: 'Nursing', href: '/nursing' },
        { name: 'Lab Tests', href: '/labs' },
        { name: 'Ambulance', href: '/ambulance' },
      ]
    },
    { 
      name: 'More', 
      href: '#', 
      hasDropdown: true,
      subItems: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ]
    },
  ];

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  const logoVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2
      }
    }
  };

  const growVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 25 } }
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b border-slate-200 bg-white ${isScrolled ? 'py-3 shadow-sm' : 'py-4'}`}
    >
      <div className="w-full flex flex-col lg:pt-0">
        
        {/* Main Row */}
        <div className="w-full max-w-[1825px] mx-auto px-2 lg:px-10 flex items-center justify-between relative">
          
          {/* Mobile Left: Menu Toggle */}
          <div className="flex-shrink-0 w-12 lg:flex-1 lg:block hidden lg:hidden">
            {/* This is a ghost div for desktop logic */}
          </div>
          <div className="flex-shrink-0 w-12 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center text-[#1e4a3a] active:scale-95 transition-transform"
            >
              <AlignLeft size={20} />
            </button>
          </div>

          {/* Desktop Left: Navigation */}
          <motion.nav initial="hidden" animate="visible" className="hidden lg:flex items-center gap-8 flex-1">
            {navLinks.map((link) => (
              <motion.div key={link.name} variants={itemVariants} className="relative flex items-center" onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
                <Link href={link.href} className="group flex items-center gap-1.5 text-[15px] font-medium text-slate-700 hover:text-[#1e4a3a] transition-colors leading-none py-4">
                  {link.name}
                  {link.hasDropdown && <ChevronDown size={14} className={`text-slate-400 group-hover:text-[#1e4a3a] transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />}
                </Link>
                <AnimatePresence>
                  {activeDropdown === link.name && link.subItems && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 w-48 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 py-3 z-50 overflow-hidden">
                      <div className="flex flex-col">
                        {link.subItems.map(sub => <Link key={sub.name} href={sub.href} className="px-5 py-2.5 text-[13px] font-medium text-slate-600 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all">{sub.name}</Link>)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.nav>

          {/* Logo (Centered) */}
          <motion.div variants={logoVariants} initial="hidden" animate="visible" className={`flex-1 flex justify-center transition-all duration-500 overflow-visible ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>
            <Link href="/" className="flex items-center gap-2 lg:gap-3 group whitespace-nowrap">
              <Logo size="md" className="group-hover:rotate-45 transition-transform duration-500 flex-shrink-0" />
              <div className="flex items-center text-lg lg:text-xl font-bold tracking-tight text-[#1e4a3a] uppercase overflow-visible">
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } }
                  }}
                  className="flex"
                >
                  {"CURATE".split("").map((char, i) => (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
                      }}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                  <span className="w-1.5" />
                  {"HEALTH".split("").map((char, i) => (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
                      }}
                      className="inline-block text-[#1e4a3a]/40 font-medium"
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </Link>
          </motion.div>

          {/* Actions: Search, Account, Cart */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0 lg:flex-1 justify-end min-w-[70px] lg:min-w-0">
            {/* Desktop Search */}
            <motion.div ref={searchRef} variants={itemVariants} initial="hidden" animate="visible" className="hidden lg:flex items-center relative">
              <AnimatePresence mode="wait">
                {isSearchOpen && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden mr-[-40px]"
                  >
                    <div className="relative">
                      <input 
                        autoFocus
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="h-11 w-full pl-5 pr-12 bg-slate-100/80 border border-slate-200 rounded-full text-[13px] font-medium outline-none focus:border-[#1e4a3a] focus:bg-white transition-all"
                      />
                      {!searchValue && (
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.span 
                              key={placeholderIdx}
                              initial={{ y: 15, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -15, opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="text-[13px] font-medium text-slate-400 block"
                            >
                              {placeholders[placeholderIdx]}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {filteredSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-12 left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden z-[60]"
                        >
                          <div className="p-2">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Suggested Matches</div>
                            {filteredSuggestions.map((s, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSearch(s.name)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <s.icon size={14} />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-bold text-[#1e4a3a] leading-tight">{s.name}</div>
                                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{s.type}</div>
                                  </div>
                                </div>
                                <ArrowRight size={14} className="text-slate-200" />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button 
                onClick={() => {
                  if (!isSearchOpen) setIsSearchOpen(true);
                  else if (searchValue.trim()) handleSearch();
                  else setIsSearchOpen(false);
                }}
                className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all ${isSearchOpen ? 'bg-[#1e4a3a] text-white shadow-lg' : 'bg-white border border-slate-300 text-slate-800 hover:bg-[#1e4a3a] hover:text-white'}`}
              >
                <AnimatePresence mode="wait">
                  {isSearchOpen && !searchValue ? (
                    <motion.div key="a" initial={{scale:0, rotate:-45}} animate={{scale:1, rotate:0}} exit={{scale:0, rotate:45}}>
                      <ArrowRight size={18}/>
                    </motion.div>
                  ) : (
                    <motion.div key="s" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                      <Search size={20}/>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Utility Buttons (User/Cart) */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex items-center gap-2 lg:gap-4">
              <Link 
                href={user ? `/dashboard/${role || 'patient'}` : "/login"} 
                className="w-11 h-11 border border-slate-300 rounded-full flex items-center justify-center text-slate-800 hover:opacity-90 transition-all overflow-hidden relative"
              >
                {profile?.photoURL || user?.photoURL ? (
                  <Image 
                    src={profile?.photoURL || user?.photoURL} 
                    alt="Profile" 
                    fill 
                    className="object-cover"
                    sizes="44px"
                  />
                ) : user ? (
                  <div 
                    className="w-full h-full flex items-center justify-center text-[18px] font-black uppercase"
                    style={{ 
                      backgroundColor: getUserColor(user.uid).bg,
                      color: getUserColor(user.uid).text
                    }}
                  >
                    {(profile?.fullName || user.email || '?').charAt(0)}
                  </div>
                ) : (
                  <User size={20}/>
                )}
              </Link>
              <Link href="/cart" className="w-11 h-11 border border-slate-300 rounded-full flex items-center justify-center text-slate-800 hover:bg-[#1e4a3a] hover:text-white transition-all"><ShoppingCart size={20}/></Link>
            </motion.div>

            {/* Desktop Book Now */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="hidden lg:block">
              <CurateButton href="/specialist" label="Book now" variant="primary" />
            </motion.div>
          </div>
        </div>

        {/* Mobile Secondary Search Row (Only at top) */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full px-2 lg:hidden overflow-hidden"
            >
              <motion.div 
                initial={{ width: "40%", opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: "40%", opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full mx-auto"
              >
                <div className="relative overflow-hidden rounded-full">
                  <input 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-11 w-full pl-5 pr-12 bg-slate-100/50 backdrop-blur-md border border-slate-300/80 rounded-full text-[14px] font-medium outline-none focus:bg-white focus:border-[#1e4a3a] transition-all shadow-sm"
                  />
                  {!searchValue && (
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span 
                          key={placeholderIdx}
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -15, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="text-[14px] font-medium text-slate-400 block"
                        >
                          {placeholders[placeholderIdx]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}
                  <button 
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1e4a3a] text-white rounded-full flex items-center justify-center hover:bg-[#163529] transition-all"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Slider */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-[#1e4a3a]/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col pt-6 pb-20"
            >
              <div className="px-6 flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#1e4a3a] border border-white" /><div className="w-2 h-2 rounded-full bg-[#1e4a3a] border border-white" /><div className="w-2 h-2 rounded-full bg-[#1e4a3a] border border-white" /><div className="w-2 h-2 rounded-full bg-[#1e4a3a] border border-white" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-tight">Curate <span className="text-[#1e4a3a]/30 font-medium">Menu</span></span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-[#1e4a3a]">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6">
                <div className="flex flex-col gap-1">
                  <div className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Main Navigation</div>
                  {navLinks.map((link) => (
                    <div key={link.name} className="flex flex-col">
                      <Link 
                        href={link.href} 
                        onClick={() => !link.hasDropdown && setIsMobileMenuOpen(false)}
                        className={`px-2 py-3.5 text-[15px] font-bold border-b border-slate-50 flex items-center justify-between ${link.hasDropdown ? 'text-[#1e4a3a]' : 'text-slate-700'}`}
                      >
                        {link.name}
                        {link.hasDropdown && <ChevronDown size={14} className="text-slate-300" />}
                      </Link>
                      
                      {link.subItems && (
                        <div className="flex flex-col pl-4 mt-1 border-l border-slate-100 ml-2 py-1">
                          {link.subItems.map(sub => (
                            <Link 
                              key={sub.name} 
                              href={sub.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="px-2 py-2 text-[13px] font-medium text-slate-500 hover:text-[#1e4a3a] transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Integrated Book Now Action */}
                  <div className="pt-6 flex justify-start">
                    <CurateButton 
                      href="/specialist"
                      label="Book now"
                      variant="primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default CurateHeader;
