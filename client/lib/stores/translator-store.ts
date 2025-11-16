import { create } from 'zustand';

export type PoseViewerMode = 'skeleton' | 'avatar' | 'signwriting';

interface TranslatorState {
  signedLanguagePose: string | null;
  signedLanguageVideo: string | null;
  poseViewerMode: PoseViewerMode;
  setSignedLanguagePose: (url: string | null) => void;
  setSignedLanguageVideo: (url: string | null) => void;
  setPoseViewerMode: (mode: PoseViewerMode) => void;
  reset: () => void;
}

const initialState = {
  signedLanguagePose: null,
  signedLanguageVideo: null,
  poseViewerMode: 'skeleton' as PoseViewerMode,
};

export const useTranslatorStore = create<TranslatorState>((set, get) => ({
  ...initialState,
  setSignedLanguagePose: (url) => set({ signedLanguagePose: url }),
  setSignedLanguageVideo: (url) => {
    // Set new video URL without revoking the old one immediately
    // The old URL will be revoked on reset() or when component unmounts
    // This prevents premature revocation while video element is loading
    set({ signedLanguageVideo: url });
  },
  setPoseViewerMode: (mode) => set({ poseViewerMode: mode }),
  reset: () => {
    // Revoke video URLs before reset
    const currentVideoUrl = get().signedLanguageVideo;
    const currentPoseUrl = get().signedLanguagePose;
    
    if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentVideoUrl);
    }
    if (currentPoseUrl && currentPoseUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentPoseUrl);
    }
    
    set(initialState);
  },
}));

