import React from 'react';
import { Heart, Drama, Feather, BookOpen, Brain, Lightbulb, Star, Shield, ArrowRight } from 'lucide-react';
import { BOOK_CATEGORIES } from '../utils';

interface ExploreCategoriesGridProps {
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  theme?: 'dark' | 'light' | 'lite';
}

export const ExploreCategoriesGrid: React.FC<ExploreCategoriesGridProps> = ({
  selectedCategory,
  onSelectCategory,
  theme = 'dark'
}) => {
  const categoryVisuals = [
    { slug: 'romance', label: 'Romance', icon: Heart },
    { slug: 'drama', label: 'Drama', icon: Drama },
    { slug: 'poesia', label: 'Poesia', icon: Feather },
    { slug: 'contos', label: 'Contos', icon: BookOpen },
    { slug: 'filosofia', label: 'Filosofia', icon: Brain },
    { slug: 'autoajuda', label: 'Autoajuda', icon: Lightbulb },
    { slug: 'infantil', label: 'Infantil', icon: Star },
    { slug: 'historia', label: 'História', icon: Shield },
  ];

  return (
    <div className="space-y-4 my-8">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-extrabold tracking-tight ${
          theme === 'light' ? 'text-slate-950' : 'text-white'
        }`}>
          Explore por categorias
        </h3>
        <button 
          onClick={() => onSelectCategory('todas')}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categoryVisuals.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = selectedCategory.toLowerCase() === cat.slug;

          return (
            <button
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 scale-105 font-bold'
                  : theme === 'light'
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-amber-400'
                  : 'bg-[#0f111c] hover:bg-[#161827] text-gray-300 border-white/10 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                isSelected ? 'bg-black/10 text-black' : 'bg-amber-500/10 text-amber-400'
              }`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <span className="text-xs font-extrabold tracking-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
