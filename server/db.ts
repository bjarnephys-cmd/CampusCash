import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../campuscash.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    is_shared INTEGER NOT NULL DEFAULT 0,
    split_between_count INTEGER DEFAULT 1,
    notes TEXT,
    settled INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface DBTransaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  is_shared: number;
  split_between_count: number | null;
  notes: string | null;
  settled: number;
  created_at?: string;
}

export interface TransactionDTO {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  is_shared: boolean;
  split_between_count?: number;
  notes?: string;
  settled?: boolean;
}

export const INITIAL_DATA: Omit<TransactionDTO, 'id'>[] = [
  {
    date: "2026-10-01",
    title: "SU Udbetaling",
    amount: 6820.00,
    type: "income",
    category: "SU/Job",
    is_shared: false
  },
  {
    date: "2026-10-01",
    title: "Husleje Kollegie",
    amount: 3200.00,
    type: "expense",
    category: "Bolig/Husleje",
    is_shared: false
  },
  {
    date: "2026-10-03",
    title: "Kantine Frokost",
    amount: 45.00,
    type: "expense",
    category: "Kantine/Mad",
    is_shared: false
  },
  {
    date: "2026-10-04",
    title: "Pensumbog i Mikroøkonomi",
    amount: 420.00,
    type: "expense",
    category: "Bøger/Pensum",
    is_shared: false
  },
  {
    date: "2026-10-05",
    title: "Snacks til Klubmøde",
    amount: 150.00,
    type: "expense",
    category: "Bytur/Socialt",
    is_shared: true,
    split_between_count: 3
  }
];

function formatRow(row: DBTransaction): TransactionDTO {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    amount: row.amount,
    type: row.type,
    category: row.category,
    is_shared: row.is_shared === 1,
    split_between_count: row.split_between_count || undefined,
    notes: row.notes || undefined,
    settled: row.settled === 1,
  };
}

export function seedInitialData() {
  const count = db.prepare('SELECT count(*) as count FROM transactions').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO transactions (id, date, title, amount, type, category, is_shared, split_between_count, notes, settled)
      VALUES (@id, @date, @title, @amount, @type, @category, @is_shared, @split_between_count, @notes, @settled)
    `);

    const insertMany = db.transaction((items) => {
      let idx = 101;
      for (const item of items) {
        insert.run({
          id: `tx-${idx++}`,
          date: item.date,
          title: item.title,
          amount: item.amount,
          type: item.type,
          category: item.category,
          is_shared: item.is_shared ? 1 : 0,
          split_between_count: item.split_between_count || 1,
          notes: item.notes || null,
          settled: item.settled ? 1 : 0,
        });
      }
    });

    insertMany(INITIAL_DATA);
  }
}

// Seed on startup if needed
seedInitialData();

export function getAllTransactions(filters?: { type?: string; category?: string; search?: string }): TransactionDTO[] {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters?.type && filters.type !== 'all') {
    if (filters.type === 'shared') {
      query += ' AND is_shared = 1 AND type = "expense"';
    } else {
      query += ' AND type = ?';
      params.push(filters.type);
    }
  }

  if (filters?.category && filters.category !== 'all') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.search) {
    query += ' AND (title LIKE ? OR category LIKE ? OR notes LIKE ?)';
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  const rows = db.prepare(query).all(...params) as DBTransaction[];
  return rows.map(formatRow);
}

export function getTransactionById(id: string): TransactionDTO | null {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as DBTransaction | undefined;
  return row ? formatRow(row) : null;
}

export function createTransaction(data: Omit<TransactionDTO, 'id'> & { id?: string }): TransactionDTO {
  const id = data.id || `tx-${Date.now().toString().slice(-6)}`;
  const stmt = db.prepare(`
    INSERT INTO transactions (id, date, title, amount, type, category, is_shared, split_between_count, notes, settled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.date,
    data.title,
    data.amount,
    data.type,
    data.category,
    data.is_shared ? 1 : 0,
    data.split_between_count || 1,
    data.notes || null,
    data.settled ? 1 : 0
  );

  return getTransactionById(id)!;
}

export function updateTransaction(id: string, data: Partial<TransactionDTO>): TransactionDTO | null {
  const current = getTransactionById(id);
  if (!current) return null;

  const merged = { ...current, ...data };
  const stmt = db.prepare(`
    UPDATE transactions 
    SET date = ?, title = ?, amount = ?, type = ?, category = ?, is_shared = ?, split_between_count = ?, notes = ?, settled = ?
    WHERE id = ?
  `);

  stmt.run(
    merged.date,
    merged.title,
    merged.amount,
    merged.type,
    merged.category,
    merged.is_shared ? 1 : 0,
    merged.split_between_count || 1,
    merged.notes || null,
    merged.settled ? 1 : 0,
    id
  );

  return getTransactionById(id);
}

export function deleteTransaction(id: string): boolean {
  const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return info.changes > 0;
}

export function toggleSettledTransaction(id: string): TransactionDTO | null {
  const current = getTransactionById(id);
  if (!current) return null;

  const newSettled = !current.settled;
  db.prepare('UPDATE transactions SET settled = ? WHERE id = ?').run(newSettled ? 1 : 0, id);
  return getTransactionById(id);
}

export function resetDatabase(): TransactionDTO[] {
  db.prepare('DELETE FROM transactions').run();
  seedInitialData();
  return getAllTransactions();
}
