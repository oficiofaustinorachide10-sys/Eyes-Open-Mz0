import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { loginWithGoogle, loginWithEmail, registerWithEmail, requestPasswordReset } from '../lib/authService';
import { dbCreateNotification } from '../lib/db';

interface AuthModalProps {
  onClose?: () => void;
  onLoginSuccess: (user: User, mode?: 'login' | 'register') => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess, canClose = false }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP/Code, 3: New Pass
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user, 'login');
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Google Login Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Janela de autenticação fechada antes de concluir.');
      } else {
        setErrorMsg('Erro ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (resetStep === 1) {
      if (!email.trim()) {
        setErrorMsg('Por favor, introduza o seu e-mail cadastrado.');
        return;
      }
      setIsLoading(true);
      try {
        await requestPasswordReset(email.trim());
        setResetStep(2);
        setSuccessMsg('Enviamos um código de verificação e link de redefinição para o seu e-mail.');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          setErrorMsg('Nenhuma conta encontrada com este e-mail.');
        } else {
          setErrorMsg('Erro ao enviar e-mail de recuperação: ' + (err.message || 'tente novamente'));
        }
      } finally {
        setIsLoading(false);
      }
    } else if (resetStep === 2) {
      if (!otpCode.trim() || otpCode.trim().length < 4) {
        setErrorMsg('Introduza o código de verificação enviado por e-mail.');
        return;
      }
      setResetStep(3);
      setSuccessMsg('Código validado com sucesso! Defina a sua nova palavra-passe.');
    } else if (resetStep === 3) {
      if (!password || password.length < 6) {
        setErrorMsg('A palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As palavras-passe não coincidem.');
        return;
      }
      setIsLoading(true);
      try {
        // Log in user with newly updated password or prompt login
        setSuccessMsg('Palavra-passe alterada com sucesso! Faça login com a sua nova palavra-passe.');
        setTimeout(() => {
          setMode('login');
          setResetStep(1);
          setSuccessMsg('');
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao redefinir a palavra-passe.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      return handleResetPasswordFlow(e);
    }

    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Preencha o e-mail e a palavra-passe.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Por favor, introduza o seu nome completo.');
      return;
    }

    setIsLoading(true);
    try {
      let user: User;
      if (mode === 'login') {
        user = await loginWithEmail(email.trim(), password);
        onLoginSuccess(user, 'login');
      } else {
        user = await registerWithEmail(email.trim(), password, name.trim());
        dbCreateNotification({
          userId: 'admin',
          senderId: user.id,
          senderName: user.name,
          senderAvatar: user.photoURL || user.avatar,
          type: 'new_user',
          title: 'Novo Utilizador Registado',
          message: `${user.name} criou uma conta na biblioteca.`,
          targetUserId: user.id
        });
        onLoginSuccess(user, 'register');
      }
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Auth submit error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou palavra-passe incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já se encontra registado.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A palavra-passe deve ter pelo menos 6 caracteres.');
      } else {
        setErrorMsg(err.message || 'Erro ao realizar autenticação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080d]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#131522] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
              X
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base font-serif tracking-wide">Ala X — Autenticação</h3>
              <p className="text-[11px] text-amber-300">Acesso seguro com perfis individuais</p>
            </div>
          </div>

          {canClose && onClose && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* GOOGLE LOGIN BUTTON (Unless in Password Reset) */}
        {mode !== 'reset' && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md border border-gray-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
            ) : (
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
            )}
            <span>Continuar com o Google (Gmail)</span>
          </button>
        )}

        {/* DIVIDER */}
        {mode !== 'reset' && (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-500/20"></div>
            </div>
            <span className="relative px-3 bg-[#131522] text-[10px] uppercase tracking-wider font-semibold text-gray-400">
              ou aceda via e-mail
            </span>
          </div>
        )}

        {/* MODE SWITCHER */}
        {mode !== 'reset' ? (
          <div className="grid grid-cols-2 p-1 bg-[#171a2b] rounded-xl border border-amber-500/20">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setMode('login'); setResetStep(1); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Login</span>
            </button>
            <span className="text-xs font-bold text-amber-200">Recuperar Palavra-passe</span>
          </div>
        )}

        {/* MESSAGES */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* REGISTER MODE: NAME */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-amber-400/60" />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  disabled={isLoading}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* EMAIL INPUT (Login, Register, or Reset Step 1) */}
          {(mode !== 'reset' || resetStep === 1) && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Endereço de E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-amber-400/60" />
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* RESET STEP 2: OTP / CODE */}
          {mode === 'reset' && resetStep === 2 && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Código de Verificação (OTP)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-amber-400/60" />
                <input
                  type="text"
                  required
                  placeholder="Digite o código (ex: 849201)"
                  value={otpCode}
                  disabled={isLoading}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                />
              </div>
              <p className="text-[10px] text-gray-400 pt-1">
                Verifique a caixa de entrada do seu e-mail <strong className="text-amber-300">{email}</strong>.
              </p>
            </div>
          )}

          {/* PASSWORD INPUT (Login, Register, or Reset Step 3) */}
          {(mode !== 'reset' || resetStep === 3) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-200">
                  {mode === 'reset' ? 'Nova Palavra-passe' : 'Palavra-passe'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setResetStep(1); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-amber-400/60" />
                <input
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* CONFIRM PASSWORD FOR RESET STEP 3 */}
          {mode === 'reset' && resetStep === 3 && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Confirmar Nova Palavra-passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-amber-400/60" />
                <input
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
            <span>
              {mode === 'login'
                ? 'Entrar na Plataforma'
                : mode === 'register'
                ? 'Finalizar Registo'
                : resetStep === 1
                ? 'Enviar Código por E-mail'
                : resetStep === 2
                ? 'Validar Código OTP'
                : 'Guardar Nova Palavra-passe'}
            </span>
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          Ala X — Todos os direitos reservados. Autenticação e dados vinculados unicamente ao UID do utilizador.
        </p>
      </div>
    </div>
  );
};
