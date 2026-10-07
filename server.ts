import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  toggleSettledTransaction,
  resetDatabase,
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// --- REST API ENDPOINTS ---

// 1. GET /api/transactions (with optional filters)
app.get('/api/transactions', (req: Request, res: Response) => {
  try {
    const { type, category, search } = req.query;
    const transactions = getAllTransactions({
      type: typeof type === 'string' ? type : undefined,
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// 2. GET /api/transactions/:id
app.get('/api/transactions/:id', (req: Request, res: Response) => {
  try {
    const transaction = getTransactionById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// 3. POST /api/transactions
app.post('/api/transactions', (req: Request, res: Response) => {
  try {
    const { title, amount, type, category, date, is_shared, split_between_count, notes, settled } = req.body;

    if (!title || typeof amount !== 'number' || !type || !category || !date) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be income or expense' });
    }

    const created = createTransaction({
      title,
      amount,
      type,
      category,
      date,
      is_shared: Boolean(is_shared),
      split_between_count: split_between_count ? Number(split_between_count) : 1,
      notes,
      settled: Boolean(settled),
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// 4. PUT /api/transactions/:id
app.put('/api/transactions/:id', (req: Request, res: Response) => {
  try {
    const updated = updateTransaction(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// 5. DELETE /api/transactions/:id
app.delete('/api/transactions/:id', (req: Request, res: Response) => {
  try {
    const success = deleteTransaction(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully', id: req.params.id });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// 6. PATCH /api/transactions/:id/settled
app.patch('/api/transactions/:id/settled', (req: Request, res: Response) => {
  try {
    const updated = toggleSettledTransaction(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('Error toggling settled state:', error);
    res.status(500).json({ error: 'Failed to update settled state' });
  }
});

// 7. POST /api/transactions/reset
app.post('/api/transactions/reset', (_req: Request, res: Response) => {
  try {
    const resetList = resetDatabase();
    res.json({ message: 'Database reset to initial test transactions', data: resetList });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// 8. GET /api/export/csv (CSV Export Endpoint)
app.get('/api/export/csv', (req: Request, res: Response) => {
  try {
    const { type, category } = req.query;
    const transactions = getAllTransactions({
      type: typeof type === 'string' ? type : undefined,
      category: typeof category === 'string' ? category : undefined,
    });

    const headers = [
      'ID',
      'Dato',
      'Beskrivelse',
      'Type',
      'Kategori',
      'Beloeb_DKK',
      'Er_Delt',
      'Antal_Personer',
      'Din_Andel_DKK',
      'Afregnet'
    ];

    const rows = transactions.map((t) => {
      const yourShare = t.is_shared && t.split_between_count && t.split_between_count > 0
        ? (t.amount / t.split_between_count).toFixed(2)
        : t.amount.toFixed(2);

      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.type}"`,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        t.is_shared ? 'Ja' : 'Nej',
        t.is_shared ? (t.split_between_count || 1) : 1,
        yourShare,
        t.settled ? 'Ja' : 'Nej'
      ].join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];

    // UTF-8 BOM + CSV content
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="campuscash_export_${today}.csv"`);
    res.send(bom + csvData);
  } catch (error: any) {
    console.error('Error generating CSV export:', error);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

// --- FRONTEND INTEGRATION (Vite Dev Server / Static Production) ---
async function startServer() {
  if (!isProduction) {
    // Dynamic import of Vite in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }

      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.use('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`CampusCash backend server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
