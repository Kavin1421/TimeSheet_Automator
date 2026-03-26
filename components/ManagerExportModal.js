import { useState } from 'react';
import { X, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerExportModal({ onClose }) {
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [isExporting, setIsExporting] = useState(false);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const handleExport = async (e) => {
    e.preventDefault();
    setIsExporting(true);

    try {
      const res = await fetch('/api/exportManager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: Number(month), year: Number(year) })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate billing form');
      }

      toast.success(`Billing Exporter: Save successful!\nFile stored at: ${data.path}`, { duration: 6000 });
      onClose();
    } catch (error) {
       toast.error(error.message || 'Failed to generate billing sheet');
    } finally {
       setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isExporting && onClose()}
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
          <h3 className="text-xl font-semibold flex items-center gap-2">
             <FileSpreadsheet className="w-5 h-5 text-green-500" />
             Billing Export
          </h3>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExport} className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Generate the targeted manager billing sheet containing fully mapped dates and dynamic target versus accounted hour calculations.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                Target Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                Target Year
              </label>
              <input
                type="number"
                min="2020"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isExporting}
            className="w-full mt-8 px-6 py-3 text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all shadow flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Generate XLSX Report
          </button>
        </form>
      </div>
    </div>
  );
}
