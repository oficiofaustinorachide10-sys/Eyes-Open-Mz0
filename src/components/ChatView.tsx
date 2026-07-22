/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, Clock, UserPlus, UserCheck, Lock, Unlock, 
  Hourglass, Phone, Video, FileUp, MapPin, Calendar, Award, Folder, Play, Check, CheckCheck, Mic, Square,
  X, HelpCircle, Briefcase, Radio, AlertTriangle, Sparkles, Star, Users, CheckCircle2, UserX, Plus,
  MoreVertical, Settings, ArrowLeft, VideoOff, Tv, Pin, Volume2, VolumeX, Trash2, Edit3, Download, Share2, Smile, MessageCircle,
  Search, ShieldAlert, User as UserIcon, Palette, Eye, Bell, Info, Paperclip, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Friendship, ChatPermission } from '../types';
import type { Notification } from '../types';
import { UserAvatar } from './UserAvatar';
import { 
  subscribeChats, dbSendMessage, dbUpdateMessage, dbDeleteMessage, dbUpdateUser, subscribeUsers,
  subscribeFriendships, dbCreateFriendship, dbUpdateFriendship, dbDeleteFriendship,
  subscribeChatPermissions, dbCreateChatPermission, dbUpdateChatPermission, dbDeleteChatPermission,
  dbCreateNotification, subscribeGroupLives, dbJoinGroupLive, dbLeaveGroupLive, enviarPedidoAmizade
} from '../lib/db';

interface ChatViewProps {
  currentUser: User;
  initialSelectedChatId?: string;
  onGuestActionAttempt?: () => void;
}

interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    id: string;
  };
  recipientId?: string; // empty means group chat
  text: string;
  timestamp: number;
  messageType?: 'text' | 'call' | 'file' | 'location' | 'calendar' | 'task' | 'audio';
  audioUrl?: string;
  audioDuration?: number;
  transcribedText?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export default function ChatView({ currentUser, initialSelectedChatId, onGuestActionAttempt }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const checkChatGuestRestriction = (): boolean => {
    if (currentUser?.isGuest || currentUser?.id === 'guest') {
      if (onGuestActionAttempt) {
        onGuestActionAttempt();
      } else {
        alert('Funcionalidade exclusiva para usuários registrados. Deseja criar uma conta agora?');
      }
      return true;
    }
    return false;
  };

  const [users, setUsers] = useState<User[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [permissions, setPermissions] = useState<ChatPermission[]>([]);
  
  // Group Live Video state
  const [groupLives, setGroupLives] = useState<any[]>([]);
  const [isInGroupLive, setIsInGroupLive] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // Real-time ticking timestamp to handle countdowns
  const [now, setNow] = useState<number>(Date.now());

  const isUserOnline = (u: User): boolean => {
    if (u.id === currentUser.id) return true;
    const isOnlineField = (u as any).isOnline === true;
    const lastActiveTime = (u as any).lastActive || 0;
    const isRecent = (Date.now() - lastActiveTime) < 45000;
    return isOnlineField && isRecent;
  };

  // UI Navigation states
  const [selectedChatId, setSelectedChatId] = useState<string>(initialSelectedChatId || 'group'); // 'group' or userId

  useEffect(() => {
    if (initialSelectedChatId) {
      setSelectedChatId(initialSelectedChatId);
    }
  }, [initialSelectedChatId]);
  const [activeTab, setActiveTab] = useState<'conversas' | 'pedidos' | 'grupos'>('conversas');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown options for accepting conversation requests
  const [selectedDuration, setSelectedDuration] = useState<'24h' | '48h' | '7d' | 'permanent'>('48h');
  const [selectedLevel, setSelectedLevel] = useState<'conhecido' | 'amigo' | 'parceiro' | 'familia' | 'equipe' | 'vip'>('conhecido');

  // Input states for requesting custom levels
  const [requestLevelInput, setRequestLevelInput] = useState<'conhecido' | 'amigo' | 'parceiro' | 'familia' | 'equipe' | 'vip'>('conhecido');
  const [requestDurationInput, setRequestDurationInput] = useState<'24h' | '48h' | '7d' | 'permanent'>('48h');

  // Interactive simulations modal/states
  const [simulationModal, setSimulationModal] = useState<{
    type: 'call_voice' | 'call_video' | 'file_share' | 'location' | 'calendar' | 'tasks' | 'blocked';
    requiredLevel?: string;
    targetUser?: User;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Theme Layout configuration states
  const [chatLayoutTheme, setChatLayoutTheme] = useState<'normal' | 'division'>(() => {
    return (localStorage.getItem('chat_layout_theme') as 'normal' | 'division') || 'division';
  });
  const [isMobileChatActive, setIsMobileChatActive] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(false);
  const [isChatActionsMenuOpen, setIsChatActionsMenuOpen] = useState(false);

  // Mentions / Chamar states
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

  // New States for Extended Chat Features
  const [pinnedConversations, setPinnedConversations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`eo_pinned_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [mutedConversations, setMutedConversations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`eo_muted_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [favoritedMessageIds, setFavoritedMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`eo_favorites_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`eo_blocked_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // Chat Background Customization
  const [showBgCustomizer, setShowBgCustomizer] = useState(false);
  const [customBgInput, setCustomBgInput] = useState('');
  const [applyBgGlobally, setApplyBgGlobally] = useState(false);
  const [chatBg, setChatBg] = useState<string>(() => {
    return localStorage.getItem(`eo_chat_bg_${currentUser.id}_${selectedChatId}`) || 
           localStorage.getItem(`eo_chat_bg_${currentUser.id}_global`) || 
           '';
  });

  // Re-load background when chat selection or user changes
  useEffect(() => {
    const bg = localStorage.getItem(`eo_chat_bg_${currentUser.id}_${selectedChatId}`) || 
               localStorage.getItem(`eo_chat_bg_${currentUser.id}_global`) || 
               '';
    setChatBg(bg);
  }, [selectedChatId, currentUser.id]);

  // Voice Recording and Audio Transcription States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [isTranscribingState, setIsTranscribingState] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Accept Request Level Modal State
  const [showAcceptModal, setShowAcceptModal] = useState<ChatPermission | null>(null);

  // States to configure individual chat permissions inline
  const [acceptingPermId, setAcceptingPermId] = useState<string | null>(null);
  const [acceptingPermLevel, setAcceptingPermLevel] = useState<string>('conhecido');
  const [acceptingPermDuration, setAcceptingPermDuration] = useState<string>('48h');

  // Real-time Accepted Request Banner/Toast State for User A
  const [showAcceptedBanner, setShowAcceptedBanner] = useState<{
    visible: boolean;
    userName: string;
    level: string;
    duration: string;
    targetUserId: string;
  }>({
    visible: false,
    userName: '',
    level: 'conhecido',
    duration: '48h',
    targetUserId: ''
  });

  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  // Stories / Status highlights state
  const [userStories, setUserStories] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('eo_user_stories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 's1', userId: 'u1', name: 'Constância', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', text: 'Desenvolvimento e novidades da Eyes Open MZ! 🚀', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', time: 'Há 15 min' },
      { id: 's2', userId: 'u2', name: 'Otall Lizy', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', text: 'Projetos de alta performance na plataforma 💻', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', time: 'Há 40 min' },
      { id: 's3', userId: 'u3', name: 'Tânia Dha', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', text: 'Sessão de fotos e design gráfico 📸', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', time: 'Há 2 horas' }
    ];
  });
  const [activeStoryViewer, setActiveStoryViewer] = useState<any | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState<boolean>(false);
  const [newStoryText, setNewStoryText] = useState<string>('');
  const [newStoryImageUrl, setNewStoryImageUrl] = useState<string>('');

  // Group creation states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupMinLevel, setNewGroupMinLevel] = useState('conhecido');
  const [newGroupPhoto, setNewGroupPhoto] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=200');

  const [groups, setGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('eo_groups_' + currentUser.id);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'group_general',
        name: 'Geral Eyes Open MZ',
        photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=200',
        description: 'Espaço principal para debate, novidades académicas e partilha social na nossa rede nacional.',
        admins: ['Alex MZ', 'Oficio MZ'],
        mods: ['Helena Maputo'],
        participants: [currentUser.nickname, 'Alex MZ', 'Oficio MZ', 'Helena Maputo', 'Lucas Beira'],
        rules: [
          'Respeito mútuo entre todos os membros.',
          'Partilhar apenas conteúdos pedagógicos e de interesse geral.',
          'Proibido spam ou publicidade não autorizada.'
        ],
        invites: [],
        files: [
          { name: 'Guia de Boas-Vindas Eyes Open.pdf', sender: 'Alex MZ', date: '12/07/2026' }
        ]
      },
      {
        id: 'group_math',
        name: 'Matemática e Física Geral',
        photo: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=200',
        description: 'Grupo dedicado à resolução de problemas de Física, Análise Matemática e Álgebra.',
        admins: ['Alex MZ'],
        mods: ['Oficio MZ'],
        participants: [currentUser.nickname, 'Alex MZ', 'Oficio MZ', 'Lucas Beira'],
        rules: [
          'Colocar sempre o enunciado claro do problema.',
          'Ajudar os colegas com explicações passo a passo.',
          'Manter o foco em ciência e engenharia.'
        ],
        invites: ['Helena Maputo'],
        files: [
          { name: 'Sebenta_Exercicios_Resolvidos_Calculo_I.pdf', sender: 'Alex MZ', date: '13/07/2026' }
        ]
      },
      {
        id: 'group_programming',
        name: 'Engenharia de Software & Web',
        photo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200',
        description: 'Fórum de programação, inteligência artificial e tecnologias web em Moçambique.',
        admins: ['Oficio MZ'],
        mods: ['Alex MZ'],
        participants: [currentUser.nickname, 'Oficio MZ', 'Alex MZ'],
        rules: [
          'Partilhar repositórios úteis de código ou ideias de projetos.',
          'Explicar conceitos sem recorrer a plágio.',
          'Manter uma atitude construtiva no feedback.'
        ],
        invites: [],
        files: [
          { name: 'Introducao_React_TypeScript_Vite.pdf', sender: 'Oficio MZ', date: '14/07/2026' }
        ]
      }
    ];
  });

  const togglePinConversation = (userId: string) => {
    setPinnedConversations(prev => {
      const updated = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem(`eo_pinned_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleMuteConversation = (userId: string) => {
    setMutedConversations(prev => {
      const updated = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem(`eo_muted_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavoriteMessage = (msgId: string) => {
    setFavoritedMessageIds(prev => {
      const updated = prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId];
      localStorage.setItem(`eo_favorites_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleBlockUser = async (userId: string) => {
    if (window.confirm("Deseja realmente bloquear este utilizador? Isso irá encerrar todas as permissões de conversa e apagar os pedidos de amizade.")) {
      const updatedBlocked = [...blockedUsers, userId];
      setBlockedUsers(updatedBlocked);
      localStorage.setItem(`eo_blocked_${currentUser.id}`, JSON.stringify(updatedBlocked));

      const perm = getChatPermissionWith(userId);
      if (perm) {
        await dbDeleteChatPermission(perm.id).catch(console.error);
      }
      const friendship = getFriendshipWith(userId);
      if (friendship) {
        await dbDeleteFriendship(friendship.id).catch(console.error);
      }

      if (selectedChatId === userId) {
        setSelectedChatId('group');
      }
      setIsChatActionsMenuOpen(false);
      alert("Utilizador bloqueado.");
    }
  };

  const handleClearConversationOnlyForMe = (userId: string) => {
    localStorage.setItem(`eo_cleared_${currentUser.id}_${userId}`, Date.now().toString());
    setIsChatActionsMenuOpen(false);
    alert("Histórico de conversa limpo localmente.");
  };

  const handleClearConversationForEveryone = async (userId: string) => {
    if (window.confirm("Deseja realmente eliminar esta conversa para ambos os utilizadores?")) {
      const messagesToDelete = messages.filter((msg) => {
        return (msg.recipientId === currentUser.id && msg.sender.id === userId) ||
               (msg.recipientId === userId && msg.sender.id === currentUser.id);
      });

      for (const m of messagesToDelete) {
        await dbDeleteMessage(m.id).catch(console.error);
      }
      setIsChatActionsMenuOpen(false);
      alert("Conversa eliminada para todos.");
    }
  };

  const handleEndChatPermission = async (userId: string) => {
    if (window.confirm("Deseja encerrar a permissão de conversa com este utilizador?")) {
      const perm = getChatPermissionWith(userId);
      if (perm) {
        await dbDeleteChatPermission(perm.id).catch(console.error);
      }
      setIsChatActionsMenuOpen(false);
      alert("Permissão de conversa encerrada.");
    }
  };

  const handleExportConversation = (nickname: string, uId: string) => {
    const chatMsgs = messages.filter((msg) => {
      return (msg.recipientId === currentUser.id && msg.sender.id === uId) ||
             (msg.recipientId === uId && msg.sender.id === currentUser.id);
    });

    const exportText = chatMsgs.map(m => 
      `[${new Date(m.timestamp).toLocaleString()}] ${m.sender.name}: ${m.text}`
    ).join('\n');

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `conversa_${nickname}_eyes_open.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsChatActionsMenuOpen(false);
  };

  // Sync layout theme to localStorage and auto activate if needed
  const changeChatLayoutTheme = (mode: 'normal' | 'division') => {
    setChatLayoutTheme(mode);
    localStorage.setItem('chat_layout_theme', mode);
    setIsMobileChatActive(false); // Reset active state when changing mode
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1 && lastAtIdx >= val.lastIndexOf(' ')) {
      const q = val.substring(lastAtIdx + 1);
      setMentionQuery(q);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (userNickname: string) => {
    const lastAtIdx = inputText.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const before = inputText.substring(0, lastAtIdx);
      setInputText(before + '@' + userNickname + ' ');
    }
    setShowMentionSuggestions(false);
  };

  const lastUpdatedRef = useRef<number>(0);

  // Subscribe to all real-time Firestore collections
  useEffect(() => {
    const unsubChats = subscribeChats((loadedMsgs) => {
      setMessages(loadedMsgs);
    });
    const unsubUsers = subscribeUsers((loadedUsers) => {
      setUsers(loadedUsers);
    });
    const unsubFriendships = subscribeFriendships((loadedFriendships) => {
      setFriendships(loadedFriendships);
    });
    const unsubPermissions = subscribeChatPermissions((loadedPermissions) => {
      setPermissions(loadedPermissions);
    });
    const unsubGroupLives = subscribeGroupLives((loadedLives) => {
      setGroupLives(loadedLives);
    });

    // Clock ticker for countdowns
    const clock = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      unsubChats();
      unsubUsers();
      unsubFriendships();
      unsubPermissions();
      unsubGroupLives();
      clearInterval(clock);
    };
  }, []);

  // Cleanup camera stream and group live participation
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  useEffect(() => {
    return () => {
      if (currentUser) {
        dbLeaveGroupLive(currentUser.id).catch(console.error);
      }
    };
  }, [currentUser]);

  // Update lastReadChatTimestamp on mount and on new messages
  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      const nowTime = Date.now();
      if (nowTime - lastUpdatedRef.current > 3000) {
        lastUpdatedRef.current = nowTime;
        const updatedUser: User = {
          ...currentUser,
          lastReadChatTimestamp: nowTime
        };
        dbUpdateUser(updatedUser).catch(console.error);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
  }, [messages, currentUser]);

  // Scroll to bottom on selected chat change or new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChatId]);

  const handleJoinLive = async () => {
    if (!currentUser) return;
    if (checkChatGuestRestriction()) return;

    if (groupLives.length >= 4) {
      alert('A live de vídeo já atingiu o limite de 4 participantes. Aguarde um momento por favor!');
      return;
    }

    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch((err) => {
        console.warn('Camera access denied or unavailable, using high fidelity avatar animation:', err);
        return null;
      });

      if (stream) {
        setLocalStream(stream);
      }
      
      await dbJoinGroupLive(currentUser.id, {
        nickname: currentUser.nickname,
        avatar: currentUser.avatar || "https://i.pravatar.cc/80?img=1"
      });
      setIsInGroupLive(true);
    } catch (err) {
      console.error('Error joining group live video call:', err);
    }
  };

  const handleLeaveLive = async () => {
    if (!currentUser) return;
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      await dbLeaveGroupLive(currentUser.id);
      setIsInGroupLive(false);
    } catch (err) {
      console.error('Error leaving group live video call:', err);
    }
  };

  // Helpers to fetch relationship status
  const getFriendshipWith = (userId: string): Friendship | undefined => {
    return friendships.find(f => 
      (f.senderId === currentUser.id && f.receiverId === userId) || 
      (f.senderId === userId && f.receiverId === currentUser.id)
    );
  };

  const getChatPermissionWith = (userId: string): ChatPermission | undefined => {
    return permissions.find(p => 
      (p.senderId === currentUser.id && p.receiverId === userId) || 
      (p.senderId === userId && p.receiverId === currentUser.id)
    );
  };

  // Native Notification permission prompt on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  const playedMessageIdsRef = useRef<Set<string>>(new Set());

  // Listen for new incoming messages and trigger ringtones & native push notifications
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') return;
    if (messages.length === 0) return;

    messages.forEach(msg => {
      // If we haven't played a notification for this message and it's sent by someone else
      if (msg.sender.id !== currentUser.id && !playedMessageIdsRef.current.has(msg.id)) {
        playedMessageIdsRef.current.add(msg.id);

        // Only play if the message is fresh (sent in the last 15 seconds)
        if (Date.now() - msg.timestamp < 15000) {
          playBeautifulRingtone();

          // Show a real browser notification if the tab is backgrounded / hidden or if they're on another chat
          const isBackgrounded = typeof document !== 'undefined' && document.hidden;
          const isNotActiveChat = selectedChatId !== msg.sender.id;

          if ((isBackgrounded || isNotActiveChat) && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const bodyText = msg.messageType === 'audio' 
              ? '🎤 Gravação de voz recebida' 
              : (msg.text.length > 60 ? msg.text.substring(0, 57) + '...' : msg.text);
            
            try {
              new Notification(`Nova mensagem de @${msg.sender.name}`, {
                body: bodyText,
                icon: msg.sender.avatar
              });
            } catch (err) {
              console.warn('Native notification failed:', err);
            }
          }
        }
      }
    });
  }, [messages, currentUser, selectedChatId]);

  // Message Status (Sent -> Delivered -> Read) Auto-Sync Engine
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') return;

    const receivedMessages = messages.filter(m => 
      m.recipientId === currentUser.id && 
      m.sender.id !== currentUser.id
    );

    receivedMessages.forEach(async (m) => {
      if (selectedChatId === m.sender.id) {
        // If the user has this chat open, mark as read
        if (m.status !== 'read') {
          const updated = { ...m, status: 'read' as const };
          await dbUpdateMessage(updated).catch(console.error);
        }
      } else {
        // If received in background/other tab, mark as delivered
        if (m.status === 'sent') {
          const updated = { ...m, status: 'delivered' as const };
          await dbUpdateMessage(updated).catch(console.error);
        }
      }
    });
  }, [messages, selectedChatId, currentUser]);

  const handledAcceptedPermsRef = useRef<Set<string>>(new Set());

  // Listen for newly accepted chat permission requests to show the redirection banner to User A
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') return;

    const acceptedPerms = permissions.filter(p => p.senderId === currentUser.id && p.status === 'accepted');

    acceptedPerms.forEach(p => {
      if (!handledAcceptedPermsRef.current.has(p.id)) {
        handledAcceptedPermsRef.current.add(p.id);

        const partnerUser = users.find(u => u.id === p.receiverId);
        if (partnerUser) {
          playBeautifulRingtone();
          setShowAcceptedBanner({
            visible: true,
            userName: partnerUser.nickname,
            level: p.level || 'conhecido',
            duration: p.duration || '48h',
            targetUserId: partnerUser.id
          });
        }
      }
    });
  }, [permissions, users, currentUser]);

  const isSocialFriend = (userId: string): boolean => {
    const friendship = getFriendshipWith(userId);
    return friendship?.status === 'accepted';
  };

  const hasChatPermission = (userId: string): { active: boolean; perm?: ChatPermission; expired: boolean } => {
    const perm = getChatPermissionWith(userId);
    if (!perm) return { active: false, expired: false };
    if (perm.status !== 'accepted') return { active: false, perm, expired: false };
    
    if (perm.duration !== 'permanent' && perm.expiresAt) {
      if (now >= perm.expiresAt) {
        return { active: false, perm, expired: true };
      }
    }
    return { active: true, perm, expired: false };
  };

  // Trigger friendship request
  const handleSendFriendshipRequest = async (targetUser: User) => {
    if (checkChatGuestRestriction()) return;
    await enviarPedidoAmizade(targetUser.id);
  };

  const handleAcceptFriendship = async (friendship: Friendship) => {
    const updated = { ...friendship, status: 'accepted' as const };
    await dbUpdateFriendship(updated);

    // Also update friend count stats for both users as an engagement loop
    const sender = users.find(u => u.id === friendship.senderId);
    const receiver = users.find(u => u.id === friendship.receiverId);
    if (sender) {
      await dbUpdateUser({
        ...sender,
        stats: { ...sender.stats, friends: (sender.stats.friends || 0) + 1 }
      });
    }
    if (receiver) {
      await dbUpdateUser({
        ...receiver,
        stats: { ...receiver.stats, friends: (receiver.stats.friends || 0) + 1 }
      });
    }

    // Create Notification
    const notif: Notification = {
      id: 'notif_friend_acc_' + Math.random().toString(36).substring(2, 9),
      recipientId: friendship.senderId,
      title: 'Amizade Social Aceite! 🎉',
      text: `${currentUser.nickname} aceitou o seu pedido de amizade social. Agora pode ver o feed completo!`,
      type: 'friend_accepted',
      sender: {
        id: currentUser.id,
        name: currentUser.nickname,
        avatar: currentUser.avatar
      },
      read: false,
      timestamp: Date.now()
    };
    await dbCreateNotification(notif);
  };

  const handleRejectFriendship = async (friendship: Friendship) => {
    await dbDeleteFriendship(friendship.id);
  };

  // Trigger conversation request
  const handleSendChatRequest = async (targetUser: User) => {
    if (checkChatGuestRestriction()) return;
    const docId = `${currentUser.id}_${targetUser.id}`;
    const newPerm: ChatPermission = {
      id: docId,
      senderId: currentUser.id,
      receiverId: targetUser.id,
      status: 'pending',
      duration: requestDurationInput,
      level: requestLevelInput,
      timestamp: Date.now()
    };
    await dbCreateChatPermission(newPerm);

    // Create Notification
    const notif: Notification = {
      id: 'notif_chat_' + Math.random().toString(36).substring(2, 9),
      recipientId: targetUser.id,
      title: 'Pedido de Conversação 💬',
      text: `${currentUser.nickname} enviou um pedido para conversar consigo (${requestDurationInput === 'permanent' ? 'Permanente' : requestDurationInput}).`,
      type: 'chat_request',
      sender: {
        id: currentUser.id,
        name: currentUser.nickname,
        avatar: currentUser.avatar
      },
      read: false,
      timestamp: Date.now(),
      targetView: 'notificacoes'
    };
    await dbCreateNotification(notif);
  };

  const playBeautifulRingtone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (ascending beautiful chime)
      const duration = 0.18;
      
      notes.forEach((freq, index) => {
        const startTime = audioCtx.currentTime + index * 0.08;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('AudioContext ringtone playback failed:', e);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedBlob(null);
      setRecordedUrl('');
      setTranscriptionText('');

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Não foi possível aceder ao microfone. Por favor, verifique as permissões.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Cancel/Discard Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setRecordedBlob(null);
    setRecordedUrl('');
    setTranscriptionText('');
  };

  // Convert audio base64 and call server API to transcribe
  const transcribeAudio = async () => {
    if (!recordedBlob) return;
    setIsTranscribingState(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const response = await fetch('/api/audio/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              base64Audio: base64Data,
              mimeType: 'audio/webm',
            }),
          });
          
          const data = await response.json();
          if (data && data.text) {
            setTranscriptionText(data.text);
            setInputText(data.text);
          } else {
            // Local fallback if text not parsed
            setTranscriptionText("Áudio gravado com sucesso! (Modo Local)");
            setInputText("Áudio gravado com sucesso! (Modo Local)");
          }
        } catch (fetchErr) {
          console.warn('API Transcription failed, using client fallback:', fetchErr);
          setTranscriptionText("Áudio gravado com sucesso! (Modo Local)");
          setInputText("Áudio gravado com sucesso! (Modo Local)");
        }
        setIsTranscribingState(false);
      };
    } catch (e) {
      console.error('Transcription failed:', e);
      setTranscriptionText("Erro na transcrição automática.");
      setIsTranscribingState(false);
    }
  };

  // Send the voice recording
  const sendVoiceMessage = async () => {
    if (!recordedBlob) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(recordedBlob);
    reader.onloadend = async () => {
      const base64AudioUrl = reader.result as string;
      
      const newMsg: Partial<Message> = {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        sender: {
          id: currentUser.id,
          name: currentUser.nickname,
          avatar: currentUser.avatar
        },
        recipientId: selectedChatId === 'group' ? undefined : selectedChatId,
        text: transcriptionText ? `[Gravação de Voz: ${transcriptionText}]` : '[Gravação de Voz]',
        timestamp: Date.now(),
        messageType: 'audio',
        audioUrl: base64AudioUrl,
        audioDuration: recordingDuration || 1,
        transcribedText: transcriptionText || undefined,
        status: 'sent'
      };
      
      await dbSendMessage(newMsg as any);
      
      // Clear recorder state
      setRecordedBlob(null);
      setRecordedUrl('');
      setTranscriptionText('');
      setRecordingDuration(0);
    };
  };

  const handleAcceptChatPermission = async (perm: ChatPermission, levelToApply: any, durationToApply: any) => {
    let durationMs = 0;
    if (durationToApply === '24h') durationMs = 24 * 60 * 60 * 1000;
    else if (durationToApply === '48h') durationMs = 48 * 60 * 60 * 1000;
    else if (durationToApply === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;

    const acceptedAt = Date.now();
    const expiresAt = durationToApply === 'permanent' ? null : acceptedAt + durationMs;

    const updated: ChatPermission = {
      ...perm,
      status: 'accepted',
      duration: durationToApply,
      level: levelToApply,
      acceptedAt,
      expiresAt,
      timestamp: Date.now()
    };
    await dbUpdateChatPermission(updated);

    // Create Notification
    const notif: Notification = {
      id: 'notif_chat_acc_' + Math.random().toString(36).substring(2, 9),
      recipientId: perm.senderId === currentUser.id ? perm.receiverId : perm.senderId,
      title: 'Conversa Autorizada! ✅',
      text: `${currentUser.nickname} autorizou a conversa como "${getConnectionLayerLabel(levelToApply)}" por ${durationToApply === 'permanent' ? 'Permanente' : durationToApply}.`,
      type: 'chat_accepted',
      sender: {
        id: currentUser.id,
        name: currentUser.nickname,
        avatar: currentUser.avatar
      },
      read: false,
      timestamp: Date.now()
    };
    await dbCreateNotification(notif).catch(console.error);
  };

  const handleDeclineChatPermission = async (perm: ChatPermission) => {
    const updated = { ...perm, status: 'declined' as const };
    await dbUpdateChatPermission(updated);
  };

  const handleIgnoreChatPermission = async (perm: ChatPermission) => {
    const updated = { ...perm, status: 'ignored' as const };
    await dbUpdateChatPermission(updated);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = inputText.trim();
    if (!msgText) return;
    if (checkChatGuestRestriction()) return;

    // Direct message check
    if (selectedChatId !== 'group') {
      const { active } = hasChatPermission(selectedChatId);
      if (!active) return; // double guard block
    }

    const userMsg = {
      id: 'msg_u_' + Math.random().toString(36).substring(2, 9),
      sender: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      recipientId: selectedChatId === 'group' ? undefined : selectedChatId,
      text: msgText,
      timestamp: Date.now(),
      messageType: 'text' as const
    };

    setInputText('');
    setShowMentionSuggestions(false);
    await dbSendMessage(userMsg);

    // Parse mentions: look for @nickname
    const mentions = msgText.match(/@(\w+)/g);
    if (mentions) {
      for (const rawMention of mentions) {
        const nickname = rawMention.substring(1);
        const mentionedUser = users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase());
        if (mentionedUser && mentionedUser.id !== currentUser.id) {
          // Trigger the specific "CHAMADA" event
          const callNotification: Notification = {
            id: 'notif_mention_call_' + Math.random().toString(36).substring(2, 9),
            recipientId: mentionedUser.id,
            title: '🚨 CHAMADA EM CURSO',
            text: `${currentUser.nickname} chamou-o na conversa: "${msgText}"`,
            type: 'system',
            sender: {
              id: currentUser.id,
              name: currentUser.nickname,
              avatar: currentUser.avatar
            },
            read: false,
            targetId: selectedChatId === 'group' ? 'group' : currentUser.id,
            targetView: 'conversas',
            timestamp: Date.now()
          };
          await dbCreateNotification(callNotification).catch(console.error);
        }
      }
    }
  };

  // Level access configurations
  const getConnectionLayerColor = (level: string) => {
    switch (level) {
      case 'conhecido': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'amigo': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'parceiro': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'familia': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'equipe': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'vip': return 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getConnectionLayerLabel = (level: string) => {
    switch (level) {
      case 'conhecido': return '🟢 Conhecido';
      case 'amigo': return '🔵 Amigo';
      case 'parceiro': return '🟣 Parceiro';
      case 'familia': return '🟠 Família';
      case 'equipe': return '🟡 Equipe';
      case 'vip': return '⭐ VIP';
      default: return 'Desconhecido';
    }
  };

  const checkFeaturePermission = (level: string, feature: 'call' | 'files' | 'family' | 'team') => {
    const rank = ['conhecido', 'amigo', 'parceiro', 'familia', 'equipe', 'vip'];
    const currentRankIdx = rank.indexOf(level);
    
    if (feature === 'call') return currentRankIdx >= 1; // Amigo & up
    if (feature === 'files') return currentRankIdx >= 2; // Parceiro & up
    if (feature === 'family') return currentRankIdx >= 3; // Familia & up
    if (feature === 'team') return currentRankIdx >= 4; // Equipe & up
    return false;
  };

  // Simulated functional actions adding real database items
  const executeSimulatedAction = async (actionType: 'call_voice' | 'call_video' | 'file_share' | 'location' | 'calendar' | 'tasks', details: string) => {
    if (selectedChatId === 'group') return;
    
    const userMsg = {
      id: 'sim_msg_' + Math.random().toString(36).substring(2, 9),
      sender: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      recipientId: selectedChatId,
      text: details,
      timestamp: Date.now(),
      messageType: actionType === 'file_share' ? 'file' : actionType === 'location' ? 'location' : actionType === 'calendar' ? 'calendar' : actionType === 'tasks' ? 'task' : 'call'
    };
    
    await dbSendMessage(userMsg);
    setSimulationModal(null);
  };

  // Filter messages for current selected view
  const currentChatMessages = messages.filter((msg) => {
    let matchesChat = false;
    if (selectedChatId === 'group') {
      matchesChat = !msg.recipientId;
    } else {
      matchesChat = (msg.recipientId === currentUser.id && msg.sender.id === selectedChatId) ||
                    (msg.recipientId === selectedChatId && msg.sender.id === currentUser.id);
    }
    if (!matchesChat) return false;
    if (showSearchInChat && searchInChatQuery) {
      return msg.text.toLowerCase().includes(searchInChatQuery.toLowerCase());
    }
    return true;
  });

  // Calculate unread badge numbers for notifications list
  const incomingFriendRequestsCount = friendships.filter(f => f.receiverId === currentUser.id && f.status === 'pending').length;
  const incomingChatRequestsCount = permissions.filter(p => p.receiverId === currentUser.id && p.status === 'pending').length;
  const totalRequestsCount = incomingFriendRequestsCount + incomingChatRequestsCount;

  // Search users for Direct messaging
  const filteredUsers = users
    .filter(u => u.id !== currentUser.id && u.id !== 'guest')
    .filter(u => u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || u.fullname.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active chat details
  const activeChatUser = users.find(u => u.id === selectedChatId);
  const activePermission = activeChatUser ? hasChatPermission(activeChatUser.id) : null;
  const activeFriendship = activeChatUser ? getFriendshipWith(activeChatUser.id) : null;

  return (
    <div className="flex-grow p-2 md:p-4 lg:p-6 max-w-6xl mx-auto flex flex-col h-[86vh] font-rajdhani text-white select-none gap-3">
      
      {/* FLOATING CHAT ACCEPTANCE NOTIFICATION BANNER */}
      <AnimatePresence>
        {showAcceptedBanner.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="bg-[#031d10]/95 border-2 border-[#00ff66]/70 text-white p-4 rounded-2xl shadow-[0_0_25px_rgba(0,255,102,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4 z-50 animate-pulse relative"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00ff66]/10 border border-[#00ff66]/40 rounded-full flex items-center justify-center text-[#00ff66] animate-bounce">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-[#00ff66] tracking-widest">Pedido Aceito! 🎉</p>
                <p className="text-[11px] text-gray-200 font-semibold leading-normal">
                  Seu pedido de conversa com <span className="text-[#00ff66] font-bold">@{showAcceptedBanner.userName}</span> foi autorizado como <span className="underline">{getConnectionLayerLabel(showAcceptedBanner.level)}</span> por <span className="font-bold">{showAcceptedBanner.duration === 'permanent' ? 'Permanente' : showAcceptedBanner.duration}</span>.
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Deseja conversar agora?</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                onClick={() => setShowAcceptedBanner({ ...showAcceptedBanner, visible: false })}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-gray-300"
              >
                Depois
              </button>
              <button
                onClick={() => {
                  setSelectedChatId(showAcceptedBanner.targetUserId);
                  setIsMobileChatActive(true);
                  setShowAcceptedBanner({ ...showAcceptedBanner, visible: false });
                }}
                className="px-4 py-1.5 bg-[#00ff66] hover:bg-[#00ff88] text-black font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,102,0.4)] hover:scale-105 active:scale-95"
              >
                Sim, Conversar!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EYES OPEN MZ HEADER BAR */}
      <header className="h-16 border-b border-gray-800/60 bg-[#131C31]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between px-4 md:px-6 z-20 shrink-0 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Eye className="text-white w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg tracking-wide bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Eyes Open MZ
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">Plataforma Social Inteligente</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center bg-gray-900/80 border border-gray-700/50 rounded-full px-4 py-1.5 w-80 lg:w-96 focus-within:border-blue-500 transition-all shadow-inner">
          <Search className="text-gray-400 mr-2.5 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar conversas, amigos ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-gray-200 placeholder-gray-500 font-medium"
          />
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setActiveTab('pedidos')}
            className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition relative cursor-pointer"
            title="Notificações & Pedidos"
          >
            <Bell className="w-4 h-4" />
            {(incomingFriendRequestsCount + incomingChatRequestsCount) > 0 && (
              <>
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
              </>
            )}
          </button>

          {/* Settings dropdown button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 flex items-center justify-center cursor-pointer transition-all text-gray-300"
              title="Menu Definições"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-[#0a0a1a] border border-white/10 rounded-2xl p-3 shadow-2xl z-50 space-y-2.5 font-sans"
                >
                  <div 
                    onClick={() => setIsDefinitionsOpen(!isDefinitionsOpen)}
                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl cursor-pointer text-xs font-bold text-gray-200 uppercase tracking-wider transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-blue-400" /> Definições
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">{isDefinitionsOpen ? '▾' : '▸'}</span>
                  </div>

                  {isDefinitionsOpen && (
                    <div className="border-t border-white/5 pt-2 pl-2 space-y-2">
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Modo de Layout</p>
                      
                      <button
                        onClick={() => {
                          changeChatLayoutTheme('normal');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition-all border text-xs ${
                          chatLayoutTheme === 'normal'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                            : 'bg-transparent border-white/5 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <p className="font-bold">Tema 1: Normal (Focado)</p>
                        <p className="text-[9px] text-gray-400 font-medium normal-case">Mobile/Focado: oculta a lista de utilizadores ao conversar.</p>
                      </button>

                      <button
                        onClick={() => {
                          changeChatLayoutTheme('division');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition-all border text-xs ${
                          chatLayoutTheme === 'division'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                            : 'bg-transparent border-white/5 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <p className="font-bold">Tema 2: Divisão (Split-View)</p>
                        <p className="text-[9px] text-gray-400 font-medium normal-case">Split-View: lista e área de chat lado a lado.</p>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2 pl-2 border-l border-gray-800">
            <UserAvatar 
              src={currentUser.avatar} 
              status={true} 
              nickname={currentUser.nickname} 
              className="w-9 h-9 rounded-xl object-cover border border-blue-500/30" 
            />
          </div>
        </div>
      </header>

      {/* Main columns wrapper */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 h-full overflow-hidden">
        
        {/* COLUMN 1: SIDEBAR USER LIST, STORIES & REQUESTS */}
        {(chatLayoutTheme === 'division' || !isMobileChatActive) && (
          <aside className="w-full md:w-96 shrink-0 border border-gray-800/60 flex flex-col bg-[#131C31]/80 backdrop-blur-xl rounded-3xl overflow-hidden h-[45vh] md:h-full shadow-2xl relative">
            
            {/* Seção de Stories / Status em Círculo */}
            <div className="p-3.5 border-b border-gray-800/40">
              <div className="flex justify-between items-center mb-2.5">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Destaques & Conexões</h2>
                <button 
                  onClick={() => setShowAddStoryModal(true)}
                  className="text-xs text-blue-400 hover:underline cursor-pointer font-semibold"
                >
                  Ver todos
                </button>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-none">
                {/* Botão Adicionar Story */}
                <div 
                  onClick={() => setShowAddStoryModal(true)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                >
                  <div className="w-[52px] h-[52px] rounded-2xl bg-gray-800/80 border-2 border-dashed border-gray-600 flex items-center justify-center group-hover:border-blue-500 transition">
                    <Plus className="text-blue-400 w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-1 text-gray-400 font-medium">Seu Status</span>
                </div>

                {/* Dynamic User Stories */}
                {userStories.map((story) => (
                  <div 
                    key={story.id} 
                    onClick={() => setActiveStoryViewer(story)}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                  >
                    <div className="w-[52px] h-[52px] rounded-2xl p-[2px] bg-gradient-to-tr from-blue-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform">
                      <img 
                        src={story.avatar} 
                        className="w-full h-full object-cover rounded-[13px] border-2 border-[#090D16]" 
                        alt={story.name} 
                      />
                    </div>
                    <span className="text-[10px] mt-1 text-gray-300 truncate w-14 text-center font-medium">{story.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex px-3 py-2 space-x-1.5 border-b border-gray-800/40 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('conversas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'conversas' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-gray-800/60 hover:bg-gray-700 text-gray-400'
                }`}
              >
                Tudo
              </button>
              <button 
                onClick={() => setActiveTab('pedidos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                  activeTab === 'pedidos' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-gray-800/60 hover:bg-gray-700 text-gray-400'
                }`}
              >
                Não lidas
                {(incomingFriendRequestsCount + incomingChatRequestsCount) > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded-full text-[10px]">
                    {incomingFriendRequestsCount + incomingChatRequestsCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('grupos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'grupos' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'bg-gray-800/60 hover:bg-gray-700 text-gray-400'
                }`}
              >
                Grupos
              </button>
            </div>

        {/* Tab 1 content: Comunidade (Conversas ativas) */}
        {activeTab === 'conversas' && (
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Search filter bar */}
            <div className="p-3 border-b border-[var(--theme-border)] bg-black/10 shrink-0">
              <input
                type="text"
                placeholder="Pesquisar utilizador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl px-3.5 py-1.5 text-xs text-white outline-none focus:border-neon-cyan font-semibold transition-all shadow-inner"
              />
            </div>

            {/* Conversation list */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1.5">
              {(() => {
                // Filter community users who have active chat permissions
                const communityUsers = users.filter(u => {
                  if (u.id === currentUser.id) return false;
                  if (blockedUsers.includes(u.id)) return false;
                  
                  const perm = hasChatPermission(u.id);
                  const isMatch = u.nickname.toLowerCase().includes(searchQuery.toLowerCase());
                  return perm.active && isMatch;
                });

                // Dynamically sort based strictly on Pinned and then Recent Message activity (Most recent on top)
                const sortedUsers = [...communityUsers].sort((a, b) => {
                  // 1. Pin priority
                  const pinA = pinnedConversations.includes(a.id) ? 1 : 0;
                  const pinB = pinnedConversations.includes(b.id) ? 1 : 0;
                  if (pinA !== pinB) return pinB - pinA;

                  // 2. Recent activity (timestamp of last message)
                  const getLastMsgTime = (uId: string) => {
                    const userMsgs = messages.filter(m => 
                      (m.recipientId === currentUser.id && m.sender.id === uId) ||
                      (m.recipientId === uId && m.sender.id === currentUser.id)
                    );
                    return userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].timestamp : 0;
                  };
                  return getLastMsgTime(b.id) - getLastMsgTime(a.id);
                });

                if (sortedUsers.length === 0) {
                  return (
                    <div className="text-center py-8 px-4 text-gray-500 font-sans text-xs">
                      <p className="font-bold uppercase tracking-wider mb-1">Nenhum utilizador disponível</p>
                      <p className="text-[10px]">Envie um pedido de conversa na área social ou aguarde permissão.</p>
                    </div>
                  );
                }

                return sortedUsers.map((u) => {
                  const isSelected = selectedChatId === u.id;
                  const perm = getChatPermissionWith(u.id);
                  const isPinned = pinnedConversations.includes(u.id);
                  const isMuted = mutedConversations.includes(u.id);

                  // Retrieve last message
                  const userMsgs = messages.filter(m => 
                    (m.recipientId === currentUser.id && m.sender.id === u.id) ||
                    (m.recipientId === u.id && m.sender.id === currentUser.id)
                  );
                  const lastMsg = userMsgs[userMsgs.length - 1];
                  const lastMsgText = lastMsg 
                    ? (lastMsg.isDeleted ? '🚫 Mensagem apagada' : lastMsg.text)
                    : 'Nenhuma mensagem';
                  const lastMsgTime = lastMsg 
                    ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  // Unread messages count
                  const unreadCount = userMsgs.filter(m => 
                    m.recipientId === currentUser.id && 
                    m.sender.id === u.id && 
                    m.timestamp > (currentUser.lastReadChatTimestamp || 0)
                  ).length;

                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-2xl border transition-all relative flex flex-col gap-1 cursor-pointer group ${
                        unreadCount > 0 
                          ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/20 animate-pulse' 
                          : isSelected 
                            ? 'bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/10 text-white' 
                            : 'bg-gray-800/40 hover:bg-gray-800/80 border-gray-700/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div 
                          className="flex items-center gap-3 min-w-0 flex-grow"
                          onClick={() => {
                            setSelectedChatId(u.id);
                            setIsMobileChatActive(true);
                          }}
                        >
                          <div className="relative">
                            <UserAvatar 
                              src={u.avatar} 
                              status={isUserOnline(u)} 
                              nickname={u.nickname} 
                              className="w-10 h-10 rounded-xl" 
                            />
                            {isPinned && (
                              <div className="absolute -top-1 -left-1 bg-blue-500 text-white p-0.5 rounded-full border border-black shadow">
                                <Pin className="w-2.5 h-2.5 rotate-45" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{u.nickname}</p>
                              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{lastMsgTime}</span>
                            </div>

                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[11px] text-gray-400 font-medium truncate leading-relaxed">
                                {lastMsgText}
                              </p>
                              {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-1">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Quick Menu (Pin, Mute) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePinConversation(u.id)}
                            className={`p-1 rounded hover:bg-white/10 cursor-pointer transition-colors ${isPinned ? 'text-neon-cyan' : 'text-gray-500'}`}
                            title={isPinned ? 'Desafixar conversa' : 'Fixar conversa'}
                          >
                            <Pin className="w-3 h-3 rotate-45" />
                          </button>
                          <button
                            onClick={() => toggleMuteConversation(u.id)}
                            className={`p-1 rounded hover:bg-white/10 cursor-pointer transition-colors ${isMuted ? 'text-red-400' : 'text-gray-500'}`}
                            title={isMuted ? 'Ativar notificações' : 'Silenciar notificações'}
                          >
                            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Connection level capsule & Unread badge */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-1 select-none">
                        <span className={`text-[8px] px-1.5 py-0.5 border rounded-full font-bold uppercase tracking-wider ${getConnectionLayerColor(perm?.level || 'conhecido')}`}>
                          Nível: {getConnectionLayerLabel(perm?.level || 'conhecido')}
                        </span>
                        
                        {unreadCount > 0 && (
                          <span className="bg-[#00ff66] text-black border border-[#00ff88] font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_6px_rgba(0,255,102,0.4)]">
                            {unreadCount} {unreadCount === 1 ? 'mensagem' : 'mensagens'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Tab 2 content: Pedidos de Amizade e Conversa */}
        {activeTab === 'pedidos' && (
          <div className="flex-grow overflow-y-auto no-scrollbar p-3 space-y-4">
            
            {/* INCOMING RELATIONSHIP REQUESTS SECTION */}
            <div className="space-y-2">
              <h4 className="font-orbitron font-extrabold text-[10px] text-neon-magenta tracking-widest uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Pedidos de Amizade Social ({incomingFriendRequestsCount})
              </h4>

              {friendships.filter(f => f.receiverId === currentUser.id && f.status === 'pending').length === 0 ? (
                <p className="text-[11px] text-gray-500 font-bold uppercase text-center py-2 border border-dashed border-white/5 rounded-xl">Sem pedidos recebidos</p>
              ) : (
                friendships.filter(f => f.receiverId === currentUser.id && f.status === 'pending').map((friendReq) => {
                  const senderUser = users.find(u => u.id === friendReq.senderId);
                  if (!senderUser) return null;

                  return (
                    <div key={friendReq.id} className="p-2.5 bg-black/40 border border-neon-magenta/20 rounded-2xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar 
                          src={senderUser.avatar} 
                          status={isUserOnline(senderUser)} 
                          nickname={senderUser.nickname} 
                          className="w-8 h-8" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{senderUser.nickname}</p>
                          <p className="text-[8px] text-gray-500 font-mono">Pede amizade social</p>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleAcceptFriendship(friendReq)}
                          className="w-7 h-7 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-black border border-green-500/40 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                          title="Aceitar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectFriendship(friendReq)}
                          className="w-7 h-7 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                          title="Recusar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/5 my-3" />

            {/* INCOMING CHAT CONVERSATION REQUESTS */}
            <div className="space-y-3">
              <h4 className="font-orbitron font-extrabold text-[10px] text-neon-cyan tracking-widest uppercase flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Pedidos de Conversa ({incomingChatRequestsCount})
              </h4>

              {permissions.filter(p => p.receiverId === currentUser.id && p.status === 'pending').length === 0 ? (
                <p className="text-[11px] text-gray-500 font-bold uppercase text-center py-2 border border-dashed border-white/5 rounded-xl">Sem pedidos de conversa</p>
              ) : (
                permissions.filter(p => p.receiverId === currentUser.id && p.status === 'pending').map((chatReq) => {
                  const senderUser = users.find(u => u.id === chatReq.senderId);
                  if (!senderUser) return null;

                  return (
                    <div key={chatReq.id} className="p-3 bg-black/40 border border-neon-cyan/20 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar 
                          src={senderUser.avatar} 
                          status={isUserOnline(senderUser)} 
                          nickname={senderUser.nickname} 
                          className="w-8 h-8" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{senderUser.nickname}</p>
                          <p className="text-[8px] text-neon-cyan font-bold tracking-wide uppercase">Pede Conversa ({chatReq.duration})</p>
                        </div>
                      </div>

                      {/* Step-by-step Connection Layer selection on acceptance */}
                      {acceptingPermId === chatReq.id ? (
                        <div className="space-y-2.5 text-left border-t border-white/5 pt-2 animate-fadeIn">
                          <p className="text-[9px] text-[#00ff66] font-extrabold uppercase tracking-wide mb-1">
                            Escolha o nível de acesso e tempo para este utilizador:
                          </p>

                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">Definir Nível:</span>
                            <select
                              value={acceptingPermLevel}
                              onChange={(e: any) => setAcceptingPermLevel(e.target.value)}
                              className="bg-black border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white outline-none focus:border-neon-cyan cursor-pointer"
                            >
                              <option value="conhecido">🟢 Conhecido</option>
                              <option value="amigo">🔵 Amigo</option>
                              <option value="parceiro">🟣 Parceiro</option>
                              <option value="familia">🟠 Família</option>
                              <option value="equipe">🟡 Equipe</option>
                              <option value="vip">⭐ VIP</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">Duração:</span>
                            <select
                              value={acceptingPermDuration}
                              onChange={(e: any) => setAcceptingPermDuration(e.target.value)}
                              className="bg-black border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white outline-none focus:border-neon-cyan cursor-pointer"
                            >
                              <option value="24h">24 Horas</option>
                              <option value="48h">48 Horas</option>
                              <option value="7d">7 Dias</option>
                              <option value="permanent">Permanente</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-1 pt-1.5">
                            <button
                              onClick={() => {
                                setAcceptingPermId(null);
                              }}
                              className="py-1 px-1.5 bg-gray-500/10 hover:bg-gray-500 hover:text-white border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer transition-colors"
                            >
                              Voltar
                            </button>
                            <button
                              onClick={async () => {
                                await handleAcceptChatPermission(chatReq, acceptingPermLevel, acceptingPermDuration);
                                setAcceptingPermId(null);
                              }}
                              className="py-1 px-1.5 bg-green-500 text-black font-extrabold rounded-lg text-[9px] uppercase tracking-wider text-center cursor-pointer hover:bg-green-400 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)] animate-pulse"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5">
                          <button
                            onClick={() => {
                              setAcceptingPermId(chatReq.id);
                              setAcceptingPermLevel('conhecido');
                              setAcceptingPermDuration('48h');
                            }}
                            className="py-1 px-1.5 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-black border border-green-500/40 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer transition-colors"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => handleDeclineChatPermission(chatReq)}
                            className="py-1 px-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer transition-colors"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => handleIgnoreChatPermission(chatReq)}
                            className="py-1 px-1.5 bg-gray-500/20 hover:bg-gray-500 text-gray-400 hover:text-white border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer transition-colors"
                          >
                            Ignorar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/5 my-3" />

            {/* SENT REQUESTS LIST (FOR OVERVIEW) */}
            <div className="space-y-2">
              <h4 className="font-orbitron font-extrabold text-[10px] text-gray-500 tracking-widest uppercase">
                Pedidos Enviados por Si
              </h4>
              {friendships.filter(f => f.senderId === currentUser.id && f.status === 'pending').map((f) => {
                const targetU = users.find(u => u.id === f.receiverId);
                return (
                  <div key={f.id} className="p-2 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between text-xs text-gray-400">
                    <span className="font-bold">{targetU?.nickname}</span>
                    <span className="text-[9px] text-yellow-500 uppercase font-mono">👥 Amizade Pendente</span>
                  </div>
                );
              })}
              {permissions.filter(p => p.senderId === currentUser.id && p.status === 'pending').map((p) => {
                const targetU = users.find(u => u.id === p.receiverId);
                return (
                  <div key={p.id} className="p-2 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between text-xs text-gray-400">
                    <span className="font-bold">{targetU?.nickname}</span>
                    <span className="text-[9px] text-neon-cyan uppercase font-mono">💬 Conversa Pendente</span>
                  </div>
                );
              })}
              {friendships.filter(f => f.senderId === currentUser.id && f.status === 'pending').length === 0 &&
               permissions.filter(p => p.senderId === currentUser.id && p.status === 'pending').length === 0 && (
                <p className="text-[10px] text-gray-600 font-bold uppercase text-center py-1">Nenhum pedido pendente</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3 content: Grupos */}
        {activeTab === 'grupos' && (
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Search and Action Header */}
            <div className="p-3 border-b border-[var(--theme-border)] bg-black/10 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Pesquisar grupos..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="flex-grow bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl px-3.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-semibold transition-all shadow-inner"
                />
                <button
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar
                </button>
              </div>

              {/* Collapsible Create Group Form */}
              {showCreateGroup && (
                <div className="bg-black/30 border border-purple-500/20 rounded-2xl p-3 space-y-2.5 animate-fade-in text-left">
                  <p className="text-[10px] font-orbitron font-extrabold text-purple-400 uppercase tracking-widest">Novo Canal Temático</p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Nome do Grupo:</label>
                    <input
                      type="text"
                      placeholder="Ex: Estudo de Álgebra Linear"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-[var(--theme-bg-card)] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Descrição:</label>
                    <textarea
                      placeholder="Indique o objetivo académico ou foco do grupo..."
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className="w-full bg-[var(--theme-bg-card)] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-medium h-14 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold uppercase">Nível Mínimo:</label>
                      <select
                        value={newGroupMinLevel}
                        onChange={(e: any) => setNewGroupMinLevel(e.target.value)}
                        className="w-full bg-[var(--theme-bg-card)] border border-white/10 rounded-xl px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                      >
                        <option value="conhecido">🟢 Conhecido</option>
                        <option value="amigo">🔵 Amigo</option>
                        <option value="parceiro">🟣 Parceiro</option>
                        <option value="familia">🟠 Família</option>
                        <option value="equipe">🟡 Equipe</option>
                        <option value="vip">⭐ VIP</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold uppercase">Foto de Capa (URL):</label>
                      <input
                        type="text"
                        placeholder="URL da imagem..."
                        value={newGroupPhoto}
                        onChange={(e) => setNewGroupPhoto(e.target.value)}
                        className="w-full bg-[var(--theme-bg-card)] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setShowCreateGroup(false);
                        setNewGroupName('');
                        setNewGroupDesc('');
                      }}
                      className="px-2.5 py-1 text-[9px] text-gray-400 hover:text-white uppercase font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!newGroupName.trim()) {
                          alert("Por favor indique um nome para o grupo!");
                          return;
                        }
                        const newGroup = {
                          id: 'group_' + Math.random().toString(36).substring(2, 9),
                          name: newGroupName,
                          photo: newGroupPhoto,
                          description: newGroupDesc || 'Grupo temático sem descrição definida.',
                          minLevel: newGroupMinLevel,
                          admins: [currentUser.nickname],
                          mods: [],
                          participants: [currentUser.nickname],
                          rules: [
                            'Respeitar todos os membros e debater de forma saudável.',
                            'Não partilhar conteúdos ofensivos ou fora do âmbito.'
                          ],
                          invites: [],
                          files: []
                        };
                        const updated = [...groups, newGroup];
                        setGroups(updated);
                        localStorage.setItem('eo_groups_' + currentUser.id, JSON.stringify(updated));
                        setShowCreateGroup(false);
                        setNewGroupName('');
                        setNewGroupDesc('');
                        alert(`Grupo "${newGroupName}" criado com sucesso!`);
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Gravar Grupo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Groups */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1.5">
              {(() => {
                const filteredGroups = groups.filter(g => 
                  g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                  g.description.toLowerCase().includes(groupSearchQuery.toLowerCase())
                );

                if (filteredGroups.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      <p className="font-bold uppercase tracking-wider mb-1">Nenhum grupo encontrado</p>
                      <p className="text-[10px]">Crie um novo grupo para debater matérias!</p>
                    </div>
                  );
                }

                return filteredGroups.map((g) => {
                  const isSelected = selectedChatId === g.id;
                  const isMember = g.participants.includes(currentUser.nickname);
                  const minLevel = g.minLevel || 'conhecido';

                  return (
                    <div
                      key={g.id}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col gap-1.5 hover:bg-[var(--theme-bg-hover)] group ${
                        isSelected 
                          ? 'bg-[var(--theme-bg-hover)] border-purple-500/40 shadow-lg shadow-purple-500/5' 
                          : 'bg-black/10 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={g.photo} 
                          alt={g.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-2xl object-cover border border-white/10"
                        />
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">{g.name}</p>
                            <span className={`text-[8px] px-1.5 py-0.5 border rounded-full font-bold uppercase tracking-wider shrink-0 ${getConnectionLayerColor(minLevel)}`}>
                              Requer: {getConnectionLayerLabel(minLevel)}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5 leading-relaxed">
                            {g.description}
                          </p>
                        </div>
                      </div>

                      {/* Members info and Join button */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-1 text-[9px] font-medium text-gray-500 select-none">
                        <span>👥 {g.participants.length} membros</span>
                        
                        {isMember ? (
                          <button
                            onClick={() => {
                              setSelectedChatId(g.id);
                              setIsMobileChatActive(true);
                            }}
                            className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {isSelected ? 'Ativo' : 'Entrar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const updatedParticipants = [...g.participants, currentUser.nickname];
                              const updatedGroups = groups.map(item => 
                                item.id === g.id ? { ...item, participants: updatedParticipants } : item
                              );
                              setGroups(updatedGroups);
                              localStorage.setItem('eo_groups_' + currentUser.id, JSON.stringify(updatedGroups));
                              alert(`Aderiu com sucesso ao grupo "${g.name}"!`);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Aderir
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </aside>
      )}

      {/* COLUMN 2: ACTIVE CHAT PANEL */}
      {(chatLayoutTheme === 'division' || isMobileChatActive) && (
      <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl flex flex-col overflow-hidden h-[45vh] md:h-full shadow-2xl relative">
        
        {/* State A: No chat selected */}
        {selectedChatId === 'group' && currentChatMessages.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 select-none">
            <MessageSquare className="w-16 h-16 text-[var(--theme-accent)]/40 animate-pulse mb-4" />
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">Nenhuma mensagem no grupo</p>
          </div>
        )}

        {/* Header bar */}
        <div className="px-4 py-3 md:px-5 md:py-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex items-center justify-between shrink-0 select-none relative z-20">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {chatLayoutTheme === 'normal' && (
              <button
                onClick={() => setIsMobileChatActive(false)}
                className="mr-2 px-2.5 py-1.5 bg-black/30 hover:bg-[var(--theme-accent)] hover:text-black border border-[var(--theme-border)] text-white rounded-xl text-[10px] font-bold font-orbitron tracking-widest uppercase transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            )}

            {selectedChatId === 'group' ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/35 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[var(--theme-accent)]" />
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-xs text-[var(--theme-text-main)] tracking-widest uppercase flex items-center gap-2">
                    CONVERSAS DO GRUPO <ShieldCheck className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    {groupLives.length > 0 ? (
                      <span className="text-red-400 font-black flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" /> ● {groupLives.length}/4 EM VÍDEO LIVE</span>
                    ) : (
                      "Canal de Interação Pública"
                    )}
                  </p>
                </div>
              </div>
            ) : (
              activeChatUser && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar 
                    src={activeChatUser.avatar} 
                    status={isUserOnline(activeChatUser)} 
                    nickname={activeChatUser.nickname} 
                    className="w-8 h-8" 
                  />
                  <div className="min-w-0">
                    <h3 className="font-orbitron font-extrabold text-xs text-[var(--theme-text-main)] tracking-wider truncate uppercase">
                      {activeChatUser.nickname}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {activePermission?.active && activePermission.perm ? (
                        <span className={`text-[8px] px-1.5 py-0.5 border rounded-full font-bold uppercase tracking-wider ${getConnectionLayerColor(activePermission.perm.level)}`}>
                          Nível: {getConnectionLayerLabel(activePermission.perm.level)}
                        </span>
                      ) : (
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">🔒 Conversa Bloqueada</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Expiration Timer Countdown Indicator */}
            {selectedChatId !== 'group' && activePermission?.active && activePermission.perm && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[9px] font-semibold font-mono text-[var(--theme-accent)] rounded-full uppercase">
                <Clock className="w-3.5 h-3.5 text-[var(--theme-accent)] animate-spin-slow" />
                {activePermission.perm.duration === 'permanent' ? (
                  <span>Permanente</span>
                ) : (
                  <span>
                    {activePermission.perm.expiresAt && activePermission.perm.expiresAt - now > 0 ? (
                      (() => {
                        const diff = activePermission.perm.expiresAt - now;
                        const hrs = Math.floor(diff / 3600000);
                        const mins = Math.floor((diff % 3600000) / 60000);
                        const secs = Math.floor((diff % 60000) / 1000);
                        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                      })()
                    ) : (
                      'Expirado'
                    )}
                  </span>
                )}
              </div>
            )}

            {/* Search in Chat Toggle Button */}
            {selectedChatId && (
              <button
                onClick={() => {
                  setShowSearchInChat(!showSearchInChat);
                  if (showSearchInChat) {
                    setSearchInChatQuery('');
                  }
                }}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                  showSearchInChat 
                    ? 'bg-neon-cyan/25 border-neon-cyan text-neon-cyan' 
                    : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Pesquisar mensagens"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Customize Background Button */}
            {selectedChatId && (
              <button
                onClick={() => setShowBgCustomizer(true)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer transition-all text-gray-400 hover:text-white"
                title="Personalizar fundo do chat"
              >
                <Palette className="w-4 h-4" />
              </button>
            )}

            {/* Menu de Ações da Conversa (Three Dots) */}
            <div className="relative">
              <button
                onClick={() => setIsChatActionsMenuOpen(!isChatActionsMenuOpen)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer transition-all text-gray-400 hover:text-white"
                title="Ações da Conversa"
                id="conversation-actions-btn"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isChatActionsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-[#0a0a1a] border border-[var(--theme-border)] rounded-2xl p-2.5 shadow-2xl z-50 space-y-1 font-sans text-xs text-left text-white max-h-[80vh] overflow-y-auto no-scrollbar"
                  >
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1">Menu de Conversa</p>
                    
                    {/* Live Option (Only for group chat) */}
                    {selectedChatId === 'group' && (
                      isInGroupLive ? (
                        <button
                          onClick={() => {
                            handleLeaveLive();
                            setIsChatActionsMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-red-500/10 hover:text-red-400 text-red-500 rounded-xl transition-all font-bold flex items-center gap-2 uppercase tracking-wide cursor-pointer"
                        >
                          <VideoOff className="w-4 h-4" /> Sair da Live
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              handleJoinLive();
                              setIsChatActionsMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-2 hover:bg-white/5 text-gray-200 rounded-xl transition-all font-bold flex items-center gap-2 uppercase tracking-wide cursor-pointer"
                          >
                            <Video className="w-4 h-4 text-neon-cyan animate-pulse" /> Iniciar Live
                          </button>
                          {groupLives.length > 0 && (
                            <button
                              onClick={() => {
                                setIsChatActionsMenuOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 hover:bg-white/5 text-gray-200 rounded-xl transition-all font-bold flex items-center gap-2 uppercase tracking-wide cursor-pointer"
                            >
                              <Tv className="w-4 h-4 text-neon-magenta" /> Ver Live ({groupLives.length}/4)
                            </button>
                          )}
                        </>
                      )
                    )}

                    {selectedChatId !== 'group' && activeChatUser && (
                      <>
                        {/* Ver Perfil */}
                        <button
                          onClick={() => {
                            setIsChatActionsMenuOpen(false);
                            alert(`[EYES OPEN MZ - PERFIL ACADÉMICO]\n\nUtilizador: @${activeChatUser.nickname}\nNome Completo: ${activeChatUser.fullname || 'Não fornecido'}\nEstatuto Escolar: ${activeChatUser.academicStatus || 'Estudante'}\nNível na Comunidade: ${activeChatUser.reputationPoints || 100} pts`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-blue-400" /> Ver Perfil
                        </button>

                        {/* Silenciar Notificações */}
                        <button
                          onClick={() => {
                            toggleMuteConversation(activeChatUser.id);
                            setIsChatActionsMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          {mutedConversations.includes(activeChatUser.id) ? (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-green-400" /> Ativar Notificações
                            </>
                          ) : (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-red-400" /> Silenciar Notificações
                            </>
                          )}
                        </button>

                        {/* Pesquisar Mensagens */}
                        <button
                          onClick={() => {
                            setShowSearchInChat(true);
                            setIsChatActionsMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5 text-neon-cyan" /> Pesquisar Mensagens
                        </button>

                        {/* Limpar Conversa */}
                        <button
                          onClick={() => {
                            if (window.confirm("Deseja realmente limpar as mensagens desta conversa temporariamente para libertar cache visual?")) {
                              setMessages(prev => prev.filter(m => 
                                !((m.recipientId === currentUser.id && m.sender.id === activeChatUser.id) ||
                                  (m.recipientId === activeChatUser.id && m.sender.id === currentUser.id))
                              ));
                              setIsChatActionsMenuOpen(false);
                              alert("Mensagens de cache limpas com sucesso!");
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Limpar Conversa
                        </button>

                        {/* Eliminar Conversa */}
                        <button
                          onClick={() => {
                            if (window.confirm("Deseja eliminar definitivamente todo o histórico de mensagens desta conversa? Esta ação é irreversível.")) {
                              setMessages(prev => prev.filter(m => 
                                !((m.recipientId === currentUser.id && m.sender.id === activeChatUser.id) ||
                                  (m.recipientId === activeChatUser.id && m.sender.id === currentUser.id))
                              ));
                              setIsChatActionsMenuOpen(false);
                              alert("Histórico de mensagens eliminado localmente!");
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" /> Eliminar Conversa
                        </button>

                        {/* Exportar Conversa */}
                        <button
                          onClick={() => {
                            const chatHistory = currentChatMessages.map(m => {
                              const date = new Date(m.timestamp).toLocaleString();
                              return `[${date}] ${m.sender.nickname}: ${m.text}`;
                            }).join('\n');

                            const blob = new Blob([chatHistory], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `conversa_${activeChatUser.nickname}.txt`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setIsChatActionsMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-green-500" /> Exportar Conversa
                        </button>

                        {/* Bloquear Utilizador */}
                        <button
                          onClick={() => {
                            setIsChatActionsMenuOpen(false);
                            handleBlockUser(activeChatUser.id);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-400 text-red-500 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Bloquear Utilizador
                        </button>

                        {/* Denunciar */}
                        <button
                          onClick={() => {
                            const reason = prompt("Indique o motivo pedagógico da denúncia académica:");
                            if (reason) {
                              alert("Denúncia enviada à administração da Eyes Open MZ. Obrigado pelo seu contributo para uma comunidade segura.");
                            }
                            setIsChatActionsMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-orange-500/10 hover:text-orange-400 text-orange-500 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Denunciar Utilizador
                        </button>

                        {/* Encerrar Permissão de Conversa */}
                        <button
                          onClick={async () => {
                            if (window.confirm("Deseja encerrar temporariamente a permissão de conversa com este utilizador? O chat será trancado.")) {
                              const perm = getChatPermissionWith(activeChatUser.id);
                              if (perm) {
                                await dbDeleteChatPermission(perm.id).catch(console.error);
                              }
                              setSelectedChatId(null);
                              setIsChatActionsMenuOpen(false);
                              alert("Permissão de conversa encerrada.");
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-400 border-t border-white/5 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer mt-1 pt-2"
                        >
                          <Lock className="w-3.5 h-3.5 text-gray-500" /> Encerrar Permissão
                        </button>
                      </>
                    )}

                    <div className="border-t border-white/5 my-1" />

                    {/* Context Actions / Location */}
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1">Partilhas Rápidas</p>
                    <button
                      onClick={() => {
                        setIsChatActionsMenuOpen(false);
                        setSimulationModal({ type: 'location', requiredLevel: 'familia', targetUser: activeChatUser });
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-400 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-400" /> Partilhar Localização
                    </button>
                    <button
                      onClick={() => {
                        setIsChatActionsMenuOpen(false);
                        setSimulationModal({ type: 'file_share', requiredLevel: 'parceiro', targetUser: activeChatUser });
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 text-gray-400 rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider text-[10px] font-semibold cursor-pointer"
                    >
                      <Folder className="w-3.5 h-3.5 text-purple-400" /> Enviar Ficheiro
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Inline Message Search Bar */}
        {showSearchInChat && (
          <div className="px-4 py-2.5 bg-black/40 border-b border-[var(--theme-border)] flex items-center gap-2 shrink-0 animate-fade-in relative z-10">
            <Search className="w-3.5 h-3.5 text-neon-cyan shrink-0" />
            <input
              type="text"
              placeholder="Pesquisar nas mensagens desta conversa..."
              value={searchInChatQuery}
              onChange={(e) => setSearchInChatQuery(e.target.value)}
              className="flex-grow bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 font-semibold"
              autoFocus
            />
            {searchInChatQuery && (
              <button
                onClick={() => setSearchInChatQuery('')}
                className="text-[10px] text-neon-cyan hover:text-white font-bold uppercase cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => {
                setShowSearchInChat(false);
                setSearchInChatQuery('');
              }}
              className="text-[10px] text-gray-400 hover:text-white font-bold uppercase cursor-pointer pl-2 border-l border-white/10"
            >
              Fechar
            </button>
          </div>
        )}

        {/* GROUP VIDEO LIVE GRID (Up to 4 participants, random real-time online live) */}
        {selectedChatId === 'group' && groupLives.length > 0 && (
          <div className="p-3 bg-[#0d0d26]/90 border-b border-neon-cyan/25 shrink-0 select-none">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-orbitron font-black text-neon-cyan tracking-widest uppercase">
                  VÍDEO LIVE TRANSMISSÃO EM DIRETO ({groupLives.length}/4)
                </span>
              </div>
              <span className="text-[8px] text-gray-400 font-mono font-black uppercase">Grupo Aleatório Live</span>
            </div>

            {/* Grid Layout of video streams */}
            <div className={`grid gap-2 ${
              groupLives.length === 1 ? 'grid-cols-1' :
              groupLives.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {groupLives.map((participant) => {
                const isMe = participant.userId === currentUser.id;
                return (
                  <GroupLiveVideoBox
                    key={participant.userId}
                    participant={participant}
                    isMe={isMe}
                    localStream={localStream}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* MIDDLE CONTENT PANEL */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-black/25">
          
          {selectedChatId === 'group' ? (
            /* GROUP CHAT RENDER (Standard chat thread, public) */
            currentChatMessages.map((msg) => {
              const isMe = msg.sender.id === currentUser.id;
              return (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <img
                    src={msg.sender.avatar || "https://i.pravatar.cc/80?img=1"}
                    alt={msg.sender.name}
                    className="w-8 h-8 rounded-full border border-[var(--theme-border)] object-cover shrink-0"
                  />
                  <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 text-[10px] text-gray-500 ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-bold text-[var(--theme-accent)]">{msg.sender.name}</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.messageType === 'audio' ? (
                      <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-semibold relative ${
                        isMe 
                          ? 'bg-[var(--theme-accent)] text-white rounded-tr-none font-bold shadow-sm' 
                          : 'bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] text-[var(--theme-text-main)] rounded-tl-none font-medium'
                      }`}>
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Gravação de Voz ({msg.audioDuration}s)</span>
                          </div>
                          <audio src={msg.audioUrl} controls className="w-full h-8 outline-none filter invert brightness-200" />
                          {msg.transcribedText && (
                            <div className="bg-black/20 border border-white/5 rounded-lg p-2 mt-1 text-[11px] text-gray-300">
                              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Transcrição Automática:</p>
                              <p className="italic">"{msg.transcribedText}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`px-4 py-2 rounded-2xl text-xs leading-relaxed font-semibold relative ${
                        isMe 
                          ? 'bg-[var(--theme-accent)] text-white rounded-tr-none font-bold shadow-sm' 
                          : 'bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] text-[var(--theme-text-main)] rounded-tl-none font-medium'
                      } ${msg.text?.includes('@' + currentUser.nickname) ? 'border-2 border-red-500 animate-pulse bg-red-500/10 text-red-200' : ''}`}>
                        {msg.text?.includes('@' + currentUser.nickname) && (
                          <div className="text-[9px] font-orbitron font-extrabold text-red-400 mb-1 tracking-widest uppercase animate-pulse">
                            🚨 CHAMANDO VOCÊ (MENÇÃO)
                          </div>
                        )}
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* DIRECT MESSAGE PERMISSION ENGINE CHECKS */
            (() => {
              if (!activeChatUser) return null;
              const friendCheck = isSocialFriend(activeChatUser.id);
              const permCheck = hasChatPermission(activeChatUser.id);

              /* BLOCK LEVEL 1: SISTEMA 1 - AMIZADE SOCIAL */
              if (!friendCheck) {
                const frStatus = getFriendshipWith(activeChatUser.id);
                const isWeSender = frStatus?.senderId === currentUser.id;

                return (
                  <div className="flex flex-col justify-center items-center h-full max-w-sm mx-auto text-center space-y-5 p-6 border border-neon-magenta/20 rounded-3xl bg-black/40 shadow-xl my-6">
                    <Lock className="w-14 h-14 text-neon-magenta animate-pulse" />
                    <div className="space-y-2">
                      <h4 className="font-orbitron font-extrabold text-sm text-neon-magenta tracking-widest uppercase">Sistema 1 — Amizade Social</h4>
                      <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                        Para interagir de forma privada, ver o feed, comentar e curtir as publicações, é necessário que sejam amigos no feed social primeiro.
                      </p>
                    </div>

                    {currentUser.isGuest || currentUser.id === 'guest' ? (
                      <button
                        onClick={() => onGuestActionAttempt?.()}
                        className="text-[10px] uppercase text-yellow-500 font-bold bg-yellow-500/10 hover:bg-yellow-500/20 p-2.5 border border-yellow-500/25 rounded-xl w-full cursor-pointer transition-colors"
                      >
                        ⚠️ Convidados não podem enviar pedidos. Registe-se!
                      </button>
                    ) : frStatus ? (
                      isWeSender ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-bold rounded-xl uppercase tracking-wider w-full justify-center">
                          <Hourglass className="w-4 h-4 animate-spin-slow" /> Pedido de Amizade Enviado...
                        </div>
                      ) : (
                        <div className="p-3 bg-[#110525] border border-neon-magenta/30 rounded-2xl space-y-3 w-full">
                          <p className="text-[10px] text-neon-magenta font-black uppercase">{activeChatUser.nickname} enviou-lhe um pedido de amizade!</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleAcceptFriendship(frStatus)}
                              className="py-1.5 bg-green-500/20 hover:bg-green-500 hover:text-black border border-green-500/40 text-green-400 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={() => handleRejectFriendship(frStatus)}
                              className="py-1.5 bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/40 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleSendFriendshipRequest(activeChatUser)}
                        className="w-full py-2.5 bg-gradient-to-r from-neon-magenta to-[#9d00ff] hover:from-white hover:to-white hover:text-black text-white font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-neon-magenta/25"
                      >
                        <UserPlus className="w-4 h-4" /> Enviar Pedido de Amizade
                      </button>
                    )}
                  </div>
                );
              }

              /* BLOCK LEVEL 2: SISTEMA 2 - PERMISSÃO DE CONVERSA */
              if (!permCheck.active) {
                const isWeSender = permCheck.perm?.senderId === currentUser.id;
                const isWeReceiver = permCheck.perm?.receiverId === currentUser.id;
                const isPending = permCheck.perm?.status === 'pending';

                return (
                  <div className="flex flex-col justify-center items-center h-full max-w-md mx-auto text-center space-y-5 p-6 border border-neon-cyan/25 rounded-3xl bg-black/40 shadow-xl my-6">
                    <ShieldCheck className="w-14 h-14 text-neon-cyan animate-pulse" />
                    
                    <div className="space-y-2">
                      <h4 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase">Sistema 2 — Permissão de Conversa</h4>
                      
                      {permCheck.expired ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 font-bold leading-relaxed space-y-1">
                          <p className="flex items-center gap-1 w-full justify-center text-[10px] uppercase"><AlertTriangle className="w-4 h-4 text-red-500" /> A sua permissão de conversa expirou!</p>
                          <p className="text-[10px] font-medium text-gray-400 normal-case">
                            O período limite de autorização ({permCheck.perm?.duration}) acabou. O histórico de mensagens permanece visível, mas novas mensagens exigem uma nova autorização.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                          Amizade social aceite! No entanto, para conversar de forma direta, é necessário possuir uma Permissão de Conversa autorizada pelo destinatário.
                        </p>
                      )}
                    </div>

                    {isPending ? (
                      isWeSender ? (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl w-full text-center space-y-2">
                          <div className="flex items-center gap-1.5 justify-center text-yellow-500 text-xs font-bold uppercase tracking-wider">
                            <Hourglass className="w-4 h-4 animate-spin-slow" /> Pedido de conversa pendente
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal normal-case font-medium">
                            Solicitou um nível de conexão <span className="font-bold text-neon-cyan">"{getConnectionLayerLabel(permCheck.perm?.level || 'conhecido')}"</span> por <span className="font-bold text-neon-cyan">{permCheck.perm?.duration}</span>. Aguarde a aprovação de {activeChatUser.nickname}.
                          </p>
                        </div>
                      ) : (
                        isWeReceiver && (
                          <div className="p-4 bg-[#0d0d2b] border border-neon-cyan/35 rounded-2xl space-y-3.5 w-full text-left">
                            <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5 text-center justify-center">
                              <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" /> Pedido de Conversa de {activeChatUser.nickname}
                            </p>
                            
                            <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                              {activeChatUser.nickname} gostaria de iniciar uma conversa privada consigo. Escolha o nível de acesso e o tempo de validade do convite:
                            </p>

                            <div className="space-y-2 text-xs">
                              <div>
                                <label className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Nível de Acesso (Camada):</label>
                                <select
                                  value={selectedLevel}
                                  onChange={(e: any) => setSelectedLevel(e.target.value)}
                                  className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:border-neon-cyan outline-none font-semibold font-rajdhani"
                                >
                                  <option value="conhecido">🟢 Conhecido (Apenas Mensagens)</option>
                                  <option value="amigo">🔵 Amigo (+ Chamadas Voz/Vídeo)</option>
                                  <option value="parceiro">🟣 Parceiro de Projetos (+ Pastas/Arquivos)</option>
                                  <option value="familia">🟠 Família (+ Localização/Álbum)</option>
                                  <option value="equipe">🟡 Equipe (+ Canais/Tarefas)</option>
                                  <option value="vip">⭐ VIP (Conversas Prioritárias & Notificações)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Duração do Convite Temporário:</label>
                                <select
                                  value={selectedDuration}
                                  onChange={(e: any) => setSelectedDuration(e.target.value)}
                                  className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:border-neon-cyan outline-none font-semibold font-rajdhani"
                                >
                                  <option value="24h">24 Horas (Temporário)</option>
                                  <option value="48h">48 Horas (Temporário)</option>
                                  <option value="7d">7 Dias (Temporário)</option>
                                  <option value="permanent">Permanente (Sem limite)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                onClick={() => handleAcceptChatPermission(permCheck.perm!, selectedLevel, selectedDuration)}
                                className="py-2 bg-neon-cyan text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all uppercase cursor-pointer"
                              >
                                Autorizar
                              </button>
                              <button
                                onClick={() => handleDeclineChatPermission(permCheck.perm!)}
                                className="py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all uppercase cursor-pointer"
                              >
                                Recusar
                              </button>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="space-y-3.5 w-full text-left">
                        <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-3 rounded-2xl border border-white/5">
                          <div>
                            <label className="block text-[8px] text-gray-400 font-black uppercase mb-1">Nível Pretendido:</label>
                            <select
                              value={requestLevelInput}
                              onChange={(e: any) => setRequestLevelInput(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded px-1.5 py-1 text-[10px] text-white focus:border-neon-cyan font-semibold font-rajdhani"
                            >
                              <option value="conhecido">Conhecido 🟢</option>
                              <option value="amigo">Amigo 🔵</option>
                              <option value="parceiro">Parceiro 🟣</option>
                              <option value="familia">Família 🟠</option>
                              <option value="equipe">Equipe 🟡</option>
                              <option value="vip">VIP ⭐</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-gray-400 font-black uppercase mb-1">Duração:</label>
                            <select
                              value={requestDurationInput}
                              onChange={(e: any) => setRequestDurationInput(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded px-1.5 py-1 text-[10px] text-white focus:border-neon-cyan font-semibold font-rajdhani"
                            >
                              <option value="24h">24 Horas</option>
                              <option value="48h">48 Horas</option>
                              <option value="7d">7 Dias</option>
                              <option value="permanent">Permanente</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSendChatRequest(activeChatUser)}
                          className="w-full py-2.5 bg-gradient-to-r from-neon-cyan to-[#7a00ff] hover:from-white hover:to-white hover:text-black text-white font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-neon-cyan/20"
                        >
                          <Unlock className="w-4 h-4" /> Solicitar Permissão de Conversa
                        </button>
                      </div>
                    )}

                    {/* Historical message preview for expired chat */}
                    {permCheck.expired && currentChatMessages.length > 0 && (
                      <div className="w-full mt-4 text-left border-t border-white/5 pt-3">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">Visualização do Histórico (Bloqueado para novas mensagens)</p>
                        <div className="max-h-24 overflow-y-auto no-scrollbar space-y-2 p-2 bg-black/20 rounded-xl opacity-60">
                          {currentChatMessages.map((msg) => (
                            <p key={msg.id} className="text-[10px] leading-relaxed">
                              <span className="font-bold text-neon-cyan">{msg.sender.name}:</span> {msg.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              /* ACTIVE CHAT THREAD WITH PERMISSIONS */
              const level = permCheck.perm?.level || 'conhecido';

              return (
                <div className="space-y-4">
                  {/* Top Notification level capabilities info */}
                  <div className={`p-3 border rounded-2xl flex items-start gap-2.5 text-xs select-none ${getConnectionLayerColor(level)}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-current">Acesso {getConnectionLayerLabel(level)} Ativado!</p>
                      <p className="text-[10px] text-gray-300 mt-0.5 leading-normal">
                        {level === 'conhecido' && "Permissão limitada a envio de mensagens de texto apenas. Chamadas e partilha de ficheiros estão desativadas."}
                        {level === 'amigo' && "Autorizado a realizar chamadas de voz e vídeo com este utilizador."}
                        {level === 'parceiro' && "Acesso total a partilha de ficheiros, pastas de projetos e espaços de trabalho colaborativos."}
                        {level === 'familia' && "Acesso ativado para partilha de localização, álbuns de fotos e calendário familiar."}
                        {level === 'equipe' && "Autorizado para canais de grupo, gestão de tarefas e videoconferências de equipa."}
                        {level === 'vip' && "⭐ Prioridade de conversas ativada. Notificações destacadas em dourado e acesso a canais VIP."}
                      </p>
                    </div>
                  </div>

                  {/* Message bubbles thread */}
                  {currentChatMessages.map((msg) => {
                    const isMe = msg.sender.id === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                        <img
                          src={msg.sender.avatar || "https://i.pravatar.cc/80?img=1"}
                          alt={msg.sender.name}
                          className="w-8 h-8 rounded-xl border border-gray-700 object-cover shrink-0"
                        />
                        <div className="space-y-1">
                          <div className={`flex items-center gap-1.5 text-[10px] text-gray-400 ${isMe ? 'justify-end' : ''}`}>
                            <span className="font-bold text-blue-400">{msg.sender.name}</span>
                            <span className="flex items-center gap-0.5 text-gray-500">
                              <Clock className="w-2.5 h-2.5" />{' '}
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span className="flex items-center ml-1">
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" title="Mensagem lida pelo destinatário" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-gray-500" title="Mensagem entregue no dispositivo" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-gray-500" title="Mensagem enviada" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* Style bubbles based on message type (text vs. audio vs. simulated action) */}
                          {msg.messageType === 'audio' ? (
                            <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-semibold relative ${
                              isMe 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20 font-bold' 
                                : 'bg-gray-800/80 border border-gray-700/40 text-gray-100 rounded-tl-none font-medium'
                            }`}>
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <Mic className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                                  <span className="text-[10px] uppercase font-black tracking-wider text-gray-300">Gravação de Voz ({msg.audioDuration}s)</span>
                                </div>
                                <audio src={msg.audioUrl} controls className="w-full h-8 outline-none filter invert brightness-200" />
                                {msg.transcribedText && (
                                  <div className="bg-black/20 border border-white/5 rounded-lg p-2 mt-1 text-[11px] text-gray-300">
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Transcrição Automática:</p>
                                    <p className="italic">"{msg.transcribedText}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : msg.messageType === 'text' ? (
                            <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium relative ${
                              isMe 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-none font-bold shadow-lg shadow-blue-500/20' 
                                : 'bg-gray-800/80 border border-gray-700/40 text-gray-100 rounded-tl-none'
                            } ${msg.text?.includes('@' + currentUser.nickname) ? 'border-2 border-red-500 animate-pulse bg-red-500/10 text-red-200' : ''}`}>
                              {msg.text?.includes('@' + currentUser.nickname) && (
                                <div className="text-[9px] font-bold text-red-400 mb-1 tracking-widest uppercase animate-pulse">
                                  🚨 CHAMANDO VOCÊ (MENÇÃO)
                                </div>
                              )}
                              {msg.text}
                            </div>
                          ) : (
                            <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-semibold border ${
                              msg.messageType === 'call' ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' :
                              msg.messageType === 'file' ? 'bg-purple-500/10 border-purple-500/40 text-purple-300' :
                              msg.messageType === 'location' ? 'bg-orange-500/10 border-orange-500/40 text-orange-300' :
                              msg.messageType === 'calendar' ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' :
                              'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                {msg.messageType === 'call' && <Phone className="w-4 h-4 text-blue-400 animate-pulse" />}
                                {msg.messageType === 'file' && <Folder className="w-4 h-4 text-purple-400" />}
                                {msg.messageType === 'location' && <MapPin className="w-4 h-4 text-orange-400 animate-bounce" />}
                                {msg.messageType === 'calendar' && <Calendar className="w-4 h-4 text-amber-400" />}
                                {msg.messageType === 'task' && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                                <span className="font-bold uppercase tracking-wider text-[10px]">
                                  {msg.messageType === 'call' && 'Registo de Chamada'}
                                  {msg.messageType === 'file' && 'Ficheiro Partilhado'}
                                  {msg.messageType === 'location' && 'Partilha de Localização'}
                                  {msg.messageType === 'calendar' && 'Calendário Familiar'}
                                  {msg.messageType === 'task' && 'Registo de Tarefa'}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed font-medium">{msg.text}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
          <div ref={bottomRef} />
        </div>

        {/* BOTTOM INPUT CONTROLS / SIMULATOR PANELS */}
        <div className="p-3 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 select-none relative">
          
          {/* AUTOCOMPLETE MENTIONS DROPDOWN */}
          {showMentionSuggestions && (
            (() => {
              const matchedUsersForMention = users.filter(u => 
                u.id !== currentUser.id && 
                (u.nickname.toLowerCase().includes(mentionQuery.toLowerCase()) || 
                 u.fullname.toLowerCase().includes(mentionQuery.toLowerCase()))
              );

              if (matchedUsersForMention.length === 0) return null;

              return (
                <div className="absolute bottom-[100%] left-3 right-3 bg-[#0a0a1a] border border-[var(--theme-border)] rounded-2xl p-2 shadow-2xl z-40 max-h-40 overflow-y-auto space-y-1 mb-2">
                  <p className="text-[9px] font-bold text-[var(--theme-accent)] uppercase tracking-wider px-2 py-1">Chamando um Membro:</p>
                  {matchedUsersForMention.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectMention(u.nickname)}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-white/5 rounded-xl text-left text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar src={u.avatar} status={isUserOnline(u)} nickname={u.nickname} className="w-6 h-6" />
                        <div>
                          <p className="font-bold text-white">@{u.nickname}</p>
                          <p className="text-[9px] text-gray-500 font-medium">{u.fullname}</p>
                        </div>
                      </div>
                      <span className="text-[8px] bg-red-500/10 border border-red-500/30 text-red-400 font-orbitron font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                        Chamando @{u.nickname}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()
          )}

          {currentUser.isGuest || currentUser.id === 'guest' ? (
            <button
              onClick={() => onGuestActionAttempt?.()}
              className="p-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 rounded-xl text-center text-xs font-bold text-yellow-500 uppercase tracking-wider shrink-0 cursor-pointer transition-colors w-full"
            >
              ⚠️ Convidados não podem enviar mensagens no chat. Crie uma conta para participar!
            </button>
          ) : selectedChatId === 'group' ? (
            /* PUBLIC GROUP CHAT INPUT */
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Escreva a sua mensagem pública..."
                className="flex-grow bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-accent)] text-[var(--theme-text-main)] placeholder:text-gray-500 font-semibold"
              />
              <button
                type="submit"
                className="w-12 h-12 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </form>
          ) : (
            /* DIRECT CHAT PERMISSION CHECK SENDER */
            (() => {
              if (!activeChatUser) return null;
              const friendCheck = isSocialFriend(activeChatUser.id);
              const permCheck = hasChatPermission(activeChatUser.id);
              if (!friendCheck || !permCheck.active) return null; // blocked state inputs rendered above in middle

              const level = permCheck.perm?.level || 'conhecido';

              return (
                <div className="space-y-2.5">
                  {/* Action buttons list mapped to connection level */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    
                    {/* Level: Amigo voice/video calls */}
                    <button
                      type="button"
                      onClick={() => {
                        if (checkFeaturePermission(level, 'call')) {
                          setSimulationModal({ type: 'call_voice', targetUser: activeChatUser });
                        } else {
                          setSimulationModal({ type: 'blocked', requiredLevel: '🔵 Amigo', targetUser: activeChatUser });
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        checkFeaturePermission(level, 'call')
                          ? 'border-blue-500/40 hover:border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-black'
                          : 'border-white/5 bg-black/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Chamada Voz
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (checkFeaturePermission(level, 'call')) {
                          setSimulationModal({ type: 'call_video', targetUser: activeChatUser });
                        } else {
                          setSimulationModal({ type: 'blocked', requiredLevel: '🔵 Amigo', targetUser: activeChatUser });
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        checkFeaturePermission(level, 'call')
                          ? 'border-blue-500/40 hover:border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-black'
                          : 'border-white/5 bg-black/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" /> Vídeo-Chamada
                    </button>

                    {/* Level: Parceiro workspace files */}
                    <button
                      type="button"
                      onClick={() => {
                        if (checkFeaturePermission(level, 'files')) {
                          setSimulationModal({ type: 'file_share', targetUser: activeChatUser });
                        } else {
                          setSimulationModal({ type: 'blocked', requiredLevel: '🟣 Parceiro de Projetos', targetUser: activeChatUser });
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        checkFeaturePermission(level, 'files')
                          ? 'border-purple-500/40 hover:border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-black'
                          : 'border-white/5 bg-black/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" /> Enviar Ficheiro
                    </button>

                    {/* Level: Familia Map Location/Albums */}
                    <button
                      type="button"
                      onClick={() => {
                        if (checkFeaturePermission(level, 'family')) {
                          setSimulationModal({ type: 'location', targetUser: activeChatUser });
                        } else {
                          setSimulationModal({ type: 'blocked', requiredLevel: '🟠 Família', targetUser: activeChatUser });
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        checkFeaturePermission(level, 'family')
                          ? 'border-orange-500/40 hover:border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black'
                          : 'border-white/5 bg-black/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" /> Localização
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (checkFeaturePermission(level, 'family')) {
                          setSimulationModal({ type: 'calendar', targetUser: activeChatUser });
                        } else {
                          setSimulationModal({ type: 'blocked', requiredLevel: '🟠 Família', targetUser: activeChatUser });
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        checkFeaturePermission(level, 'family')
                          ? 'border-orange-500/40 hover:border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black'
                          : 'border-white/5 bg-black/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Calendário
                    </button>

                    {/* Level: Equipe Team Board */}
                    <button
                      type="button"
                      onClick={() => {
                        if (checkFeaturePermission(level, 'team')) {
                          setSimulationModal({ type: 'tasks', targetUser: activeChatUser });
                        } else {
                          setSimulationModal({ type: 'blocked', requiredLevel: '🟡 Equipe', targetUser: activeChatUser });
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                        checkFeaturePermission(level, 'team')
                          ? 'border-yellow-500/40 hover:border-yellow-500 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                          : 'border-white/5 bg-black/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Atribuir Tarefa
                    </button>
                  </div>

                  {/* Audio Recording Status / Controls Overlay */}
                  {isRecording && (
                    <div className="flex items-center justify-between gap-3 bg-red-950/20 border border-red-500/30 rounded-xl p-3 mb-2 animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-black uppercase text-red-400 font-mono">
                          Gravar: {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="px-3 py-1.5 bg-gray-500/10 hover:bg-red-500 hover:text-black border border-white/5 hover:border-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black border border-red-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Square className="w-3 h-3" /> Parar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Captured Voice Recording Preview Panel */}
                  {recordedBlob && (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 mb-2.5 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-neon-cyan animate-bounce" />
                          <span className="text-xs font-bold text-gray-300">Gravação Pronta para Envio ({recordingDuration}s)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setRecordedBlob(null); setRecordedUrl(''); setTranscriptionText(''); }}
                          className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Native Audio Player */}
                      <audio src={recordedUrl} controls className="w-full h-8 outline-none" />

                      {/* Transcribed Text Display (if available) */}
                      {isTranscribingState ? (
                        <div className="text-[10px] text-neon-cyan flex items-center gap-2 font-bold uppercase tracking-wider py-1">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" /> A converter voz em texto...
                        </div>
                      ) : transcriptionText ? (
                        <div className="bg-white/5 border border-white/5 rounded-lg p-2 text-[11px] text-gray-300">
                          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Transcrição Inteligente AI:</p>
                          <p className="italic font-semibold">"{transcriptionText}"</p>
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-white/5">
                        <button
                          type="button"
                          onClick={transcribeAudio}
                          disabled={isTranscribingState}
                          className="px-3 py-1.5 bg-purple-500/15 text-purple-400 hover:bg-purple-500 hover:text-black border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Converter em Texto
                        </button>
                        <button
                          type="button"
                          onClick={sendVoiceMessage}
                          className="px-3.5 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black border border-green-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                        >
                          Enviar Gravação
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message submit form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Attachment + button */}
                    <button
                      type="button"
                      onClick={() => setSimulationModal({ type: 'file_share', targetUser: activeChatUser })}
                      className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 text-gray-300 flex items-center justify-center cursor-pointer transition shrink-0"
                      title="Anexar Ficheiro / Recurso"
                    >
                      <Plus className="w-4 h-4 text-blue-400" />
                    </button>

                    {/* Image attachment button */}
                    <button
                      type="button"
                      onClick={() => setSimulationModal({ type: 'file_share', targetUser: activeChatUser })}
                      className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 text-gray-300 flex items-center justify-center cursor-pointer transition shrink-0"
                      title="Enviar Imagem ou Foto"
                    >
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                    </button>

                    {/* Mic button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isRecording || !!recordedBlob}
                      className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-red-500/20 border border-gray-700/50 hover:border-red-500/40 text-gray-300 hover:text-red-400 flex items-center justify-center cursor-pointer transition shrink-0 disabled:opacity-30 disabled:pointer-events-none"
                      title="Gravar Mensagem de Voz"
                    >
                      <Mic className="w-4 h-4 text-red-400" />
                    </button>

                    {/* Text Input */}
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Escreva uma mensagem..."
                        disabled={isRecording || !!recordedBlob}
                        className="w-full bg-gray-900/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-gray-100 placeholder:text-gray-500 font-medium disabled:opacity-50 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition cursor-pointer"
                        title="Emojis"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isRecording || !!recordedBlob || !inputText.trim()}
                      className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 hover:opacity-95 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-lg shadow-blue-500/25 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                      title="Enviar Mensagem"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </form>
                </div>
              );
            })()
          )}
        </div>
      </div>
      )}

      </div>

      {/* DETAILED SIMULATION MODAL (FOR ADVANCED FUNCTION ACTIONS) */}
      <AnimatePresence>
        {simulationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0c0c24] border-2 border-neon-cyan rounded-3xl p-6 shadow-3xl text-center space-y-4"
            >
              {/* Close */}
              <button
                onClick={() => setSimulationModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-950/20 border border-red-500/30 text-red-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* RENDER MODAL CONDITIONAL FOR TYPE */}
              {simulationModal.type === 'blocked' ? (
                <div className="space-y-4">
                  <Lock className="w-12 h-12 text-neon-magenta mx-auto animate-bounce mt-2" />
                  <h4 className="font-orbitron font-extrabold text-sm text-neon-magenta tracking-widest uppercase">FUNCIONALIDADE BLOQUEADA</h4>
                  <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                    Esta funcionalidade requer o nível de acesso <span className="text-neon-cyan font-bold">"{simulationModal.requiredLevel}"</span> ou superior.
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    O nível atual estabelecido pelo dono do perfil com {simulationModal.targetUser?.nickname} impede a ativação desta categoria de partilha.
                  </p>
                  <button
                    onClick={() => setSimulationModal(null)}
                    className="w-full py-2 bg-neon-magenta text-black font-orbitron font-black text-[10px] tracking-widest rounded-xl uppercase cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b border-neon-cyan/20 pb-3">
                    {simulationModal.type === 'call_voice' && <Phone className="w-6 h-6 text-blue-400 animate-pulse" />}
                    {simulationModal.type === 'call_video' && <Video className="w-6 h-6 text-blue-400 animate-pulse" />}
                    {simulationModal.type === 'file_share' && <Folder className="w-6 h-6 text-purple-400" />}
                    {simulationModal.type === 'location' && <MapPin className="w-6 h-6 text-orange-400" />}
                    {simulationModal.type === 'calendar' && <Calendar className="w-6 h-6 text-amber-400" />}
                    {simulationModal.type === 'tasks' && <CheckCircle2 className="w-6 h-6 text-yellow-400" />}
                    <h3 className="font-orbitron font-extrabold text-xs text-neon-cyan tracking-wider uppercase">
                      {simulationModal.type === 'call_voice' && 'Chamada de Voz'}
                      {simulationModal.type === 'call_video' && 'Vídeo-Chamada'}
                      {simulationModal.type === 'file_share' && 'Enviar Ficheiro'}
                      {simulationModal.type === 'location' && 'Partilhar Localização'}
                      {simulationModal.type === 'calendar' && 'Calendário de Família'}
                      {simulationModal.type === 'tasks' && 'Atribuição de Tarefa'}
                    </h3>
                  </div>

                  {/* Custom inputs based on actions */}
                  {simulationModal.type === 'call_voice' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-300 font-semibold leading-relaxed">Iniciar chamada de voz encriptada com {simulationModal.targetUser?.nickname}?</p>
                      <div className="flex items-center gap-2 justify-center py-4 bg-black/40 rounded-2xl border border-blue-500/10">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping" />
                        <span className="text-xs font-mono text-blue-400 font-bold">A Ligar de forma segura...</span>
                      </div>
                      <button
                        onClick={() => executeSimulatedAction('call_voice', `📞 Chamada de Voz efetuada (Duração: 12 minutos)`)}
                        className="w-full py-2 bg-blue-500 hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer text-center"
                      >
                        Simular Resposta & Concluir
                      </button>
                    </div>
                  )}

                  {simulationModal.type === 'call_video' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-300 font-semibold leading-relaxed">Iniciar videochamada HD encriptada com {simulationModal.targetUser?.nickname}?</p>
                      <div className="aspect-video bg-black/50 border border-blue-500/20 rounded-2xl flex items-center justify-center text-xs text-gray-400 font-mono">
                        [ Câmara Ativa: Eyes Open Engine ]
                      </div>
                      <button
                        onClick={() => executeSimulatedAction('call_video', `📹 Vídeo-Chamada HD efetuada com sucesso`)}
                        className="w-full py-2 bg-blue-500 hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer text-center"
                      >
                        Simular Resposta & Concluir
                      </button>
                    </div>
                  )}

                  {simulationModal.type === 'file_share' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-300 font-semibold mb-1">Selecione o ficheiro de projeto para carregar para a pasta partilhada:</p>
                      <select id="sim_file_picker" className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-neon-cyan font-semibold font-rajdhani">
                        <option value="guião_filme_maputo.pdf">📄 guião_filme_maputo.pdf (4.8 MB)</option>
                        <option value="orçamento_produção_eyes.xlsx">📊 orçamento_produção_eyes.xlsx (1.2 MB)</option>
                        <option value="storyboard_cena_1.jpg">🖼️ storyboard_cena_1.jpg (2.5 MB)</option>
                        <option value="banda_sonora_master.wav">🎵 banda_sonora_master.wav (24.0 MB)</option>
                      </select>
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sim_file_picker') as HTMLSelectElement)?.value || 'ficheiro_projeto.pdf';
                          executeSimulatedAction('file_share', `📁 Partilhou o ficheiro: "${val}" na pasta de projetos partilhada.`);
                        }}
                        className="w-full py-2 bg-purple-500 hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer text-center"
                      >
                        Carregar Ficheiro
                      </button>
                    </div>
                  )}

                  {simulationModal.type === 'location' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-300 font-semibold mb-1">Selecione as coordenadas para partilha em tempo real:</p>
                      <select id="sim_loc_picker" className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-neon-cyan font-semibold font-rajdhani">
                        <option value="Maputo (Latitude: -25.9692, Longitude: 32.5732)">📍 Maputo, Moçambique</option>
                        <option value="Beira (Latitude: -19.8436, Longitude: 34.8722)">📍 Beira, Sofala</option>
                        <option value="Nampula (Latitude: -15.1165, Longitude: 39.2632)">📍 Nampula, Província de Nampula</option>
                      </select>
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sim_loc_picker') as HTMLSelectElement)?.value || 'Coordenadas Maputo';
                          executeSimulatedAction('location', `📍 Localização Partilhada: ${val}`);
                        }}
                        className="w-full py-2 bg-orange-500 hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer text-center"
                      >
                        Enviar Coordenadas
                      </button>
                    </div>
                  )}

                  {simulationModal.type === 'calendar' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-300 font-semibold mb-1">Selecione o evento para o Calendário Familiar:</p>
                      <select id="sim_cal_picker" className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-neon-cyan font-semibold font-rajdhani">
                        <option value="Almoço de Família - Domingo às 13:00">📅 Almoço de Família (Domingo, 13:00)</option>
                        <option value="Aniversário de Casamento - 15 de Outubro">🎉 Aniversário de Casamento (15 de Outubro)</option>
                        <option value="Férias de Verão - Maputo">✈️ Férias de Verão (Dezembro)</option>
                      </select>
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sim_cal_picker') as HTMLSelectElement)?.value || 'Evento';
                          executeSimulatedAction('calendar', `📅 Adicionou evento familiar: "${val}" ao calendário familiar partilhado.`);
                        }}
                        className="w-full py-2 bg-orange-500 hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer text-center"
                      >
                        Agendar Evento
                      </button>
                    </div>
                  )}

                  {simulationModal.type === 'tasks' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-300 font-semibold mb-1">Defina a tarefa profissional de equipa:</p>
                      <input
                        type="text"
                        id="sim_task_picker"
                        placeholder="Ex: Concluir montagem da cena 5..."
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-neon-cyan font-semibold font-rajdhani"
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sim_task_picker') as HTMLInputElement)?.value || 'Concluir montagem';
                          executeSimulatedAction('tasks', `📋 Nova Tarefa: "${val}" atribuída por ${currentUser.nickname}.`);
                        }}
                        className="w-full py-2 bg-yellow-500 hover:bg-white text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer text-center"
                      >
                        Atribuir à Equipe
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE STORY VIEWER MODAL */}
      <AnimatePresence>
        {activeStoryViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#131C31] border border-blue-500/30 rounded-3xl p-5 shadow-2xl text-center space-y-4 overflow-hidden"
            >
              {/* Progress bar animation indicator */}
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={() => setActiveStoryViewer(null)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full"
                />
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between text-left border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-3">
                  <img src={activeStoryViewer.avatar} className="w-10 h-10 rounded-xl object-cover border border-blue-500/40" alt={activeStoryViewer.name} />
                  <div>
                    <p className="font-bold text-xs text-white">{activeStoryViewer.name}</p>
                    <p className="text-[10px] text-gray-400">{activeStoryViewer.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryViewer(null)}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Story Content */}
              <div className="space-y-3 py-2">
                {activeStoryViewer.image && (
                  <img src={activeStoryViewer.image} className="w-full max-h-64 object-cover rounded-2xl border border-gray-700/50 shadow-md" alt="Story" />
                )}
                <p className="text-sm text-gray-100 font-medium leading-relaxed px-2">
                  "{activeStoryViewer.text}"
                </p>
              </div>

              {/* Reply Input */}
              <div className="pt-2 border-t border-gray-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Responder a ${activeStoryViewer.name}...`}
                  className="flex-grow bg-gray-900 border border-gray-700/60 rounded-xl px-3.5 py-2 text-xs text-gray-200 outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    alert(`Mensagem enviada a ${activeStoryViewer.name}!`);
                    setActiveStoryViewer(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
                >
                  Enviar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD NEW STORY MODAL */}
      <AnimatePresence>
        {showAddStoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#131C31] border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" /> Publicar no Status & Destaques
                </h3>
                <button
                  onClick={() => setShowAddStoryModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Texto / Legenda do Destaque:</label>
                  <textarea
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    placeholder="O que está a acontecer hoje no seu dia?"
                    className="w-full bg-gray-900 border border-gray-700/60 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">URL da Imagem (Opcional):</label>
                  <input
                    type="text"
                    value={newStoryImageUrl}
                    onChange={(e) => setNewStoryImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-gray-900 border border-gray-700/60 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Preset image selector suggestions */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Escolher do Álbum:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
                      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
                    ].map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        onClick={() => setNewStoryImageUrl(img)}
                        className={`h-16 w-full object-cover rounded-xl cursor-pointer border-2 transition ${
                          newStoryImageUrl === img ? 'border-blue-500 scale-105' : 'border-gray-700 hover:border-blue-400'
                        }`}
                        alt="Preset"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (!newStoryText.trim()) return alert('Insira um texto para o seu destaque!');
                    const storyObj = {
                      id: 'story_' + Date.now(),
                      userId: currentUser.id,
                      name: currentUser.nickname,
                      avatar: currentUser.avatar || 'https://i.pravatar.cc/80?img=1',
                      text: newStoryText,
                      image: newStoryImageUrl || undefined,
                      time: 'Agora'
                    };
                    const updated = [storyObj, ...userStories];
                    setUserStories(updated);
                    localStorage.setItem('eo_user_stories', JSON.stringify(updated));
                    setShowAddStoryModal(false);
                    setNewStoryText('');
                    setNewStoryImageUrl('');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition cursor-pointer uppercase tracking-wider"
                >
                  Publicar Status
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupLiveVideoBox({ participant, isMe, localStream }: { participant: any; isMe: boolean; localStream: any; key?: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isMe && localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [isMe, localStream]);

  // Audio wave bar animation simulator
  const [audioBars, setAudioBars] = useState<number[]>([10, 20, 15, 30, 12]);
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioBars(Array.from({ length: 5 }, () => Math.floor(Math.random() * 35) + 5));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative aspect-video rounded-2xl bg-[#030310] border border-neon-cyan/20 overflow-hidden flex flex-col justify-center items-center group shadow-2xl">
      {isMe && localStream ? (
        /* Real Web Camera Video element */
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        />
      ) : (
        /* Styled Camera Stream Simulation */
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c2a] via-[#05051a] to-[#12002b] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Glowing Avatar */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-neon-cyan/25 blur-xl animate-pulse" />
              <img
                src={participant.avatar}
                alt={participant.nickname}
                className="w-14 h-14 rounded-full border-2 border-neon-cyan/60 object-cover relative z-10 shadow-[0_0_15px_rgba(0,245,255,0.2)]"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#05051a] rounded-full z-20 animate-pulse"></span>
            </div>
            <p className="text-[11px] font-orbitron font-extrabold text-neon-cyan mt-2 relative z-10 tracking-widest uppercase">
              {participant.nickname}
            </p>
          </div>
        </div>
      )}

      {/* Overlays / Camera Stats */}
      <div className="absolute inset-0 flex flex-col justify-between p-2.5 pointer-events-none z-20">
        <div className="flex items-center justify-between">
          <div className="px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono font-bold text-red-500 uppercase flex items-center gap-1 border border-red-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
          </div>
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono text-gray-400 font-bold">
            {isMe ? 'WEBCAM ATIVA' : 'CONECTOR HD'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          {/* Audio levels dynamic indicator */}
          <div className="flex items-end gap-0.5 h-4 px-1.5 py-0.5 rounded bg-black/50 border border-white/5">
            {audioBars.map((val, idx) => (
              <div
                key={idx}
                className="w-0.5 bg-green-400 rounded-t transition-all duration-100"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
          <span className="text-[8px] font-bold text-neon-cyan/60 uppercase tracking-wider font-orbitron">
            {isMe ? '@meu_feed' : `@${participant.nickname}`}
          </span>
        </div>
      </div>
    </div>
  );
}

