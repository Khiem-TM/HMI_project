import type * as three from 'three';

class ThreeService {
  private static importPromise: Promise<typeof three> | null = null;
  private three: typeof three | null = null;

  async load(): Promise<void> {
    if (!ThreeService.importPromise) {
      ThreeService.importPromise = import('three');
    }

    this.three = await ThreeService.importPromise;
  }

  get Vector2(): typeof three.Vector2 {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.Vector2;
  }

  get Vector3(): typeof three.Vector3 {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.Vector3;
  }

  get Box3(): typeof three.Box3 {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.Box3;
  }

  get Plane(): typeof three.Plane {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.Plane;
  }

  get VectorKeyframeTrack(): typeof three.VectorKeyframeTrack {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.VectorKeyframeTrack;
  }

  get QuaternionKeyframeTrack(): typeof three.QuaternionKeyframeTrack {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.QuaternionKeyframeTrack;
  }

  get AnimationClip(): typeof three.AnimationClip {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three.AnimationClip;
  }

  // Get the entire three module for cases where we need direct access
  get module(): typeof three {
    if (!this.three) {
      throw new Error('Three.js not loaded. Call load() first.');
    }
    return this.three;
  }
}

export const threeService = new ThreeService();

