import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AIManager from '../services/ai/AIManager';
import { useAIProvider } from '../contexts/AIProviderContext';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  LanguageIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ArrowsPointingOutIcon,
  ExclamationCircleIcon,
  Cog8ToothIcon,
} from '@heroicons/react/24/outline';

const AIAssistant = ({ isOpen, onClose, selectedText, markdown, onInsertText, darkMode, onOpenSettings }) => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const { config } = useAIProvider();

  // Use selectedText if available, otherwise use full markdown
  const textToProcess = selectedText || markdown;

  // AI Action presets
  const aiActions = [
    {
      id: 'improve',
      label: 'Improve Writing',
      icon: PencilSquareIcon,
      prompt: 'Improve the following text while maintaining its meaning. Make it more clear, concise, and professional. Return ONLY the improved text without any introductory phrases or explanations:\n\n',
      color: 'blue',
    },
    {
      id: 'grammar',
      label: 'Fix Grammar',
      icon: CheckIcon,
      prompt: 'Fix grammar, spelling, and punctuation errors in the following text. Keep the original meaning. Return ONLY the corrected text without any introductory phrases or explanations:\n\n',
      color: 'green',
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: DocumentTextIcon,
      prompt: 'Provide a concise summary of the following text. Return ONLY the summary without any introductory phrases like "Here is" or explanations:\n\n',
      color: 'purple',
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: ArrowsPointingOutIcon,
      prompt: 'Expand the following text with more details and explanations. Return ONLY the expanded text without any introductory phrases or explanations:\n\n',
      color: 'orange',
    },
    {
      id: 'translate-tr',
      label: 'Translate to Turkish',
      icon: LanguageIcon,
      prompt: 'Translate the following text to Turkish. Return ONLY the translated text without any introductory phrases or explanations:\n\n',
      color: 'red',
    },
    {
      id: 'translate-en',
      label: 'Translate to English',
      icon: LanguageIcon,
      prompt: 'Translate the following text to English. Return ONLY the translated text without any introductory phrases or explanations:\n\n',
      color: 'indigo',
    },
  ];

  const callAIProvider = async (prompt, text) => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const aiManager = new AIManager(config.activeProvider, config);
      const generatedText = await aiManager.generateContent(prompt, text);
      setResult(generatedText);
    } catch (err) {
      console.error('AI API Error:', err);
      setError(err.message || 'Failed to generate content. Please check your provider settings and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action) => {
    if (!textToProcess || textToProcess.trim() === '') {
      setError('No text available to process.');
      return;
    }
    callAIProvider(action.prompt, textToProcess);
  };

  const handleCustomPrompt = () => {
    if (!customPrompt) {
      setError('Please enter a custom prompt.');
      return;
    }
    if (!textToProcess || textToProcess.trim() === '') {
      setError('No text available to process.');
      return;
    }
    const enhancedPrompt = customPrompt + '\n\nIMPORTANT: Start directly with the content. Do not begin with meta-commentary like "Here is", "Sure", "Okay", "Tamam, işte" or similar phrases.\n\n';
    callAIProvider(enhancedPrompt, textToProcess);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    onInsertText(result);
    onClose();
  };

  const handleReplace = () => {
    if (selectedText) {
      // If text is selected, replace only the selection
      onInsertText(result, true);
    } else {
      // If no selection, replace the entire document
      onInsertText(result, 'replaceAll');
    }
    onClose();
  };

  if (!isOpen) return null;

  const providerNames = {
    'gemini': 'Google Gemini',
    'groq': 'Groq',
    'ollama-local': 'Ollama (Local)',
    'ollama-cloud': 'Ollama (Cloud)'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden sm:rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        } flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-bold truncate">AI Assistant</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
                  {providerNames[config.activeProvider] || config.activeProvider}
                </span>
              </div>
              <p className={`text-xs sm:text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedText
                  ? `${selectedText.length} characters selected`
                  : textToProcess
                    ? `${textToProcess.length} characters (full document)`
                    : 'No text available'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onOpenSettings}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Open AI Settings"
              title="AI Settings"
            >
              <Cog8ToothIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              aria-label="Close AI Assistant"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* AI Actions */}
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {aiActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={loading}
                    className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      darkMode
                        ? `border-gray-700 hover:border-${action.color}-500 hover:bg-gray-700`
                        : `border-gray-200 hover:border-${action.color}-500 hover:bg-${action.color}-50`
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${action.color}-500 flex-shrink-0`} />
                    <span className="text-xs sm:text-sm font-medium truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Custom Prompt
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom instruction..."
                className={`flex-1 px-3 py-2 sm:px-4 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomPrompt()}
              />
              <button
                onClick={handleCustomPrompt}
                disabled={loading || !customPrompt}
                className={`px-4 py-2 sm:px-6 rounded-lg text-sm font-medium transition-colors ${
                  loading || !customPrompt
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white whitespace-nowrap`}
              >
                {loading ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <ExclamationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 p-6 sm:p-8">
              <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 animate-spin" />
              <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Generating with {providerNames[config.activeProvider]}...</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Result</h3>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <ClipboardDocumentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div
                className={`p-3 sm:p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                } max-h-48 sm:max-h-64 overflow-y-auto`}
              >
                <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm">{result}</pre>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleInsert}
                  className="flex-1 px-3 py-2 sm:px-4 text-sm sm:text-base bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Insert Below
                </button>
                <button
                  onClick={handleReplace}
                  className="flex-1 px-3 py-2 sm:px-4 text-sm sm:text-base bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  {selectedText ? 'Replace Selection' : 'Replace Document'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AIAssistant.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedText: PropTypes.string,
  markdown: PropTypes.string,
  onInsertText: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
};

export default AIAssistant;
