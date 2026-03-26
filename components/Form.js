import { useState, useEffect } from 'react';
import { format, parse, isWeekend } from 'date-fns';
import { RefreshCw, PlusCircle, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Dropdown from './Dropdown';
import Textarea from './Textarea';
import { cn } from '../utils/cn';

export default function Form({ onEntryAdded }) {
  const [dateStr, setDateStr] = useState(''); // YYYY-MM-DD for input
  const [issues, setIssues] = useState([]);
  const [time, setTime] = useState(8);
  const [description, setDescription] = useState('');
  const [entryType, setEntryType] = useState('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = (resetDate = false) => {
    if (resetDate) setDateStr(format(new Date(), 'yyyy-MM-dd'));
    setIssues([]);
    setTime(8);
    setDescription('');
    setEntryType('Normal');
  };

  useEffect(() => {
    resetForm(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedDateForWeekend = parse(dateStr, 'yyyy-MM-dd', new Date());
    const isWeekendDay = isWeekend(parsedDateForWeekend);
    const isLeave = entryType !== 'Normal';
    const isSpecialEntry = isWeekendDay || isLeave;

    if (!isSpecialEntry) {
      if (issues.length === 0) {
        toast.error('Please select at least one issue.');
        return;
      }
      if (!description.trim()) {
        toast.error('Description is required.');
        return;
      }
    }

    setIsSubmitting(true);
    
    // Format date for Excel "Monday, 1 September, 2025"
    let formattedDateForExcel;
    try {
      const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
      formattedDateForExcel = format(parsedDate, 'EEEE, d MMMM, yyyy');
    } catch (e) {
      formattedDateForExcel = format(new Date(), 'EEEE, d MMMM, yyyy');
    }

    const payload = {
      dateStr: formattedDateForExcel,
      issues: issues.join(' | '),
      time,
      priority: 1, // forced
      description,
      entryType,
      isWeekendDay,
    };

    try {
      const res = await fetch('/api/writeToExcel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update Excel. Try again.');
      }

      toast.success('Record added to timesheet!', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      });
      
      onEntryAdded();
      resetForm(false);
      
    } catch (error) {
      toast.error(error.message || 'Failed to update Excel. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
      {/* Subtle top glare */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">New Entry</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Log your timesheet accurately</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Date Field */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm text-slate-800 dark:text-slate-200"
              required
            />
            {dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date())) && (
              <p className="text-xs text-green-500 mt-1.5 font-medium">Weekend detected! Will be logged as Holiday.</p>
            )}
          </div>

          {/* Entry Type */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              Entry Type
            </label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              disabled={dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm text-slate-800 dark:text-slate-200"
            >
              <option value="Normal">Normal Entry</option>
              <option value="Planned Leave">Planned Leave</option>
              <option value="Sick Leave">Sick Leave</option>
            </select>
          </div>

          {/* Time Slider */}
          <div className={cn("w-full transition-opacity", entryType !== 'Normal' || (dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))) ? 'opacity-40 pointer-events-none' : '')}>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time (Hrs) <span className="text-red-500">*</span>
              </label>
              <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md text-xs">{time} hours</span>
            </div>
            <div className="flex items-center gap-4 h-[44px]">
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Priority (Disabled) */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
            Priority <span className="text-xs text-slate-400 font-normal ml-1">(System default)</span>
          </label>
          <input
            type="text"
            value="1"
            disabled
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl px-4 py-2 text-sm cursor-not-allowed shadow-none"
          />
        </div>

        {/* Dropdown */}
        <div className={cn("transition-opacity", entryType !== 'Normal' || (dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))) ? 'opacity-40 pointer-events-none' : '')}>
          <Dropdown selected={issues} onChange={setIssues} />
        </div>

        {/* Textarea */}
        <div className={cn("transition-opacity", entryType !== 'Normal' || (dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))) ? 'opacity-40 pointer-events-none' : '')}>
          <Textarea 
            value={description} 
            onChange={setDescription} 
            placeholder="Detailed description of tasks completed..." 
            required={entryType === 'Normal' && !(dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date())))} 
          />
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 transition-all font-medium rounded-xl px-6 py-3 border border-transparent disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            <span>Log Timesheet</span>
          </button>
          
          <button
            type="button"
            onClick={() => resetForm(false)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition-all font-medium rounded-xl px-6 py-3 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </form>
    </div>
  );
}
