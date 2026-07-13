/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export default function ShimmeringBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    // Create 4D stars (golden, amber, chocolate aura)
    interface Star {
      x: number;
      y: number;
      z: number; // depth parameter for 4D effect
      size: number;
      color: string;
      speedZ: number;
      shimmerSpeed: number;
      phase: number;
    }

    const starCount = 80;
    const stars: Star[] = [];

    const colors = [
      'rgba(251, 191, 36, ',  // Amber-400
      'rgba(245, 158, 11, ',  // Amber-500
      'rgba(217, 119, 6, ',   // Amber-600
      'rgba(146, 64, 14, ',   // Chocolate/Amber-800
      'rgba(254, 243, 199, ', // Golden/Yellow-100
    ];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2, // Depth factor
        size: Math.random() * 1.8 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedZ: Math.random() * 0.15 + 0.05,
        shimmerSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radial background aura of deep luxury chocolate / onyx
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.1,
        width / 2,
        height / 2,
        width * 0.9
      );
      grad.addColorStop(0, '#100c09');
      grad.addColorStop(1, '#080504');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render each golden particle
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // 4D physical movement: drift vertically and project based on Depth (Z)
        star.y -= star.speedZ * star.z;
        star.phase += star.shimmerSpeed;

        // Reset stars at the bottom when they drift out
        if (star.y < -10) {
          star.y = height + 10;
          star.x = Math.random() * width;
        }

        // Compute 4D golden brightness oscillation
        const opacity = (Math.sin(star.phase) * 0.4 + 0.6) * star.z * 0.8;
        ctx.fillStyle = `${star.color}${opacity})`;

        // Render star starburst / glowing circle
        ctx.beginPath();
        const sizeFactor = star.size * (1 + Math.sin(star.phase) * 0.2) * (star.z + 0.2);
        ctx.arc(star.x, star.y, sizeFactor, 0, Math.PI * 2);
        ctx.fill();

        // Subtle bloom effect on brighter golden stars
        if (star.z > 0.7 && opacity > 0.6) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(251, 191, 36, ${opacity * 0.15})`;
          ctx.arc(star.x, star.y, sizeFactor * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 block"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
