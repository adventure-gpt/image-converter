import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function ImageCard({ image, onRemove, result }) {
  const statusColor = result
    ? result.success
      ? 'ring-emerald-400 dark:ring-emerald-500'
      : 'ring-red-400 dark:ring-red-500'
    : 'ring-transparent';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`relative group rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ring-2 ${statusColor}`}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden">
        <img
          src={image.thumbnail}
          alt={image.name}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate" title={image.name}>
          {image.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {image.width} x {image.height}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatBytes(image.size)}
          </span>
        </div>
        {result && (
          <div className="flex items-center gap-1 mt-1.5">
            {result.success ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Converted {result.outputSize ? `(${formatBytes(result.outputSize)})` : ''}
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-[11px] text-red-500">Failed</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.path);
        }}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        aria-label={`Remove ${image.name}`}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function ImageGrid({ images, onRemove, results }) {
  const resultMap = {};
  if (results) {
    results.forEach((r) => {
      resultMap[r.originalName] = r;
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      <AnimatePresence mode="popLayout">
        {images.map((img) => (
          <ImageCard
            key={img.path}
            image={img}
            onRemove={onRemove}
            result={resultMap[img.name]}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
