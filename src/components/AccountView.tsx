/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, Mail, Smartphone, MapPin, Calendar, Award, 
  Trash2, RefreshCw, Cpu, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

interface AccountViewProps {
  currentUser: UserType;
  users: UserType[];
  onUpdateUser: (updatedUser: UserType) => void;
  onDeleteAccount: (userId: string) => void;
}

export default function AccountView({ 
  currentUser, users, onUpdateUser, onDeleteAccount 
}: AccountViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Edit popups state
  const [activePopup, setActivePopup] = useState<'phone' | 'email' | 'password' | 'delete' | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [inputValConfirm, setInputValConfirm] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 4D dragging gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
    setDragOffset(0);
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    setDragOffset(deltaX);

    // Map delta drag into rotational coordinate space
    const xRotation = -deltaY * 0.15;
    // Base rotation + drag offset
    const yRotation = (isFlipped ? 180 : 0) + (deltaX * 0.25);

    setRotateX(xRotation);
    setRotateY(yRotation);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    // Determine flip threshold (dragged past 80px horizontally)
    if (Math.abs(dragOffset) > 80) {
      const nextFlip = !isFlipped;
      setIsFlipped(nextFlip);
      setRotateY(nextFlip ? 180 : 0);
    } else {
      setRotateY(isFlipped ? 180 : 0);
    }
    setRotateX(0);
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handlePopupSubmit = () => {
    if (!inputVal.trim()) return;

    if (activePopup === 'phone') {
      const updated: UserType = {
        ...currentUser,
        phone: inputVal.trim()
      };
      onUpdateUser(updated);
      triggerToast('Telefone alterado com sucesso!');
    } else if (activePopup === 'email') {
      const updated: UserType = {
        ...currentUser,
        email: inputVal.trim()
      };
      onUpdateUser(updated);
      triggerToast('Endereço de e-mail atualizado!');
    } else if (activePopup === 'password') {
      const updated: UserType = {
        ...currentUser,
        password: inputVal.trim() // standard client storage hashing already handled
      };
      onUpdateUser(updated);
      triggerToast('Senha de acesso redefinida!');
    }

    setActivePopup(null);
    setInputVal('');
    setInputValConfirm('');
  };

  const handleDeleteTrigger = () => {
    setActivePopup(null);
    onDeleteAccount(currentUser.id);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-16">
      <div className="text-center">
        <h2 className="font-orbitron font-extrabold text-xl tracking-widest text-neon-cyan glow-text-cyan flex items-center justify-center gap-2">
          <Cpu className="w-5 h-5 stroke-[2]" /> PAINEL DE IDENTIDADE
        </h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
          Arraste o Cartão para o Lado para Ver o Verso
        </p>
      </div>

      {/* CARD COMPONENT WRAPPER */}
      <div className="flex justify-center items-center py-6">
        <div className="w-full max-w-[460px] aspect-[1.586/1] relative perspective-[2000px]">
          {/* Main 4D Card Face Container */}
          <div
            ref={cardRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transformStyle: 'preserve-3d',
            }}
            className="w-full h-full absolute cursor-grab active:cursor-grabbing transition-transform duration-700 rounded-3xl border border-neon-cyan/40 shadow-2xl relative select-none"
          >
            {/* FRONT FACE OF CARD */}
            <div className="absolute inset-0 bg-[#0c0c26]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between backface-hidden overflow-hidden">
              {/* Card microchip and plan badge */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-10 bg-gradient-to-tr from-yellow-600/40 to-yellow-400/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
                <span className="px-3 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-orbitron font-bold tracking-widest">
                  VIP ASSOCIADO
                </span>
              </div>

              {/* Central identification data fields */}
              <div className="space-y-2.5 my-4">
                <div className="flex items-center gap-2 border-l-2 border-neon-cyan pl-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Nome</span>
                  <span className="text-sm font-extrabold text-white truncate max-w-[280px]">{currentUser.fullname}</span>
                </div>

                <div className="flex items-center gap-2 border-l-2 border-neon-cyan pl-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email</span>
                  <span className="text-xs font-semibold text-gray-300 truncate max-w-[280px]">{currentUser.email}</span>
                </div>

                <div className="flex items-center gap-2 border-l-2 border-neon-cyan pl-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tel</span>
                  <span className="text-xs font-mono font-bold text-gray-300">{currentUser.phone}</span>
                </div>

                <div className="flex items-center gap-2 border-l-2 border-neon-cyan pl-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cidade</span>
                  <span className="text-xs font-semibold text-gray-300">{currentUser.province}</span>
                </div>
              </div>

              {/* Bottom legal notice */}
              <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest pt-2 border-t border-white/5">
                <span>Eyes Open MZ</span>
                <span>ID: {currentUser.id.substring(5).toUpperCase()}</span>
              </div>
            </div>

            {/* BACK FACE OF CARD */}
            <div className="absolute inset-0 bg-[#0d0d2a]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between overflow-hidden backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
              {/* Back Header */}
              <div className="flex items-center justify-between border-b border-neon-magenta/20 pb-3">
                <h4 className="font-orbitron font-extrabold text-xs text-neon-magenta tracking-widest uppercase">
                  Registo & Vinculações
                </h4>
                <span className="text-[9px] font-mono text-gray-500 font-bold">
                  Criado em: {new Date(currentUser.created).toLocaleDateString()}
                </span>
              </div>

              {/* Associated profile details section */}
              <div className="space-y-4 my-3 text-center">
                <p className="text-xs font-bold text-neon-magenta tracking-wider uppercase mb-1">
                  Contas Vinculadas a este Número ({users.filter(u => u.phone === currentUser.phone).length}/3)
                </p>
                
                <div className="flex justify-center gap-3">
                  {users.filter(u => u.phone === currentUser.phone).map((u) => (
                    <div key={u.id} className="flex flex-col items-center shrink-0">
                      <img 
                        src={u.avatar || "https://i.pravatar.cc/80?img=1"} 
                        alt={u.nickname}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full border border-neon-cyan object-cover"
                      />
                      <span className="text-[9px] font-bold text-gray-300 truncate w-12 text-center mt-1">{u.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons list */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setActivePopup('phone');
                    setInputVal(currentUser.phone);
                  }}
                  className="py-1.5 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-[10px] font-bold tracking-wider text-neon-cyan transition-colors cursor-pointer text-center uppercase"
                >
                  Número
                </button>
                <button
                  onClick={() => {
                    setActivePopup('email');
                    setInputVal(currentUser.email);
                  }}
                  className="py-1.5 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-[10px] font-bold tracking-wider text-neon-cyan transition-colors cursor-pointer text-center uppercase"
                >
                  Email
                </button>
                <button
                  onClick={() => {
                    setActivePopup('password');
                    setInputVal('');
                  }}
                  className="py-1.5 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-[10px] font-bold tracking-wider text-neon-cyan transition-colors cursor-pointer text-center uppercase"
                >
                  Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESTRUCTIVE DELETE ACCOUNT TRIGGERS */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => setActivePopup('delete')}
          className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-orbitron font-extrabold text-xs tracking-widest transition-all cursor-pointer shadow-lg shadow-red-500/20 animate-pulse uppercase flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> ELIMINAR CONTA DEFINITIVAMENTE
        </button>
      </div>

      {/* POPUP MODALS RENDERS */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-[420px] bg-[#0c0c24] border border-neon-cyan/40 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              {/* Close */}
              <button
                onClick={() => {
                  setActivePopup(null);
                  setInputVal('');
                  setInputValConfirm('');
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                ✕
              </button>

              <h3 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-wider uppercase">
                {activePopup === 'phone' && 'Alterar Número de Telefone'}
                {activePopup === 'email' && 'Alterar Endereço de Email'}
                {activePopup === 'password' && 'Redefinir Senha de Acesso'}
                {activePopup === 'delete' && '⚠️ ELIMINAR MINHA CONTA'}
              </h3>

              {activePopup !== 'delete' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Novo valor</label>
                    <input
                      type={activePopup === 'password' ? 'password' : 'text'}
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      className="w-full bg-black/40 border border-neon-cyan/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                      placeholder={activePopup === 'password' ? 'Insira a nova senha' : 'Digite o novo valor'}
                    />
                  </div>
                  <button
                    onClick={handlePopupSubmit}
                    className="w-full py-3 bg-neon-cyan hover:brightness-110 text-black font-orbitron font-extrabold text-xs tracking-widest rounded-xl cursor-pointer uppercase"
                  >
                    CONFIRMAR ALTERAÇÃO
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Atenção! Esta ação é irreversível. Todos os seus posts, histórias e dados cadastrais serão removidos para sempre de nossos servidores. Tem certeza de que quer continuar?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActivePopup(null)}
                      className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <button
                      onClick={handleDeleteTrigger}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION ON SUCCESS */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-black rounded-xl shadow-lg font-bold text-xs select-none"
          >
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
