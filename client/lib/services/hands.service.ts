import { SignWritingStateModel } from '@/lib/stores/signwriting-store';
import { SignWritingService } from './signwriting.service';
import { poseNormalizationService } from './pose-normalization.service';
import { tfjsService } from './tfjs.service';
import { threeService } from './three.service';
import type { HandStateModel } from '@/lib/stores/signwriting-store';
import type { LayersModel } from '@tensorflow/tfjs-layers';
import type { Tensor } from '@tensorflow/tfjs';
import type { Vector3 } from 'three';

export type HandPlane = 'wall' | 'floor';
export type HandDirection = 'me' | 'you' | 'side';

class HandsService {
  private leftHandSequentialModel: LayersModel | null = null;
  private rightHandSequentialModel: LayersModel | null = null;

  async loadModel(): Promise<void> {
    await Promise.all([tfjsService.load(), threeService.load()]);

    try {
      this.leftHandSequentialModel = (await tfjsService.loadLayersModel(
        '/assets/models/hand-shape/model.json'
      )) as LayersModel;

      // Clone the model for the right hand
      const modelData = new Promise<any>((resolve) =>
        this.leftHandSequentialModel!.save({ save: resolve as any })
      );
      this.rightHandSequentialModel = (await tfjsService.loadLayersModel({
        load: () => modelData,
      })) as LayersModel;
    } catch (e) {
      console.warn('Hand shape model not available:', e);
    }
  }

  async normalizeHand(
    vectors: Vector3[],
    normal: any,
    flipHand: boolean
  ): Promise<Tensor> {
    return poseNormalizationService.normalize(vectors, normal, [0, 9], 0, flipHand);
  }

  async shape(vectors: Vector3[], normal: any, isLeft: boolean): Promise<string> {
    const model = isLeft ? this.leftHandSequentialModel : this.rightHandSequentialModel;
    if (!model) {
      return '񆄡'; // By default, just fist shape
    }

    await tfjsService.load();
    const tf = tfjsService;

    const hsIndex = tf.tidy(() => {
      const handTensor = this.normalizeHand(vectors, normal, isLeft);
      const pred: Tensor = model.predict(handTensor.reshape([1, 1, 63])) as Tensor;
      const argmax = tf.softmax(pred).argMax(2).dataSync();
      return argmax[0];
    });

    const code = 262145 + 0x60 * hsIndex;
    return String.fromCodePoint(code);
  }

  async bbox(vectors: Vector3[]): Promise<any> {
    await threeService.load();
    const { Box3 } = threeService;
    return new Box3().setFromPoints(vectors);
  }

  async normal(vectors: Vector3[], flipNormal: boolean = false): Promise<any> {
    // 0 - WRIST
    // 5 - INDEX_FINGER_MCP
    // 17 - PINKY_MCP
    const planeNormal = await poseNormalizationService.normal(vectors, [0, 5, 17]);

    planeNormal.direction = planeNormal.direction.multiplyScalar(flipNormal ? -1 : 1);

    return planeNormal;
  }

  plane(vectors: Vector3[]): HandPlane {
    const p1 = vectors[0];
    const p2 = vectors[13];

    const y = Math.abs(p2.y - p1.y) * 1.5; // add bias to y
    const z = Math.abs(p2.z - p1.z);

    if (y > z) {
      return 'wall';
    }
    return 'floor';
  }

  angleRotationBucket(angle: number): number {
    angle += 360 / 16; // make a safety margin around every angle
    angle = (angle + 360) % 360; // working with positive angles is easier
    return Math.floor(angle / 45);
  }

  rotation(vectors: Vector3[]): number {
    const p1 = vectors[0];
    const p2 = vectors[13];

    const angle = poseNormalizationService.angle(p2.y - p1.y, p2.x - p1.x) + 90; // SignWriting first char is 90 degrees rotated
    return this.angleRotationBucket(angle);
  }

  direction(plane: HandPlane, normal: any, flipAxis: boolean): HandDirection {
    const x = flipAxis ? normal.direction.x : -normal.direction.x; // For right hand, flip the x-axis

    switch (plane) {
      case 'wall':
        const xzAngle = poseNormalizationService.angle(normal.direction.z, x);

        if (xzAngle > 210) {
          // 180 degrees + 30 safety
          return 'me';
        }

        if (xzAngle > 150) {
          return 'side';
        }

        return 'you';

      case 'floor':
        const xyAngle = poseNormalizationService.angle(normal.direction.y, x);

        if (xyAngle > 0) {
          return 'me';
        }

        if (xyAngle > -60) {
          return 'side';
        }

        return 'you';
    }
  }

  draw(swState: SignWritingStateModel, ctx: CanvasRenderingContext2D): void {
    // Hand drawing logic would go here
    // For now, this is a placeholder
  }
}

export const handsService = new HandsService();


