import React from 'react';
import { 
  ArrowLeft, Bell, Check, CheckCheck, UserPlus, Star, MessageSquare, 
  AtSign, MessageCircle, Clock, BookOpen, ExternalLink, Shield
} from 'lucide-react';
import { AppNotification, User } from '../types';
import { dbMarkNotificationAsRead, dbMarkAllNotificationsAsRead } from '../lib/db';

interface NotificationCenterModalProps {
  currentUser: User | null;
  notifications: AppNotification[];
  onClose: () => void;
  onOpenNotificationTarget: (notification: AppNotification) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  currentUser,
  notifications,
  onClose,
  onOpenNotificationTarget
}) => {
  const isAdmin = currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await dbMarkAllNotificationsAsRead(currentUser.id, isAdmin);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await dbMarkNotificationAsRead(notif.id);
    }
    onOpenNotificationTarget(notif);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `há ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    return `há ${Math.floor(diff / 86400)}d`;
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_user':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'new_review':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'new_comment':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'comment_reply':
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
      case 'user_mention':
        return <AtSign className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0f111a] border border-amber-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* TOP APP BAR WITH BACK BUTTON (← Voltar) */}
        <div className="px-5 py-4 bg-[#141624] border-b border-amber-500/20 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-white text-base">
              {isAdmin ? 'Central de Notificações Admin' : 'Notificações'}
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-black">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1d2032] hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ler todas</span>
            </button>
          ) : (
            <div className="w-16"></div>
          )}
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-amber-500/10">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <Bell className="w-8 h-8 opacity-60" />
              </div>
              <p className="text-amber-200/80 text-sm font-semibold">Nenhuma notificação por enquanto.</p>
              <p className="text-gray-400 text-xs">Avisaremos você quando houver novas interações!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-3 first:pt-0 p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 border ${
                  notif.isRead 
                    ? 'bg-[#121422]/50 border-transparent hover:bg-[#181a2e]' 
                    : 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 shadow-lg'
                }`}
              >
                {/* ICON / AVATAR */}
                <div className="relative flex-shrink-0">
                  {notif.senderAvatar ? (
                    <img
                      src={notif.senderAvatar}
                      alt={notif.senderName}
                      className="w-10 h-10 rounded-xl object-cover border border-amber-400/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#1c1f32] border border-amber-500/30 flex items-center justify-center">
                      {getNotifIcon(notif.type)}
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 p-1 rounded-md bg-[#0f111a] border border-amber-500/40">
                    {getNotifIcon(notif.type)}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-amber-100 text-xs sm:text-sm truncate">
                      {notif.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono flex-shrink-0">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>

                  {notif.bookTitle && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-300 font-semibold">
                      <BookOpen className="w-3 h-3" />
                      <span className="truncate">{notif.bookTitle}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
                    </div>
                  )}
                </div>

                {/* UNREAD DOT */}
                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0 mt-2"></div>
                )}
              </div>
            ))
          )}
        </div>

        {/* FOOTER SECURITY BADGE */}
        <div className="px-5 py-3 bg-[#141624] border-t border-amber-500/10 text-center text-[11px] text-gray-400 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Notificações privadas e seguras do Ala X</span>
        </div>

      </div>
    </div>
  );
};
