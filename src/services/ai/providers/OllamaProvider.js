import AIProvider from '../AIProvider';

export default class OllamaProvider extends AIProvider {
  constructor(baseUrl, modelName, apiKey, isCloud = false) {
    super();
    // Default to localhost if empty
    let url = baseUrl ? baseUrl.replace(/\/$/, '') : 'http://localhost:11434';
    
    // Rewrite ollama.com to the current origin's Netlify proxy to bypass CORS
    if (url === 'https://ollama.com' && isCloud) {
      url = `${window.location.origin}/ollama-api`;
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

    // Cloud uses native /api/chat; local uses OpenAI-compat /v1/chat/completions
    const endpoint = this.isCloud
      ? `${this.baseUrl}/api/chat`
      : `${this.baseUrl}/v1/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: fullPrompt }],
          stream: false
        })
      });

      if (!response.ok) {
        let errorMsg = `${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error.message || errorData.error;
        } catch (e) {
          // ignore
        }
        throw new Error(`Ollama API error: ${errorMsg}`);
      }

      const data = await response.json();
      // Native /api/chat returns data.message.content; OpenAI compat returns data.choices[0].message.content
      return this.isCloud
        ? (data.message?.content || '')
        : (data.choices[0].message.content || '');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to Ollama at ${this.baseUrl}. Please ensure Ollama is running and CORS is configured if necessary.`);
      }
      throw err;
    }
  }
}
