'use client';
import React, { useRef, useState } from 'react';
import { m as motion } from 'framer-motion';

/**
 * Magnetic Component
 * Wraps an element and adds a "magnetic" pull effect towards the cursor.
 * Ideal for buttons and icons.
 */
export default function Magnetic({ children, strength = 0.5 }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    
    // Calculate distance from center
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    // Set position based on strength
    setPosition({ x: x * strength, y: y * strength });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ position: 'relative' }}
    >
      {children}
    </motion.div>
  );
}
