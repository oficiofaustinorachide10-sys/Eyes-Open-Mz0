/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { subscribeChats, dbSendMessage, dbUpdateUser } from '../lib/db';

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
  timestamp: number;
}

export default function ChatView({ currentUser }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUpdatedRef = useRef<number>(0);

  // Subscribe to real-time chats from Firestore
  useEffect(() => {
    const unsubscribe = subscribeChats((loadedMsgs) => {
      setMessages(loadedMsgs);
    });
    return () => unsubscribe();
  }, []);

  // Update lastReadChatTimestamp on mount and on new messages
  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      const now = Date.now();
      if (now - lastUpdatedRef.current > 3000) {
        lastUpdatedRef.current = now;
        const updatedUser: User = {
          ...currentUser,
          lastReadChatTimestamp: now
        };
        dbUpdateUser(updatedUser).catch(console.error);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
  }, [messages, currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (currentUser.id === 'guest') return;

    const userMsg = {
      id: 'msg_u_' + Math.random().toString(36).substring(2, 9),
      sender: {
        name: currentUser.nickname,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setInputText('');
    await dbSendMessage(userMsg);
  };

  return (
    <div className="flex-grow p-4 md:p-6 lg:p-8 max-w-2xl mx-auto flex flex-col h-[85vh] font-rajdhani text-white select-none">
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
      <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 bg-black/30 border border-neon-cyan/10 rounded-2xl p-4 mb-4">
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
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />{' '}
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                  isMe 
                    ? 'bg-gradient-to-r from-neon-cyan to-[#7a00ff] text-black rounded-tr-none font-bold' 
                    : 'bg-[#121235]/70 border border-neon-cyan/10 text-gray-200 rounded-tl-none font-medium'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input controls form */}
      {currentUser.id === 'guest' ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-center text-xs font-bold text-yellow-500 uppercase tracking-wider shrink-0">
          ⚠️ Convidados não podem enviar mensagens no chat. Crie uma conta para participar!
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escreva a sua mensagem aqui..."
            className="flex-grow bg-[#111130] border border-neon-cyan/35 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-cyan text-white placeholder:text-gray-600 font-semibold"
          />
          <button
            type="submit"
            className="w-12 h-12 rounded-xl bg-neon-cyan hover:bg-white text-black flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-md shadow-neon-cyan/10 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      )}
    </div>
  );
}
