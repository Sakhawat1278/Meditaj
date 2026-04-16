'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Menu, X, Search, Phone, ShoppingCart, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const MotionLink = motion.create(Link);

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, locale, switchLanguage } = useLanguage();
  const { user, profile, role, loading } = useAuth();
  const { cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 font-sans font-light bg-white">

      {/* ══════════════════════════════════════════════
      TIER 1 — Utility Bar
      Visible: DESKTOP + LAPTOP only (lg = 1024px+)
      Hidden: Mobile + Tablet (< 1024px)
      Collapses on scroll
      ══════════════════════════════════════════════ */}
      <div className={`hidden lg:block transition-all duration-300 border-b border-med-border bg-emerald-50/70 ${
        isScrolled ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : 'h-11 opacity-100'
      }`}>
        <div className={`w-full px-12 h-11 flex items-center justify-between text-[12px] font-bold uppercase ${locale === 'en' ? 'tracking-[0.2em]' : 'tracking-normal'} text-med-muted`}>
          <div className="flex items-center gap-6">
            <Link href="/become-provider" className="font-extrabold text-emerald-600 hover:text-med-primary transition-colors whitespace-nowrap">
              {t('becomeProvider')}
            </Link>
            <div className="w-[2px] h-3 bg-emerald-600/30 rounded-full shrink-0"></div>
            <div className="flex items-center gap-1.5 text-emerald-600 whitespace-nowrap">
              <Phone size={14} strokeWidth={2.5} />
              {t('emergency')}: 10657
            </div>
          </div>
          <div 
            onClick={() => switchLanguage(locale === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 cursor-pointer hover:text-med-text transition-colors whitespace-nowrap select-none"
          >
            <Globe size={11} /> 
            <span className={locale === 'en' ? 'text-med-primary' : ''}>EN</span>
            <span className="text-slate-300">/</span>
            <span className={locale === 'bn' ? 'text-med-primary' : ''}>BN</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
      TIER 2 — Main Nav Section
      Always visible across all devices
      Structured into two rows on desktop:
      Row 1: Logo, Main Nav, Actions (Cart, Auth, Hamburger)
      Row 2: Search (Desktop only, prominent)
      ══════════════════════════════════════════════ */}
      <div className={`bg-white border-b border-med-border py-2.5 transition-all duration-300 ${isScrolled ? '' : ''}`}>
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Desktop nav (xl+) */}
            <div className="flex items-center gap-6 xl:gap-10">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 bg-med-primary rounded-md flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <span className="text-2xl xl:text-3xl font-bold tracking-tighter text-med-text uppercase">{t('logo')}</span>
              </Link>

              {/* Primary Nav — xl+ (1280px+) only */}
              <nav className="hidden xl:flex items-center gap-6 border-l border-med-border pl-6 ml-2">
                <NavLink href="/" label={t('home')} active />
                <NavLink href="/instant" label={t('instantDoctor')} />
                <NavLink href="/specialist" label={t('specialistDoctor')} />
                <NavLink href="/shop" label={t('healthStore')} />
                <NavLink href="/nursing" label={t('nursing')} />
                <NavLink href="/labs" label={t('labTests')} />
                <NavLink href="/ambulance" label={t('ambulance')} />
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Desktop Search Bar — lg+ only */}
              <div className="hidden lg:block w-48 xl:w-64 relative group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-med-primary transition-colors"
                  size={13}
                />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-med-primary/30 focus:bg-white text-[12px] font-medium text-med-text placeholder:text-slate-400 transition-all duration-200"
                />
              </div>

              {/* Cart — DESKTOP/LAPTOP only (lg+) */}
              <Link href="/cart">
                <button
                  className="hidden lg:flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-md text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors duration-200 relative"
                >
                  <ShoppingCart size={15} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-slate-950 text-white text-[8px] font-black rounded-full px-1 border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Divider — lg+ only */}
              <div className="hidden lg:block h-6 w-px bg-med-border mx-0.5" />

              {/* Login + Register + Profile — visible on all devices */}
              <div className="flex items-center gap-1.5">
                {!loading && user && profile && role ? (
                  <Link href={`/dashboard/${role}`} className="h-8 flex items-center gap-2 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 rounded-md pl-1 pr-2 xl:pr-3">
                    <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {profile.fullName ? profile.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col shrink-0">
                      <span className="text-[11px] font-bold text-med-text leading-none">{profile.fullName || user.email.split('@')[0]}</span>
                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">{role}</span>
                    </div>
                  </Link>
                ) : !loading ? (
                  <>
                    <Link
                      href="/login"
                      className={`h-8 px-2.5 sm:px-3 bg-white border border-slate-300 text-med-text rounded-md text-[11px] uppercase font-bold ${locale === 'en' ? 'tracking-widest' : 'tracking-normal'} flex items-center justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors duration-200`}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/signup"
                      className={`h-8 px-2.5 sm:px-3 bg-med-text text-white border border-transparent rounded-md text-[11px] uppercase font-bold ${locale === 'en' ? 'tracking-widest' : 'tracking-normal'} flex items-center justify-center hover:bg-emerald-600 hover: transition-colors duration-200`}
                    >
                      {t('signUp')}
                    </Link>
                  </>
                ) : (
                  <div className="w-32 h-8 bg-slate-100 rounded-md animate-pulse"></div>
                )}
              </div>

              {/* Hamburger — MOBILE + TABLET only (< xl = < 1280px) */}
              <button
                className="xl:hidden flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-md text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════
      TIER 3 — Search + Cart Bottom Bar
      Visible: MOBILE + TABLET only (< 1024px)
      Hidden: Desktop/Laptop (lg+)
      ══════════════════════════════════════════════ */}
      <div className="lg:hidden bg-white border-b border-med-border py-2.5">
        <div className="w-full px-6 flex items-center gap-3">
          {/* Search — full width */}
          <div className="flex-1 relative group">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-med-primary transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholderMobile')}
              className="w-full h-9 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-med-primary/40 focus:bg-white text-[13px] font-light text-med-text placeholder:text-slate-400 transition-all duration-200"
            />
          </div>
          {/* Cart */}
          <Link href="/cart">
            <motion.button
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="shrink-0 flex items-center justify-center w-9 h-9 bg-white border border-slate-200 rounded-md text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 hover: transition-colors duration-200 relative"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center bg-slate-950 text-white text-[9px] font-black rounded-full px-1 border-2 border-white">
                  {cartCount}
                </span>
              )}
            </motion.button>
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
      MOBILE / TABLET MENU — Top-to-Bottom Reveal
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 sm:left-auto sm:right-3 sm:w-80 md:w-96 top-3 z-[100] bg-white rounded-xl border border-med-border flex flex-col overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 24px)' }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.25 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-med-border bg-emerald-50/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-med-primary rounded-md flex items-center justify-center text-white">
                      <Sparkles size={14} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-med-text uppercase">{t('logo')}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.08, y: -1 }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 text-slate-400 rounded-md hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 hover: transition-colors duration-200"
                  >
                    <X size={18} />
                  </motion.button>
                </div>

                {/* ── Utility items (mobile/tablet replacement for Tier 1) ── */}
                <div className="shrink-0 px-6 py-3 border-b border-med-border bg-emerald-50/40 flex items-center justify-between">
                  <MotionLink
                    href="/apply"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 border border-slate-200 bg-white rounded-md text-[10px] font-extrabold uppercase ${locale === 'en' ? 'tracking-[0.2em]' : 'tracking-normal'} text-med-muted hover:text-med-primary hover:border-med-primary/30 hover: transition-all`}
                  >
                    {t('becomeProvider')}
                  </MotionLink>
                  <div 
                    onClick={() => switchLanguage(locale === 'en' ? 'bn' : 'en')}
                    className={`flex items-center gap-1.5 cursor-pointer text-[12px] font-bold uppercase ${locale === 'en' ? 'tracking-[0.2em]' : 'tracking-normal'} text-med-muted hover:text-med-text transition-colors select-none`}
                  >
                    <Globe size={11} />
                    <span className={locale === 'en' ? 'text-med-primary' : ''}>EN</span>
                    <span className="text-slate-300">/</span>
                    <span className={locale === 'bn' ? 'text-med-primary' : ''}>BN</span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col">
                  {[
                    { href: '/', label: t('home') },
                    { href: '/instant', label: t('instantDoctor') },
                    { href: '/specialist', label: t('specialistDoctor') },
                    { href: '/shop', label: t('healthStore') },
                    { href: '/nursing', label: t('nursing') },
                    { href: '/labs', label: t('labTests') },
                    { href: '/ambulance', label: t('ambulance') },
                  ].map(({ href, label }, i) => (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.3, ease: 'easeOut' }}
                    >
                      <MobileNavLink href={href} label={label} onClick={() => setMobileMenuOpen(false)} />
                    </motion.div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="shrink-0 px-6 pt-4 pb-5 border-t border-med-border bg-slate-50/60 space-y-3">
                  <div className={`flex items-center justify-between text-[12px] font-bold uppercase ${locale === 'en' ? 'tracking-widest' : 'tracking-normal'} text-emerald-600`}>
                    <div className="flex items-center gap-1.5">
                      <Phone size={10} strokeWidth={2.5} />
                      {t('emergencyHotline')}
                    </div>
                    <span>10657</span>
                  </div>
                  {!loading && user && profile && role ? (
                    <Link
                      href={`/dashboard/${role}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-[14px] font-bold shrink-0">
                        {profile.fullName ? profile.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[14px] font-bold text-med-text">{profile.fullName || user.email.split('@')[0]}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-1">{role} Dashboard</span>
                      </div>
                    </Link>
                  ) : !loading ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`h-11 bg-white border border-slate-300 text-med-text rounded-md flex items-center justify-center font-bold text-[12px] uppercase ${locale === 'en' ? 'tracking-[0.15em]' : 'tracking-normal'} hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors`}
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`h-11 bg-med-text text-white rounded-md flex items-center justify-center font-bold text-[12px] uppercase ${locale === 'en' ? 'tracking-[0.15em]' : 'tracking-normal'} hover:bg-emerald-600 transition-colors`}
                      >
                        {t('signUp')}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, label, active = false }) {
  const { locale } = useLanguage();
  return (
    <Link
      href={href}
      className={`text-[12px] font-bold uppercase ${locale === 'en' ? 'tracking-[0.15em]' : 'tracking-normal'} transition-all whitespace-nowrap ${
        active ? 'text-med-primary' : 'text-slate-500 hover:text-med-primary'
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, onClick }) {
  const { locale } = useLanguage();
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center py-2.5 text-[13px] font-semibold uppercase ${locale === 'en' ? 'tracking-[0.12em]' : 'tracking-normal'} text-med-text hover:text-med-primary transition-colors border-b border-slate-100 last:border-0 ${
        'group'
      }`}
    >
      {label}
    </Link>
  );
}
