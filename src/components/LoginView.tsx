/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowLeft, KeyRound, Trash2, CheckCircle2, Smartphone, Sparkles, Palette, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { simpleHash, validateEmail } from '../utils';
import { User as UserType } from '../types';
import LeafLogo from './LeafLogo';
// @ts-ignore
import mozMap from '../assets/images/mozambique_map_1783337073381.jpg';
import { authLogin, authRecover, authResetPassword, authGoogleLogin, authGoogleLoginWithEmail, authCreateGuestUser, authVerifyRecoveryCode } from '../lib/authService';

export interface BrandTheme {
  key: string;
  name: string;
  brandTag: string;
  icon: string;
  colorName: string;
  bgGradient: string;
  cardBg: string;
  borderColor: string;
  accentText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  buttonGradient: string;
  buttonTextColor: string;
  glowShadow: string;
  particleColor: string;
  tagline: string;
}

export const DEVICE_BRANDS: Record<string, BrandTheme> = {
  samsung: {
    key: 'samsung',
    name: 'Samsung Galaxy',
    brandTag: 'Samsung One UI',
    icon: '📱',
    colorName: 'Azul Ciber Cósmico',
    bgGradient: 'from-[#020b18] via-[#081e3f] to-[#020813]',
    cardBg: 'bg-[#051329]/85',
    borderColor: 'border-sky-400/60',
    accentText: 'text-sky-400',
    badgeBg: 'bg-sky-950/70',
    badgeBorder: 'border-sky-400/40',
    badgeText: 'text-sky-300',
    buttonGradient: 'from-sky-400 via-blue-600 to-indigo-600',
    buttonTextColor: 'text-white',
    glowShadow: 'shadow-[0_0_40px_rgba(56,189,248,0.4)]',
    particleColor: '#38bdf8',
    tagline: 'Tema Exclusivo Samsung Galaxy'
  },
  apple: {
    key: 'apple',
    name: 'Apple iPhone / iOS',
    brandTag: 'Apple iOS / iPadOS',
    icon: '🍎',
    colorName: 'Prata Titânio & Azul Gelo',
    bgGradient: 'from-[#080d1a] via-[#11192e] to-[#040812]',
    cardBg: 'bg-[#0f172a]/85',
    borderColor: 'border-cyan-300/60',
    accentText: 'text-cyan-300',
    badgeBg: 'bg-slate-900/80',
    badgeBorder: 'border-cyan-300/40',
    badgeText: 'text-cyan-200',
    buttonGradient: 'from-slate-100 via-cyan-200 to-slate-300',
    buttonTextColor: 'text-black',
    glowShadow: 'shadow-[0_0_40px_rgba(103,232,249,0.35)]',
    particleColor: '#67e8f9',
    tagline: 'Tema Exclusivo Apple iOS Retina'
  },
  xiaomi: {
    key: 'xiaomi',
    name: 'Xiaomi / Redmi / POCO',
    brandTag: 'Xiaomi HyperOS',
    icon: '🍊',
    colorName: 'Laranja Solar HyperOS',
    bgGradient: 'from-[#1a0800] via-[#2f1000] to-[#0e0400]',
    cardBg: 'bg-[#230d02]/85',
    borderColor: 'border-orange-500/60',
    accentText: 'text-orange-400',
    badgeBg: 'bg-orange-950/80',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
    buttonGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    buttonTextColor: 'text-black',
    glowShadow: 'shadow-[0_0_40px_rgba(249,115,22,0.45)]',
    particleColor: '#f97316',
    tagline: 'Tema Exclusivo Xiaomi HyperOS'
  },
  huawei: {
    key: 'huawei',
    name: 'Huawei / Honor',
    brandTag: 'Huawei HarmonyOS',
    icon: '🌺',
    colorName: 'Vermelho Rubí HarmonyOS',
    bgGradient: 'from-[#1a0208] via-[#330412] to-[#0d0104]',
    cardBg: 'bg-[#24050d]/85',
    borderColor: 'border-rose-500/60',
    accentText: 'text-rose-400',
    badgeBg: 'bg-rose-950/80',
    badgeBorder: 'border-rose-500/40',
    badgeText: 'text-rose-300',
    buttonGradient: 'from-rose-600 via-pink-600 to-red-600',
    buttonTextColor: 'text-white',
    glowShadow: 'shadow-[0_0_40px_rgba(244,63,94,0.45)]',
    particleColor: '#f43f5e',
    tagline: 'Tema Exclusivo Huawei HarmonyOS'
  },
  tecno: {
    key: 'tecno',
    name: 'Tecno / Infinix / Itel',
    brandTag: 'Transsion HiOS / XOS',
    icon: '⚡',
    colorName: 'Verde Volt Neón Cyber',
    bgGradient: 'from-[#011710] via-[#022f21] to-[#000f0a]',
    cardBg: 'bg-[#022016]/85',
    borderColor: 'border-emerald-400/60',
    accentText: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-400/40',
    badgeText: 'text-emerald-300',
    buttonGradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    buttonTextColor: 'text-black',
    glowShadow: 'shadow-[0_0_40px_rgba(52,211,153,0.45)]',
    particleColor: '#34d399',
    tagline: 'Tema Exclusivo Tecno HiOS & Infinix XOS'
  },
  motorola: {
    key: 'motorola',
    name: 'Motorola Moto',
    brandTag: 'Motorola My UX',
    icon: '🦇',
    colorName: 'Roxo Elétrico Moto Edge',
    bgGradient: 'from-[#120224] via-[#240542] to-[#090114]',
    cardBg: 'bg-[#1b0633]/85',
    borderColor: 'border-purple-500/60',
    accentText: 'text-purple-400',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    buttonGradient: 'from-purple-500 via-indigo-600 to-violet-600',
    buttonTextColor: 'text-white',
    glowShadow: 'shadow-[0_0_40px_rgba(168,85,247,0.45)]',
    particleColor: '#a855f7',
    tagline: 'Tema Exclusivo Motorola My UX'
  },
  pixel: {
    key: 'pixel',
    name: 'Google Pixel',
    brandTag: 'Google Material You',
    icon: '💎',
    colorName: 'Menta Pastel Material You',
    bgGradient: 'from-[#021f18] via-[#063b2e] to-[#01140f]',
    cardBg: 'bg-[#042b22]/85',
    borderColor: 'border-teal-300/60',
    accentText: 'text-teal-300',
    badgeBg: 'bg-teal-950/80',
    badgeBorder: 'border-teal-300/40',
    badgeText: 'text-teal-200',
    buttonGradient: 'from-teal-300 via-emerald-400 to-lime-300',
    buttonTextColor: 'text-black',
    glowShadow: 'shadow-[0_0_40px_rgba(45,212,191,0.45)]',
    particleColor: '#2dd4bf',
    tagline: 'Tema Exclusivo Google Pixel'
  },
  oneplus: {
    key: 'oneplus',
    name: 'OnePlus / OPPO / Realme',
    brandTag: 'OxygenOS / ColorOS',
    icon: '🔴',
    colorName: 'Vermelho Intenso OxygenOS',
    bgGradient: 'from-[#1c0303] via-[#330707] to-[#0f0101]',
    cardBg: 'bg-[#240606]/85',
    borderColor: 'border-red-500/60',
    accentText: 'text-red-400',
    badgeBg: 'bg-red-950/80',
    badgeBorder: 'border-red-500/40',
    badgeText: 'text-red-300',
    buttonGradient: 'from-red-600 via-rose-600 to-amber-600',
    buttonTextColor: 'text-white',
    glowShadow: 'shadow-[0_0_40px_rgba(239,68,68,0.45)]',
    particleColor: '#ef4444',
    tagline: 'Tema Exclusivo OnePlus OxygenOS'
  },
  default: {
    key: 'default',
    name: 'Eyes Open Cyber (Navegador/PC)',
    brandTag: 'Eyes Open Engine',
    icon: '🌐',
    colorName: 'Ciano Neón & Magenta Cyber',
    bgGradient: 'from-[#060613] via-[#0d0d26] to-[#060613]',
    cardBg: 'bg-[#0d0d26]/80',
    borderColor: 'border-neon-cyan/40',
    accentText: 'text-neon-cyan',
    badgeBg: 'bg-[#121235]/80',
    badgeBorder: 'border-neon-cyan/30',
    badgeText: 'text-neon-cyan',
    buttonGradient: 'from-neon-cyan to-[#aa00ff]',
    buttonTextColor: 'text-black',
    glowShadow: 'shadow-[0_0_35px_rgba(0,245,255,0.3)]',
    particleColor: '#00f5ff',
    tagline: 'Ambiente Cyber Universal Eyes Open'
  }
};

export function detectDeviceBrand(): string {
  if (typeof window === 'undefined') return 'default';
  const ua = (navigator.userAgent || '').toLowerCase();

  if (ua.includes('samsung') || ua.includes('galaxy') || ua.includes('sm-')) return 'samsung';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || (ua.includes('macintosh') && navigator.maxTouchPoints > 0)) return 'apple';
  if (ua.includes('xiaomi') || ua.includes('mi ') || ua.includes('redmi') || ua.includes('poco')) return 'xiaomi';
  if (ua.includes('huawei') || ua.includes('honor') || ua.includes('harmonyos')) return 'huawei';
  if (ua.includes('tecno') || ua.includes('infinix') || ua.includes('itel')) return 'tecno';
  if (ua.includes('moto') || ua.includes('motorola')) return 'motorola';
  if (ua.includes('pixel')) return 'pixel';
  if (ua.includes('oneplus') || ua.includes('oppo') || ua.includes('realme') || ua.includes('vivo')) return 'oneplus';

  return 'default';
}

interface LoginViewProps {
  users: UserType[];
  onLoginSuccess: (user: UserType, token: string, rememberMe?: boolean) => void;
  onGoToRegister: () => void;
  onGoToSavedAccounts?: () => void;
}

export default function LoginView({ users, onLoginSuccess, onGoToRegister, onGoToSavedAccounts }: LoginViewProps) {
  // Dynamic Mobile Device Brand Theme State
  const [selectedBrandKey, setSelectedBrandKey] = useState<string>(() => detectDeviceBrand());
  const [showBrandSelector, setShowBrandSelector] = useState<boolean>(false);
  const [brandPulse, setBrandPulse] = useState<boolean>(false);

  const currentBrand = DEVICE_BRANDS[selectedBrandKey] || DEVICE_BRANDS.default;

  const handleSelectBrand = (key: string) => {
    setSelectedBrandKey(key);
    setShowBrandSelector(false);
    setBrandPulse(true);
    setTimeout(() => setBrandPulse(false), 700);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Recovery States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code' | 'new_password' | 'success_message'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [etherealUrl, setEtherealUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Guest Account States
  const [showGuestSetup, setShowGuestSetup] = useState(false);
  const [guestDisplayName, setGuestDisplayName] = useState('');
  const [guestExpirationHours, setGuestExpirationHours] = useState<number>(24);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  // Google Fallback Login Modal States
  const [showGoogleEmailModal, setShowGoogleEmailModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleEmailError, setGoogleEmailError] = useState('');
  const [isGoogleEmailLoading, setIsGoogleEmailLoading] = useState(false);

  const handleInitiateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recoveryEmail.trim()) {
      setErrorMsg('Por favor, introduza o seu endereço de e-mail.');
      return;
    }

    if (!validateEmail(recoveryEmail)) {
      setErrorMsg('Por favor, introduza um e-mail válido.');
      return;
    }

    try {
      const data = await authRecover(recoveryEmail.trim().toLowerCase());
      setRecoveryToken(data.recoveryToken);
      setSuccessMsg('E-mail de recuperação nativo enviado com sucesso!');
      setRecoveryStep('success_message');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar e-mail de recuperação.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recoveryCodeInput || recoveryCodeInput.trim().length !== 6) {
      setErrorMsg('Por favor, introduza o código de verificação de 6 dígitos.');
      return;
    }

    try {
      const data = await authVerifyRecoveryCode(recoveryCodeInput.trim(), recoveryToken);
      setResetToken(data.resetToken);
      setSuccessMsg('Código validado com sucesso!');
      setTimeout(() => {
        setSuccessMsg('');
        setRecoveryStep('new_password');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Código de confirmação incorreto ou expirado. Verifique e tente novamente.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmNewPassword) {
      setErrorMsg('Por favor, preencha todos os campos de palavra-passe.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('As palavras-passe introduzidas não coincidem.');
      return;
    }

    try {
      const data = await authResetPassword(recoveryEmail.trim().toLowerCase(), newPassword, resetToken);
      setSuccessMsg('Sua palavra-passe foi atualizada com sucesso!');
      
      // Perform automated login with the new password if backend returned a user
      if (data.user && data.token) {
        setTimeout(() => {
          onLoginSuccess(data.user!, data.token!, false);
        }, 1500);
      } else {
        // Fallback to standard login
        const loginData = await authLogin(recoveryEmail.trim().toLowerCase(), newPassword);
        setTimeout(() => {
          onLoginSuccess(loginData.user, loginData.token, false);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de ligação ao servidor ao redefinir palavra-passe.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Por favor, introduza um endereço de e-mail válido.');
      return;
    }

    try {
      const data = await authLogin(email.trim(), password);
      setSuccessMsg('Acesso autorizado! Redirecionando...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token, rememberMe);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de ligação ao servidor de autenticação.');
    }
  };

  const handleCreateGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!guestDisplayName.trim()) {
      setErrorMsg('Por favor, introduza um Nome de Exibição.');
      return;
    }

    setIsCreatingGuest(true);
    try {
      const result = await authCreateGuestUser(guestDisplayName.trim(), guestExpirationHours);
      setSuccessMsg('Sessão de Convidado criada com sucesso! A entrar...');
      setTimeout(() => {
        onLoginSuccess(result.user, result.token, false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar conta de convidado.');
    } finally {
      setIsCreatingGuest(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await authGoogleLogin();
      setSuccessMsg('Sessão iniciada com o Google! Redirecionando...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token, rememberMe);
      }, 1000);
    } catch (err: any) {
      console.warn('Google Popup blocked or failed:', err);
      // Auto open smooth Google Fast Login modal so the user is never stuck
      setGoogleEmailError('');
      setGoogleEmailInput('');
      setShowGoogleEmailModal(true);
    }
  };

  const handleGoogleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleEmailInput.trim() || !googleEmailInput.includes('@')) {
      setGoogleEmailError('Por favor insira um e-mail válido do Google.');
      return;
    }
    setGoogleEmailError('');
    setIsGoogleEmailLoading(true);
    try {
      const data = await authGoogleLoginWithEmail(googleEmailInput.trim());
      setSuccessMsg('Sessão iniciada com o Google com sucesso!');
      setShowGoogleEmailModal(false);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token, rememberMe);
      }, 800);
    } catch (err: any) {
      setGoogleEmailError(err.message || 'Erro ao autenticar com o Google.');
    } finally {
      setIsGoogleEmailLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${currentBrand.bgGradient} text-white flex flex-col justify-center items-center p-4 overflow-hidden select-none transition-all duration-1000`}>
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none z-0 mix-blend-screen transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${mozMap})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060613] via-transparent to-[#060613]/50 z-0 pointer-events-none" />

      {/* Futuristic floating dust particles matched with brand theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full opacity-60 animate-pulse transition-all duration-700" style={{ backgroundColor: currentBrand.particleColor, boxShadow: `0 0 12px ${currentBrand.particleColor}` }} />
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full opacity-40 animate-ping duration-3000 transition-all duration-700" style={{ backgroundColor: currentBrand.particleColor, boxShadow: `0 0 15px ${currentBrand.particleColor}` }} />
        <div className="absolute top-1/2 right-1/10 w-2.5 h-2.5 rounded-full opacity-30 animate-bounce transition-all duration-700" style={{ backgroundColor: currentBrand.particleColor, boxShadow: `0 0 18px ${currentBrand.particleColor}` }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center max-w-[420px] w-full"
      >
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-6 text-center">
          <LeafLogo className="w-20 h-20 md:w-24 md:h-24 mb-2" />
          <h1 className="font-orbitron font-extrabold text-3xl md:text-4xl bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan bg-clip-text text-transparent tracking-wider glow-text-cyan">
            EYES OPEN MZ
          </h1>
          <p className="text-[#a0a0c0] font-rajdhani font-semibold tracking-widest text-xs uppercase mt-1">
            Sua visão é a Nossa Missão
          </p>
        </div>

        {/* AUTOMATIC MOBILE BRAND RECOGNITION BADGE */}
        <motion.div 
          animate={{ scale: brandPulse ? 1.08 : 1 }}
          transition={{ duration: 0.3 }}
          className="mb-5 w-full flex justify-center"
        >
          <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border ${currentBrand.badgeBorder} ${currentBrand.badgeBg} backdrop-blur-md shadow-xl transition-all duration-500`}>
            <span className="text-xl animate-bounce">{currentBrand.icon}</span>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">DISPOSITIVO:</span>
                <span className={`text-[11px] font-orbitron font-extrabold uppercase tracking-wide ${currentBrand.accentText}`}>
                  {currentBrand.name}
                </span>
              </div>
              <span className="text-[9px] text-gray-300/80 font-bold tracking-tight">
                Cor Auto: <span className="text-white font-extrabold">{currentBrand.colorName}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowBrandSelector(!showBrandSelector)}
              className="ml-2 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[9px] font-orbitron font-extrabold text-white uppercase tracking-wider cursor-pointer transition-all border border-white/20 flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{showBrandSelector ? 'Fechar' : 'Mudar Marca'}</span>
            </button>
          </div>
        </motion.div>

        {/* LOGIN BOX WITH BRAND DYNAMIC STYLING */}
        <div className={`w-full ${currentBrand.cardBg} backdrop-blur-xl border ${currentBrand.borderColor} rounded-3xl p-6 md:p-8 ${currentBrand.glowShadow} relative transition-all duration-700`}>
          <div className={`absolute -top-[1.5px] -left-[1.5px] w-12 h-12 border-t-2 border-l-2 ${currentBrand.borderColor} rounded-tl-3xl`} />
          <div className={`absolute -bottom-[1.5px] -right-[1.5px] w-12 h-12 border-b-2 border-r-2 ${currentBrand.borderColor} rounded-br-3xl`} />
          
          {isRecovering ? (
            <div className="space-y-5">
              {/* Header with back button */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    if (recoveryStep === 'email' || recoveryStep === 'success_message') {
                      setIsRecovering(false);
                      setRecoveryStep('email');
                    } else if (recoveryStep === 'code') {
                      setRecoveryStep('email');
                    } else if (recoveryStep === 'new_password') {
                      setRecoveryStep('code');
                    }
                  }}
                  className="p-2 bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 rounded-xl text-[#a0a0c0] hover:text-white transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-left">
                  <h2 className="text-sm font-orbitron font-extrabold text-neon-cyan tracking-wider uppercase">
                    Recuperar Conta
                  </h2>
                  <p className="text-[9px] text-[#a0a0c0] font-rajdhani font-bold uppercase tracking-wider">
                    {recoveryStep === 'email' && 'Etapa 1: Endereço de e-mail'}
                    {recoveryStep === 'success_message' && 'Sucesso'}
                    {recoveryStep === 'code' && 'Etapa 2: Código de confirmação'}
                    {recoveryStep === 'new_password' && 'Etapa 3: Nova senha'}
                  </p>
                </div>
              </div>

              {recoveryStep === 'email' && (
                <form onSubmit={handleInitiateRecovery} className="space-y-5">
                  <p className="text-xs text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed text-left">
                    Introduza o seu endereço de e-mail registado. Enviaremos uma hiperligação oficial de redefinição de palavra-passe diretamente para a sua caixa de entrada através do Firebase Auth.
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Endereço de e-mail (Gmail)"
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-neon-cyan to-[#aa00ff] hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
                  >
                    Enviar Link de Recuperação
                  </button>
                </form>
              )}

              {recoveryStep === 'success_message' && (
                <div className="space-y-5 text-center py-4">
                  <div className="mx-auto w-16 h-16 bg-neon-cyan/10 border border-neon-cyan/40 rounded-full flex items-center justify-center text-neon-cyan animate-pulse">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-white font-orbitron font-bold text-sm tracking-wide uppercase">
                    E-mail Enviado!
                  </h3>
                  <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/15 rounded-xl text-xs font-rajdhani text-left leading-relaxed text-[#a0a0c0]">
                    <p className="mb-2">
                      Enviamos um link de recuperação oficial do Firebase para o e-mail: <strong className="text-white">{recoveryEmail}</strong>.
                    </p>
                    <p>
                      Por favor, abra o e-mail, clique no link de redefinição de palavra-passe fornecido pelo Firebase e siga as instruções para definir a sua nova palavra-passe de forma 100% segura.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(false);
                      setRecoveryStep('email');
                    }}
                    className="w-full bg-gradient-to-r from-neon-cyan to-[#aa00ff] hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg"
                  >
                    Voltar ao Login
                  </button>
                </div>
              )}

              {recoveryStep === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="p-3.5 bg-neon-cyan/5 border border-neon-cyan/25 rounded-2xl text-xs text-center font-rajdhani">
                    <p className="text-[#a0a0c0] font-semibold leading-relaxed">
                      Enviamos um código de segurança de 6 dígitos para o e-mail: <strong className="text-neon-cyan">{recoveryEmail}</strong>. Verifique a sua caixa de entrada.
                    </p>
                  </div>

                  {etherealUrl && (
                    <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-center">
                      <p className="text-xs text-neon-cyan font-rajdhani font-semibold">
                        Servidor em ambiente de testes:
                      </p>
                      <a
                        href={etherealUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white hover:text-neon-magenta underline font-rajdhani font-bold transition-all block mt-1"
                      >
                        Clique aqui para ver a caixa de entrada de testes ↗
                      </a>
                    </div>
                  )}

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                      <KeyRound className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Introduza o código de 6 dígitos"
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-center text-sm tracking-widest font-orbitron outline-none transition-all placeholder:text-gray-500 font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-neon-cyan to-[#aa00ff] hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
                  >
                    Confirmar Código
                  </button>
                </form>
              )}

              {recoveryStep === 'new_password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                  <p className="text-xs text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed text-left">
                    Excelente! Crie uma palavra-passe forte que ainda não tenha utilizado nesta conta para garantir a máxima segurança dos seus dados.
                  </p>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova Senha de Acesso"
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirmar Nova Senha"
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg shadow-green-500/20 uppercase"
                  >
                    Gravar & Iniciar Sessão
                  </button>
                </form>
              )}

              {/* Feedback Messages */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center font-rajdhani font-bold"
                >
                  {errorMsg}
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs text-center font-rajdhani font-bold"
                >
                  {successMsg}
                </motion.div>
              )}

              {/* Cancel Link */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setIsRecovering(false);
                  }}
                  className="text-xs font-rajdhani font-bold text-neon-cyan hover:text-white transition-colors underline underline-offset-4 decoration-neon-cyan/50 uppercase tracking-wider cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            </div>
          ) : showGuestSetup ? (
            <div className="space-y-5">
              {/* Header with back button */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setShowGuestSetup(false);
                  }}
                  className="p-2 bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 rounded-xl text-[#a0a0c0] hover:text-white transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-left">
                  <h2 className="text-sm font-orbitron font-extrabold text-neon-cyan tracking-wider uppercase">
                    Entrar como Convidado
                  </h2>
                  <p className="text-[9px] text-[#a0a0c0] font-rajdhani font-bold uppercase tracking-wider">
                    Sessão Temporária Exclusiva
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateGuestSubmit} className="space-y-5">
                <p className="text-xs text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed text-left">
                  Insira o seu nome de exibição abaixo e selecione a validade da conta. Suas permissões serão limitadas apenas à visualização do feed.
                </p>

                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-[#a0a0c0] text-left">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={guestDisplayName}
                    onChange={(e) => setGuestDisplayName(e.target.value)}
                    placeholder="Ex: Visitante Imperial"
                    maxLength={25}
                    required
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base text-left"
                  />
                </div>

                {/* Expiration Options */}
                <div className="space-y-2">
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-[#a0a0c0] text-left">
                    Tempo de Expiração
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGuestExpirationHours(1)}
                      className={`py-3 rounded-xl font-orbitron font-bold text-[10px] tracking-wider uppercase border transition-all ${
                        guestExpirationHours === 1
                          ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-lg shadow-neon-cyan/10'
                          : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      1 Hora
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestExpirationHours(24)}
                      className={`py-3 rounded-xl font-orbitron font-bold text-[10px] tracking-wider uppercase border transition-all ${
                        guestExpirationHours === 24
                          ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-lg shadow-neon-cyan/10'
                          : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      24 Horas
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingGuest}
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
                >
                  {isCreatingGuest ? 'A Criar Sessão...' : 'Confirmar & Entrar'}
                </button>
              </form>

              {/* Feedback Messages */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center font-rajdhani font-bold"
                >
                  {errorMsg}
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs text-center font-rajdhani font-bold"
                >
                  {successMsg}
                </motion.div>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setShowGuestSetup(false);
                  }}
                  className="text-xs font-rajdhani font-bold text-neon-cyan hover:text-white transition-colors underline underline-offset-4 decoration-neon-cyan/50 uppercase tracking-wider cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-orbitron font-semibold text-center mb-6 tracking-wide text-white/90">
                ENTRAR NA CONTA
              </h2>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Endereço de e-mail (Gmail)"
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha de Acesso"
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                  />
                </div>

                {/* Remember Login Checkbox and Forgot Password */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#a0a0c0] font-rajdhani font-semibold">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-neon-cyan/40 bg-black/40 text-neon-cyan focus:ring-neon-cyan cursor-pointer"
                    />
                    <span>Lembrar Login</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setIsRecovering(true);
                      setRecoveryStep('email');
                      setRecoveryEmail(email || '');
                    }}
                    className="text-neon-cyan hover:text-white transition-colors font-rajdhani font-bold underline underline-offset-2 decoration-neon-cyan/30 cursor-pointer"
                  >
                    Esqueci-me da senha
                  </button>
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r ${currentBrand.buttonGradient} ${currentBrand.buttonTextColor} hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl font-orbitron font-extrabold text-sm tracking-wider cursor-pointer shadow-lg uppercase`}
                >
                  CONFIRMAR ENTRADA
                </button>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 active:scale-98 transition-all py-3 rounded-xl font-orbitron font-extrabold text-xs tracking-wider cursor-pointer shadow-lg mt-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>ENTRAR COM GOOGLE</span>
                </button>
              </form>

              {/* Feedback Messages */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center font-rajdhani font-bold"
                >
                  {errorMsg}
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs text-center font-rajdhani font-bold"
                >
                  {successMsg}
                </motion.div>
              )}

              {/* Register Redirect */}
              <div className="mt-6 text-center space-y-4">
                <button
                  onClick={onGoToRegister}
                  className="text-xs font-rajdhani font-bold text-neon-cyan hover:text-white transition-colors underline underline-offset-4 decoration-neon-cyan/50"
                >
                  Criar uma nova conta de acesso
                </button>

                {/* Divider and Guest Login */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-gray-600 text-[9px] font-bold tracking-widest font-orbitron uppercase">OU</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setGuestDisplayName('');
                    setGuestExpirationHours(24);
                    setShowGuestSetup(true);
                  }}
                  className="w-full py-3 bg-black/40 hover:bg-[#121235]/60 border border-white/10 hover:border-neon-cyan/60 rounded-xl text-[10px] font-orbitron font-extrabold tracking-widest text-gray-300 hover:text-white cursor-pointer uppercase transition-all"
                >
                  Entrar como Convidado
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* BRAND SELECTOR MODAL / OVERLAY */}
      {showBrandSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#0b0c20] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-sm text-white uppercase tracking-wider">
                    Marcas de Celular & Temas
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold">
                    Selecione para alterar a cor e atmosfera do Login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandSelector(false)}
                className="text-gray-400 hover:text-white p-1 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {Object.values(DEVICE_BRANDS).map((brand) => {
                const isSelected = selectedBrandKey === brand.key;
                return (
                  <button
                    key={brand.key}
                    type="button"
                    onClick={() => handleSelectBrand(brand.key)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? `${brand.badgeBorder} ${brand.badgeBg} shadow-lg ring-1 ${brand.badgeBorder}`
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{brand.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-orbitron font-extrabold text-white">
                            {brand.name}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold">{brand.colorName}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-gray-400 font-semibold italic">
                💡 O sistema detecta automaticamente a marca do celular quando acede no telemóvel!
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Google Email Fast Login Fallback Modal */}
      {showGoogleEmailModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[80000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#0b0b20] border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-sm text-white tracking-wider uppercase">Entrar com Google</h3>
                  <p className="text-[10px] text-gray-400 font-bold">Confirmação Rápida de Conta Google</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleEmailModal(false)}
                className="text-gray-400 hover:text-white p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-semibold">
              Devido às restrições de pop-up do navegador, introduza o seu e-mail do **Google (Gmail)** para iniciar a sessão com a sua identidade Google instantaneamente:
            </p>

            <form onSubmit={handleGoogleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-extrabold tracking-widest block mb-1">
                  E-mail do Google (Gmail)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neon-cyan" />
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="ex: oficiofaustino78@gmail.com"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-[#121235] border border-neon-cyan/30 focus:border-neon-cyan rounded-xl text-xs text-white placeholder-gray-500 font-bold outline-none transition-all"
                  />
                </div>
              </div>

              {googleEmailError && (
                <p className="text-[11px] text-red-400 font-bold bg-red-950/40 border border-red-500/20 p-2 rounded-lg">
                  {googleEmailError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleEmailModal(false)}
                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-extrabold text-xs rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGoogleEmailLoading}
                  className="py-2.5 px-4 bg-gradient-to-r from-neon-cyan to-blue-600 hover:brightness-110 text-black font-extrabold text-xs rounded-xl cursor-pointer transition-all uppercase tracking-wider disabled:opacity-50"
                >
                  {isGoogleEmailLoading ? 'A Autenticar...' : 'Entrar Agora'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
