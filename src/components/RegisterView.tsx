/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, Lock, Smartphone, Mail, MapPin, Globe, CheckCircle2, 
  ChevronDown, ChevronUp, Calendar, Briefcase, UserCheck, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROVINCES, DISTRICTS_BY_PROVINCE, validatePhone, validateEmail, validateNames, validateNickname } from '../utils';
import { User as UserType } from '../types';
import LeafLogo from './LeafLogo';
// @ts-ignore
import mozMap from '../assets/images/mozambique_map_1783337073381.jpg';
import { authGoogleLogin, authRegisterEmailInitiate, authRegisterEmailConfirm, authRegisterComplete } from '../lib/authService';

interface RegisterViewProps {
  users: UserType[];
  onRegisterSuccess: (newUser: UserType, token: string) => void;
  onGoToLogin: () => void;
}

export default function RegisterView({ users, onRegisterSuccess, onGoToLogin }: RegisterViewProps) {
  // Step manager
  const [registrationStep, setRegistrationStep] = useState<'email' | 'code' | 'profile'>('email');

  // Step 1: Email States
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [etherealUrl, setEtherealUrl] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 2: Personal & Geographic States
  const [fullname, setFullname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [surname, setSurname] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [bairro, setBairro] = useState('');

  // Dropdowns UI state
  const [showProvinceList, setShowProvinceList] = useState(false);
  const [showDistrictList, setShowDistrictList] = useState(false);
  const [showGenderList, setShowGenderList] = useState(false);

  // Global Status Feedbacks
  const [statusMsg, setStatusMsg] = useState('Estado: à espera de e-mail.');
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info');
  const [showWelcome, setShowWelcome] = useState(false);
  const [createdUser, setCreatedUser] = useState<UserType | null>(null);
  const [createdToken, setCreatedToken] = useState('');

  // Manage security resend timer decrement
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

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

  // Submit Step 1: Send Validation Code via real SMTP
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('Validando e-mail...');
    setStatusType('info');

    if (!email || !confirmEmail) {
      setStatusMsg('Por favor, preencha o e-mail e a confirmação do mesmo.');
      setStatusType('error');
      return;
    }

    if (!validateEmail(email)) {
      setStatusMsg('Por favor, forneça um endereço de e-mail válido.');
      setStatusType('error');
      return;
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setStatusMsg('Os endereços de e-mail fornecidos não coincidem.');
      setStatusType('error');
      return;
    }

    // Check pre-existence in seed users / cached list
    const emailExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      setStatusMsg('Este endereço de e-mail já está em uso.');
      setStatusType('error');
      return;
    }

    setStatusMsg('A disparar código de verificação via SMTP para o seu e-mail...');
    setStatusType('info');

    authRegisterEmailInitiate(email.trim(), confirmEmail.trim())
      .then((data) => {
        setPendingToken(data.pendingToken);
        setResendTimer(60); // Reset timer to 60 seconds constraint

        if (data.previewUrl) {
          setEtherealUrl(data.previewUrl);
          setStatusMsg('Código gerado! Para fins de teste local, clique no link de visualização.');
        } else {
          setEtherealUrl(null);
          setStatusMsg('Código de confirmação enviado com sucesso para o seu e-mail!');
        }
        setStatusType('success');

        setTimeout(() => {
          setRegistrationStep('code');
          setStatusMsg('Introduza o código de 6 dígitos recebido.');
          setStatusType('info');
        }, 1500);
      })
      .catch((err) => {
        setStatusMsg(err.message || 'Falha ao processar envio do código SMTP.');
        setStatusType('error');
      });
  };

  // Resend code logic
  const handleResendCode = () => {
    if (resendTimer > 0) return;

    setStatusMsg('A reenviar código de verificação para o seu e-mail...');
    setStatusType('info');

    authRegisterEmailInitiate(email.trim(), confirmEmail.trim())
      .then((data) => {
        setPendingToken(data.pendingToken);
        setResendTimer(60); // Reset timer again to prevent flood

        if (data.previewUrl) {
          setEtherealUrl(data.previewUrl);
          setStatusMsg('Código reenviado! Pode ver o e-mail no link de testes abaixo.');
        } else {
          setEtherealUrl(null);
          setStatusMsg('Novo código de verificação enviado com sucesso!');
        }
        setStatusType('success');
      })
      .catch((err) => {
        setStatusMsg(err.message || 'Falha ao reenviar código de verificação.');
        setStatusType('error');
      });
  };

  // Submit Step 1.5: Verify Code from user
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setStatusMsg('Por favor, insira o código de confirmação de 6 dígitos.');
      setStatusType('error');
      return;
    }

    setStatusMsg('A validar código de confirmação...');
    setStatusType('info');

    authRegisterEmailConfirm(verificationCode.trim(), pendingToken)
      .then((data) => {
        setStatusMsg('Seja bem-vindo, está quase a criar a sua conta.');
        setStatusType('success');

        setTimeout(() => {
          setRegistrationStep('profile');
          setStatusMsg('Por favor, preencha o seu perfil e localização geográfica obrigatória.');
          setStatusType('info');
        }, 2200);
      })
      .catch((err) => {
        setStatusMsg(err.message || 'Código de confirmação incorreto. Validação rejeitada.');
        setStatusType('error');
      });
  };

  // Submit Step 2: Complete user profile and create account
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullname || !firstname || !surname || !nickname || !password || !phone || !birthdate || !gender || !profession || !province || !district || !bairro) {
      setStatusMsg('Por favor, preencha todos os campos obrigatórios do perfil.');
      setStatusType('error');
      return;
    }

    // Phone format and constraint checks
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) {
      setStatusMsg(phoneCheck.error || 'Número de telefone incorreto.');
      setStatusType('error');
      return;
    }

    // Max 3 accounts limitation check
    const phoneCount = users.filter((u) => u.phone === phoneCheck.normalized).length;
    if (phoneCount >= 3) {
      setStatusMsg('Este número de telefone já possui o limite máximo de 3 contas.');
      setStatusType('error');
      return;
    }

    // Name validations
    const nameCheck = validateNames(fullname, firstname, surname);
    if (!nameCheck.ok) {
      setStatusMsg(nameCheck.error || 'Por favor, insira um nome válido.');
      setStatusType('error');
      return;
    }

    // Nickname validation
    if (!validateNickname(nickname)) {
      setStatusMsg('Nickname inválido. Use letras, números ou sublinhados (mín. 3).');
      setStatusType('error');
      return;
    }

    const nicknameExists = users.some((u) => u.nickname.toLowerCase() === nickname.trim().toLowerCase());
    if (nicknameExists) {
      setStatusMsg('Este nickname já está em uso por outro utilizador.');
      setStatusType('error');
      return;
    }

    if (password.length < 6) {
      setStatusMsg('A senha de segurança deve possuir no mínimo 6 caracteres.');
      setStatusType('error');
      return;
    }

    setStatusMsg('A registar perfil e encriptar dados...');
    setStatusType('info');

    const profileData = {
      email: email.trim().toLowerCase(),
      phone: phoneCheck.normalized,
      fullname: fullname.trim(),
      firstname: firstname.trim(),
      surname: surname.trim(),
      nickname: nickname.trim(),
      password,
      province,
      district,
      bairro: bairro.trim(),
      birthdate,
      gender,
      profession: profession.trim(),
      avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 50) + 1500000000000}?auto=format&fit=crop&q=80&w=150`
    };

    authRegisterComplete(profileData)
      .then((data) => {
        setStatusMsg('Registo concluído e conta criada com sucesso!');
        setStatusType('success');
        setCreatedUser(data.user);
        setCreatedToken(data.token);

        setTimeout(() => {
          setShowWelcome(true);
        }, 500);
      })
      .catch((err) => {
        setStatusMsg(err.message || 'Erro ao concluir o registo do utilizador.');
        setStatusType('error');
      });
  };

  const handleGoogleSignIn = async () => {
    setStatusMsg('A autenticar com o Google...');
    setStatusType('info');
    try {
      const data = await authGoogleLogin();
      setStatusMsg('Conta Google autenticada!');
      setStatusType('success');
      setCreatedUser(data.user);
      setCreatedToken(data.token);
      setTimeout(() => {
        setShowWelcome(true);
      }, 400);
    } catch (err: any) {
      setStatusMsg(err.message || 'Erro ao autenticar com o Google.');
      setStatusType('error');
    }
  };

  const handleFinishWelcome = () => {
    setShowWelcome(false);
    if (createdUser && createdToken) {
      onRegisterSuccess(createdUser, createdToken);
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
            Plataforma Social Georreferenciada
          </p>
        </div>

        {/* Scrollable Registration Box */}
        <div className="w-full bg-[#0d0d26]/85 backdrop-blur-2xl border border-neon-cyan/40 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-neon-cyan rounded-tl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-neon-magenta rounded-br-3xl pointer-events-none" />

          {/* Stepper indicators */}
          <div className="flex justify-between items-center mb-6 px-1.5">
            <div className={`flex flex-col items-center space-y-1 ${registrationStep !== 'profile' ? 'text-neon-cyan' : 'text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${registrationStep !== 'profile' ? 'border-neon-cyan bg-neon-cyan/10' : 'border-gray-500 bg-gray-900/40'}`}>
                1
              </div>
              <span className="text-[10px] font-orbitron font-extrabold tracking-widest">VALIDAR E-MAIL</span>
            </div>
            <div className="h-[2px] bg-gray-700 flex-1 mx-4" />
            <div className={`flex flex-col items-center space-y-1 ${registrationStep === 'profile' ? 'text-neon-magenta' : 'text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${registrationStep === 'profile' ? 'border-neon-magenta bg-neon-magenta/10' : 'border-gray-500 bg-gray-900/40'}`}>
                2
              </div>
              <span className="text-[10px] font-orbitron font-extrabold tracking-widest">CRIAR PERFIL</span>
            </div>
          </div>

          <h2 className="text-xl font-orbitron font-semibold text-center mb-6 text-neon-cyan tracking-wide uppercase">
            {registrationStep === 'email' && 'Validar E-mail'}
            {registrationStep === 'code' && 'Introduzir Código'}
            {registrationStep === 'profile' && 'Perfil e Localização'}
          </h2>

          <AnimatePresence mode="wait">
            {registrationStep === 'email' && (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
                <p className="text-xs text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed">
                  Para iniciar, valide o seu e-mail. Enviaremos um código único verdadeiro de 6 dígitos via SMTP real para a sua caixa de entrada.
                </p>

                {/* Email input */}
                <div>
                  <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Endereço de Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu-nome@gmail.com"
                    required
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                  />
                </div>

                {/* Email Confirmation input */}
                <div>
                  <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-neon-magenta" /> Confirmar Endereço de Email
                  </label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Repita o seu e-mail"
                    required
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all placeholder:text-gray-500 font-rajdhani font-semibold text-base"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-sm tracking-wider cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
                >
                  ENVIAR CÓDIGO DE VERIFICAÇÃO
                </button>

                {/* Google Registration Button for backward compatibility */}
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
                  <span>REGISTAR COM GOOGLE</span>
                </button>
              </motion.form>
            )}

            {registrationStep === 'code' && (
              <motion.form
                key="code-step"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleVerifyCode}
                className="space-y-6"
              >
                {statusType === 'success' && statusMsg.includes('quase') ? (
                  <div className="p-4 bg-green-950/40 border border-green-500/30 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto animate-bounce" />
                    <p className="font-rajdhani font-black text-white text-base">
                      Seja bem-vindo, está quase a criar a sua conta.
                    </p>
                    <p className="text-xs text-green-300 font-rajdhani font-semibold">
                      A carregar o formulário de perfil geográfico...
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed text-left">
                      Enviamos um código de verificação para: <strong className="text-neon-cyan">{email}</strong>. Por favor, digite os 6 dígitos abaixo.
                    </p>

                    <div className="relative">
                      <label className="block text-neon-cyan font-rajdhani font-bold text-sm uppercase mb-2 tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> Código de Confirmação</span>
                        {resendTimer > 0 ? (
                          <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">
                            Reenviar em {resendTimer}s
                          </span>
                        ) : null}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 123456"
                        required
                        className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-3 px-4 text-white text-center text-xl font-orbitron font-extrabold tracking-widest outline-none transition-all placeholder:text-gray-600 font-bold"
                      />
                    </div>

                    {etherealUrl && (
                      <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-center">
                        <p className="text-xs text-neon-cyan font-rajdhani font-semibold">
                          Caixa de entrada de testes SMTP:
                        </p>
                        <a
                          href={etherealUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white hover:text-neon-magenta underline font-rajdhani font-bold transition-all block mt-1"
                        >
                          Clique para ver o e-mail de testes ↗
                        </a>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 active:scale-98 transition-all py-3 rounded-xl text-black font-orbitron font-extrabold text-xs tracking-wider cursor-pointer shadow-lg uppercase"
                      >
                        CONFIRMAR E-MAIL
                      </button>

                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendTimer > 0}
                        className={`w-full border flex items-center justify-center gap-1.5 rounded-xl text-xs font-orbitron font-extrabold tracking-wider transition-all uppercase ${
                          resendTimer > 0 
                            ? 'border-gray-800 bg-gray-900/20 text-gray-500 cursor-not-allowed' 
                            : 'border-neon-cyan/40 bg-neon-cyan/5 hover:border-neon-cyan text-white active:scale-98'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'animate-spin'}`} style={{ animationDuration: '4s' }} />
                        Reenviar {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationStep('email');
                        setStatusMsg('Introduza o seu e-mail novamente.');
                        setStatusType('info');
                      }}
                      className="w-full border border-gray-800 hover:border-gray-600 text-gray-400 active:scale-98 transition-all py-3 rounded-xl font-orbitron font-extrabold text-[10px] tracking-wider bg-[#121235]/10 uppercase"
                    >
                      Alterar Endereço de E-mail
                    </button>
                  </>
                )}
              </motion.form>
            )}

            {registrationStep === 'profile' && (
              <motion.form
                key="profile-step"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleProfileSubmit}
                className="space-y-5"
              >
                <p className="text-[11px] text-[#a0a0c0] font-rajdhani font-semibold leading-relaxed">
                  Quase concluído! Preencha as suas informações pessoais e selecione com precisão a sua localização geográfica para ajudar a regionalizar o seu feed.
                </p>

                {/* E-mail (Disabled & Locked) */}
                <div>
                  <label className="block text-gray-400 font-rajdhani font-bold text-xs uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neon-magenta" /> Endereço de Email (Confirmado)
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-[#121235]/30 border border-gray-800 rounded-xl py-2 px-4 text-gray-500 text-sm outline-none cursor-not-allowed font-rajdhani font-semibold"
                  />
                </div>

                {/* Nome Completo */}
                <div>
                  <label className="block text-neon-cyan font-rajdhani font-bold text-xs uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Nome Completo (Mín. 3 palavras)
                  </label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Ex: Nome, do Meio e Apelido"
                    required
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                  />
                </div>

                {/* Primeiro Nome e Apelido (Side by Side) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1.5 tracking-wider">
                      Primeiro Nome
                    </label>
                    <input
                      type="text"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      placeholder="Primeiro"
                      required
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1.5 tracking-wider">
                      Apelido
                    </label>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="Apelido"
                      required
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                    />
                  </div>
                </div>

                {/* Nickname and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1.5 tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Nick Name
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="alex_mz"
                      required
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1.5 tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Telefone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 841234567"
                      required
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                    />
                  </div>
                </div>

                {/* Data de Nascimento, Gênero, Profissão */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1.5 tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Data Nascimento
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      required
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1.5 tracking-wider flex items-center gap-1">
                      Gênero
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGenderList(!showGenderList);
                        setShowProvinceList(false);
                        setShowDistrictList(false);
                      }}
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 hover:border-neon-cyan rounded-xl py-2 px-4 text-left font-rajdhani font-semibold text-sm text-white flex items-center justify-between transition-all"
                    >
                      <span>{gender || 'Selecione...'}</span>
                      <ChevronDown className="w-4 h-4 text-neon-cyan" />
                    </button>
                    {showGenderList && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-[#0c0c24] border border-neon-cyan/40 rounded-xl shadow-2xl p-1 space-y-1 text-sm font-rajdhani">
                        {['Masculino', 'Feminino', 'Outro', 'Prefiro não dizer'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setGender(g);
                              setShowGenderList(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-neon-cyan/20 text-white transition-all font-bold"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profissão */}
                <div>
                  <label className="block text-neon-cyan font-rajdhani font-bold text-xs uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Profissão
                  </label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Ex: Engenheiro de Software, Estudante, etc."
                    required
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-neon-cyan font-rajdhani font-bold text-xs uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Senha de Segurança
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2.5 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                  />
                  {password && (
                    <div className="mt-1 text-xs font-rajdhani font-bold flex items-center gap-1">
                      <span className="text-gray-400">Força:</span>
                      <span className={pwStrength.color}>{pwStrength.text}</span>
                    </div>
                  )}
                </div>

                {/* Localização Geográfica */}
                <div className="border-t border-neon-cyan/20 pt-4 space-y-4">
                  <h3 className="text-xs font-orbitron font-extrabold text-neon-magenta uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 animate-bounce" /> Localização Geográfica (Obrigatória)
                  </h3>

                  {/* Província Selector */}
                  <div className="relative">
                    <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1 tracking-wider">
                      Província
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProvinceList(!showProvinceList);
                        setShowDistrictList(false);
                        setShowGenderList(false);
                      }}
                      className="w-full bg-[#121235]/60 border border-neon-cyan/30 hover:border-neon-cyan rounded-xl py-2 px-4 text-left font-rajdhani font-semibold text-sm text-white flex items-center justify-between transition-all"
                    >
                      <span>{province || 'Selecione a Província...'}</span>
                      {showProvinceList ? <ChevronUp className="w-4 h-4 text-neon-cyan" /> : <ChevronDown className="w-4 h-4 text-neon-cyan" />}
                    </button>

                    <AnimatePresence>
                      {showProvinceList && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-30 left-0 right-0 mt-1 bg-[#0c0c24] border border-neon-cyan/40 rounded-xl max-h-40 overflow-y-auto shadow-2xl p-1 space-y-1 text-sm font-rajdhani"
                        >
                          {PROVINCES.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setProvince(p);
                                setDistrict(''); // Reset district
                                setShowProvinceList(false);
                                setShowDistrictList(true); // Auto-open districts
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg transition-all font-bold ${
                                province === p ? 'bg-neon-cyan/20 text-white' : 'text-gray-300 hover:bg-[#151540]'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Distrito Selector - conditioned on province */}
                  {province && (
                    <div className="relative">
                      <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1 tracking-wider">
                        Distrito de {province}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDistrictList(!showDistrictList);
                          setShowProvinceList(false);
                          setShowGenderList(false);
                        }}
                        className="w-full bg-[#121235]/60 border border-neon-cyan/30 hover:border-neon-cyan rounded-xl py-2 px-4 text-left font-rajdhani font-semibold text-sm text-white flex items-center justify-between transition-all"
                      >
                        <span>{district || 'Selecione o Distrito...'}</span>
                        {showDistrictList ? <ChevronUp className="w-4 h-4 text-neon-cyan" /> : <ChevronDown className="w-4 h-4 text-neon-cyan" />}
                      </button>

                      <AnimatePresence>
                        {showDistrictList && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute z-30 left-0 right-0 mt-1 bg-[#0c0c24] border border-neon-cyan/40 rounded-xl max-h-40 overflow-y-auto shadow-2xl p-1 space-y-1 text-sm font-rajdhani"
                          >
                            {(DISTRICTS_BY_PROVINCE[province] || []).map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setDistrict(d);
                                  setShowDistrictList(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all font-bold ${
                                  district === d ? 'bg-neon-cyan/20 text-white' : 'text-gray-300 hover:bg-[#151540]'
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

                  {/* Bairro Input */}
                  {district && (
                    <div>
                      <label className="block text-neon-cyan font-rajdhani font-bold text-[10px] uppercase mb-1 tracking-wider">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Ex: Bairro Central, Triunfo, etc."
                        required
                        className="w-full bg-[#121235]/60 border border-neon-cyan/30 focus:border-neon-cyan rounded-xl py-2 px-4 text-white text-sm outline-none transition-all font-rajdhani font-semibold"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta hover:brightness-110 active:scale-98 transition-all py-3.5 rounded-xl text-black font-orbitron font-extrabold text-sm tracking-wider cursor-pointer shadow-lg shadow-neon-cyan/20 uppercase"
                >
                  CONCLUIR REGISTO DE PERFIL
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Status Feedback banner */}
          <div className={`mt-5 p-3 rounded-xl border text-xs text-center font-rajdhani font-bold ${
            statusType === 'error'
              ? 'bg-red-950/40 border-red-500/30 text-red-400 animate-pulse'
              : statusType === 'success'
              ? 'bg-green-950/40 border-green-500/30 text-green-400'
              : 'bg-[#121235]/60 border-neon-cyan/25 text-[#a0a0c0]'
          }`}>
            {statusMsg}
          </div>

          {/* Back to Login redirection */}
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

      {/* Grand custom welcome overlay modal */}
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

              <UserCheck className="w-16 h-16 text-neon-cyan mx-auto mb-6 animate-bounce" />
              
              <h3 className="font-orbitron font-extrabold text-2xl text-white tracking-wide glow-text-cyan leading-snug">
                CONTA REGISTADA!
              </h3>
              
              <p className="mt-4 font-rajdhani font-bold text-neon-cyan text-lg leading-relaxed max-w-[340px] mx-auto uppercase">
                &quot;Bem-vindo, sua visão é a nossa missão&quot;
              </p>
              
              <p className="mt-2 text-gray-400 font-rajdhani font-semibold text-sm">
                Seja bem-vindo ao Eyes Open MZ, @{createdUser?.nickname}. O seu perfil foi georreferenciado com sucesso na província de {createdUser?.province}. Prepare-se para ver e interagir de forma totalmente imersiva.
              </p>

              <button
                onClick={handleFinishWelcome}
                className="mt-8 px-8 py-3 bg-neon-cyan text-black font-orbitron font-extrabold text-xs tracking-widest rounded-full hover:bg-white hover:shadow-2xl hover:shadow-neon-cyan/50 transition-all cursor-pointer"
              >
                PROSSEGUIR PARA O FEED
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
