/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Trash2, UserPlus, ShieldCheck, Lock, Unlock, 
  ArrowLeft, Eye, EyeOff, AlertCircle, Sparkles, Delete
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LeafLogo from './LeafLogo';
import { UserAvatar } from './UserAvatar';

export interface SavedAccount {
  id: string;
  nickname: string;
  fullname: string;
  avatar: string;
  email: string;
  encryptedToken?: string;
  hasPin: boolean;
}

interface AccountSelectorViewProps {
  savedAccounts: SavedAccount[];
  onSelectAccount: (accountId: string, method: 'pin' | 'password', credential: string) => Promise<{ success: boolean; error?: string }>;
  onUseAnotherAccount: () => void;
  onRemoveAccount: (accountId: string) => void;
  onRegisterPin: (accountId: string, pin: string) => Promise<void>;
  theme: string;
}

export default function AccountSelectorView({
  savedAccounts,
  onSelectAccount,
  onUseAnotherAccount,
  onRemoveAccount,
  onRegisterPin,
  theme
}: AccountSelectorViewProps) {
  const [selectedAcc, setSelectedAcc] = useState<SavedAccount | null>(null);
  const [authMethod, setAuthMethod] = useState<'pin' | 'password'>('password');
  const [pinCode, setPinCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // PIN registration state (for accounts that don't have a local PIN set up yet)
  const [isSettingUpPin, setIsSettingUpPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<1 | 2>(1); // 1 = enter pin, 2 = confirm pin
  
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    // Automatically default to PIN if the selected account has a PIN set up
    if (selectedAcc) {
      setAuthMethod(selectedAcc.hasPin ? 'pin' : 'password');
      setPinCode('');
      setPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsSettingUpPin(false);
      setNewPin('');
      setConfirmPin('');
      setSetupStep(1);
    }
  }, [selectedAcc]);

  const handleBack = () => {
    setSelectedAcc(null);
  };

  // Keyboard inputs for PIN
  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (isSettingUpPin) {
      if (setupStep === 1) {
        if (newPin.length < 4) {
          const val = newPin + num;
          setNewPin(val);
          if (val.length === 4) {
            // Automatically advance to step 2
            setTimeout(() => {
              setSetupStep(2);
            }, 300);
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const val = confirmPin + num;
          setConfirmPin(val);
        }
      }
    } else {
      if (pinCode.length < 4) {
        const val = pinCode + num;
        setPinCode(val);
        if (val.length === 4) {
          // Auto-submit when 4 digits are complete
          handleAuthSubmit(val);
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    if (isSettingUpPin) {
      if (setupStep === 1) {
        setNewPin(prev => prev.slice(0, -1));
      } else {
        setConfirmPin(prev => prev.slice(0, -1));
      }
    } else {
      setPinCode(prev => prev.slice(0, -1));
    }
  };

  const handleAuthSubmit = async (overridePin?: string) => {
    if (!selectedAcc) return;
    setErrorMsg('');
    setIsSubmitting(true);

    const credential = authMethod === 'pin' ? (overridePin || pinCode) : password;
    if (!credential) {
      setErrorMsg(authMethod === 'pin' ? 'Por favor, introduza o seu PIN de 4 dígitos.' : 'Por favor, introduza a sua palavra-passe.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await onSelectAccount(selectedAcc.id, authMethod, credential);
      if (res.success) {
        setSuccessMsg('Sessão autenticada com sucesso! Bem-vindo de volta.');
      } else {
        setErrorMsg(res.error || 'Credenciais inválidas. Tente novamente.');
        setPinCode('');
      }
    } catch (e) {
      setErrorMsg('Ocorreu um erro ao processar a autenticação local.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupPinSubmit = async () => {
    if (!selectedAcc) return;
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setErrorMsg('O PIN deve conter exatamente 4 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Os códigos PIN introduzidos não coincidem.');
      setConfirmPin('');
      setSetupStep(2);
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onRegisterPin(selectedAcc.id, newPin);
      setSuccessMsg('PIN local registado com sucesso!');
      setTimeout(() => {
        // Toggle to newly created PIN mode and ask user to authenticate
        selectedAcc.hasPin = true;
        setAuthMethod('pin');
        setIsSettingUpPin(false);
        setPinCode('');
        setSuccessMsg('');
      }, 1500);
    } catch (e) {
      setErrorMsg('Falha ao registar o PIN local.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060613] text-white flex flex-col justify-center items-center p-4 md:p-6 select-none overflow-y-auto">
      {/* Background visual effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#0d0d27]/90 border border-blue-500/20 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-2xl relative z-10 transition-all">
        
        <AnimatePresence mode="wait">
          {!selectedAcc ? (
            /* ================= ACCOUNT LIST VIEW ================= */
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Logo / Header */}
              <div className="text-center flex flex-col items-center">
                <LeafLogo className="w-14 h-14 mb-3 text-yellow-400 animate-pulse-slow" />
                <h2 className="font-orbitron font-extrabold text-2xl bg-gradient-to-r from-blue-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent tracking-widest uppercase">
                  Eyes Open MZ
                </h2>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">
                  Dispositivo Autorizado • Contas Guardadas
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-orbitron font-extrabold uppercase tracking-widest text-gray-400">
                    Escolha uma conta
                  </h3>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-blue-500/20">
                    {savedAccounts.length} {savedAccounts.length === 1 ? 'Sessão' : 'Sessões'}
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {savedAccounts.map((acc) => (
                    <motion.div
                      key={acc.id}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group flex items-center justify-between p-3.5 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-500/10 hover:border-blue-500/30 rounded-2xl cursor-pointer transition-all duration-300"
                    >
                      <div 
                        className="flex items-center gap-3.5 flex-1 min-w-0"
                        onClick={() => setSelectedAcc(acc)}
                      >
                        <UserAvatar 
                          src={acc.avatar} 
                          status={true} 
                          nickname={acc.nickname}
                          className="w-11 h-11 border-2 border-blue-500/30 group-hover:border-blue-400/60 transition-all"
                        />
                        <div className="flex-grow min-w-0 text-left">
                          <p className="font-bold text-sm text-gray-200 group-hover:text-blue-300 transition-colors truncate">
                            {acc.fullname}
                          </p>
                          <p className="text-xs text-gray-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                            <span>@{acc.nickname}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            {acc.hasPin ? (
                              <span className="text-[9px] text-yellow-400 font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> PIN Ativo
                              </span>
                            ) : (
                              <span className="text-[9px] text-blue-400/80 font-bold flex items-center gap-0.5">
                                <KeyRound className="w-2.5 h-2.5" /> Senha
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Remove Account Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover a conta @${acc.nickname} deste dispositivo? Próxima vez terá de introduzir os dados completos.`)) {
                            onRemoveAccount(acc.id);
                          }
                        }}
                        title="Remover conta do dispositivo"
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Use Another Account Button */}
              <div className="pt-2 border-t border-blue-500/10 space-y-3">
                <button
                  onClick={onUseAnotherAccount}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/20 hover:border-blue-400/40 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm tracking-wide shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 cursor-pointer transition-all duration-300"
                >
                  <UserPlus className="w-4 h-4" />
                  Utilizar Outra Conta
                </button>
                <p className="text-[9px] text-gray-500 text-center leading-normal px-2">
                  As suas credenciais locais de sessão são guardadas de forma totalmente cifrada e segura neste navegador.
                </p>
              </div>
            </motion.div>
          ) : (
            /* ================= LOCAL AUTH / PIN VIEW ================= */
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header with Back button */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-500/10">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <span className="text-[9px] text-yellow-400 font-orbitron font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" /> Acesso Seguro
                </span>
              </div>

              {/* Selected Account Profile Badge */}
              <div className="text-center flex flex-col items-center">
                <div className="relative">
                  <UserAvatar 
                    src={selectedAcc.avatar} 
                    status={true} 
                    nickname={selectedAcc.nickname}
                    className="w-16 h-16 border-2 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black p-1 rounded-full border border-[#0d0d27]">
                    <Lock className="w-3 h-3" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white mt-3 leading-tight">
                  {selectedAcc.fullname}
                </h3>
                <p className="text-xs text-gray-400">
                  @{selectedAcc.nickname}
                </p>
              </div>

              {/* Error / Success Notifications */}
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-xs flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <p>{errorMsg}</p>
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-xl text-xs flex items-start gap-2 text-left">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <p>{successMsg}</p>
                </div>
              )}

              {/* AUTHENTICATION CONTROL SWITCHES (PIN / PASSWORD) */}
              {!isSettingUpPin && (
                <div className="space-y-4">
                  {/* Toggle between Password or PIN if account supports it */}
                  {selectedAcc.hasPin && (
                    <div className="flex bg-[#070719] border border-blue-500/15 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          setAuthMethod('pin');
                          setErrorMsg('');
                          setPinCode('');
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          authMethod === 'pin' 
                            ? 'bg-yellow-400 text-black shadow-md' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        PIN Numérico
                      </button>
                      <button
                        onClick={() => {
                          setAuthMethod('password');
                          setErrorMsg('');
                          setPassword('');
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          authMethod === 'password' 
                            ? 'bg-yellow-400 text-black shadow-md' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Palavra-passe
                      </button>
                    </div>
                  )}

                  {/* ----------------- IF METHOD IS PASSWORD ----------------- */}
                  {authMethod === 'password' && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-300">
                          Introduza a palavra-passe da sua conta:
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua palavra-passe"
                            disabled={isSubmitting}
                            className="w-full bg-[#070719] border border-blue-500/20 focus:border-blue-400 rounded-2xl py-3 pl-3 pr-10 text-sm font-medium focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all placeholder:text-gray-600 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAuthSubmit()}
                        disabled={isSubmitting || !password}
                        className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 disabled:opacity-50 text-black font-extrabold text-xs tracking-widest font-orbitron uppercase rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer flex justify-center items-center gap-2"
                      >
                        {isSubmitting ? 'Verificando...' : 'Autenticar Conta'}
                      </button>

                      {!selectedAcc.hasPin && (
                        <div className="pt-2 text-center">
                          <button
                            onClick={() => {
                              setIsSettingUpPin(true);
                              setSetupStep(1);
                              setNewPin('');
                              setConfirmPin('');
                              setErrorMsg('');
                            }}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                          >
                            ⭐ Criar um PIN de 4 dígitos para login rápido neste dispositivo
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ----------------- IF METHOD IS PIN (NUMPAD GRID) ----------------- */}
                  {authMethod === 'pin' && (
                    <div className="space-y-5">
                      <p className="text-xs text-gray-400 text-center">
                        Insira o seu PIN de segurança de 4 dígitos:
                      </p>

                      {/* Dot indicators */}
                      <div className="flex justify-center gap-4 py-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`w-3.5 h-3.5 rounded-full border border-yellow-400/40 transition-all duration-200 ${
                              pinCode.length > idx 
                                ? 'bg-yellow-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.6)]' 
                                : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Custom Modern Numpad */}
                      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleKeyPress(num)}
                            disabled={isSubmitting}
                            className="w-16 h-16 rounded-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/10 hover:border-blue-400/30 text-white font-orbitron font-bold text-xl active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setAuthMethod('password');
                            setErrorMsg('');
                            setPassword('');
                          }}
                          className="w-16 h-16 rounded-full bg-blue-950/20 hover:bg-blue-950/40 text-xs font-bold text-gray-400 flex items-center justify-center cursor-pointer hover:text-white transition-colors border border-transparent"
                        >
                          Senha
                        </button>
                        <button
                          onClick={() => handleKeyPress('0')}
                          disabled={isSubmitting}
                          className="w-16 h-16 rounded-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/10 hover:border-blue-400/30 text-white font-orbitron font-bold text-xl active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                        >
                          0
                        </button>
                        <button
                          onClick={handleBackspace}
                          disabled={isSubmitting}
                          className="w-16 h-16 rounded-full bg-blue-950/20 hover:bg-blue-950/40 text-gray-400 hover:text-red-400 active:scale-90 transition-all flex items-center justify-center cursor-pointer border border-transparent"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------- LOCAL PIN SETUP FLOW ----------------- */}
              {isSettingUpPin && (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider font-orbitron">
                      Configurar PIN Rápido Local
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {setupStep === 1 
                        ? 'Defina um código PIN de 4 dígitos para este dispositivo:' 
                        : 'Confirme o PIN de 4 dígitos inserindo-o novamente:'}
                    </p>
                  </div>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-4 py-2">
                    {[0, 1, 2, 3].map((idx) => {
                      const len = setupStep === 1 ? newPin.length : confirmPin.length;
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full border border-blue-400/40 transition-all duration-200 ${
                            len > idx 
                              ? 'bg-blue-400 scale-110 shadow-[0_0_10px_rgba(96,165,250,0.6)]' 
                              : 'bg-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleKeyPress(num)}
                        disabled={isSubmitting}
                        className="w-16 h-16 rounded-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/10 hover:border-blue-400/30 text-white font-orbitron font-bold text-xl active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setIsSettingUpPin(false);
                        setErrorMsg('');
                      }}
                      className="w-16 h-16 rounded-full bg-blue-950/20 hover:bg-blue-950/40 text-xs font-bold text-red-400 flex items-center justify-center cursor-pointer border border-transparent"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleKeyPress('0')}
                      disabled={isSubmitting}
                      className="w-16 h-16 rounded-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/10 hover:border-blue-400/30 text-white font-orbitron font-bold text-xl active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      onClick={handleBackspace}
                      disabled={isSubmitting}
                      className="w-16 h-16 rounded-full bg-blue-950/20 hover:bg-blue-950/40 text-gray-400 hover:text-red-400 active:scale-90 transition-all flex items-center justify-center cursor-pointer border border-transparent"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  </div>

                  {setupStep === 2 && confirmPin.length === 4 && (
                    <button
                      onClick={handleSetupPinSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-700 text-white font-extrabold text-xs tracking-widest font-orbitron uppercase rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer mt-4"
                    >
                      {isSubmitting ? 'Registando...' : 'Confirmar e Guardar PIN'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
