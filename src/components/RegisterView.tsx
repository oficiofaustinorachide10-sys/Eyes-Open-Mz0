/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Shield, Lock, Smartphone, Mail, MapPin, Globe, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROVINCES, DISTRICTS_BY_PROVINCE, simpleHash, validatePhone, validateEmail, validateNames, validateNickname } from '../utils';
import { User as UserType } from '../types';
import LeafLogo from './LeafLogo';
// @ts-ignore
import mozMap from '../assets/images/mozambique_map_1783337073381.jpg';

interface RegisterViewProps {
  users: UserType[];
  onRegisterSuccess: (newUser: UserType) => void;
  onGoToLogin: () => void;
}

export default function RegisterView({ users, onRegisterSuccess, onGoToLogin }: RegisterViewProps) {
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [showProvinceList, setShowProvinceList] = useState(false);
  const [showDistrictList, setShowDistrictList] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [surname, setSurname] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('Estado: à espera de submissão.');
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info');
  const [showWelcome, setShowWelcome] = useState(false);
  const [createdUser, setCreatedUser] = useState<UserType | null>(null);

  const calculatePasswordStrength = (pw: string) => {
    if (!pw) return { text: 'Inexistente', color: 'text-gray-500' };
    if (pw.length < 6) return { text: 'Fraca (Mínimo 6 caracteres)', color: 'text-red-500' };
    
    let score = 0;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (pw.length >= 8 && score >= 3) return { text: 'Excelente', color: 'text-green-400' };
    if (score >= 2) return { text: 'Segura', color: 'text-yellow-400' };
    return { text: 'Média', color: 'text-orange-400' };
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('Validando dados...');
    setStatusType('info');

    if (!province) {
      setStatusMsg('Por favor, selecione a sua província.');
      setStatusType('error');
      return;
    }

    if (!district) {
      setStatusMsg('Por favor, selecione o seu distrito.');
      setStatusType('error');
      return;
    }

    // Phone checks
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) {
      setStatusMsg(phoneCheck.error || 'Número de telefone incorreto.');
      setStatusType('error');
      return;
    }

    // Account limit checks (3 accounts per phone)
    const existingAccountsCount = users.filter((u) => u.phone === phoneCheck.normalized).length;
    if (existingAccountsCount >= 3) {
      setStatusMsg('Este número de telefone já possui o limite máximo de 3 contas criadas.');
      setStatusType('error');
      return;
    }

    // Email checks
    if (!validateEmail(email)) {
      setStatusMsg('Por favor, informe um endereço de e-mail válido.');
      setStatusType('error');
      return;
    }

    // Fullname token validation
    const nameCheck = validateNames(fullname, firstname, surname);
    if (!nameCheck.ok) {
      setStatusMsg(nameCheck.error || 'Erro na validação do nome.');
      setStatusType('error');
      return;
    }

    // Nickname checks
    if (!validateNickname(nickname)) {
      setStatusMsg('Nickname inválido. Deve possuir pelo menos 3 caracteres, sem símbolos especiais.');
      setStatusType('error');
      return;
    }

    // Password strength
    if (password.length < 6) {
      setStatusMsg('A senha informada deve possuir no mínimo 6 caracteres.');
      setStatusType('error');
      return;
    }

    // All validation passed, compile new user
    const hashedPass = simpleHash(password);
    const userId = 'user_' + Math.random().toString(36).substring(2, 11);

    const newUser: UserType = {
      id: userId,
      phone: phoneCheck.normalized,
      email: email.trim(),
      fullname: fullname.trim(),
      firstname: firstname.trim(),
      surname: surname.trim(),
      nickname: nickname.trim(),
      password: hashedPass,
      province,
      district,
      created: new Date().toISOString(),
      avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 50) + 1500000000000}?auto=format&fit=crop&q=80&w=150`, // Random nice avatar
      stats: { likes: 0, posts: 0, friends: 0 },
      nameEditDate: null,
      isVIP: false,
    };

    setStatusMsg('Registando utilizador...');
    setStatusType('success');
    setCreatedUser(newUser);

    // Prompt "Bem vindo, Sua visão é a Nossa Mission" central modal
    setTimeout(() => {
      setShowWelcome(true);
    }, 400);
  };

  const handleFinishWelcome = () => {
    setShowWelcome(false);
    if (createdUser) {
      onRegisterSuccess(createdUser);
    }
  };

  const pwStrength = calculatePasswordStrength(password);

  return (
    <div className="relative min-h-screen bg-[#060613] text-white flex justify-center items-center p-4 overflow-hidden select-none py-12">
      {/* Background Mozambique Map */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none z-0 mix-blend-screen scale-105"
        style={{ backgroundImage: `url(${mozMap})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060613] via-transparent to-[#060613]/50 z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[500px]"
      >
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center text-center mb-6">
          <LeafLogo className="w-20 h-20 mb-2" />
          <h1 className="font-orbitron font-extrabold text-3xl bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent glow-text-cyan tracking-wider">
            EYES OPEN MZ
          </h1>
          <p className="text-gray-400 font-rajdhani font-bold tracking-widest text-xs uppercase mt-1">
            Registo de Novo Acesso
          </p>
        </div>

        {/* Scrollable Registration Box */}
        <div className="w-full bg-[#0d0d26]/85 backdrop-blur-2xl border border-neon-cyan/40 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-neon-cyan rounded-tl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-neon-magenta rounded-br-3xl pointer-events-none" />

          <h2 className="text-xl font-orbitron font-semibold text-center mb-6 text-neon-cyan tracking-wide">
            CRIAR CONTA NOVA
          </h2>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Província & Distrito Collapsible Dropdown Selector */}
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 0. Província
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowProvinceList(!showProvinceList);
                    setShowDistrictList(false);
                  }}
                  className="w-full bg-[#121235]/60 border border-neon-cyan/30 hover:border-neon-cyan rounded-xl py-3 px-4 text-left font-rajdhani font-semibold text-base text-white flex items-center justify-between transition-all"
                >
                  <span>{province || 'Selecione a sua Província...'}</span>
                  {showProvinceList ? <ChevronUp className="w-5 h-5 text-neon-cyan" /> : <ChevronDown className="w-5 h-5 text-neon-cyan" />}
                </button>

                <AnimatePresence>
                  {showProvinceList && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-30 left-0 right-0 mt-1 bg-[#0c0c24] border border-neon-cyan/40 rounded-xl max-h-48 overflow-y-auto shadow-2xl p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-neon-cyan"
                    >
                      {PROVINCES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setProvince(p);
                            setDistrict(''); // Reset district when province changes
                            setShowProvinceList(false);
                            setShowDistrictList(true); // Automatically open district dropdown
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-rajdhani font-bold transition-all ${
                            province === p 
                              ? 'bg-neon-cyan/20 text-white' 
                              : 'text-gray-300 hover:bg-[#151540] hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Distrito Selector - Only visible when province is selected */}
              {province && (
                <div className="relative">
                  <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Distrito de {province}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDistrictList(!showDistrictList);
                      setShowProvinceList(false);
                    }}
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 hover:border-neon-cyan rounded-xl py-3 px-4 text-left font-rajdhani font-semibold text-base text-white flex items-center justify-between transition-all"
                  >
                    <span>{district || 'Selecione o seu Distrito...'}</span>
                    {showDistrictList ? <ChevronUp className="w-5 h-5 text-neon-cyan" /> : <ChevronDown className="w-5 h-5 text-neon-cyan" />}
                  </button>

                  <AnimatePresence>
                    {showDistrictList && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-30 left-0 right-0 mt-1 bg-[#0c0c24] border border-neon-cyan/40 rounded-xl max-h-48 overflow-y-auto shadow-2xl p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-neon-cyan"
                      >
                        {(DISTRICTS_BY_PROVINCE[province] || []).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setDistrict(d);
                              setShowDistrictList(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-rajdhani font-bold transition-all ${
                              district === d 
                                ? 'bg-neon-cyan/20 text-white' 
                                : 'text-gray-300 hover:bg-[#151540] hover:text-white'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Phone input */}
            <div>
              <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> 1. Número de Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +258 86 000 1111 ou 840123456"
                className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
              />
            </div>

            {/* Email input */}
            <div>
              <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> 2. Endereço de Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: seu-nome@gmail.com"
                className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
              />
            </div>

            {/* Fullname input */}
            <div>
              <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" /> 3. Nome Completo (Min. 3 palavras)
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Nome, do Meio e Apelido"
                className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
              />
            </div>

            {/* First and Last Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-neon-cyan font-rajdhani font-bold text-xs uppercase mb-2 tracking-wider">
                  4. Primeiro Nome
                </label>
                <input
                  type="text"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="Primeiro"
                  className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                />
              </div>
              <div>
                <label className="block text-neon-cyan font-rajdhani font-bold text-xs uppercase mb-2 tracking-wider">
                  5. Apelido
                </label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Último nome"
                  className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                />
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> 6. Nickname (Identificação)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: alex_mz (sem caracteres especiais)"
                className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> 7. Senha de Segurança (Mín. 6)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
              />
              {password && (
                <div className="mt-1.5 text-xs font-rajdhani font-bold flex items-center gap-1">
                  <span className="text-gray-400">Força da Senha:</span>
                  <span className={pwStrength.color}>{pwStrength.text}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-sm tracking-wider cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
            >
              CRIAR CONTA NOVA
            </button>
          </form>

          {/* Status Feedback */}
          <div className={`mt-5 p-3 rounded-xl border text-xs text-center font-rajdhani font-bold ${
            statusType === 'error'
              ? 'bg-red-950/40 border-red-500/30 text-red-400'
              : statusType === 'success'
              ? 'bg-green-950/40 border-green-500/30 text-green-400'
              : 'bg-[#121235]/60 border-neon-cyan/25 text-[#a0a0c0]'
          }`}>
            {statusMsg}
          </div>

          {/* Already have account redirection */}
          <div className="mt-6 text-center">
            <button
              onClick={onGoToLogin}
              className="text-xs font-rajdhani font-bold text-neon-cyan hover:text-white transition-colors underline underline-offset-4 decoration-neon-cyan/50"
            >
              Já possuo uma conta registrada. Aceder login.
            </button>
          </div>
        </div>
      </motion.div>

      {/* grand custom welcome overlay modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-full max-w-[450px] bg-[#0c0c24] border-2 border-neon-cyan rounded-3xl p-8 text-center shadow-3xl relative"
            >
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-neon-cyan rounded-tl-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-neon-magenta rounded-br-3xl pointer-events-none" />

              <CheckCircle2 className="w-16 h-16 text-neon-cyan mx-auto mb-6 animate-bounce" />
              
              <h3 className="font-orbitron font-extrabold text-2xl text-white tracking-wide glow-text-cyan leading-snug">
                CONTA CRIADA!
              </h3>
              
              <p className="mt-4 font-rajdhani font-bold text-neon-cyan text-lg leading-relaxed max-w-[340px] mx-auto uppercase">
                &quot;Bem-vindo, sua visão é a nossa missão&quot;
              </p>
              
              <p className="mt-2 text-gray-400 font-rajdhani font-semibold text-sm">
                O seu perfil foi gerado com sucesso. Prepare-se para vivenciar uma plataforma totalmente imersiva.
              </p>

              <button
                onClick={handleFinishWelcome}
                className="mt-8 px-8 py-3 bg-neon-cyan text-black font-orbitron font-extrabold text-xs tracking-widest rounded-full hover:bg-white hover:shadow-2xl hover:shadow-neon-cyan/50 transition-all cursor-pointer"
              >
                PROSSEGUIR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
