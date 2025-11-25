import type { ComlinkWorkerInterface, ModelRegistry } from "@sign-mt/browsermt";

export type TranslationDirection = "spoken-to-signed" | "signed-to-spoken";

export interface TranslationResponse {
  text: string;
}

class TranslationService {
  private worker: ComlinkWorkerInterface | null = null;
  private loadedModel: string | null = null;

  async initWorker() {
    if (this.worker) {
      return;
    }
    const { createBergamotWorker } = await import("@sign-mt/browsermt");
    this.worker = createBergamotWorker("/browsermt/worker.js");
    await this.worker.importBergamotWorker(
      "/browsermt/bergamot-translator-worker.js",
      "/browsermt/bergamot-translator-worker.wasm"
    );
  }

  async createModelRegistry(
    modelPath: string,
    modelName: string = "enase"
  ): Promise<ModelRegistry> {
    const modelRegistry: any = {};

    // Determine file names based on model name
    let fileMap: Record<string, { name: string }>;

    if (modelName === "spokensigned") {
      // Generic model
      fileMap = {
        model: {
          name: `/assets/${modelPath}model.spokensigned.intgemm.alphas.bin`,
        },
        lex: { name: `/assets/${modelPath}lex.50.50.spokensigned.s2t.bin` },
        vocab: { name: `/assets/${modelPath}vocab.spokensigned.spm` },
      };
    } else {
      // Specific model (en-ase)
      fileMap = {
        model: {
          name: `/assets/${modelPath}model.${modelName}.intgemm.alphas.bin`,
        },
        lex: { name: `/assets/${modelPath}lex.50.50.${modelName}.s2t.bin` },
        vocab: { name: `/assets/${modelPath}vocab.${modelName}.spm` },
      };
    }

    for (const [key, value] of Object.entries(fileMap)) {
      modelRegistry[key] = {
        name: value.name,
        size: 0,
        estimatedCompressedSize: 0,
        modelType: "prod",
      };
    }
    return modelRegistry;
  }

  async loadOfflineModel(
    direction: TranslationDirection,
    from: string,
    to: string,
    useGeneric: boolean = false
  ): Promise<void> {
    let modelName: string;
    let modelPath: string;
    let registryModelName: string;

    if (useGeneric) {
      // Use generic spoken-signed model
      modelName = "spokensigned";
      modelPath = `models/browsermt/${direction}/spoken-signed/`;
      registryModelName = "spokensigned";
    } else {
      // Use specific model
      modelName = `${from}${to}`;
      modelPath = `models/browsermt/${direction}/${from}-${to}/`;
      registryModelName = modelName.replace("-", ""); // en-ase -> enase
    }

    if (this.loadedModel === modelName) {
      return;
    }

    const modelRegistry = {
      [modelName]: await this.createModelRegistry(modelPath, registryModelName),
    } as ModelRegistry;

    await this.initWorker();
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    // For generic model, use 'spoken' and 'signed' as language codes
    const loadFrom = useGeneric ? "spoken" : from;
    const loadTo = useGeneric ? "signed" : to;

    try {
      await this.worker.loadModel(loadFrom, loadTo, modelRegistry);
      this.loadedModel = modelName;
    } catch (error: any) {
      // If loading fails and we're not already using generic, throw to trigger fallback
      if (!useGeneric) {
        throw error;
      }
      // If generic also fails, rethrow
      throw new Error(
        `Failed to load ${useGeneric ? "generic" : "specific"} model: ${
          error.message
        }`
      );
    }
  }

  async translateOffline(
    direction: TranslationDirection,
    text: string,
    from: string,
    to: string,
    useGeneric: boolean = false
  ): Promise<TranslationResponse> {
    // Load model if not already loaded (with correct generic flag)
    await this.loadOfflineModel(direction, from, to, useGeneric);

    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    // Use correct language codes for translation
    const translateFrom = useGeneric ? "spoken" : from;
    const translateTo = useGeneric ? "signed" : to;

    // Worker.translate returns array of strings
    let translations = await this.worker.translate(
      translateFrom,
      translateTo,
      [text],
      [{ isHtml: false }]
    );

    // Handle empty or undefined translations
    if (!translations || translations.length === 0) {
      throw new Error("Translation returned empty result");
    }

    // Worker returns array of strings, convert to array of objects
    const translationTexts = Array.isArray(translations)
      ? translations
      : [translations];

    // Get first translation result
    let translationText: string;
    if (typeof translationTexts[0] === "string") {
      translationText = translationTexts[0];
    } else if (
      translationTexts[0] &&
      typeof translationTexts[0] === "object" &&
      "text" in translationTexts[0]
    ) {
      translationText = (translationTexts[0] as any).text;
    } else {
      throw new Error(
        `Unexpected translation result format: ${typeof translationTexts[0]}`
      );
    }

    if (!translationText || translationText.trim().length === 0) {
      throw new Error("Translation result is empty");
    }

    // Post-process and return
    return {
      text: this.postProcessSignWriting(translationText),
    };
  }

  async translateOnline(
    direction: TranslationDirection,
    text: string,
    sentences: string[],
    from: string,
    to: string
  ): Promise<TranslationResponse> {
    const url = "https://sign.mt/api/spoken-text-to-signwriting";
    const body = {
      data: {
        texts: sentences.map((s) => s.trim()),
        spoken_language: from,
        signed_language: to,
      },
    };

    interface SpokenToSignWritingResponse {
      result: {
        input: string[];
        output: string[];
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data: SpokenToSignWritingResponse = await response.json();
    return { text: data.result.output.join(" ") };
  }

  async translateSpokenToSignWriting(
    text: string,
    sentences: string[],
    spokenLanguage: string,
    signedLanguage: string
  ): Promise<TranslationResponse> {
    const direction: TranslationDirection = "spoken-to-signed";

    // Use generic offline model (en-ase specific model not available)
    // Format input with language tags: $en $ase Hello world
    try {
      const preprocessedText = this.preProcessSpokenText(text);
      const formattedText = `$${spokenLanguage} $${signedLanguage} ${preprocessedText}`;
      return await this.translateOffline(
        direction,
        formattedText,
        spokenLanguage,
        signedLanguage,
        true
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Offline translation failed: ${errorMessage}`);
    }
  }

  preProcessSpokenText(text: string): string {
    return text.replace(/\n/g, " ");
  }

  postProcessSignWriting(text: string): string {
    // Remove all tokens that start with a $ (language tags)
    text = text.replace(/\$[^\s]+/g, "");

    // Space signs correctly
    text = text.replace(/ /g, "");
    text = text.replace(/(\d)M/g, "$1 M");

    return text.trim();
  }

  splitSpokenSentences(language: string, text: string): string[] {
    // If the browser does not support the Segmenter API (FireFox<127), return the whole text as a single segment
    if (typeof Intl === "undefined" || !("Segmenter" in Intl)) {
      return [text];
    }

    try {
      const segmenter = new Intl.Segmenter(language, {
        granularity: "sentence",
      });
      const segments = segmenter.segment(text);
      return Array.from(segments).map((segment) => segment.segment);
    } catch (e) {
      // Fallback if language not supported
      return [text];
    }
  }

  getSpokenToSignedPoseUrl(
    text: string,
    spokenLanguage: string,
    signedLanguage: string
  ): string {
    const api =
      "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose";
    return `${api}?text=${encodeURIComponent(
      text
    )}&spoken=${spokenLanguage}&signed=${signedLanguage}`;
  }

  getSpokenToSignedVideoUrl(
    text: string,
    spokenLanguage: string,
    signedLanguage: string
  ): string {
    const api =
      "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_video";
    return `${api}?text=${encodeURIComponent(
      text
    )}&spoken=${spokenLanguage}&signed=${signedLanguage}`;
  }

  // Sign-to-Text: Get API URL for signed video/pose to spoken text
  getSignedToSpokenTextUrl(
    videoUrl: string,
    signedLanguage: string,
    spokenLanguage: string
  ): string {
    const api =
      "https://us-central1-sign-mt.cloudfunctions.net/signed_video_to_spoken_text";
    return `${api}?video=${encodeURIComponent(
      videoUrl
    )}&signed=${signedLanguage}&spoken=${spokenLanguage}`;
  }

  // Sign-to-Text: Translate signed video/pose to text using API
  async translateSignedToSpokenText(
    videoUrl: string,
    signedLanguage: string = "ase",
    spokenLanguage: string = "en"
  ): Promise<TranslationResponse> {
    try {
      const apiUrl = this.getSignedToSpokenTextUrl(
        videoUrl,
        signedLanguage,
        spokenLanguage
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Sign-to-text API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (data.text) {
        return { text: data.text };
      } else if (data.result?.text) {
        return { text: data.result.text };
      } else if (data.translation) {
        return { text: data.translation };
      } else if (typeof data === "string") {
        return { text: data };
      } else {
        throw new Error("Unexpected response format from sign-to-text API");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Sign-to-text translation failed: ${errorMessage}`);
    }
  }

  // Sign-to-Text: Translate landmarks to text (using offline model if available)
  async translateSignedLandmarksToText(
    landmarks: any,
    signedLanguage: string = "ase",
    spokenLanguage: string = "en"
  ): Promise<TranslationResponse> {
    throw new Error(
      "Landmark-based sign-to-text translation not yet implemented. Please use video URL instead."
    );
  }
}

export const translationService = new TranslationService();
