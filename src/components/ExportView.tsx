import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Code, 
  FileText, 
  Filter, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { generateCSV, downloadCSV, formatCurrency } from '../utils/formatters';

interface ExportViewProps {
  transactions: Transaction[];
}

export const ExportView: React.FC<ExportViewProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'shared'>('all');
  const [activeFormat, setActiveFormat] = useState<'csv' | 'json'>('csv');
  const [copied, setCopied] = useState(false);

  // Filter transactions for export
  const exportData = transactions.filter((t) => {
    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'shared') return t.is_shared;
    return true;
  });

  const csvContent = generateCSV(exportData);
  const jsonContent = JSON.stringify(exportData, null, 2);

  const handleDownloadCSV = () => {
    // Direct call to Express backend CSV REST endpoint
    const url = `/api/export/csv${filterType !== 'all' ? `?type=${filterType}` : ''}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campuscash_export_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const today = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campuscash_data_${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyContent = () => {
    const content = activeFormat === 'csv' ? csvContent : jsonContent;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Eksportér Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download dit SU-regnskab som CSV til Excel, Google Sheets eller som struktureret JSON
          </p>
        </div>

        {/* Primary Download Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV ({exportData.length} rækker)</span>
          </button>
        </div>
      </div>

      {/* Export Configuration Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Filtrering før download</h3>
            <p className="text-xs text-slate-500 mt-0.5">Vælg hvilke posteringer der skal medtages</p>
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alle ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterType === 'expense'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kun udgifter
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterType === 'income'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kun indtægter
            </button>
            <button
              onClick={() => setFilterType('shared')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterType === 'shared'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fællesudlæg
            </button>
          </div>
        </div>

        {/* Format Selector & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFormat('csv')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                activeFormat === 'csv'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Format (Excel / Sheets)</span>
            </button>

            <button
              onClick={() => setActiveFormat('json')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                activeFormat === 'json'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Format (Rå data)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContent}
              className="inline-flex items-center gap-1 px-3 py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kopieret til udklipsholder!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopier {activeFormat.toUpperCase()}</span>
                </>
              )}
            </button>

            {activeFormat === 'json' && (
              <button
                onClick={handleDownloadJSON}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Gem JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Visning af output:</span>
            <span className="font-mono text-[11px]">UTF-8 kodet · DKK valuta</span>
          </div>

          {activeFormat === 'csv' ? (
            <div className="border border-slate-200 rounded-lg overflow-x-auto bg-slate-50 max-h-96 text-xs">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-200/70 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Dato</th>
                    <th className="py-2 px-3">Beskrivelse</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3 text-right">Beløb (DKK)</th>
                    <th className="py-2 px-3 text-center">Er Delt</th>
                    <th className="py-2 px-3 text-right">Din Andel (DKK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 bg-white">
                  {exportData.map((row) => {
                    const yourShare = row.is_shared && row.split_between_count
                      ? (row.amount / row.split_between_count).toFixed(2)
                      : row.amount.toFixed(2);

                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-500">{row.id}</td>
                        <td className="py-1.5 px-3 text-slate-700 whitespace-nowrap">{row.date}</td>
                        <td className="py-1.5 px-3 text-slate-900 font-sans font-medium">{row.title}</td>
                        <td className="py-1.5 px-3 text-slate-600">{row.type}</td>
                        <td className="py-1.5 px-3 text-slate-600 whitespace-nowrap">{row.category}</td>
                        <td className="py-1.5 px-3 text-right text-slate-900 font-semibold">
                          {row.amount.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-600">
                          {row.is_shared ? `Ja (${row.split_between_count})` : 'Nej'}
                        </td>
                        <td className="py-1.5 px-3 text-right text-slate-700 font-medium">
                          {yourShare}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg overflow-x-auto max-h-96">
              {jsonContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
