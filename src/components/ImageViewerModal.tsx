import React, { useState, useRef } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Download, Share2, Check } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageUrl,
  title,
  subtitle,
  onClose
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (zoom > 1) {
      handleReset();
    } else {
      setZoom(2.5);
    }
  };

  // Mouse / Touch Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && zoom > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Confira a capa de "${title}" no Ala X - Biblioteca Móvel`,
          url: window.location.href
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden animate-fadeIn">
      
      {/* TOP APP BAR WITH BACK BUTTON (← Voltar) */}
      <div className="relative z-20 w-full px-4 py-3 bg-[#0c0e18]/90 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="text-center px-2 truncate max-w-[200px] sm:max-w-md">
          <h3 className="font-bold text-white text-xs sm:text-sm truncate">{title}</h3>
          {subtitle && <p className="text-[10px] text-amber-300/80 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-[#181a28] hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white transition-all cursor-pointer relative"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* COPIED TOAST */}
      {copiedToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Link copiado para a área de transferência!</span>
        </div>
      )}

      {/* IMAGE DISPLAY CONTAINER */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onDoubleClick={handleDoubleTap}
        className="flex-1 w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing overflow-hidden select-none"
      >
        <img
          src={imageUrl}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] border border-amber-500/20"
        />
      </div>

      {/* BOTTOM CONTROLS & ZOOM TOOLBAR */}
      <div className="relative z-20 w-full px-4 py-3 bg-[#0c0e18]/90 border-t border-amber-500/20 backdrop-blur-md flex items-center justify-between">
        <div className="text-[11px] text-amber-200/70 hidden sm:block">
          Dica: Dê duplo clique ou utilize a pinça para ampliar
        </div>

        <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-2.5 rounded-xl bg-[#181a28] hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 disabled:opacity-40 transition-all cursor-pointer"
            title="Reduzir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 rounded-xl bg-black/60 border border-amber-500/30 font-mono text-amber-300 font-bold text-xs min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-2.5 rounded-xl bg-[#181a28] hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 disabled:opacity-40 transition-all cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoom > 1 && (
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-[#181a28] hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all cursor-pointer"
              title="Redefinir Posição"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
