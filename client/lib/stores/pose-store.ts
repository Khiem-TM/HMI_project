import { create } from 'zustand';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export const EMPTY_LANDMARK: PoseLandmark = { x: 0, y: 0, z: 0 };

export interface EstimatedPose {
  faceLandmarks: PoseLandmark[];
  poseLandmarks: PoseLandmark[];
  rightHandLandmarks: PoseLandmark[];
  leftHandLandmarks: PoseLandmark[];
  image: HTMLCanvasElement;
}

export interface PoseStore {
  isLoaded: boolean;
  pose: EstimatedPose | null;
  setPose: (pose: EstimatedPose | null) => void;
  setIsLoaded: (isLoaded: boolean) => void;
}

export const usePoseStore = create<PoseStore>((set) => ({
  isLoaded: false,
  pose: null,
  setPose: (pose) => set({ pose }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
}));


