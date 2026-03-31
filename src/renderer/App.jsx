import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor, ImagePlus, Trash2, History } from 'lucide-react';
import DropZone from './components/DropZone';
import ImageGrid from './components/ImageGrid';
import SettingsPanel from './components/SettingsPanel';
import ConversionProgress from './components/ConversionProgress';
import HistoryPanel from './components/HistoryPanel';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [themeMode, setThemeMode] = useState('system');
  const [images, setImages] = useState([]);
  const [formats, setFormats] = useState([]);
  const [settings, setSettings] = useState({
    format: 'png',
    quality: 80,
    outputLocation: 'same',
    customOutputDir: null,
  });
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [view, setView] = useState('converter'); // 'converter' or 'history'

  // Initialize theme
  useEffect(() => {
    async function init() {
      const savedMode = (await window.electronAPI.getSetting('theme')) || 'system';
      setThemeMode(savedMode);

      if (savedMode === 'system') {
        const sys = await window.electronAPI.getSystemTheme();
        setTheme(sys);
      } else {
        setTheme(savedMode);
      }

      const fmts = await window.electronAPI.getOutputFormats();
      setFormats(fmts);

      const savedFormat = await window.electronAPI.getSetting('outputFormat');
      const savedQuality = await window.electronAPI.getSetting('quality');
      const savedLocation = await window.electronAPI.getSetting('outputLocation');
      const savedDir = await window.electronAPI.getSetting('customOutputDir');
      setSettings((s) => ({
        ...s,
        format: savedFormat || s.format,
        quality: savedQuality || s.quality,
        outputLocation: savedLocation || s.outputLocation,
        customOutputDir: savedDir || s.customOutputDir,
      }));
    }
    init();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const cleanup = window.electronAPI.onThemeChanged((newTheme) => {
      if (themeMode === 'system') setTheme(newTheme);
    });
    return cleanup;
  }, [themeMode]);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Listen for menu actions
  useEffect(() => {
    const cleanup = window.electronAPI.onMenuAction((action) => {
      if (action === 'add-images') handleAddImages();
    });
    return cleanup;
  }, []);

  // Listen for conversion progress
  useEffect(() => {
    const cleanup = window.electronAPI.onConversionProgress((data) => {
      setProgress(data);
    });
    return cleanup;
  }, []);

  const handleThemeChange = async (mode) => {
    setThemeMode(mode);
    await window.electronAPI.setSetting('theme', mode);
    if (mode === 'system') {
      const sys = await window.electronAPI.getSystemTheme();
      setTheme(sys);
    } else {
      setTheme(mode);
    }
  };

  const handleAddImages = useCallback(async () => {
    const newImages = await window.electronAPI.selectImages();
    if (newImages.length > 0) {
      setImages((prev) => {
        const existingPaths = new Set(prev.map((img) => img.path));
        const unique = newImages.filter((img) => !existingPaths.has(img.path));
        return [...prev, ...unique];
      });
      setResults(null);
    }
  }, []);

  const handleDropFiles = useCallback(async (filePaths) => {
    const newImages = [];
    for (const filePath of filePaths) {
      try {
        const info = await window.electronAPI.getImageInfo(filePath);
        newImages.push(info);
      } catch (err) {
        // Skip files that can't be read as images
      }
    }
    if (newImages.length > 0) {
      setImages((prev) => {
        const existingPaths = new Set(prev.map((img) => img.path));
        const unique = newImages.filter((img) => !existingPaths.has(img.path));
        return [...prev, ...unique];
      });
      setResults(null);
    }
  }, []);

  const handleRemoveImage = useCallback((path) => {
    setImages((prev) => prev.filter((img) => img.path !== path));
  }, []);

  const handleClearAll = useCallback(() => {
    setImages([]);
    setResults(null);
    setProgress(null);
  }, []);

  const handleSettingsChange = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await window.electronAPI.setSetting(key, value);
  }, []);

  const handleSelectOutputDir = useCallback(async () => {
    const dir = await window.electronAPI.selectOutputDir();
    if (dir) {
      setSettings((prev) => ({ ...prev, customOutputDir: dir, outputLocation: 'custom' }));
      await window.electronAPI.setSetting('customOutputDir', dir);
      await window.electronAPI.setSetting('outputLocation', 'custom');
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setResults(null);
    setProgress({ current: 0, total: images.length, status: 'starting' });

    try {
      const convResults = await window.electronAPI.convertImages(images, settings);
      setResults(convResults);
    } catch (err) {
      setResults([{ success: false, error: err.message }]);
    } finally {
      setIsConverting(false);
    }
  }, [images, settings]);

  const handleOpenOutputFolder = useCallback(async () => {
    if (results && results.length > 0) {
      const firstSuccess = results.find((r) => r.success);
      if (firstSuccess) {
        const folderPath = firstSuccess.outputPath.replace(/[/\\][^/\\]+$/, '');
        await window.electronAPI.openFolder(folderPath);
      }
    }
  }, [results]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <ImagePlus size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Image Converter</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setView(view === 'converter' ? 'history' : 'converter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              view === 'history'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            <History size={16} />
            History
          </button>

          {/* Theme toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5">
            {[
              { mode: 'light', icon: Sun },
              { mode: 'system', icon: Monitor },
              { mode: 'dark', icon: Moon },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`p-1.5 rounded-md transition-colors ${
                  themeMode === mode
                    ? 'bg-white dark:bg-slate-600 text-violet-600 dark:text-violet-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                aria-label={`${mode} theme`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'history' ? (
          <HistoryPanel />
        ) : (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Left: Images area */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
              {images.length === 0 ? (
                <DropZone onAddImages={handleAddImages} onDropFiles={handleDropFiles} />
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {images.length} {images.length === 1 ? 'image' : 'images'} selected
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddImages}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30 transition-colors"
                      >
                        <ImagePlus size={15} />
                        Add More
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={15} />
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Image grid */}
                  <div className="flex-1 overflow-y-auto">
                    <ImageGrid
                      images={images}
                      onRemove={handleRemoveImage}
                      results={results}
                    />
                  </div>
                </>
              )}

              {/* Progress / Results */}
              {(isConverting || results) && (
                <ConversionProgress
                  progress={progress}
                  results={results}
                  isConverting={isConverting}
                  onOpenFolder={handleOpenOutputFolder}
                />
              )}
            </div>

            {/* Right: Settings panel */}
            <SettingsPanel
              formats={formats}
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onSelectOutputDir={handleSelectOutputDir}
              onConvert={handleConvert}
              isConverting={isConverting}
              imageCount={images.length}
            />
          </div>
        )}
      </main>
    </div>
  );
}
