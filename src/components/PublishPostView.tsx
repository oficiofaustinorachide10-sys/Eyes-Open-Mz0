/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Upload, Type, Sparkles, Send, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FONTS_LIST, COLOR_OPTIONS } from '../utils';

interface PublishPostViewProps {
  onPublish: (imgSrc: string | null, text: string, font: string, color: string) => void;
  onCancel: () => void;
}

export default function PublishPostView({ onPublish, onCancel }: PublishPostViewProps) {
  const [text, setText] = useState('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState('Poppins');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imgSrc) {
      alert('Adicione pelo menos um texto ou uma imagem!');
      return;
    }

    setIsPublishing(true);

    // Simulated 0.5s loading delay for state synchronization
    setTimeout(() => {
      setIsPublishing(false);
      setShowSuccess(true);

      // Save post
      onPublish(imgSrc, text.trim(), selectedFont, selectedColor);

      // Reset
      setText('');
      setImgSrc(null);
      setSelectedFont('Poppins');
      setSelectedColor('#ffffff');

      setTimeout(() => {
        setShowSuccess(false);
        onCancel(); // return to feed
      }, 1500);
    }, 500);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      <div className="flex items-center justify-between border-b border-neon-cyan/10 pb-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111130] hover:bg-[#151545] border border-neon-cyan/20 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> VOLTAR AO FEED
        </button>

        <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase">
          👁️ CRIAR NOVA PUBLICAÇÃO
        </h2>
      </div>

      <form onSubmit={handlePublish} className="bg-[#090924]/80 border border-neon-cyan/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* PHOTO SELECTOR */}
        <div>
          <label className="block text-neon-cyan font-bold text-xs uppercase mb-3 tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4" /> Foto de Capa (Opcional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          {imgSrc ? (
            <div className="relative rounded-2xl overflow-hidden border border-neon-cyan/30 aspect-video">
              <img 
                src={imgSrc} 
                alt="Upload Preview" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImgSrc(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:scale-105 transition-all"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-neon-cyan/20 hover:border-neon-cyan/60 rounded-2xl bg-[#111130]/30 hover:bg-neon-cyan/5 text-neon-cyan font-bold text-xs font-orbitron tracking-widest transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-6 h-6 animate-pulse" /> ADICIONAR IMAGEM AO POST
            </button>
          )}
        </div>

        {/* POST TEXT AREA */}
        <div>
          <label className="block text-neon-cyan font-bold text-xs uppercase mb-2 tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4" /> Descrição / Texto do Post
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que estás a pensar hoje?"
            className="w-full h-32 bg-black/45 border border-neon-cyan/30 rounded-2xl p-4 text-sm text-white outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20 resize-none transition-all placeholder:text-gray-600 font-semibold"
            style={{ fontFamily: selectedFont, color: selectedColor }}
          />
        </div>

        {/* CUSTOMIZATION OPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Typography font */}
          <div>
            <label className="block text-neon-cyan font-bold text-xs uppercase mb-2 tracking-wider">
              Estilo de Letra (Fonte)
            </label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full bg-black/60 border border-neon-cyan/30 text-white rounded-xl py-2.5 px-3 text-xs outline-none cursor-pointer"
            >
              {FONTS_LIST.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Color pallet */}
          <div>
            <label className="block text-neon-cyan font-bold text-xs uppercase mb-2 tracking-wider">
              Cor do Texto
            </label>
            <div className="flex gap-2 flex-wrap pt-1.5">
              {COLOR_OPTIONS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setSelectedColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    selectedColor === hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-80 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CORE CTA */}
        <button
          type="submit"
          disabled={isPublishing}
          className="w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 disabled:brightness-50 transition-all rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg shadow-neon-cyan/15 uppercase flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4 stroke-[2.5]" /> {isPublishing ? 'PUBLICANDO...' : 'PUBLICAR NO FEED'}
        </button>
      </form>

      {/* TOAST SUCCESS overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3.5 bg-[#00ff88] text-black font-orbitron font-extrabold text-xs tracking-wider rounded-full shadow-2xl"
          >
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>POST PUBLICADO COM SUCESSO!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
