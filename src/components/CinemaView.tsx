/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Film, Volume2, Maximize, PlayCircle, Eye, Star 
} from 'lucide-react';
import { motion } from 'motion/react';

interface Movie {
  id: string;
  title: string;
  director: string;
  year: string;
  duration: string;
  plot: string;
  rating: number;
  banner: string;
}

export default function CinemaView() {
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: 'm_1',
      title: 'Amanhecer no Limpopo',
      director: 'Alex Manuel Zandamel',
      year: '2025',
      duration: '1h 14m',
      plot: 'Uma narrativa poética sobre a fauna e as comunidades ribeirinhas que habitam as margens do rio Limpopo, revelando tradições esquecidas e canções sagradas.',
      rating: 4.8,
      banner: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'm_2',
      title: 'Sons e Silêncio de Maputo',
      director: 'Rui de Sousa & Alex MZ',
      year: '2026',
      duration: '45m',
      plot: 'Um documentário sensorial focado na pulsação noturna da capital, desde os ensaios de Marrabenta até o silêncio reflexivo do amanhecer nas praias.',
      rating: 4.9,
      banner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'post_photo_3',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600',
      title: 'Zambézia Profunda',
      director: 'Oficio MZ',
      views: 450,
      year: '2025'
    } as any // Shared reference placeholder fallback
  ]);

  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(15); // Percentage
  const [theaterGlow, setTheaterGlow] = useState(true);

  // Playback timer simulation
  useEffect(() => {
    if (!isVideoPlaying) return;
    const interval = setInterval(() => {
      setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 0.4));
    }, 500);
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

  const currentMovie = movies[selectedMovieIndex] || {
    title: 'Zambézia Profunda',
    director: 'Oficio MZ',
    year: '2025',
    duration: '52m',
    plot: 'Explorando as ricas manifestações artísticas, danças tradicionais e as dinâmicas sociais da província da Zambézia em Moçambique.',
    rating: 4.7,
    banner: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600'
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-neon-cyan/15 pb-4">
        <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase flex items-center gap-2">
          <Film className="w-5 h-5 text-neon-cyan" /> CINEMA DIGITAL MOÇAMBICANO
        </h2>
        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
          Sala de Cinema
        </span>
      </div>

      {/* SECTION 1: THEATER SCREEN SIMULATOR */}
      <div className="space-y-4">
        {/* Cinema Monitor Box with ambient glow option */}
        <div 
          className={`relative aspect-video rounded-3xl overflow-hidden border-2 border-neon-cyan/40 bg-black transition-all duration-1000 ${
            theaterGlow && isVideoPlaying ? 'shadow-2xl shadow-neon-cyan/20 ring-4 ring-neon-cyan/5' : 'shadow-xl'
          }`}
        >
          {/* Active film display */}
          <img 
            src={currentMovie.banner || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600'} 
            alt="Cinema Screen" 
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-all duration-700 select-none pointer-events-none ${
              isVideoPlaying ? 'brightness-75 scale-102 blur-2xs' : 'brightness-50'
            }`}
          />

          {/* Central Play Trigger Button when paused */}
          {!isVideoPlaying && (
            <button 
              onClick={() => setIsVideoPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors group cursor-pointer z-10"
            >
              <PlayCircle className="w-16 h-16 text-neon-cyan stroke-[1.5] group-hover:scale-110 active:scale-95 transition-transform drop-shadow-[0_0_12px_#00f5ff]" />
            </button>
          )}

          {/* Player dashboard overlays */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-8 flex flex-col gap-3 z-15">
            {/* ProgressBar */}
            <div className="h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const val = ((e.clientX - rect.left) / rect.width) * 100;
              setVideoProgress(val);
            }}>
              <div 
                className="h-full bg-neon-cyan rounded-full transition-all"
                style={{ width: `${videoProgress}%` }}
              />
            </div>

            {/* Controls panel */}
            <div className="flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)} 
                  className="text-white hover:text-neon-cyan transition-colors cursor-pointer"
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="font-mono text-[10px] text-gray-400">12:35 / {currentMovie.duration || '1h 12m'}</span>
              </div>

              {/* Ambient glows toggle */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setTheaterGlow(!theaterGlow)} 
                  className={`text-[9px] font-bold font-orbitron px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                    theaterGlow ? 'bg-neon-cyan/20 border-neon-cyan text-white' : 'bg-transparent border-gray-600 text-gray-500'
                  }`}
                >
                  Glow: {theaterGlow ? 'ON' : 'OFF'}
                </button>
                <Maximize className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" onClick={() => alert('Modo ecrã inteiro simulado!')} />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Movie Description Details */}
        <div className="bg-[#090924] border border-neon-cyan/20 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neon-cyan/10 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{currentMovie.title}</h3>
              <p className="text-[10px] font-bold text-neon-cyan uppercase mt-0.5 tracking-wider">Realizador: {currentMovie.director || 'Alex MZ'}</p>
            </div>
            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold px-2 py-1 rounded-lg text-xs">
              <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-none" /> {currentMovie.rating || 4.8}
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed font-semibold">
            {currentMovie.plot || 'Uma narrativa profunda sobre o folclore moçambicano.'}
          </p>
        </div>
      </div>

      {/* SECTION 2: OTHER AVAILABLE MOVIES LIST */}
      <div className="bg-[#090924] border border-neon-cyan/25 rounded-3xl p-5 shadow-2xl space-y-4">
        <h4 className="font-orbitron font-extrabold text-xs text-neon-cyan tracking-wider uppercase border-b border-neon-cyan/15 pb-2">
          Filmes em Exibição
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {movies.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => {
                setSelectedMovieIndex(idx);
                setVideoProgress(0);
                setIsVideoPlaying(true);
              }}
              className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all items-center ${
                idx === selectedMovieIndex
                  ? 'bg-neon-cyan/15 border-neon-cyan'
                  : 'bg-black/30 border-white/5 hover:border-white/15'
              }`}
            >
              <img 
                src={m.banner || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600'} 
                alt={m.title}
                referrerPolicy="no-referrer"
                className="w-16 aspect-video rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold truncate text-white leading-tight">{m.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{m.director || 'Alex MZ'} ({m.year})</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
