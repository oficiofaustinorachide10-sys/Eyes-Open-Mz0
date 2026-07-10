/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, Clock, UserPlus, UserCheck, Lock, Unlock, 
  Hourglass, Phone, Video, FileUp, MapPin, Calendar, Award, Folder, Play, Check, 
  X, HelpCircle, Briefcase, Radio, AlertTriangle, Sparkles, Star, Users, CheckCircle2, UserX, Plus,
  MoreVertical, Settings, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Friendship, ChatPermission, Notification } from '../types';
import { UserAvatar } from './UserAvatar';
import { 
  subscribeChats, dbSendMessage, dbUpdateUser, subscribeUsers,
  subscribeFriendships, dbCreateFriendship, dbUpdateFriendship, dbDeleteFriendship,
  subscribeChatPermissions, dbCreateChatPermission, dbUpdateChatPermission, dbDeleteChatPermission,
  dbCreateNotification, subscribeGroupLives, dbJoinGroupLive, dbLeaveGroupLive
} from '../lib/db';

interface ChatViewProps {
  currentUser: User;
  initialSelectedChatId?: string;
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
  messageType?: 'text' | 'call' | 'file' | 'location' | 'calendar' | 'task';
}

export default function ChatView({ currentUser, initialSelectedChatId }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
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
  const [activeTab, setActiveTab] = useState<'conversas' | 'pedidos'>('conversas');
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

  // Mentions / Chamar states
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

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
    if (currentUser.id === 'guest') {
      alert('Como convidado, necessita de uma conta para aceder à Live Vídeo. Vamos direcioná-lo para criar uma conta!');
      localStorage.removeItem('currentUser');
      window.location.reload();
      return;
    }

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
    if (currentUser.id === 'guest') return;
    const docId = `${currentUser.id}_${targetUser.id}`;
    const newFriendship: Friendship = {
      id: docId,
      senderId: currentUser.id,
      receiverId: targetUser.id,
      status: 'pending',
      timestamp: Date.now()
    };
    await dbCreateFriendship(newFriendship);

    // Create Notification
    const notif: Notification = {
      id: 'notif_friend_' + Math.random().toString(36).substring(2, 9),
      recipientId: targetUser.id,
      title: 'Pedido de Amizade Social 👥',
      text: `${currentUser.nickname} enviou-lhe um pedido de amizade social no Feed.`,
      type: 'friend_request',
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
    if (currentUser.id === 'guest') return;
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

  const handleAcceptChatPermission = async (perm: ChatPermission) => {
    let durationMs = 0;
    if (selectedDuration === '24h') durationMs = 24 * 60 * 60 * 1000;
    else if (selectedDuration === '48h') durationMs = 48 * 60 * 60 * 1000;
    else if (selectedDuration === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;

    const acceptedAt = Date.now();
    const expiresAt = selectedDuration === 'permanent' ? null : acceptedAt + durationMs;

    const updated: ChatPermission = {
      ...perm,
      status: 'accepted',
      duration: selectedDuration,
      level: selectedLevel,
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
      text: `${currentUser.nickname} autorizou a conversa como "${getConnectionLayerLabel(selectedLevel)}" por ${selectedDuration}.`,
      type: 'chat_accepted',
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
    if (currentUser.id === 'guest') return;

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
    if (selectedChatId === 'group') {
      return !msg.recipientId;
    } else {
      return (msg.recipientId === currentUser.id && msg.sender.id === selectedChatId) ||
             (msg.recipientId === selectedChatId && msg.sender.id === currentUser.id);
    }
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
      
      {/* GLOBAL CHAT VIEWS TOP HEADER */}
      <div className="flex items-center justify-between bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl px-4 py-2.5 shadow-md shrink-0 relative">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--theme-accent)]" />
          <div>
            <h2 className="font-orbitron font-extrabold text-xs tracking-widest uppercase text-[var(--theme-text-main)]">Central de Conversas</h2>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              Modo Layout: {chatLayoutTheme === 'normal' ? 'Normal (Mobile/Focado)' : 'Divisão (Split-View)'}
            </p>
          </div>
        </div>

        {/* Action controls (Three-Dots Menu) */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-lg bg-[var(--theme-bg-hover)] hover:bg-[var(--theme-border)] border border-[var(--theme-border)] flex items-center justify-center cursor-pointer transition-all text-gray-400 hover:text-white animate-pulse"
            title="Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Settings Menu Dropdown */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-[#0a0a1a] border border-[var(--theme-border)] rounded-2xl p-3 shadow-2xl z-50 space-y-2.5 font-sans"
              >
                {/* Definições Option */}
                <div 
                  onClick={() => setIsDefinitionsOpen(!isDefinitionsOpen)}
                  className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl cursor-pointer text-xs font-bold text-gray-200 uppercase tracking-wider transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-[var(--theme-accent)]" /> Definições
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">{isDefinitionsOpen ? '▾' : '▸'}</span>
                </div>

                {/* Submenu: Temas de Conversa */}
                {isDefinitionsOpen && (
                  <div className="border-t border-white/5 pt-2 pl-2 space-y-2">
                    <p className="text-[9px] font-bold text-[var(--theme-accent)] uppercase tracking-wider">Temas de Conversa</p>
                    
                    <button
                      onClick={() => {
                        changeChatLayoutTheme('normal');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-all border text-xs ${
                        chatLayoutTheme === 'normal'
                          ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-accent)]'
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
                          ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-accent)]'
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
      </div>

      {/* Main columns wrapper */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 h-full overflow-hidden">
        
        {/* COLUMN 1: SIDEBAR USER LIST & REQUESTS */}
        {(chatLayoutTheme === 'division' || !isMobileChatActive) && (
          <div className="w-full md:w-80 shrink-0 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl flex flex-col overflow-hidden h-[45vh] md:h-full shadow-2xl relative">
        
        {/* Sidebar tabs */}
        <div className="grid grid-cols-2 border-b border-[var(--theme-border)] font-orbitron font-extrabold text-[11px] tracking-wider text-center select-none shrink-0">
          <button
            onClick={() => setActiveTab('conversas')}
            className={`py-3.5 flex items-center justify-center gap-1.5 transition-colors uppercase cursor-pointer ${
              activeTab === 'conversas' 
                ? 'bg-[var(--theme-bg-hover)] border-b-2 border-[var(--theme-accent)] text-[var(--theme-accent)] font-black' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Conversas
          </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`py-3.5 flex items-center justify-center gap-1.5 transition-colors uppercase relative cursor-pointer ${
              activeTab === 'pedidos' 
                ? 'bg-[var(--theme-bg-hover)] border-b-2 border-[var(--theme-accent-secondary)] text-[var(--theme-accent-secondary)] font-black' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" /> Pedidos
            {totalRequestsCount > 0 && (
              <span className="absolute top-2 right-4 flex h-4 min-w-4 px-1 items-center justify-center text-[8px] font-black bg-[var(--theme-accent-secondary)] text-white rounded-full animate-bounce">
                {totalRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1 content: Conversas e Utilizadores */}
        {activeTab === 'conversas' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search filter input */}
            <div className="p-3 border-b border-[var(--theme-border)] shrink-0">
              <input
                type="text"
                placeholder="Pesquisar utilizador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--theme-accent)] text-[var(--theme-text-main)] placeholder:text-gray-500 font-semibold font-rajdhani"
              />
            </div>

            {/* Conversation list */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
              {/* Group chat item */}
              <button
                onClick={() => {
                  setSelectedChatId('group');
                  setIsMobileChatActive(true);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group cursor-pointer ${
                  selectedChatId === 'group'
                    ? 'bg-[var(--theme-bg-hover)] border-[var(--theme-accent)] text-[var(--theme-accent)] shadow-sm'
                    : 'bg-black/10 border-white/5 hover:border-[var(--theme-accent)]/30 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[var(--theme-accent)] p-[1.5px] shadow-sm">
                    <div className="w-full h-full rounded-full bg-[var(--theme-bg-card)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--theme-accent)] group-hover:scale-105 transition-transform" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-orbitron font-extrabold text-[11px] tracking-wider uppercase leading-none text-[var(--theme-text-main)]">CONVERSA DO GRUPO</p>
                    <p className="text-[10px] text-gray-400 font-bold tracking-tight mt-1 truncate max-w-[120px]">Interação de comunidade</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] rounded-full uppercase font-bold tracking-wider shrink-0">Público</span>
              </button>

              <div className="border-t border-[var(--theme-border)] my-2" />
              <p className="text-[10px] text-[var(--theme-accent)]/70 font-bold tracking-widest font-orbitron uppercase px-2 mb-1.5">Direct Messages</p>

              {/* Direct message items */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 uppercase font-bold tracking-wider">Nenhum utilizador encontrado</div>
              ) : (
                filteredUsers.map((u) => {
                  const isFriend = isSocialFriend(u.id);
                  const chatPerm = hasChatPermission(u.id);
                  const isSelected = selectedChatId === u.id;

                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedChatId(u.id);
                        setIsMobileChatActive(true);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--theme-bg-hover)] border-[var(--theme-accent)] text-[var(--theme-accent)] shadow-sm'
                          : 'bg-black/10 border-white/5 hover:border-[var(--theme-accent)]/20 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar 
                          src={u.avatar} 
                          status={isUserOnline(u)} 
                          nickname={u.nickname} 
                          className="w-9 h-9" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight text-[var(--theme-text-main)]">{u.nickname}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {/* Friendship Badge */}
                            {isFriend ? (
                              <span className="text-[8px] text-[var(--theme-accent)] font-bold flex items-center gap-0.5 uppercase tracking-tight">
                                <Check className="w-2 h-2 text-[var(--theme-accent)]" /> Amigo Social
                              </span>
                            ) : (
                              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Não amigo</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conversation Permissions indicator badge */}
                      <div className="flex flex-col items-end shrink-0">
                        {chatPerm.active && chatPerm.perm ? (
                          <span className={`text-[8px] px-1.5 py-0.5 border rounded-full font-bold uppercase tracking-wide ${getConnectionLayerColor(chatPerm.perm.level)}`}>
                            {chatPerm.perm.level === 'conhecido' ? '🟢 Conhecido' : chatPerm.perm.level === 'amigo' ? '🔵 Amigo' : chatPerm.perm.level === 'parceiro' ? '🟣 Parceiro' : chatPerm.perm.level === 'familia' ? '🟠 Família' : chatPerm.perm.level === 'equipe' ? '🟡 Equipe' : '⭐ VIP'}
                          </span>
                        ) : chatPerm.expired ? (
                          <span className="text-[8px] px-1.5 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400 rounded-full font-bold uppercase tracking-wide flex items-center gap-0.5">
                            <Lock className="w-2 h-2" /> Expirado
                          </span>
                        ) : (
                          <span className="text-[8px] px-1.5 py-0.5 border border-white/10 bg-white/5 text-gray-400 rounded-full font-bold uppercase tracking-wide flex items-center gap-0.5">
                            <Lock className="w-2 h-2" /> Bloqueado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
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

                      {/* Dropdowns to customize connection layers on acceptance */}
                      <div className="space-y-1.5 text-left border-t border-white/5 pt-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">Definir Nível:</span>
                          <select
                            value={selectedLevel}
                            onChange={(e: any) => setSelectedLevel(e.target.value)}
                            className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-white outline-none focus:border-neon-cyan"
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
                            value={selectedDuration}
                            onChange={(e: any) => setSelectedDuration(e.target.value)}
                            className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-white outline-none focus:border-neon-cyan"
                          >
                            <option value="24h">24 Horas</option>
                            <option value="48h">48 Horas</option>
                            <option value="7d">7 Dias</option>
                            <option value="permanent">Permanente</option>
                          </select>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          onClick={() => handleAcceptChatPermission(chatReq)}
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
      </div>
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
        <div className="px-4 py-3 md:px-5 md:py-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex items-center justify-between shrink-0 select-none">
          {chatLayoutTheme === 'normal' && (
            <button
              onClick={() => setIsMobileChatActive(false)}
              className="mr-3 px-2.5 py-1.5 bg-black/30 hover:bg-[var(--theme-accent)] hover:text-black border border-[var(--theme-border)] text-white rounded-xl text-[10px] font-bold font-orbitron tracking-widest uppercase transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
          )}
          {selectedChatId === 'group' ? (
            <div className="flex items-center justify-between w-full">
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

              {/* Live Video Button */}
              <div className="flex items-center gap-2">
                {isInGroupLive ? (
                  <button
                    onClick={handleLeaveLive}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-orbitron font-extrabold text-[10px] tracking-wider rounded-xl uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 animate-pulse" /> Sair da Live
                  </button>
                ) : (
                  <button
                    onClick={handleJoinLive}
                    className="px-3 py-1.5 bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 text-black font-orbitron font-extrabold text-[10px] tracking-wider rounded-xl uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" /> Entrar na Live
                  </button>
                )}
              </div>
            </div>
          ) : (
            activeChatUser && (
              <div className="flex items-center justify-between w-full">
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

                {/* Expiration Timer Countdown Indicator */}
                {activePermission?.active && activePermission.perm && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[9px] font-semibold font-mono text-[var(--theme-accent)] rounded-full uppercase shrink-0">
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
              </div>
            )
          )}
        </div>

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

                    {currentUser.id === 'guest' ? (
                      <div className="text-[10px] uppercase text-yellow-500 font-bold bg-yellow-500/10 p-2.5 border border-yellow-500/25 rounded-xl w-full">
                        ⚠️ Convidados não podem enviar pedidos. Registe-se!
                      </div>
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
                                onClick={() => handleAcceptChatPermission(permCheck.perm!)}
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

                          {/* Style bubbles based on message type (text vs. simulated action) */}
                          {msg.messageType === 'text' ? (
                            <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold relative ${
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

          {currentUser.id === 'guest' ? (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-center text-xs font-bold text-yellow-500 uppercase tracking-wider shrink-0">
              ⚠️ Convidados não podem enviar mensagens no chat. Crie uma conta para participar!
            </div>
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

                  {/* Message submit form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Escreva a sua mensagem privada..."
                      className="flex-grow bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-accent)] text-[var(--theme-text-main)] placeholder:text-gray-500 font-semibold"
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
                    >
                      <Send className="w-5 h-5 text-white" />
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

