/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { 
  Bell, Trash2, Volume2, VolumeX, CheckCircle, ChevronRight, Clock, Star, MessageSquare, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Notification } from '../types';
import { dbUpdateNotification, dbDeleteNotification, dbClearAllNotifications, dbUpdateUser } from '../lib/db';

interface NotificationsViewProps {
  currentUser: User;
  notifications: Notification[];
  onNavigateToTarget: (view: any, targetId?: string) => void;
}

export default function NotificationsView({ 
  currentUser, 
  notifications, 
  onNavigateToTarget 
}: NotificationsViewProps) {

  const isMuted = currentUser.mutedNotifications || false;

  // Track if a sound needs to be played.
  // To avoid playing a sound for older notifications on mount, we can track a ref.
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    // If a new unread notification arrives and it is not muted, play a subtle retro/synth sound effect or browser alert (optional)
    const unreadCount = notifications.filter(n => !n.read).length;
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
  }, [notifications, isMuted]);

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
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // 1. Mark as read in DB
    if (!notif.read) {
      const updated: Notification = {
        ...notif,
        read: true
      };
      await dbUpdateNotification(updated);
    }

    // 2. Navigate to target view and pass the targetId
    if (notif.targetView) {
      onNavigateToTarget(notif.targetView, notif.targetId);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      const updated: Notification = {
        ...notif,
        read: true
      };
      await dbUpdateNotification(updated);
    }
  };

  const handleDeleteIndividual = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation(); // prevent triggering the click navigation
    await dbDeleteNotification(notifId);
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
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                        {notif.text}
                      </p>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neon-cyan" />
                        {new Date(notif.timestamp).toLocaleDateString()} ás {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
    </div>
  );
}
