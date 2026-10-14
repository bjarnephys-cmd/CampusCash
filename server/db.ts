// db.ts (Tilpasset til PHP Backend via HTTP fetch)

const PHP_API_URL = 'https://bjarnephys.com/MySQL/transactions.php';

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

// Hjælpefunktion til at mappe MySQL dataformater til DTO
function formatRow(row: any): TransactionDTO {
  /*
  return {
    id: row.id,
    date: row.date,
    title: row.title,
  
        // Tving den til at være et rigtigt JavaScript-tal med Number()
    amount: row.amount !== undefined ? Number(row.amount) : 0,

    type: row.type,
    category: row.category,
    is_shared: Number(row.is_shared) === 1,
    split_between_count: row.split_between_count ? Number(row.split_between_count) : undefined,
    notes: row.notes || undefined,
    settled: Number(row.settled) === 1,
  };
 */
  return {
    ...row,
    amount: Number(row.amount) || 0,
    split_between_count: Number(row.split_between_count) || 1,
    is_shared: Number(row.is_shared) === 1 ? 1 : 0,
    settled: Number(row.settled) === 1 ? 1 : 0,
  };
}



export async function getAllTransactions(filters?: { type?: string; category?: string; 
  search?: string; is_shared?: boolean }): Promise<TransactionDTO[]> {
  const url = new URL(PHP_API_URL);
  url.searchParams.append('method', 'get');


  // Kun rigtige typer (income / expense)
  if (filters?.type && filters.type !== 'all') {
    url.searchParams.append('type', filters.type);
  }

  if (filters?.category && filters.category !== 'all') {
    url.searchParams.append('category', filters.category);
  }

  if (filters?.search) {
    url.searchParams.append('search', filters.search);
  }

  // Håndter is_shared som sit eget selvstændige filter
  if (filters?.is_shared) {
    url.searchParams.append('is_shared', '1');
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Fejl ved hentning af transaktioner fra PHP API');
  
  const json: any = await res.json();
  return (json.data || []).map(formatRow);
}

export async function getTransactionById(id: string): Promise<TransactionDTO | null> {
  const res = await fetch(`${PHP_API_URL}?method=get&id=${id}`);
  if (!res.ok) return null;
  
  const json: any = await res.json();
  const rows = json.data || [];
  if (rows.length === 0) return null;
  
  return formatRow(rows[0]);
}

export async function createTransaction(data: Omit<TransactionDTO, 'id'> & { id?: string }): Promise<TransactionDTO> {
  const res = await fetch(`${PHP_API_URL}?method=post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const json: any = await res.json();
  if (!res.ok) throw new Error(json.error || 'Fejl ved oprettelse af transaktion');
  
  return formatRow(json.transaction);
}

export async function updateTransaction(id: string, data: Partial<TransactionDTO>): Promise<TransactionDTO | null> {
  const current = await getTransactionById(id);
  if (!current) return null;

  const merged = { ...current, ...data };
  const res = await fetch(`${PHP_API_URL}?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(merged)
  });
  
  const json: any = await res.json();
  if (!res.ok) return null;
  
  return formatRow(json.transaction);
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const res = await fetch(`${PHP_API_URL}?id=${id}`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function toggleSettledTransaction(id: string): Promise<TransactionDTO | null> {
  const current = await getTransactionById(id);
  if (!current) return null;

  const newSettled = !current.settled;
  return updateTransaction(id, { settled: newSettled });
}

export async function resetDatabase(): Promise<TransactionDTO[]> {
  // Sletter evt. ikke alt automatisk, men returnerer blot aktuelle data
  return getAllTransactions();
}