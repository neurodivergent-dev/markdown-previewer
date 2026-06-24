import { createContext, useContext, useState, useEffect } from 'react';

const AIProviderContext = createContext();

export const AIProviderProvider = ({ children }) => {
  const [providerConfig, setProviderConfig] = useState(() => {
    const saved = localStorage.getItem('ai-provider-config');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      activeProvider: 'gemini', // 'gemini', 'groq', 'ollama-local', 'ollama-cloud'
      keys: {
        gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
        groq: '',
        'ollama-cloud': '',
      },
      urls: {
        'ollama-local': 'http://localhost:11434',
        'ollama-cloud': 'https://ollama.com',
      },
      models: {
        gemini: 'gemini-2.5-flash',
        groq: 'llama3-8b-8192',
        'ollama-local': 'llama3',
        'ollama-cloud': 'gemma4:31b-cloud',
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('ai-provider-config', JSON.stringify(providerConfig));
  }, [providerConfig]);

  const updateConfig = (newConfig) => {
    setProviderConfig(prev => ({
      ...prev,
      ...newConfig,
      keys: { ...prev.keys, ...(newConfig.keys || {}) },
      urls: { ...prev.urls, ...(newConfig.urls || {}) },
      models: { ...prev.models, ...(newConfig.models || {}) }
    }));
  };

  const setProvider = (provider) => {
    updateConfig({ activeProvider: provider });
  };

  const getApiKey = (provider) => {
    return providerConfig.keys[provider] || '';
  };

  const getBaseUrl = (provider) => {
    return providerConfig.urls[provider] || '';
  };

  const getProviderModel = (provider) => {
    return providerConfig.models?.[provider] || '';
  };

  return (
    <AIProviderContext.Provider value={{
      config: providerConfig,
      updateConfig,
      setProvider,
      getApiKey,
      getBaseUrl,
      getProviderModel
    }}>
      {children}
    </AIProviderContext.Provider>
  );
};

export const useAIProvider = () => {
  const context = useContext(AIProviderContext);
  if (!context) {
    throw new Error('useAIProvider must be used within an AIProviderProvider');
  }
  return context;
};
