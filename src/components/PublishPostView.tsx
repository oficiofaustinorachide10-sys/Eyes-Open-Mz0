/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Type, Sparkles, Send, CheckCircle2, 
  Camera, Video, Music, Mic, FileText, FolderOpen, MapPin, Users, Hash, Trash2, Play, Pause, Square, Scissors, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FONTS_LIST, COLOR_OPTIONS } from '../utils';
import { playClickFeedback } from '../utils/audioSystem';

interface PublishPostViewProps {
  onPublish: (
    imgSrc: string | null, 
    text: string, 
    font: string, 
    color: string, 
    isPrivate: boolean,
    type: 'photo' | 'video' | 'audio' | 'voice' | 'document' | 'file' | 'text',
    extraData: {
      location?: string;
      hashtags?: string[];
      taggedPeople?: string[];
      mediaUrl?: string;
      mediaCover?: string;
      title?: string;
      artist?: string;
      duration?: number;
      resolution?: string;
      fileSize?: string;
      pageCount?: number;
    }
  ) => void;
  onCancel: () => void;
  users: any[]; // List of users to tag
}

export default function PublishPostView({ onPublish, onCancel, users }: PublishPostViewProps) {
  // Common states
  const [text, setText] = useState('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState('Poppins');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [isPrivate, setIsPrivate] = useState(false);
  const [postType, setPostType] = useState<'photo' | 'video' | 'audio' | 'voice' | 'document' | 'file' | 'text'>('text');
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const otherFileInputRef = useRef<HTMLInputElement>(null);

  // Photographic states
  const [location, setLocation] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedUserToTag, setSelectedUserToTag] = useState('');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);

  // Video states
  const [videoUrl, setVideoUrl] = useState('https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-at-sunset-41484-large.mp4');
  const [resolution, setResolution] = useState('1080p');
  const [videoDuration, setVideoDuration] = useState('0:45');
  
  // Pro Video Editor states
  const [videoFilter, setVideoFilter] = useState<'none' | 'vintage' | 'neon' | 'cyber' | 'bw' | 'warm' | 'vhs'>('none');
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(45);
  const [videoCoverSrc, setVideoCoverSrc] = useState<string | null>('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300');
  const [videoCaption, setVideoCaption] = useState('');
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoFileDuration, setVideoFileDuration] = useState(45);
  const videoCoverInputRef = useRef<HTMLInputElement>(null);

  // Music states
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicCover, setMusicCover] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [musicDurationSec, setMusicDurationSec] = useState(185);

  // Interactive Audio Editor & Trimmer states
  const [originalAudioBuffer, setOriginalAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording simulation states
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);
  const [recordingWaves, setRecordingWaves] = useState<number[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Document states
  const [docTitle, setDocTitle] = useState('');
  const [docPageCount, setDocPageCount] = useState(1);
  const [docSize, setDocSize] = useState('1.4 MB');
  const [docPreviewText, setDocPreviewText] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionError, setExtractionError] = useState('');

  // Helper to dynamically load PDFJS from CDN
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('PDF.js não pôde ser inicializado'));
        }
      };
      script.onerror = () => reject(new Error('Falha ao carregar motor de PDF (PDF.js)'));
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (
    file: File, 
    onProgress: (progress: number) => void
  ): Promise<{ text: string; pageCount: number }> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      // Join pages with double newlines to fit the internal page reader
      fullText += pageText + '\n\n';
      onProgress(Math.floor((i / numPages) * 100));
    }

    return { text: fullText.trim(), pageCount: numPages };
  };

  // Other files states
  const [fileName, setFileName] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('4.8 MB');

  // Voice recording wave simulator
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordTimer(prev => prev + 1);
        setRecordingWaves(prev => {
          const newWaves = [...prev, Math.floor(Math.random() * 30) + 5];
          if (newWaves.length > 30) newWaves.shift();
          return newWaves;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordTimer(0);
    setRecordedVoiceUrl(null);
    setRecordingWaves([]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setRecordedVoiceUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'); // Mock audio url
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMusicCover(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local object URL to play directly in standard video players
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // Extract file size in MB
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeStr(`${sizeMB} MB`);

    // Extract duration using HTML5 Video element
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const dur = Math.floor(tempVideo.duration) || 45;
      setVideoFileDuration(dur);
      setVideoTrimEnd(dur);
      const minutes = Math.floor(tempVideo.duration / 60);
      const seconds = Math.floor(tempVideo.duration % 60);
      setVideoDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
  };

  const handleVideoCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setVideoCoverSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMusicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Remove file extension for cleaner title
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setMusicTitle(nameWithoutExt);

    if (!musicArtist) {
      setMusicArtist('Dispositivo Local');
    }

    const url = URL.createObjectURL(file);
    setMusicUrl(url);

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeStr(`${sizeMB} MB`);

    const tempAudio = document.createElement('audio');
    tempAudio.preload = 'metadata';
    tempAudio.src = url;
    tempAudio.onloadedmetadata = () => {
      const fullDur = Math.round(tempAudio.duration) || 180;
      setMusicDurationSec(fullDur);
      setTrimStart(0);
      setTrimEnd(Math.min(fullDur, 30));
    };

    // Decode file for real-time trimming
    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const AudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        AudioCtx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
          setOriginalAudioBuffer(decodedBuffer);
          setTrimStart(0);
          setTrimEnd(Math.min(decodedBuffer.duration, 30));
        }, (err) => {
          console.warn("Could not decode audio data for trimming", err);
        });
      } catch (err) {
        console.warn("Wav decoder failed initialization", err);
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  // Wave rendering and encoding utilities
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const interleave = (inputL: Float32Array, inputR: Float32Array) => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  };

  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const wavBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(wavBuffer);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
    
    floatTo16BitPCM(view, 44, result);
    return new Blob([view], { type: 'audio/wav' });
  };

  const handleApplyTrim = async () => {
    if (!originalAudioBuffer) {
      const newDur = Math.max(1, Math.round(trimEnd - trimStart));
      setMusicDurationSec(newDur);
      alert(`Metadados salvos! Áudio recortado para ${newDur} segundos.`);
      return;
    }

    setIsTrimming(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = originalAudioBuffer.sampleRate;
      const numberOfChannels = originalAudioBuffer.numberOfChannels;
      const startSample = Math.floor(trimStart * sampleRate);
      const endSample = Math.floor(trimEnd * sampleRate);
      const frameCount = endSample - startSample;

      if (frameCount <= 0) {
        alert("Intervalo de corte inválido!");
        setIsTrimming(false);
        return;
      }

      const trimmedBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);
      for (let i = 0; i < numberOfChannels; i++) {
        const channelData = originalAudioBuffer.getChannelData(i);
        const trimmedChannelData = trimmedBuffer.getChannelData(i);
        trimmedChannelData.set(channelData.subarray(startSample, endSample));
      }

      const wavBlob = bufferToWav(trimmedBuffer);
      const trimmedUrl = URL.createObjectURL(wavBlob);

      setMusicUrl(trimmedUrl);
      setMusicDurationSec(Math.round(trimmedBuffer.duration));
      
      if (previewAudioRef.current) {
        previewAudioRef.current.src = trimmedUrl;
        previewAudioRef.current.load();
      }

      alert("✂️ Áudio cortado com sucesso! Nova versão atualizada e pronta para publicação.");
    } catch (err) {
      console.error(err);
      alert("Erro ao processar o corte de áudio.");
    } finally {
      setIsTrimming(false);
    }
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name);
    setExtractionError('');

    // Calculate file size in human-readable format
    const size = file.size;
    let sizeStr = '';
    if (size > 1024 * 1024) {
      sizeStr = `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      sizeStr = `${(size / 1024).toFixed(0)} KB`;
    }
    setDocSize(sizeStr);

    // PDF files
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setIsExtractingText(true);
      setExtractionProgress(0);
      try {
        const result = await extractTextFromPdf(file, (progress) => {
          setExtractionProgress(progress);
        });
        setDocPreviewText(result.text);
        setDocPageCount(result.pageCount);
      } catch (err: any) {
        console.error(err);
        setExtractionError('Erro ao extrair texto do PDF: ' + (err.message || err));
        setDocPreviewText(`[Erro na extração automática]\n\nFicheiro: ${file.name}\nTamanho: ${sizeStr}\n\nNão foi possível extrair o texto automaticamente. Pode digitar ou colar o conteúdo do documento manualmente neste campo.`);
        setDocPageCount(1);
      } finally {
        setIsExtractingText(false);
      }
    } 
    // TXT and Markdown files
    else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      setIsExtractingText(true);
      setExtractionProgress(50);
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const rawText = ev.target?.result as string || '';
          setDocPreviewText(rawText);
          // Count pages based on \n\n or simple division
          const pages = rawText.split('\n\n').length;
          setDocPageCount(pages || 1);
          setExtractionProgress(100);
          setTimeout(() => setIsExtractingText(false), 300);
        };
        reader.readAsText(file);
      } catch (err: any) {
        setExtractionError('Erro ao ler o ficheiro de texto.');
        setIsExtractingText(false);
      }
    } 
    // Fallback/other files
    else {
      setDocPreviewText(`Ficheiro de documento carregado com sucesso!\n\nNome do Ficheiro: ${file.name}\nTamanho do Ficheiro: ${sizeStr}\nFormato de Media: ${file.type || 'Desconhecido'}\n\nEste ficheiro foi importado localmente. Pode introduzir um resumo técnico ou tradução do texto para que os outros membros possam lê-lo de forma simplificada.`);
      setDocPageCount(1);
    }
  };

  const handleOtherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const size = file.size;
    let sizeStr = '';
    if (size > 1024 * 1024) {
      sizeStr = `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      sizeStr = `${(size / 1024).toFixed(0)} KB`;
    }
    setFileSizeStr(sizeStr);
  };

  const addHashtag = () => {
    if (!hashtagInput.trim()) return;
    let tag = hashtagInput.trim();
    if (!tag.startsWith('#')) tag = '#' + tag;
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const addTagUser = () => {
    if (!selectedUserToTag) return;
    if (!taggedPeople.includes(selectedUserToTag)) {
      setTaggedPeople([...taggedPeople, selectedUserToTag]);
    }
    setSelectedUserToTag('');
  };

  const removeTaggedUser = (nick: string) => {
    setTaggedPeople(taggedPeople.filter(u => u !== nick));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations based on type
    if (postType === 'text' && !text.trim()) {
      alert('Por favor, adicione algum texto para publicar!');
      return;
    }
    if (postType === 'photo' && !imgSrc) {
      alert('Por favor, carregue uma fotografia para publicar!');
      return;
    }
    if (postType === 'video' && !videoUrl) {
      alert('Por favor, especifique uma URL de vídeo válida!');
      return;
    }
    if (postType === 'audio' && (!musicTitle || !musicArtist)) {
      alert('Por favor, preencha o título e artista da música!');
      return;
    }
    if (postType === 'voice' && !recordedVoiceUrl) {
      alert('Por favor, efetue a gravação de voz antes de publicar!');
      return;
    }
    if (postType === 'document' && !docTitle) {
      alert('Por favor, adicione um título ao documento!');
      return;
    }
    if (postType === 'file' && !fileName) {
      alert('Por favor, indique o nome do ficheiro!');
      return;
    }

    setIsPublishing(true);

    // Assembly extra data based on format
    let extraData: any = {};
    if (postType === 'photo') {
      extraData = {
        location: location.trim() || undefined,
        hashtags,
        taggedPeople
      };
    } else if (postType === 'video') {
      extraData = {
        mediaUrl: videoUrl,
        resolution,
        duration: videoTrimEnd - videoTrimStart,
        videoTrimStart,
        videoTrimEnd,
        videoFilter,
        videoCaption,
        videoSpeed,
        mediaCover: videoCoverSrc || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300'
      };
    } else if (postType === 'audio') {
      extraData = {
        title: musicTitle,
        artist: musicArtist,
        mediaCover: musicCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
        mediaUrl: musicUrl,
        duration: musicDurationSec
      };
    } else if (postType === 'voice') {
      extraData = {
        title: `Voz de @${users[0]?.nickname || 'Utilizador'}`,
        mediaUrl: recordedVoiceUrl,
        duration: recordTimer || 12
      };
    } else if (postType === 'document') {
      extraData = {
        title: docTitle,
        pageCount: docPageCount,
        fileSize: docSize,
        // Save description/content inside description text too
        text: docPreviewText.trim() || text
      };
    } else if (postType === 'file') {
      extraData = {
        title: fileName,
        fileSize: fileSizeStr
      };
    }

    // Delay simulated publish
    setTimeout(() => {
      setIsPublishing(false);
      setShowSuccess(true);

      // Trigger standard callback
      onPublish(
        postType === 'photo' ? imgSrc : 
        (postType === 'audio' ? (musicCover || imgSrc) : 
        (postType === 'video' ? (videoCoverSrc || imgSrc) : imgSrc)), 
        text.trim(), 
        selectedFont, 
        selectedColor, 
        isPrivate,
        postType,
        extraData
      );

      // Clean
      setText('');
      setImgSrc(null);
      setIsPrivate(false);

      setTimeout(() => {
        setShowSuccess(false);
        onCancel();
      }, 1500);
    }, 800);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 font-rajdhani select-none text-white overflow-y-auto no-scrollbar pb-24">
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-bg-card)] hover:brightness-110 border border-[var(--theme-border)] text-xs font-bold transition-all cursor-pointer text-[var(--theme-accent)]"
        >
          <ArrowLeft className="w-4 h-4" /> VOLTAR AO FEED
        </button>

        <h2 className="font-orbitron font-extrabold text-sm text-[var(--theme-accent)] tracking-widest uppercase">
          CRIAR NOVA PUBLICAÇÃO MULTIMÉDIA
        </h2>
      </div>

      <form onSubmit={handlePublish} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* FORMAT SELECTOR TABS */}
        <div>
          <label className="block text-[var(--theme-accent)] font-orbitron font-extrabold text-[10px] tracking-widest uppercase mb-3">
            SELECIONAR FORMATO DIGITAL DE PUBLICAÇÃO
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[
              { id: 'text', label: 'Texto', icon: Type },
              { id: 'photo', label: 'Foto', icon: Camera },
              { id: 'video', label: 'Vídeo', icon: Video },
              { id: 'audio', label: 'Música', icon: Music },
              { id: 'voice', label: 'Voz', icon: Mic },
              { id: 'document', label: 'Documento', icon: FileText },
              { id: 'file', label: 'Ficheiro', icon: FolderOpen }
            ].map(typeItem => {
              const Icon = typeItem.icon;
              const isSelected = postType === typeItem.id;
              return (
                <button
                  key={typeItem.id}
                  type="button"
                  onClick={() => setPostType(typeItem.id as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] shadow-md'
                      : 'border-[var(--theme-border)]/50 bg-[var(--theme-bg-card)] text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[9px] font-bold tracking-tight">{typeItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. PHOTOGRAPHY OPTION */}
        {postType === 'photo' && (
          <div className="space-y-4 border border-[var(--theme-border)]/60 rounded-2xl p-4 bg-black/20">
            <h3 className="text-xs font-orbitron font-extrabold text-[var(--theme-accent)] tracking-wider">📷 DETALHES DA FOTOGRAFIA</h3>
            <div>
              <label className="block text-gray-400 font-bold text-xs uppercase mb-2">Carregar Fotografia</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {imgSrc ? (
                <div className="relative rounded-2xl overflow-hidden border border-[var(--theme-border)] aspect-video max-h-56">
                  <img src={imgSrc} alt="Fotografia" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImgSrc(null)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-[var(--theme-border)] hover:border-[var(--theme-accent)]/60 rounded-xl bg-[var(--theme-bg-card)]/50 text-[var(--theme-accent)] font-bold text-xs font-orbitron tracking-widest transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-6 h-6 animate-pulse" /> ADICIONAR FOTOGRAFIA ULTRA-HD
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Location pin */}
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--theme-accent)]" /> Localização
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Maputo, Moçambique"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 px-3 text-xs outline-none transition-all placeholder:text-gray-600 text-white"
                />
              </div>

              {/* Tagging */}
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[var(--theme-accent)]" /> Marcar Pessoas
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={selectedUserToTag}
                    onChange={(e) => setSelectedUserToTag(e.target.value)}
                    className="flex-grow bg-black/45 border border-[var(--theme-border)] text-white rounded-xl py-2 px-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="">Selecionar Membro...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.nickname}>@{u.nickname}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addTagUser}
                    className="px-3 bg-[var(--theme-accent)] text-black font-extrabold rounded-xl text-xs hover:brightness-110 cursor-pointer"
                  >
                    Marcar
                  </button>
                </div>
                {taggedPeople.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {taggedPeople.map(nick => (
                      <span key={nick} className="inline-flex items-center gap-1 bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 rounded-full px-2 py-0.5 text-[10px] font-bold">
                        @{nick}
                        <button type="button" onClick={() => removeTaggedUser(nick)} className="text-red-400 hover:text-red-300">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[var(--theme-accent)]" /> Hashtags do Conteúdo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  placeholder="Ex: moçambique, eyesmax"
                  className="flex-grow bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 px-3 text-xs outline-none transition-all placeholder:text-gray-600 text-white"
                />
                <button
                  type="button"
                  onClick={addHashtag}
                  className="px-4 bg-neutral-800 border border-[var(--theme-border)] text-white rounded-xl text-xs hover:bg-neutral-700 cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {hashtags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      {t}
                      <button type="button" onClick={() => removeHashtag(t)} className="text-red-400 hover:text-red-300">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. VIDEO OPTION */}
        {postType === 'video' && (
          <div className="space-y-6 border border-[var(--theme-border)]/60 rounded-2xl p-5 bg-black/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500/10 border-b border-l border-indigo-500/20 px-3.5 py-1 rounded-bl-xl text-indigo-400 text-[8px] font-extrabold font-orbitron tracking-widest uppercase animate-pulse">
              🛠️ EDIÇÃO PRO ATIVADA
            </div>

            <h3 className="text-xs font-orbitron font-extrabold text-[var(--theme-accent)] tracking-wider flex items-center gap-2 uppercase">
              <Video className="w-4 h-4 text-[var(--theme-accent)]" /> 🎥 EDITOR DE VÍDEO PROFISSIONAL (PRO SYSTEM)
            </h3>
            
            {/* Real video local file uploader */}
            <div className="p-4 bg-black/40 border border-dashed border-[var(--theme-border)]/60 rounded-2xl flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                ref={videoFileInputRef}
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--theme-accent)] text-black font-orbitron font-extrabold text-[10px] tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 uppercase shadow-md hover:shadow-[var(--theme-accent)]/10"
              >
                <Video className="w-4 h-4" /> Importar Vídeo do Dispositivo
              </button>
              <p className="text-[9px] text-gray-500 font-bold uppercase text-center">
                Escolha um ficheiro MP4 local ou utilize uma ligação de rede em baixo:
              </p>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold text-[9px] uppercase tracking-wider mb-1.5">Endereço de Vídeo (URL MP4)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://exemplo.com/video.mp4"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold text-[9px] uppercase tracking-wider mb-1.5">Resolução de Saída</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-black/45 border border-[var(--theme-border)] text-white rounded-xl py-2.5 px-3 text-xs outline-none cursor-pointer focus:border-[var(--theme-accent)] font-semibold"
                >
                  <option value="1080p">1080p Full HD 🎬</option>
                  <option value="4K UHD">4K Ultra HD ✨</option>
                  <option value="720p HD">720p HD Compacto 📱</option>
                  <option value="8K Cinematic">8K Cine IMAX 👁️</option>
                </select>
              </div>
            </div>

            {/* LIVE PREVIEW CANVAS AREA WITH FILTERS & CAPTIONS */}
            <div className="space-y-3">
              <label className="block text-gray-400 font-bold text-[9px] uppercase tracking-wider">Monitor de Visualização (Preview Real-Time)</label>
              <div className="relative w-full aspect-video max-h-60 bg-neutral-950 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    style={{
                      filter: videoFilter === 'vintage' ? 'sepia(0.5) contrast(1.1) brightness(0.9)' :
                              videoFilter === 'neon' ? 'saturate(2) hue-rotate(15deg) contrast(1.1)' :
                              videoFilter === 'cyber' ? 'hue-rotate(-20deg) saturate(1.8) contrast(1.2)' :
                              videoFilter === 'bw' ? 'grayscale(1) contrast(1.3) brightness(0.95)' :
                              videoFilter === 'warm' ? 'sepia(0.2) saturate(1.4) hue-rotate(-5deg) contrast(1.05)' :
                              videoFilter === 'vhs' ? 'contrast(1.1) brightness(1.05) saturate(1.25) blur(0.3px)' : 'none'
                    }}
                  />
                ) : (
                  <div className="text-gray-600 text-xs font-mono">Sem sinal de vídeo activo</div>
                )}

                {/* Subtitle / Caption watermark overlay on preview */}
                {videoCaption && (
                  <div className="absolute bottom-4 inset-x-4 text-center pointer-events-none">
                    <span className="inline-block bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg tracking-wide uppercase">
                      {videoCaption}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 1. CINEMATIC FILTERS LIST */}
            <div className="space-y-2">
              <label className="block text-gray-400 font-bold text-[9px] uppercase tracking-wider">Filtro de Cor Cinematográfico</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-[9px] uppercase font-bold tracking-widest text-center">
                {[
                  { id: 'none', label: 'Original', style: 'bg-slate-900 border-slate-700 text-slate-400' },
                  { id: 'vintage', label: 'Vintage', style: 'bg-amber-950/40 border-amber-500/25 text-amber-300' },
                  { id: 'neon', label: 'Neon', style: 'bg-pink-950/40 border-pink-500/25 text-pink-300' },
                  { id: 'cyber', label: 'Cyber', style: 'bg-indigo-950/40 border-indigo-500/25 text-indigo-300' },
                  { id: 'bw', label: 'P&B', style: 'bg-neutral-900 border-neutral-700 text-white' },
                  { id: 'warm', label: 'Warm', style: 'bg-orange-950/40 border-orange-500/25 text-orange-300' },
                  { id: 'vhs', label: 'VHS', style: 'bg-red-950/40 border-red-500/25 text-red-300' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      playClickFeedback();
                      setVideoFilter(filter.id as any);
                    }}
                    className={`p-2 rounded-xl border text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                      videoFilter === filter.id 
                        ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] text-black font-black scale-105' 
                        : filter.style
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. TRIMMER CONTROLS */}
            <div className="space-y-3 bg-neutral-950/50 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center text-[9px] font-bold font-orbitron tracking-widest text-gray-400 uppercase">
                <span>✂️ CONTROLO DE TRIM (CORTE DE SEGUNDOS)</span>
                <span className="text-[var(--theme-accent)] font-mono">
                  {videoTrimStart}s - {videoTrimEnd}s (Total: {videoTrimEnd - videoTrimStart}s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-wider">Tempo de Início ({videoTrimStart}s)</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(videoFileDuration - 1, 10)}
                    value={videoTrimStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < videoTrimEnd) {
                        setVideoTrimStart(val);
                      }
                    }}
                    className="w-full accent-[var(--theme-accent)] h-1 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-wider">Tempo de Fim ({videoTrimEnd}s)</span>
                  <input
                    type="range"
                    min="1"
                    max={videoFileDuration}
                    value={videoTrimEnd}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > videoTrimStart) {
                        setVideoTrimEnd(val);
                      }
                    }}
                    className="w-full accent-[var(--theme-accent)] h-1 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. CAPTIONS OVERLAY INPUT */}
            <div>
              <label className="block text-gray-400 font-bold text-[9px] uppercase tracking-wider mb-1.5">Legenda Sobreposta (Watermark Subtitle)</label>
              <input
                type="text"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Ex: Maputo no topo do mundo! 🎬🎥"
                className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 px-3 text-xs outline-none text-white font-mono"
              />
            </div>

            {/* 4. COVER MINIATURAS (THUMBNAIL GALLERY AND UPLOADER) */}
            <div className="space-y-3 bg-neutral-950/40 p-4 rounded-xl border border-white/5 text-left">
              <div className="flex justify-between items-center">
                <label className="block text-gray-400 font-bold text-[9px] uppercase tracking-wider">
                  🖼️ CAPA / MINIATURAS DE ATRAÇÃO (FEED GRADES)
                </label>
                {videoCoverSrc && (
                  <span className="px-2 py-0.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 rounded-full text-[7px] font-extrabold uppercase font-orbitron tracking-widest animate-pulse">
                    Miniatura Definida
                  </span>
                )}
              </div>

              {/* Upload Custom Cover */}
              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  ref={videoCoverInputRef}
                  accept="image/*"
                  onChange={handleVideoCoverUpload}
                  className="hidden"
                />

                {videoCoverSrc ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--theme-accent)] shrink-0 shadow-lg">
                    <img src={videoCoverSrc} alt="Preview da capa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setVideoCoverSrc(null)}
                      className="absolute inset-0 bg-black/70 hover:bg-black/90 flex items-center justify-center text-red-400 font-extrabold text-[8px] uppercase tracking-wider cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoCoverInputRef.current?.click()}
                    className="w-16 h-16 border border-dashed border-[var(--theme-border)] rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)] transition-all shrink-0 cursor-pointer bg-black/35"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[7px] font-bold uppercase tracking-widest mt-1">Carregar</span>
                  </button>
                )}

                {/* Preset Thumbnails */}
                <div className="flex-1 space-y-1.5">
                  <span className="block text-[7px] text-gray-500 font-bold uppercase tracking-widest">Ou selecione um preset cinematográfico:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: '1', name: 'Maputo Sol', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=300' },
                      { id: '2', name: 'Cine Rec', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300' },
                      { id: '3', name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300' },
                      { id: '4', name: 'Beira Rock', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=300' }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          playClickFeedback();
                          setVideoCoverSrc(preset.url);
                        }}
                        className={`group relative aspect-video rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          videoCoverSrc === preset.url 
                            ? 'border-[var(--theme-accent)] scale-105 ring-2 ring-[var(--theme-accent)]/20 shadow-md' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[6px] font-bold text-center text-white line-clamp-1 truncate select-none">
                          {preset.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. AUDIO / MUSIC OPTION */}
        {postType === 'audio' && (
          <div className="space-y-4 border border-[var(--theme-border)]/60 rounded-2xl p-4 bg-black/20">
            <h3 className="text-xs font-orbitron font-extrabold text-[var(--theme-accent)] tracking-wider">🎵 COMPOSIÇÃO DE MÚSICA / ÁUDIO MUSICAL</h3>
            
            {/* Real audio local file uploader */}
            <div className="p-4 bg-black/40 border border-dashed border-[var(--theme-border)]/60 rounded-2xl flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                ref={musicFileInputRef}
                accept="audio/*"
                onChange={handleMusicFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => musicFileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--theme-accent)] text-black font-orbitron font-extrabold text-[10px] tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 uppercase"
              >
                <Music className="w-4 h-4" /> Selecionar Áudio / Música do Telemóvel
              </button>
              <p className="text-[9px] text-gray-400 font-bold uppercase text-center">
                Ou configure o endereço web alternativo em baixo:
              </p>
            </div>

            {/* PRE-LISTENING PLAYER & AUDIO CUTTER PANEL */}
            {musicUrl && (
              <div className="p-4 bg-neutral-950/70 border border-[var(--theme-border)] rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-orbitron font-extrabold text-[var(--theme-accent)] tracking-widest flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" /> ESCUTA & CORTE INTERATIVO
                  </span>
                  {originalAudioBuffer ? (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-bold tracking-wider rounded-full border border-green-500/30 uppercase animate-pulse">
                      Ficheiro Descodificado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[8px] font-bold tracking-wider rounded-full border border-yellow-500/30 uppercase">
                      Link / URL do Servidor
                    </span>
                  )}
                </div>

                {/* HTML5 audio node */}
                <audio
                  ref={previewAudioRef}
                  src={musicUrl}
                  onTimeUpdate={() => {
                    const audio = previewAudioRef.current;
                    if (audio) {
                      setPreviewCurrentTime(audio.currentTime);
                      // Auto-pause if we have selected a segment and reached trimEnd while pre-listening
                      if (audio.currentTime >= trimEnd) {
                        audio.pause();
                        audio.currentTime = trimStart;
                        setIsPreviewPlaying(false);
                      }
                    }
                  }}
                  onPlay={() => setIsPreviewPlaying(true)}
                  onPause={() => setIsPreviewPlaying(false)}
                  onEnded={() => {
                    setIsPreviewPlaying(false);
                    setPreviewCurrentTime(trimStart);
                    if (previewAudioRef.current) {
                      previewAudioRef.current.currentTime = trimStart;
                    }
                  }}
                />

                {/* Waveform Visualization Bars */}
                <div className="bg-black/60 rounded-xl p-3 h-14 flex items-end justify-between gap-0.5 border border-white/5 relative overflow-hidden">
                  {/* Grid background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:10px_10px]" />
                  
                  {/* Progress Line */}
                  {musicDurationSec > 0 && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10 transition-all duration-75"
                      style={{ left: `${(previewCurrentTime / musicDurationSec) * 100}%` }}
                    />
                  )}

                  {/* Highlighted Trim Region Marker */}
                  {musicDurationSec > 0 && (
                    <div 
                      className="absolute top-0 bottom-0 bg-[var(--theme-accent)]/10 border-x border-[var(--theme-accent)]/30 z-0"
                      style={{ 
                        left: `${(trimStart / musicDurationSec) * 100}%`,
                        right: `${100 - (trimEnd / musicDurationSec) * 100}%`
                      }}
                    />
                  )}

                  {/* Pseudo-waveform bars */}
                  {Array.from({ length: 48 }).map((_, i) => {
                    const barTime = (i / 48) * musicDurationSec;
                    const isInsideTrim = barTime >= trimStart && barTime <= trimEnd;
                    const isPlayed = barTime <= previewCurrentTime;
                    
                    let barColorClass = 'bg-gray-700/60';
                    if (isInsideTrim) {
                      barColorClass = isPlayed ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-accent)]/50';
                    } else if (isPlayed) {
                      barColorClass = 'bg-gray-500';
                    }

                    // Static heights that look like a natural waveform
                    const heightValue = [12, 18, 28, 14, 10, 22, 35, 42, 16, 24, 30, 20, 12, 16, 24, 38, 44, 28, 14, 18, 26, 32, 10, 14, 22, 35, 40, 24, 12, 16, 20, 28, 36, 18, 10, 14, 22, 32, 45, 30, 14, 18, 24, 20, 12, 16, 10, 8][i % 48];

                    return (
                      <div 
                        key={i} 
                        className={`w-1 rounded-t transition-colors duration-150 z-1 ${barColorClass}`}
                        style={{ height: `${heightValue}%` }}
                      />
                    );
                  })}
                </div>

                {/* Player Controls Panel */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const audio = previewAudioRef.current;
                        if (!audio) return;
                        if (isPreviewPlaying) {
                          audio.pause();
                        } else {
                          // Force start at trimStart if it was outside range
                          if (audio.currentTime < trimStart || audio.currentTime >= trimEnd) {
                            audio.currentTime = trimStart;
                          }
                          audio.play().catch(e => console.warn("Audio playback failed:", e));
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-[var(--theme-accent)] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {isPreviewPlaying ? <Pause className="w-4 h-4 fill-current animate-pulse" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="text-[10px] font-mono text-gray-300 font-bold">
                      {Math.floor(previewCurrentTime / 60)}:{(Math.floor(previewCurrentTime % 60)).toString().padStart(2, '0')} / {Math.floor(musicDurationSec / 60)}:{(Math.floor(musicDurationSec % 60)).toString().padStart(2, '0')}
                    </div>
                  </div>

                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-orbitron">
                    Faixa atual: <span className="text-[var(--theme-accent)] font-mono">{musicTitle || 'Sem título'}</span>
                  </div>
                </div>

                {/* Trimming Sliders Section */}
                <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400">
                    <span>✂️ AJUSTAR INTERVALO DE CORTE</span>
                    <span className="text-[var(--theme-accent)] font-mono font-bold bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-lg border border-[var(--theme-accent)]/20">
                      Tamanho: {(trimEnd - trimStart).toFixed(1)} segundos
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Trim Start Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold font-mono">
                        <span>INÍCIO DO CORTE</span>
                        <span className="text-white">{trimStart.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={musicDurationSec || 100}
                        step="0.5"
                        value={trimStart}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val < trimEnd) {
                            setTrimStart(val);
                            if (previewAudioRef.current) {
                              previewAudioRef.current.currentTime = val;
                              setPreviewCurrentTime(val);
                            }
                          }
                        }}
                        className="w-full accent-[var(--theme-accent)] bg-gray-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                    </div>

                    {/* Trim End Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold font-mono">
                        <span>FIM DO CORTE</span>
                        <span className="text-white">{trimEnd.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={musicDurationSec || 100}
                        step="0.5"
                        value={trimEnd}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > trimStart) {
                            setTrimEnd(val);
                          }
                        }}
                        className="w-full accent-[var(--theme-accent)] bg-gray-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Cut / Crop action button */}
                  <button
                    type="button"
                    onClick={handleApplyTrim}
                    disabled={isTrimming}
                    className="w-full py-2.5 bg-[var(--theme-accent)] text-black text-[10px] font-orbitron font-extrabold tracking-widest uppercase rounded-xl hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isTrimming ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        A Processar Áudio...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-3.5 h-3.5" /> Recortar e Atualizar Áudio do Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Título da Faixa</label>
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder="Ex: Xigubo do Amanhã"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Artista / Produtor</label>
                <input
                  type="text"
                  value={musicArtist}
                  onChange={(e) => setMusicArtist(e.target.value)}
                  placeholder="Ex: DJ Maputo & Ofício"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Capa do Álbum (Opcional)</label>
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                {musicCover ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--theme-border)]">
                    <img src={musicCover} alt="Capa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMusicCover(null)}
                      className="absolute inset-0 bg-black/60 hover:bg-black/80 flex items-center justify-center text-red-400 font-bold text-[10px]"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="py-3 px-4 border border-dashed border-[var(--theme-border)] hover:border-[var(--theme-accent)] rounded-xl bg-[var(--theme-bg-card)] text-xs text-[var(--theme-accent)] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Capa personalizada
                  </button>
                )}
              </div>

              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Ficheiro de Áudio (URL MP3)</label>
                <input
                  type="text"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://exemplo.com/musica.mp3"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 px-3 text-xs outline-none text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. VOICE RECORDING SIMULATOR */}
        {postType === 'voice' && (
          <div className="space-y-4 border border-[var(--theme-border)]/60 rounded-2xl p-4 bg-black/20 text-center flex flex-col items-center">
            <h3 className="text-xs font-orbitron font-extrabold text-[var(--theme-accent)] tracking-wider self-start">🎙️ GRAVADOR DE VOZ DIGITAL</h3>
            
            <div className="p-6 bg-black/40 border border-[var(--theme-border)] rounded-2xl w-full max-w-sm flex flex-col items-center gap-4">
              <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Estúdio de Gravação Pay</span>
              
              {/* Timer */}
              <div className="text-2xl font-mono font-bold text-white tracking-widest bg-black px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                {Math.floor(recordTimer / 60)}:{(recordTimer % 60).toString().padStart(2, '0')}
              </div>

              {/* Animated wave */}
              <div className="h-10 flex items-end justify-center gap-1 w-full max-w-xs px-4">
                {isRecording ? (
                  recordingWaves.map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-[var(--theme-accent)] rounded-t transition-all duration-300"
                      style={{ height: `${h}px` }}
                    />
                  ))
                ) : recordedVoiceUrl ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase font-orbitron">
                    <CheckCircle2 className="w-4 h-4" /> Gravação finalizada e guardada!
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 font-semibold">Microfone inativo. Aguardando sinal...</div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-4">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="p-4 bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-red-600/20"
                  >
                    <Mic className="w-6 h-6 animate-pulse" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="p-4 bg-neutral-800 hover:bg-neutral-700 hover:scale-105 active:scale-95 text-white rounded-full transition-all cursor-pointer flex items-center justify-center border border-white/15"
                  >
                    <Square className="w-5 h-5 fill-white text-white" />
                  </button>
                )}
              </div>

              <p className="text-[9px] text-gray-500 max-w-xs leading-relaxed">
                {isRecording 
                  ? 'Gravando áudio em tempo real a partir do microfone ativo...' 
                  : recordedVoiceUrl 
                    ? 'Pode carregar no botão vermelho para regravar o seu áudio.'
                    : 'Toque no microfone vermelho para começar a gravação de voz.'
                }
              </p>
            </div>
          </div>
        )}

        {/* 5. DOCUMENT OPTION */}
        {postType === 'document' && (
          <div className="space-y-4 border border-[var(--theme-border)]/60 rounded-2xl p-4 bg-black/20">
            <h3 className="text-xs font-orbitron font-extrabold text-[var(--theme-accent)] tracking-wider">📄 FICHA TÉCNICA DO DOCUMENTO</h3>
            
            {/* Real local document file uploader */}
            <div className="p-4 bg-black/40 border border-dashed border-[var(--theme-border)]/60 rounded-2xl flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                ref={docFileInputRef}
                accept=".pdf,.txt,.md"
                onChange={handleDocFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => docFileInputRef.current?.click()}
                disabled={isExtractingText}
                className="px-4 py-2 bg-[var(--theme-accent)] text-black font-orbitron font-extrabold text-[10px] tracking-wider rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 uppercase"
              >
                <FileText className="w-4 h-4" /> {isExtractingText ? 'A Processar...' : 'Importar PDF / TXT do Telemóvel'}
              </button>
              <p className="text-[9px] text-gray-500 font-bold uppercase text-center">
                Extraímos o texto automaticamente para leitura no leitor interno.
              </p>
            </div>

            {/* Real-time PDF Text Extraction Progress Indicator */}
            {isExtractingText && (
              <div className="p-4 bg-teal-950/30 border border-teal-500/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-teal-400 font-extrabold uppercase tracking-widest animate-pulse">
                    A extrair conteúdo do documento...
                  </span>
                  <span className="text-white font-extrabold">{extractionProgress}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-white/5 p-[1px]">
                  <div 
                    className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-100" 
                    style={{ width: `${extractionProgress}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {extractionError && (
              <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase">
                {extractionError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Título do Documento (PDF / DOC)</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Regulamento de Cinema 2026.pdf"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Número de Páginas</label>
                  <input
                    type="number"
                    min="1"
                    value={docPageCount}
                    onChange={(e) => setDocPageCount(Number(e.target.value))}
                    className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Tamanho (MB/KB)</label>
                  <input
                    type="text"
                    value={docSize}
                    onChange={(e) => setDocSize(e.target.value)}
                    className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Conteúdo Extraído / Texto Disponível para Leitura</label>
              <textarea
                value={docPreviewText}
                onChange={(e) => setDocPreviewText(e.target.value)}
                placeholder="O texto extraído do ficheiro aparecerá aqui. Pode editá-lo ou dividi-lo com duas quebras de linha para criar páginas..."
                className="w-full h-32 bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl p-3 text-xs outline-none text-white font-sans"
              />
              <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">
                Dica: Duas quebras de linha seguidas (parágrafo em branco) criam uma nova página no leitor!
              </p>
            </div>
          </div>
        )}

        {/* 6. OTHER FILES OPTION */}
        {postType === 'file' && (
          <div className="space-y-4 border border-[var(--theme-border)]/60 rounded-2xl p-4 bg-black/20">
            <h3 className="text-xs font-orbitron font-extrabold text-[var(--theme-accent)] tracking-wider">📁 ARQUIVOS E OUTROS FORMATOS</h3>
            
            {/* Real local other files uploader */}
            <div className="p-4 bg-black/40 border border-dashed border-[var(--theme-border)]/60 rounded-2xl flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                ref={otherFileInputRef}
                accept="*"
                onChange={handleOtherFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => otherFileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--theme-accent)] text-black font-orbitron font-extrabold text-[10px] tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 uppercase"
              >
                <FolderOpen className="w-4 h-4" /> Carregar Qualquer Arquivo do Celular (.zip, .rar, .sql...)
              </button>
              <p className="text-[9px] text-gray-500 font-bold uppercase text-center">
                Ou configure os detalhes do arquivo alternativo em baixo:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Nome do Arquivo (Ficheiro)</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Ex: base_de_dados_cinema_moçambique.sql"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold text-xs uppercase mb-1.5">Tamanho Físico (KB/MB/GB)</label>
                <input
                  type="text"
                  value={fileSizeStr}
                  onChange={(e) => setFileSizeStr(e.target.value)}
                  placeholder="Ex: 14.5 MB"
                  className="w-full bg-black/45 border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 px-3 text-xs outline-none text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* MAIN TEXT AREA DESCRIPTION */}
        <div>
          <label className="block text-[var(--theme-accent)] font-orbitron font-extrabold text-[10px] tracking-widest uppercase mb-2">
            TEXTO COMPLEMENTAR / LEGENDA DO POST
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que tens em mente hoje?"
            className="w-full h-24 bg-black/45 border border-[var(--theme-border)] rounded-2xl p-4 text-xs text-white outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]/20 resize-none transition-all placeholder:text-gray-600 font-semibold"
            style={{ fontFamily: selectedFont, color: selectedColor }}
          />
        </div>

        {/* CUSTOMIZATION OPTIONS FOR TEXT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Typography font */}
          <div>
            <label className="block text-gray-400 font-bold text-xs uppercase mb-2">
              Estilo de Letra (Fonte)
            </label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full bg-black/60 border border-[var(--theme-border)] text-white rounded-xl py-2.5 px-3 text-xs outline-none cursor-pointer"
            >
              {FONTS_LIST.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Color pallet */}
          <div>
            <label className="block text-gray-400 font-bold text-xs uppercase mb-2">
              Cor do Texto
            </label>
            <div className="flex gap-2 flex-wrap pt-1.5">
              {COLOR_OPTIONS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setSelectedColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    selectedColor === hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-80 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* PRIVACY TOGGLE */}
        <div className="bg-black/35 border border-[var(--theme-border)] rounded-2xl p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="block text-gray-300 font-bold text-xs uppercase tracking-wider">Visibilidade da Publicação</span>
            <span className="block text-[9px] text-gray-400 mt-1 uppercase font-semibold">
              {isPrivate ? 'Apenas Amigos (Restrito às suas conexões aceites)' : 'Público (Qualquer visitante pode ver)'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-accent)]" />
          </label>
        </div>

        {/* CORE CTA */}
        <button
          type="submit"
          disabled={isPublishing}
          className="w-full py-4 bg-gradient-to-r from-[var(--theme-accent)] to-[#aa00ff] hover:brightness-110 disabled:brightness-50 transition-all rounded-xl text-black font-orbitron font-extrabold text-xs tracking-widest cursor-pointer shadow-lg shadow-[var(--theme-accent)]/15 uppercase flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4 stroke-[2.5]" /> {isPublishing ? 'PUBLICANDO NO BANCO...' : 'PUBLICAR MULTIMÉDIA'}
        </button>
      </form>

      {/* TOAST SUCCESS overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3.5 bg-[#00ff88] text-black font-orbitron font-extrabold text-xs tracking-wider rounded-full shadow-2xl"
          >
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>POST MULTIMÉDIA PUBLICADO COM SUCESSO!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
