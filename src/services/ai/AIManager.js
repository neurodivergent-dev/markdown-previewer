import GeminiProvider from './providers/GeminiProvider';
import GroqProvider from './providers/GroqProvider';
import OllamaProvider from './providers/OllamaProvider';

export default class AIManager {
  constructor(providerType, config) {
    this.providerType = providerType;
    this.config = config;
    this.provider = this.createProvider();
  }

  createProvider() {
    switch (this.providerType) {
      case 'gemini':
        return new GeminiProvider(this.config.keys?.gemini, this.config.models?.gemini);
      case 'groq':
        return new GroqProvider(this.config.keys?.groq, this.config.models?.groq);
      case 'ollama-local':
        return new OllamaProvider(this.config.urls?.['ollama-local'], this.config.models?.['ollama-local'], null, false);
      case 'ollama-cloud':
        return new OllamaProvider(this.config.urls?.['ollama-cloud'], this.config.models?.['ollama-cloud'], this.config.keys?.['ollama-cloud'], true);
      default:
        throw new Error(`Unknown provider type: ${this.providerType}`);
    }
  }

  async generateContent(prompt, text) {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    return await this.provider.generateContent(prompt, text);
  }
}
