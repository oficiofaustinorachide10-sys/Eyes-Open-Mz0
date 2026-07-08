/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Shield, Lock, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { simpleHash, validatePhone } from '../utils';
import { User as UserType } from '../types';
// @ts-ignore
import mozMap from '../assets/images/mozambique_map_1783337073381.jpg';

interface LoginViewProps {
  users: UserType[];
  onLoginSuccess: (user: UserType) => void;
  onGoToRegister: () => void;
}

export default function LoginView({ users, onLoginSuccess, onGoToRegister }: LoginViewProps) {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nickname.trim() || !phone.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos do formulário.');
      return;
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.ok) {
      setErrorMsg(phoneValidation.error || 'Número de telefone inválido.');
      return;
    }

    const normalizedPhone = phoneValidation.normalized;
    const hashedPass = simpleHash(password);

    // Look up user
    const foundUser = users.find(
      (u) =>
        u.nickname.toLowerCase() === nickname.trim().toLowerCase() &&
        u.phone === normalizedPhone &&
        u.password === hashedPass
    );

    if (!foundUser) {
      const phoneExists = users.some((u) => u.phone === normalizedPhone);
      if (!phoneExists) {
        setErrorMsg('Este número de telefone não está registrado no sistema.');
      } else {
        setErrorMsg('Dados incorretos. Por favor, valide o nickname, número ou senha.');
      }
      return;
    }

    setSuccessMsg('Acesso autorizado! Redirecionando...');
    setTimeout(() => {
      onLoginSuccess(foundUser);
    }, 1200);
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
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full border-2 border-neon-cyan glow-box-cyan flex items-center justify-center bg-[#0d0d26] mb-4"
          >
            <Shield className="w-12 h-12 text-neon-cyan" />
          </motion.div>
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
          
          <h2 className="text-xl font-orbitron font-semibold text-center mb-6 tracking-wide text-white/90">
            ENTRAR NA CONTA
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Nickname Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nome do usuário (nickname)"
                className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
              />
            </div>

            {/* Phone Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan">
                <Smartphone className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Número (+258 ou 9 dígitos)"
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

            {/* Action Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-neon-cyan to-[#aa00ff] hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-sm tracking-wider cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
            >
              CONFIRMAR ENTRADA
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
          <div className="mt-6 text-center">
            <button
              onClick={onGoToRegister}
              className="text-xs font-rajdhani font-bold text-neon-cyan hover:text-white transition-colors underline underline-offset-4 decoration-neon-cyan/50"
            >
              Criar uma nova conta de acesso
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
