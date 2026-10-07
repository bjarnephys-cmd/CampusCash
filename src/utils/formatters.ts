import { Transaction } from '../types/finance';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return new Intl.DateTimeFormat('da-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function generateCSV(transactions: Transaction[]): string {
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

  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadCSV(csvContent: string, fileName = 'campuscash_export.csv'): void {
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
