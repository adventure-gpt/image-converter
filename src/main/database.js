const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');

const dbPath = path.join(app.getPath('userData'), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Create tables on first run
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS conversions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    original_format TEXT,
    original_size INTEGER,
    output_name TEXT NOT NULL,
    output_format TEXT NOT NULL,
    output_size INTEGER,
    width INTEGER,
    height INTEGER,
    converted_at TEXT DEFAULT (datetime('now'))
  );
`;
db.prepare(createTableSQL).run();

function logConversion(data) {
  const stmt = db.prepare(`
    INSERT INTO conversions (original_name, original_format, original_size, output_name, output_format, output_size, width, height)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.originalName,
    data.originalFormat,
    data.originalSize,
    data.outputName,
    data.outputFormat,
    data.outputSize,
    data.width,
    data.height
  );
}

function getHistory(limit = 50) {
  return db.prepare('SELECT * FROM conversions ORDER BY converted_at DESC LIMIT ?').all(limit);
}

function clearHistory() {
  return db.prepare('DELETE FROM conversions').run();
}

function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM conversions').get();
  const totalSaved = db.prepare(
    'SELECT SUM(original_size - output_size) as saved FROM conversions WHERE output_size < original_size'
  ).get();
  return {
    totalConversions: total.count,
    totalBytesSaved: totalSaved.saved || 0,
  };
}

function close() {
  db.close();
}

module.exports = { logConversion, getHistory, clearHistory, getStats, close };
