/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Home, Eye, User, Newspaper, Video, MessageSquare, Calendar, 
  Store, Film, Type, Music, Users, Settings, LogOut, Plus, ShieldAlert, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

export type ViewType = 
  | 'feed' | 'profile' | 'account' | 'publish-post' | 'publish-story' 
  | 'abra-olhos' | 'artigos' | 'videos' | 'conversas' | 'eventos' 
  | 'loja' | 'cinema' | 'fonte-letra' | 'musica' | 'comunidade' | 'config' | 'notificacoes';

interface SidebarProps {
  currentUser: UserType;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  unreadChatsCount?: number;
  unreadNotificationsCount?: number;
}

export default function Sidebar({ 
  currentUser, 
  activeView, 
  onNavigate, 
  onLogout, 
  isOpen, 
  onClose,
  unreadChatsCount = 0,
  unreadNotificationsCount = 0
}: SidebarProps) {

  const menuItems = [
    { id: 'feed' as ViewType, label: 'Início', icon: Home },
    { id: 'abra-olhos' as ViewType, label: 'Abra os Olhos', icon: Eye },
    { id: 'profile' as ViewType, label: 'Perfil', icon: User },
    { id: 'account' as ViewType, label: 'Minha Conta', icon: ShieldAlert },
    { id: 'artigos' as ViewType, label: 'Artigos', icon: Newspaper },
    { id: 'videos' as ViewType, label: 'Vídeos', icon: Video },
    { id: 'conversas' as ViewType, label: 'Conversas', icon: MessageSquare },
    { id: 'notificacoes' as ViewType, label: 'Notificações', icon: Bell },
    { id: 'eventos' as ViewType, label: 'Eventos', icon: Calendar },
    { id: 'loja' as ViewType, label: 'Loja', icon: Store },
    { id: 'cinema' as ViewType, label: 'Cinema', icon: Film },
    { id: 'fonte-letra' as ViewType, label: 'Fonte de Letra', icon: Type },
    { id: 'musica' as ViewType, label: 'Música', icon: Music },
    { id: 'comunidade' as ViewType, label: 'Comunidade', icon: Users },
    { id: 'config' as ViewType, label: 'Configurações', icon: Settings },
  ];

  const handleItemClick = (id: ViewType) => {
    onNavigate(id);
    onClose();
  };

  const content = (
    <div className="flex flex-col h-full bg-[#08081a]/95 border-r border-neon-cyan/20 p-6 font-rajdhani text-white select-none">
      {/* Brand logo */}
      <div className="flex flex-col items-center mb-8 border-b border-neon-cyan/10 pb-6 text-center">
        <h2 className="font-orbitron font-extrabold text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent glow-text-cyan">
          OPEN MZ
        </h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
          SUA VISÃO É A NOSSA MISSÃO
        </p>
      </div>

      {/* Profile summary */}
      <div 
        onClick={() => handleItemClick('profile')} 
        className="flex items-center gap-3 bg-[#111130]/60 hover:bg-[#151540] border border-neon-cyan/15 rounded-2xl p-3 mb-6 transition-all duration-300 cursor-pointer"
      >
        <img 
          src={currentUser.avatar || "https://i.pravatar.cc/100?img=1"} 
          alt={currentUser.nickname} 
          referrerPolicy="no-referrer"
          className="w-10 h-10 rounded-full border border-neon-cyan object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-neon-cyan truncate leading-tight">
            {currentUser.nickname}
          </p>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            {currentUser.isVIP ? '💎 Associado VIP' : '⭐ Membro Standard'}
          </p>
        </div>
      </div>

      {/* Main menu navigation links */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-1 max-h-[60vh]">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          
          const hasUnreadConversas = item.id === 'conversas' && unreadChatsCount > 0;
          const hasUnreadNotificacoes = item.id === 'notificacoes' && unreadNotificationsCount > 0;
          const isRedOption = hasUnreadConversas || hasUnreadNotificacoes;
          const unreadCount = item.id === 'conversas' ? unreadChatsCount : unreadNotificationsCount;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-left text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                isActive 
                  ? isRedOption
                    ? 'bg-gradient-to-r from-red-500/20 to-[#9d00ff]/10 border-l-[3px] border-red-500 text-red-200 shadow-inner shadow-red-500/5'
                    : 'bg-gradient-to-r from-neon-cyan/20 to-[#9d00ff]/10 border-l-[3px] border-neon-cyan text-white shadow-inner shadow-neon-cyan/5' 
                  : isRedOption
                    ? 'text-red-400 bg-red-950/10 border border-red-500/20 hover:bg-red-950/25 hover:translate-x-1'
                    : 'text-gray-400 hover:text-white hover:bg-[#121235]/50 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Icon className={`w-4.5 h-4.5 ${
                  isActive 
                    ? isRedOption ? 'text-red-400 animate-pulse' : 'text-neon-cyan' 
                    : isRedOption ? 'text-red-400 animate-pulse' : 'text-gray-400'
                }`} />
                <span className={isRedOption ? 'text-red-300' : ''}>{item.label}</span>
              </div>
              
              {isRedOption && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[9px] font-orbitron font-extrabold bg-red-600 border border-red-500/40 text-green-400 rounded-full animate-bounce shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions at bottom */}
      <div className="mt-auto pt-6 border-t border-neon-cyan/10 space-y-3">
        <button
          onClick={() => handleItemClick('publish-post')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 text-black font-orbitron font-extrabold text-[11px] tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-neon-cyan/10"
        >
          <Plus className="w-4 h-4 text-black stroke-[3px]" /> PUBLICAR POST
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-950/30 border border-red-500/20 hover:border-red-500 hover:bg-red-950/50 text-red-400 font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> SAIR DA CONTA
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 h-screen shrink-0 sticky top-0 z-20">
        {content}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black z-30"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 w-72 z-40 shadow-2xl h-screen"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
