const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite local database at:', dbPath);
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE,
        customer_phone TEXT NOT NULL,
        customer_name TEXT,
        address TEXT,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        payment_status TEXT DEFAULT 'PENDING',
        payment_ref TEXT,
        accurate_so_no TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Complaints table
    db.run(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_no TEXT UNIQUE,
        customer_phone TEXT NOT NULL,
        complaint_text TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'OPEN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payment receipts (Anti-Fraud protection)
    db.run(`
      CREATE TABLE IF NOT EXISTS payment_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref_id TEXT UNIQUE,
        order_no TEXT,
        bank_name TEXT,
        sender_name TEXT,
        amount INTEGER,
        is_verified INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customer conversational sessions (State machine)
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        customer_phone TEXT PRIMARY KEY,
        step TEXT,
        data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

// Helper methods with Promises
const dbHelper = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, dbHelper };
