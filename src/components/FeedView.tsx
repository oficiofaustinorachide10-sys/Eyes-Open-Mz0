/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Star, Eye, Share2, Trash2, X, Play, Pause, Volume2, UserPlus, UserCheck, ShieldCheck, Lock, Unlock, MessageSquare, Clock, Sparkles, Check, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Story, User, Friendship, ChatPermission, Notification } from '../types';
import { 
  subscribeUsers, subscribeFriendships, subscribeChatPermissions, 
  dbCreateFriendship, dbCreateChatPermission, dbCreateNotification 
} from '../lib/db';
import { ThemeConfig } from '../utils/themeEngine';

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
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onReactComment?: (postId: string, commentId: string, reaction: 'star' | 'broken_star') => void;
  autoOpenPostId?: string;
  onClearAutoOpenPost?: () => void;
  currentThemeConfig?: ThemeConfig;
}

// 4D ROTATIONAL CARD COMPONENT FOR FEED POSTS
function RotationalCard({ 
  post, 
  currentUser, 
  onLike, 
  onDelete, 
  onClick,
  onAddView
}: { 
  post: Post; 
  currentUser: User; 
  onLike: () => void; 
  onDelete: () => void; 
  onClick: () => void;
  onAddView: () => void;
  key?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Tracks views increment on load
  useEffect(() => {
    onAddView();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const y = e.clientY - rect.top;  // y position within the element.
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 3D Rotation mapping: horizontal movement rotates Y, vertical rotates X
    const factor = 0.15; // dampening
    setRotateY((x - centerX) * factor);
    setRotateX(-(y - centerY) * factor);
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d26]/85 border border-neon-cyan/25 rounded-2xl overflow-hidden shadow-xl hover:shadow-neon-cyan/10 transition-shadow">
      {/* 4D Rotating Wrapper */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
        className="relative aspect-square w-full cursor-pointer overflow-hidden group select-none"
      >
        {post.image ? (
          <img 
            src={post.image} 
            alt="Publicação" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#121235] to-[#1d0a2f] p-6 flex items-center justify-center text-center">
            <p 
              className="text-base font-bold leading-relaxed line-clamp-6"
              style={{ fontFamily: post.style?.font || 'Poppins', color: post.style?.color || '#ffffff' }}
            >
              {post.text}
            </p>
          </div>
        )}

        {/* Dark overlay on photo card */}
        {post.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Delete option overlay */}
        {post.author.id === currentUser.id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white cursor-pointer z-10 hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Quick action floating indicators on hover */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border cursor-pointer transition-all ${
              post.starred
                ? 'bg-yellow-500/80 border-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                : 'bg-black/60 border-neon-cyan/40 text-gray-400 hover:text-white hover:border-neon-cyan'
            }`}
          >
            <Star className={`w-4 h-4 ${post.starred ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Description & User Footprint */}
      <div className="p-4 flex flex-col flex-grow bg-[#0c0c24] border-t border-neon-cyan/15 select-none">
        {post.image && post.text && (
          <p 
            className="text-xs text-gray-300 leading-relaxed mb-3 line-clamp-2"
            style={{ fontFamily: post.style?.font || 'Poppins' }}
          >
            {post.text}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2">
          {/* Author info */}
          <div className="flex items-center gap-2 min-w-0">
            <img 
              src={post.author.avatar || "https://i.pravatar.cc/80?img=1"} 
              alt={post.author.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full border border-neon-cyan/50 object-cover shrink-0"
            />
            <span className="text-xs font-bold text-neon-cyan truncate">{post.author.name}</span>
          </div>

          {/* Core Analytics info */}
          <div className="flex items-center gap-3 text-[10px] text-gray-500 shrink-0 font-mono font-bold">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500/70" /> {post.stars}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-neon-cyan/70" /> {post.views}
            </span>
          </div>
        </div>
      </div>
    </div>
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
          <p className="text-[11px] text-gray-300 mt-1 font-semibold leading-relaxed break-words">
            {comment.text}
          </p>
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
  onAddComment,
  onDeleteComment,
  onReactComment,
  autoOpenPostId,
  onClearAutoOpenPost,
  currentThemeConfig,
}: FeedViewProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
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
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
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
            👁️ PUBLICAÇÕES
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
                onLike={() => onLikePost(post.id)}
                onDelete={() => onDeletePost(post.id)}
                onClick={() => {
                  setSelectedPost(post);
                  onAddPostView(post.id);
                }}
                onAddView={() => onAddPostView(post.id)}
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
                  <button
                    onClick={() => onLikeStory(currentStory.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                      currentStory.starred
                        ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/30'
                        : 'bg-white/10 border-white/25 text-gray-300'
                    }`}
                    title="Gostar"
                  >
                    <Star className={`w-4 h-4 ${currentStory.starred ? 'fill-white' : ''}`} />
                  </button>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-[550px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0c0c24] border-2 border-neon-cyan rounded-3xl p-6 shadow-3xl text-center"
            >
              {/* Close */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-orbitron font-extrabold text-lg text-neon-cyan tracking-wide mb-4 uppercase">
                Detalhes do Post
              </h3>

              {selectedPost.image && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 border border-neon-cyan/20">
                  <img 
                    src={selectedPost.image} 
                    alt="Post Ampliado" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Text content styling matching the post's custom format */}
              {selectedPost.text && (
                <div className="p-4 bg-black/40 border border-neon-cyan/15 rounded-xl text-sm leading-relaxed text-left mb-5">
                  <p style={{ fontFamily: selectedPost.style?.font || 'Poppins', color: selectedPost.style?.color || '#ffffff' }}>
                    {selectedPost.text}
                  </p>
                </div>
              )}

              {/* Author footer */}
              <div className="flex items-center justify-between border-t border-neon-cyan/15 pt-4">
                <div className="flex items-center gap-2">
                  <img 
                    src={selectedPost.author.avatar} 
                    alt={selectedPost.author.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border border-neon-cyan/60 object-cover"
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
                    onClick={() => handleShare(`https://openmz.com/post/${selectedPost.id}`)}
                    className="w-10 h-10 rounded-full bg-[#121235] border border-neon-cyan/25 hover:border-neon-cyan text-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    title="Partilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onLikePost(selectedPost.id);
                      // Mirror local click change to modal item
                      setSelectedPost((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          starred: !prev.starred,
                          stars: prev.starred ? prev.stars - 1 : prev.stars + 1
                        };
                      });
                    }}
                    className={`w-12 h-10 px-3 rounded-full flex items-center gap-1.5 border cursor-pointer hover:scale-105 active:scale-95 transition-all text-xs font-bold ${
                      selectedPost.starred
                        ? 'bg-yellow-500 border-yellow-400 text-white shadow-md'
                        : 'bg-[#121235] border-white/20 text-gray-300'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${selectedPost.starred ? 'fill-white' : ''}`} />
                    <span>{selectedPost.starred ? selectedPost.stars + 1 : selectedPost.stars}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-neon-cyan/15 pt-5 mt-5 text-left">
                <h4 className="font-orbitron font-bold text-xs text-neon-cyan tracking-wider mb-3 uppercase">
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
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('commentText') as HTMLInputElement;
                      const text = input.value;
                      if (!text.trim()) return;
                      onAddComment(selectedPost.id, text.trim());
                      
                      const newComment = {
                        id: 'comment_' + Math.random().toString(36).substring(2, 9),
                        author: {
                          id: currentUser.id,
                          name: currentUser.nickname,
                          avatar: currentUser.avatar
                        },
                        text: text.trim(),
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
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="commentText"
                      required
                      placeholder="Escreva um comentário..."
                      className="flex-1 bg-black/50 border border-neon-cyan/30 rounded-xl px-3 py-2 text-xs outline-none focus:border-neon-cyan text-white placeholder:text-gray-600 font-rajdhani font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neon-cyan hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all cursor-pointer uppercase shrink-0"
                    >
                      Enviar
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
