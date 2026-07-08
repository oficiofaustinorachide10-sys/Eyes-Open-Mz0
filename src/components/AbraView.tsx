/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, Database, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AbraView() {
  const [telemetryVal, setTelemetryVal] = useState(65);
  const [isScanActive, setIsScanActive] = useState(false);
  const [scanResult, setScanResult] = useState('');

  const triggerScan = () => {
    setIsScanActive(true);
    setScanResult('');
    
    // Simulate real scanning analysis with delay
    setTimeout(() => {
      setIsScanActive(false);
      const analyses = [
        'CONDIÇÃO EXCELENTE: A produção artística moçambicana cresceu 32% no último trimestre.',
        'ALERTA DE SEGURANÇA: Mantenha as suas chaves de acesso ativas e seu nickname verificado.',
        'SISTEMA INTEGRADO: 1,424 cineastas conectados na província de Maputo Cidade.',
        'RELAÇÃO DE FEED: O engajamento com histórias do Eyes 42h subiu para uma média diária de 89%.',
        'ESTADO DE REDE: Rede de comunicações e conexões offline totalmente operacional no seu dispositivo.'
      ];
      setScanResult(analyses[Math.floor(Math.random() * analyses.length)]);
    }, 1200);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-neon-cyan/15 pb-4">
        <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase flex items-center gap-2">
          <Eye className="w-5 h-5 text-neon-cyan" /> CAMPANHA ABRA OS OLHOS
        </h2>
        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
          Telemetry Dials
        </span>
      </div>

      {/* SECTION 1: INTERACTIVE TECH DIAL LOG */}
      <div className="bg-[#090924]/85 border border-neon-cyan/25 rounded-3xl p-6 shadow-2xl space-y-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-neon-cyan/20 rounded-tl-3xl pointer-events-none" />

        <div className="flex justify-center my-2">
          {/* Cyber Eye Circle Dials */}
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-neon-cyan/30 flex items-center justify-center relative animate-spin [animation-duration:15s]">
            <div className="w-24 h-24 rounded-full border-2 border-double border-neon-magenta/50 flex items-center justify-center animate-spin [animation-duration:6s] [animation-direction:reverse]">
              <Eye className="w-12 h-12 text-neon-cyan stroke-[1.5] drop-shadow-[0_0_8px_#00f5ff]" />
            </div>
          </div>
        </div>

        <h3 className="font-orbitron font-extrabold text-xl text-white tracking-wide leading-tight uppercase">
          Sua Visão é a Nossa Missão
        </h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
          Abra os Olhos é uma campanha coletiva de fomento ao cinema, fotografia e artes digitais independentes em Moçambique. Conecte-se com cineastas locais, partilhe ideias e publique sua perspetiva.
        </p>

        {/* Telemetry Dial Slider */}
        <div className="bg-black/30 border border-neon-cyan/15 rounded-2xl p-4 max-w-xs mx-auto">
          <label className="block text-[10px] font-bold text-neon-cyan uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
            <TrendingUp className="w-4 h-4 text-neon-cyan" /> Telemetria de Engajamento
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={telemetryVal}
            onChange={(e) => setTelemetryVal(Number(e.target.value))}
            className="w-full accent-neon-cyan cursor-pointer h-1.5 bg-white/10 rounded-full"
          />
          <span className="block font-mono text-sm font-bold text-white mt-1.5">{telemetryVal}% Potencial</span>
        </div>
      </div>

      {/* SECTION 2: LIVE SIMULATION SCANNER */}
      <div className="bg-[#090924]/85 border border-neon-cyan/25 rounded-3xl p-5 shadow-2xl space-y-4">
        <h4 className="font-orbitron font-extrabold text-xs text-neon-cyan tracking-wider uppercase border-b border-neon-cyan/15 pb-2">
          Analisador de Conexões Locais
        </h4>
        
        <p className="text-xs text-gray-400 leading-relaxed">
          Inicie um rastreio rápido para analisar as estatísticas de tráfego, uploads de histórias 42h e engajamento da rede local na sua província:
        </p>

        <button
          onClick={triggerScan}
          disabled={isScanActive}
          className="w-full py-2.5 bg-neon-cyan hover:bg-white text-black font-orbitron font-extrabold text-xs tracking-widest rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-2"
        >
          <Database className="w-4 h-4 text-black animate-pulse" /> {isScanActive ? 'Rastreando Rede...' : 'Correr Rastreio de Rede'}
        </button>

        {/* Scan outcome box */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-black/40 border border-neon-cyan/20 p-4 rounded-2xl flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-[#00ff88] shrink-0 mt-0.5" />
              <p className="text-xs text-[#00ff88] font-bold leading-relaxed">{scanResult}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 3: ALERTA DE CAMPANHA DESCRIPTION */}
      <div className="bg-gradient-to-r from-[#0d0d2d] to-[#120524] border border-neon-magenta/20 rounded-3xl p-6 shadow-2xl relative select-none">
        <div className="absolute top-4 right-4 text-neon-magenta">
          <ShieldAlert className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h4 className="font-orbitron font-extrabold text-sm text-neon-magenta tracking-widest mb-2 uppercase">
          Diretriz de Segurança
        </h4>
        <h3 className="text-xl font-bold text-white mb-2 leading-snug">
          Mantenha Sua Visão Autêntica
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed max-w-[420px]">
          Fique atento a cópias não autorizadas ou reproduções de baixo valor. A rede do Eyes Open MZ preserva a autoria das suas publicações e o histórico de suas conquistas no dispositivo local.
        </p>
      </div>
    </div>
  );
}
