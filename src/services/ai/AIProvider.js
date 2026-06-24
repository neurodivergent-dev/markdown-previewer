export default class AIProvider {
  /**
   * Generates content using the specific AI provider.
   * @param {string} prompt - The instructions for the AI.
   * @param {string} text - The input text to process.
   * @returns {Promise<string>} - The generated text response.
   */
  async generateContent(prompt, text) {
    throw new Error('generateContent() must be implemented by subclasses');
  }

  /**
   * Validates if the provider has the necessary configuration to run.
   * @returns {boolean}
   */
  validateConfig() {
    return true; // Default to true, subclasses can override
  }
}
