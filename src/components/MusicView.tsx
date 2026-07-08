/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Music, Volume2, SkipForward, SkipBack, Heart 
} from 'lucide-react';
import { motion } from 'motion/react';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  likes: number;
}

export default function MusicView() {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 't_1', title: 'Marrabenta Beat Master', artist: 'Alex & Banda Beira', duration: '3:45', genre: 'Marrabenta Beat', likes: 124 },
    { id: 't_2', title: 'Maputo Afro-Jazz Sunset', artist: 'Rui de Sousa', duration: '4:12', genre: 'Afro-Jazz', likes: 89 },
    { id: 't_3', title: 'Xigubo Warrior Rhythm', artist: 'Comunidade Cultural Gaza', duration: '5:02', genre: 'Xigubo Tradicional', likes: 256 },
    { id: 't_4', title: 'Matola Synth Wave', artist: 'Cibernautas de Moçambique', duration: '3:20', genre: 'Electro-Moz', likes: 67 }
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [trackProgress, setTrackProgress] = useState(30); // percentages
  const [likedTracks, setLikedTracks] = useState<string[]>(['t_1', 't_3']);

  // Handle auto timeline ticker simulation when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setTrackProgress(0);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setTrackProgress(0);
  };

  const toggleLike = (id: string) => {
    if (likedTracks.includes(id)) {
      setLikedTracks(likedTracks.filter(t => t !== id));
    } else {
      setLikedTracks([...likedTracks, id]);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-neon-cyan/15 pb-4">
        <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase flex items-center gap-2">
          <Music className="w-5 h-5 text-neon-cyan" /> REPRODUTOR DE MÚSICA
        </h2>
        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
          Mozambique Sounds
        </span>
      </div>

      {/* CORE PLAYER INTERFACES */}
      <div className="bg-[#090924]/85 border border-neon-cyan/25 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Track branding & Equalizer */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-neon-cyan via-cyber-purple to-neon-magenta flex items-center justify-center shadow-lg shadow-neon-cyan/10 relative overflow-hidden mb-4">
            <Music className="w-10 h-10 text-white stroke-[2.5]" />
            
            {/* Animated Equalizer Overlay when playing */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-end justify-center gap-1 p-3">
                <span className="w-1.5 bg-neon-cyan rounded-t animate-bounce h-[30%] [animation-duration:0.6s]" />
                <span className="w-1.5 bg-neon-magenta rounded-t animate-bounce h-[65%] [animation-duration:0.8s] [animation-delay:0.1s]" />
                <span className="w-1.5 bg-neon-cyan rounded-t animate-bounce h-[45%] [animation-duration:0.5s] [animation-delay:0.2s]" />
                <span className="w-1.5 bg-neon-magenta rounded-t animate-bounce h-[80%] [animation-duration:0.7s] [animation-delay:0.3s]" />
                <span className="w-1.5 bg-neon-cyan rounded-t animate-bounce h-[20%] [animation-duration:0.9s] [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white truncate max-w-xs">{currentTrack.title}</h3>
          <p className="text-xs font-semibold text-neon-cyan mt-1 uppercase tracking-wider">{currentTrack.artist}</p>
        </div>

        {/* Player Controls sliders */}
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percentage = ((e.clientX - rect.left) / rect.width) * 100;
              setTrackProgress(percentage);
            }}>
              <div 
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all"
                style={{ width: `${trackProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono font-bold">
              <span>0:42</span>
              <span>{currentTrack.duration}</span>
            </div>
          </div>

          {/* Central Trigger Controls */}
          <div className="flex items-center justify-center gap-6">
            <button onClick={handlePrev} className="text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer hover:scale-105 active:scale-95">
              <SkipBack className="w-6 h-6 stroke-[2]" />
            </button>
            
            <button 
              onClick={togglePlay} 
              className="w-14 h-14 rounded-full bg-neon-cyan hover:bg-white text-black flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shadow-neon-cyan/20"
            >
              {isPlaying ? <Pause className="w-6 h-6 stroke-[2.5]" /> : <Play className="w-6 h-6 stroke-[2.5] ml-1" />}
            </button>

            <button onClick={handleNext} className="text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer hover:scale-105 active:scale-95">
              <SkipForward className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          {/* Volume Control bar */}
          <div className="flex items-center gap-3 justify-center max-w-xs mx-auto pt-2 border-t border-white/5">
            <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-neon-cyan h-1 cursor-pointer bg-white/10 outline-none"
            />
            <span className="text-[10px] font-mono font-bold text-gray-400 shrink-0 w-6">{volume}%</span>
          </div>
        </div>
      </div>

      {/* TRACKS PLAYLIST SELECTION LIST */}
      <div className="bg-[#090924]/85 border border-neon-cyan/25 rounded-3xl p-5 shadow-2xl space-y-4">
        <h4 className="font-orbitron font-extrabold text-xs text-neon-cyan tracking-wider uppercase border-b border-neon-cyan/15 pb-2">
          Lista de Músicas
        </h4>

        <div className="space-y-2">
          {tracks.map((tr, idx) => {
            const isCurrent = idx === currentTrackIndex;
            const isLiked = likedTracks.includes(tr.id);
            return (
              <div
                key={tr.id}
                onClick={() => {
                  setCurrentTrackIndex(idx);
                  setTrackProgress(0);
                  setIsPlaying(true);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-neon-cyan/15 border-neon-cyan shadow-md shadow-neon-cyan/5'
                    : 'bg-black/30 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-gray-500 font-mono w-4">{idx + 1}</span>
                  <div className="truncate text-left">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-neon-cyan' : 'text-white'}`}>{tr.title}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{tr.artist} • <span className="text-gray-500">{tr.genre}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-gray-500">{tr.duration}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(tr.id);
                    }}
                    className={`cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                      isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
