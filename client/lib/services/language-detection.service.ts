class LanguageDetectionService {
  private cld3: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Try to load CLD3 if available
      // For now, we'll use a simple fallback
      this.initialized = true;
    } catch (e) {
      console.warn('CLD3 not available, using fallback detection');
      this.initialized = true;
    }
  }

  async detectSpokenLanguage(text: string): Promise<string> {
    await this.init();

    // Simple fallback: detect common patterns
    // For production, use CLD3 or MediaPipe language detector
    if (text.trim().length === 0) {
      return 'en'; // Default to English
    }

    // Simple heuristics (can be improved with actual CLD3)
    const lowerText = text.toLowerCase();
    
    // Check for common non-English patterns
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text)) {
      // Likely Romance languages
      if (/[ñ]/.test(text)) return 'es';
      if (/[ç]/.test(text)) return 'fr';
      return 'es';
    }
    
    if (/[äöüß]/.test(text)) {
      return 'de';
    }
    
    if (/[àèéìíîòóùú]/.test(text)) {
      return 'it';
    }

    // Default to English
    return 'en';
  }
}

export const languageDetectionService = new LanguageDetectionService();


