/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Sparkles, Award, MapPin, Lock, Unlock, Clock, Trash2, 
  Smartphone, Key, EyeOff, Eye, UserCheck, RefreshCw, AlertOctagon, 
  X, Check, Edit3, Save, Calendar, CheckCircle, ShieldAlert,
  MessageSquare, Send, Star, MessageCircle, Share2, Plus, UserPlus,
  Heart, FileText, ChevronRight, Upload, RotateCw, ZoomIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, Friendship, Post, Comment } from '../types';
import { checkRelation, RelationState } from '../utils/relationEngine';

interface ProfileViewProps {
  currentUser: UserType;
  targetUser?: UserType; // If provided, view this user's profile
  friendships?: Friendship[]; // Real-time friendships list
  posts?: Post[]; // Global posts list to show and manage
  chatPermissions?: any[];
  onNavigate: (view: any) => void;
  onUpdateUser?: (updated: UserType) => Promise<void> | void;
  onLogout?: () => void;
  onDeleteAccount?: (userId: string) => Promise<void> | void;
  onAddFriendship?: (targetUserId: string, level: 'amigo' | 'familia' | 'conhecido') => void;
  onDeleteFriendship?: (targetUserId: string) => void;
  onAddComment?: (postId: string, text: string, audioUrl?: string, audioDuration?: number) => void;
  onLikePost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onAddChatPermission?: (targetUserId: string, duration: 7 | 30 | 'permanent') => void;
  isUnverified?: boolean;
  onUnverifiedClick?: () => void;
}

export default function ProfileView({ 
  currentUser, 
  targetUser,
  friendships = [],
  posts = [],
  chatPermissions = [],
  onNavigate, 
  onUpdateUser, 
  onLogout, 
  onDeleteAccount,
  onAddFriendship,
  onDeleteFriendship,
  onAddComment,
  onLikePost,
  onDeletePost,
  onAddChatPermission,
  isUnverified = false,
  onUnverifiedClick,
}: ProfileViewProps) {
  
  // 1. Identify which profile is being viewed and what is the relation
  const activeUser = targetUser || currentUser;
  const relation: RelationState = checkRelation(currentUser, activeUser, friendships);
  const isOwner = relation === 'owner';

  // State for Guest mode redirection or restricted access warning
  if (currentUser.id === 'guest' && !isOwner) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto flex flex-col justify-center items-center font-rajdhani text-center text-white h-[80vh]">
        <div className="p-8 bg-slate-900/90 border border-indigo-500/30 rounded-3xl max-w-md shadow-2xl relative space-y-4">
          <Award className="w-16 h-16 text-indigo-400 mx-auto animate-pulse" />
          <h2 className="font-orbitron font-extrabold text-lg text-indigo-400 tracking-wider uppercase">
            Acesso Restrito
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed font-semibold">
            Os perfis e publicações da comunidade estão visíveis apenas para utilizadores registados. Faça o registo de sua conta gratuita no Eyes Open MZ.
          </p>
          <button 
            onClick={() => onNavigate('register')}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 text-white font-orbitron font-extrabold text-xs tracking-wider rounded-xl uppercase transition-all shadow-md cursor-pointer"
          >
            Criar Conta Gratuita
          </button>
        </div>
      </div>
    );
  }

  // 2. Core Profile Edit & Photo Framing (Crop) States
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(activeUser.bio || "Produtor de Cinema & Conexões Blindadas.");
  const [birthday, setBirthday] = useState(activeUser.birthday || "1998-05-15");
  const [gender, setGender] = useState(activeUser.gender || "Masculino");
  const [orientation, setOrientation] = useState(activeUser.orientation || "Reservado");
  const [hideLocation, setHideLocation] = useState(activeUser.hideLocation || false);
  const [fullname, setFullname] = useState(activeUser.fullname || "");
  const [avatar, setAvatar] = useState(activeUser.avatar || "https://i.pravatar.cc/150?img=1");
  const [cover, setCover] = useState((activeUser as any).cover || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200");

  // Crop / Framing Overlay Wizard states
  const [cropTarget, setCropTarget] = useState<'avatar' | 'cover' | null>(null);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Vault protection passcode
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [vaultPasswordInput, setVaultPasswordInput] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // "Absurd Privacy" states
  const [ghostMode, setGhostMode] = useState(activeUser.ghostMode || false);
  const [e2eeEnabled, setE2eeEnabled] = useState(activeUser.e2eeEnabled || false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [e2eeKey, setE2eeKey] = useState('');
  const [screenshotProtection, setScreenshotProtection] = useState(true);
  const [isScreenshotWarningOpen, setIsScreenshotWarningOpen] = useState(false);
  const [sandboxSearchMode, setSandboxSearchMode] = useState(false);

  // 10-second self destruction
  const [isDestructing, setIsDestructing] = useState(false);
  const [destructCount, setDestructCount] = useState(10);
  const countdownIntervalRef = useRef<any>(null);

  // Feed comment inputs for this profile's post list
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // Dropdown states for relation level & chat permission selections
  const [showConnectionOptions, setShowConnectionOptions] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);

  // Refs for uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync state with activeUser when it changes (only when not actively editing, to prevent real-time sync overwriting user inputs)
  useEffect(() => {
    if (!isEditing) {
      setBio(activeUser.bio || "Produtor de Cinema & Conexões Blindadas.");
      setBirthday(activeUser.birthday || "1998-05-15");
      setGender(activeUser.gender || "Masculino");
      setOrientation(activeUser.orientation || "Reservado");
      setHideLocation(activeUser.hideLocation || false);
      setFullname(activeUser.fullname || "");
      setAvatar(activeUser.avatar || "https://i.pravatar.cc/150?img=1");
      setCover((activeUser as any).cover || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200");
    }
  }, [
    activeUser.id,
    activeUser.bio,
    activeUser.birthday,
    activeUser.gender,
    activeUser.orientation,
    activeUser.hideLocation,
    activeUser.fullname,
    activeUser.avatar,
    (activeUser as any).cover,
    isEditing
  ]);

  // Auto-sign Calculation
  const calculateZodiac = (dateStr: string) => {
    if (!dateStr) return 'Touro';
    try {
      const d = new Date(dateStr);
      const day = d.getUTCDate();
      const month = d.getUTCMonth() + 1; // 1-indexed month
      if (isNaN(day) || isNaN(month)) return 'Touro';
      
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricórnio';
      if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquário';
      if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Peixes';
      if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Áries';
      if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Touro';
      if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gêmeos';
      if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Câncer';
      if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leão';
      if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgem';
      if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
      if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpião';
      if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitário';
      return 'Touro';
    } catch {
      return 'Touro';
    }
  };

  // Auto-age Calculation
  const calculateAge = (dateStr: string) => {
    if (!dateStr) return 28;
    try {
      const birthDate = new Date(dateStr);
      const today = new Date();
      if (isNaN(birthDate.getTime())) return 28;
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 28;
    }
  };

  // 2. Interaction analytics weekly line chart data
  const weeklyData = [120, 280, 450, 620, 580, 720, 680];
  const maxVal = 800;
  const svgWidth = 500;
  const svgHeight = 120;
  const padding = 20;

  const getSvgPath = () => {
    const xStep = (svgWidth - padding * 2) / (weeklyData.length - 1);
    const yScale = (svgHeight - padding * 2) / maxVal;

    let path = `M ${padding} ${svgHeight - padding - weeklyData[0] * yScale}`;
    weeklyData.forEach((d, i) => {
      if (i > 0) {
        const x = padding + i * xStep;
        const y = svgHeight - padding - d * yScale;
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  const getSvgPoints = () => {
    const xStep = (svgWidth - padding * 2) / (weeklyData.length - 1);
    const yScale = (svgHeight - padding * 2) / maxVal;

    return weeklyData.map((d, i) => ({
      x: padding + i * xStep,
      y: svgHeight - padding - d * yScale,
      val: d
    }));
  };

  // 3. Vault Passcode Lock check
  const handleOpenVaultClick = () => {
    if (isVaultUnlocked) {
      setIsCardFlipped(!isCardFlipped);
    } else {
      setIsPasswordModalOpen(true);
      setVaultPasswordInput('');
      setVaultError('');
    }
  };

  const handleUnlockVault = () => {
    if (vaultPasswordInput === '1234' || vaultPasswordInput.length >= 4) {
      setIsVaultUnlocked(true);
      setIsPasswordModalOpen(false);
      setIsCardFlipped(true);
      setVaultPasswordInput('');
      setVaultError('');
    } else {
      setVaultError('Palavra-passe inválida. Introduza o PIN de segurança.');
    }
  };

  // 4. Ghost Mode synchronization
  const handleToggleGhostMode = async (checked: boolean) => {
    setGhostMode(checked);
    if (onUpdateUser && isOwner) {
      await onUpdateUser({
        ...currentUser,
        ghostMode: checked
      });
    }
  };

  // 5. E2EE key generator
  const handleToggleE2EE = async (checked: boolean) => {
    if (checked) {
      setIsGeneratingKey(true);
      setE2eeKey('');
      setTimeout(() => {
        const generated = `EO_E2EE_${Math.random().toString(36).substring(2, 8).toUpperCase()}_SECURE`;
        setE2eeKey(generated);
        setIsGeneratingKey(false);
        setE2eeEnabled(true);
        if (onUpdateUser && isOwner) {
          onUpdateUser({
            ...currentUser,
            e2eeEnabled: true
          });
        }
      }, 1500);
    } else {
      setE2eeEnabled(false);
      setE2eeKey('');
      if (onUpdateUser && isOwner) {
        await onUpdateUser({
          ...currentUser,
          e2eeEnabled: false
        });
      }
    }
  };

  // 6. Photo Framing / Cropping and Upload Simulation
  const handlePhotoUploadSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTempImageSrc(ev.target?.result as string);
      setCropTarget(target);
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const confirmFramedCrop = () => {
    if (!tempImageSrc) return;

    const img = new Image();
    img.src = tempImageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let targetWidth = 300;
      let targetHeight = 300;
      if (cropTarget === 'cover') {
        targetWidth = 800;
        targetHeight = 300;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Dark solid background
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const imgRatio = img.width / img.height;
      let drawWidth = targetWidth;
      let drawHeight = targetWidth / imgRatio;

      if (cropTarget === 'cover') {
        const targetRatio = 800 / 300;
        if (imgRatio > targetRatio) {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgRatio;
        } else {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgRatio;
        }
      } else {
        if (imgRatio > 1) {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgRatio;
        } else {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgRatio;
        }
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Export as heavily compressed, high-performance base64 JPEG
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);

      if (cropTarget === 'avatar') {
        setAvatar(compressedBase64);
        if (!isEditing && onUpdateUser && isOwner) {
          onUpdateUser({
            ...currentUser,
            avatar: compressedBase64
          });
        }
      } else if (cropTarget === 'cover') {
        setCover(compressedBase64);
        if (!isEditing && onUpdateUser && isOwner) {
          onUpdateUser({
            ...currentUser,
            cover: compressedBase64 as any
          });
        }
      }

      setCropTarget(null);
      setTempImageSrc(null);
    };
  };

  // 7. Profile Edit Saving
  const handleSaveProfile = async () => {
    if (onUpdateUser && isOwner) {
      await onUpdateUser({
        ...currentUser,
        fullname: fullname || currentUser.fullname,
        bio,
        birthday,
        gender,
        orientation,
        hideLocation,
        avatar,
        cover: cover as any
      });
    }
    setIsEditing(false);
  };

  // 8. Cinematic Account Destruction Flow (10 Seconds)
  const startSelfDestruct = () => {
    setIsDestructing(true);
    setDestructCount(10);
    
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setDestructCount(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          executeHardDelete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSelfDestruct = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsDestructing(false);
    setDestructCount(10);
  };

  const executeHardDelete = async () => {
    if (onDeleteAccount) {
      await onDeleteAccount(currentUser.id);
    }
    if (onLogout) {
      onLogout();
    }
    window.location.reload();
  };

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Filter posts created by the viewed user
  const userPosts = posts.filter(post => post.author.id === activeUser.id);
  // Filter depending on relation level
  const visiblePosts = userPosts.filter(post => {
    if (isOwner) return true;
    if (relation === 'friend') return true;
    // Stranger only sees public posts
    return post.isPrivate !== true;
  });

  // Handle Comment Submission
  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    if (onAddComment) {
      onAddComment(postId, text.trim());
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };

  // Check friendship pending status
  const pendingRequest = friendships.find(f => 
    f.status === 'pending' && 
    ((f.senderId === currentUser.id && f.receiverId === activeUser.id) || 
     (f.senderId === activeUser.id && f.receiverId === currentUser.id))
  );

  return (
    <div className={`flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-24 ${isDestructing ? 'animate-pulse bg-red-950/20' : ''}`}>
      
      {/* Hidden File inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={(e) => handlePhotoUploadSelect(e, 'avatar')}
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        accept="image/*"
        onChange={(e) => handlePhotoUploadSelect(e, 'cover')}
        className="hidden"
      />

      {/* CINEMATIC ACCOUNT AUTO-DESTRUCTION COUNTDOWN OVERLAY */}
      <AnimatePresence>
        {isDestructing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[99999] flex flex-col justify-center items-center p-6 text-center select-none overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-4 overflow-hidden text-red-500 font-mono text-[9px]">
              {Array.from({ length: 150 }).map((_, idx) => (
                <div key={idx} className="animate-bounce" style={{ animationDelay: `${idx * 0.1}s`, animationDuration: '3s' }}>
                  01_DESTRUCT_SYSTEM_EO_PRG_SYS_PURGE_DB_DOC_ID_USER_HARD_CLEANSE
                </div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-md space-y-6 z-10"
            >
              <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center text-red-500 mx-auto text-4xl font-orbitron font-black animate-ping">
                {destructCount}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-orbitron font-extrabold text-red-500 tracking-widest uppercase">
                  DESTRUIÇÃO EM ANDAMENTO
                </h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                  Todos os registos fotográficos, dados pessoais, cofre de identidade e chaves de criptografia vinculados a @{activeUser.nickname} serão eliminados de forma definitiva da infraestrutura moçambicana do Open MZ.
                </p>
              </div>

              <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-2xl text-left font-mono text-[10px] text-red-400 uppercase space-y-1">
                <p>PROVÍNCIA: {activeUser.province}</p>
                <p>NICKNAME: @{activeUser.nickname}</p>
                <p>STATUS: DESTRUIÇÃO HARD-DATA SELETIVA ATIVA</p>
                <p>CONDIÇÃO: IRREVERSÍVEL APÓS EXCLUSÃO</p>
              </div>

              <button
                onClick={cancelSelfDestruct}
                className="px-8 py-3 bg-white text-black font-orbitron font-black text-xs tracking-widest rounded-2xl uppercase transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                Abortar Destruição (Parar)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHOTO FRAMING / CROP OVERLAY MODAL */}
      <AnimatePresence>
        {cropTarget && tempImageSrc && (
          <div className="fixed inset-0 bg-black/90 z-[5000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 relative shadow-2xl text-center space-y-6"
            >
              <button 
                onClick={() => { setCropTarget(null); setTempImageSrc(null); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-orbitron font-extrabold text-sm text-indigo-400 tracking-wider uppercase">
                  Enquadrar Foto
                </h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Arraste os controlos abaixo para ajustar zoom e rotação antes de confirmar
                </p>
              </div>

              {/* Crop Box Preview Frame */}
              <div className="w-full bg-black/50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative border border-slate-800">
                <div className={`overflow-hidden relative flex items-center justify-center border-2 border-dashed border-indigo-500/60 ${cropTarget === 'avatar' ? 'w-48 h-48 rounded-full' : 'w-full h-32'}`}>
                  <img
                    src={tempImageSrc}
                    alt="Framing preview"
                    className="max-w-none origin-center transition-transform pointer-events-none select-none"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      width: cropTarget === 'avatar' ? '120%' : '100%',
                      height: 'auto'
                    }}
                  />
                </div>
              </div>

              {/* Interactive Framing Controls */}
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left">
                {/* Zoom range */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5" /> Ajustar Zoom ({zoom.toFixed(1)}x)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-full"
                  />
                </div>

                {/* Rotation range */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" /> Rodar Foto ({rotation}º)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-full"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCropTarget(null); setTempImageSrc(null); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-[10px] tracking-wider rounded-xl uppercase transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmFramedCrop}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 text-white font-orbitron text-[10px] tracking-wider rounded-xl uppercase transition-all font-bold"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT REGISTRO DETAILS FULL MODAL */}
      <AnimatePresence>
        {isEditing && isOwner && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar text-left"
            >
              {/* Header Title block */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="font-orbitron font-extrabold text-sm text-indigo-400 tracking-widest uppercase flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5" /> EDITAR PERFIL INDEPENDENTE
                </h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Profile Picture & Cover Upload Previews */}
              <div className="space-y-3">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  FOTOS DE REGISTO (PERFIL E CAPA)
                </span>
                
                {/* Cover Preview Container */}
                <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={cover}
                    alt="Cover preview"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-[10px] font-bold uppercase font-orbitron tracking-wider transition-colors gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Alterar Foto de Capa
                  </button>
                </div>

                {/* Avatar Preview Container */}
                <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/50 relative shrink-0">
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl text-[10px] font-bold font-orbitron tracking-wider uppercase transition-all flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Enquadrar Avatar
                    </button>
                    <p className="text-[9px] text-gray-500 uppercase font-semibold">Tamanho recomendado: Quadrado 500x500px</p>
                  </div>
                </div>
              </div>

              {/* Fullname input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  value={fullname} 
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none font-bold transition-all"
                />
              </div>

              {/* Bio description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Biografia Pública</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none font-medium resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Birthday field */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={birthday} 
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none font-semibold transition-all"
                  />
                </div>

                {/* Gender selection */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Gênero</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none font-bold transition-all cursor-pointer"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Reservado">Reservado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Orientation selection */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Orientação / Preferência</label>
                  <select 
                    value={orientation} 
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none font-bold transition-all cursor-pointer"
                  >
                    <option value="Heterossexual">Heterossexual</option>
                    <option value="Homossexual">Homossexual</option>
                    <option value="Bissexual">Bissexual</option>
                    <option value="Reservado">Reservado</option>
                  </select>
                </div>
              </div>

              {/* Hide Location Toggle */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black text-slate-300 uppercase tracking-widest">Mascarar Província</span>
                  <span className="block text-[8px] text-gray-500 mt-0.5 uppercase font-semibold">Ocultar de visitantes na comunidade</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hideLocation} 
                    onChange={(e) => setHideLocation(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
                </label>
              </div>

              {/* SAVE PROFILE CTA */}
              <button
                onClick={handleSaveProfile}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 text-white font-orbitron font-extrabold text-xs tracking-wider rounded-xl uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Guardar Alterações
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD VAULT PROMPT MODAL */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-xs rounded-3xl p-6 relative shadow-2xl text-center space-y-4"
            >
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <Lock className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
              
              <h3 className="font-orbitron font-black text-xs text-indigo-400 tracking-widest uppercase">
                Acesso Seguro Cofre
              </h3>
              
              <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider">
                Para aceder à "Minha Conta", introduza o código de acesso de segurança.
              </p>

              <div>
                <input 
                  type="password" 
                  value={vaultPasswordInput} 
                  onChange={(e) => setVaultPasswordInput(e.target.value)}
                  placeholder="Código PIN (1234)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-center text-white text-xs outline-none transition-all font-bold placeholder:text-gray-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUnlockVault();
                  }}
                  autoFocus
                />
                {vaultError && (
                  <p className="text-[9px] text-red-500 font-bold uppercase mt-2">{vaultError}</p>
                )}
              </div>

              <button
                onClick={handleUnlockVault}
                className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl uppercase transition-all shadow-md cursor-pointer"
              >
                Desbloquear Cofre
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SCREENSHOT TEST POPUP MODAL */}
      <AnimatePresence>
        {isScreenshotWarningOpen && (
          <div className="fixed inset-0 bg-black/90 z-[20000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-950/40 border border-red-500/30 w-full max-w-sm rounded-3xl p-6 relative shadow-2xl space-y-4 text-center"
            >
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
              
              <h2 className="font-orbitron font-black text-base text-red-500 tracking-widest uppercase">
                BLOQUEIO DE CAPTURA
              </h2>
              
              <p className="text-xs text-red-200 font-bold uppercase tracking-wider leading-relaxed">
                ALERTA DE SEGURANÇA: Captura de ecrã ou gravação de vídeo detetada! O Eyes Open OS bloqueou esta ação para proteger a privacidade de ponta a ponta. Sessão de conversação blindada.
              </p>

              <div className="bg-black/40 border border-red-500/20 p-2.5 rounded-xl text-[9px] text-gray-500 font-mono text-left uppercase">
                SISTEMA: SCREEN_SHIELD_ACTIVE<br/>
                ALVO: @{activeUser.nickname}<br/>
                ESTADO: CAPTURA SUBSTITUÍDA POR TELA PRETA MILITAR
              </div>

              <button
                onClick={() => setIsScreenshotWarningOpen(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-orbitron font-extrabold text-[10px] tracking-widest rounded-xl uppercase transition-all shadow-md cursor-pointer"
              >
                Fechar Alerta
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROFILE COVER BANNER PHOTO */}
      <div 
        onClick={() => isOwner && coverInputRef.current?.click()}
        className={`relative w-full h-36 rounded-3xl overflow-hidden bg-slate-900 border border-slate-850 ${isOwner ? 'cursor-pointer group' : ''}`}
      >
        <img 
          src={cover} 
          alt="Profile cover background" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-65 select-none transition-transform duration-500 group-hover:scale-105"
        />
        {isOwner && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
            <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-white uppercase font-orbitron">
              <Upload className="w-3.5 h-3.5" /> Alterar Foto de Capa
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      {/* PROFILE HEADER PANEL */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left -mt-16 z-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Status-indicated illuminated border */}
          <div 
            onClick={() => isOwner && avatarInputRef.current?.click()}
            className={`relative group shrink-0 select-none ${isOwner ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute -inset-1.5 rounded-full blur-sm opacity-75 ${ghostMode ? 'bg-slate-600' : 'bg-emerald-500 animate-pulse'}`} />
            <div className={`w-32 h-32 rounded-full border-4 relative overflow-hidden z-10 transition-transform duration-300 group-hover:scale-105 ${ghostMode ? 'border-slate-500 shadow-md' : 'border-emerald-500 shadow-md'}`}>
              <img 
                src={avatar} 
                alt={activeUser.nickname} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
              
              {isOwner && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 z-30 pb-4">
                  <Upload className="w-5 h-5 text-white" />
                  <span className="text-[8px] text-white font-extrabold uppercase font-orbitron tracking-widest mt-1">
                    Mudar Foto
                  </span>
                </div>
              )}

              <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest z-20 ${ghostMode ? 'bg-slate-600 text-slate-200' : 'bg-emerald-500 text-black'}`}>
                {ghostMode ? 'FANTASMA' : 'ONLINE'}
              </div>
            </div>
          </div>

          {/* User description fields */}
          <div className="flex-1 text-center md:text-left min-w-0 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-orbitron font-extrabold text-white tracking-wide truncate uppercase flex items-center gap-2 justify-center md:justify-start">
                  {activeUser.nickname}
                  {activeUser.isVIP && <Sparkles className="w-5 h-5 text-amber-400" />}
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  ID: {activeUser.id} • REGISTADO EM {activeUser.created ? new Date(activeUser.created).toLocaleDateString('pt-MZ') : 'ANTIGO'}
                </p>
              </div>
              
              {/* Conditional Action buttons based on 3-state relation engine */}
              {isOwner ? (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
                  <button 
                    onClick={() => {
                      if (isUnverified) {
                        if (onUnverifiedClick) {
                          onUnverifiedClick();
                        }
                        return;
                      }
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar Registo
                  </button>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Sair da Conta
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
                  {/* Stranger connects CTA */}
                  {relation === 'stranger' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowConnectionOptions(!showConnectionOptions)}
                        disabled={!!pendingRequest}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/30"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> 
                        {pendingRequest ? 'Vincular (Pendente)' : 'Vincular'}
                      </button>

                      {showConnectionOptions && (
                        <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-[100] space-y-1">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest px-2.5 py-1">Escolher Categoria</p>
                          <button
                            onClick={() => {
                              if (onAddFriendship) onAddFriendship(activeUser.id, 'amigo');
                              setShowConnectionOptions(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Amigo
                          </button>
                          <button
                            onClick={() => {
                              if (onAddFriendship) onAddFriendship(activeUser.id, 'familia');
                              setShowConnectionOptions(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Família
                          </button>
                          <button
                            onClick={() => {
                              if (onAddFriendship) onAddFriendship(activeUser.id, 'conhecido');
                              setShowConnectionOptions(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Conhecido
                          </button>
                          <button
                            onClick={() => {
                              if (onAddFriendship) onAddFriendship(activeUser.id, 'amigo');
                              setShowConnectionOptions(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                          >
                            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Fazer amizade
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chat request CTA */}
                  {(() => {
                    const activeChatPerm = chatPermissions.find((p: any) => 
                      (p.senderId === currentUser.id && p.receiverId === activeUser.id) ||
                      (p.senderId === activeUser.id && p.receiverId === currentUser.id)
                    );
                    const isChatAccepted = activeChatPerm?.status === 'accepted' && (activeChatPerm.expiresAt === null || activeChatPerm.expiresAt > Date.now());
                    const isChatPending = activeChatPerm?.status === 'pending';

                    if (isChatAccepted) {
                      return (
                        <button
                          onClick={() => {
                            onNavigate('conversas');
                            localStorage.setItem('initialSelectedChatId', activeUser.id);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/30"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Enviar Mensagem
                        </button>
                      );
                    } else if (isChatPending) {
                      return (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" /> Conversa Pendente
                        </button>
                      );
                    } else {
                      return (
                        <div className="relative">
                          <button
                            onClick={() => setShowChatOptions(!showChatOptions)}
                            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Solicitar Conversa
                          </button>

                          {showChatOptions && (
                            <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-[100] space-y-1">
                              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest px-2.5 py-1">Período de Conversa</p>
                              <button
                                onClick={() => {
                                  if (onAddChatPermission) onAddChatPermission(activeUser.id, 7);
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                              >
                                ⏳ 7 Dias
                              </button>
                              <button
                                onClick={() => {
                                  if (onAddChatPermission) onAddChatPermission(activeUser.id, 30);
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                              >
                                ⏳ 30 Dias
                              </button>
                              <button
                                onClick={() => {
                                  if (onAddChatPermission) onAddChatPermission(activeUser.id, 'permanent');
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-850 rounded-xl transition-colors font-semibold flex items-center gap-2 text-white"
                              >
                                ♾️ Permanente
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}

                  {/* Friends social option - desvincular */}
                  {relation === 'friend' && (
                    <button
                      onClick={() => onDeleteFriendship && onDeleteFriendship(activeUser.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Desvincular
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Bio Description Sentence */}
            <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-3.5 text-xs leading-relaxed text-gray-300 italic">
              "{bio}"
            </div>

            {/* Verification / Level Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> CONTA ATIVA
              </span>
              {activeUser.isVIP && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3 text-amber-400" /> MEMBRO VIP
                </span>
              )}
              {!isOwner && (
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-md flex items-center gap-1 ${
                  relation === 'friend' 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}>
                  {relation === 'friend' ? 'VÍNCULO AMIGO' : 'VISITANTE'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-800 py-4 my-6 text-center shrink-0">
          <div>
            <p className="text-xl font-bold font-mono text-indigo-400">{activeUser.stats?.likes || 0}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">Estrelas</p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-violet-400">{userPosts.length}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">Publicações</p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-indigo-400">{activeUser.stats?.friends || 0}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">Comunidade</p>
          </div>
        </div>

        {/* SECTION 2: DADOS FIXOS COMO TAGS/SELOS */}
        <div>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2.5">DADOS FIXOS E DE REGISTO</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {calculateAge(birthday)} Anos (Idade)
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              Gênero: {gender}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              Orientação: {orientation}
            </span>
            {!hideLocation && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Província de {activeUser.province}
              </span>
            )}
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              ✨ Signo: {calculateZodiac(birthday)}
            </span>
          </div>
        </div>
      </div>

      {/* COORDENADAS INTERACTIVAS: "MINHA CONTA" 3D VAULT CARD (Only visible to Profile Owner!) */}
      {isOwner && (
        <div className="space-y-4 text-left">
          <div>
            <h3 className="font-orbitron font-extrabold text-sm text-indigo-400 tracking-widest uppercase">
              Área de Identidade Segura
            </h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">
              Dê dois cliques no cartão ou use drag para simular a rotação física do cartão de cofre
            </p>
          </div>

          {/* 3D Rotatable/Draggable Vault card */}
          <div className="perspective-1000 w-full min-h-[160px] relative select-none">
            <motion.div
              drag={true}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.15}
              animate={{ 
                y: [0, -6, 0],
                rotateY: isCardFlipped ? 180 : 0
              }}
              transition={{ 
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                rotateY: { duration: 0.8, ease: "easeOut" }
              }}
              onDoubleClick={handleOpenVaultClick}
              onClick={handleOpenVaultClick}
              className="w-full bg-gradient-to-br from-[#120e2e] via-[#09081a] to-[#04040a] border-2 border-indigo-500/40 rounded-3xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.12)] cursor-pointer preserve-3d relative flex flex-col justify-between min-h-[180px]"
            >
              {/* FRONT OF VAULT CARD (Locked / Toggle display) */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <span className="text-[10px] font-orbitron font-extrabold tracking-widest text-indigo-400 uppercase">MINHA CONTA VAULT</span>
                  </div>
                  <div className="text-[8px] bg-indigo-500/15 px-2 py-0.5 rounded-full text-indigo-400 font-mono uppercase">
                    {isVaultUnlocked ? 'DESBLOQUEADO' : 'FECHADO'}
                  </div>
                </div>

                <div className="py-2">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Acesso de Identidade</p>
                  <h4 className="text-base font-orbitron font-black text-white uppercase tracking-wider mt-1 flex items-center gap-1.5">
                    {isVaultUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-indigo-400" />}
                    {isVaultUnlocked ? 'CLIQUE PARA OCULTAR CONTROLOS' : 'CLIQUE / DOIS CLIQUES PARA ABRIR COFRE'}
                  </h4>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-3">
                  <div>
                    <p className="text-[8px] text-gray-500 font-mono">CHAVE DE CHASSI SECURE-ID</p>
                    <p className="text-[10px] font-mono text-indigo-400">{activeUser.id.toUpperCase()}_MEMBER_MZ</p>
                  </div>
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">EYES OPEN OS</span>
                </div>
              </div>

              {/* BACK OF VAULT CARD (Vault Configuration controls - rotated 180deg) */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-orbitron font-extrabold tracking-widest text-emerald-400 uppercase">COFRE ATIVO</span>
                  <span className="text-[8px] bg-emerald-500/10 px-2 py-0.5 rounded-full text-emerald-400 font-mono uppercase font-black">VALIDADO</span>
                </div>

                <div className="text-center py-2">
                  <p className="text-xs text-emerald-400 font-orbitron font-bold uppercase tracking-widest">Segurança Blindada Ativa</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-1 uppercase font-semibold">
                    Opções de privacidade profunda, destruição de conta e blindagem visual ativados abaixo.
                  </p>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-3">
                  <span className="text-[9px] text-gray-500 font-mono">EO_PASS_CHASSIS</span>
                  <span className="text-[9px] text-emerald-400 font-black tracking-widest">SESSÃO AUTORIZADA</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* VAULT DETAILS AND CONTROLS (Only visible below the card when unlocked) */}
          <AnimatePresence>
            {isVaultUnlocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-6"
              >
                <div className="bg-slate-900/95 border-2 border-indigo-500/25 rounded-3xl p-5 md:p-6 space-y-6 text-left shadow-2xl">
                  
                  {/* ABSURD PRIVACY BLOCK */}
                  <div className="space-y-4">
                    <h4 className="font-orbitron font-extrabold text-xs text-indigo-400 tracking-widest uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Shield className="w-4.5 h-4.5" /> CONTROLES DE PRIVACIDADE ABSURDA ("ABSURD PRIVACY")
                    </h4>

                    {/* A. Ghost Mode */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-white">Ghost Mode (Modo Fantasma)</p>
                        <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-semibold">
                          Ninguém saberá quando está ativo. O seu status de online e confirmações de leitura são desativados de forma profunda.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={ghostMode} 
                          onChange={(e) => handleToggleGhostMode(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                      </label>
                    </div>

                    {/* B. End-To-End Encryption */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 text-left">
                          <p className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                            E2EE Deep Encryption (Criptografia Profunda)
                          </p>
                          <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-semibold">
                            Binde o seu histórico com chave militar estática gerada dinamicamente.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={e2eeEnabled} 
                            onChange={(e) => handleToggleE2EE(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                        </label>
                      </div>

                      {isGeneratingKey && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-indigo-500/20 text-[10px] text-indigo-400 font-mono uppercase animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando par de chaves assimétricas militares de 4096-bit...
                        </div>
                      )}

                      {e2eeKey && !isGeneratingKey && (
                        <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-1 text-left">
                          <p className="text-[9px] text-emerald-400 font-mono uppercase font-black">CHAVE ESTÁTICA MILITAR GERADA:</p>
                          <p className="text-xs font-mono text-white select-all break-all">{e2eeKey}</p>
                        </div>
                      )}
                    </div>

                    {/* C. Screenshot Shield */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 text-left">
                          <p className="text-xs font-bold uppercase tracking-wider text-white">Escudo anti-Capturas e Gravações</p>
                          <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-semibold">
                            Bloqueia capturas de ecrã simulando tela preta militar automática e alerta o utilizador.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={screenshotProtection} 
                            onChange={(e) => setScreenshotProtection(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                        </label>
                      </div>

                      {screenshotProtection && (
                        <div className="flex justify-start">
                          <button
                            onClick={() => setIsScreenshotWarningOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-[10px] font-bold font-orbitron tracking-wider uppercase transition-all cursor-pointer"
                          >
                            Testar Captura de Ecrã
                          </button>
                        </div>
                      )}
                    </div>

                    {/* D. Sandbox Search Option */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-white">Sandbox e Remoção de Pesquisa</p>
                        <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-semibold">
                          Retira o perfil da pesquisa global. Apenas membros de nível "Conhecido" ou superior podem encontrá-lo.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={sandboxSearchMode} 
                          onChange={(e) => setSandboxSearchMode(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                      </label>
                    </div>
                  </div>

                  {/* ACCESS LOGS TABLE */}
                  <div className="space-y-3">
                    <h4 className="font-orbitron font-extrabold text-xs text-indigo-400 tracking-widest uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5" /> LOGS DE ACESSO E DISPOSITIVOS VINCULADOS
                    </h4>
                    
                    <div className="bg-slate-950/80 border border-slate-850 rounded-2xl overflow-hidden font-mono text-[10px]">
                      <div className="grid grid-cols-3 bg-white/5 p-2 text-gray-400 font-bold uppercase tracking-wider border-b border-slate-850">
                        <div>DISPOSITIVO</div>
                        <div>IP / LOCAL</div>
                        <div className="text-right">ESTADO</div>
                      </div>
                      <div className="divide-y divide-slate-800/40 text-left">
                        <div className="grid grid-cols-3 p-2.5">
                          <div className="text-white font-bold uppercase">iPhone 15 Pro</div>
                          <div className="text-gray-400">197.249.12.83<br/><span className="text-[8px] text-gray-500">Maputo</span></div>
                          <div className="text-right text-emerald-400 font-bold font-orbitron">ATIVO</div>
                        </div>
                        <div className="grid grid-cols-3 p-2.5">
                          <div className="text-white font-bold uppercase">Macbook Pro</div>
                          <div className="text-gray-400">197.249.15.11<br/><span className="text-[8px] text-gray-500">Beira</span></div>
                          <div className="text-right text-gray-500 font-bold font-orbitron">AUTORIZADO</div>
                        </div>
                        <div className="grid grid-cols-3 p-2.5">
                          <div className="text-white font-bold uppercase">Chrome (Windows)</div>
                          <div className="text-gray-400">102.83.4.119<br/><span className="text-[8px] text-gray-500">Nampula</span></div>
                          <div className="text-right text-gray-500 font-bold font-orbitron">AUTORIZADO</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HARD ACCOUNT DELETION TRIGGER */}
                  <div className="space-y-3 border-t border-red-500/10 pt-4">
                    <h4 className="font-orbitron font-extrabold text-xs text-red-500 tracking-widest uppercase flex items-center gap-2">
                      <Trash2 className="w-4.5 h-4.5 text-red-500" /> ZONA DE ELIMINAÇÃO TOTAL
                    </h4>
                    <p className="text-[9px] text-red-400 uppercase font-bold tracking-wider leading-relaxed">
                      Esta ação apagará permanentemente o perfil e todas as conversas do banco de dados (hard data deletion). Não restarão vestígios de qualquer interação.
                    </p>
                    <button
                      onClick={startSelfDestruct}
                      className="w-full py-3.5 bg-red-950/40 hover:bg-red-600 border border-red-500/30 hover:text-white text-red-400 font-orbitron font-extrabold text-[10px] tracking-widest rounded-2xl transition-all cursor-pointer uppercase flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" /> Iniciar Destruição da Conta (10s)
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* FEED DE PUBLICAÇÕES DO UTILIZADOR (3 States compliance) */}
      <div className="space-y-4 text-left">
        <h3 className="font-orbitron font-extrabold text-sm text-indigo-400 tracking-widest uppercase border-b border-slate-800 pb-2">
          Publicações de @{activeUser.nickname} ({visiblePosts.length})
        </h3>

        {visiblePosts.length === 0 ? (
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-850 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
            Nenhuma publicação disponível
          </div>
        ) : (
          <div className="space-y-6">
            {visiblePosts.map((post) => (
              <div 
                key={post.id} 
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg text-left overflow-hidden relative"
              >
                {post.isPrivate && (
                  <div className={`absolute top-4 ${isOwner ? 'right-14' : 'right-4'} bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full text-indigo-400 text-[8px] font-bold uppercase tracking-wider`}>
                    Amigos
                  </div>
                )}

                {isOwner && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem a certeza que deseja eliminar esta publicação permanentemente?')) {
                        if (onDeletePost) {
                          onDeletePost(post.id);
                        }
                      }
                    }}
                    className="absolute top-3.5 right-4 w-7 h-7 rounded-full bg-red-600/90 hover:bg-red-500 flex items-center justify-center text-white cursor-pointer z-10 hover:scale-110 active:scale-95 transition-all shadow-lg border border-red-500/10"
                    title="Eliminar Publicação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Post Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-700">
                    <img 
                      src={post.author.avatar || "https://i.pravatar.cc/80?img=1"} 
                      alt={post.author.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white uppercase tracking-wide">{post.author.name}</span>
                    <span className="block text-[8px] text-gray-500 font-mono mt-0.5">{new Date(post.timestamp).toLocaleDateString('pt-MZ')}</span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="space-y-3">
                  {post.text && (
                    <p 
                      className="text-xs leading-relaxed font-semibold"
                      style={{ 
                        fontFamily: post.style?.font || 'Inter', 
                        color: post.style?.color || '#ffffff' 
                      }}
                    >
                      {post.text}
                    </p>
                  )}

                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-slate-850 aspect-video">
                      <img 
                        src={post.image} 
                        alt="Publication content attachment" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Interaction Actions */}
                <div className="flex items-center gap-4 border-t border-b border-slate-800/60 py-2.5 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                  <button
                    onClick={() => {
                      if (relation === 'stranger' && !isOwner) {
                        alert('Precisa de se vincular como amigo para dar estrelas a esta publicação!');
                        return;
                      }
                      if (onLikePost) onLikePost(post.id);
                    }}
                    className={`flex items-center gap-1.5 cursor-pointer hover:text-indigo-400 transition-colors ${
                      post.starred ? 'text-indigo-400 font-black' : ''
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${post.starred ? 'fill-indigo-400 stroke-indigo-400' : ''}`} /> 
                    {post.stars || 0} Estrelas
                  </button>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MessageCircle className="w-3.5 h-3.5" /> 
                    {(post.comments || []).length} Comentários
                  </span>
                </div>

                {/* Comments List (Only visible for Friends or Owner) */}
                {(isOwner || relation === 'friend') ? (
                  <div className="space-y-3">
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-xs bg-slate-900/60 p-2.5 rounded-xl text-slate-300">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white uppercase text-[9px] tracking-wider">@{comment.author.name}</span>
                              <span className="text-[7px] text-gray-500 font-mono">{new Date(comment.timestamp).toLocaleDateString('pt-MZ')}</span>
                            </div>
                            <p className="text-left leading-relaxed text-[10.5px] font-medium">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Adicionar um comentário..."
                        className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id);
                        }}
                      />
                      <button 
                        onClick={() => handleCommentSubmit(post.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/50 text-center text-slate-500 font-bold uppercase tracking-wider text-[8px] flex items-center justify-center gap-1.5">
                    🔒 Interações e comentários restritos a vínculos amigos de @{activeUser.nickname}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: INTERACTION WEEKLY SVG CHART */}
      {isOwner && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="font-orbitron font-extrabold text-xs tracking-widest text-indigo-400">
              GRÁFICO DE INTERAÇÃO (7 DIAS)
            </h3>
            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider">
              Evolução Semanal
            </span>
          </div>

          <div className="w-full bg-slate-950/50 border border-slate-850 rounded-2xl p-4 overflow-hidden relative">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="rgba(99, 102, 241, 0.05)" strokeDasharray="4 4" />
              <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="rgba(99, 102, 241, 0.05)" strokeDasharray="4 4" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(99, 102, 241, 0.1)" />

              <path
                d={getSvgPath()}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
              />

              {getSvgPoints().map((pt, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#a78bfa"
                    className="stroke-indigo-400 stroke-2 hover:r-7 transition-all"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {pt.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* SECTION 3: PROFISSÃO DESCRIPTION DETAIL */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
        <div className="absolute top-4 right-4 text-indigo-400/30">
          <Shield className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h4 className="font-orbitron font-extrabold text-[10px] text-indigo-400 tracking-widest mb-2 uppercase">
          PERFIL PROFISSIONAL
        </h4>
        <h3 className="text-xl font-bold text-white mb-2 leading-snug">
          Diretor de Cinema Especializado
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed max-w-[420px] font-semibold">
          Focado no desenvolvimento cinematográfico moçambicano. Planeamento artístico, supervisão de equipas de rodagem, realização e edição de curtas, séries e conteúdos de alto impacto.
        </p>
      </div>

    </div>
  );
}
