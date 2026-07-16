/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Star, Eye, Share2, Trash2, X, Play, Pause, Volume2, UserPlus, UserCheck, ShieldCheck, Lock, Unlock, MessageSquare, Clock, Sparkles, Check, AlertTriangle,
  Camera, Video, Music, Mic, FileText, FolderOpen, MapPin, Users, Hash, Download, Disc, PlayCircle, Maximize2, ChevronLeft, ChevronRight, VolumeX, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Story, User, Friendship, ChatPermission, Notification } from '../types';
import { 
  subscribeUsers, subscribeFriendships, subscribeChatPermissions, 
  dbCreateFriendship, dbCreateChatPermission, dbCreateNotification 
} from '../lib/db';
import { ThemeConfig } from '../utils/themeEngine';
import { playClickFeedback, playCommentSound, playPublishPostSound, playStarSound, playNotificationSound } from '../utils/audioSystem';
import { translate } from '../utils/translations';
import ShimmeringBackground from './ShimmeringBackground';

interface FeedViewProps {
  currentUser: User;
  posts: Post[];
  stories: Story[];
  onNavigate: (view: 'feed' | 'profile' | 'account' | 'publish-post' | 'publish-story' | 'abra-olhos' | 'artigos' | 'videos' | 'conversas' | 'eventos' | 'loja' | 'cinema' | 'fonte-letra' | 'musica' | 'comunidade' | 'config' | 'notificacoes') => void;
  onLikePost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onLikeStory: (storyId: string) => void;
  onAddStoryView: (storyId: string) => void;
  onAddPostView: (postId: string) => void;
  onAddPostListen?: (postId: string) => void;
  onAddPostShare?: (postId: string) => void;
  onRatePost?: (postId: string, ratingValue: number) => void;
  onAddComment: (postId: string, text: string, audioUrl?: string, audioDuration?: number) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onReactComment?: (postId: string, commentId: string, reaction: 'star' | 'broken_star') => void;
  autoOpenPostId?: string;
  onClearAutoOpenPost?: () => void;
  currentThemeConfig?: ThemeConfig;
  onNavigateToTarget?: (view: any, targetId?: string) => void;
  currentLanguage?: string;
}

export function getAverageRating(post: Post, currentLanguage: string = 'pt'): string {
  const ratings = post.ratings || {};
  const keys = Object.keys(ratings);
  if (keys.length === 0) {
    return `0.0 ⭐ (0 ${translate('estrelas', currentLanguage).toLowerCase()})`;
  }
  const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
  const avg = (sum / keys.length).toFixed(1);
  return `${avg} ⭐ (${keys.length} ${keys.length === 1 ? translate('estrelas', currentLanguage).substring(0, translate('estrelas', currentLanguage).length - 3) + 'ão' : translate('estrelas', currentLanguage).toLowerCase()})`;
}

// 4D ROTATIONAL CARD COMPONENT FOR FEED POSTS (MULTIMEDIA ADAPTIVE SYSTEM)
function RotationalCard({ 
  post, 
  currentUser, 
  onLike, 
  onDelete, 
  onClick,
  onAddView,
  onAuthorClick,
  currentThemeConfig,
  currentLanguage = 'pt'
}: { 
  post: Post; 
  currentUser: User; 
  onLike: () => void; 
  onDelete: () => void; 
  onClick: () => void;
  onAddView: () => void;
  onAuthorClick?: () => void;
  currentThemeConfig?: ThemeConfig;
  currentLanguage?: string;
  key?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const isEyesMax = currentThemeConfig?.id === 'eyes-max';
  const isStarredByMe = post.starredBy ? !!post.starredBy[currentUser.id] : post.starred;

  // Video Autoplay States and Timers
  const [isAutoplayPlaying, setIsAutoplayPlaying] = useState(false);
  const hoverTimer = useRef<any>(null);
  const autoplayTimer = useRef<any>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    onAddView();
  }, []);

  // Viewport intersection observer for autoplay on mobile/scroll
  useEffect(() => {
    if (post.type !== 'video' || !post.mediaUrl) return;

    let observer: IntersectionObserver | null = null;
    let isPlayedOnce = false;

    if (cardRef.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isPlayedOnce) {
              hoverTimer.current = setTimeout(() => {
                setIsAutoplayPlaying(true);
                isPlayedOnce = true;
                autoplayTimer.current = setTimeout(() => {
                  setIsAutoplayPlaying(false);
                }, 4000);
              }, 2000); // Wait 2 seconds before starting autoplay
            }
          } else {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
            setIsAutoplayPlaying(false);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(cardRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    };
  }, [post.mediaUrl, post.type]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const maxRot = isEyesMax ? 22 : 15;
    const rotateYVal = ((x - centerX) / centerX) * maxRot;
    const rotateXVal = -((y - centerY) / centerY) * maxRot;
    
    setRotateY(rotateYVal);
    setRotateX(rotateXVal);
  };

  const handleMouseEnterCard = () => {
    if (post.type !== 'video' || !post.mediaUrl || isAutoplayPlaying) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);

    hoverTimer.current = setTimeout(() => {
      setIsAutoplayPlaying(true);
      autoplayTimer.current = setTimeout(() => {
        setIsAutoplayPlaying(false);
      }, 4000); // Play video for exactly 4 seconds
    }, 2000); // If hovering for 2 seconds
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    setRotateX(0);
    setRotateY(0);

    // Clear autoplay timers when leaving the card
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    setIsAutoplayPlaying(false);
  };

  const handleCardClick = () => {
    playClickFeedback();
    onClick();
  };

  // Helper to render responsive media inside the card grid
  const renderCardMedia = () => {
    const isAudio = post.type === 'audio';
    const isVideo = post.type === 'video';
    const isVoice = post.type === 'voice';
    const isDoc = post.type === 'document';
    const isFile = post.type === 'file';

    if (isAudio) {
      // Modern Backdrop Blur Audio Cover Art Card
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group/audio bg-neutral-950">
          {/* Blurred Background Cover Art */}
          {post.image || post.mediaCover ? (
            <img 
              src={post.mediaCover || post.image || undefined} 
              alt="Blurred background" 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 transition-transform duration-700 group-hover/audio:scale-125 pointer-events-none select-none"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#121230] to-[#280c35]" />
          )}

          {/* Dark Glass Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 group-hover/audio:bg-black/55" />

          {/* Glowing Equalizer lines in background */}
          <div className="absolute bottom-0 inset-x-0 h-1/4 flex items-end justify-center gap-1 opacity-20 pointer-events-none">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div 
                key={idx} 
                className="w-1.5 bg-[var(--theme-accent)] rounded-t animate-bounce" 
                style={{ 
                  height: `${[40, 80, 20, 60, 90, 30, 70, 50, 80, 40, 60, 20, 90, 50, 70, 30][idx]}%`,
                  animationDelay: `${idx * 150}ms`,
                  animationDuration: `${800 + (idx % 3) * 300}ms`
                }} 
              />
            ))}
          </div>

          {/* TOP EXCLUSIVE BADGE */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
            <span className="bg-gradient-to-r from-violet-600 to-[#e0a96d] border border-violet-500/30 text-white font-extrabold font-orbitron text-[8px] tracking-widest px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase">
              <Music className="w-2.5 h-2.5 text-white fill-current animate-pulse" /> ÁUDIO
            </span>
          </div>

          {/* CONTENT CONTAINER - CENTRALIZED */}
          <div className="relative z-10 flex flex-col items-center justify-center p-4 w-full h-full text-center">
            {/* Main Cover Art (Capa do áudio bem visível) */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 mb-3 group-hover/audio:scale-105 transition-transform duration-300">
              {post.image || post.mediaCover ? (
                <img 
                  src={post.mediaCover || post.image || undefined} 
                  alt="Track Album" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center">
                  <Disc className="w-10 h-10 text-neutral-900 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              )}
              {/* Overlay with Headphones or Play Icon */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/audio:opacity-100 transition-opacity">
                <PlayCircle className="w-8 h-8 text-[var(--theme-accent)]" />
              </div>
            </div>

            {/* Title in High Highlight */}
            <h4 
              className="text-xs sm:text-sm font-orbitron font-extrabold tracking-wider uppercase line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-2"
              style={{ color: 'var(--theme-accent)' }}
            >
              {post.title || 'Faixa Musical'}
            </h4>

            {/* Artist right under title */}
            <p className="text-[9px] font-mono font-bold text-gray-300 mt-0.5 line-clamp-1 tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              @{post.artist || 'Artista Local'}
            </p>

            {/* Duration Indicator */}
            <div className="flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-black/55 rounded-full border border-white/5 text-[7px] font-bold tracking-widest text-gray-400 font-mono uppercase">
              <Mic className="w-2.5 h-2.5 text-violet-400" />
              <span>{post.duration ? `${Math.floor(post.duration / 60)}:${(post.duration % 60).toString().padStart(2, '0')}` : '03:15'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (isVideo) {
      // Beautiful camera play cover
      return (
        <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
          {/* Cover image shown initially */}
          {post.image ? (
            <img 
              src={post.image} 
              alt="Video thumbnail" 
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 pointer-events-none z-10 ${
                isAutoplayPlaying ? 'opacity-0 scale-95' : 'opacity-100 group-hover:scale-105'
              }`}
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-tr from-neutral-950 to-neutral-900 transition-all duration-500 z-10 ${
              isAutoplayPlaying ? 'opacity-0' : 'opacity-100'
            }`} />
          )}

          {/* Autoplay Video Node */}
          {isAutoplayPlaying && post.mediaUrl && (
            <video
              ref={videoElementRef}
              src={post.mediaUrl}
              muted
              playsInline
              autoPlay
              loop={false}
              className="w-full h-full object-cover z-0"
              onEnded={() => setIsAutoplayPlaying(false)}
            />
          )}

          {/* Play Badge Overlay (Only visible when NOT autoplaying) */}
          {!isAutoplayPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors z-20">
              <motion.div 
                whileHover={{ scale: 1.15 }}
                className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl relative group/play"
              >
                <div className="absolute inset-0 rounded-full bg-[var(--theme-accent)] opacity-10 group-hover/play:scale-125 transition-transform duration-500 rounded-full animate-pulse" />
                <Play className="w-6 h-6 text-white stroke-[2.5px] fill-white/10 pl-0.5" />
              </motion.div>
            </div>
          )}

          {/* Autoplay status bar */}
          {isAutoplayPlaying && (
            <div className="absolute top-2.5 right-2.5 bg-black/85 border border-[var(--theme-accent)] text-[var(--theme-accent)] font-black text-[7px] tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse z-20 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping" />
              <span>Reprodução Auto</span>
            </div>
          )}
          
          {/* Video Metadata Labels */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none z-20">
            <span className="bg-red-600 border border-red-500 text-white font-extrabold font-orbitron text-[8px] tracking-widest px-2 py-0.5 rounded-full shadow-lg">
              VIDEO
            </span>
            {post.resolution && (
              <span className="bg-black/80 border border-white/10 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-gray-300">
                {post.resolution}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (isVoice) {
      // Custom voice message waveform layout
      return (
        <div className="w-full h-full p-5 flex flex-col items-center justify-center bg-gradient-to-tr from-[#050b14] to-[#0c182d] text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/30 flex items-center justify-center mb-3">
            <Mic className="w-5 h-5 text-[var(--theme-accent)] shrink-0 animate-pulse" />
          </div>
          
          {/* Simulated audio waveform */}
          <div className="flex items-end gap-1 h-5 w-2/3 justify-center opacity-70">
            {[10, 16, 24, 12, 8, 18, 22, 14, 10, 20, 16, 12, 8].map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-[var(--theme-accent)] rounded-t"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          <span className="text-[10px] font-orbitron font-extrabold text-[var(--theme-accent)] mt-3 tracking-widest uppercase">
            REGISTO DE VOZ
          </span>
          <span className="text-[8px] font-mono text-gray-500 mt-1 font-bold">
            {post.duration ? `${Math.floor(post.duration / 60)}:${(post.duration % 60).toString().padStart(2, '0')}` : '0:12'}
          </span>
        </div>
      );
    }

    if (isDoc) {
      return (
        <div className="w-full h-full p-5 flex flex-col items-center justify-center bg-gradient-to-tr from-[#0b1b17] to-[#030a08] border-b border-[var(--theme-border)]/20 relative">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-teal-400 shrink-0" />
          </div>
          <p className="text-[10px] font-bold text-center text-gray-200 uppercase tracking-wide truncate max-w-[150px]">
            {post.title || 'Regulamento.pdf'}
          </p>
          
          <div className="flex gap-2 mt-2">
            <span className="bg-teal-900/40 border border-teal-500/20 text-teal-400 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono">
              {post.pageCount || 1} {translate('paginas', currentLanguage).toLowerCase()}
            </span>
            {post.fileSize && (
              <span className="bg-black/60 text-gray-400 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono">
                {post.fileSize}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (isFile) {
      return (
        <div className="w-full h-full p-5 flex flex-col items-center justify-center bg-[#07070a] border-b border-white/5 relative text-center">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-3">
            <FolderOpen className="w-5 h-5 text-orange-400 shrink-0" />
          </div>
          <p className="text-[10px] font-mono font-bold text-gray-300 truncate max-w-[140px]">
            {post.title || 'arquivo.zip'}
          </p>
          <span className="bg-orange-950/40 border border-orange-500/20 text-orange-400 font-extrabold font-orbitron text-[7px] tracking-widest px-2 py-0.5 rounded-full mt-2 uppercase">
            FICHEIRO RECURSO
          </span>
          {post.fileSize && (
            <span className="text-[8px] font-mono font-bold text-gray-500 mt-1">
              {translate('tamanho', currentLanguage)}: {post.fileSize}
            </span>
          )}
        </div>
      );
    }

    // Default photo/text mapping
    return post.image ? (
      <img 
        src={post.image} 
        alt="Publicação" 
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700"
      />
    ) : (
      <div className={`w-full h-full p-6 flex items-center justify-center text-center ${
        isEyesMax 
          ? 'bg-gradient-to-tr from-[#1b1509] to-[#261d0d]' 
          : 'bg-gradient-to-tr from-[#121235] to-[#1d0a2f]'
      }`}>
        <p 
          className="text-sm font-bold leading-relaxed line-clamp-6"
          style={{ fontFamily: post.style?.font || 'Poppins', color: post.style?.color || '#ffffff' }}
        >
          {post.text}
        </p>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-45px" }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`flex flex-col h-full rounded-2xl overflow-hidden shadow-xl transition-shadow ${
        isEyesMax 
          ? 'bg-[#141108]/90 border border-amber-500/30 hover:border-amber-400/60 hover:shadow-amber-500/10' 
          : 'bg-[#0d0d26]/85 border border-neon-cyan/25 hover:shadow-neon-cyan/10'
      }`}
    >
      {/* 4D Rotating Wrapper */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnterCard}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
        className="relative aspect-square w-full cursor-pointer overflow-hidden group select-none"
      >
        {renderCardMedia()}

        {/* Shimmer overlay for eyes-max theme */}
        {isEyesMax && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
        )}

        {/* Dark overlay on photo card */}
        {(post.image || post.type === 'video') && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Delete option overlay */}
        {post.author.id === currentUser.id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickFeedback();
              if (window.confirm('Tem a certeza que deseja eliminar esta publicação permanentemente?')) {
                onDelete();
              }
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white cursor-pointer z-10 hover:scale-110 active:scale-95 transition-all shadow-lg border border-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Quick action floating indicators on hover */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              playStarSound(isEyesMax);
              onLike();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border cursor-pointer transition-all ${
              isStarredByMe
                ? isEyesMax
                  ? 'bg-amber-500/80 border-amber-400 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-yellow-500/80 border-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                : isEyesMax
                  ? 'bg-black/60 border-amber-500/40 text-gray-400 hover:text-white hover:border-amber-400'
                  : 'bg-black/60 border-neon-cyan/40 text-gray-400 hover:text-white hover:border-neon-cyan'
            }`}
          >
            <Star className={`w-4 h-4 ${isStarredByMe ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Description & User Footprint */}
      <div className={`p-4 flex flex-col flex-grow select-none border-t ${
        isEyesMax 
          ? 'bg-[#18140a] border-amber-500/15' 
          : 'bg-[#0c0c24] border-neon-cyan/15'
      }`}>
        {post.image && post.text && (
          <p 
            className={`text-xs leading-relaxed mb-3 line-clamp-2 ${isEyesMax ? 'text-amber-100/90' : 'text-gray-300'}`}
            style={{ fontFamily: post.style?.font || 'Poppins' }}
          >
            {post.text}
          </p>
        )}

        {/* Location & Tags row for photography */}
        {post.type === 'photo' && (post.location || (post.hashtags && post.hashtags.length > 0)) && (
          <div className="flex flex-wrap gap-1.5 items-center mb-3 text-[9px] font-bold uppercase font-rajdhani">
            {post.location && (
              <span className="flex items-center gap-0.5 text-gray-400">
                <MapPin className="w-3 h-3 text-[var(--theme-accent)]" /> {post.location}
              </span>
            )}
            {post.hashtags && post.hashtags.slice(0, 2).map(tag => (
              <span key={tag} className="text-blue-400">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          {/* Author info */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              playClickFeedback();
              if (onAuthorClick) onAuthorClick();
            }}
            className="flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity"
          >
            <img 
              src={post.author.avatar || "https://i.pravatar.cc/80?img=1"} 
              alt={post.author.name}
              referrerPolicy="no-referrer"
              className={`w-7 h-7 rounded-full border object-cover shrink-0 cursor-pointer ${
                isEyesMax ? 'border-amber-500/40' : 'border-[#6366f1]/50'
              }`}
            />
            <span className={`text-[11px] font-extrabold truncate cursor-pointer ${isEyesMax ? 'text-amber-200' : 'text-slate-100'}`}>@{post.author.name}</span>
          </div>

          {/* Anti-Fraud Core Analytics (Averages calculations & real formats) */}
          <div className="flex items-center gap-2.5 text-[9px] shrink-0 font-mono font-bold text-gray-400 bg-black/30 border border-white/5 rounded-full px-2 py-0.5">
            <span className="flex items-center gap-0.5">
              <Star className={`w-3 h-3 ${isEyesMax ? 'text-amber-500' : 'text-yellow-500'} fill-current`} /> 
              {/* Average and count display */}
              {(() => {
                const ratings = post.ratings || {};
                const keys = Object.keys(ratings);
                if (keys.length === 0) return '0.0 (0)';
                const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
                return `${(sum / keys.length).toFixed(1)} (${keys.length})`;
              })()}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3 text-neutral-400" /> {post.views}
            </span>
            {(post.type === 'audio' || post.type === 'voice') && (
              <span className="flex items-center gap-0.5">
                <Volume2 className="w-3 h-3 text-neutral-400" /> {post.listensCount || 0}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CommentItem({
  postId,
  comment,
  currentUser,
  onDeleteComment,
  onReactComment,
  onUpdateModal
}: {
  key?: any;
  postId: string;
  comment: any;
  currentUser: User;
  onDeleteComment?: (pId: string, cId: string) => void;
  onReactComment?: (pId: string, cId: string, r: 'star' | 'broken_star') => void;
  onUpdateModal: () => void;
}) {
  const [isPressing, setIsPressing] = useState(false);
  const pressTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (comment.audioUrl) {
      audioRef.current = new Audio(comment.audioUrl);
      const onTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current.addEventListener('timeupdate', onTimeUpdate);
      audioRef.current.addEventListener('ended', onEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
          audioRef.current.removeEventListener('ended', onEnded);
        }
      };
    }
  }, [comment.audioUrl]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickFeedback();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Audio playback error", err));
      setIsPlaying(true);
    }
  };

  const handleStartPress = () => {
    setIsPressing(true);
    pressTimeoutRef.current = setTimeout(() => {
      setIsPressing(false);
      if (onDeleteComment) {
        if (confirm('Deseja eliminar este comentário?')) {
          onDeleteComment(postId, comment.id);
          onUpdateModal();
        }
      }
    }, 800);
  };

  const handleEndPress = () => {
    setIsPressing(false);
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
  };

  const cStars = comment.starsCount || 0;
  const cBroken = comment.brokenStarsCount || 0;
  const total = cStars + cBroken;
  const starsPct = total > 0 ? Math.round((cStars / total) * 100) : 0;
  const brokenPct = total > 0 ? Math.round((cBroken / total) * 100) : 0;

  const userReactions = comment.reactions || {};
  const userReacted = userReactions[currentUser.id];

  return (
    <div 
      onMouseDown={handleStartPress}
      onMouseUp={handleEndPress}
      onMouseLeave={handleEndPress}
      onTouchStart={handleStartPress}
      onTouchEnd={handleEndPress}
      className={`relative flex flex-col gap-2 p-3 bg-black/45 rounded-2xl border transition-all select-none ${
        isPressing ? 'border-red-500 bg-red-950/10 scale-[0.98]' : 'border-white/5 hover:border-neon-cyan/25'
      }`}
    >
      <div className="flex gap-2.5">
        <img 
          src={comment.author.avatar || "https://i.pravatar.cc/80?img=1"} 
          alt={comment.author.name}
          className="w-7 h-7 rounded-full border border-neon-cyan/40 object-cover shrink-0"
        />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-neon-cyan truncate">@{comment.author.name}</span>
            <span className="text-[8px] text-gray-500 font-mono">
              {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {comment.text && (
            <p className="text-[11px] text-gray-300 mt-1 font-semibold leading-relaxed break-words">
              {comment.text}
            </p>
          )}

          {/* Render audio player when comment has audioUrl */}
          {comment.audioUrl && (
            <div className="flex items-center gap-2.5 bg-[#141108]/80 border border-amber-500/20 rounded-xl p-2 mt-2 shadow-inner">
              <button 
                type="button"
                onClick={handleTogglePlay}
                className="w-7 h-7 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-amber-400 flex items-center justify-center border border-amber-500/30 cursor-pointer active:scale-90 transition-all shrink-0"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-amber-400" /> : <Play className="w-3 h-3 fill-amber-400 ml-0.5" />}
              </button>
              
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <div className="flex justify-between items-center text-[8px] font-mono font-bold text-amber-500/80">
                  <span className="uppercase tracking-wider">Comentário de Voz</span>
                  <span>
                    {Math.round(currentTime)}s / {comment.audioDuration || 0}s
                  </span>
                </div>
                {/* Visual Audio Waveform Equalizer */}
                <div className="flex items-end gap-[2px] h-3.5 pt-0.5">
                  {Array.from({ length: 18 }).map((_, i) => {
                    const isActive = isPlaying;
                    const randomFactor = Math.sin(i * 0.4 + currentTime * 8) * 0.5 + 0.5;
                    const heightPct = isActive ? Math.round(20 + randomFactor * 80) : Math.round(20 + Math.sin(i * 0.7) * 30 + 10);
                    const isPlayed = (i / 18) * (comment.audioDuration || 1) <= currentTime;
                    
                    return (
                      <div 
                        key={i} 
                        style={{ height: `${heightPct}%` }}
                        className={`flex-1 rounded-sm transition-all duration-150 ${
                          isPlayed ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-white/10'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2 mt-1">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onReactComment) {
                onReactComment(postId, comment.id, 'star');
                setTimeout(onUpdateModal, 150);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              userReacted === 'star'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            ⭐️ <span className="font-orbitron font-extrabold text-[10px]">{cStars}</span> Dar Estrela
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onReactComment) {
                onReactComment(postId, comment.id, 'broken_star');
                setTimeout(onUpdateModal, 150);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              userReacted === 'broken_star'
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            💔 <span className="font-orbitron font-extrabold text-[10px]">{cBroken}</span> Partir Estrela
          </button>
        </div>

        {total > 0 ? (
          <div className="space-y-1 mt-1 bg-black/30 p-1.5 rounded-xl border border-white/5">
            <div className="flex justify-between text-[8px] font-mono font-black uppercase text-gray-400">
              <span className="text-yellow-400">Inteiras: {starsPct}%</span>
              <span className="text-red-400">Partidas: {brokenPct}%</span>
            </div>
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-yellow-500" style={{ width: `${starsPct}%` }} />
              <div className="h-full bg-red-600" style={{ width: `${brokenPct}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-[8px] text-gray-600 font-mono text-center uppercase tracking-wider py-1 select-none">
            Sem avaliações. Reaja acima!
          </p>
        )}

        {comment.author.id === currentUser.id && (
          <div className="text-[7px] text-gray-600 font-black tracking-widest uppercase text-center mt-1 select-none animate-pulse">
            👆 Premir longamente para eliminar
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedView({
  currentUser,
  posts,
  stories,
  onNavigate,
  onLikePost,
  onDeletePost,
  onLikeStory,
  onAddStoryView,
  onAddPostView,
  onAddPostListen,
  onAddPostShare,
  onRatePost,
  onAddComment,
  onDeleteComment,
  onReactComment,
  autoOpenPostId,
  onClearAutoOpenPost,
  currentThemeConfig,
  onNavigateToTarget,
  currentLanguage = 'pt',
}: FeedViewProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isFullScreenVideo, setIsFullScreenVideo] = useState(false);
  const [isFsVideoMuted, setIsFsVideoMuted] = useState(false);
  const [fsVideoSpeed, setFsVideoSpeed] = useState(1);
  const [isFsVideoPlaying, setIsFsVideoPlaying] = useState(true);
  const [fsVideoCurrentTime, setFsVideoCurrentTime] = useState(0);
  const [fsVideoDuration, setFsVideoDuration] = useState(0);
  const fsVideoRef = useRef<HTMLVideoElement>(null);

  // Interactive media playback, reading, and downloading states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceCurrentTime, setVoiceCurrentTime] = useState(0);
  const [voiceSpeed, setVoiceSpeed] = useState(1); // 1x, 1.5x, 2x
  const voiceAudioRef = useRef<HTMLAudioElement>(null);

  const [currentDocPage, setCurrentDocPage] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(-1); // -1 is idle

  // Document Reader modern / fun states
  const [isFullScreenDoc, setIsFullScreenDoc] = useState(false);
  const [docFontSize, setDocFontSize] = useState(16); // default 16px text size
  const [isNarrating, setIsNarrating] = useState(false);
  const [isNarrationPaused, setIsNarrationPaused] = useState(false);
  const [showEyesMaxAlert, setShowEyesMaxAlert] = useState(false);

  // Premium Narrator Voice Customization System (Human & Character Pay Pack)
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<'standard' | 'soft' | 'excited' | 'pro' | 'laugh' | 'paymax'>('standard');
  const [downloadedVoices, setDownloadedVoices] = useState<Record<string, boolean>>({ standard: true });
  const [showVoiceDownloadModal, setShowVoiceDownloadModal] = useState(false);
  const [voiceToDownload, setVoiceToDownload] = useState<'soft' | 'excited' | 'pro' | 'laugh' | 'paymax' | null>(null);
  const [isDownloadingVoice, setIsDownloadingVoice] = useState(false);
  const [voiceDownloadProgress, setVoiceDownloadProgress] = useState(0);
  const [voiceDownloadStep, setVoiceDownloadStep] = useState('');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const adaptiveUtterancesQueueRef = useRef<any[]>([]);
  const currentSpeechIndexRef = useRef<number>(0);
  
  // Document download states
  const [downloadedDocIds, setDownloadedDocIds] = useState<Record<string, boolean>>({});
  const [isDownloadingDoc, setIsDownloadingDoc] = useState(false);
  const [docDownloadProgress, setDocDownloadProgress] = useState(0);
  const [docDownloadStep, setDocDownloadStep] = useState('');

  // Local document upload and extraction inside reader
  const [localDocText, setLocalDocText] = useState<string | null>(null);
  const [localDocTitle, setLocalDocTitle] = useState<string | null>(null);
  const [isExtractingLocal, setIsExtractingLocal] = useState(false);
  const [localExtractionProgress, setLocalExtractionProgress] = useState(0);
  const [localExtractionError, setLocalExtractionError] = useState('');
  const localDocInputRef = useRef<HTMLInputElement>(null);

  // Helper to dynamically load PDFJS from CDN
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('PDF.js não pôde ser inicializado'));
        }
      };
      script.onerror = () => reject(new Error('Falha ao carregar motor de PDF (PDF.js)'));
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (
    file: File, 
    onProgress: (progress: number) => void
  ): Promise<{ text: string; pageCount: number }> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      
      if (items.length === 0) {
        fullText += '[Página Vazia]\n\n';
        onProgress(Math.floor((i / numPages) * 100));
        continue;
      }

      // Group items by their vertical position (Y coordinate) and sort them properly.
      // transform[5] is the Y coordinate and transform[4] is the X coordinate.
      // PDF coordinate space has Y going up, so higher Y is at the top of the physical page.
      items.sort((a, b) => {
        const yA = a.transform[5] || 0;
        const yB = b.transform[5] || 0;
        const xA = a.transform[4] || 0;
        const xB = b.transform[4] || 0;
        
        // If Y is within 4 units, treat them as the same line
        if (Math.abs(yA - yB) < 4) {
          return xA - xB; // left-to-right
        }
        return yB - yA; // top-to-bottom
      });

      let pageLines: string[] = [];
      let currentLineItems: any[] = [];
      let lastY = items[0].transform[5] || 0;

      for (const item of items) {
        const y = item.transform[5] || 0;
        // Check if item belongs to the current line
        if (Math.abs(y - lastY) >= 8 && currentLineItems.length > 0) {
          // Commit current line
          pageLines.push(assembleLineText(currentLineItems));
          currentLineItems = [];
          lastY = y;
        }
        currentLineItems.push(item);
      }

      if (currentLineItems.length > 0) {
        pageLines.push(assembleLineText(currentLineItems));
      }

      const pageText = pageLines.join('\n');
      fullText += pageText + '\n\n';
      onProgress(Math.floor((i / numPages) * 100));
    }

    return { text: fullText.trim(), pageCount: numPages };
  };

  // Inline helper to assemble a line, inserting spacing for columns/margins/indentation
  const assembleLineText = (lineItems: any[]): string => {
    if (lineItems.length === 0) return '';
    // Sort left to right
    lineItems.sort((a, b) => (a.transform[4] || 0) - (b.transform[4] || 0));

    let lineStr = '';
    let lastX = lineItems[0].transform[4] || 0;
    
    for (const item of lineItems) {
      const x = item.transform[4] || 0;
      const str = item.str || '';
      
      // Calculate distance from last item to detect columns or tabs
      const gap = x - lastX;
      if (gap > 12 && lineStr.length > 0) {
        // Approximate space count based on the physical size of the gap
        const spacesCount = Math.min(6, Math.max(1, Math.floor(gap / 6)));
        lineStr += ' '.repeat(spacesCount);
      }
      
      lineStr += str;
      lastX = x + (item.width || 0);
    }
    return lineStr;
  };

  const handleLocalDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalDocTitle(file.name);
    setLocalExtractionError('');
    setIsExtractingLocal(true);
    setLocalExtractionProgress(0);

    // If PDF
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const result = await extractTextFromPdf(file, (progress) => {
          setLocalExtractionProgress(progress);
        });
        setLocalDocText(result.text);
        setCurrentDocPage(0);
        setIsFullScreenDoc(true); // Automatically open immersive reader with extracted text!
      } catch (err: any) {
        console.error(err);
        setLocalExtractionError('Erro ao extrair texto do PDF: ' + (err.message || err));
      } finally {
        setIsExtractingLocal(false);
      }
    } 
    // If TXT or MD
    else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const rawText = ev.target?.result as string || '';
          setLocalDocText(rawText);
          setLocalExtractionProgress(100);
          setCurrentDocPage(0);
          setIsFullScreenDoc(true); // Automatically open immersive reader with extracted text!
          setTimeout(() => setIsExtractingLocal(false), 300);
        };
        reader.readAsText(file);
      } catch (err: any) {
        setLocalExtractionError('Erro ao ler ficheiro de texto.');
        setIsExtractingLocal(false);
      }
    } else {
      setLocalExtractionError('Apenas suportamos ficheiros .pdf, .txt ou .md para extração de texto.');
      setIsExtractingLocal(false);
    }
  };

  // Adjustable video container states
  const [videoFitMode, setVideoFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [videoHeightSize, setVideoHeightSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16/9' | '4/3' | '9/16' | 'free'>('16/9');

  // Reset media states when selecting a different post
  useEffect(() => {
    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    setIsMusicPlaying(false);
    setMusicCurrentTime(0);
    setIsVoicePlaying(false);
    setVideoFitMode('contain');
    setVideoHeightSize('md');
    setVideoAspectRatio('16/9');
    setVoiceCurrentTime(0);
    setVoiceSpeed(1);
    setCurrentDocPage(0);
    setDownloadProgress(-1);

    // Reset document states
    setIsFullScreenDoc(false);
    setDocFontSize(16);
    setIsNarrating(false);
    setIsNarrationPaused(false);
    setShowEyesMaxAlert(false);
    setIsDownloadingDoc(false);
    setDocDownloadProgress(0);
    setDocDownloadStep('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [selectedPost]);

  // Clean up Speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const parseDialogueSegments = (text: string) => {
    const segments: Array<{ text: string; role: 'narrator' | 'character_f' | 'character_m' }> = [];
    if (!text) return segments;

    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      // Match "Alice:" or "Bob:" etc.
      const match = line.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,15}):\s*(.*)$/);
      if (match) {
        const name = match[1].toLowerCase().trim();
        const content = match[2];

        if (['maria', 'ana', 'alice', 'ela', 'she', 'clara', 'beatriz', 'isabel', 'sofia', 'lucia', 'lúcia'].includes(name)) {
          segments.push({ text: content, role: 'character_f' });
        } else if (['joao', 'joão', 'pedro', 'rui', 'carlos', 'ele', 'he', 'bob', 'miguel', 'antónio', 'antonio', 'narrador'].includes(name)) {
          segments.push({ text: content, role: name === 'narrador' ? 'narrator' : 'character_m' });
        } else {
          const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          segments.push({ text: content, role: charCodeSum % 2 === 0 ? 'character_f' : 'character_m' });
        }
      } else {
        // Find dialogs wrapped in quotes inside the line
        const parts = line.split(/("[^"]*")/g);
        for (const part of parts) {
          if (!part.trim()) continue;
          if (part.startsWith('"') && part.endsWith('"')) {
            const content = part.substring(1, part.length - 1);
            segments.push({ text: content, role: 'character_f' });
          } else {
            segments.push({ text: part, role: 'narrator' });
          }
        }
      }
    }

    if (segments.length === 0 && text.trim()) {
      segments.push({ text, role: 'narrator' });
    }
    return segments;
  };

  const speakSegmentsQueue = (segments: any[], index: number) => {
    if (index >= segments.length) {
      setIsNarrating(false);
      setIsNarrationPaused(false);
      setActiveSegmentIndex(null);
      return;
    }

    currentSpeechIndexRef.current = index;
    setActiveSegmentIndex(index);
    const segment = segments[index];

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = currentLanguage === 'pt' ? 'pt-PT' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith(currentLanguage === 'pt' ? 'pt' : 'en'));
    if (!selectedVoice && currentLanguage === 'pt') {
      selectedVoice = voices.find(v => v.lang.startsWith('pt'));
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    if (segment.role === 'character_f') {
      utterance.rate = 1.05;
      utterance.pitch = 1.35;
    } else if (segment.role === 'character_m') {
      utterance.rate = 0.9;
      utterance.pitch = 0.75;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 0.95;
    }

    utterance.onend = () => {
      setTimeout(() => {
        if (currentSpeechIndexRef.current === index) {
          speakSegmentsQueue(segments, index + 1);
        }
      }, 500);
    };

    utterance.onerror = (e) => {
      console.error('Speech error in PayMax:', e);
      if (e.error !== 'interrupted') {
        speakSegmentsQueue(segments, index + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleNarration = () => {
    playClickFeedback();
    const isEyesMax = currentThemeConfig?.id === 'eyes-max';
    if (!isEyesMax) {
      setShowEyesMaxAlert(true);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Seu dispositivo não suporta leitura por voz.');
      return;
    }

    // Check if the selected voice style is downloaded
    if (!downloadedVoices[selectedVoiceStyle]) {
      setVoiceToDownload(selectedVoiceStyle);
      setShowVoiceDownloadModal(true);
      return;
    }

    if (isNarrating) {
      if (isNarrationPaused) {
        window.speechSynthesis.resume();
        setIsNarrationPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsNarrationPaused(true);
      }
    } else {
      window.speechSynthesis.cancel();
      const textSource = localDocText || selectedPost?.text || '';
      const pages = textSource ? textSource.split('\n\n') : [];
      const textToRead = pages[currentDocPage] || textSource || '';
      if (!textToRead.trim()) return;

      setIsNarrating(true);
      setIsNarrationPaused(false);

      if (selectedVoiceStyle === 'paymax') {
        const segments = parseDialogueSegments(textToRead);
        speakSegmentsQueue(segments, 0);
      } else {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = currentLanguage === 'pt' ? 'pt-PT' : 'en-US';

        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang.startsWith(currentLanguage === 'pt' ? 'pt' : 'en'));
        if (!selectedVoice && currentLanguage === 'pt') {
          selectedVoice = voices.find(v => v.lang.startsWith('pt'));
        }
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Apply styled parameter tweaks for humanized feel
        if (selectedVoiceStyle === 'soft') {
          utterance.rate = 0.85;
          utterance.pitch = 0.95;
        } else if (selectedVoiceStyle === 'excited') {
          utterance.rate = 1.25;
          utterance.pitch = 1.2;
        } else if (selectedVoiceStyle === 'pro') {
          utterance.rate = 1.0;
          utterance.pitch = 0.95;
        } else if (selectedVoiceStyle === 'laugh') {
          utterance.rate = 1.1;
          utterance.pitch = 1.35;
        } else {
          // standard
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
        }

        utterance.onend = () => {
          setIsNarrating(false);
          setIsNarrationPaused(false);
        };
        utterance.onerror = () => {
          setIsNarrating(false);
          setIsNarrationPaused(false);
        };

        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleStopNarration = () => {
    playClickFeedback();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsNarrating(false);
    setIsNarrationPaused(false);
    setActiveSegmentIndex(null);
    currentSpeechIndexRef.current = -1;
  };

  // Audio recording states & systems
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const startVoiceRecording = async () => {
    playClickFeedback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudioUrl(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("MediaRecorder failed or permission denied, using luxury synthesizer audio fallback:", err);
      // Fallback: Simulate active luxury recording with synthesized notes
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudioUrl(null);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopVoiceRecording = (save: boolean) => {
    playClickFeedback();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (!save) {
        setRecordedAudioUrl(null);
      }
    } else {
      // Synthesized Fallback stops
      if (save) {
        const sampleRate = 8000;
        const numSamples = sampleRate * Math.max(2, recordingDuration || 4);
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);
        
        // Write WAV header
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + numSamples * 2, true);
        view.setUint32(8, 0x57415645, false); // "WAVE"
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // LPCM
        view.setUint16(22, 1, true); // mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, numSamples * 2, true);
        
        // Write dynamic luxury chord tones!
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          // Soft cascading harmonic melody for luxury voice comment feeling
          let freq = 440;
          if (t > 1.0) freq = 554;
          if (t > 2.0) freq = 659;
          if (t > 3.0) freq = 880;
          
          const sample = Math.sin(2 * Math.PI * freq * t) * 0.35 * Math.exp(-1.5 * (t % 1.0));
          const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
          view.setInt16(44 + i * 2, intSample, true);
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setRecordedAudioUrl(audioUrl);
      } else {
        setRecordedAudioUrl(null);
      }
    }
    setIsRecording(false);
  };
  const [isPlayingStory, setIsPlayingStory] = useState(true);
  const [storyProgress, setStoryProgress] = useState(0);

  // Real-time social relations states
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [permissions, setPermissions] = useState<ChatPermission[]>([]);
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);
  const [requestLevel, setRequestLevel] = useState<'conhecido' | 'amigo' | 'parceiro' | 'familia' | 'equipe' | 'vip'>('conhecido');
  const [requestDuration, setRequestDuration] = useState<'24h' | '48h' | '7d' | 'permanent'>('48h');

  useEffect(() => {
    const unsubUsers = subscribeUsers(setDbUsers);
    const unsubFriendships = subscribeFriendships(setFriendships);
    const unsubPermissions = subscribeChatPermissions(setPermissions);
    return () => {
      unsubUsers();
      unsubFriendships();
      unsubPermissions();
    };
  }, []);

  // Auto open post from notification
  useEffect(() => {
    if (autoOpenPostId && posts.length > 0) {
      const foundPost = posts.find(p => p.id === autoOpenPostId);
      if (foundPost) {
        setSelectedPost(foundPost);
        onAddPostView(foundPost.id);
        if (onClearAutoOpenPost) {
          onClearAutoOpenPost();
        }
      }
    }
  }, [autoOpenPostId, posts, onClearAutoOpenPost, onAddPostView]);

  // Handles story slider progress bar
  useEffect(() => {
    if (selectedStoryIndex === null || !isPlayingStory) return;

    setStoryProgress(0);
    const totalDuration = 5000; // 5 seconds
    const intervalTime = 50;
    const increment = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Advance story
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [selectedStoryIndex, isPlayingStory]);

  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
    setIsPlayingStory(true);
    setStoryProgress(0);
    onAddStoryView(stories[index].id);
  };

  const handleNextStory = () => {
    if (selectedStoryIndex === null) return;
    if (selectedStoryIndex < stories.length - 1) {
      const nextIndex = selectedStoryIndex + 1;
      setSelectedStoryIndex(nextIndex);
      setStoryProgress(0);
      onAddStoryView(stories[nextIndex].id);
    } else {
      setSelectedStoryIndex(null); // end of stories
    }
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex === null) return;
    if (selectedStoryIndex > 0) {
      const prevIndex = selectedStoryIndex - 1;
      setSelectedStoryIndex(prevIndex);
      setStoryProgress(0);
    }
  };

  const handleShare = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado para a área de transferência!');
  };

  const currentStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;

  const gridClasses = (() => {
    if (currentThemeConfig?.id === 'eyes-max') {
      return 'grid-cols-2 w-full max-w-5xl gap-4 md:gap-6';
    }
    const colType = currentThemeConfig?.gridCols || 'grid';
    switch (colType) {
      case '1-col':
        return 'grid-cols-1 max-w-xl mx-auto';
      case 'grid':
        return 'grid-cols-1 sm:grid-cols-2 max-w-4xl';
      case '3-col':
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl';
    }
  })();

  return (
    <div className={`flex-1 relative overflow-y-auto no-scrollbar pb-16 ${currentThemeConfig?.id === 'eyes-max' ? 'bg-[#060502]' : ''}`}>
      {currentThemeConfig?.id === 'eyes-max' && <ShimmeringBackground />}
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 font-rajdhani select-none text-white">
      {/* SECTION 1: EYES 42H STORIES */}
      <section className="bg-[#090920]/65 border border-neon-cyan/15 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron font-extrabold text-lg tracking-widest bg-gradient-to-r from-neon-magenta to-neon-cyan bg-clip-text text-transparent glow-text-cyan">
            EYES 42H
          </h2>
          <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
            Histórias Recentes
          </span>
        </div>

        {/* Stories Horizontal Slider Container */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {/* Create new story item circle */}
          <div className="flex flex-col items-center shrink-0">
            <button
              onClick={() => onNavigate('publish-story')}
              className="w-16 h-16 rounded-full border-2 border-dashed border-neon-cyan/60 hover:border-neon-cyan hover:bg-neon-cyan/10 flex items-center justify-center text-neon-cyan bg-[#0a0a24]/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-neon-cyan/5"
            >
              <Plus className="w-7 h-7 stroke-[2.5px]" />
            </button>
            <span className="text-[10px] text-neon-cyan font-bold mt-2 tracking-wide uppercase">Publicar</span>
          </div>

          {/* Active circular story list */}
          {stories.map((st, idx) => (
            <div key={st.id} className="flex flex-col items-center shrink-0">
              <button
                onClick={() => handleOpenStory(idx)}
                className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-neon-cyan via-[#9d00ff] to-neon-magenta hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-neon-cyan/10"
              >
                <div className="w-full h-full rounded-full overflow-hidden border border-[#0d0d26]">
                  <img 
                    src={st.src} 
                    alt={st.author.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
              <span className="text-[10px] text-gray-400 font-semibold mt-2 truncate w-14 text-center">
                {st.author.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: PUBLICAÇÕES MAIN FEED */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neon-cyan/10 pb-3">
          <h2 className="font-orbitron font-extrabold text-xl tracking-widest text-white glow-text-cyan flex items-center gap-2">
            PUBLICAÇÕES
          </h2>
          <button
            onClick={() => onNavigate('publish-post')}
            className="flex items-center gap-1 px-3 py-1.5 bg-neon-cyan/15 hover:bg-neon-cyan hover:text-black border border-neon-cyan/40 text-neon-cyan rounded-lg text-xs font-bold font-orbitron transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5px]" /> PUBLICAR
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neon-cyan/10 rounded-2xl bg-[#090920]/20">
            <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Nenhuma publicação encontrada no feed.</p>
          </div>
        ) : (
          <div className={`grid gap-6 transition-all duration-500 ease-in-out ${gridClasses}`}>
            {posts.map((post) => (
              <RotationalCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                currentThemeConfig={currentThemeConfig}
                onLike={() => onLikePost(post.id)}
                onDelete={() => onDeletePost(post.id)}
                onClick={() => {
                  setSelectedPost(post);
                  onAddPostView(post.id);
                }}
                onAddView={() => onAddPostView(post.id)}
                onAuthorClick={() => onNavigateToTarget && onNavigateToTarget('profile', post.author.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* MODAL 1: IMMERSIVE FULL SCREEN EYES 42H STORIES VIEWER */}
      <AnimatePresence>
        {currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black/98 p-4 md:p-6"
          >
            {/* Background blur overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl pointer-events-none"
              style={{ backgroundImage: `url(${currentStory.src})` }}
            />

            {/* Close Button */}
            <button
              onClick={() => setSelectedStoryIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Core Story Card */}
            <div className="relative w-full max-w-[420px] aspect-[9/16] bg-[#0c0c24] border border-neon-cyan/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Story Progress timeline indicator */}
              <div className="absolute top-3 inset-x-4 flex gap-1 z-20">
                {stories.map((st, idx) => {
                  let width = '0%';
                  if (idx < selectedStoryIndex) width = '100%';
                  if (idx === selectedStoryIndex) width = `${storyProgress}%`;
                  return (
                    <div key={st.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all duration-75"
                        style={{ width }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Story Header */}
              <div className="absolute top-7 inset-x-4 flex items-center justify-between z-20 select-none">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={currentStory.author.avatar || "https://i.pravatar.cc/80?img=1"} 
                    alt={currentStory.author.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border border-neon-cyan/80 object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-white shadow-sm leading-tight">{currentStory.author.name}</p>
                    <p className="text-[9px] text-gray-300 font-mono mt-0.5 shadow-sm">
                      {new Date(currentStory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Soundtrack track banner */}
                {currentStory.musicName && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 border border-neon-cyan/20 rounded-full text-[9px] text-neon-cyan font-semibold">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-neon-cyan" />
                    <span className="truncate max-w-[80px]">{currentStory.musicName}</span>
                  </div>
                )}
              </div>

              {/* Image viewport */}
              <div className="relative flex-1 bg-black flex items-center justify-center">
                <img 
                  src={currentStory.src} 
                  alt="Story Content" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {/* Story black mist (smoke) layer if any */}
                {/* Optional dark ambient mist filter simulation */}
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                {/* Text overlay overlays */}
                {currentStory.text && (
                  <div className="absolute inset-x-4 text-center px-4 py-3 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md">
                    <p 
                      className="text-lg font-bold leading-relaxed"
                      style={{ 
                        fontFamily: currentStory.style?.font || 'Poppins', 
                        color: currentStory.style?.color || '#ffffff' 
                      }}
                    >
                      {currentStory.text}
                    </p>
                  </div>
                )}

                {/* Left/Right swipe tapping areas */}
                <button 
                  onClick={handlePrevStory}
                  className="absolute left-0 top-20 bottom-20 w-1/4 cursor-w-resize"
                  title="Anterior"
                />
                <button 
                  onClick={handleNextStory}
                  className="absolute right-0 top-20 bottom-20 w-1/4 cursor-e-resize"
                  title="Seguinte"
                />
              </div>

              {/* Story footer analytics & actions */}
              <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-between gap-4 z-20 select-none">
                <div className="flex items-center gap-4 text-xs font-mono font-semibold text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-neon-cyan/70" /> {currentStory.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500/70" /> {currentStory.stars || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Pause / Play */}
                  <button
                    onClick={() => setIsPlayingStory(!isPlayingStory)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    title={isPlayingStory ? "Pausar" : "Retomar"}
                  >
                    {isPlayingStory ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => handleShare(`https://openmz.com/story/${currentStory.id}`)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    title="Partilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Star (Like) */}
                  {(() => {
                    const isStoryStarredByMe = currentStory && currentStory.starredBy 
                      ? !!currentStory.starredBy[currentUser.id] 
                      : (currentStory ? currentStory.starred : false);
                    return (
                      <button
                        onClick={() => onLikeStory(currentStory.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                          isStoryStarredByMe
                            ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/30'
                            : 'bg-white/10 border-white/25 text-gray-300'
                        }`}
                        title="Gostar"
                      >
                        <Star className={`w-4 h-4 ${isStoryStarredByMe ? 'fill-white' : ''}`} />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DETAILED SINGLE POST VIEWER */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.85, rotateX: 15, y: 50, opacity: 0 }}
              animate={{ scale: 1, rotateX: 0, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, rotateX: -15, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
              className={`relative w-full max-w-[550px] max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl p-6 shadow-3xl text-center border-2 ${
                currentThemeConfig?.id === 'eyes-max'
                  ? 'bg-[#141108] border-amber-500 shadow-amber-500/10'
                  : 'bg-[#0c0c24] border-neon-cyan shadow-neon-cyan/20'
              }`}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {selectedPost.author.id === currentUser.id && (
                <button
                  onClick={() => {
                    playClickFeedback();
                    if (confirm('Tem a certeza que deseja eliminar esta publicação permanentemente?')) {
                      onDeletePost(selectedPost.id);
                      setSelectedPost(null);
                    }
                  }}
                  className="absolute top-4 right-14 w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 border border-red-500/30 text-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-10 shadow-lg"
                  title="Eliminar Publicação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <h3 className={`font-orbitron font-extrabold text-lg tracking-wide mb-4 uppercase ${
                currentThemeConfig?.id === 'eyes-max' ? 'text-amber-400' : 'text-neon-cyan'
              }`}>
                {translate('detalhes_post', currentLanguage)}
              </h3>

              {/* DYNAMIC MULTIMEDIA RENDERERS */}

              {/* 1. PHOTOGRAPHY FORMAT */}
              {selectedPost.type === 'photo' && selectedPost.image && (
                <div 
                  onClick={() => {
                    playClickFeedback();
                    setFullScreenImage(selectedPost.image);
                  }}
                  className={`w-full aspect-video rounded-xl overflow-hidden mb-4 cursor-pointer group relative border ${
                    currentThemeConfig?.id === 'eyes-max' ? 'border-amber-500/30' : 'border-neon-cyan/20'
                  }`}
                >
                  <img 
                    src={selectedPost.image} 
                    alt="Post Ampliado" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/75 px-3.5 py-1.5 rounded-full border border-white/20 font-orbitron">
                      🔍 Ver Tela Cheia
                    </span>
                  </div>
                </div>
              )}

              {/* 2. VIDEO PLAYER FORMAT */}
              {selectedPost.type === 'video' && selectedPost.mediaUrl && (
                <div className="space-y-3 mb-4">
                  {/* Adjustable controls for Format/Canvas sizing */}
                  <div className="bg-neutral-950/80 p-3 rounded-2xl border border-white/10 space-y-2 text-left">
                    <div className="text-[9px] font-orbitron font-extrabold text-[var(--theme-accent)] tracking-widest uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[var(--theme-accent)] rounded-full animate-pulse" />
                      <span>⚙️ CONFIGURAR FORMATO DE TELA (JUSTÁVEL)</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2.5 text-[10px]">
                      {/* Aspect Ratio Selector */}
                      <div className="space-y-1">
                        <label className="block text-[8px] text-gray-500 font-bold uppercase tracking-wider">Proporção</label>
                        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                          {(['16/9', '4/3', '9/16', 'free'] as const).map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setVideoAspectRatio(ratio)}
                              className={`flex-1 py-1 text-[8px] font-mono font-bold rounded-md transition-all ${
                                videoAspectRatio === ratio 
                                  ? 'bg-[var(--theme-accent)] text-black shadow-sm font-black' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {ratio === 'free' ? 'Livre' : ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Object Fit Selector */}
                      <div className="space-y-1">
                        <label className="block text-[8px] text-gray-500 font-bold uppercase tracking-wider">Preencher</label>
                        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                          {(['contain', 'cover', 'fill'] as const).map((fit) => (
                            <button
                              key={fit}
                              onClick={() => setVideoFitMode(fit)}
                              className={`flex-1 py-1 text-[8px] font-mono font-bold rounded-md transition-all ${
                                videoFitMode === fit 
                                  ? 'bg-[var(--theme-accent)] text-black shadow-sm font-black' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {fit === 'contain' ? 'Conter' : fit === 'cover' ? 'Cortar' : 'Esticar'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Height Size Selector */}
                      <div className="space-y-1">
                        <label className="block text-[8px] text-gray-500 font-bold uppercase tracking-wider">Altura Canvas</label>
                        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                          {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => setVideoHeightSize(size)}
                              className={`flex-1 py-1 text-[8px] font-mono font-bold rounded-md transition-all ${
                                videoHeightSize === size 
                                  ? 'bg-[var(--theme-accent)] text-black shadow-sm font-black' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {size.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flexible Responsive Canvas wrapper depending on states */}
                  <div 
                    onClick={() => {
                      playClickFeedback();
                      setIsFullScreenVideo(true);
                      if (videoRef.current) {
                        videoRef.current.pause();
                        setIsVideoPlaying(false);
                      }
                    }}
                    className="w-full bg-black rounded-3xl border border-white/10 overflow-hidden relative transition-all duration-300 flex items-center justify-center mx-auto cursor-pointer group"
                    style={{
                      aspectRatio: videoAspectRatio !== 'free' ? videoAspectRatio.replace('/', ' / ') : undefined,
                      height: videoHeightSize === 'sm' ? '180px' : 
                              videoHeightSize === 'md' ? '280px' : 
                              videoHeightSize === 'lg' ? '380px' : 
                              videoHeightSize === 'xl' ? '480px' : '100%',
                      maxHeight: videoHeightSize === 'full' ? '60vh' : undefined
                    }}
                  >
                    <video 
                      ref={videoRef}
                      src={selectedPost.mediaUrl}
                      onTimeUpdate={() => setVideoCurrentTime(videoRef.current?.currentTime || 0)}
                      onLoadedMetadata={() => setVideoDuration(videoRef.current?.duration || 0)}
                      className="w-full h-full transition-all duration-300 pointer-events-none"
                      style={{
                        objectFit: videoFitMode,
                        filter: selectedPost.extraData?.videoFilter === 'vintage' ? 'sepia(0.5) contrast(1.1) brightness(0.9)' :
                                selectedPost.extraData?.videoFilter === 'neon' ? 'saturate(2) hue-rotate(15deg) contrast(1.1)' :
                                selectedPost.extraData?.videoFilter === 'cyber' ? 'hue-rotate(-20deg) saturate(1.8) contrast(1.2)' :
                                selectedPost.extraData?.videoFilter === 'bw' ? 'grayscale(1) contrast(1.3) brightness(0.95)' :
                                selectedPost.extraData?.videoFilter === 'warm' ? 'sepia(0.2) saturate(1.4) hue-rotate(-5deg) contrast(1.05)' :
                                selectedPost.extraData?.videoFilter === 'vhs' ? 'contrast(1.1) brightness(1.05) saturate(1.25) blur(0.3px)' : 'none'
                      }}
                    />
                    {/* Hover indicator overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/75 px-3.5 py-1.5 rounded-full border border-white/20 font-orbitron flex items-center gap-1.5">
                        📺 VER EM TELA CHEIA (MAX RESOLUÇÃO)
                      </span>
                    </div>
                  </div>
                  
                  {/* HTML5 Customized controllers */}
                  <div className="p-3.5 bg-neutral-950/85 flex items-center gap-3 border border-white/5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        playClickFeedback();
                        if (isVideoPlaying) {
                          videoRef.current?.pause();
                          setIsVideoPlaying(false);
                        } else {
                          videoRef.current?.play();
                          setIsVideoPlaying(true);
                        }
                      }}
                      className="w-8.5 h-8.5 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                    </button>

                    <input 
                      type="range"
                      min="0"
                      max={videoDuration || 100}
                      value={videoCurrentTime}
                      onChange={(e) => {
                        const t = Number(e.target.value);
                        if (videoRef.current) {
                          videoRef.current.currentTime = t;
                          setVideoCurrentTime(t);
                        }
                      }}
                      className="flex-1 accent-[var(--theme-accent)] h-1.5 rounded cursor-pointer"
                    />

                    <span className="text-[10px] font-mono text-gray-300 font-bold">
                      {Math.floor(videoCurrentTime / 60)}:{(Math.floor(videoCurrentTime % 60)).toString().padStart(2, '0')} / 
                      {Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60)).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. MUSIC PLAYER FORMAT (Vinyl CD + EQ Visualizer) */}
              {selectedPost.type === 'audio' && selectedPost.mediaUrl && (
                <div className="w-full p-6 rounded-3xl border border-white/10 mb-4 flex flex-col items-center relative overflow-hidden bg-neutral-950">
                  {/* Blurred Background Cover Art matching user's request */}
                  {selectedPost.mediaCover || selectedPost.image ? (
                    <img 
                      src={selectedPost.mediaCover || selectedPost.image || undefined} 
                      alt="Blurred music background" 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none select-none"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#121230] to-[#280c35]" />
                  )}
                  {/* Dark Glass Overlay */}
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] pointer-events-none" />

                  {/* Rest of player inside content layer */}
                  <div className="relative z-10 w-full flex flex-col items-center">
                    <audio 
                      ref={musicAudioRef}
                      src={selectedPost.mediaUrl}
                      onTimeUpdate={() => setMusicCurrentTime(musicAudioRef.current?.currentTime || 0)}
                      onLoadedMetadata={() => setMusicDuration(musicAudioRef.current?.duration || 0)}
                      onEnded={() => {
                        setIsMusicPlaying(false);
                        setMusicCurrentTime(0);
                      }}
                    />

                    {/* Vinyl rotating disc cover art */}
                    <motion.div 
                      animate={isMusicPlaying ? { rotate: 360 } : {}}
                      transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                      className={`w-32 h-32 rounded-full border-4 ${
                        currentThemeConfig?.id === 'eyes-max' ? 'border-amber-500/40' : 'border-neon-cyan/40'
                      } bg-black shadow-2xl relative flex items-center justify-center shrink-0 mb-4`}
                    >
                      <div className="absolute inset-2 border border-white/5 rounded-full" />
                      <div className="absolute inset-5 border border-white/5 rounded-full" />
                      <div className="absolute inset-8 border border-white/5 rounded-full" />
                      
                      {selectedPost.mediaCover || selectedPost.image ? (
                        <img 
                          src={selectedPost.mediaCover || selectedPost.image || undefined} 
                          alt="Music Album CD"
                          className="w-14 h-14 rounded-full object-cover border border-neutral-800 pointer-events-none select-none"
                        />
                      ) : (
                        <Disc className="w-12 h-12 text-[var(--theme-accent)]" />
                      )}
                      <div className="absolute w-4 h-4 bg-neutral-900 rounded-full border border-white/10" />
                    </motion.div>

                    <h4 className="text-sm font-orbitron font-extrabold text-[var(--theme-accent)] tracking-widest uppercase">
                      {selectedPost.title || 'Música Sem Nome'}
                    </h4>
                    <p className="text-xs font-bold text-gray-400 mt-1">@{selectedPost.artist || 'Artista'}</p>

                    {/* Equalizer Wave simulation */}
                    <div className="h-6 flex items-end gap-[3px] my-3">
                      {[0.1, 0.4, 0.7, 0.2, 0.9, 0.5, 0.8, 0.3, 0.6, 0.4, 0.2, 0.7].map((delay, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 rounded-t transition-all duration-300 ${
                            isMusicPlaying ? 'bg-[var(--theme-accent)]' : 'bg-neutral-800'
                          }`}
                          style={{ 
                            height: isMusicPlaying ? `${Math.floor(Math.random() * 20) + 4}px` : '4px',
                            transitionDelay: isMusicPlaying ? `${delay}s` : '0s'
                          }}
                        />
                      ))}
                    </div>

                    {/* Progress Seek bar */}
                    <div className="w-full flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          playClickFeedback();
                          if (isMusicPlaying) {
                            musicAudioRef.current?.pause();
                            setIsMusicPlaying(false);
                          } else {
                            musicAudioRef.current?.play();
                            setIsMusicPlaying(true);
                            // Increment real listens once
                            if (onAddPostListen) onAddPostListen(selectedPost.id);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        {isMusicPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
                      </button>

                      <input 
                        type="range"
                        min="0"
                        max={musicDuration || 100}
                        value={musicCurrentTime}
                        onChange={(e) => {
                          const t = Number(e.target.value);
                          if (musicAudioRef.current) {
                            musicAudioRef.current.currentTime = t;
                            setMusicCurrentTime(t);
                          }
                        }}
                        className="flex-grow accent-[var(--theme-accent)] cursor-pointer h-1 rounded"
                      />

                      <span className="text-[10px] font-mono text-gray-400">
                        {Math.floor(musicCurrentTime / 60)}:{(Math.floor(musicCurrentTime % 60)).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. VOICE RECORDING PLAYER FORMAT (with speed controller) */}
              {selectedPost.type === 'voice' && selectedPost.mediaUrl && (
                <div className="w-full p-4 rounded-2xl bg-black/45 border border-white/5 mb-4 flex flex-col items-center">
                  <audio 
                    ref={voiceAudioRef}
                    src={selectedPost.mediaUrl}
                    onTimeUpdate={() => setVoiceCurrentTime(voiceAudioRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setVoiceDuration(voiceAudioRef.current?.duration || 0)}
                    onEnded={() => {
                      setIsVoicePlaying(false);
                      setVoiceCurrentTime(0);
                    }}
                  />

                  <div className="flex items-center gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        playClickFeedback();
                        if (isVoicePlaying) {
                          voiceAudioRef.current?.pause();
                          setIsVoicePlaying(false);
                        } else {
                          voiceAudioRef.current?.play();
                          setIsVoicePlaying(true);
                          if (onAddPostListen) onAddPostListen(selectedPost.id);
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center hover:scale-105 transition-all shrink-0 cursor-pointer"
                    >
                      {isVoicePlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
                    </button>

                    <div className="flex-1 text-left">
                      <span className="text-[10px] font-orbitron font-extrabold text-[var(--theme-accent)] uppercase tracking-wider block">Registo de Voz</span>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {Math.floor(voiceCurrentTime / 60)}:{(Math.floor(voiceCurrentTime % 60)).toString().padStart(2, '0')} / 
                        {Math.floor(voiceDuration / 60)}:{(Math.floor(voiceDuration % 60)).toString().padStart(2, '0')}
                      </span>
                      
                      <div className="flex items-end gap-1 h-6 mt-1.5 opacity-80">
                        {Array.from({ length: 24 }).map((_, idx) => {
                          const isActive = (idx / 24) * voiceDuration <= voiceCurrentTime;
                          return (
                            <div 
                              key={idx} 
                              className={`w-[3px] rounded-t transition-colors ${
                                isActive ? 'bg-[var(--theme-accent)]' : 'bg-neutral-800'
                              }`}
                              style={{ height: `${Math.sin(idx * 0.4) * 12 + 14}px` }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Voice speed toggle (1x, 1.5x, 2x) */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickFeedback();
                        let nextSpd = 1;
                        if (voiceSpeed === 1) nextSpd = 1.5;
                        else if (voiceSpeed === 1.5) nextSpd = 2;
                        setVoiceSpeed(nextSpd);
                        if (voiceAudioRef.current) {
                          voiceAudioRef.current.playbackRate = nextSpd;
                        }
                      }}
                      className="px-2 py-1 bg-black border border-white/10 hover:border-[var(--theme-accent)] rounded-lg text-[10px] font-mono font-bold text-[var(--theme-accent)] shrink-0 transition-colors cursor-pointer"
                    >
                      {voiceSpeed}x
                    </button>
                  </div>
                </div>
              )}

              {/* 5. DOCUMENT READER INTERACTIVE FORMAT (With Download flow and high-quality internal reader) */}
              {selectedPost.type === 'document' && (
                <div className="w-full mb-4">
                  {!downloadedDocIds[selectedPost.id] && !localDocText ? (
                    /* Step 1: Pre-download Preview Card */
                    <div className="p-6 rounded-3xl bg-black border border-white/10 text-center relative flex flex-col items-center justify-center shadow-2xl overflow-hidden min-h-[190px]">
                      {/* Glowing highlights */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                      <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-3.5 relative">
                        <FileText className="w-8 h-8 text-teal-400 shrink-0" />
                        <div className="absolute -bottom-1 -right-1 bg-teal-400 text-black text-[8px] font-orbitron font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                          Doc
                        </div>
                      </div>

                      <h4 className="text-sm font-orbitron font-extrabold text-white tracking-wide uppercase truncate max-w-[280px] mb-1">
                        {localDocTitle || selectedPost.title || 'Documento'}
                      </h4>

                      <div className="flex gap-2.5 mb-5 text-[10px] font-mono text-gray-400 font-bold">
                        <span className="bg-teal-950/40 border border-teal-500/25 text-teal-400 px-2.5 py-0.5 rounded-full">
                          {(localDocText || selectedPost.text || '').split('\n\n').length || 1} páginas
                        </span>
                        <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                          {selectedPost.fileSize || '1.8 MB'}
                        </span>
                      </div>

                      {isExtractingLocal ? (
                        <div className="w-full max-w-[280px] space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-teal-400 font-extrabold uppercase animate-pulse">A extrair texto do PDF local...</span>
                            <span className="text-gray-300 font-extrabold">{localExtractionProgress}%</span>
                          </div>
                          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${localExtractionProgress}%` }} />
                          </div>
                        </div>
                      ) : !isDownloadingDoc ? (
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              playClickFeedback();
                              setIsDownloadingDoc(true);
                              setDocDownloadProgress(0);
                              setDocDownloadStep('Iniciando ligação segura...');
                              
                              let currentProgress = 0;
                              const steps = [
                                'Iniciando ligação segura...',
                                'A descarregar dados do servidor...',
                                'A descompressar conteúdo...',
                                'A otimizar fontes internas...',
                                'A indexar capítulos...',
                                'Pronto para leitura!'
                              ];

                              const interval = setInterval(() => {
                                currentProgress += 5;
                                if (currentProgress >= 100) {
                                  clearInterval(interval);
                                  setDocDownloadProgress(100);
                                  setDocDownloadStep('Pronto para leitura!');
                                  setTimeout(() => {
                                    setIsDownloadingDoc(false);
                                    setDownloadedDocIds(prev => ({ ...prev, [selectedPost.id]: true }));
                                    setIsFullScreenDoc(true); // Automatically trigger immersive fullscreen reader!
                                  }, 600);
                                } else {
                                  setDocDownloadProgress(currentProgress);
                                  const stepIdx = Math.min(
                                    steps.length - 1,
                                    Math.floor((currentProgress / 100) * steps.length)
                                  );
                                  setDocDownloadStep(steps[stepIdx]);
                                }
                              }, 50);
                            }}
                            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-orbitron font-extrabold text-xs tracking-widest rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20 cursor-pointer uppercase"
                          >
                            <Download className="w-4 h-4 text-black" /> Descarregar Documento
                          </button>

                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="file"
                              ref={localDocInputRef}
                              accept=".pdf,.txt,.md"
                              onChange={handleLocalDocUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                playClickFeedback();
                                localDocInputRef.current?.click();
                              }}
                              className="text-[10px] font-orbitron font-extrabold text-teal-400 hover:text-teal-300 transition-all uppercase underline underline-offset-4 cursor-pointer"
                            >
                              Ou Abrir Ficheiro PDF / TXT do Telemóvel
                            </button>
                            {localExtractionError && (
                              <p className="text-[9px] text-red-400 font-bold uppercase mt-1">
                                {localExtractionError}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-[280px] space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] font-mono px-0.5">
                            <span className="text-teal-400 font-extrabold tracking-wide uppercase animate-pulse">
                              {docDownloadStep}
                            </span>
                            <span className="text-gray-300 font-extrabold">{docDownloadProgress}%</span>
                          </div>
                          {/* Progress Bar Container */}
                          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div 
                              className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-100" 
                              style={{ width: `${docDownloadProgress}%` }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Step 2: High-Quality Internal Document Reader */
                    <div className="p-5 rounded-3xl bg-black border border-white/10 text-left relative min-h-[160px] flex flex-col justify-between shadow-2xl animate-fadeIn">
                      
                      {/* Header Controls */}
                      <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-400 animate-pulse" />
                          <span className="text-[9px] font-orbitron font-extrabold text-teal-400 uppercase tracking-wider">
                            {localDocText ? 'Documento Local' : 'Leitor Interno Pronto'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Download raw text button */}
                          <button
                            type="button"
                            onClick={() => {
                              playClickFeedback();
                              const docText = localDocText || selectedPost.text || '';
                              const titleVal = localDocTitle || selectedPost.title || 'documento';
                              const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${titleVal.replace(/\.[^/.]+$/, '')}_texto_extraido.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="p-1 px-2 bg-neutral-900 border border-white/15 hover:border-teal-500 text-gray-300 hover:text-white rounded-lg text-[9px] font-orbitron font-bold uppercase cursor-pointer"
                            title="Descarregar Texto Extraído"
                          >
                            Baixar TXT
                          </button>

                          {/* Font size controllers */}
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                playClickFeedback();
                                setDocFontSize(prev => Math.max(12, prev - 2));
                              }}
                              className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded cursor-pointer"
                            >
                              A-
                            </button>
                            <span className="text-[9px] font-mono text-gray-300 font-bold px-1">{docFontSize}px</span>
                            <button
                              type="button"
                              onClick={() => {
                                playClickFeedback();
                                setDocFontSize(prev => Math.min(32, prev + 2));
                              }}
                              className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded cursor-pointer"
                            >
                              A+
                            </button>
                          </div>

                          {/* Full Screen trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              playClickFeedback();
                              setIsFullScreenDoc(true);
                            }}
                            className="p-1 px-2.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-400 border border-teal-500/30 rounded-lg flex items-center gap-1 text-[9px] font-orbitron font-bold uppercase transition-all cursor-pointer"
                            title="Tela Cheia"
                          >
                            <Maximize2 className="w-3 h-3" /> Imersivo
                          </button>
                        </div>
                      </div>

                      {/* Document Title header in Step 2 */}
                      <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2.5 truncate max-w-full">
                        Ficheiro: {localDocTitle || selectedPost.title || 'Sem Nome'}
                      </p>

                      {/* Page display - Fundo Preto, Letras Brancas */}
                      <div 
                        className="text-white font-sans leading-relaxed transition-all duration-300 border-l-2 border-teal-500/30 pl-3 py-1 overflow-y-auto max-h-[180px] no-scrollbar"
                        style={{ fontSize: `${docFontSize}px` }}
                      >
                        {(() => {
                          const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : ['[Documento vazio]'];
                          return (pages[currentDocPage] || pages[0]).split('\n').map((para, pIdx) => (
                            <p key={pIdx} className="mb-2 last:mb-0">
                              {para}
                            </p>
                          ));
                        })()}
                      </div>

                      {/* TTS & Navigation Controls */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                        {/* TTS Row */}
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <Mic className={`w-3.5 h-3.5 ${isNarrating ? 'text-teal-400 animate-pulse' : 'text-gray-400'}`} />
                            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase">
                              {isNarrating ? (isNarrationPaused ? 'Pausado' : 'A Ler...') : 'Narrador (Premium)'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {isNarrating && (
                              <button
                                type="button"
                                onClick={handleStopNarration}
                                className="px-2 py-0.5 bg-red-600/20 text-red-400 border border-red-500/20 rounded text-[8px] font-bold cursor-pointer uppercase"
                              >
                                Parar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleToggleNarration}
                              className={`px-3 py-1 rounded text-[8px] font-orbitron font-extrabold tracking-wider border cursor-pointer transition-all uppercase flex items-center gap-1 ${
                                isNarrating && !isNarrationPaused 
                                  ? 'bg-amber-500 text-black border-amber-600'
                                  : 'bg-teal-500 text-black border-teal-600 hover:scale-105'
                              }`}
                            >
                              {isNarrating && !isNarrationPaused ? 'Pausar' : 'Ouvir'}
                            </button>
                          </div>
                        </div>

                        {/* Seletor de Estilo de Voz do Narrador */}
                        <div className="flex flex-col gap-1.5 bg-black/30 p-2 rounded-xl border border-white/5 text-left">
                          <div className="flex justify-between items-center text-[8px] font-orbitron font-extrabold text-gray-400 tracking-wider uppercase">
                            <span>🎙️ Estilo de Voz Humana</span>
                            {selectedVoiceStyle === 'paymax' && (
                              <span className="text-indigo-400 animate-pulse text-[7px] border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">
                                Múltiplas Vozes Activas
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { id: 'standard', name: 'Original', desc: 'Sintetizador Padrão', isPremium: false },
                              { id: 'soft', name: 'Suave 🍃', desc: 'Leitura calma', isPremium: true },
                              { id: 'excited', name: 'Agitada 🔥', desc: 'Mais energia', isPremium: true },
                              { id: 'pro', name: 'Profissional 🎙️', desc: 'Narrador estúdio', isPremium: true },
                              { id: 'laugh', name: 'Fazer Rir 😂', desc: 'Tom cómico', isPremium: true },
                              { id: 'paymax', name: 'Pay Max 👑', desc: 'Vozes Adaptáveis', isPremium: true }
                            ].map((style) => {
                              const isDownloaded = downloadedVoices[style.id];
                              return (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() => {
                                    playClickFeedback();
                                    setSelectedVoiceStyle(style.id as any);
                                    if (!isDownloaded) {
                                      setVoiceToDownload(style.id as any);
                                      setShowVoiceDownloadModal(true);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded-lg border text-[8px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                    selectedVoiceStyle === style.id
                                      ? 'bg-teal-500 text-black border-teal-600 font-extrabold shadow-md'
                                      : 'bg-neutral-900/60 text-gray-400 border-white/5 hover:text-white hover:border-white/10'
                                  }`}
                                  title={`${style.name}: ${style.desc}`}
                                >
                                  <span>{style.name}</span>
                                  {style.isPremium && !isDownloaded && (
                                    <span className="text-[6px] text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1 py-0.2 rounded font-black font-mono">
                                      PAY
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between items-center mt-1">
                          <button
                            type="button"
                            disabled={currentDocPage === 0}
                            onClick={() => {
                              playClickFeedback();
                              setCurrentDocPage(prev => Math.max(0, prev - 1));
                              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                              setIsNarrating(false);
                            }}
                            className="px-2.5 py-1 bg-neutral-900 text-white border border-white/5 rounded text-[10px] font-bold hover:bg-neutral-800 disabled:opacity-30 cursor-pointer flex items-center gap-1 uppercase"
                          >
                            <ChevronLeft className="w-3 h-3" /> Anterior
                          </button>

                          <span className="text-[9px] font-mono text-gray-400 font-extrabold uppercase">
                            PÁGINA {currentDocPage + 1} / {(() => {
                              const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : [''];
                              return pages.length;
                            })()}
                          </span>

                          <button
                            type="button"
                            disabled={(() => {
                              const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : [''];
                              return currentDocPage >= pages.length - 1;
                            })()}
                            onClick={() => {
                              playClickFeedback();
                              setCurrentDocPage(prev => prev + 1);
                              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                              setIsNarrating(false);
                            }}
                            className="px-2.5 py-1 bg-neutral-900 text-white border border-white/5 rounded text-[10px] font-bold hover:bg-neutral-800 disabled:opacity-30 cursor-pointer flex items-center gap-1 uppercase"
                          >
                            Seguinte <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Option to clear local doc and load server original */}
                        {localDocText && (
                          <div className="mt-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                playClickFeedback();
                                setLocalDocText(null);
                                setLocalDocTitle(null);
                                setCurrentDocPage(0);
                                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                                setIsNarrating(false);
                              }}
                              className="text-[8px] font-orbitron font-extrabold text-red-400 hover:text-red-300 hover:underline tracking-wider uppercase cursor-pointer"
                            >
                              Sair do Documento Local & Ver Original
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* 6. TECHNICAL FILE DOWNLOAD MOCKUP */}
              {selectedPost.type === 'file' && (
                <div className="w-full p-4 rounded-2xl bg-[#09090c] border border-orange-500/10 mb-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-9 h-9 text-orange-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-mono font-bold text-gray-200 truncate max-w-[200px]">{selectedPost.title || 'recurso.zip'}</h4>
                        <p className="text-[10px] font-mono text-gray-500 font-bold">{translate('tamanho', currentLanguage)}: {selectedPost.fileSize || '14.5 MB'}</p>
                      </div>
                    </div>

                    {downloadProgress === -1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          playClickFeedback();
                          setDownloadProgress(0);
                          const interval = setInterval(() => {
                            setDownloadProgress(prev => {
                              if (prev >= 100) {
                                clearInterval(interval);
                                // Increment real shares as a mock download count
                                if (onAddPostShare) onAddPostShare(selectedPost.id);
                                return 100;
                              }
                              return prev + 10;
                            });
                          }, 150);
                        }}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 hover:scale-105 active:scale-95 rounded-xl text-[10px] font-orbitron font-extrabold tracking-wider text-white flex items-center gap-1 cursor-pointer transition-all uppercase"
                      >
                        <Download className="w-3.5 h-3.5" /> Descarregar
                      </button>
                    ) : (
                      <div className="w-24 text-right">
                        <span className="text-[10px] font-mono font-bold text-orange-400">
                          {downloadProgress < 100 ? `${downloadProgress}%...` : 'PRONTO!'}
                        </span>
                      </div>
                    )}
                  </div>

                  {downloadProgress > -1 && (
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                    </div>
                  )}
                </div>
              )}

              {/* Text content styling matching the post's custom format */}
              {selectedPost.text && selectedPost.type !== 'document' && (
                <div className={`p-4 bg-black/40 border rounded-xl text-sm leading-relaxed text-left mb-5 ${
                  currentThemeConfig?.id === 'eyes-max' ? 'border-amber-500/15' : 'border-neon-cyan/15'
                }`}>
                  <p style={{ fontFamily: selectedPost.style?.font || 'Poppins', color: selectedPost.style?.color || '#ffffff' }}>
                    {selectedPost.text}
                  </p>
                </div>
              )}

              {/* INTERACTIVE 1-5 STARS RATINGS SELECTOR */}
              <div className="mb-4">
                <div className="flex flex-col items-center gap-2 p-3 bg-black/60 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-orbitron font-extrabold uppercase tracking-widest text-gray-400">
                    {translate('avaliar_publicacao', currentLanguage) || 'Avaliar Publicação'}
                  </span>
                  
                  {/* Star indicators */}
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const userVote = (selectedPost.ratings || {})[currentUser.id] || 0;
                      const isActive = userVote >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => {
                            playClickFeedback();
                            if (currentUser.id === 'guest') {
                              alert('Como convidado, precisa de uma conta para avaliar publicações. Vamos criar uma conta!');
                              onNavigate('comunidade');
                              return;
                            }
                            
                            // Invoke parent callback
                            if (onRatePost) onRatePost(selectedPost.id, starVal);

                            // Mirror update locally
                            setSelectedPost(prev => {
                              if (!prev) return null;
                              const updatedRatings = prev.ratings ? { ...prev.ratings } : {};
                              updatedRatings[currentUser.id] = starVal;
                              return {
                                ...prev,
                                ratings: updatedRatings,
                                stars: Object.keys(updatedRatings).length,
                                starred: true
                              };
                            });
                          }}
                          className="p-1 cursor-pointer hover:scale-125 transition-transform duration-150"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              isActive 
                                ? currentThemeConfig?.id === 'eyes-max' 
                                  ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' 
                                  : 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[10px] font-bold text-gray-500">
                    {getAverageRating(selectedPost, currentLanguage)}
                  </span>
                </div>
              </div>

              {/* Author footer */}
              <div className={`flex items-center justify-between border-t pt-4 ${
                currentThemeConfig?.id === 'eyes-max' ? 'border-amber-500/15' : 'border-neon-cyan/15'
              }`}>
                <div className="flex items-center gap-2">
                  <img 
                    src={selectedPost.author.avatar} 
                    alt={selectedPost.author.name}
                    referrerPolicy="no-referrer"
                    className={`w-9 h-9 rounded-full border object-cover ${
                      currentThemeConfig?.id === 'eyes-max' ? 'border-amber-500/50' : 'border-neon-cyan/60'
                    }`}
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">{selectedPost.author.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {new Date(selectedPost.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onAddPostShare) onAddPostShare(selectedPost.id);
                      handleShare(`https://openmz.com/post/${selectedPost.id}`);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all border ${
                      currentThemeConfig?.id === 'eyes-max' 
                        ? 'bg-[#1c150a] border-amber-500/30 hover:border-amber-400 text-amber-200' 
                        : 'bg-[#121235] border-neon-cyan/25 hover:border-neon-cyan text-gray-300'
                    }`}
                    title="Partilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className={`border-t pt-5 mt-5 text-left ${
                currentThemeConfig?.id === 'eyes-max' ? 'border-amber-500/15' : 'border-neon-cyan/15'
              }`}>
                <h4 className={`font-orbitron font-bold text-xs tracking-wider mb-3 uppercase ${
                  currentThemeConfig?.id === 'eyes-max' ? 'text-amber-400' : 'text-neon-cyan'
                }`}>
                  Comentários ({selectedPost.comments?.length || 0})
                </h4>

                {/* Comments list */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar mb-4 pr-1">
                  {!selectedPost.comments || selectedPost.comments.length === 0 ? (
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider text-center py-4">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  ) : (
                    selectedPost.comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        postId={selectedPost.id}
                        comment={comment}
                        currentUser={currentUser}
                        onDeleteComment={onDeleteComment}
                        onReactComment={onReactComment}
                        onUpdateModal={() => {
                          const freshPost = posts.find((x) => x.id === selectedPost.id);
                          if (freshPost) {
                            setSelectedPost(freshPost);
                          } else {
                            setSelectedPost(null);
                          }
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Comment Input */}
                {currentUser.id === 'guest' ? (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-center text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                    ⚠️ Apenas contas registadas podem comentar.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Active Voice Recording Panel */}
                    {isRecording && (
                      <div className="flex items-center justify-between bg-red-950/20 border border-red-500/30 rounded-2xl p-3 animate-pulse">
                        <div className="flex items-center gap-2">
                          <motion.div 
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/50"
                          />
                          <span className="text-xs font-mono font-bold text-red-400">GRAVANDO: {recordingDuration}s</span>
                        </div>
                        
                        {/* Audio equalizer animation during recording */}
                        <div className="flex items-end gap-[3px] h-4">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: [4, 16, 4] }}
                              transition={{ repeat: Infinity, duration: 0.5 + (i * 0.05), ease: "easeInOut" }}
                              className="w-0.5 bg-red-500 rounded-full"
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => stopVoiceRecording(false)}
                            className="px-2.5 py-1 bg-neutral-800 text-gray-300 hover:text-white text-[10px] font-bold uppercase rounded-lg border border-white/10 active:scale-95 transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => stopVoiceRecording(true)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recorded Audio Attachment Preview */}
                    {recordedAudioUrl && !isRecording && (
                      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🎙️</span>
                          <span className="text-xs font-bold text-amber-400 font-orbitron tracking-wide uppercase">Áudio Pronto ({recordingDuration}s)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playClickFeedback();
                            setRecordedAudioUrl(null);
                          }}
                          className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg active:scale-90 transition-all cursor-pointer"
                          title="Remover áudio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const input = form.elements.namedItem('commentText') as HTMLInputElement;
                        const text = input.value;
                        if (!text.trim() && !recordedAudioUrl) return;
                        
                        const commentText = text.trim() || "Comentário de Voz 🎙️";
                        onAddComment(selectedPost.id, commentText, recordedAudioUrl || undefined, recordedAudioUrl ? recordingDuration : undefined);
                        
                        playCommentSound();
                        
                        const newComment = {
                          id: 'comment_' + Math.random().toString(36).substring(2, 9),
                          author: {
                            id: currentUser.id,
                            name: currentUser.nickname,
                            avatar: currentUser.avatar
                          },
                          text: text.trim() ? text.trim() : undefined,
                          audioUrl: recordedAudioUrl || undefined,
                          audioDuration: recordedAudioUrl ? recordingDuration : undefined,
                          timestamp: Date.now(),
                          starsCount: 0,
                          brokenStarsCount: 0,
                          reactions: {}
                        };
                        
                        setSelectedPost((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            comments: [...(prev.comments || []), newComment]
                          };
                        });
                        
                        form.reset();
                        setRecordedAudioUrl(null);
                      }}
                      className="flex gap-2 items-center"
                    >
                      <input
                        type="text"
                        name="commentText"
                        required={!recordedAudioUrl}
                        placeholder={recordedAudioUrl ? "Adicionar descrição (opcional)..." : "Escreva um comentário..."}
                        className="flex-1 bg-black/50 border border-neon-cyan/30 rounded-xl px-3 py-2 text-xs outline-none focus:border-neon-cyan text-white placeholder:text-gray-600 font-rajdhani font-semibold"
                      />

                      {/* Microphone recording trigger */}
                      {!isRecording && !recordedAudioUrl && (
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#141108]/85 border border-amber-500/35 text-amber-500 hover:text-amber-400 hover:border-amber-400/60 active:scale-90 transition-all cursor-pointer shrink-0 shadow-md shadow-amber-500/5"
                          title="Gravar áudio"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        </button>
                      )}

                      <button
                        type="submit"
                        className="px-4 py-2 bg-neon-cyan hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all cursor-pointer uppercase shrink-0"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN LIGHTBOX PHOTO VIEWER */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playClickFeedback();
              setFullScreenImage(null);
            }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/98 backdrop-blur-xl cursor-zoom-out select-none"
          >
            {/* Close Floating CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                playClickFeedback();
                setFullScreenImage(null);
              }}
              className="absolute top-6 right-6 w-11 h-11 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition-colors z-50 shadow-2xl"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0.9, rotate: -1 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9, rotate: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative max-w-full max-h-[85vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullScreenImage}
                alt="Imagem ampliada em tela cheia"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[85vh] object-contain rounded-3xl select-none"
              />
            </motion.div>

            {/* Hint bar */}
            <p className="mt-4 text-[10px] font-extrabold font-orbitron tracking-widest text-gray-500 uppercase">
              Clique em qualquer lugar para fechar
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE FULL SCREEN VIDEO VIEWER */}
      <AnimatePresence>
        {isFullScreenVideo && selectedPost && selectedPost.type === 'video' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-black text-white flex flex-col justify-between select-none"
          >
            {/* Header overlay */}
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Video className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-orbitron text-indigo-400 tracking-wider uppercase">
                    {selectedPost.title || 'Vídeo Imersivo'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[8px] font-mono text-gray-400 uppercase tracking-widest">
                    <span>🎬 {selectedPost.extraData?.resolution || '1080p FULL HD'}</span>
                    <span>•</span>
                    <span>⏱️ {selectedPost.extraData?.duration ? `${Math.floor(selectedPost.extraData.duration / 60)}:${(selectedPost.extraData.duration % 60).toString().padStart(2, '0')}` : '0:45'}</span>
                    {selectedPost.extraData?.videoFilter && selectedPost.extraData.videoFilter !== 'none' && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400">🎞️ FILTRO: {selectedPost.extraData.videoFilter.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickFeedback();
                  setIsFullScreenVideo(false);
                  setIsFsVideoPlaying(false);
                  if (fsVideoRef.current) {
                    fsVideoRef.current.pause();
                  }
                }}
                className="w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer shadow-2xl active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video container */}
            <div 
              onClick={() => {
                playClickFeedback();
                if (fsVideoRef.current) {
                  if (isFsVideoPlaying) {
                    fsVideoRef.current.pause();
                    setIsFsVideoPlaying(false);
                  } else {
                    fsVideoRef.current.play();
                    setIsFsVideoPlaying(true);
                  }
                }
              }}
              className="flex-1 w-full flex items-center justify-center bg-neutral-950 relative overflow-hidden cursor-pointer"
            >
              <video
                ref={fsVideoRef}
                src={selectedPost.mediaUrl}
                autoPlay
                loop
                muted={isFsVideoMuted}
                onTimeUpdate={() => {
                  if (fsVideoRef.current) {
                    setFsVideoCurrentTime(fsVideoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (fsVideoRef.current) {
                    setFsVideoDuration(fsVideoRef.current.duration);
                    fsVideoRef.current.playbackRate = fsVideoSpeed;
                  }
                }}
                className="max-w-full max-h-screen object-contain"
                style={{
                  filter: selectedPost.extraData?.videoFilter === 'vintage' ? 'sepia(0.5) contrast(1.1) brightness(0.9)' :
                          selectedPost.extraData?.videoFilter === 'neon' ? 'saturate(2) hue-rotate(15deg) contrast(1.1)' :
                          selectedPost.extraData?.videoFilter === 'cyber' ? 'hue-rotate(-20deg) saturate(1.8) contrast(1.2)' :
                          selectedPost.extraData?.videoFilter === 'bw' ? 'grayscale(1) contrast(1.3) brightness(0.95)' :
                          selectedPost.extraData?.videoFilter === 'warm' ? 'sepia(0.2) saturate(1.4) hue-rotate(-5deg) contrast(1.05)' :
                          selectedPost.extraData?.videoFilter === 'vhs' ? 'contrast(1.1) brightness(1.05) saturate(1.25) blur(0.3px)' : 'none'
                }}
              />

              {/* Playback status visual popup overlay */}
              <AnimatePresence>
                {!isFsVideoPlaying && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute w-20 h-20 rounded-full bg-black/60 border border-white/25 flex items-center justify-center pointer-events-none"
                  >
                    <Play className="w-8 h-8 text-white fill-current translate-x-1" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Caption Overlay */}
              {selectedPost.extraData?.videoCaption && (
                <div className="absolute bottom-24 inset-x-8 text-center pointer-events-none">
                  <p className="inline-block bg-black/85 text-white border border-white/10 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold tracking-wide shadow-2xl max-w-xl mx-auto backdrop-blur-md text-shadow-lg">
                    {selectedPost.extraData.videoCaption}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom controls overlay */}
            <div className="p-4 bg-gradient-to-t from-black/90 to-black/30 flex flex-col gap-3 z-10">
              {/* Timeline bar */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono font-bold text-gray-400">
                  {Math.floor(fsVideoCurrentTime / 60)}:{(Math.floor(fsVideoCurrentTime % 60)).toString().padStart(2, '0')}
                </span>
                <input
                  type="range"
                  min="0"
                  max={fsVideoDuration || 100}
                  value={fsVideoCurrentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    if (fsVideoRef.current) {
                      fsVideoRef.current.currentTime = t;
                      setFsVideoCurrentTime(t);
                    }
                  }}
                  className="flex-1 accent-indigo-500 bg-white/10 h-1 rounded cursor-pointer hover:h-1.5 transition-all outline-none"
                />
                <span className="text-[9px] font-mono font-bold text-gray-400">
                  {Math.floor(fsVideoDuration / 60)}:{(Math.floor(fsVideoDuration % 60)).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Buttons action line */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play / pause button */}
                  <button
                    onClick={() => {
                      playClickFeedback();
                      if (fsVideoRef.current) {
                        if (isFsVideoPlaying) {
                          fsVideoRef.current.pause();
                          setIsFsVideoPlaying(false);
                        } else {
                          fsVideoRef.current.play();
                          setIsFsVideoPlaying(true);
                        }
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    {isFsVideoPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
                  </button>

                  {/* Volume controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playClickFeedback();
                        setIsFsVideoMuted(!isFsVideoMuted);
                      }}
                      className="text-gray-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {isFsVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Playback speed selector */}
                  <div className="flex bg-black/50 border border-white/10 rounded-xl p-0.5">
                    {([0.5, 1, 1.5, 2] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          playClickFeedback();
                          setFsVideoSpeed(speed);
                          if (fsVideoRef.current) {
                            fsVideoRef.current.playbackRate = speed;
                          }
                        }}
                        className={`px-2.5 py-1 text-[8px] font-bold font-mono rounded-lg transition-all ${
                          fsVideoSpeed === speed 
                            ? 'bg-indigo-600 text-white font-extrabold shadow-lg' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Cinema tag */}
                  <span className="text-[8px] font-orbitron font-extrabold text-indigo-400 tracking-widest border border-indigo-500/30 bg-indigo-500/5 px-2.5 py-1.5 rounded-xl uppercase">
                    🎬 CINEMA EXPERIÊNCIA PRO
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE FULL SCREEN DOCUMENT READER */}
      <AnimatePresence>
        {isFullScreenDoc && selectedPost && selectedPost.type === 'document' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-[99999] bg-black text-white flex flex-col select-none"
          >
            {/* Immersive Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/90 backdrop-blur-md">
              <div className="flex items-center gap-2 max-w-[45%]">
                <FileText className="w-5 h-5 text-teal-400 animate-pulse shrink-0" />
                <div className="truncate">
                  <h3 className="font-orbitron font-extrabold text-xs tracking-wider uppercase text-teal-400 truncate">
                    {localDocTitle || selectedPost.title || 'Documento'}
                  </h3>
                  <p className="text-[9px] font-mono text-gray-500 font-bold uppercase">
                    Pág {currentDocPage + 1} de {(() => {
                      const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : [''];
                      return pages.length;
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Download extracted text as .txt */}
                <button
                  type="button"
                  onClick={() => {
                    playClickFeedback();
                    const docText = localDocText || selectedPost.text || '';
                    const titleVal = localDocTitle || selectedPost.title || 'documento';
                    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${titleVal.replace(/\.[^/.]+$/, '')}_texto_extraido.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 bg-neutral-900 border border-white/10 hover:border-teal-500 hover:text-teal-400 rounded-xl cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
                  title="Baixar Texto Extraído (.txt)"
                >
                  <Download className="w-3.5 h-3.5" /> <span className="hidden md:inline">Baixar TXT</span>
                </button>

                {/* Open Another Document from here */}
                <button
                  type="button"
                  onClick={() => {
                    playClickFeedback();
                    localDocInputRef.current?.click();
                  }}
                  className="p-2 bg-neutral-900 border border-white/10 hover:border-teal-500 hover:text-teal-400 rounded-xl cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
                  title="Abrir Outro Ficheiro"
                >
                  <Upload className="w-3.5 h-3.5" /> <span className="hidden md:inline">Abrir Ficheiro</span>
                </button>

                {/* Font size controllers */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClickFeedback();
                      setDocFontSize(prev => Math.max(12, prev - 2));
                    }}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                    title="Diminuir texto"
                  >
                    A-
                  </button>
                  <span className="text-[10px] font-mono text-gray-300 font-bold px-1">{docFontSize}px</span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickFeedback();
                      setDocFontSize(prev => Math.min(32, prev + 2));
                    }}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                    title="Aumentar texto"
                  >
                    A+
                  </button>
                </div>

                {/* Exit fullscreen button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickFeedback();
                    setIsFullScreenDoc(false);
                  }}
                  className="p-2 bg-white/5 border border-white/10 hover:border-teal-500 hover:text-teal-400 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase"
                >
                  <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>

            {/* Immersive Reading Canvas - Pitch Black BG, White Text */}
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center bg-black animate-fadeIn relative">
              {isExtractingLocal && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-4 z-50">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
                  <p className="font-orbitron font-extrabold text-xs tracking-widest text-teal-400 uppercase">
                    A extrair texto do PDF ({localExtractionProgress}%)
                  </p>
                </div>
              )}

              <div 
                className="w-full max-w-2xl text-white leading-relaxed font-sans text-left break-words"
                style={{ fontSize: `${docFontSize}px` }}
              >
                {(() => {
                  const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : ['[Documento vazio]'];
                  return (pages[currentDocPage] || pages[0]).split('\n').map((para, pIdx) => (
                    <p key={pIdx} className="mb-4 last:mb-0">
                      {para}
                    </p>
                  ));
                })()}
              </div>
            </div>

            {/* Immersive Footer Controls */}
            <div className="p-4 border-t border-white/10 bg-black/95 flex flex-col gap-3">
              {/* Voice/Narrator Controls */}
              <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    {isNarrating && !isNarrationPaused && (
                      <span className="absolute w-4 h-4 bg-teal-500 rounded-full animate-ping opacity-40" />
                    )}
                    <Mic className={`w-4 h-4 ${isNarrating ? 'text-teal-400 animate-pulse' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-orbitron font-black text-white tracking-widest block uppercase">Narrador de Texto (Premium)</span>
                    <span className="text-[9px] text-gray-500 font-bold block">
                      {isNarrating ? (isNarrationPaused ? 'Leitura pausada' : 'A Ler Página Atual...') : 'Disponível com Eyes Max'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isNarrating && (
                    <button
                      type="button"
                      onClick={handleStopNarration}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all uppercase"
                    >
                      Parar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleNarration}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-orbitron font-extrabold tracking-widest cursor-pointer transition-all uppercase flex items-center gap-1.5 border ${
                      isNarrating && !isNarrationPaused
                        ? 'bg-amber-500 text-black border-amber-600'
                        : 'bg-teal-500 text-black border-teal-600 hover:scale-105'
                    }`}
                  >
                    {isNarrating && !isNarrationPaused ? 'Pausar' : 'Ouvir'}
                  </button>
                </div>
              </div>

              {/* Seletor de Estilo de Voz do Narrador (Imersivo) */}
              <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-2xl border border-white/10 text-left">
                <div className="flex justify-between items-center text-[9px] font-orbitron font-black text-teal-400 tracking-wider uppercase">
                  <span>🎙️ Estilo de Voz Humana Neuronal</span>
                  {selectedVoiceStyle === 'paymax' && (
                    <span className="text-indigo-400 animate-pulse text-[8px] border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-lg uppercase">
                      Múltiplas Vozes Activas (Narrador & Personagens)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'standard', name: 'Original', desc: 'Sintetizador Padrão', isPremium: false },
                    { id: 'soft', name: 'Suave 🍃', desc: 'Leitura calma', isPremium: true },
                    { id: 'excited', name: 'Agitada 🔥', desc: 'Mais energia', isPremium: true },
                    { id: 'pro', name: 'Profissional 🎙️', desc: 'Narrador estúdio', isPremium: true },
                    { id: 'laugh', name: 'Fazer Rir 😂', desc: 'Tom cómico', isPremium: true },
                    { id: 'paymax', name: 'Pay Max 👑', desc: 'Vozes Adaptáveis', isPremium: true }
                  ].map((style) => {
                    const isDownloaded = downloadedVoices[style.id];
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          playClickFeedback();
                          setSelectedVoiceStyle(style.id as any);
                          if (!isDownloaded) {
                            setVoiceToDownload(style.id as any);
                            setShowVoiceDownloadModal(true);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl border text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          selectedVoiceStyle === style.id
                            ? 'bg-teal-500 text-black border-teal-600 font-black shadow-lg scale-105'
                            : 'bg-neutral-900/80 text-gray-400 border-white/10 hover:text-white hover:border-white/20 hover:bg-neutral-850'
                        }`}
                        title={`${style.name}: ${style.desc}`}
                      >
                        <span>{style.name}</span>
                        {style.isPremium && !isDownloaded && (
                          <span className="text-[7px] text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 rounded-md font-black font-mono">
                            PAY
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  disabled={currentDocPage === 0}
                  onClick={() => {
                    playClickFeedback();
                    setCurrentDocPage(prev => Math.max(0, prev - 1));
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setIsNarrating(false);
                  }}
                  className="px-4 py-2 bg-neutral-900 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 cursor-pointer flex items-center gap-2 uppercase transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-gray-400 font-bold">
                    PÁGINA {currentDocPage + 1} DE {(() => {
                      const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : [''];
                      return pages.length;
                    })()}
                  </span>
                  {localDocText && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickFeedback();
                        setLocalDocText(null);
                        setLocalDocTitle(null);
                        setCurrentDocPage(0);
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        setIsNarrating(false);
                      }}
                      className="text-[8px] font-orbitron font-extrabold text-red-400 hover:text-red-300 tracking-wider uppercase mt-0.5 cursor-pointer"
                    >
                      Ver Original
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={(() => {
                    const pages = (localDocText || selectedPost.text) ? (localDocText || selectedPost.text || '').split('\n\n') : [''];
                    return currentDocPage >= pages.length - 1;
                  })()}
                  onClick={() => {
                    playClickFeedback();
                    setCurrentDocPage(prev => prev + 1);
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setIsNarrating(false);
                  }}
                  className="px-4 py-2 bg-neutral-900 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 cursor-pointer flex items-center gap-2 uppercase transition-all"
                >
                  Seguinte <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EYES MAX PREMIUM ALERT MODAL */}
      <AnimatePresence>
        {showEyesMaxAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="bg-[#141108] border-2 border-amber-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-3xl shadow-amber-500/20"
            >
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>

              <h3 className="font-orbitron font-extrabold text-lg text-amber-400 uppercase tracking-wider mb-2">
                Eyes Max Premium
              </h3>
              
              <p className="text-gray-300 text-xs font-sans leading-relaxed mb-6">
                A funcionalidade de leitura por voz (Narrador inteligente) é uma opção <strong className="text-amber-300">premium</strong>. Ative o tema <strong className="text-amber-400">Eyes Max</strong> nas definições do aplicativo para a desbloquear!
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickFeedback();
                    setShowEyesMaxAlert(false);
                    onNavigate('config');
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-extrabold text-xs tracking-wider rounded-xl uppercase transition-all shadow-lg cursor-pointer"
                >
                  Ativar o tema Eyes Max
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickFeedback();
                    setShowEyesMaxAlert(false);
                  }}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-400 hover:text-white font-mono text-xs rounded-xl uppercase transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOWNLOAD VOICE PACK MODAL (PAY DATA) */}
      <AnimatePresence>
        {showVoiceDownloadModal && voiceToDownload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="bg-neutral-950 border-2 border-teal-500 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-teal-500/20 text-left"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                  <span className="font-orbitron font-extrabold text-xs tracking-wider uppercase text-white">
                    Pacote de Voz Ultra-Humana (Pay)
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isDownloadingVoice}
                  onClick={() => {
                    playClickFeedback();
                    setShowVoiceDownloadModal(false);
                    setVoiceToDownload(null);
                  }}
                  className="p-1 hover:bg-white/10 rounded-full cursor-pointer transition-colors disabled:opacity-20"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {!isDownloadingVoice ? (
                <>
                  <div className="mb-4">
                    <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                      {voiceToDownload === 'soft' && 'Voz Suave 🍃'}
                      {voiceToDownload === 'excited' && 'Voz Agitada/Entusiasmada 🔥'}
                      {voiceToDownload === 'pro' && 'Narrador Profissional 🎙️'}
                      {voiceToDownload === 'laugh' && 'Voz que Faz Rir 😂'}
                      {voiceToDownload === 'paymax' && 'Voz PAY MAX (Adaptável) 👑'}
                    </span>
                  </div>

                  <p className="text-white text-xs font-sans leading-relaxed mb-4">
                    {voiceToDownload === 'soft' && 'Modelo de voz suave, perfeito para leituras descontraídas, poemas e histórias relaxantes com entoação de descanso.'}
                    {voiceToDownload === 'excited' && 'Modelo de voz ativo e energizado, ideal para posts de ação, novidades de tecnologia e narrativa de ritmo acelerado.'}
                    {voiceToDownload === 'pro' && 'Voz limpa com tonalidade de estúdio de rádio profissional. Sem ruído, ritmo constante e perfeita para artigos científicos e notícias.'}
                    {voiceToDownload === 'laugh' && 'Voz cómica e engraçada com modulações brincalhonas, pequenas gargalhadas simuladas e tons que provocam riso.'}
                    {voiceToDownload === 'paymax' && 'O sistema adaptável mais avançado: analisa as aspas, brackets e nomes de diálogos (Alice:, Bob:, etc.) para atribuir vozes masculinas, femininas e de narrador automaticamente a cada parágrafo. Muda de voz dinamicamente conforme a personagem fala!'}
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-6 text-xs text-gray-300 space-y-2">
                    <div className="flex justify-between font-bold text-[10px] uppercase font-orbitron text-gray-400 border-b border-white/5 pb-1">
                      <span>Detalhes de Activação</span>
                      <span className="text-amber-400">Premium</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Tamanho do Pacote:</span>
                      <span className="text-white font-bold">~ 4.8 MB</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Tecnologia:</span>
                      <span className="text-white font-bold">Rede Neuronal WaveNet</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px] items-center">
                      <span>Formato de Pagamento:</span>
                      <select className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-0.5 text-[9px] font-bold">
                        <option>Saldo M-Pesa / Airtime</option>
                        <option>Créditos Eyes Max (Gratuito)</option>
                        <option>Subscrição Mensal Ativa</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        playClickFeedback();
                        setIsDownloadingVoice(true);
                        setVoiceDownloadProgress(0);
                        setVoiceDownloadStep('A ligar ao servidor de voz neuronal...');
                        
                        let progress = 0;
                        const interval = setInterval(() => {
                          progress += 5;
                          if (progress >= 100) {
                            clearInterval(interval);
                            setVoiceDownloadProgress(100);
                            setVoiceDownloadStep('Voz instalada e calibrada com sucesso!');
                            setTimeout(() => {
                              setDownloadedVoices(prev => ({ ...prev, [voiceToDownload]: true }));
                              setIsDownloadingVoice(false);
                              setShowVoiceDownloadModal(false);
                              setVoiceToDownload(null);
                              playNotificationSound();
                            }, 1200);
                          } else {
                            setVoiceDownloadProgress(progress);
                            if (progress < 25) {
                              setVoiceDownloadStep('A ligar ao servidor de voz neuronal...');
                            } else if (progress < 50) {
                              setVoiceDownloadStep(`A transferir pacotes de entoação em Português (${progress}%)...`);
                            } else if (progress < 75) {
                              setVoiceDownloadStep(`A calibrar os modelos neurais de voz para (${voiceToDownload})...`);
                            } else {
                              setVoiceDownloadStep('A integrar dicionários de voz local de alta fidelidade...');
                            }
                          }
                        }, 180);
                      }}
                      className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-black font-orbitron font-extrabold text-xs tracking-wider rounded-2xl uppercase transition-all shadow-lg shadow-teal-500/10 cursor-pointer text-center"
                    >
                      Descarregar & Ativar Voz Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClickFeedback();
                        setShowVoiceDownloadModal(false);
                        setVoiceToDownload(null);
                      }}
                      className="px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-gray-400 hover:text-white font-mono text-[10px] rounded-2xl uppercase transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin mx-auto mb-4" />
                  <h4 className="font-orbitron font-extrabold text-xs text-white uppercase tracking-widest mb-1">
                    A Descarregar Dados de Voz
                  </h4>
                  <p className="text-gray-400 text-[10px] font-mono mb-6">{voiceDownloadStep}</p>

                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-teal-400 h-full rounded-full transition-all duration-150"
                      style={{ width: `${voiceDownloadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 font-bold mt-2 block">
                    {voiceDownloadProgress}% concluído
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
