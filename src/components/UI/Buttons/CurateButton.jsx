'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * CurateButton - The standardized primary call-to-action button for the Meditaj platform.
 * Features kinetic width expansion, blurred text resolution, and a rotating spring icon.
 * 
 * @param {string} href - Link destination. If provided, renders as a Link.
 * @param {string} label - Button text.
 * @param {function} onClick - Optional click handler.
 * @param {string} variant - 'primary' (green) or 'secondary' (white). Default is 'primary'.
 * @param {string} className - Additional CSS classes for the container.
 * @param {boolean} isLoading - Shows loading spinner if true.
 * @param {string} type - Button type (e.g., 'submit', 'button').
 */
const CurateButton = ({ 
  href, 
  label, 
  onClick, 
  variant = 'primary', 
  className = '',
  isLoading = false,
  type = 'button'
}) => {
  const isPrimary = variant === 'primary';
  
  const buttonContent = (
    <motion.div 
      className={`
        group relative flex items-center justify-end overflow-hidden rounded-full transition-all
        h-11 w-fit min-w-[44px]
        ${isPrimary 
          ? 'bg-[#1e4a3a] text-white hover:bg-[#163529]' 
          : 'bg-white text-[#1e4a3a] border border-slate-200 hover:bg-emerald-50'}
        ${isLoading ? 'opacity-70 pointer-events-none' : ''}
        ${className}
      `}
    >
      <motion.div 
        initial={{ width: 44 }} 
        whileInView={{ width: "auto" }} 
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
        className="flex items-center h-full px-0 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center w-full min-w-[120px] h-full px-8">
            <Loader2 className="animate-spin" size={18} />
          </div>
        ) : (
          <>
            <motion.span 
              initial={{ opacity: 0, x: 20, filter: "blur(4px)" }} 
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }} 
              className="text-[13px] font-bold whitespace-nowrap pl-6 pr-3 uppercase tracking-wider"
            >
              {label}
            </motion.span>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              className={`
                w-[28px] h-[28px] rounded-full flex items-center justify-center mr-2
                transition-transform duration-500 group-hover:rotate-[-45deg] flex-shrink-0
                ${isPrimary ? 'bg-white text-[#1e4a3a]' : 'bg-[#1e4a3a] text-white'}
              `}
            >
              <ArrowRight size={16} strokeWidth={2.5} />
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );

  if (href && !isLoading) {
    return (
      <Link href={href} onClick={onClick} className="inline-block">
        {buttonContent}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={isLoading} className="inline-block focus:outline-none">
      {buttonContent}
    </button>
  );
};

export default CurateButton;
