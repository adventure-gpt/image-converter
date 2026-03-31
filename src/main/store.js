const Store = require('electron-store');

const store = new Store({
  defaults: {
    theme: 'system',
    windowBounds: { width: 1100, height: 750 },
    outputFormat: 'png',
    quality: 80,
    outputLocation: 'same', // 'same' = same as source, or a custom path
    customOutputDir: null,
  },
  schema: {
    theme: { type: 'string', enum: ['light', 'dark', 'system'] },
    outputFormat: { type: 'string' },
    quality: { type: 'number', minimum: 1, maximum: 100 },
    outputLocation: { type: 'string' },
  },
});

module.exports = { store };
