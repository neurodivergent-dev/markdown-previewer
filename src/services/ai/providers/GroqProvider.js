import AIProvider from '../AIProvider';

export default class GroqProvider extends AIProvider {
  constructor(apiKey, modelName) {
    super();
    this.apiKey = apiKey;
    this.modelName = modelName || 'llama3-8b-8192';
  }

  validateConfig() {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }

  async generateContent(prompt, text) {
    if (!this.validateConfig()) {
      throw new Error('Groq API key is missing or invalid.');
    }

    const fullPrompt = prompt + text;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
