/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface ChatViewProps {
  currentUser: User;
}

interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    id: string;
  };
  text: string;
  timestamp: Date;
}

export default function ChatView({ currentUser }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      sender: {
        name: 'Alex MZ',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        id: 'user1'
      },
      text: 'Olá malta! Sejam muito bem-vindos à rede de conversação oficial do Eyes Open MZ 👁️🇲🇿',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: 'msg_2',
      sender: {
        name: 'Oficio MZ',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        id: 'user2'
      },
      text: 'Grande Alex! O feed 4D de histórias está a correr extremamente bem. Parabéns pela arquitetura!',
      timestamp: new Date(Date.now() - 1800000)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: 'msg_u_' + Math.random().toString(36).substring(2, 9),
      sender: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Trigger simulated network auto-response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const networkReplies = [
        'Excelente contribuição! Olhos sempre bem abertos! 👁️🇲🇿',
        'Incrível! A produção cultural em Moçambique está de facto a dar passos de gigante. Abraços!',
        'Concordo plenamente! Nossa visão é a nossa missão.',
        'Grande abraço de Nampula! Estamos juntos no projeto 🎬🔥',
        'Estou a planear publicar uma nova história no Eyes 42h logo à noite. Fiquem atentos!',
        'Alguém disponível para colaborar no próximo guião de cinema curto?'
      ];
      const randomReply = networkReplies[Math.floor(Math.random() * networkReplies.length)];
      
      const responseMsg: Message = {
        id: 'msg_res_' + Math.random().toString(36).substring(2, 9),
        sender: {
          name: 'Oficio MZ',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          id: 'user2'
        },
        text: randomReply,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, responseMsg]);
    }, 1800);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto flex flex-col h-[85vh] font-rajdhani text-white select-none">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neon-cyan/15 pb-4 mb-4 shrink-0">
        <h2 className="font-orbitron font-extrabold text-sm text-neon-cyan tracking-widest uppercase flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-neon-cyan" /> CONVERSAS DO GRUPO
        </h2>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] text-neon-cyan font-bold tracking-wider rounded-full uppercase">
          <ShieldCheck className="w-3.5 h-3.5" /> Encriptado
        </span>
      </div>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 bg-black/30 border border-neon-cyan/10 rounded-2xl p-4 mb-4">
        {messages.map((msg) => {
          const isMe = msg.sender.id === currentUser.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <img
                src={msg.sender.avatar || "https://i.pravatar.cc/80?img=1"}
                alt={msg.sender.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-neon-cyan/40 object-cover shrink-0"
              />
              <div className="space-y-1">
                <div className={`flex items-center gap-1.5 text-[10px] text-gray-500 ${isMe ? 'justify-end' : ''}`}>
                  <span className="font-bold text-neon-cyan">{msg.sender.name}</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                  isMe 
                    ? 'bg-gradient-to-r from-neon-cyan to-[#7a00ff] text-black rounded-tr-none' 
                    : 'bg-[#121235]/70 border border-neon-cyan/10 text-gray-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* typing indicator simulation */}
        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
              alt="Oficio"
              className="w-8 h-8 rounded-full border border-neon-cyan/40 object-cover shrink-0"
            />
            <div className="bg-[#121235]/40 border border-neon-cyan/10 px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escreva a sua mensagem aqui..."
          className="flex-1 bg-[#111130] border border-neon-cyan/30 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-cyan"
        />
        <button
          type="submit"
          className="w-12 h-12 rounded-xl bg-neon-cyan hover:bg-white text-black flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-md shadow-neon-cyan/10"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
