'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Camera, Briefcase, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const SunriseFooter = () => {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <footer className="relative bg-slate-950 pt-24 pb-12 overflow-hidden selection:bg-emerald-500/30">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="container mx-auto px-4 lg:px-6 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col items-start px-2">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-lg group-hover:bg-emerald-500/40 transition-all rounded-full" />
                <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="text-emerald-500" size={24} />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase">Sunrise</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              {t('sunriseAboutDes')}
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Camera size={18} />} href="#" />
              <SocialIcon icon={<Send size={18} />} href="#" />
              <SocialIcon icon={<MessageCircle size={18} />} href="#" />
              <SocialIcon icon={<Briefcase size={18} />} href="#" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-8">{t('sunriseQuickLinks')}</h4>
            <ul className="space-y-4">
              <FooterLink href="/about" label={t('sunriseAbout')} />
              <FooterLink href="/facilities" label={t('sunriseFacilities')} />
              <FooterLink href="/membership" label={t('sunriseMembership')} />
              <FooterLink href="/become-provider" label={t('becomeProvider')} />
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-8">{t('sunriseServices')}</h4>
            <ul className="space-y-4">
              <FooterLink href="/specialist" label={t('specialistDoctor')} />
              <FooterLink href="/labs" label={t('labTests')} />
              <FooterLink href="/ambulance" label={t('ambulance')} />
              <FooterLink href="/instant" label={t('instantDoctor')} />
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="lg:col-span-4">
            <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-8">{t('sunriseNewsletter')}</h4>
            <p className="text-slate-400 text-sm mb-6">{t('sunriseSubscribe')}</p>
            
            <div className="relative mb-10 group">
              <input 
                type="email" 
                placeholder={t('sunriseEmailPlace')}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
              />
              <button className="absolute right-2 top-2 h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                <Send size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <ContactItem icon={<Mail size={16} />} text="hello@meditaj.io" />
              <ContactItem icon={<Phone size={16} />} text="+880 1234 567 890" />
              <ContactItem icon={<MapPin size={16} />} text="Gulshan 2, Dhaka, Bangladesh" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-[11px] font-medium tracking-wide">
            &copy; {new Date().getFullYear()} <span className="text-slate-300 font-bold uppercase tracking-widest">{t('logo')}</span>. {t('sunriseAllRights')}.
          </p>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors">
              {t('sunrisePrivacy')}
            </Link>
            <Link href="/terms" className="text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors">
              {t('sunriseTerms')}
            </Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

const SocialIcon = ({ icon, href }) => (
  <motion.a 
    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
    whileTap={{ scale: 0.95 }}
    href={href}
    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"
  >
    {icon}
  </motion.a>
);

const FooterLink = ({ href, label }) => (
  <motion.li variants={{ hidden: { opacity: 0, x: -5 }, visible: { opacity: 1, x: 0 } }}>
    <Link href={href} className="text-slate-400 hover:text-white hover:translate-x-1.5 transition-all duration-300 inline-flex items-center text-sm font-medium">
      {label}
    </Link>
  </motion.li>
);

const ContactItem = ({ icon, text }) => (
  <div className="flex items-start gap-4 text-slate-400 group">
    <div className="mt-1 text-emerald-500 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-sm font-medium group-hover:text-slate-200 transition-colors">{text}</span>
  </div>
);

export default SunriseFooter;
