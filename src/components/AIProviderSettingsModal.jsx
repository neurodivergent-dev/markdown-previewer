import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAIProvider } from '../contexts/AIProviderContext';
import { XMarkIcon, KeyIcon, GlobeAltIcon, ServerIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AIProviderSettingsModal = ({ isOpen, onClose, darkMode }) => {
  const { config, updateConfig, setProvider } = useAIProvider();
  
  // Local state for form fields to avoid updating context on every keystroke
  const [localConfig, setLocalConfig] = useState(config);
  const [saveStatus, setSaveStatus] = useState('');

  // Sync local config when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setSaveStatus('');
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setLocalConfig({ ...localConfig, activeProvider: newProvider });
  };

  const handleKeyChange = (provider, value) => {
    setLocalConfig(prev => ({
      ...prev,
      keys: { ...prev.keys, [provider]: value }
    }));
  };

  const handleUrlChange = (provider, value) => {
    setLocalConfig(prev => ({
      ...prev,
      urls: { ...prev.urls, [provider]: value }
    }));
  };

  const handleModelChange = (provider, value) => {
    setLocalConfig(prev => ({
      ...prev,
      models: { ...prev.models, [provider]: value }
    }));
  };

  const handleSave = () => {
    updateConfig(localConfig);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <ServerIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">AI Provider Settings</h2>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configure your AI models and API keys</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Active Provider Selection */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active Provider</label>
            <div className="relative">
              <select
                value={localConfig.activeProvider}
                onChange={handleProviderChange}
                className={`w-full appearance-none px-4 py-2 pr-10 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq (Llama 3)</option>
                <option value="ollama-local">Ollama (Local)</option>
                <option value="ollama-cloud">Ollama (Cloud / Remote)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />

          {/* Provider Specific Configuration */}
          {localConfig.activeProvider === 'gemini' && (
            <div className="space-y-4">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <KeyIcon className="w-4 h-4 text-yellow-500" />
                Google Gemini Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>API Key</label>
                  <input
                    type="password"
                    value={localConfig.keys.gemini || ''}
                    onChange={(e) => handleKeyChange('gemini', e.target.value)}
                    placeholder="AIzaSy..."
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Get your API key from Google AI Studio.</p>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Model</label>
                  <input
                    type="text"
                    value={localConfig.models?.gemini || 'gemini-2.5-flash'}
                    onChange={(e) => handleModelChange('gemini', e.target.value)}
                    placeholder="e.g. gemini-2.5-flash"
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none`}
                  />
                </div>
              </div>
            </div>
          )}

          {localConfig.activeProvider === 'groq' && (
            <div className="space-y-4">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <KeyIcon className="w-4 h-4 text-orange-500" />
                Groq Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>API Key</label>
                  <input
                    type="password"
                    value={localConfig.keys.groq || ''}
                    onChange={(e) => handleKeyChange('groq', e.target.value)}
                    placeholder="gsk_..."
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Get your API key from Groq Cloud.</p>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Model</label>
                  <input
                    type="text"
                    value={localConfig.models?.groq || 'llama3-8b-8192'}
                    onChange={(e) => handleModelChange('groq', e.target.value)}
                    placeholder="e.g. llama3-8b-8192"
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none`}
                  />
                </div>
              </div>
            </div>
          )}

          {localConfig.activeProvider === 'ollama-local' && (
            <div className="space-y-4">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <ServerIcon className="w-4 h-4 text-green-500" />
                Ollama Local Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Base URL</label>
                  <input
                    type="text"
                    value={localConfig.urls['ollama-local'] || ''}
                    onChange={(e) => handleUrlChange('ollama-local', e.target.value)}
                    placeholder="http://localhost:11434"
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Default: http://localhost:11434</p>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Model</label>
                  <input
                    type="text"
                    value={localConfig.models?.['ollama-local'] || 'llama3'}
                    onChange={(e) => handleModelChange('ollama-local', e.target.value)}
                    placeholder="e.g. llama3, mistral"
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Enter the name of your pulled model.</p>
                </div>
              </div>
            </div>
          )}

          {localConfig.activeProvider === 'ollama-cloud' && (
            <div className="space-y-4">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
                Ollama Cloud Configuration
              </h3>
              <div>
                <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Remote Server URL</label>
                <input
                  type="text"
                  value={localConfig.urls['ollama-cloud'] || ''}
                  onChange={(e) => handleUrlChange('ollama-cloud', e.target.value)}
                  placeholder="https://ollama.com"
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs mt-2 mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ollama cloud: <code>https://ollama.com</code> — API key from ollama.com/settings/keys</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>API Key</label>
                  <input
                    type="password"
                    value={localConfig.keys['ollama-cloud'] || ''}
                    onChange={(e) => handleKeyChange('ollama-cloud', e.target.value)}
                    placeholder="Bearer token..."
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Required for Cloud/Remote.</p>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Model</label>
                  <input
                    type="text"
                    value={localConfig.models?.['ollama-cloud'] || 'gemma4:31b-cloud'}
                    onChange={(e) => handleModelChange('ollama-cloud', e.target.value)}
                    placeholder="e.g. gemma4:31b-cloud, gemma4:12b"
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Cloud models use <code>-cloud</code> suffix (e.g. gemma4:31b-cloud).</p>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className={`p-4 sm:p-6 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
          <div className="flex-1">
            {saveStatus && (
              <span className="flex items-center text-sm text-green-500 font-medium">
                <CheckCircleIcon className="w-5 h-5 mr-1" />
                {saveStatus}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

AIProviderSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
};

export default AIProviderSettingsModal;
