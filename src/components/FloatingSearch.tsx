/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock, MapPin, UserCheck, Sparkles, User, UserPlus, HelpCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface FloatingSearchProps {
  currentUser: UserType;
  users: UserType[];
  onSelectUser: (user: UserType) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

interface SearchHistoryItem {
  id: string;
  userId: string;
  fullname: string;
  nickname: string;
  avatar: string;
  province: string;
  timestamp: number;
}

export function FloatingSearch({
  currentUser,
  users,
  onSelectUser,
  isOpen,
  onOpen,
  onClose
}: FloatingSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load History from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eyesopen_search_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading search history:', e);
    }
  }, []);

  // 2. Setup 60s Inactivity Timer
  const resetInactivityTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isOpen) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 60000); // 60 seconds
    }
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, query]);

  // 3. Focus input when search opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      // Small timeout to allow framer motion mount before trigger focus (helps mobile keyboards)
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // 4. Swipe from right edge to open
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = Math.abs(startY - endY);

        // Check if swipe started in the rightmost 15% of the viewport
        const isRightEdge = startX > window.innerWidth * 0.85;

        // Valid swipe left: moved at least 50px horizontally, vertical deviation < 80px
        if (isRightEdge && diffX > 50 && diffY < 80) {
          onOpen();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onOpen]);

  // 5. Live Search Filter as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const term = query.toLowerCase().trim();
    // Search excluding current logged-in user
    const filtered = users.filter((u) => {
      if (u.id === currentUser.id) return false;
      const matchName = u.fullname?.toLowerCase().includes(term) || 
                        `${u.firstname} ${u.surname}`.toLowerCase().includes(term);
      const matchNick = u.nickname?.toLowerCase().includes(term);
      const matchProv = u.province?.toLowerCase().includes(term);
      return matchName || matchNick || matchProv;
    });

    setResults(filtered);
  }, [query, users, currentUser.id]);

  // 6. Handle selection of a user (add to history & open profile)
  const handleSelectUser = (user: UserType) => {
    // Add to history
    const newItem: SearchHistoryItem = {
      id: 'hist_' + Date.now() + Math.random().toString(36).substring(2, 7),
      userId: user.id,
      fullname: user.fullname || `${user.firstname} ${user.surname}`,
      nickname: user.nickname,
      avatar: user.avatar,
      province: user.province,
      timestamp: Date.now()
    };

    // Keep unique user entries in history, putting the newest on top
    const updatedHistory = [
      newItem,
      ...history.filter(item => item.userId !== user.id)
    ].slice(0, 8); // Keep top 8 recent searches

    setHistory(updatedHistory);
    localStorage.setItem('eyesopen_search_history', JSON.stringify(updatedHistory));

    // Open profile details modal
    onSelectUser(user);
    onClose();
  };

  // 7. Remove single item from history
  const handleRemoveHistoryItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== itemId);
    setHistory(updated);
    localStorage.setItem('eyesopen_search_history', JSON.stringify(updated));
    resetInactivityTimer();
  };

  // 8. Clear all history
  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('eyesopen_search_history');
    resetInactivityTimer();
  };

  return (
    <>
      {/* Dynamic Floating Touch Handle on the right edge */}
      {!isOpen && (
        <div
          onClick={onOpen}
          className="fixed right-0 top-1/2 -translate-y-1/2 w-3.5 h-24 bg-neon-cyan/20 hover:bg-neon-cyan/40 hover:w-5 border-l border-y border-neon-cyan/30 rounded-l-2xl z-[1000] cursor-pointer shadow-[0_0_15px_rgba(0,245,255,0.15)] transition-all flex flex-col items-center justify-center group active:scale-95"
          title="Deslize para a esquerda ou clique para procurar amigos"
        >
          <div className="text-[8px] font-orbitron font-extrabold text-neon-cyan tracking-widest writing-mode-vertical uppercase select-none flex items-center gap-1">
            <span className="animate-pulse">◀</span> BUSCAR
          </div>
          {/* Edge Tooltip */}
          <div className="absolute right-6 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all bg-[#050518] border border-neon-cyan/30 px-3 py-1.5 rounded-xl text-[10px] font-orbitron font-bold text-white whitespace-nowrap shadow-xl">
            Arraste ou clique para procurar amigos em Moçambique 🇲🇿
          </div>
        </div>
      )}

      {/* Floating Search Sheet / Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[40000] flex flex-col items-center justify-start p-4 md:p-6"
            onClick={onClose}
          >
            {/* Draggable Search Panel */}
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(event, info) => {
                // If dragged down by more than 100px or quick swipe down, close
                if (info.offset.y > 100 || info.velocity.y > 150) {
                  onClose();
                }
              }}
              onClick={(e) => {
                e.stopPropagation(); // Avoid closing when clicking inside card
                resetInactivityTimer();
              }}
              className="bg-[#050518] border border-neon-cyan/30 text-white w-full max-w-lg rounded-3xl p-5 shadow-2xl shadow-neon-cyan/15 relative overflow-hidden select-none font-rajdhani mt-8 md:mt-16"
            >
              {/* Dynamic Top Glow border based on state */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-yellow-400 to-neon-magenta" />

              {/* Dismiss Drag Indicator */}
              <div className="flex flex-col items-center cursor-grab active:cursor-grabbing pb-3">
                <div className="w-12 h-1 bg-white/20 hover:bg-neon-cyan/60 rounded-full transition-all" />
                <span className="text-[8px] font-orbitron font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Arrastar para baixo para fechar
                </span>
              </div>

              {/* Search Box Form */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-neon-cyan animate-pulse" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Procure por nome, nickname ou província..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-semibold placeholder:text-gray-500 text-white focus:outline-none focus:border-neon-cyan/60 focus:bg-white/[0.06] transition-all font-rajdhani"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Body Content: Search Results OR History log */}
                <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-4 pt-1">
                  {query.trim().length > 0 ? (
                    /* Search results view */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-orbitron font-extrabold text-neon-cyan tracking-wider uppercase px-1">
                        <span>RESULTADOS ENCONTRADOS ({results.length})</span>
                        <span className="text-[8px] text-yellow-400">BUSCA GLOBAL ACTIVADA</span>
                      </div>

                      {results.length > 0 ? (
                        <div className="space-y-1.5">
                          {results.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon-cyan/20 hover:bg-neon-cyan/[0.03] transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.avatar || 'https://i.pravatar.cc/80?img=1'}
                                  alt={user.nickname}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-full border border-white/10 group-hover:border-neon-cyan/50 object-cover"
                                />
                                <div className="text-left">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs font-bold text-white group-hover:text-neon-cyan transition-colors">
                                      {user.fullname || `${user.firstname} ${user.surname}`}
                                    </span>
                                    {user.isVIP && (
                                      <span className="px-1 py-0.2 bg-yellow-400/10 border border-yellow-400/20 text-[7px] text-yellow-400 font-bold rounded uppercase">
                                        VIP
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400 block font-semibold">
                                    @{user.nickname}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-right">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
                                  <MapPin className="w-3 h-3 text-neon-cyan" /> {user.province}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl space-y-2">
                          <p className="text-xs text-gray-500 font-semibold italic">
                            Nenhum criador encontrado para "{query}".
                          </p>
                          <p className="text-[9px] text-gray-600 font-bold uppercase">
                            Tente pesquisar províncias como "Maputo", "Sofala", "Nampula"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Search History log view */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-orbitron font-extrabold tracking-wider uppercase px-1">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neon-cyan" /> CONSULTAS RECENTES
                        </span>
                        {history.length > 0 && (
                          <button
                            onClick={handleClearAllHistory}
                            className="text-[9px] text-red-400 hover:text-red-300 font-bold cursor-pointer transition-colors"
                          >
                            LIMPAR TUDO
                          </button>
                        )}
                      </div>

                      {history.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1.5">
                          {history.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                // Find user object to open profile
                                const userObj = users.find((u) => u.id === item.userId);
                                if (userObj) {
                                  handleSelectUser(userObj);
                                } else {
                                  // Fallback mock User if deleted (safeguard)
                                  onSelectUser({
                                    id: item.userId,
                                    fullname: item.fullname,
                                    firstname: item.fullname.split(' ')[0],
                                    surname: item.fullname.split(' ')[1] || '',
                                    nickname: item.nickname,
                                    avatar: item.avatar,
                                    province: item.province,
                                    email: '',
                                    phone: '',
                                    created: '',
                                    stats: { likes: 0, posts: 0, friends: 0 },
                                    nameEditDate: null
                                  });
                                  onClose();
                                }
                              }}
                              className="p-2.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-neon-cyan/20 transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={item.avatar || 'https://i.pravatar.cc/80?img=1'}
                                  alt={item.nickname}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full border border-white/5 object-cover"
                                />
                                <div className="text-left">
                                  <span className="text-xs font-bold text-gray-200 group-hover:text-neon-cyan transition-colors block">
                                    {item.fullname}
                                  </span>
                                  <span className="text-[9px] text-gray-500 font-semibold block">
                                    @{item.nickname} • {item.province}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={(e) => handleRemoveHistoryItem(e, item.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                                title="Remover do histórico"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                          <p className="text-xs text-gray-500 font-semibold italic">
                            O seu histórico de consultas está vazio.
                          </p>
                          <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">
                            Arraste do canto direito ou digite para encontrar amigos moçambicanos!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer and Security Notice */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-neon-cyan" /> Live Search Ativo
                </span>
                <span>Auto-ocultação: 60s inatividade</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
