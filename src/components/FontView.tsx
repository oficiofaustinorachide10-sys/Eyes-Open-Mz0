/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Type, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FONTS_LIST } from '../utils';

export default function FontView() {
  const [inputText, setInputText] = useState('Olhos Bem Abertos 🇲🇿');
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopy = (font: string) => {
    const formatted = `Fonte: ${font} | Conteúdo: "${inputText}"`;
    navigator.clipboard.writeText(formatted);
    setCopyFeedback(`Copiado estilo "${font}"!`);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neon-cyan/15 pb-4">
        <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase flex items-center gap-2">
          <Type className="w-5 h-5 text-neon-cyan" /> DECORADOR DE FONTES
        </h2>
        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
          Live Type Previewer
        </span>
      </div>

      {/* Input decorator form */}
      <div className="bg-[#090924]/85 border border-neon-cyan/25 rounded-3xl p-6 shadow-2xl space-y-4">
        <label className="block text-neon-cyan font-bold text-xs uppercase tracking-wider">
          Insira seu Texto Personalizado
        </label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escreva algo..."
          className="w-full bg-black/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-3 px-4 text-xs text-white outline-none font-semibold text-center text-sm"
        />
        <p className="text-[10px] text-gray-500 font-semibold text-center italic mt-1">
          O texto digitado acima será atualizado em tempo real nas fontes disponíveis abaixo.
        </p>
      </div>

      {/* Display Grid of Fonts */}
      <div className="space-y-4">
        {FONTS_LIST.map((font) => (
          <div
            key={font}
            className="bg-[#0c0c24] border border-white/5 hover:border-neon-cyan/30 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:scale-101 shadow-lg"
          >
            <div className="truncate text-left flex-1">
              <span className="text-[10px] text-neon-cyan font-mono font-bold uppercase block mb-1.5">{font}</span>
              <p
                style={{ fontFamily: font }}
                className="text-lg md:text-xl font-bold truncate pr-4 text-white leading-relaxed"
              >
                {inputText || 'Digite algo...'}
              </p>
            </div>

            <button
              onClick={() => handleCopy(font)}
              className="w-10 h-10 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan border border-neon-cyan/25 hover:text-black text-neon-cyan flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="Copiar com estilo"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Copy Feed overlay */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-[#00ff88] text-black rounded-full font-bold text-xs shadow-2xl"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{copyFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
