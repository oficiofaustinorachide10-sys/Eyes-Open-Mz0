import React, { useState } from 'react';
import { ArrowLeft, User as UserIcon, Mail, Camera, Save, Heart, BookOpen, Loader2, LogOut, Check } from 'lucide-react';
import { User, Book } from '../types';
import { updateUserProfile } from '../lib/authService';
import { compressBase64Image } from '../utils';

interface UserProfileModalProps {
  currentUser: User;
  books: Book[];
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
  onLogout: () => void;
  onSelectBook: (book: Book) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  books,
  onClose,
  onUserUpdated,
  onLogout,
  onSelectBook
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || currentUser.avatar || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const favoriteBooks = books.filter(b => currentUser.favoriteBookIds?.includes(b.id));

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const raw = ev.target?.result as string;
        try {
          const compressed = await compressBase64Image(raw, 400, 0.7);
          setPhotoURL(compressed);
        } catch (err) {
          setPhotoURL(raw);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await updateUserProfile(currentUser.uid || currentUser.id, {
        name: name.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
        avatar: photoURL.trim()
      });

      onUserUpdated(updated);
      setSuccessMsg('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao guardar alterações do perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6">
        
        {/* TOP APP BAR WITH BACK BUTTON */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2.5">
            <UserIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base sm:text-lg font-serif">Perfil do Utilizador</h3>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          {/* AVATAR DISPLAY & UPLOAD */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#181a26] border border-amber-500/20">
            <div className="relative">
              <img
                src={photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400"
              />
              <label className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-black rounded-lg cursor-pointer hover:bg-amber-400 transition-all shadow-md">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-white text-sm">{currentUser.name}</h4>
              <p className="text-xs text-amber-300 font-mono">{currentUser.email}</p>
              <p className="text-[10px] text-gray-400 font-mono">UID: {currentUser.uid || currentUser.id}</p>
            </div>
          </div>

          {/* NAME */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-amber-200">Nome de Apresentação</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
            />
          </div>

          {/* BIO */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-amber-200">Biografia de Leitor</label>
            <textarea
              rows={3}
              placeholder="Escreva algo sobre os seus gostos literários..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* SAVE BUTTON */}
          <div className="pt-2 flex items-center justify-between border-t border-amber-500/10">
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Encerrar Sessão</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
              <span>Guardar Perfil</span>
            </button>
          </div>

        </form>

        {/* FAVORITES SUMMARY */}
        <div className="pt-4 border-t border-amber-500/20 space-y-3">
          <h5 className="font-bold text-amber-200 text-xs flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Obras Favoritas ({favoriteBooks.length})</span>
          </h5>

          {favoriteBooks.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhuma obra marcada como favorita.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
              {favoriteBooks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => { onSelectBook(b); onClose(); }}
                  className="p-2 rounded-xl bg-[#181a26] border border-amber-500/20 flex items-center gap-2.5 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <img src={b.coverUrl} alt={b.title} className="w-8 h-10 rounded object-cover" />
                  <div className="truncate">
                    <p className="font-bold text-xs text-white truncate">{b.title}</p>
                    <p className="text-[10px] text-amber-300 truncate">{b.author}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
