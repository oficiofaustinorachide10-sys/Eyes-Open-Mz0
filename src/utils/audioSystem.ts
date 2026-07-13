/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Premium Web Audio Synthesizer Engine for Eyes Open MZ
// Provides high-fidelity luxury spatial sounds with zero dependencies or assets.

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser security autoplay policies)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playClickFeedback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Very short organic wooden/glass block pop
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.warn('Click audio failed:', e);
  }
}

export function playCommentSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    
    // Play dual crystalline bells (perfect fifth)
    const playBell = (freq: number, delay: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.6);
    };

    playBell(880, 0, 0.12);     // A5
    playBell(1318.51, 0.08, 0.08); // E6
  } catch (e) {
    console.warn('Comment audio failed:', e);
  }
}

export function playPublishPostSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    
    // Digital organic rise arpeggio (C Major add 9)
    const notes = [261.63, 329.63, 392.00, 523.25, 587.33, 783.99]; // C4 -> E4 -> G4 -> C5 -> D5 -> G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = i * 0.06;
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.8);
    });
  } catch (e) {
    console.warn('Publish audio failed:', e);
  }
}

export function playStarSound(isGoldImperial: boolean = false) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    
    if (isGoldImperial) {
      // Golden shimmering arpeggio chord (E Major 7 11/13 aura)
      const freqs = [329.63, 493.88, 659.25, 830.61, 987.77, 1318.51]; // E4, B4, E5, G#5, B5, E6
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = i * 0.05;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        
        // Add frequency vibration to simulate shimmering star glow
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(freq * 1.5, now + delay);
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
        
        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + delay);
        subOsc.start(now + delay);
        
        osc.stop(now + delay + 1.2);
        subOsc.stop(now + delay + 1.2);
      });
    } else {
      // Simple sparkling standard star (dual high sine tone)
      const playChirp = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + delay + 0.15);
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.35);
      };
      
      playChirp(700, 0);
      playChirp(1050, 0.05);
    }
  } catch (e) {
    console.warn('Star audio failed:', e);
  }
}

export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    
    // Luxurious Eb5 -> Bb5 dual-tone acoustic chime
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    
    playTone(622.25, now, 1.0); // Eb5
    playTone(932.33, now + 0.12, 1.2); // Bb5
  } catch (e) {
    console.warn('Notification audio failed:', e);
  }
}
