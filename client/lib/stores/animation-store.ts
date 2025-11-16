import { create } from 'zustand';

export interface AnimationState {
  tracks: Record<string, number[][]>; // Quaternion tracks for bones: { "boneName": [[x,y,z,w], ...] }
  fps: number;
  setTracks: (tracks: Record<string, number[][]>) => void;
  setFps: (fps: number) => void;
  reset: () => void;
}

const initialState = {
  tracks: {},
  fps: 30,
};

export const useAnimationStore = create<AnimationState>((set) => ({
  ...initialState,
  setTracks: (tracks) => set({ tracks }),
  setFps: (fps) => set({ fps }),
  reset: () => set(initialState),
}));


