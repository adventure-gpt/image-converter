import { FolderOpen, ArrowRightLeft, Loader2 } from 'lucide-react';

export default function SettingsPanel({
  formats,
  settings,
  onSettingsChange,
  onSelectOutputDir,
  onConvert,
  isConverting,
  imageCount,
}) {
  const showQuality = settings.format !== 'gif';

  return (
    <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-5 flex flex-col gap-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
        Output Settings
      </h2>

      {/* Format selector */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
          Convert to
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => onSettingsChange('format', fmt.id)}
              className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                settings.format === fmt.id
                  ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-500'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600'
              }`}
            >
              {fmt.ext.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quality slider */}
      {showQuality && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Quality
            </label>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              {settings.quality}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={settings.quality}
            onChange={(e) => onSettingsChange('quality', parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-slate-200 dark:bg-slate-600 accent-violet-500 cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">Small file</span>
            <span className="text-[10px] text-slate-400">Best quality</span>
          </div>
        </div>
      )}

      {/* Output location */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
          Save to
        </label>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onSettingsChange('outputLocation', 'same')}
            className={`w-full px-3 py-2 text-xs text-left rounded-lg border transition-colors ${
              settings.outputLocation === 'same'
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-500'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600'
            }`}
          >
            Same folder as original
          </button>
          <button
            onClick={onSelectOutputDir}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg border transition-colors ${
              settings.outputLocation === 'custom'
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-500'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600'
            }`}
          >
            <FolderOpen size={14} />
            {settings.outputLocation === 'custom' && settings.customOutputDir
              ? settings.customOutputDir.split(/[/\\]/).pop()
              : 'Choose folder...'}
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Convert button */}
      <button
        onClick={onConvert}
        disabled={isConverting || imageCount === 0}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          isConverting || imageCount === 0
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]'
        }`}
      >
        {isConverting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Converting...
          </>
        ) : (
          <>
            <ArrowRightLeft size={18} />
            Convert {imageCount > 0 ? `${imageCount} ${imageCount === 1 ? 'Image' : 'Images'}` : ''}
          </>
        )}
      </button>
    </div>
  );
}
