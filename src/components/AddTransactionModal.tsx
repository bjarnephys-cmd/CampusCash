import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Users, Calendar, Tag, FileText } from 'lucide-react';
import { Transaction, TransactionType, STUDENT_CATEGORIES } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  initialData?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>(STUDENT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      if (STUDENT_CATEGORIES.includes(initialData.category)) {
        setCategory(initialData.category);
        setCustomCategory('');
      } else {
        setCategory('Anden');
        setCustomCategory(initialData.category);
      }
      setDate(initialData.date);
      setIsShared(initialData.is_shared);
      setSplitCount(initialData.split_between_count || 3);
      setNotes(initialData.notes || '');
    } else {
      // Default reset
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory(STUDENT_CATEGORIES[0]);
      setCustomCategory('');
      setDate('2026-10-05');
      setIsShared(false);
      setSplitCount(3);
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const yourShare = isValidAmount && isShared && splitCount > 0 ? parsedAmount / splitCount : parsedAmount;
  const othersShare = isValidAmount && isShared ? parsedAmount - yourShare : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Indtast venligst en beskrivelse/titel');
      return;
    }
    if (!isValidAmount) {
      setError('Indtast et gyldigt beløb (større end 0)');
      return;
    }

    const finalCategory = category === 'Anden' ? (customCategory.trim() || 'Diverse') : category;

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: finalCategory,
      date,
      is_shared: isShared,
      split_between_count: isShared ? Math.max(2, splitCount) : undefined,
      notes: notes.trim() || undefined,
      settled: initialData?.settled || false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'Rediger postering' : 'Opret ny postering'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registrer en ny udgift eller indtægt til dit SU-budget
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Toggle: Udgift vs Indtægt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  type === 'expense'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>Udgift</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setIsShared(false);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  type === 'income'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Indtægt</span>
              </button>
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Titel / Beskrivelse
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="f.eks. Kantine frokost, Pensumbog, SU, Kollegie husleje..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Beløb (DKK)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-3 pr-12 py-2 text-xs sm:text-sm font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                  kr.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dato
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kategori
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
              {STUDENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left truncate border ${
                    category === cat
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory('Anden')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left border ${
                  category === 'Anden'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                + Anden
              </button>
            </div>
            {category === 'Anden' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Skriv brugerdefineret kategori..."
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent mt-1.5"
              />
            )}
          </div>

          {/* Shared Expense Section (Only for Expenses) */}
          {type === 'expense' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Dette er en fællesudgift (skal deles med andre)
                </span>
              </label>

              {isShared && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Deles ligeligt mellem</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                        className="w-7 h-7 rounded border border-slate-200 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-semibold w-8 text-center">
                        {splitCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSplitCount(splitCount + 1)}
                        className="w-7 h-7 rounded border border-slate-200 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-500">personer</span>
                    </div>
                  </div>

                  {isValidAmount && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Din andel</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(yourShare)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[11px] block">Andre skylder dig</span>
                        <span className="font-semibold text-emerald-700">{formatCurrency(othersShare)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              {initialData ? 'Gem ændringer' : 'Gem postering'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
