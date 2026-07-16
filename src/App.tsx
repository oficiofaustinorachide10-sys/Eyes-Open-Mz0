/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, Eye, Newspaper, Video, Calendar, Store, Users, Settings, 
  Sparkles, CheckCircle2, ChevronRight, Bookmark, MapPin, Camera, X, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Post, Story, Comment, Notification, Friendship, ChatPermission } from './types';
import { SEED_USERS, SEED_POSTS, SEED_STORIES, simpleHash } from './utils';

// Import our modular subcomponents
import LoginView from './components/LoginView';
import AccountSelectorView, { SavedAccount } from './components/AccountSelectorView';
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
import { playClickFeedback, playCommentSound, playPublishPostSound, playStarSound, playNotificationSound } from './utils/audioSystem';

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
  dbDeleteNotification,
  subscribeFriendships,
  dbCreateFriendship,
  dbDeleteFriendship,
  dbUpdateFriendship,
  subscribeChatPermissions,
  dbCreateChatPermission,
  dbUpdateChatPermission,
  dbDeleteChatPermission
} from './lib/db';

export default function App() {
  // App core persistent states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Saved device sessions / accounts selector states
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('eo_saved_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [showAccountSelector, setShowAccountSelector] = useState<boolean>(true);

  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Extended theme state: support all themes, persisting the values properly
  const [theme, setThemeState] = useState<'lite' | 'noite' | 'luz' | 'esmeralda' | 'vinho' | 'ciano' | 'crepusculo' | 'neon-cyber' | 'glass-minimalist' | 'eyes-max'>(() => {
    let userId = '';
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        userId = JSON.parse(stored).id;
      }
    } catch (e) {}
    if (userId && userId !== 'guest') {
      const savedUserTheme = localStorage.getItem(`theme_user_${userId}`);
      if (savedUserTheme && THEME_CONFIGS[savedUserTheme as any]) {
        return savedUserTheme as any;
      }
    }
    const saved = localStorage.getItem('theme') as any;
    return (saved && THEME_CONFIGS[saved]) ? saved : 'noite';
  });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.id === 'guest') {
        setThemeState('noite');
      } else {
        const savedUserTheme = localStorage.getItem(`theme_user_${currentUser.id}`);
        if (savedUserTheme && THEME_CONFIGS[savedUserTheme as any]) {
          setThemeState(savedUserTheme as any);
        } else {
          setThemeState('noite');
        }
      }
    } else {
      setThemeState('noite');
    }
  }, [currentUser]);

  // Eyes Max Special Theme & Virtual Assistant "Pay" states
  const [eyesMaxDownloaded, setEyesMaxDownloaded] = useState<boolean>(() => {
    return localStorage.getItem('eyesMaxDownloaded') === 'true';
  });
  const [showEyesMaxDownloadModal, setShowEyesMaxDownloadModal] = useState<boolean>(false);
  const [isDownloadingEyesMax, setIsDownloadingEyesMax] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const [isApplyingEyesMax, setIsApplyingEyesMax] = useState<boolean>(false);
  const [applyProgress, setApplyProgress] = useState<number>(0);
  const [showEyesMaxWelcome, setShowEyesMaxWelcome] = useState<boolean>(false);

  const [showPayAssistant, setShowPayAssistant] = useState<boolean>(false);
  const [assistantMessages, setAssistantMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Olá! Sou o Pay, o assistente virtual oficial do site "Eyes Open MZ", criado e treinado pelo meu mentor, Ofício Faustino Rachide. Seja muito bem-vindo ao luxuoso ecossistema do tema EYES MAX! Como posso ajudar-te hoje? podes perguntar-me sobre o site, o tema EYES MAX ou qualquer outra dúvida!' }
  ]);
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);

  const playPaySignatureSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, type: 'triangle' | 'sine' = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      // Luxurious golden chime arpeggio: C5 -> E5 -> G5 -> C6
      playTone(523.25, now, 1.2, 'triangle');
      playTone(659.25, now + 0.12, 1.0, 'sine');
      playTone(783.99, now + 0.24, 0.8, 'sine');
      playTone(1046.50, now + 0.36, 1.5, 'sine');
    } catch (e) {
      console.warn('Audio signature failed to play:', e);
    }
  };

  const triggerDownloadEyesMax = () => {
    setIsDownloadingEyesMax(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloadingEyesMax(false);
            setEyesMaxDownloaded(true);
            localStorage.setItem('eyesMaxDownloaded', 'true');
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
  };

  const triggerApplyEyesMaxFlow = () => {
    setIsApplyingEyesMax(true);
    setApplyProgress(0);
    const interval = setInterval(() => {
      setApplyProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsApplyingEyesMax(false);
            setThemeState('eyes-max');
            localStorage.setItem('theme', 'eyes-max');
            if (currentUser && currentUser.id !== 'guest') {
              localStorage.setItem(`theme_user_${currentUser.id}`, 'eyes-max');
            }
            setAdaptiveControls(false);
            // Play brand sound signature
            playPaySignatureSound();
            // Automatically launch "Pay" assistant
            setShowPayAssistant(true);
            setShowEyesMaxWelcome(true);
          }, 600);
          return 100;
        }
        return prev + Math.floor(Math.random() * 10) + 4;
      });
    }, 120);
  };

  const handleSendAssistantMessage = async () => {
    if (!assistantInput.trim()) return;
    const userMsg = assistantInput;
    setAssistantInput('');
    setAssistantMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAssistantTyping(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: assistantMessages
        })
      });
      const data = await response.json();
      if (data.reply) {
        setAssistantMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setAssistantMessages(prev => [...prev, { role: 'assistant', content: 'Lamento, ocorreu um erro ao comunicar com os meus sistemas. Por favor tenta novamente.' }]);
      }
    } catch (err) {
      console.error('Chat Assistant error:', err);
      setAssistantMessages(prev => [...prev, { role: 'assistant', content: 'Peço desculpas, não foi possível estabelecer ligação ao servidor. Por favor tenta novamente.' }]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  const setTheme = (newTheme: 'lite' | 'noite' | 'luz' | 'esmeralda' | 'vinho' | 'ciano' | 'crepusculo' | 'neon-cyber' | 'glass-minimalist' | 'eyes-max') => {
    if (newTheme === 'eyes-max') {
      if (!eyesMaxDownloaded) {
        setShowEyesMaxDownloadModal(true);
        return;
      } else {
        triggerApplyEyesMaxFlow();
        return;
      }
    }
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    if (currentUser && currentUser.id !== 'guest') {
      localStorage.setItem(`theme_user_${currentUser.id}`, newTheme);
    }
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

  const [interfaceSounds, setInterfaceSounds] = useState<boolean>(() => {
    return localStorage.getItem('eo_interface_sounds_enabled') !== 'false';
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

  useEffect(() => {
    localStorage.setItem('eo_interface_sounds_enabled', String(interfaceSounds));
  }, [interfaceSounds]);

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
      const latestUser = currentUserRef.current;
      if (latestUser && latestUser.id !== 'guest') {
        dbUpdateUser({
          ...latestUser,
          isOnline: true,
          lastActive: Date.now()
        } as any).catch(console.error);
      }
    }, 20000);

    const handleUnload = () => {
      const latestUser = currentUserRef.current;
      if (latestUser && latestUser.id !== 'guest') {
        dbUpdateUser({
          ...latestUser,
          isOnline: false,
          lastActive: Date.now()
        } as any).catch(console.error);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      // Only set offline if they actually changed ID or logged out
      const latestUser = currentUserRef.current;
      if (!latestUser || latestUser.id !== currentUser.id) {
        dbUpdateUser({
          ...currentUser,
          isOnline: false,
          lastActive: Date.now()
        } as any).catch(console.error);
      }
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
  const [chatPermissions, setChatPermissions] = useState<ChatPermission[]>([]);
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

  const resolvedPosts = useMemo(() => {
    return posts.map(post => {
      const authorUser = users.find(u => u.id === post.author.id);
      const resolvedComments = (post.comments || []).map(comment => {
        const commentAuthor = users.find(u => u.id === comment.author.id);
        return {
          ...comment,
          author: {
            id: comment.author.id,
            name: commentAuthor ? commentAuthor.fullname : comment.author.name,
            avatar: commentAuthor ? commentAuthor.avatar : comment.author.avatar,
            nickname: commentAuthor ? commentAuthor.nickname : (comment.author as any).nickname,
          }
        };
      });
      return {
        ...post,
        author: {
          id: post.author.id,
          name: authorUser ? authorUser.fullname : post.author.name,
          avatar: authorUser ? authorUser.avatar : post.author.avatar,
          nickname: authorUser ? authorUser.nickname : (post.author as any).nickname,
        },
        comments: resolvedComments
      };
    });
  }, [posts, users]);

  const resolvedStories = useMemo(() => {
    return stories.map(story => {
      const authorUser = users.find(u => u.id === story.author.id);
      return {
        ...story,
        author: {
          id: story.author.id,
          name: authorUser ? authorUser.fullname : story.author.name,
          avatar: authorUser ? authorUser.avatar : story.author.avatar,
          nickname: authorUser ? authorUser.nickname : (story.author as any).nickname,
        }
      };
    });
  }, [stories, users]);

  // Keep selectedCommunityUser synced with loaded users to prevent stale data when updated
  useEffect(() => {
    if (selectedCommunityUser) {
      const latest = users.find(u => u.id === selectedCommunityUser.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedCommunityUser)) {
        setSelectedCommunityUser(latest);
      }
    }
  }, [users, selectedCommunityUser]);

  // 1. Initial State Loading and Seeding with real-time Firestore Subscriptions
  useEffect(() => {
    // 1. First trigger seeding of the database if collections are completely blank
    seedDatabaseIfEmpty();

    // 2. Load cached current user session (including JWT validation against server)
    const token = localStorage.getItem('eo_jwt_token');
    if (token) {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        } else {
          // Clears stale local sessions if backend verification fails
          localStorage.removeItem('eo_jwt_token');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      })
      .catch(() => {
        // Fallback to local cache if server is offline during load
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {}
        }
      });
    } else {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {}
      }
    }

    // 3. Subscribe to real-time Users
    const unsubUsers = subscribeUsers((loadedUsers) => {
      setUsers(loadedUsers);
      
      // Keep active user session in sync with database profile modifications
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const masterUser = loadedUsers.find(u => u.id === parsed.id);
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

    // 8. Subscribe to real-time chat permissions
    const unsubChatPerms = subscribeChatPermissions((loadedChatPerms) => {
      setChatPermissions(loadedChatPerms);
    });

    return () => {
      unsubUsers();
      unsubPosts();
      unsubStories();
      unsubChats();
      unsubFriendships();
      unsubChatPerms();
    };
  }, []);

  // Listen to active notifications for current user
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    let isFirstRun = true;
    const unsubNotifs = subscribeNotifications(currentUser.id, (loadedNotifs) => {
      // Exclude notifications triggered by the user themselves
      const filtered = loadedNotifs.filter(n => n.sender.id !== currentUser.id);
      
      // Play notification sound on new unread notification (not on initial snapshot)
      if (!isFirstRun && filtered.some(n => !n.read)) {
        const unreadNew = filtered.filter(n => !n.read);
        const hasRecentUnread = unreadNew.some(n => (Date.now() - n.timestamp) < 10000);
        if (hasRecentUnread) {
          playNotificationSound();
        }
      }
      isFirstRun = false;
      setNotifications(filtered);
    });
    return () => unsubNotifs();
  }, [currentUser?.id]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // 2. Authentication handlers
  // Symmetric lightweight encryption helper for local credentials using security PIN
  const encryptToken = (token: string, pin: string): string => {
    let result = '';
    const key = pin + '_eyesopen_mz_secure_key';
    for (let i = 0; i < token.length; i++) {
      const charCode = token.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(result)));
  };

  const decryptToken = (encrypted: string, pin: string): string => {
    try {
      const decoded = decodeURIComponent(escape(atob(encrypted)));
      let result = '';
      const key = pin + '_eyesopen_mz_secure_key';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (e) {
      return '';
    }
  };

  const handleSelectSavedAccount = async (
    accountId: string, 
    method: 'pin' | 'password', 
    credential: string
  ): Promise<{ success: boolean; error?: string }> => {
    const acc = savedAccounts.find(a => a.id === accountId);
    if (!acc) return { success: false, error: 'Conta não encontrada.' };

    if (method === 'password') {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: acc.email, password: credential })
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || 'Palavra-passe incorreta.' };
        }
        handleLoginSuccess(data.user, data.token, true);
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Erro de ligação ao servidor de autenticação.' };
      }
    } else {
      const pinHash = localStorage.getItem(`eo_pin_hash_${accountId}`);
      if (!pinHash) return { success: false, error: 'PIN não configurado para esta conta.' };

      if (simpleHash(credential) !== pinHash) {
        return { success: false, error: 'PIN incorreto.' };
      }

      const encryptedToken = acc.encryptedToken || localStorage.getItem(`eo_enc_token_${accountId}`);
      if (encryptedToken) {
        const decryptedToken = decryptToken(encryptedToken, credential);
        if (decryptedToken) {
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${decryptedToken}`
              }
            });
            const data = await response.json();
            if (response.ok && data.user) {
              handleLoginSuccess(data.user, decryptedToken, true);
              return { success: true };
            } else {
              return { success: false, error: 'A sua sessão expirou no servidor. Por favor, utilize Palavra-passe.' };
            }
          } catch (err) {
            // Offline fallback
            const masterUser = users.find(u => u.id === accountId);
            if (masterUser) {
              handleLoginSuccess(masterUser, decryptedToken, true);
              return { success: true };
            }
            return { success: false, error: 'Servidor offline e sem cache local.' };
          }
        }
      }
      return { success: false, error: 'Sessão cifrada local expirou ou está corrompida. Use Palavra-passe.' };
    }
  };

  const handleRemoveSavedAccount = (accountId: string) => {
    const updated = savedAccounts.filter(acc => acc.id !== accountId);
    localStorage.setItem('eo_saved_accounts', JSON.stringify(updated));
    setSavedAccounts(updated);
    
    // Also clear keys/PIN hashes for this user
    localStorage.removeItem(`eo_pin_hash_${accountId}`);
    localStorage.removeItem(`eo_enc_token_${accountId}`);
    triggerToast('Conta removida deste dispositivo com sucesso.');
  };

  const handleRegisterSavedPin = async (accountId: string, pin: string) => {
    const hash = simpleHash(pin);
    localStorage.setItem(`eo_pin_hash_${accountId}`, hash);

    const token = localStorage.getItem('eo_jwt_token');
    if (token) {
      const encrypted = encryptToken(token, pin);
      localStorage.setItem(`eo_enc_token_${accountId}`, encrypted);

      const updated = savedAccounts.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, hasPin: true, encryptedToken: encrypted };
        }
        return acc;
      });
      localStorage.setItem('eo_saved_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    }
  };

  const handleLoginSuccess = (user: User, token: string, rememberMe?: boolean) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('eo_jwt_token', token);
    
    // Save account to local device-saved accounts lists (always saved to enable fast switching/saved accounts on device)
    const savedListRaw = localStorage.getItem('eo_saved_accounts');
    let savedList: SavedAccount[] = [];
    if (savedListRaw) {
      try { savedList = JSON.parse(savedListRaw); } catch(e){}
    }
    savedList = savedList.filter(acc => acc.id !== user.id);
    const hasPin = localStorage.getItem(`eo_pin_hash_${user.id}`) !== null;
    savedList.unshift({
      id: user.id,
      nickname: user.nickname,
      fullname: user.fullname || user.nickname,
      avatar: user.avatar || "https://i.pravatar.cc/100?img=1",
      email: user.email,
      hasPin
    });
    localStorage.setItem('eo_saved_accounts', JSON.stringify(savedList));
    setSavedAccounts(savedList);

    if (rememberMe) {
      try {
        const raw = JSON.stringify(user);
        const b64 = btoa(encodeURIComponent(raw));
        localStorage.setItem('eo_secure_keychain_token', `EO_KEYCHAIN_SECURE_${b64}`);
      } catch (e) {}
    } else {
      localStorage.removeItem('eo_secure_keychain_token');
    }
    setActiveView('feed');
    triggerToast(`Sessão iniciada! Bem-vindo, ${user.nickname}`);
  };

  const handleRegisterSuccess = async (newUser: User, token: string) => {
    // Save JWT token
    localStorage.setItem('eo_jwt_token', token);

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
        title: 'Sugestão de Vínculo 🤝',
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
    setThemeState('noite');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('eo_jwt_token');
    localStorage.removeItem('eo_secure_keychain_token');
    setShowAccountSelector(true);
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

    const starredBy = p.starredBy ? { ...p.starredBy } : {};
    const hasStarred = !!starredBy[currentUser.id];
    const nextStarred = !hasStarred;
    starredBy[currentUser.id] = nextStarred;

    const nextStars = Object.values(starredBy).filter(Boolean).length;

    const updated: Post = {
      ...p,
      starredBy,
      starred: nextStarred,
      stars: nextStars
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

    if (currentUser) {
      const viewedBy = p.viewedBy ? { ...p.viewedBy } : {};
      if (viewedBy[currentUser.id]) {
        sessionStorage.setItem(sessionKey, 'true');
        return;
      }
      viewedBy[currentUser.id] = true;
      const updated: Post = {
        ...p,
        viewedBy,
        views: (p.views || 0) + 1
      };
      await dbUpdatePost(updated);
      sessionStorage.setItem(sessionKey, 'true');
    } else {
      const updated: Post = {
        ...p,
        views: (p.views || 0) + 1
      };
      await dbUpdatePost(updated);
      sessionStorage.setItem(sessionKey, 'true');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Tem a certeza que deseja eliminar esta publicação permanentemente?')) {
      await dbDeletePost(postId);
      triggerToast('Publicação removida com sucesso!');
    }
  };

  const handleConnectUser = async (targetUserId: string, level: 'amigo' | 'familia' | 'conhecido' = 'amigo') => {
    if (!currentUser) return;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const pending = friendships.some(f => 
      f.status === 'pending' && 
      ((f.senderId === currentUser.id && f.receiverId === targetUserId) || 
       (f.senderId === targetUserId && f.receiverId === currentUser.id))
    );
    
    if (pending) {
      triggerToast(`Já existe um pedido de vínculo pendente com ${targetUser.nickname}`);
      return;
    }

    const newFriendship = {
      id: 'friend_' + Math.random().toString(36).substring(2, 9),
      senderId: currentUser.id,
      receiverId: targetUserId,
      status: 'pending' as const,
      level: level,
      timestamp: Date.now()
    };
    await dbCreateFriendship(newFriendship);
    
    // Send a real-time notification
    const newNotif = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipientId: targetUserId,
      title: 'Novo pedido de vínculo',
      text: `@${currentUser.nickname} quer vincular-se contigo como ${level === 'amigo' ? 'Amigo' : level === 'familia' ? 'Família' : 'Conhecido'}!`,
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
    await dbCreateNotification(newNotif);
    triggerToast(`Pedido de vínculo enviado para ${targetUser.nickname}`);
  };

  const handleAcceptFriendship = async (friendshipId: string, notifId: string) => {
    if (!currentUser) return;
    const f = friendships.find(item => item.id === friendshipId);
    if (f) {
      const updatedFriendship = {
        ...f,
        status: 'accepted' as const
      };
      await dbUpdateFriendship(updatedFriendship);
      
      const recipientId = f.senderId === currentUser.id ? f.receiverId : f.senderId;
      const newNotif = {
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        recipientId,
        title: 'Vínculo Aceite',
        text: `@${currentUser.nickname} aceitou o teu pedido de vínculo!`,
        type: 'friend_accepted' as const,
        sender: {
          id: currentUser.id,
          name: currentUser.nickname,
          avatar: currentUser.avatar
        },
        read: false,
        targetId: friendshipId,
        targetView: 'profile' as const,
        timestamp: Date.now()
      };
      await dbCreateNotification(newNotif);
      playPublishPostSound();
      triggerToast('Pedido de vínculo aceite com sucesso!');
    }
    await dbDeleteNotification(notifId);
  };

  const handleDeclineFriendship = async (friendshipId: string, notifId: string) => {
    const f = friendships.find(item => item.id === friendshipId);
    if (f) {
      await dbDeleteFriendship(f.id);
    }
    await dbDeleteNotification(notifId);
    triggerToast('Pedido de vínculo recusado.');
  };

  const handleIgnoreFriendship = async (notifId: string) => {
    await dbDeleteNotification(notifId);
    triggerToast('Pedido de vínculo ignorado.');
  };

  const handleAddChatPermission = async (targetUserId: string, durationDays: 7 | 30 | 'permanent') => {
    if (!currentUser) return;
    
    // Check if there is already a permission
    const existing = chatPermissions.find(p => 
      (p.senderId === currentUser.id && p.receiverId === targetUserId) ||
      (p.senderId === targetUserId && p.receiverId === currentUser.id)
    );
    
    if (existing) {
      if (existing.status === 'pending') {
        triggerToast('Já existe um pedido de conversa pendente.');
        return;
      } else if (existing.status === 'accepted' && (existing.expiresAt === null || existing.expiresAt > Date.now())) {
        triggerToast('Já possui uma conversa ativa/autorizada com este utilizador.');
        return;
      }
    }

    const expiresAt = durationDays === 'permanent' ? null : Date.now() + (durationDays * 24 * 60 * 60 * 1000);

    const newPerm: ChatPermission = {
      id: 'perm_' + Math.random().toString(36).substring(2, 9),
      senderId: currentUser.id,
      receiverId: targetUserId,
      status: 'pending',
      duration: durationDays === 7 ? '7d' : 'permanent',
      level: 'conhecido',
      timestamp: Date.now(),
      expiresAt
    };

    await dbCreateChatPermission(newPerm);

    // Send a real-time notification
    const newNotif = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipientId: targetUserId,
      title: 'Pedido de conversa',
      text: `@${currentUser.nickname} quer iniciar uma conversa de nível: ${durationDays === 'permanent' ? 'Permanente' : durationDays + ' dias'}!`,
      type: 'chat_request' as const,
      sender: {
        id: currentUser.id,
        name: currentUser.nickname,
        avatar: currentUser.avatar
      },
      read: false,
      targetId: newPerm.id,
      targetView: 'conversas' as const,
      timestamp: Date.now()
    };
    await dbCreateNotification(newNotif);

    triggerToast(`Pedido de conversa enviado (${durationDays === 'permanent' ? 'Permanente' : durationDays + ' dias'})!`);
  };

  const handleDisconnectUser = async (targetUserId: string) => {
    if (!currentUser) return;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const f = friendships.find(f => 
      ((f.senderId === currentUser.id && f.receiverId === targetUserId) || 
       (f.senderId === targetUserId && f.receiverId === currentUser.id))
    );
    if (f) {
      await dbDeleteFriendship(f.id);
      triggerToast(`Vínculo removido com ${targetUser.nickname}`);
    }
  };

  const handlePublishPost = async (
    imgSrc: string | null,
    text: string,
    font: string,
    color: string,
    isPrivate: boolean,
    type?: 'photo' | 'video' | 'audio' | 'voice' | 'document' | 'file' | 'text',
    extraData?: any
  ) => {
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
      isPrivate,
      author: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      stars: 0,
      views: 0,
      timestamp: Date.now(),
      comments: [],
      type: type || 'text',
      ...extraData
    };

    await dbCreatePost(newPost);
    setActiveView('feed');
    triggerToast('Publicação criada com sucesso!');
  };

  const handleAddComment = async (postId: string, text: string, audioUrl?: string, audioDuration?: number) => {
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
      audioUrl,
      audioDuration,
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
    if (currentUser?.id === 'guest') {
      alert('Como convidado, precisa de uma conta para interagir. Vamos direcioná-lo para criar uma conta!');
      handleRedirectToRegister();
      return;
    }
    const s = stories.find(x => x.id === storyId);
    if (!s) return;

    const starredBy = s.starredBy ? { ...s.starredBy } : {};
    const hasStarred = !!starredBy[currentUser.id];
    const nextStarred = !hasStarred;
    starredBy[currentUser.id] = nextStarred;

    const nextStars = Object.values(starredBy).filter(Boolean).length;

    const updated: Story = {
      ...s,
      starredBy,
      starred: nextStarred,
      stars: nextStars
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

    if (currentUser) {
      const viewedBy = s.viewedBy ? { ...s.viewedBy } : {};
      if (viewedBy[currentUser.id]) {
        sessionStorage.setItem(sessionKey, 'true');
        return;
      }
      viewedBy[currentUser.id] = true;
      const updated: Story = {
        ...s,
        viewedBy,
        views: (s.views || 0) + 1
      };
      await dbUpdateStory(updated);
      sessionStorage.setItem(sessionKey, 'true');
    } else {
      const updated: Story = {
        ...s,
        views: (s.views || 0) + 1
      };
      await dbUpdateStory(updated);
      sessionStorage.setItem(sessionKey, 'true');
    }
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

  const navigateToView = (view: ViewType, clearSelectedCommunityUser: boolean = true) => {
    if (currentUser?.id === 'guest' && view !== 'feed' && (view as string) !== 'register') {
      alert('Como convidado, precisa de uma conta para aceder a esta funcionalidade. Vamos direcioná-lo para criar uma conta!');
      handleRedirectToRegister();
      return;
    }
    if (view === 'profile' && clearSelectedCommunityUser) {
      setSelectedCommunityUser(null);
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
    navigateToView(view, targetId ? false : true);
  };

  // 5. Views Switcher Router Routing logic (Ensures absolutely NO empty states or broken buttons)
  const renderActiveView = () => {
    if (!currentUser) return null;

    switch (activeView) {
      case 'feed':
        return (
          <FeedView
            currentUser={currentUser}
            posts={resolvedPosts}
            stories={resolvedStories}
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
            onNavigateToTarget={handleNavigateToTarget}
          />
        );
      case 'profile':
        return (
          <ProfileView 
            currentUser={currentUser} 
            targetUser={selectedCommunityUser || currentUser}
            friendships={friendships}
            posts={resolvedPosts}
            chatPermissions={chatPermissions}
            onNavigate={navigateToView} 
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onAddFriendship={handleConnectUser}
            onDeleteFriendship={handleDisconnectUser}
            onAddComment={handleAddComment}
            onLikePost={handleLikePost}
            onDeletePost={handleDeletePost}
            onAddChatPermission={handleAddChatPermission}
          />
        );
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
            users={users}
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
            onAcceptFriendship={handleAcceptFriendship}
            onDeclineFriendship={handleDeclineFriendship}
            onIgnoreFriendship={handleIgnoreFriendship}
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
                                    level: 'conhecido' as const,
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
                  SELEÇÃO MANUAL DE TEMA (10 MODOS DISPONÍVEIS)
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
                    { id: 'eyes-max', name: 'Eyes Max', color: '#fbbf24', desc: 'Foco dourado super nítido 👁️' },
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

                {/* Interface Sounds Toggle Switch */}
                <div className="flex items-center justify-between bg-[var(--theme-bg-card)]/30 border border-[var(--theme-border)]/50 p-4 rounded-2xl">
                  <div>
                    <h5 className="text-xs font-bold text-[var(--theme-text-main)]">Efeitos Sonoros da Interface</h5>
                    <p className="text-[9px] text-[var(--theme-text-muted)] mt-0.5 leading-relaxed">
                      Ativa ou desativa sons discretos para avaliações por estrelas, amizades, notificações e outras interações.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={interfaceSounds} 
                      onChange={(e) => {
                        setInterfaceSounds(e.target.checked);
                        triggerToast(e.target.checked ? 'Efeitos sonoros ativos!' : 'Efeitos sonoros desativados!');
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
        /* If session is not authenticated, render Saved Accounts list or Login/Register views */
        <div className="flex-1">
          {showAccountSelector && savedAccounts.length > 0 ? (
            <AccountSelectorView
              savedAccounts={savedAccounts}
              onSelectAccount={handleSelectSavedAccount}
              onUseAnotherAccount={() => setShowAccountSelector(false)}
              onRemoveAccount={handleRemoveSavedAccount}
              onRegisterPin={handleRegisterSavedPin}
              theme={theme}
            />
          ) : activeView === 'register' ? (
            <RegisterView
              users={users}
              onRegisterSuccess={handleRegisterSuccess}
              onGoToLogin={() => {
                setShowAccountSelector(true);
                setActiveView('feed');
              }}
            />
          ) : (
            <LoginView
              users={users}
              onLoginSuccess={handleLoginSuccess}
              onGoToRegister={() => setActiveView('register')}
              onGoToSavedAccounts={() => setShowAccountSelector(true)}
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
                                level: 'conhecido' as const,
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

      {/* ========================================== */}
      {/* 1. EYES MAX SPECIAL THEME DOWNLOAD MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {showEyesMaxDownloadModal && (
          <div className="fixed inset-0 bg-[#070504]/90 backdrop-blur-md z-[50000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="bg-[#15110e] border-2 border-[#fbbf24]/20 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center relative shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-6"
            >
              <button
                onClick={() => setShowEyesMaxDownloadModal(false)}
                disabled={isDownloadingEyesMax}
                className="absolute top-4 right-4 p-2 text-amber-500/50 hover:text-amber-400 rounded-full hover:bg-white/5 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#d97706] to-[#78350f] flex items-center justify-center shadow-md">
                <Sparkles className="w-8 h-8 text-[#fef3c7]" />
              </div>

              <div className="space-y-2">
                <h2 className="font-orbitron font-black text-2xl tracking-wider text-[#fbbf24] uppercase">
                  Tema Imperial Eyes Max
                </h2>
                <p className="text-[#fef3c7]/60 text-xs uppercase tracking-widest font-bold">
                  Sinfonia em Chocolate & Ouro Real
                </p>
              </div>

              <p className="text-amber-100/80 text-sm leading-relaxed max-w-md mx-auto">
                Desbloqueie o ecossistema premium de alta performance. Desenvolvido com uma assinatura visual única de profundidade 4D realista, sem neons, e com suporte integral ao assistente virtual integrado <span className="text-[#fbbf24] font-bold">Pay</span>.
              </p>

              {isDownloadingEyesMax ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-amber-400/80 px-1">
                    <span>A descarregar recursos do tema...</span>
                    <span className="font-bold">{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-500/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#d97706] to-[#fbbf24]"
                      animate={{ width: `${downloadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-500/50 italic">
                    {downloadProgress < 40 && 'Configurando layouts horizontais...'}
                    {downloadProgress >= 40 && downloadProgress < 80 && 'Compilando micro-físicas táteis...'}
                    {downloadProgress >= 80 && 'Sincronizando modelos com Pay...'}
                  </p>
                </div>
              ) : eyesMaxDownloaded ? (
                <div className="space-y-4">
                  <div className="py-2.5 px-4 bg-amber-950/20 border border-green-500/30 rounded-xl flex items-center justify-center gap-2 text-green-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Recursos descarregados com sucesso!</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowEyesMaxDownloadModal(false);
                      triggerApplyEyesMaxFlow();
                    }}
                    className="w-full py-3.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-orbitron font-extrabold text-xs tracking-widest rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg cursor-pointer uppercase"
                  >
                    Aplicar Tema Especial
                  </button>
                </div>
              ) : (
                <button
                  onClick={triggerDownloadEyesMax}
                  className="w-full py-3.5 bg-gradient-to-r from-[#d97706] to-[#fbbf24] text-black font-orbitron font-extrabold text-xs tracking-widest rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg cursor-pointer uppercase"
                >
                  Aceitar e Descarregar Recursos (1.2 MB)
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 2. EXCLUSIVE FULL SCREEN APPLYING LOADER   */}
      {/* ========================================== */}
      <AnimatePresence>
        {isApplyingEyesMax && (
          <div className="fixed inset-0 bg-[#0c0907] z-[99999] flex flex-col items-center justify-center p-6 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-8 max-w-sm w-full"
            >
              {/* Spinning luxury circular progress indicator */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#1d1611"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={251.2}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * applyProgress) / 100 }}
                    transition={{ duration: 0.1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-orbitron font-black text-xl text-[#fbbf24]">{applyProgress}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-orbitron font-black text-lg tracking-widest text-[#fbbf24] uppercase">
                  A ATIVAR EYES MAX
                </h3>
                <p className="text-amber-100/50 text-xs uppercase tracking-wider h-6 transition-all duration-300">
                  {applyProgress < 30 && 'Sincronizando matriz de profundidade 4D...'}
                  {applyProgress >= 30 && applyProgress < 60 && 'Carregando paleta chocolate imperial...'}
                  {applyProgress >= 60 && applyProgress < 85 && 'Ajustando grelha horizontal de publicações...'}
                  {applyProgress >= 85 && 'Despertando assistente virtual "Pay"...'}
                </p>
              </div>

              {/* Minimalist physical progress bar */}
              <div className="w-full h-1 bg-amber-950/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#fbbf24]"
                  animate={{ width: `${applyProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 3. FLOATING "PAY" ASSISTANT LAUNCHER       */}
      {/* ========================================== */}
      {theme === 'eyes-max' && !showPayAssistant && (
        <motion.button
          onClick={() => setShowPayAssistant(true)}
          initial={{ scale: 0, y: 50 }}
          animate={{ 
            scale: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 260, damping: 15 }
          }}
          whileHover={{ 
            scale: 1.12, 
            y: -5,
            transition: { type: 'spring', stiffness: 300, damping: 10 }
          }}
          whileTap={{ scale: 0.90 }}
          className="fixed bottom-6 right-6 z-[40000] w-14 h-14 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#78350f] text-black shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-[#fbbf24]/30 cursor-pointer flex items-center justify-center group"
          title="Falar com Pay"
        >
          <MessageSquare className="w-6 h-6 text-[#15110e] group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-[#15110e] animate-pulse"></span>
        </motion.button>
      )}

      {/* ========================================== */}
      {/* 4. PAY ASSISTANT CHAT DIALOG CONTAINER    */}
      {/* ========================================== */}
      <AnimatePresence>
        {theme === 'eyes-max' && showPayAssistant && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="fixed bottom-6 right-6 z-[45000] w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[85vh] bg-[#140f0c] border border-[#fbbf24]/30 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-[#1b1410] border-b border-[#fbbf24]/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#78350f] flex items-center justify-center border border-[#fbbf24]/20 shadow-md">
                  <MessageSquare className="w-5 h-5 text-[#15110e]" />
                </div>
                <div>
                  <h4 className="font-orbitron font-extrabold text-sm text-[#fbbf24] tracking-wide uppercase">
                    Pay Assistant
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-amber-200/50 uppercase tracking-widest font-bold">Virtual</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPayAssistant(false)}
                  className="p-1.5 text-amber-500/50 hover:text-amber-400 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Conversation Flow area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-amber-950 no-scrollbar">
              {assistantMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[#fbbf24] text-[#15110e] rounded-br-none'
                        : 'bg-[#1b1410] border border-amber-500/10 text-amber-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isAssistantTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1b1410] border border-amber-500/10 text-amber-100 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>

            {/* Form control bottom */}
            <div className="p-3 bg-[#17120e] border-t border-[#fbbf24]/10 flex items-center gap-2">
              <input
                type="text"
                placeholder="Pergunte ao Pay..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendAssistantMessage();
                }}
                disabled={isAssistantTyping}
                className="flex-grow bg-[#100c09] border border-amber-500/10 hover:border-amber-500/25 focus:border-[#fbbf24]/40 rounded-xl px-3.5 py-2 text-xs text-amber-100 focus:outline-none placeholder-amber-500/30 transition-all duration-300"
              />
              <button
                onClick={handleSendAssistantMessage}
                disabled={isAssistantTyping || !assistantInput.trim()}
                className="py-2 px-3.5 bg-gradient-to-r from-[#d97706] to-[#fbbf24] text-black text-xs font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 cursor-pointer"
              >
                Enviar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 5. WELCOME POPUP ALERT DIALOG FROM PAY    */}
      {/* ========================================== */}
      <AnimatePresence>
        {showEyesMaxWelcome && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[48000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#15110e] border-2 border-[#fbbf24]/30 rounded-3xl p-6 max-w-md w-full text-center relative shadow-2xl space-y-5"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-950/30 border border-[#fbbf24]/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#fbbf24]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-orbitron font-black text-base text-[#fbbf24] tracking-wide uppercase">
                  Bem-vindo ao Eyes Max!
                </h3>
                <p className="text-[#fef3c7]/50 text-[10px] uppercase tracking-widest font-bold">
                  Uma mensagem de Pay
                </p>
              </div>

              <p className="text-amber-100/90 text-xs leading-relaxed">
                "Olá! Eu sou o <span className="text-[#fbbf24] font-bold">Pay</span>, o assistente oficial do Eyes Open MZ. Estou muito feliz em apresentar este novo ecossistema de requinte imperial criado pelo meu mentor <span className="text-[#fbbf24] font-bold">Ofício Faustino Rachide</span>. O site agora apresenta publicações dispostas em grelha dupla horizontal, acabamentos premium sem neons e animações táteis customizadas. Conte comigo para qualquer ajuda!"
              </p>

              <button
                onClick={() => setShowEyesMaxWelcome(false)}
                className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-orbitron font-bold text-xs tracking-widest rounded-xl transition-all cursor-pointer uppercase shadow-md"
              >
                Começar a Explorar
              </button>
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

