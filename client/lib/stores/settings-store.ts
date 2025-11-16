import { create } from 'zustand';

export type PoseViewerSetting = 'pose' | 'avatar' | 'person';

export interface SettingsStore {
  receiveVideo: boolean;
  detectSign: boolean;
  animatePose: boolean;
  drawVideo: boolean;
  drawPose: boolean;
  drawSignWriting: boolean;
  appearance: string;
  poseViewer: PoseViewerSetting;
  setSetting: <K extends keyof Omit<SettingsStore, 'setSetting'>>(
    setting: K,
    value: SettingsStore[K]
  ) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  receiveVideo: false,
  detectSign: false,
  animatePose: false,
  drawVideo: true,
  drawPose: true,
  drawSignWriting: false,
  appearance: '#ffffff',
  poseViewer: 'pose',
  setSetting: (setting, value) => set({ [setting]: value } as any),
}));


