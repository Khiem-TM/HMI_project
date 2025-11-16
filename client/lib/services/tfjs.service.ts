import type * as tf from '@tensorflow/tfjs';

class TensorflowService {
  private static importPromise: Promise<typeof tf> | null = null;
  private tf: typeof tf | null = null;

  async load(): Promise<void> {
    if (!TensorflowService.importPromise) {
      TensorflowService.importPromise = import('@tensorflow/tfjs');
    }

    this.tf = await TensorflowService.importPromise;

    return this.tf.ready();
  }

  get setBackend(): typeof tf.setBackend {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.setBackend;
  }

  get softmax(): typeof tf.softmax {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.softmax;
  }

  get tidy(): typeof tf.tidy {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.tidy;
  }

  get stack(): typeof tf.stack {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.stack;
  }

  get loadLayersModel(): typeof tf.loadLayersModel {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.loadLayersModel;
  }

  get sub(): typeof tf.sub {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.sub;
  }

  get pow(): typeof tf.pow {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.pow;
  }

  get tensor2d(): typeof tf.tensor2d {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.tensor2d;
  }

  get scalar(): typeof tf.scalar {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.scalar;
  }

  get dot(): typeof tf.dot {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.dot;
  }

  get sqrt(): typeof tf.sqrt {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.sqrt;
  }

  get tensor(): typeof tf.tensor {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.tensor;
  }

  get browser(): typeof tf.browser {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.browser;
  }

  get isNaN(): typeof tf.isNaN {
    if (!this.tf) {
      throw new Error('TensorFlow.js not loaded. Call load() first.');
    }
    return this.tf.isNaN;
  }
}

export const tfjsService = new TensorflowService();


