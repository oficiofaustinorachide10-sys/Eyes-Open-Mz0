/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye, Sparkles, Plus, Search, Trophy, Calendar, MapPin, Flame, 
  ShieldCheck, CheckCircle2, Heart, Share2, MessageSquare, Filter, 
  Clock, Users, Award, TrendingUp, Video, Camera, FileText, Palette, 
  Layers, Globe, ChevronRight, Play, Building, Check, BookOpen, 
  AlertTriangle, Megaphone, ThumbsUp, RefreshCw, X, Star, Upload, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Post } from '../types';

interface AbraViewProps {
  currentUser?: User;
  posts?: Post[];
  onNavigate?: (view: string) => void;
}

// ---------------------------------------------------------
// MOCK DATA & INITIAL STATES FOR ABRA OS OLHOS MODULE
// ---------------------------------------------------------

interface HighlightItem {
  id: string;
  categoryTitle: string;
  badgeText: string;
  iconName: string;
  title: string;
  author: string;
  province: string;
  imageUrl: string;
  mediaType: 'image' | 'video';
  likes: number;
  description: string;
  isLiked?: boolean;
}

interface ChallengeItem {
  id: string;
  icon: string;
  title: string;
  category: string;
  description: string;
  daysRemaining: number;
  participantsCount: number;
  prize: string;
  bannerUrl: string;
}

interface ProjectItem {
  id: string;
  type: 'Organização' | 'Campanha' | 'Evento' | 'Projeto Social';
  title: string;
  organization: string;
  description: string;
  followers: number;
  province: string;
  imageUrl: string;
  isFollowing?: boolean;
}

interface RealStoryItem {
  id: string;
  title: string;
  author: string;
  role: string;
  province: string;
  snippet: string;
  fullStory: string;
  likes: number;
  avatar: string;
  isLiked?: boolean;
}

interface RadarMarker {
  id: string;
  type: 'problema' | 'projeto' | 'evento' | 'campanha';
  title: string;
  location: string;
  province: string;
  description: string;
  coords: { x: number; y: number }; // Percentage for custom responsive map
  supporters: number;
  status: 'Ativo' | 'Em Resolução' | 'Concluído';
  isSupported?: boolean;
}

interface EventItem {
  id: string;
  title: string;
  type: 'Concurso' | 'Workshop' | 'Exposição' | 'Encontro';
  date: string;
  time: string;
  location: string;
  province: string;
  organizer: string;
  isRegistered?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export default function AbraView({ currentUser, posts = [], onNavigate }: AbraViewProps) {
  // Navigation & Search State
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [algorithmFilter, setAlgorithmFilter] = useState<'originality' | 'impact' | 'engagement' | 'relevance'>('originality');

  // Modals
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [showChallengeModal, setShowChallengeModal] = useState<ChallengeItem | null>(null);
  const [showStoryModal, setShowStoryModal] = useState<RealStoryItem | null>(null);
  const [selectedRadarMarker, setSelectedRadarMarker] = useState<RadarMarker | null>(null);

  // Publish Form State
  const [publishType, setPublishType] = useState<'foto' | 'video' | 'historia' | 'arte'>('foto');
  const [publishTitle, setPublishTitle] = useState<string>('');
  const [publishCampaign, setPublishCampaign] = useState<string>('A Minha Cidade');
  const [publishDescription, setPublishDescription] = useState<string>('');
  const [publishMediaUrl, setPublishMediaUrl] = useState<string>('');
  const [publishProvince, setPublishProvince] = useState<string>('Maputo Cidade');
  
  // AI Verification Progress State
  const [isAiVerifying, setIsAiVerifying] = useState<boolean>(false);
  const [aiStepIndex, setAiStepIndex] = useState<number>(0);
  const [aiVerifiedSuccess, setAiVerifiedSuccess] = useState<boolean>(false);

  // Stats Counters State
  const [stats, setStats] = useState({
    participants: 14280,
    activeCampaigns: 28,
    publishedWorks: 3840,
    provinces: '11 / 11',
    views: '240.5K'
  });

  // Categories list
  const categories = [
    'Todos', 'Cinema', 'Fotografia', 'Arte', 'Educação', 
    'Ambiente', 'Tecnologia', 'Empreendedorismo', 'Saúde', 'Cultura'
  ];

  // 1. Destaques da Semana
  const [weeklyHighlights, setWeeklyHighlights] = useState<HighlightItem[]>([
    {
      id: 'hl-1',
      categoryTitle: 'Melhor Fotografia 📸',
      badgeText: 'Escolha da Equipa',
      iconName: 'Camera',
      title: 'Cores & Contrastes do Mercado Central',
      author: 'Ana Clara Nguenha',
      province: 'Nampula',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop',
      mediaType: 'image',
      likes: 342,
      description: 'Uma exploração vibrante das texturas da vida quotidiana em Nampula.'
    },
    {
      id: 'hl-2',
      categoryTitle: 'Melhor Curta 🎬',
      badgeText: 'Escolha da Equipa',
      iconName: 'Video',
      title: 'O Menino e o Mar da Polana',
      author: 'Sérgio Mabunda',
      province: 'Maputo Cidade',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop',
      mediaType: 'video',
      likes: 512,
      description: 'Minidocumentário de 3 minutos sobre os jovens pescadores da costa de Maputo.'
    },
    {
      id: 'hl-3',
      categoryTitle: 'Melhor Documentário 📄',
      badgeText: 'Escolha da Equipa',
      iconName: 'FileText',
      title: 'Guardiões dos Mangais do Chiveve',
      author: 'Associação EcoBeira',
      province: 'Sofala',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop',
      mediaType: 'video',
      likes: 289,
      description: 'Como a comunidade se uniu para proteger o ecossistema costeiro do canal do Chiveve.'
    },
    {
      id: 'hl-4',
      categoryTitle: 'Melhor Denúncia Social 🚨',
      badgeText: 'Escolha da Equipa',
      iconName: 'AlertTriangle',
      title: 'A Ponte do Rio Ligonha Necessita de Apoio',
      author: 'Coletivo Cidadão Zambézia',
      province: 'Zambézia',
      imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop',
      mediaType: 'image',
      likes: 670,
      description: 'Relato fotográfico urgente sobre a importância da travessia para o transporte de alimentos.'
    },
    {
      id: 'hl-5',
      categoryTitle: 'Melhor História 📖',
      badgeText: 'Escolha da Equipa',
      iconName: 'BookOpen',
      title: 'A Arte de Moldar Argila na Matola',
      author: 'Marta Tembe',
      province: 'Maputo Província',
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
      mediaType: 'image',
      likes: 198,
      description: 'História inspiradora sobre como a cerâmica ancestral sustenta três gerações de mulheres.'
    }
  ]);

  // 2. Desafios Ativos
  const [challenges, setChallenges] = useState<ChallengeItem[]>([
    {
      id: 'ch-1',
      icon: '📸',
      title: 'A Minha Cidade',
      category: 'Fotografia & Arquitetura',
      description: 'Capte o espírito, as luzes e a arquitetura das cidades moçambicanas sob o seu olhar autêntico.',
      daysRemaining: 12,
      participantsCount: 1240,
      prize: 'Kit Câmera 4D + Exposição Nacional',
      bannerUrl: 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'ch-2',
      icon: '🎬',
      title: 'O Meu Bairro',
      category: 'Cinema & Curtas',
      description: 'Grave um vídeo de até 60 segundos mostrando a energia, talentos ou figuras do seu bairro.',
      daysRemaining: 5,
      participantsCount: 890,
      prize: 'Bolsa de Equipamento de Filmagem Pro',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'ch-3',
      icon: '🌍',
      title: 'Ambiente & Sustentabilidade',
      category: 'Causas & Denúncia',
      description: 'Partilhe fotos ou soluções que promovam a limpeza, reciclagem e proteção dos recursos naturais.',
      daysRemaining: 19,
      participantsCount: 2150,
      prize: 'Fundo Comunitário de R$ 50.000 MT + Troféu',
      bannerUrl: 'https://images.unsplash.com/photo-1511497584788-876761c11969?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'ch-4',
      icon: '👨‍👩‍👧',
      title: 'Família & Tradição',
      category: 'Cultura & Sociedade',
      description: 'Retratos e registros comoventes das conexões familiares e legados culturais do nosso país.',
      daysRemaining: 8,
      participantsCount: 640,
      prize: 'Publicação no Livro do Eyes Open MZ',
      bannerUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'ch-5',
      icon: '🎨',
      title: 'Expressão Artística',
      category: 'Arte Digital & Pintura',
      description: 'Mostre ilustrações, quadros, esculturas ou criações digitais originais.',
      daysRemaining: 25,
      participantsCount: 1420,
      prize: 'Residência Artística de 1 Mês',
      bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop'
    }
  ]);

  // 3. Projetos em Destaque
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: 'proj-1',
      type: 'Organização',
      title: 'Cineastas Sem Fronteiras MZ',
      organization: 'Associação Cultural CineMZ',
      description: 'Coletivo dedicado à capacitação técnica em audiovisuais para jovens nas zonas rurais.',
      followers: 3420,
      province: 'Maputo Cidade',
      imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
      isFollowing: false
    },
    {
      id: 'proj-2',
      type: 'Campanha',
      title: 'Luz na Educação - Escolas do Campo',
      organization: 'Fundação Futuro Saberes',
      description: 'Instalação de painéis solares para permitir estudo noturno nas escolas comunitárias.',
      followers: 5190,
      province: 'Cabo Delgado',
      imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=600&auto=format&fit=crop',
      isFollowing: true
    },
    {
      id: 'proj-3',
      type: 'Evento',
      title: 'Mostra de Cinema Independente de Maputo',
      organization: 'Festival CineOlhos',
      description: 'Exibição pública de curtas-metragens moçambicanas no Jardim Tunduru.',
      followers: 8120,
      province: 'Maputo Cidade',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
      isFollowing: false
    },
    {
      id: 'proj-4',
      type: 'Projeto Social',
      title: 'EcoBairro Beira Limpa',
      organization: 'Iniciativa Verde Beira',
      description: 'Projeto comunitário de reciclagem de resíduos plásticos e transformação em peças artesanais.',
      followers: 2940,
      province: 'Sofala',
      imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop',
      isFollowing: false
    }
  ]);

  // 4. Histórias Reais
  const [realStories, setRealStories] = useState<RealStoryItem[]>([
    {
      id: 'story-1',
      title: 'Como a fotografia mudou a minha vida no Bairro da Manga',
      author: 'Ofício Rachide',
      role: 'Fotógrafo Comunitário',
      province: 'Sofala',
      snippet: 'Peguei numa câmara antiga de telemóvel e comecei a fotografar os sorrisos das crianças do meu bairro. O que começou como curiosidade virou um movimento social.',
      fullStory: 'Peguei numa câmara antiga de telemóvel e comecei a fotografar os sorrisos das crianças do meu bairro no Bairro da Manga, na Beira. O que começou como simples curiosidade virou um movimento social. Hoje, organizo oficinas gratuitas para jovens que querem contar suas próprias histórias e afastar-se da vulnerabilidade social através da lente da câmara. A arte abriu portas que eu nunca imaginei.',
      likes: 412,
      avatar: 'https://i.pravatar.cc/150?img=33'
    },
    {
      id: 'story-2',
      title: 'O dia em que a nossa denúncia sobre a ponte teve resposta',
      author: 'Maria Cossa',
      role: 'Líder Comunitária',
      province: 'Inhambane',
      snippet: 'Publicámos fotos da ponte danificada na campanha Abra os Olhos. Em menos de 2 semanas, o município respondeu e iniciou as reparações.',
      fullStory: 'Durante meses, os moradores do nosso bairro em Inhambane enfrentavam grandes dificuldades para cruzar o riacho durante a época de chuvas. Decidimos publicar fotos bem documentadas e respeitosas no módulo Abra os Olhos do Eyes Open MZ. A publicação teve centenas de apoios e chegou às autoridades locais. A obra de reconstrução começou poucos dias depois!',
      likes: 856,
      avatar: 'https://i.pravatar.cc/150?img=47'
    }
  ]);

  // 5. Radar Comunitário Marcadores
  const [radarMarkers, setRadarMarkers] = useState<RadarMarker[]>([
    {
      id: 'rad-1',
      type: 'problema',
      title: 'Abastecimento de Água no Bairro Triângulo',
      location: 'Bairro Triângulo, Nampula',
      province: 'Nampula',
      description: 'Comunidade sem água potável há 3 semanas. Necessita de verificação rápida do fontanário.',
      coords: { x: 75, y: 30 },
      supporters: 312,
      status: 'Ativo'
    },
    {
      id: 'rad-2',
      type: 'projeto',
      title: 'Oficina de Teatro Comunitário',
      location: 'Matola 7, Maputo Província',
      province: 'Maputo Província',
      description: 'Espaço cultural gratuito ensinando dramaturgia e expressão corporal aos sábados.',
      coords: { x: 25, y: 88 },
      supporters: 450,
      status: 'Ativo'
    },
    {
      id: 'rad-3',
      type: 'evento',
      title: 'Mostra de Curtas ao Ar Livre',
      location: 'Jardim das Mangueiras, Beira',
      province: 'Sofala',
      description: 'Projeção de filmes moçambicanos gratuitos com debate com realizadores.',
      coords: { x: 50, y: 58 },
      supporters: 620,
      status: 'Ativo'
    },
    {
      id: 'rad-4',
      type: 'campanha',
      title: 'Reflorestamento de Dunas',
      location: 'Praia do Wimbe, Pemba',
      province: 'Cabo Delgado',
      description: 'Plantação de vegetação nativa para proteção contra a erosão marinha.',
      coords: { x: 82, y: 15 },
      supporters: 890,
      status: 'Em Resolução'
    }
  ]);

  // 6. Conquistas & Medalhas
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'ach-1',
      title: 'Primeira Participação',
      icon: '🥇',
      description: 'Publicar a sua 1ª obra ou denúncia na campanha Abra os Olhos.',
      unlocked: true,
      progress: 1,
      maxProgress: 1
    },
    {
      id: 'ach-2',
      title: 'Criador Social',
      icon: '✊',
      description: 'Publicar 3 conteúdos focados em Impacto Social ou Soluções Comunitárias.',
      unlocked: true,
      progress: 3,
      maxProgress: 3
    },
    {
      id: 'ach-3',
      title: 'Fotógrafo da Semana',
      icon: '📸',
      description: 'Ter uma obra selecionada para os Destaques da Semana da equipa curadora.',
      unlocked: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'ach-4',
      title: 'Olhar Criativo',
      icon: '🎨',
      description: 'Participar em pelo menos 3 Desafios Ativos da comunidade.',
      unlocked: false,
      progress: 1,
      maxProgress: 3
    },
    {
      id: 'ach-5',
      title: 'Voz da Comunidade',
      icon: '📢',
      description: 'Dar apoio ou comentar construtivamente em 10 causas do Radar Comunitário.',
      unlocked: true,
      progress: 10,
      maxProgress: 10
    }
  ]);

  // 7. Calendário de Eventos
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'ev-1',
      title: 'Workshop de Fotografia Documental',
      type: 'Workshop',
      date: '28 de Julho',
      time: '14:00 - 17:00',
      location: 'Centro Cultural Franco-Moçambicano',
      province: 'Maputo Cidade',
      organizer: 'Coletivo Olhar Aberto',
      isRegistered: false
    },
    {
      id: 'ev-2',
      title: 'Concurso de Curtas de 1 Minuto',
      type: 'Concurso',
      date: '05 de Agosto',
      time: 'Prazo Limite 23:59',
      location: 'Plataforma Digital Eyes Open',
      province: 'Nacional (Todas as Províncias)',
      organizer: 'Equipa Abra os Olhos',
      isRegistered: true
    },
    {
      id: 'ev-3',
      title: 'Exposição "Olhares de Moçambique"',
      type: 'Exposição',
      date: '12 de Agosto',
      time: '10:00 - 18:00',
      location: 'Casa da Cultura da Beira',
      province: 'Sofala',
      organizer: 'Associação de Artes de Sofala',
      isRegistered: false
    }
  ]);

  // Handle Like Highlight
  const toggleLikeHighlight = (id: string) => {
    setWeeklyHighlights(prev => prev.map(item => {
      if (item.id === id) {
        const isLiked = !item.isLiked;
        return {
          ...item,
          isLiked,
          likes: isLiked ? item.likes + 1 : item.likes - 1
        };
      }
      return item;
    }));
  };

  // Handle Follow Project
  const toggleFollowProject = (id: string) => {
    setProjects(prev => prev.map(item => {
      if (item.id === id) {
        const isFollowing = !item.isFollowing;
        return {
          ...item,
          isFollowing,
          followers: isFollowing ? item.followers + 1 : item.followers - 1
        };
      }
      return item;
    }));
  };

  // Handle Support Radar Marker
  const toggleSupportMarker = (id: string) => {
    setRadarMarkers(prev => prev.map(item => {
      if (item.id === id) {
        const isSupported = !item.isSupported;
        return {
          ...item,
          isSupported,
          supporters: isSupported ? item.supporters + 1 : item.supporters - 1
        };
      }
      return item;
    }));
  };

  // Handle Register Event
  const toggleRegisterEvent = (id: string) => {
    setEvents(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isRegistered: !item.isRegistered };
      }
      return item;
    }));
  };

  // Handle AI Submission Simulation
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTitle.trim() || !publishDescription.trim()) {
      alert('Por favor, preencha o título e a descrição da sua obra.');
      return;
    }

    setIsAiVerifying(true);
    setAiStepIndex(0);
    setAiVerifiedSuccess(false);

    // AI Check Step 1: Plágio
    setTimeout(() => setAiStepIndex(1), 600);
    // AI Check Step 2: Spam & Conteúdo
    setTimeout(() => setAiStepIndex(2), 1200);
    // AI Check Step 3: Violência & Nudez
    setTimeout(() => setAiStepIndex(3), 1800);
    // AI Check Step 4: Qualidade & Finalização
    setTimeout(() => {
      setAiStepIndex(4);
      setAiVerifiedSuccess(true);
      
      // Add new highlight to local state after verification
      setTimeout(() => {
        const newHighlight: HighlightItem = {
          id: 'hl-' + Date.now(),
          categoryTitle: `Nova Obra (${publishType.toUpperCase()}) ✨`,
          badgeText: '🛡️ Aprovado por IA',
          iconName: 'Sparkles',
          title: publishTitle,
          author: currentUser?.nickname || 'Você',
          province: publishProvince,
          imageUrl: publishMediaUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop',
          mediaType: publishType === 'video' ? 'video' : 'image',
          likes: 1,
          description: publishDescription
        };

        setWeeklyHighlights(prev => [newHighlight, ...prev]);
        setStats(prev => ({ ...prev, publishedWorks: prev.publishedWorks + 1 }));
        
        // Reset state
        setIsAiVerifying(false);
        setShowPublishModal(false);
        setPublishTitle('');
        setPublishDescription('');
        setPublishMediaUrl('');
      }, 1000);
    }, 2400);
  };

  // Filtered Highlights based on Category and Search Query
  const filteredHighlights = weeklyHighlights.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.categoryTitle.toLowerCase().includes(activeCategory.toLowerCase()) || item.description.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesQuery = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.province.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex-1 p-3 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-36">
      
      {/* HEADER TITLE BLOCK & DESCRIPTION */}
      <div className="bg-gradient-to-r from-[#0c0c28] via-[#11113a] to-[#18082e] border border-neon-cyan/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-neon-magenta/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan font-orbitron font-extrabold text-[10px] tracking-widest uppercase mb-2">
              <Eye className="w-3.5 h-3.5" /> MÓDULO OFICIAL ABRA OS OLHOS
            </span>
            <h1 className="font-orbitron font-extrabold text-2xl md:text-3xl text-white tracking-wider uppercase glow-text-cyan">
              ABRA OS OLHOS <Sparkles className="inline-block w-6 h-6 text-yellow-400 animate-pulse ml-1" />
            </h1>
          </div>

          <button
            onClick={() => setShowPublishModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-orbitron font-black text-xs tracking-widest transition-all cursor-pointer shadow-lg shadow-neon-cyan/20 hover:scale-105 active:scale-95 uppercase flex items-center gap-2 self-stretch md:self-auto justify-center shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> PUBLICAR NOVO CONTEÚDO
          </button>
        </div>

        <p className="text-xs md:text-sm text-gray-300 font-medium leading-relaxed mt-4 max-w-2xl">
          Um espaço para descobrir talentos, denunciar problemas da sociedade, participar em desafios criativos e conhecer projetos que merecem atenção em todo o país.
        </p>

        {/* 13. ESTATÍSTICAS DO MÓDULO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6 pt-4 border-t border-white/10">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Participantes</span>
            <span className="font-orbitron font-black text-base text-neon-cyan">{stats.participants.toLocaleString()}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Campanhas Ativas</span>
            <span className="font-orbitron font-black text-base text-yellow-400">{stats.activeCampaigns}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Obras Publicadas</span>
            <span className="font-orbitron font-black text-base text-neon-magenta">{stats.publishedWorks.toLocaleString()}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Províncias</span>
            <span className="font-orbitron font-black text-base text-green-400">{stats.provinces}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Visualizações</span>
            <span className="font-orbitron font-black text-base text-indigo-400">{stats.views}</span>
          </div>
        </div>
      </div>

      {/* 1. BANNER PRINCIPAL DA CAMPANHA */}
      <div className="relative rounded-3xl overflow-hidden border border-neon-cyan/40 shadow-2xl bg-black group">
        <img 
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop" 
          alt="Banner Abra os Olhos"
          className="w-full h-64 md:h-80 object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-red-600 text-white font-orbitron font-extrabold text-[10px] tracking-widest rounded-full uppercase animate-pulse">
              🎥 MÍDIA EM DESTAQUE
            </span>
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
              Província de Maputo Cidade
            </span>
          </div>

          <h2 className="font-orbitron font-extrabold text-xl md:text-2xl text-white tracking-wide uppercase">
            Campanha Abra os Olhos: O Futuro da Nossa Voz
          </h2>
          <p className="text-xs md:text-sm text-gray-300 max-w-xl line-clamp-2">
            Sua visão é a nossa missão! Participe ativamente publicando fotografias, curtas-metragens, denúncias e histórias comunitárias para transformar a nossa sociedade.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('desafios-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-neon-cyan text-black font-orbitron font-extrabold text-xs tracking-wider uppercase hover:bg-white transition-all cursor-pointer shadow-md"
            >
              Participar num Desafio
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-orbitron font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer"
            >
              Publicar Agora
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('destaques-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-black/60 hover:bg-black border border-neon-cyan/30 text-neon-cyan font-orbitron font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1"
            >
              Ver Destaques <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. PESQUISAR & 8. CATEGORIAS */}
      <div className="space-y-4 bg-[#0a0a22]/90 border border-neon-cyan/20 p-5 rounded-3xl shadow-xl">
        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="w-5 h-5 text-neon-cyan absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar campanhas, desafios, participantes, hashtags (#CinemaMZ), histórias, fotos..."
            className="w-full bg-black/60 border border-neon-cyan/30 rounded-2xl pl-12 pr-4 py-3 text-xs md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categorias Pílulas */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[10px] font-orbitron font-extrabold text-gray-400 uppercase tracking-widest shrink-0 pr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-neon-cyan" /> CATEGORIAS:
          </span>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-orbitron font-bold tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'bg-neon-cyan text-black shadow-md shadow-neon-cyan/20 scale-105' 
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 12. SELETOR DE ALGORITMO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/40 border border-white/10 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-gray-300 uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-neon-cyan" /> ALGORITMO DA COMUNIDADE:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {[
            { id: 'originality', label: '🎨 Originalidade' },
            { id: 'impact', label: '✊ Impacto Social' },
            { id: 'engagement', label: '💬 Engajamento' },
            { id: 'relevance', label: '🎯 Relevância' }
          ].map((alg) => (
            <button
              key={alg.id}
              onClick={() => setAlgorithmFilter(alg.id as any)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                algorithmFilter === alg.id 
                  ? 'bg-neon-magenta text-white font-orbitron shadow-sm' 
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {alg.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. DESTAQUES DA SEMANA */}
      <div id="destaques-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-neon-cyan/20 pb-2">
          <h3 className="font-orbitron font-extrabold text-sm md:text-base text-neon-cyan tracking-widest uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> DESTAQUES DA SEMANA (CURADORIA)
          </h3>
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            {filteredHighlights.length} Obras Selecionadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHighlights.map((hl) => (
            <div 
              key={hl.id}
              className="bg-[#0b0b26]/90 border border-neon-cyan/25 rounded-3xl overflow-hidden shadow-xl hover:border-neon-cyan transition-all group flex flex-col justify-between"
            >
              <div className="relative h-48 bg-black overflow-hidden">
                <img 
                  src={hl.imageUrl} 
                  alt={hl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-yellow-400/50 px-3 py-1 rounded-full text-yellow-400 font-orbitron font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> {hl.categoryTitle}
                </div>
                <div className="absolute top-3 right-3 bg-black/80 border border-white/20 px-2.5 py-1 rounded-full text-white font-mono text-[10px] font-bold uppercase">
                  {hl.province}
                </div>
                {hl.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-neon-cyan/80 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 fill-black ml-1" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-orbitron font-extrabold text-sm text-white tracking-wide uppercase line-clamp-1">
                    {hl.title}
                  </h4>
                  <p className="text-[11px] text-neon-cyan font-bold mt-0.5">
                    Por {hl.author}
                  </p>
                  <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                    {hl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                  <button
                    onClick={() => toggleLikeHighlight(hl.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      hl.isLiked 
                        ? 'bg-red-600/30 border-red-500 text-red-400' 
                        : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hl.isLiked ? 'fill-red-400' : ''}`} />
                    <span>{hl.likes} Apoios</span>
                  </button>

                  <button
                    onClick={() => {
                      alert(`Partilhando "${hl.title}" de ${hl.author}! Link copiado.`);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Partilhar Obra"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DESAFIOS ATIVOS */}
      <div id="desafios-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-neon-cyan/20 pb-2">
          <h3 className="font-orbitron font-extrabold text-sm md:text-base text-yellow-400 tracking-widest uppercase flex items-center gap-2">
            <Flame className="w-5 h-5 text-yellow-400 animate-bounce" /> DESAFIOS ATIVOS DA COMUNIDADE
          </h3>
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            {challenges.length} Desafios Aberto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((ch) => (
            <div 
              key={ch.id}
              className="bg-gradient-to-br from-[#0c0c28] to-[#160a2c] border border-yellow-500/30 rounded-3xl p-5 shadow-xl hover:border-yellow-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="px-3 py-1 bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-orbitron font-bold text-[10px] rounded-full uppercase">
                    ⏳ {ch.daysRemaining} Dias Restantes
                  </span>
                </div>

                <h4 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider pt-1">
                  {ch.title}
                </h4>
                <p className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">
                  Categoria: {ch.category}
                </p>
                <p className="text-xs text-gray-300 leading-relaxed pt-1">
                  {ch.description}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10 mt-4">
                <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">🏆 Prémio em Destaque:</p>
                  <p className="text-xs font-bold text-yellow-300">{ch.prize}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-mono font-bold">
                    👥 {ch.participantsCount.toLocaleString()} Criadores
                  </span>
                  <button
                    onClick={() => {
                      setPublishCampaign(ch.title);
                      setShowPublishModal(true);
                    }}
                    className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-white text-black font-orbitron font-black text-xs tracking-wider uppercase transition-all cursor-pointer shadow-md"
                  >
                    Participar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PROJETOS EM DESTAQUE & 9. SEGUIR CAMPANHAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neon-cyan/20 pb-2">
          <h3 className="font-orbitron font-extrabold text-sm md:text-base text-neon-magenta tracking-widest uppercase flex items-center gap-2">
            <Building className="w-5 h-5 text-neon-magenta" /> PROJETOS, ORGANIZAÇÕES & CAMPANHAS
          </h3>
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            Apoio & Parcerias
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div 
              key={proj.id}
              className="bg-[#0c0a22] border border-neon-magenta/30 rounded-3xl p-4 flex flex-col justify-between shadow-lg hover:border-neon-magenta transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-neon-magenta/20 border border-neon-magenta/40 text-neon-magenta font-orbitron font-bold text-[9px] rounded-full uppercase">
                    {proj.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{proj.province}</span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <img 
                    src={proj.imageUrl} 
                    alt={proj.title}
                    className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0" 
                  />
                  <div>
                    <h4 className="font-orbitron font-extrabold text-xs text-white uppercase tracking-wide line-clamp-1">
                      {proj.title}
                    </h4>
                    <p className="text-[10px] text-gray-400">{proj.organization}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed pt-1 line-clamp-2">
                  {proj.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                <span className="text-[10px] text-gray-400 font-mono font-bold">
                  {proj.followers.toLocaleString()} Apoiadores
                </span>
                <button
                  onClick={() => toggleFollowProject(proj.id)}
                  className={`px-4 py-1.5 rounded-xl font-orbitron font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                    proj.isFollowing 
                      ? 'bg-green-600/30 border border-green-500 text-green-400' 
                      : 'bg-neon-magenta hover:bg-white text-white hover:text-black shadow-md'
                  }`}
                >
                  {proj.isFollowing ? '✓ A Seguir' : '+ Seguir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. HISTÓRIAS REAIS DA COMUNIDADE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neon-cyan/20 pb-2">
          <h3 className="font-orbitron font-extrabold text-sm md:text-base text-neon-cyan tracking-widest uppercase flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-neon-cyan" /> HISTÓRIAS REAIS DA COMUNIDADE
          </h3>
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            Relatos Inspiradores
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {realStories.map((story) => (
            <div 
              key={story.id}
              className="bg-[#090924] border border-neon-cyan/25 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img 
                    src={story.avatar} 
                    alt={story.author}
                    className="w-10 h-10 rounded-full border-2 border-neon-cyan/50 shrink-0" 
                  />
                  <div>
                    <h4 className="font-orbitron font-extrabold text-xs text-white uppercase tracking-wider">
                      {story.author}
                    </h4>
                    <p className="text-[10px] text-neon-cyan font-bold">{story.role} • {story.province}</p>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-yellow-300 leading-snug">
                  "{story.title}"
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{story.snippet}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                  ❤️ {story.likes} Leitores Tocados
                </span>
                <button
                  onClick={() => setShowStoryModal(story)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-neon-cyan hover:text-black border border-white/20 text-white font-orbitron font-bold text-[10px] uppercase transition-all cursor-pointer"
                >
                  Ler História Completa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. RADAR COMUNITÁRIO (MAPA INTERATIVO) */}
      <div className="space-y-4 bg-gradient-to-br from-[#08081a] to-[#120726] border border-neon-cyan/30 p-5 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="font-orbitron font-extrabold text-sm md:text-base text-neon-cyan tracking-widest uppercase flex items-center gap-2">
              <Globe className="w-5 h-5 text-neon-cyan animate-pulse" /> RADAR COMUNITÁRIO (MAPA DE MOÇAMBIQUE)
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Identifique problemas reportados, projetos culturais e eventos em cada província.
            </p>
          </div>
        </div>

        {/* Mapa com Marcadores Interativos */}
        <div className="relative h-64 md:h-80 bg-[#040412] rounded-2xl border border-neon-cyan/20 overflow-hidden flex items-center justify-center p-4">
          {/* Fundo do Mapa de Moçambique Estilizado */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00f5ff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-orbitron font-black text-4xl md:text-6xl text-white/5 uppercase tracking-widest select-none">
              MOÇAMBIQUE RADAR
            </span>
          </div>

          {/* Render Marcadores */}
          {radarMarkers.map((marker) => (
            <button
              key={marker.id}
              onClick={() => setSelectedRadarMarker(marker)}
              style={{ left: `${marker.coords.x}%`, top: `${marker.coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border shadow-xl transition-transform cursor-pointer hover:scale-125 z-10 flex items-center gap-1 ${
                marker.type === 'problema' 
                  ? 'bg-red-600/90 border-red-400 text-white shadow-red-600/50' 
                  : marker.type === 'projeto'
                  ? 'bg-neon-cyan/90 border-white text-black shadow-neon-cyan/50'
                  : marker.type === 'evento'
                  ? 'bg-yellow-500/90 border-white text-black shadow-yellow-500/50'
                  : 'bg-neon-magenta/90 border-white text-white shadow-neon-magenta/50'
              }`}
              title={marker.title}
            >
              {marker.type === 'problema' && <AlertTriangle className="w-3.5 h-3.5" />}
              {marker.type === 'projeto' && <Building className="w-3.5 h-3.5" />}
              {marker.type === 'evento' && <Calendar className="w-3.5 h-3.5" />}
              {marker.type === 'campanha' && <Megaphone className="w-3.5 h-3.5" />}
              <span className="text-[9px] font-bold font-mono px-1 hidden sm:inline">{marker.province}</span>
            </button>
          ))}
        </div>

        {/* Marcador Selecionado Popover */}
        {selectedRadarMarker && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 border border-neon-cyan p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-orbitron text-[9px] font-bold uppercase">
                  {selectedRadarMarker.type}
                </span>
                <span className="text-[10px] text-gray-300 font-bold">{selectedRadarMarker.location}</span>
              </div>
              <h4 className="font-orbitron font-extrabold text-sm text-white uppercase">{selectedRadarMarker.title}</h4>
              <p className="text-xs text-gray-300">{selectedRadarMarker.description}</p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => toggleSupportMarker(selectedRadarMarker.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-orbitron transition-all cursor-pointer ${
                  selectedRadarMarker.isSupported
                    ? 'bg-green-600 text-white'
                    : 'bg-neon-cyan text-black hover:bg-white'
                }`}
              >
                {selectedRadarMarker.isSupported ? '✓ Apoiado' : `Apoiar Cause (${selectedRadarMarker.supporters})`}
              </button>
              <button
                onClick={() => setSelectedRadarMarker(null)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 14. CONQUISTAS & MEDALHAS */}
      <div className="space-y-4 bg-[#0a0a22] border border-yellow-500/30 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="font-orbitron font-extrabold text-sm md:text-base text-yellow-400 tracking-widest uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> SUAS CONQUISTAS & MEDALHAS
          </h3>
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            Sistema Gamificado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div 
              key={ach.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                ach.unlocked 
                  ? 'bg-yellow-500/10 border-yellow-500/40' 
                  : 'bg-white/5 border-white/10 opacity-60'
              }`}
            >
              <span className="text-2xl shrink-0 p-1.5 bg-black/40 rounded-xl">{ach.icon}</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-orbitron font-extrabold text-xs text-white uppercase">{ach.title}</h4>
                  {ach.unlocked && <span className="text-[9px] font-bold text-yellow-400 uppercase">✓ Desbloqueado</span>}
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">{ach.description}</p>
                
                <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-yellow-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 15. CALENDÁRIO DE EVENTOS, WORKSHOPS E CONCURSOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neon-cyan/20 pb-2">
          <h3 className="font-orbitron font-extrabold text-sm md:text-base text-neon-cyan tracking-widest uppercase flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-cyan" /> CALENDÁRIO DE EVENTOS & WORKSHOPS
          </h3>
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
            Agenda Cultural
          </span>
        </div>

        <div className="space-y-3">
          {events.map((ev) => (
            <div 
              key={ev.id}
              className="bg-[#0b0b28] border border-neon-cyan/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg hover:border-neon-cyan transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="bg-neon-cyan/15 border border-neon-cyan/40 rounded-xl p-2.5 text-center shrink-0 min-w-[70px]">
                  <span className="block font-orbitron font-black text-xs text-neon-cyan uppercase">{ev.date.split(' ')[0]}</span>
                  <span className="block text-[9px] font-bold text-white uppercase">{ev.date.split(' ').slice(1).join(' ')}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white/10 text-white font-orbitron font-bold text-[9px] rounded uppercase">
                      {ev.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{ev.province}</span>
                  </div>
                  <h4 className="font-orbitron font-extrabold text-sm text-white uppercase">{ev.title}</h4>
                  <p className="text-xs text-gray-300">
                    📍 {ev.location} • ⏰ {ev.time}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleRegisterEvent(ev.id)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
                  ev.isRegistered 
                    ? 'bg-green-600 text-white' 
                    : 'bg-neon-cyan hover:bg-white text-black shadow-md'
                }`}
              >
                {ev.isRegistered ? '✓ Inscrito na Agenda' : 'Inscrever-se'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* 10. MODAL DE PUBLICAÇÃO COM 11. SISTEMA DE APROVAÇÃO IA   */}
      {/* --------------------------------------------------------- */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0b0b28] border border-neon-cyan/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 text-left relative my-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-orbitron font-extrabold text-base text-neon-cyan tracking-wider uppercase flex items-center gap-2">
                  <Plus className="w-5 h-5 text-neon-cyan" /> PUBLICAR NA CAMPANHA ABRA OS OLHOS
                </h3>
                <button 
                  onClick={() => setShowPublishModal(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isAiVerifying ? (
                <form onSubmit={handlePublishSubmit} className="space-y-4">
                  {/* Tipo de Obra */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      1. Selecione o Tipo de Obra
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'foto', label: '📷 Foto', icon: Camera },
                        { id: 'video', label: '🎬 Vídeo', icon: Video },
                        { id: 'historia', label: '📝 História', icon: FileText },
                        { id: 'arte', label: '🎨 Arte', icon: Palette }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPublishType(t.id as any)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-orbitron tracking-wider transition-all cursor-pointer ${
                            publishType === t.id
                              ? 'bg-neon-cyan text-black border-neon-cyan font-black shadow-md'
                              : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seleção de Campanha / Desafio */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      2. Associar a uma Campanha / Desafio
                    </label>
                    <select
                      value={publishCampaign}
                      onChange={(e) => setPublishCampaign(e.target.value)}
                      className="w-full bg-black/60 border border-neon-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-neon-cyan"
                    >
                      <option value="A Minha Cidade">📸 Desafio: A Minha Cidade</option>
                      <option value="O Meu Bairro">🎬 Desafio: O Meu Bairro</option>
                      <option value="Ambiente & Sustentabilidade">🌍 Desafio: Ambiente & Sustentabilidade</option>
                      <option value="Família & Tradição">👨‍👩‍👧 Desafio: Família & Tradição</option>
                      <option value="Expressão Artística">🎨 Desafio: Expressão Artística</option>
                      <option value="Denúncia Comunitária">🚨 Denúncia Comunitária Urgente</option>
                      <option value="Livre">✨ Publicação Livre de Talento</option>
                    </select>
                  </div>

                  {/* Título & Província */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                        Título da Obra
                      </label>
                      <input
                        type="text"
                        value={publishTitle}
                        onChange={(e) => setPublishTitle(e.target.value)}
                        placeholder="Ex: O Reflexo do Sol na Baía de Pemba"
                        className="w-full bg-black/60 border border-neon-cyan/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                        Província
                      </label>
                      <select
                        value={publishProvince}
                        onChange={(e) => setPublishProvince(e.target.value)}
                        className="w-full bg-black/60 border border-neon-cyan/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                      >
                        {['Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* URL da Mídia / Imagem */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                      URL da Imagem / Mídia (Opcional)
                    </label>
                    <input
                      type="url"
                      value={publishMediaUrl}
                      onChange={(e) => setPublishMediaUrl(e.target.value)}
                      placeholder="https://exemplo.com/minha-foto.jpg"
                      className="w-full bg-black/60 border border-neon-cyan/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Descrição / Relato
                    </label>
                    <textarea
                      value={publishDescription}
                      onChange={(e) => setPublishDescription(e.target.value)}
                      rows={3}
                      placeholder="Explique o contexto, a mensagem ou a história por trás desta publicação..."
                      className="w-full bg-black/60 border border-neon-cyan/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                      required
                    />
                  </div>

                  <div className="bg-black/40 border border-yellow-500/20 p-3 rounded-2xl flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0" />
                    <p className="text-[10px] text-gray-300">
                      Sua obra passará pela verificação instantânea da Inteligência Artificial do Eyes Open MZ antes de ser publicada na comunidade.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-orbitron font-black text-xs tracking-widest uppercase transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    Enviar para Análise & Publicar 🚀
                  </button>
                </form>
              ) : (
                /* 11. SISTEMA DE APROVAÇÃO DA IA */
                <div className="py-8 text-center space-y-6">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-neon-cyan animate-spin [animation-duration:3s]" />
                    <Cpu className="w-10 h-10 text-neon-cyan animate-pulse" />
                  </div>

                  <div>
                    <h4 className="font-orbitron font-extrabold text-base text-white uppercase tracking-wider">
                      Verificação Inteligente em Curso...
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      A IA do Eyes Open MZ está a validar o seu conteúdo:
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto space-y-2 text-left bg-black/50 p-4 rounded-2xl border border-white/10">
                    {[
                      '✔ Plágio & Autoria',
                      '✔ Filtro de Spam',
                      '✔ Proteção contra Nudez & Violência',
                      '✔ Avaliação de Qualidade & Enquadramento'
                    ].map((step, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between text-xs font-bold font-mono transition-opacity ${
                          idx <= aiStepIndex ? 'text-green-400 opacity-100' : 'text-gray-600 opacity-40'
                        }`}
                      >
                        <span>{step}</span>
                        {idx <= aiStepIndex && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                    ))}
                  </div>

                  {aiVerifiedSuccess && (
                    <div className="bg-green-600/20 border border-green-500 p-3 rounded-2xl text-green-400 font-orbitron font-extrabold text-xs uppercase animate-bounce">
                      🛡️ Conteúdo Aprovado com Sucesso (Score 98%)!
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL LER HISTÓRIA COMPLETA */}
      <AnimatePresence>
        {showStoryModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0b0b28] border border-neon-cyan/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-orbitron font-bold text-neon-cyan uppercase">História Real da Comunidade</span>
                <button 
                  onClick={() => setShowStoryModal(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <img 
                  src={showStoryModal.avatar} 
                  alt={showStoryModal.author}
                  className="w-12 h-12 rounded-full border-2 border-neon-cyan shrink-0" 
                />
                <div>
                  <h4 className="font-orbitron font-extrabold text-sm text-white uppercase">{showStoryModal.author}</h4>
                  <p className="text-xs text-neon-cyan font-bold">{showStoryModal.role} • {showStoryModal.province}</p>
                </div>
              </div>

              <h3 className="font-bold text-base text-yellow-300 leading-snug">
                "{showStoryModal.title}"
              </h3>

              <p className="text-xs text-gray-200 leading-relaxed max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {showStoryModal.fullStory}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-gray-400 font-mono">❤️ {showStoryModal.likes} Pessoas Inspiradas</span>
                <button
                  onClick={() => setShowStoryModal(null)}
                  className="px-5 py-2 rounded-xl bg-neon-cyan text-black font-orbitron font-extrabold text-xs uppercase"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
