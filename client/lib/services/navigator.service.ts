export interface MediaTrackConstraints {
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
  width?: { min?: number; ideal?: number; max?: number };
  height?: { min?: number; ideal?: number; max?: number };
  frameRate?: number;
}

class NavigatorService {
  async getCamera(options: MediaTrackConstraints): Promise<MediaStream> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      throw new Error('notConnected');
    }
    
    let camera: MediaStream;
    try {
      camera = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: options,
      });
    } catch (e: any) {
      console.error(e.message);

      if (e.message.includes('Permission denied')) {
        throw new Error('permissionDenied');
      } else {
        throw new Error('notConnected');
      }
    }
    if (!camera) {
      throw new Error('notConnected');
    }
    return camera;
  }
}

export const navigatorService = new NavigatorService();

