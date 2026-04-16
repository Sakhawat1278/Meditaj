'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ChevronDown, ArrowRight, Globe, Clock, Star, ShoppingCart, Menu, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const CurateHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [allSuggestions, setAllSuggestions] = useState([]);
  const placeholders = ["Search Doctors", "Search medicines"];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (!db) return;
    const unsubSpec = onSnapshot(collection(db, 'specialties'), (snapshot) => {
      const specs = snapshot.docs.map(doc => ({ type: 'Specialty', name: doc.data().name, icon: Star }));
      setAllSuggestions(prev => [...prev.filter(i => i.type !== 'Specialty'), ...specs]);
    });
    const qDoctors = query(collection(db, 'users'), where('role', '==', 'doctor'), where('status', '==', 'approved'));
    const unsubDoctors = onSnapshot(qDoctors, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ type: 'Professional', name: doc.data().fullName, icon: User }));
      setAllSuggestions(prev => [...prev.filter(i => i.type !== 'Professional'), ...docs]);
    });
    const services = [
      { type: 'Service', name: 'Health Store', icon: Clock },
      { type: 'Service', name: 'Nursing Care', icon: Clock },
      { type: 'Service', name: 'Ambulance', icon: Clock },
      { type: 'Service', name: 'Lab Tests', icon: Clock }
    ];
    setAllSuggestions(prev => [...prev.filter(i => i.type !== 'Service'), ...services]);
    return () => { unsubSpec(); unsubDoctors(); };
  }, []);

  const filteredSuggestions = searchValue.trim().length >= 1 
    ? allSuggestions.filter(s => s.name.toLowerCase().includes(searchValue.toLowerCase()))
    : [];

  useEffect(() => {
    if (isSearchOpen) {
      const interval = setInterval(() => {
        setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isSearchOpen]);

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
        { name: 'All Doctors', href: '/doctors' },
        { name: 'Health Store', href: '/store' },
        { name: 'Nursing', href: '/nursing' },
        { name: 'Lab Tests', href: '/lab-tests' },
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
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  const logoVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.5, ease: "easeOut", delay: 0.3 } }
  };

  const growVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 25 } }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 border-b border-black/5 ${isScrolled ? 'bg-white/90 backdrop-blur-xl py-3 shadow-sm' : 'bg-transparent py-5'}`}>
        <div className="w-full px-4 lg:px-16 flex items-center justify-between relative">
          
          {/* Left: Desktop Nav + Mobile Toggle */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center border border-slate-200 rounded-full text-black bg-white"
            >
              <Menu size={20} />
            </button>

            <motion.nav initial="hidden" animate="visible" className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <motion.div key={link.name} variants={itemVariants} className="relative flex items-center" onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
                  <Link href={link.href} className="group flex items-center gap-1.5 text-[14px] font-bold text-slate-700 hover:text-black transition-colors uppercase tracking-widest leading-none py-4">
                    {link.name}
                    {link.hasDropdown && <ChevronDown size={14} className={`text-slate-400 group-hover:text-black transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />}
                  </Link>
                  <AnimatePresence>
                    {activeDropdown === link.name && link.subItems && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 w-48 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 py-3 z-50 overflow-hidden">
                        <div className="flex flex-col">
                          {link.subItems.map(sub => <Link key={sub.name} href={sub.href} className="px-5 py-2.5 text-[12px] font-bold text-slate-500 uppercase tracking-widest hover:text-black hover:bg-slate-50 transition-all">{sub.name}</Link>)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.nav>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex items-center gap-2 lg:gap-3 group shrink-0">
            <div className="grid grid-cols-2 gap-0.5 group-hover:rotate-45 transition-transform duration-500">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-black" /><div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-black" /><div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-black" /><div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-black" />
            </div>
            <div className="flex items-center text-lg lg:text-xl font-bold tracking-tighter text-black uppercase overflow-hidden">
              <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } } }} className="flex">
                {"CURATE".split("").map((c, i) => (<motion.span key={i} variants={{ hidden:{opacity:0,y:10}, visible:{opacity:1,y:0} }} className="inline-block">{c}</motion.span>))}
                <span className="w-1.5" />
                {"HEALTH".split("").map((c, i) => (<motion.span key={i} variants={{ hidden:{opacity:0,y:10}, visible:{opacity:1,y:0} }} className="inline-block text-black/40 font-medium">{c}</motion.span>))}
              </motion.div>
            </div>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 lg:gap-4 flex-1 justify-end">
            <div ref={searchRef} className="flex items-center relative">
              <AnimatePresence mode="wait">
                {isSearchOpen && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 200, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="relative mr-[-36px] overflow-hidden hidden sm:block">
                    <input autoFocus value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-10 w-full pl-4 pr-10 bg-slate-100 border border-slate-200 rounded-full text-[13px] font-bold outline-none uppercase tracking-wider" />
                    {!searchValue && <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{placeholders[placeholderIdx]}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button variants={growVariants} initial="hidden" animate="visible" onClick={() => { if(!isSearchOpen) setIsSearchOpen(true); else if(searchValue.trim()) handleSearch(); else setIsSearchOpen(false); }} className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center text-slate-800 hover:bg-black hover:text-white transition-all bg-white relative z-10"><Search size={18} /></motion.button>
            </div>

            <motion.div variants={growVariants} initial="hidden" animate="visible" className="hidden sm:block">
              <Link href="/cart" className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center text-slate-800 hover:bg-black hover:text-white transition-all"><ShoppingCart size={18} /></Link>
            </motion.div>

            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="hidden sm:block">
              <Link href="/eligibility" className="group flex items-center justify-end h-10 bg-black text-white rounded-full hover:bg-slate-800 transition-all overflow-hidden">
                <motion.div initial={{ width: 40 }} animate={{ width: "auto" }} transition={{ delay: 0.8 }} className="flex items-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ml-4 mr-2">Book now</span>
                  <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center mr-1 group-hover:bg-white group-hover:text-black transition-all"><ArrowRight size={14}/></div>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[150] bg-white lg:hidden flex flex-col pt-32 px-10"
          >
            <div className="flex flex-col gap-8">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + (idx * 0.1) }}
                >
                  <Link 
                    href={link.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-3xl font-black uppercase tracking-tighter text-black flex items-center justify-between"
                  >
                    {link.name}
                    {link.hasDropdown && <ArrowRight size={24} className="text-slate-200" />}
                  </Link>
                  {link.hasDropdown && (
                    <div className="flex flex-col gap-3 mt-4 ml-2 border-l border-slate-100 pl-4">
                      {link.subItems.map(sub => (
                        <Link key={sub.name} href={sub.href} onClick={() => setIsMobileMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-black">{sub.name}</Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-auto pb-20 flex flex-col gap-6">
              <Link href="/eligibility" onClick={() => setIsMobileMenuOpen(false)} className="h-14 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold uppercase tracking-[0.2em]">Book Clinical Now</Link>
              <div className="flex justify-center gap-6">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-14 h-14 border border-slate-200 rounded-full flex items-center justify-center"><User size={24}/></Link>
                <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="w-14 h-14 border border-slate-200 rounded-full flex items-center justify-center"><ShoppingCart size={24}/></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CurateHeader;
