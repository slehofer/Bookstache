import React from 'react';
import { useApp } from '../context/AppContext';
import { HandHeart, CheckCircle, AlertTriangle, RotateCcw, Clock, Download } from 'lucide-react';

export default function LoansView() {
  const { loans, returnBook } = useApp();

  const handleExportLoansCSV = () => {
    if (loans.length === 0) return;

    const headers = [
      'ID výpůjčky',
      'Kniha',
      'Vypůjčitel',
      'E-mail',
      'Datum vypůjčení',
      'Termín vrácení',
      'Stav'
    ];

    const rows = loans.map((l) => [
      `"${l.id || ''}"`,
      `"${l.bookTitle || ''}"`,
      `"${l.borrowerName || ''}"`,
      `"${l.borrowerEmail || ''}"`,
      `"${l.borrowedDate || ''}"`,
      `"${l.dueDate || ''}"`,
      `"${l.returned ? 'Vráceno' : 'Aktivní'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vypujcky_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeLoans = loans.filter((l) => !l.returned);
  const returnedLoans = loans.filter((l) => l.returned);

  const isOverdue = (dueDateStr) => {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    return due < today;
  };

  return (
    <div className="space-y-6">

      {/* Loans Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-100 mb-2">
            <HandHeart className="w-4 h-4" /> Správa knižních výpůjček
          </div>
          <h2 className="text-2xl font-extrabold">Přehled aktivních i vrácených výpůjček</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Evidence výpůjček pro knihovníky s možností vrácení knihy jedním kliknutím
          </p>
        </div>

        <button
          onClick={handleExportLoansCSV}
          disabled={loans.length === 0}
          className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors shrink-0"
          title="Stáhnout výpůjčky v CSV"
        >
          <Download className="w-4 h-4 text-emerald-700" /> Exportovat výpůjčky CSV
        </button>
      </div>

      {/* Active Loans Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Aktuálně probíhající výpůjčky ({activeLoans.length})
          </h3>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-sm">Všechny vypůjčené knihy byly řádně vráceny!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-100 text-stone-600 uppercase font-bold border-b border-stone-200">
                  <th className="py-3 px-4">Kniha</th>
                  <th className="py-3 px-4">Čtenář / Vypůjčitel</th>
                  <th className="py-3 px-4">Půjčeno dne</th>
                  <th className="py-3 px-4">Termín vrácení</th>
                  <th className="py-3 px-4">Stav</th>
                  <th className="py-3 px-4">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {activeLoans.map((loan) => {
                  const overdue = isOverdue(loan.dueDate);
                  return (
                    <tr key={loan.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-stone-900 text-sm">
                        {loan.bookTitle}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-stone-800">{loan.borrowerName}</p>
                        <p className="text-[10px] text-stone-500">{loan.borrowerEmail || 'Bez e-mailu'}</p>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-mono">
                        {loan.borrowedDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {loan.dueDate}
                      </td>
                      <td className="py-3 px-4">
                        {overdue ? (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-300">
                            <AlertTriangle className="w-3.5 h-3.5" /> Po termínu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                            <Clock className="w-3.5 h-3.5" /> V pořádku
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => returnBook(loan.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1 text-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Vrátit do fondu
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Returned Loans */}
      {returnedLoans.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden opacity-90">
          <div className="p-4 bg-stone-50 border-b border-stone-200">
            <h3 className="font-bold text-stone-700 text-xs uppercase tracking-wider">
              Historie vrácených výpůjček ({returnedLoans.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-stone-200">
                {returnedLoans.map((loan) => (
                  <tr key={loan.id} className="bg-stone-50/50">
                    <td className="py-2.5 px-4 font-bold text-stone-700">{loan.bookTitle}</td>
                    <td className="py-2.5 px-4 text-stone-600">{loan.borrowerName}</td>
                    <td className="py-2.5 px-4 font-mono text-stone-500">{loan.borrowedDate}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                        Vráceno
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
