import type * as holistic from '@mediapipe/holistic';

class MediapipeHolisticService {
  private importPromise: Promise<typeof holistic> | null = null;
  private holistic: typeof holistic | null = null;

  async load(): Promise<typeof holistic> {
    if (!this.importPromise) {
      this.importPromise = import('@mediapipe/holistic').then(
        module => {
          // Handle different export formats
          // module.default might be the Holistic class itself or a namespace containing it
          const holisticModule = module.default || module;
          
          // Check if Holistic is directly on the module or in default
          if (holisticModule && typeof holisticModule.Holistic === 'function') {
            this.holistic = holisticModule;
          } else if (module.Holistic && typeof module.Holistic === 'function') {
            this.holistic = module;
          } else if (typeof holisticModule === 'function') {
            // If default export IS the Holistic class itself
            // We need to wrap it in an object with a Holistic property
            this.holistic = { Holistic: holisticModule } as typeof holistic;
          } else {
            throw new Error('Holistic class not found in @mediapipe/holistic module. Available keys: ' + Object.keys(module).join(', '));
          }
          return this.holistic;
        }
      );
    }

    return this.importPromise;
  }

  get Holistic(): typeof holistic.Holistic {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.Holistic;
  }

  get POSE_LANDMARKS(): typeof holistic.POSE_LANDMARKS {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.POSE_LANDMARKS;
  }

  get POSE_CONNECTIONS(): typeof holistic.POSE_CONNECTIONS {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.POSE_CONNECTIONS;
  }

  get HAND_CONNECTIONS(): typeof holistic.HAND_CONNECTIONS {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.HAND_CONNECTIONS;
  }

  get FACEMESH_TESSELATION(): typeof holistic.FACEMESH_TESSELATION {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_TESSELATION;
  }

  get FACEMESH_RIGHT_EYE(): typeof holistic.FACEMESH_RIGHT_EYE {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_RIGHT_EYE;
  }

  get FACEMESH_RIGHT_EYEBROW(): typeof holistic.FACEMESH_RIGHT_EYEBROW {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_RIGHT_EYEBROW;
  }

  get FACEMESH_LEFT_EYE(): typeof holistic.FACEMESH_LEFT_EYE {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_LEFT_EYE;
  }

  get FACEMESH_LEFT_EYEBROW(): typeof holistic.FACEMESH_LEFT_EYEBROW {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_LEFT_EYEBROW;
  }

  get FACEMESH_FACE_OVAL(): typeof holistic.FACEMESH_FACE_OVAL {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_FACE_OVAL;
  }

  get FACEMESH_LIPS(): typeof holistic.FACEMESH_LIPS {
    if (!this.holistic) {
      throw new Error('Holistic not loaded. Call load() first.');
    }
    return this.holistic.FACEMESH_LIPS;
  }
}

export const holisticService = new MediapipeHolisticService();

