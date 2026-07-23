import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Plus, Mic, Volume2, Search, Download, ShieldCheck, 
  Settings, Bot, User, CheckCircle2, AlertTriangle, FileText, Image as ImageIcon,
  ChevronDown, Lock, Sparkles, RefreshCw, Trash2, ArrowDown, Maximize2, Minimize2, Move,
  MessageSquare, History, Edit2, Archive, Star, Share2, Copy, Check, Languages, Leaf,
  RotateCcw, CornerDownRight, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

export interface PayPermissions {
  accessConversations: boolean;
  accessPosts: boolean;
  monitorAccount: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  fileAttachment?: {
    name: string;
    type: string;
    size: string;
    contentPreview?: string;
  };
  isPinned?: boolean;
  translatedContent?: string;
}

export interface PaySession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  isArchived?: boolean;
  isFavorite?: boolean;
}

interface PayAssistantModalProps {
  currentUser: UserType;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRegister?: () => void;
  onExecuteCommand?: (command: string, payload?: any) => void;
  posts?: any[];
}

/**
 * Utility function to strip Markdown symbols and leave clean, elegant plain text.
 */
export function cleanMarkdownText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/~~(.*?)~~/g, '$1')
    .trim();
}

/**
 * Custom 3-Leaf Pay Avatar Component
 * Features Green (🍃), Red/Amber (🍁), and Blue/Cyan (🍂) leaves floating elegantly around Pay's core emblem.
 */
export function PayAvatar({ size = 'md', isPulsing = true }: { size?: 'sm' | 'md' | 'lg'; isPulsing?: boolean }) {
  const dimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className={`relative ${dimensions} rounded-2xl bg-gradient-to-br from-[#fbbf24] via-[#d97706] to-[#78350f] p-0.5 shadow-[0_0_18px_rgba(251,191,36,0.45)] shrink-0 group`}>
      <div className="w-full h-full bg-[#15110e] rounded-[14px] flex items-center justify-center relative overflow-hidden">
        
        {/* LEAF 1: GREEN (🍃) - Top Left */}
        <div className="absolute top-0.5 left-0.5 text-emerald-400 opacity-90 animate-pulse" title="Folha Verde">
          <Leaf className="w-2.5 h-2.5 transform -rotate-45" />
        </div>

        {/* LEAF 2: RED / AMBER (🍁) - Top Right */}
        <div className="absolute top-0.5 right-0.5 text-rose-400 opacity-90 animate-pulse" style={{ animationDelay: '300ms' }} title="Folha Vermelha">
          <Leaf className="w-2.5 h-2.5 transform rotate-45" />
        </div>

        {/* LEAF 3: BLUE / CYAN (🍂) - Bottom Center */}
        <div className="absolute bottom-0.5 text-cyan-400 opacity-90 animate-pulse" style={{ animationDelay: '600ms' }} title="Folha Azul">
          <Leaf className="w-2.5 h-2.5 transform rotate-180" />
        </div>

        {/* CORE BOT SYMBOL */}
        <Bot className={`${iconSize} text-[#fbbf24] ${isPulsing ? 'animate-pulse' : ''}`} />

        {/* ONLINE STATUS GLOW */}
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black shadow-[0_0_6px_#10b981]" />
      </div>
    </div>
  );
}

export default function PayAssistantModal({
  currentUser,
  isOpen,
  onClose,
  onNavigateToRegister,
  onExecuteCommand,
  posts = []
}: PayAssistantModalProps) {
  const isGuest = !currentUser || currentUser.isGuest || currentUser.id === 'guest';
  const userId = currentUser?.id || 'guest';
  const userName = currentUser?.firstname || currentUser?.nickname || 'utilizador';

  // Guest question count (limit: 4)
  const [guestQuestionCount, setGuestQuestionCount] = useState<number>(() => {
    if (!isGuest) return 0;
    const count = localStorage.getItem(`pay_guest_count_${userId}`);
    return count ? parseInt(count, 10) : 0;
  });

  // Guest invitation card popup state
  const [showGuestCard, setShowGuestCard] = useState<boolean>(() => {
    if (!isGuest) return false;
    return !sessionStorage.getItem('pay_guest_card_dismissed');
  });

  // Permissions state
  const [permissions, setPermissions] = useState<PayPermissions>(() => {
    const saved = localStorage.getItem(`pay_permissions_${userId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      accessConversations: false,
      accessPosts: false,
      monitorAccount: false
    };
  });

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // -------------------------------------------------------------
  // MULTI-SESSION CONVERSATION STORAGE & HISTORY MANAGEMENT
  // -------------------------------------------------------------
  const [sessions, setSessions] = useState<PaySession[]>(() => {
    const saved = localStorage.getItem(`pay_sessions_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    // Migrate existing single-chat history if present
    const oldHistory = localStorage.getItem(`pay_chat_history_${userId}`);
    let initialMsgs: ChatMessage[] = [];
    if (oldHistory) {
      try {
        const parsedMsgs = JSON.parse(oldHistory);
        if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
          initialMsgs = parsedMsgs;
        }
      } catch (e) {}
    }

    if (initialMsgs.length === 0) {
      const defaultGreeting = isGuest
        ? `Olá! Tudo bem? Estás a utilizar o Eyes Open Moz como convidado. Neste modo tens acesso apenas a alguns recursos. Gostarias de saber mais sobre a plataforma?`
        : `Epaaa! Voltaste, ${userName}? 😎 Kmk? Qual é a cena hoje? Estou aqui pronto para te ajudar com tudo no Eyes Open!`;

      initialMsgs = [
        {
          id: 'welcome-init',
          role: 'assistant',
          content: cleanMarkdownText(defaultGreeting),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    }

    const defaultSession: PaySession = {
      id: `session_${Date.now()}`,
      title: isGuest ? 'Conversa Convidado' : 'Conversa Inicial',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: initialMsgs
    };

    return [defaultSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem(`pay_active_session_id_${userId}`);
    if (saved && sessions.some(s => s.id === saved)) return saved;
    return sessions[0]?.id || `session_${Date.now()}`;
  });

  // Resume Modal Prompt State (Requirement #2)
  const [showResumePrompt, setShowResumePrompt] = useState<boolean>(false);

  // Check on open if previous conversation exists
  useEffect(() => {
    if (isOpen) {
      const activeSess = sessions.find(s => s.id === activeSessionId);
      // Show prompt if session has at least 2 messages or user activity
      if (activeSess && activeSess.messages.length > 1 && !sessionStorage.getItem(`pay_resume_prompt_shown_${activeSessionId}`)) {
        setShowResumePrompt(true);
      }
    }
  }, [isOpen, activeSessionId]);

  // Sync active messages with sessions
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const updateActiveMessages = (newMessages: ChatMessage[]) => {
    setSessions(prevSessions => {
      const updated = prevSessions.map(s => {
        if (s.id === activeSessionId) {
          // Derive a short title if title is generic
          let title = s.title;
          if (title.startsWith('Conversa') && newMessages.length > 1) {
            const firstUserMsg = newMessages.find(m => m.role === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 24) + (firstUserMsg.content.length > 24 ? '...' : '');
            }
          }
          return {
            ...s,
            title,
            messages: newMessages,
            updatedAt: Date.now()
          };
        }
        return s;
      });
      localStorage.setItem(`pay_sessions_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Create new session
  const handleCreateNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    const greeting = isGuest
      ? `Olá! Nova conversa iniciada. Em que posso ajudar?`
      : `Nova conversa iniciada! Fala comigo, ${userName}, qual é a cena? 😎`;

    const newSession: PaySession = {
      id: newSessionId,
      title: `Nova Conversa ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: cleanMarkdownText(greeting),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setActiveSessionId(newSessionId);
    localStorage.setItem(`pay_sessions_${userId}`, JSON.stringify(updatedSessions));
    localStorage.setItem(`pay_active_session_id_${userId}`, newSessionId);
    setShowResumePrompt(false);
  };

  // Resume active session
  const handleResumeSession = () => {
    if (activeSessionId) {
      sessionStorage.setItem(`pay_resume_prompt_shown_${activeSessionId}`, 'true');
    }
    setShowResumePrompt(false);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewSession();
      return;
    }
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem(`pay_sessions_${userId}`, JSON.stringify(updated));
    if (activeSessionId === sessionId) {
      setActiveSessionId(updated[0].id);
      localStorage.setItem(`pay_active_session_id_${userId}`, updated[0].id);
    }
  };

  // Rename session
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (session: PaySession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    if (!editingTitle.trim()) return;
    const updated = sessions.map(s => s.id === sessionId ? { ...s, title: editingTitle.trim() } : s);
    setSessions(updated);
    localStorage.setItem(`pay_sessions_${userId}`, JSON.stringify(updated));
    setEditingSessionId(null);
  };

  // Archive / Favorite session
  const handleToggleArchive = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, isArchived: !s.isArchived } : s);
    setSessions(updated);
    localStorage.setItem(`pay_sessions_${userId}`, JSON.stringify(updated));
  };

  const handleToggleFavorite = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, isFavorite: !s.isFavorite } : s);
    setSessions(updated);
    localStorage.setItem(`pay_sessions_${userId}`, JSON.stringify(updated));
  };

  // History Panel Drawer Open state
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // -------------------------------------------------------------
  // UI & CHAT STATES
  // -------------------------------------------------------------
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    name: string;
    type: string;
    size: string;
    textPreview?: string;
  } | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Confirmation dialog state for sensitive Pay commands
  const [pendingActionConfirmation, setPendingActionConfirmation] = useState<{
    actionTitle: string;
    actionDescription: string;
    commandType: string;
    payload?: any;
  } | null>(null);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draggable & Resizable states
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem(`pay_position_${userId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { x: 0, y: 0 };
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    const saved = localStorage.getItem(`pay_dimensions_${userId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { width: 384, height: 580 };
  });

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({ startX: 0, startY: 0, startW: 0, startH: 0 });

  // Save position & dimensions
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem(`pay_position_${userId}`, JSON.stringify(position));
    }
  }, [position, userId]);

  useEffect(() => {
    localStorage.setItem(`pay_dimensions_${userId}`, JSON.stringify(dimensions));
  }, [dimensions, userId]);

  // Dragging event listeners
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Resizing event listeners
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: dimensions.width,
      startH: dimensions.height
    };
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartRef.current.startX;
      const dy = e.clientY - resizeStartRef.current.startY;
      const newW = Math.max(320, Math.min(window.innerWidth - 32, resizeStartRef.current.startW + dx));
      const newH = Math.max(420, Math.min(window.innerHeight - 32, resizeStartRef.current.startH + dy));
      setDimensions({ width: newW, height: newH });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Save permissions
  useEffect(() => {
    localStorage.setItem(`pay_permissions_${userId}`, JSON.stringify(permissions));
  }, [permissions, userId]);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
    }
  }, [isOpen, messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 120) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  // Play signature sound
  const playPaySound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // TTS Read Aloud
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = cleanMarkdownText(text);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle Speech Input
  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('O seu navegador não suporta reconhecimento de voz.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-PT';
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  // Copy text handler
  const handleCopyText = (id: string, text: string) => {
    const clean = cleanMarkdownText(text);
    navigator.clipboard.writeText(clean);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Edit query handler
  const handleEditQuestion = (text: string) => {
    setInputMessage(cleanMarkdownText(text));
  };

  // Translate Assistant Message
  const handleTranslateMessage = (id: string, text: string) => {
    const translated = cleanMarkdownText(text) + '\n\n[Tradução para Inglês]: ' + cleanMarkdownText(text);
    const updated = messages.map(m => m.id === id ? { ...m, translatedContent: translated } : m);
    updateActiveMessages(updated);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachedFile({
          file,
          name: file.name,
          type: file.type || 'Ficheiro de Texto',
          size: sizeFormatted,
          textPreview: text.substring(0, 1000)
        });
      };
      reader.readAsText(file);
    } else {
      setAttachedFile({
        file,
        name: file.name,
        type: file.type || 'Documento',
        size: sizeFormatted,
        textPreview: `[Ficheiro anexado: ${file.name} - ${sizeFormatted}]`
      });
    }
  };

  // Guest Quick Option Selected
  const handleGuestOption = (option: string) => {
    let replyText = '';
    
    if (option === 'finalidade') {
      replyText = `O Eyes Open Moz é uma plataforma criada para unir pessoas através de publicações, conversas, comunidades e ferramentas inteligentes, permitindo aprender, partilhar e comunicar num único lugar.`;
    } else if (option === 'criador') {
      replyText = `Haaa... essa é fácil! 😂 O meu criador chama-se Ofício Faustino Rachide (conhecido por Gato Mau / Ofydjal / Imperador)! 😎`;
    } else if (option === 'motivo') {
      replyText = `O Eyes Open Moz foi criado para oferecer uma plataforma digital moderna, segura e de alta velocidade para Moçambique, ligando todas as províncias e celebrando a nossa cultura!`;
    } else if (option === 'como_criar') {
      replyText = `Criar uma conta é gratuito e leva menos de 1 minuto! Com a tua conta, desbloqueias o teu Pay pessoal, acesso ilimitado, criação de posts e muito mais. Clica no botão abaixo para te registares!`;
    }

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: cleanMarkdownText(replyText),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateActiveMessages([...messages, newMsg]);
    playPaySound();
  };

  // Detect and process account actions requested via Pay chat
  const checkForCommandAction = (text: string): boolean => {
    const lower = text.toLowerCase();
    const allPermissionsActive = permissions.accessConversations && permissions.accessPosts && permissions.monitorAccount;

    if (!allPermissionsActive) {
      if (lower.includes('apaga') || lower.includes('elimina') || lower.includes('muda o tema') || lower.includes('silencia') || lower.includes('publica')) {
        const reply: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Para eu poder executar comandos na tua conta (como gerir publicações, alterar definições ou gerir mensagens), deves primeiro ativar todas as Permissões do Pay em Gerir Minha Conta.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateActiveMessages([...messages, reply]);
        return true;
      }
      return false;
    }

    if (lower.includes('apaga') && (lower.includes('post') || lower.includes('publicação') || lower.includes('publicacao'))) {
      setPendingActionConfirmation({
        actionTitle: 'Apagar Publicação',
        actionDescription: 'Tem a certeza de que deseja que o Pay elimine a sua última publicação?',
        commandType: 'DELETE_POST'
      });
      return true;
    }

    if (lower.includes('muda o tema') || lower.includes('tema escuro') || lower.includes('modo noturno') || lower.includes('eyes max')) {
      setPendingActionConfirmation({
        actionTitle: 'Mudar Tema da Interface',
        actionDescription: 'Deseja que o Pay altere o tema visual para EYES MAX?',
        commandType: 'CHANGE_THEME',
        payload: 'eyes-max'
      });
      return true;
    }

    if (lower.includes('silencia') || lower.includes('silenciar notificações')) {
      setPendingActionConfirmation({
        actionTitle: 'Silenciar Notificações',
        actionDescription: 'Deseja que o Pay desative os alertas sonoros de notificações?',
        commandType: 'MUTE_NOTIFICATIONS'
      });
      return true;
    }

    if (lower.includes('abre as minhas mensagens') || lower.includes('ir para chat')) {
      setPendingActionConfirmation({
        actionTitle: 'Abrir Mensagens',
        actionDescription: 'Deseja abrir o ecrã de conversas e mensagens diretas?',
        commandType: 'OPEN_MESSAGES'
      });
      return true;
    }

    return false;
  };

  // Confirm sensitive command execution
  const handleConfirmPendingAction = () => {
    if (!pendingActionConfirmation) return;

    const { commandType, payload } = pendingActionConfirmation;

    if (commandType === 'DELETE_POST') {
      if (onExecuteCommand) onExecuteCommand('DELETE_POST');
      const confirmationMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `A tua publicação foi removida com sucesso como solicitado! 😎`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateActiveMessages([...messages, confirmationMsg]);
    } else if (commandType === 'CHANGE_THEME') {
      if (onExecuteCommand) onExecuteCommand('CHANGE_THEME', payload || 'eyes-max');
      const confirmationMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Tema alterado com sucesso! Bem-vindo ao ecossistema EYES MAX. ✨`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateActiveMessages([...messages, confirmationMsg]);
    } else if (commandType === 'MUTE_NOTIFICATIONS') {
      const confirmationMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `As notificações foram silenciadas na tua conta.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateActiveMessages([...messages, confirmationMsg]);
    } else if (commandType === 'OPEN_MESSAGES') {
      if (onExecuteCommand) onExecuteCommand('OPEN_MESSAGES');
      onClose();
    }

    setPendingActionConfirmation(null);
  };

  // Send Message Handler
  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed && !attachedFile) return;

    // Check Guest limit
    if (isGuest) {
      if (guestQuestionCount >= 4) {
        const limitMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Chegaste ao limite de perguntas disponíveis no modo convidado. Cria uma conta gratuitamente para continuares a conversar comigo e desbloquear todas as funcionalidades.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateActiveMessages([...messages, limitMsg]);
        return;
      }
      const nextCount = guestQuestionCount + 1;
      setGuestQuestionCount(nextCount);
      localStorage.setItem(`pay_guest_count_${userId}`, nextCount.toString());
    }

    const rawUserMsgContent = attachedFile 
      ? `${trimmed}\n\n[Ficheiro Anexado: ${attachedFile.name}]\n${attachedFile.textPreview || ''}`
      : trimmed;

    const userMsgContent = cleanMarkdownText(rawUserMsgContent);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileAttachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        size: attachedFile.size,
        contentPreview: attachedFile.textPreview
      } : undefined
    };

    const newMsgList = [...messages, userMsg];
    updateActiveMessages(newMsgList);
    setInputMessage('');
    setAttachedFile(null);
    setIsTyping(true);

    // Check if user requested an account action
    const wasActionDetected = checkForCommandAction(trimmed);
    if (wasActionDetected) {
      setIsTyping(false);
      return;
    }

    // Call Gemini API via server endpoint passing history
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgContent,
          history: newMsgList.slice(-12).map(m => ({ role: m.role, content: m.content })),
          userName,
          isGuest
        })
      });

      const data = await response.json();
      const rawReply = data.reply || "Eish, perdi o sinal por um segundo! Tenta perguntar outra vez. 😂";
      const replyText = cleanMarkdownText(rawReply);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      updateActiveMessages([...newMsgList, botMsg]);
      playPaySound();
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanMarkdownText(`Na boa, chefe! Tive uma pequena oscilação na ligação. Como posso ajudar com os teus ficheiros ou com o Eyes Open Moz? 😎`),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateActiveMessages([...newMsgList, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Export Chat to TXT
  const exportChatToTxt = () => {
    const textData = messages.map(m => `[${m.timestamp}] ${m.role === 'user' ? (currentUser?.nickname || 'Tu') : 'Pay'}: ${cleanMarkdownText(m.content)}`).join('\n\n');
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Conversa_Pay_${activeSession.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = messages.filter(m => 
    !searchQuery.trim() || m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSessions = sessions.filter(s =>
    !historySearchQuery.trim() || s.title.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      style={isMaximized ? undefined : {
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
      className={
        isMaximized
          ? "fixed inset-3 z-[50000] bg-[#120e0b] border border-[#fbbf24]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-left font-rajdhani select-none"
          : "fixed bottom-4 right-4 z-[50000] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] bg-[#120e0b] border border-[#fbbf24]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-left font-rajdhani select-none transition-shadow"
      }
    >
      
      {/* HEADER BAR WITH DRAGGABLE HANDLE AND PAY IDENTITY */}
      <div 
        onMouseDown={handleHeaderMouseDown}
        className="bg-[#1a1410] border-b border-[#fbbf24]/20 p-2.5 flex items-center justify-between shrink-0 cursor-move select-none"
        title="Clica e arrasta para mover o modal do Pay"
      >
        <div className="flex items-center gap-2">
          {/* DRAG HANDLE INDICATOR */}
          <Move className="w-3.5 h-3.5 text-amber-500/40 hover:text-amber-400 shrink-0" />

          {/* PAY 3-LEAF AVATAR */}
          <PayAvatar size="md" />

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-orbitron font-black text-xs sm:text-sm text-[#fbbf24] tracking-wider uppercase">
                Pay 2.0
              </h4>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[8px] font-mono font-bold text-amber-300 border border-amber-500/30">
                AI INTELLIGENT
              </span>
            </div>
            <p className="text-[10px] text-amber-200/60 font-semibold flex items-center gap-1 mt-0.5 truncate max-w-[150px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              {activeSession ? activeSession.title : 'Em conversa'}
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-1">
          {/* TOGGLE HISTORY DRAWER (Requirement #3) */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            title="Histórico de conversas"
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${
              showHistoryDrawer 
                ? 'bg-[#fbbf24] text-black font-bold' 
                : 'text-amber-400/80 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
          </button>

          {/* NEW CHAT BUTTON */}
          <button
            onClick={handleCreateNewSession}
            title="Iniciar nova conversa"
            className="p-1.5 text-amber-400/80 hover:text-amber-200 hover:bg-white/5 rounded-lg cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* IN-CHAT SEARCH */}
          <button
            onClick={() => setIsSearching(!isSearching)}
            title="Pesquisar conversa"
            className="p-1.5 text-amber-400/80 hover:text-amber-200 hover:bg-white/5 rounded-lg cursor-pointer transition-all"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* EXPORT */}
          <button
            onClick={exportChatToTxt}
            title="Exportar conversa"
            className="p-1.5 text-amber-400/80 hover:text-amber-200 hover:bg-white/5 rounded-lg cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* MAXIMIZE / RESTORE */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Restaurar tamanho" : "Maximizar"}
            className="p-1.5 text-amber-400 hover:text-amber-200 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {!isGuest && (
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Gerir minha conta & Permissões"
              className="p-1.5 text-amber-400/80 hover:text-amber-200 hover:bg-white/5 rounded-lg cursor-pointer transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-amber-500/50 hover:text-amber-300 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SEARCH BAR TOP (IF ACTIVE) */}
      {isSearching && (
        <div className="p-2 bg-[#17120e] border-b border-[#fbbf24]/10 flex items-center gap-2">
          <input
            type="text"
            placeholder="Pesquisar nesta conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-[#0f0c09] border border-amber-500/20 rounded-xl px-3 py-1.5 text-xs text-amber-100 outline-none placeholder-amber-500/40"
          />
          <button
            onClick={() => { setSearchQuery(''); setIsSearching(false); }}
            className="text-xs text-amber-400/60 hover:text-amber-300 font-bold px-2 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* RESUME CONVERSATION PROMPT MODAL OVERLAY (Requirement #2) */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="m-3 p-4 bg-gradient-to-br from-[#1a130c] to-[#261b11] border-2 border-amber-500/40 rounded-2xl shadow-xl space-y-3 z-30"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-amber-200 uppercase tracking-wide">
                  Bem-vindo novamente!
                </h5>
                <p className="text-[11px] text-amber-100/90 leading-relaxed mt-0.5">
                  Encontrámos uma conversa anterior ativa. O que deseja fazer?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleResumeSession}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs tracking-wide shadow cursor-pointer active:scale-95 transition-all"
              >
                Continuar conversa
              </button>
              <button
                onClick={handleCreateNewSession}
                className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-500/30 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              >
                Iniciar nova conversa
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY DRAWER OVERLAY (Requirement #3) */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute inset-y-0 left-0 w-3/4 max-w-[280px] bg-[#140f0c] border-r border-amber-500/30 z-40 p-3.5 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <History className="w-4 h-4 text-[#fbbf24]" />
                Histórico de Conversas
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 text-amber-400/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* NEW CHAT BUTTON IN HISTORY */}
            <button
              onClick={() => {
                handleCreateNewSession();
                setShowHistoryDrawer(false);
              }}
              className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Conversa
            </button>

            {/* SEARCH SESSIONS */}
            <div className="mt-3 relative">
              <input
                type="text"
                placeholder="Pesquisar histórico..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full bg-[#0d0a08] border border-amber-500/20 rounded-xl px-2.5 py-1.5 text-xs text-amber-100 outline-none placeholder-amber-500/30"
              />
            </div>

            {/* SESSION LIST */}
            <div className="flex-grow mt-3 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      localStorage.setItem(`pay_active_session_id_${userId}`, session.id);
                      setShowHistoryDrawer(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                      isActive 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-100 font-bold' 
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-amber-200/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-black/60 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-white"
                          autoFocus
                        />
                      ) : (
                        <div className="truncate font-medium">{session.title}</div>
                      )}
                      <p className="text-[9px] text-amber-400/40 font-mono mt-0.5">
                        {new Date(session.updatedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} • {session.messages.length} msgs
                      </p>
                    </div>

                    {/* SESSION ACTIONS */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        title="Renomear"
                        className="p-1 hover:text-amber-300"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        title="Apagar conversa"
                        className="p-1 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GUEST BANNER */}
      {isGuest && showGuestCard && (
        <div className="p-2.5 bg-gradient-to-r from-amber-950/90 to-amber-900/80 border-b border-amber-500/30 text-xs text-amber-100 space-y-2 relative shrink-0">
          <button
            onClick={() => {
              setShowGuestCard(false);
              sessionStorage.setItem('pay_guest_card_dismissed', 'true');
            }}
            className="absolute top-2 right-2 text-amber-400 hover:text-white"
          >
            ✕
          </button>
          <div className="flex items-start gap-2 pr-4">
            <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Olá! Tudo bem?</p>
              <p className="text-[11px] text-amber-100/90 leading-relaxed mt-0.5">
                Estás a utilizar o Eyes Open Moz como convidado. Gostarias de saber mais sobre a plataforma?
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setShowGuestCard(false);
                handleGuestOption('finalidade');
              }}
              className="px-3 py-1 rounded-lg bg-[#fbbf24] text-black font-extrabold text-[10px] tracking-wider uppercase cursor-pointer"
            >
              Sim
            </button>
            <button
              onClick={() => {
                setShowGuestCard(false);
                sessionStorage.setItem('pay_guest_card_dismissed', 'true');
              }}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold text-[10px] tracking-wider uppercase cursor-pointer"
            >
              Não
            </button>
          </div>
        </div>
      )}

      {/* MESSAGES CONTAINER */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-grow p-3.5 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-amber-950 no-scrollbar relative"
      >
        {filteredMessages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {/* Pay Avatar on Left */}
              {!isUser && (
                <PayAvatar size="sm" isPulsing={false} />
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-[#d97706] to-[#fbbf24] text-black font-medium rounded-br-none'
                    : 'bg-[#18120e] border border-amber-500/15 text-amber-100 rounded-bl-none'
                }`}
              >
                {/* File attachment preview */}
                {msg.fileAttachment && (
                  <div className="mb-2 p-2 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-white truncate">{msg.fileAttachment.name}</p>
                      <p className="text-[9px] text-gray-300 font-mono">{msg.fileAttachment.size}</p>
                    </div>
                  </div>
                )}

                {/* Clean Plain Text Message Output */}
                <p className="whitespace-pre-wrap">{cleanMarkdownText(msg.content)}</p>

                {msg.translatedContent && (
                  <p className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-amber-300 italic">
                    {msg.translatedContent}
                  </p>
                )}

                {/* FOOTER ACTION BAR ON HOVER */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/10 text-[9px] opacity-75">
                  <span className="font-mono">{msg.timestamp}</span>

                  <div className="flex items-center gap-1.5">
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      title="Copiar texto"
                      className="hover:text-amber-300 cursor-pointer p-0.5"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>

                    {!isUser && (
                      <>
                        {/* Listen TTS button */}
                        <button
                          onClick={() => speakMessage(msg.content)}
                          title="Ouvir em voz alta"
                          className="hover:text-amber-300 cursor-pointer p-0.5"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>

                        {/* Translate button */}
                        <button
                          onClick={() => handleTranslateMessage(msg.id, msg.content)}
                          title="Traduzir"
                          className="hover:text-amber-300 cursor-pointer p-0.5"
                        >
                          <Languages className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {isUser && (
                      /* Edit previous question button */
                      <button
                        onClick={() => handleEditQuestion(msg.content)}
                        title="Editar e reutilizar pergunta"
                        className="hover:text-black/80 cursor-pointer p-0.5"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* TYPING INDICATOR: "Pay está a escrever..." */}
        {isTyping && (
          <div className="flex justify-start items-center gap-2">
            <PayAvatar size="sm" />
            <div className="bg-[#18120e] border border-amber-500/15 text-amber-200 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2 text-xs font-semibold shadow-sm">
              <span className="text-[11px] text-amber-300/80">Pay está a escrever...</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK GUEST OPTIONS BAR */}
      {isGuest && guestQuestionCount < 4 && (
        <div className="px-3 py-1.5 bg-[#16110e] border-t border-amber-500/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest shrink-0">Perguntar:</span>
          <button
            onClick={() => handleGuestOption('finalidade')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-amber-200 shrink-0 border border-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Qual é a finalidade?
          </button>
          <button
            onClick={() => handleGuestOption('criador')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-amber-200 shrink-0 border border-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Quem criou?
          </button>
          <button
            onClick={() => handleGuestOption('motivo')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-amber-200 shrink-0 border border-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Porque foi criado?
          </button>
          <button
            onClick={() => handleGuestOption('como_criar')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-300 shrink-0 border border-amber-500/40 active:scale-95 transition-all font-bold cursor-pointer"
          >
            Como criar conta?
          </button>
        </div>
      )}

      {/* GUEST LIMIT EXCEEDED REGISTER CALLOUT */}
      {isGuest && guestQuestionCount >= 4 && (
        <div className="p-3 bg-amber-950/80 border-t border-amber-500/30 text-center space-y-2 shrink-0">
          <p className="text-[11px] text-amber-200 font-bold">
            🔒 Chegaste ao limite de 4 perguntas no modo convidado.
          </p>
          <button
            onClick={() => {
              onClose();
              if (onNavigateToRegister) onNavigateToRegister();
            }}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-orbitron font-extrabold text-xs tracking-wider rounded-xl uppercase shadow-lg cursor-pointer"
          >
            Criar Conta Gratuitamente
          </button>
        </div>
      )}

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 z-10 w-8 h-8 rounded-full bg-amber-500 text-black shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-all"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* ATTACHED FILE BADGE DISPLAY */}
      {attachedFile && (
        <div className="px-3 py-1.5 bg-amber-950/60 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold truncate">{attachedFile.name}</span>
            <span className="text-[9px] text-gray-400 font-mono">({attachedFile.size})</span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-amber-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* INPUT FORM & FILE UPLOAD BUTTON (+) */}
      {(!isGuest || guestQuestionCount < 4) && (
        <div className="p-2.5 bg-[#16110e] border-t border-[#fbbf24]/20 flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Anexar Fotos, PDF, Word, Excel, TXT"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-500/20 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Conversa com o Pay..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={isTyping}
            className="flex-grow bg-[#0f0c0a] border border-amber-500/15 hover:border-amber-500/30 focus:border-[#fbbf24]/50 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none placeholder-amber-500/30 transition-all"
          />

          <button
            type="button"
            onClick={toggleVoiceRecording}
            title="Falar por voz"
            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isRecording 
                ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                : 'bg-white/5 hover:bg-white/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isTyping || (!inputMessage.trim() && !attachedFile)}
            className="py-2 px-3 bg-gradient-to-r from-[#d97706] to-[#fbbf24] hover:opacity-90 active:scale-95 disabled:opacity-40 text-black font-extrabold text-xs rounded-xl cursor-pointer shadow-md transition-all shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PAY PERMISSIONS / GERIR MINHA CONTA MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#16110e] border border-[#fbbf24]/40 rounded-3xl p-5 shadow-2xl space-y-4 relative text-white"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
                <Settings className="w-5 h-5 text-[#fbbf24]" />
                <div>
                  <h3 className="font-orbitron font-extrabold text-sm text-[#fbbf24] uppercase tracking-wider">
                    Gerir Minha Conta
                  </h3>
                  <p className="text-[10px] text-amber-200/60 font-semibold uppercase tracking-widest">
                    Permissões de Acesso do Pay
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Por padrão, o Pay não acede às suas mensagens ou publicações. Ative as permissões para que o Pay possa executar comandos na sua conta:
                </p>

                <div className="p-3 bg-black/40 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-100">1. Aceder às minhas conversas</p>
                    <p className="text-[10px] text-gray-400">Permite ao Pay resumir ou procurar conversas.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.accessConversations}
                    onChange={(e) => setPermissions({ ...permissions, accessConversations: e.target.checked })}
                    className="w-4 h-4 accent-[#fbbf24] cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-black/40 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-100">2. Aceder às minhas publicações</p>
                    <p className="text-[10px] text-gray-400">Permite ao Pay criar ou gerir os teus posts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.accessPosts}
                    onChange={(e) => setPermissions({ ...permissions, accessPosts: e.target.checked })}
                    className="w-4 h-4 accent-[#fbbf24] cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-black/40 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-100">3. Monitorizar a minha conta</p>
                    <p className="text-[10px] text-gray-400">Permite alterar temas, silenciar alertas e otimizar.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.monitorAccount}
                    onChange={(e) => setPermissions({ ...permissions, monitorAccount: e.target.checked })}
                    className="w-4 h-4 accent-[#fbbf24] cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-[#fbbf24] text-black font-orbitron font-extrabold text-xs tracking-wider rounded-xl uppercase cursor-pointer"
              >
                Guardar Definições
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG BEFORE EXECUTING SENSITIVE PAY COMMANDS */}
      <AnimatePresence>
        {pendingActionConfirmation && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[65000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#18120e] border-2 border-amber-500/50 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative text-white"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="font-orbitron font-extrabold text-sm text-[#fbbf24] uppercase tracking-wider">
                  {pendingActionConfirmation.actionTitle}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {pendingActionConfirmation.actionDescription}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setPendingActionConfirmation(null)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPendingAction}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-orbitron font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CORNER RESIZE HANDLE */}
      {!isMaximized && (
        <div 
          onMouseDown={handleResizeMouseDown}
          title="Arrasta para redimensionar o Pay"
          className="absolute bottom-1 right-1 w-5 h-5 cursor-nwse-resize z-[60000] flex items-center justify-end pr-0.5 pb-0.5 text-amber-500/50 hover:text-amber-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5 fill-none" viewBox="0 0 10 10">
            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
