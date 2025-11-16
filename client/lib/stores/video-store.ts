import { create } from 'zustand';

// Lazy load navigator service to avoid SSR issues
let navigatorService: any = null;
async function getNavigatorService() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!navigatorService) {
    const module = await import('../services/navigator.service');
    navigatorService = module.navigatorService;
  }
  return navigatorService;
}

export type AspectRatio = '16-9' | '4-3' | '2-1' | '1-1';

export interface VideoSettings {
  aspectRatio: AspectRatio;
  frameRate: number | null;
  height: number;
  width: number;
}

export interface VideoStore {
  camera: MediaStream | null;
  src: string | null;
  videoSettings: VideoSettings | null;
  error: string | null;
  startCamera: () => Promise<void>;
  stopVideo: () => void;
  setVideo: (src: string) => Promise<void>;
}

function aspectRatio(ratio: number): AspectRatio {
  return ratio > 1.9 ? '2-1' : ratio < 1.5 ? (ratio < 1.1 ? '1-1' : '4-3') : '16-9';
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  camera: null,
  src: null,
  videoSettings: null,
  error: null,

  startCamera: async () => {
    if (typeof window === 'undefined') {
      set({ error: 'notConnected' });
      return;
    }
    
    const { stopVideo } = get();
    set({ error: 'starting' });
    stopVideo();

    try {
      const navService = await getNavigatorService();
      if (!navService) {
        set({ error: 'notConnected' });
        return;
      }
      
      const camera = await navService.getCamera({
        facingMode: 'user',
        aspectRatio: 1,
        width: { min: 1280 },
        height: { min: 720 },
        frameRate: 120,
      });

      const videoTrack = camera.getVideoTracks()[0];
      const trackSettings = videoTrack.getSettings();
      const videoSettings: VideoSettings = {
        aspectRatio: aspectRatio(trackSettings.aspectRatio || 16 / 9),
        frameRate: trackSettings.frameRate || null,
        width: trackSettings.width || 1280,
        height: trackSettings.height || 720,
      };
      videoTrack.addEventListener('ended', () => {
        set({ error: 'turnedOff' });
      });

      set({ camera, videoSettings, error: null });
    } catch (e: any) {
      set({ error: e.message || 'unknown' });
    }
  },

  stopVideo: () => {
    const { camera, error } = get();
    if (camera) {
      camera.getTracks().forEach(track => track.stop());
    }
    set({
      camera: null,
      src: null,
      videoSettings: null,
      error: error || 'turnedOff',
    });
  },

  setVideo: async (src: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const { stopVideo } = get();
    set({ error: null });
    stopVideo();

    const videoEl: HTMLVideoElement = document.createElement('video');
    videoEl.addEventListener('loadedmetadata', () => {
      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;
      const videoSettings: VideoSettings = {
        aspectRatio: aspectRatio(width / height),
        frameRate: null,
        width,
        height,
      };

      set({ src, videoSettings, error: null });
      videoEl.remove();
    });
    videoEl.src = src;
  },
}));

