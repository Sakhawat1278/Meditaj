'use client';
import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ size = "md", color = "emerald", className = "" }) => {
  const isWhite = color === "white";
  const baseColor = isWhite ? "bg-white" : "bg-[#1e4a3a]";
  const mutedColor = isWhite ? "bg-white/40" : "bg-[#1e4a3a]/40";
  
  const sizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-5 h-5",
    xl: "w-12 h-12",
    xxl: "w-8 h-8 lg:w-16 lg:h-16"
  };

  const dotSize = sizes[size] || sizes.md;

  return (
    <div className={`grid grid-cols-2 gap-0.5 ${className}`}>
      <div className={`${dotSize} rounded-full ${baseColor}`} />
      <div className={`${dotSize} rounded-full ${mutedColor}`} />
      <div className={`${dotSize} rounded-full ${mutedColor}`} />
      <div className={`${dotSize} rounded-full ${mutedColor}`} />
    </div>
  );
};

export default Logo;
