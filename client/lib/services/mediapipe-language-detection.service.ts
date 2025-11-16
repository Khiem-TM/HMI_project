import type { LanguageDetector } from '@mediapipe/tasks-text';

class MediaPipeLanguageDetectionService {
  private detector: LanguageDetector | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.detector) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const textTasks = await import('@mediapipe/tasks-text');
        const basePath = '/assets/models/mediapipe-language-detector';
        const wasmFiles = await textTasks.FilesetResolver.forTextTasks(basePath);
        this.detector = await textTasks.LanguageDetector.createFromModelPath(
          wasmFiles,
          `${basePath}/model.tflite`
        );
      } catch (error) {
        console.error('Failed to initialize MediaPipe language detector:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  async detectSpokenLanguage(text: string): Promise<string> {
    await this.init();

    if (!this.detector) {
      // Fallback to 'en' if detector not available
      return 'en';
    }

    try {
      const { languages } = await this.detector.detect(text);

      if (languages.length === 0) {
        // This usually happens when the text is too short
        return 'en';
      }

      // Map MediaPipe language codes to our language codes
      const languageCode = languages[0].languageCode;
      return this.mapLanguageCode(languageCode);
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en'; // Fallback to English
    }
  }

  private mapLanguageCode(code: string): string {
    // Map MediaPipe language codes to our standard codes
    const languageMap: Record<string, string> = {
      en: 'en',
      es: 'es',
      fr: 'fr',
      de: 'de',
      it: 'it',
      pt: 'pt',
      ru: 'ru',
      ja: 'ja',
      zh: 'zh',
      ko: 'ko',
      ar: 'ar',
    };

    return languageMap[code] || 'en';
  }
}

export const mediapipeLanguageDetectionService = new MediaPipeLanguageDetectionService();


