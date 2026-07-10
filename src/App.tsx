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
import { FloatingSearch } from './components/FloatingSearch';
import { UserAvatar } from './components/UserAvatar';
import { THEME_CONFIGS, injectThemeVariables, ThemeConfig } from './utils/themeEngine';

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
  // App core persistent states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Extended theme state: support all themes, persisting the values properly
  const [theme, setThemeState] = useState<'lite' | 'noite' | 'luz' | 'esmeralda' | 'vinho' | 'ciano' | 'crepusculo' | 'neon-cyber' | 'glass-minimalist'>(() => {
    const saved = localStorage.getItem('theme') as any;
    return (saved && THEME_CONFIGS[saved]) ? saved : 'noite';
  });

  const setTheme = (newTheme: 'lite' | 'noite' | 'luz' | 'esmeralda' | 'vinho' | 'ciano' | 'crepusculo' | 'neon-cyber' | 'glass-minimalist') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    // Manual selection overrides adaptive controls
    setAdaptiveControls(false);
  };

  // Adaptive Controls & Sensors
  const [adaptiveControls, setAdaptiveControls] = useState<boolean>(() => {
    const saved = localStorage.getItem('adaptiveControls');
    return saved === null ? true : saved === 'true';
  });

  const [uiMode, setUiMode] = useState<'performance' | 'immersive'>(() => {
    const saved = localStorage.getItem('uiMode');
    return (saved === 'performance' || saved === 'immersive') ? saved : 'immersive';
  });

  const [simulatedBattery, setSimulatedBattery] = useState<number>(100);
  const [actualBattery, setActualBattery] = useState<number | null>(null);
  const [isUltraSaver, setIsUltraSaver] = useState<boolean>(false);
  const [currentThemeConfig, setCurrentThemeConfig] = useState<ThemeConfig>(THEME_CONFIGS['noite']);

  // Sync adaptiveControls & uiMode to localStorage
  useEffect(() => {
    localStorage.setItem('adaptiveControls', String(adaptiveControls));
  }, [adaptiveControls]);

  useEffect(() => {
    localStorage.setItem('uiMode', uiMode);
  }, [uiMode]);

  // Sync physical battery level if supported
  useEffect(() => {
    if (typeof window === 'undefined' || !('getBattery' in navigator)) return;

    let batteryInstance: any = null;
    const updateBatteryStatus = () => {
      if (batteryInstance) {
        setActualBattery(Math.round(batteryInstance.level * 100));
      }
    };

    (navigator as any).getBattery().then((battery: any) => {
      batteryInstance = battery;
      updateBatteryStatus();
      battery.addEventListener('levelchange', updateBatteryStatus);
    });

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', updateBatteryStatus);
      }
    };
  }, []);

  const effectiveBatteryLevel = actualBattery !== null && actualBattery < simulatedBattery ? actualBattery : simulatedBattery;

  // Manage Ultra Saver Mode transition and notifications
  useEffect(() => {
    const isLow = effectiveBatteryLevel < 20;
    if (isLow && !isUltraSaver && adaptiveControls) {
      setIsUltraSaver(true);
      triggerToast('Modo de economia ativado para poupar bateria');
      
      const lowBatteryNotif: Notification = {
        id: 'notif_battery_' + Date.now(),
        recipientId: currentUser?.id || 'guest',
        title: 'Modo Ultra Economia 🔋',
        text: 'A bateria está abaixo de 20%. O Eyes Open MZ ativou automaticamente o tema preto puro, reduziu as animações e simplificou as grelhas para poupar energia.',
        type: 'system',
        sender: {
          id: 'system',
          name: 'Gestor de Bateria',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
        },
        read: false,
        targetId: 'config',
        targetView: 'notificacoes',
        timestamp: Date.now()
      };
      
      if (currentUser && currentUser.id !== 'guest') {
        dbCreateNotification(lowBatteryNotif).catch(console.error);
      } else {
        setNotifications(prev => [lowBatteryNotif, ...prev]);
      }
    } else if ((!isLow || !adaptiveControls) && isUltraSaver) {
      setIsUltraSaver(false);
      triggerToast('Bateria normalizada. Modo de economia desativado.');
    }
  }, [effectiveBatteryLevel, adaptiveControls, currentUser?.id, isUltraSaver]);

  // Live swap CSS properties & compute current theme config
  useEffect(() => {
    let resolvedThemeId = theme;

    if (adaptiveControls) {
      if (effectiveBatteryLevel < 20) {
        // Battery mode forces amoled black variable overrides in injectThemeVariables
      } else {
        // Circadian Clock switching: Day (06:00 to 18:00) vs Night (18:01 to 05:59)
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        resolvedThemeId = isDay ? 'luz' : 'noite';
      }
    }

    const config = THEME_CONFIGS[resolvedThemeId] || THEME_CONFIGS['noite'];
    setCurrentThemeConfig(config);

    // Inject styles instantly to documentElement
    injectThemeVariables(config, uiMode, isUltraSaver && adaptiveControls);
  }, [theme, adaptiveControls, effectiveBatteryLevel, uiMode, isUltraSaver]);

  // Heartbeat to keep active user status "Online" in Firestore
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') return;

    dbUpdateUser({
      ...currentUser,
      isOnline: true,
      lastActive: Date.now()
    } as any).catch(console.error);

    const interval = setInterval(() => {
      dbUpdateUser({
        ...currentUser,
        isOnline: true,
        lastActive: Date.now()
      } as any).catch(console.error);
    }, 20000);

    const handleUnload = () => {
      dbUpdateUser({
        ...currentUser,
        isOnline: false,
        lastActive: Date.now()
      } as any).catch(console.error);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [currentUser?.id]);

  const isUserOnline = (mem: User): boolean => {
    if (mem.id === currentUser?.id) return true;
    const isOnlineField = (mem as any).isOnline === true;
    const lastActiveTime = (mem as any).lastActive || 0;
    const isRecent = (Date.now() - lastActiveTime) < 45000;
    return isOnlineField && isRecent;
  };

  // App core persistent states
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
  
  // Global float-sheet search state
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Lazy loading state for community list
  const [visibleUsersLimit, setVisibleUsersLimit] = useState(6);

  // Unread badge counters (real-time synced with active timestamps)
  const unreadChatsCount = currentUser && currentUser.id !== 'guest'
    ? messages.filter(m => m.sender.id !== currentUser.id && m.timestamp > (currentUser.lastReadChatTimestamp || 0)).length
    : 0;

  const unreadNotificationsCount = currentUser
    ? notifications.filter(n => !n.read && n.type !== 'message' && n.type !== 'chat' && n.type !== 'conversa' && n.type !== 'chat_request' && n.type !== 'chat_accepted').length
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
      // Exclude notifications triggered by the user themselves
      const filtered = loadedNotifs.filter(n => n.sender.id !== currentUser.id);
      setNotifications(filtered);
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

    // 1. Create personal Welcome Notification for the new user (the owner)
    const welcomeNotif: Notification = {
      id: 'notif_welcome_' + Math.random().toString(36).substring(2, 9),
      recipientId: newUser.id,
      title: 'Boas-vindas ao Eyes Open MZ! 🎉🇲🇿',
      text: `Olá ${newUser.firstname}! Registou-se com sucesso. Clique aqui para ler o Guia de Introdução e saber como a nossa comunidade funciona!`,
      type: 'system',
      sender: {
        id: 'system',
        name: 'Equipa Open MZ',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
      },
      read: false,
      targetId: 'welcome_guide',
      targetView: 'notificacoes',
      timestamp: Date.now()
    };
    await dbCreateNotification(welcomeNotif).catch(console.error);

    // 2. Create friendship suggestion notification for all other community users individually
    const otherUsers = users.filter(u => u.id !== newUser.id && u.id !== 'guest');
    for (const u of otherUsers) {
      const suggestionNotif: Notification = {
        id: 'notif_reg_' + u.id + '_' + Math.random().toString(36).substring(2, 9),
        recipientId: u.id,
        title: 'Sugestão de Vínculo 🤝👁️',
        text: `${newUser.fullname} (@${newUser.nickname}) acabou de criar uma conta, quer interagir com ele? Solicite-o!`,
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
      await dbCreateNotification(suggestionNotif).catch(console.error);
    }

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

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    
    // Find the comment
    const comment = p.comments?.find(c => c.id === commentId);
    if (!comment) return;

    // Check if current user is comment author OR post author
    if (comment.author.id !== currentUser.id && p.author.id !== currentUser.id) {
      alert('Não tem permissão para eliminar este comentário.');
      return;
    }

    const updated: Post = {
      ...p,
      comments: p.comments?.filter(c => c.id !== commentId) || []
    };
    await dbUpdatePost(updated);
    triggerToast('Comentário removido com sucesso!');
  };

  const handleReactComment = async (postId: string, commentId: string, reaction: 'star' | 'broken_star') => {
    if (!currentUser || currentUser.id === 'guest') return;
    const p = posts.find(x => x.id === postId);
    if (!p) return;

    const updatedComments = p.comments?.map(c => {
      if (c.id === commentId) {
        const commentWithStars = c as any;
        const currentStars = commentWithStars.starsCount || 0;
        const currentBrokenStars = commentWithStars.brokenStarsCount || 0;

        const reactions = commentWithStars.reactions || {};
        const previousReaction = reactions[currentUser.id];

        let nextStars = currentStars;
        let nextBrokenStars = currentBrokenStars;

        if (previousReaction === reaction) {
          // Toggle off
          if (reaction === 'star') nextStars = Math.max(0, currentStars - 1);
          else nextBrokenStars = Math.max(0, currentBrokenStars - 1);
          delete reactions[currentUser.id];
        } else {
          // Change reaction
          if (previousReaction === 'star') nextStars = Math.max(0, currentStars - 1);
          else if (previousReaction === 'broken_star') nextBrokenStars = Math.max(0, currentBrokenStars - 1);

          if (reaction === 'star') nextStars += 1;
          else if (reaction === 'broken_star') nextBrokenStars += 1;

          reactions[currentUser.id] = reaction;
        }

        return {
          ...c,
          starsCount: nextStars,
          brokenStarsCount: nextBrokenStars,
          reactions: reactions
        } as any;
      }
      return c;
    }) || [];

    const updated: Post = {
      ...p,
      comments: updatedComments
    };
    await dbUpdatePost(updated);
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
    if (currentUser?.id === 'guest' && view !== 'feed' && (view as string) !== 'register') {
      alert('Como convidado, precisa de uma conta para aceder a esta funcionalidade. Vamos direcioná-lo para criar uma conta!');
      handleRedirectToRegister();
      return;
    }
    setActiveView(view);
  };

  const handleNavigateToTarget = (view: ViewType, targetId?: string) => {
    if (targetId) {
      if (view === 'comunidade' || view === 'profile') {
        const foundUser = users.find(u => u.id === targetId);
        if (foundUser) {
          setSelectedCommunityUser(foundUser);
        }
      } else {
        setAutoOpenPostId(targetId);
      }
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
            onDeleteComment={handleDeleteComment}
            onReactComment={handleReactComment}
            autoOpenPostId={autoOpenPostId}
            onClearAutoOpenPost={() => setAutoOpenPostId(undefined)}
            currentThemeConfig={currentThemeConfig}
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

      case 'comunidade':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-[var(--theme-text-main)]">
            
            {/* Sticky Header for Logged-In User (Proprietário) */}
            <div className="sticky top-0 z-10 bg-[var(--theme-bg-main)]/95 backdrop-blur-md border border-[var(--theme-border)] p-5 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span className="text-[10px] font-orbitron font-extrabold tracking-widest text-[var(--theme-accent)] uppercase">
                    PROPRIETÁRIO DA CONTA (CONECTADO)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] text-[9px] font-bold uppercase tracking-wider">
                  Tu
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatar 
                    src={currentUser?.avatar || "https://i.pravatar.cc/80?img=1"} 
                    status={true} 
                    nickname={currentUser?.nickname}
                    className="w-12 h-12"
                  />
                  <div className="min-w-0 text-left">
                    <h3 className="text-sm font-extrabold text-[var(--theme-text-main)] truncate leading-tight">
                      {currentUser?.fullname}
                    </h3>
                    <p className="text-xs text-[var(--theme-text-muted)] font-bold truncate mt-0.5">
                      @{currentUser?.nickname} • {currentUser?.province}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigateToView('account')}
                  className="px-3.5 py-2 bg-[var(--theme-accent)]/15 hover:bg-[var(--theme-accent)] hover:text-black text-[var(--theme-accent)] text-[9px] font-bold font-orbitron tracking-widest rounded-xl transition-all cursor-pointer uppercase shrink-0 border border-[var(--theme-accent)]/30"
                >
                  Editar Perfil
                </button>
              </div>
            </div>

            <h2 className="font-orbitron font-extrabold text-sm text-[var(--theme-accent)] tracking-widest uppercase border-b border-[var(--theme-border)] pb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--theme-accent)]" /> MEMBROS DA COMUNIDADE ({users.length - 1})
            </h2>

            {/* Dynamic Grid Layout governed by style configuration & ultra saver */}
            <div className={`grid gap-4 ${
              (isUltraSaver && adaptiveControls) || currentThemeConfig.gridCols === '1-col'
                ? 'grid-cols-1'
                : currentThemeConfig.gridCols === '3-col'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {(() => {
                // Filter out the logged-in user and sort remaining members by creation date descending
                const otherUsersSorted = [...users]
                  .filter(u => u.id !== currentUser?.id)
                  .sort((a, b) => {
                    const timeA = a.created ? new Date(a.created).getTime() : 0;
                    const timeB = b.created ? new Date(b.created).getTime() : 0;
                    return timeB - timeA;
                  });

                // Apply lazy loading slice
                const visibleUsers = otherUsersSorted.slice(0, visibleUsersLimit);

                if (visibleUsers.length === 0) {
                  return (
                    <div className="col-span-full py-12 text-center text-[var(--theme-text-muted)] space-y-2">
                      <Users className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-xs font-bold uppercase tracking-wider">Nenhum outro membro encontrado</p>
                    </div>
                  );
                }

                return (
                  <>
                    {visibleUsers.map((mem) => {
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
                      const onlineStatus = isUserOnline(mem);

                      return (
                        <div 
                          key={mem.id} 
                          onClick={() => setSelectedCommunityUser(mem)}
                          className={`p-4 rounded-3xl bg-[var(--theme-bg-card)] border flex flex-col justify-between gap-4 shadow-lg select-none cursor-pointer hover:border-[var(--theme-accent)] transition-all ${
                            isSameProvince 
                              ? 'border-[var(--theme-accent)]/40 shadow-[var(--theme-accent)]/5' 
                              : 'border-[var(--theme-border)]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar 
                              src={mem.avatar || "https://i.pravatar.cc/80?img=1"} 
                              status={onlineStatus} 
                              nickname={mem.nickname}
                              className="w-10 h-10"
                            />
                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-[var(--theme-text-main)] truncate leading-tight">{mem.nickname}</p>
                                {isSameProvince && (
                                  <span className="px-1.5 py-0.5 rounded bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/40 text-[var(--theme-accent)] text-[8px] font-bold uppercase tracking-wider">
                                    Recomendado
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-[var(--theme-text-muted)] truncate mt-0.5 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" /> 
                                <span>{mem.province}{mem.district ? ` • ${mem.district}` : ''}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-3 mt-1">
                            <span className="text-[8px] font-bold font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">
                              Registo: {mem.created ? new Date(mem.created).toLocaleDateString('pt-MZ') : 'Antigo'}
                            </span>
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
                                    id: 'notif_friend_' + Math.random().toString(36).substring(2, 9),
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
                              className="px-2.5 py-1.5 bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)] border border-[var(--theme-accent)]/25 hover:text-black text-[var(--theme-accent)] text-[8px] font-bold font-orbitron tracking-widest rounded-xl transition-all cursor-pointer uppercase shrink-0"
                            >
                              {isAccepted ? 'Vinculado' : isPending ? 'Pendente' : 'Vincular'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

                {/* Lazy loading "CARREGAR MAIS MEMBROS" Trigger */}
                {users.filter(u => u.id !== currentUser?.id).length > visibleUsersLimit && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setVisibleUsersLimit(prev => prev + 6)}
                      className="px-6 py-2.5 bg-[var(--theme-accent)]/15 hover:bg-[var(--theme-accent)] border border-[var(--theme-accent)]/30 hover:text-black text-[var(--theme-accent)] font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all cursor-pointer uppercase shadow-lg flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--theme-accent)] hover:text-black shrink-0" />
                      Carregar mais membros
                    </button>
                  </div>
                )}
              </div>
            );

      // PREFERENCES CONFIGURATION VIEW
      case 'config':
        return (
          <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 select-none font-rajdhani text-[var(--theme-text-main)]">
            <h2 className="font-orbitron font-extrabold text-sm text-[var(--theme-accent)] tracking-widest uppercase border-b border-[var(--theme-border)] pb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--theme-accent)]" /> CONFIGURAÇÕES DO MOTOR DE ESTILO (THEMING)
            </h2>
            
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 shadow-2xl space-y-6 text-left">
              
              {/* Theme Selector (9 MODOS) */}
              <div>
                <h4 className="text-xs font-orbitron font-extrabold uppercase tracking-wider text-[var(--theme-text-main)] mb-3">
                  SELEÇÃO MANUAL DE TEMA (9 MODOS DISPONÍVEIS)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'noite', name: 'Noite', color: '#3b82f6', desc: 'Escuro clássico' },
                    { id: 'luz', name: 'Luz', color: '#2563eb', desc: 'Claro clássico' },
                    { id: 'lite', name: 'Lite', color: '#4f46e5', desc: 'Simples indigo' },
                    { id: 'esmeralda', name: 'Esmeralda', color: '#10b981', desc: 'Verde profundo' },
                    { id: 'vinho', name: 'Vinho', color: '#db2777', desc: 'Rosa romântico' },
                    { id: 'ciano', name: 'Ciano', color: '#06b6d4', desc: 'Azul refrescante' },
                    { id: 'crepusculo', name: 'Crepúsculo', color: '#8b5cf6', desc: 'Roxo sideral' },
                    { id: 'neon-cyber', name: 'Cyberpunk', color: '#00ffcc', desc: 'Neon de alta energia' },
                    { id: 'glass-minimalist', name: 'Glass', color: '#ffffff', desc: 'Vidro contemporâneo' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer border flex flex-col items-center gap-1.5 ${
                        theme === t.id
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 shadow-[var(--theme-accent)]/5'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)]/40 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)] hover:bg-[var(--theme-bg-card)]/70'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-[var(--theme-border)] flex items-center justify-center" style={{ backgroundColor: theme === t.id ? t.color : '#222' }}>
                        {theme === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-[10px] font-bold tracking-wider">{t.name}</span>
                      <span className="text-[8px] opacity-70 text-center leading-tight">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Adaptive UI Sensors Section */}
              <div className="border-t border-[var(--theme-border)] pt-5 space-y-4">
                <h4 className="text-xs font-orbitron font-extrabold uppercase tracking-wider text-[var(--theme-text-main)]">
                  SENSORES E CONTROLO INTELIGENTE ADAPTATIVO
                </h4>
                
                {/* Adaptive Toggle */}
                <div className="flex items-center justify-between bg-[var(--theme-bg-card)]/30 border border-[var(--theme-border)]/50 p-4 rounded-2xl">
                  <div>
                    <h5 className="text-xs font-bold text-[var(--theme-text-main)]">Ativar Controlo Inteligente (Sensores)</h5>
                    <p className="text-[9px] text-[var(--theme-text-muted)] mt-0.5 leading-relaxed">
                      Alterna o tema automaticamente por Horário (Dia/Noite) e ativa Economia de Bateria (&lt;20%).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={adaptiveControls} 
                      onChange={(e) => {
                        setAdaptiveControls(e.target.checked);
                        triggerToast(e.target.checked ? 'Sensores inteligentes ativos!' : 'Controlo manual ativado!');
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-neutral-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--theme-accent)]/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--theme-accent)]"></div>
                  </label>
                </div>

                {/* UI Performance Switch */}
                <div className="flex items-center justify-between bg-[var(--theme-bg-card)]/30 border border-[var(--theme-border)]/50 p-4 rounded-2xl">
                  <div>
                    <h5 className="text-xs font-bold text-[var(--theme-text-main)]">Modo de Desempenho</h5>
                    <p className="text-[9px] text-[var(--theme-text-muted)] mt-0.5 leading-relaxed">
                      <b>Imersivo</b>: Transições fluidas e efeitos de glow. <b>Desempenho</b>: Máxima velocidade e sem animações.
                    </p>
                  </div>
                  <div className="flex gap-1.5 p-0.5 bg-neutral-900 border border-[var(--theme-border)] rounded-xl">
                    <button
                      onClick={() => {
                        setUiMode('performance');
                        triggerToast('Modo Desempenho ativado.');
                      }}
                      className={`px-3 py-1 text-[9px] font-extrabold font-orbitron tracking-widest uppercase rounded-lg transition-all ${
                        uiMode === 'performance' ? 'bg-[var(--theme-accent)] text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Fast
                    </button>
                    <button
                      onClick={() => {
                        setUiMode('immersive');
                        triggerToast('Modo Imersivo ativado.');
                      }}
                      className={`px-3 py-1 text-[9px] font-extrabold font-orbitron tracking-widest uppercase rounded-lg transition-all ${
                        uiMode === 'immersive' ? 'bg-[var(--theme-accent)] text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Immersive
                    </button>
                  </div>
                </div>

                {/* Battery Simulator */}
                <div className="bg-[var(--theme-bg-card)]/30 border border-[var(--theme-border)]/50 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--theme-text-main)]">Simulador de Bateria</h5>
                      <p className="text-[9px] text-[var(--theme-text-muted)] mt-0.5">
                        Defina abaixo de 20% para forçar instantaneamente o modo amoled ultra-económico!
                      </p>
                    </div>
                    <span className="text-xs font-extrabold font-orbitron text-[var(--theme-accent)]">
                      {effectiveBatteryLevel}% {isUltraSaver && '🔋 [ECONOMIA]'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={simulatedBattery}
                    onChange={(e) => setSimulatedBattery(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[var(--theme-accent)]"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-[var(--theme-text-muted)]">
                    <span>Mínimo: 5%</span>
                    <span>Dispositivo Físico: {actualBattery !== null ? `${actualBattery}%` : 'Não suportado'}</span>
                    <span>Máximo: 100%</span>
                  </div>
                </div>
              </div>

              {/* Theme Configuration Inspector */}
              <div className="border-t border-[var(--theme-border)] pt-5">
                <h4 className="text-xs font-orbitron font-extrabold uppercase tracking-wider text-[var(--theme-text-main)] mb-3">
                  INSPEÇÃO DE PROPRIEDADES JSON DO TEMA ATIVO
                </h4>
                <div className="p-4 bg-neutral-950/80 border border-[var(--theme-border)] rounded-2xl font-mono text-[9px] text-[var(--theme-text-muted)] space-y-1 overflow-x-auto select-text leading-relaxed">
                  <p className="text-yellow-400 font-bold">// Configurações dinâmicas injetadas pelo motor:</p>
                  <p>ID: <span className="text-white">"{currentThemeConfig.id}"</span></p>
                  <p>Membros Grid: <span className="text-white">"{currentThemeConfig.gridCols === '1-col' ? '1 Coluna (Lista)' : currentThemeConfig.gridCols === '3-col' ? '3 Colunas (Grelha Estendida)' : '2 Colunas (Grelha)'}"</span></p>
                  <p>Modo de Energia: <span className={isUltraSaver ? 'text-red-400 font-bold' : 'text-green-400'}>{isUltraSaver ? '"Amoled Black (Mínimo)"' : '"Padrão"'}_</span></p>
                  <p>Variáveis de Cor: &#123;</p>
                  <p className="pl-4">--theme-bg-main: <span className="text-cyan-400">"{isUltraSaver ? '#000000' : currentThemeConfig.bgMain}"</span></p>
                  <p className="pl-4">--theme-bg-card: <span className="text-cyan-400">"{isUltraSaver ? '#080808' : currentThemeConfig.bgCard}"</span></p>
                  <p className="pl-4">--theme-accent: <span className="text-cyan-400">"{currentThemeConfig.accent}"</span></p>
                  <p className="pl-4">--theme-border: <span className="text-cyan-400">"{currentThemeConfig.border}"</span></p>
                  <p>&#125;</p>
                </div>
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
    <div className={`min-h-screen bg-[var(--theme-bg-main)] text-[var(--theme-text-main)] flex theme-${theme} transition-colors duration-500`}>
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
              <div onClick={() => navigateToView('profile')}>
                <UserAvatar 
                  src={currentUser.avatar || "https://i.pravatar.cc/80?img=1"} 
                  status={true} 
                  nickname={currentUser.nickname}
                  className="w-8 h-8 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                />
              </div>
            </header>

            {/* Active View viewport */}
            <main className="flex-grow flex flex-col overflow-y-auto no-scrollbar bg-[var(--theme-bg-main)] relative transition-colors duration-500">
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

      {currentUser && (
        <FloatingSearch
          currentUser={currentUser}
          users={users}
          onSelectUser={(selectedUser) => setSelectedCommunityUser(selectedUser)}
          isOpen={isGlobalSearchOpen}
          onOpen={() => setIsGlobalSearchOpen(true)}
          onClose={() => setIsGlobalSearchOpen(false)}
        />
      )}
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

