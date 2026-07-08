/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Sparkles, Award, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType } from '../types';

interface ProfileViewProps {
  currentUser: UserType;
  onNavigate: (view: any) => void;
}

export default function ProfileView({ currentUser, onNavigate }: ProfileViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Interaction analytics dataset for the weekly line chart
  const weeklyData = [120, 280, 450, 620, 580, 720, 680];
  const maxVal = 800;
  
  // Custom SVG path drawing
  const svgWidth = 500;
  const svgHeight = 120;
  const padding = 20;

  const getSvgPath = () => {
    const xStep = (svgWidth - padding * 2) / (weeklyData.length - 1);
    const yScale = (svgHeight - padding * 2) / maxVal;

    let path = `M ${padding} ${svgHeight - padding - weeklyData[0] * yScale}`;
    weeklyData.forEach((d, i) => {
      if (i > 0) {
        const x = padding + i * xStep;
        const y = svgHeight - padding - d * yScale;
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  const getSvgPoints = () => {
    const xStep = (svgWidth - padding * 2) / (weeklyData.length - 1);
    const yScale = (svgHeight - padding * 2) / maxVal;

    return weeklyData.map((d, i) => ({
      x: padding + i * xStep,
      y: svgHeight - padding - d * yScale,
      val: d
    }));
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      {/* SECTION 1: USER AVATAR WITH INTEGRATED FLIP CARD */}
      <div className="bg-[#090924]/80 border border-neon-cyan/25 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          {/* Flipped Avatar Wrapper */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-32 h-32 relative cursor-pointer group preserve-3d transition-transform duration-700"
            style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}
          >
            {/* Front side face */}
            <div className="absolute inset-0 rounded-full border-4 border-neon-cyan overflow-hidden shadow-xl shadow-neon-cyan/15 backface-hidden">
              <img 
                src={currentUser.avatar || "https://i.pravatar.cc/150?img=1"} 
                alt={currentUser.nickname} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>

            {/* Back side face */}
            <div className="absolute inset-0 rounded-full border-4 border-neon-magenta bg-[#0d0d26] flex flex-col justify-center items-center text-neon-magenta shadow-xl shadow-neon-magenta/15 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
              <span className="font-orbitron font-extrabold text-xl tracking-wider">PRO</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Diretor</span>
            </div>
          </div>

          <h2 className="text-2xl font-orbitron font-extrabold text-neon-cyan mt-4 tracking-wide flex items-center gap-2">
            {currentUser.nickname}
          </h2>
          
          <p className="text-sm font-semibold text-yellow-400 mt-1 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-4 h-4 text-yellow-400" /> Diretor de Cinema & Produção
          </p>

          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Província de {currentUser.province}
          </p>
        </div>

        {/* Profile Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-b border-neon-cyan/10 py-5 my-6 text-center">
          <div>
            <p className="text-xl font-bold font-mono text-neon-cyan">{currentUser.stats?.likes || 1240}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Gostos</p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-neon-magenta">5.6K</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Visualizações</p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-neon-cyan">{currentUser.stats?.friends || 342}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Amigos</p>
          </div>
        </div>

        {/* Badge and verification */}
        <div className="flex items-center justify-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest">
            Conta Ativa
          </span>
          <span 
            onClick={() => onNavigate('account')}
            className="px-4 py-1.5 rounded-full bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
          >
            Ver Identidade
          </span>
        </div>
      </div>

      {/* SECTION 2: INTERACTION WEEKLY SVG CHART */}
      <div className="bg-[#090924]/80 border border-neon-cyan/25 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-neon-cyan/10 pb-3">
          <h3 className="font-orbitron font-extrabold text-sm tracking-widest text-neon-cyan">
            GRÁFICO DE INTERAÇÃO (7 DIAS)
          </h3>
          <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
            Evolução Semanal
          </span>
        </div>

        {/* Responsive Line Chart */}
        <div className="w-full bg-black/40 border border-neon-cyan/10 rounded-2xl p-4 overflow-hidden relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
            {/* Grid helper lines */}
            <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="rgba(0, 245, 255, 0.05)" strokeDasharray="4 4" />
            <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="rgba(0, 245, 255, 0.05)" strokeDasharray="4 4" />
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(0, 245, 255, 0.1)" />

            {/* Custom SVG Path render */}
            <path
              d={getSvgPath()}
              fill="none"
              stroke="#00f5ff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_#00f5ff]"
            />

            {/* Scatter dots */}
            {getSvgPoints().map((pt, i) => (
              <g key={i} className="group cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#ff00ff"
                  className="stroke-neon-cyan stroke-2 hover:r-7 transition-all"
                />
                {/* Pop hover detail */}
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {pt.val}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* SECTION 3: PROFISSÃO DESCRIPTION DETAIL */}
      <div className="bg-gradient-to-r from-[#0d0d2d] to-[#120524] border border-neon-magenta/20 rounded-3xl p-6 shadow-2xl relative select-none">
        <div className="absolute top-4 right-4 text-neon-magenta">
          <Shield className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h4 className="font-orbitron font-extrabold text-sm text-neon-magenta tracking-widest mb-2 uppercase">
          PERFIL PROFISSIONAL
        </h4>
        <h3 className="text-xl font-bold text-white mb-2 leading-snug">
          Diretor de Cinema Especializado
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed max-w-[420px]">
          Focado no desenvolvimento cinematográfico moçambicano. Planeamento artístico, supervisão de equipas de rodagem, realização e edição de curtas, séries e conteúdos de alto impacto.
        </p>
      </div>
    </div>
  );
}
