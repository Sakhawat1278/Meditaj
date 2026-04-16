'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Search, ShoppingCart, Menu, ArrowUpRight, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Magnetic from '@/components/UI/Motion/Magnetic';

const SunriseHeader = () => {
  const { t, locale, switchLanguage } = useLanguage();
  const { user, profile, role, loading } = useAuth();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2,
        type: "spring",
        stiffness: 260,
        damping: 20 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  const navLinks = [
    { href: '/about', label: t('sunriseAbout') },
    { href: '/services', label: t('services') },
    { href: '/facilities', label: t('sunriseFacilities') },
    { href: '/membership', label: t('sunriseMembership') },
  ];

  return (
    <motion.header
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      layout
      className={`fixed left-0 w-full z-[100] transition-all duration-500 pointer-events-none ${scrolled ? 'top-2' : 'top-8'}`}
    >
      <div className={`max-w-[1600px] mx-auto flex items-center justify-between px-4 lg:px-12 pointer-events-auto transition-all duration-500`}>
        
        {/* Left Section: Nav Navigation */}
        <motion.div variants={itemVariants} className="hidden lg:flex items-center gap-1 p-1 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative">
          {navLinks.map((link) => (
            <HeaderPill 
              key={link.href}
              href={link.href} 
              label={link.label} 
              isHovered={hoveredPath === link.href}
              onMouseEnter={() => setHoveredPath(link.href)}
              onMouseLeave={() => setHoveredPath(null)}
            />
          ))}
        </motion.div>

        {/* Center Section: Branded Logo Vessel */}
        <motion.div 
          variants={itemVariants} 
          whileHover={{ scale: 1.05 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl group-hover:bg-emerald-500/40 transition-all rounded-full" />
          <Link href="/" className="relative flex items-center gap-3 px-10 py-5 bg-white rounded-t-[10px] rounded-b-[50px] border-x border-b border-slate-100 shadow-2xl overflow-hidden group">
             <motion.div 
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-0 left-0 w-full h-1 bg-emerald-500" 
             />
             <Sparkles className="text-emerald-500 group-hover:scale-125 transition-transform duration-500" size={24} />
             <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Sunrise</span>
          </Link>
        </motion.div>

        {/* Right Section: Actions & Search */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          
          {/* Search Pill */}
          <div className="hidden xl:flex items-center gap-2 pl-5 pr-1 group cursor-pointer">
             <span className="text-[11px] font-bold text-slate-200 group-hover:text-white uppercase tracking-widest transition-colors">{t('searchPlaceholder')}...</span>
             <Magnetic strength={0.2}>
               <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
                  <Search size={16} />
               </button>
             </Magnetic>
          </div>

          <div className="h-6 w-[1px] bg-white/20 hidden xl:block mx-2" />

          {/* Cart Pill */}
          <Magnetic strength={0.3}>
            <HeaderIconPill href="/cart" icon={<ShoppingCart size={18} />} count={cartCount} />
          </Magnetic>

          {/* Book Now Button */}
          <Magnetic strength={0.2}>
            <Link href="/appointment" className="h-12 px-6 bg-slate-900 text-white rounded-full flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all group shadow-xl relative overflow-hidden">
               <span className="relative z-10">{t('featBooking')}</span>
               <div className="relative z-10 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                  <ArrowUpRight size={14} />
               </div>
               <motion.div 
                 initial={{ x: '-100%' }}
                 whileHover={{ x: '100%' }}
                 transition={{ duration: 0.5 }}
                 className="absolute inset-0 bg-white/10 skew-x-12"
               />
            </Link>
          </Magnetic>

          {/* Menu Button */}
          <Magnetic strength={0.3}>
            <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-900 border border-slate-100 hover:bg-emerald-50 shadow-lg transition-colors">
               <Menu size={20} />
            </button>
          </Magnetic>

          {/* Language Toggle */}
          <Magnetic strength={0.3}>
            <button 
              onClick={() => switchLanguage(locale === 'en' ? 'bn' : 'en')}
              className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white hover:text-slate-900 transition-all text-[10px] font-black"
            >
              {locale.toUpperCase()}
            </button>
          </Magnetic>
        </motion.div>

      </div>
    </motion.header>
  );
};

const HeaderPill = ({ href, label, isHovered, onMouseEnter, onMouseLeave }) => (
  <Link 
    href={href} 
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="relative px-6 py-3 rounded-full text-[11px] font-bold text-white uppercase tracking-widest transition-all whitespace-nowrap z-10"
  >
    {isHovered && (
      <motion.div
        layoutId="header-hover"
        className="absolute inset-0 bg-white/20 rounded-full -z-10 shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    {label}
  </Link>
);

const HeaderIconPill = ({ href, icon, count }) => (
  <Link href={href} className="relative w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all group">
    <div className="group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    {count > 0 && (
      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-900 shadow-xl">
        {count}
      </span>
    )}
  </Link>
);

export default SunriseHeader;

