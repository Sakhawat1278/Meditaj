'use client';
import React from 'react';
import { m as motion } from 'framer-motion';

/**
 * TextReveal Component
 * Animates text character by character or word by word.
 */
export default function TextReveal({ 
  text, 
  className = "", 
  delay = 0, 
  stagger = 0.02,
  mode = "char" // "char" or "word"
}) {
  const items = mode === "char" ? text.split("") : text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: stagger, 
        delayChildren: delay * i,
        ease: [0.2, 0.65, 0.3, 0.9]
      },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      style={{ display: "flex", flexWrap: "wrap", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={className}
    >
      {items.map((item, index) => (
        <motion.span
          variants={child}
          key={index}
          style={{ 
            display: "inline-block", 
            marginRight: mode === "word" ? "0.25em" : "0px",
            whiteSpace: item === " " ? "pre" : "normal"
          }}
        >
          {item}
        </motion.span>
      ))}
    </motion.h1>
  );
}
