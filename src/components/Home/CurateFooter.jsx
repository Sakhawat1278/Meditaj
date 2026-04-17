'use client';
import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import CurateButton from '@/components/UI/Buttons/CurateButton';
import Logo from '@/components/UI/Logo';

const CurateFooter = () => {
  const { scrollY } = useScroll();
  
  // Create a spring-smoothed version of the scroll to match the site's physics
  const smoothRotate = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map the smooth scroll to a rotation value (e.g., 0.15 degrees per pixel)
  const rotate = useTransform(smoothRotate, (value) => value * 0.15);

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

  return (
    <footer className="bg-[#1e4a3a] text-white/80 py-8 lg:py-10 selection:bg-emerald-500/30 overflow-hidden">
      <div className="w-full max-w-[1825px] mx-auto px-6 lg:px-12">
        
        {/* Main Content Grid (Company | CTA | Other) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4 items-start mb-6">
          
          {/* Left: Company Links */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Company</h4>
            <nav className="flex flex-col gap-2">
              <FooterLink href="/" label="Home" />
              <FooterLink href="/weight-loss" label="Weight Loss" />
              <FooterLink href="/specialist" label="Conditions" />
              <FooterLink href="/stories" label="Patient Stories" />
              <FooterLink href="/how-it-works" label="How it works" />
            </nav>
            <div className="pt-2">
            </div>
          </div>

          {/* Center: Hero CTA */}
          <div className="flex flex-col items-center text-center lg:px-8">
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white leading-[1.1] mb-6 lg:max-w-md">
              Personalized Health Solutions for Every Stage of Your Journey
            </h2>
            <CurateButton href="/signup" label="Get Started" variant="secondary" />
          </div>

          {/* Right: Other Links */}
          <div className="flex flex-col lg:items-end space-y-4">
            <div className="lg:text-right space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Other</h4>
              <nav className="flex flex-col lg:items-end gap-2">
                <FooterLink href="/terms" label="Terms of Use" />
                <FooterLink href="/privacy" label="Privacy Statement" />
                <FooterLink href="/telehealth" label="Telehealth Consent" />
                <FooterLink href="/contact" label="Contact Us" />
                <FooterLink href="/" label="Curate" />
              </nav>
            </div>
          </div>

        </div>

        {/* Massive Branding Bottom Section */}
        <div className="pt-4 flex flex-col items-center">
          <div className="flex items-center gap-4 lg:gap-6 opacity-5">
            <motion.div style={{ rotate }}>
              <Logo size="xxl" color="white" className="font-bold" />
            </motion.div>
            <h1 className="text-[36px] md:text-[60px] lg:text-[110px] font-black tracking-[-0.05em] uppercase leading-none text-white whitespace-nowrap">
              CURATE HEALTH
            </h1>
          </div>
          
          {/* Copyright Centered at Bottom */}
          <div className="pt-6 relative z-10">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">
              &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

const FooterLink = ({ href, label }) => (
  <Link href={href} className="text-[11px] lg:text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-300">
    {label}
  </Link>
);

export default CurateFooter;
