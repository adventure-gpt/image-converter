import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Clock, ArrowRightLeft, TrendingDown } from 'lucide-react';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'Z');
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalConversions: 0, totalBytesSaved: 0 });

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const [h, s] = await Promise.all([
      window.electronAPI.getHistory(),
      window.electronAPI.getHistoryStats(),
    ]);
    setHistory(h);
    setStats(s);
  }

  async function handleClear() {
    await window.electronAPI.clearHistory();
    setHistory([]);
    setStats({ totalConversions: 0, totalBytesSaved: 0 });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col p-5"
    >
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
          <ArrowRightLeft size={15} className="text-violet-500" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            {stats.totalConversions} conversions
          </span>
        </div>
        {stats.totalBytesSaved > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <TrendingDown size={15} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {formatBytes(stats.totalBytesSaved)} saved
            </span>
          </div>
        )}
        <div className="flex-1" />
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Clear History
          </button>
        )}
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Clock size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              No conversions yet
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Your conversion history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {entry.original_name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">→</span>
                    <span className="text-sm text-violet-600 dark:text-violet-400 font-medium uppercase">
                      {entry.output_format}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatBytes(entry.original_size)} → {formatBytes(entry.output_size)}
                    </span>
                    {entry.width && entry.height && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {entry.width} x {entry.height}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {formatDate(entry.converted_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
