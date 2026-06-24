import AIProvider from '../AIProvider';

export default class OllamaProvider extends AIProvider {
  constructor(baseUrl, modelName, apiKey, isCloud = false) {
    super();
    // Default to localhost if empty
    let url = baseUrl ? baseUrl.replace(/\/$/, '') : 'http://localhost:11434';
    
    // Transparently rewrite ollama.com to our local proxy to bypass CORS
    if (url === 'https://ollama.com' && isCloud) {
      url = '/ollama-api';
    }

    this.baseUrl = url;
    this.modelName = modelName || 'llama3';
    this.apiKey = apiKey;
    this.isCloud = isCloud;
  }

  validateConfig() {
    if (!this.baseUrl || this.baseUrl.trim() === '') return false;
    if (this.isCloud && (!this.apiKey || this.apiKey.trim() === '')) return false;
    return true;
  }

  async generateContent(prompt, text) {
    if (!this.validateConfig()) {
      if (this.isCloud && (!this.apiKey || this.apiKey.trim() === '')) {
        throw new Error('Ollama Cloud API Key is missing. Please enter it in the settings.');
      }
      throw new Error('Ollama Base URL is missing.');
    }

    const fullPrompt = prompt + text;

    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.modelName,
          prompt: fullPrompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to Ollama at ${this.baseUrl}. Please ensure Ollama is running and CORS is configured if necessary.`);
      }
      throw err;
    }
  }
}
