import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Upload } from 'lucide-react';

export default function DropZone({ onAddImages, onDropFiles }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const paths = [];
      for (const file of files) {
        try {
          const filePath = window.electronAPI.getPathForFile(file);
          if (filePath) paths.push(filePath);
        } catch (err) {
          // Skip files we can't get paths for
        }
      }

      if (paths.length > 0) {
        onDropFiles(paths);
      }
    },
    [onDropFiles]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex items-center justify-center p-6"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onAddImages}
        className={`w-full max-w-xl cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]'
            : 'border-slate-300 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:border-violet-500 dark:hover:bg-violet-900/10'
        }`}
      >
        <motion.div
          animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center ${
            isDragging
              ? 'bg-violet-500 text-white'
              : 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
          }`}
        >
          {isDragging ? <Upload size={28} /> : <ImagePlus size={28} />}
        </motion.div>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {isDragging ? 'Drop images here' : 'Add images to convert'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Supports JPEG, PNG, WebP, AVIF, TIFF, GIF, SVG, and BMP
        </p>
      </div>
    </motion.div>
  );
}
