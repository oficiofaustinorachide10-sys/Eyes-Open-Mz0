/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface LeafLogoProps {
  className?: string;
}

export default function LeafLogo({ className = "w-16 h-16" }: LeafLogoProps) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      className={`relative flex items-center justify-center ${className}`}
    >
      <svg 
        viewBox="0 0 120 100" 
        className="w-full h-full filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* First Leaf: Green, left side, angled left */}
        <path
          d="M32 75 C 22 45, 42 35, 55 25 C 48 50, 38 65, 32 75 Z"
          fill="#10b981"
          opacity="0.95"
        />
        {/* Central vein for green leaf */}
        <path 
          d="M32 75 Q 43 53 55 25" 
          stroke="#065f46" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />

        {/* Second Leaf: Red, middle, straight up */}
        <path
          d="M60 85 C 46 55, 50 40, 60 15 C 70 40, 74 55, 60 85 Z"
          fill="#ef4444"
          opacity="0.95"
        />
        {/* Central vein for red leaf */}
        <path 
          d="M60 85 L 60 15" 
          stroke="#991b1b" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />

        {/* Third Leaf: Blue, right side, angled right */}
        <path
          d="M88 75 C 98 45, 78 35, 65 25 C 72 50, 82 65, 88 75 Z"
          fill="#3b82f6"
          opacity="0.95"
        />
        {/* Central vein for blue leaf */}
        <path 
          d="M88 75 Q 77 53 65 25" 
          stroke="#1e40af" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
      </svg>
    </motion.div>
  );
}
