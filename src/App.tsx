import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, INITIAL_TRANSACTIONS } from './types/finance';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { SharedExpensesView } from './components/SharedExpensesView';
import { ExportView } from './components/ExportView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { 
  fetchTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  toggleSettled, 
  resetTransactions 
} from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [prefilledCategoryFilter, setPrefilledCategoryFilter] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load from Express backend on mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (err: any) {
      console.warn('API error, using initial dataset:', err);
      setApiError('Forbinder til server...');
      // Fallback to initial transactions
      setTransactions((prev) => (prev.length > 0 ? prev : INITIAL_TRANSACTIONS));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers wired to Express SQLite Backend
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id'> & { id?: string }
  ) => {
    try {
      if (txData.id) {
        // Update in backend
        const updated = await updateTransaction(txData.id, txData);
        setTransactions((prev) => prev.map((t) => (t.id === txData.id ? updated : t)));
      } else {
        // Create in backend
        const created = await createTransaction(txData);
        setTransactions((prev) => [created, ...prev]);
      }
    } catch (err: any) {
      console.error('Error saving transaction to backend:', err);
      // Fallback local update
      if (txData.id) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === txData.id ? ({ ...t, ...txData } as Transaction) : t))
        );
      } else {
        const fallback: Transaction = {
          ...txData,
          id: `tx-${Date.now().toString().slice(-5)}`,
        };
        setTransactions((prev) => [fallback, ...prev]);
      }
    } finally {
      setEditingTransaction(null);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting transaction from backend:', err);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleToggleSettled = async (id: string) => {
    try {
      const updated = await toggleSettled(id);
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      console.error('Error toggling settled on backend:', err);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, settled: !t.settled } : t))
      );
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Vil du nulstille SQLite databasen til de oprindelige 5 test-posteringer?')) {
      try {
        const resetList = await resetTransactions();
        setTransactions(resetList);
      } catch (err: any) {
        console.error('Error resetting backend data:', err);
        setTransactions(INITIAL_TRANSACTIONS);
      }
    }
  };

  const handleNavigateToTransactions = (categoryFilter?: string) => {
    if (categoryFilter) {
      setPrefilledCategoryFilter(categoryFilter);
    } else {
      setPrefilledCategoryFilter(null);
    }
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'transactions') {
            setPrefilledCategoryFilter(null);
          }
        }}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium">Henter data fra SQLite databasen...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                transactions={transactions}
                onOpenAddModal={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
                onNavigateToTransactions={handleNavigateToTransactions}
                onNavigateToShared={() => setActiveTab('shared')}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                onOpenAddModal={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                initialCategoryFilter={prefilledCategoryFilter}
              />
            )}

            {activeTab === 'shared' && (
              <SharedExpensesView
                transactions={transactions}
                onToggleSettled={handleToggleSettled}
                onAddTransaction={(tx) => handleSaveTransaction(tx)}
              />
            )}

            {activeTab === 'export' && (
              <ExportView transactions={transactions} />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Subtle footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">CampusCash</span>
            <span>·</span>
            <span>Studieøkonomi & SU-budget (Express + SQLite)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-600">{transactions.length} posteringer synkroniseret</span>
            <span>·</span>
            <button
              onClick={handleResetData}
              className="hover:text-slate-800 underline transition-colors"
            >
              Nulstil SQLite database
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
