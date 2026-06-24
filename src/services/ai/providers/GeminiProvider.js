import AIProvider from '../AIProvider';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default class GeminiProvider extends AIProvider {
  constructor(apiKey, modelName) {
    super();
    this.apiKey = apiKey;
    this.modelName = modelName || 'gemini-2.5-flash';
  }

  validateConfig() {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }

  async generateContent(prompt, text) {
    if (!this.validateConfig()) {
      throw new Error('Gemini API key is missing or invalid.');
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.modelName });

    const fullPrompt = prompt + text;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }
}
