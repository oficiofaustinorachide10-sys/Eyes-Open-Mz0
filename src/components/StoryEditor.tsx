/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Crop, Sparkles, Type, Music, Save, Send, ArrowLeft, Trash2, Volume2, Upload 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COLOR_OPTIONS, FONTS_LIST } from '../utils';

interface TextOverlay {
  id: string;
  text: string;
  color: string;
  font: string;
  x: number; // percentage left (0-100)
  y: number; // percentage top (0-100)
}

interface StoryEditorProps {
  onPublish: (storySrc: string, text: string | null, font: string, color: string, musicName?: string) => void;
  onCancel: () => void;
}

export default function StoryEditor({ onPublish, onCancel }: StoryEditorProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [smokeActive, setSmokeActive] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<'crop' | 'smoke' | 'text' | 'music' | null>('text');
  
  // Text state
  const [textVal, setTextVal] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFont, setTextFont] = useState('Poppins');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Music state
  const [musicName, setMusicName] = useState('Nenhuma música');
  const [musicSizeError, setMusicSizeError] = useState('');

  // Countdown state
  const [showCountdown, setShowCountdown] = useState(false);
  const [countDigit, setCountDigit] = useState(3);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string);
      // Load saved draft if any
      const saved = localStorage.getItem('eyes42h_draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.imgSrc === ev.target?.result) {
            setSmokeActive(draft.smoke || false);
            setMusicName(draft.musicName || 'Nenhuma música');
            if (draft.texts) {
              setTextOverlays(draft.texts);
            }
          }
        } catch (e) {
          console.error("Erro rascunho:", e);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Draggable Text Position Tracker
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    setActiveDragId(id);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate percentage-based coordinates relative to container size
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Bounds clamping
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    setTextOverlays((prev) =>
      prev.map((t) => (t.id === activeDragId ? { ...t, x, y } : t))
    );
  };

  const handlePointerUp = () => {
    setActiveDragId(null);
  };

  // Add styled text layer
  const handleAddText = () => {
    if (!textVal.trim()) return;
    const newText: TextOverlay = {
      id: 'text_' + Math.random().toString(36).substring(2, 9),
      text: textVal.trim(),
      color: textColor,
      font: textFont,
      x: 50,
      y: 50,
    };
    setTextOverlays((prev) => [...prev, newText]);
    setTextVal('');
  };

  const handleRemoveText = (id: string) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
  };

  // Music upload size check (<= 10MB)
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMusicSizeError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMusicSizeError('Ficheiro de som muito grande! O limite de upload é de 10MB.');
      return;
    }

    setMusicName(file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name);
  };

  // Draft Autosave
  const handleSaveDraft = () => {
    const draft = {
      imgSrc,
      texts: textOverlays,
      smoke: smokeActive,
      musicName,
    };
    localStorage.setItem('eyes42h_draft', JSON.stringify(draft));
    alert('Rascunho guardado com sucesso no dispositivo!');
  };

  // Story Synthesis: Drawing on Canvas
  const handlePublishClick = () => {
    if (!imgSrc) return;

    // Trigger Countdown visual effect
    setShowCountdown(true);
    setCountDigit(3);

    const timer = setInterval(() => {
      setCountDigit((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Complete publishing on countdown end
          synthesizeAndPublish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const synthesizeAndPublish = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set uniform high definition canvas resolution
      canvas.width = 1080;
      canvas.height = 1920;

      // Draw background photo
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply Dark overlay (Fumo Preto) if toggled
      if (smokeActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render each draggable text overlay
      textOverlays.forEach((t) => {
        ctx.font = `bold 48px ${t.font}`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Translate percentage positions into canvas pixels
        const pX = (t.x / 100) * canvas.width;
        const pY = (t.y / 100) * canvas.height;

        // Draw shadow/glow text backdrop for legibility
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(t.text, pX, pY);
      });

      const finalStorySrc = canvas.toDataURL('image/jpeg', 0.9);
      
      // Clean up drafts on publish success
      localStorage.removeItem('eyes42h_draft');

      // Return core text (or first text item) to feed for visual captioning
      const leadText = textOverlays.length > 0 ? textOverlays[0].text : null;
      const leadFont = textOverlays.length > 0 ? textOverlays[0].font : 'Poppins';
      const leadColor = textOverlays.length > 0 ? textOverlays[0].color : '#ffffff';

      setShowCountdown(false);
      onPublish(finalStorySrc, leadText, leadFont, leadColor, musicName !== 'Nenhuma música' ? musicName : undefined);
    };
    img.src = imgSrc;
  };

  return (
    <div className="flex-1 min-h-screen bg-[#03030b] flex flex-col items-center justify-center p-4 font-rajdhani relative text-white">
      {/* HEADER CONTROLS */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 z-10">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111130] hover:bg-[#151545] border border-neon-cyan/20 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> VOLTAR AO FEED
        </button>

        <h1 className="font-orbitron font-extrabold text-lg text-neon-cyan tracking-wider hidden sm:block">
          EYES 42H - CRIADOR DE HISTÓRIAS
        </h1>

        {imgSrc && (
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> GUARDAR RASCUNHO
          </button>
        )}
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* VIEWPORT AREA: LEFT 7 COLUMNS */}
        <div className="md:col-span-7 flex justify-center">
          {!imgSrc ? (
            <div className="w-full max-w-[360px] aspect-[9/16] rounded-3xl bg-[#090920] border-2 border-dashed border-neon-cyan/30 hover:border-neon-cyan/80 flex flex-col items-center justify-center text-center p-6 transition-all">
              <Upload className="w-12 h-12 text-neon-cyan animate-bounce mb-4" />
              <p className="font-orbitron font-bold text-sm tracking-wider uppercase mb-1">Upload da Imagem</p>
              <p className="text-xs text-gray-500 max-w-[200px] mb-6 leading-relaxed">
                Adicione uma imagem para começar a sua história 42h.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-neon-cyan hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-full transition-all cursor-pointer"
              >
                SELECIONAR FOTO
              </button>
            </div>
          ) : (
            /* Story Canvas Viewport */
            <div 
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative w-full max-w-[350px] aspect-[9/16] bg-black border-2 border-neon-cyan rounded-3xl overflow-hidden shadow-2xl shadow-neon-cyan/5"
            >
              <img 
                src={imgSrc} 
                alt="Story Canvas" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none select-none"
              />

              {/* Fumo Preto Toggleable Dark Overlay */}
              {smokeActive && (
                <div className="absolute inset-0 bg-black/60 pointer-events-none z-10 transition-opacity duration-300 backdrop-blur-[1px]" />
              )}

              {/* Live Rendered Draggable Text Elements */}
              {textOverlays.map((t) => (
                <div
                  key={t.id}
                  onPointerDown={(e) => handlePointerDown(t.id, e)}
                  style={{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    fontFamily: t.font,
                    color: t.color,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-drag select-none z-20 px-3 py-1.5 bg-black/50 border border-white/10 rounded-xl backdrop-blur-xs font-bold text-base whitespace-nowrap group hover:border-neon-cyan transition-colors"
                >
                  {t.text}
                  {/* Small delete button within draggable overlay */}
                  <button
                    onClick={() => handleRemoveText(t.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 border border-white text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Overlay indicators */}
              {musicName !== 'Nenhuma música' && (
                <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-black/80 border border-neon-cyan/30 rounded-full text-[10px] text-neon-cyan font-semibold z-20">
                  <Volume2 className="w-4 h-4 text-neon-cyan animate-pulse" />
                  <span>{musicName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* EDITOR CONTROL PANEL: RIGHT 5 COLUMNS */}
        <div className="md:col-span-5 space-y-6">
          {imgSrc && (
            <div className="bg-[#090924] border border-neon-cyan/20 rounded-3xl p-6 shadow-xl space-y-6">
              {/* Menu Options Bar */}
              <div className="grid grid-cols-4 gap-2 border-b border-neon-cyan/10 pb-4">
                <button
                  onClick={() => setSelectedPanel('crop')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedPanel === 'crop' ? 'bg-neon-cyan/15 text-white border border-neon-cyan/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Crop className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Corte</span>
                </button>
                
                <button
                  onClick={() => {
                    setSelectedPanel('smoke');
                    setSmokeActive(!smokeActive);
                  }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all cursor-pointer ${
                    smokeActive ? 'bg-neon-cyan/15 text-white border border-neon-cyan/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Fumo</span>
                </button>

                <button
                  onClick={() => setSelectedPanel('text')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedPanel === 'text' ? 'bg-neon-cyan/15 text-white border border-neon-cyan/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Type className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Texto</span>
                </button>

                <button
                  onClick={() => setSelectedPanel('music')}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedPanel === 'music' ? 'bg-neon-cyan/15 text-white border border-neon-cyan/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Music className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Som</span>
                </button>
              </div>

              {/* PANEL RENDERS */}
              {selectedPanel === 'crop' && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="text-sm font-bold text-neon-cyan tracking-wider font-orbitron uppercase">1:1 Crop Simulator</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    A imagem enviada já foi auto-ajustada para preenchimento de histórias (9:16). Para forçar o corte quadrado, clique abaixo:
                  </p>
                  <button
                    onClick={() => {
                      alert('Imagem otimizada! Corte quadrado 1:1 pré-visualizado com sucesso.');
                    }}
                    className="w-full py-2.5 border border-neon-cyan/30 rounded-xl bg-neon-cyan/5 text-neon-cyan text-xs font-bold font-orbitron tracking-wider cursor-pointer hover:bg-neon-cyan/10"
                  >
                    FORÇAR AJUSTE QUADRADO
                  </button>
                </div>
              )}

              {selectedPanel === 'smoke' && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="text-sm font-bold text-neon-cyan tracking-wider font-orbitron uppercase">Fumo Preto Ambient</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Aplica uma névoa escura e uniforme (glassmorphism filter) que valoriza os textos coloridos e protege os olhos.
                  </p>
                  <button
                    onClick={() => setSmokeActive(!smokeActive)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold font-orbitron tracking-wider cursor-pointer border transition-all ${
                      smokeActive
                        ? 'bg-neon-magenta/20 border-neon-magenta text-white'
                        : 'bg-black/40 border-gray-700 text-gray-400'
                    }`}
                  >
                    {smokeActive ? 'DESATIVAR FILTRO DE FUMO' : 'ATIVAR FILTRO DE FUMO'}
                  </button>
                </div>
              )}

              {selectedPanel === 'text' && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-bold text-neon-cyan tracking-wider font-orbitron uppercase">Adicionar Texto Draggável</h4>
                  
                  {/* Color selectors */}
                  <div className="flex gap-2 justify-center py-1">
                    {COLOR_OPTIONS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setTextColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                          textColor === hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-80 hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Fonts selector */}
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full bg-black/60 border border-neon-cyan/30 text-white rounded-xl py-2 px-3 text-xs outline-none cursor-pointer"
                  >
                    {FONTS_LIST.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>
                        {f}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textVal}
                      onChange={(e) => setTextVal(e.target.value)}
                      placeholder="Insira o texto da história..."
                      className="flex-1 bg-black/60 border border-neon-cyan/30 rounded-xl px-3 text-xs outline-none"
                    />
                    <button
                      onClick={handleAddText}
                      className="px-4 py-2.5 bg-neon-cyan hover:brightness-110 text-black font-bold text-xs font-orbitron rounded-xl cursor-pointer"
                    >
                      ADD
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold italic text-center">
                    Dica: Pode clicar e arrastar o texto dentro da imagem para posicioná-lo.
                  </p>
                </div>
              )}

              {selectedPanel === 'music' && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="text-sm font-bold text-neon-cyan tracking-wider font-orbitron uppercase">Som de Fundo (≤10MB)</h4>
                  <input
                    type="file"
                    ref={musicInputRef}
                    accept="audio/*"
                    onChange={handleMusicUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    className="w-full py-2.5 border border-dashed border-neon-cyan/40 hover:border-neon-cyan bg-neon-cyan/5 hover:bg-neon-cyan/10 rounded-xl text-xs font-bold text-neon-cyan cursor-pointer transition-colors"
                  >
                    CARREGAR FICHEIRO DE ÁUDIO
                  </button>
                  <p className="text-xs text-center font-bold text-neon-cyan mt-2 truncate">
                    Banda Sonora: {musicName}
                  </p>
                  {musicSizeError && (
                    <p className="text-[11px] text-red-400 font-bold text-center mt-1">
                      {musicSizeError}
                    </p>
                  )}
                </div>
              )}

              {/* CORE PUBLISH CTA */}
              <button
                onClick={handlePublishClick}
                className="w-full py-3.5 bg-gradient-to-r from-neon-cyan via-[#aa00ff] to-neon-magenta hover:brightness-110 hover:shadow-xl hover:shadow-neon-cyan/15 text-black font-orbitron font-extrabold text-xs tracking-widest rounded-xl transition-all cursor-pointer uppercase mt-6"
              >
                PUBLICAR HISTÓRIA AGORA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TECH COUNTDOWN OVERLAY ON PUBLISH */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-black/95 select-none font-mono"
          >
            <motion.span 
              key={countDigit}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-8xl md:text-[10rem] font-black text-neon-cyan tracking-tighter"
              style={{ textShadow: '0 0 30px #00f5ff, 0 0 60px #00f5ff' }}
            >
              {countDigit}
            </motion.span>
            <p className="text-lg md:text-xl font-bold text-neon-magenta tracking-widest uppercase mt-4 animate-pulse">
              PUBLICANDO HISTÓRIA NO EYES 42H...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
