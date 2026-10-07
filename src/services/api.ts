import { Transaction } from '../types/finance';

const API_BASE = '/api';

export async function fetchTransactions(filters?: {
  type?: string;
  category?: string;
  search?: string;
}): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);

  const url = `${API_BASE}/transactions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  return response.json();
}

export async function createTransaction(
  data: Omit<Transaction, 'id'> & { id?: string }
): Promise<Transaction> {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create transaction: ${response.statusText}`);
  }
  return response.json();
}

export async function updateTransaction(
  id: string,
  data: Partial<Transaction>
): Promise<Transaction> {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update transaction: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete transaction: ${response.statusText}`);
  }
}

export async function toggleSettled(id: string): Promise<Transaction> {
  const response = await fetch(`${API_BASE}/transactions/${id}/settled`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle settled: ${response.statusText}`);
  }
  return response.json();
}

export async function resetTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE}/transactions/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to reset transactions: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

export function getCSVDownloadUrl(type?: string): string {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.set('type', type);
  return `${API_BASE}/export/csv${params.toString() ? `?${params.toString()}` : ''}`;
}
