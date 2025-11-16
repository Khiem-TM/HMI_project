import { create } from 'zustand';
import type { Vector2, Vector3 } from 'three';

export interface SWFeatureDescription {
  location: Vector2 | Vector3;
  symbol: string;
}

export interface BodyStateModel {
  shoulders: {
    center: Vector2;
    width: number;
  };
  elbows: [any, any];
  wrists: [any, any];
}

export interface FaceStateModel {
  face?: SWFeatureDescription;
  eyes?: {
    left: SWFeatureDescription;
    right: SWFeatureDescription;
  };
  eyebrows?: {
    left: SWFeatureDescription;
    right: SWFeatureDescription;
  };
  mouth?: SWFeatureDescription;
}

export interface HandStateModel {
  bbox: any;
  normal: any;
  plane: 'wall' | 'floor';
  rotation: number;
  direction: 'me' | 'you' | 'both';
  shape: string;
}

export interface SignWritingStateModel {
  timestamp: number | null;
  body: BodyStateModel | null;
  face: FaceStateModel | null;
  leftHand: HandStateModel | null;
  rightHand: HandStateModel | null;
}

export interface SignWritingStore {
  state: SignWritingStateModel;
  setState: (state: Partial<SignWritingStateModel>) => void;
  reset: () => void;
}

const initialState: SignWritingStateModel = {
  timestamp: null,
  body: null,
  face: null,
  leftHand: null,
  rightHand: null,
};

export const useSignWritingStore = create<SignWritingStore>((set) => ({
  state: initialState,
  setState: (newState) =>
    set((prev) => ({
      state: { ...prev.state, ...newState },
    })),
  reset: () => set({ state: initialState }),
}));


