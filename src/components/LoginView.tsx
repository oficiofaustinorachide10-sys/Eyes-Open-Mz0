/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, KeyRound, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { simpleHash, validateEmail } from '../utils';
import { User as UserType } from '../types';
import LeafLogo from './LeafLogo';
// @ts-ignore
import mozMap from '../assets/images/mozambique_map_1783337073381.jpg';
import { authLogin, authRecover, authResetPassword, authGoogleLogin, authCreateGuestUser } from '../lib/authService';

interface LoginViewProps {
  users: UserType[];
  onLoginSuccess: (user: UserType, token: string, rememberMe?: boolean) => void;
  onGoToRegister: () => void;
  onGoToSavedAccounts?: () => void;
}

export default function LoginView({ users, onLoginSuccess, onGoToRegister, onGoToSavedAccounts }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Recovery States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code' | 'new_password'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Guest Account States
  const [showGuestSetup, setShowGuestSetup] = useState(false);
  const [guestDisplayName, setGuestDisplayName] = useState('');
  const [guestExpirationHours, setGuestExpirationHours] = useState<number>(24);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

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
      setSentCode(data.code);
      setSuccessMsg(`Código gerado com sucesso!`);
      setTimeout(() => {
        setSuccessMsg('');
        setRecoveryStep('code');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de ligação ao servidor de recuperação.');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (recoveryCodeInput.trim() !== sentCode) {
      setErrorMsg('Código de confirmação incorreto. Verifique e tente novamente.');
      return;
    }

    setSuccessMsg('Código validado com sucesso!');
    setTimeout(() => {
      setSuccessMsg('');
      setRecoveryStep('new_password');
    }, 1000);
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
      await authResetPassword(recoveryEmail.trim().toLowerCase(), newPassword);
      setSuccessMsg('Sua palavra-passe foi atualizada! Acedendo...');
      
      // Perform automated login with the new password
      const data = await authLogin(recoveryEmail.trim().toLowerCase(), newPassword);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token, false);
      }, 1500);
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
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar sessão com o Google.');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060613] text-white flex flex-col justify-center items-center p-4 overflow-hidden select-none">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none z-0 mix-blend-screen transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${mozMap})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060613] via-transparent to-[#060613]/50 z-0 pointer-events-none" />

      {/* Futuristic floating dust particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-[#00f5ff] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-[#ff00ff] rounded-full opacity-30 animate-ping duration-3000" />
        <div className="absolute top-1/2 right-1/10 w-2 h-2 bg-[#00f5ff] rounded-full opacity-20 animate-bounce" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center max-w-[420px] w-full"
      >
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8 text-center">
          <LeafLogo className="w-24 h-24 mb-3" />
          <h1 className="font-orbitron font-extrabold text-3xl md:text-4xl bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan bg-clip-text text-transparent tracking-wider glow-text-cyan">
            EYES OPEN MZ
          </h1>
          <p className="text-[#a0a0c0] font-rajdhani font-semibold tracking-widest text-xs uppercase mt-2">
            Sua visão é a Nossa Missão
          </p>
        </div>

        {/* LOGIN BOX */}
        <div className="w-full bg-[#0d0d26]/80 backdrop-blur-xl border border-neon-cyan/40 rounded-3xl p-6 md:p-8 shadow-2xl relative">
          <div className="absolute -top-[1.5px] -left-[1.5px] w-12 h-12 border-t-2 border-l-2 border-neon-cyan rounded-tl-3xl" />
          <div className="absolute -bottom-[1.5px] -right-[1.5px] w-12 h-12 border-b-2 border-r-2 border-neon-magenta rounded-br-3xl" />
          
          {isRecovering ? (
            <div className="space-y-5">
              {/* Header with back button */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    if (recoveryStep === 'email') {
                      setIsRecovering(false);
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
                    {recoveryStep === 'code' && 'Etapa 2: Código de confirmação'}
                    {recoveryStep === 'new_password' && 'Etapa 3: Nova senha'}
                  </p>
                </div>
              </div>

              {recoveryStep === 'email' && (
                <form onSubmit={handleInitiateRecovery} className="space-y-5">
                  <p className="text-xs text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed text-left">
                    Introduza o seu endereço de e-mail registado. Enviaremos um código de verificação para que possa redefinir a sua palavra-passe com toda a segurança.
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
                    Enviar Código de Segurança
                  </button>
                </form>
              )}

              {recoveryStep === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="p-3.5 bg-neon-cyan/5 border border-neon-cyan/25 rounded-2xl text-xs text-center font-rajdhani">
                    <p className="text-[#a0a0c0] font-semibold">
                      O código de recuperação foi gerado!
                    </p>
                    <p className="text-white font-orbitron font-black text-sm tracking-widest mt-1 bg-black/40 py-1.5 rounded-xl border border-white/5 select-all">
                      {sentCode}
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1.5">
                      Copie o código acima e insira-o abaixo para prosseguir.
                    </p>
                  </div>

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
                  className="w-full bg-gradient-to-r from-neon-cyan to-[#aa00ff] hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-sm tracking-wider cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
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

                {onGoToSavedAccounts && localStorage.getItem('eo_saved_accounts') && (
                  <button
                    type="button"
                    onClick={onGoToSavedAccounts}
                    className="w-full mt-2.5 py-3 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/10 hover:border-blue-400/50 rounded-xl text-[10px] font-orbitron font-extrabold tracking-widest text-blue-400 hover:text-white cursor-pointer uppercase transition-all"
                  >
                    Ver Contas Guardadas
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
