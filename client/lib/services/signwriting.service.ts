import type { Vector2, Vector3 } from 'three';
import type { font } from '@sutton-signwriting/font-ttf';
import { SignWritingStateModel } from '@/lib/stores/signwriting-store';

export class SignWritingService {
  private static font: Promise<typeof font> | null = null;
  private static fontsLoaded = false;

  static get fontsModule() {
    if (!SignWritingService.font) {
      SignWritingService.font = import(
        /* webpackChunkName: "@sutton-signwriting/font-ttf" */ '@sutton-signwriting/font-ttf/font/font.min'
      ).then((module) => {
        // Handle different module export formats (default export or namespace)
        const fontModule = (module as any).default || module;
        if (!fontModule || typeof fontModule !== 'object') {
          throw new Error(`Invalid font module format: ${typeof fontModule}`);
        }
        // Verify required methods exist
        if (typeof fontModule.cssAppend !== 'function' || typeof fontModule.cssLoaded !== 'function') {
          throw new Error('Font module missing required methods (cssAppend, cssLoaded)');
        }
        return fontModule as typeof font;
      });
    }
    return SignWritingService.font;
  }

  static async cssLoaded(): Promise<void> {
    const fontModule = await SignWritingService.fontsModule;
    if (!fontModule || !fontModule.cssLoaded) {
      throw new Error('Font module not loaded correctly');
    }
    return new Promise((resolve) => fontModule.cssLoaded(resolve));
  }

  static async loadFonts(): Promise<void> {
    if (SignWritingService.fontsLoaded) {
      return;
    }
    SignWritingService.fontsLoaded = true;

    const fontModule = await SignWritingService.fontsModule;
    
    if (!fontModule || !fontModule.cssAppend) {
      throw new Error('Font module not loaded correctly');
    }

    // Set local font directory (no leading slash, relative to public)
    fontModule.cssAppend('assets/fonts/signwriting/');
  }

  // Instance method wrappers for static methods
  async loadFonts(): Promise<void> {
    return SignWritingService.loadFonts();
  }

  async cssLoaded(): Promise<void> {
    return SignWritingService.cssLoaded();
  }

  static async normalizeFSW(text: string): Promise<string> {
    const { signNormalize } = await import('@sutton-signwriting/font-ttf/fsw/fsw');
    return signNormalize(text);
  }

  static textFontSize(text: string, width: number, ctx: CanvasRenderingContext2D): number {
    ctx.font = '100px SuttonSignWritingOneD';
    const measure = ctx.measureText(text);
    const bboxWidth = width * ctx.canvas.width;
    const scale = bboxWidth / measure.width;

    return 100 * scale;
  }

  static drawSWText(
    text: string,
    center: Vector2 | Vector3,
    fontSize: number,
    ctx: CanvasRenderingContext2D,
    isNormalized = true
  ): void {
    ctx.font = fontSize + 'px SuttonSignWritingOneD';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';

    const x = isNormalized ? center.x * ctx.canvas.width : center.x;
    const y = isNormalized ? center.y * ctx.canvas.height : center.y;
    ctx.fillText(text, x, y);
  }

  async draw(swState: SignWritingStateModel, ctx: CanvasRenderingContext2D): Promise<void> {
    // Import services dynamically to avoid circular dependency
    if (swState.body) {
      const { bodyService } = await import('./body.service');
      bodyService.draw(swState.body, ctx);
    }
    if (swState.face) {
      const { faceService } = await import('./face.service');
      faceService.draw(swState, ctx);
    }
    if (swState.leftHand || swState.rightHand) {
      const { handsService } = await import('./hands.service');
      handsService.draw(swState, ctx);
    }
  }
}

export const signWritingService = new SignWritingService();

