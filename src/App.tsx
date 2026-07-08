/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu, Eye, Newspaper, Video, Calendar, Store, Users, Settings, 
  Sparkles, CheckCircle2, ChevronRight, Bookmark, MapPin, Camera 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Post, Story, Comment, Notification } from './types';
import { SEED_USERS, SEED_POSTS, SEED_STORIES } from './utils';

// Import our modular subcomponents
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import Sidebar, { ViewType } from './components/Sidebar';
import NotificationsView from './components/NotificationsView';
import FeedView from './components/FeedView';
import StoryEditor from './components/StoryEditor';
import ProfileView from './components/ProfileView';
import AccountView from './components/AccountView';
import PublishPostView from './components/PublishPostView';
import ChatView from './components/ChatView';
import MusicView from './components/MusicView';
import FontView from './components/FontView';
import CinemaView from './components/CinemaView';
import AbraView from './components/AbraView';

// Import our Firestore synchronization utilities
import {
  seedDatabaseIfEmpty,
  subscribeUsers,
  subscribePosts,
  subscribeStories,
  dbUpdateUser,
  dbDeleteUser,
  dbCreatePost,
  dbDeletePost,
  dbUpdatePost,
  dbCreateStory,
  dbDeleteStory,
  dbUpdateStory,
  subscribeChats,
  subscribeNotifications,
  dbCreateNotification
} from './lib/db';

export default function App() {
  // App core persistent states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  
  // Real-time message thread and notification states
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [autoOpenPostId, setAutoOpenPostId] = useState<string | undefined>(undefined);
  
  // Navigation states
  const [activeView, setActiveView] = useState<ViewType>('feed');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Auxiliary micro-interaction toast state
  const [successToast, setSuccessToast] = useState('');

  // Unread badge counters (real-time synced with active timestamps)
  const unreadChatsCount = currentUser && currentUser.id !== 'guest'
    ? messages.filter(m => m.sender.id !== currentUser.id && m.timestamp > (currentUser.lastReadChatTimestamp || 0)).length
    : 0;

  const unreadNotificationsCount = currentUser
    ? notifications.filter(n => !n.read).length
    : 0;

  // 1. Initial State Loading and Seeding with real-time Firestore Subscriptions
  useEffect(() => {
    // 1. First trigger seeding of the database if collections are completely blank
    seedDatabaseIfEmpty();

    // 2. Load cached current user session (including guest or register/login cache)
    const storedSession = localStorage.getItem('currentUser');
    if (storedSession) {
      try {
        const sessionUser = JSON.parse(storedSession);
        setCurrentUser(sessionUser);
      } catch (e) {
        setCurrentUser(null);
      }
    }

    // 3. Subscribe to real-time Users
    const unsubUsers = subscribeUsers((loadedUsers) => {
      setUsers(loadedUsers);
      
      // Keep active user session in sync with database profile modifications
      if (storedSession) {
        try {
          const sessionUser = JSON.parse(storedSession);
          const masterUser = loadedUsers.find(u => u.id === sessionUser.id);
          if (masterUser) {
            setCurrentUser(masterUser);
            localStorage.setItem('currentUser', JSON.stringify(masterUser));
          }
        } catch (e) {}
      }
    });

    // 4. Subscribe to real-time Posts
    const unsubPosts = subscribePosts((loadedPosts) => {
      setPosts(loadedPosts);
    });

    // 5. Subscribe to real-time Stories
    const unsubStories = subscribeStories((loadedStories) => {
      setStories(loadedStories);
    });

    // 6. Subscribe to real-time chats for unread count calculations
    const unsubChats = subscribeChats((loadedMsgs) => {
      setMessages(loadedMsgs);
    });

    return () => {
      unsubUsers();
      unsubPosts();
      unsubStories();
      unsubChats();
    };
  }, []);

  // Listen to active notifications for current user
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const unsubNotifs = subscribeNotifications(currentUser.id, (loadedNotifs) => {
      setNotifications(loadedNotifs);
    });
    return () => unsubNotifs();
  }, [currentUser?.id]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // 2. Authentication handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setActiveView('feed');
    triggerToast(`Sessão iniciada! Bem-vindo, ${user.nickname}`);
  };

  const handleRegisterSuccess = async (newUser: User) => {
    // Automatically write newly created user to Firestore!
    await dbUpdateUser(newUser);
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setActiveView('feed');
    triggerToast(`Registo completo! Bem-vindo, ${newUser.nickname}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveView('feed');
    triggerToast('Terminou a sessão com sucesso!');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    await dbUpdateUser(updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    triggerToast('Perfil atualizado com sucesso!');
  };

  const handleDeleteAccount = async (userId: string) => {
    if (confirm('Atenção: Esta ação é irreversível. Deseja realmente eliminar o seu perfil do Eyes Open MZ?')) {
      await dbDeleteUser(userId);
      
      // Purge posts and stories from this user for security
      const postsToDelete = posts.filter(p => p.author.id === userId);
      for (const p of postsToDelete) {
        await dbDeletePost(p.id);
      }

      const storiesToDelete = stories.filter(s => s.author.id === userId);
      for (const s of storiesToDelete) {
        await dbDeleteStory(s.id);
      }

      handleLogout();
    }
  };

  // 3. Post interactions (Like, View, Post, Delete, Comment)
  const handleLikePost = async (postId: string) => {
    const p = posts.find(x => x.id === postId);
    if (!p) return;

    const nextStarred = !p.starred;
    const updated: Post = {
      ...p,
      starred: nextStarred,
      stars: nextStarred ? p.stars + 1 : p.stars - 1
    };
    await dbUpdatePost(updated);

    if (currentUser && nextStarred && p.author.id !== currentUser.id) {
      const notif: Notification = {
        id: 'notif_like_' + Math.random().toString(36).substring(2, 9),
        recipientId: p.author.id,
        title: 'Nova Estrela ⭐',
        text: `${currentUser.nickname} deu uma estrela à sua publicação: "${p.text ? p.text.substring(0, 30) : 'foto'}..."`,
        type: 'star',
        sender: {
          id: currentUser.id,
          name: currentUser.nickname,
          avatar: currentUser.avatar
        },
        read: false,
        targetId: p.id,
        targetView: 'feed',
        timestamp: Date.now()
      };
      await dbCreateNotification(notif).catch(console.error);
    }
  };

  const handleAddPostView = async (postId: string) => {
    const sessionKey = `viewed_post_${postId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    
    const p = posts.find(x => x.id === postId);
    if (!p) return;

    const updated: Post = {
      ...p,
      views: p.views + 1
    };
    await dbUpdatePost(updated);
    sessionStorage.setItem(sessionKey, 'true');
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Tem a certeza que deseja eliminar esta publicação permanentemente?')) {
      await dbDeletePost(postId);
      triggerToast('Publicação removida com sucesso!');
    }
  };

  const handlePublishPost = async (imgSrc: string | null, text: string, font: string, color: string) => {
    if (!currentUser) return;
    if (currentUser.id === 'guest') {
      alert('Convidados não possuem permissão para criar publicações.');
      return;
    }

    const newPost: Post = {
      id: 'post_' + Math.random().toString(36).substring(2, 9),
      image: imgSrc,
      text,
      style: { font, color },
      author: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      stars: 0,
      views: 0,
      timestamp: Date.now(),
      comments: []
    };

    await dbCreatePost(newPost);
    setActiveView('feed');
    triggerToast('Publicação criada com sucesso!');
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser || currentUser.id === 'guest') return;
    const p = posts.find(x => x.id === postId);
    if (!p) return;

    const newComment: Comment = {
      id: 'comment_' + Math.random().toString(36).substring(2, 9),
      author: {
        id: currentUser.id,
        name: currentUser.nickname,
        avatar: currentUser.avatar
      },
      text,
      timestamp: Date.now()
    };

    const updated: Post = {
      ...p,
      comments: [...(p.comments || []), newComment]
    };
    await dbUpdatePost(updated);

    if (p.author.id !== currentUser.id) {
      const notif: Notification = {
        id: 'notif_comment_' + Math.random().toString(36).substring(2, 9),
        recipientId: p.author.id,
        title: 'Novo Comentário 💬',
        text: `${currentUser.nickname} comentou na sua publicação: "${text.substring(0, 30)}..."`,
        type: 'comment',
        sender: {
          id: currentUser.id,
          name: currentUser.nickname,
          avatar: currentUser.avatar
        },
        read: false,
        targetId: p.id,
        targetView: 'feed',
        timestamp: Date.now()
      };
      await dbCreateNotification(notif).catch(console.error);
    }
  };

  // 4. Story interactions (Like, View, Post)
  const handleLikeStory = async (storyId: string) => {
    const s = stories.find(x => x.id === storyId);
    if (!s) return;

    const nextStarred = !s.starred;
    const updated: Story = {
      ...s,
      starred: nextStarred,
      stars: (s.stars || 0) + (nextStarred ? 1 : -1)
    };
    await dbUpdateStory(updated);

    if (currentUser && nextStarred && s.author.id !== currentUser.id) {
      const notif: Notification = {
        id: 'notif_story_' + Math.random().toString(36).substring(2, 9),
        recipientId: s.author.id,
        title: 'Reação na História 💥',
        text: `${currentUser.nickname} gostou da sua história no Eyes 42h!`,
        type: 'star',
        sender: {
          id: currentUser.id,
          name: currentUser.nickname,
          avatar: currentUser.avatar
        },
        read: false,
        targetId: s.id,
        targetView: 'feed',
        timestamp: Date.now()
      };
      await dbCreateNotification(notif).catch(console.error);
    }
  };

  const handleAddStoryView = async (storyId: string) => {
    const sessionKey = `viewed_story_${storyId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const s = stories.find(x => x.id === storyId);
    if (!s) return;

    const updated: Story = {
      ...s,
      views: (s.views || 0) + 1
    };
    await dbUpdateStory(updated);
    sessionStorage.setItem(sessionKey, 'true');
  };

  const handlePublishStory = async (storySrc: string, text: string | null, font: string, color: string, musicName?: string) => {
    if (!currentUser) return;
    if (currentUser.id === 'guest') {
      alert('Convidados não possuem permissão para criar histórias.');
      return;
    }

    const newStory: Story = {
      id: 'story_' + Math.random().toString(36).substring(2, 9),
      type: 'photo',
      src: storySrc,
      text: text || undefined,
      style: { font, color },
      musicName,
      author: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      stars: 0,
      views: 0,
      timestamp: Date.now()
    };

    await dbCreateStory(newStory);
    setActiveView('feed');
    triggerToast('História publicada com sucesso no Eyes 42h!');
  };

  const handleNavigateToTarget = (view: ViewType, targetId?: string) => {
    if (targetId) {
      setAutoOpenPostId(targetId);
    }
    setActiveView(view);
  };

  // 5. Views Switcher Router Routing logic (Ensures absolutely NO empty states or broken buttons)
  const renderActiveView = () => {
    if (!currentUser) return null;

    switch (activeView) {
      case 'feed':
        return (
          <FeedView
            currentUser={currentUser}
            posts={posts}
            stories={stories}
            onNavigate={setActiveView}
            onLikePost={handleLikePost}
            onDeletePost={handleDeletePost}
            onLikeStory={handleLikeStory}
            onAddStoryView={handleAddStoryView}
            onAddPostView={handleAddPostView}
            onAddComment={handleAddComment}
            autoOpenPostId={autoOpenPostId}
            onClearAutoOpenPost={() => setAutoOpenPostId(undefined)}
          />
        );
      case 'profile':
        return <ProfileView currentUser={currentUser} onNavigate={setActiveView} />;
      case 'account':
        return (
          <AccountView
            currentUser={currentUser}
            users={users}
            onUpdateUser={handleUpdateUser}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case 'publish-post':
        return (
          <PublishPostView
            onPublish={handlePublishPost}
            onCancel={() => setActiveView('feed')}
          />
        );
      case 'publish-story':
        return (
          <StoryEditor
            onPublish={handlePublishStory}
            onCancel={() => setActiveView('feed')}
          />
        );
      case 'conversas':
        return <ChatView currentUser={currentUser} />;
      case 'notificacoes':
        return (
          <NotificationsView
            currentUser={currentUser}
            notifications={notifications}
            onNavigateToTarget={handleNavigateToTarget}
          />
        );
      case 'musica':
        return <MusicView />;
      case 'fonte-letra':
        return <FontView />;
      case 'cinema':
        return <CinemaView />;
      case 'abra-olhos':
        return <AbraView />;
      
      // CURATED ARTICLES LIST VIEW
      case 'artigos':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/20 pb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-neon-cyan" /> ARTIGOS CULTURAIS CINE
            </h2>
            <div className="space-y-4">
              {[
                { title: 'A Revolução do Cinema em Moçambique', summary: 'Como jovens cineastas moçambicanos estão a redefinir a narrativa audiovisual africana com produções independentes de baixo orçamento e histórias genuínas.', date: 'Julho, 2026', readTime: '5 min de leitura' },
                { title: 'A Estética da Marrabenta no Ecran', summary: 'Um ensaio aprofundado sobre a sinergia visual entre os ritmos clássicos da Marrabenta e as cores vibrantes do cinema de rua do Sul do país.', date: 'Junho, 2026', readTime: '4 min de leitura' },
                { title: 'A Preservação Histórica Através das Lentes', summary: 'Explorando os esforços de restauração digital e recuperação de arquivos de documentários históricos do Instituto Nacional de Audiovisual e Cinema.', date: 'Maio, 2026', readTime: '7 min de leitura' }
              ].map((art, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#090924] border border-white/5 hover:border-neon-cyan/30 transition-all shadow-lg space-y-2">
                  <span className="text-[10px] text-neon-cyan font-bold tracking-wider uppercase block">{art.date} • {art.readTime}</span>
                  <h3 className="text-lg font-bold text-white leading-tight">{art.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-semibold">{art.summary}</p>
                  <button 
                    onClick={() => alert(`Artigo "${art.title}" em processamento de leitura!`)} 
                    className="text-xs text-neon-cyan hover:text-white font-bold tracking-wider mt-2 cursor-pointer flex items-center gap-1 font-orbitron"
                  >
                    LER ARTIGO COMPLETO <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      // CURATED VIDEOS GALLERY VIEW
      case 'videos':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/20 pb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-neon-cyan" /> GALERIA DE VÍDEOS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Teaser: Amanhecer no Limpopo', length: '1:45', plays: 1245, url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400' },
                { title: 'Ritmos Digitais da Matola', length: '3:20', plays: 892, url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400' },
                { title: 'Curta-metragem: Xigubo Roots', length: '8:45', plays: 2450, url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400' },
                { title: 'Maputo Noite Adentro Documentário', length: '12:15', plays: 1540, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' }
              ].map((vid, idx) => (
                <div key={idx} className="rounded-2xl bg-[#090924] border border-white/5 overflow-hidden shadow-lg flex flex-col group hover:border-neon-cyan/30 transition-all">
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img src={vid.url} alt={vid.title} referrerPolicy="no-referrer" className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-all" />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold tracking-wider">{vid.length}</span>
                    <button 
                      onClick={() => alert(`A abrir reprodutor para: "${vid.title}"`)} 
                      className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors cursor-pointer"
                    >
                      <Video className="w-8 h-8 text-neon-cyan drop-shadow-[0_0_8px_#00f5ff]" />
                    </button>
                  </div>
                  <div className="p-3.5 flex flex-col justify-between flex-grow">
                    <p className="text-xs font-bold text-white truncate leading-tight">{vid.title}</p>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-2.5">
                      <span>Cinema Moz</span>
                      <span>{vid.plays} Plays</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // CURATED EVENTS GATHERINGS RSVP LIST VIEW
      case 'eventos':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/20 pb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neon-cyan" /> EVENTOS & ENCONTROS
            </h2>
            <div className="space-y-4">
              {[
                { title: 'Festival de Curtas de Maputo 2026', date: '22 Agosto, 2026', location: 'Centro Cultural Franco-Moçambicano', details: 'Exibição das melhores curtas-metragens moçambicanas do ano, seguidas de debates técnicos de produção.' },
                { title: 'Workshop de Fotografia Retratista da Beira', date: '15 Setembro, 2026', location: 'Auditório Municipal da Beira', details: 'Formação interativa com curadoria de Oficio MZ focada em captação natural e iluminação de exterior.' }
              ].map((ev, idx) => (
                <EventCard key={idx} ev={ev} idx={idx} triggerToast={triggerToast} />
              ))}
            </div>
          </div>
        );

      // CURATED STORE PRODUCTS VIEW
      case 'loja':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/20 pb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-neon-cyan" /> MERCADO DE ARTE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Câmara Cinema Vintage Super8', price: '12,500 MT', rating: '4.8', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=250' },
                { title: 'Tripé Hidráulico Estável', price: '4,200 MT', rating: '4.6', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=250' },
                { title: 'Livro: Cinema em Moçambique', price: '1,500 MT', rating: '5.0', url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=250' }
              ].map((prod, idx) => (
                <div key={idx} className="rounded-2xl bg-[#090924] border border-white/5 overflow-hidden shadow-lg flex flex-col group hover:border-neon-cyan/30 transition-all select-none">
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img src={prod.url} alt={prod.title} referrerPolicy="no-referrer" className="w-full h-full object-cover brightness-90 group-hover:scale-103 transition-transform" />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-xs text-neon-cyan font-bold tracking-wider">{prod.price}</span>
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow space-y-3 text-left">
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{prod.title}</p>
                      <span className="text-[10px] text-yellow-400 font-bold font-mono mt-1 block">★ {prod.rating} Classificação</span>
                    </div>
                    <button 
                      onClick={() => triggerToast(`Produto "${prod.title}" adicionado ao carrinho!`)} 
                      className="w-full py-2 bg-neon-cyan text-black hover:bg-white text-[10px] font-orbitron font-extrabold tracking-widest rounded-lg transition-colors cursor-pointer uppercase"
                    >
                      Comprar Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // CURATED MEMBERS LIST COMMUNITY VIEW
      case 'comunidade':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/20 pb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" /> MEMBROS DA COMUNIDADE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.map((mem) => {
                const isMe = mem.id === currentUser.id;
                return (
                  <div key={mem.id} className="p-4 rounded-2xl bg-[#090924] border border-white/5 flex items-center justify-between gap-3 shadow-lg select-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={mem.avatar || "https://i.pravatar.cc/80?img=1"} 
                        alt={mem.nickname}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-neon-cyan object-cover shrink-0"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-white truncate leading-tight">{mem.nickname}</p>
                        <p className="text-[9px] text-gray-500 truncate mt-0.5 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {mem.province}</p>
                      </div>
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => triggerToast(`Pedido de amizade enviado para: ${mem.nickname}`)}
                        className="px-3 py-1.5 bg-neon-cyan/10 hover:bg-neon-cyan border border-neon-cyan/25 hover:text-black text-neon-cyan text-[9px] font-bold font-orbitron tracking-widest rounded-lg transition-all cursor-pointer uppercase"
                      >
                        Vincular
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      // PREFERENCES CONFIGURATION VIEW
      case 'config':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-white">
            <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/20 pb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-neon-cyan" /> CONFIGURAÇÕES GERAIS
            </h2>
            <div className="bg-[#090924] border border-neon-cyan/20 rounded-3xl p-6 shadow-2xl space-y-6 text-left">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Ecrã de Alto Contraste</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Ajusta o gradiente do fundo e realça os contornos de neon.</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-neon-cyan cursor-pointer" />
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Filtro de Fumo Automático</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Carrega histórias 42h sempre sob uma máscara escura anti-flicker.</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-neon-cyan cursor-pointer" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Modo Poupança de Dados</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Reduz a fidelidade das imagens Unsplash sob baixa conexão de internet.</p>
                </div>
                <input type="checkbox" className="accent-neon-cyan cursor-pointer" />
              </div>

            </div>
          </div>
        );

      default:
        return (
          <div className="flex-grow flex items-center justify-center p-6 text-center select-none">
            <div className="space-y-3">
              <Sparkles className="w-12 h-12 text-neon-cyan animate-pulse mx-auto" />
              <p className="font-orbitron font-bold text-sm tracking-widest uppercase">Brevemente Disponível</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">Este módulo está em processamento artístico de código.</p>
            </div>
          </div>
        );
    }
  };

  const trKey = 'rsvp_event_';
  const trId = 'rsvp_event_0';

  // 6. Root Frame Renders
  return (
    <div className="min-h-screen bg-[#060613] text-white flex">
      {!currentUser ? (
        /* If session is not authenticated, render Login/Register views */
        <div className="flex-1">
          {activeView === 'register' ? (
            <RegisterView
              users={users}
              onRegisterSuccess={handleRegisterSuccess}
              onGoToLogin={() => setActiveView('feed')}
            />
          ) : (
            <LoginView
              users={users}
              onLoginSuccess={handleLoginSuccess}
              onGoToRegister={() => setActiveView('register')}
            />
          )}
        </div>
      ) : (
        /* Authenticated App Shell */
        <div className="flex flex-col lg:flex-row w-full min-h-screen relative overflow-hidden">
          {/* Main Side Nav Drawer Panel */}
          <Sidebar
            currentUser={currentUser}
            activeView={activeView}
            onNavigate={(v) => {
              setActiveView(v);
              setIsMobileSidebarOpen(false);
            }}
            onLogout={handleLogout}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            unreadChatsCount={unreadChatsCount}
            unreadNotificationsCount={unreadNotificationsCount}
          />

          {/* Core Content Container */}
          <div className="flex-grow flex flex-col h-screen overflow-hidden">
            {/* Mobile Title Bar */}
            <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-neon-cyan/20 bg-[#08081a]/95 shrink-0 z-10 select-none">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="text-neon-cyan p-1 hover:bg-[#121235]/40 rounded-lg cursor-pointer relative"
              >
                <Menu className="w-6 h-6" />
                {(unreadChatsCount + unreadNotificationsCount) > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border border-black rounded-full animate-pulse shadow-[0_0_4px_#ef4444]"></span>
                )}
              </button>
              <h2 className="font-orbitron font-black text-base text-neon-cyan tracking-wider glow-text-cyan">
                OPEN MZ
              </h2>
              <img 
                src={currentUser.avatar || "https://i.pravatar.cc/80?img=1"} 
                alt={currentUser.nickname} 
                referrerPolicy="no-referrer"
                onClick={() => setActiveView('profile')}
                className="w-8 h-8 rounded-full border border-neon-cyan/70 object-cover cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              />
            </header>

            {/* Active View viewport */}
            <main className="flex-grow flex flex-col overflow-y-auto no-scrollbar bg-[#050511] relative">
              {renderActiveView()}
            </main>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST ALERTS */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-5 right-5 z-[20000] flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-500 border border-green-400 text-black font-rajdhani font-extrabold text-sm shadow-2xl select-none"
          >
            <CheckCircle2 className="w-5 h-5 text-black animate-bounce" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventCard({ ev, idx, triggerToast }: { ev: any; idx: number; triggerToast: (msg: string) => void; key?: number }) {
  const sessionKey = `rsvp_event_${idx}`;
  const [rsvped, setRsvped] = useState(false);

  useEffect(() => {
    setRsvped(!!sessionStorage.getItem(sessionKey));
  }, [sessionKey]);

  return (
    <div className="p-5 rounded-2xl bg-[#090924] border border-white/5 hover:border-neon-cyan/30 transition-all shadow-lg space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-neon-cyan font-mono">{ev.date}</span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ev.location}</span>
      </div>
      <h3 className="text-base font-bold text-white leading-tight text-left">{ev.title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed font-semibold text-left">{ev.details}</p>
      <button
        onClick={() => {
          const next = !rsvped;
          setRsvped(next);
          if (next) {
            sessionStorage.setItem(sessionKey, 'true');
            triggerToast('Inscrição confirmada com sucesso! ✔️');
          } else {
            sessionStorage.removeItem(sessionKey);
            triggerToast('Inscrição cancelada.');
          }
        }}
        className={`w-full py-2.5 border rounded-xl text-xs font-bold font-orbitron tracking-widest transition-all cursor-pointer uppercase ${
          rsvped 
            ? 'bg-green-500/25 border-green-500 text-white' 
            : 'bg-[#121235] border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan hover:text-black'
        }`}
      >
        {rsvped ? 'Inscrição Confirmada ✔️' : 'Participar no Evento'}
      </button>
    </div>
  );
}

