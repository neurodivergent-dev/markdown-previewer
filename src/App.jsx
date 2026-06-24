import { useState, useEffect, useCallback, useRef } from "react";
import MarkdownEditor from "./components/MarkdownEditor";
import MarkdownPreview from "./components/MarkdownPreview";
import Toolbar from "./components/Toolbar";
import Settings from "./components/Settings";
import AIAssistant from "./components/AIAssistant";
import AIProviderSettingsModal from "./components/AIProviderSettingsModal";
import KeyboardShortcutsPanel from "./components/KeyboardShortcutsPanel";
import ThemeCustomizer from "./components/ThemeCustomizer";
import VersionHistory from "./components/VersionHistory";
import TabBar from "./components/TabBar";
import UserMenu from "./components/Auth/UserMenu";
import LoginModal from "./components/Auth/LoginModal";
import RegisterModal from "./components/Auth/RegisterModal";
import ResetPasswordModal from "./components/Auth/ResetPasswordModal";
import AccountSettings from "./components/Auth/AccountSettings";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { useAuth } from "./contexts/AuthContext";
import {
  SunIcon,
  MoonIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const DEFAULT_MARKDOWN = "# Welcome!\n\nWrite markdown here...";

function App() {
  // Auth
  const { user, syncToCloud, fetchFromCloud, mergeLocalAndCloudTabs, syncSingleTabToCloud, deleteTabFromCloudById } = useAuth();

  // Tabs State Management
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem("markdown-tabs");
    if (saved) {
      return JSON.parse(saved);
    }
    return [{
      id: `tab-${Date.now()}`,
      name: 'Untitled 1',
      content: DEFAULT_MARKDOWN
    }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem("active-tab-id");
    return saved || tabs[0]?.id;
  });

  // Get current tab
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const markdown = activeTab?.content || DEFAULT_MARKDOWN;

  const setMarkdown = (content) => {
    setTabs(prevTabs => {
      const updatedTabs = prevTabs.map(tab =>
        tab.id === activeTabId ? { ...tab, content } : tab
      );

      // Sync only the changed tab to cloud (debounced via useRef)
      if (user) {
        const changedTab = updatedTabs.find(tab => tab.id === activeTabId);
        if (changedTab) {
          // Clear previous timeout
          if (window.syncTimeoutId) clearTimeout(window.syncTimeoutId);
          // Debounce sync for 2 seconds
          window.syncTimeoutId = setTimeout(() => {
            syncSingleTabToCloud(changedTab);
          }, 2000);
        }
      }

      return updatedTabs;
    });
  };

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("markdown-theme");
    return saved ? JSON.parse(saved) : true;
  });

  // Mobile menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Responsive states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [orientation, setOrientation] = useState(
    window.screen.orientation?.type || "portrait"
  );

  // Editor and Preview states
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("markdown-settings");
    return saved
      ? JSON.parse(saved)
      : {
          fontSize: "medium",
          previewStyle: "default",
          showLineNumbers: true,
          autoSave: true,
          editorHeight: "auto",
          syncScroll: true,
          showToolbar: true,
        };
  });

  // AI Assistant state
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const editorRef = useRef(null);
  
  // Sync scrolling refs
  const editorScrollRef = useRef(null);
  const previewScrollRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Keyboard Shortcuts Panel state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Theme Customizer state
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);

  // Version History state (per tab)
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [tabVersions, setTabVersions] = useState(() => {
    const saved = localStorage.getItem("tab-versions");
    return saved ? JSON.parse(saved) : {};
  });

  // Get versions for active tab
  const versions = tabVersions[activeTabId] || [];

  // Auth Modal States
  const [authModal, setAuthModal] = useState(''); // 'login', 'register', 'reset', 'account', ''

  // Custom theme handler
  const handleThemeChange = useCallback((theme) => {
    // Apply custom theme to settings
    setSettings(prev => ({
      ...prev,
      customTheme: theme,
      previewStyle: 'custom',
    }));
  }, []);

  // Tab Management Functions
  const handleTabAdd = useCallback(() => {
    const newTab = {
      id: `tab-${Date.now()}`,
      name: `Untitled ${tabs.length + 1}`,
      content: DEFAULT_MARKDOWN
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);

    // Sync new tab to cloud
    if (user) {
      syncSingleTabToCloud(newTab);
    }
  }, [tabs.length, user, syncSingleTabToCloud]);

  const handleTabClose = useCallback((tabId) => {
    if (tabs.length === 1) return; // Don't close last tab

    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    // Delete tab from cloud
    if (user) {
      deleteTabFromCloudById(tabId);
    }

    // Remove version history for this tab
    setTabVersions(prev => {
      const updated = { ...prev };
      delete updated[tabId];
      localStorage.setItem("tab-versions", JSON.stringify(updated));
      return updated;
    });

    // Switch to adjacent tab if closing active tab
    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  }, [tabs, activeTabId, user, deleteTabFromCloudById]);

  const handleTabRename = useCallback((tabId, newName) => {
    setTabs(prev => {
      const updatedTabs = prev.map(tab =>
        tab.id === tabId ? { ...tab, name: newName } : tab
      );

      // Sync the renamed tab to cloud
      if (user) {
        const renamedTab = updatedTabs.find(tab => tab.id === tabId);
        if (renamedTab) {
          syncSingleTabToCloud(renamedTab);
        }
      }

      return updatedTabs;
    });
  }, [user, syncSingleTabToCloud]);

  // Version Management (per tab)
  const handleSaveVersion = useCallback((name) => {
    const newVersion = {
      id: `version-${Date.now()}`,
      name,
      content: markdown,
      timestamp: Date.now(),
      isAutoSave: false,
    };

    const updatedVersions = [newVersion, ...versions];
    setTabVersions(prev => {
      const updated = {
        ...prev,
        [activeTabId]: updatedVersions
      };
      localStorage.setItem("tab-versions", JSON.stringify(updated));
      return updated;
    });
  }, [markdown, versions, activeTabId]);

  const handleRestoreVersion = useCallback((version) => {
    setMarkdown(version.content);
  }, []);

  const handleDeleteVersion = useCallback((versionId) => {
    const updatedVersions = versions.filter(v => v.id !== versionId);
    setTabVersions(prev => {
      const updated = {
        ...prev,
        [activeTabId]: updatedVersions
      };
      localStorage.setItem("tab-versions", JSON.stringify(updated));
      return updated;
    });
  }, [versions, activeTabId]);

  // Save versions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("tab-versions", JSON.stringify(tabVersions));
  }, [tabVersions]);

  // Responsive Layout Management
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
    if (window.screen.orientation) {
      setOrientation(window.screen.orientation.type);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener("change", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener("change", handleResize);
      }
    };
  }, [handleResize]);

  // LocalStorage Effects
  useEffect(() => {
    localStorage.setItem("markdown-tabs", JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem("active-tab-id", activeTabId);
  }, [activeTabId]);

  useEffect(() => {
    localStorage.setItem("markdown-theme", JSON.stringify(isDark));
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("markdown-settings", JSON.stringify(settings));
  }, [settings]);

  // Auto-save Effect
  useEffect(() => {
    if (settings.autoSave) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("markdown-tabs", JSON.stringify(tabs));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [tabs, settings.autoSave]);

  // Cloud Sync: Fetch tabs on login
  useEffect(() => {
    const syncOnLogin = async () => {
      if (user) {
        const cloudTabs = await fetchFromCloud();
        if (cloudTabs && cloudTabs.length > 0) {
          const localTabs = tabs;
          const mergedTabs = mergeLocalAndCloudTabs(localTabs, cloudTabs);
          setTabs(mergedTabs);
          if (mergedTabs.length > 0) {
            setActiveTabId(mergedTabs[0].id);
          }
        }
      }
    };

    syncOnLogin();
  }, [user?.id]); // Only run when user logs in/out

  // Note: Individual tab syncing is now handled in:
  // - setMarkdown() for content changes
  // - handleTabRename() for name changes
  // - handleTabAdd() for new tabs
  // - handleTabClose() for deletions

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check for "?" key (Shift + /)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in input/textarea
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsShortcutsOpen(true);
        }
        return;
      }

      // Alt+T for new tab, Alt+W for close tab
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "t":
            e.preventDefault();
            handleTabAdd();
            break;
          case "w":
            if (tabs.length > 1) {
              e.preventDefault();
              handleTabClose(activeTabId);
            }
            break;
          default:
            break;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            localStorage.setItem("markdown-tabs", JSON.stringify(tabs));
            break;
          case "b":
            e.preventDefault();
            setIsEditorExpanded((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [tabs, activeTabId, handleTabAdd, handleTabClose]);

  const toggleFullScreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
      }
    } catch (error) {
      console.error("Fullscreen mode failed:", error);
    }
  }, []);

  // AI Assistant handlers
  const handleOpenAI = useCallback(() => {
    // Get selected text from textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = markdown.substring(start, end);
      setSelectedText(selected);
    }
    setIsAIOpen(true);
  }, [markdown]);

  const handleInsertAIText = useCallback((text, replace = false) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      let newText;
      let newCursorPos;

      if (replace === 'replaceAll') {
        // Replace entire document
        newText = text;
        newCursorPos = text.length;
      } else if (replace && start !== end) {
        // Replace selected text
        newText = markdown.substring(0, start) + text + markdown.substring(end);
        newCursorPos = start + text.length;
      } else {
        // Insert below selected text or at cursor
        newText = markdown.substring(0, end) + '\n\n' + text + markdown.substring(end);
        newCursorPos = end + text.length + 2;
      }

      setMarkdown(newText);

      // Set cursor position after state update
      setTimeout(() => {
        const updatedTextarea = document.querySelector('textarea');
        if (updatedTextarea) {
          updatedTextarea.focus();
          updatedTextarea.setSelectionRange(newCursorPos, newCursorPos);
          updatedTextarea.scrollTop = updatedTextarea.scrollHeight; // Scroll to bottom
        }
      }, 0);
    }
  }, [markdown]);

  // F11 key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullScreen();
      }
    };

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [toggleFullScreen]);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDark
          ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white"
          : "bg-gradient-to-br from-slate-100 to-white text-slate-900"
      } transition-colors duration-200`}
    >
      {/* Main content area */}
      <main className="flex-grow flex flex-col">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 max-w-[1440px] relative flex flex-col flex-grow">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  aria-label="Markdown Previewer Logo"
                >
                  <rect
                    width="100"
                    height="100"
                    rx="20"
                    fill={isDark ? "#1e293b" : "#f1f5f9"}
                  />
                  <path d="M30 25h40v10H30z" fill="#a855f7" />
                  <path d="M30 40h40v10H30z" fill="#a855f7" />
                  <path d="M30 55h40v10H30z" fill="#a855f7" />
                  <rect
                    x="22.5"
                    y="22.5"
                    width="55"
                    height="55"
                    rx="15"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                  />
                </svg>
                <h1
                  className={`text-xl sm:text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${
                    isDark
                      ? "from-purple-400 to-pink-600"
                      : "from-purple-600 to-pink-800"
                  }`}
                >
                  Markdown Previewer
                </h1>
              </div>

              {/* Mobile hamburger menu button */}
              {isMobile && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                      : "bg-slate-200 hover:bg-slate-300 active:bg-slate-400"
                  } ml-auto`}
                >
                  {isMenuOpen ? (
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              )}
            </div>

            {/* Toolbar & Settings (desktop: always visible, mobile: in hamburger menu) */}
            {!isMobile && (
              <div className="flex flex-nowrap items-center gap-2 sm:gap-4 justify-end w-full sm:w-auto">
                <Toolbar
                  markdown={markdown}
                  setMarkdown={setMarkdown}
                  isDark={isDark}
                  isMobile={isMobile}
                  onOpenAI={handleOpenAI}
                  settings={settings}
                  tabs={tabs}
                  activeTabId={activeTabId}
                />
                <div className="hidden sm:block h-6 w-px bg-slate-600/50" />
                <Settings
                  isDark={isDark}
                  settings={settings}
                  onSettingsChange={setSettings}
                  isMobile={isMobile}
                  orientation={orientation}
                />
                <div className="hidden sm:block h-6 w-px bg-slate-600/50" />
                <UserMenu
                  isDark={isDark}
                  onOpenLogin={() => setAuthModal('login')}
                  onOpenAccountSettings={() => setAuthModal('account')}
                />

                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                      : "bg-slate-200 hover:bg-slate-300 active:bg-slate-400"
                  }`}
                  title={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                  aria-label={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDark ? (
                    <SunIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullScreen}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                      : "bg-slate-200 hover:bg-slate-300 active:bg-slate-400"
                  }`}
                  title={
                    isFullScreen
                      ? "Exit full screen (F11)"
                      : "Enter full screen (F11)"
                  }
                  aria-label={
                    isFullScreen ? "Exit full screen" : "Enter full screen"
                  }
                >
                  {isFullScreen ? (
                    <ArrowsPointingInIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobile && isMenuOpen && (
            <div
              className={`flex flex-col gap-3 mb-4 ${
                isDark ? "bg-slate-800" : "bg-slate-200"
              } p-4 rounded-lg`}
            >
              {/* Panel Header and Close Button */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Quick Actions</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                      : "bg-slate-300 hover:bg-slate-400 active:bg-slate-500"
                  }`}
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <hr
                className={`border-1 ${
                  isDark ? "border-slate-700" : "border-slate-300"
                }`}
              />

              {/* Editor Tools */}
              <div className="flex flex-col gap-2">
                <span className="font-medium text-base">Editor Tools</span>
                <Toolbar
                  markdown={markdown}
                  setMarkdown={setMarkdown}
                  isDark={isDark}
                  isMobile={isMobile}
                  isFullScreen={isEditorExpanded}
                  onFullScreenToggle={toggleFullScreen}
                  onOpenAI={handleOpenAI}
                  settings={settings}
                  tabs={tabs}
                  activeTabId={activeTabId}
                />
              </div>

              <hr
                className={`border-1 ${
                  isDark ? "border-slate-700" : "border-slate-300"
                }`}
              />

              {/* Settings */}
              <div className="flex flex-col gap-2">
                <span className="font-medium text-base">Settings</span>
                <Settings
                  isDark={isDark}
                  settings={settings}
                  onSettingsChange={setSettings}
                  isMobile={isMobile}
                  orientation={orientation}
                />
              </div>

              <hr
                className={`border-1 ${
                  isDark ? "border-slate-700" : "border-slate-300"
                }`}
              />

              {/* User Account */}
              <div className="flex flex-col gap-2">
                <span className="font-medium text-base">Account</span>
                <UserMenu
                  isDark={isDark}
                  onOpenLogin={() => setAuthModal('login')}
                  onOpenAccountSettings={() => setAuthModal('account')}
                />
              </div>

              <hr
                className={`border-1 ${
                  isDark ? "border-slate-700" : "border-slate-300"
                }`}
              />

              {/* Other Buttons */}
              <div className="flex gap-3">
                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`flex items-center justify-center p-2 w-full rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                      : "bg-slate-300 hover:bg-slate-400 active:bg-slate-500"
                  }`}
                  title={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                  aria-label={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDark ? (
                    <>
                      <SunIcon className="w-5 h-5 mr-1" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <MoonIcon className="w-5 h-5 mr-1" />
                      Dark Mode
                    </>
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className={`flex items-center justify-center p-2 w-full rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 active:bg-slate-500"
                      : "bg-slate-300 hover:bg-slate-400 active:bg-slate-500"
                  }`}
                  title={
                    isEditorExpanded ? "Exit full screen" : "Enter full screen"
                  }
                  aria-label={
                    isEditorExpanded ? "Exit full screen" : "Enter full screen"
                  }
                >
                  {isEditorExpanded ? (
                    <>
                      <ArrowsPointingInIcon className="w-5 h-5 mr-1" />
                      Exit Full
                    </>
                  ) : (
                    <>
                      <ArrowsPointingOutIcon className="w-5 h-5 mr-1" />
                      Full Screen
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
            onTabClose={handleTabClose}
            onTabAdd={handleTabAdd}
            onTabRename={handleTabRename}
            isDark={isDark}
          />

          {/* Main Content Area */}
          <div className="flex-grow flex flex-col mt-2">
            <div
              className={`grid gap-3 sm:gap-4 md:gap-6 ${
                !isEditorExpanded && !isPreviewExpanded
                  ? "grid-cols-1 lg:grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {!isPreviewExpanded && (
                <MarkdownEditor
                  markdown={markdown}
                  setMarkdown={setMarkdown}
                  isDark={isDark}
                  settings={settings}
                  isFullScreen={isEditorExpanded}
                  onFullScreenToggle={() => {
                    setIsEditorExpanded(!isEditorExpanded);
                    if (isPreviewExpanded) setIsPreviewExpanded(false);
                  }}
                  editorScrollRef={editorScrollRef}
                  previewScrollRef={previewScrollRef}
                  isScrollingRef={isScrollingRef}
                />
              )}
              {!isEditorExpanded && (
                <MarkdownPreview
                  markdown={markdown}
                  isDark={isDark}
                  settings={settings}
                  isFullScreen={isPreviewExpanded}
                  onFullScreenToggle={() => {
                    setIsPreviewExpanded(!isPreviewExpanded);
                    if (isEditorExpanded) setIsEditorExpanded(false);
                  }}
                  editorScrollRef={editorScrollRef}
                  previewScrollRef={previewScrollRef}
                  isScrollingRef={isScrollingRef}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* AI Assistant Modal */}
      <AIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        selectedText={selectedText}
        markdown={markdown}
        onInsertText={handleInsertAIText}
        darkMode={isDark}
        onOpenSettings={() => setIsAISettingsOpen(true)}
      />

      {/* AI Provider Settings Modal */}
      <AIProviderSettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        darkMode={isDark}
      />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isDark={isDark}
      />

      {/* Theme Customizer */}
      <ThemeCustomizer
        isOpen={isThemeCustomizerOpen}
        onClose={() => setIsThemeCustomizerOpen(false)}
        isDark={isDark}
        onThemeChange={handleThemeChange}
      />

      {/* Version History */}
      <VersionHistory
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        versions={versions}
        onRestore={handleRestoreVersion}
        onDelete={handleDeleteVersion}
        onSaveVersion={handleSaveVersion}
        currentMarkdown={markdown}
        isDark={isDark}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt isDark={isDark} />

      {/* Auth Modals */}
      <LoginModal
        isOpen={authModal === 'login'}
        onClose={() => setAuthModal('')}
        isDark={isDark}
        onSwitchToRegister={() => setAuthModal('register')}
        onSwitchToReset={() => setAuthModal('reset')}
      />

      <RegisterModal
        isOpen={authModal === 'register'}
        onClose={() => setAuthModal('')}
        isDark={isDark}
        onSwitchToLogin={() => setAuthModal('login')}
      />

      <ResetPasswordModal
        isOpen={authModal === 'reset'}
        onClose={() => setAuthModal('')}
        isDark={isDark}
        onSwitchToLogin={() => setAuthModal('login')}
      />

      <AccountSettings
        isOpen={authModal === 'account'}
        onClose={() => setAuthModal('')}
        isDark={isDark}
      />

      {/* Footer */}
      <footer
        className={`mt-auto py-4 sm:py-6 ${
          isDark ? "bg-slate-900/50" : "bg-white/50"
        } backdrop-blur-sm border-t ${
          isDark ? "border-slate-800" : "border-slate-200"
        } transition-colors duration-200`}
      >
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
              <span
                className={`${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Made with
              </span>
              <span
                role="img"
                aria-label="heart"
                className="text-red-500 animate-pulse"
              >
                ❤️
              </span>
              <span
                className={`${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                by
              </span>
              <a
                href="https://github.com/melihcanndemir"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium transition-colors duration-200 ${
                  isDark
                    ? "text-purple-400 hover:text-purple-300"
                    : "text-purple-600 hover:text-purple-500"
                }`}
              >
                Melih Can Demir
              </a>
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                onClick={() => setIsThemeCustomizerOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 ${
                  isDark
                    ? "bg-pink-900/30 hover:bg-pink-800/40 text-pink-300 border border-pink-700/50"
                    : "bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-300"
                }`}
                title="Customize preview theme"
                aria-label="Customize preview theme"
              >
                <span className="text-lg">🎨</span>
                <span className="font-medium text-sm sm:text-base">
                  Theme Customizer
                </span>
              </button>

              <button
                onClick={() => setIsShortcutsOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 ${
                  isDark
                    ? "bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 border border-purple-700/50"
                    : "bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300"
                }`}
                title="View keyboard shortcuts (Press ?)"
                aria-label="View keyboard shortcuts"
              >
                <span className="text-lg">⌨️</span>
                <span className="font-medium text-sm sm:text-base">
                  Keyboard Shortcuts
                </span>
                <kbd className={`hidden sm:inline px-1.5 py-0.5 text-xs rounded ${
                  isDark ? "bg-purple-900 text-purple-300" : "bg-purple-200 text-purple-800"
                }`}>
                  ?
                </kbd>
              </button>

              <button
                onClick={() => setIsVersionHistoryOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 ${
                  isDark
                    ? "bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-700/50"
                    : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                }`}
                title="View version history"
                aria-label="View version history"
              >
                <ClockIcon className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">
                  Version History
                </span>
                <span className={`hidden sm:inline px-1.5 py-0.5 text-xs rounded ${
                  isDark ? "bg-blue-900 text-blue-300" : "bg-blue-200 text-blue-800"
                }`}>
                  {versions.length}
                </span>
              </button>

              <a
                href="https://github.com/melihcanndemir/markdown-previewer"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">
                  View on GitHub
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
