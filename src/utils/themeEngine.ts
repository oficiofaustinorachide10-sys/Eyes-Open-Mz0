/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThemeConfig {
  id: string;
  name: string;
  gridCols: '1-col' | '3-col' | 'grid';
  primaryColor: string;
  secondaryColor: string;
  blurEffect: string;
  borderRadius: string;
  boxShadow: string;
  textShadow: string;
  animationType: 'bounce-in' | 'fade-smooth' | 'none';
  bgMain: string;
  bgSidebar: string;
  bgCard: string;
  textMain: string;
  textMuted: string;
  border: string;
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  'noite': {
    id: 'noite',
    name: 'Noite Slate',
    gridCols: 'grid',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    blurEffect: '10px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#050508',
    bgSidebar: '#09090e',
    bgCard: '#111119',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#1e293b'
  },
  'luz': {
    id: 'luz',
    name: 'Luz Radiante',
    gridCols: 'grid',
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    blurEffect: '8px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#ffffff',
    bgSidebar: '#f4f4f5',
    bgCard: '#ffffff',
    textMain: '#09090b',
    textMuted: '#71717a',
    border: '#e4e4e7'
  },
  'lite': {
    id: 'lite',
    name: 'Lite Suave',
    gridCols: '1-col',
    primaryColor: '#4f46e5',
    secondaryColor: '#db2777',
    blurEffect: '4px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#f1f5f9',
    bgSidebar: '#e2e8f0',
    bgCard: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#cbd5e1'
  },
  'esmeralda': {
    id: 'esmeralda',
    name: 'Império Esmeralda',
    gridCols: 'grid',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    blurEffect: '12px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#041611',
    bgSidebar: '#06211a',
    bgCard: '#0a3127',
    textMain: '#e6f4f0',
    textMuted: '#809c95',
    border: '#114b3d'
  },
  'vinho': {
    id: 'vinho',
    name: 'Corte Vinho',
    gridCols: 'grid',
    primaryColor: '#db2777',
    secondaryColor: '#ec4899',
    blurEffect: '12px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(219, 39, 119, 0.08)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#14050d',
    bgSidebar: '#1e0814',
    bgCard: '#2b0b1c',
    textMain: '#faecf4',
    textMuted: '#a68ba0',
    border: '#42122b'
  },
  'ciano': {
    id: 'ciano',
    name: 'Abismo Ciano',
    gridCols: 'grid',
    primaryColor: '#06b6d4',
    secondaryColor: '#0ea5e9',
    blurEffect: '10px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.08)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#020813',
    bgSidebar: '#041126',
    bgCard: '#071b3a',
    textMain: '#e0f2fe',
    textMuted: '#7dd3fc',
    border: '#0b2d5d'
  },
  'crepusculo': {
    id: 'crepusculo',
    name: 'Vale Crepúsculo',
    gridCols: 'grid',
    primaryColor: '#8b5cf6',
    secondaryColor: '#f43f5e',
    blurEffect: '12px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.08)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#0f0c1b',
    bgSidebar: '#17122b',
    bgCard: '#201a3c',
    textMain: '#f5f3ff',
    textMuted: '#b4b0e0',
    border: '#2f2659'
  },
  'neon-cyber': {
    id: 'neon-cyber',
    name: 'Neon Cyberpunk ⚡',
    gridCols: '3-col',
    primaryColor: '#00ffcc',
    secondaryColor: '#ff00cc',
    blurEffect: '15px',
    borderRadius: '16px',
    boxShadow: '0 0 18px rgba(0, 255, 204, 0.35)',
    textShadow: '0 0 10px rgba(0, 255, 204, 0.65)',
    animationType: 'bounce-in',
    bgMain: '#02020a',
    bgSidebar: '#040412',
    bgCard: '#080820',
    textMain: '#e0ffff',
    textMuted: '#70a0a0',
    border: 'rgba(0, 255, 204, 0.25)'
  },
  'glass-minimalist': {
    id: 'glass-minimalist',
    name: 'Vidro Minimalista ❄️',
    gridCols: '1-col',
    primaryColor: '#ffffff',
    secondaryColor: '#a1a1aa',
    blurEffect: '40px',
    borderRadius: '32px',
    boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.06)',
    textShadow: 'none',
    animationType: 'fade-smooth',
    bgMain: '#09090b',
    bgSidebar: '#121215',
    bgCard: 'rgba(255, 255, 255, 0.03)',
    textMain: '#fafafa',
    textMuted: '#a1a1aa',
    border: 'rgba(255, 255, 255, 0.08)'
  }
};

/**
 * Injects CSS variables onto documentElement for live swapping.
 */
export function injectThemeVariables(config: ThemeConfig, uiMode: 'performance' | 'immersive', isUltraSaver: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // If ultra saver, override specific values
  const bgMain = isUltraSaver ? '#000000' : config.bgMain;
  const bgSidebar = isUltraSaver ? '#000000' : config.bgSidebar;
  const bgCard = isUltraSaver ? '#000000' : config.bgCard;
  const border = isUltraSaver ? '#111111' : config.border;
  const boxShadow = isUltraSaver ? 'none' : (uiMode === 'performance' ? 'none' : config.boxShadow);
  const textShadow = isUltraSaver ? 'none' : (uiMode === 'performance' ? 'none' : config.textShadow);
  const blurEffect = isUltraSaver ? '0px' : (uiMode === 'performance' ? '0px' : config.blurEffect);

  root.style.setProperty('--theme-bg-main', bgMain);
  root.style.setProperty('--theme-bg-sidebar', bgSidebar);
  root.style.setProperty('--theme-bg-card', bgCard);
  root.style.setProperty('--theme-border', border);
  root.style.setProperty('--theme-accent', config.primaryColor);
  root.style.setProperty('--theme-accent-secondary', config.secondaryColor);
  root.style.setProperty('--theme-text-main', config.textMain);
  root.style.setProperty('--theme-text-muted', config.textMuted);

  // Advanced Visuals
  root.style.setProperty('--theme-blur', blurEffect);
  root.style.setProperty('--theme-border-radius', config.borderRadius);
  root.style.setProperty('--theme-box-shadow', boxShadow);
  root.style.setProperty('--theme-text-glow', textShadow);
}
