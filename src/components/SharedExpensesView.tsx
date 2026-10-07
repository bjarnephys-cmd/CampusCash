import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Receipt, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Sparkles,
  Calculator
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface SharedExpensesViewProps {
  transactions: Transaction[];
  onToggleSettled: (id: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

interface Participant {
  id: string;
  name: string;
}

export const SharedExpensesView: React.FC<SharedExpensesViewProps> = ({
  transactions,
  onToggleSettled,
  onAddTransaction,
}) => {
  // Shared transactions from current ledger
  const sharedTxList = transactions.filter((t) => t.is_shared && t.type === 'expense');

  // Aggregates
  const totalOutlay = sharedTxList.reduce((sum, t) => sum + t.amount, 0);
  const myTotalPortion = sharedTxList.reduce((sum, t) => {
    const count = t.split_between_count && t.split_between_count > 0 ? t.split_between_count : 1;
    return sum + (t.amount / count);
  }, 0);
  const totalOwedByOthers = totalOutlay - myTotalPortion;
  const settledAmount = sharedTxList
    .filter((t) => t.settled)
    .reduce((sum, t) => {
      const count = t.split_between_count && t.split_between_count > 0 ? t.split_between_count : 1;
      return sum + (t.amount - (t.amount / count));
    }, 0);
  const pendingOwedAmount = totalOwedByOthers - settledAmount;

  // --- Group Split Calculator State ---
  const [calcTitle, setCalcTitle] = useState('Fællesaftensmad i kollegiet');
  const [calcAmount, setCalcAmount] = useState<string>('240');
  const [paidBy, setPaidBy] = useState<string>('Mig');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Mig' },
    { id: '2', name: 'Sofie' },
    { id: '3', name: 'Lukas' },
    { id: '4', name: 'Freja' },
  ]);
  const [newPersonName, setNewPersonName] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Calculation results
  const parsedAmount = parseFloat(calcAmount.replace(',', '.')) || 0;
  const participantCount = participants.length > 0 ? participants.length : 1;
  const perPersonShare = parsedAmount > 0 ? parsedAmount / participantCount : 0;

  const handleAddParticipant = () => {
    if (!newPersonName.trim()) return;
    setParticipants([
      ...participants,
      { id: Date.now().toString(), name: newPersonName.trim() },
    ]);
    setNewPersonName('');
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 2) {
      alert('Der skal være mindst 2 personer til et gruppesplit.');
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  // Generate friendly message for MobilePay
  const mobilePayMessage = `Hej! 🍕 Udlæg til "${calcTitle}": Samlet beløb ${formatCurrency(parsedAmount)}, så det er ${formatCurrency(perPersonShare)} pr. person. Send gerne via MobilePay når du har tid!`;

  const copyMobilePayMessage = () => {
    navigator.clipboard.writeText(mobilePayMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Add to ledger
  const handleSaveToLedger = () => {
    if (parsedAmount <= 0) return;
    onAddTransaction({
      title: calcTitle.trim() || 'Fællesudgift',
      amount: parsedAmount,
      type: 'expense',
      category: 'Bytur/Socialt',
      date: new Date().toISOString().split('T')[0],
      is_shared: true,
      split_between_count: participantCount,
      notes: `Delt mellem: ${participants.map((p) => p.name).join(', ')}`,
      settled: false,
    });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Fællesudgifter & Gruppesplit
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hold styr på hvem der skylder hvad i studiegruppen, kollegiet eller fredagsbaren
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Samlet udlagt af dig</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {formatCurrency(totalOutlay)}
            </span>
            <div className="text-xs text-slate-500 mt-1">
              Din reelle andel:{' '}
              <strong className="font-mono text-slate-700">{formatCurrency(myTotalPortion)}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Afventer betaling (tilgodehavende)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {formatCurrency(pendingOwedAmount)}
            </span>
            <div className="text-xs text-slate-500 mt-1">
              {sharedTxList.filter((t) => !t.settled).length} udestående udlæg
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Allerede afregnet</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {formatCurrency(settledAmount)}
            </span>
            <div className="text-xs text-slate-500 mt-1">
              {sharedTxList.filter((t) => t.settled).length} afregnede poster
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Group Split Calculator (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Kvik-Split Beregner</h2>
                <p className="text-xs text-slate-500 mt-0.5">Beregn lynhurtigt hvem der skylder hvad</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {participantCount} deltagere
            </span>
          </div>

          {/* Calculator Inputs */}
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hvad handler udlægget om?
                </label>
                <input
                  type="text"
                  value={calcTitle}
                  onChange={(e) => setCalcTitle(e.target.value)}
                  placeholder="f.eks. Fredagsbar øl, Frokost, Pizza..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Samlet regning (DKK)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">
                    kr.
                  </span>
                </div>
              </div>
            </div>

            {/* Participants list */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Deltagere i regningen ({participants.length})
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {participants.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <span>{person.name}</span>
                    {participants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(person.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                        title="Fjern person"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add participant input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddParticipant();
                    }
                  }}
                  placeholder="Tilføj navn (f.eks. Mathias, Line)..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  + Tilføj
                </button>
              </div>
            </div>

            {/* Calculation Result Callout */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-950">
                  Ligeligt split pr. person:
                </span>
                <span className="text-lg font-bold font-mono text-emerald-800">
                  {formatCurrency(perPersonShare)}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                <div className="flex justify-between">
                  <span>Din andel:</span>
                  <span className="font-mono font-medium">{formatCurrency(perPersonShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>De {participants.length - 1} andre skylder dig i alt:</span>
                  <span className="font-mono font-bold">{formatCurrency(parsedAmount - perPersonShare)}</span>
                </div>
              </div>
            </div>

            {/* MobilePay Message Sharing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Klar MobilePay anmodningsbesked
                </span>
                <button
                  type="button"
                  onClick={copyMobilePayMessage}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kopieret!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier tekst</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all">
                {mobilePayMessage}
              </div>
            </div>

            {/* Add to Transactions Ledger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveToLedger}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tilføjet til dine posteringer!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tilføj som postering i CampusCash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Registered Shared Transactions (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Registrerede Fællesposter</h2>
              <p className="text-xs text-slate-500 mt-0.5">Udlæg fra dit regnskab</p>
            </div>
            <span className="text-xs font-mono text-slate-600">
              {sharedTxList.length} i alt
            </span>
          </div>

          <div className="space-y-3">
            {sharedTxList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Ingen registrerede fællesudgifter endnu.
              </div>
            ) : (
              sharedTxList.map((tx) => {
                const count = tx.split_between_count || 1;
                const myShare = tx.amount / count;
                const owedToMe = tx.amount - myShare;

                return (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      tx.settled
                        ? 'bg-slate-50/70 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{tx.title}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{tx.date}</span>
                          <span className="mx-1">·</span>
                          <span>Delt med {count} pers.</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          tx.settled
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {tx.settled ? 'Afregnet' : 'Afventer'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Samlet udlæg</span>
                        <span className="font-mono font-medium text-slate-700">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">
                          {tx.settled ? 'Modtaget beløb' : 'Du mangler at få'}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            tx.settled ? 'text-slate-500 line-through' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(owedToMe)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onToggleSettled(tx.id)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                          tx.settled
                            ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {tx.settled ? 'Marker som udestående' : 'Marker som modtaget ✓'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
