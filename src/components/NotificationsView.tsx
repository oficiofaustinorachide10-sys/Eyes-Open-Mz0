/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Bell, Trash2, Volume2, VolumeX, CheckCircle, ChevronRight, Clock, Star, MessageSquare, AlertCircle, X, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Notification } from '../types';
import { dbUpdateNotification, dbDeleteNotification, dbClearAllNotifications, dbUpdateUser } from '../lib/db';

// Real-time dynamic time-ago formatter in Portuguese
function formatTimeAgo(timestamp: number, now: number): string {
  const diffMs = now - timestamp;
  if (diffMs < 0) return 'agora mesmo';
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) {
    return 'agora mesmo';
  }
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return diffMins === 1 ? 'há 1 minuto' : `há ${diffMins} minutos`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
}

interface NotificationsViewProps {
  currentUser: User;
  notifications: Notification[];
  onNavigateToTarget: (view: any, targetId?: string) => void;
  onAcceptFriendship?: (friendshipId: string, notifId: string) => void;
  onDeclineFriendship?: (friendshipId: string, notifId: string) => void;
  onIgnoreFriendship?: (notifId: string) => void;
}

export default function NotificationsView({ 
  currentUser, 
  notifications: rawNotifications, 
  onNavigateToTarget,
  onAcceptFriendship,
  onDeclineFriendship,
  onIgnoreFriendship
}: NotificationsViewProps) {

  // Strict Dual-Channel Segregation: filter only Canal A (Social) notifications
  const notifications = rawNotifications.filter(n => {
    const typeStr = n.type as string;
    return typeStr !== 'message' && 
      typeStr !== 'chat' && 
      typeStr !== 'conversa' && 
      typeStr !== 'chat_request' && 
      typeStr !== 'chat_accepted';
  });

  const isMuted = currentUser.mutedNotifications || false;

  // Real-time ticking clock for dynamic timestamps
  const [now, setNow] = useState(Date.now());
  
  // Optimistic read status tracking to decrement counter and reset glow instantaneously
  const [sessionReadIds, setSessionReadIds] = useState<string[]>([]);
  
  // Welcome Guide Modal display state
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 15000); // ticks every 15s for high responsiveness
    return () => clearInterval(interval);
  }, []);

  // Track if a sound needs to be played.
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read && !sessionReadIds.includes(n.id)).length;
    if (notifications.length > prevCountRef.current) {
      if (!isMuted && unreadCount > 0) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Retro cyber chime
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.1); // G5
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
          
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.35);
        } catch (e) {
          // Fallback if AudioContext is blocked by browser policy
        }
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications, isMuted, sessionReadIds]);

  // Update user preference for muting
  const handleToggleMute = async () => {
    const updatedUser: User = {
      ...currentUser,
      mutedNotifications: !isMuted
    };
    await dbUpdateUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleClearAll = async () => {
    if (confirm('Tem a certeza de que deseja eliminar todas as suas notificações?')) {
      await dbClearAllNotifications(currentUser.id);
      setSessionReadIds([]);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // 1. Instantly mark as read in local optimistic state to deduct count by 1 immediately
    if (!notif.read && !sessionReadIds.includes(notif.id)) {
      setSessionReadIds(prev => [...prev, notif.id]);
    }

    // 2. Mark as read in Firestore
    if (!notif.read) {
      const updated: Notification = {
        ...notif,
        read: true
      };
      await dbUpdateNotification(updated).catch(err => {
        // Rollback optimistic read on error
        setSessionReadIds(prev => prev.filter(id => id !== notif.id));
        console.error('Failed to mark notification as read:', err);
      });
    }

    // 3. Specific welcome guide modal expansion
    if (notif.targetId === 'welcome_guide') {
      setShowGuideModal(true);
      return;
    }

    // 4. Navigate to target view and pass the targetId
    if (notif.targetView) {
      onNavigateToTarget(notif.targetView, notif.targetId);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read && !sessionReadIds.includes(n.id));
    const unreadIds = unreadNotifs.map(n => n.id);
    
    // Optimistic read
    setSessionReadIds(prev => [...prev, ...unreadIds]);

    for (const notif of unreadNotifs) {
      const updated: Notification = {
        ...notif,
        read: true
      };
      await dbUpdateNotification(updated).catch(err => {
        setSessionReadIds(prev => prev.filter(id => id !== notif.id));
        console.error('Error updating notifications:', err);
      });
    }
  };

  const handleDeleteIndividual = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation(); // prevent triggering the click navigation
    await dbDeleteNotification(notifId);
    setSessionReadIds(prev => prev.filter(id => id !== notifId));
  };

  // Helper to choose corresponding icons
  const getIcon = (type: string) => {
    switch (type) {
      case 'star':
        return <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-neon-cyan" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-neon-magenta" />;
      default:
        return <Bell className="w-4 h-4 text-neon-cyan" />;
    }
  };

  return (
    <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neon-cyan/20 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/25 rounded-xl">
            <Bell className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase">
              NOTIFICAÇÕES & ALERTAS
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              Fique a par das interações na sua conta de Moçambique
            </p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-2">
          {/* Mute toggle button */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-bold font-orbitron tracking-widest uppercase cursor-pointer transition-all ${
              isMuted 
                ? 'bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/40' 
                : 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20'
            }`}
            title={isMuted ? "Ativar som de notificações" : "Silenciar som de notificações"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" /> Silencioso
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" /> Com Som
              </>
            )}
          </button>

          {/* Mark read button */}
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-bold font-orbitron tracking-widest rounded-xl uppercase transition-all cursor-pointer"
            >
              Lidas
            </button>
          )}

          {/* Delete All Button */}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-950/30 border border-red-500/20 hover:border-red-500 hover:bg-red-950/50 text-red-400 text-[10px] font-bold font-orbitron tracking-widest rounded-xl uppercase transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Notifications container with active animations */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 rounded-3xl bg-[#090924] border border-white/5 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-gray-500" />
              </div>
              <div className="space-y-1">
                <h4 className="font-orbitron font-extrabold text-xs text-gray-400 uppercase tracking-widest">
                  Caixa de Entrada Vazia
                </h4>
                <p className="text-xs text-gray-500 font-semibold max-w-xs mx-auto">
                  De momento, não tem nenhuma notificação ativa ou alerta no sistema.
                </p>
              </div>
            </motion.div>
          ) : (
            notifications.map((notif, index) => {
              const isRead = notif.read;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.04, type: 'spring', damping: 20 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
                    isRead 
                      ? 'bg-[#090924]/60 border-white/5 hover:border-neon-cyan/20 opacity-80' 
                      : 'bg-gradient-to-r from-[#121235] to-[#090924] border-neon-cyan/30 hover:border-neon-cyan glow-card shadow-md shadow-neon-cyan/5'
                  }`}
                >
                  {/* Left segment: User Avatar and Notification detail */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative">
                      <img 
                        src={notif.sender.avatar || "https://i.pravatar.cc/80?img=1"} 
                        alt={notif.sender.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-neon-cyan/40 object-cover shrink-0"
                      />
                      {/* Secondary visual badge inside icon container */}
                      <span className="absolute -bottom-1 -right-1 p-1 bg-black rounded-full border border-white/10">
                        {getIcon(notif.type)}
                      </span>
                    </div>

                    <div className="min-w-0 text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white leading-tight">
                          {notif.title}
                        </span>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_#00f5ff]"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                        {notif.text}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neon-cyan" />
                          <span className="text-neon-cyan font-black">{formatTimeAgo(notif.timestamp, now)}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(notif.timestamp).toLocaleDateString('pt-MZ')} às {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {notif.targetId === 'welcome_guide' && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded bg-neon-magenta/20 border border-neon-magenta/40 text-neon-magenta text-[8px]">
                              Guia Integrado
                            </span>
                          </>
                        )}
                      </div>
                      
                      {notif.type === 'friend_request' && notif.targetId && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onAcceptFriendship && onAcceptFriendship(notif.targetId!, notif.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => onDeclineFriendship && onDeclineFriendship(notif.targetId!, notif.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950 border border-red-900/50 hover:border-red-500 text-red-400 text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => onIgnoreFriendship && onIgnoreFriendship(notif.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Ignorar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right segment: Interactions delete/redirect icons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Trash icon for individual deletion */}
                    <button
                      onClick={(e) => handleDeleteIndividual(e, notif.id)}
                      className="p-2 rounded-xl bg-black/40 hover:bg-red-950/40 border border-white/10 hover:border-red-500 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                      title="Eliminar notificação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-neon-cyan opacity-40 hover:opacity-100" />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Muted notifications alert bar */}
      {isMuted && (
        <div className="p-3 bg-red-950/10 border border-red-500/20 text-red-400 text-center text-xs font-bold font-orbitron tracking-widest rounded-xl uppercase flex items-center justify-center gap-2">
          <VolumeX className="w-4 h-4" /> MODO SILENCIOSO ATIVO — Sem alertas sonoros
        </div>
      )}

      {/* GORGEOUS CYBER WELCOME GUIDE MODAL (Mozambique Aesthetic) */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[50000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="bg-[#050518] border border-neon-cyan/30 text-white w-full max-w-lg rounded-3xl p-6 md:p-8 relative shadow-2xl shadow-neon-cyan/10 max-h-[85vh] overflow-y-auto no-scrollbar font-rajdhani"
            >
              {/* Top Banner Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-neon-cyan via-yellow-400 via-green-500 to-neon-magenta rounded-t-3xl" />

              {/* Close Button */}
              <button 
                onClick={() => setShowGuideModal(false)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer border border-white/5 hover:border-neon-cyan/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center space-y-2 mt-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.15)]">
                  <HelpCircle className="w-8 h-8 text-neon-cyan" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-orbitron font-black bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent tracking-wide leading-tight">
                    GUIA DE BOAS-VINDAS
                  </h3>
                  <p className="text-[10px] text-yellow-400 font-orbitron font-extrabold tracking-widest uppercase">
                    COMO FUNCIONA O EYES OPEN MZ 🇲🇿
                  </p>
                </div>
              </div>

              {/* Guide Contents */}
              <div className="space-y-5 mt-6 text-left">
                <p className="text-xs text-gray-300 leading-relaxed text-center italic font-semibold px-2">
                  "Olá! Seja bem-vindo ao Eyes Open MZ. Esta plataforma foi desenhada como um ecossistema imersivo para ligar talentos, partilhar histórias vibrantes e celebrar a cultura audiovisual de Moçambique."
                </p>

                <div className="space-y-3.5">
                  {[
                    {
                      num: "1",
                      title: "Feed 4D & Histórias Imersivas (42 Horas)",
                      text: "No Feed Início, publique as suas criações textuais ou visuais. Partilhe Histórias dinâmicas que duram exatamente 42 horas, onde pode acoplar faixas musicais do catálogo local em tempo real."
                    },
                    {
                      num: "2",
                      title: "Canais de Conversa & Vídeo Live",
                      text: "Comunique com amigos no privado ou use o Chat Geral do grupo. No topo do Chat Geral, clique em 'Iniciar Vídeo Live' para criar uma transmissão interativa (máximo de 4 câmaras em simultâneo)."
                    },
                    {
                      num: "3",
                      title: "Comunidade por Província",
                      text: "Na aba Comunidade, encontre criadores em Moçambique. O sistema recomenda pessoas da sua própria província para facilitar colaborações artísticas locais. Clique em 'Vincular' para fazer novos amigos."
                    },
                    {
                      num: "4",
                      title: "Customização Estética de Cor",
                      text: "No painel Configurações ou no menu inferior da barra lateral, mude a atmosfera do site escolhendo entre 7 modos de cores concebidos à mão (Ciano, Crepúsculo, Noite, Esmeralda, Vinho, Lite e Luz)."
                    }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon-cyan/20 transition-all flex gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/25 flex items-center justify-center font-orbitron font-bold text-xs text-neon-cyan shrink-0">
                        {item.num}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action and Footer */}
              <div className="mt-8 pt-5 border-t border-white/5 flex flex-col items-center gap-4 text-center">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-full py-3 bg-neon-cyan text-black hover:bg-white font-orbitron font-extrabold text-xs tracking-widest rounded-xl transition-all cursor-pointer uppercase shadow-[0_0_15px_rgba(0,245,255,0.2)]"
                >
                  Entendido, Explorar Site!
                </button>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  EYES OPEN MZ — SUA VISÃO É A NOSSA MISSÃO
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
