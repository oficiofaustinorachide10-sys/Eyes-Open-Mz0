/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu, Eye, Newspaper, Video, Calendar, Store, Users, Settings, 
  Sparkles, CheckCircle2, ChevronRight, Bookmark, MapPin, Camera, X, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Post, Story, Comment, Notification, Friendship } from './types';
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
  dbCreateNotification,
  subscribeFriendships,
  dbCreateFriendship,
  dbDeleteFriendship
} from './lib/db';

export default function App() {
  // Theme state: support lite, noite, luz, esmeralda, vinho, ciano, and crepusculo
  const [theme, setTheme] = useState<'lite' | 'noite' | 'luz' | 'esmeralda' | 'vinho' | 'ciano' | 'crepusculo'>(() => {
    const saved = localStorage.getItem('theme');
    return (
      saved === 'lite' || 
      saved === 'noite' || 
      saved === 'luz' || 
      saved === 'esmeralda' || 
      saved === 'vinho' || 
      saved === 'ciano' || 
      saved === 'crepusculo'
    ) ? saved : 'noite';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // App core persistent states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [selectedCommunityUser, setSelectedCommunityUser] = useState<User | null>(null);
  const [initialSelectedChatId, setInitialSelectedChatId] = useState<string | undefined>(undefined);
  
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

    // 7. Subscribe to real-time friendships
    const unsubFriendships = subscribeFriendships((loadedFriendships) => {
      setFriendships(loadedFriendships);
    });

    return () => {
      unsubUsers();
      unsubPosts();
      unsubStories();
      unsubChats();
      unsubFriendships();
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

    // Create a public notification for the entire community
    const registrationNotif: Notification = {
      id: 'notif_reg_' + Math.random().toString(36).substring(2, 9),
      recipientId: 'all',
      title: 'Novo Membro! 👁️🇲🇿',
      text: `${newUser.fullname} (@${newUser.nickname}) já tem uma conta no Open MZ... Quer interagir? Solicite-o!`,
      type: 'system',
      sender: {
        id: newUser.id,
        name: newUser.nickname,
        avatar: newUser.avatar
      },
      read: false,
      targetId: newUser.id,
      targetView: 'comunidade',
      timestamp: Date.now()
    };
    await dbCreateNotification(registrationNotif).catch(console.error);

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
    if (currentUser?.id === 'guest') {
      alert('Como convidado, precisa de uma conta para interagir com publicações. Vamos direcioná-lo para criar uma conta!');
      handleRedirectToRegister();
      return;
    }
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

  const handleRedirectToRegister = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveView('register');
    triggerToast('Inicie registo para aceder a esta funcionalidade!');
  };

  const navigateToView = (view: ViewType) => {
    if (currentUser?.id === 'guest' && view !== 'feed' && view !== 'register') {
      alert('Como convidado, precisa de uma conta para aceder a esta funcionalidade. Vamos direcioná-lo para criar uma conta!');
      handleRedirectToRegister();
      return;
    }
    setActiveView(view);
  };

  const handleNavigateToTarget = (view: ViewType, targetId?: string) => {
    if (targetId) {
      setAutoOpenPostId(targetId);
    }
    navigateToView(view);
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
            onNavigate={navigateToView}
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
        return <ProfileView currentUser={currentUser} onNavigate={navigateToView} />;
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
            onCancel={() => navigateToView('feed')}
          />
        );
      case 'publish-story':
        return (
          <StoryEditor
            onPublish={handlePublishStory}
            onCancel={() => navigateToView('feed')}
          />
        );
      case 'conversas':
        return <ChatView currentUser={currentUser} initialSelectedChatId={initialSelectedChatId} />;
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
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-[var(--theme-text-main)]">
            <h2 className="font-orbitron font-extrabold text-sm text-[var(--theme-accent)] tracking-widest uppercase border-b border-[var(--theme-border)] pb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--theme-accent)]" /> MEMBROS DA COMUNIDADE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(() => {
                const sortedUsers = [...users].sort((a, b) => {
                  const aIsMe = a.id === currentUser?.id;
                  const bIsMe = b.id === currentUser?.id;
                  if (aIsMe && !bIsMe) return -1;
                  if (!aIsMe && bIsMe) return 1;

                  const aSameProvince = a.province === currentUser?.province;
                  const bSameProvince = b.province === currentUser?.province;

                  if (aSameProvince && !bSameProvince) return -1;
                  if (!aSameProvince && bSameProvince) return 1;

                  return 0;
                });

                return sortedUsers.map((mem) => {
                  const isMe = mem.id === currentUser?.id;
                  const isSameProvince = mem.province === currentUser?.province;
                  const isAccepted = friendships.some(f => 
                    f.status === 'accepted' && 
                    ((f.senderId === (currentUser?.id || '') && f.receiverId === mem.id) || 
                     (f.senderId === mem.id && f.receiverId === (currentUser?.id || '')))
                  );
                  const isPending = friendships.some(f => 
                    f.status === 'pending' && 
                    ((f.senderId === (currentUser?.id || '') && f.receiverId === mem.id) || 
                     (f.senderId === mem.id && f.receiverId === (currentUser?.id || '')))
                  );

                  return (
                    <div 
                      key={mem.id} 
                      onClick={() => setSelectedCommunityUser(mem)}
                      className={`p-4 rounded-2xl bg-[var(--theme-bg-card)] border flex items-center justify-between gap-3 shadow-lg select-none cursor-pointer hover:border-[var(--theme-accent)] transition-all ${
                        isSameProvince && !isMe 
                          ? 'border-[var(--theme-accent)]/40 shadow-[var(--theme-accent)]/5' 
                          : 'border-[var(--theme-border)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={mem.avatar || "https://i.pravatar.cc/80?img=1"} 
                          alt={mem.nickname}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-[var(--theme-border)] object-cover shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-[var(--theme-text-main)] truncate leading-tight">{mem.nickname}</p>
                            {isSameProvince && !isMe && (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/40 text-[var(--theme-accent)] text-[8px] font-bold uppercase tracking-wider">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-[var(--theme-text-secondary)] truncate mt-0.5 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> 
                            <span>{mem.province}{mem.district ? ` • ${mem.district}` : ''}</span>
                          </p>
                        </div>
                      </div>
                      {!isMe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAccepted) {
                              triggerToast(`Você já está vinculado com @${mem.nickname}`);
                            } else if (isPending) {
                              triggerToast(`Vínculo pendente com @${mem.nickname}`);
                            } else {
                              const newFriendship = {
                                id: 'friend_' + Math.random().toString(36).substring(2, 9),
                                senderId: currentUser?.id || '',
                                receiverId: mem.id,
                                status: 'pending' as const,
                                timestamp: Date.now()
                              };
                              dbCreateFriendship(newFriendship);

                              // Send notification
                              const newNotif = {
                                id: 'notif_' + Math.random().toString(36).substring(2, 9),
                                recipientId: mem.id,
                                title: 'Novo pedido de vínculo',
                                text: `@${currentUser?.nickname} quer vincular-se contigo!`,
                                type: 'friend_request' as const,
                                sender: {
                                  id: currentUser?.id || '',
                                  name: currentUser?.nickname || '',
                                  avatar: currentUser?.avatar || ''
                                },
                                read: false,
                                targetId: newFriendship.id,
                                targetView: 'notificacoes' as const,
                                timestamp: Date.now()
                              };
                              dbCreateNotification(newNotif);
                              triggerToast(`Pedido de vínculo enviado para: ${mem.nickname}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)] border border-[var(--theme-accent)]/25 hover:text-white text-[var(--theme-accent)] text-[9px] font-bold font-orbitron tracking-widest rounded-lg transition-all cursor-pointer uppercase shrink-0"
                        >
                          {isAccepted ? 'Vinculado' : isPending ? 'Pendente' : 'Vincular'}
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
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
              
              <div className="border-b border-white/5 pb-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">TEMA VISUAL DO APLICATIVO (7 MODOS)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {[
                    { id: 'noite', name: 'Noite', color: '#3b82f6', bg: 'bg-[#050508]' },
                    { id: 'luz', name: 'Luz', color: '#2563eb', bg: 'bg-white border-zinc-200' },
                    { id: 'lite', name: 'Lite', color: '#4f46e5', bg: 'bg-slate-100 border-slate-200' },
                    { id: 'esmeralda', name: 'Esmeralda', color: '#10b981', bg: 'bg-[#041611]' },
                    { id: 'vinho', name: 'Vinho', color: '#db2777', bg: 'bg-[#14050d]' },
                    { id: 'ciano', name: 'Ciano', color: '#06b6d4', bg: 'bg-[#020813]' },
                    { id: 'crepusculo', name: 'Crepúsculo', color: '#8b5cf6', bg: 'bg-[#0f0c1b]' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`relative p-3 rounded-2xl font-bold text-xs transition-all uppercase cursor-pointer border flex flex-col items-center gap-1.5 ${
                        theme === t.id
                          ? 'border-neon-cyan bg-neon-cyan/10 shadow-lg'
                          : 'border-white/5 bg-black/40 text-gray-400 hover:text-white hover:bg-black/60'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${t.bg} flex items-center justify-center border border-white/10`} style={{ borderColor: theme === t.id ? t.color : undefined }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      </div>
                      <span className="text-[10px] tracking-wider">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

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
    <div className={`min-h-screen bg-[#060613] text-white flex theme-${theme}`}>
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
              navigateToView(v);
              setIsMobileSidebarOpen(false);
            }}
            onLogout={handleLogout}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            unreadChatsCount={unreadChatsCount}
            unreadNotificationsCount={unreadNotificationsCount}
            theme={theme}
            setTheme={setTheme}
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
                onClick={() => navigateToView('profile')}
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

      {/* USER PROFILE MODAL IN COMMUNITY VIEW */}
      <AnimatePresence>
        {selectedCommunityUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-main)] w-full max-w-md rounded-3xl p-6 relative shadow-2xl text-left space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedCommunityUser(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <img 
                  src={selectedCommunityUser.avatar || "https://i.pravatar.cc/80?img=1"} 
                  alt={selectedCommunityUser.nickname}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full border-2 border-[var(--theme-accent)] object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-[var(--theme-text-main)] truncate">{selectedCommunityUser.fullname || `${selectedCommunityUser.firstname} ${selectedCommunityUser.surname}`}</h3>
                    {selectedCommunityUser.isVIP && (
                      <span className="px-1.5 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 text-[8px] font-bold rounded uppercase tracking-wider shrink-0">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--theme-accent)] font-bold truncate">@{selectedCommunityUser.nickname}</p>
                  <p className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--theme-accent)]" /> {selectedCommunityUser.province}
                  </p>
                </div>
              </div>

              {/* User Stats Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[var(--theme-bg-hover)] rounded-2xl p-3 border border-[var(--theme-border)] text-center">
                <div>
                  <p className="text-base font-bold text-[var(--theme-text-main)] font-mono">{selectedCommunityUser.stats?.posts || 0}</p>
                  <p className="text-[9px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">Posts</p>
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--theme-text-main)] font-mono">{selectedCommunityUser.stats?.likes || 0}</p>
                  <p className="text-[9px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">Likes</p>
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--theme-text-main)] font-mono">{selectedCommunityUser.stats?.friends || 0}</p>
                  <p className="text-[9px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">Vínculos</p>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-1 bg-[var(--theme-bg-hover)] p-3.5 rounded-xl border border-[var(--theme-border)]">
                <p className="text-[9px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">Sobre / Atividade</p>
                <p className="text-xs text-[var(--theme-text-main)] leading-relaxed">
                  Membro ativo de {selectedCommunityUser.province} registado no Open MZ. Tem {selectedCommunityUser.stats?.posts || 0} publicações e {selectedCommunityUser.stats?.friends || 0} conexões artísticas estabelecidas.
                </p>
              </div>

              {/* Action Options */}
              <div className="space-y-2 pt-2">
                {selectedCommunityUser.id !== currentUser.id ? (
                  <>
                    <button
                      onClick={() => {
                        setInitialSelectedChatId(selectedCommunityUser.id);
                        setActiveView('conversas');
                        setSelectedCommunityUser(null);
                      }}
                      className="w-full py-2.5 bg-[var(--theme-accent)] text-white hover:opacity-90 font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-white" /> Enviar Mensagem
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const hasConnection = friendships.some(f => 
                            f.status === 'accepted' && 
                            ((f.senderId === currentUser.id && f.receiverId === selectedCommunityUser.id) || 
                             (f.senderId === selectedCommunityUser.id && f.receiverId === currentUser.id))
                          );
                          
                          if (hasConnection) {
                            const f = friendships.find(f => 
                              ((f.senderId === currentUser.id && f.receiverId === selectedCommunityUser.id) || 
                               (f.senderId === selectedCommunityUser.id && f.receiverId === currentUser.id))
                            );
                            if (f) dbDeleteFriendship(f.id);
                            triggerToast(`Vínculo removido com ${selectedCommunityUser.nickname}`);
                          } else {
                            const pending = friendships.some(f => 
                              f.status === 'pending' && 
                              ((f.senderId === currentUser.id && f.receiverId === selectedCommunityUser.id) || 
                               (f.senderId === selectedCommunityUser.id && f.receiverId === currentUser.id))
                            );
                            
                            if (pending) {
                              triggerToast(`Já existe um pedido de vínculo pendente com ${selectedCommunityUser.nickname}`);
                            } else {
                              const newFriendship = {
                                id: 'friend_' + Math.random().toString(36).substring(2, 9),
                                senderId: currentUser.id,
                                receiverId: selectedCommunityUser.id,
                                status: 'pending' as const,
                                timestamp: Date.now()
                              };
                              dbCreateFriendship(newFriendship);
                              
                              // Send a real-time notification
                              const newNotif = {
                                id: 'notif_' + Math.random().toString(36).substring(2, 9),
                                recipientId: selectedCommunityUser.id,
                                title: 'Novo pedido de vínculo',
                                text: `@${currentUser.nickname} quer vincular-se contigo!`,
                                type: 'friend_request' as const,
                                sender: {
                                  id: currentUser.id,
                                  name: currentUser.nickname,
                                  avatar: currentUser.avatar
                                },
                                read: false,
                                targetId: newFriendship.id,
                                targetView: 'notificacoes' as const,
                                timestamp: Date.now()
                              };
                              dbCreateNotification(newNotif);
                              triggerToast(`Pedido de vínculo enviado para ${selectedCommunityUser.nickname}`);
                            }
                          }
                        }}
                        className="py-2.5 bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-[var(--theme-text-main)] font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-1"
                      >
                        {friendships.some(f => 
                          f.status === 'accepted' && 
                          ((f.senderId === currentUser.id && f.receiverId === selectedCommunityUser.id) || 
                           (f.senderId === selectedCommunityUser.id && f.receiverId === currentUser.id))
                        ) ? 'Desvincular' : friendships.some(f => 
                          f.status === 'pending' && 
                          ((f.senderId === currentUser.id && f.receiverId === selectedCommunityUser.id) || 
                           (f.senderId === selectedCommunityUser.id && f.receiverId === currentUser.id))
                        ) ? 'Pendente' : 'Vincular'}
                      </button>

                      <button
                        onClick={() => {
                          triggerToast(`Utilizador @${selectedCommunityUser.nickname} denunciado.`);
                          setSelectedCommunityUser(null);
                        }}
                        className="py-2.5 bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] hover:border-red-500/30 text-[var(--theme-text-secondary)] hover:text-red-500 font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-1"
                      >
                        Denunciar
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setActiveView('profile');
                      setSelectedCommunityUser(null);
                    }}
                    className="w-full py-2.5 bg-neon-cyan text-black hover:bg-white font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-2"
                  >
                    Editar Meu Perfil
                  </button>
                )}
              </div>

              {/* User's recent posts list within modal */}
              <div className="space-y-3 pt-4 border-t border-white/5 text-left">
                <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Publicações Recentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                  {posts.filter(p => p.author.id === selectedCommunityUser.id).length > 0 ? (
                    posts.filter(p => p.author.id === selectedCommunityUser.id).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setAutoOpenPostId(p.id);
                          setActiveView('feed');
                          setSelectedCommunityUser(null);
                        }}
                        className="p-3 bg-black/30 hover:bg-black/50 border border-white/5 rounded-xl text-left cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex justify-between items-center text-[8px] text-neon-cyan font-bold uppercase">
                          <span>{p.category}</span>
                          <span className="text-gray-500 font-normal">{new Date(p.timestamp).toLocaleDateString('pt-MZ')}</span>
                        </div>
                        <p className="text-xs font-bold text-white leading-snug line-clamp-1">{p.title}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{p.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">Sem publicações até ao momento.</p>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
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

