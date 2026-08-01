import React, { useState } from 'react';
import { X, Heart, Shield, BookOpen, Calendar, User as UserIcon, LogOut, FolderDown, Edit3, Check, Loader2, Camera, Info } from 'lucide-react';
import { User, Book } from '../types';
import { updateUserProfile } from '../lib/authService';

interface UserProfileModalProps {
  user: User;
  favoriteBooks: Book[];
  onClose: () => void;
  onSelectBook: (book: Book) => void;
  onOpenDownloads?: () => void;
  onLogout: () => void;
  onUserUpdated?: (updated: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  favoriteBooks,
  onClose,
  onSelectBook,
  onOpenDownloads,
  onLogout,
  onUserUpdated
}) => {
  const isAdmin = user.role === 'admin' || user.email === 'oficiofaustino78@gmail.com' || user.email === 'admin@alax.mz';

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || user.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const uid = user.uid || user.id;
      const updated = await updateUserProfile(uid, {
        name: name.trim() || user.name,
        bio: bio.trim(),
        avatar: photoURL.trim() || user.avatar,
        photoURL: photoURL.trim() || user.photoURL
      });

      if (onUserUpdated) {
        onUserUpdated(updated);
      }
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setSaveError(err.message || 'Erro ao guardar dados no Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-lg font-serif">Perfil de Utilizador Independente</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Perfil atualizado com sucesso no Firestore!</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
            {saveError}
          </div>
        )}

        {/* USER IDENTITY CARD */}
        <div className="p-5 rounded-2xl bg-[#181a26] border border-amber-500/20 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={photoURL || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-base">{user.name}</h4>
                  {isAdmin ? (
                    <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-black uppercase tracking-wider flex items-center gap-1 shadow">
                      <Shield className="w-3 h-3" />
                      Administrador Oficial
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                      Conta Individual (Leitor)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{user.email}</p>
                <p className="text-[10px] text-amber-400/80">
                  UID Firestore: <span className="font-mono text-gray-300">{user.uid || user.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancelar' : 'Editar Perfil'}</span>
            </button>
          </div>

          {/* EDIT FORM */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="pt-3 border-t border-amber-500/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200">Nome de Exibição</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#12141f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200">URL da Foto de Perfil</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full bg-[#12141f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-200">Biografia Pessoal</label>
                <textarea
                  rows={2}
                  placeholder="Escreva algo sobre si, seus interesses de leitura..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#12141f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                  <span>Guardar Alterações</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-2 border-t border-amber-500/10 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Biografia</span>
                <p className="text-xs text-gray-300 mt-0.5 italic">
                  {user.bio ? `"${user.bio}"` : 'Nenhuma biografia adicionada ainda. Clique em Editar Perfil para adicionar.'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-gray-400 pt-1">
                <span>Data de Registo: <strong className="text-gray-200">{new Date(user.createdAt || Date.now()).toLocaleDateString('pt-PT')}</strong></span>
                {user.lastLogin && (
                  <span>Último Acesso: <strong className="text-gray-200">{new Date(user.lastLogin).toLocaleDateString('pt-PT')}</strong></span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PRIVACY NOTICE */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Isolamento Garantido:</strong> Todas as alterações efetuadas no seu perfil ficam guardadas exclusivamente no documento <code className="text-amber-300 font-mono">users/{user.uid || user.id}</code> do Firestore. Nenhum outro utilizador pode alterar ou visualizar dados privados do seu perfil.
          </p>
        </div>

        {/* FAVORITE BOOKS - MY LIBRARY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>Minha Biblioteca de Favoritos ({favoriteBooks.length})</span>
            </h4>
          </div>

          {favoriteBooks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#181a26] text-center text-xs text-gray-400 border border-amber-500/10">
              Ainda não guardou nenhuma obra nos seus favoritos. Clique no ícone de coração para guardar livros na sua biblioteca pessoal.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
              {favoriteBooks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => { onSelectBook(b); onClose(); }}
                  className="p-3 rounded-xl bg-[#181a26] border border-amber-500/15 hover:border-amber-400/50 transition-all cursor-pointer flex items-center gap-3"
                >
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="w-10 h-14 rounded-lg object-cover border border-amber-500/30"
                  />
                  <div className="overflow-hidden">
                    <h5 className="font-bold text-white text-xs truncate">{b.title}</h5>
                    <p className="text-[10px] text-amber-300 truncate">Por {b.author}</p>
                    <span className="text-[9px] text-emerald-400 font-semibold">{b.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between">
          {onOpenDownloads && (
            <button
              onClick={() => { onClose(); onOpenDownloads(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-xs transition-all cursor-pointer"
            >
              <FolderDown className="w-4 h-4 text-emerald-400" />
              <span>Ver Gestor de Downloads</span>
            </button>
          )}

          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>

      </div>
    </div>
  );
};
