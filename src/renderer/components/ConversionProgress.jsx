import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, FolderOpen } from 'lucide-react';

export default function ConversionProgress({ progress, results, isConverting, onOpenFolder }) {
  if (!progress && !results) return null;

  const successCount = results ? results.filter((r) => r.success).length : 0;
  const failCount = results ? results.filter((r) => !r.success).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
    >
      {isConverting && progress ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Converting {progress.fileName}...
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.current / progress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      ) : results ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {failCount === 0 ? (
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {failCount === 0
                  ? `All ${successCount} ${successCount === 1 ? 'image' : 'images'} converted!`
                  : `${successCount} converted, ${failCount} failed`}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30 transition-colors"
          >
            <FolderOpen size={15} />
            Open Folder
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
